const dbModule = require("./db");
const { DICTIONARY_SEED, WORD_OF_DAY_POOL } = require("./content");
const { wordKey, nowMs } = require("./util");

function db() {
  return dbModule.db;
}

const CACHE_TTL = 365 * 86_400_000;
const inFlight = new Map();
const translationCache = new Map();

function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

async function translateToChinese(text) {
  const clean = String(text || "").trim().slice(0, 700);
  if (!clean) return "";
  const key = clean.toLowerCase();
  if (translationCache.has(key)) return translationCache.get(key);
  const lookup = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|zh-CN`;
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "DaymarkIELTS/1.0 (educational project)" },
        signal: AbortSignal.timeout(6000)
      });
      if (!response.ok) return "";
      const data = await response.json();
      const translated = String(data?.responseData?.translatedText || "").trim();
      if (!translated || !hasChinese(translated)) return "";
      return translated;
    } catch {
      return "";
    }
  })();
  translationCache.set(key, lookup);
  return lookup;
}

async function withChinese(payload) {
  if (!payload) return payload;
  if (payload.meaningZh && payload.entries?.every((entry) => entry.definitionZh)) return payload;
  const [translatedWord, translatedDefinitions] = await Promise.all([
    payload.meaningZh || translateToChinese(payload.word),
    Promise.all((payload.entries || []).map((entry) => entry.definitionZh || translateToChinese(entry.definition)))
  ]);
  const meaningZh = translatedWord || translatedDefinitions.find(Boolean) || "";
  return {
    ...payload,
    meaningZh,
    entries: (payload.entries || []).map((entry, index) => ({ ...entry, definitionZh: translatedDefinitions[index] || "" }))
  };
}

function cachePayload(key, payload) {
  db().prepare(
    "INSERT INTO dictionary_cache (word_key, payload_json, fetched_at) VALUES (?, ?, ?) ON CONFLICT(word_key) DO UPDATE SET payload_json = excluded.payload_json, fetched_at = excluded.fetched_at"
  ).run(key, JSON.stringify(payload), nowMs());
}

function seedEntry(key) {
  return DICTIONARY_SEED.get(key) || WORD_OF_DAY_POOL.find((item) => item.word.toLowerCase() === key) || null;
}

function fromSeed(key, reason = "studio") {
  const entry = seedEntry(key);
  if (!entry) return null;
  return {
    word: entry.word,
    phonetic: entry.phonetic || "",
    audio: "",
    entries: [
      {
        pos: entry.pos || "",
        definition: entry.definition,
        example: entry.example || ""
      }
    ],
    source: reason
  };
}

function normalizeDictionaryApi(data, word) {
  if (!Array.isArray(data) || !data.length) return null;
  const first = data[0];
  const phonetic =
    first.phonetic ||
    (Array.isArray(first.phonetics) ? first.phonetics.find((p) => p && p.text)?.text : "") ||
    "";
  const audio =
    (Array.isArray(first.phonetics) ? first.phonetics.find((p) => p && p.audio)?.audio : "") || "";
  const entries = [];
  for (const item of data.slice(0, 3)) {
    for (const meaning of (item.meanings || []).slice(0, 3)) {
      for (const def of (meaning.definitions || []).slice(0, 2)) {
        if (!def.definition) continue;
        entries.push({
          pos: meaning.partOfSpeech || "",
          definition: String(def.definition).slice(0, 600),
          example: String(def.example || "").slice(0, 500)
        });
        if (entries.length >= 4) break;
      }
      if (entries.length >= 4) break;
    }
    if (entries.length >= 4) break;
  }
  if (!entries.length) return null;
  return { word: first.word || word, phonetic, audio, entries, source: "free-dictionary" };
}

async function fetchDictionary(word, { lang = "en" } = {}) {
  const key = wordKey(word);
  if (!key) return null;
  const wantChinese = lang === "zh";
  const cached = db().prepare("SELECT payload_json, fetched_at FROM dictionary_cache WHERE word_key = ?").get(key);
  if (cached) {
    try {
      const payload = JSON.parse(cached.payload_json);
      if (nowMs() - Number(cached.fetched_at) < CACHE_TTL) {
        const localized = wantChinese ? await withChinese(payload) : payload;
        if (wantChinese && localized !== payload) cachePayload(key, localized);
        return { ...localized, source: localized.source === "studio" ? "studio" : "cache" };
      }
    } catch {}
  }
  const flightKey = `${key}:${wantChinese ? "zh" : "en"}`;
  if (inFlight.has(flightKey)) return inFlight.get(flightKey);

  const lookup = (async () => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`, {
        headers: { Accept: "application/json", "User-Agent": "DaymarkIELTS/1.0 (educational project)" },
        signal: AbortSignal.timeout(9000)
      });
      if (response.ok) {
        const data = await response.json();
        const payload = normalizeDictionaryApi(data, key);
        if (payload) {
          const localized = wantChinese ? await withChinese(payload) : payload;
          cachePayload(key, localized);
          return localized;
        }
      }
    } catch (error) {
      console.warn("[dictionary] lookup failed:", error?.message || error);
    }
    const fallback = fromSeed(key, "studio");
    if (fallback) {
      const localized = wantChinese ? await withChinese(fallback) : fallback;
      cachePayload(key, localized);
      return localized;
    }
    return fallback;
  })().finally(() => inFlight.delete(flightKey));

  inFlight.set(flightKey, lookup);
  return lookup;
}

function glossEntry(word) {
  const entry = seedEntry(wordKey(word));
  if (!entry) return null;
  return {
    word: entry.word,
    phonetic: entry.phonetic || "",
    pos: entry.pos || "",
    definition: entry.definition,
    example: entry.example || "",
    source: "studio"
  };
}

module.exports = { fetchDictionary, glossEntry };



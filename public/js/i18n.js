const KEY = "daymark-language";
const LANGS = new Set(["en", "zh"]);

export function getLang() {
  try {
    const saved = localStorage.getItem(KEY);
    return LANGS.has(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

export function setLang(lang) {
  const next = LANGS.has(lang) ? lang : "en";
  try {
    localStorage.setItem(KEY, next);
  } catch {}
  document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  window.dispatchEvent(new CustomEvent("daymark:language", { detail: { lang: next } }));
  return next;
}

export function toggleLang() {
  return setLang(getLang() === "zh" ? "en" : "zh");
}

export function L(en, zh) {
  return getLang() === "zh" ? zh : en;
}

export function langToggleHTML() {
  return `<button class="lang-toggle" type="button" data-toggle-language aria-label="${L("Switch to Chinese", "Switch to English")}">${L("中文", "EN")}</button>`;
}

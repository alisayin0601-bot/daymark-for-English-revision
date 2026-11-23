import { api } from "../api.js";
import { openSaveReadingModal } from "./reading-books.js";
import { L, getLang } from "../i18n.js";
import { aiBadge, sourceBadge, pageBack } from "../components.js";
import { icon } from "../icons.js";
import { speak } from "../speech.js";
import { store, refreshSummary, updateUser } from "../store.js";
import {
  escapeHTML,
  escapeAttr,
  formatDate,
  levelLabel,
  openModal,
  setButtonLoading,
  toast,
  scrollToId,
  clamp
} from "../ui.js";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];
const GENERATOR_STYLES = [
  { value: "news", label: "News", hint: "A story with a hook" },
  { value: "academic article", label: "Academic", hint: "Evidence and nuance" },
  { value: "story", label: "Story", hint: "Character and inference" },
  { value: "editorial", label: "Editorial", hint: "A considered argument" }
];
const TOPIC_PRESETS = ["Cities & nature", "Technology & attention", "Science & climate", "Language & culture", "Work & everyday life"];

function paragraphHTML(paragraph) {
  const tokens = String(paragraph).split(/([A-Za-z]+(?:[’][A-Za-z]+)*(?:-[A-Za-z]+)*)/g);
  return tokens
    .map((token) => {
      if (/^[A-Za-z][A-Za-z’-]*$/.test(token)) {
        return `<button type="button" class="tap-word" data-word="${escapeAttr(token)}" aria-label="Look up ${escapeAttr(token)}">${escapeHTML(token)}</button>`;
      }
      return escapeHTML(token);
    })
    .join("");
}

function optionsHTML(question, index) {
  return question.options
    .map(
      (option, optionIndex) => `<label class="choice">
        <input type="radio" name="reading-q${index}" value="${optionIndex}">
        <span class="choice__marker">${OPTION_LETTERS[optionIndex]}</span>
        <span class="choice__text">${escapeHTML(option)}</span>
      </label>`
    )
    .join("");
}

function questionsFormHTML(passage, lastAttempt) {
  return `<div class="question-panel" id="reading-questions">
    <div class="question-panel__head">
      <div>
        <p class="eyebrow">Optional comprehension check</p>
        <h2>Comprehension questions</h2>
        <p>${passage.questions.length} questions · answers are explained after you check.</p>
      </div>
      ${lastAttempt ? `<div class="last-attempt">${icon("rotate", 15)} Last try <strong>${lastAttempt.score}/${lastAttempt.total}</strong><span>${formatDate(lastAttempt.createdAt)}</span></div>` : ""}
    </div>
    <div class="question-list">
      ${passage.questions
        .map(
          (question, index) => `<fieldset class="quiz-question">
            <legend><span class="quiz-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHTML(question.question)}</span></legend>
            <div class="choice-list">${optionsHTML(question, index)}</div>
          </fieldset>`
        )
        .join("")}
    </div>
    <div class="question-submit-row">
      <p>${icon("info", 14)} Wrong answers are saved to your Mistake Book.</p>
      <button class="btn btn--primary" type="button" id="submit-reading">${lastAttempt ? "Try again" : "Check my understanding"} ${icon("arrowRight", 16)}</button>
    </div>
  </div>`;
}

function resultsHTML(score, total, results) {
  const percent = Math.round((score / total) * 100);
  const tone = percent >= 75 ? "good" : percent >= 50 ? "mid" : "low";
  return `<div class="reading-results" id="reading-results">
    <div class="result-banner result-banner--${tone}">
      <div class="result-banner__score"><strong>${score}</strong><span>/ ${total}</span></div>
      <div class="result-banner__copy">
        <p class="eyebrow">Comprehension check</p>
        <h2>${percent >= 75 ? "Good result." : percent >= 50 ? "Partly there." : "Worth reviewing."}</h2>
        <p>${score === total ? "All answers correct. Try a new passage or a higher level." : "Read each explanation and review the question wording."}</p>
      </div>
      <div class="result-banner__actions">
        <a class="btn btn--cream btn--small" href="/app/mistakes" data-link>Open Mistake Book ${icon("arrowRight", 14)}</a>
        <button class="btn btn--ghost btn--small result-retry" type="button" id="retry-questions">Try again ${icon("rotate", 14)}</button>
      </div>
    </div>
    <div class="result-list">
      ${results
        .map((result, index) => `<article class="result-question ${result.correct ? "is-correct" : "is-wrong"}">
          <div class="result-question__head">
            <span class="result-question__status">${icon(result.correct ? "check" : "x", 15)}</span>
            <span class="result-question__number">Question ${index + 1}</span>
            <span class="result-question__tag">${result.correct ? "Correct" : "Review this"}</span>
          </div>
          <h3>${escapeHTML(result.question)}</h3>
          <div class="result-answer-row">
            <span class="result-answer ${result.correct ? "is-correct" : "is-wrong"}"><small>Your answer</small>${escapeHTML(result.options[result.chosen] || "No answer")}</span>
            ${result.correct ? "" : `<span class="result-answer is-correct"><small>Correct answer</small>${escapeHTML(result.options[result.correctIndex])}</span>`}
          </div>
          <p class="result-explanation">${escapeHTML(result.explanation)}</p>
        </article>`)
        .join("")}
    </div>
    <div class="result-footer">
      <button class="btn btn--secondary" type="button" id="retry-questions-bottom">${icon("rotate", 15)} Try the questions again</button>
      <button class="btn btn--ghost" type="button" data-open-generator>${icon("rotate", 15)} Read something new</button>
    </div>
  </div>`;
}

function wordPanelDefault() {
  return `<div class="word-panel__empty">
    <div class="word-panel__orb">${icon("leaf", 23)}</div>
    <p class="eyebrow">Dictionary</p>
    <h2>Tap a word</h2>
    <p>Select any word in the passage to see its meaning, pronunciation and an example.</p>
    <div class="word-panel__hint">${icon("volume", 14)} Save a word to review it in Vocabulary.</div>
  </div>`;
}

function wordPanelWord(state) {
  if (state.loading) {
    return `<div class="word-panel__loading"><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--title"></div><div class="skeleton-line"></div><div class="skeleton-line skeleton-line--medium"></div><div class="loading-inline"><span class="spinner"></span> Looking it up…</div></div>`;
  }
  if (state.error) {
    return `<div class="word-panel__error">
      <span class="word-panel__word-label">${escapeHTML(state.word)}</span>
      <h2>No definition yet.</h2>
      <p>${escapeHTML(state.error)}</p>
      <div class="word-panel__actions">
        <button class="btn btn--primary btn--small" type="button" data-manual-word>${icon("plus", 14)} Add my own meaning</button>
        <button class="btn btn--ghost btn--small" type="button" data-clear-word>Close</button>
      </div>
    </div>`;
  }
  const chinese = getLang() === "zh";
  const senses = state.entries
    .slice(0, 2)
    .map(
      (entry) => `<div class="word-sense">
        ${entry.pos ? `<span class="word-sense__pos">${escapeHTML(entry.pos)}</span>` : ""}
        <p>${escapeHTML(chinese && entry.definitionZh ? entry.definitionZh : entry.definition)}</p>
        ${entry.example ? `<blockquote>“${escapeHTML(entry.example)}”</blockquote>` : ""}
      </div>`
    )
    .join("");
  return `<div class="word-panel__word">
    <div class="word-panel__topline"><span class="eyebrow">Dictionary</span><button class="icon-button" type="button" data-clear-word aria-label="Close word">${icon("x", 16)}</button></div>
    <div class="word-heading"><h2>${escapeHTML(state.displayWord)}</h2><button class="icon-button icon-button--bordered" type="button" data-say-word aria-label="Hear pronunciation">${icon("volume", 17)}</button></div>
    <div class="word-pronunciation">${escapeHTML(state.phonetic || "pronunciation unavailable")}</div>
    ${chinese && state.meaningZh ? `<div class="word-meaning-zh">${escapeHTML(state.meaningZh)}</div>` : ""}
    <div class="word-senses">${senses || `<p class="word-panel__empty-sense">${escapeHTML(state.error || "No definition available.")}</p>`}</div>
    <button class="btn ${state.saved ? "btn--ghost" : "btn--primary"} btn--full word-save" type="button" data-save-word ${state.saved ? "disabled" : ""}>
      ${state.saved ? `${icon("check", 15)} Saved to your corner` : `${icon("plus", 15)} Save to Vocabulary`}
    </button>
    <div class="word-source">${state.source === "studio" ? icon("feather", 13) + " Daymark glossary" : icon("book", 13) + " Free Dictionary"}</div>
  </div>`;
}

function articleHTML(state) {
  const passage = state.passage;
  return `<article class="passage-card" id="passage-card">
    <div class="reading-progress" aria-hidden="true"><span class="reading-progress__bar"></span></div>
    <div class="passage-meta">
      <span>${state.activeArticle ? L("From your reading book", "来自阅读书") : passage.isDaily ? L("Daily edition", "每日文章") : L("From your library", "来自收藏")}</span>
      <span class="dot-separator">${escapeHTML(state.activeArticle ? L("Custom article", "自建文章") : passage.style)}</span>
      <span class="dot-separator">${escapeHTML(passage.topic || "Reading practice")}</span>
      <span class="passage-meta__right">${escapeHTML(levelLabel(passage.level))}</span>
    </div>
    <h1 class="passage-title">${escapeHTML(passage.title)}</h1>
    ${passage.subtitle ? `<p class="passage-deck">${escapeHTML(passage.subtitle)}</p>` : ""}
    <div class="passage-byline">
      <span>${icon("clock", 14)} ${passage.minutes} min</span>
      <span>${icon("bookOpen", 14)} ${passage.wordCount} words</span>
      <span class="passage-byline__source">${sourceBadge(passage.source)}</span>
      <span class="passage-byline__hint">${icon("cursor", 14)} Tap any word</span>
    </div>
    <div class="passage-divider"><span></span>${icon("feather", 15)}<span></span></div>
    <div class="passage-body">
      ${passage.paragraphs.map((paragraph, index) => `<p class="passage-paragraph${index === 0 ? " is-opening" : ""}">${paragraphHTML(paragraph)}</p>`).join("")}
    </div>
    <div class="passage-actions">
      ${passage.questions?.length ? `<button class="btn btn--primary" type="button" id="jump-to-questions">Questions ${icon("arrowRight", 15)}</button>` : ""}
      <button class="btn btn--secondary" type="button" id="mark-reading-read" ${state.readToday ? "disabled" : ""}>${state.readToday ? `${icon("check", 14)} Marked read` : `${icon("bookOpen", 14)} Mark as read`}</button>
      <button class="btn btn--ghost" type="button" id="save-reading-to-book">${icon("bookmark", 14)} Save to book</button>
    </div>
    ${passage.questions?.length ? questionsFormHTML(passage, state.lastAttempt) : ""}
  </article>`;
}

function readingPageHTML(state) {
  const passage = state.passage;
  const level = state.selectedLevel || store.user.level;
  return `<div class="page-enter">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">Reading · ${escapeHTML(levelLabel(level))}</p>
        <h1>Reading</h1>
        <p>Read today’s passage, tap any word for a definition, then check your understanding.</p>
      </div>
      <div class="page-heading__actions">
        <label class="level-select"><span>Level</span><select id="reader-level" aria-label="Reading level">${["5-6", "6-7", "7-8"].map((lv) => `<option value="${lv}" ${lv === level ? "selected" : ""}>${escapeHTML(levelLabel(lv))}</option>`).join("")}</select></label>
        <a class="btn btn--secondary btn--small" href="/app/reading-books" data-link>${icon("bookOpen", 15)} My books</a>
        <button class="btn btn--secondary btn--small" type="button" id="open-library">${icon("library", 15)} Library</button>
        <button class="btn btn--primary btn--small" type="button" id="open-generator">${icon("rotate", 15)} New passage</button>
      </div>
    </header>
    ${state.activeArticle ? `<div class="active-reading-banner"><span>${icon("bookOpen", 16)} ${L("Reading home article:", "阅读首页文章：")} <strong>${escapeHTML(state.activeArticle.title)}</strong></span><button class="btn btn--ghost btn--small" type="button" id="clear-active-reading">${L("Use daily passage", "换回每日文章")}</button></div>` : ""}
    <div id="reading-flash"></div>
    <div class="reader-layout">
      ${articleHTML(state)}
      <aside class="reader-rail">
        <div class="word-panel" id="word-panel" aria-live="polite">${wordPanelDefault()}</div>
        <div class="reading-note">
          <span class="reading-note__icon">${icon("sun", 18)}</span>
          <p class="eyebrow">A slower note</p>
          <p>Read once for the shape of the piece. Read the second time for what the writer is doing — the contrast, the example, the quiet claim.</p>
          <button class="text-link" type="button" data-open-generator>Generate on your own topic ${icon("arrowRight", 13)}</button>
        </div>
      </aside>
    </div>
  </div>`;
}

function generatorContent() {
  return `<form id="generator-form" class="generator-form" novalidate>
    ${!store.aiConfigured ? `<div class="notice notice--info" style="margin-bottom:18px">${icon("info", 17)}<div class="notice__body"><p><strong>AI is off.</strong> Without a Gemini key, Daymark chooses a passage from its built-in library. It may not match your exact topic. Add a free key in Settings for made-to-order practice.</p></div></div>` : ""}
    <div class="form-grid form-grid--two">
      <div class="field">
        <label class="field__label" for="gen-topic">Topic or angle</label>
        <input class="input" id="gen-topic" placeholder="e.g. the future of quiet cities" maxlength="80">
        <div class="preset-chips">${TOPIC_PRESETS.map((topic) => `<button type="button" class="preset-chip" data-topic="${escapeAttr(topic)}">${escapeHTML(topic)}</button>`).join("")}</div>
      </div>
      <div class="field">
        <label class="field__label" for="gen-level">Reading level</label>
        <select class="select" id="gen-level">${["5-6", "6-7", "7-8"].map((level) => `<option value="${level}" ${level === (store.user?.level || "6-7") ? "selected" : ""}>${escapeHTML(levelLabel(level))}</option>`).join("")}</select>
        <span class="field__hint">Choose the band you want the language to sit around.</span>
      </div>
    </div>
    <div class="field">
      <span class="field__label">Style</span>
      <div class="style-options">
        ${GENERATOR_STYLES.map((style, index) => `<label class="style-option"><input type="radio" name="gen-style" value="${style.value}" ${index === 0 ? "checked" : ""}><span class="style-option__body"><strong>${style.label}</strong><small>${style.hint}</small></span></label>`).join("")}
      </div>
    </div>
    <div class="field">
      <span class="field__label">Length</span>
      <div class="segmented length-options" role="radiogroup" aria-label="Passage length">
        <button type="button" data-length="short" role="radio" aria-checked="false">Short · 260</button>
        <button type="button" class="is-active" data-length="medium" role="radio" aria-checked="true">Medium · 380</button>
        <button type="button" data-length="long" role="radio" aria-checked="false">Long · 520</button>
      </div>
    </div>
    <div class="generator-footer">
      <p>${icon("clock", 14)} Usually 5–15 seconds</p>
      <button class="btn btn--primary" type="submit" id="generate-submit">${icon("rotate", 16)} ${store.aiConfigured ? "Create the passage" : "Choose a built-in passage"}</button>
    </div>
  </form>`;
}

function openGenerator() {
  openModal({
    title: "A passage, made for the moment.",
    subtitle: "Choose a brief. The daily edition is always free; this is for when you want to wander.",
    content: generatorContent(),
    size: "lg",
    onMount: ({ panel, close }) => {
      let length = "medium";
      panel.querySelectorAll("[data-topic]").forEach((button) => {
        button.addEventListener("click", () => {
          panel.querySelector("#gen-topic").value = button.dataset.topic;
          panel.querySelectorAll("[data-topic]").forEach((each) => each.classList.remove("is-active"));
          button.classList.add("is-active");
        });
      });
      panel.querySelectorAll("[data-length]").forEach((button) => {
        button.addEventListener("click", () => {
          length = button.dataset.length;
          panel.querySelectorAll("[data-length]").forEach((each) => {
            const active = each === button;
            each.classList.toggle("is-active", active);
            each.setAttribute("aria-checked", String(active));
          });
        });
      });
      const form = panel.querySelector("#generator-form");
      const submit = panel.querySelector("#generate-submit");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
          topic: form.querySelector("#gen-topic").value.trim() || "Everyday life",
          level: form.querySelector("#gen-level").value,
          style: form.querySelector('input[name="gen-style"]:checked')?.value || "editorial",
          length
        };
        setButtonLoading(submit, true, "Writing the page…");
        try {
          const data = await api.post("/api/reading/generate", payload);
          close();
          loadPassage(data.passage, null, { toastMessage: "A fresh page is ready." });
          if (data.fallbackReason) showFlash(data.fallbackReason, "info");
        } catch (error) {
          setButtonLoading(submit, false);
          const errorBox = document.createElement("div");
          errorBox.className = "form-error";
          errorBox.innerHTML = `${icon("alert", 16)}<span>${escapeHTML(error.message)}</span>`;
          submit.before(errorBox);
        }
      });
    }
  });
}

function openLibrary() {
  const controller = new AbortController();
  const modal = openModal({
    title: "Your reading shelf.",
    subtitle: "Daily editions and passages you have made. Open one where you left off.",
    size: "lg",
    content: `<div class="loading-inline" style="padding:30px 0"><span class="spinner"></span> Fetching your pages…</div>`,
    onClose: () => controller.abort()
  });
  if (!modal) return;
  const { panel, close } = modal;
  api
    .get("/api/reading/library", { signal: controller.signal })
    .then((data) => {
      if (!data.passages.length) {
        panel.querySelector(".modal-body").innerHTML = `<p class="muted">No saved pages yet. Begin with today’s edition.</p>`;
        return;
      }
      panel.querySelector(".modal-body").innerHTML = `<div class="library-list">
        ${data.passages
          .map(
            (passage) => `<button class="library-item" type="button" data-passage-id="${passage.id}">
              <span class="library-item__badge">${passage.isDaily ? icon("sun", 15) : icon("feather", 15)}</span>
              <span class="library-item__copy">
                <span class="library-item__meta">${escapeHTML(levelLabel(passage.level))} · ${escapeHTML(passage.style)} ${passage.isDaily ? "· Daily edition" : ""}</span>
                <strong>${escapeHTML(passage.title)}</strong>
                <small>${escapeHTML(passage.subtitle || passage.topic || "")}</small>
              </span>
              <span class="library-item__right"><small>${passage.lastAttempt ? `${passage.lastAttempt.score}/${passage.lastAttempt.total}` : `${passage.minutes} min`}</small>${icon("chevronRight", 16)}</span>
            </button>`
          )
          .join("")}
      </div>`;
      panel.querySelectorAll("[data-passage-id]").forEach((button) => {
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            const data = await api.get(`/api/reading/${button.dataset.passageId}`);
            controller.abort();
            close();
            loadPassage(data.passage, data.lastAttempt);
          } catch (error) {
            button.disabled = false;
            if (error.name !== "AbortError") toast(error.message, { type: "error" });
          }
        });
      });
    })
    .catch((error) => {
      if (error.name === "AbortError") return;
      panel.querySelector(".modal-body").innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<p>${escapeHTML(error.message)}</p></div>`;
    });
}

function manualWordModal(initialWord, onSaved) {
  openModal({
    title: "Keep the word your way.",
    subtitle: "The free dictionary did not have a definition. Write the meaning that will help future-you.",
    size: "sm",
    content: `<form id="manual-word-form" class="auth-form" novalidate>
      <div class="field"><label class="field__label" for="manual-word">Word</label><input class="input" id="manual-word" value="${escapeAttr(initialWord)}" maxlength="60" required></div>
      <div class="field"><label class="field__label" for="manual-definition">Meaning</label><textarea class="textarea" id="manual-definition" rows="3" placeholder="A short definition in your own words…" required></textarea></div>
      <div class="field"><label class="field__label" for="manual-example">Example <span class="field__hint">Optional</span></label><input class="input" id="manual-example" placeholder="Use it in a sentence you might say" maxlength="500"></div>
      <button class="btn btn--primary btn--full" type="submit" style="margin-top:18px">${icon("plus", 15)} Save to Vocabulary</button>
    </form>`,
    onMount: ({ panel, close }) => {
      const form = panel.querySelector("#manual-word-form");
      const submit = form.querySelector('button[type="submit"]');
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const word = form.querySelector("#manual-word").value.trim();
        const definition = form.querySelector("#manual-definition").value.trim();
        const example = form.querySelector("#manual-example").value.trim();
        if (!word || !definition) {
          toast("Add both the word and its meaning.", { type: "error" });
          return;
        }
        setButtonLoading(submit, true, "Saving…");
        try {
          await api.post("/api/vocabulary", { word, definition, example, source: "reading" });
          close();
          toast("Word saved to your corner.", { type: "success" });
          if (typeof onSaved === "function") onSaved({ word, definition, example });
        } catch (error) {
          setButtonLoading(submit, false);
          toast(error.message, { type: "error" });
        }
      });
    }
  });
}

function showFlash(message, tone = "info") {
  const flash = document.getElementById("reading-flash");
  if (!flash) return;
  flash.innerHTML = `<div class="notice notice--${tone}" style="margin-bottom:16px">${icon(tone === "warning" ? "alert" : "info", 17)}<div class="notice__body"><p>${escapeHTML(message)}</p></div></div>`;
  flash.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export async function renderReading(root, { signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  let state = {
    passage: null,
    lastAttempt: null,
    selectedLevel: store.user?.level || "6-7",
    readToday: Boolean(store.summary?.today?.types?.includes("reading")),
    word: null,
    results: null,
    activeArticle: null
  };
  let dictionaryState = null;

  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-card" style="margin-top:30px;min-height:480px"></div></div>`;

  try {
    const data = await api.get("/api/reading/daily", { signal: controller.signal });
    state.passage = data.passage;
    state.lastAttempt = data.lastAttempt;
    state.selectedLevel = data.level || state.selectedLevel;
    state.activeArticle = data.activeArticle || null;
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">The page is missing</p><h1>We couldn’t fetch today’s passage.</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" type="button" data-retry-reading>Try again ${icon("rotate", 16)}</button></div>`;
    root.querySelector("[data-retry-reading]")?.addEventListener("click", () => renderReading(root, { signal }));
    return () => {};
  }

  function paint() {
    if (!state.passage) return;
    state.passage.lastAttempt = state.lastAttempt;
    root.innerHTML = readingPageHTML(state);
    renderWordPanel();
    updateProgress();
  }

  function updateProgress() {
    const card = root.querySelector("#passage-card");
    const bar = root.querySelector(".reading-progress__bar");
    if (!card || !bar) return;
    const rect = card.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.4;
    const progress = clamp((-rect.top + 120) / Math.max(1, total), 0, 1);
    bar.style.width = `${Math.round(progress * 100)}%`;
  }

  function renderWordPanel() {
    const panel = root.querySelector("#word-panel");
    if (!panel) return;
    panel.classList.toggle("is-populated", Boolean(dictionaryState));
    panel.innerHTML = dictionaryState ? wordPanelWord(dictionaryState) : wordPanelDefault();
  }

  async function lookUpWord(rawWord) {
    const token = String(rawWord || "").replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
    if (!token) return;
    root.querySelectorAll(".tap-word.is-active").forEach((word) => word.classList.remove("is-active"));
    root.querySelectorAll(`.tap-word[data-word="${CSS.escape(token)}"]`).forEach((word) => word.classList.add("is-active"));
    const wantChinese = getLang() === "zh";
    const glossary = state.passage.glossary.find((entry) => entry.word.toLowerCase() === token.toLowerCase());
    if (glossary && !wantChinese) {
      dictionaryState = {
        word: token,
        displayWord: glossary.word,
        phonetic: glossary.phonetic,
        entries: [{ pos: glossary.pos, definition: glossary.definition, example: glossary.example }],
        source: "studio",
        saved: false,
        loading: false,
        error: null
      };
      renderWordPanel();
      return;
    }
    dictionaryState = {
      word: token,
      displayWord: token,
      loading: true,
      source: "dictionary",
      saved: false,
      entries: [],
      phonetic: ""
    };
    renderWordPanel();
    try {
      const data = await api.get(`/api/dictionary?word=${encodeURIComponent(token.toLowerCase())}&lang=${wantChinese ? "zh" : "en"}`, { signal: controller.signal });
      if (!dictionaryState || dictionaryState.word !== token) return;
      dictionaryState = {
        word: token,
        displayWord: data.entry.word || token,
        phonetic: data.entry.phonetic || "",
        meaningZh: data.entry.meaningZh || "",
        entries: data.entry.entries || [],
        source: data.entry.source === "free-dictionary" || data.entry.source === "cache" ? "dictionary" : "studio",
        saved: Boolean(data.saved),
        loading: false,
        error: null
      };
      renderWordPanel();
    } catch (error) {
      if (error.name === "AbortError") return;
      dictionaryState = {
        word: token,
        displayWord: token,
        loading: false,
        error: error.status === 404 ? "The free dictionary doesn’t have an entry for this one. You can still keep it with your own meaning." : error.message,
        source: "dictionary",
        saved: false,
        entries: []
      };
      renderWordPanel();
    }
  }

  async function saveWord() {
    if (!dictionaryState || dictionaryState.loading) return;
    const primary = dictionaryState.entries[0] || {};
    try {
      const data = await api.post("/api/vocabulary", {
        word: dictionaryState.displayWord,
        phonetic: dictionaryState.phonetic,
        partOfSpeech: primary.pos,
        definition: primary.definition,
        meaningZh: dictionaryState.meaningZh || primary.definitionZh || primary.definition,
        example: primary.example,
        source: "reading"
      });
      dictionaryState.saved = true;
      renderWordPanel();
      if (data.duplicate) toast("That word is already waiting in your Vocabulary Corner.", { type: "default" });
      else toast("Saved. It will return tomorrow, just before it fades.", { type: "success" });
    } catch (error) {
      toast(error.message, { type: "error" });
    }
  }

  function submitReading() {
    const answers = [];
    let complete = true;
    state.passage.questions.forEach((_, index) => {
      const selected = root.querySelector(`input[name="reading-q${index}"]:checked`);
      if (!selected) complete = false;
      answers.push(selected ? Number(selected.value) : null);
    });
    if (!complete) {
      toast("Answer each question before checking. A guess is welcome.", { type: "error" });
      return;
    }
    const button = root.querySelector("#submit-reading");
    setButtonLoading(button, true, "Checking answers…");
    api
      .post(`/api/reading/${state.passage.id}/submit`, { answers })
      .then((data) => {
        state.lastAttempt = { score: data.score, total: data.total, createdAt: Date.now() };
        state.readToday = true;
        const readButton = root.querySelector("#mark-reading-read");
        if (readButton) {
          readButton.disabled = true;
          readButton.innerHTML = `${icon("check", 15)} Read today`;
        }
        const questionsPanel = root.querySelector(".question-panel");
        if (questionsPanel) {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = resultsHTML(data.score, data.total, data.results);
          questionsPanel.replaceWith(wrapper.firstElementChild);
        }
        refreshSummary();
        const results = root.querySelector("#reading-results");
        if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch((error) => {
        setButtonLoading(button, false);
        toast(error.message, { type: "error" });
      });
  }

  function renderQuestionsAgain() {
    const results = root.querySelector("#reading-results");
    if (!results) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = questionsFormHTML(state.passage, state.lastAttempt);
    results.replaceWith(wrapper.firstElementChild);
    scrollToId("reading-questions");
  }

  async function loadPassage(passage, lastAttempt = null, { toastMessage = "" } = {}) {
    state.passage = passage;
    state.lastAttempt = lastAttempt;
    state.results = null;
    dictionaryState = null;
    paint();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (toastMessage) toast(toastMessage, { type: "success" });
  }

  paint();

  const clickHandler = async (event) => {
    if (event.target.closest("#clear-active-reading")) {
      try {
        await api.post("/api/reading/clear-active", {});
        const data = await api.get(`/api/reading/daily?level=${encodeURIComponent(state.selectedLevel)}`, { signal: controller.signal });
        state.passage = data.passage;
        state.lastAttempt = data.lastAttempt;
        state.activeArticle = null;
        dictionaryState = null;
        paint();
        toast(L("Showing the daily passage again.", "已换回每日文章。"), { type: "success" });
      } catch (error) {
        toast(error.message, { type: "error" });
      }
      return;
    }
    const word = event.target.closest(".tap-word");
    if (word && root.contains(word)) {
      event.preventDefault();
      lookUpWord(word.dataset.word);
      return;
    }
    if (event.target.closest("#submit-reading")) {
      submitReading();
      return;
    }
    if (event.target.closest("#save-reading-to-book")) {
      openSaveReadingModal(state.passage).catch?.((error) => toast(error.message, { type: "error" }));
      return;
    }
    if (event.target.closest("#mark-reading-read")) {
      const button = event.target.closest("#mark-reading-read");
      setButtonLoading(button, true, "Marking…");
      try {
        await api.post(`/api/reading/${state.passage.id}/complete`, {});
        state.readToday = true;
        button.disabled = true;
        button.innerHTML = `${icon("check", 15)} Read today`;
        refreshSummary();
        toast("Reading marked as complete.", { type: "success" });
      } catch (error) {
        setButtonLoading(button, false);
        toast(error.message, { type: "error" });
      }
      return;
    }
    if (event.target.closest("#retry-questions") || event.target.closest("#retry-questions-bottom")) {
      renderQuestionsAgain();
      return;
    }
    if (event.target.closest("#jump-to-questions")) {
      scrollToId("reading-questions");
      return;
    }
    if (event.target.closest("#open-generator") || event.target.closest("[data-open-generator]")) {
      openGenerator();
      return;
    }
    if (event.target.closest("#open-library")) {
      openLibrary();
      return;
    }
    if (event.target.closest("[data-clear-word]")) {
      dictionaryState = null;
      root.querySelectorAll(".tap-word.is-active").forEach((wordEl) => wordEl.classList.remove("is-active"));
      renderWordPanel();
      return;
    }
    if (event.target.closest("[data-say-word]") && dictionaryState) {
      speak(dictionaryState.displayWord, { accent: "British", rate: 0.8 });
      return;
    }
    if (event.target.closest("[data-save-word]")) {
      saveWord();
      return;
    }
    if (event.target.closest("[data-manual-word]") && dictionaryState) {
      const currentWord = dictionaryState.word;
      manualWordModal(currentWord, ({ word, definition, example }) => {
        dictionaryState = {
          word: currentWord,
          displayWord: word,
          phonetic: "",
          entries: [{ pos: "", definition, example }],
          source: "studio",
          saved: true,
          loading: false,
          error: null
        };
        renderWordPanel();
      });
      return;
    }
    const retry = event.target.closest("[data-retry-reading]");
    if (retry) renderReading(root, { signal });
  };

  root.addEventListener("click", clickHandler, { signal: controller.signal });

  async function changeLevel(select) {
    const level = select.value;
    if (level === state.selectedLevel) return;
    select.disabled = true;
    try {
      const updated = await api.patch("/api/me", { level });
      updateUser(updated.user);
      state.selectedLevel = level;
      const data = await api.get(`/api/reading/daily?level=${encodeURIComponent(level)}`, { signal: controller.signal });
      state.passage = data.passage;
      state.lastAttempt = data.lastAttempt;
      state.activeArticle = data.activeArticle || null;
      dictionaryState = null;
      paint();
      toast(`Daily passages will now arrive at ${levelLabel(level)}.`, { type: "success" });
    } catch (error) {
      select.value = state.selectedLevel;
      select.disabled = false;
      toast(error.message, { type: "error" });
    }
  }

  root.addEventListener(
    "change",
    (event) => {
      if (event.target.matches('input[type="radio"][name^="reading-q"]')) {
        const question = event.target.closest(".quiz-question");
        question?.querySelectorAll(".choice").forEach((choice) => {
          choice.classList.toggle("is-selected", Boolean(choice.querySelector("input:checked")));
        });
        return;
      }
      if (event.target.id === "reader-level") changeLevel(event.target);
    },
    { signal: controller.signal }
  );

  const progressHandler = () => updateProgress();
  window.addEventListener("scroll", progressHandler, { passive: true, signal: controller.signal });
  updateProgress();

  return () => {
    controller.abort();
    if (signal) signal.removeEventListener("abort", abort);
  };
}


import { api } from "../api.js";
import { icon } from "../icons.js";
import { L } from "../i18n.js";
import { speak } from "../speech.js";
import { refreshSummary } from "../store.js";
import { escapeHTML, toast } from "../ui.js";

function speakWord(word) {
  speak(word.word, { accent: "British", rate: 0.8 });
}

function speakExample(word) {
  if (word.exampleEn) speak(word.exampleEn, { accent: "British", rate: 0.86 });
}

export async function renderWordStudy(root, { signal, slug, section }) {
  const bookId = Number(slug);
  const params = new URLSearchParams(window.location.search);
  const requestedCount = Math.min(100, Math.max(1, Math.floor(Number(params.get("count")) || 10)));
  const spellingMode = ["none", "zh", "listen", "both"].includes(params.get("spelling")) ? params.get("spelling") : "none";
  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-card" style="margin-top:24px;min-height:320px"></div></div>`;
  let session;
  try {
    session = await api.post(`/api/word-books/${bookId}/session`, { count: requestedCount }, { signal });
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">${L("Could not start", "无法开始")}</p><h1>${L("This study session is unavailable.", "这次学习暂时打不开。")}</h1><p>${escapeHTML(error.message)}</p><a class="btn btn--primary" href="/app/vocabulary" data-link>${L("Back to words", "返回单词书")}</a></div>`;
    return () => {};
  }
  const words = session.words || [];
  if (!words.length) {
    root.innerHTML = `<div class="empty-state"><div class="empty-state__art">${icon("bookOpen", 26)}</div><h3>${L("No words to study", "没有可学习的单词")}</h3><p>${L("Add words to this book first.", "请先给这本词书添加单词。")}</p><a class="btn btn--primary btn--small" href="/app/vocabulary" data-link>${L("Back to words", "返回单词书")}</a></div>`;
    return () => {};
  }
  const state = { learnIndex: 0, quizQueue: [], quizIndex: 0, quizMastered: new Set(), quizAttempted: new Set(), quizFirstTry: 0, spellQueue: [], spellIndex: 0, spellCorrect: 0, answered: false };
  if (spellingMode !== "none") {
    state.spellQueue = spellingMode === "both"
      ? words.map((word) => ({ word, mode: "zh" })).concat(words.map((word) => ({ word, mode: "listen" })))
      : words.map((word) => ({ word, mode: spellingMode }));
  }
  root.innerHTML = `<div class="word-study-page"></div>`;
  const page = root.querySelector(".word-study-page");

  function shell(inner, title, subtitle, current = 0, total = words.length) {
    page.innerHTML = `<header class="word-study-head">
      <a class="back-link" href="/app/vocabulary" data-link>${icon("arrowLeft", 15)} ${L("All words", "返回单词书")}</a>
      <div class="word-study-title"><div><p class="eyebrow">${L("Word session", "单词学习")}</p><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div><span class="word-study-count">${Math.min(current + 1, total)} / ${total}</span></div>
      <div class="word-study-progress"><span style="width:${Math.round((current / Math.max(1, total)) * 100)}%"></span></div>
    </header>
    <main class="word-study-body">${inner}</main>`;
  }

  function paintLearn() {
    const word = words[state.learnIndex];
    if (!word) return startQuiz();
    shell(`<section class="word-learn-panel">
      <div class="word-learn-panel__top"><span>${word.isNew ? L("New word", "新单词") : L("Review", "复习")}</span><span>${state.learnIndex + 1} / ${words.length}</span></div>
      <div class="word-learn-panel__word"><h2>${escapeHTML(word.word)}</h2><button class="icon-button icon-button--bordered" type="button" id="study-say-word">${icon("volume", 20)}</button></div>
      <p class="word-learn-panel__phonetic">${escapeHTML(word.phonetic || "")}${word.partOfSpeech ? ` · ${escapeHTML(word.partOfSpeech)}` : ""}</p>
      <p class="word-learn-panel__meaning">${escapeHTML(word.meaningZh)}</p>
      ${word.exampleEn ? `<div class="word-learn-panel__example"><p>${escapeHTML(word.exampleEn)}</p>${word.exampleZh ? `<span>${escapeHTML(word.exampleZh)}</span>` : ""}<button class="icon-button" type="button" id="study-say-example" aria-label="${L("Play example", "播放例句")}">${icon("volume", 16)}</button></div>` : ""}
      <button class="btn btn--primary word-study-cta" type="button" id="study-learn-next">${L("Continue to quiz", "继续测试")} ${icon("arrowRight", 16)}</button>
    </section>`, L("Learn the word", "认识单词"), `${state.learnIndex + 1} / ${words.length}`, state.learnIndex);
    page.querySelector("#study-say-word")?.addEventListener("click", () => speakWord(word));
    page.querySelector("#study-say-example")?.addEventListener("click", () => speakExample(word));
    page.querySelector("#study-learn-next")?.addEventListener("click", () => {
      state.learnIndex += 1;
      paintLearn();
    });
    speakWord(word);
  }

  function startQuiz() {
    state.quizQueue = words.slice();
    state.quizIndex = 0;
    state.quizMastered = new Set();
    state.quizAttempted = new Set();
    state.quizFirstTry = 0;
    paintQuiz();
  }

  function paintQuiz() {
    const word = state.quizQueue[state.quizIndex];
    if (!word) return startSpelling();
    state.answered = false;
    shell(`<section class="word-quiz-panel">
      <p class="word-study-prompt">${L("Choose the closest Chinese meaning", "选出最接近的中文含义")}</p>
      <div class="word-quiz-panel__word"><h2>${escapeHTML(word.word)}</h2><button class="icon-button icon-button--bordered" type="button" id="study-quiz-say">${icon("volume", 19)}</button></div>
      <div class="word-study-options">${word.options.map((option, index) => `<button class="word-study-option" type="button" data-study-option="${index}"><span>${String.fromCharCode(65 + index)}</span><strong>${escapeHTML(option)}</strong></button>`).join("")}</div>
      <div class="word-study-result" id="study-result" hidden></div>
    </section>`, L("Choose the meaning", "选择词义"), `${state.quizMastered.size} / ${words.length}`, state.quizMastered.size);
    page.querySelector("#study-quiz-say")?.addEventListener("click", () => speakWord(word));
    page.querySelectorAll("[data-study-option]").forEach((button) => button.addEventListener("click", () => answer(Number(button.dataset.studyOption), word)));
  }

  async function answer(selectedIndex, word) {
    if (state.answered) return;
    state.answered = true;
    const correct = selectedIndex === word.correctIndex;
    const retry = state.quizAttempted.has(word.id);
    if (correct) {
      state.quizMastered.add(word.id);
      if (!retry) state.quizFirstTry += 1;
    } else {
      state.quizQueue.push(word);
    }
    state.quizAttempted.add(word.id);
    page.querySelectorAll("[data-study-option]").forEach((button) => {
      const index = Number(button.dataset.studyOption);
      button.disabled = true;
      if (index === word.correctIndex) button.classList.add("is-correct");
      else if (index === selectedIndex) button.classList.add("is-wrong");
      else button.classList.add("is-muted");
    });
    const result = page.querySelector("#study-result");
    result.hidden = false;
    result.innerHTML = `<div class="word-study-verdict ${correct ? "is-correct" : "is-wrong"}">${icon(correct ? "checkCircle" : "alert", 19)}<strong>${correct ? L("Correct", "答对了") : L("Not quite — this word returns at the end", "还不对，这个词会在最后再来一次")}</strong></div><p class="word-study-definition">${escapeHTML(word.meaningZh)}</p>${word.exampleEn ? `<p class="word-study-example">${escapeHTML(word.exampleEn)}</p>` : ""}<button class="btn btn--primary word-study-cta" type="button" id="study-quiz-next" disabled>${L("Saving…", "保存中…")}</button>`;
    try {
      await api.post(`/api/word-books/${bookId}/words/${word.id}/answer`, { correct, initial: word.isNew });
    } catch (error) {
      toast(error.message, { type: "error" });
    }
    const next = page.querySelector("#study-quiz-next");
    next.disabled = false;
    next.innerHTML = `${L("Next word", "下一个单词")} ${icon("arrowRight", 15)}`;
    next.addEventListener("click", () => {
      state.quizIndex += 1;
      if (state.quizIndex >= state.quizQueue.length) startSpelling();
      else paintQuiz();
    });
    next.focus({ preventScroll: true });
  }

  function startSpelling() {
    if (!state.spellQueue.length) return finish();
    state.spellIndex = 0;
    paintSpelling();
  }

  function paintSpelling() {
    const item = state.spellQueue[state.spellIndex];
    if (!item) return finish();
    const listenOnly = item.mode === "listen";
    if (listenOnly) speakWord(item.word);
    shell(`<section class="word-spell-panel">
      <p class="word-study-prompt">${listenOnly ? L("Listen, then spell the English word.", "听发音，然后拼出英文单词。") : L("Type the English word for this Chinese meaning.", "根据中文意思拼出英文单词。")}</p>
      ${listenOnly ? `<button class="word-spell-audio" type="button" id="study-spell-audio">${icon("volume", 30)}<span>${L("Play again", "再听一遍")}</span></button><p class="word-spell-hint">${L("Type the word you hear.", "听发音，写出你听到的单词。")}</p>` : `<p class="word-spell-meaning">${escapeHTML(item.word.meaningZh)}</p>`}
      <input class="input word-spell-input" id="study-spell-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${L("Type the English word", "输入英文单词")}">
      <button class="btn btn--primary word-study-cta" type="button" id="study-spell-check">${L("Check spelling", "检查拼写")}</button>
      <div class="word-study-result" id="study-spell-result" hidden></div>
    </section>`, L("Spell the word", "拼写单词"), `${state.spellIndex + 1} / ${state.spellQueue.length}`, words.length + state.spellIndex, words.length + state.spellQueue.length);
    const input = page.querySelector("#study-spell-input");
    const check = page.querySelector("#study-spell-check");
    const result = page.querySelector("#study-spell-result");
    page.querySelector("#study-spell-audio")?.addEventListener("click", () => speakWord(item.word));
    const submit = () => {
      if (!result.hidden) return;
      const typed = input.value.trim();
      if (!typed) { input.focus(); return; }
      const correct = typed.toLowerCase() === item.word.word.toLowerCase();
      if (correct) state.spellCorrect += 1;
      else state.spellQueue.push(item);
      result.hidden = false;
      result.innerHTML = `<div class="word-study-verdict ${correct ? "is-correct" : "is-wrong"}">${icon(correct ? "checkCircle" : "alert", 19)}<strong>${correct ? L("Correct", "正确") : L("The word is", "正确拼写")}</strong></div><p class="word-spell-answer">${escapeHTML(item.word.word)}</p>${correct ? "" : `<p class="word-study-example">${L("This word returns at the end.", "这个词会在最后再出现一次。")}</p>`}<button class="btn btn--primary word-study-cta" type="button" id="study-spell-next">${state.spellIndex + 1 >= state.spellQueue.length ? L("See result", "查看结果") : L("Next", "继续")} ${icon("arrowRight", 15)}</button>`;
      check.hidden = true;
      input.disabled = true;
      result.querySelector("#study-spell-next")?.addEventListener("click", () => {
        state.spellIndex += 1;
        paintSpelling();
      });
      result.querySelector("#study-spell-next")?.focus({ preventScroll: true });
    };
    check.addEventListener("click", submit);
    input.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(); });
    input.focus({ preventScroll: true });
  }

  function finish() {
    refreshSummary();
    shell(`<section class="word-study-finish">
      <div class="word-study-finish__icon">${icon("checkCircle", 34)}</div>
      <p class="eyebrow">${L("Session complete", "学习完成")}</p>
      <h2>${state.quizMastered.size} / ${words.length}</h2>
      <p>${L("words mastered. First try:", "个单词已掌握。首次答对：")} ${state.quizFirstTry} / ${words.length}.${state.spellQueue.length ? ` ${L("Spelling complete.", "拼写完成。")}` : ""}</p>
      <p>${L("Your words and memory schedule have been updated.", "单词和记忆计划已更新。")}</p>
      <div class="word-study-finish__actions"><a class="btn btn--primary" href="/app/vocabulary" data-link>${L("Back to words", "返回单词书")}</a><a class="btn btn--secondary" href="/app/word-study/${bookId}?count=${requestedCount}&spelling=${spellingMode}" data-link>${L("Study again", "再学一组")}</a></div>
    </section>`, L("Session complete", "学习完成"), L("Well done.", "完成了。"), words.length, words.length);
  }

  paintLearn();
  return () => {};
}

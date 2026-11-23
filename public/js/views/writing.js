import { api } from "../api.js";
import { chartSVG } from "../components.js";
import { feedbackHTML, feedbackSkeleton } from "../feedback.js";
import { icon } from "../icons.js";
import { store, refreshSummary } from "../store.js";
import {
  confirmDialog,
  copyText,
  escapeHTML,
  escapeAttr,
  formatDate,
  inlineNotice,
  levelLabel,
  openModal,
  scrollToId,
  setButtonLoading,
  toast,
  wordCount,
  sourceLabel
} from "../ui.js";

function targetWords(taskType, mode) {
  if (mode === "paragraph") return 110;
  return taskType === 1 ? 150 : 250;
}

function criteriaCard() {
  return `<div class="marking-card">
    <div class="marking-card__head">
      <span class="marking-card__icon">${icon("target", 19)}</span>
      <div><p class="eyebrow">Marking</p><h3>Assessment criteria</h3></div>
    </div>
    <ul class="marking-list">
      <li><span>01</span><div><strong>Task response</strong><p>Does the answer address the whole question, with a clear position and developed ideas?</p></div></li>
      <li><span>02</span><div><strong>Coherence & cohesion</strong><p>Does the argument move in a logical order, with paragraphing that helps the reader?</p></div></li>
      <li><span>03</span><div><strong>Lexical resource</strong><p>Is the vocabulary varied, precise and appropriate — not just impressive?</p></div></li>
      <li><span>04</span><div><strong>Grammatical range & accuracy</strong><p>Are complex sentences controlled, and are small errors rare enough not to distract?</p></div></li>
    </ul>
    <div class="marking-note">${icon("info", 14)} <p>Practice estimate only, not an official IELTS score.</p></div>
  </div>`;
}

function promptCard(state) {
  const prompt = state.prompt;
  return `<section class="prompt-card">
    <div class="prompt-card__top">
      <div class="prompt-card__meta">
        <span class="prompt-category">${escapeHTML(prompt.category || "Task 2")}</span>
        <span>${escapeHTML(levelLabel(store.user?.level || "6-7"))}</span>
        ${state.promptSource === "gemini" ? `<span class="source-badge source-badge--ai">${icon("sparkles", 12)} Gemini</span>` : ""}
      </div>
      <button class="btn btn--ghost btn--small" type="button" id="new-writing-question">${icon("rotate", 15)} Fresh question</button>
    </div>
    <p class="prompt-card__lead">${state.taskType === 1 ? "Task 1 · Academic" : "Task 2 · Writing"}</p>
    <h2 class="prompt-text">${escapeHTML(prompt.prompt)}</h2>
    ${prompt.chart ? chartSVG(prompt.chart) : ""}
    ${prompt.tip ? `<p class="prompt-tip">${icon("feather", 15)} ${escapeHTML(prompt.tip)}</p>` : ""}
    ${state.promptNotice ? inlineNotice(state.promptNotice, { tone: "info", iconName: "info" }) : ""}
  </section>`;
}

function recentList(submissions = []) {
  if (!submissions.length) {
    return `<p class="recent-empty">Your first response will appear here, with its feedback safely attached.</p>`;
  }
  return submissions
    .slice(0, 3)
    .map(
      (submission) => `<button class="recent-item" type="button" data-history-id="${submission.id}">
        <span class="recent-item__band">${Number(submission.band).toFixed(1)}</span>
        <span class="recent-item__copy"><strong>${escapeHTML(submission.prompt.slice(0, 88))}${submission.prompt.length > 88 ? "…" : ""}</strong><small>${escapeHTML(formatDate(submission.createdAt))} · ${submission.wordCount} words</small></span>
        ${icon("chevronRight", 15)}
      </button>`
    )
    .join("");
}

function editorHTML(state) {
  const target = targetWords(state.taskType, state.mode);
  const count = wordCount(state.content);
  return `<section class="writer-card">
    <div class="writer-toolbar">
      <div class="segmented mode-switch" role="group" aria-label="Writing mode">
        <button type="button" data-mode="paragraph" role="button" class="${state.mode === "paragraph" ? "is-active" : ""}">A paragraph</button>
        <button type="button" data-mode="full" role="button" class="${state.mode === "full" ? "is-active" : ""}">Full response</button>
      </div>
      <span class="writer-target" id="writer-target">${state.mode === "paragraph" ? "One paragraph" : `Target: ${target} words`}</span>
    </div>
    <textarea class="writer-editor" id="writing-editor" aria-label="Your writing response" placeholder="${state.mode === "paragraph" ? "Write your answer here." : "Write your full answer here."}" spellcheck="true">${escapeHTML(state.content)}</textarea>
    <div class="writer-footer">
      <div class="writer-metrics">
        <span><strong id="writer-count">${count}</strong> words</span>
        <span class="writer-metrics__target">Target ${target}</span>
        <span class="writer-autosave">${icon("check", 12)} draft saved on this device</span>
      </div>
      <div class="writer-actions">
        <button class="btn btn--ghost btn--small" type="button" id="clear-writing">Clear</button>
        <button class="btn btn--primary" type="button" id="submit-writing">${icon("check", 16)} Evaluate my writing</button>
      </div>
    </div>
  </section>`;
}

function writingPageHTML(state) {
  const historyCount = state.history.length;
  return `<div class="page-enter">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">Writing · ${escapeHTML(levelLabel(store.user?.level || "6-7"))}</p>
        <h1>Writing</h1>
        <p>Choose a Task 1 or Task 2 question, write your answer, and get feedback on the four IELTS criteria.</p>
      </div>
      <div class="page-heading__actions">
        <button class="btn btn--secondary btn--small" type="button" id="open-writing-history">${icon("library", 15)} History${historyCount ? ` <span class="count-pill">${historyCount}</span>` : ""}</button>
        <a class="btn btn--ghost btn--small" href="/app/mistakes" data-link>${icon("bookmark", 15)} Mistake Book</a>
      </div>
    </header>
    <div class="writing-layout">
      <div class="writing-main">
        <div class="writing-taskbar">
          <div class="segmented task-switch" role="group" aria-label="IELTS writing task">
            <button type="button" data-task="2" class="${state.taskType === 2 ? "is-active" : ""}">Task 2 · Essay</button>
            <button type="button" data-task="1" class="${state.taskType === 1 ? "is-active" : ""}">Task 1 · Data</button>
          </div>
          <span class="writing-taskbar__note">${state.taskType === 1 ? "Describe the key features of the chart." : "State a clear position and support it."}</span>
        </div>
        ${promptCard(state)}
        ${editorHTML(state)}
        <div id="writing-error"></div>
        <div id="feedback-slot">${state.feedback ? renderFeedback(state) : ""}</div>
      </div>
      <aside class="writing-rail">
        ${criteriaCard()}
        <div class="recent-card">
          <div class="recent-card__head"><h3>Recent writing</h3>${historyCount ? `<button class="text-link" type="button" id="open-history-small">View all</button>` : ""}</div>
          <div class="recent-list">${recentList(state.history)}</div>
        </div>
        <p class="writing-rail__note">${icon("lock", 14)} Your submissions are private to your account.</p>
      </aside>
    </div>
  </div>`;
}

function renderFeedback(state) {
  if (!state.feedback) return "";
  return `<div class="writer-feedback page-enter" id="writer-feedback">
    ${state.fallbackReason ? inlineNotice(state.fallbackReason, { tone: "warning", iconName: "info" }) : ""}
    ${feedbackHTML(state.feedback, {
      source: state.feedbackSource,
      configured: store.aiConfigured,
      type: "writing"
    })}
  </div>`;
}

function historyDetailHTML(submission) {
  return `<div class="history-detail">
    <div class="history-detail__meta">
      <span>${submission.taskType === 1 ? "Academic Task 1" : "Task 2"}</span>
      <span>${escapeHTML(formatDate(submission.createdAt, { withTime: true }))}</span>
      <span>${submission.wordCount} words</span>
      <span>${escapeHTML(sourceLabel(submission.source))}</span>
    </div>
    <div class="history-prompt"><span>Question</span><p>${escapeHTML(submission.prompt)}</p></div>
    <details class="history-original" open>
      <summary>${icon("pen", 15)} Your response</summary>
      <p>${escapeHTML(submission.content || "").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>
    </details>
    ${feedbackHTML(submission.feedback, { source: submission.source, configured: store.aiConfigured, type: "writing" })}
  </div>`;
}

async function openHistoryDetail(id) {
  const modal = openModal({
    title: "A previous draft.",
    subtitle: "The work stays; the feedback stays attached to it.",
    size: "xl",
    content: `<div class="loading-inline" style="padding:35px 0"><span class="spinner"></span> Opening the notebook…</div>`
  });
  if (!modal) return;
  try {
    const data = await api.get(`/api/writing/history/${id}`);
    modal.panel.querySelector(".modal-body").innerHTML = historyDetailHTML(data.submission);
    modal.panel.querySelectorAll("[data-copy-feedback]").forEach((button) => {
      button.addEventListener("click", () => copyText(decodeURIComponent(button.dataset.copyFeedback)));
    });
  } catch (error) {
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<p>${escapeHTML(error.message)}</p></div>`;
  }
}

async function openHistoryList() {
  const modal = openModal({
    title: "Your writing history.",
    subtitle: "Every submission, with the feedback it earned. Open one to revisit a choice.",
    size: "lg",
    content: `<div class="loading-inline" style="padding:35px 0"><span class="spinner"></span> Fetching your drafts…</div>`
  });
  if (!modal) return;
  try {
    const data = await api.get("/api/writing/history");
    if (!data.submissions.length) {
      modal.panel.querySelector(".modal-body").innerHTML = `<div class="empty-state">${icon("pen", 26)}<h3>No responses yet.</h3><p>Your first draft will be saved here automatically.</p></div>`;
      return;
    }
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="history-list">${data.submissions
      .map(
        (submission) => `<button class="history-list__item" type="button" data-history-detail="${submission.id}">
          <span class="history-list__band">${Number(submission.band).toFixed(1)}</span>
          <span class="history-list__copy"><span>${submission.taskType === 1 ? "Task 1" : "Task 2"} · ${escapeHTML(formatDate(submission.createdAt))}</span><strong>${escapeHTML(submission.prompt)}</strong><small>${submission.wordCount} words · ${escapeHTML(sourceLabel(submission.source))}</small></span>
          ${icon("chevronRight", 17)}
        </button>`
      )
      .join("")}</div>`;
    modal.panel.querySelectorAll("[data-history-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        modal.close();
        openHistoryDetail(button.dataset.historyDetail);
      });
    });
  } catch (error) {
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<p>${escapeHTML(error.message)}</p></div>`;
  }
}

export async function renderWriting(root, { signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  const state = {
    taskType: 2,
    mode: "full",
    prompt: null,
    promptSource: "studio",
    promptNotice: "",
    content: "",
    feedback: null,
    feedbackSource: "demo",
    fallbackReason: "",
    history: []
  };
  let saveTimer = null;
  let busy = false;

  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-card" style="margin-top:26px;min-height:280px"></div></div>`;

  function draftKey() {
    return `daymark.writing.${store.user?.id || "user"}.${state.taskType}.${state.mode}.${state.prompt?.id || "prompt"}`;
  }

  function readDraft() {
    try {
      return localStorage.getItem(draftKey()) || "";
    } catch {
      return "";
    }
  }

  function writeDraft(value) {
    try {
      if (value.trim()) localStorage.setItem(draftKey(), value);
      else localStorage.removeItem(draftKey());
    } catch {}
  }

  function scheduleDraft(value) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => writeDraft(value), 320);
  }

  function paint() {
    root.innerHTML = writingPageHTML(state);
  }

  async function loadPrompts(task) {
    const data = await api.get(`/api/writing/prompts?task=${task}`, { signal: controller.signal });
    const list = data.prompts || [];
    const prompt = list[Math.floor(Math.random() * list.length)] || list[0];
    state.prompt = prompt;
    state.promptSource = "studio";
    state.promptNotice = "";
    state.content = "";
    state.feedback = null;
    state.fallbackReason = "";
    if (prompt) state.content = readDraft();
  }

  try {
    const [promptData, historyData] = await Promise.all([
      api.get("/api/writing/prompts?task=2", { signal: controller.signal }),
      api.get("/api/writing/history", { signal: controller.signal })
    ]);
    const list = promptData.prompts || [];
    // The technology question makes a good first canvas; otherwise choose at random.
    state.prompt = list.find((item) => item.id === "t2-technology-meaning") || list[Math.floor(Math.random() * list.length)];
    state.history = historyData.submissions || [];
    state.content = readDraft();
    paint();
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">The desk is empty</p><h1>We couldn’t open the writing room.</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-writing>Try again ${icon("rotate", 16)}</button></div>`;
    root.querySelector("[data-retry-writing]")?.addEventListener("click", () => renderWriting(root, { signal }));
    return () => {};
  }

  async function refreshHistory() {
    try {
      const data = await api.get("/api/writing/history", { signal: controller.signal });
      state.history = data.submissions || [];
      syncHistoryUI();
    } catch {}
  }

  function syncHistoryUI() {
    const list = root.querySelector(".writing-rail .recent-list");
    if (list) list.innerHTML = recentList(state.history);
    const historyButton = root.querySelector("#open-writing-history");
    if (historyButton) {
      historyButton.innerHTML = `${icon("library", 15)} History${state.history.length ? ` <span class="count-pill">${state.history.length}</span>` : ""}`;
    }
  }

  async function newQuestion() {
    if (busy) return;
    const currentText = root.querySelector("#writing-editor")?.value || state.content;
    if (wordCount(currentText) > 8) {
      const confirmed = await confirmDialog({
        title: "Replace this draft?",
        message: "Your current draft is saved on this device, but the new question will start on a clean page.",
        confirmLabel: "Give me a new question",
        cancelLabel: "Keep writing"
      });
      if (!confirmed) return;
    }
    const button = root.querySelector("#new-writing-question");
    setButtonLoading(button, true, "Thinking…");
    try {
      const query = `/api/writing/prompt?task=${state.taskType}&fresh=1`;
      const data = await api.get(query, { signal: controller.signal });
      state.prompt = data.prompt;
      state.promptSource = data.source || "studio";
      state.promptNotice = data.fallbackReason || "";
      state.content = "";
      state.feedback = null;
      state.fallbackReason = "";
      paint();
      toast(state.promptSource === "gemini" ? "A fresh question is ready." : "A new question is ready.", { type: "success" });
    } catch (error) {
      if (error.name !== "AbortError") {
        toast(error.message, { type: "error" });
        setButtonLoading(button, false);
      }
    }
  }

  async function switchTask(task) {
    if (busy || task === state.taskType) return;
    const currentText = root.querySelector("#writing-editor")?.value || state.content;
    if (wordCount(currentText) > 8) writeDraft(currentText);
    state.taskType = task;
    state.mode = task === 1 ? "full" : state.mode;
    state.feedback = null;
    try {
      await loadPrompts(task);
      paint();
    } catch (error) {
      if (error.name !== "AbortError") toast(error.message, { type: "error" });
    }
  }

  function switchMode(mode) {
    if (busy || mode === state.mode) return;
    const editor = root.querySelector("#writing-editor");
    state.content = editor?.value || state.content;
    writeDraft(state.content);
    state.mode = mode;
    state.content = readDraft();
    state.feedback = null;
    paint();
  }

  async function submit() {
    if (busy) return;
    const editor = root.querySelector("#writing-editor");
    state.content = editor?.value || "";
    const words = wordCount(state.content);
    const errorBox = root.querySelector("#writing-error");
    errorBox.innerHTML = "";
    if (words < 20) {
      errorBox.innerHTML = `<div class="form-error">${icon("alert", 16)}<span>Write at least 20 words before evaluating.</span></div>`;
      toast("A few more words first.", { type: "error" });
      return;
    }
    const target = targetWords(state.taskType, state.mode);
    if (words < target * 0.45) {
      errorBox.innerHTML = `<div class="form-error">${icon("alert", 16)}<span>This is quite short for a ${state.mode === "full" ? "full response" : "developed paragraph"} (${words} words). Add one example or consequence before submitting.</span></div>`;
      return;
    }
    busy = true;
    const button = root.querySelector("#submit-writing");
    setButtonLoading(button, true, "Reading your argument…");
    const feedbackSlot = root.querySelector("#feedback-slot");
    feedbackSlot.innerHTML = feedbackSkeleton();
    feedbackSlot.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const data = await api.post("/api/writing/evaluate", {
        mode: state.mode,
        taskType: state.taskType,
        prompt: state.prompt.prompt,
        questionId: state.prompt.id,
        response: state.content
      });
      state.feedback = data.feedback;
      state.feedbackSource = data.source;
      state.fallbackReason = data.fallbackReason || "";
      feedbackSlot.innerHTML = renderFeedback(state);
      feedbackSlot.scrollIntoView({ behavior: "smooth", block: "start" });
      writeDraft(state.content);
      refreshSummary();
      await refreshHistory();
      toast(
        data.source === "gemini" ? "Feedback is ready." : "Feedback is ready. Your work is saved.",
        { type: "success" }
      );
    } catch (error) {
      feedbackSlot.innerHTML = `<div class="form-error">${icon("alert", 16)}<span>${escapeHTML(error.message)}</span></div>`;
      setButtonLoading(button, false);
    } finally {
      busy = false;
      const current = root.querySelector("#submit-writing");
      if (current) setButtonLoading(current, false);
    }
  }

  const clickHandler = async (event) => {
    const taskButton = event.target.closest("[data-task]");
    if (taskButton) return switchTask(Number(taskButton.dataset.task));
    const modeButton = event.target.closest("[data-mode]");
    if (modeButton) return switchMode(modeButton.dataset.mode);
    if (event.target.closest("#new-writing-question")) return newQuestion();
    if (event.target.closest("#submit-writing")) return submit();
    if (event.target.closest("#open-writing-history") || event.target.closest("#open-history-small")) return openHistoryList();
    if (event.target.closest("#clear-writing")) {
      const editor = root.querySelector("#writing-editor");
      if (editor && wordCount(editor.value) > 0) {
        const confirmed = await confirmDialog({ title: "Clear this draft?", message: "The words on this page will be removed from your draft.", confirmLabel: "Clear it", danger: true });
        if (!confirmed) return;
      }
      if (editor) {
        editor.value = "";
        editor.focus();
      }
      state.content = "";
      writeDraft("");
      const count = root.querySelector("#writer-count");
      if (count) count.textContent = "0";
      return;
    }
    const historyId = event.target.closest("[data-history-id]")?.dataset.historyId;
    if (historyId) return openHistoryDetail(historyId);
    const copy = event.target.closest("[data-copy-feedback]");
    if (copy) {
      copyText(decodeURIComponent(copy.dataset.copyFeedback));
      return;
    }
  };

  const inputHandler = (event) => {
    if (event.target.id !== "writing-editor") return;
    state.content = event.target.value;
    scheduleDraft(state.content);
    const count = root.querySelector("#writer-count");
    if (count) count.textContent = String(wordCount(state.content));
    const autosave = root.querySelector(".writer-autosave");
    if (autosave) {
      autosave.classList.add("is-saving");
      autosave.innerHTML = `${icon("clock", 12)} saving draft…`;
      clearTimeout(autosave.dataset.timer);
      const timer = setTimeout(() => {
        autosave.classList.remove("is-saving");
        autosave.innerHTML = `${icon("check", 12)} draft saved on this device`;
      }, 500);
      autosave.dataset.timer = timer;
    }
  };

  const keyHandler = (event) => {
    if (event.target.id === "writing-editor" && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  root.addEventListener("click", clickHandler, { signal: controller.signal });
  root.addEventListener("input", inputHandler, { signal: controller.signal });
  root.addEventListener("keydown", keyHandler, { signal: controller.signal });

  return () => {
    clearTimeout(saveTimer);
    controller.abort();
    if (signal) signal.removeEventListener("abort", abort);
  };
}


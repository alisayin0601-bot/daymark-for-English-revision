import { api } from "../api.js";
import { feedbackHTML, feedbackSkeleton } from "../feedback.js";
import { icon } from "../icons.js";
import { supportsRecognition } from "../speech.js";
import { store, refreshSummary } from "../store.js";
import {
  confirmDialog,
  copyText,
  escapeHTML,
  formatDate,
  inlineNotice,
  levelLabel,
  openModal,
  setButtonLoading,
  sourceLabel,
  toast,
  wordCount
} from "../ui.js";

function formatDuration(seconds = 0) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function speakingCriteria() {
  return `<div class="marking-card speaking-criteria">
    <div class="marking-card__head">
      <span class="marking-card__icon">${icon("waves", 19)}</span>
      <div><p class="eyebrow">Marking</p><h3>Assessment criteria</h3></div>
    </div>
    <ul class="marking-list">
      <li><span>01</span><div><strong>Fluency & coherence</strong><p>Can the answer keep moving, with clear links and only purposeful pauses?</p></div></li>
      <li><span>02</span><div><strong>Lexical resource</strong><p>Are the words specific and natural, rather than recycled from the question?</p></div></li>
      <li><span>03</span><div><strong>Grammar</strong><p>Is there enough range and control to say something nuanced without collapsing?</p></div></li>
    </ul>
    <div class="marking-note">${icon("mic", 14)} <p>Pronunciation is not scored from a transcript. Daymark assesses the language you managed to say, not an accent.</p></div>
  </div>`;
}

function topicCard(state) {
  return `<section class="speaking-topic">
    <div class="speaking-topic__top">
      <div class="speaking-topic__meta">
        <span class="prompt-category">${escapeHTML(state.prompt.category || "Speaking")}</span>
        <span>${state.mode === "paragraph" ? "Short turn · 45–90 sec" : "Long turn · 1–2 min"}</span>
        <span>${escapeHTML(levelLabel(store.user?.level || "6-7"))}</span>
      </div>
      <button class="btn btn--ghost btn--small" type="button" id="new-speaking-topic">${icon("rotate", 15)} New topic</button>
    </div>
    <p class="speaking-topic__title">${escapeHTML(state.prompt.title || "A speaking prompt")}</p>
    <h2>${escapeHTML(state.prompt.prompt)}</h2>
    ${state.prompt.cue ? `<div class="speaking-cue">${icon("feather", 15)} <p>${escapeHTML(state.prompt.cue)}</p></div>` : ""}
    ${state.promptNotice ? inlineNotice(state.promptNotice, { tone: "info", iconName: "info" }) : ""}
  </section>`;
}

function recordingStudioHTML(state) {
  const supported = supportsRecognition();
  return `<section class="recording-studio" id="recording-studio">
    <div class="recording-studio__top">
      <span class="recording-status"><i></i> Recording room</span>
      <span class="recording-status__right" id="recording-state-label">${supported ? "Ready when you are" : "Typing mode"}</span>
    </div>
    <div class="record-center">
      <div class="record-orbit" aria-hidden="true">
        <span class="record-orbit__ring record-orbit__ring--one"></span>
        <span class="record-orbit__ring record-orbit__ring--two"></span>
        <button class="record-button" type="button" id="record-button" aria-label="${supported ? "Start recording" : "Microphone unavailable"}" ${supported ? "" : "disabled"}>
          ${icon(supported ? "mic" : "micOff", 29)}
        </button>
      </div>
      <div class="record-timer" id="record-timer">00:00</div>
      <p class="record-hint" id="record-hint">${supported ? "Record when you are ready." : "Speech recognition is not available in this browser. You can still type your answer below."}</p>
      <div class="record-wave" aria-hidden="true">
        ${Array.from({ length: 27 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}
      </div>
    </div>
    <div class="recording-studio__foot">
      <span>${icon("lock", 13)} Daymark receives only the transcript. Your audio stays with your browser.</span>
      <span id="record-limit">${state.mode === "paragraph" ? "Suggested 45–90 sec" : "Suggested 1–2 min"}</span>
    </div>
  </section>`;
}

function transcriptHTML(state) {
  return `<section class="transcript-card">
    <div class="transcript-card__head">
      <div><p class="eyebrow">Transcript</p><h3>Your answer</h3></div>
      <span class="transcript-count" id="transcript-count">0 words</span>
    </div>
    <textarea class="transcript-editor" id="speaking-transcript" placeholder="${supportsRecognition() ? "Your words will appear here. You can edit the transcript before submitting." : "Type your answer here. Feedback is based on the language, not the microphone."}" spellcheck="true"></textarea>
    <div class="transcript-card__foot">
      <span>${icon("info", 14)} Speech recognition can mishear names. Read it through before evaluating.</span>
      <div class="transcript-actions">
        <button class="btn btn--ghost btn--small" type="button" id="clear-transcript">Clear</button>
        <button class="btn btn--primary" type="button" id="evaluate-speaking">${icon("check", 16)} Evaluate my answer</button>
      </div>
    </div>
    <div id="speaking-error"></div>
  </section>`;
}

function recentSpeakingList(history) {
  if (!history.length) return `<p class="recent-empty">Your first spoken answer will be saved here, transcript and all.</p>`;
  return history
    .slice(0, 3)
    .map(
      (entry) => `<button class="recent-item" type="button" data-speaking-history="${entry.id}">
        <span class="recent-item__band">${Number(entry.band).toFixed(1)}</span>
        <span class="recent-item__copy"><strong>${escapeHTML(entry.prompt.slice(0, 90))}${entry.prompt.length > 90 ? "…" : ""}</strong><small>${escapeHTML(formatDate(entry.createdAt))} · ${entry.durationSeconds ? formatDuration(entry.durationSeconds) : "transcript"}</small></span>
        ${icon("chevronRight", 15)}
      </button>`
    )
    .join("");
}

function speakingPageHTML(state) {
  return `<div class="page-enter">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">Speaking · ${escapeHTML(levelLabel(store.user?.level || "6-7"))}</p>
        <h1>Speaking</h1>
        <p>Record or type an answer. Feedback is based on the transcript; the microphone is handled by your browser.</p>
      </div>
      <div class="page-heading__actions">
        <button class="btn btn--secondary btn--small" type="button" id="open-speaking-history">${icon("library", 15)} History${state.history.length ? ` <span class="count-pill">${state.history.length}</span>` : ""}</button>
        <a class="btn btn--ghost btn--small" href="/app/listening" data-link>${icon("headphones", 15)} Listening</a>
      </div>
    </header>
    <div class="writing-taskbar">
      <div class="segmented" role="group" aria-label="Speaking turn length">
        <button type="button" data-speaking-mode="paragraph" class="${state.mode === "paragraph" ? "is-active" : ""}">Short turn</button>
        <button type="button" data-speaking-mode="passage" class="${state.mode === "passage" ? "is-active" : ""}">Long turn</button>
      </div>
      <span class="writing-taskbar__note">${state.mode === "paragraph" ? "State one view, then support it." : "Tell it as a story with two or three details."}</span>
    </div>
    <div class="speaking-layout">
      <div class="speaking-main">
        ${topicCard(state)}
        ${recordingStudioHTML(state)}
        ${transcriptHTML(state)}
        <div id="speaking-feedback">${state.feedback ? renderSpeakingFeedback(state) : ""}</div>
      </div>
      <aside class="speaking-rail">
        ${speakingCriteria()}
        <div class="recent-card">
          <div class="recent-card__head"><h3>Recent speaking</h3>${state.history.length ? `<button class="text-link" type="button" id="open-speaking-history-small">View all</button>` : ""}</div>
          <div class="recent-list">${recentSpeakingList(state.history)}</div>
        </div>
        <div class="speaking-tip">
          <span>${icon("quote", 19)}</span>
          <p>“The aim is not a perfect accent. It is a clear mind, thinking aloud.”</p>
        </div>
      </aside>
    </div>
  </div>`;
}

function renderSpeakingFeedback(state) {
  if (!state.feedback) return "";
  return `<div class="writer-feedback page-enter" id="speaker-feedback">
    ${state.fallbackReason ? inlineNotice(state.fallbackReason, { tone: "warning", iconName: "info" }) : ""}
    ${feedbackHTML(state.feedback, {
      source: state.feedbackSource,
      configured: store.aiConfigured,
      type: "speaking"
    })}
  </div>`;
}

function speakingHistoryDetailHTML(submission) {
  return `<div class="history-detail">
    <div class="history-detail__meta">
      <span>${submission.mode === "paragraph" ? "Short turn" : "Long turn"}</span>
      <span>${escapeHTML(formatDate(submission.createdAt, { withTime: true }))}</span>
      <span>${formatDuration(submission.durationSeconds)}</span>
      <span>${escapeHTML(sourceLabel(submission.source))}</span>
    </div>
    <div class="history-prompt"><span>Question</span><p>${escapeHTML(submission.prompt)}</p></div>
    <details class="history-original" open>
      <summary>${icon("mic", 15)} Transcript</summary>
      <p>${escapeHTML(submission.transcript || "").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>
    </details>
    ${feedbackHTML(submission.feedback, { source: submission.source, configured: store.aiConfigured, type: "speaking" })}
  </div>`;
}

async function openSpeakingHistoryDetail(id) {
  const modal = openModal({
    title: "A previous answer.",
    subtitle: "The transcript and the feedback, kept together.",
    size: "xl",
    content: `<div class="loading-inline" style="padding:35px 0"><span class="spinner"></span> Opening the room…</div>`
  });
  if (!modal) return;
  try {
    const data = await api.get(`/api/speaking/history/${id}`);
    modal.panel.querySelector(".modal-body").innerHTML = speakingHistoryDetailHTML(data.submission);
    modal.panel.querySelectorAll("[data-copy-feedback]").forEach((button) => {
      button.addEventListener("click", () => copyText(decodeURIComponent(button.dataset.copyFeedback)));
    });
  } catch (error) {
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<p>${escapeHTML(error.message)}</p></div>`;
  }
}

async function openSpeakingHistoryList() {
  const modal = openModal({
    title: "Your speaking history.",
    subtitle: "Transcripts and feedback from your previous turns.",
    size: "lg",
    content: `<div class="loading-inline" style="padding:35px 0"><span class="spinner"></span> Fetching your answers…</div>`
  });
  if (!modal) return;
  try {
    const data = await api.get("/api/speaking/history");
    if (!data.submissions.length) {
      modal.panel.querySelector(".modal-body").innerHTML = `<div class="empty-state">${icon("mic", 26)}<h3>No answers recorded yet.</h3><p>Begin with a short turn. The transcript will be saved here.</p></div>`;
      return;
    }
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="history-list">${data.submissions
      .map(
        (submission) => `<button class="history-list__item" type="button" data-speaking-detail="${submission.id}">
          <span class="history-list__band">${Number(submission.band).toFixed(1)}</span>
          <span class="history-list__copy"><span>${submission.mode === "paragraph" ? "Short turn" : "Long turn"} · ${escapeHTML(formatDate(submission.createdAt))}</span><strong>${escapeHTML(submission.prompt)}</strong><small>${formatDuration(submission.durationSeconds)} · ${escapeHTML(sourceLabel(submission.source))}</small></span>
          ${icon("chevronRight", 17)}
        </button>`
      )
      .join("")}</div>`;
    modal.panel.querySelectorAll("[data-speaking-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        modal.close();
        openSpeakingHistoryDetail(button.dataset.speakingDetail);
      });
    });
  } catch (error) {
    modal.panel.querySelector(".modal-body").innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<p>${escapeHTML(error.message)}</p></div>`;
  }
}

export async function renderSpeaking(root, { signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  let recognition = null;
  let recording = false;
  let intentionalStop = false;
  let timer = null;
  let startedAt = 0;
  let elapsed = 0;
  let finalText = "";
  let interimText = "";
  let busy = false;
  let duration = 0;

  const state = {
    mode: "passage",
    prompt: null,
    promptNotice: "",
    history: [],
    feedback: null,
    feedbackSource: "demo",
    fallbackReason: ""
  };

  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-card" style="margin-top:26px;min-height:300px"></div></div>`;

  function paint() {
    root.innerHTML = speakingPageHTML(state);
    const editor = root.querySelector("#speaking-transcript");
    if (editor) {
      editor.value = finalText + interimText;
      updateTranscriptCount();
    }
  }

  async function loadInitial() {
    try {
      const [promptData, historyData] = await Promise.all([
        api.get("/api/speaking/prompt?mode=passage", { signal: controller.signal }),
        api.get("/api/speaking/history", { signal: controller.signal })
      ]);
      state.prompt = promptData.prompt;
      state.history = historyData.submissions || [];
      paint();
    } catch (error) {
      if (error.name === "AbortError") return;
      root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">Could not load</p><h1>Speaking is unavailable.</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-speaking>Try again ${icon("rotate", 16)}</button></div>`;
      root.querySelector("[data-retry-speaking]")?.addEventListener("click", () => renderSpeaking(root, { signal }));
    }
  }

  function updateTranscriptCount() {
    const editor = root.querySelector("#speaking-transcript");
    const count = root.querySelector("#transcript-count");
    if (count && editor) count.textContent = `${wordCount(editor.value)} words`;
  }

  function setRecordingUI() {
    const studio = root.querySelector("#recording-studio");
    const label = root.querySelector("#recording-state-label");
    const hint = root.querySelector("#record-hint");
    const button = root.querySelector("#record-button");
    if (!studio) return;
    studio.classList.toggle("is-recording", recording);
    if (button) button.setAttribute("aria-label", recording ? "Stop recording" : "Start recording");
    if (label) label.textContent = recording ? "Listening…" : duration > 0 ? "Answer captured" : "Ready when you are";
    if (hint) {
      hint.textContent = recording
        ? "Speak naturally. The transcript is being written below."
        : duration > 0
          ? "You can record again, edit the transcript, or ask for feedback."
          : "Record when you are ready.";
    }
  }

  function startTimer() {
    startedAt = Date.now();
    clearInterval(timer);
    timer = setInterval(() => {
      elapsed = Math.floor((Date.now() - startedAt) / 1000) + (duration || 0);
      const timerEl = root.querySelector("#record-timer");
      if (timerEl) timerEl.textContent = formatDuration(elapsed);
      if (elapsed > 240) stopRecording();
    }, 300);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
  }

  function startRecording() {
    if (!supportsRecognition() || recording) return;
    const editor = root.querySelector("#speaking-transcript");
    finalText = editor?.value.trim() || "";
    if (finalText) finalText += " ";
    interimText = "";
    duration = 0;
    intentionalStop = false;
    try {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-GB";
      recognition.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalChunk += result[0].transcript + " ";
          else interimChunk += result[0].transcript;
        }
        if (finalChunk) finalText += finalChunk;
        interimText = interimChunk;
        const editorNow = root.querySelector("#speaking-transcript");
        if (editorNow) editorNow.value = (finalText + interimText).trimStart();
        updateTranscriptCount();
      };
      recognition.onerror = (event) => {
        if (["aborted", "no-speech"].includes(event.error)) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast("The microphone was blocked. Allow access in your browser, or type your answer instead.", { type: "error" });
          intentionalStop = true;
          stopRecording();
        } else if (event.error === "network") {
          toast("The browser’s speech service lost its connection. You can type or try again.", { type: "error" });
          intentionalStop = true;
          stopRecording();
        }
      };
      recognition.onend = () => {
        if (recording) {
          // Chrome can end a continuous session during a long silence.
          recording = false;
          stopTimer();
          duration = elapsed;
          setRecordingUI();
          updateEvaluateAvailability();
        }
      };
      recognition.start();
      recording = true;
      startedAt = Date.now();
      setRecordingUI();
      startTimer();
      updateEvaluateAvailability();
    } catch (error) {
      toast("We could not start the microphone. You can type your answer below.", { type: "error" });
      recording = false;
      setRecordingUI();
    }
  }

  function stopRecording() {
    intentionalStop = true;
    if (recognition) {
      try {
        recognition.stop();
      } catch {}
    }
    recording = false;
    duration = Number(elapsed) || duration;
    stopTimer();
    interimText = "";
    const editor = root.querySelector("#speaking-transcript");
    if (editor) editor.value = finalText.trim();
    updateTranscriptCount();
    setRecordingUI();
    updateEvaluateAvailability();
  }

  function updateEvaluateAvailability() {
    const button = root.querySelector("#evaluate-speaking");
    if (!button) return;
    const editor = root.querySelector("#speaking-transcript");
    button.disabled = wordCount(editor?.value || "") < 5;
  }

  async function switchMode(mode) {
    if (mode === state.mode || busy) return;
    stopRecording();
    state.mode = mode;
    state.feedback = null;
    finalText = "";
    interimText = "";
    duration = 0;
    elapsed = 0;
    try {
      const data = await api.get(`/api/speaking/prompt?mode=${mode}`, { signal: controller.signal });
      state.prompt = data.prompt;
      state.promptNotice = "";
      paint();
    } catch (error) {
      if (error.name !== "AbortError") toast(error.message, { type: "error" });
    }
  }

  async function newTopic() {
    if (busy) return;
    stopRecording();
    if (wordCount(root.querySelector("#speaking-transcript")?.value || "") > 8) {
      const confirmed = await confirmDialog({
        title: "Begin a new answer?",
        message: "Your current transcript will be cleared from this page. Any evaluated answers stay in your history.",
        confirmLabel: "Find a new topic",
        cancelLabel: "Keep this one"
      });
      if (!confirmed) return;
    }
    const button = root.querySelector("#new-speaking-topic");
    setButtonLoading(button, true, "Finding a topic…");
    try {
      const data = await api.get(`/api/speaking/prompt?mode=${state.mode}&fresh=1`, { signal: controller.signal });
      state.prompt = data.prompt;
      state.promptNotice = data.fallbackReason || "";
      state.feedback = null;
      state.fallbackReason = "";
      finalText = "";
      interimText = "";
      duration = 0;
      elapsed = 0;
      paint();
      toast(data.source === "gemini" ? "A fresh topic is ready." : "A built-in topic is ready.", { type: "success" });
    } catch (error) {
      if (error.name !== "AbortError") {
        setButtonLoading(button, false);
        toast(error.message, { type: "error" });
      }
    }
  }

  async function evaluate() {
    if (busy) return;
    const editor = root.querySelector("#speaking-transcript");
    const transcript = editor?.value.trim() || "";
    const words = wordCount(transcript);
    const errorBox = root.querySelector("#speaking-error");
    if (errorBox) errorBox.innerHTML = "";
    if (words < 5) {
      if (errorBox) errorBox.innerHTML = `<div class="form-error">${icon("alert", 15)}<span>Please record or type a fuller answer.</span></div>`;
      toast("A few more words first.", { type: "error" });
      return;
    }
    if (recording) stopRecording();
    const measured = duration || elapsed || Math.round(words / 2.4);
    busy = true;
    const button = root.querySelector("#evaluate-speaking");
    setButtonLoading(button, true, "Listening back…");
    const feedbackSlot = root.querySelector("#speaking-feedback");
    feedbackSlot.innerHTML = feedbackSkeleton();
    feedbackSlot.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const data = await api.post("/api/speaking/evaluate", {
        mode: state.mode,
        prompt: state.prompt.prompt,
        transcript,
        durationSeconds: measured
      });
      state.feedback = data.feedback;
      state.feedbackSource = data.source;
      state.fallbackReason = data.fallbackReason || "";
      feedbackSlot.innerHTML = renderSpeakingFeedback(state);
      feedbackSlot.scrollIntoView({ behavior: "smooth", block: "start" });
      refreshSummary();
      try {
        const historyData = await api.get("/api/speaking/history", { signal: controller.signal });
        state.history = historyData.submissions || [];
        const list = root.querySelector(".speaking-rail .recent-list");
        if (list) list.innerHTML = recentSpeakingList(state.history);
        const historyButton = root.querySelector("#open-speaking-history");
        if (historyButton) {
          historyButton.innerHTML = `${icon("library", 15)} History${state.history.length ? ` <span class="count-pill">${state.history.length}</span>` : ""}`;
        }
      } catch {}
      toast(data.source === "gemini" ? "Feedback is ready." : "Feedback is ready. Your answer is saved.", { type: "success" });
    } catch (error) {
      feedbackSlot.innerHTML = `<div class="form-error">${icon("alert", 15)}<span>${escapeHTML(error.message)}</span></div>`;
    } finally {
      busy = false;
      const currentButton = root.querySelector("#evaluate-speaking");
      if (currentButton) {
        setButtonLoading(currentButton, false);
        updateEvaluateAvailability();
      }
    }
  }

  const clickHandler = async (event) => {
    if (event.target.closest("#record-button")) {
      if (recording) stopRecording();
      else startRecording();
      return;
    }
    if (event.target.closest("[data-speaking-mode]")) return switchMode(event.target.closest("[data-speaking-mode]").dataset.speakingMode);
    if (event.target.closest("#new-speaking-topic")) return newTopic();
    if (event.target.closest("#evaluate-speaking")) return evaluate();
    if (event.target.closest("#clear-transcript")) {
      const editor = root.querySelector("#speaking-transcript");
      if (editor) editor.value = "";
      finalText = "";
      interimText = "";
      duration = 0;
      elapsed = 0;
      updateTranscriptCount();
      updateEvaluateAvailability();
      const timerEl = root.querySelector("#record-timer");
      if (timerEl) timerEl.textContent = "00:00";
      return;
    }
    if (event.target.closest("#open-speaking-history") || event.target.closest("#open-speaking-history-small")) {
      return openSpeakingHistoryList();
    }
    const historyId = event.target.closest("[data-speaking-history]")?.dataset.speakingHistory;
    if (historyId) return openSpeakingHistoryDetail(historyId);
    const copy = event.target.closest("[data-copy-feedback]");
    if (copy) copyText(decodeURIComponent(copy.dataset.copyFeedback));
  };

  const inputHandler = (event) => {
    if (event.target.id === "speaking-transcript") {
      finalText = event.target.value;
      updateTranscriptCount();
      updateEvaluateAvailability();
    }
  };

  root.addEventListener("click", clickHandler, { signal: controller.signal });
  root.addEventListener("input", inputHandler, { signal: controller.signal });

  await loadInitial();
  if (root.querySelector("#evaluate-speaking")) {
    updateTranscriptCount();
    updateEvaluateAvailability();
    setRecordingUI();
  }

  return () => {
    recording = false;
    intentionalStop = true;
    stopTimer();
    if (recognition) {
      try {
        recognition.abort();
      } catch {}
    }
    controller.abort();
    if (signal) signal.removeEventListener("abort", abort);
  };
}


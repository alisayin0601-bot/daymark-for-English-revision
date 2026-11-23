const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const ACCENT_LANG = {
  British: "en-GB",
  American: "en-US",
  Australian: "en-AU",
  English: "en-GB"
};

export function supportsSpeech() {
  return Boolean(synth && window.SpeechSynthesisUtterance);
}

export function supportsRecognition() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speechLang(accent = "British") {
  return ACCENT_LANG[accent] || "en-GB";
}

export function getVoices() {
  if (!synth) return [];
  return synth.getVoices().filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
}

export function chooseVoice(accent = "British") {
  const lang = speechLang(accent).toLowerCase();
  const voices = getVoices();
  const exact = voices.filter((voice) => voice.lang?.toLowerCase() === lang);
  const regional = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(lang.slice(0, 2)));
  const preferred = exact.find((voice) => /natural|premium|enhanced|google|samantha|daniel|serena|karen/i.test(voice.name)) || exact[0] || regional[0];
  return preferred || voices[0] || null;
}

export function stopSpeaking() {
  if (synth) synth.cancel();
}

export function speak(text, { accent = "British", rate = 0.92, onStart, onEnd, onError } = {}) {
  if (!supportsSpeech() || !text) {
    if (typeof onError === "function") onError(new Error("Speech is not available in this browser."));
    return null;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = speechLang(accent);
  utterance.rate = rate;
  utterance.pitch = 1;
  const voice = chooseVoice(accent);
  if (voice) utterance.voice = voice;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => {
    if (event.error !== "canceled" && event.error !== "interrupted") onError?.(event);
  };
  synth.speak(utterance);
  return utterance;
}

export function splitScript(script = "") {
  const clean = String(script).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const rough = clean.match(/[^.!?]+[.!?]+["')\]]?|[^.!?]+$/g) || [clean];
  const chunks = [];
  for (const sentence of rough) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length <= 240) {
      chunks.push(trimmed);
    } else {
      const parts = trimmed.match(/.{1,200}(?:\s|$)/g) || [trimmed];
      chunks.push(...parts.map((part) => part.trim()).filter(Boolean));
    }
  }
  return chunks.length ? chunks : [clean];
}

/**
 * Segmented speech player: gives reliable play/pause/replay/speed behavior
 * in browsers (Chrome especially) that truncate very long utterances.
 */
export class SpeechPlayer {
  constructor(script, { accent = "British", rate = 0.92, onState, onProgress } = {}) {
    this.segments = splitScript(script);
    this.accent = accent;
    this.rate = rate;
    this.index = 0;
    this.state = "idle";
    this.onState = onState || (() => {});
    this.onProgress = onProgress || (() => {});
    this.token = 0;
    this.utterance = null;
    this.voicesBound = false;
  }

  emitState() {
    this.onState({
      state: this.state,
      index: this.index,
      total: this.segments.length,
      supported: supportsSpeech()
    });
  }

  emitProgress() {
    this.onProgress({
      index: this.index,
      total: this.segments.length,
      percent: this.segments.length ? Math.round((this.index / this.segments.length) * 100) : 0
    });
  }

  setRate(rate) {
    this.rate = Number(rate) || 0.92;
    if (this.state === "playing" || this.state === "paused") {
      this.token += 1;
      synth.cancel();
      this.state = "playing";
      this.playCurrent(false);
    }
  }

  toggle() {
    if (!supportsSpeech()) return;
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
    else this.play();
  }

  play() {
    if (!supportsSpeech() || !this.segments.length) return;
    if (this.state === "ended" || this.index >= this.segments.length) {
      this.index = 0;
    }
    this.state = "playing";
    this.emitState();
    this.playCurrent(true);
  }

  playCurrent(resetSpeech = true) {
    if (!supportsSpeech()) return;
    const currentToken = ++this.token;
    if (resetSpeech) synth.cancel();
    if (this.index >= this.segments.length) {
      this.finish();
      return;
    }
    const text = this.segments[this.index];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang(this.accent);
    utterance.rate = this.rate;
    utterance.pitch = 1;
    const voice = chooseVoice(this.accent);
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      if (currentToken !== this.token) return;
      this.state = "playing";
      this.emitState();
    };
    utterance.onend = () => {
      if (currentToken !== this.token) return;
      if (this.state === "paused") return;
      this.index += 1;
      this.emitProgress();
      if (this.index >= this.segments.length) {
        this.finish();
      } else {
        this.playCurrent(false);
      }
    };
    utterance.onerror = (event) => {
      if (currentToken !== this.token) return;
      if (["canceled", "interrupted"].includes(event.error)) return;
      this.state = "error";
      this.emitState();
    };
    this.utterance = utterance;
    synth.speak(utterance);
  }

  pause() {
    if (!supportsSpeech() || this.state !== "playing") return;
    this.state = "paused";
    try {
      synth.pause();
    } catch {}
    this.emitState();
  }

  resume() {
    if (!supportsSpeech() || this.state !== "paused") return;
    this.state = "playing";
    try {
      synth.resume();
    } catch {}
    this.emitState();
  }

  replay() {
    if (!supportsSpeech()) return;
    this.token += 1;
    synth.cancel();
    this.index = 0;
    this.state = "playing";
    this.emitProgress();
    this.emitState();
    setTimeout(() => this.playCurrent(true), 120);
  }

  seek(index) {
    this.index = Math.max(0, Math.min(this.segments.length - 1, Number(index) || 0));
    this.emitProgress();
    if (this.state === "playing" || this.state === "paused") {
      this.state = "playing";
      this.emitState();
      setTimeout(() => this.playCurrent(true), 80);
    }
  }

  finish() {
    this.index = this.segments.length;
    this.state = "ended";
    this.emitProgress();
    this.emitState();
  }

  destroy() {
    this.token += 1;
    this.state = "idle";
    if (supportsSpeech()) synth.cancel();
    this.onState = () => {};
    this.onProgress = () => {};
  }
}

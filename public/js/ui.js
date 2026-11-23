import { icon } from "./icons.js";

export function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value = "") {
  return escapeHTML(value).replace(/`/g, "&#96;");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function plural(count, singular, pluralWord = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

export function levelLabel(level = "6-7") {
  return `Band ${String(level).replace("-", "–")}${level === "7-8" ? "+" : ""}`;
}

export function sourceLabel(source) {
  if (source === "gemini") return "AI-assisted";
  if (source === "book") return "My reading book";
  if (source === "studio" || source === "studio-sample") return "Built-in";
  if (source === "demo") return "Practice estimate";
  if (source === "dictionaryapi" || source === "free-dictionary") return "Free dictionary";
  if (source === "cache") return "Dictionary";
  return source ? String(source) : "Built-in";
}

export function initials(name = "") {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return "D";
  if (pieces.length === 1) return pieces[0].slice(0, 2).toUpperCase();
  return (pieces[0][0] + pieces[pieces.length - 1][0]).toUpperCase();
}

export function avatarHTML(name, size = "md") {
  return `<span class="avatar avatar--${size}" aria-hidden="true">${escapeHTML(initials(name))}</span>`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDate(ms, { withTime = false } = {}) {
  if (!ms) return "";
  const date = new Date(Number(ms));
  const options = { day: "numeric", month: "short" };
  if (withTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

export function relativeTime(ms) {
  if (!ms) return "";
  const delta = Number(ms) - Date.now();
  const past = delta < 0;
  const abs = Math.abs(delta);
  const minutes = Math.round(abs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return past ? `${minutes} min ago` : `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return past ? "yesterday" : "tomorrow";
  if (days < 14) return past ? `${days} days ago` : `in ${days} days`;
  return formatDate(ms);
}

export function reviewLabel(nextReviewAt) {
  if (!nextReviewAt) return "";
  const delta = Number(nextReviewAt) - Date.now();
  if (delta <= 0) return "Due now";
  const hours = delta / 3_600_000;
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `in ${minutes} min`;
  }
  if (hours < 24) return `in ${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

export function wordCount(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function statusPill(label, tone = "neutral", extra = "") {
  return `<span class="status-pill status-pill--${tone} ${extra}">${escapeHTML(label)}</span>`;
}

export function bandTone(band) {
  if (band >= 7) return "good";
  if (band >= 6) return "mid";
  return "low";
}

export function spinner() {
  return `<span class="spinner" aria-hidden="true"></span>`;
}

export function setButtonLoading(button, loading, label = "Working…") {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.classList.add("is-loading");
    button.innerHTML = `${spinner()}<span>${escapeHTML(label)}</span>`;
  } else {
    button.disabled = false;
    button.classList.remove("is-loading");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

let toastCounter = 0;
export function toast(message, { type = "default", duration = 4200 } = {}) {
  if (!message) return;
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  const id = `toast-${++toastCounter}`;
  const node = document.createElement("div");
  const iconName = type === "success" ? "checkCircle" : type === "error" ? "alert" : "info";
  node.id = id;
  node.className = `toast toast--${type}`;
  node.innerHTML = `<span class="toast__icon">${icon(iconName, 18)}</span><span class="toast__message">${escapeHTML(message)}</span><button class="toast__close" aria-label="Dismiss">${icon("x", 15)}</button>`;
  const existing = root.querySelectorAll(".toast");
  if (existing.length >= 3) existing[0].remove();
  root.appendChild(node);
  requestAnimationFrame(() => node.classList.add("is-visible"));
  let timer = setTimeout(() => dismiss(), duration);
  const dismiss = () => {
    clearTimeout(timer);
    node.classList.remove("is-visible");
    setTimeout(() => node.remove(), 220);
  };
  node.querySelector(".toast__close").addEventListener("click", dismiss);
  node.addEventListener("mouseenter", () => clearTimeout(timer));
  node.addEventListener("mouseleave", () => {
    timer = setTimeout(dismiss, 1500);
  });
}

let activeModal = null;

export function closeModal() {
  if (!activeModal) return;
  const { modalRoot, cleanup, onClose } = activeModal;
  activeModal = null;
  if (cleanup) cleanup();
  modalRoot.innerHTML = "";
  document.body.classList.remove("modal-open");
  if (typeof onClose === "function") onClose();
}

export function openModal({
  title = "",
  subtitle = "",
  content = "",
  footer = "",
  size = "md",
  className = "",
  labelledBy = "",
  onMount = null,
  onClose = null
} = {}) {
  closeModal();
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;
  document.body.classList.add("modal-open");
  modalRoot.innerHTML = `
    <div class="modal-layer" aria-hidden="false">
      <div class="modal-backdrop" data-modal-close></div>
      <div class="modal-panel modal-panel--${escapeAttr(size)} ${escapeAttr(className)}" role="dialog" aria-modal="true" ${labelledBy ? `aria-labelledby="${escapeAttr(labelledBy)}"` : `aria-label="${escapeAttr(title || "Dialog")}"`}>
        <button class="modal-close icon-button" type="button" data-modal-close aria-label="Close dialog">${icon("x", 18)}</button>
        ${title || subtitle ? `<header class="modal-header">${title ? `<h2 class="modal-title" ${labelledBy ? `id="${escapeAttr(labelledBy)}"` : ""}>${escapeHTML(title)}</h2>` : ""}${subtitle ? `<p class="modal-subtitle">${escapeHTML(subtitle)}</p>` : ""}</header>` : ""}
        <div class="modal-body">${content}</div>
        ${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}
      </div>
    </div>`;
  const layer = modalRoot.querySelector(".modal-layer");
  const panel = modalRoot.querySelector(".modal-panel");
  const previousFocus = document.activeElement;
  const keyHandler = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener("keydown", keyHandler);
  layer.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) closeModal();
  });
  const cleanup = () => {
    document.removeEventListener("keydown", keyHandler);
    if (previousFocus && typeof previousFocus.focus === "function") {
      try {
        previousFocus.focus({ preventScroll: true });
      } catch {}
    }
  };
  activeModal = { modalRoot, cleanup, onClose };
  requestAnimationFrame(() => layer.classList.add("is-open"));
  const focusTarget =
    panel.querySelector("[autofocus]") ||
    panel.querySelector("input:not([disabled]), textarea:not([disabled]), select:not([disabled])") ||
    panel.querySelector("button:not(.modal-close)") ||
    panel;
  setTimeout(() => {
    try {
      focusTarget.focus({ preventScroll: true });
    } catch {}
  }, 40);
  if (typeof onMount === "function") {
    onMount({ layer, panel, modalRoot, close: closeModal });
  }
  return { layer, panel, close: closeModal };
}

export function confirmDialog({
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false
} = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    openModal({
      title,
      subtitle: message,
      size: "sm",
      content: "",
      footer: `<button class="btn btn--ghost" data-confirm-cancel>${escapeHTML(cancelLabel)}</button><button class="btn ${danger ? "btn--danger" : "btn--primary"}" data-confirm-ok>${escapeHTML(confirmLabel)}</button>`,
      onClose: () => finish(false),
      onMount: ({ panel, close }) => {
        panel.querySelector("[data-confirm-cancel]").addEventListener("click", () => {
          finish(false);
          close();
        });
        panel.querySelector("[data-confirm-ok]").addEventListener("click", () => {
          finish(true);
          close();
        });
      }
    });
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard.", { type: "success" });
  } catch {
    toast("Your browser would not allow copying. Select the text instead.", { type: "error" });
  }
}

export function scrollToId(id, offset = 20) {
  const element = document.getElementById(id);
  if (!element) return;
  const y = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export function emptyState({ iconName = "leaf", title, message, action = "" }) {
  return `<div class="empty-state">
    <div class="empty-state__art">${icon(iconName, 28)}</div>
    <h3>${escapeHTML(title)}</h3>
    <p>${escapeHTML(message)}</p>
    ${action}
  </div>`;
}

export function inlineNotice(message, { tone = "info", iconName = "info", actionLabel = "", actionHref = "" } = {}) {
  return `<div class="notice notice--${tone}">
    <span class="notice__icon">${icon(iconName, 18)}</span>
    <div class="notice__body"><p>${escapeHTML(message)}</p>${actionHref ? `<a class="text-link" href="${escapeAttr(actionHref)}" data-link>${escapeHTML(actionLabel)} ${icon("arrowRight", 14)}</a>` : ""}</div>
  </div>`;
}

export function skeletonCards(count = 3) {
  return `<div class="skeleton-grid">${Array.from({ length: count })
    .map(() => `<div class="skeleton-card"><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--title"></div><div class="skeleton-line"></div><div class="skeleton-line skeleton-line--medium"></div></div>`)
    .join("")}</div>`;
}

export function bandRing(band = 0, { size = 150, label = "Estimated band" } = {}) {
  const safeBand = Number(band) || 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const fraction = clamp(safeBand / 9, 0, 1);
  return `<div class="band-ring" style="--ring-size:${size}px">
    <svg viewBox="0 0 140 140" aria-hidden="true">
      <circle class="band-ring__track" cx="70" cy="70" r="${radius}"/>
      <circle class="band-ring__value" cx="70" cy="70" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - fraction)}"/>
    </svg>
    <div class="band-ring__text"><strong>${safeBand.toFixed(1)}</strong><span>${escapeHTML(label)}</span></div>
  </div>`;
}

export function progressRing(percent = 0, { size = 92, label = "" } = {}) {
  const safe = clamp(Number(percent) || 0, 0, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return `<div class="small-ring" style="--ring-size:${size}px">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="small-ring__track" cx="50" cy="50" r="${radius}"/>
      <circle class="small-ring__value" cx="50" cy="50" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - safe / 100)}"/>
    </svg>
    <span class="small-ring__label"><strong>${Math.round(safe)}%</strong>${label ? `<small>${escapeHTML(label)}</small>` : ""}</span>
  </div>`;
}

export function setupFocusStyles() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") document.body.classList.add("using-keyboard");
  });
  document.addEventListener("mousedown", () => document.body.classList.remove("using-keyboard"));
}

export function optionClass(selected = false) {
  return selected ? "choice is-selected" : "choice";
}

export function seededShuffle(array, seed = Date.now()) {
  const output = [...array];
  let state = seed % 2147483647;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

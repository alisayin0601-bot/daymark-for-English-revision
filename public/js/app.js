import { appShellHTML, syncShellSummary } from "./components.js";
import { icon } from "./icons.js";
import { initRouter, navigate } from "./router.js";
import { bootstrapApp, checkSession, clearSession, store } from "./store.js";
import { initTheme } from "./theme.js";
import { setLang, toggleLang } from "./i18n.js";
import { closeModal, setupFocusStyles, skeletonCards, toast } from "./ui.js";
import { openAuthModal } from "./views/auth.js";
import { renderPublicHome } from "./views/public-home.js";

const appRoot = document.getElementById("app");
let currentCleanup = null;
let routeToken = 0;
let aiLoaded = false;
let currentController = null;
let pendingPath = "/";

const APP_VIEWS = {
  today: async () => ({ render: (await import("./views/today.js")).renderToday, title: "Today" }),
  reading: async () => ({ render: (await import("./views/reading.js")).renderReading, title: "Reading" }),
  "reading-books": async () => ({ render: (await import("./views/reading-books.js")).renderReadingBooks, title: "Reading books" }),
  writing: async () => ({ render: (await import("./views/writing.js")).renderWriting, title: "Writing" }),
  speaking: async () => ({ render: (await import("./views/speaking.js")).renderSpeaking, title: "Speaking" }),
  grammar: async () => ({ render: (await import("./views/grammar.js")).renderGrammar, title: "Grammar" }),
  listening: async () => ({ render: (await import("./views/listening.js")).renderListening, title: "Listening" }),
  mistakes: async () => ({ render: (await import("./views/mistakes.js")).renderMistakes, title: "Mistake Book" }),
  vocabulary: async () => ({ render: (await import("./views/vocabulary.js")).renderVocabulary, title: "Vocabulary" }),
  "word-study": async () => ({ render: (await import("./views/word-study.js")).renderWordStudy, title: "Word study" }),
  settings: async () => ({ render: (await import("./views/settings.js")).renderSettings, title: "Settings" })
};

function cleanupCurrent() {
  if (typeof currentCleanup === "function") {
    try {
      currentCleanup();
    } catch (error) {
      console.warn("[app] cleanup failed", error);
    }
  }
  currentCleanup = null;
  if (currentController) currentController.abort();
  currentController = null;
}

function finishBoot() {
  const boot = appRoot.querySelector(".boot-screen");
  if (boot) boot.remove();
}

function openNav() {
  document.body.classList.add("nav-open");
  document.querySelector(".sidebar__close")?.focus({ preventScroll: true });
}

function closeNav() {
  document.body.classList.remove("nav-open");
}

function pageSkeleton() {
  return `<div class="page-loading page-enter">
    <div class="skeleton-line skeleton-line--eyebrow"></div>
    <div class="skeleton-line skeleton-line--heading"></div>
    <div class="skeleton-line skeleton-line--medium"></div>
    <div class="loading-panels">${skeletonCards(3)}</div>
  </div>`;
}

function escapeMessage(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function fatalView(error) {
  console.error("[view]", error);
  return `<div class="fatal-view">
    <div class="fatal-view__mark">${icon("alert", 24)}</div>
    <p class="eyebrow">Something went wrong</p>
    <h1>This page could not load.</h1>
    <p>${escapeMessage(error?.message || "Your saved work is safe.")}</p>
    <button class="btn btn--primary" type="button" data-retry-view>Try again ${icon("rotate", 16)}</button>
  </div>`;
}

function notFoundView() {
  return `<div class="not-found-page">
    <div class="not-found-page__art">${icon("search", 28)}</div>
    <p class="eyebrow">404</p>
    <h1>Page not found.</h1>
    <p>The page may have moved, or the link may be out of date.</p>
    <div><a class="btn btn--primary" href="${store.user ? "/" : "/"}" data-link>Go to home</a></div>
  </div>`;
}

function showAuth(mode = "signin") {
  openAuthModal(mode, {
    onSuccess: () => {
      aiLoaded = false;
      const destination = pendingPath && pendingPath.startsWith("/app") ? pendingPath : "/";
      pendingPath = "/";
      if (window.location.pathname === destination) renderRoute();
      else navigate(destination, { replace: true });
    }
  });
}

async function renderPublic(token) {
  if (!store.initialized) await checkSession();
  if (token !== routeToken) return;
  document.title = "Daymark — IELTS practice";
  currentCleanup = renderPublicHome(appRoot);
  finishBoot();
}

async function renderAuthenticatedHome(token) {
  if (!store.initialized) await checkSession();
  if (token !== routeToken) return;
  if (!store.user) {
    await renderPublic(token);
    return;
  }
  await renderAppShell(token, "today", null);
}

async function renderAppShell(token, section, slug) {
  if (!aiLoaded) {
    try {
      await bootstrapApp();
      aiLoaded = true;
    } catch (error) {
      if (error.name === "AbortError") return;
      if (error.status === 401) {
        clearSession();
        pendingPath = window.location.pathname;
        await renderPublic(token);
        showAuth("signin");
        return;
      }
      console.warn("[app] bootstrap failed", error);
    }
  }
  if (token !== routeToken) return;
  const shellSummary = { ...(store.summary || {}), aiConfigured: store.aiConfigured };
  const activeSection = section === "reading-books" ? "reading" : section === "word-study" ? "vocabulary" : section;
  appRoot.innerHTML = appShellHTML(store.user, shellSummary, activeSection);
  finishBoot();
  closeNav();
  const viewRoot = document.getElementById("view-root");
  viewRoot.innerHTML = pageSkeleton();

  const controller = (currentController = new AbortController());
  try {
    const loaded = await APP_VIEWS[section]();
    if (token !== routeToken) return;
    document.title = `${loaded.title} — Daymark`;
    const result = await loaded.render(viewRoot, {
      signal: controller.signal,
      slug,
      section,
      user: store.user,
      summary: store.summary,
      aiConfigured: store.aiConfigured
    });
    if (token !== routeToken) {
      if (typeof result === "function") result();
      return;
    }
    currentCleanup = typeof result === "function" ? result : () => controller.abort();
  } catch (error) {
    if (error.name === "AbortError" || token !== routeToken) return;
    viewRoot.innerHTML = fatalView(error);
    viewRoot.querySelector("[data-retry-view]")?.addEventListener("click", () => renderRoute());
    currentCleanup = () => controller.abort();
  }
}

async function renderUnknown() {
  document.title = "Not found — Daymark";
  appRoot.innerHTML = notFoundView();
  currentCleanup = null;
  finishBoot();
}

async function renderRoute() {
  const token = ++routeToken;
  cleanupCurrent();
  closeModal();
  closeNav();
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  try {
    if (path === "/") {
      await renderAuthenticatedHome(token);
      return;
    }

    if (path === "/signin" || path === "/signup") {
      const mode = path === "/signup" ? "signup" : "signin";
      if (!store.initialized) await checkSession();
      if (store.user) {
        navigate("/", { replace: true });
        return;
      }
      document.title = "Daymark — IELTS practice";
      currentCleanup = renderPublicHome(appRoot);
      finishBoot();
      showAuth(mode);
      return;
    }

    if (path === "/app" || path.startsWith("/app/")) {
      if (!store.initialized) await checkSession();
      if (token !== routeToken) return;
      const parts = path.split("/").filter(Boolean);
      if (parts.length < 2 || parts[1] === "today") {
        navigate("/", { replace: true });
        return;
      }
      if (!store.user) {
        pendingPath = path;
        await renderPublic(token);
        showAuth("signin");
        return;
      }
      const section = parts[1];
      if (!APP_VIEWS[section]) {
        await renderUnknown();
        return;
      }
      await renderAppShell(token, section, parts[2] || null);
      return;
    }

    await renderUnknown();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("[route]", error);
    appRoot.innerHTML = fatalView(error);
    finishBoot();
  }
}

async function init() {
  initTheme();
  setupFocusStyles();
  initRouter(renderRoute);
  document.addEventListener("click", (event) => {
    const language = event.target.closest("[data-toggle-language]");
    if (language) {
      event.preventDefault();
      toggleLang();
      renderRoute();
      return;
    }
    const setLanguage = event.target.closest("[data-set-language]");
    if (setLanguage) {
      event.preventDefault();
      setLang(setLanguage.dataset.setLanguage);
      renderRoute();
      return;
    }
    const auth = event.target.closest("[data-open-auth]");
    if (auth) {
      event.preventDefault();
      showAuth(auth.dataset.openAuth || "signin");
      return;
    }
    const open = event.target.closest("[data-open-nav]");
    if (open) {
      event.preventDefault();
      openNav();
      return;
    }
    if (event.target.closest("[data-close-nav]")) {
      event.preventDefault();
      closeNav();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
  window.addEventListener("daymark:unauthorized", () => {
    clearSession();
    aiLoaded = false;
    if (window.location.pathname.startsWith("/app")) {
      pendingPath = window.location.pathname;
      renderRoute();
      toast("Please log in again to continue.", { type: "error" });
    }
  });
  window.addEventListener("daymark:session", () => {
    if (store.summary) syncShellSummary(store.summary);
  });
  window.addEventListener("daymark:refresh-route", () => {
    aiLoaded = false;
    renderRoute();
  });
  await checkSession();
  await renderRoute();
}

init();

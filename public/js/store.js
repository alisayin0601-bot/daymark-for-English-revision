import { api } from "./api.js";

export const store = {
  user: null,
  summary: null,
  aiConfigured: false,
  aiModel: null,
  aiProvider: null,
  initialized: false
};

function announce() {
  window.dispatchEvent(new CustomEvent("daymark:session", { detail: { ...store } }));
}

export function setSession(user, summary = null, extra = {}) {
  store.user = user || null;
  store.summary = summary || store.summary || null;
  if ("aiConfigured" in extra) store.aiConfigured = Boolean(extra.aiConfigured);
  if ("aiModel" in extra) store.aiModel = extra.aiModel || null;
  if ("aiProvider" in extra) store.aiProvider = extra.aiProvider || null;
  store.initialized = true;
  announce();
}

export function clearSession() {
  store.user = null;
  store.summary = null;
  store.aiConfigured = false;
  store.aiModel = null;
  store.aiProvider = null;
  store.initialized = true;
  announce();
}

export async function checkSession({ signal } = {}) {
  try {
    const data = await api.get("/api/session", { signal });
    if (data.user) {
      store.user = data.user;
      store.summary = data.summary;
    } else {
      store.user = null;
      store.summary = null;
    }
    store.initialized = true;
    announce();
    return data.user;
  } catch (error) {
    if (error.name === "AbortError") throw error;
    store.initialized = true;
    return null;
  }
}

export async function bootstrapApp({ signal } = {}) {
  const data = await api.get("/api/bootstrap", { signal });
  setSession(data.user, data.summary, {
    aiConfigured: data.aiConfigured,
    aiModel: data.aiModel,
    aiProvider: data.aiProvider
  });
  return data;
}

export async function refreshSummary() {
  try {
    const data = await api.get("/api/summary");
    store.summary = data.summary;
    store.user = { ...store.user, streak: data.summary?.streak ?? store.user?.streak };
    announce();
    return data.summary;
  } catch {
    return store.summary;
  }
}

export function updateUser(patch) {
  if (!store.user) return;
  store.user = { ...store.user, ...patch };
  announce();
}

export function userInitials(name = "") {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  if (!pieces.length) return "W";
  if (pieces.length === 1) return pieces[0].slice(0, 2).toUpperCase();
  return (pieces[0][0] + pieces[pieces.length - 1][0]).toUpperCase();
}


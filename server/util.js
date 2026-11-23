const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function loadEnv(root) {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Shanghai";

function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dayKeyOffset(offset = 0, from = new Date()) {
  return dayKey(new Date(from.getTime() - offset * 86_400_000));
}

function dateFromKey(key) {
  return new Date(`${key}T12:00:00Z`);
}

function prettyDate(key) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(dateFromKey(key));
}

function longDate(key) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(dateFromKey(key));
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function nowMs() {
  return Date.now();
}

function futureMs(days) {
  return Date.now() + days * 86_400_000;
}

function sanitizeText(value, max = 5000) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim().slice(0, max);
}

function sanitizeMultiline(value, max = 20_000) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidLevel(level) {
  return ["5-6", "6-7", "7-8"].includes(level);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function scryptHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundHalf(value) {
  return Math.round(Number(value) * 2) / 2;
}

function parseJSON(text, fallback = null) {
  if (!text) return fallback;
  if (typeof text === "object") return text;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function stripCodeFences(text) {
  return String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function wordKey(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[^a-z'-]/g, "")
    .replace(/^['-]+|['-]+$/g, "")
    .slice(0, 80);
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function simpleHtmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  APP_TIMEZONE,
  loadEnv,
  dayKey,
  dayKeyOffset,
  dateFromKey,
  prettyDate,
  longDate,
  todayLabel,
  nowMs,
  futureMs,
  sanitizeText,
  sanitizeMultiline,
  normalizeEmail,
  isValidEmail,
  isValidLevel,
  randomToken,
  hashToken,
  scryptHash,
  verifyPassword,
  clamp,
  roundHalf,
  parseJSON,
  stripCodeFences,
  wordKey,
  titleCase,
  escapeRegExp,
  simpleHtmlEscape
};

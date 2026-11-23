const dbModule = require("./db");
const { parseCookies, serializeCookie, isSecureRequest } = require("./http");
const { randomToken, hashToken, dayKey } = require("./util");

const COOKIE_NAME = "daymark_session";
const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 86_400;

function db() {
  return dbModule.db;
}

function createSession(req, res, userId) {
  const token = randomToken(32);
  const now = Date.now();
  db()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, now + SESSION_DAYS * 86_400_000, now);
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "Lax",
      maxAge: SESSION_SECONDS
    })
  );
  return token;
}

function destroySession(req, res) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  res.setHeader(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, "", {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "Lax",
      maxAge: 0
    })
  );
}

function sessionUser(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.*, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token));
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  const { expires_at, password_hash, ...user } = row;
  return user;
}

function publicUser(row, { includeEmail = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    ...(includeEmail && !row.is_guest ? { email: row.email } : {}),
    level: row.level,
    streak: Number(row.streak_count) || 0,
    lastActiveDate: row.last_active_date || null,
    createdAt: row.created_at,
    joinedLabel: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
      new Date(row.created_at)
    )
  };
}

function cleanupSessions() {
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
}

function activeDay(user) {
  return user?.last_active_date === dayKey() || user?.last_active_date === dayKeyOffset(1);
}

function dayKeyOffset(offset) {
  return dayKey(new Date(Date.now() - offset * 86_400_000));
}

module.exports = { COOKIE_NAME, createSession, destroySession, sessionUser, publicUser, cleanupSessions };

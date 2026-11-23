const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = process.env.DAYMARK_DB_PATH || path.join(DATA_DIR, "daymark.db");

let db;

function initDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  migrateSchema();
  return db;
}

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((row) => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function migrateSchema() {
  ensureColumn("users", "memory_mode", "TEXT NOT NULL DEFAULT 'mixed'");
  ensureColumn("users", "memory_words", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("users", "memory_mistakes", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("users", "points", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("users", "daily_goal", "INTEGER NOT NULL DEFAULT 3");
  ensureColumn("users", "active_reading_article_id", "INTEGER");
  ensureColumn("daily_tasks", "kind", "TEXT NOT NULL DEFAULT 'practice'");
  ensureColumn("vocabulary", "book_id", "INTEGER REFERENCES word_books(id) ON DELETE CASCADE");
  ensureColumn("vocabulary", "meaning_zh", "TEXT");
  ensureColumn("vocabulary", "example_zh", "TEXT");
  ensureColumn("vocabulary", "memory_step", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("vocabulary", "memory_started_at", "INTEGER");
  ensureColumn("vocabulary", "memory_done_at", "INTEGER");
  ensureColumn("mistakes", "memory_step", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("mistakes", "next_review_at", "INTEGER");
  ensureColumn("mistakes", "memory_started_at", "INTEGER");
  ensureColumn("mistakes", "memory_done_at", "INTEGER");
  db.exec("CREATE INDEX IF NOT EXISTS idx_vocab_book ON vocabulary(book_id, created_at DESC);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_mistakes_review ON mistakes(user_id, status, next_review_at);");
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  level TEXT NOT NULL DEFAULT '6-7',
  is_guest INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS passages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  style TEXT,
  topic TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  minutes INTEGER NOT NULL DEFAULT 5,
  content_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'studio',
  is_daily INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_passages_user ON passages(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_passages_daily ON passages(user_id, date_key, level) WHERE is_daily = 1;

CREATE TABLE IF NOT EXISTS reading_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id INTEGER NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_attempts_user ON reading_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES word_books(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  word_key TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  interval_index INTEGER NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  next_review_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(book_id, word_key)
);
CREATE INDEX IF NOT EXISTS idx_vocab_due ON vocabulary(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocab_book_word ON vocabulary(book_id, word_key);

CREATE TABLE IF NOT EXISTS vocab_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  previous_index INTEGER NOT NULL,
  new_index INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL,
  next_review_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user ON vocab_reviews(user_id, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS word_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  template_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_word_books_user ON word_books(user_id, created_at ASC);

CREATE TABLE IF NOT EXISTS reading_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_books_user ON reading_books(user_id, created_at ASC);

CREATE TABLE IF NOT EXISTS daily_task_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  seeded INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, date_key)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'practice',
  done INTEGER NOT NULL DEFAULT 0,
  awarded INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date_key, position);
CREATE INDEX IF NOT EXISTS idx_daily_task_days_user ON daily_task_days(user_id, date_key);

CREATE TABLE IF NOT EXISTS reading_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES reading_books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'custom',
  source_reading_id INTEGER,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_articles_book ON reading_articles(book_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT,
  question TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'choice',
  options_json TEXT,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  times_seen INTEGER NOT NULL DEFAULT 1,
  times_correct INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_status ON mistakes(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS grammar_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grammar_progress_user ON grammar_progress(user_id, topic_slug);

CREATE TABLE IF NOT EXISTS writing_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  task_type INTEGER NOT NULL,
  question_id TEXT,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  band REAL,
  feedback_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_writing_user ON writing_submissions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS speaking_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  prompt TEXT NOT NULL,
  transcript TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  band REAL,
  feedback_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'demo',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_speaking_user ON speaking_submissions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS listening_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'British',
  title TEXT NOT NULL,
  intro TEXT,
  script TEXT NOT NULL,
  questions_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'studio',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listening_user ON listening_exercises(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS listening_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES listening_exercises(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  type TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 5,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON activity_events(user_id, date_key);

CREATE TABLE IF NOT EXISTS dictionary_cache (
  word_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL
);
`;

function count(sql, params = []) {
  return db.prepare(sql).get(...params)?.n || 0;
}

module.exports = { initDb, get db() { return db; }, DB_PATH, SCHEMA, count };

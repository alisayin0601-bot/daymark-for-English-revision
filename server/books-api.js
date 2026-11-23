const crypto = require("node:crypto");
const dbModule = require("./db");
const { wordKey, nowMs, dayKey, sanitizeText, sanitizeMultiline, clamp } = require("./util");
const { ok, fail, readJson } = require("./http");
const { builtinBooks, builtinBook } = require("./builtin-books");
const { getSummary, recordActivity } = require("./activity");
const {
  MODES,
  normalizeMode,
  prefsFromUser,
  modeInfo,
  startedSchedule,
  advanceSchedule
} = require("./memory");

const MAX_WORD_BOOKS = 5;
const MAX_WORDS_PER_BOOK = 1000;
const MAX_READING_BOOKS = 3;
const MAX_ARTICLES_PER_BOOK = 30;
const GENERIC_MEANINGS = [
  "重要的",
  "有用的",
  "复杂的",
  "明显的",
  "逐渐的",
  "有限的",
  "可靠的",
  "普遍的"
];

function db() {
  return dbModule.db;
}

function freshUser(userId) {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

function readUser(userId) {
  return freshUser(userId);
}

function memoryPrefs(userId) {
  return prefsFromUser(readUser(userId));
}

function countBooks(userId) {
  return db().prepare("SELECT COUNT(*) AS n FROM word_books WHERE user_id = ?").get(userId).n || 0;
}

function ensureDefaultBook(userId) {
  let book = db()
    .prepare("SELECT * FROM word_books WHERE user_id = ? ORDER BY created_at ASC, id ASC LIMIT 1")
    .get(userId);
  if (!book) {
    if (countBooks(userId) >= MAX_WORD_BOOKS) return null;
    const now = nowMs();
    const result = db()
      .prepare("INSERT INTO word_books (user_id, name, color, is_builtin, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)")
      .run(userId, "My words", "#3c6483", now, now);
    book = db().prepare("SELECT * FROM word_books WHERE id = ?").get(Number(result.lastInsertRowid));
  }
  db().prepare("UPDATE vocabulary SET book_id = ? WHERE user_id = ? AND book_id IS NULL").run(book.id, userId);
  return book;
}

function migrateLooseWords(userId) {
  const loose = db()
    .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND book_id IS NULL")
    .get(userId).n || 0;
  if (loose > 0) ensureDefaultBook(userId);
}

function builtinMetaByKey() {
  return new Map(builtinBooks().map((book) => [book.key, book]));
}

function wordBookView(row, prefs) {
  const counts = db()
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN memory_started_at IS NOT NULL AND memory_done_at IS NULL AND next_review_at <= ? THEN 1 ELSE 0 END) AS due
       FROM vocabulary WHERE user_id = ? AND book_id = ?`
    )
    .get(nowMs(), row.user_id, row.id);
  const meta = row.template_key ? builtinMetaByKey().get(row.template_key) : null;
  return {
    id: row.id,
    name: row.name,
    nameZh: meta?.nameZh || row.name,
    color: row.color || "#3c6483",
    isBuiltin: Boolean(row.is_builtin),
    templateKey: row.template_key || null,
    wordCount: counts.total || 0,
    dueCount: prefs.words ? counts.due || 0 : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function handleWordBooks(req, res, ctx) {
  migrateLooseWords(ctx.user.id);
  const rows = db()
    .prepare("SELECT * FROM word_books WHERE user_id = ? ORDER BY created_at ASC, id ASC")
    .all(ctx.user.id);
  const prefs = memoryPrefs(ctx.user.id);
  const added = new Set(rows.map((row) => row.template_key).filter(Boolean));
  return ok(res, {
    books: rows.map((row) => wordBookView(row, prefs)),
    builtin: builtinBooks().map((book) => ({ ...book, added: added.has(book.key) })),
    prefs,
    limits: { books: MAX_WORD_BOOKS, wordsPerBook: MAX_WORDS_PER_BOOK }
  });
}

async function handleWordBookCreate(req, res, ctx) {
  const body = await readJson(req);
  const name = sanitizeText(body.name, 60);
  if (!name) return fail(res, 400, "Give the word book a name.");
  if (countBooks(ctx.user.id) >= MAX_WORD_BOOKS) {
    return fail(res, 409, `You can keep up to ${MAX_WORD_BOOKS} word books.`);
  }
  const now = nowMs();
  const result = db()
    .prepare("INSERT INTO word_books (user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(ctx.user.id, name, sanitizeText(body.color, 20) || "#3c6483", now, now);
  const row = db().prepare("SELECT * FROM word_books WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, { book: wordBookView(row, memoryPrefs(ctx.user.id)) }, 201);
}

async function handleWordBookUpdate(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That word book could not be found.");
  const body = await readJson(req);
  const name = sanitizeText(body.name, 60);
  if (!name) return fail(res, 400, "Give the word book a name.");
  db().prepare("UPDATE word_books SET name = ?, updated_at = ? WHERE id = ?").run(name, nowMs(), row.id);
  const updated = db().prepare("SELECT * FROM word_books WHERE id = ?").get(row.id);
  return ok(res, { book: wordBookView(updated, memoryPrefs(ctx.user.id)) });
}

async function handleWordBookDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That word book could not be found.");
  db().prepare("DELETE FROM vocabulary WHERE book_id = ? AND user_id = ?").run(row.id, ctx.user.id);
  db().prepare("DELETE FROM word_books WHERE id = ?").run(row.id);
  return ok(res, { deleted: true });
}

function parseImportText(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const entries = [];
  for (const line of lines) {
    const parts = line.split(/\t|\s*\|\s*|\s*,\s*/).map((part) => part.trim());
    if (!parts[0] || /^word$/i.test(parts[0])) continue;
    entries.push({
      word: parts[0],
      phonetic: parts[1] || "",
      partOfSpeech: parts[2] || "",
      meaningZh: parts[3] || "",
      exampleEn: parts[4] || "",
      exampleZh: parts[5] || ""
    });
  }
  return entries;
}

function normalizeWords(body) {
  if (Array.isArray(body.words)) return body.words;
  if (typeof body.text === "string") return parseImportText(body.text);
  return [];
}

function prepareWordEntry(raw) {
  const word = sanitizeText(raw.word, 80);
  const meaningZh = sanitizeText(raw.meaningZh || raw.meaning || raw.definition, 900);
  if (!word || word.length < 1 || !meaningZh) return null;
  return {
    word,
    key: wordKey(word),
    phonetic: sanitizeText(raw.phonetic, 80),
    partOfSpeech: sanitizeText(raw.partOfSpeech || raw.pos, 50),
    meaningZh,
    exampleEn: sanitizeText(raw.exampleEn || raw.example, 700),
    exampleZh: sanitizeText(raw.exampleZh || raw.exampleTranslation, 700)
  };
}

async function handleWordBookWords(req, res, ctx) {
  const book = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book) return fail(res, 404, "That word book could not be found.");
  const body = await readJson(req);
  const rawEntries = normalizeWords(body).slice(0, MAX_WORDS_PER_BOOK);
  if (!rawEntries.length) return fail(res, 400, "Add at least one word.");
  const existing = new Set(
    db().prepare("SELECT word_key FROM vocabulary WHERE user_id = ? AND book_id = ?").all(ctx.user.id, book.id).map((row) => row.word_key)
  );
  const used = db()
    .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND book_id = ?")
    .get(ctx.user.id, book.id).n || 0;
  let remaining = MAX_WORDS_PER_BOOK - used;
  if (remaining <= 0) return fail(res, 409, "This word book already has 1,000 words.");
  const now = nowMs();
  const insert = db().prepare(
    `INSERT INTO vocabulary
     (user_id, book_id, word, word_key, phonetic, part_of_speech, definition, meaning_zh, example, example_zh, source, interval_index, memory_step, next_review_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 0, 0, 0, ?, ?)`
  );
  let added = 0;
  let skipped = 0;
  db().exec("BEGIN");
  try {
    for (const raw of rawEntries) {
      if (remaining <= 0) break;
      const entry = prepareWordEntry(raw);
      if (!entry) {
        skipped += 1;
        continue;
      }
      if (existing.has(entry.key)) {
        skipped += 1;
        continue;
      }
      insert.run(
        ctx.user.id,
        book.id,
        entry.word,
        entry.key,
        entry.phonetic,
        entry.partOfSpeech,
        entry.meaningZh,
        entry.meaningZh,
        entry.exampleEn,
        entry.exampleZh,
        now,
        now
      );
      existing.add(entry.key);
      added += 1;
      remaining -= 1;
    }
    db().exec("COMMIT");
  } catch (error) {
    db().exec("ROLLBACK");
    throw error;
  }
  return ok(res, {
    added,
    skipped,
    book: wordBookView(book, memoryPrefs(ctx.user.id))
  });
}

async function handleWordBookDetail(req, res, ctx) {
  const book = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book) return fail(res, 404, "That word book could not be found.");
  const words = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND book_id = ? ORDER BY created_at DESC, id DESC")
    .all(ctx.user.id, book.id)
    .map((row) => ({
      id: row.id,
      word: row.word,
      phonetic: row.phonetic || "",
      partOfSpeech: row.part_of_speech || "",
      meaningZh: row.meaning_zh || row.definition || "",
      exampleEn: row.example || "",
      exampleZh: row.example_zh || "",
      memoryStep: Number(row.memory_step) || 0,
      nextReviewAt: Number(row.next_review_at) || 0,
      learned: Boolean(row.memory_started_at),
      done: Boolean(row.memory_done_at)
    }));
  return ok(res, {
    book: wordBookView(book, memoryPrefs(ctx.user.id)),
    words,
    prefs: memoryPrefs(ctx.user.id)
  });
}

async function handleWordBookWordDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM vocabulary WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.wordId), ctx.user.id);
  if (!row) return fail(res, 404, "That word could not be found.");
  const book = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book || Number(row.book_id) !== Number(book.id)) return fail(res, 404, "That word is not in this book.");
  db().prepare("DELETE FROM vocabulary WHERE id = ?").run(row.id);
  return ok(res, { deleted: true, book: wordBookView(book, memoryPrefs(ctx.user.id)) });
}

async function handleBuiltinAdd(req, res, ctx) {
  const book = builtinBook(ctx.params.key);
  if (!book) return fail(res, 404, "That built-in word book is not available.");
  if (countBooks(ctx.user.id) >= MAX_WORD_BOOKS) {
    return fail(res, 409, `You can keep up to ${MAX_WORD_BOOKS} word books. Delete one first.`);
  }
  const existingBook = db()
    .prepare("SELECT * FROM word_books WHERE user_id = ? AND template_key = ?")
    .get(ctx.user.id, book.key);
  if (existingBook) return fail(res, 409, "This built-in book is already in your library.");
  if (book.words.length > MAX_WORDS_PER_BOOK) {
    return fail(res, 400, "This built-in book is larger than the 1,000-word limit.");
  }
  const now = nowMs();
  const result = db()
    .prepare("INSERT INTO word_books (user_id, name, color, is_builtin, template_key, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)")
    .run(ctx.user.id, book.name, "#55728d", book.key, now, now);
  const bookId = Number(result.lastInsertRowid);
  const existingKeys = new Set(
    db().prepare("SELECT word_key FROM vocabulary WHERE user_id = ? AND book_id = ?").all(ctx.user.id, bookId).map((row) => row.word_key)
  );
  const insert = db().prepare(
    `INSERT INTO vocabulary
     (user_id, book_id, word, word_key, phonetic, part_of_speech, definition, meaning_zh, example, example_zh, source, interval_index, memory_step, next_review_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'builtin', 0, 0, 0, ?, ?)`
  );
  let added = 0;
  db().exec("BEGIN");
  try {
    for (const raw of book.words) {
      const entry = prepareWordEntry(raw);
      if (!entry || existingKeys.has(entry.key)) continue;
      insert.run(
        ctx.user.id,
        bookId,
        entry.word,
        entry.key,
        entry.phonetic,
        entry.partOfSpeech,
        entry.meaningZh,
        entry.meaningZh,
        entry.exampleEn,
        entry.exampleZh,
        now,
        now
      );
      existingKeys.add(entry.key);
      added += 1;
    }
    db().exec("COMMIT");
  } catch (error) {
    db().exec("ROLLBACK");
    db().prepare("DELETE FROM word_books WHERE id = ?").run(bookId);
    throw error;
  }
  const row = db().prepare("SELECT * FROM word_books WHERE id = ?").get(bookId);
  return ok(res, { book: wordBookView(row, memoryPrefs(ctx.user.id)), added }, 201);
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = crypto.randomInt(index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function meaningPool(userId, bookId, partOfSpeech) {
  const rows = db()
    .prepare("SELECT meaning_zh, definition, part_of_speech FROM vocabulary WHERE user_id = ? ORDER BY CASE WHEN book_id = ? THEN 0 ELSE 1 END")
    .all(userId, bookId);
  const all = [];
  const samePos = [];
  for (const row of rows) {
    const meaning = String(row.meaning_zh || row.definition || "").trim();
    if (!meaning) continue;
    all.push(meaning);
    if (partOfSpeech && row.part_of_speech === partOfSpeech) samePos.push(meaning);
  }
  return { all: [...new Set(all)], samePos: [...new Set(samePos)] };
}

function buildMeaningOptions(correct, pool, partOfSpeech) {
  const normalized = correct.toLowerCase();
  const candidates = [...new Set([...pool.samePos, ...pool.all])].filter((item) => item.toLowerCase() !== normalized);
  const distractors = shuffle(candidates).slice(0, 3);
  while (distractors.length < 3) {
    const fallback = GENERIC_MEANINGS[distractors.length];
    if (!distractors.includes(fallback) && fallback !== correct) distractors.push(fallback);
    else distractors.push(`选项 ${distractors.length + 1}`);
  }
  const options = shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
}

async function handleWordBookSession(req, res, ctx) {
  const book = db()
    .prepare("SELECT * FROM word_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book) return fail(res, 404, "That word book could not be found.");
  const body = await readJson(req);
  const count = clamp(Math.floor(Number(body.count) || 10), 1, 100);
  const prefs = memoryPrefs(ctx.user.id);
  const now = nowMs();
  const rows = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND book_id = ? ORDER BY created_at ASC, id ASC")
    .all(ctx.user.id, book.id);
  if (!rows.length) return fail(res, 400, "Add some words to this book first.");
  const due = prefs.words
    ? rows.filter((row) => row.memory_started_at && !row.memory_done_at && Number(row.next_review_at) <= now)
    : [];
  const unseen = rows.filter((row) => !row.memory_started_at);
  const rest = rows.filter((row) => !due.includes(row) && !unseen.includes(row));
  const selected = [...due, ...unseen, ...rest].slice(0, count);
  const mode = prefs.mode;
  const firstOffset = modeInfo(mode).offsets[0];
  const updateNew = db().prepare(
    "UPDATE vocabulary SET memory_started_at = ?, memory_step = 0, next_review_at = ?, updated_at = ? WHERE id = ?"
  );
  for (const row of selected) {
    if (row.memory_started_at) continue;
    updateNew.run(now, prefs.words ? now + firstOffset : 0, now, row.id);
  }
  const refreshed = new Map(
    db()
      .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND book_id = ?")
      .all(ctx.user.id, book.id)
      .map((row) => [row.id, row])
  );
  const pool = meaningPool(ctx.user.id, book.id);
  const words = selected.map((selectedRow) => {
    const row = refreshed.get(selectedRow.id) || selectedRow;
    const correct = String(row.meaning_zh || row.definition || "").trim();
    const { options, correctIndex } = buildMeaningOptions(correct, pool, row.part_of_speech);
    return {
      id: row.id,
      word: row.word,
      phonetic: row.phonetic || "",
      partOfSpeech: row.part_of_speech || "",
      meaningZh: correct,
      exampleEn: row.example || "",
      exampleZh: row.example_zh || "",
      options,
      correctIndex,
      isNew: !selectedRow.memory_started_at,
      memoryStep: Number(row.memory_step) || 0,
      nextReviewAt: Number(row.next_review_at) || 0
    };
  });
  return ok(res, {
    book: wordBookView(book, prefs),
    words,
    count: words.length,
    mode,
    prefs,
    dueCount: due.length,
    newCount: unseen.length
  });
}

async function handleWordAnswer(req, res, ctx) {
  const word = db()
    .prepare("SELECT * FROM vocabulary WHERE id = ? AND user_id = ? AND book_id = ?")
    .get(Number(ctx.params.wordId), ctx.user.id, Number(ctx.params.id));
  if (!word) return fail(res, 404, "That word could not be found.");
  const body = await readJson(req);
  const initial = body.initial === true;
  const prefs = memoryPrefs(ctx.user.id);
  const now = nowMs();
  let feedback = { done: false, nextReviewAt: 0, step: 0 };
  if (!initial && prefs.words) {
    const schedule = advanceSchedule({
      mode: prefs.mode,
      startedAt: word.memory_started_at || now,
      step: word.memory_step,
      correct: body.correct !== false,
      now
    });
    feedback = schedule;
    db()
      .prepare(
        `UPDATE vocabulary
         SET memory_started_at = ?, memory_step = ?, next_review_at = ?, memory_done_at = ?, review_count = review_count + 1, updated_at = ?
         WHERE id = ?`
      )
      .run(
        schedule.startedAt || now,
        schedule.step,
        schedule.nextAt || 0,
        schedule.done ? now : null,
        now,
        word.id
      );
    db()
      .prepare(
        `INSERT INTO vocab_reviews (user_id, vocab_id, rating, previous_index, new_index, reviewed_at, next_review_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        ctx.user.id,
        word.id,
        body.correct === false ? "again" : body.correct && schedule.done ? "easy" : "good",
        Number(word.memory_step) || 0,
        schedule.step,
        now,
        schedule.nextAt || 0
      );
    recordActivity(ctx.user.id, "vocabulary", 2, "review");
  } else {
    db().prepare("UPDATE vocabulary SET review_count = review_count + 1, updated_at = ? WHERE id = ?").run(now, word.id);
    recordActivity(ctx.user.id, "vocabulary", 1, "study");
  }
  const updated = db().prepare("SELECT * FROM vocabulary WHERE id = ?").get(word.id);
  return ok(res, {
    correct: body.correct !== false,
    initial,
    done: Boolean(feedback.done),
    nextReviewAt: feedback.nextAt || 0,
    step: feedback.step,
    wordId: word.id,
    summary: getSummary(ctx.user.id)
  });
}

async function handleMemoryGet(req, res, ctx) {
  const prefs = memoryPrefs(ctx.user.id);
  return ok(res, {
    prefs,
    modes: Object.fromEntries(Object.values(MODES).map((mode) => [mode.key, mode.offsets])),
    modesMs: Object.fromEntries(Object.values(MODES).map((mode) => [mode.key, mode.offsets]))
  });
}

async function handleMemoryUpdate(req, res, ctx) {
  const body = await readJson(req);
  const current = readUser(ctx.user.id);
  const mode = body.mode === undefined ? normalizeMode(current.memory_mode) : normalizeMode(body.mode);
  const words = body.words === undefined ? Number(current.memory_words) === 1 : Boolean(body.words);
  const mistakes = body.mistakes === undefined ? Number(current.memory_mistakes) === 1 : Boolean(body.mistakes);
  const now = nowMs();
  db()
    .prepare("UPDATE users SET memory_mode = ?, memory_words = ?, memory_mistakes = ?, updated_at = ? WHERE id = ?")
    .run(mode, words ? 1 : 0, mistakes ? 1 : 0, now, ctx.user.id);
  if (mode !== normalizeMode(current.memory_mode)) {
    const first = modeInfo(mode).offsets[0];
    db()
      .prepare(
        "UPDATE vocabulary SET memory_step = 0, memory_started_at = ?, next_review_at = ?, updated_at = ? WHERE user_id = ? AND memory_started_at IS NOT NULL AND memory_done_at IS NULL"
      )
      .run(now, now + first, now, ctx.user.id);
    db()
      .prepare(
        "UPDATE mistakes SET memory_step = 0, memory_started_at = ?, next_review_at = ?, updated_at = ? WHERE user_id = ? AND status = 'open'"
      )
      .run(now, now + first, now, ctx.user.id);
  }
  return ok(res, { prefs: { mode, words, mistakes } });
}

function readingBookView(row) {
  const count = db().prepare("SELECT COUNT(*) AS n FROM reading_articles WHERE book_id = ?").get(row.id).n || 0;
  return {
    id: row.id,
    name: row.name,
    color: row.color || "#55728d",
    articleCount: count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function handleReadingBooks(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM reading_books WHERE user_id = ? ORDER BY created_at ASC, id ASC")
    .all(ctx.user.id);
  return ok(res, {
    books: rows.map(readingBookView),
    limits: { books: MAX_READING_BOOKS, articlesPerBook: MAX_ARTICLES_PER_BOOK }
  });
}

async function handleReadingBookCreate(req, res, ctx) {
  const body = await readJson(req);
  const name = sanitizeText(body.name, 60);
  if (!name) return fail(res, 400, "Give the reading book a name.");
  const count = db().prepare("SELECT COUNT(*) AS n FROM reading_books WHERE user_id = ?").get(ctx.user.id).n || 0;
  if (count >= MAX_READING_BOOKS) return fail(res, 409, `You can keep up to ${MAX_READING_BOOKS} reading books.`);
  const now = nowMs();
  const result = db()
    .prepare("INSERT INTO reading_books (user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
    .run(ctx.user.id, name, sanitizeText(body.color, 20) || "#55728d", now, now);
  const row = db().prepare("SELECT * FROM reading_books WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, { book: readingBookView(row) }, 201);
}

async function handleReadingBookUpdate(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM reading_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That reading book could not be found.");
  const body = await readJson(req);
  const name = sanitizeText(body.name, 60);
  if (!name) return fail(res, 400, "Give the reading book a name.");
  db().prepare("UPDATE reading_books SET name = ?, updated_at = ? WHERE id = ?").run(name, nowMs(), row.id);
  return ok(res, { book: readingBookView(db().prepare("SELECT * FROM reading_books WHERE id = ?").get(row.id)) });
}

async function handleReadingBookDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM reading_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That reading book could not be found.");
  const active = db()
    .prepare("SELECT id FROM reading_articles WHERE book_id = ? AND user_id = ? AND id = (SELECT active_reading_article_id FROM users WHERE id = ?)")
    .get(row.id, ctx.user.id, ctx.user.id);
  if (active) {
    db().prepare("UPDATE users SET active_reading_article_id = NULL, updated_at = ? WHERE id = ?").run(nowMs(), ctx.user.id);
    db().prepare("DELETE FROM passages WHERE user_id = ? AND date_key = ? AND is_daily = 1 AND source = 'book'").run(ctx.user.id, dayKey());
  }
  db().prepare("DELETE FROM reading_articles WHERE book_id = ? AND user_id = ?").run(row.id, ctx.user.id);
  db().prepare("DELETE FROM reading_books WHERE id = ?").run(row.id);
  return ok(res, { deleted: true });
}

function defaultArticleTitle() {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(new Date()) + " 阅读";
}

function countWords(text) {
  const latin = (String(text).match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
  const han = (String(text).match(/[\u4e00-\u9fff]/g) || []).length;
  return latin + han;
}

async function handleReadingBookDetail(req, res, ctx) {
  const book = db()
    .prepare("SELECT * FROM reading_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book) return fail(res, 404, "That reading book could not be found.");
  const articles = db()
    .prepare("SELECT id, title, source, word_count, created_at, updated_at FROM reading_articles WHERE book_id = ? AND user_id = ? ORDER BY created_at DESC, id DESC")
    .all(book.id, ctx.user.id);
  return ok(res, { book: readingBookView(book), articles });
}

async function handleReadingArticleCreate(req, res, ctx) {
  const book = db()
    .prepare("SELECT * FROM reading_books WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!book) return fail(res, 404, "That reading book could not be found.");
  const count = db().prepare("SELECT COUNT(*) AS n FROM reading_articles WHERE book_id = ?").get(book.id).n || 0;
  if (count >= MAX_ARTICLES_PER_BOOK) return fail(res, 409, `Each reading book can hold up to ${MAX_ARTICLES_PER_BOOK} articles.`);
  const body = await readJson(req);
  const title = sanitizeText(body.title, 160) || defaultArticleTitle();
  const textBody = sanitizeMultiline(body.body, 120_000);
  if (!textBody.trim()) return fail(res, 400, "Paste or write the article text.");
  const now = nowMs();
  const result = db()
    .prepare(
      "INSERT INTO reading_articles (user_id, book_id, title, body, source, source_reading_id, word_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      ctx.user.id,
      book.id,
      title,
      textBody.trim(),
      sanitizeText(body.source, 20) || "custom",
      body.sourceReadingId ? Number(body.sourceReadingId) : null,
      countWords(textBody),
      now,
      now
    );
  db().prepare("UPDATE reading_books SET updated_at = ? WHERE id = ?").run(now, book.id);
  return ok(
    res,
    {
      article: db()
        .prepare("SELECT id, title, body, source, word_count, created_at, updated_at FROM reading_articles WHERE id = ?")
        .get(Number(result.lastInsertRowid)),
      book: readingBookView(book)
    },
    201
  );
}

async function handleReadingArticleGet(req, res, ctx) {
  const row = db()
    .prepare("SELECT a.* FROM reading_articles a JOIN reading_books b ON b.id = a.book_id WHERE a.id = ? AND a.user_id = ? AND b.user_id = ?")
    .get(Number(ctx.params.articleId), ctx.user.id, ctx.user.id);
  if (!row) return fail(res, 404, "That article could not be found.");
  return ok(res, { article: row });
}

async function handleReadingArticleDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM reading_articles WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.articleId), ctx.user.id);
  if (!row) return fail(res, 404, "That article could not be found.");
  const user = db().prepare("SELECT active_reading_article_id FROM users WHERE id = ?").get(ctx.user.id);
  if (Number(user?.active_reading_article_id) === Number(row.id)) {
    db().prepare("UPDATE users SET active_reading_article_id = NULL, updated_at = ? WHERE id = ?").run(nowMs(), ctx.user.id);
    db().prepare("DELETE FROM passages WHERE user_id = ? AND date_key = ? AND is_daily = 1 AND source = 'book'").run(ctx.user.id, dayKey());
  }
  db().prepare("DELETE FROM reading_articles WHERE id = ?").run(row.id);
  return ok(res, { deleted: true });
}

module.exports = {
  handleWordBooks,
  handleWordBookCreate,
  handleWordBookUpdate,
  handleWordBookDelete,
  handleWordBookWords,
  handleWordBookDetail,
  handleWordBookWordDelete,
  handleBuiltinAdd,
  handleWordBookSession,
  handleWordAnswer,
  handleMemoryGet,
  handleMemoryUpdate,
  handleReadingBooks,
  handleReadingBookCreate,
  handleReadingBookUpdate,
  handleReadingBookDelete,
  handleReadingBookDetail,
  handleReadingArticleCreate,
  handleReadingArticleGet,
  handleReadingArticleDelete,
  ensureDefaultBook
};

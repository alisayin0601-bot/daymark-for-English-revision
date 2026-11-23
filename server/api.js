const crypto = require("node:crypto");

const dbModule = require("./db");
const {
  dayKey,
  sanitizeText,
  sanitizeMultiline,
  normalizeEmail,
  isValidEmail,
  isValidLevel,
  scryptHash,
  verifyPassword,
  clamp,
  roundHalf,
  parseJSON,
  wordKey,
  nowMs
} = require("./util");
const {
  dailyReading,
  fallbackReading,
  normalizeReadingBankItem,
  readingPreview,
  writingPromptForTask,
  writingPromptById,
  speakingPromptForMode,
  listeningForLevel,
  wordOfTheDay,
  GRAMMAR_TOPICS,
  grammarTopic
} = require("./content");
const {
  aiConfigured,
  aiConfigured: isAiConfigured,
  GEMINI_MODEL,
  generateReading,
  evaluateWriting,
  evaluateSpeaking,
  generateListening,
  generateWritingPrompt,
  generateSpeakingPrompt,
  aiProviderInfo
} = require("./ai");
const { writingFeedback, speakingFeedback } = require("./feedback");
const { fetchDictionary } = require("./dictionary");
const { VOCAB_BANK } = require("./vocab-bank");
const { getSummary, recordActivity } = require("./activity");
const { prefsFromUser, startedSchedule, advanceSchedule } = require("./memory");
const {
  handleTaskCreate,
  handleTaskUpdate,
  handleTaskDelete,
  handleGoalUpdate,
  boardFor
} = require("./today");
const {
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
} = require("./books-api");
const {
  createSession,
  destroySession,
  publicUser
} = require("./session");
const {
  ok,
  fail,
  readJson,
  sameOrigin,
  clientIp
} = require("./http");

const SRS_INTERVALS = [1, 2, 4, 7, 15, 30];
const SESSION_LEVELS = new Set(["5-6", "6-7", "7-8"]);
const WRITING_MODES = new Set(["paragraph", "full"]);
const SPEAKING_MODES = new Set(["paragraph", "passage"]);
const STUDY_SOURCES = new Set(["reading", "manual", "writing", "speaking", "listening", "dashboard"]);
const VOCAB_RATINGS = new Set(["again", "good", "easy"]);

const authAttempts = new Map();
const aiUserUsage = new Map();
const aiGlobal = { date: dayKey(), count: 0 };
const AI_PER_USER_HOUR = clamp(Number(process.env.AI_REQUESTS_PER_HOUR) || 24, 3, 200);
const AI_GLOBAL_DAY = clamp(Number(process.env.AI_DAILY_LIMIT) || 150, 10, 10_000);

function db() {
  return dbModule.db;
}

function failFromError(res, error) {
  if (error?.status) return fail(res, error.status, error.message);
  console.error("[api]", error);
  return fail(res, 500, "Something went wrong on our side. Please try again.");
}

function freshUser(id) {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function authRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const list = (authAttempts.get(key) || []).filter((time) => now - time < windowMs);
  if (list.length >= limit) return false;
  list.push(now);
  authAttempts.set(key, list);
  return true;
}

function resetAuthRateLimit(key) {
  authAttempts.delete(key);
}

function aiQuota(userId) {
  if (!aiConfigured()) return { allowed: false, reason: "not-configured" };
  const today = dayKey();
  if (aiGlobal.date !== today) {
    aiGlobal.date = today;
    aiGlobal.count = 0;
  }
  if (aiGlobal.count >= AI_GLOBAL_DAY) return { allowed: false, reason: "global-limit" };
  const now = Date.now();
  const hits = (aiUserUsage.get(userId) || []).filter((time) => now - time < 3_600_000);
  if (hits.length >= AI_PER_USER_HOUR) return { allowed: false, reason: "user-limit" };
  hits.push(now);
  aiUserUsage.set(userId, hits);
  aiGlobal.count += 1;
  return { allowed: true, reason: null };
}

function aiFallbackReason(reason) {
  if (reason === "not-configured") {
    return "Gemini is not connected, so Daymark used its curated studio material. Add a free GEMINI_API_KEY for fresh AI content.";
  }
  if (reason === "global-limit" || reason === "user-limit") {
    return "The hourly AI budget is used up, so Daymark switched to studio material. Your limits reset automatically.";
  }
  return "The AI was unavailable, so Daymark switched to studio material.";
}

function publicPassage(row, { includeAnswers = false } = {}) {
  if (!row) return null;
  const content = parseJSON(row.content_json, {});
  const questions = Array.isArray(content.questions) ? content.questions : [];
  return {
    id: row.id,
    level: row.level,
    title: content.title || row.title,
    subtitle: content.subtitle || "",
    style: content.style || row.style || "editorial",
    topic: content.topic || row.topic || "",
    minutes: Number(content.minutes) || Number(row.minutes) || 5,
    wordCount: Number(content.wordCount) || Number(row.word_count) || 0,
    source: row.source,
    isDaily: Boolean(row.is_daily),
    createdAt: row.created_at,
    paragraphs: Array.isArray(content.paragraphs) ? content.paragraphs : [],
    glossary: Array.isArray(content.glossary) ? content.glossary : [],
    questions: questions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options,
      ...(includeAnswers ? { answer: q.answer, explanation: q.explanation } : {})
    }))
  };
}

function publicWriting(row, { full = false } = {}) {
  if (!row) return null;
  const feedback = parseJSON(row.feedback_json, {});
  return {
    id: row.id,
    mode: row.mode,
    taskType: Number(row.task_type),
    questionId: row.question_id,
    prompt: row.prompt,
    ...(full ? { content: row.content } : {}),
    wordCount: Number(row.word_count),
    band: Number(row.band),
    source: row.source,
    createdAt: row.created_at,
    ...(full ? { feedback } : {})
  };
}

function publicSpeaking(row, { full = false } = {}) {
  if (!row) return null;
  const feedback = parseJSON(row.feedback_json, {});
  return {
    id: row.id,
    mode: row.mode,
    prompt: row.prompt,
    ...(full ? { transcript: row.transcript } : {}),
    durationSeconds: Number(row.duration_seconds),
    band: Number(row.band),
    source: row.source,
    createdAt: row.created_at,
    ...(full ? { feedback } : {})
  };
}

function publicListening(row, { includeAnswers = false } = {}) {
  if (!row) return null;
  const questions = parseJSON(row.questions_json, []);
  return {
    id: row.id,
    level: row.level,
    topic: row.topic,
    accent: row.accent,
    title: row.title,
    intro: row.intro || "",
    script: row.script,
    source: row.source,
    createdAt: row.created_at,
    questions: questions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options,
      ...(includeAnswers ? { answer: q.answer, explanation: q.explanation } : {})
    }))
  };
}

function addMistake(userId, item) {
  const now = nowMs();
  const source = sanitizeText(item.source, 30);
  const category = sanitizeText(item.category, 80) || "General";
  const question = sanitizeMultiline(item.question, 1200);
  if (!source || !question) return null;
  const existing = db()
    .prepare(
      "SELECT id FROM mistakes WHERE user_id = ? AND source = ? AND question = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1"
    )
    .get(userId, source, question);
  if (existing) {
    db()
      .prepare("UPDATE mistakes SET times_seen = times_seen + 1, user_answer = ?, updated_at = ? WHERE id = ?")
      .run(sanitizeText(item.userAnswer, 1500), now, existing.id);
    return existing.id;
  }
  const prefs = prefsFromUser(db().prepare("SELECT * FROM users WHERE id = ?").get(userId));
  const schedule = prefs.mistakes ? startedSchedule(prefs.mode, now) : null;
  const result = db()
    .prepare(
      `INSERT INTO mistakes
      (user_id, source, category, prompt, question, kind, options_json, user_answer, correct_answer, explanation, status, times_seen, times_correct, memory_step, memory_started_at, next_review_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 1, 0, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      source,
      category,
      sanitizeText(item.prompt, 800),
      question,
      item.kind === "correction" ? "correction" : "choice",
      Array.isArray(item.options) ? JSON.stringify(item.options.map((option) => sanitizeText(option, 300))) : null,
      sanitizeText(item.userAnswer, 1500),
      sanitizeText(item.correctAnswer, 1500),
      sanitizeText(item.explanation, 1200),
      schedule ? schedule.step : 0,
      schedule ? schedule.startedAt : null,
      schedule ? schedule.nextAt : null,
      now,
      now
    );
  return Number(result.lastInsertRowid);
}

function ensureDailyPassage(user, level) {
  const safeLevel = isValidLevel(level) ? level : user.level || "6-7";
  const today = dayKey();
  let row = db()
    .prepare(
      "SELECT * FROM passages WHERE user_id = ? AND date_key = ? AND level = ? AND is_daily = 1 ORDER BY id DESC LIMIT 1"
    )
    .get(user.id, today, safeLevel);
  if (row) return row;
  const base = normalizeReadingBankItem(dailyReading(safeLevel, today));
  const content = {
    ...base,
    style: base.style,
    topic: base.topic,
    level: safeLevel,
    wordCount: base.wordCount
  };
  try {
    const result = db()
      .prepare(
        `INSERT INTO passages
        (user_id, date_key, level, title, style, topic, word_count, minutes, content_json, source, is_daily, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'studio', 1, ?)`
      )
      .run(
        user.id,
        today,
        safeLevel,
        base.title,
        base.style,
        base.topic,
        base.wordCount,
        base.minutes,
        JSON.stringify(content),
        nowMs()
      );
    return db().prepare("SELECT * FROM passages WHERE id = ?").get(Number(result.lastInsertRowid));
  } catch (error) {
    // A double request can race the partial unique index; select the winner.
    const existing = db()
      .prepare(
        "SELECT * FROM passages WHERE user_id = ? AND date_key = ? AND level = ? AND is_daily = 1 ORDER BY id DESC LIMIT 1"
      )
      .get(user.id, today, safeLevel);
    if (existing) return existing;
    throw error;
  }
}

function latestAttempt(userId, passageId) {
  const row = db()
    .prepare(
      "SELECT score, total, created_at FROM reading_attempts WHERE user_id = ? AND passage_id = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(userId, passageId);
  return row ? { score: row.score, total: row.total, createdAt: row.created_at } : null;
}

function revisionFor(row) {
  return parseJSON(row.feedback_json, {});
}

function getGrammarProgress(userId) {
  const rows = db()
    .prepare(
      "SELECT topic_slug, score, total, created_at FROM grammar_progress WHERE user_id = ? ORDER BY created_at DESC"
    )
    .all(userId);
  const map = {};
  for (const row of rows) {
    if (!map[row.topic_slug]) {
      map[row.topic_slug] = {
        bestScore: row.score,
        bestTotal: row.total,
        lastScore: row.score,
        lastTotal: row.total,
        attempts: 0,
        lastAt: row.created_at
      };
    }
    const item = map[row.topic_slug];
    item.attempts += 1;
    if (row.score / row.total > item.bestScore / item.bestTotal) {
      item.bestScore = row.score;
      item.bestTotal = row.total;
    }
  }
  return map;
}

function publicGrammarTopics() {
  return GRAMMAR_TOPICS.map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    category: topic.category,
    level: topic.level,
    minutes: topic.minutes,
    blurb: topic.blurb,
    sections: topic.sections,
    tip: topic.tip,
    questions: topic.quiz.map((q) => ({ question: q.question, options: q.options }))
  }));
}

function getSampleExercise(user, level) {
  const sample = listeningForLevel(level);
  let row = db()
    .prepare(
      "SELECT * FROM listening_exercises WHERE user_id = ? AND source = 'studio' AND title = ? ORDER BY id DESC LIMIT 1"
    )
    .get(user.id, sample.title);
  if (!row) {
    const result = db()
      .prepare(
        `INSERT INTO listening_exercises
        (user_id, level, topic, accent, title, intro, script, questions_json, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'studio', ?)`
      )
      .run(
        user.id,
        sample.level,
        sample.topic,
        sample.accent,
        sample.title,
        sample.intro,
        sample.script,
        JSON.stringify(sample.questions),
        nowMs()
      );
    row = db().prepare("SELECT * FROM listening_exercises WHERE id = ?").get(Number(result.lastInsertRowid));
  }
  return row;
}

function wordView(row) {
  const intervalIndex = clamp(Number(row.interval_index) || 0, 0, SRS_INTERVALS.length - 1);
  const nextReviewAt = Number(row.next_review_at);
  const now = nowMs();
  return {
    id: row.id,
    word: row.word,
    phonetic: row.phonetic || "",
    partOfSpeech: row.part_of_speech || "",
    definition: row.definition,
    example: row.example || "",
    source: row.source,
    bookId: row.book_id || null,
    meaningZh: row.meaning_zh || row.definition || "",
    exampleZh: row.example_zh || "",
    memoryStep: Number(row.memory_step) || 0,
    learned: Boolean(row.memory_started_at),
    memoryDone: Boolean(row.memory_done_at),
    intervalIndex,
    intervalDays: SRS_INTERVALS[intervalIndex],
    reviewCount: Number(row.review_count) || 0,
    nextReviewAt,
    due: nextReviewAt <= now,
    status: intervalIndex >= 4 ? "mature" : "learning",
    createdAt: row.created_at
  };
}

function getVocabStats(userId) {
  const now = nowMs();
  const user = db().prepare("SELECT memory_mode, memory_words FROM users WHERE id = ?").get(userId);
  const memoryEnabled = Number(user?.memory_words ?? 1) === 1;
  const total = db().prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ?").get(userId).n || 0;
  const due = memoryEnabled
    ? db()
      .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND memory_started_at IS NOT NULL AND memory_done_at IS NULL AND next_review_at <= ?")
      .get(userId, now).n || 0
    : 0;
  const mature = db()
    .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND memory_done_at IS NOT NULL")
    .get(userId).n || 0;
  const reviews = db().prepare("SELECT COUNT(*) AS n FROM vocab_reviews WHERE user_id = ?").get(userId).n || 0;
  const next = memoryEnabled
    ? db()
      .prepare("SELECT MIN(next_review_at) AS next FROM vocabulary WHERE user_id = ? AND memory_started_at IS NOT NULL AND memory_done_at IS NULL AND next_review_at > ?")
      .get(userId, now).next
    : null;
  const summary = getSummary(userId);
  return {
    total,
    due,
    learning: total - mature,
    mature,
    reviews,
    reviewedToday: summary?.today.types.includes("vocabulary") || false,
    nextReviewAt: next || null,
    memoryMode: user?.memory_mode || "mixed",
    memoryEnabled
  };
}

function newBankAvailable(userId) {
  const savedKeys = new Set(
    db().prepare("SELECT word_key FROM vocabulary WHERE user_id = ?").all(userId).map((row) => row.word_key)
  );
  return VOCAB_BANK.filter((item) => !savedKeys.has(wordKey(item.word))).length;
}

function insertStarterWord(userId, item, now) {
  const key = wordKey(item.word);
  const existing = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND word_key = ?")
    .get(userId, key);
  if (existing) return { row: existing, created: false };
  db()
    .prepare(
      `INSERT INTO vocabulary
       (user_id, word, word_key, phonetic, part_of_speech, definition, example, source, interval_index, review_count, next_review_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'starter', 0, 0, ?, ?, ?)`
    )
    .run(
      userId,
      item.word,
      key,
      item.phonetic || "",
      item.partOfSpeech || "",
      item.definition,
      item.example || "",
      now + SRS_INTERVALS[0] * 86_400_000,
      now,
      now
    );
  const row = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND word_key = ?")
    .get(userId, key);
  return { row, created: true };
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = crypto.randomInt(index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function sessionOptions(correctDefinition, definitions) {
  const correct = String(correctDefinition || "").trim();
  const pool = new Map();
  for (const definition of definitions) {
    const clean = String(definition || "").trim();
    if (clean) pool.set(clean.toLowerCase(), clean);
  }
  pool.delete(correct.toLowerCase());
  const distractors = shuffle([...pool.values()]).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { options, answerIndex: options.indexOf(correct) };
}

function wordMistakeInput(row) {
  return {
    source: row.source || "manual",
    category: "Vocabulary",
    prompt: row.word,
    kind: "correction",
    question: `Give the meaning of: ${row.word}`,
    userAnswer: "",
    correctAnswer: row.definition,
    explanation: row.example || ""
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleStatus(req, res) {
  return ok(res, {
    app: "Daymark",
    aiConfigured: aiConfigured(),
    aiModel: aiConfigured() ? aiProviderInfo().model : null,
    aiProvider: aiConfigured() ? aiProviderInfo().provider : null,
    serverDate: dayKey(),
    version: 1
  });
}

function summaryWithToday(user, base = getSummary(user.id)) {
  const board = boardFor(user, base);
  return {
    ...base,
    streak: board.streak,
    points: board.points,
    dailyGoal: board.goal,
    todayCompleted: board.completed
  };
}

async function handleSignup(req, res, ctx) {
  const body = await readJson(req);
  const name = sanitizeText(body.name, 60);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const level = isValidLevel(body.level) ? body.level : "6-7";
  if (name.length < 2) return fail(res, 400, "Please enter your name.");
  if (!isValidEmail(email)) return fail(res, 400, "Please enter a valid email address.");
  if (password.length < 8) return fail(res, 400, "Your password needs at least 8 characters.");
  if (password.length > 128) return fail(res, 400, "That password is too long.");

  const existing = db().prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return fail(res, 409, "An account with that email already exists. Try logging in instead.");
  if (!authRateLimit(`signup:${clientIp(req)}`, 20, 3_600_000)) {
    return fail(res, 429, "Too many account attempts. Please try again later.");
  }
  const userId = (() => {
    const now = nowMs();
    const result = db()
      .prepare(
        "INSERT INTO users (name, email, password_hash, level, is_guest, streak_count, last_active_date, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0, NULL, ?, ?)"
      )
      .run(name, email, scryptHash(password), level, now, now);
    return Number(result.lastInsertRowid);
  })();
  createSession(req, res, userId);
  return ok(
    res,
    {
      user: publicUser(freshUser(userId), { includeEmail: true }),
      summary: summaryWithToday(freshUser(userId))
    },
    201
  );
}

async function handleSignin(req, res) {
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email) || !password) return fail(res, 400, "Enter your email and password.");
  const ipKey = `signin:${clientIp(req)}`;
  if (!authRateLimit(ipKey, 30, 900_000)) {
    return fail(res, 429, "Too many sign-in attempts. Please wait a few minutes and try again.");
  }
  const user = db().prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return fail(res, 401, "That email and password do not match an account.");
  }
  resetAuthRateLimit(ipKey);
  createSession(req, res, user.id);
  return ok(res, {
    user: publicUser(user, { includeEmail: true }),
    summary: summaryWithToday(user)
  });
}

async function handleSignout(req, res) {
  destroySession(req, res);
  return ok(res, { signedOut: true });
}

async function handleSession(req, res, ctx) {
  if (!ctx.user) return ok(res, { user: null });
  const user = freshUser(ctx.user.id);
  return ok(res, { user: publicUser(user, { includeEmail: true }), summary: summaryWithToday(user) });
}

async function handleBootstrap(req, res, ctx) {
  const user = freshUser(ctx.user.id);
  return ok(res, {
    user: publicUser(user, { includeEmail: true }),
    summary: summaryWithToday(user),
    aiConfigured: aiConfigured(),
    aiModel: aiConfigured() ? aiProviderInfo().model : null,
    aiProvider: aiConfigured() ? aiProviderInfo().provider : null
  });
}

async function handlePatchMe(req, res, ctx) {
  const body = await readJson(req);
  const user = freshUser(ctx.user.id);
  const name = body.name === undefined ? user.name : sanitizeText(body.name, 60);
  const level = body.level === undefined ? user.level : body.level;
  if (name.length < 2) return fail(res, 400, "Please enter a name with at least 2 characters.");
  if (!isValidLevel(level)) return fail(res, 400, "Choose a valid IELTS level.");
  db().prepare("UPDATE users SET name = ?, level = ?, updated_at = ? WHERE id = ?").run(
    name,
    level,
    nowMs(),
    ctx.user.id
  );
  return ok(res, { user: publicUser(user, { includeEmail: true }), summary: summaryWithToday(user) });
}

async function handleSummary(req, res, ctx) {
  const user = freshUser(ctx.user.id);
  return ok(res, { summary: summaryWithToday(user) });
}

async function handleDashboard(req, res, ctx) {
  const user = freshUser(ctx.user.id);
  const summary = summaryWithToday(user);
  const daily = ensureDailyPassage(user, user.level);
  const reading = {
    ...readingPreview(daily),
    lastAttempt: latestAttempt(user.id, daily.id)
  };
  const lastWriting = db()
    .prepare("SELECT id, band, created_at, task_type FROM writing_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id);
  const lastSpeaking = db()
    .prepare("SELECT id, band, created_at, mode FROM speaking_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id);
  const progress = getGrammarProgress(user.id);
  const openCategories = db()
    .prepare("SELECT category, COUNT(*) AS n FROM mistakes WHERE user_id = ? AND status = 'open' GROUP BY category ORDER BY n DESC")
    .all(user.id);
  let recommendedGrammar =
    GRAMMAR_TOPICS.find((topic) =>
      openCategories.some((cat) => cat.category.toLowerCase().includes(topic.title.toLowerCase()) || topic.title.toLowerCase().includes(cat.category.toLowerCase()))
    ) ||
    GRAMMAR_TOPICS.find((topic) => !progress[topic.slug]) ||
    GRAMMAR_TOPICS[0];
  const word = wordOfTheDay(dayKey());
  const wordSaved = Boolean(
    db().prepare("SELECT id FROM vocabulary WHERE user_id = ? AND word_key = ?").get(user.id, wordKey(word.word))
  );
  const listeningSample = listeningForLevel(user.level);
  return ok(res, {
    summary,
    todayBoard: boardFor(user, summary),
    reading,
    wordOfDay: { ...word, saved: wordSaved },
    lastWriting: lastWriting ? { id: lastWriting.id, band: Number(lastWriting.band), createdAt: lastWriting.created_at } : null,
    lastSpeaking: lastSpeaking ? { id: lastSpeaking.id, band: Number(lastSpeaking.band), createdAt: lastSpeaking.created_at } : null,
    grammar: {
      slug: recommendedGrammar.slug,
      title: recommendedGrammar.title,
      blurb: recommendedGrammar.blurb,
      level: recommendedGrammar.level,
      category: recommendedGrammar.category,
      completed: Object.keys(progress).length
    },
    listening: { title: listeningSample.title, level: listeningSample.level },
    aiConfigured: aiConfigured()
  });
}

function activeArticle(user) {
  if (!user.active_reading_article_id) return null;
  return db()
    .prepare("SELECT a.*, b.name AS book_name FROM reading_articles a JOIN reading_books b ON b.id = a.book_id WHERE a.id = ? AND a.user_id = ?")
    .get(Number(user.active_reading_article_id), user.id);
}

function articleContent(article) {
  const paragraphs = String(article.body || "").split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const wordCount = Number(article.word_count) || paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return {
    title: article.title,
    subtitle: article.book_name ? `From your reading book · ${article.book_name}` : "From your reading book",
    style: "Custom article",
    topic: article.book_name || "Reading book",
    wordCount,
    minutes: Math.max(1, Math.round(wordCount / 180)),
    paragraphs,
    glossary: [],
    questions: []
  };
}

function ensureArticleDaily(user, level, article) {
  const today = dayKey();
  const content = articleContent(article);
  let row = db()
    .prepare("SELECT * FROM passages WHERE user_id = ? AND date_key = ? AND level = ? AND is_daily = 1 ORDER BY id DESC LIMIT 1")
    .get(user.id, today, level);
  if (row) {
    db()
      .prepare("UPDATE passages SET title = ?, style = ?, topic = ?, word_count = ?, minutes = ?, content_json = ?, source = 'book' WHERE id = ?")
      .run(content.title, content.style, content.topic, content.wordCount, content.minutes, JSON.stringify(content), row.id);
    return db().prepare("SELECT * FROM passages WHERE id = ?").get(row.id);
  }
  const result = db()
    .prepare(`INSERT INTO passages
      (user_id, date_key, level, title, style, topic, word_count, minutes, content_json, source, is_daily, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'book', 1, ?)`)
    .run(user.id, today, level, content.title, content.style, content.topic, content.wordCount, content.minutes, JSON.stringify(content), nowMs());
  return db().prepare("SELECT * FROM passages WHERE id = ?").get(Number(result.lastInsertRowid));
}

async function handleReadingDaily(req, res, ctx) {
  const user = freshUser(ctx.user.id);
  const requested = req.url && new URL(req.url, "http://local").searchParams.get("level");
  const level = isValidLevel(requested) ? requested : user.level;
  const article = activeArticle(user);
  if (article) {
    const row = ensureArticleDaily(user, level, article);
    return ok(res, {
      passage: publicPassage(row),
      lastAttempt: null,
      level,
      activeArticle: { id: article.id, title: article.title, bookId: article.book_id }
    });
  }
  const row = ensureDailyPassage(user, level);
  return ok(res, {
    passage: publicPassage(row),
    lastAttempt: latestAttempt(user.id, row.id),
    level,
    activeArticle: null
  });
}

async function handleSetReadingCurrent(req, res, ctx) {
  const article = db()
    .prepare("SELECT a.*, b.name AS book_name FROM reading_articles a JOIN reading_books b ON b.id = a.book_id WHERE a.id = ? AND a.user_id = ?")
    .get(Number(ctx.params.articleId), ctx.user.id);
  if (!article) return fail(res, 404, "That article could not be found.");
  db().prepare("UPDATE users SET active_reading_article_id = ?, updated_at = ? WHERE id = ?").run(article.id, nowMs(), ctx.user.id);
  return ok(res, { activeArticle: { id: article.id, title: article.title, bookId: article.book_id } });
}

async function handleClearReadingCurrent(req, res, ctx) {
  db().prepare("UPDATE users SET active_reading_article_id = NULL, updated_at = ? WHERE id = ?").run(nowMs(), ctx.user.id);
  db().prepare("DELETE FROM passages WHERE user_id = ? AND date_key = ? AND is_daily = 1 AND source = 'book'").run(ctx.user.id, dayKey());
  return ok(res, { activeArticle: null });
}



async function handleReadingLibrary(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM passages WHERE user_id = ? ORDER BY created_at DESC LIMIT 30")
    .all(ctx.user.id);
  return ok(res, {
    passages: rows.map((row) => ({
      ...readingPreview(row),
      isDaily: Boolean(row.is_daily),
      lastAttempt: latestAttempt(ctx.user.id, row.id)
    }))
  });
}

async function handleReadingGet(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM passages WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That passage could not be found.");
  return ok(res, { passage: publicPassage(row), lastAttempt: latestAttempt(ctx.user.id, row.id) });
}

async function handleReadingGenerate(req, res, ctx) {
  const body = await readJson(req);
  const user = freshUser(ctx.user.id);
  const level = isValidLevel(body.level) ? body.level : user.level;
  const style = sanitizeText(body.style, 40) || "editorial";
  const topic = sanitizeText(body.topic, 80) || "Everyday life";
  const length = ["short", "medium", "long"].includes(body.length) ? body.length : "medium";
  const quota = aiQuota(user.id);
  let content = null;
  let source = "studio";
  let fallbackReason = null;
  if (quota.allowed) {
    try {
      content = await generateReading({ level, topic, style, length });
      source = "gemini";
    } catch (error) {
      console.error("[reading] AI generation failed:", error?.message || error);
      fallbackReason = "The AI could not finish that passage, so Daymark loaded a studio sample instead.";
    }
  } else {
    fallbackReason = aiFallbackReason(quota.reason);
  }
  if (!content) {
    content = normalizeReadingBankItem(fallbackReading({ level, style, topic }));
    fallbackReason = fallbackReason || aiFallbackReason("unknown");
  }
  const normalized = normalizeReadingBankItem({
    ...content,
    level,
    style: source === "gemini" ? style : content.style || style,
    topic: source === "gemini" ? topic : content.topic || topic,
    questions: content.questions
  });
  const result = db()
    .prepare(
      `INSERT INTO passages
      (user_id, date_key, level, title, style, topic, word_count, minutes, content_json, source, is_daily, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
    .run(
      user.id,
      dayKey(),
      level,
      normalized.title,
      source === "gemini" ? style : normalized.style,
      source === "gemini" ? topic : normalized.topic,
      normalized.wordCount,
      normalized.minutes,
      JSON.stringify({ ...normalized, level, style: source === "gemini" ? style : normalized.style, topic: source === "gemini" ? topic : normalized.topic }),
      source,
      nowMs()
    );
  const row = db().prepare("SELECT * FROM passages WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, {
    passage: publicPassage(row),
    source,
    fallbackReason,
    aiConfigured: aiConfigured()
  }, 201);
}

async function handleReadingSubmit(req, res, ctx) {
  const body = await readJson(req);
  const row = db()
    .prepare("SELECT * FROM passages WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That passage could not be found.");
  const content = parseJSON(row.content_json, {});
  const questions = Array.isArray(content.questions) ? content.questions : [];
  if (!questions.length) return fail(res, 400, "This passage has no comprehension questions.");
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.filter((a) => Number.isInteger(a)).length < questions.length) {
    return fail(res, 400, "Please answer every question before checking.");
  }
  let score = 0;
  const results = questions.map((q, index) => {
    const chosen = Number.isInteger(answers[index]) ? answers[index] : -1;
    const correct = chosen === Number(q.answer);
    if (correct) score += 1;
    else {
      addMistake(ctx.user.id, {
        source: "reading",
        category: "Reading · comprehension",
        prompt: content.title || row.title,
        question: q.question,
        kind: "choice",
        options: q.options,
        userAnswer: q.options[chosen] || "No answer",
        correctAnswer: q.options[q.answer] || "",
        explanation: q.explanation || ""
      });
    }
    return {
      index,
      question: q.question,
      options: q.options,
      chosen,
      correctIndex: Number(q.answer),
      correct,
      explanation: q.explanation || ""
    };
  });
  const attempt = db()
    .prepare(
      "INSERT INTO reading_attempts (user_id, passage_id, score, total, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(ctx.user.id, row.id, score, questions.length, JSON.stringify(answers), nowMs());
  recordActivity(ctx.user.id, "reading", Number(content.minutes) || 6, "submit");
  return ok(res, {
    attemptId: Number(attempt.lastInsertRowid),
    score,
    total: questions.length,
    results,
    summary: getSummary(ctx.user.id)
  });
}

async function handleReadingComplete(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM passages WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That passage could not be found.");
  const content = parseJSON(row.content_json, {});
  recordActivity(ctx.user.id, "reading", clamp(Number(content.minutes) || 6, 2, 20), "read-complete");
  return ok(res, { read: true, summary: getSummary(ctx.user.id) });
}

async function handleWritingPrompts(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const task = Number(url.searchParams.get("task")) === 1 ? 1 : 2;
  const rows = require("./content").WRITING_PROMPTS.filter((p) => Number(p.task) === task);
  return ok(res, { prompts: rows, task, aiConfigured: aiConfigured() });
}

async function handleWritingPrompt(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const task = Number(url.searchParams.get("task")) === 1 ? 1 : 2;
  const fresh = url.searchParams.get("fresh") === "1";
  if (fresh && task === 2) {
    const quota = aiQuota(ctx.user.id);
    if (quota.allowed) {
      try {
        const prompt = await generateWritingPrompt();
        return ok(res, { prompt, source: "gemini", aiConfigured: true });
      } catch (error) {
        console.error("[writing-prompt] AI failed:", error?.message || error);
        return ok(res, {
          prompt: writingPromptForTask(task),
          source: "studio",
          fallbackReason: "The AI question writer was unavailable, so here is one from the studio bank."
        });
      }
    }
    return ok(res, {
      prompt: writingPromptForTask(task),
      source: "studio",
      fallbackReason: aiFallbackReason(quota.reason)
    });
  }
  return ok(res, { prompt: writingPromptForTask(task), source: "studio", aiConfigured: aiConfigured() });
}

async function handleWritingEvaluate(req, res, ctx) {
  const body = await readJson(req);
  const mode = WRITING_MODES.has(body.mode) ? body.mode : "full";
  const taskType = Number(body.taskType) === 1 ? 1 : 2;
  const prompt = sanitizeMultiline(body.prompt, 1800);
  const content = sanitizeMultiline(body.response, 12_000);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (!prompt) return fail(res, 400, "Please choose or enter a writing question.");
  if (wordCount < 20) return fail(res, 400, "Write at least 20 words so there is something to respond to.");
  if (mode === "full" && wordCount < 40) {
    return fail(res, 400, "A full response needs at least 40 words. Try developing one clear idea first.");
  }
  const quota = aiQuota(ctx.user.id);
  let feedback = null;
  let source = "demo";
  let fallbackReason = null;
  if (quota.allowed) {
    try {
      feedback = await evaluateWriting({ taskType, mode, prompt, response: content, wordCount });
      feedback.demo = false;
      source = "gemini";
    } catch (error) {
      console.error("[writing] AI evaluation failed:", error?.message || error);
      fallbackReason = "The AI examiner was unavailable, so Daymark used its transparent studio estimate. Your work is saved — try again for the full assessment.";
    }
  } else {
    fallbackReason = aiFallbackReason(quota.reason);
  }
  if (!feedback) {
    feedback = writingFeedback({ taskType, mode, prompt, response: content });
    source = "demo";
  }
  const result = db()
    .prepare(
      `INSERT INTO writing_submissions
      (user_id, mode, task_type, question_id, prompt, content, word_count, band, feedback_json, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      ctx.user.id,
      mode,
      taskType,
      sanitizeText(body.questionId, 100) || null,
      prompt,
      content,
      wordCount,
      feedback.overallBand,
      JSON.stringify(feedback),
      source,
      nowMs()
    );
  for (const flagged of feedback.flaggedErrors || []) {
    addMistake(ctx.user.id, {
      source: "writing",
      category: `Writing · ${sanitizeText(flagged.category, 50) || "Expression"}`,
      prompt: prompt.slice(0, 600),
      question: `Correct this phrase: \u201c${sanitizeText(flagged.original, 300)}\u201d`,
      kind: "correction",
      userAnswer: sanitizeText(flagged.original, 300),
      correctAnswer: sanitizeText(flagged.correction, 300),
      explanation: sanitizeText(flagged.explanation, 600)
    });
  }
  recordActivity(ctx.user.id, "writing", mode === "full" ? 22 : 11, "evaluate");
  const row = db().prepare("SELECT * FROM writing_submissions WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, {
    submission: publicWriting(row, { full: true }),
    feedback,
    source,
    fallbackReason,
    aiConfigured: aiConfigured(),
    summary: getSummary(ctx.user.id)
  }, 201);
}

async function handleWritingHistory(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM writing_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 40")
    .all(ctx.user.id);
  return ok(res, { submissions: rows.map((row) => publicWriting(row)) });
}

async function handleWritingHistoryGet(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM writing_submissions WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That submission could not be found.");
  return ok(res, { submission: publicWriting(row, { full: true }), feedback: parseJSON(row.feedback_json, {}) });
}

async function handleSpeakingPrompts(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const mode = SPEAKING_MODES.has(url.searchParams.get("mode")) ? url.searchParams.get("mode") : null;
  const prompts = require("./content").SPEAKING_PROMPTS.filter((p) => !mode || p.mode === mode);
  return ok(res, { prompts, aiConfigured: aiConfigured() });
}

async function handleSpeakingPrompt(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const mode = SPEAKING_MODES.has(url.searchParams.get("mode")) ? url.searchParams.get("mode") : "passage";
  const fresh = url.searchParams.get("fresh") === "1";
  if (fresh) {
    const quota = aiQuota(ctx.user.id);
    if (quota.allowed) {
      try {
        const prompt = await generateSpeakingPrompt(mode);
        return ok(res, { prompt, source: "gemini" });
      } catch (error) {
        console.error("[speaking-prompt] AI failed:", error?.message || error);
        return ok(res, {
          prompt: speakingPromptForMode(mode),
          source: "studio",
          fallbackReason: "The AI topic writer was unavailable, so here is a studio topic."
        });
      }
    }
    return ok(res, {
      prompt: speakingPromptForMode(mode),
      source: "studio",
      fallbackReason: aiFallbackReason(quota.reason)
    });
  }
  return ok(res, { prompt: speakingPromptForMode(mode), source: "studio" });
}

async function handleSpeakingEvaluate(req, res, ctx) {
  const body = await readJson(req);
  const mode = SPEAKING_MODES.has(body.mode) ? body.mode : "passage";
  const prompt = sanitizeMultiline(body.prompt, 1500);
  const transcript = sanitizeMultiline(body.transcript, 10_000);
  const durationSeconds = clamp(Math.round(Number(body.durationSeconds) || 0), 0, 600);
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  if (!prompt) return fail(res, 400, "Choose a speaking topic first.");
  if (transcript.length < 20 || wordCount < 5) {
    return fail(res, 400, "We need a little more speech before we can offer useful feedback.");
  }
  const quota = aiQuota(ctx.user.id);
  let feedback = null;
  let source = "demo";
  let fallbackReason = null;
  if (quota.allowed) {
    try {
      feedback = await evaluateSpeaking({ prompt, mode, transcript, durationSeconds });
      feedback.demo = false;
      source = "gemini";
    } catch (error) {
      console.error("[speaking] AI evaluation failed:", error?.message || error);
      fallbackReason = "The AI speaking coach was unavailable, so Daymark used its transcript-based studio estimate. Your work is saved — try again for the full assessment.";
    }
  } else {
    fallbackReason = aiFallbackReason(quota.reason);
  }
  if (!feedback) {
    feedback = speakingFeedback({ mode, prompt, transcript, durationSeconds });
    source = "demo";
  }
  const result = db()
    .prepare(
      `INSERT INTO speaking_submissions
      (user_id, mode, prompt, transcript, duration_seconds, band, feedback_json, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(ctx.user.id, mode, prompt, transcript, durationSeconds, feedback.overallBand, JSON.stringify(feedback), source, nowMs());
  for (const flagged of feedback.flaggedErrors || []) {
    addMistake(ctx.user.id, {
      source: "speaking",
      category: `Speaking · ${sanitizeText(flagged.category, 50) || "Expression"}`,
      prompt: prompt.slice(0, 500),
      question: `Correct this phrase: \u201c${sanitizeText(flagged.original, 300)}\u201d`,
      kind: "correction",
      userAnswer: sanitizeText(flagged.original, 300),
      correctAnswer: sanitizeText(flagged.correction, 300),
      explanation: sanitizeText(flagged.explanation, 600)
    });
  }
  recordActivity(ctx.user.id, "speaking", mode === "passage" ? 10 : 6, "evaluate");
  const row = db().prepare("SELECT * FROM speaking_submissions WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, {
    submission: publicSpeaking(row, { full: true }),
    feedback,
    source,
    fallbackReason,
    aiConfigured: aiConfigured(),
    summary: getSummary(ctx.user.id)
  }, 201);
}

async function handleSpeakingHistory(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM speaking_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 40")
    .all(ctx.user.id);
  return ok(res, { submissions: rows.map((row) => publicSpeaking(row)) });
}

async function handleSpeakingHistoryGet(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM speaking_submissions WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That submission could not be found.");
  return ok(res, { submission: publicSpeaking(row, { full: true }), feedback: parseJSON(row.feedback_json, {}) });
}

async function handleMistakes(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const status = url.searchParams.get("status");
  const rows = db()
    .prepare(
      `SELECT * FROM mistakes WHERE user_id = ? ${status === "open" ? "AND status = 'open'" : status === "resolved" ? "AND status = 'resolved'" : ""} ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC LIMIT 300`
    )
    .all(ctx.user.id);
  const mistakes = rows.map((row) => ({
    id: row.id,
    source: row.source,
    category: row.category,
    prompt: row.prompt,
    question: row.question,
    kind: row.kind,
    options: parseJSON(row.options_json, []),
    userAnswer: row.user_answer,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    status: row.status,
    timesSeen: Number(row.times_seen),
    timesCorrect: Number(row.times_correct),
    memoryStep: Number(row.memory_step) || 0,
    memoryStartedAt: row.memory_started_at || null,
    nextReviewAt: row.next_review_at || null,
    due: !row.memory_started_at || Boolean(row.next_review_at && Number(row.next_review_at) <= nowMs()),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
  const counts = { open: 0, resolved: 0, bySource: {}, byCategory: {} };
  for (const mistake of mistakes) {
    counts[mistake.status] = (counts[mistake.status] || 0) + 1;
    counts.bySource[mistake.source] = (counts.bySource[mistake.source] || 0) + 1;
    counts.byCategory[mistake.category] = (counts.byCategory[mistake.category] || 0) + 1;
  }
  return ok(res, {
    mistakes,
    counts,
    prefs: prefsFromUser(freshUser(ctx.user.id)),
    summary: getSummary(ctx.user.id)
  });
}

async function handleMistakeReview(req, res, ctx) {
  const body = await readJson(req);
  const row = db()
    .prepare("SELECT * FROM mistakes WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That mistake could not be found.");
  const correct = Boolean(body.correct);
  const now = nowMs();
  const prefs = prefsFromUser(freshUser(ctx.user.id));
  let done = false;
  let nextReviewAt = 0;
  if (!prefs.mistakes) {
    if (correct) {
      db()
        .prepare("UPDATE mistakes SET status = 'resolved', times_correct = times_correct + 1, updated_at = ? WHERE id = ?")
        .run(now, row.id);
      done = true;
    } else {
      db()
        .prepare("UPDATE mistakes SET times_seen = times_seen + 1, updated_at = ? WHERE id = ?")
        .run(now, row.id);
    }
  } else {
    const schedule = advanceSchedule({
      mode: prefs.mode,
      startedAt: row.memory_started_at || now,
      step: row.memory_step || 0,
      correct,
      now
    });
    done = schedule.done;
    nextReviewAt = schedule.nextAt || 0;
    db()
      .prepare(
        `UPDATE mistakes
         SET status = ?, times_seen = times_seen + ?, times_correct = times_correct + ?, memory_step = ?, memory_started_at = ?, next_review_at = ?, memory_done_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        done ? "resolved" : "open",
        correct ? 0 : 1,
        correct ? 1 : 0,
        schedule.step,
        schedule.startedAt || now,
        nextReviewAt,
        done ? now : null,
        now,
        row.id
      );
  }
  recordActivity(ctx.user.id, "grammar", 3, "mistake-retest");
  return ok(res, {
    id: row.id,
    status: done ? "resolved" : "open",
    done,
    nextReviewAt,
    memoryMode: prefs.mode,
    summary: getSummary(ctx.user.id),
    counts: {
      open: db().prepare("SELECT COUNT(*) AS n FROM mistakes WHERE user_id = ? AND status = 'open'").get(ctx.user.id).n,
      resolved: db().prepare("SELECT COUNT(*) AS n FROM mistakes WHERE user_id = ? AND status = 'resolved'").get(ctx.user.id).n
    }
  });
}

async function handleVocabulary(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? ORDER BY CASE WHEN next_review_at <= ? THEN 0 ELSE 1 END, next_review_at ASC, created_at DESC")
    .all(ctx.user.id, nowMs());
  const words = rows.map(wordView);
  return ok(res, {
    words,
    due: words.filter((word) => word.due),
    stats: getVocabStats(ctx.user.id),
    newAvailable: newBankAvailable(ctx.user.id)
  });
}

async function handleVocabularySession(req, res, ctx) {
  const body = await readJson(req);
  const count = clamp(Math.floor(Number(body.count) || 10), 1, 30);
  const now = nowMs();
  const rows = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? ORDER BY next_review_at ASC, created_at ASC")
    .all(ctx.user.id);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const selectedIds = new Set();
  const insertedIds = new Set();
  const selected = [];

  for (const row of rows.filter((item) => Number(item.next_review_at) <= now)) {
    if (selected.length >= count) break;
    selected.push(row);
    selectedIds.add(row.id);
  }

  if (selected.length < count) {
    const savedKeys = new Set(rows.map((row) => row.word_key));
    const fresh = VOCAB_BANK.filter((item) => !savedKeys.has(wordKey(item.word)));
    for (const item of fresh) {
      if (selected.length >= count) break;
      const inserted = insertStarterWord(ctx.user.id, item, now);
      if (!inserted.row || selectedIds.has(inserted.row.id)) continue;
      if (inserted.created) insertedIds.add(inserted.row.id);
      byId.set(inserted.row.id, inserted.row);
      selected.push(inserted.row);
      selectedIds.add(inserted.row.id);
    }
  }

  if (selected.length < count) {
    for (const row of rows) {
      if (selected.length >= count) break;
      if (selectedIds.has(row.id)) continue;
      selected.push(row);
      selectedIds.add(row.id);
    }
  }

  const queue = shuffle(selected);
  const definitionPool = [
    ...VOCAB_BANK.map((item) => item.definition),
    ...Array.from(byId.values()).map((row) => row.definition)
  ];
  const words = queue.map((row) => {
    const { options, answerIndex } = sessionOptions(row.definition, definitionPool);
    return {
      ...wordView(row),
      isNew: insertedIds.has(row.id),
      options,
      answerIndex
    };
  });

  return ok(res, {
    words,
    count: words.length,
    newAvailable: newBankAvailable(ctx.user.id),
    stats: getVocabStats(ctx.user.id)
  });
}

async function handleVocabularyCreate(req, res, ctx) {
  const body = await readJson(req);
  const word = sanitizeText(body.word, 60);
  const key = wordKey(word);
  const definition = sanitizeMultiline(body.definition, 900);
  if (!key || word.length < 2) return fail(res, 400, "Enter a word to save.");
  if (!definition) return fail(res, 400, "Add a short meaning so future-you knows what it means.");
  const existing = db()
    .prepare("SELECT * FROM vocabulary WHERE user_id = ? AND word_key = ?")
    .get(ctx.user.id, key);
  if (existing) {
    return ok(res, { word: wordView(existing), duplicate: true });
  }
  const book = ensureDefaultBook(ctx.user.id);
  if (!book) return fail(res, 409, "You have no room for another word book.");
  const source = STUDY_SOURCES.has(body.source) ? body.source : "manual";
  const meaningZh = sanitizeText(body.meaningZh, 900) || definition;
  const now = nowMs();
  const result = db()
    .prepare(
      `INSERT INTO vocabulary
      (user_id, book_id, word, word_key, phonetic, part_of_speech, definition, meaning_zh, example, example_zh, source, interval_index, memory_step, review_count, next_review_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, ?)`
    )
    .run(
      ctx.user.id,
      book.id,
      word,
      key,
      sanitizeText(body.phonetic, 80),
      sanitizeText(body.partOfSpeech, 40),
      definition,
      meaningZh,
      sanitizeText(body.example, 700),
      sanitizeText(body.exampleZh, 700),
      source,
      now,
      now
    );
  const row = db().prepare("SELECT * FROM vocabulary WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, { word: wordView(row), duplicate: false }, 201);
}

async function handleVocabularyReview(req, res, ctx) {
  const body = await readJson(req);
  const rating = VOCAB_RATINGS.has(body.rating) ? body.rating : null;
  if (!rating) return fail(res, 400, "Choose how well you remembered the word.");
  const row = db()
    .prepare("SELECT * FROM vocabulary WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That word could not be found.");
  const previous = clamp(Number(row.interval_index) || 0, 0, SRS_INTERVALS.length - 1);
  let nextIndex;
  if (rating === "again") nextIndex = 0;
  else if (rating === "easy") nextIndex = Math.min(SRS_INTERVALS.length - 1, previous + 2);
  else nextIndex = Math.min(SRS_INTERVALS.length - 1, previous + 1);
  const days = SRS_INTERVALS[nextIndex];
  const now = nowMs();
  const nextAt = now + days * 86_400_000;
  db()
    .prepare(
      "UPDATE vocabulary SET interval_index = ?, review_count = review_count + 1, next_review_at = ?, updated_at = ? WHERE id = ?"
    )
    .run(nextIndex, nextAt, now, row.id);
  db()
    .prepare(
      `INSERT INTO vocab_reviews (user_id, vocab_id, rating, previous_index, new_index, reviewed_at, next_review_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(ctx.user.id, row.id, rating, previous, nextIndex, now, nextAt);
  recordActivity(ctx.user.id, "vocabulary", 2, "review");
  const updated = db().prepare("SELECT * FROM vocabulary WHERE id = ?").get(row.id);
  return ok(res, {
    word: wordView(updated),
    nextDays: days,
    nextReviewAt: nextAt,
    stats: getVocabStats(ctx.user.id),
    summary: getSummary(ctx.user.id)
  });
}

async function handleVocabularyDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT id FROM vocabulary WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That word could not be found.");
  db().prepare("DELETE FROM vocabulary WHERE id = ?").run(row.id);
  return ok(res, { deleted: true, stats: getVocabStats(ctx.user.id) });
}

async function handleGrammar(req, res, ctx) {
  return ok(res, {
    topics: publicGrammarTopics(),
    progress: getGrammarProgress(ctx.user.id)
  });
}

async function handleGrammarComplete(req, res, ctx) {
  const body = await readJson(req);
  const topic = grammarTopic(sanitizeText(body.slug, 80));
  if (!topic) return fail(res, 404, "That grammar topic could not be found.");
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (
    answers.length !== topic.quiz.length ||
    answers.some(
      (answer) =>
        answer === null ||
        answer === undefined ||
        answer === "" ||
        !Number.isInteger(Number(answer)) ||
        Number(answer) < 0 ||
        Number(answer) >= topic.quiz[0].options.length
    )
  ) {
    return fail(res, 400, "Answer every question before checking.");
  }
  let score = 0;
  const results = topic.quiz.map((question, index) => {
    const chosen = Number(answers[index]);
    const correct = chosen === Number(question.answer);
    if (correct) score += 1;
    else {
      addMistake(ctx.user.id, {
        source: "grammar",
        category: topic.title,
        prompt: topic.title,
        question: question.question,
        kind: "choice",
        options: question.options,
        userAnswer: question.options[chosen] || "No answer",
        correctAnswer: question.options[question.answer],
        explanation: question.explanation
      });
    }
    return {
      index,
      chosen,
      correct,
      correctIndex: question.answer,
      explanation: question.explanation,
      options: question.options,
      question: question.question
    };
  });
  db()
    .prepare("INSERT INTO grammar_progress (user_id, topic_slug, score, total, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(ctx.user.id, topic.slug, score, topic.quiz.length, nowMs());
  recordActivity(ctx.user.id, "grammar", topic.minutes || 6, "quiz");
  const progress = getGrammarProgress(ctx.user.id);
  return ok(res, {
    score,
    total: topic.quiz.length,
    results,
    progress: progress[topic.slug],
    summary: getSummary(ctx.user.id)
  });
}

async function handleListeningExercise(req, res, ctx) {
  const user = freshUser(ctx.user.id);
  const url = new URL(req.url, "http://local");
  const level = isValidLevel(url.searchParams.get("level")) ? url.searchParams.get("level") : user.level;
  const row = getSampleExercise(user, level);
  return ok(res, { exercise: publicListening(row), source: "studio" });
}

async function handleListeningGenerate(req, res, ctx) {
  const body = await readJson(req);
  const user = freshUser(ctx.user.id);
  const level = isValidLevel(body.level) ? body.level : user.level;
  const topic = sanitizeText(body.topic, 80) || "Everyday life";
  const accent = ["British", "American", "Australian"].includes(body.accent) ? body.accent : "British";
  const quota = aiQuota(user.id);
  let exercise = null;
  let source = "studio";
  let fallbackReason = null;
  if (quota.allowed) {
    try {
      exercise = await generateListening({ level, topic, accent });
      source = "gemini";
    } catch (error) {
      console.error("[listening] AI generation failed:", error?.message || error);
      fallbackReason = "The AI could not finish the recording script, so Daymark loaded a studio listening room instead.";
    }
  } else {
    fallbackReason = aiFallbackReason(quota.reason);
  }
  if (!exercise) {
    const row = getSampleExercise(user, level);
    return ok(res, {
      exercise: publicListening(row),
      source: "studio",
      fallbackReason,
      requestedTopic: topic
    });
  }
  const result = db()
    .prepare(
      `INSERT INTO listening_exercises
      (user_id, level, topic, accent, title, intro, script, questions_json, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'gemini', ?)`
    )
    .run(
      user.id,
      level,
      topic,
      accent,
      exercise.title,
      exercise.intro,
      exercise.script,
      JSON.stringify(exercise.questions),
      nowMs()
    );
  const row = db().prepare("SELECT * FROM listening_exercises WHERE id = ?").get(Number(result.lastInsertRowid));
  return ok(res, { exercise: publicListening(row), source, fallbackReason, requestedTopic: topic }, 201);
}

async function handleListeningHistory(req, res, ctx) {
  const rows = db()
    .prepare("SELECT * FROM listening_exercises WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(ctx.user.id);
  return ok(res, {
    exercises: rows.map((row) => ({
      id: row.id,
      level: row.level,
      topic: row.topic,
      accent: row.accent,
      title: row.title,
      intro: row.intro,
      source: row.source,
      createdAt: row.created_at
    }))
  });
}

async function handleListeningAttempt(req, res, ctx) {
  const body = await readJson(req);
  const row = db()
    .prepare("SELECT * FROM listening_exercises WHERE id = ? AND user_id = ?")
    .get(Number(body.exerciseId), ctx.user.id);
  if (!row) return fail(res, 404, "That listening exercise could not be found.");
  const questions = parseJSON(row.questions_json, []);
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.filter((answer) => Number.isInteger(answer)).length < questions.length) {
    return fail(res, 400, "Answer every listening question before checking.");
  }
  let score = 0;
  const results = questions.map((question, index) => {
    const chosen = Number.isInteger(answers[index]) ? Number(answers[index]) : -1;
    const correct = chosen === Number(question.answer);
    if (correct) score += 1;
    else {
      addMistake(ctx.user.id, {
        source: "listening",
        category: "Listening · detail",
        prompt: row.title,
        question: question.question,
        kind: "choice",
        options: question.options,
        userAnswer: question.options[chosen] || "No answer",
        correctAnswer: question.options[question.answer] || "",
        explanation: question.explanation || ""
      });
    }
    return {
      index,
      chosen,
      correct,
      correctIndex: Number(question.answer),
      explanation: question.explanation || "",
      question: question.question,
      options: question.options
    };
  });
  db()
    .prepare(
      "INSERT INTO listening_attempts (user_id, exercise_id, score, total, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(ctx.user.id, row.id, score, questions.length, JSON.stringify(answers), nowMs());
  recordActivity(ctx.user.id, "listening", clamp(Math.round(row.script.split(/\s+/).length / 25), 4, 12), "attempt");
  return ok(res, {
    score,
    total: questions.length,
    results,
    script: row.script,
    title: row.title,
    summary: getSummary(ctx.user.id)
  });
}

async function handleDictionary(req, res, ctx) {
  const url = new URL(req.url, "http://local");
  const word = sanitizeText(url.searchParams.get("word"), 60);
  const key = wordKey(word);
  if (!key) return fail(res, 400, "Look up a word first.");
  const lang = url.searchParams.get("lang") === "zh" ? "zh" : "en";
  const entry = await fetchDictionary(key, { lang });
  if (!entry) {
    return fail(res, 404, "We could not find that word. You can still save it with your own definition.");
  }
  const saved = db()
    .prepare("SELECT id FROM vocabulary WHERE user_id = ? AND word_key = ?")
    .get(ctx.user.id, key);
  return ok(res, { entry, saved: Boolean(saved) });
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

const routes = [];
function route(method, pattern, handler, { public: isPublic = false } = {}) {
  routes.push({ method, pattern, handler, public: isPublic });
}

route("GET", /^\/api\/status$/, handleStatus, { public: true });
route("POST", /^\/api\/auth\/signup$/, handleSignup, { public: true });
route("POST", /^\/api\/auth\/signin$/, handleSignin, { public: true });
route("POST", /^\/api\/auth\/signout$/, handleSignout, { public: true });
route("GET", /^\/api\/session$/, handleSession, { public: true });
route("GET", /^\/api\/bootstrap$/, handleBootstrap);
route("PATCH", /^\/api\/me$/, handlePatchMe);
route("GET", /^\/api\/summary$/, handleSummary);
route("POST", /^\/api\/today\/tasks$/, handleTaskCreate);
route("PATCH", /^\/api\/today\/tasks\/(?<id>\d+)$/, handleTaskUpdate);
route("DELETE", /^\/api\/today\/tasks\/(?<id>\d+)$/, handleTaskDelete);
route("PATCH", /^\/api\/today\/goal$/, handleGoalUpdate);
route("GET", /^\/api\/dashboard$/, handleDashboard);
route("GET", /^\/api\/reading\/daily$/, handleReadingDaily);
route("GET", /^\/api\/reading\/library$/, handleReadingLibrary);
route("POST", /^\/api\/reading\/generate$/, handleReadingGenerate);
route("GET", /^\/api\/reading\/(?<id>\d+)$/, handleReadingGet);
route("POST", /^\/api\/reading\/(?<id>\d+)\/submit$/, handleReadingSubmit);
route("POST", /^\/api\/reading\/(?<id>\d+)\/complete$/, handleReadingComplete);
route("POST", /^\/api\/reading-articles\/(?<articleId>\d+)\/current$/, handleSetReadingCurrent);
route("POST", /^\/api\/reading\/clear-active$/, handleClearReadingCurrent);
route("GET", /^\/api\/writing\/prompts$/, handleWritingPrompts);
route("GET", /^\/api\/writing\/prompt$/, handleWritingPrompt);
route("POST", /^\/api\/writing\/evaluate$/, handleWritingEvaluate);
route("GET", /^\/api\/writing\/history$/, handleWritingHistory);
route("GET", /^\/api\/writing\/history\/(?<id>\d+)$/, handleWritingHistoryGet);
route("GET", /^\/api\/speaking\/prompts$/, handleSpeakingPrompts);
route("GET", /^\/api\/speaking\/prompt$/, handleSpeakingPrompt);
route("POST", /^\/api\/speaking\/evaluate$/, handleSpeakingEvaluate);
route("GET", /^\/api\/speaking\/history$/, handleSpeakingHistory);
route("GET", /^\/api\/speaking\/history\/(?<id>\d+)$/, handleSpeakingHistoryGet);
route("GET", /^\/api\/mistakes$/, handleMistakes);
route("POST", /^\/api\/mistakes\/(?<id>\d+)\/review$/, handleMistakeReview);
route("GET", /^\/api\/memory$/, handleMemoryGet);
route("PATCH", /^\/api\/memory$/, handleMemoryUpdate);
route("GET", /^\/api\/word-books$/, handleWordBooks);
route("POST", /^\/api\/word-books$/, handleWordBookCreate);
route("POST", /^\/api\/builtin-books\/(?<key>band-[0-9-]+)\/add$/, handleBuiltinAdd);
route("GET", /^\/api\/word-books\/(?<id>\d+)$/, handleWordBookDetail);
route("PATCH", /^\/api\/word-books\/(?<id>\d+)$/, handleWordBookUpdate);
route("DELETE", /^\/api\/word-books\/(?<id>\d+)$/, handleWordBookDelete);
route("POST", /^\/api\/word-books\/(?<id>\d+)\/words$/, handleWordBookWords);
route("DELETE", /^\/api\/word-books\/(?<id>\d+)\/words\/(?<wordId>\d+)$/, handleWordBookWordDelete);
route("POST", /^\/api\/word-books\/(?<id>\d+)\/session$/, handleWordBookSession);
route("POST", /^\/api\/word-books\/(?<id>\d+)\/words\/(?<wordId>\d+)\/answer$/, handleWordAnswer);
route("GET", /^\/api\/reading-books$/, handleReadingBooks);
route("POST", /^\/api\/reading-books$/, handleReadingBookCreate);
route("GET", /^\/api\/reading-books\/(?<id>\d+)$/, handleReadingBookDetail);
route("PATCH", /^\/api\/reading-books\/(?<id>\d+)$/, handleReadingBookUpdate);
route("DELETE", /^\/api\/reading-books\/(?<id>\d+)$/, handleReadingBookDelete);
route("POST", /^\/api\/reading-books\/(?<id>\d+)\/articles$/, handleReadingArticleCreate);
route("GET", /^\/api\/reading-articles\/(?<articleId>\d+)$/, handleReadingArticleGet);
route("DELETE", /^\/api\/reading-articles\/(?<articleId>\d+)$/, handleReadingArticleDelete);
route("GET", /^\/api\/vocabulary$/, handleVocabulary);
route("POST", /^\/api\/vocabulary\/session$/, handleVocabularySession);
route("POST", /^\/api\/vocabulary$/, handleVocabularyCreate);
route("POST", /^\/api\/vocabulary\/(?<id>\d+)\/review$/, handleVocabularyReview);
route("DELETE", /^\/api\/vocabulary\/(?<id>\d+)$/, handleVocabularyDelete);
route("GET", /^\/api\/grammar$/, handleGrammar);
route("POST", /^\/api\/grammar\/complete$/, handleGrammarComplete);
route("GET", /^\/api\/listening\/exercise$/, handleListeningExercise);
route("POST", /^\/api\/listening\/generate$/, handleListeningGenerate);
route("GET", /^\/api\/listening\/history$/, handleListeningHistory);
route("POST", /^\/api\/listening\/attempt$/, handleListeningAttempt);
route("GET", /^\/api\/dictionary$/, handleDictionary);

async function handleApi(req, res, url, user) {
  if (!sameOrigin(req)) {
    return fail(res, 403, "Cross-site request blocked.");
  }
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  for (const entry of routes) {
    if (entry.method !== req.method) continue;
    const match = entry.pattern.exec(pathname);
    if (!match) continue;
    if (!entry.public && !user) {
      return fail(res, 401, "Please sign in to continue.", "AUTH_REQUIRED");
    }
    try {
      await entry.handler(req, res, { user, params: match.groups || {}, url });
    } catch (error) {
      failFromError(res, error);
    }
    return true;
  }
  if (pathname.startsWith("/api/")) {
    fail(res, 404, "That API endpoint does not exist.");
    return true;
  }
  return false;
}

module.exports = { handleApi, aiQuota, AI_GLOBAL_DAY };


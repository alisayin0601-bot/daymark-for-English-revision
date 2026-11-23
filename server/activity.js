const dbModule = require("./db");
const { clamp, dayKey, dayKeyOffset, dateFromKey, nowMs } = require("./util");

function db() {
  return dbModule.db;
}

const ACTIVITY_TYPES = new Set(["reading", "writing", "speaking", "grammar", "listening", "vocabulary"]);

function recordActivity(userId, type, minutes = 5) {
  if (!ACTIVITY_TYPES.has(type)) throw new Error("Unknown activity type");
  const today = dayKey();
  const user = db().prepare("SELECT streak_count, last_active_date FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  let streak = Number(user.streak_count) || 0;
  if (user.last_active_date !== today) {
    const yesterday = dayKeyOffset(1);
    streak = user.last_active_date === yesterday ? streak + 1 : 1;
    db()
      .prepare("UPDATE users SET streak_count = ?, last_active_date = ?, updated_at = ? WHERE id = ?")
      .run(streak, today, nowMs(), userId);
  }
  db()
    .prepare("INSERT INTO activity_events (user_id, date_key, type, minutes, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(userId, today, type, clamp(Math.round(Number(minutes) || 5), 1, 120), nowMs());
  return { streak, today };
}

function weekDays() {
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const key = dayKeyOffset(offset);
    days.push({
      key,
      label: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "narrow" }).format(dateFromKey(key)),
      day: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric" }).format(dateFromKey(key)),
      month: new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short" }).format(dateFromKey(key))
    });
  }
  return days;
}

function getSummary(userId) {
  const user = db().prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  const today = dayKey();
  const week = weekDays();
  const firstDay = week[0].key;
  const activityRows = db()
    .prepare("SELECT date_key, type, minutes, created_at FROM activity_events WHERE user_id = ? AND date_key >= ? ORDER BY created_at ASC")
    .all(userId, firstDay);
  const byDay = new Map();
  for (const row of activityRows) {
    if (!byDay.has(row.date_key)) byDay.set(row.date_key, { types: new Set(), minutes: 0, sessions: 0 });
    const entry = byDay.get(row.date_key);
    entry.types.add(row.type);
    entry.minutes += Number(row.minutes) || 0;
    entry.sessions += 1;
  }
  const todayEntry = byDay.get(today) || { types: new Set(), minutes: 0, sessions: 0 };
  const todayTypes = Array.from(todayEntry.types);
  const weekView = week.map((day) => {
    const entry = byDay.get(day.key);
    return {
      ...day,
      minutes: entry?.minutes || 0,
      sessions: entry?.sessions || 0,
      done: Boolean(entry?.sessions),
      types: entry ? Array.from(entry.types) : [],
      isToday: day.key === today
    };
  });
  const minutesWeek = weekView.reduce((sum, day) => sum + day.minutes, 0);
  const sessionsWeek = weekView.reduce((sum, day) => sum + day.sessions, 0);
  const activeDaysWeek = weekView.filter((day) => day.done).length;

  const memoryWordsEnabled = Number(user.memory_words ?? 1) === 1;
  const dueVocab = memoryWordsEnabled
    ? db()
      .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND memory_started_at IS NOT NULL AND memory_done_at IS NULL AND next_review_at <= ?")
      .get(userId, nowMs()).n || 0
    : 0;
  const wordsSaved = db().prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ?").get(userId).n || 0;
  const wordsMastered = db()
    .prepare("SELECT COUNT(*) AS n FROM vocabulary WHERE user_id = ? AND memory_done_at IS NOT NULL")
    .get(userId).n || 0;
  const mistakesOpen = db()
    .prepare("SELECT COUNT(*) AS n FROM mistakes WHERE user_id = ? AND status = 'open'")
    .get(userId).n || 0;
  const mistakesResolved = db()
    .prepare("SELECT COUNT(*) AS n FROM mistakes WHERE user_id = ? AND status = 'resolved'")
    .get(userId).n || 0;
  const readingCount = db()
    .prepare("SELECT COUNT(*) AS n FROM reading_attempts WHERE user_id = ?")
    .get(userId).n || 0;
  const reviewCount = db()
    .prepare("SELECT COUNT(*) AS n FROM vocab_reviews WHERE user_id = ?")
    .get(userId).n || 0;
  const nextReview = memoryWordsEnabled
    ? db()
      .prepare(
        "SELECT MIN(next_review_at) AS next FROM vocabulary WHERE user_id = ? AND memory_started_at IS NOT NULL AND memory_done_at IS NULL AND next_review_at > ?"
      )
      .get(userId, nowMs()).next
    : null;

  const currentStreak =
    user.last_active_date === today || user.last_active_date === dayKeyOffset(1)
      ? Number(user.streak_count) || 0
      : 0;

  const readingDone = todayTypes.includes("reading");
  const extraDone = ["writing", "speaking", "grammar", "listening"].some((type) => todayTypes.includes(type));
  const wordsDone = todayTypes.includes("vocabulary");
  const wordsLabel = dueVocab
    ? `Review ${dueVocab} due word${dueVocab === 1 ? "" : "s"}`
    : wordsSaved
      ? "Start a word-book session"
      : "Add or study your first word";
  const tasks = [
    { id: "reading", label: "Read today's passage", minutes: 7, done: readingDone, href: "/app/reading" },
    {
      id: "words",
      label: wordsLabel,
      minutes: 3,
      done: wordsDone,
      href: "/app/vocabulary"
    },
    {
      id: "extra",
      label: "Practise one more skill",
      minutes: 8,
      done: extraDone,
      href: "/app/writing"
    }
  ];
  const completedTasks = tasks.filter((task) => task.done).length;

  return {
    user: {
      id: user.id,
      name: user.name,
      level: user.level,
      streak: currentStreak,
      lastActiveDate: user.last_active_date
    },
    dateKey: today,
    dateLabel: new Intl.DateTimeFormat("en-GB", {
      timeZone: process.env.APP_TIMEZONE || "Asia/Shanghai",
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date()),
    streak: currentStreak,
    week: weekView,
    today: {
      types: todayTypes,
      minutes: todayEntry.minutes,
      tasks,
      completedTasks,
      totalTasks: tasks.length,
      percent: Math.round((completedTasks / tasks.length) * 100)
    },
    stats: {
      dueVocab,
      wordsSaved,
      wordsMastered,
      mistakesOpen,
      mistakesResolved,
      minutesWeek,
      sessionsWeek,
      activeDaysWeek,
      readingCount,
      reviewCount,
      nextReviewAt: nextReview || null
    }
  };
}

module.exports = { recordActivity, getSummary, ACTIVITY_TYPES };

const dbModule = require("./db");
const { dayKey, dayKeyOffset, dateFromKey, nowMs, sanitizeText, clamp } = require("./util");
const { getSummary } = require("./activity");
const { ok, fail, readJson } = require("./http");

const POINTS_PER_TASK = 10;
const DEFAULT_TASKS = [
  { title: "Read today's passage", kind: "reading" },
  { title: "Review your due words", kind: "vocabulary" },
  { title: "Finish one practice task", kind: "practice" }
];
const TASK_KINDS = new Set(["reading", "vocabulary", "grammar", "listening", "writing", "speaking", "practice"]);

function db() {
  return dbModule.db;
}

function ensureToday(user) {
  const today = dayKey();
  let day = db()
    .prepare("SELECT * FROM daily_task_days WHERE user_id = ? AND date_key = ?")
    .get(user.id, today);
  if (!day) {
    db()
      .prepare("INSERT INTO daily_task_days (user_id, date_key, seeded, created_at) VALUES (?, ?, 0, ?)")
      .run(user.id, today, nowMs());
    day = db()
      .prepare("SELECT * FROM daily_task_days WHERE user_id = ? AND date_key = ?")
      .get(user.id, today);
  }
  if (!day.seeded) {
    const count = db()
      .prepare("SELECT COUNT(*) AS n FROM daily_tasks WHERE user_id = ? AND date_key = ?")
      .get(user.id, today).n || 0;
    if (count === 0) {
      const insert = db().prepare(
        "INSERT INTO daily_tasks (user_id, date_key, title, kind, done, awarded, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)"
      );
      const now = nowMs();
      DEFAULT_TASKS.forEach((task, index) => insert.run(user.id, today, task.title, task.kind, index, now, now));
    }
    db().prepare("UPDATE daily_task_days SET seeded = 1 WHERE id = ?").run(day.id);
  }
  return today;
}

function weekFor(user, goal) {
  const days = [];
  const today = dayKey();
  const counts = db()
    .prepare(
      `SELECT date_key, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed
       FROM daily_tasks WHERE user_id = ? AND date_key >= ? GROUP BY date_key`
    )
    .all(user.id, dayKeyOffset(34));
  const map = new Map(counts.map((row) => [row.date_key, Number(row.completed) || 0]));
  for (let offset = 6; offset >= 0; offset -= 1) {
    const key = dayKeyOffset(offset);
    const date = dateFromKey(key);
    days.push({
      key,
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
      day: date.getDate(),
      month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date),
      completed: map.get(key) || 0,
      isToday: key === today,
      reached: (map.get(key) || 0) >= goal
    });
  }
  return days;
}

function currentStreak(user, goal) {
  const counts = db()
    .prepare(
      `SELECT date_key, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed
       FROM daily_tasks WHERE user_id = ? GROUP BY date_key`
    )
    .all(user.id);
  const map = new Map(counts.map((row) => [row.date_key, Number(row.completed) || 0]));
  let offset = 0;
  if ((map.get(dayKey()) || 0) < goal) offset = 1;
  let streak = 0;
  for (let i = offset; i < 366; i += 1) {
    const key = dayKeyOffset(i);
    if ((map.get(key) || 0) >= goal) streak += 1;
    else break;
  }
  return streak;
}

function kindDone(kind, types) {
  if (!kind) return false;
  if (kind === "practice") return types.some((type) => ["grammar", "listening", "writing", "speaking"].includes(type));
  return types.includes(kind);
}

function boardFor(user, activity = null) {
  const today = ensureToday(user);
  let fresh = db().prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  const goal = clamp(Number(fresh.daily_goal) || 3, 1, 20);
  const summary = activity || getSummary(user.id);
  const types = summary?.today?.types || [];
  let earned = 0;
  const rows = db()
    .prepare("SELECT * FROM daily_tasks WHERE user_id = ? AND date_key = ? ORDER BY position ASC, id ASC")
    .all(user.id, today);
  for (const row of rows) {
    const complete = kindDone(row.kind, types);
    let done = row.done ? 1 : 0;
    let awarded = row.awarded ? 1 : 0;
    if (complete && !done) done = 1;
    if (!complete && done) done = 0;
    if (done && !awarded) {
      awarded = 1;
      earned += POINTS_PER_TASK;
    }
    if (done !== Number(row.done) || awarded !== Number(row.awarded)) {
      db().prepare("UPDATE daily_tasks SET done = ?, awarded = ?, updated_at = ? WHERE id = ?").run(done, awarded, nowMs(), row.id);
      row.done = done;
      row.awarded = awarded;
    }
  }
  if (earned) {
    db().prepare("UPDATE users SET points = points + ?, updated_at = ? WHERE id = ?").run(earned, nowMs(), user.id);
    fresh = db().prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  }
  const tasks = rows.map((row) => ({
    id: row.id,
    title: row.title,
    kind: row.kind || "practice",
    done: Boolean(row.done),
    points: row.awarded ? POINTS_PER_TASK : 0,
    createdAt: row.created_at
  }));
  return {
    dateKey: today,
    tasks,
    goal,
    completed: tasks.filter((task) => task.done).length,
    total: tasks.length,
    points: Number(fresh.points) || 0,
    streak: currentStreak(fresh, goal),
    week: weekFor(fresh, goal)
  };
}

async function handleTaskCreate(req, res, ctx) {
  const body = await readJson(req);
  const title = sanitizeText(body.title, 120);
  const kind = TASK_KINDS.has(body.kind) ? body.kind : "practice";
  if (!title) return fail(res, 400, "Write a task first.");
  ensureToday(ctx.user);
  const today = dayKey();
  const count = db()
    .prepare("SELECT COUNT(*) AS n FROM daily_tasks WHERE user_id = ? AND date_key = ?")
    .get(ctx.user.id, today).n || 0;
  if (count >= 20) return fail(res, 409, "A day can hold up to 20 tasks.");
  const position = count;
  const now = nowMs();
  db()
    .prepare("INSERT INTO daily_tasks (user_id, date_key, title, kind, done, awarded, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)")
    .run(ctx.user.id, today, title, kind, position, now, now);
  return ok(res, { board: boardFor(ctx.user) }, 201);
}

async function handleTaskUpdate(req, res, ctx) {
  const row = db()
    .prepare("SELECT * FROM daily_tasks WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That task could not be found.");
  const body = await readJson(req);
  if (typeof body.done === "boolean") {
    return fail(res, 400, "Tasks complete automatically when the matching activity is done.");
  }
  if (body.title === undefined) return fail(res, 400, "Nothing to update.");
  const title = sanitizeText(body.title, 120);
  if (!title) return fail(res, 400, "Task title cannot be empty.");
  db()
    .prepare("UPDATE daily_tasks SET title = ?, updated_at = ? WHERE id = ?")
    .run(title, nowMs(), row.id);
  return ok(res, { board: boardFor(ctx.user) });
}

async function handleTaskDelete(req, res, ctx) {
  const row = db()
    .prepare("SELECT id FROM daily_tasks WHERE id = ? AND user_id = ?")
    .get(Number(ctx.params.id), ctx.user.id);
  if (!row) return fail(res, 404, "That task could not be found.");
  db().prepare("DELETE FROM daily_tasks WHERE id = ?").run(row.id);
  return ok(res, { board: boardFor(ctx.user) });
}

async function handleGoalUpdate(req, res, ctx) {
  const body = await readJson(req);
  const goal = clamp(Math.floor(Number(body.goal) || 3), 1, 20);
  db().prepare("UPDATE users SET daily_goal = ?, updated_at = ? WHERE id = ?").run(goal, nowMs(), ctx.user.id);
  return ok(res, { board: boardFor(ctx.user) });
}

module.exports = {
  ensureToday,
  boardFor,
  handleTaskCreate,
  handleTaskUpdate,
  handleTaskDelete,
  handleGoalUpdate,
  POINTS_PER_TASK
};

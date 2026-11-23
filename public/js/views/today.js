import { api } from "../api.js";
import { icon } from "../icons.js";
import { L } from "../i18n.js";
import { escapeHTML, escapeAttr, greeting, levelLabel, toast } from "../ui.js";

function fallbackBoard(data) {
  const tasks = (data.summary?.today?.tasks || []).map((task) => ({
    id: null,
    title: task.label,
    done: task.done,
    points: 0
  }));
  return {
    tasks,
    goal: 3,
    completed: tasks.filter((task) => task.done).length,
    total: tasks.length,
    points: 0,
    streak: data.summary?.streak || 0,
    week: data.summary?.week || []
  };
}

function chartHTML(board) {
  const completed = (board.week || []).map((day) => day.completed || 0);
  const max = Math.max(board.goal + 2, ...completed, 1);
  const targetPx = 13 + (board.goal / max) * 130;
  return `<section class="streak-card">
    <div class="streak-card__head">
      <div><p class="eyebrow">${L("Consistency", "连续完成")}</p><h2>${L("Last 7 days", "最近 7 天")}</h2></div>
      <div class="streak-card__score"><strong>${board.streak}</strong><span>${L("day streak", "天连胜")}</span></div>
    </div>
    <div class="streak-legend"><i></i><span>${L("Goal", "目标")} ${board.goal}</span></div>
    <div class="streak-chart">
      <div class="streak-chart__plot">
        <div class="streak-target" style="bottom:${targetPx.toFixed(1)}px"></div>
        ${(board.week || []).map((day) => {
          const count = day.completed || 0;
          const height = Math.min(100, (count / max) * 100);
          return `<div class="streak-column ${day.isToday ? "is-today" : ""}">
            <span class="streak-column__value">${count}</span>
            <span class="streak-column__track"><i style="height:${Math.max(count ? 7 : 0, height)}%"></i></span>
            <span class="streak-column__day">${escapeHTML(day.label || "")}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="streak-card__foot">
      <span>${icon("target", 15)} ${L("Finish tasks to grow the bars. Bars can pass the goal line.", "每完成一个任务柱子增加一格，可以超过目标线。")}</span>
      <div class="points-chip">${icon("award", 15)} <strong>${board.points}</strong> ${L("points", "积分")}</div>
    </div>
  </section>`;
}

function kindLabel(kind) {
  return {
    reading: L("Reading", "阅读"),
    vocabulary: L("Vocabulary", "词汇"),
    grammar: L("Grammar", "语法"),
    listening: L("Listening", "听力"),
    writing: L("Writing", "写作"),
    speaking: L("Speaking", "口语"),
    practice: L("Any practice", "任意练习")
  }[kind] || L("Any practice", "任意练习");
}

function taskRow(task) {
  return `<div class="today-task ${task.done ? "is-done" : ""}">
    <span class="today-task__check" title="${L("Completes automatically after the matching activity", "完成对应活动后自动勾选")}">${task.done ? icon("check", 14) : ""}</span>
    <span class="today-task__title">${escapeHTML(task.title)}</span>
    <span class="today-task__kind">${kindLabel(task.kind)}</span>
    ${task.done ? `<span class="today-task__points">+${task.points || 10}</span>` : ""}
    ${task.id ? `<button class="icon-button today-task__delete" type="button" data-delete-task="${task.id}" aria-label="${L("Remove task", "删除任务")}">${icon("x", 14)}</button>` : ""}
  </div>`;
}

function planCard(board) {
  return `<section class="today-plan" aria-labelledby="today-plan-title">
    <div class="today-plan__head">
      <div><p class="eyebrow">${L("Your day", "你今天")}</p><h2 id="today-plan-title">${L("Today's plan", "今日任务")}</h2></div>
      <div class="today-plan__count"><strong>${board.completed}</strong><span>/ ${board.total} ${L("done", "已完成")}</span></div>
    </div>
    <div class="today-goal-row">
      <label for="today-goal">${L("Daily target", "每日目标")}</label>
      <input id="today-goal" type="number" min="1" max="20" value="${board.goal}">
      <span>${L("tasks — bars above this line count as extra", "个任务；超过这条线的部分算额外完成")}</span>
    </div>
    <div class="today-task-list">
      ${board.tasks.length ? board.tasks.map(taskRow).join("") : `<div class="today-empty"><p>${L("No tasks yet. Add the first thing you want to finish today.", "今天还没有任务，先加一个想完成的小目标。")}</p></div>`}
    </div>
    <form class="today-add-form" id="today-add-form">
      <input class="input" id="today-new-task" maxlength="120" placeholder="${L("Add a task — e.g. review ten words", "添加任务，例如：复习 10 个单词")}" autocomplete="off">
      <select class="select today-kind-select" id="today-kind" aria-label="${L("Task type", "任务类型")}">
        <option value="reading">${L("Reading", "阅读")}</option>
        <option value="vocabulary" selected>${L("Vocabulary", "词汇")}</option>
        <option value="grammar">${L("Grammar", "语法")}</option>
        <option value="listening">${L("Listening", "听力")}</option>
        <option value="writing">${L("Writing", "写作")}</option>
        <option value="speaking">${L("Speaking", "口语")}</option>
        <option value="practice">${L("Any practice", "任意练习")}</option>
      </select>
      <button class="btn btn--primary btn--small" type="submit">${icon("plus", 14)} ${L("Add", "添加")}</button>
    </form>
    <p class="today-plan__hint">${L("Tasks tick themselves when you finish the matching activity. Every first completion earns 10 points. Up to 20 tasks a day.", "完成对应活动后任务会自动勾选，不能手动勾。每个任务第一次完成得 10 分，每天最多 20 个任务。")}</p>
  </section>`;
}

export async function renderToday(root, { signal }) {
  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-card" style="margin-top:24px;min-height:260px"></div></div>`;
  let data;
  let board;
  try {
    data = await api.get("/api/dashboard", { signal });
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">${L("Could not load", "加载失败")}</p><h1>${L("Today's page is unavailable.", "今日页面暂时打不开。")}</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-home>${L("Try again", "重试")}</button></div>`;
    root.querySelector("[data-retry-home]")?.addEventListener("click", () => renderToday(root, { signal }));
    return () => {};
  }
  board = data.todayBoard || fallbackBoard(data);
  const firstName = (data.summary.user?.name || "").split(" ")[0] || L("there", "朋友");
  const dateLabel = data.summary.dateLabel || "";

  function paint() {
    root.innerHTML = `<div class="page-enter home-page today-page">
      <header class="home-header">
        <div>
          <p class="home-date">${escapeHTML(dateLabel)}</p>
          <h1>${escapeHTML(greeting())}, ${escapeHTML(firstName)}.</h1>
          <p>${L("A small plan, a visible streak.", "把今天要做的事，放在一个清楚的地方。")}</p>
        </div>
        <div class="today-header__meta">
          <div class="today-points">${icon("award", 16)} <strong>${board.points}</strong> <span>${L("points", "积分")}</span></div>
          <a class="btn btn--secondary btn--small home-level" href="/app/settings" data-link>${escapeHTML(levelLabel(data.summary.user.level))} ${icon("settings", 14)}</a>
        </div>
      </header>
      <div class="today-layout">
        <div class="today-main">${planCard(board)}</div>
        <aside class="today-aside">${chartHTML(board)}</aside>
      </div>
    </div>`;
    const chip = document.querySelector(".streak-chip strong");
    if (chip) chip.textContent = String(board.streak);
  }

  async function request(method, path, body) {
    try {
      const result = await api[method](path, body);
      if (result.board) {
        board = result.board;
        paint();
      }
      return result;
    } catch (error) {
      toast(error.message, { type: "error" });
      return null;
    }
  }

  root.addEventListener("click", async (event) => {
    const remove = event.target.closest("[data-delete-task]");
    if (remove) {
      await request("delete", `/api/today/tasks/${remove.dataset.deleteTask}`);
    }
  }, { signal });

  root.addEventListener("submit", async (event) => {
    if (event.target.id !== "today-add-form") return;
    event.preventDefault();
    const input = root.querySelector("#today-new-task");
    const title = input?.value.trim();
    const kind = root.querySelector("#today-kind")?.value || "practice";
    if (!title) {
      input?.focus();
      return;
    }
    const result = await request("post", "/api/today/tasks", { title, kind });
    if (result) root.querySelector("#today-new-task")?.focus();
  }, { signal });

  root.addEventListener("change", async (event) => {
    if (event.target.id !== "today-goal") return;
    const goal = Number(event.target.value);
    if (!Number.isFinite(goal) || goal < 1 || goal > 20) return;
    await request("patch", "/api/today/goal", { goal });
  }, { signal });

  paint();
  return () => {};
}

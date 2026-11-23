import { icon, logoMark, botanical } from "./icons.js";
import { L, langToggleHTML } from "./i18n.js";
import {
  avatarHTML,
  escapeHTML,
  escapeAttr,
  formatLongDate,
  levelLabel,
  plural,
  sourceLabel
} from "./ui.js";

export const NAV_ITEMS = [
  { id: "today", label: "Today", href: "/", icon: "home" },
  { id: "reading", label: "Reading", href: "/app/reading", icon: "bookOpen" },
  { id: "writing", label: "Writing", href: "/app/writing", icon: "pen" },
  { id: "speaking", label: "Speaking", href: "/app/speaking", icon: "mic" },
  { id: "grammar", label: "Grammar", href: "/app/grammar", icon: "grammar" },
  { id: "listening", label: "Listening", href: "/app/listening", icon: "headphones" }
];

export const MEMORY_ITEMS = [
  { id: "mistakes", label: "Mistake Book", href: "/app/mistakes", icon: "bookmark" },
  { id: "vocabulary", label: "Vocabulary", href: "/app/vocabulary", icon: "leaf" }
];

const NAV_ZH = {
  today: "今天", reading: "阅读", writing: "写作", speaking: "口语",
  grammar: "语法", listening: "听力", mistakes: "错题本", vocabulary: "单词书", settings: "设置"
};

function navText(id, fallback) {
  return L(fallback, NAV_ZH[id] || fallback);
}

export function brandHTML({ href = "/", light = false, compact = false, link = true, className = "" } = {}) {
  const tag = link ? "a" : "div";
  const attrs = link ? `href="${escapeAttr(href)}" data-link` : "";
  return `<${tag} ${attrs} class="brand ${light ? "brand--light" : ""} ${compact ? "brand--compact" : ""} ${className}" aria-label="Daymark home">
    ${logoMark(compact ? 30 : 34, "", light)}
    <span class="brand__text">
      <span class="brand__name">daymark</span>
      ${compact ? "" : `<span class="brand__tag">IELTS practice</span>`}
    </span>
  </${tag}>`;
}

function navLink(item, active, summary) {
  const badge =
    item.id === "vocabulary"
      ? summary?.stats?.dueVocab || 0
      : item.id === "mistakes"
        ? summary?.stats?.mistakesOpen || 0
        : 0;
  return `<a class="side-link ${active === item.id ? "is-active" : ""}" href="${escapeAttr(item.href)}" data-link data-nav="${item.id}">
    <span class="side-link__icon">${icon(item.icon, 19)}</span>
    <span class="side-link__label">${escapeHTML(navText(item.id, item.label))}</span>
    ${badge ? `<span class="side-badge" data-badge="${item.id}">${badge}</span>` : `<span class="side-badge" data-badge="${item.id}" hidden>0</span>`}
  </a>`;
}

export function sidebarHTML(user, summary, active) {
  return `<aside class="sidebar" id="sidebar" aria-label="Main navigation">
    <div class="sidebar__head">
      ${brandHTML({ href: "/" })}
      <button class="icon-button sidebar__close" type="button" data-close-nav aria-label="Close navigation">${icon("x", 18)}</button>
    </div>
    <nav class="side-nav" aria-label="Practice">
      <p class="nav-label">${L("Practice", "练习")}</p>
      ${NAV_ITEMS.map((item) => navLink(item, active, summary)).join("")}
      <p class="nav-label nav-label--spaced">${L("Review", "复习")}</p>
      ${MEMORY_ITEMS.map((item) => navLink(item, active, summary)).join("")}
    </nav>
    <div class="sidebar__foot">
      <a class="sidebar-profile" href="/app/settings" data-link>
        ${avatarHTML(user?.name || "Daymark")}
        <span class="sidebar-profile__text"><strong>${escapeHTML(user?.name || "Learner")}</strong><small>${levelLabel(user?.level)}</small></span>
        ${icon("settings", 17)}
      </a>
    </div>
  </aside>
  <button class="nav-scrim" type="button" data-close-nav aria-label="Close navigation" tabindex="-1"></button>`;
}

export function topbarHTML(user, summary, active) {
  const labelMap = {
    today: ["Today", "今天"], reading: ["Reading", "阅读"], writing: ["Writing", "写作"], speaking: ["Speaking", "口语"],
    grammar: ["Grammar", "语法"], listening: ["Listening", "听力"], mistakes: ["Mistake Book", "错题本"],
    vocabulary: ["Vocabulary", "单词书"], settings: ["Settings", "设置"]
  };
  const pair = labelMap[active] || labelMap.today;
  const label = L(pair[0], pair[1]);
  const due = summary?.stats?.dueVocab || 0;
  const streak = summary?.streak ?? user?.streak ?? 0;
  return `<header class="app-topbar">
    <div class="topbar-start">
      <button class="icon-button menu-button" type="button" data-open-nav aria-label="Open navigation">${icon("menu", 20)}</button>
      ${brandHTML({ href: "/", compact: true, className: "brand--topbar" })}
      <span class="topbar-page">${escapeHTML(label)}</span>
    </div>
    <div class="topbar-end">
      <span class="date-chip">${icon("calendar", 15)}<span>${escapeHTML(formatLongDate())}</span></span>
      ${langToggleHTML()}
      <a class="review-chip" href="/app/vocabulary" data-link aria-label="${due ? `${due} words due for review` : L("Vocabulary review", "单词复习")}">
        ${icon("leaf", 16)}<span class="review-chip__label">${due ? `${due} ${L("due", "待复习")}` : L("Vocabulary", "单词")}</span>
      </a>
      <span class="streak-chip" title="${streak} day streak">${icon("flame", 16)}<strong>${streak}</strong></span>
      <a class="topbar-avatar" href="/app/settings" data-link aria-label="Account and settings">
        ${avatarHTML(user?.name || "Daymark", "sm")}
      </a>
    </div>
  </header>`;
}

export function mobileNavHTML(active) {
  const items = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], MEMORY_ITEMS[1]];
  return `<nav class="mobile-nav" aria-label="Quick navigation">
    ${items
      .map(
        (item) => `<a class="mobile-nav__item ${active === item.id ? "is-active" : ""}" href="${item.href}" data-link>
          ${icon(item.icon, 20)}<span>${escapeHTML(item.id === "vocabulary" ? L("Words", "单词") : navText(item.id, item.label))}</span>
        </a>`
      )
      .join("")}
    <button class="mobile-nav__item" type="button" data-open-nav>
      ${icon("menu", 20)}<span>${L("More", "更多")}</span>
    </button>
  </nav>`;
}

export function appShellHTML(user, summary, active) {
  return `<div class="app-shell">
    ${sidebarHTML(user, summary, active)}
    <div class="app-frame">
      ${topbarHTML(user, summary, active)}
      <main id="view-root" class="page-container" tabindex="-1"></main>
    </div>
    ${mobileNavHTML(active)}
  </div>`;
}

export function syncShellSummary(summary) {
  if (!summary) return;
  document.querySelectorAll("[data-badge]").forEach((badge) => {
    const id = badge.dataset.badge;
    const count = id === "vocabulary" ? summary.stats?.dueVocab || 0 : id === "mistakes" ? summary.stats?.mistakesOpen || 0 : 0;
    badge.textContent = String(count);
    badge.hidden = count <= 0;
  });
  document.querySelectorAll(".review-chip").forEach((chip) => {
    const due = summary.stats?.dueVocab || 0;
    chip.innerHTML = `${icon("leaf", 16)}<span class="review-chip__label">${due ? `${due} due` : "Vocabulary"}</span>`;
    chip.setAttribute("aria-label", due ? `${due} words due for review` : "Vocabulary review");
  });
  document.querySelectorAll(".streak-chip strong").forEach((el) => {
    el.textContent = String(summary.streak ?? 0);
  });
}

export function aiBadge(configured, { short = false } = {}) {
  return `<span class="source-badge ${configured ? "source-badge--ai" : "source-badge--studio"}">
    ${icon(configured ? "sparkles" : "feather", 13)}
    ${configured ? "Gemini" : short ? "Built-in" : "Built-in content"}
  </span>`;
}

export function sourceBadge(source) {
  const isAI = source === "gemini";
  return `<span class="source-badge ${isAI ? "source-badge--ai" : "source-badge--studio"}">
    ${icon(isAI ? "sparkles" : "feather", 13)} ${escapeHTML(sourceLabel(source))}
  </span>`;
}

export function levelPill(level) {
  return `<span class="level-pill">${escapeHTML(levelLabel(level))}</span>`;
}

export function pageBack(href, label = "Back") {
  return `<a class="back-link" href="${escapeAttr(href)}" data-link>${icon("arrowLeft", 16)} ${escapeHTML(label)}</a>`;
}

export function botanicalAccent(className = "", size = 150) {
  return botanical(size, className);
}

export function srsCurveSVG({ className = "" } = {}) {
  return `<svg class="srs-curve ${className}" viewBox="0 0 620 300" fill="none" role="img" aria-label="A forgetting curve that flattens with each spaced review">
    <defs>
      <linearGradient id="curveFill" x1="80" y1="40" x2="80" y2="255" gradientUnits="userSpaceOnUse">
        <stop stop-color="#91A780" stop-opacity=".34"/>
        <stop offset="1" stop-color="#91A780" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g class="srs-grid" stroke="currentColor" opacity=".14" stroke-dasharray="3 5">
      <path d="M72 58h492M72 112h492M72 166h492M72 220h492"/>
    </g>
    <path class="srs-area" d="M72 60C104 142 124 190 154 203c27 12 36-17 36-17s35 67 67 73c31 6 44-36 44-36s43 37 61 36c30-2 45-34 45-34s52 24 91 18c20-3 29-14 29-14V256H72v-196Z" fill="url(#curveFill)"/>
    <path class="srs-line" d="M72 60C104 142 124 190 154 203c27 12 36-17 36-17s35 67 67 73c31 6 44-36 44-36s43 37 61 36c30-2 45-34 45-34s52 24 91 18c20-3 29-14 29-14" stroke="#244E3D" stroke-width="2.4" stroke-linecap="round"/>
    <g class="srs-dots" fill="#D99A43" stroke="#FAF6EC" stroke-width="3">
      <circle cx="154" cy="203" r="6"/><circle cx="215" cy="217" r="6"/><circle cx="315" cy="223" r="6"/><circle cx="428" cy="224" r="6"/><circle cx="548" cy="236" r="6"/>
    </g>
    <g class="srs-labels" fill="#6B746C" font-size="12" font-family="DM Sans, sans-serif">
      <text x="154" y="278" text-anchor="middle">day 1</text>
      <text x="215" y="278" text-anchor="middle">2</text>
      <text x="315" y="278" text-anchor="middle">4</text>
      <text x="428" y="278" text-anchor="middle">7</text>
      <text x="548" y="278" text-anchor="middle">15</text>
    </g>
    <g class="srs-note" font-family="Fraunces, Georgia, serif" fill="#1E3A2F">
      <text x="82" y="43" font-size="13" font-style="italic" opacity=".65">the forgetting curve</text>
      <text x="482" y="92" font-size="13" font-style="italic" opacity=".65">each return</text>
      <text x="498" y="110" font-size="13" font-style="italic" opacity=".65">makes it flatter</text>
    </g>
  </svg>`;
}

function niceMax(value) {
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  if (value <= 50) return Math.ceil(value / 10) * 10;
  if (value <= 100) return 100;
  return Math.ceil(value / 25) * 25;
}

export function chartSVG(chart, { className = "" } = {}) {
  if (!chart || !Array.isArray(chart.categories) || !Array.isArray(chart.series)) return "";
  const width = 720;
  const height = 340;
  const padLeft = 58;
  const padRight = 26;
  const padTop = 48;
  const padBottom = 64;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxValue = niceMax(Math.max(...chart.series.flatMap((s) => s.values), 1));
  const colors = ["#244E3D", "#D99A43", "#8EA782"];
  const y = (value) => padTop + plotH - (Number(value) / maxValue) * plotH;
  const x = (index) => padLeft + (plotW / Math.max(1, chart.categories.length - 1)) * index;
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => {
      const value = Math.round(maxValue * fraction);
      const yy = padTop + plotH - plotH * fraction;
      return `<line x1="${padLeft}" y1="${yy}" x2="${width - padRight}" y2="${yy}" stroke="#D8CFBE" stroke-width="1" stroke-dasharray="3 5" opacity=".8"/>
        <text x="${padLeft - 12}" y="${yy + 4}" text-anchor="end" fill="#7A817A" font-size="11" font-family="DM Sans, sans-serif">${value}${escapeHTML(chart.unit === "%" ? "%" : "")}</text>`;
    })
    .join("");

  let plot = "";
  let labels = "";
  if (chart.type === "bar") {
    const groupW = plotW / Math.max(1, chart.categories.length);
    const barW = Math.min(30, (groupW * 0.62) / Math.max(1, chart.series.length));
    labels = chart.categories
      .map((category, i) => `<text x="${padLeft + groupW * (i + 0.5)}" y="${height - 34}" text-anchor="middle" fill="#5F6A61" font-size="12" font-family="DM Sans, sans-serif">${escapeHTML(category)}</text>`)
      .join("");
    plot = chart.series
      .map((series, si) => {
        const offset = groupW * (si + 0.5) / chart.series.length;
        return series.values
          .map((value, i) => {
            const bx = padLeft + groupW * i + groupW * 0.19 + offset - barW / 2;
            const by = y(value);
            return `<rect x="${bx}" y="${by}" width="${barW}" height="${Math.max(1, padTop + plotH - by)}" rx="4" fill="${colors[si % colors.length]}"/>`;
          })
          .join("");
      })
      .join("");
  } else {
    labels = chart.categories
      .map((category, i) => `<text x="${x(i)}" y="${height - 34}" text-anchor="middle" fill="#5F6A61" font-size="12" font-family="DM Sans, sans-serif">${escapeHTML(category)}</text>`)
      .join("");
    plot = chart.series
      .map((series, si) => {
        const points = series.values.map((value, i) => `${x(i)},${y(value)}`).join(" ");
        const dots = series.values
          .map((value, i) => `<circle cx="${x(i)}" cy="${y(value)}" r="4.5" fill="#FAF6EC" stroke="${colors[si % colors.length]}" stroke-width="2.5"/>`)
          .join("");
        return `<polyline points="${points}" fill="none" stroke="${colors[si % colors.length]}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
      })
      .join("");
  }

  const legend = chart.series
    .map(
      (series, si) =>
        `<span class="chart-legend__item"><i style="background:${colors[si % colors.length]}"></i>${escapeHTML(series.name)}</span>`
    )
    .join("");

  return `<figure class="prompt-chart ${escapeAttr(className)}">
    <div class="prompt-chart__head">
      <figcaption>${escapeHTML(chart.yLabel || "Value")} <span>· ${escapeHTML(chart.unit || "")}</span></figcaption>
      <div class="chart-legend">${legend}</div>
    </div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(chart.yLabel || "Chart")}">
      ${grid}
      ${plot}
      ${labels}
      <text x="${padLeft}" y="${height - 8}" fill="#8A9088" font-size="10.5" font-family="DM Sans, sans-serif">Source: Daymark practice data</text>
    </svg>
  </figure>`;
}

export function chapterPrompt(text) {
  return `<span class="chapter-prompt">${icon("quote", 18)} ${escapeHTML(text)}</span>`;
}

export function statNumber(value, label, detail = "") {
  return `<div class="stat-number"><strong>${escapeHTML(String(value))}</strong><span>${escapeHTML(label)}</span>${detail ? `<small>${escapeHTML(detail)}</small>` : ""}</div>`;
}

export function dueBadge(count) {
  return count > 0 ? `<span class="due-badge">${count} due</span>` : "";
}

export function reviewSummaryLine(summary) {
  if (!summary) return "";
  return `${plural(summary.stats?.dueVocab || 0, "word")} due · ${plural(summary.stats?.mistakesOpen || 0, "slip")} to revisit`;
}


import { brandHTML } from "../components.js";
import { icon } from "../icons.js";
import { L, langToggleHTML } from "../i18n.js";

const SKILLS = [
  ["bookOpen", "Reading", "Daily passages with a tap-to-look-up dictionary."],
  ["pen", "Writing", "Task 1 and Task 2 practice with saved feedback."],
  ["mic", "Speaking", "Record a short answer and review the transcript."],
  ["grammar", "Grammar", "Short lessons and four-question checks."],
  ["headphones", "Listening", "Browser-read exercises with comprehension questions."]
];

export function renderPublicHome(root) {
  document.title = "Daymark — IELTS practice";
  root.innerHTML = `<div class="public-home">
    <header class="public-header">
      ${brandHTML({ href: "/" })}
      <div class="public-header__actions">
        <button class="btn btn--ghost btn--small" type="button" data-open-auth="signin">${L("Log in", "登录")}</button>
        ${langToggleHTML()}
      </div>
    </header>
    <main class="public-main">
      <section class="public-intro">
        <p class="eyebrow">IELTS practice</p>
        <h1>${L("Practise IELTS.<br>Keep what you learn.", "练雅思，<br>也留住学过的东西。")}</h1>
        <p class="public-lede">${L("Reading, writing, speaking, grammar and listening in one place. Your vocabulary, mistakes and progress stay saved to your account.", "阅读、写作、口语、语法和听力集中在一个地方。单词书、错题和进度都保存在账号里。")}</p>
        <div class="public-actions">
          <button class="btn btn--primary" type="button" data-open-auth="signup">${L("Create a free account", "免费创建账号")} ${icon("arrowRight", 16)}</button>
        </div>
        <p class="public-note">${icon("check", 14)} ${L("New accounts start at zero. Your progress is your own.", "新账号从 0 开始，进度只属于你。")}</p>
      </section>
      <section class="public-panel" aria-label="What you can practise">
        <div class="public-panel__head"><span>${L("What you can practise", "可以练习的内容")}</span><span>${L("5 skills", "5 个单项")}</span></div>
        <ul class="public-skill-list">
          ${SKILLS.map(
            ([iconName, name, description]) => `<li>
              <span class="public-skill-icon">${icon(iconName, 18)}</span>
              <div><strong>${name}</strong><p>${description}</p></div>
            </li>`
          ).join("")}
        </ul>
        <div class="public-panel__foot">${icon("bookmark", 15)} ${L("Plus word books, reading books, a Mistake Book and spaced review.", "另外还有单词书、阅读书、错题本和间隔复习。")}</div>
      </section>
    </main>
    <footer class="public-footer">
      <span>© ${new Date().getFullYear()} Daymark</span>
      <span>${L("IELTS practice, kept simple.", "简单、专注的雅思练习。")}</span>
    </footer>
  </div>`;
  return () => {};
}

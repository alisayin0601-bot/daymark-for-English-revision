import { api } from "../api.js";
import { icon } from "../icons.js";
import { L, getLang } from "../i18n.js";
import { navigate } from "../router.js";
import { clearSession, store, updateUser } from "../store.js";
import { applyTheme, currentTheme, THEMES } from "../theme.js";
import {
  confirmDialog,
  escapeHTML,
  levelLabel,
  setButtonLoading,
  toast
} from "../ui.js";

function themeOptionsHTML() {
  const active = currentTheme();
  return THEMES.map(
    (theme) => `<button class="theme-option ${theme.id === active ? "is-active" : ""}" type="button" data-theme-option="${theme.id}" aria-pressed="${theme.id === active}">
      <span>
        <span class="theme-copy"><strong>${escapeHTML(theme.name)}${theme.default ? ` <em class="theme-default">${L("Default", "默认")}</em>` : ""}</strong><span>${escapeHTML(theme.note)}</span></span>
        <span class="theme-swatch-row" aria-hidden="true">${theme.colors.map((color) => `<i style="background:${color}"></i>`).join("")}</span>
      </span>
      ${theme.id === active ? `<span class="theme-check">${icon("check", 15)}</span>` : ""}
    </button>`
  ).join("");
}

function pageHTML(user, aiConfigured, aiModel, aiProvider) {
  const lang = getLang();
  const providerName = aiProvider === "openrouter" ? "OpenRouter" : aiProvider === "qwen" ? "Qwen" : aiProvider === "openai" ? "OpenAI-compatible" : aiProvider === "gemini" ? "Gemini" : "DeepSeek";
  return `<div class="page-enter settings-page">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">${L("Account", "账号")}</p>
        <h1>${L("Settings", "设置")}</h1>
        <p>${L("Your profile, appearance, account and AI connection.", "个人资料、外观、账号和 AI 连接。")}</p>
      </div>
    </header>

    <div class="settings-grid">
      <section class="settings-card">
        <div class="settings-card__head"><span class="settings-card__icon">${icon("sun", 18)}</span><div><p class="eyebrow">${L("Appearance", "外观")}</p><h2>${L("Colours & language", "颜色与语言")}</h2></div></div>
        <p class="settings-copy">${L("Choose a coordinated palette and the interface language.", "选择一套协调的配色和界面语言。")}</p>
        <div class="settings-language"><span>${L("Language", "语言")}</span><div class="segmented"><button type="button" class="${lang === "en" ? "is-active" : ""}" data-set-language="en">English</button><button type="button" class="${lang === "zh" ? "is-active" : ""}" data-set-language="zh">中文</button></div></div>
        <div class="theme-grid" id="theme-grid">${themeOptionsHTML()}</div>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><span class="settings-card__icon">${icon("user", 18)}</span><div><p class="eyebrow">${L("Profile", "个人资料")}</p><h2>${L("Your details", "你的信息")}</h2></div></div>
        <form id="profile-form" class="settings-form">
          <div class="field"><label class="field__label" for="settings-name">${L("Name", "姓名")}</label><input class="input" id="settings-name" name="name" value="${escapeHTML(user.name || "")}" maxlength="60" required></div>
          <div class="field"><label class="field__label" for="settings-level">${L("Target band", "目标分数")}</label><select class="select" id="settings-level" name="level">${[["5-6", "Band 5–6"], ["6-7", "Band 6–7"], ["7-8", "Band 7–8+"]].map(([value, label]) => `<option value="${value}" ${user.level === value ? "selected" : ""}>${label}</option>`).join("")}</select><span class="field__hint">${L("Used for reading, listening and practice difficulty.", "用于阅读、听力等练习难度。")}</span></div>
          <button class="btn btn--primary" type="submit" id="save-profile">${L("Save changes", "保存修改")}</button>
        </form>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><span class="settings-card__icon">${icon("lock", 18)}</span><div><p class="eyebrow">${L("Account", "账号")}</p><h2>${L("Sign-in", "登录信息")}</h2></div></div>
        <div class="settings-account-row"><span>${L("Email", "邮箱")}</span><strong>${escapeHTML(user.email || "")}</strong></div>
        <div class="settings-account-row"><span>${L("Member since", "注册时间")}</span><strong>${escapeHTML(user.joinedLabel || "")}</strong></div>
        <p class="settings-copy">${L("Your word books, reading books, mistakes and submissions are private to this account.", "单词书、阅读书、错题和提交都只属于这个账号。")}</p>
        <div class="settings-account-actions"><button class="btn btn--ghost btn--small" type="button" id="sign-out">${icon("logout", 15)} ${L("Log out", "退出登录")}</button></div>
      </section>

      <section class="settings-card">
        <div class="settings-card__head">
          <span class="settings-card__icon">${icon("sparkles", 18)}</span>
          <div><p class="eyebrow">${L("AI connection", "AI 连接")}</p><h2>${aiConfigured ? `${escapeHTML(providerName)} ${L("connected", "已连接")}` : L("AI is off", "AI 未开启")}</h2></div>
          <span class="settings-ai-status ${aiConfigured ? "is-live" : ""}"><i></i>${aiConfigured ? L("On", "开") : L("Off", "关")}</span>
        </div>
        ${aiConfigured
          ? `<p class="settings-copy">${L("Writing and speaking feedback is assessed by", "写作和口语反馈由")} <strong>${escapeHTML(aiModel || providerName)}</strong>. ${L("Fresh reading and listening passages are generated on request. The key never reaches the browser.", "阅读和听力材料可按需生成；密钥不会进入浏览器。")}</p>
             <p class="settings-copy">${L("Submitted text is sent to Google for processing. Your saved work stays in your Daymark database.", "提交的文本会发送给 Google 处理；你的学习数据仍保存在 Daymark 数据库。")}</p>`
          : `<p class="settings-copy">${L("The site is fully usable without an AI key. Reading, grammar and listening use built-in content. Writing and speaking feedback is a transparent rule-based estimate, not an AI assessment.", "没有 AI 密钥也能完整使用。阅读、语法和听力使用内置内容；写作和口语反馈是透明的规则估算，不是 AI 评分。")}</p>
             <div class="setup-steps">
               <div><span>1</span><div><strong>${L("Create a Qwen API key", "创建 Qwen API 密钥")}</strong><p>${L("Use Alibaba Cloud Model Studio (DashScope). Qwen is available in mainland China; Gemini may be region-restricted.", "使用阿里云百炼（DashScope）。Qwen 在中国大陆可用；Gemini 可能受地区限制。")}</p><a class="text-link" href="https://bailian.console.aliyun.com/" target="_blank" rel="noreferrer noopener">${L("Open Alibaba Cloud Model Studio", "打开阿里云百炼")} ${icon("external", 12)}</a></div></div>
               <div><span>2</span><div><strong>${L("Put the key in .env on the server", "把密钥放在服务器的 .env")}</strong><p>${L("Never paste the key into browser code or commit it to GitHub. .env is ignored by git; the server sends it only to Qwen.", "不要把密钥写进浏览器代码或提交到 GitHub。.env 已被 git 忽略，密钥只由服务器发送给 Qwen。")}</p><button class="copy-line" type="button" data-copy="AI_PROVIDER=qwen&#10;QWEN_API_KEY=your-key-here"><code>AI_PROVIDER=qwen<br>QWEN_API_KEY=your-key-here</code> ${icon("copy", 12)}</button></div></div>
             </div>
             <p class="settings-footnote">${icon("info", 14)} ${L("The key stays server-side. Dictionary lookups are free; speech uses your browser.", "密钥只保存在服务器。查词是免费的，朗读使用浏览器。")}</p>`
        }
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><span class="settings-card__icon">${icon("rotate", 18)}</span><div><p class="eyebrow">${L("Memory", "记忆")}</p><h2>${L("Review plan", "复习计划")}</h2></div></div>
        <p class="settings-copy">${L("Word books and the Mistake Book use one of three curves: long-term, short-term, or mixed. You can switch words and mistakes on or off separately.", "单词书和错题本使用长期、短期或混合曲线。单词和错题可以分别开关。")}</p>
        <div class="settings-memory-modes"><span>${L("Long-term", "长期")} · 1/3/7/14/30d</span><span>${L("Short-term", "短期")} · 20m/1h/9h</span><span>${L("Mixed", "混合")} · ${L("both", "两者")}</span></div>
        <a class="btn btn--secondary btn--small" href="/app/vocabulary" data-link>${icon("rotate", 14)} ${L("Open memory plan", "打开记忆计划")}</a>
      </section>

      <section class="settings-card">
        <div class="settings-card__head"><span class="settings-card__icon">${icon("info", 18)}</span><div><p class="eyebrow">${L("Good to know", "说明")}</p><h2>${L("About Daymark", "关于 Daymark")}</h2></div></div>
        <ul class="settings-list">
          <li>${icon("check", 14)} ${L("Scores are practice estimates, not official IELTS results.", "分数只是练习估算，不是官方雅思成绩。")}</li>
          <li>${icon("check", 14)} ${L("Your account starts at zero. Progress is built from your own activity.", "账号从 0 开始，进度来自你自己的练习。")}</li>
          <li>${icon("check", 14)} ${L("There are no public profiles or leaderboards.", "没有公开主页或排行榜。")}</li>
          <li>${icon("info", 14)} ${L("Microphone access works best in Chrome or Edge on localhost or HTTPS.", "麦克风最好在 Chrome/Edge 的 localhost 或 HTTPS 下使用。")}</li>
          <li>${icon("info", 14)} ${L("Daymark stores only speech transcripts, not audio.", "Daymark 只保存语音转写，不保存音频。")}</li>
        </ul>
        <div class="settings-version">Daymark · version 1</div>
      </section>
    </div>
  </div>`;
}

export async function renderSettings(root, { signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  const user = store.user;
  if (!user) return () => {};
  root.innerHTML = pageHTML(user, store.aiConfigured, store.aiModel, store.aiProvider);

  root.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = applyTheme(button.dataset.themeOption);
      root.querySelectorAll("[data-theme-option]").forEach((each) => {
        const active = each.dataset.themeOption === selected;
        each.classList.toggle("is-active", active);
        each.setAttribute("aria-pressed", String(active));
        const existingCheck = each.querySelector(".theme-check");
        if (active && !existingCheck) {
          const check = document.createElement("span");
          check.className = "theme-check";
          check.innerHTML = icon("check", 15);
          each.appendChild(check);
        } else if (!active && existingCheck) {
          existingCheck.remove();
        }
      });
      toast("Theme updated.", { type: "success" });
    });
  });

  const form = root.querySelector("#profile-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.querySelector("#settings-name").value.trim();
    const level = form.querySelector("#settings-level").value;
    if (name.length < 2) {
      toast("Please enter a name with at least two characters.", { type: "error" });
      return;
    }
    const button = root.querySelector("#save-profile");
    setButtonLoading(button, true, "Saving…");
    try {
      const data = await api.patch("/api/me", { name, level });
      updateUser(data.user);
      document.querySelectorAll(".sidebar-profile__text strong").forEach((el) => (el.textContent = data.user.name));
      document.querySelectorAll(".sidebar-profile__text small").forEach((el) => (el.textContent = levelLabel(data.user.level)));
      setButtonLoading(button, false);
      toast("Settings saved.", { type: "success" });
    } catch (error) {
      setButtonLoading(button, false);
      toast(error.message, { type: "error" });
    }
  });

  root.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        toast("Copied.", { type: "success" });
      } catch {
        toast("Select the line and copy it manually.", { type: "error" });
      }
    });
  });

  root.querySelector("#sign-out")?.addEventListener("click", async () => {
    const confirmed = await confirmDialog({
      title: "Log out?",
      message: "Your work stays saved to your account.",
      confirmLabel: "Log out",
      cancelLabel: "Cancel"
    });
    if (!confirmed) return;
    try {
      await api.post("/api/auth/signout", {});
    } catch {}
    clearSession();
    navigate("/");
    toast("Logged out.", { type: "default" });
  });

  return () => controller.abort();
}

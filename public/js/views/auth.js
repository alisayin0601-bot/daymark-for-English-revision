import { api } from "../api.js";
import { setSession } from "../store.js";
import { L } from "../i18n.js";
import {
  escapeHTML,
  levelLabel,
  openModal,
  setButtonLoading,
  toast
} from "../ui.js";

function formContent(mode) {
  const isSignup = mode === "signup";
  return `<div class="auth-modal">
    <div class="auth-tabs" role="tablist" aria-label="Account">
      <button class="${!isSignup ? "is-active" : ""}" type="button" role="tab" aria-selected="${!isSignup}" data-auth-switch="signin">${L("Log in", "登录")}</button>
      <button class="${isSignup ? "is-active" : ""}" type="button" role="tab" aria-selected="${isSignup}" data-auth-switch="signup">${L("Create account", "注册")}</button>
    </div>
    <form class="auth-form auth-form--modal" id="daymark-auth-form" novalidate>
      <div id="auth-error"></div>
      ${isSignup
        ? `<div class="field">
            <label class="field__label" for="auth-name">${L("Name", "姓名")}</label>
            <input class="input" id="auth-name" name="name" type="text" autocomplete="name" placeholder="${L("Your name", "你的名字")}" maxlength="60" required>
          </div>`
        : ""}
      <div class="field">
        <label class="field__label" for="auth-email">${L("Email", "邮箱")}</label>
        <input class="input" id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
      </div>
      <div class="field">
        <label class="field__label" for="auth-password">${L("Password", "密码")} ${isSignup ? `<span class="field__hint">${L("At least 8 characters", "至少 8 个字符")}</span>` : ""}</label>
        <input class="input" id="auth-password" name="password" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="${isSignup ? L("Create a password", "设置密码") : L("Your password", "你的密码")}" minlength="${isSignup ? "8" : "1"}" required>
      </div>
      ${isSignup
        ? `<div class="field">
            <label class="field__label" for="auth-password-confirm">${L("Confirm password", "确认密码")}</label>
            <input class="input" id="auth-password-confirm" name="password2" type="password" autocomplete="new-password" placeholder="${L("Enter the password again", "再次输入密码")}" minlength="8" required>
          </div>`
        : ""}
      ${isSignup
        ? `<div class="field">
            <label class="field__label" for="auth-level">${L("Target band", "目标分数")}</label>
            <select class="select" id="auth-level" name="level">
              <option value="5-6">${levelLabel("5-6")}</option>
              <option value="6-7" selected>${levelLabel("6-7")}</option>
              <option value="7-8">${levelLabel("7-8")}</option>
            </select>
          </div>`
        : ""}
      <button class="btn btn--primary btn--full" type="submit" id="auth-submit">${isSignup ? L("Create account", "注册") : L("Log in", "登录")}</button>
    </form>
    <p class="auth-modal__switch">${isSignup ? L("Already have an account?", "已经有账号？") : L("New to Daymark?", "第一次来 Daymark？")} <button type="button" class="text-button" data-auth-switch="${isSignup ? "signin" : "signup"}">${isSignup ? L("Log in", "登录") : L("Create an account", "创建账号")}</button></p>
  </div>`;
}

export function openAuthModal(mode = "signin", { onSuccess } = {}) {
  let currentMode = mode === "signup" ? "signup" : "signin";
  const modal = openModal({
    title: currentMode === "signup" ? L("Create your account", "创建账号") : L("Welcome back", "欢迎回来"),
    subtitle: currentMode === "signup" ? L("Start with a clean account. Your progress begins at zero.", "从一个全新账号开始，进度从 0 起步。") : L("Pick up your saved practice.", "继续你保存的练习。"),
    size: "sm",
    content: formContent(currentMode)
  });
  if (!modal) return;
  const { panel, close } = modal;

  function focusForm() {
    const selector = currentMode === "signup" ? "#auth-name" : "#auth-email";
    panel.querySelector(selector)?.focus({ preventScroll: true });
  }

  function paintMode(nextMode) {
    currentMode = nextMode;
    const title = panel.querySelector(".modal-title");
    const subtitle = panel.querySelector(".modal-subtitle");
    if (title) title.textContent = currentMode === "signup" ? L("Create your account", "创建账号") : L("Welcome back", "欢迎回来");
    if (subtitle) subtitle.textContent =
      currentMode === "signup" ? L("Start with a clean account. Your progress begins at zero.", "从一个全新账号开始，进度从 0 起步。") : L("Pick up your saved practice.", "继续你保存的练习。");
    panel.querySelector(".modal-body").innerHTML = formContent(currentMode);
    bind();
    focusForm();
  }

  function bind() {
    panel.querySelectorAll("[data-auth-switch]").forEach((button) => {
      button.addEventListener("click", () => paintMode(button.dataset.authSwitch));
    });
    const form = panel.querySelector("#daymark-auth-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errorBox = panel.querySelector("#auth-error");
      const submit = panel.querySelector("#auth-submit");
      const email = form.email.value.trim();
      const password = form.password.value;
      const isSignup = currentMode === "signup";
      const confirmPassword = isSignup ? form.querySelector('[name="password2"]').value : "";
      const payload = isSignup
        ? {
            name: form.querySelector('[name="name"]').value.trim(),
            email,
            password,
            level: form.querySelector("#auth-level").value
          }
        : { email, password };
      if (isSignup && payload.name.length < 2) {
        errorBox.innerHTML = `<div class="form-error">${escapeHTML("Please enter your name.")}</div>`;
        return;
      }
      if (!email || !password || (isSignup && password.length < 8)) {
        errorBox.innerHTML = `<div class="form-error">${escapeHTML(isSignup ? "Enter a name, email and a password of at least 8 characters." : "Enter your email and password.")}</div>`;
        return;
      }
      if (isSignup && password !== confirmPassword) {
        errorBox.innerHTML = `<div class="form-error">${escapeHTML("The two passwords do not match.")}</div>`;
        return;
      }
      setButtonLoading(submit, true, isSignup ? L("Creating your account…", "正在创建账号…") : L("Logging in…", "正在登录…"));
      try {
        const data = await api.post(isSignup ? "/api/auth/signup" : "/api/auth/signin", payload);
        setSession(data.user, data.summary);
        close();
        toast(isSignup ? L("Account created. You’re starting at zero.", "账号已创建，进度从 0 开始。") : L(`Welcome back, ${data.user.name.split(" ")[0]}.`, `欢迎回来，${data.user.name.split(" ")[0]}。`), { type: "success" });
        if (typeof onSuccess === "function") onSuccess(data);
        else window.location.reload();
      } catch (error) {
        errorBox.innerHTML = `<div class="form-error">${escapeHTML(error.message)}</div>`;
        setButtonLoading(submit, false);
      }
    });
  }

  bind();
  focusForm();
  setTimeout(focusForm, 0);
}

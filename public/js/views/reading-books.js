import { api } from "../api.js";
import { icon } from "../icons.js";
import { L, getLang } from "../i18n.js";
import { speak } from "../speech.js";
import {
  confirmDialog,
  escapeHTML,
  escapeAttr,
  openModal,
  setButtonLoading,
  toast
} from "../ui.js";

function bookCard(book) {
  return `<button class="reading-book-card" type="button" data-open-reading-book="${book.id}">
    <span class="reading-book-card__mark"><span></span><span></span><span></span></span>
    <span class="reading-book-card__title">${escapeHTML(book.name)}</span>
    <span class="reading-book-card__meta">${book.articleCount} / 30 ${L("articles", "篇文章")}</span>
    <span class="reading-book-card__foot">${L("Open book", "打开这本书")} ${icon("arrowRight", 14)}</span>
  </button>`;
}

function libraryHTML(data) {
  return `<div class="page-enter reading-books-page">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">${L("Reading library", "阅读书库")}</p>
        <h1>${L("Reading books", "阅读书")}</h1>
        <p>${L("Keep up to three books with up to 30 articles each. Create your own or save a daily passage.", "最多 3 本书，每本最多 30 篇文章。可以自建文章，也可以收藏每日阅读。")}</p>
      </div>
      <div class="page-heading__actions"><button class="btn btn--primary" type="button" data-new-reading-book>${icon("plus", 16)} ${L("New reading book", "新建阅读书")}</button></div>
    </header>
    ${data.books.length ? `<div class="reading-book-grid">${data.books.map(bookCard).join("")}</div>` : `<div class="empty-state book-empty"><div class="empty-state__art">${icon("bookOpen", 26)}</div><h3>${L("No reading books yet", "还没有阅读书")}</h3><p>${L("Create a book, then add an article or save today's passage.", "先创建一本书，再添加文章或收藏今日阅读。")}</p><button class="btn btn--primary btn--small" type="button" data-new-reading-book>${L("Create my first book", "创建第一本书")}</button></div>`}
    <div class="reading-save-hint">${icon("info", 15)} ${L("Daily passage pages can save straight into one of these books.", "每日阅读页面可以直接把文章收藏进这些书里。")}</div>
  </div>`;
}

function articleRow(article) {
  return `<div class="reading-article-row">
    <button class="reading-article-row__main" type="button" data-open-article="${article.id}"><strong>${escapeHTML(article.title)}</strong><span>${article.word_count} ${L("words", "词")} · ${new Date(Number(article.created_at)).toLocaleDateString()}</span></button>
    <button class="icon-button" type="button" data-set-current="${article.id}" aria-label="${L("Use on Reading home", "设为阅读首页文章")}" title="${L("Use on Reading home", "设为阅读首页文章")}">${icon("home", 15)}</button>
    <button class="icon-button" type="button" data-delete-article="${article.id}" aria-label="${L("Delete article", "删除文章")}">${icon("trash", 15)}</button>
  </div>`;
}

function detailHTML(data) {
  const book = data.book;
  return `<div class="page-enter reading-book-detail">
    <a class="back-link" href="/app/reading-books" data-link>${icon("arrowLeft", 15)} ${L("All reading books", "所有阅读书")}</a>
    <header class="page-heading">
      <div class="page-heading__copy"><p class="eyebrow">${L("Reading book", "阅读书")} · ${book.articleCount}/30</p><h1>${escapeHTML(book.name)}</h1><p>${L("Read, tap a word to look it up, or listen to the article.", "阅读时可以点词查义，也可以听整篇文章。")}</p></div>
      <div class="page-heading__actions"><button class="btn btn--ghost btn--small" type="button" data-delete-reading-book="${book.id}">${icon("trash", 14)} ${L("Delete book", "删除书")}</button><button class="btn btn--primary btn--small" type="button" data-add-article="${book.id}" ${book.articleCount >= 30 ? "disabled" : ""}>${icon("plus", 14)} ${L("New article", "新建文章")}</button></div>
    </header>
    <div class="reading-article-list">
      ${data.articles.length ? data.articles.map(articleRow).join("") : `<div class="empty-state collections-empty"><div class="empty-state__art">${icon("book", 24)}</div><h3>${L("This book is empty", "这本书还是空的")}</h3><p>${L("Write an article yourself, or save a daily passage into this book.", "自己写一篇文章，或从每日阅读收藏一篇。")}</p><button class="btn btn--primary btn--small" type="button" data-add-article="${book.id}">${L("Add the first article", "添加第一篇文章")}</button></div>`}
    </div>
  </div>`;
}

export function renderArticleHTML(body) {
  const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return String(body || "").split(/\n+/).map((paragraph) => {
    const safe = escape(paragraph.trim());
    if (!safe) return "";
    return `<p>${safe.replace(/\b([A-Za-z][A-Za-z'-]{1,})\b/g, '<button class="reader-word" type="button" data-reader-word="$1">$1</button>')}</p>`;
  }).join("");
}

function openReader(article) {
  const modal = openModal({
    title: article.title,
    subtitle: `${article.word_count} ${L("words", "词")} · ${L("Tap any English word", "点击任意英文单词")}`,
    size: "lg",
    content: `<div class="article-reader">
      <div class="article-reader__actions"><button class="btn btn--secondary btn--small" type="button" id="read-article-aloud">${icon("volume", 15)} ${L("Read aloud", "朗读全文")}</button><button class="btn btn--primary btn--small" type="button" id="set-article-current">${icon("home", 14)} ${L("Use on Reading home", "设为阅读首页")}</button><span>${icon("info", 14)} ${L("Tap a word to hear it and see its meaning.", "点击单词会发音并显示释义。")}</span></div>
      <article class="article-reader__body">${renderArticleHTML(article.body)}</article>
      <div class="article-lookup" id="article-lookup">${L("Tap a word to see its meaning.", "点击一个单词查看释义。")}</div>
    </div>`
  });
  if (!modal) return;
  const { panel } = modal;
  const lookup = panel.querySelector("#article-lookup");
  panel.querySelector("#read-article-aloud")?.addEventListener("click", () => speak(article.body, { accent: "British", rate: 0.9 }));
  panel.querySelector("#set-article-current")?.addEventListener("click", async () => {
    try {
      await api.post(`/api/reading-articles/${article.id}/current`, {});
      toast(L("This article now opens on the Reading page.", "已设为阅读首页文章。"), { type: "success" });
    } catch (error) {
      toast(error.message, { type: "error" });
    }
  });
  panel.querySelector(".modal-body")?.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-reader-word]");
    if (!target) return;
    const word = target.dataset.readerWord;
    speak(word, { accent: "British", rate: 0.8 });
    lookup.innerHTML = `<span class="spinner"></span> ${L("Looking up…", "查询中…")}`;
    try {
      const wantChinese = getLang() === "zh";
      const data = await api.get(`/api/dictionary?word=${encodeURIComponent(word)}&lang=${wantChinese ? "zh" : "en"}`);
      const entry = data.entry;
      lookup.innerHTML = `<div class="article-lookup__head"><div><strong>${escapeHTML(entry.word)}</strong><span>${escapeHTML(entry.phonetic || "")}</span></div><button class="icon-button" type="button" id="say-looked-word">${icon("volume", 16)}</button></div>
        ${wantChinese && entry.meaningZh ? `<p class="article-lookup__meaning">${escapeHTML(entry.meaningZh)}</p>` : ""}
        ${(entry.entries || []).slice(0, 3).map((item) => `<div class="article-lookup__entry"><span>${escapeHTML(item.pos || "")}</span><p>${escapeHTML(wantChinese && item.definitionZh ? item.definitionZh : item.definition)}</p>${item.example ? `<small>${escapeHTML(item.example)}</small>` : ""}</div>`).join("")}`;
      lookup.querySelector("#say-looked-word")?.addEventListener("click", () => speak(entry.word, { accent: "British", rate: 0.8 }));
    } catch (error) {
      lookup.innerHTML = `<p class="form-error">${escapeHTML(error.message)}</p>`;
    }
  });
}

function openNewBook({ onSaved }) {
  const modal = openModal({
    title: L("New reading book", "新建阅读书"),
    subtitle: L("You can keep up to three books.", "最多可以保留 3 本书。"),
    size: "sm",
    content: `<form id="new-reading-book-form" class="auth-form auth-form--modal"><div class="field"><label class="field__label">${L("Book name", "书名")}</label><input class="input" id="reading-book-name" maxlength="60" required placeholder="${L("e.g. Environment articles", "例如：环境主题文章")}"></div><button class="btn btn--primary btn--full" type="submit">${L("Create book", "创建书")}</button></form>`
  });
  if (!modal) return;
  const { panel, close } = modal;
  panel.querySelector("#new-reading-book-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = panel.querySelector("#reading-book-name").value.trim();
    if (!name) return;
    const button = event.submitter || panel.querySelector("button[type=submit]");
    setButtonLoading(button, true);
    try {
      await api.post("/api/reading-books", { name });
      close();
      toast(L("Reading book created.", "阅读书已创建。"), { type: "success" });
      onSaved?.();
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
}

function openNewArticle(bookId, { onSaved }) {
  const modal = openModal({
    title: L("New article", "新建文章"),
    subtitle: L("Leave the title blank to use today's date.", "标题留空会自动使用当天日期。"),
    size: "lg",
    content: `<form id="new-article-form" class="auth-form auth-form--modal"><div class="field"><label class="field__label">${L("Title (optional)", "标题（选填）")}</label><input class="input" id="article-title" maxlength="160" placeholder="${L("Untitled article will be named with today's date", "不填写则使用当天日期")}"></div><div class="field"><label class="field__label">${L("Article text", "文章正文")}</label><textarea class="textarea" id="article-body" rows="13" required placeholder="${L("Paste or write the article here. Separate paragraphs with a blank line.", "在这里粘贴或撰写文章，用空行分段。")}"></textarea></div><button class="btn btn--primary btn--full" type="submit">${L("Save article", "保存文章")}</button></form>`
  });
  if (!modal) return;
  const { panel, close } = modal;
  panel.querySelector("#new-article-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = panel.querySelector("#article-title").value.trim();
    const body = panel.querySelector("#article-body").value.trim();
    if (!body) return;
    const button = event.submitter || panel.querySelector("button[type=submit]");
    setButtonLoading(button, true, L("Saving…", "保存中…"));
    try {
      await api.post(`/api/reading-books/${bookId}/articles`, { title, body });
      close();
      toast(L("Article saved.", "文章已保存。"), { type: "success" });
      onSaved?.();
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
}

export async function openSaveReadingModal(passage, { onSaved } = {}) {
  let data;
  try {
    data = await api.get("/api/reading-books");
  } catch (error) {
    toast(error.message, { type: "error" });
    return;
  }
  const body = (passage.paragraphs || []).join("\n\n");
  const title = passage.title || "";
  const modal = openModal({
    title: L("Save to a reading book", "保存到阅读书"),
    subtitle: L("The passage will be copied into the book and stay readable offline.", "文章会复制到书中，之后可以随时阅读。"),
    size: "sm",
    content: data.books.length
      ? `<form id="save-reading-form" class="auth-form auth-form--modal"><div class="field"><label class="field__label">${L("Choose a book", "选择阅读书")}</label><select class="select" id="save-reading-book">${data.books.map((book) => `<option value="${book.id}">${escapeHTML(book.name)} (${book.articleCount}/30)</option>`).join("")}</select></div><button class="btn btn--primary btn--full" type="submit">${L("Save passage", "保存文章")}</button></form>`
      : `<div class="empty-state"><div class="empty-state__art">${icon("book", 24)}</div><h3>${L("Create a reading book first", "请先创建一本阅读书")}</h3><p>${L("You can keep up to three reading books.", "最多可以创建 3 本阅读书。")}</p><a class="btn btn--primary btn--small" href="/app/reading-books" data-link>${L("Go to reading books", "前往阅读书")}</a></div>`
  });
  if (!modal || !data.books.length) return;
  const { panel, close } = modal;
  panel.querySelector("#save-reading-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const bookId = panel.querySelector("#save-reading-book").value;
    const button = event.submitter || panel.querySelector("button[type=submit]");
    setButtonLoading(button, true, L("Saving…", "保存中…"));
    try {
      await api.post(`/api/reading-books/${bookId}/articles`, { title, body, source: "daily", sourceReadingId: passage.id });
      close();
      toast(L("Passage saved to your reading book.", "文章已保存到阅读书。"), { type: "success" });
      onSaved?.();
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
}

export async function renderReadingBooks(root, { signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  let library = null;
  let detail = null;
  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-card" style="margin-top:24px;min-height:260px"></div></div>`;

  async function loadLibrary() {
    library = await api.get("/api/reading-books", { signal: controller.signal });
    detail = null;
    root.innerHTML = libraryHTML(library);
  }
  async function loadBook(id) {
    detail = await api.get(`/api/reading-books/${id}`, { signal: controller.signal });
    root.innerHTML = detailHTML(detail);
  }
  async function openBook(id) {
    try { await loadBook(id); } catch (error) { toast(error.message, { type: "error" }); }
  }

  root.addEventListener("click", async (event) => {
    const newBook = event.target.closest("[data-new-reading-book]");
    if (newBook) return openNewBook({ onSaved: () => loadLibrary().catch((error) => toast(error.message, { type: "error" })) });
    const book = event.target.closest("[data-open-reading-book]");
    if (book) return openBook(Number(book.dataset.openReadingBook));
    const addArticle = event.target.closest("[data-add-article]");
    if (addArticle) return openNewArticle(Number(addArticle.dataset.addArticle), { onSaved: () => openBook(Number(addArticle.dataset.addArticle)) });
    const article = event.target.closest("[data-open-article]");
    if (article) {
      try { const data = await api.get(`/api/reading-articles/${article.dataset.openArticle}`); openReader(data.article); } catch (error) { toast(error.message, { type: "error" }); }
      return;
    }
    const setCurrent = event.target.closest("[data-set-current]");
    if (setCurrent) {
      try {
        await api.post(`/api/reading-articles/${setCurrent.dataset.setCurrent}/current`, {});
        toast(L("This article now opens on the Reading page.", "已设为阅读首页文章。"), { type: "success" });
      } catch (error) {
        toast(error.message, { type: "error" });
      }
      return;
    }
    const deleteArticle = event.target.closest("[data-delete-article]");
    if (deleteArticle) {
      const confirmed = await confirmDialog({ title: L("Delete this article?", "删除这篇文章？"), message: L("This cannot be undone.", "删除后无法恢复。"), confirmLabel: L("Delete", "删除"), danger: true });
      if (!confirmed) return;
      try { await api.delete(`/api/reading-articles/${deleteArticle.dataset.deleteArticle}`); await loadBook(detail.book.id); } catch (error) { toast(error.message, { type: "error" }); }
      return;
    }
    const deleteBook = event.target.closest("[data-delete-reading-book]");
    if (deleteBook) {
      const confirmed = await confirmDialog({ title: L("Delete this reading book?", "删除这本阅读书？"), message: L("The book and all its articles will be removed.", "书和其中所有文章都会被删除。"), confirmLabel: L("Delete", "删除"), danger: true });
      if (!confirmed) return;
      try { await api.delete(`/api/reading-books/${deleteBook.dataset.deleteReadingBook}`); toast(L("Reading book deleted.", "阅读书已删除。"), { type: "success" }); await loadLibrary(); } catch (error) { toast(error.message, { type: "error" }); }
    }
  }, { signal: controller.signal });

  try { await loadLibrary(); } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">${L("Could not load", "加载失败")}</p><h1>${L("Your reading books are unavailable.", "阅读书加载失败。")}</h1><p>${escapeHTML(error.message)}</p></div>`;
  }
  return () => controller.abort();
}

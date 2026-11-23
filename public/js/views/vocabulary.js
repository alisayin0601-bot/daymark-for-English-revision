import { api } from "../api.js";
import { icon } from "../icons.js";
import { L } from "../i18n.js";
import { navigate } from "../router.js";
import { speak } from "../speech.js";
import {
  confirmDialog,
  escapeHTML,
  escapeAttr,
  openModal,
  setButtonLoading,
  toast
} from "../ui.js";

const RETENTION = [
  { hours: 0, label: "0", retention: 100 },
  { hours: 0.333, label: "20m", retention: 58.2 },
  { hours: 1, label: "1h", retention: 44.2 },
  { hours: 9, label: "9h", retention: 35.8 },
  { hours: 24, label: "1d", retention: 33.7 },
  { hours: 48, label: "2d", retention: 27.8 },
  { hours: 144, label: "6d", retention: 25.4 },
  { hours: 744, label: "31d", retention: 21.1 }
];

function modeInfo(mode) {
  if (mode === "long") return { name: L("Long-term", "长期记忆"), detail: L("1 / 3 / 7 / 14 / 30 days", "第 1 / 3 / 7 / 14 / 30 天") };
  if (mode === "short") return { name: L("Short-term", "短期记忆"), detail: L("20m / 1h / 9h", "20 分钟 / 1 小时 / 9 小时") };
  return { name: L("Mixed", "混合记忆"), detail: L("Same-day + long-term", "当天 + 长期") };
}

function smoothPath(points) {
  if (!points.length) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    d += ` C${midX},${current.y} ${midX},${next.y} ${next.x},${next.y}`;
  }
  return d;
}

function ebbinghausChart() {
  const width = 720;
  const height = 296;
  const left = 52;
  const right = 26;
  const top = 30;
  const bottom = 48;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const maxLog = Math.log10(745);
  const points = RETENTION.map((point) => ({
    ...point,
    x: left + (Math.log10(point.hours + 1) / maxLog) * plotW,
    y: top + ((100 - point.retention) / 100) * plotH
  }));
  const path = smoothPath(points);
  const area = `${path} L${points[points.length - 1].x},${top + plotH} L${points[0].x},${top + plotH} Z`;
  const labels = points.map((point, index) => {
    const above = index % 2 === 0;
    const textY = above ? point.y - 12 : point.y + 20;
    return `<text x="${point.x.toFixed(1)}" y="${textY.toFixed(1)}" text-anchor="${index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}" fill="var(--dm-ink-soft)" font-size="10" font-weight="600">${point.retention}%</text>
      <text x="${point.x.toFixed(1)}" y="${top + plotH + 19}" text-anchor="${index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}" fill="var(--dm-muted)" font-size="9">${point.label}</text>`;
  }).join("");
  return `<svg class="ebbinghaus-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(L("Ebbinghaus memory retention curve", "艾宾浩斯记忆保持曲线"))}">
    <defs><linearGradient id="memory-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--dm-accent)" stop-opacity=".17"/><stop offset="1" stop-color="var(--dm-accent)" stop-opacity="0"/></linearGradient></defs>
    ${[0, 25, 50, 75, 100].map((value) => { const y = top + ((100 - value) / 100) * plotH; return `<line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="var(--dm-line)" stroke-dasharray="${value === 0 ? "0" : "3 5"}" /><text x="${left - 12}" y="${y + 3}" text-anchor="end" fill="var(--dm-muted)" font-size="9">${value}%</text>`; }).join("")}
    <path d="${area}" fill="url(#memory-area)" />
    <path d="${path}" fill="none" stroke="var(--dm-accent)" stroke-width="2.4" stroke-linecap="round" />
    ${points.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" fill="var(--dm-panel)" stroke="var(--dm-accent)" stroke-width="2" />`).join("")}
    ${labels}
    <text x="${left}" y="${height - 9}" fill="var(--dm-muted)" font-size="9">${L("Time after learning (log scale)", "学习后经过的时间（对数刻度）")}</text>
  </svg>`;
}

function memoryMini(prefs) {
  const info = modeInfo(prefs.mode);
  return `<button class="memory-mini" type="button" data-open-memory>
    <span class="memory-mini__icon">${icon("rotate", 17)}</span>
    <span class="memory-mini__copy"><span>${L("Memory curve", "记忆曲线")}</span><strong>${info.name}</strong></span>
    <span class="memory-mini__detail">${info.detail}</span>
    ${icon("chevronDown", 16)}
  </button>`;
}

export function openMemoryModal(data, onSaved) {
  let mode = data.prefs.mode;
  let words = data.prefs.words;
  let mistakes = data.prefs.mistakes;
  const modal = openModal({
    title: L("Memory curve", "记忆曲线"),
    subtitle: L("Ebbinghaus retention and the review plan you want to use.", "艾宾浩斯记忆保持率，以及你要使用的复习计划。"),
    size: "lg",
    content: `<div class="ebbinghaus-wrap">${ebbinghausChart()}</div>
      <p class="ebbinghaus-caption">${L("Retention drops fastest in the first day. Short reviews catch it early; long reviews bring it back at wider intervals.", "记忆在第一天下降最快。短期复习及时接住，长期复习把间隔逐步拉长。")}</p>
      <div class="memory-mode-options">${["long", "short", "mixed"].map((key) => { const info = modeInfo(key); return `<button class="memory-mode-option ${key === mode ? "is-active" : ""}" type="button" data-memory-mode="${key}"><strong>${info.name}</strong><span>${info.detail}</span></button>`; }).join("")}</div>
      <p class="memory-explain">${L("Long-term: reviews on days 1, 3, 7, 14 and 30. Short-term: reviews after 20 minutes, 1 hour and 9 hours. Mixed uses both.", "长期：第 1、3、7、14、30 天复习。短期：20 分钟、1 小时、9 小时后复习。混合模式两者都有。")}</p>
      <div class="memory-toggles"><label><input type="checkbox" id="memory-words" ${words ? "checked" : ""}> ${L("Include word books", "单词加入记忆计划")}</label><label><input type="checkbox" id="memory-mistakes" ${mistakes ? "checked" : ""}> ${L("Include mistakes", "错题加入记忆计划")}</label></div>
      <button class="btn btn--primary btn--full" type="button" id="save-memory">${L("Apply plan", "应用计划")}</button>`
  });
  if (!modal) return;
  const { panel, close } = modal;
  panel.querySelectorAll("[data-memory-mode]").forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.memoryMode;
    panel.querySelectorAll("[data-memory-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
  }));
  panel.querySelector("#save-memory")?.addEventListener("click", async () => {
    words = panel.querySelector("#memory-words").checked;
    mistakes = panel.querySelector("#memory-mistakes").checked;
    const button = panel.querySelector("#save-memory");
    setButtonLoading(button, true, L("Applying…", "应用中…"));
    try {
      await api.patch("/api/memory", { mode, words, mistakes });
      close();
      toast(L("Memory plan updated.", "记忆计划已更新。"), { type: "success" });
      onSaved?.();
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
}

function wordStatus(word) {
  if (word.done) return L("Mastered", "已掌握");
  if (word.learned) return L("Learning", "学习中");
  return L("New", "未学习");
}

function wordRow(word) {
  const due = word.learned && !word.done && Number(word.nextReviewAt) <= Date.now();
  return `<div class="book-word-row">
    <div class="book-word-row__main"><strong>${escapeHTML(word.word)}</strong><span>${escapeHTML(word.phonetic || "")}${word.partOfSpeech ? ` · ${escapeHTML(word.partOfSpeech)}` : ""}</span></div>
    <div class="book-word-row__meaning">${escapeHTML(word.meaningZh)}</div>
    <div class="book-word-row__status">${due ? `<span class="word-due-dot"></span> ${L("Due", "到期")}` : wordStatus(word)}</div>
    <button class="icon-button" type="button" data-delete-word="${word.id}" aria-label="${L("Remove word", "删除单词")}">${icon("trash", 14)}</button>
  </div>`;
}

function builtinHTML(books, addedKeys) {
  const available = books.filter((book) => !addedKeys.has(book.key));
  if (!available.length) return "";
  return `<section class="vocab-builtin">
    <div class="vocab-section-head"><div><p class="eyebrow">${L("Built-in library", "内置词库")}</p><h2>${L("Add an IELTS book", "添加雅思词书")}</h2></div></div>
    <div class="builtin-grid">${available.map((book) => `<article class="builtin-card">
      <span class="builtin-card__level">${escapeHTML(book.level.replace("-", "–"))}</span>
      <h3>${escapeHTML(book.name)}</h3><p>${escapeHTML(book.nameZh)}</p><span>${book.wordCount} ${L("words", "词")}</span>
      <button class="btn btn--secondary btn--small" type="button" data-add-builtin="${escapeAttr(book.key)}">${L("Add to my books", "添加到我的词书")}</button>
    </article>`).join("")}</div>
  </section>`;
}

function pageHTML(state) {
  const { library, book, words, allWords, prefs } = state;
  const addedKeys = new Set(library.books.map((item) => item.templateKey).filter(Boolean));
  const due = allWords.filter((word) => word.learned && !word.done && Number(word.nextReviewAt) <= Date.now());
  const fresh = allWords.filter((word) => !word.learned);
  const options = library.books.map((item) => `<option value="${item.id}" ${book?.id === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("");
  return `<div class="page-enter words-home">
    <header class="page-heading words-head">
      <div class="page-heading__copy">
        <p class="eyebrow">${L("Vocabulary", "词汇")}</p>
        <h1>${L("Word study", "背单词")}</h1>
        <p>${L("A daily mix of new words and words the curve brings back.", "每天学新词，也复习记忆曲线带回来的旧词。")}</p>
      </div>
      <div class="words-head__actions">
        <label class="book-switch"><span>${L("Word book", "词书")}</span><select id="book-switch">${options || `<option>${L("No books yet", "还没有词书")}</option>`}</select></label>
        <button class="btn btn--primary btn--small" type="button" data-open-add-book>${icon("plus", 15)} ${L("New", "新建")}</button>
      </div>
    </header>
    ${book ? memoryMini(prefs) : ""}
    ${book
      ? `<section class="daily-study-card">
          <div class="daily-study-card__copy"><p class="eyebrow">${L("Today's words", "今日单词")}</p><h2>${L("New + review", "新词 + 复习")}</h2><p>${fresh.length} ${L("new words", "个新词")} · ${due.length} ${L("words due", "个到期词")} ${L("from your memory curve", "来自记忆曲线")}</p></div>
          <div class="daily-study-card__counts"><div><strong>${fresh.length}</strong><span>${L("new", "新词")}</span></div><div><strong>${due.length}</strong><span>${L("due", "到期")}</span></div><div><strong>${book.wordCount}</strong><span>${L("total", "总词")}</span></div></div>
          <div class="daily-word-tags">${fresh.length ? `<div><span>${L("New", "新词")}</span>${fresh.slice(0, 6).map((word) => `<b>${escapeHTML(word.word)}</b>`).join("")}${fresh.length > 6 ? `<em>+${fresh.length - 6}</em>` : ""}</div>` : ""}${due.length ? `<div><span>${L("Due", "到期")}</span>${due.slice(0, 6).map((word) => `<b>${escapeHTML(word.word)}</b>`).join("")}${due.length > 6 ? `<em>+${due.length - 6}</em>` : ""}</div>` : ""}</div>
          <div class="daily-study-card__controls">
            <label>${L("Words", "数量")}<input id="study-count" type="number" min="1" max="100" value="10"></label>
            <label>${L("Spelling after quiz", "测试后拼写")}<select id="study-spelling"><option value="zh">${L("Chinese → English", "看中文拼英文")}</option><option value="listen">${L("Audio → English", "听音拼英文")}</option><option value="both">${L("Both", "两种都做")}</option><option value="none">${L("Off", "关闭")}</option></select></label>
            <button class="btn btn--primary" type="button" data-start-study data-count="${book.id}">${L("Start session", "开始学习")} ${icon("arrowRight", 15)}</button>
          </div>
        </section>`
      : `<section class="words-empty"><div class="empty-state__art">${icon("bookOpen", 26)}</div><h2>${L("Start with a word book", "先选一本词书")}</h2><p>${L("Create your own book or add a built-in IELTS book.", "创建自己的词书，或添加内置雅思词书。")}</p><button class="btn btn--primary btn--small" type="button" data-open-add-book>${L("Add a book", "添加词书")}</button></section>`}
    ${book ? `<section class="words-list-section">
      <div class="vocab-section-head"><div><p class="eyebrow">${L("All words", "全部单词")}</p><h2>${escapeHTML(book.name)} <span>${book.wordCount} / 1000</span></h2></div><div class="vocab-word-actions"><label class="vocab-search-inline">${icon("search", 14)}<input id="word-search" placeholder="${L("Search words", "搜索单词")}"></label><button class="btn btn--secondary btn--small" type="button" data-add-words>${icon("plus", 14)} ${L("Add words", "添加单词")}</button><button class="btn btn--ghost btn--small" type="button" data-book-menu>${icon("settings", 14)} ${L("Manage", "管理")}</button></div></div>
      <div class="book-word-list" id="word-list">${words.length ? words.map(wordRow).join("") : `<div class="empty-state collections-empty"><div class="empty-state__art">${icon("plus", 24)}</div><h3>${L("This book is empty", "这本词书还是空的")}</h3><p>${L("Add your own words or paste a list.", "自己添加，或批量粘贴。")}</p><button class="btn btn--primary btn--small" type="button" data-add-words>${L("Add words", "添加单词")}</button></div>`}</div>
    </section>` : ""}
    ${builtinHTML(library.builtin, addedKeys)}
  </div>`;
}

function parseBulk(text) {
  return String(text || "").replace(/\r\n/g, "\n").split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(/\t|\s*\|\s*|\s*,\s*/).map((item) => item.trim());
    return { word: parts[0] || "", phonetic: parts[1] || "", partOfSpeech: parts[2] || "", meaningZh: parts[3] || "", exampleEn: parts[4] || "", exampleZh: parts[5] || "" };
  });
}

function openAddBookModal(library, onAdded) {
  const addedKeys = new Set(library.books.map((item) => item.templateKey).filter(Boolean));
  const builtins = library.builtin.filter((book) => !addedKeys.has(book.key));
  const modal = openModal({
    title: L("Add a word book", "添加单词书"),
    subtitle: L("Up to five books, 1,000 words each.", "最多 5 本，每本最多 1000 词。"),
    size: "md",
    content: `<form id="book-create-form" class="auth-form auth-form--modal"><div class="field"><label class="field__label">${L("Create a blank book", "新建空白词书")}</label><div class="inline-form"><input class="input" id="new-book-name" maxlength="60" placeholder="${L("Book name", "词书名称")}"><button class="btn btn--primary btn--small" type="submit">${L("Create", "创建")}</button></div></div></form>
      ${builtins.length ? `<div class="modal-divider"></div><p class="field__label">${L("Built-in IELTS books", "内置雅思词书")}</p><div class="builtin-add-list">${builtins.map((book) => `<div><span><strong>${book.level.replace("-", "–")}</strong> ${book.name} · ${book.wordCount} ${L("words", "词")}</span><button class="btn btn--secondary btn--small" type="button" data-modal-builtin="${book.key}">${L("Add", "添加")}</button></div>`).join("")}</div>` : ""}`
  });
  if (!modal) return;
  const { panel, close } = modal;
  panel.querySelector("#book-create-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = panel.querySelector("#new-book-name").value.trim();
    if (!name) return;
    const button = event.submitter || panel.querySelector("#book-create-form button[type=submit]");
    setButtonLoading(button, true);
    try {
      const result = await api.post("/api/word-books", { name });
      close();
      toast(L("Word book created.", "单词书已创建。"), { type: "success" });
      onAdded?.(result.book.id);
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
  panel.querySelectorAll("[data-modal-builtin]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const result = await api.post(`/api/builtin-books/${button.dataset.modalBuiltin}/add`, {});
      close();
      toast(`${L("Added", "已添加")} ${result.added} ${L("words", "个单词")}.`, { type: "success" });
      onAdded?.(result.book.id);
    } catch (error) {
      button.disabled = false;
      toast(error.message, { type: "error" });
    }
  }));
}

function openAddWordsModal(bookId, onSaved) {
  const modal = openModal({
    title: L("Add words", "添加单词"),
    subtitle: L("One word, or paste multiple lines in the format: word, phonetic, part of speech, Chinese meaning, English example, example translation.", "可以添加一个单词，或批量粘贴：单词, 音标, 词性, 中文释义, 英文例句, 例句翻译。"),
    size: "md",
    content: `<div class="add-word-tabs"><button class="is-active" type="button" data-added-tab="bulk">${L("Bulk paste", "批量粘贴")}</button><button type="button" data-added-tab="single">${L("One word", "单个添加")}</button></div>
      <form id="add-words-form" class="auth-form auth-form--modal">
        <div data-add-panel="bulk"><textarea class="textarea" name="bulk" rows="10" placeholder="resilient, /rɪˈzɪliənt/, adjective, 有韧性的, Children can be resilient., 孩子们可以很有韧性。"></textarea></div>
        <div data-add-panel="single" hidden>
          <div class="field"><label class="field__label">${L("English word", "英文单词")}</label><input class="input" name="word"></div>
          <div class="field-grid"><div class="field"><label class="field__label">${L("Phonetic", "音标")}</label><input class="input" name="phonetic"></div><div class="field"><label class="field__label">${L("Part of speech", "词性")}</label><input class="input" name="partOfSpeech"></div></div>
          <div class="field"><label class="field__label">${L("Chinese meaning", "中文释义")}</label><input class="input" name="meaningZh"></div>
          <div class="field"><label class="field__label">${L("English example", "英文例句")}</label><input class="input" name="exampleEn"></div>
          <div class="field"><label class="field__label">${L("Example translation", "例句翻译")}</label><input class="input" name="exampleZh"></div>
        </div>
        <button class="btn btn--primary btn--full" type="submit">${L("Save words", "保存单词")}</button>
      </form>`
  });
  if (!modal) return;
  const { panel, close } = modal;
  let tab = "bulk";
  panel.querySelectorAll("[data-added-tab]").forEach((button) => button.addEventListener("click", () => {
    tab = button.dataset.addedTab;
    panel.querySelectorAll("[data-added-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
    panel.querySelectorAll("[data-add-panel]").forEach((item) => (item.hidden = item.dataset.addPanel !== tab));
  }));
  panel.querySelector("#add-words-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const words = tab === "bulk" ? parseBulk(new FormData(form).get("bulk")) : [Object.fromEntries(new FormData(form).entries())];
    if (!words.length) return;
    const button = form.querySelector("button[type=submit]");
    setButtonLoading(button, true, L("Saving…", "保存中…"));
    try {
      const result = await api.post(`/api/word-books/${bookId}/words`, { words });
      close();
      toast(`${L("Added", "已添加")} ${result.added}${result.skipped ? ` · ${L("skipped", "跳过")} ${result.skipped}` : ""}.`, { type: "success" });
      onSaved?.();
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  });
}

function openBookMenu(book, onChanged) {
  const modal = openModal({
    title: L("Manage word book", "管理单词书"),
    subtitle: book.name,
    size: "sm",
    content: `<form id="rename-book-form" class="auth-form auth-form--modal"><div class="field"><label class="field__label">${L("Rename", "重命名")}</label><div class="inline-form"><input class="input" id="rename-book-name" maxlength="60" value="${escapeAttr(book.name)}"><button class="btn btn--secondary btn--small" type="submit">${L("Save", "保存")}</button></div></div></form>
      <div class="modal-divider"></div>
      <button class="btn btn--ghost btn--small btn--danger-text" type="button" id="delete-current-book">${icon("trash", 14)} ${L("Delete this book", "删除这本词书")}</button>`
  });
  if (!modal) return;
  const { panel, close } = modal;
  panel.querySelector("#rename-book-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = panel.querySelector("#rename-book-name").value.trim();
    if (!name) return;
    try {
      await api.patch(`/api/word-books/${book.id}`, { name });
      close();
      toast(L("Renamed.", "已重命名。"), { type: "success" });
      onChanged?.();
    } catch (error) { toast(error.message, { type: "error" }); }
  });
  panel.querySelector("#delete-current-book")?.addEventListener("click", async () => {
    const confirmed = await confirmDialog({ title: L("Delete this book?", "删除这本词书？"), message: L("All words in it will be removed.", "书里的所有单词都会被删除。"), confirmLabel: L("Delete", "删除"), danger: true });
    if (!confirmed) return;
    try {
      await api.delete(`/api/word-books/${book.id}`);
      close();
      toast(L("Word book deleted.", "词书已删除。"), { type: "default" });
      onChanged?.();
    } catch (error) { toast(error.message, { type: "error" }); }
  });
}

export async function renderVocabulary(root, { signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  let library;
  let book = null;
  let words = [];
  let search = "";
  let activeId = Number(localStorage.getItem("daymark-active-book")) || null;

  async function loadLibrary(preferredId = activeId) {
    library = await api.get("/api/word-books", { signal: controller.signal });
    if (!library.books.length) {
      book = null;
      words = [];
      activeId = null;
      paint();
      return;
    }
    book = library.books.find((item) => item.id === preferredId) || library.books[0];
    activeId = book.id;
    localStorage.setItem("daymark-active-book", String(activeId));
    const detail = await api.get(`/api/word-books/${activeId}`, { signal: controller.signal });
    book = detail.book;
    words = detail.words;
    paint();
  }

  async function selectBook(id) {
    const detail = await api.get(`/api/word-books/${id}`, { signal: controller.signal });
    book = detail.book;
    words = detail.words;
    activeId = id;
    localStorage.setItem("daymark-active-book", String(id));
    search = "";
    paint();
  }

  function filteredWords() {
    if (!search) return words;
    const query = search.toLowerCase();
    return words.filter((word) => `${word.word} ${word.meaningZh}`.toLowerCase().includes(query));
  }

  function paint() {
    root.innerHTML = pageHTML({ library, book, words: filteredWords(), allWords: words, prefs: library.prefs });
    root.querySelector("#book-switch")?.addEventListener("change", (event) => {
      selectBook(Number(event.target.value)).catch((error) => toast(error.message, { type: "error" }));
    });
    const count = root.querySelector("#study-count");
    if (count) count.value = localStorage.getItem("daymark-study-count") || "10";
    const spelling = root.querySelector("#study-spelling");
    if (spelling) spelling.value = localStorage.getItem("daymark-study-spelling") || "zh";
    const query = root.querySelector("#word-search");
    query?.addEventListener("input", () => {
      search = query.value.trim();
      paint();
      const next = root.querySelector("#word-search");
      if (next) { next.value = search; next.focus(); }
    });
  }

  async function startStudy() {
    if (!book) return;
    const count = Math.min(100, Math.max(1, Math.floor(Number(root.querySelector("#study-count")?.value) || 10)));
    const spelling = root.querySelector("#study-spelling")?.value || "none";
    localStorage.setItem("daymark-study-count", String(count));
    localStorage.setItem("daymark-study-spelling", spelling);
    navigate(`/app/word-study/${book.id}?count=${count}&spelling=${spelling}`);
  }

  root.addEventListener("click", async (event) => {
    if (event.target.closest("[data-open-memory]")) {
      if (library) openMemoryModal(library, () => loadLibrary(activeId).catch((error) => toast(error.message, { type: "error" })));
      return;
    }
    if (event.target.closest("[data-open-add-book]")) {
      openAddBookModal(library, async (id) => {
        try { await loadLibrary(id); } catch (error) { toast(error.message, { type: "error" }); }
      });
      return;
    }
    const builtin = event.target.closest("[data-add-builtin]");
    if (builtin) {
      builtin.disabled = true;
      try {
        const result = await api.post(`/api/builtin-books/${builtin.dataset.addBuiltin}/add`, {});
        toast(`${L("Added", "已添加")} ${result.added} ${L("words", "个单词")}.`, { type: "success" });
        await loadLibrary(result.book.id);
      } catch (error) { builtin.disabled = false; toast(error.message, { type: "error" }); }
      return;
    }
    if (event.target.closest("[data-add-words]")) {
      if (!book) return;
      openAddWordsModal(book.id, () => loadLibrary(book.id).catch((error) => toast(error.message, { type: "error" })));
      return;
    }
    if (event.target.closest("[data-book-menu]")) {
      if (book) openBookMenu(book, () => loadLibrary().catch((error) => toast(error.message, { type: "error" })));
      return;
    }
    if (event.target.closest("[data-start-study]")) {
      startStudy();
      return;
    }
    const remove = event.target.closest("[data-delete-word]");
    if (remove && book) {
      try {
        await api.delete(`/api/word-books/${book.id}/words/${remove.dataset.deleteWord}`);
        await loadLibrary(book.id);
      } catch (error) { toast(error.message, { type: "error" }); }
    }
  }, { signal: controller.signal });

  root.addEventListener("keydown", (event) => {
    if (event.target.id === "study-count" && event.key === "Enter") startStudy();
  }, { signal: controller.signal });

  try {
    await loadLibrary();
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">${L("Could not load", "加载失败")}</p><h1>${L("Your word books are unavailable.", "单词书加载失败。")}</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-words>${L("Try again", "重试")}</button></div>`;
    root.querySelector("[data-retry-words]")?.addEventListener("click", () => renderVocabulary(root, { signal }));
  }
  return () => controller.abort();
}

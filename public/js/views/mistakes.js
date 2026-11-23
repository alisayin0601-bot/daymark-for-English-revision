import { api } from "../api.js";
import { icon } from "../icons.js";
import { refreshSummary } from "../store.js";
import { L } from "../i18n.js";
import { openMemoryModal } from "./vocabulary.js";
import {
  escapeHTML,
  escapeAttr,
  formatDate,
  openModal,
  setButtonLoading,
  toast,
  plural
} from "../ui.js";

const SOURCE_META = {
  grammar: { label: "Grammar", icon: "grammar" },
  reading: { label: "Reading", icon: "bookOpen" },
  writing: { label: "Writing", icon: "pen" },
  speaking: { label: "Speaking", icon: "mic" },
  listening: { label: "Listening", icon: "headphones" },
  vocabulary: { label: "Vocabulary", icon: "leaf" }
};

function sourceMeta(source) {
  return SOURCE_META[source] || { label: source || "Practice", icon: "bookmark" };
}

function mistakeCardHTML(mistake) {
  const source = sourceMeta(mistake.source);
  const options = mistake.options || [];
  return `<article class="mistake-card ${mistake.status === "resolved" ? "is-resolved" : ""}" data-mistake-card data-source="${escapeAttr(mistake.source)}" data-status="${escapeAttr(mistake.status)}">
    <div class="mistake-card__top">
      <span class="mistake-source mistake-source--${escapeAttr(mistake.source)}">${icon(source.icon, 14)} ${escapeHTML(source.label)}</span>
      <span class="mistake-status">${mistake.status === "resolved" ? `${icon("check", 12)} resolved` : `${icon("dot", 10)} open`}</span>
      <span class="mistake-seen">${mistake.timesSeen > 1 ? `seen ${mistake.timesSeen}×` : formatDate(mistake.createdAt)}</span>
    </div>
    <h3>${escapeHTML(mistake.question)}</h3>
    ${mistake.kind === "choice" && options.length ? `<div class="mistake-answers">
      <div class="mistake-answer mistake-answer--wrong"><small>You chose</small><span>${escapeHTML(mistake.userAnswer || "No answer")}</span></div>
      <div class="mistake-answer mistake-answer--right"><small>Correct</small><span>${escapeHTML(mistake.correctAnswer)}</span></div>
    </div>` : `<div class="mistake-correction">
      <p><small>Your phrase</small>${escapeHTML(mistake.userAnswer || mistake.question)}</p>
      <p><small>A clearer version</small>${escapeHTML(mistake.correctAnswer)}</p>
    </div>`}
    ${mistake.explanation ? `<p class="mistake-why">${icon("info", 14)} ${escapeHTML(mistake.explanation)}</p>` : ""}
    <div class="mistake-card__foot">
      <span>${escapeHTML(mistake.category)}${mistake.timesCorrect ? ` · repaired ${mistake.timesCorrect}×` : ""}</span>
      <button class="btn btn--ghost btn--small" type="button" data-practice-mistake="${mistake.id}">${mistake.status === "resolved" ? "Revisit" : "Practise this"} ${icon("arrowRight", 13)}</button>
    </div>
  </article>`;
}

function groupsHTML(mistakes, noneAtAll = false) {
  if (!mistakes.length) {
    return `<div class="empty-state mistake-empty">
      <div class="empty-state__art">${icon("checkCircle", 26)}</div>
      <h3>${noneAtAll ? "No mistakes yet." : "No mistakes in this view."}</h3>
      <p>${noneAtAll ? "Wrong answers from reading, grammar and listening will appear here." : "Try another filter or source."}</p>
      <a class="btn btn--secondary btn--small" href="/app/grammar" data-link>Try a grammar topic ${icon("arrowRight", 14)}</a>
    </div>`;
  }
  const groups = new Map();
  for (const mistake of mistakes) {
    if (!groups.has(mistake.category)) groups.set(mistake.category, []);
    groups.get(mistake.category).push(mistake);
  }
  return [...groups.entries()]
    .map(
      ([category, items]) => `<section class="mistake-group">
        <div class="mistake-group__head"><h2>${escapeHTML(category)}</h2><span>${plural(items.length, "mistake")}</span></div>
        ${items.map(mistakeCardHTML).join("")}
      </section>`
    )
    .join("");
}

function memoryBar(prefs) {
  const names = { long: L("Long-term", "长期记忆"), short: L("Short-term", "短期记忆"), mixed: L("Mixed", "混合记忆") };
  const details = {
    long: L("1 / 3 / 7 / 14 / 30 days", "第 1 / 3 / 7 / 14 / 30 天"),
    short: L("20 minutes / 1 hour / 8 hours", "20 分钟 / 1 小时 / 8 小时"),
    mixed: L("Same-day + long-term", "当天 + 长期")
  };
  const mode = prefs?.mode || "mixed";
  return `<button class="memory-strip" type="button" id="open-memory-plan">
    <span class="memory-strip__mark">${icon("rotate", 18)}</span>
    <span class="memory-strip__body">
      <span class="memory-strip__eyebrow">${L("Review plan", "记忆计划")} · ${L("Open the curve", "查看曲线")}</span>
      <span class="memory-strip__title"><strong>${names[mode]}</strong> <span>${details[mode]}</span></span>
      <span class="memory-strip__tags">${prefs?.words ? L("Words on", "单词开启") : L("Words off", "单词关闭")} · ${prefs?.mistakes ? L("Mistakes on", "错题开启") : L("Mistakes off", "错题关闭")}</span>
    </span>
    <span class="memory-strip__arrow">${icon("chevronDown", 18)}</span>
  </button>`;
}

function pageHTML(data, state) {
  const open = data.mistakes.filter((mistake) => mistake.status === "open");
  const resolved = data.mistakes.filter((mistake) => mistake.status === "resolved");
  const filtered = data.mistakes.filter((mistake) => {
    const sourceMatch = state.source === "all" || mistake.source === state.source;
    const statusMatch = state.status === "all" || mistake.status === state.status;
    return sourceMatch && statusMatch;
  });
  const categoryCount = new Set(open.map((mistake) => mistake.category)).size;
  const prefs = data.prefs || { mode: "mixed", words: true, mistakes: true };
  const due = open.filter((mistake) => !prefs.mistakes || mistake.due);
  const sourceCounts = data.mistakes.reduce((map, mistake) => {
    map[mistake.source] = (map[mistake.source] || 0) + 1;
    return map;
  }, {});
  return `<div class="page-enter">
    <header class="page-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">Review · private to you</p>
        <h1>Mistake Book</h1>
        <p>Wrong answers from reading, grammar and listening, plus corrections from writing and speaking.</p>
      </div>
      ${due.length ? `<div class="page-heading__actions"><button class="btn btn--primary" type="button" id="retest-mistakes">${icon("rotate", 16)} ${L("Retest due", "复习到期错题")} <span class="btn-count">${due.length}</span></button></div>` : ""}
    </header>
    ${memoryBar(prefs)}

    <section class="mistake-stats" aria-label="Mistake Book overview">
      <div class="mistake-stat"><span class="mistake-stat__icon">${icon("bookmark", 18)}</span><div><strong>${open.length}</strong><span>open</span></div></div>
      <div class="mistake-stat"><span class="mistake-stat__icon mist--good">${icon("checkCircle", 18)}</span><div><strong>${resolved.length}</strong><span>repaired</span></div></div>
      <div class="mistake-stat"><span class="mistake-stat__icon mist--amber">${icon("target", 18)}</span><div><strong>${categoryCount}</strong><span>focus areas</span></div></div>
    </section>

    ${data.mistakes.length ? `<div class="mistake-toolbar">
      <div class="mistake-filters" role="group" aria-label="Filter by source">
        <button type="button" data-source-filter="all" class="${state.source === "all" ? "is-active" : ""}">All <span>${data.mistakes.length}</span></button>
        ${Object.entries(SOURCE_META)
          .filter(([key]) => sourceCounts[key])
          .map(([key, meta]) => `<button type="button" data-source-filter="${key}" class="${state.source === key ? "is-active" : ""}">${escapeHTML(meta.label)} <span>${sourceCounts[key]}</span></button>`)
          .join("")}
      </div>
      <div class="segmented mistake-status-filter" role="group" aria-label="Filter by status">
        <button type="button" data-status-filter="open" class="${state.status === "open" ? "is-active" : ""}">Open</button>
        <button type="button" data-status-filter="resolved" class="${state.status === "resolved" ? "is-active" : ""}">Resolved</button>
        <button type="button" data-status-filter="all" class="${state.status === "all" ? "is-active" : ""}">All</button>
      </div>
    </div>` : ""}

    <div class="mistake-groups">
      ${groupsHTML(filtered, !data.mistakes.length)}
    </div>
  </div>`;
}

function retestQuestionHTML(mistake, index, total) {
  const source = sourceMeta(mistake.source);
  return `<div class="retest-inner" data-retest-question>
    <div class="retest-progress">
      <div class="retest-progress__label"><span>${escapeHTML(source.label)} · ${escapeHTML(mistake.category)}</span><span>${index + 1} / ${total}</span></div>
      <div class="retest-progress__track"><span style="width:${((index) / total) * 100}%"></span></div>
    </div>
    <p class="eyebrow">A second meeting</p>
    <h3 class="retest-question">${escapeHTML(mistake.question)}</h3>
    ${mistake.kind === "choice" && (mistake.options || []).length
      ? `<div class="retest-options">${mistake.options
          .map(
            (option, optionIndex) => `<button class="retest-option" type="button" data-retest-option="${optionIndex}"><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHTML(option)}</button>`
          )
          .join("")}</div>`
      : `<div class="retest-correction"><label class="field__label" for="retest-answer">Write the clearer version</label><textarea class="textarea" id="retest-answer" rows="3" placeholder="Correct the phrase from memory…">${escapeHTML(mistake.userAnswer || "")}</textarea><p class="field__hint">You can also reveal the answer and tell us honestly whether it had clicked.</p></div>`}
    <div class="retest-feedback" id="retest-feedback"></div>
    <div class="retest-actions">
      <button class="btn btn--ghost btn--small" type="button" data-retest-quit>Leave the retest</button>
      <button class="btn btn--primary" type="button" id="retest-check">${mistake.kind === "choice" ? "Check answer" : "Compare with the answer"} ${icon("arrowRight", 15)}</button>
    </div>
  </div>`;
}

export async function renderMistakes(root, { signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  const state = { source: "all", status: "open" };
  let data = null;

  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-grid" style="margin-top:26px"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div></div>`;

  async function load() {
    try {
      data = await api.get("/api/mistakes", { signal: controller.signal });
      paint();
    } catch (error) {
      if (error.name === "AbortError") return;
      root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">The book is shut</p><h1>We couldn’t read your Mistake Book.</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-mistakes>Try again ${icon("rotate", 16)}</button></div>`;
      root.querySelector("[data-retry-mistakes]")?.addEventListener("click", () => renderMistakes(root, { signal }));
    }
  }

  function paint() {
    root.innerHTML = pageHTML(data, state);
  }

  function openRetest(queue) {
    if (!queue.length) {
      toast("There are no open mistakes in this view. Choose All to revisit a resolved one.", { type: "default" });
      return;
    }
    let index = 0;
    let selected = null;
    let revealed = false;
    let changed = false;
    const summary = { correct: 0, total: queue.length };
    const modal = openModal({
      title: "A second meeting.",
      subtitle: `${queue.length} mistake${queue.length === 1 ? "" : "s"} from your own work. Retest them one at a time.`,
      size: "lg",
      content: `<div id="retest-content"></div>`,
      onClose: () => {
        if (changed) load();
      }
    });
    if (!modal) return;
    const container = modal.panel.querySelector("#retest-content");

    function paintQuestion() {
      if (index >= queue.length) {
        changed = true;
        modal.panel.querySelector("#retest-content").innerHTML = `<div class="retest-finish">
          <div class="retest-finish__art">${icon("leaf", 28)}</div>
          <p class="eyebrow">Retest complete</p>
          <h3>You corrected ${summary.correct} of ${summary.total} mistakes.</h3>
          <p>${L("Correct answers move to the next review step; a mistake leaves the book only after its full cycle.", "答对会进入下一个复习节点；走完整个周期后才会移出错题本。")}</p>
          <button class="btn btn--primary" type="button" data-finish-retest>Back to the book ${icon("arrowRight", 15)}</button>
        </div>`;
        container.querySelector("[data-finish-retest]")?.addEventListener("click", () => modal.close());
        refreshSummary();
        return;
      }
      selected = null;
      revealed = false;
      container.innerHTML = retestQuestionHTML(queue[index], index, queue.length);
      const quit = container.querySelector("[data-retest-quit]");
      quit?.addEventListener("click", () => modal.close());
      const options = container.querySelectorAll("[data-retest-option]");
      options.forEach((option) => {
        option.addEventListener("click", () => {
          if (revealed) return;
          options.forEach((each) => each.classList.remove("is-selected"));
          option.classList.add("is-selected");
          selected = Number(option.dataset.retestOption);
        });
      });
      container.querySelector("#retest-check")?.addEventListener("click", async () => {
        const mistake = queue[index];
        if (revealed) {
          index += 1;
          paintQuestion();
          return;
        }
        if (mistake.kind === "choice") {
          if (selected === null) {
            toast("Choose an answer first.", { type: "error" });
            return;
          }
          await checkChoice(mistake);
        } else {
          await checkCorrection(mistake);
        }
      });
    }

    async function sendReview(correct) {
      const mistake = queue[index];
      try {
        const response = await api.post(`/api/mistakes/${mistake.id}/review`, { correct });
        changed = true;
        if (correct) summary.correct += 1;
        mistake.status = response.status;
        mistake.nextReviewAt = response.nextReviewAt || 0;
        mistake.due = false;
        toast(
          correct
            ? response.done
              ? L("Resolved. Full review cycle complete.", "已解决，完整复习周期完成。")
              : L("Correct. The next review is scheduled.", "答对了，下一次复习已排期。")
            : L("Still open. It will return sooner.", "还没掌握，下次会更早出现。"),
          { type: correct ? "success" : "default" }
        );
        return response;
      } catch (error) {
        toast(error.message, { type: "error" });
        return null;
      }
    }

    async function checkChoice(mistake) {
      const check = container.querySelector("#retest-check");
      setButtonLoading(check, true, "Checking…");
      const chosenText = mistake.options[selected] || "";
      const correct = chosenText === mistake.correctAnswer;
      const response = await sendReview(correct);
      if (!response) {
        setButtonLoading(check, false);
        return;
      }
      revealed = true;
      const options = container.querySelectorAll("[data-retest-option]");
      options.forEach((option, optionIndex) => {
        const text = mistake.options[optionIndex];
        option.disabled = true;
        if (text === mistake.correctAnswer) option.classList.add("is-correct");
        else if (optionIndex === selected) option.classList.add("is-wrong");
      });
      const feedback = container.querySelector("#retest-feedback");
      if (feedback) feedback.innerHTML = `<div class="retest-verdict ${correct ? "is-correct" : "is-wrong"}">
        <div class="retest-verdict__icon">${icon(correct ? "check" : "x", 18)}</div>
        <div><strong>${correct ? "That’s it." : `The answer is: ${escapeHTML(mistake.correctAnswer)}`}</strong><p>${escapeHTML(mistake.explanation || "Keep the reason in mind, not just the answer.")}</p></div>
      </div>`;
      check.innerHTML = `${index + 1 === queue.length ? "Finish" : "Next question"} ${icon("arrowRight", 15)}`;
      setButtonLoading(check, false);
      check.disabled = false;
      check.innerHTML = `${index + 1 === queue.length ? "Finish" : "Next question"} ${icon("arrowRight", 15)}`;
    }

    async function checkCorrection(mistake) {
      const textarea = container.querySelector("#retest-answer");
      const typed = textarea?.value.trim() || "";
      const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9' ]/g, "").replace(/\s+/g, " ").trim();
      const exact = typed && normalize(typed) === normalize(mistake.correctAnswer);
      const revealedPanel = container.querySelector("#retest-feedback");
      if (!exact) {
        revealed = true;
        const check = container.querySelector("#retest-check");
        if (check) check.disabled = true;
        if (revealedPanel) {
          revealedPanel.innerHTML = `<div class="retest-verdict">
            <div class="retest-verdict__icon">${icon("feather", 18)}</div>
            <div><strong>A clearer version</strong><p>${escapeHTML(mistake.correctAnswer)}</p><p class="retest-verdict__why">${escapeHTML(mistake.explanation || "")}</p></div>
          </div>
          <div class="retest-self-check"><p>Did that feel like the correction you had in mind?</p><button class="btn btn--primary btn--small" type="button" data-self-correct>Yes, it clicked</button><button class="btn btn--ghost btn--small" type="button" data-self-wrong>Not yet</button></div>`;
          revealedPanel.querySelector("[data-self-correct]")?.addEventListener("click", async () => {
            await sendReview(true);
            index += 1;
            paintQuestion();
          });
          revealedPanel.querySelector("[data-self-wrong]")?.addEventListener("click", async () => {
            await sendReview(false);
            index += 1;
            paintQuestion();
          });
        }
        return;
      }
      await sendReview(true);
      revealed = true;
      const check = container.querySelector("#retest-check");
      if (revealedPanel) revealedPanel.innerHTML = `<div class="retest-verdict is-correct"><div class="retest-verdict__icon">${icon("check", 18)}</div><div><strong>That’s it.</strong><p>${escapeHTML(mistake.explanation || "You recovered the pattern from memory.")}</p></div></div>`;
      if (check) {
        check.innerHTML = `${index + 1 === queue.length ? "Finish" : "Next question"} ${icon("arrowRight", 15)}`;
        check.disabled = false;
      }
    }

    paintQuestion();
  }

  await load();

  if (!data) return () => controller.abort();

  root.addEventListener(
    "click",
    (event) => {
      const sourceButton = event.target.closest("[data-source-filter]");
      if (sourceButton) {
        state.source = sourceButton.dataset.sourceFilter;
        paint();
        return;
      }
      const statusButton = event.target.closest("[data-status-filter]");
      if (statusButton) {
        state.status = statusButton.dataset.statusFilter;
        paint();
        return;
      }
      if (event.target.closest("#open-memory-plan")) {
        openMemoryModal(data, () => load());
        return;
      }
      if (event.target.closest("#retest-mistakes")) {
        const prefs = data.prefs || { mistakes: true };
        const queue = data.mistakes.filter((mistake) => mistake.status === "open" && (!prefs.mistakes || mistake.due));
        openRetest(queue.slice(0, 8));
        return;
      }
      const practice = event.target.closest("[data-practice-mistake]");
      if (practice) {
        const mistake = data.mistakes.find((item) => String(item.id) === practice.dataset.practiceMistake);
        if (mistake) {
          if (data.prefs?.mistakes && !mistake.due) {
            toast(L("This mistake is not due yet.", "这道错题还没到复习时间。"), { type: "default" });
            return;
          }
          openRetest([mistake]);
        }
      }
    },
    { signal: controller.signal }
  );

  return () => {
    controller.abort();
    if (signal) signal.removeEventListener("abort", abort);
  };
}

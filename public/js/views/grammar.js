import { api } from "../api.js";
import { icon } from "../icons.js";
import { refreshSummary, store } from "../store.js";
import {
  escapeHTML,
  escapeAttr,
  levelLabel,
  progressRing,
  scrollToId,
  setButtonLoading,
  toast
} from "../ui.js";

const CATEGORIES = ["All", "Verbs & tenses", "Sentence building", "Words & phrases"];
const GLYPHS = {
  "present-perfect": "have",
  articles: "a / the",
  conditionals: "if",
  "prepositions-time": "in",
  "passive-voice": "be",
  "relative-clauses": "who",
  modals: "may",
  "gerunds-infinitives": "-ing",
  "comparatives": "-er",
  "subject-verb-agreement": "s → v"
};

function indexHTML(data, state) {
  const byCategory = data.topics.reduce((map, topic) => {
    map[topic.category] = (map[topic.category] || 0) + 1;
    return map;
  }, {});
  const visited = Object.keys(data.progress || {}).length;
  const percent = Math.round((visited / Math.max(1, data.topics.length)) * 100);
  return `<div class="page-enter">
    <header class="page-heading grammar-heading">
      <div class="page-heading__copy">
        <p class="eyebrow">Grammar · ${escapeHTML(levelLabel(store.user?.level || "6-7"))}</p>
        <h1>Grammar</h1>
        <p>Ten short topics. Read the lesson, then check your understanding with four questions.</p>
      </div>
      <div class="grammar-heading__progress">
        ${progressRing(percent, { size: 78, label: "visited" })}
        <div><strong>${visited} of ${data.topics.length}</strong><span>topics visited</span></div>
      </div>
    </header>
    <div class="grammar-toolbar">
      <div class="grammar-filters" role="group" aria-label="Filter grammar topics">
        ${CATEGORIES.map((category) => `<button type="button" class="${state.filter === category ? "is-active" : ""}" data-grammar-filter="${escapeAttr(category)}">${escapeHTML(category)}${category === "All" ? ` <span>${data.topics.length}</span>` : ` <span>${byCategory[category] || 0}</span>`}</button>`).join("")}
      </div>
      <label class="grammar-search">${icon("search", 15)}<input type="search" id="grammar-search" placeholder="Find a topic" aria-label="Search grammar topics"></label>
    </div>
    <div class="grammar-grid" id="grammar-grid">
      ${data.topics
        .map((topic, index) => {
          const progress = data.progress?.[topic.slug];
          const scoreLabel = progress ? `${progress.bestScore}/${progress.bestTotal}` : "";
          return `<a class="grammar-card ${progress ? "is-visited" : ""}" href="/app/grammar/${escapeAttr(topic.slug)}" data-link data-grammar-card data-category="${escapeAttr(topic.category)}" data-search="${escapeAttr(`${topic.title} ${topic.blurb} ${topic.category}`.toLowerCase())}">
            <div class="grammar-card__top">
              <span class="grammar-card__number">${String(index + 1).padStart(2, "0")}</span>
              <span class="grammar-card__glyph">${escapeHTML(GLYPHS[topic.slug] || topic.title[0])}</span>
              <span class="grammar-card__status ${progress ? "is-done" : ""}">${progress ? icon("check", 12) + " visited" : "not yet"}</span>
            </div>
            <span class="grammar-card__category">${escapeHTML(topic.category)}</span>
            <h2>${escapeHTML(topic.title)}</h2>
            <p>${escapeHTML(topic.blurb)}</p>
            <div class="grammar-card__foot">
              <span>${icon("clock", 13)} ${topic.minutes} min · ${topic.questions.length} questions</span>
              ${progress ? `<span class="grammar-card__score">${scoreLabel}</span>` : `<span class="grammar-card__arrow">${icon("arrowRight", 15)}</span>`}
            </div>
          </a>`;
        })
        .join("")}
    </div>
    <p class="grammar-empty" id="grammar-empty" hidden>No topic matches that search. Try a smaller word.</p>
    <div class="grammar-map-link">
      <span>${icon("bookmark", 18)}</span>
      <div><strong>The mistakes you make become tomorrow’s practice.</strong><p>Every wrong answer here is gathered in your Mistake Book with its explanation.</p></div>
      <a class="text-link" href="/app/mistakes" data-link>Open Mistake Book ${icon("arrowRight", 14)}</a>
    </div>
  </div>`;
}

function topicHTML(topic, progress, state) {
  return `<div class="page-enter">
    <a class="back-link" href="/app/grammar" data-link>${icon("arrowLeft", 16)} All grammar topics</a>
    <header class="grammar-hero">
      <div class="grammar-hero__copy">
        <div class="grammar-hero__meta"><span>${escapeHTML(topic.category)}</span><span>${escapeHTML(levelLabel(topic.level))}</span><span>${icon("clock", 12)} ${topic.minutes} min</span></div>
        <h1>${escapeHTML(topic.title)}</h1>
        <p>${escapeHTML(topic.blurb)}</p>
        <div class="grammar-hero__actions">
          <button class="btn btn--primary" type="button" id="start-grammar-quiz">${icon("target", 16)} Start the 4-question check</button>
          ${progress ? `<span class="grammar-best">Best <strong>${progress.bestScore}/${progress.bestTotal}</strong> · ${progress.attempts} attempt${progress.attempts === 1 ? "" : "s"}</span>` : `<span class="grammar-best">Not yet visited</span>`}
        </div>
      </div>
      <div class="grammar-hero__glyph">${escapeHTML(GLYPHS[topic.slug] || topic.title[0])}</div>
    </header>
    <div class="grammar-detail-layout">
      <article class="lesson-card">
        <div class="lesson-card__intro">
          <span class="lesson-card__ornament">${icon("bookOpen", 21)}</span>
          <p class="eyebrow">The short lesson</p>
        </div>
        ${topic.sections
          .map(
            (section, index) => `<section class="lesson-section">
              <span class="lesson-section__number">${String(index + 1).padStart(2, "0")}</span>
              <h2>${escapeHTML(section.heading)}</h2>
              <p>${escapeHTML(section.body)}</p>
              <div class="example-pair">
                ${(section.examples || []).map((example) => `<div class="example-row"><span class="example-row__bad">${icon("x", 13)} ${escapeHTML(example.wrong)}</span><span class="example-row__good">${icon("check", 13)} ${escapeHTML(example.good)}</span></div>`).join("")}
              </div>
            </section>`
          )
          .join("")}
      </article>
      <aside class="grammar-rail">
        <div class="grammar-tip">
          <span class="grammar-tip__icon">${icon("sun", 19)}</span>
          <p class="eyebrow">The one thing</p>
          <p>${escapeHTML(topic.tip)}</p>
          <button class="btn btn--dark btn--small btn--full" type="button" data-start-quiz>Try four questions ${icon("arrowRight", 14)}</button>
        </div>
        <div class="grammar-rail__note">${icon("info", 14)} <p>This check is for learning. Wrong answers collect in your Mistake Book; correct ones simply tell you what to trust.</p></div>
      </aside>
    </div>

    <section class="grammar-quiz-card" id="grammar-quiz">
      <div class="grammar-quiz-card__head">
        <div><p class="eyebrow">Practice check</p><h2>Four questions</h2><p>Choose one answer for each. Explanations appear at the end.</p></div>
        <span class="quiz-meta">${topic.questions.length} questions</span>
      </div>
      <div id="grammar-quiz-body">${quizFormHTML(topic)}</div>
    </section>
  </div>`;
}

function quizFormHTML(topic) {
  return `<form id="grammar-quiz-form" novalidate>
    <div class="grammar-question-list">
      ${topic.questions
        .map(
          (question, index) => `<fieldset class="grammar-question">
            <legend><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHTML(question.question)}</strong></legend>
            <div class="grammar-choices">
              ${question.options.map((option, optionIndex) => `<label class="grammar-choice"><input type="radio" name="grammar-q${index}" value="${optionIndex}"><span class="grammar-choice__dot"></span><span>${escapeHTML(option)}</span></label>`).join("")}
            </div>
          </fieldset>`
        )
        .join("")}
    </div>
    <div class="grammar-quiz-submit">
      <p>${icon("bookmark", 14)} Missed answers are saved with the explanation.</p>
      <button class="btn btn--primary" type="submit" id="submit-grammar-quiz">Check my answers ${icon("arrowRight", 16)}</button>
    </div>
  </form>`;
}

function quizResultsHTML(data, topic) {
  const percent = Math.round((data.score / data.total) * 100);
  return `<div class="grammar-results">
    <div class="grammar-results__banner ${percent >= 75 ? "is-good" : percent >= 50 ? "is-mid" : "is-low"}">
      <div class="grammar-results__score"><strong>${data.score}</strong><span>/ ${data.total}</span></div>
      <div><p class="eyebrow">Grammar check</p><h3>${percent === 100 ? "The pattern is yours." : percent >= 50 ? "Close. The explanation will finish the job." : "A useful repair. Read each note slowly."}</h3><p>${percent === 100 ? "Try another topic while the pattern is warm." : "Your wrong answers are now in the Mistake Book, ready for a retest later."}</p></div>
    </div>
    <div class="grammar-result-list">
      ${data.results
        .map(
          (result, index) => `<div class="grammar-result ${result.correct ? "is-correct" : "is-wrong"}">
            <div class="grammar-result__head"><span class="grammar-result__mark">${icon(result.correct ? "check" : "x", 15)}</span><span>Question ${index + 1}</span><span>${result.correct ? "Correct" : "Review"}</span></div>
            <h4>${escapeHTML(result.question)}</h4>
            <p class="grammar-result__answer"><span>Correct answer</span>${escapeHTML(result.options[result.correctIndex])}</p>
            ${result.correct ? "" : `<p class="grammar-result__mine"><span>You chose</span>${escapeHTML(result.options[result.chosen] || "No answer")}</p>`}
            <p class="grammar-result__explanation">${escapeHTML(result.explanation)}</p>
          </div>`
        )
        .join("")}
    </div>
    <div class="grammar-results__actions">
      <button class="btn btn--secondary" type="button" id="retake-grammar">${icon("rotate", 15)} Take it again</button>
      <a class="btn btn--ghost" href="/app/grammar" data-link>Choose another topic ${icon("arrowRight", 15)}</a>
      <a class="btn btn--ghost" href="/app/mistakes" data-link>Mistake Book ${icon("arrowRight", 15)}</a>
    </div>
  </div>`;
}

export async function renderGrammar(root, { slug, signal }) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal) signal.addEventListener("abort", abort, { once: true });
  const state = { filter: "All", query: "" };
  let data = null;

  root.innerHTML = `<div class="page-loading"><div class="skeleton-line skeleton-line--eyebrow"></div><div class="skeleton-line skeleton-line--heading"></div><div class="skeleton-line skeleton-line--medium"></div>${`<div class="skeleton-grid" style="margin-top:30px">${Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join("")}</div>`}</div>`;

  try {
    data = await api.get("/api/grammar", { signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") return () => {};
    root.innerHTML = `<div class="fatal-view"><div class="fatal-view__mark">${icon("alert", 24)}</div><p class="eyebrow">The lesson book is closed</p><h1>We couldn’t open grammar just now.</h1><p>${escapeHTML(error.message)}</p><button class="btn btn--primary" data-retry-grammar>Try again ${icon("rotate", 16)}</button></div>`;
    root.querySelector("[data-retry-grammar]")?.addEventListener("click", () => renderGrammar(root, { signal, slug }));
    return () => {};
  }

  function paintIndex() {
    root.innerHTML = indexHTML(data, state);
    applyFilters();
  }

  function applyFilters() {
    let shown = 0;
    root.querySelectorAll("[data-grammar-card]").forEach((card) => {
      const categoryMatch = state.filter === "All" || card.dataset.category === state.filter;
      const searchMatch = !state.query || card.dataset.search.includes(state.query);
      const visible = categoryMatch && searchMatch;
      card.classList.toggle("is-hidden", !visible);
      if (visible) shown += 1;
    });
    const empty = root.querySelector("#grammar-empty");
    if (empty) empty.hidden = shown !== 0;
  }

  async function submitQuiz(topic) {
    const form = root.querySelector("#grammar-quiz-form");
    if (!form) return;
    const answers = [];
    let complete = true;
    topic.questions.forEach((_, index) => {
      const selected = form.querySelector(`input[name="grammar-q${index}"]:checked`);
      if (!selected) complete = false;
      answers.push(selected ? Number(selected.value) : null);
    });
    if (!complete) {
      toast("Answer all four questions before checking.", { type: "error" });
      return;
    }
    const button = root.querySelector("#submit-grammar-quiz");
    setButtonLoading(button, true, "Checking the shape…");
    try {
      const result = await api.post("/api/grammar/complete", { slug: topic.slug, answers });
      data.progress[topic.slug] = result.progress;
      const quizBody = root.querySelector("#grammar-quiz-body");
      if (quizBody) quizBody.innerHTML = quizResultsHTML(result, topic);
      refreshSummary();
      scrollToId("grammar-quiz", 85);
    } catch (error) {
      toast(error.message, { type: "error" });
      setButtonLoading(button, false);
    }
  }

  function paintTopic(topic) {
    const progress = data.progress?.[topic.slug];
    root.innerHTML = topicHTML(topic, progress, state);
  }

  function bindIndexFilters() {
    root.querySelectorAll("[data-grammar-filter]").forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          state.filter = button.dataset.grammarFilter;
          root.querySelectorAll("[data-grammar-filter]").forEach((each) => each.classList.toggle("is-active", each === button));
          applyFilters();
        },
        { signal: controller.signal }
      );
    });
    root.querySelector("#grammar-search")?.addEventListener(
      "input",
      (event) => {
        state.query = event.target.value.trim().toLowerCase();
        applyFilters();
      },
      { signal: controller.signal }
    );
  }

  if (slug) {
    const topic = data.topics.find((item) => item.slug === slug);
    if (!topic) {
      root.innerHTML = `<div class="not-found-page"><div class="not-found-page__art">${icon("grammar", 28)}</div><p class="eyebrow">A missing page</p><h1>That topic isn’t here.</h1><p>The grammar shelf has ten topics. One of them will fit.</p><a class="btn btn--primary" href="/app/grammar" data-link>Back to grammar ${icon("arrowRight", 15)}</a></div>`;
      return () => controller.abort();
    }
    paintTopic(topic);
    root.addEventListener(
      "click",
      (event) => {
        if (event.target.closest("#start-grammar-quiz") || event.target.closest("[data-start-quiz]")) {
          scrollToId("grammar-quiz", 82);
          return;
        }
        if (event.target.closest("#retake-grammar")) {
          const quizBody = root.querySelector("#grammar-quiz-body");
          if (quizBody) {
            quizBody.innerHTML = quizFormHTML(topic);
            scrollToId("grammar-quiz", 82);
          }
        }
      },
      { signal: controller.signal }
    );
    root.addEventListener(
      "change",
      (event) => {
        if (!event.target.matches('input[type="radio"][name^="grammar-q"]')) return;
        const question = event.target.closest(".grammar-question");
        question.querySelectorAll(".grammar-choice").forEach((choice) => {
          choice.classList.toggle("is-selected", Boolean(choice.querySelector("input:checked")));
        });
      },
      { signal: controller.signal }
    );
    root.addEventListener("submit", (event) => {
      if (event.target.id === "grammar-quiz-form") {
        event.preventDefault();
        submitQuiz(topic);
      }
    }, { signal: controller.signal });
  } else {
    paintIndex();
    bindIndexFilters();
  }

  return () => {
    controller.abort();
    if (signal) signal.removeEventListener("abort", abort);
  };
}

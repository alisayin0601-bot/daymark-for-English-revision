import { icon } from "./icons.js";
import { bandRing, escapeHTML, sourceLabel } from "./ui.js";

function criterionBars(criteria = []) {
  return criteria
    .map((criterion) => {
      const score = Number(criterion.score) || 0;
      const width = Math.max(2, (score / 9) * 100);
      return `<div class="criterion">
        <div class="criterion__head"><span>${escapeHTML(criterion.name)}</span><strong>${score.toFixed(1)}</strong></div>
        <div class="criterion__track"><span style="width:${width}%"></span></div>
        ${criterion.note ? `<p>${escapeHTML(criterion.note)}</p>` : ""}
      </div>`;
    })
    .join("");
}

function feedbackNotice({ source, demo, configured }) {
  const isAI = source === "gemini" && demo === false;
  if (isAI) {
    return `<div class="feedback-verdict feedback-verdict--ai">${icon("sparkles", 17)}<p><strong>Gemini assessment complete.</strong> This is an AI practice estimate, not an official IELTS result. Use it to choose your next revision step.</p></div>`;
  }
  if (source === "studio-sample") {
    return `<div class="feedback-verdict feedback-verdict--studio">${icon("feather", 17)}<p><strong>Example feedback.</strong> This is a built-in sample, not feedback on your own writing.</p></div>`;
  }
  return `<div class="feedback-verdict feedback-verdict--studio">${icon("feather", 17)}<p><strong>Practice estimate (no AI connected).</strong> This is a rule-based estimate of length, structure, vocabulary range and detectable language patterns. It is not an AI assessment or an official IELTS score. ${configured ? "Try again when Gemini is available for a full assessment." : "Add a Gemini key in Settings for model-based feedback and a rewritten sample."}</p></div>`;
}

export function feedbackHTML(feedback, { source = "demo", configured = false, type = "writing" } = {}) {
  if (!feedback) return "";
  const overall = Number(feedback.overallBand) || 0;
  const strengths = (feedback.strengths || []).map((point) => `<li>${escapeHTML(point)}</li>`).join("");
  const improvements = (feedback.improvements || []).map((point) => `<li>${escapeHTML(point)}</li>`).join("");
  const errors = (feedback.flaggedErrors || [])
    .map(
      (error, index) => `<div class="flagged-error">
        <span class="flagged-error__number">${String(index + 1).padStart(2, "0")}</span>
        <div class="flagged-error__body">
          <p class="flagged-error__original"><span class="sr-only">Original: </span>“${escapeHTML(error.original)}”</p>
          <p class="flagged-error__correction">${icon("arrowRight", 14)} <span>${escapeHTML(error.correction)}</span></p>
          ${error.explanation ? `<p class="flagged-error__note">${escapeHTML(error.explanation)}</p>` : ""}
          ${error.category ? `<span class="mini-tag">${escapeHTML(error.category)}</span>` : ""}
        </div>
      </div>`
    )
    .join("");
  const rewriteText = type === "speaking" ? feedback.improvedAnswer : feedback.rewritten;
  const rewriteLabel = type === "speaking" ? "Suggested spoken version" : "Suggested rewrite";
  const rewrite = rewriteText
    ? `<details class="rewrite-block" open>
        <summary><span>${icon("feather", 17)} ${rewriteLabel}</span><span class="rewrite-block__hint">Open / close</span></summary>
        <div class="rewrite-block__body">
          <p>${escapeHTML(rewriteText).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>
          <button type="button" class="btn btn--ghost btn--small" data-copy-feedback="${encodeURIComponent(rewriteText)}">${icon("copy", 15)} Copy</button>
        </div>
      </details>`
    : `<div class="rewrite-empty">
        ${icon("feather", 20)}
        <div><strong>${type === "speaking" ? "A model spoken answer" : "A full rewrite"} is part of the Gemini assessment.</strong>
        <p>${configured ? "This response used the rule-based estimate, so no model rewrite is available. Evaluate again when Gemini is connected." : "Add a Gemini API key to unlock model-based feedback and a rewritten sample."}</p></div>
      </div>`;

  return `<section class="feedback-block" aria-labelledby="feedback-title">
    <div class="feedback-band">
      <div>
        <p class="eyebrow eyebrow--light">Practice assessment</p>
        <h2 id="feedback-title">Feedback</h2>
        <p class="feedback-band__summary">${escapeHTML(feedback.summary || "")}</p>
        <div class="feedback-band__meta">
          <span class="source-chip source-chip--light">${icon(source === "gemini" ? "sparkles" : "feather", 14)} ${escapeHTML(sourceLabel(source))}</span>
          <span>Not an official IELTS score</span>
        </div>
      </div>
      ${bandRing(overall, { size: 172, label: "Estimated band" })}
    </div>
    ${feedbackNotice({ source, demo: feedback.demo, configured })}
    <div class="feedback-columns">
      <div class="feedback-panel">
        <h3 class="feedback-panel__title">${icon("checkCircle", 18)} Strengths</h3>
        <ul class="feedback-list feedback-list--good">${strengths || "<li>There is a real attempt here. Keep going.</li>"}</ul>
      </div>
      <div class="feedback-panel">
        <h3 class="feedback-panel__title">${icon("target", 18)} Improvements</h3>
        <ul class="feedback-list feedback-list--grow">${improvements || "<li>Develop one idea further next time.</li>"}</ul>
      </div>
    </div>
    <div class="criteria-panel">
      <div class="criteria-panel__head">
        <div><p class="eyebrow">${type === "speaking" ? "Criteria" : "Criteria"}</p><h3>Estimated scores</h3></div>
        <p>${type === "speaking" ? "Pronunciation is not scored from a transcript." : "Each criterion is estimated separately, then weighed."}</p>
      </div>
      <div class="criteria-list">${criterionBars(feedback.criteria)}</div>
    </div>
    ${errors ? `<div class="flagged-panel"><div class="flagged-panel__head"><div><p class="eyebrow">Flagged errors</p><h3>What to review</h3></div><span class="saved-to-book">${icon("bookmark", 14)} Saved automatically</span></div><div class="flagged-list">${errors}</div></div>` : ""}
    ${rewriteText ? rewrite : ""}
    ${feedback.examinerNote && source === "gemini" ? `<div class="examiner-note">${icon("quote", 20)}<p><strong>Next step.</strong> ${escapeHTML(feedback.examinerNote)}</p></div>` : ""}
  </section>`;
}

export function feedbackSkeleton() {
  return `<div class="feedback-skeleton">
    <div class="feedback-skeleton__band"><div class="skeleton-line skeleton-line--short"></div><div class="skeleton-line skeleton-line--title"></div><div class="skeleton-line skeleton-line--medium"></div></div>
    <div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line skeleton-line--medium"></div>
  </div>`;
}


/**
 * Transparent demo feedback used when no Gemini key is connected.
 * It is deliberately rule-based: useful for spotting patterns, never presented
 * as an official IELTS score.
 */

const { clamp, roundHalf } = require("./util");

const LINKERS = [
  "however", "although", "whereas", "therefore", "moreover", "furthermore", "consequently",
  "in addition", "on the other hand", "for example", "for instance", "such as", "while",
  "despite", "in contrast", "as a result", "because", "since", "nevertheless", "admittedly",
  "ultimately", "overall", "in conclusion"
];

const ACADEMIC_WORDS = new Set([
  "significant", "consequence", "implication", "fundamental", "inevitable", "beneficial",
  "detrimental", "sustainable", "infrastructure", "perspective", "evidence", "analyse",
  "considerable", "substantial", "phenomenon", "framework", "approach", "individual",
  "society", "economic", "environmental", "educational", "priority", "allocate", "mitigate",
  "advocate", "criteria", "principle", "factor", "trend", "proportion", "majority", "minority",
  "nuance", "complex", "effective", "accessible", "affordable", "long-term", "widespread"
]);

const FILLERS = ["um", "uh", "erm", "like", "you know", "i mean", "basically", "actually", "sort of", "kind of"];

function baseMetrics(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const words = clean.match(/[A-Za-z][A-Za-z'\-]*/g) || [];
  const lower = words.map((w) => w.toLowerCase());
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => (s.match(/[A-Za-z]+/g) || []).length >= 3);
  const paragraphs = String(text || "")
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const unique = new Set(lower);
  const advanced = lower.filter((w) => ACADEMIC_WORDS.has(w));
  const linking = LINKERS.filter((marker) => clean.toLowerCase().includes(marker));
  const lengthAvg = sentences.length
    ? sentences.reduce((sum, s) => sum + (s.match(/[A-Za-z]+/g) || []).length, 0) / sentences.length
    : 0;
  const lengths = sentences.map((s) => (s.match(/[A-Za-z]+/g) || []).length);
  const variance = lengths.length
    ? lengths.reduce((sum, n) => sum + Math.pow(n - lengthAvg, 2), 0) / lengths.length
    : 0;
  const complex = lower.filter((w) =>
    ["although", "whereas", "despite", "because", "which", "who", "while", "if", "unless", "that"].includes(w)
  ).length;
  return {
    clean,
    words,
    lower,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    uniqueRatio: words.length ? unique.size / words.length : 0,
    advancedCount: advanced.length,
    advancedRatio: words.length ? advanced.length / words.length : 0,
    linking,
    avgSentenceLength: lengthAvg,
    sentenceVariance: variance,
    complexRatio: words.length ? complex / words.length : 0,
    sentences,
    paragraphs
  };
}

function detectErrors(text, limit = 5) {
  const errors = [];
  const push = (original, correction, explanation, category) => {
    if (errors.length >= limit) return;
    if (!original || !text.includes(original)) return;
    if (errors.some((e) => e.original === original && e.correction === correction)) return;
    errors.push({ original, correction, explanation, category });
  };

  const patterns = [
    [/\bi\s+(think|believe|agree|disagree|feel|find|have|am|was|will|would|can|could|should)\b/i, (m) => m.replace(/^i/, "I"), "The first-person pronoun 'I' is always capitalised.", "Capitalisation"],
    [/\ba\s+([aeiou][a-z]+)\b/gi, null, null, null],
    [/\ban\s+([bcdfgjklmnpqrstvwxyz][a-z]+)\b/gi, null, null, null],
    [/\bmore\s+(easier|better|worse|cheaper|faster|slower|larger|smaller|bigger|higher|lower)\b/gi, (m) => m.split(/\s+/)[1], "Do not combine 'more' with a comparative form ending in -er (or an irregular comparative).", "Comparatives"],
    [/\b(people|students|children|they|we|politicians|governments)\s+is\b/gi, (m) => m.replace(/\bis\b/i, "are"), "A plural subject takes a plural verb ('are').", "Subject–verb agreement"],
    [/\b(people|children|students|they|we)\s+has\b/gi, (m) => m.replace(/\bhas\b/i, "have"), "A plural subject takes 'have', not 'has'.", "Subject–verb agreement"],
    [/\bI\s+am\s+agree\b/gi, () => "I agree", "'Agree' is a verb; say 'I agree', not 'I am agree'.", "Verb form"],
    [/\bdiscuss\s+about\b/gi, () => "discuss", "'Discuss' is transitive and is not followed by 'about'.", "Prepositions"],
    [/\bin\s+nowadays\b/gi, () => "nowadays", "'Nowadays' stands alone; do not use 'in' before it.", "Prepositions"],
    [/\baccording\s+to\s+me\b/gi, () => "in my view", "'According to me' is not idiomatic; use 'in my view' or 'I believe'.", "Expression"],
    [/\balot\b/gi, () => "a lot", "'A lot' is written as two words.", "Spelling"],
    [/\binformations\b/gi, () => "information", "'Information' is uncountable and has no plural -s.", "Countability"],
    [/\badvices\b/gi, () => "advice", "'Advice' is uncountable; use 'pieces of advice' for plural meaning.", "Countability"],
    [/\bresearches\b/gi, () => "research", "'Research' is usually uncountable. Use 'studies' for countable research projects.", "Countability"],
    [/\bthe\s+the\b/gi, () => "the", "A repeated word makes the sentence harder to read.", "Accuracy"],
    [/\band\s+and\b/gi, () => "and", "A repeated word makes the sentence harder to read.", "Accuracy"],
    [/\s{2,}/g, (m) => " ", "Remove the extra space.", "Formatting"],
    [/([.!?])([A-Za-z])/g, (m, p1, p2) => `${p1} ${p2}`, "Leave a space after a full stop or question mark.", "Punctuation"]
  ];

  for (const [regex, replacer, explanation, category] of patterns) {
    if (!explanation) continue;
    const match = regex.exec(text);
    if (!match) continue;
    const original = match[0];
    const correction = typeof replacer === "function" ? replacer(original, match[1]) : String(replacer);
    push(original, correction, explanation, category);
  }

  // A / an before a vowel or consonant sound, with common exceptions.
  const aMatch = /\b(a|an)\s+([A-Za-z][A-Za-z'-]*)/gi;
  let m;
  while ((m = aMatch.exec(text)) && errors.length < limit) {
    const article = m[1];
    const word = m[2];
    const vowelSound = /^[aeiou]/i.test(word) && !/^(university|unique|uniform|useful|user|european|one|once)/i.test(word);
    const consonantButVowelSound = /^(hour|honest|honour|heir)/i.test(word);
    const wrong = (article.toLowerCase() === "a" && vowelSound) || (article.toLowerCase() === "an" && !vowelSound && !consonantButVowelSound);
    if (wrong) {
      const correction = `${article.toLowerCase() === "a" ? "an" : "a"} ${word}`;
      push(m[0], correction, `Use '${article.toLowerCase() === "a" ? "an" : "a"}' before the sound at the start of '${word}'.`, "Articles");
      break;
    }
  }

  // Lowercase sentence openings.
  const lowerStart = /(^|[.!?]\s+)([a-z])/m.exec(text);
  if (lowerStart) {
    const original = lowerStart[0];
    const correction = lowerStart[1] + lowerStart[2].toUpperCase();
    push(original, correction, "Begin each sentence with a capital letter.", "Capitalisation");
  }

  return errors.slice(0, limit);
}

function qualityBand(score) {
  return roundHalf(clamp(score, 3.5, 8.5));
}

function criterion(name, score, note) {
  return { name, score: qualityBand(score), note };
}

function writingFeedback({ taskType, mode, prompt, response }) {
  const m = baseMetrics(response);
  const target =
    mode === "paragraph" ? 110 : taskType === 1 ? 150 : 250;
  const lengthRatio = m.wordCount / target;
  const errorList = detectErrors(response, 6);
  const errorRate = m.wordCount ? errorList.length / Math.max(1, m.sentenceCount) : 0;
  const hasExamples = /\b(for example|for instance|such as|e\.g\.)\b/i.test(response);
  const hasConclusion = /\b(in conclusion|overall|to conclude|in summary)\b/i.test(response);
  const hasPosition = /\b(i (strongly )?(believe|agree|disagree)|in my (view|opinion)|this essay (will|argues)|i would argue)\b/i.test(response);

  let taskScore = 5;
  taskScore += clamp(lengthRatio, 0, 1.3) * 1.4;
  taskScore += hasExamples ? 0.3 : 0;
  taskScore += hasPosition || taskType === 1 ? 0.3 : 0;
  taskScore += hasConclusion || taskType === 1 || mode === "paragraph" ? 0.2 : 0;
  taskScore -= Math.max(0, 0.85 - lengthRatio) * 2.5;

  let coherenceScore = 5;
  coherenceScore += Math.min(1.1, m.linking.length * 0.17);
  coherenceScore += Math.min(0.6, Math.max(0, m.paragraphCount - 1) * 0.22);
  coherenceScore += m.avgSentenceLength >= 12 && m.avgSentenceLength <= 28 ? 0.5 : 0;
  coherenceScore -= m.sentenceCount < 3 ? 0.8 : 0;
  coherenceScore -= m.paragraphCount === 1 && m.wordCount > 180 ? 0.3 : 0;

  let lexicalScore = 4.8;
  lexicalScore += m.uniqueRatio >= 0.5 ? 1.0 : m.uniqueRatio >= 0.4 ? 0.6 : 0.2;
  lexicalScore += Math.min(1.1, m.advancedRatio * 12);
  lexicalScore += Math.min(0.5, m.advancedCount * 0.07);
  lexicalScore -= m.uniqueRatio < 0.32 && m.wordCount > 60 ? 0.5 : 0;

  let grammarScore = 5.4;
  grammarScore += Math.min(0.9, m.complexRatio * 8);
  grammarScore += m.sentenceVariance > 40 ? 0.35 : 0;
  grammarScore += m.avgSentenceLength > 9 ? 0.35 : 0;
  grammarScore -= Math.min(1.6, errorList.length * 0.28);
  grammarScore -= m.sentenceCount < 3 ? 0.6 : 0;

  const scores = {
    "Task response": clamp(taskScore, 4, 8),
    "Coherence & cohesion": clamp(coherenceScore, 4, 8),
    "Lexical resource": clamp(lexicalScore, 4, 8.5),
    "Grammatical range & accuracy": clamp(grammarScore, 4, 8)
  };

  let overall =
    scores["Task response"] * 0.28 +
    scores["Coherence & cohesion"] * 0.24 +
    scores["Lexical resource"] * 0.24 +
    scores["Grammatical range & accuracy"] * 0.24;

  if (mode !== "paragraph" && m.wordCount < 120) overall = Math.min(overall, 5.5);
  if (mode !== "paragraph" && taskType === 2 && m.wordCount < 180) overall = Math.min(overall, 6);
  if (m.wordCount < 50) overall = Math.min(overall, 5);

  const strengths = [];
  const improvements = [];

  if (lengthRatio >= 1) strengths.push(`You developed your answer to ${m.wordCount} words, meeting the length target for this mode.`);
  else improvements.push(`Build the answer out to roughly ${target} words. At ${m.wordCount} words, there is not yet enough evidence of developed ideas.`);

  if (m.linking.length >= 2) strengths.push(`You guide the reader with cohesive signposts such as ${m.linking.slice(0, 3).map((l) => `'${l}'`).join(", ")}.`);
  else improvements.push("Add a small number of precise linking phrases (for example, 'however', 'as a result', 'a further consequence') so the logic is easier to follow.");

  if (m.paragraphCount >= (mode === "paragraph" ? 1 : 3)) strengths.push(`The ${m.paragraphCount}-paragraph structure gives each stage of the argument room to breathe.`);
  else improvements.push(mode === "paragraph" ? "Make sure the paragraph has one clear controlling idea, then develop it with an example or consequence." : "Use paragraphing to separate your introduction, main claims and conclusion. One long block is difficult to follow.");

  if (m.advancedCount >= 3) strengths.push(`You reached for topic-appropriate vocabulary, including ${Array.from(new Set(m.lower.filter((w) => ACADEMIC_WORDS.has(w)))).slice(0, 4).join(", ")}.`);
  else improvements.push("Replace general words with precise, topic-specific vocabulary. Aim to use a few academic words accurately rather than many approximately.");

  if (m.sentenceVariance > 35) strengths.push("Your sentence lengths vary, which gives the writing a more natural rhythm.");
  else improvements.push("Vary sentence length and structure. A mix of short claims and longer explanations is easier to read than a sequence of similar sentences.");

  if (errorList.length) improvements.push(`There are ${errorList.length} small language issues to repair — see the flagged errors below.`);
  else strengths.push("No high-confidence mechanical errors were detected in this sample.");

  if (!hasExamples && improvements.length < 4) improvements.push("Support your main claim with a concrete example or consequence rather than a second general statement.");

  const summary = `This is a transparent practice estimate from the shape of your response (${m.wordCount} words, ${m.sentenceCount} sentences). It looks at length, structure, vocabulary variety and detectable language patterns; it cannot judge the quality of your ideas the way a human examiner can.`;
  const examinerNote = "The biggest lever here: connect Gemini for a full criterion-by-criterion assessment and a rewritten model of your answer.";

  return {
    overallBand: qualityBand(overall),
    criteria: [
      criterion("Task response", scores["Task response"], `Length is ${Math.round(lengthRatio * 100)}% of the target for this mode. ${hasExamples ? "An example or illustration is present." : "No clear example or illustration was detected."}`),
      criterion("Coherence & cohesion", scores["Coherence & cohesion"], `${m.paragraphCount} paragraph(s) and ${m.linking.length} recognised linking expression(s). ${hasConclusion ? "A concluding move is present." : "A short concluding move would help the reader."}`),
      criterion("Lexical resource", scores["Lexical resource"], `Unique-word ratio: ${(m.uniqueRatio * 100).toFixed(0)}%. Academic/topic vocabulary tokens detected: ${m.advancedCount}.`),
      criterion("Grammatical range & accuracy", scores["Grammatical range & accuracy"], `${m.sentenceCount} sentences, average length ${m.avgSentenceLength.toFixed(1)} words. High-confidence issues detected: ${errorList.length}.`)
    ],
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    flaggedErrors: errorList,
    rewritten: "",
    summary,
    examinerNote,
    demo: true,
    mode: "demo"
  };
}

function speakingFeedback({ mode, prompt, transcript, durationSeconds }) {
  const m = baseMetrics(transcript);
  const lowerText = m.clean.toLowerCase();
  const fillerCount = FILLERS.reduce((sum, filler) => {
    const matches = lowerText.match(new RegExp(`\\b${filler.replace(/ /g, "\\s+")}\\b`, "g"));
    return sum + (matches ? matches.length : 0);
  }, 0);
  const fillerRatio = m.wordCount ? fillerCount / m.wordCount : 0;
  const duration = Number(durationSeconds) > 8 ? Number(durationSeconds) : Math.round(m.wordCount / 2.3);
  const wpm = duration ? (m.wordCount / duration) * 60 : 0;
  const errorList = detectErrors(transcript, 5);
  const target = mode === "paragraph" ? 65 : 150;
  const lengthRatio = m.wordCount / target;
  const repetition = m.lower.length
    ? m.lower.filter((w) => w.length > 4).length -
      new Set(m.lower.filter((w) => w.length > 4)).size
    : 0;

  let fluency = 5.2;
  fluency += clamp(lengthRatio, 0, 1.2) * 1.1;
  fluency += wpm >= 105 && wpm <= 175 ? 0.5 : 0;
  fluency -= Math.min(1.2, fillerRatio * 16);
  fluency -= lengthRatio < 0.5 ? 0.8 : 0;
  fluency += m.linking.length >= 2 ? 0.25 : 0;

  let lexical = 5.0;
  lexical += m.uniqueRatio >= 0.5 ? 0.8 : m.uniqueRatio >= 0.4 ? 0.45 : 0;
  lexical += Math.min(1.0, m.advancedRatio * 14);
  lexical -= repetition > m.wordCount * 0.2 ? 0.35 : 0;

  let grammar = 5.4;
  grammar += Math.min(0.8, m.complexRatio * 8);
  grammar += m.avgSentenceLength >= 8 ? 0.3 : 0;
  grammar -= Math.min(1.4, errorList.length * 0.3);
  grammar -= m.sentenceCount < 2 ? 0.6 : 0;

  const scores = {
    "Fluency & coherence": clamp(fluency, 4, 8),
    "Lexical resource": clamp(lexical, 4, 8.5),
    "Grammatical range & accuracy": clamp(grammar, 4, 8)
  };
  let overall = scores["Fluency & coherence"] * 0.38 + scores["Lexical resource"] * 0.31 + scores["Grammatical range & accuracy"] * 0.31;
  if (m.wordCount < 30) overall = Math.min(overall, 5);

  const strengths = [];
  const improvements = [];

  if (lengthRatio >= 0.9) strengths.push(`You sustained your answer for ${m.wordCount} words, giving the examiner enough language to assess.`);
  else improvements.push(`Extend your answer: ${m.wordCount} words is short for this ${mode === "paragraph" ? "short turn" : "long turn"}. Add a specific example and a consequence.`);

  if (fillerRatio < 0.025) strengths.push("You kept filler words under control, so the main idea stays audible.");
  else improvements.push(`Reduce filler or hedging (${fillerCount} detected). A brief pause is more confident than '${FILLERS.find((f) => lowerText.includes(f)) || "um"}'.`);

  if (m.linking.length >= 2) strengths.push(`Your answer signposts its logic with ${m.linking.slice(0, 2).map((l) => `'${l}'`).join(" and ")}.`);
  else improvements.push("Make the structure audible: state your position, give one reason, then one example. Signposts such as 'the main reason' and 'for instance' help the listener.");

  if (m.advancedCount >= 2) strengths.push(`You used topic-relevant vocabulary such as ${Array.from(new Set(m.lower.filter((w) => ACADEMIC_WORDS.has(w)))).slice(0, 4).join(", ")}.`);
  else improvements.push("Add two or three precise topic words. Paraphrasing the question is a quick way to demonstrate range without sounding rehearsed.");

  if (errorList.length === 0) strengths.push("No high-confidence grammar or usage errors were detected in the transcript.");
  else improvements.push(`Repair the ${errorList.length} language issue(s) flagged below; saying the correction aloud once will help it stick.`);

  return {
    overallBand: qualityBand(overall),
    criteria: [
      criterion("Fluency & coherence", scores["Fluency & coherence"], `Approximately ${wpm.toFixed(0)} words per minute over ${duration}s. ${fillerCount} filler(s) detected. ${m.linking.length} linking expression(s).`),
      criterion("Lexical resource", scores["Lexical resource"], `Unique-word ratio: ${(m.uniqueRatio * 100).toFixed(0)}%. Academic/topic vocabulary tokens: ${m.advancedCount}.`),
      criterion("Grammatical range & accuracy", scores["Grammatical range & accuracy"], `${m.sentenceCount} sentence(s); average ${m.avgSentenceLength.toFixed(1)} words. High-confidence issues: ${errorList.length}.`)
    ],
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    flaggedErrors: errorList,
    improvedAnswer: "",
    summary: `This is a practice estimate based on your transcript (${m.wordCount} words, about ${duration}s). It cannot hear pronunciation, intonation or accent.`,
    examinerNote: "Pronunciation was not assessed. Speech-recognition slips may have been counted as errors; read the transcript before treating them as language mistakes.",
    demo: true,
    mode: "demo"
  };
}

module.exports = { writingFeedback, speakingFeedback, detectErrors, baseMetrics };

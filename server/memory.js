const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const MODES = {
  long: {
    key: "long",
    offsets: [1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY]
  },
  short: {
    key: "short",
    offsets: [20 * MINUTE, 60 * MINUTE, 9 * 60 * MINUTE]
  },
  mixed: {
    key: "mixed",
    offsets: [20 * MINUTE, 60 * MINUTE, 9 * 60 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY]
  }
};

const MODE_KEYS = new Set(Object.keys(MODES));

function normalizeMode(value) {
  return MODE_KEYS.has(value) ? value : "mixed";
}

function modeInfo(mode) {
  return MODES[normalizeMode(mode)];
}

function prefsFromUser(user) {
  return {
    mode: normalizeMode(user?.memory_mode),
    words: Number(user?.memory_words ?? 1) === 1,
    mistakes: Number(user?.memory_mistakes ?? 1) === 1
  };
}

function startedSchedule(mode, now = Date.now()) {
  const info = modeInfo(mode);
  return {
    startedAt: now,
    step: 0,
    nextAt: now + info.offsets[0],
    done: false
  };
}

function advanceSchedule({ mode, startedAt, step = 0, correct = true, now = Date.now() }) {
  const info = modeInfo(mode);
  const currentStep = Math.max(0, Number(step) || 0);
  if (!correct) {
    return {
      startedAt: now,
      step: 0,
      nextAt: now + info.offsets[0],
      done: false,
      reset: true
    };
  }
  const nextStep = currentStep + 1;
  if (nextStep >= info.offsets.length) {
    return { startedAt, step: nextStep, nextAt: 0, done: true, reset: false };
  }
  const base = Number(startedAt) || now;
  return {
    startedAt: base,
    step: nextStep,
    nextAt: Math.max(now + MINUTE, base + info.offsets[nextStep]),
    done: false,
    reset: false
  };
}

function dueAtFromStep(mode, startedAt, step) {
  const info = modeInfo(mode);
  const index = Math.max(0, Number(step) || 0);
  if (index >= info.offsets.length) return 0;
  return (Number(startedAt) || Date.now()) + info.offsets[index];
}

module.exports = {
  MINUTE,
  DAY,
  MODES,
  MODE_KEYS,
  normalizeMode,
  modeInfo,
  prefsFromUser,
  startedSchedule,
  advanceSchedule,
  dueAtFromStep
};

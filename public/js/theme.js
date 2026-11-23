export const THEMES = [
  {
    id: "stone-blue",
    name: "Stone + Blue",
    note: "Clean and neutral",
    default: true,
    colors: ["#ffffff", "#ffffff", "#2f6285", "#b18355"]
  },
  {
    id: "white-red",
    name: "Pure White + Red",
    note: "Bright, direct, warm",
    colors: ["#ffffff", "#ffffff", "#b23a3a", "#f0dada"]
  },
  {
    id: "white-purple",
    name: "Pure White + Purple",
    note: "Bright and focused",
    colors: ["#ffffff", "#ffffff", "#6d4aa8", "#e9e0f5"]
  },
  {
    id: "olive-cream",
    name: "Olive + Cream",
    note: "Warm and quiet",
    colors: ["#f6f4ee", "#fffefa", "#5f7457", "#b6864e"]
  },
  {
    id: "slate-amber",
    name: "Slate + Amber",
    note: "Crisp and focused",
    colors: ["#f4f5f5", "#ffffff", "#4b5d6b", "#bf8a3e"]
  },
  {
    id: "clay-paper",
    name: "Clay + Paper",
    note: "Soft editorial",
    colors: ["#f6f2ec", "#fffdfa", "#9a5a44", "#5f7366"]
  }
];

const VALID = new Set(THEMES.map((theme) => theme.id));
const STORAGE_KEY = "daymark-theme";

export function currentTheme() {
  const active = document.documentElement.getAttribute("data-theme");
  return VALID.has(active) ? active : "stone-blue";
}

export function applyTheme(id, { persist = true, announce = true } = {}) {
  const theme = VALID.has(id) ? id : "stone-blue";
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  const metaColor = { "stone-blue": "#ffffff", "white-red": "#ffffff", "white-purple": "#ffffff", "olive-cream": "#f6f4ee", "slate-amber": "#f4f5f5", "clay-paper": "#f6f2ec" }[theme] || "#ffffff";
  if (meta) meta.setAttribute("content", metaColor);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }
  if (announce) window.dispatchEvent(new CustomEvent("daymark:theme", { detail: { theme } }));
  return theme;
}

export function initTheme() {
  return applyTheme(currentTheme(), { persist: false, announce: false });
}

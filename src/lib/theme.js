// Resolves a theme preference ("system" | "light" | "dark") to a concrete theme
// and applies it as data-theme on the document root. Pure resolveTheme is testable.
export function resolveTheme(pref, prefersDark) {
  if (pref === "dark" || pref === "light") return pref;
  return prefersDark ? "dark" : "light";
}

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

export function applyTheme(pref) {
  document.documentElement.setAttribute("data-theme", resolveTheme(pref, prefersDark()));
}

// Applies the theme now and re-applies on OS theme change while set to system.
export function initTheme(pref) {
  applyTheme(pref);
  if (pref === "system" && window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(pref));
  }
}

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Logic-only (no paired CSS, same exception as i18n.js/storage.js). Manual
// dark/light switch next to the device setting (B_001). The choice is one of
// "system" (default, follows prefers-color-scheme), "dark" or "light", kept in
// localStorage and applied as data-theme on <html>; global.css does the rest.
//
// Load it in <head> and call initTheme() right away so the page doesn't flash
// the wrong theme before the body scripts run.
//
// Usage in a page:
//   <script src="../../modules/theme/theme.js"></script>
//   <script>window.theme.initTheme();</script>
//   ...
//   window.theme.setTheme('light'); // 'system' | 'dark' | 'light'

window.theme = (function () {
  const STORAGE_KEY = "appTheme";
  const THEMES = ["system", "dark", "light"];

  function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "system";
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }

  function initTheme() {
    applyTheme(getTheme());
  }

  return { THEMES, getTheme, setTheme, initTheme };
})();

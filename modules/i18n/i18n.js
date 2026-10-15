// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Reads translations from window.LOCALES.{hu,...} (each page must load every
// locale script before this one) and exposes window.i18n.
//
// Usage in a page:
//   <script src="../../locales/hu.js"></script>
//   <script src="../../modules/i18n/i18n.js"></script>
//   <script>
//     window.i18n.initI18n();
//     someEl.textContent = window.i18n.t('login.title');
//   </script>

window.i18n = (function () {
  const STORAGE_KEY = "appLang";
  const DEFAULT_LANG = "hu";
  let currentLang = DEFAULT_LANG;

  function initI18n() {
    const stored = localStorage.getItem(STORAGE_KEY);
    currentLang = stored && window.LOCALES[stored] ? stored : DEFAULT_LANG;
    document.documentElement.lang = currentLang;
    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) document.title = t(titleEl.getAttribute("data-i18n"));
  }

  function t(key) {
    const table = window.LOCALES[currentLang] || {};
    return table[key] || key;
  }

  function setLanguage(code) {
    if (!window.LOCALES[code]) return;
    currentLang = code;
    localStorage.setItem(STORAGE_KEY, code);
  }

  function getLanguage() {
    return currentLang;
  }

  return { initI18n, t, setLanguage, getLanguage };
})();

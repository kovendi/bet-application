// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Demo scenario settings: lets a client trigger cases (closed market, slow /
// failing network, empty lists) from Settings → Mockup instead of editing the
// URL. Saved in localStorage under `mockSettings`. A URL parameter
// (?market=, ?mock=) still wins over the saved value, so the index.html links
// keep working. Logic-only module (no paired CSS), like i18n and storage.
//
// Settings: market  'auto' | 'open' | 'closed'
//           network 'normal' | 'slow' | 'error' | 'empty'
//
// Read by modules/market-status and modules/mock-network when this script is
// loaded before them.
//
// Usage:
//   <script src="../../modules/mock-settings/mock-settings.js"></script>
//   window.mockSettings.get('market');          // 'auto' by default
//   window.mockSettings.set('market', 'closed');
//   window.mockSettings.reset();
//   window.mockSettings.isCustom();             // anything differs from the default

window.mockSettings = (function () {
  const KEY = "mockSettings";
  const DEFAULTS = { market: "auto", network: "normal" };
  const OPTIONS = {
    market: ["auto", "open", "closed"],
    network: ["normal", "slow", "error", "empty"],
  };

  function readAll() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function get(name) {
    const value = readAll()[name];
    return OPTIONS[name] && OPTIONS[name].includes(value) ? value : DEFAULTS[name];
  }

  function set(name, value) {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value }));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  function isCustom() {
    return Object.keys(DEFAULTS).some((name) => get(name) !== DEFAULTS[name]);
  }

  return { get, set, reset, isCustom, OPTIONS };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Logic-only (no paired CSS, same exception as i18n.js/storage.js). Shared
// by every page that reads/displays a user-picked color (tags, categories,
// ...) — a stored `color` field is either one of the preset keys below or a
// literal hex string picked via a "custom" swatch.
//
// Usage in a page:
//   <script src="../../modules/tag-color/tag-color.js"></script>
//   <script>
//     el.style.background = window.tagColorModule.resolveTagColor(tag.color);
//   </script>

window.tagColorModule = (function () {
  const PRESET_COLORS = {
    primary: "var(--color-primary)",
    accent: "var(--color-accent)",
    highlight: "var(--color-highlight)",
    negative: "var(--color-negative)",
    purple: "#8b6fd9",
    pink: "#d97aa8",
    cyan: "#4ba8b5",
    gray: "#7d8f88",
  };

  function resolveTagColor(color) {
    return PRESET_COLORS[color] || color;
  }

  return { PRESET_COLORS, resolveTagColor };
})();

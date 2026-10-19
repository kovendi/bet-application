// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// A row of selectable options. Unlike tabs it owns its selection state: it
// updates the active item itself and reports the new value through onChange.
//
// Variants:
//   'chips'     — horizontally scrollable pills, single select (category
//                 selector, TK_001)
//   'segmented' — equal-width options in one track (time range, chart type)
//   'bubble'    — wrapping outlined bubbles, usually multi select (filters,
//                 e.g. disclosure categories, TA_0014)
// An item may carry an `icon` (icon-only items need `ariaLabel`).
//
// Requires modules/icon/icon.js when an item has an icon.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/chips/chips.js"></script>
//   <script>
//     container.appendChild(window.chipsModule.renderChips({
//       items: [{ id: 'share', label: 'Share' }, { id: 'etf', label: 'ETF' }],
//       variant: 'chips', // 'chips' | 'segmented' | 'bubble'
//       activeId: 'share', // single select
//       // multi: true, activeIds: ['share'], // multi select
//       ariaLabel: 'Category',
//       onChange: (value) => {...}, // id (single) or array of ids (multi)
//     }));
//   </script>

window.chipsModule = (function () {
  function renderChips({
    items = [],
    variant = "chips",
    activeId,
    activeIds = [],
    multi = false,
    ariaLabel,
    onChange,
  } = {}) {
    const container = document.createElement("div");
    container.className = `chips chips--${variant}`;
    container.setAttribute("role", multi ? "group" : "radiogroup");
    if (ariaLabel) container.setAttribute("aria-label", ariaLabel);

    let selected = multi ? activeIds.slice() : [activeId];
    const buttons = [];

    // Segmented: one highlight slides under the options (iOS style) instead of
    // each option switching its own background. Options are equal width, so
    // the position is just the index (see chips.css).
    const slidingThumb = variant === "segmented" && !multi;
    let thumb = null;
    if (slidingThumb) {
      container.classList.add("chips--sliding");
      container.style.setProperty("--chips-count", items.length);
      thumb = document.createElement("span");
      thumb.className = "chips-thumb";
      thumb.setAttribute("aria-hidden", "true");
      container.appendChild(thumb);
    }

    function paint() {
      buttons.forEach(({ button, id }, index) => {
        const isActive = selected.includes(id);
        button.classList.toggle("chips-item--active", isActive);
        button.setAttribute(multi ? "aria-pressed" : "aria-checked", isActive ? "true" : "false");
        if (thumb && isActive) container.style.setProperty("--chips-index", index);
      });
    }

    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chips-item";
      if (!multi) button.setAttribute("role", "radio");
      if (item.ariaLabel) button.setAttribute("aria-label", item.ariaLabel);

      if (item.icon) {
        const iconEl = window.iconModule.renderIcon(item.icon);
        iconEl.classList.add("chips-item-icon");
        button.appendChild(iconEl);
      }
      if (item.label) button.appendChild(document.createTextNode(item.label));

      button.addEventListener("click", () => {
        if (multi) {
          selected = selected.includes(item.id)
            ? selected.filter((id) => id !== item.id)
            : selected.concat(item.id);
          paint();
          if (onChange) onChange(selected.slice());
        } else if (selected[0] !== item.id) {
          selected = [item.id];
          paint();
          if (onChange) onChange(item.id);
        }
      });

      buttons.push({ button, id: item.id });
      container.appendChild(button);
    });

    paint();
    return container;
  }

  return { renderChips };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Sticky bottom action bar: a single full-width primary button for a page's
// main "create new X" action. Unlike bottom-nav (the app's main menu), this
// bar has no navigation destinations of its own — it just surfaces one
// action, so pages that need it in place of the main menu can use it.
//
// Requires modules/icon/icon.js to be loaded first (renders the button icon).
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/action-bar/action-bar.js"></script>
//   <script>
//     container.appendChild(window.actionBarModule.renderActionBar({
//       label: window.i18n.t('action_bar.new_record'),
//       onAction: () => {...}, // optional, no-op if omitted
//       icon: 'plus', // optional, defaults to 'plus' (the "add new" bar's icon)
//     }));
//   </script>

window.actionBarModule = (function () {
  function renderActionBar({ label, onAction, icon: iconName = "plus" } = {}) {
    const bar = document.createElement("div");
    bar.className = "action-bar";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-bar-button";
    if (onAction) button.addEventListener("click", onAction);

    const icon = window.iconModule.renderIcon(iconName);
    icon.classList.add("action-bar-button-icon");

    const text = document.createElement("span");
    text.textContent = label;

    button.appendChild(icon);
    button.appendChild(text);
    bar.appendChild(button);

    return bar;
  }

  return { renderActionBar };
})();

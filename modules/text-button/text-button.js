// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// A low-emphasis text button with a leading icon (e.g. "Reset filters").
// Not full-width, not a card action — sits inline wherever a lightweight,
// secondary action is needed next to/under a form.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/text-button/text-button.js"></script>
//   <script>
//     container.appendChild(window.textButtonModule.renderTextButton({
//       label: 'Szűrők törlése',
//       icon: 'refresh',
//       onClick: () => {...},
//     }));
//   </script>

window.textButtonModule = (function () {
  function renderTextButton({ label, icon, type = "button", onClick } = {}) {
    const button = document.createElement("button");
    button.type = type;
    button.className = "app-text-button";

    if (icon) {
      button.appendChild(window.iconModule.renderIcon(icon));
    }

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    button.appendChild(labelEl);

    if (onClick) button.addEventListener("click", onClick);
    return button;
  }

  return { renderTextButton };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Empty and error states: never leave a blank area. An icon, a short title, a
// one-line explanation and the primary action that fixes it (retry, add, ...).
//
// Requires modules/icon, modules/button and modules/motion to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/state-view/state-view.js"></script>
//   <script>
//     container.appendChild(window.stateViewModule.renderStateView({
//       variant: 'error', // 'empty' (default) | 'error'
//       icon: 'exclamationmark-circle', // optional, default per variant
//       title: t('state.error_title'),
//       message: t('state.error_message'),
//       actionLabel: t('state.retry'), // optional
//       onAction: () => load(),
//     }));
//   </script>

window.stateViewModule = (function () {
  const DEFAULT_ICONS = { empty: "info", error: "exclamationmark-circle" };

  function renderStateView({ variant = "empty", icon, title, message, actionLabel, onAction } = {}) {
    const view = document.createElement("div");
    view.className = `state-view state-view--${variant}`;
    if (variant === "error") view.setAttribute("role", "alert");

    const iconWrap = document.createElement("div");
    iconWrap.className = "state-view-icon";
    iconWrap.appendChild(window.iconModule.renderIcon(icon || DEFAULT_ICONS[variant]));
    view.appendChild(iconWrap);

    const titleEl = document.createElement("p");
    titleEl.className = "state-view-title";
    titleEl.textContent = title;
    view.appendChild(titleEl);

    if (message) {
      const messageEl = document.createElement("p");
      messageEl.className = "state-view-message";
      messageEl.textContent = message;
      view.appendChild(messageEl);
    }

    if (actionLabel) {
      const button = window.buttonModule.renderButton({
        label: actionLabel,
        variant: "outline",
        fullWidth: false,
        onClick: onAction,
      });
      button.classList.add("state-view-action");
      view.appendChild(button);
    }
    return window.motion.fadeIn(view);
  }

  return { renderStateView };
})();

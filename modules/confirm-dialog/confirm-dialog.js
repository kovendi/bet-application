// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// An "are you sure?" confirmation drawer — for destructive actions
// (delete a record, a user, ...) that shouldn't fire on a
// single tap. Slides up from the bottom over the shared blurred overlay
// (modules/overlay), like bottom-sheet, slides back down, closes on Esc /
// backdrop tap (= cancel), and removes
// itself again, so a page doesn't need a dedicated slot for it in its markup.
// Never use alert() / confirm() / prompt() — use this.
//
// Requires modules/i18n, modules/motion and modules/overlay (js + css).
//
// Usage in a page:
//   <script src="../../modules/confirm-dialog/confirm-dialog.js"></script>
//   <script>
//     window.confirmDialogModule.showConfirmDialog({
//       title: 'Címke törlése',
//       message: 'Biztosan törlöd ezt az elemet?',
//       confirmLabel: 'Törlés',
//       cancelLabel: 'Mégse', // optional, defaults to t('confirm_dialog.cancel_button')
//       variant: 'danger', // optional: 'danger' (default) | 'default'
//       onConfirm: () => {...},
//       onCancel: () => {...}, // optional
//       // optional third choice (e.g. "Csak törlés" next to
//       // "Archiválás") — when given, the buttons stack vertically,
//       // primary on top, cancel at the bottom
//       secondaryLabel: 'Csak törlés',
//       secondaryVariant: 'danger', // optional, defaults to 'danger'
//       onSecondary: () => {...},
//     });
//   </script>

window.confirmDialogModule = (function () {
  function showConfirmDialog({
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = "danger",
    onConfirm,
    onCancel,
    secondaryLabel,
    secondaryVariant = "danger",
    onSecondary,
  } = {}) {
    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog";
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");

    const handle = document.createElement("div");
    handle.className = "confirm-dialog-handle";
    dialog.appendChild(handle);

    // Actions run after the exit animation, so e.g. a navigation or a
    // follow-up toast never cuts the dialog off mid-animation.
    function close(callback) {
      layer.close(callback);
    }

    if (title) {
      const titleEl = document.createElement("p");
      titleEl.className = "confirm-dialog-title";
      titleEl.textContent = title;
      dialog.appendChild(titleEl);
    }

    if (message) {
      const messageEl = document.createElement("p");
      messageEl.className = "confirm-dialog-message";
      messageEl.textContent = message;
      dialog.appendChild(messageEl);
    }

    const actions = document.createElement("div");
    actions.className = "confirm-dialog-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "confirm-dialog-button confirm-dialog-button--cancel";
    cancelButton.textContent =
      cancelLabel || window.i18n.t("confirm_dialog.cancel_button");
    cancelButton.addEventListener("click", () => close(onCancel));

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = `confirm-dialog-button confirm-dialog-button--${variant}`;
    confirmButton.textContent = confirmLabel;
    confirmButton.addEventListener("click", () => close(onConfirm));

    if (secondaryLabel) {
      const secondaryButton = document.createElement("button");
      secondaryButton.type = "button";
      secondaryButton.className = `confirm-dialog-button confirm-dialog-button--${secondaryVariant}-soft`;
      secondaryButton.textContent = secondaryLabel;
      secondaryButton.addEventListener("click", () => close(onSecondary));

      actions.appendChild(confirmButton);
      actions.appendChild(secondaryButton);
      actions.appendChild(cancelButton);
    } else {
      actions.appendChild(confirmButton);
      actions.appendChild(cancelButton);
    }
    dialog.appendChild(actions);

    const layer = window.overlayModule.openOverlay({
      placement: "bottom",
      content: dialog,
      onDismiss: () => close(onCancel),
    });
    // Destructive default: focus lands on Cancel, so Enter can't delete by accident.
    (variant === "danger" ? cancelButton : confirmButton).focus();

    return { close };
  }

  return { showConfirmDialog };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// A panel sliding up from the bottom over the shared blurred overlay
// (modules/overlay): broker list, filters, disclaimers, the "registration
// required" notice. Stays inside the iPhone frame on desktop and removes
// itself again on close — pages don't need a slot for it. Closes on overlay
// tap, the close button or Esc, sliding back down.
//
// Requires modules/icon, modules/i18n, modules/motion and modules/overlay
// (js + css) to be loaded first; showRegistrationRequired also needs
// modules/button/button.js.
//
// Usage in a page:
//   <script src="../../modules/bottom-sheet/bottom-sheet.js"></script>
//   <script>
//     const sheet = window.bottomSheetModule.showBottomSheet({
//       title: 'Bróker választása',
//       content: someNode, // Node, scrolls when tall
//       onClose: () => {...}, // optional
//     });
//     sheet.close();
//
//     // Guest tapped a registered-only feature (favorites, alerts, AI chat):
//     window.bottomSheetModule.showRegistrationRequired();
//   </script>

window.bottomSheetModule = (function () {
  // Phase 4 adds the real registration page; until then the sheet leads to the
  // login page, which is the entry point of the demo.
  const REGISTER_URL = "../login/login.html";

  function showBottomSheet({ title, content, onClose } = {}) {
    const sheet = document.createElement("div");
    sheet.className = "bottom-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    if (title) sheet.setAttribute("aria-label", title);

    const handle = document.createElement("div");
    handle.className = "bottom-sheet-handle";
    sheet.appendChild(handle);

    const header = document.createElement("div");
    header.className = "bottom-sheet-header";
    const titleEl = document.createElement("h2");
    titleEl.className = "bottom-sheet-title";
    titleEl.textContent = title || "";
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bottom-sheet-close";
    closeButton.setAttribute("aria-label", window.i18n.t("bottom_sheet.close"));
    closeButton.appendChild(window.iconModule.renderIcon("close"));
    header.appendChild(titleEl);
    header.appendChild(closeButton);
    sheet.appendChild(header);

    const body = document.createElement("div");
    body.className = "bottom-sheet-body";
    if (content) body.appendChild(content);
    sheet.appendChild(body);

    function close() {
      layer.close(onClose);
    }

    const layer = window.overlayModule.openOverlay({
      placement: "bottom",
      content: sheet,
      onDismiss: close,
    });
    closeButton.addEventListener("click", close);
    closeButton.focus();
    return { close };
  }

  function showRegistrationRequired({ registerUrl = REGISTER_URL } = {}) {
    const t = window.i18n.t;
    const content = document.createElement("div");
    content.className = "bottom-sheet-message";

    const lockIcon = window.iconModule.renderIcon("lock");
    lockIcon.classList.add("bottom-sheet-message-icon");
    content.appendChild(lockIcon);

    const text = document.createElement("p");
    text.textContent = t("registration_required.message");
    content.appendChild(text);

    const sheet = showBottomSheet({ title: t("registration_required.title"), content });
    content.appendChild(
      window.buttonModule.renderButton({
        label: t("registration_required.register_button"),
        variant: "primary",
        onClick: () => {
          window.location.href = registerUrl;
        },
      }),
    );
    content.appendChild(
      window.buttonModule.renderButton({
        label: t("registration_required.later_button"),
        variant: "secondary",
        onClick: sheet.close,
      }),
    );
    return sheet;
  }

  return { showBottomSheet, showRegistrationRequired };
})();

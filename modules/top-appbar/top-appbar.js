// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Sticky top app bar with three slots (left / center / right). The caller
// builds whatever elements a given page needs (avatar, title, action icons,
// ...) and hands them in — the bar itself has no opinion on that content.
//
// The one exception: a fixed hamburger menu button is always appended as the
// last element of the right slot (opens pages/menu/menu.html, the app's
// global menu) so every page carries the same entry point to it, rightmost
// in the bar. Pass `hideMenuButton: true` to omit it — only the menu page
// itself does this, since opening the menu from the menu makes no sense.
//
// A notifications bell (with an unread dot) sits left of the menu button on
// every page too (K_005, ÁR_0051). Pass `hideBell: true` to omit it — the
// notifications page itself and the pre-login pages (register, forgot password).
// It reads the unread state from window.storage, loaded before this module runs.
//
// Page titles live in the left slot (`title`). On a sub-page, `onBack` adds a
// circled back arrow to the left of the title; top-level pages (main nav
// destinations) have no back arrow.
//
// Requires modules/icon/icon.js and modules/i18n/i18n.js to be loaded first
// (the menu button renders an icon and a translated aria-label).
//
// Usage in a page:
//   <script src="../../modules/top-appbar/top-appbar.js"></script>
//   <script>
//     container.appendChild(window.topAppbarModule.renderTopAppbar({
//       title: 'Market', // left slot; add onBack: () => window.pageTransition.back() on sub-pages
//       left: someElement,
//       right: someOtherElement,
//       tone: 'default', // 'brand': navy bar that runs into a brand hero band (home)
//     }));
//   </script>

window.topAppbarModule = (function () {
  function renderMenuButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "top-appbar-menu-button";
    button.setAttribute("aria-label", window.i18n.t("topbar.menu"));
    button.appendChild(window.iconModule.renderIcon("menu"));
    button.addEventListener("click", () => {
      window.pageTransition.go("../menu/menu.html");
    });
    return button;
  }

  function renderBell() {
    const link = document.createElement("a");
    link.className = "top-appbar-icon-button top-appbar-bell";
    link.href = "../notifications/notifications.html";
    link.setAttribute("aria-label", window.i18n.t("notifications.bell_label"));
    link.appendChild(window.iconModule.renderIcon("bell"));
    const user = window.storage && window.storage.getCurrentUser();
    if (user && window.storage.getNotifications(user.id).some((n) => !n.read)) {
      const dot = document.createElement("span");
      dot.className = "top-appbar-bell-dot";
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", window.i18n.t("notifications.unread"));
      link.appendChild(dot);
    }
    return link;
  }

  // Circled back arrow: the circle makes it obvious this is a button.
  function renderBackButton(onBack) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "top-appbar-back-button";
    button.setAttribute("aria-label", window.i18n.t("topbar.back"));
    button.appendChild(window.iconModule.renderIcon("back"));
    button.addEventListener("click", onBack);
    return button;
  }

  function renderTitle(text) {
    const title = document.createElement("h1");
    title.className = "top-appbar-title";
    title.textContent = text;
    return title;
  }

  function renderTopAppbar({ title, onBack, left, center, right, hideMenuButton, hideBell, tone = "default" } = {}) {
    const bar = document.createElement("header");
    bar.className = "top-appbar";
    // The brand bar is navy in both themes, so its contents use the dark tokens.
    if (tone === "brand") bar.classList.add("top-appbar--brand", "theme-dark");

    const leftSlot = document.createElement("div");
    leftSlot.className = "top-appbar-slot top-appbar-slot--left";
    if (onBack) leftSlot.appendChild(renderBackButton(onBack));
    if (left) leftSlot.appendChild(left);
    if (title) leftSlot.appendChild(renderTitle(title));

    const centerSlot = document.createElement("div");
    centerSlot.className = "top-appbar-slot top-appbar-slot--center";
    if (center) centerSlot.appendChild(center);

    const rightSlot = document.createElement("div");
    rightSlot.className = "top-appbar-slot top-appbar-slot--right";
    if (right) rightSlot.appendChild(right);
    if (!hideBell) rightSlot.appendChild(renderBell());
    if (!hideMenuButton) rightSlot.appendChild(renderMenuButton());

    bar.appendChild(leftSlot);
    bar.appendChild(centerSlot);
    bar.appendChild(rightSlot);

    return bar;
  }

  return { renderTopAppbar };
})();

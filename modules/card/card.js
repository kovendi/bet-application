// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Generic content card: icon + title on the left of the header, an optional
// element (link, badge, ...) on the right, and a content slot below.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/card/card.js"></script>
//   <script>
//     container.appendChild(window.cardModule.renderCard({
//       icon: 'home',
//       title: 'OVERVIEW',
//       headerRight: someLinkElement,
//       content: someContentElement,
//     }));
//   </script>

window.cardModule = (function () {
  function renderCard({ icon, title, headerRight, content } = {}) {
    const card = document.createElement("section");
    card.className = "app-card";

    const header = document.createElement("div");
    header.className = "app-card-header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "app-card-header-left";

    if (icon) {
      const iconEl = window.iconModule.renderIcon(icon);
      iconEl.classList.add("app-card-header-icon");
      headerLeft.appendChild(iconEl);
    }

    const titleEl = document.createElement("span");
    titleEl.className = "app-card-header-title";
    titleEl.textContent = title;
    headerLeft.appendChild(titleEl);

    header.appendChild(headerLeft);

    if (headerRight) {
      const rightSlot = document.createElement("div");
      rightSlot.className = "app-card-header-right";
      rightSlot.appendChild(headerRight);
      header.appendChild(rightSlot);
    }

    card.appendChild(header);

    if (content) {
      const body = document.createElement("div");
      body.className = "app-card-body";
      body.appendChild(content);
      card.appendChild(body);
    }

    return card;
  }

  return { renderCard };
})();

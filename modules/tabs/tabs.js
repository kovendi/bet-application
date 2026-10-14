// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Simple in-page tab switcher: a row of equal-width buttons, one marked
// active. Stateless — the caller owns which tab is active and re-renders
// (or swaps a content panel) from `onChange`; this module doesn't touch page
// content on its own.
//
// Requires modules/icon/icon.js to be loaded first (renders each tab's icon).
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/tabs/tabs.js"></script>
//   <script>
//     container.appendChild(window.tabsModule.renderTabs({
//       tabs: [
//         { id: 'first', label: 'Első', icon: 'home' },
//         { id: 'second', label: 'Második', icon: 'search' },
//       ],
//       activeId: 'first',
//       onChange: (id) => {...},
//     }));
//   </script>

window.tabsModule = (function () {
  function renderTabs({ tabs, activeId, onChange } = {}) {
    const container = document.createElement("div");
    container.className = "app-tabs";
    container.setAttribute("role", "tablist");

    tabs.forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "app-tabs-button";
      button.classList.toggle("app-tabs-button--active", tab.id === activeId);
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", tab.id === activeId ? "true" : "false");

      if (tab.icon) {
        const iconEl = window.iconModule.renderIcon(tab.icon);
        iconEl.classList.add("app-tabs-button-icon");
        button.appendChild(iconEl);
      }

      const label = document.createElement("span");
      label.textContent = tab.label;
      button.appendChild(label);

      button.addEventListener("click", () => {
        if (tab.id !== activeId && onChange) onChange(tab.id);
      });
      container.appendChild(button);
    });

    return container;
  }

  return { renderTabs };
})();

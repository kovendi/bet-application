// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Sticky bottom app bar holding the app's main menu, each destination
// rendered as an icon with its label below. Keep the items list in one shared
// place (e.g. a page-level constant reused everywhere) so every page shows the
// same destinations; pages only change which one is active.
//
// Requires modules/icon/icon.js to be loaded first (renders each item's icon).
//
// renderMainNav(activeId) renders the app's shared main menu (Home, Piactér,
// Bet assist AI, Edukáció) — use it on every main page instead of passing items.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/bottom-nav/bottom-nav.js"></script>
//   <script>
//     container.appendChild(window.bottomNavModule.renderBottomNav({
//       items: [
//         { id: 'home', icon: 'home', labelKey: 'nav.home', href: '../home/home.html' },
//         { id: 'search', icon: 'search', labelKey: 'nav.search', href: '../search/search.html' },
//       ],
//       activeId: 'home',
//     }));
//   </script>

window.bottomNavModule = (function () {
  // Floating pill menu. One shared indicator slides under the active item;
  // because every destination is a separate page, the previously active id is
  // kept in sessionStorage so a fresh page can start the indicator at the old
  // spot and glide it to the new one. Clicking also plays the slide before
  // navigating, so the user gets immediate feedback.
  const STORAGE_KEY = "bottomNav.lastActive";
  const NAVIGATE_DELAY_MS = 220;

  function readLast() {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function writeLast(id) {
    try { sessionStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
  }

  function renderBottomNav({ items = [], activeId } = {}) {
    const nav = document.createElement("nav");
    nav.className = "bottom-nav";

    const bar = document.createElement("div");
    bar.className = "bottom-nav-bar";
    bar.style.setProperty("--bottom-nav-count", items.length);

    const indicator = document.createElement("span");
    indicator.className = "bottom-nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    bar.appendChild(indicator);

    const links = [];
    function setActive(id) {
      const index = items.findIndex((item) => item.id === id);
      indicator.style.transform = "translateX(" + Math.max(index, 0) * 100 + "%)";
      indicator.hidden = index < 0;
      links.forEach((link, i) => {
        const on = i === index;
        link.classList.toggle("bottom-nav-item--active", on);
        if (on) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }

    items.forEach((item) => {
      const link = document.createElement("a");
      link.className = "bottom-nav-item";
      link.href = item.href;

      // Filled icon when active, outline variant (`<icon>-outline`) otherwise.
      const iconActive = window.iconModule.renderIcon(item.icon);
      const iconInactive = window.iconModule.renderIcon(item.icon + "-outline");
      iconActive.classList.add("bottom-nav-item-icon", "bottom-nav-item-icon--active");
      iconInactive.classList.add("bottom-nav-item-icon", "bottom-nav-item-icon--inactive");

      const label = document.createElement("span");
      label.className = "bottom-nav-item-label";
      label.textContent = window.i18n.t(item.labelKey);

      link.appendChild(iconActive);
      link.appendChild(iconInactive);
      link.appendChild(label);

      link.addEventListener("click", (event) => {
        if (item.id === activeId || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        setActive(item.id);
        writeLast(item.id);
        setTimeout(() => { window.location.href = item.href; }, NAVIGATE_DELAY_MS);
      });

      links.push(link);
      bar.appendChild(link);
    });

    // Start at the previous destination (no transition), then glide to the
    // current one once the bar is in the DOM and has been painted.
    const last = readLast();
    const from = last && last !== activeId && items.some((i) => i.id === last) ? last : activeId;
    bar.classList.add("bottom-nav-bar--static");
    setActive(from);
    writeLast(activeId);
    if (from !== activeId) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        bar.classList.remove("bottom-nav-bar--static");
        setActive(activeId);
      }));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.remove("bottom-nav-bar--static")));
    }

    nav.appendChild(bar);
    return nav;
  }

  // The app's main menu, defined once so every page shows the same
  // destinations (pages live in pages/<name>/, so the hrefs are relative to that).
  const MAIN_ITEMS = [
    { id: "home", icon: "home", labelKey: "nav.home", href: "../home/home.html" },
    { id: "market", icon: "chart-line", labelKey: "nav.market", href: "../market/market.html" },
    { id: "assist", icon: "chat", labelKey: "nav.assist", href: "../assist/assist.html" },
    { id: "education", icon: "book", labelKey: "nav.education", href: "../education/education.html" },
  ];

  function renderMainNav(activeId) {
    return renderBottomNav({ items: MAIN_ITEMS, activeId });
  }

  return { renderBottomNav, renderMainNav, MAIN_ITEMS };
})();

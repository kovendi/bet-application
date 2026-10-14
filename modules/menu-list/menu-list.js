// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// A tappable list of menu rows: icon on the left, title + short description
// on the right. Rows are organized into groups, each with an optional
// uppercase label above it. Used for "more options" style menus (e.g. a page
// reached via a top-appbar overflow button) that link off to other screens
// or actions, and for settings lists whose rows end in an accessory (e.g. a
// toggle switch) instead of navigating anywhere.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/menu-list/menu-list.js"></script>
//   <script>
//     container.appendChild(window.menuListModule.renderMenuList([
//       {
//         title: 'Beállítások',
//         items: [
//           { icon: 'profile', title: 'Profil', description: '...', onSelect: () => {} },
//           // A `right` accessory (e.g. a toggle switch) makes the row a
//           // non-interactive container instead of a button, since a
//           // focusable control can't nest inside one.
//           { icon: 'bell', title: 'Esemény-emlékeztetők', right: someToggleElement },
//           // `tone: 'danger'` recolors the icon/title (e.g. a logout row).
//           { icon: 'logout', title: 'Kijelentkezés', tone: 'danger', onSelect: () => {} },
//         ],
//       },
//     ]));
//   </script>

window.menuListModule = (function () {
  function renderMenuItem({ icon, title, description, onSelect, disabled, right, tone } = {}) {
    // A `right` accessory is itself an interactive control (e.g. a toggle
    // switch), so the row can't be a <button> — nested interactive elements
    // aren't valid HTML.
    const item = document.createElement(right ? "div" : "button");
    if (!right) item.type = "button";
    item.className = "menu-list-item";
    if (tone) item.classList.add(`menu-list-item--tone-${tone}`);
    if (disabled) item.disabled = true;

    const iconWrap = document.createElement("div");
    iconWrap.className = "menu-list-item-icon";
    if (icon) iconWrap.appendChild(window.iconModule.renderIcon(icon));
    item.appendChild(iconWrap);

    const info = document.createElement("div");
    info.className = "menu-list-item-info";

    const titleEl = document.createElement("p");
    titleEl.className = "menu-list-item-title";
    titleEl.textContent = title;
    info.appendChild(titleEl);

    if (description) {
      const descriptionEl = document.createElement("p");
      descriptionEl.className = "menu-list-item-description";
      descriptionEl.textContent = description;
      info.appendChild(descriptionEl);
    }

    item.appendChild(info);

    if (right) {
      const rightSlot = document.createElement("div");
      rightSlot.className = "menu-list-item-right";
      rightSlot.appendChild(right);
      item.appendChild(rightSlot);
    }

    if (onSelect) item.addEventListener("click", onSelect);

    return item;
  }

  function renderMenuGroup({ title, items = [] } = {}) {
    const group = document.createElement("div");
    group.className = "menu-list-group";

    if (title) {
      const titleEl = document.createElement("p");
      titleEl.className = "menu-list-group-title";
      titleEl.textContent = title;
      group.appendChild(titleEl);
    }

    const list = document.createElement("div");
    list.className = "menu-list";
    items.forEach((item) => list.appendChild(renderMenuItem(item)));
    group.appendChild(list);

    return group;
  }

  function renderMenuList(groups = []) {
    const wrap = document.createElement("div");
    wrap.className = "menu-list-groups";
    groups.forEach((group) => wrap.appendChild(renderMenuGroup(group)));
    return wrap;
  }

  return { renderMenuItem, renderMenuGroup, renderMenuList };
})();

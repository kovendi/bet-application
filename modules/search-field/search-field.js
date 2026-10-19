// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Search box with a leading magnifier and a clear button. Results only list
// from `minChars` characters (TK_006): onSearch gets the query once it is long
// enough, and '' while it is shorter (i.e. "no active search, show the
// default list"). The label is visually hidden but present (every field needs
// a <label>).
//
// Requires modules/icon/icon.js and modules/i18n/i18n.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/search-field/search-field.js"></script>
//   <script>
//     container.appendChild(window.searchFieldModule.renderSearchField({
//       id: 'market-search',
//       label: 'Search',
//       placeholder: 'Name or ticker',
//       minChars: 2, // optional, default 2
//       onSearch: (query) => {...},
//     }));
//   </script>

window.searchFieldModule = (function () {
  function renderSearchField({ id, label, placeholder = "", minChars = 2, value = "", onSearch } = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "search-field";

    const labelEl = document.createElement("label");
    labelEl.className = "sr-only";
    labelEl.setAttribute("for", id);
    labelEl.textContent = label;

    const icon = window.iconModule.renderIcon("search");
    icon.classList.add("search-field-icon");

    const input = document.createElement("input");
    input.className = "search-field-input";
    input.id = id;
    input.type = "search";
    input.placeholder = placeholder;
    input.value = value;
    input.autocomplete = "off";
    input.enterKeyHint = "search";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "search-field-clear";
    clear.setAttribute("aria-label", window.i18n.t("search_field.clear"));
    clear.appendChild(window.iconModule.renderIcon("close"));
    clear.hidden = !value;

    function emit() {
      const query = input.value.trim();
      clear.hidden = !input.value;
      if (onSearch) onSearch(query.length >= minChars ? query : "");
    }

    input.addEventListener("input", emit);
    clear.addEventListener("click", () => {
      input.value = "";
      emit();
      input.focus();
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(icon);
    wrapper.appendChild(input);
    wrapper.appendChild(clear);
    return wrapper;
  }

  return { renderSearchField };
})();

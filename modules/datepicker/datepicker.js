// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Renders a labeled date field: clicking the field opens a popup calendar
// anchored below it; picking a day fills the field and closes the popup.
// Self-contained (own label/box styles) so it doesn't depend on the input
// module being loaded on the page.
//
// The popup is appended to document.body (not the field itself) and
// positioned with getBoundingClientRect(), so it always lands at the field's
// true on-screen position and stays clear of the phone frame's edges in the
// desktop mockup view.
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script src="../../modules/datepicker/datepicker.js"></script>
//   <script>
//     const field = window.datepickerModule.renderDatePicker({
//       id: 'search-date-from',
//       label: 'Dátumtól',
//       name: 'dateFrom',
//       value: '2026-03-12', // ISO yyyy-mm-dd, optional
//       maxDate: new Date(), // optional — days after it are disabled, and the
//                            // calendar can't be navigated past its month
//       minDate: new Date(), // optional — same, but for days before it
//     });
//     container.appendChild(field);
//     field.querySelector('.app-input').value; // current ISO value ('' if none)
//   </script>

window.datepickerModule = (function () {
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function parseISO(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function toISO(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function formatDisplay(date) {
    return `${date.getFullYear()}. ${pad2(date.getMonth() + 1)}. ${pad2(date.getDate())}.`;
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function isSameMonth(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function renderDatePicker({
    id,
    label,
    name,
    value = "",
    placeholder,
    required = false,
    maxDate = null,
    minDate = null,
  } = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "datepicker-group";

    const labelEl = document.createElement("label");
    labelEl.className = "datepicker-label";
    labelEl.setAttribute("for", id);
    labelEl.textContent = label;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "datepicker-trigger";
    trigger.id = id;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");

    const triggerText = document.createElement("span");
    triggerText.className = "datepicker-trigger-text";
    trigger.appendChild(triggerText);
    trigger.appendChild(window.iconModule.renderIcon("calendar"));

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.className = "app-input";
    hiddenInput.name = name || id;
    hiddenInput.required = required;

    wrapper.appendChild(labelEl);
    wrapper.appendChild(trigger);
    wrapper.appendChild(hiddenInput);

    let selectedDate = parseISO(value);
    let viewDate = selectedDate || new Date();
    let popup = null;

    function updateTriggerText() {
      if (selectedDate) {
        triggerText.textContent = formatDisplay(selectedDate);
        triggerText.classList.remove("is-placeholder");
      } else {
        triggerText.textContent =
          placeholder || window.i18n.t("datepicker.placeholder");
        triggerText.classList.add("is-placeholder");
      }
    }

    function setValue(date) {
      selectedDate = date;
      hiddenInput.value = date ? toISO(date) : "";
      updateTriggerText();
      hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function handleOutsideClick(e) {
      if (
        popup &&
        !popup.contains(e.target) &&
        !trigger.contains(e.target)
      ) {
        closePopup();
      }
    }

    function handleKeydown(e) {
      if (e.key === "Escape") {
        closePopup();
        trigger.focus();
      }
    }

    function closePopup() {
      if (!popup) return;
      document.removeEventListener("mousedown", handleOutsideClick, true);
      document.removeEventListener("keydown", handleKeydown, true);
      window.removeEventListener("resize", closePopup);
      window.removeEventListener("scroll", closePopup, true);
      popup.remove();
      popup = null;
      trigger.setAttribute("aria-expanded", "false");
    }

    function positionPopup() {
      const margin = 8;
      const boundsEl = trigger.closest(".iphone-screen");
      const bounds = boundsEl
        ? boundsEl.getBoundingClientRect()
        : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      let left = Math.min(triggerRect.left, bounds.right - popupRect.width - margin);
      left = Math.max(left, bounds.left + margin);

      let top = triggerRect.bottom + 6;
      if (top + popupRect.height > bounds.bottom - margin) {
        const above = triggerRect.top - popupRect.height - 6;
        if (above >= bounds.top) top = above;
      }

      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    }

    function buildPopup() {
      const el = document.createElement("div");
      el.className = "datepicker-popup";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", label);

      const header = document.createElement("div");
      header.className = "datepicker-popup-header";

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "datepicker-nav-button";
      prevBtn.setAttribute("aria-label", window.i18n.t("datepicker.prev_month"));
      prevBtn.appendChild(window.iconModule.renderIcon("back"));
      prevBtn.addEventListener("click", () => {
        if (prevBtn.disabled) return;
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        renderMonth();
      });

      const monthLabel = document.createElement("span");
      monthLabel.className = "datepicker-month-label";

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "datepicker-nav-button next";
      nextBtn.setAttribute("aria-label", window.i18n.t("datepicker.next_month"));
      nextBtn.appendChild(window.iconModule.renderIcon("back"));
      nextBtn.addEventListener("click", () => {
        if (nextBtn.disabled) return;
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        renderMonth();
      });

      header.appendChild(prevBtn);
      header.appendChild(monthLabel);
      header.appendChild(nextBtn);

      const weekdays = document.createElement("div");
      weekdays.className = "datepicker-weekdays";
      [1, 2, 3, 4, 5, 6, 0].forEach((dayIndex) => {
        const cell = document.createElement("span");
        cell.textContent = window.i18n.t(`date.weekday_short_${dayIndex}`);
        weekdays.appendChild(cell);
      });

      const grid = document.createElement("div");
      grid.className = "datepicker-grid";

      el.appendChild(header);
      el.appendChild(weekdays);
      el.appendChild(grid);

      el._monthLabel = monthLabel;
      el._grid = grid;
      el._nextBtn = nextBtn;
      el._prevBtn = prevBtn;
      return el;
    }

    function renderMonth() {
      popup._monthLabel.textContent =
        `${viewDate.getFullYear()}. ${window.i18n.t(`date.month_${viewDate.getMonth() + 1}`)}`;
      popup._nextBtn.disabled = Boolean(maxDate) && isSameMonth(viewDate, maxDate);
      popup._prevBtn.disabled = Boolean(minDate) && isSameMonth(viewDate, minDate);

      const grid = popup._grid;
      grid.innerHTML = "";

      const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const daysInMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0,
      ).getDate();
      const leadingEmpty = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
      const today = new Date();

      for (let i = 0; i < leadingEmpty; i++) {
        grid.appendChild(document.createElement("span")).className =
          "datepicker-day-empty";
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const dayBtn = document.createElement("button");
        dayBtn.type = "button";
        dayBtn.className = "datepicker-day";
        dayBtn.textContent = String(day);

        if (isSameDay(dayDate, today)) dayBtn.classList.add("is-today");
        if (selectedDate && isSameDay(dayDate, selectedDate)) {
          dayBtn.classList.add("is-selected");
        }
        if (maxDate && dayDate > maxDate) dayBtn.disabled = true;
        if (minDate && dayDate < minDate) dayBtn.disabled = true;

        dayBtn.addEventListener("click", () => {
          if (dayBtn.disabled) return;
          setValue(dayDate);
          closePopup();
        });

        grid.appendChild(dayBtn);
      }

      positionPopup();
    }

    function openPopup() {
      if (popup) return;
      viewDate = selectedDate ? new Date(selectedDate) : new Date();
      popup = buildPopup();
      document.body.appendChild(popup);
      renderMonth();
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("mousedown", handleOutsideClick, true);
      document.addEventListener("keydown", handleKeydown, true);
      window.addEventListener("resize", closePopup);
      window.addEventListener("scroll", closePopup, true);
    }

    trigger.addEventListener("click", () => {
      if (popup) {
        closePopup();
      } else {
        openPopup();
      }
    });

    hiddenInput.value = selectedDate ? toISO(selectedDate) : "";
    updateTriggerText();

    return wrapper;
  }

  return { renderDatePicker };
})();

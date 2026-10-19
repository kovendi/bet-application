// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// A labeled on/off switch row: label (+ optional description) on the left,
// a toggle switch on the right. Used for standalone settings rows.
// `renderSwitch` renders just the switch control, for embedding as a
// trailing accessory in a row that already has its own label/description
// (e.g. per-module push-notification rows in a menu-list, like on the
// Profile page).
//
// Usage in a page:
//   <script src="../../modules/toggle/toggle.js"></script>
//   <script>
//     container.appendChild(window.toggleModule.renderToggle({
//       id: 'profile-notif-events',
//       label: 'Event reminders',
//       description: 'Push notification about upcoming events',
//       checked: true,
//       onChange: (checked) => {...},
//     }));
//
//     container.appendChild(window.toggleModule.renderSwitch({
//       id: 'profile-notif-events',
//       checked: true,
//       onChange: (checked) => {...},
//     }));
//   </script>

window.toggleModule = (function () {
  let autoId = 0;

  // Just the switch control (input + track), with no label/description of
  // its own — for embedding as a trailing accessory in a row that already
  // renders its own title/description (e.g. a menu-list item).
  function renderSwitch({ id, checked = false, onChange } = {}) {
    const toggleId = id || `toggle-${++autoId}`;

    const switchLabel = document.createElement("label");
    switchLabel.className = "toggle-switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = toggleId;
    input.className = "toggle-switch-input";
    input.checked = checked;
    if (onChange) {
      input.addEventListener("change", () => onChange(input.checked));
    }

    const track = document.createElement("span");
    track.className = "toggle-switch-track";
    track.setAttribute("aria-hidden", "true");

    switchLabel.appendChild(input);
    switchLabel.appendChild(track);
    return switchLabel;
  }

  function renderToggle({ id, label, description, checked = false, onChange } = {}) {
    const toggleId = id || `toggle-${++autoId}`;

    const row = document.createElement("div");
    row.className = "toggle-row";

    const info = document.createElement("div");
    info.className = "toggle-row-info";

    const labelEl = document.createElement("label");
    labelEl.className = "toggle-row-label";
    labelEl.setAttribute("for", toggleId);
    labelEl.textContent = label;
    info.appendChild(labelEl);

    if (description) {
      const descriptionEl = document.createElement("p");
      descriptionEl.className = "toggle-row-description";
      descriptionEl.textContent = description;
      info.appendChild(descriptionEl);
    }

    row.appendChild(info);
    row.appendChild(renderSwitch({ id: toggleId, checked, onChange }));
    return row;
  }

  return { renderToggle, renderSwitch };
})();

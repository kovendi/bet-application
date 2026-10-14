// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Labeled progress bar in two layouts:
//   'inline'  — label, thin track and value share one row (e.g. a budget
//               progress row: "Címke [====] 142 000").
//   'stacked' — a header row (label + value) with a full-width track below
//               (e.g. a savings goal).
//
// Usage in a page:
//   <script src="../../modules/progress-bar/progress-bar.js"></script>
//   <script>
//     container.appendChild(window.progressBarModule.renderProgressBar({
//       label: 'Címke',
//       valueText: '142 000',
//       percent: 62,
//       layout: 'inline', // 'inline' | 'stacked'
//       color: 'primary', // 'primary' | 'accent'
//     }));
//   </script>

window.progressBarModule = (function () {
  function renderTrack(percent, color) {
    const track = document.createElement("div");
    track.className = `progress-bar-track progress-bar-track--${color}`;

    const fill = document.createElement("div");
    fill.className = "progress-bar-fill";
    fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    track.appendChild(fill);

    return track;
  }

  function renderProgressBar({
    label,
    valueText,
    percent = 0,
    layout = "inline",
    color = "primary",
  } = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = `progress-bar progress-bar--${layout}`;

    if (layout === "stacked") {
      const header = document.createElement("div");
      header.className = "progress-bar-header";

      const labelEl = document.createElement("span");
      labelEl.className = "progress-bar-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "progress-bar-value";
      valueEl.textContent = valueText;

      header.appendChild(labelEl);
      header.appendChild(valueEl);
      wrapper.appendChild(header);
      wrapper.appendChild(renderTrack(percent, color));
      return wrapper;
    }

    const labelEl = document.createElement("span");
    labelEl.className = "progress-bar-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "progress-bar-value";
    valueEl.textContent = valueText;

    wrapper.appendChild(labelEl);
    wrapper.appendChild(renderTrack(percent, color));
    wrapper.appendChild(valueEl);
    return wrapper;
  }

  return { renderProgressBar };
})();

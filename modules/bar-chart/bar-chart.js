// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Plain CSS/HTML column chart: one value per period, one series, no stacking
// or grouping. Used for the yearly financials (TA_0011) and the 10 year
// dividend (TA_0012). It is NOT a TradingView chart (TradingView cannot draw
// non-time-series bars, see CLAUDE.md), so it has no axis, crosshair or zoom.
// Handles negative values (bar below the zero line) and missing values
// (`null`: an empty slot with a quiet "–", e.g. no dividend paid that year).
// The last period is highlighted. Every column prints its value, so the sign
// and the number carry the meaning, not only the color.
//
// Requires modules/i18n/i18n.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/bar-chart/bar-chart.js"></script>
//   <script>
//     container.appendChild(window.barChartModule.renderBarChart({
//       title: 'Revenue (HUF bn)',
//       labels: [2021, 2022, 2023, 2024, 2025],
//       values: [120.4, 131.0, null, -4.2, 150.8],
//       formatValue: (value) => String(value), // optional
//     }));
//   </script>

window.barChartModule = (function () {
  function renderColumn({ label, value, index, scale, zero, formatValue, isLast }) {
    const column = document.createElement("div");
    column.className = "bar-chart-column";
    if (isLast) column.classList.add("bar-chart-column--last");
    column.style.setProperty("--bar-index", index);

    const valueEl = document.createElement("span");
    valueEl.className = "bar-chart-value";
    const track = document.createElement("div");
    track.className = "bar-chart-track";

    if (value === null || value === undefined) {
      valueEl.classList.add("bar-chart-value--missing");
      valueEl.textContent = "–";
      valueEl.setAttribute("aria-label", window.i18n.t("product.no_data"));
    } else {
      valueEl.textContent = formatValue(value);
      const size = Math.max(Math.abs(value) * scale, 1.5);
      const bar = document.createElement("span");
      bar.className = "bar-chart-bar";
      if (value < 0) bar.classList.add("bar-chart-bar--negative");
      bar.style.setProperty("--bar-size", `${size}%`);
      bar.style.setProperty("--bar-bottom", value < 0 ? `${zero - size}%` : `${zero}%`);
      track.appendChild(bar);
    }

    const labelEl = document.createElement("span");
    labelEl.className = "bar-chart-label";
    labelEl.textContent = label;
    column.append(valueEl, track, labelEl);
    return column;
  }

  function renderBarChart({ title, labels, values, formatValue = (value) => String(value) } = {}) {
    const root = document.createElement("figure");
    root.className = "bar-chart";

    if (title) {
      const caption = document.createElement("figcaption");
      caption.className = "bar-chart-title";
      caption.textContent = title;
      root.appendChild(caption);
    }

    const present = values.filter((value) => value !== null && value !== undefined);
    const maxPositive = Math.max(0, ...present);
    const maxNegative = Math.abs(Math.min(0, ...present));
    const total = maxPositive + maxNegative || 1;
    // Share of the track height above the zero line, and percent per unit.
    const zero = (maxNegative / total) * 100;
    const scale = 100 / total;

    const plot = document.createElement("div");
    plot.className = "bar-chart-plot";
    plot.setAttribute("role", "img");
    plot.setAttribute("aria-label", `${title || ""}: ${labels.map((label, i) => `${label}: ${values[i] === null ? window.i18n.t("product.no_data") : formatValue(values[i])}`).join(", ")}`);
    labels.forEach((label, index) => {
      plot.appendChild(
        renderColumn({ label, value: values[index], index, scale, zero, formatValue, isLast: index === labels.length - 1 }),
      );
    });
    root.appendChild(plot);
    return root;
  }

  return { renderBarChart };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Mini price curve (no axes, no interaction) for list rows and widgets.
// Colored by direction: --color-positive when the last value is above the
// first, --color-negative when below. The direction is never the only signal —
// the row it sits in always shows the signed change (NFK_003).
//
// Usage in a page:
//   <script src="../../modules/sparkline/sparkline.js"></script>
//   <script>
//     el.appendChild(window.sparklineModule.renderSparkline({
//       values: [10, 12, 11, 14],
//       width: 64, // optional, px (default 64)
//       height: 24, // optional, px (default 24)
//     }));
//   </script>

window.sparklineModule = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function renderSparkline({ values = [], width = 64, height = 24 } = {}) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("sparkline");

    if (values.length < 2) return svg;

    const direction = values[values.length - 1] >= values[0] ? "up" : "down";
    svg.classList.add(`sparkline--${direction}`);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = 2;
    const points = values
      .map((value, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = pad + (1 - (value - min) / range) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const line = document.createElementNS(SVG_NS, "polyline");
    line.setAttribute("points", points);
    line.setAttribute("class", "sparkline-line");
    svg.appendChild(line);
    return svg;
  }

  return { renderSparkline };
})();

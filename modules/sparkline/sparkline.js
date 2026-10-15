// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Mini price curve (no axes, no interaction) for list rows and widgets.
// Colored by direction: --color-positive when the last value is above the
// first, --color-negative when below, --color-text-secondary when equal. The
// direction is never the only signal — the row it sits in always shows the
// signed change (NFK_003).
//
// Usage in a page:
//   <script src="../../modules/sparkline/sparkline.js"></script>
//   <script>
//     el.appendChild(window.sparklineModule.renderSparkline({
//       values: [10, 12, 11, 14],
//       width: 64, // optional, px (default 64)
//       height: 24, // optional, px (default 24)
//       area: false, // optional: soft gradient fill under the line
//       animate: false, // optional: the line draws itself in on arrival
//       endDot: false, // optional: pulsing dot on the last value ("live")
//     }));
//   </script>

window.sparklineModule = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  let gradientCount = 0;

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  // Vertical fade under the line, colored by the direction class (currentColor).
  function renderArea(points, width, height) {
    gradientCount += 1;
    const id = `sparkline-fill-${gradientCount}`;
    const defs = svgEl("defs", {});
    const gradient = svgEl("linearGradient", { id, x1: 0, x2: 0, y1: 0, y2: 1 });
    gradient.append(
      svgEl("stop", { offset: "0%", class: "sparkline-fill-top" }),
      svgEl("stop", { offset: "100%", class: "sparkline-fill-bottom" }),
    );
    defs.appendChild(gradient);
    const area = svgEl("polygon", {
      points: `0,${height} ${points.join(" ")} ${width},${height}`,
      class: "sparkline-area",
      fill: `url(#${id})`,
    });
    return [defs, area];
  }

  function renderEndDot([x, y]) {
    const group = svgEl("g", { class: "sparkline-end" });
    group.append(
      svgEl("circle", { cx: x, cy: y, r: 6, class: "sparkline-end-halo" }),
      svgEl("circle", { cx: x, cy: y, r: 3, class: "sparkline-end-dot" }),
    );
    return group;
  }

  function renderSparkline({ values = [], width = 64, height = 24, area = false, animate = false, endDot = false } = {}) {
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, width, height, "aria-hidden": "true" });
    svg.classList.add("sparkline");

    if (values.length < 2) return svg;

    const first = values[0];
    const last = values[values.length - 1];
    const direction = last > first ? "up" : last < first ? "down" : "flat";
    svg.classList.add(`sparkline--${direction}`);
    if (animate) svg.classList.add("sparkline--animate");

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    // Leave room for the end dot's halo so it is never clipped.
    const pad = endDot ? 7 : 2;
    const coords = values.map((value, i) => [
      (i / (values.length - 1)) * (width - (endDot ? pad : 0)),
      pad + (1 - (value - min) / range) * (height - pad * 2),
    ]);
    const points = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);

    if (area) svg.append(...renderArea(points, coords[coords.length - 1][0], height));
    svg.appendChild(svgEl("polyline", { points: points.join(" "), class: "sparkline-line" }));
    if (endDot) svg.appendChild(renderEndDot(coords[coords.length - 1]));
    return svg;
  }

  return { renderSparkline };
})();

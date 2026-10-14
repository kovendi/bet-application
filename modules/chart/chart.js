// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Price chart in the style of TradingView Lightweight Charts: a line (with a
// soft area fill) or candlesticks, a price axis on the right, a time axis at
// the bottom, a scrubbable crosshair and a time-range selector. Drawn as inline
// SVG at the container's real pixel width (redrawn on resize). Colors come
// from the --chart-* tokens (brand chart set) and --color-positive/negative for
// candles. The readout above the plot shows the change over the selected
// period, and the value + time under the finger/cursor while scrubbing.
//
// TradingView constraint (see CLAUDE.md "Charts / TradingView"): only add
// features Lightweight Charts supports (line/area/candle/bar/baseline/histogram
// series, crosshair, time ranges, markers). Nothing else belongs in this module.
//
// Data comes from window.storage.getPriceSeries(), so a chart is created from
// an instrument. All prices are delayed except indexes: show the delayed
// disclaimer (banner module) next to it.
//
// Requires modules/icon, modules/chips, modules/money, modules/storage and
// modules/i18n to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/chart/chart.js"></script>
//   <script>
//     container.appendChild(window.chartModule.renderChart({
//       instrument: window.storage.getInstrument('OTP'),
//       range: '1m', // optional: 1d | 1w | 1m | 3m | 1y | 5y | max
//       type: 'line', // optional: 'line' | 'candle'
//       height: 200, // optional plot height in px
//     }));
//   </script>

window.chartModule = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const RANGES = ["1d", "1w", "1m", "3m", "1y", "5y", "max"];
  const PAD = { right: 52, bottom: 20, top: 8 };

  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach((key) => el.setAttribute(key, attrs[key]));
    return el;
  }

  function renderChart({ instrument, range = "1m", type = "line", height = 200 } = {}) {
    const t = window.i18n.t;
    const money = window.moneyModule;

    const root = document.createElement("div");
    root.className = "chart";

    const readout = document.createElement("div");
    readout.className = "chart-readout";
    const readoutMain = document.createElement("span");
    readoutMain.className = "chart-readout-main";
    const readoutSub = document.createElement("span");
    readoutSub.className = "chart-readout-sub";
    readout.appendChild(readoutMain);
    readout.appendChild(readoutSub);

    const plot = document.createElement("div");
    plot.className = "chart-plot";
    plot.style.height = `${height}px`;

    const controls = document.createElement("div");
    controls.className = "chart-controls";

    root.appendChild(readout);
    root.appendChild(plot);
    root.appendChild(controls);

    let candles = [];
    let layout = null;

    const decimals = instrument.unit === "HUF" || instrument.price >= 1000 ? 0 : 2;
    const fmt = (value) => money.formatNumber(value, decimals);

    function formatTime(ts, withTime) {
      const d = new Date(ts);
      if (withTime) {
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
      const month = t(`date.month_${d.getMonth() + 1}`).slice(0, 3);
      if (range === "5y" || range === "max" || range === "1y") return `${d.getFullYear()}. ${month}.`;
      return `${month}. ${d.getDate()}.`;
    }

    function showPeriodChange() {
      if (!candles.length) return;
      const first = candles[0].o;
      const last = candles[candles.length - 1].c;
      const pct = ((last - first) / first) * 100;
      const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
      readoutMain.className = `chart-readout-main chart-readout-main--${dir}`;
      readoutMain.textContent = money.formatPercent(pct);
      readoutSub.textContent = t(`chart.period_${range}`);
    }

    function showPoint(index) {
      const c = candles[index];
      readoutMain.className = "chart-readout-main";
      readoutMain.textContent = money.formatPrice(c.c, instrument.unit);
      readoutSub.textContent = formatTime(c.t, range === "1d");
    }

    function draw() {
      const width = plot.clientWidth;
      if (!width || !candles.length) return;
      plot.textContent = "";

      const innerW = width - PAD.right;
      const innerH = height - PAD.top - PAD.bottom;
      const lows = candles.map((c) => c.l);
      const highs = candles.map((c) => c.h);
      let min = Math.min(...lows);
      let max = Math.max(...highs);
      const margin = (max - min || max * 0.01) * 0.08;
      min -= margin;
      max += margin;
      const x = (i) => ((i + 0.5) / candles.length) * innerW;
      const y = (v) => PAD.top + (1 - (v - min) / (max - min)) * innerH;
      layout = { x, y, innerW, width };

      const svg = svgEl("svg", { width, height, viewBox: `0 0 ${width} ${height}`, role: "img", class: "chart-svg" });
      svg.setAttribute(
        "aria-label",
        `${instrument.ticker} ${t(`chart.period_${range}`)}: ${money.formatPrice(candles[0].o, instrument.unit)} → ${money.formatPrice(candles[candles.length - 1].c, instrument.unit)}`,
      );

      // grid + price axis
      for (let i = 0; i < 4; i++) {
        const value = min + ((max - min) * i) / 3;
        const gy = y(value);
        svg.appendChild(svgEl("line", { x1: 0, x2: innerW, y1: gy, y2: gy, class: "chart-grid" }));
        const label = svgEl("text", { x: width - 2, y: gy - 3, "text-anchor": "end", class: "chart-axis" });
        label.textContent = fmt(value);
        svg.appendChild(label);
      }
      // time axis
      [0, 1 / 3, 2 / 3, 1].forEach((f, i) => {
        const index = Math.min(candles.length - 1, Math.round(f * (candles.length - 1)));
        const anchor = i === 0 ? "start" : i === 3 ? "end" : "middle";
        const label = svgEl("text", { x: i === 3 ? innerW : x(index), y: height - 4, "text-anchor": anchor, class: "chart-axis" });
        label.textContent = formatTime(candles[index].t, range === "1d");
        svg.appendChild(label);
      });

      if (type === "candle") {
        const bodyW = Math.max(1.5, (innerW / candles.length) * 0.62);
        candles.forEach((c, i) => {
          const up = c.c >= c.o;
          const cls = up ? "chart-candle--up" : "chart-candle--down";
          svg.appendChild(svgEl("line", { x1: x(i), x2: x(i), y1: y(c.h), y2: y(c.l), class: `chart-wick ${cls}` }));
          svg.appendChild(svgEl("rect", {
            x: x(i) - bodyW / 2,
            y: Math.min(y(c.o), y(c.c)),
            width: bodyW,
            height: Math.max(1, Math.abs(y(c.o) - y(c.c))),
            class: `chart-body ${cls}`,
          }));
        });
      } else {
        const points = candles.map((c, i) => `${x(i).toFixed(1)},${y(c.c).toFixed(1)}`);
        const gradId = `chart-fill-${Math.random().toString(36).slice(2, 8)}`;
        const defs = svgEl("defs");
        const grad = svgEl("linearGradient", { id: gradId, x1: 0, x2: 0, y1: 0, y2: 1 });
        grad.appendChild(svgEl("stop", { offset: "0%", class: "chart-fill-top" }));
        grad.appendChild(svgEl("stop", { offset: "100%", class: "chart-fill-bottom" }));
        defs.appendChild(grad);
        svg.appendChild(defs);
        svg.appendChild(svgEl("polygon", {
          points: `${x(0)},${PAD.top + innerH} ${points.join(" ")} ${x(candles.length - 1)},${PAD.top + innerH}`,
          fill: `url(#${gradId})`,
        }));
        svg.appendChild(svgEl("polyline", { points: points.join(" "), class: "chart-line" }));
      }

      // crosshair (hidden until scrubbing)
      const crossV = svgEl("line", { class: "chart-cross", y1: PAD.top, y2: PAD.top + innerH, visibility: "hidden" });
      const crossDot = svgEl("circle", { r: 4, class: "chart-dot", visibility: "hidden" });
      svg.appendChild(crossV);
      svg.appendChild(crossDot);

      function scrub(event) {
        const rect = svg.getBoundingClientRect();
        const px = Math.min(Math.max(event.clientX - rect.left, 0), innerW);
        const index = Math.min(candles.length - 1, Math.max(0, Math.round((px / innerW) * candles.length - 0.5)));
        crossV.setAttribute("x1", x(index));
        crossV.setAttribute("x2", x(index));
        crossDot.setAttribute("cx", x(index));
        crossDot.setAttribute("cy", y(candles[index].c));
        crossV.setAttribute("visibility", "visible");
        crossDot.setAttribute("visibility", type === "line" ? "visible" : "hidden");
        showPoint(index);
      }
      function endScrub() {
        crossV.setAttribute("visibility", "hidden");
        crossDot.setAttribute("visibility", "hidden");
        showPeriodChange();
      }
      svg.addEventListener("pointermove", scrub);
      svg.addEventListener("pointerdown", scrub);
      svg.addEventListener("pointerleave", endScrub);
      svg.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") endScrub(); });
      svg.addEventListener("pointercancel", endScrub);
      plot.appendChild(svg);
    }

    function load() {
      candles = window.storage.getPriceSeries(instrument.ticker, range);
      showPeriodChange();
      draw();
    }

    controls.appendChild(
      window.chipsModule.renderChips({
        items: RANGES.map((key) => ({ id: key, label: t(`chart.range_${key}`) })),
        variant: "segmented",
        activeId: range,
        ariaLabel: t("chart.range_label"),
        onChange: (value) => {
          range = value;
          load();
        },
      }),
    );
    controls.appendChild(
      window.chipsModule.renderChips({
        items: [
          { id: "line", icon: "chart-line", ariaLabel: t("chart.type_line") },
          { id: "candle", icon: "chart-candle", ariaLabel: t("chart.type_candle") },
        ],
        variant: "segmented",
        activeId: type,
        ariaLabel: t("chart.type_label"),
        onChange: (value) => {
          type = value;
          draw();
        },
      }),
    );

    // The container has no width until it is attached, so draw once it has one.
    if (typeof ResizeObserver !== "undefined") {
      let lastWidth = 0;
      new ResizeObserver(() => {
        if (plot.clientWidth !== lastWidth) {
          lastWidth = plot.clientWidth;
          draw();
        }
      }).observe(plot);
    }
    load();
    return root;
  }

  return { RANGES, renderChart };
})();

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
// Scrolling (like Lightweight Charts' handleScroll): the plot is a window onto a
// longer history. Drag left/right (mouse or finger) to go back in time, with
// momentum on release; a horizontal wheel/trackpad swipe and the arrow keys
// pan too. Vertical drags on touch still scroll the page. The crosshair follows
// the mouse on hover and a pressed finger that does not move sideways. A button
// returns to the latest bar (scrollToRealTime). The price axis re-fits to the
// visible bars (autoScale).
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
//       markers: [{ t: timestampMs, type: 'dividend' | 'split' | 'reverse_split' }], // optional (TA_001)
//     }));
//   </script>

window.chartModule = (function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const RANGES = ["1d", "1w", "1m", "3m", "1y", "5y", "max"];
  const PAD = { right: 52, bottom: 20, top: 8 };
  const MARKER_RADIUS = 8;
  const MARKER_OFFSET = 14;
  const HISTORY_FACTOR = 3; // extra history, in multiples of the visible window
  const PAN_THRESHOLD = 6; // px before a press counts as a drag
  const FLING_FRICTION = 0.94; // velocity kept per 16 ms frame
  const FLING_MIN = 0.0004; // bars per ms below which the momentum stops

  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach((key) => el.setAttribute(key, attrs[key]));
    return el;
  }

  function renderChart({ instrument, range = "1m", type = "line", height = 200, markers = [] } = {}) {
    const t = window.i18n.t;
    const money = window.moneyModule;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = document.createElement("div");
    root.className = "chart";

    const readout = document.createElement("div");
    readout.className = "chart-readout";
    const readoutMain = document.createElement("span");
    readoutMain.className = "chart-readout-main";
    const readoutSub = document.createElement("span");
    readoutSub.className = "chart-readout-sub";
    const hint = document.createElement("span");
    hint.className = "chart-hint";
    hint.appendChild(window.iconModule.renderIcon("chevron-right"));
    hint.appendChild(document.createTextNode(t("chart.drag_hint")));
    hint.appendChild(window.iconModule.renderIcon("chevron-right"));
    const latestButton = document.createElement("button");
    latestButton.type = "button";
    latestButton.className = "chart-latest";
    latestButton.hidden = true;
    latestButton.appendChild(document.createTextNode(t("chart.jump_latest")));
    latestButton.appendChild(window.iconModule.renderIcon("chevron-right"));
    readout.append(readoutMain, readoutSub, hint, latestButton);

    const plot = document.createElement("div");
    plot.className = "chart-plot";
    plot.style.height = `${height}px`;
    plot.tabIndex = 0;
    plot.setAttribute("role", "group");
    plot.setAttribute("aria-label", t("chart.scroll_label"));

    const controls = document.createElement("div");
    controls.className = "chart-controls";

    root.appendChild(readout);
    root.appendChild(plot);
    root.appendChild(controls);

    let candles = [];
    let visible = 0; // bars shown at once (the range's own candle count)
    let offset = 0; // index (fractional while dragging) of the first visible bar
    let layout = null;
    let markerPoints = [];
    let cross = null; // crosshair elements of the current svg
    let hasPanned = false;
    let flingFrame = 0;

    const decimals = instrument.unit === "HUF" || instrument.price >= 1000 ? 0 : 2;
    const fmt = (value) => money.formatNumber(value, decimals);
    const maxOffset = () => Math.max(0, candles.length - visible);
    const atLatest = () => offset >= maxOffset() - 0.01;
    const barWidth = () => (layout ? layout.innerW / visible : 1);

    function formatTime(ts, withTime) {
      const d = new Date(ts);
      if (withTime) {
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      }
      const month = t(`date.month_${d.getMonth() + 1}`).slice(0, 3);
      if (range === "5y" || range === "max" || range === "1y") return `${d.getFullYear()}. ${month}.`;
      return `${month}. ${d.getDate()}.`;
    }

    // First and last bar that are at least partly inside the plot.
    function visibleSlice() {
      const from = Math.max(0, Math.floor(offset));
      const to = Math.min(candles.length - 1, Math.ceil(offset + visible) - 1);
      return { from, to, bars: candles.slice(from, to + 1) };
    }

    // Change over what is on screen; at the latest bar it keeps the period
    // label, once scrolled back it names the dates instead.
    function showPeriodChange() {
      const { bars } = visibleSlice();
      if (!bars.length) return;
      const first = bars[0].o;
      const last = bars[bars.length - 1].c;
      const pct = ((last - first) / first) * 100;
      const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
      readoutMain.className = `chart-readout-main chart-readout-main--${dir}`;
      readoutMain.textContent = money.formatPercent(pct);
      const intraday = range === "1d";
      readoutSub.textContent = atLatest()
        ? t(`chart.period_${range}`)
        : `${formatTime(bars[0].t, intraday)} – ${formatTime(bars[bars.length - 1].t, intraday)}`;
    }

    function showPoint(index) {
      const c = candles[index];
      readoutMain.className = "chart-readout-main";
      readoutMain.textContent = money.formatPrice(c.c, instrument.unit);
      const marked = markerPoints.find((point) => point.index === index);
      const time = formatTime(c.t, range === "1d");
      readoutSub.textContent = marked ? `${time} · ${marked.label}` : time;
    }

    function updateAffordances() {
      const scrollable = maxOffset() > 0;
      hint.hidden = hasPanned || !scrollable;
      latestButton.hidden = atLatest();
      plot.classList.toggle("chart-plot--scrollable", scrollable);
    }

    function draw({ reveal = true } = {}) {
      const width = plot.clientWidth;
      if (!width || !candles.length) return;
      plot.textContent = "";

      const innerW = width - PAD.right;
      const innerH = height - PAD.top - PAD.bottom;
      const { from, to, bars } = visibleSlice();
      let min = Math.min(...bars.map((c) => c.l));
      let max = Math.max(...bars.map((c) => c.h));
      const margin = (max - min || max * 0.01) * 0.08;
      min -= margin;
      max += margin;
      const x = (i) => ((i - offset + 0.5) / visible) * innerW;
      const y = (v) => PAD.top + (1 - (v - min) / (max - min)) * innerH;
      layout = { x, y, innerW, width };

      const svg = svgEl("svg", {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        class: reveal ? "chart-svg chart-svg--reveal" : "chart-svg",
      });
      svg.setAttribute(
        "aria-label",
        `${instrument.ticker} ${formatTime(bars[0].t, range === "1d")} – ${formatTime(bars[bars.length - 1].t, range === "1d")}: ${money.formatPrice(bars[0].o, instrument.unit)} → ${money.formatPrice(bars[bars.length - 1].c, instrument.unit)}`,
      );

      // bars scrolling past the edges are clipped to the plot (not the price axis)
      const clipId = `chart-clip-${Math.random().toString(36).slice(2, 8)}`;
      const defs = svgEl("defs");
      const clip = svgEl("clipPath", { id: clipId });
      clip.appendChild(svgEl("rect", { x: 0, y: 0, width: innerW, height }));
      defs.appendChild(clip);
      svg.appendChild(defs);

      // grid + price axis
      for (let i = 0; i < 4; i++) {
        const value = min + ((max - min) * i) / 3;
        const gy = y(value);
        svg.appendChild(svgEl("line", { x1: 0, x2: innerW, y1: gy, y2: gy, class: "chart-grid" }));
        const label = svgEl("text", { x: width - 2, y: gy - 3, "text-anchor": "end", class: "chart-axis" });
        label.textContent = fmt(value);
        svg.appendChild(label);
      }
      // time axis: labels stay on their bars while scrolling, counted back from the latest one
      const stride = Math.max(1, Math.round(visible / 3));
      for (let i = to; i >= from; i--) {
        if ((candles.length - 1 - i) % stride !== 0) continue;
        const lx = x(i);
        if (lx < 20 || lx > innerW - 20) continue;
        const label = svgEl("text", { x: lx, y: height - 4, "text-anchor": "middle", class: "chart-axis" });
        label.textContent = formatTime(candles[i].t, range === "1d");
        svg.appendChild(label);
      }

      const series = svgEl("g", { "clip-path": `url(#${clipId})` });
      if (type === "candle") {
        const bodyW = Math.max(1.5, (innerW / visible) * 0.62);
        for (let i = from; i <= to; i++) {
          const c = candles[i];
          const up = c.c >= c.o;
          const cls = up ? "chart-candle--up" : "chart-candle--down";
          series.appendChild(svgEl("line", { x1: x(i), x2: x(i), y1: y(c.h), y2: y(c.l), class: `chart-wick ${cls}` }));
          series.appendChild(svgEl("rect", {
            x: x(i) - bodyW / 2,
            y: Math.min(y(c.o), y(c.c)),
            width: bodyW,
            height: Math.max(1, Math.abs(y(c.o) - y(c.c))),
            class: `chart-body ${cls}`,
          }));
        }
      } else {
        const points = bars.map((c, k) => `${x(from + k).toFixed(1)},${y(c.c).toFixed(1)}`);
        const gradId = `chart-fill-${Math.random().toString(36).slice(2, 8)}`;
        const grad = svgEl("linearGradient", { id: gradId, x1: 0, x2: 0, y1: 0, y2: 1 });
        grad.appendChild(svgEl("stop", { offset: "0%", class: "chart-fill-top" }));
        grad.appendChild(svgEl("stop", { offset: "100%", class: "chart-fill-bottom" }));
        defs.appendChild(grad);
        series.appendChild(svgEl("polygon", {
          points: `${x(from)},${PAD.top + innerH} ${points.join(" ")} ${x(to)},${PAD.top + innerH}`,
          fill: `url(#${gradId})`,
        }));
        series.appendChild(svgEl("polyline", { points: points.join(" "), class: "chart-line" }));
      }
      svg.appendChild(series);

      // split / dividend markers below the bars of their candle (TradingView
      // markers: position belowBar, shape circle with a one letter text)
      markerPoints = [];
      markers.forEach((marker) => {
        if (marker.t < candles[0].t || marker.t > candles[candles.length - 1].t) return;
        let index = 0;
        candles.forEach((candle, i) => {
          if (Math.abs(candle.t - marker.t) < Math.abs(candles[index].t - marker.t)) index = i;
        });
        if (index < from || index > to) return;
        const cx = x(index);
        if (cx < MARKER_RADIUS || cx > innerW - MARKER_RADIUS) return;
        const cy = Math.min(y(candles[index].l) + MARKER_OFFSET, PAD.top + innerH - MARKER_RADIUS);
        const group = svgEl("g", { class: `chart-marker chart-marker--${marker.type}` });
        group.appendChild(svgEl("circle", { cx, cy, r: MARKER_RADIUS, class: "chart-marker-dot" }));
        const letter = svgEl("text", { x: cx, y: cy + 3, "text-anchor": "middle", class: "chart-marker-letter" });
        letter.textContent = t(`chart.marker_${marker.type}_short`);
        group.appendChild(letter);
        svg.appendChild(group);
        markerPoints.push({ index, label: t(`chart.marker_${marker.type}`) });
      });

      // crosshair (hidden until hovering / pressing)
      const crossV = svgEl("line", { class: "chart-cross", y1: PAD.top, y2: PAD.top + innerH, visibility: "hidden" });
      const crossDot = svgEl("circle", { r: 4, class: "chart-dot", visibility: "hidden" });
      svg.appendChild(crossV);
      svg.appendChild(crossDot);
      cross = { v: crossV, dot: crossDot };
      plot.appendChild(svg);
    }

    function scrubAt(clientX) {
      if (!layout || !cross) return;
      const rect = plot.getBoundingClientRect();
      const px = Math.min(Math.max(clientX - rect.left, 0), layout.innerW);
      const index = Math.min(
        candles.length - 1,
        Math.max(0, Math.round((px / layout.innerW) * visible + offset - 0.5)),
      );
      const cx = layout.x(index);
      cross.v.setAttribute("x1", cx);
      cross.v.setAttribute("x2", cx);
      cross.dot.setAttribute("cx", cx);
      cross.dot.setAttribute("cy", layout.y(candles[index].c));
      cross.v.setAttribute("visibility", "visible");
      cross.dot.setAttribute("visibility", type === "line" ? "visible" : "hidden");
      showPoint(index);
    }

    function endScrub() {
      if (cross) {
        cross.v.setAttribute("visibility", "hidden");
        cross.dot.setAttribute("visibility", "hidden");
      }
      showPeriodChange();
    }

    // Moves the window (clamped to the history) and redraws. Returns false at an edge.
    function setOffset(next) {
      const clamped = Math.min(Math.max(next, 0), maxOffset());
      if (clamped !== offset) {
        offset = clamped;
        draw({ reveal: false });
        updateAffordances();
        showPeriodChange();
      }
      return clamped === next;
    }

    function stopFling() {
      if (flingFrame) cancelAnimationFrame(flingFrame);
      flingFrame = 0;
    }

    // Momentum after a drag: velocity in bars per ms, decaying each frame.
    function fling(velocity) {
      stopFling();
      if (reduceMotion || Math.abs(velocity) < FLING_MIN) return;
      let lastTime = performance.now();
      const step = (now) => {
        const dt = Math.min(now - lastTime, 50);
        lastTime = now;
        velocity *= Math.pow(FLING_FRICTION, dt / 16);
        const inside = setOffset(offset + velocity * dt);
        flingFrame = inside && Math.abs(velocity) > FLING_MIN ? requestAnimationFrame(step) : 0;
      };
      flingFrame = requestAnimationFrame(step);
    }

    // Eases back to the latest bar (Lightweight Charts: scrollToRealTime).
    function scrollToLatest() {
      stopFling();
      const startOffset = offset;
      const distance = maxOffset() - startOffset;
      if (reduceMotion || distance <= 0) {
        setOffset(maxOffset());
        return;
      }
      const duration = 350;
      const startTime = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - startTime) / duration);
        setOffset(startOffset + distance * (1 - Math.pow(1 - p, 3)));
        flingFrame = p < 1 ? requestAnimationFrame(step) : 0;
      };
      flingFrame = requestAnimationFrame(step);
    }

    function markPanned() {
      if (hasPanned) return;
      hasPanned = true;
      updateAffordances();
    }

    // --- gestures -------------------------------------------------------
    let drag = null; // { id, startX, startOffset, active, lastX, lastTime, velocity }

    plot.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      stopFling();
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startOffset: offset,
        active: false,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocity: 0,
      };
      scrubAt(event.clientX);
    });

    plot.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) {
        if (!drag) scrubAt(event.clientX); // mouse hover
        return;
      }
      const dx = event.clientX - drag.startX;
      if (!drag.active) {
        if (Math.abs(dx) < PAN_THRESHOLD) {
          scrubAt(event.clientX); // pressed, not moving sideways: crosshair
          return;
        }
        drag.active = true;
        plot.setPointerCapture(event.pointerId);
        plot.classList.add("chart-plot--dragging");
        markPanned();
      }
      const dt = event.timeStamp - drag.lastTime;
      if (dt > 0) {
        const instant = -(event.clientX - drag.lastX) / barWidth() / dt;
        drag.velocity = drag.velocity * 0.7 + instant * 0.3;
      }
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      setOffset(drag.startOffset - dx / barWidth());
    });

    function endDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      const wasActive = drag.active;
      // a pause before lifting the finger cancels the momentum
      const velocity = event.timeStamp - drag.lastTime > 80 ? 0 : drag.velocity;
      drag = null;
      plot.classList.remove("chart-plot--dragging");
      if (wasActive) fling(velocity);
      if (wasActive || event.pointerType !== "mouse") endScrub();
    }
    plot.addEventListener("pointerup", endDrag);
    plot.addEventListener("pointercancel", endDrag);
    plot.addEventListener("pointerleave", (event) => {
      if (!drag && event.pointerType === "mouse") endScrub();
    });

    // trackpad swipe / horizontal wheel (or shift + wheel); a plain vertical wheel keeps scrolling the page
    plot.addEventListener(
      "wheel",
      (event) => {
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
        if (!delta || !maxOffset()) return;
        event.preventDefault();
        stopFling();
        markPanned();
        setOffset(offset + delta / barWidth());
      },
      { passive: false },
    );

    plot.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "End") return;
      event.preventDefault();
      stopFling();
      markPanned();
      if (event.key === "End") scrollToLatest();
      else setOffset(offset + (event.key === "ArrowLeft" ? -1 : 1) * Math.max(1, Math.round(visible / 4)));
    });

    latestButton.addEventListener("click", scrollToLatest);

    function load() {
      stopFling();
      const base = window.storage.getPriceSeries(instrument.ticker, range);
      visible = base.length;
      // intraday has no earlier session in the mock, the other ranges scroll back in time
      candles = range === "1d" ? base : window.storage.getPriceSeries(instrument.ticker, range, visible * HISTORY_FACTOR);
      offset = maxOffset();
      showPeriodChange();
      updateAffordances();
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

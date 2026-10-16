// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Mouse drag-to-scroll for every horizontal scroller (chips, carousels, shelves,
// strips). Touch screens scroll natively; on desktop a mouse can't swipe, so
// without this the off-screen items of a row are unreachable.
//
// Nothing to wire up per component: any element with `overflow-x: auto|scroll`
// that actually overflows becomes draggable. A new horizontal list only needs
// its normal CSS. Load it (with drag-scroll.css) on every page:
//   <link rel="stylesheet" href="../../modules/drag-scroll/drag-scroll.css" />
//   <script src="../../modules/drag-scroll/drag-scroll.js"></script>
//
// Behavior: mouse only (pointerType "mouse"), 5px threshold before a drag
// starts so plain clicks still work, the click that ends a drag is swallowed,
// scroll-snap is suspended while dragging and re-engages on release.
(function () {
  const THRESHOLD = 5;
  let drag = null;
  let swallowClick = false;

  function findScroller(el) {
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      if (node.scrollWidth <= node.clientWidth + 1) continue;
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return node;
    }
    return null;
  }

  function isMouse(e) {
    return e.pointerType === "mouse";
  }

  // Hover hint: the grab cursor, set once per scroller.
  document.addEventListener("pointerover", (e) => {
    if (!isMouse(e) || drag) return;
    const scroller = findScroller(e.target);
    if (scroller) scroller.classList.add("drag-scroll");
  });

  document.addEventListener("pointerdown", (e) => {
    if (!isMouse(e) || e.button !== 0) return;
    if (e.target.closest("input, textarea, select")) return;
    const scroller = findScroller(e.target);
    if (!scroller) return;
    swallowClick = false;
    drag = { scroller, startX: e.clientX, startLeft: scroller.scrollLeft, active: false };
  });

  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (!drag.active) {
      if (Math.abs(dx) < THRESHOLD) return;
      drag.active = true;
      drag.scroller.classList.add("drag-scroll--dragging");
    }
    drag.scroller.scrollLeft = drag.startLeft - dx;
  });

  function end() {
    if (!drag) return;
    const { scroller, active } = drag;
    drag = null;
    if (!active) return;
    // The click that follows the release must not open the card under the cursor.
    swallowClick = true;
    scroller.classList.remove("drag-scroll--dragging");
  }

  document.addEventListener("pointerup", end);
  document.addEventListener("pointercancel", end);

  document.addEventListener(
    "click",
    (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true
  );

  // Native image/link dragging would hijack the gesture.
  document.addEventListener("dragstart", (e) => {
    if (e.target.closest && findScroller(e.target)) e.preventDefault();
  });

  window.dragScroll = { findScroller };
})();

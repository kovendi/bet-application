// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// UI sequencing without setTimeout: exit animations and one-shot effects wait
// for the element's own animationend, so the CSS duration tokens stay the
// single source of timing. global.css cuts durations to ~0 under
// prefers-reduced-motion, so the end events still fire there.
//
// Usage in a page:
//   <link rel="stylesheet" href="../../modules/motion/motion.css" />
//   <script src="../../modules/motion/motion.js"></script>
//   <script>
//     // exit animation, then remove:
//     window.motion.playOut(toastEl, 'toast--leaving', () => toastEl.remove());
//     // restart a one-shot effect (e.g. a "pop" on toggle):
//     window.motion.replay(starEl, 'price-row-star--pop');
//     // content arriving after a skeleton / a swap:
//     window.motion.fadeIn(cardEl);
//     // children (or an array of elements) rise in one after another:
//     window.motion.stagger(listEl);
//     // a number rolls up to its value (--duration-countup); format(n) -> text:
//     window.motion.countUp(priceEl, 112480.35, (n) => money.formatNumber(n, 2));
//   </script>

window.motion = (function () {
  function hasAnimation(el) {
    return getComputedStyle(el).animationName !== "none";
  }

  // Adds `className` (which must start a CSS animation on `el` itself) and
  // calls onDone once that animation ends. Without an animation it calls
  // onDone right away, so a missing rule never leaves an element stuck.
  function playOut(el, className, onDone) {
    el.classList.add(className);
    if (!hasAnimation(el)) {
      onDone();
      return;
    }
    function handleEnd(event) {
      if (event.target !== el) return;
      el.removeEventListener("animationend", handleEnd);
      onDone();
    }
    el.addEventListener("animationend", handleEnd);
  }

  // Restarts a one-shot animation class, even if it is still applied.
  function replay(el, className) {
    el.classList.remove(className);
    void el.offsetWidth; // flush styles so re-adding the class restarts it
    el.classList.add(className);
    el.addEventListener("animationend", () => el.classList.remove(className), { once: true });
  }

  function fadeIn(el) {
    replay(el, "motion-fade-in");
    return el;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Each element gets its index as --stagger-index; motion.css turns that into
  // an animation delay, so they arrive one after another. Takes a container
  // (its direct children) or a list of elements. Capped so a long list never
  // keeps the user waiting for its tail.
  const STAGGER_MAX = 8;
  function stagger(target) {
    const elements = Array.isArray(target) ? target : Array.from(target.children);
    elements.forEach((element, index) => {
      element.style.setProperty("--stagger-index", Math.min(index, STAGGER_MAX));
      replay(element, "motion-stagger");
    });
    return target;
  }

  function durationToken(name) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000;
  }

  // Rolls the text of `el` from just below `to` up to `to` (ease-out), the way
  // a quote board settles. Driven by requestAnimationFrame; skipped entirely
  // under reduced motion. The final text is always exactly format(to).
  function countUp(el, to, format, { fromRatio = 0.96 } = {}) {
    el.textContent = format(to);
    if (prefersReducedMotion() || !to) return el;
    const from = to * fromRatio;
    const duration = durationToken("--duration-countup");
    // Timing from the rAF timestamp only: pages may shadow the global
    // `performance` (classic scripts share one global scope).
    let start = null;
    function frame(now) {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = format(progress < 1 ? from + (to - from) * eased : to);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return el;
  }

  return { playOut, replay, fadeIn, stagger, countUp, prefersReducedMotion };
})();

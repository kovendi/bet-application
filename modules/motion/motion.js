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

  return { playOut, replay, fadeIn };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Native-app style page transitions between the separate HTML pages:
//   forward  the new page slides in from the right (iOS "push")
//   back     the current page slides out to the right, the previous one
//            eases in from the left
// Main-nav (bottom-nav) switches are not transitions: they stay as they are.
//
// Load it in the <head> (sync, before <body>) together with page-transition.css,
// so the direction is on <html> before the first paint:
//   <link rel="stylesheet" href="../../modules/page-transition/page-transition.css" />
//   <script src="../../modules/page-transition/page-transition.js"></script>
//
// Plain same-origin links push automatically. For script navigation use:
//   window.pageTransition.go(url);      // push (slide in from the right)
//   window.pageTransition.back();       // history.back() with the slide-out
//   window.pageTransition.backTo(url);  // same slide-out, to a fixed parent URL
// The browser's own back/forward buttons are detected as well.

window.pageTransition = (function () {
  const STORAGE_KEY = "pageTransition";
  const FLAG_MAX_AGE_MS = 4000; // a flag from a navigation that never happened is ignored
  const ROOT = document.documentElement;
  let leaving = false;

  function writeFlag(direction) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ direction, at: Date.now() })); } catch (e) { /* ignore */ }
  }

  function takeFlag() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      const flag = JSON.parse(raw);
      return flag && Date.now() - flag.at < FLAG_MAX_AGE_MS ? flag.direction : null;
    } catch (e) {
      return null;
    }
  }

  function navigationType() {
    const entry = window.performance.getEntriesByType("navigation")[0];
    return entry ? entry.type : "navigate";
  }

  // Direction this page arrived with: the flag set by go()/back()/link click,
  // else the browser's own history traversal counts as "back".
  function arrivalDirection() {
    return takeFlag() || (navigationType() === "back_forward" ? "back" : null);
  }

  function playEntry(direction) {
    if (direction) ROOT.dataset.pageEnter = direction;
    else delete ROOT.dataset.pageEnter;
  }

  function screenEl() {
    return document.getElementById("screen-content");
  }

  // Runs the slide-out on the current screen, then calls navigate(). Without a
  // running animation (missing element, reduced motion) it navigates at once.
  function leave(direction, navigate) {
    if (leaving) return;
    leaving = true;
    writeFlag(direction);
    const el = screenEl();
    if (!el) { navigate(); return; }
    el.classList.add("page-leave-" + direction);
    if (getComputedStyle(el).animationName === "none") { navigate(); return; }
    el.addEventListener("animationend", function onEnd(event) {
      if (event.target !== el) return;
      el.removeEventListener("animationend", onEnd);
      navigate();
    });
  }

  function go(url) {
    leaving = true;
    writeFlag("forward");
    window.location.href = url;
  }

  function back() {
    leave("back", () => window.history.back());
  }

  function backTo(url) {
    leave("back", () => { window.location.href = url; });
  }

  // Only plain same-origin page links push; bottom-nav, new tabs, modifier
  // clicks, hash links and external links are left alone.
  function isPushLink(link, event) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!link || !link.href || link.target === "_blank" || link.hasAttribute("download")) return false;
    if (link.closest(".bottom-nav")) return false;
    const url = new URL(link.href, window.location.href);
    if (url.protocol !== window.location.protocol || url.host !== window.location.host) return false;
    return url.pathname !== window.location.pathname || url.search !== window.location.search;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a[href]");
    if (isPushLink(link, event)) writeFlag("forward");
  });

  // The entry animation is done: drop the attribute so a later reparenting or
  // restyle of the screen never replays it.
  document.addEventListener("animationend", (event) => {
    if (event.target.id === "screen-content" && event.animationName.indexOf("page-enter") === 0) {
      playEntry(null);
    }
  }, true);

  // Restored from the back/forward cache: no reload happened, so reset the
  // leave state and play the entry for the direction the user came with.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    leaving = false;
    const el = screenEl();
    if (el) el.classList.remove("page-leave-forward", "page-leave-back");
    playEntry(takeFlag());
  });

  playEntry(arrivalDirection());

  return { go, back, backTo };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Generic PWA core, built to be copied into any static project: the module
// folder (pwa.js, pwa-install.js, pwa.css), `manifest.webmanifest` and `sw.js`
// in the app root, the icons in assets/ and the `pwa.*` locale keys. Nothing in
// here is project-specific; the name, colors and icons live in the manifest.
//
// What it does (logic-only, no UI — the install card is pwa-install.js):
//   - detects the platform: iOS / Android, standalone (already installed),
//     iOS Safari vs. other iOS browsers
//   - injects the <head> tags a PWA needs (manifest, theme-color, iOS
//     meta tags, apple-touch-icon) on every page, so the app can be added to
//     the home screen from any screen, not only the first one
//   - registers the service worker (https / localhost only, skipped on file://)
//   - captures Chrome/Android's `beforeinstallprompt` so the install can start
//     from an own button; fires `pwa:installable` and `pwa:installed` on window
//
// Load it in <head> of every page (the install event can fire early) and call
// init() right away. Paths are resolved from this script's own URL, so the same
// line works at any folder depth:
//   <script src="../../modules/pwa/pwa.js"></script>
//   <script>window.pwaModule.init();</script>
//
//   window.pwaModule.getPlatform(); // { os, isMobile, isStandalone, isIosSafari }
//   window.pwaModule.canPromptInstall(); // Android: native install dialog available
//   window.pwaModule.promptInstall(); // -> Promise<'accepted' | 'dismissed' | 'unavailable'>

window.pwaModule = (function () {
  // The app root is two folders above this file (<root>/modules/pwa/pwa.js).
  const SCRIPT_SRC = document.currentScript ? document.currentScript.src : "";
  const ROOT_URL = SCRIPT_SRC ? new URL("../../", SCRIPT_SRC).href : "";

  const MANIFEST_PATH = "manifest.webmanifest";
  const SERVICE_WORKER_PATH = "sw.js";
  const TOUCH_ICON_PATH = "assets/apple-touch-icon.png";
  const THEME_COLOR = "#232157"; // keep in sync with theme_color in the manifest
  const APP_TITLE = "BÉT"; // home screen label on iOS; keep in sync with short_name in the manifest
  const IOS_NON_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\/|MicroMessenger/;

  let deferredPrompt = null;
  let initialized = false;

  function getPlatform() {
    const ua = navigator.userAgent;
    // iPadOS reports itself as a Mac; touch points tell them apart.
    const isIos = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    return {
      os: isIos ? "ios" : isAndroid ? "android" : "other",
      isMobile: isIos || isAndroid,
      isStandalone,
      isIosSafari: isIos && !IOS_NON_SAFARI.test(ua),
    };
  }

  function addHeadTag(tagName, attributes) {
    const selector = Object.keys(attributes)
      .filter((name) => name === "rel" || name === "name")
      .map((name) => `[${name}="${attributes[name]}"]`)
      .join("");
    if (document.head.querySelector(tagName + selector)) return;
    const el = document.createElement(tagName);
    Object.keys(attributes).forEach((name) => el.setAttribute(name, attributes[name]));
    document.head.appendChild(el);
  }

  function injectHeadTags() {
    addHeadTag("link", { rel: "manifest", href: ROOT_URL + MANIFEST_PATH });
    addHeadTag("link", { rel: "apple-touch-icon", href: ROOT_URL + TOUCH_ICON_PATH });
    addHeadTag("meta", { name: "theme-color", content: THEME_COLOR });
    addHeadTag("meta", { name: "mobile-web-app-capable", content: "yes" });
    addHeadTag("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    addHeadTag("meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" });
    addHeadTag("meta", { name: "apple-mobile-web-app-title", content: APP_TITLE });
  }

  function registerServiceWorker() {
    const isSecureOrigin = location.protocol === "https:" || location.hostname === "localhost";
    if (!("serviceWorker" in navigator) || !isSecureOrigin || !ROOT_URL) return;
    navigator.serviceWorker.register(ROOT_URL + SERVICE_WORKER_PATH, { scope: ROOT_URL }).catch(function () {});
  }

  function listenForInstall() {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault(); // we show our own button instead of the mini-infobar
      deferredPrompt = event;
      window.dispatchEvent(new Event("pwa:installable"));
    });
    window.addEventListener("appinstalled", function () {
      deferredPrompt = null;
      window.dispatchEvent(new Event("pwa:installed"));
    });
  }

  function canPromptInstall() {
    return deferredPrompt !== null;
  }

  function promptInstall() {
    if (!deferredPrompt) return Promise.resolve("unavailable");
    const prompt = deferredPrompt;
    deferredPrompt = null; // a prompt event can only be used once
    prompt.prompt();
    return prompt.userChoice.then(function (choice) {
      return choice.outcome;
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    injectHeadTags();
    listenForInstall();
    registerServiceWorker();
  }

  return { init, getPlatform, canPromptInstall, promptInstall };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Renders one of the app's icons as an inline <svg fill="currentColor">.
// Icons are inlined (not <img src="assets/icon-*.svg">) because file:// pages
// can't fetch() an external SVG's markup into the DOM, and CSS mask-image
// referencing a local file is blocked by the browser under file:// too — so
// inlining is the only reliable way to recolor an icon (active/inactive nav
// state, theme colors, ...) via currentColor.
//
// The path data below mirrors the matching file in assets/icon-<name>.svg
// (kept there for reference/preview) — update both if an icon changes.
//
// renderBrandLogo('google' | 'apple') renders a provider logo (see BRAND_LOGOS).
//
// Usage in a page:
//   <script src="../../modules/icon/icon.js"></script>
//   <script>
//     container.appendChild(window.iconModule.renderIcon('bell'));
//   </script>

window.iconModule = (function () {
  const PATHS = {
    home: "M12 3.2 2.5 11h2.3v9.1h5.4v-6h3.6v6h5.4V11h2.3L12 3.2Z",
    calendar:
      "M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm13 7H4v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9Z",
    profile:
      "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.5-8 5.6V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.4c0-3.1-3.6-5.6-8-5.6Z",
    bell: "M12 2a1 1 0 0 1 1 1v.6a6.5 6.5 0 0 1 5.5 6.4v3.6l1.6 2.8a1 1 0 0 1-.9 1.5H4.8a1 1 0 0 1-.9-1.5l1.6-2.8V10a6.5 6.5 0 0 1 5.5-6.4V3a1 1 0 0 1 1-1Zm0 19a2.5 2.5 0 0 1-2.5-2.5h5A2.5 2.5 0 0 1 12 21Z",
    search:
      "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z",
    back: "M11.7 4.3a1 1 0 0 1 0 1.4L6.4 11H20a1 1 0 1 1 0 2H6.4l5.3 5.3a1 1 0 1 1-1.4 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.4 0Z",
    filter: "M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z",
    check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z",
    "exclamationmark-circle": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z",
    refresh:
      "M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z",
    reorder: "M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3ZM9 3 5 6.99h3V14h2V6.99h3L9 3Z",
    menu: "M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z",
    trash:
      "M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9Zm1 2h4V4h-4v1ZM7 7h10v12H7V7Zm3 2a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1Z",
    logout:
      "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z",
    users:
      "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z",
    shield:
      "M12 2 4 5.5V11c0 5.25 3.4 9.98 8 11 4.6-1.02 8-5.75 8-11V5.5L12 2Zm0 2.24 6 2.73v4.03c0 4.02-2.55 7.7-6 8.94-3.45-1.24-6-4.92-6-8.94V6.97l6-2.73ZM12 8a2 2 0 0 0-.9 3.79L10.4 15h3.2l-.7-3.21A2 2 0 0 0 12 8Z",
    chat: "M12 3C6.48 3 2 6.81 2 11.5c0 2.42 1.19 4.6 3.1 6.14-.1 1.15-.44 2.19-1.13 3.11a.6.6 0 0 0 .58.95c1.65-.28 2.98-.9 4.02-1.62A11.6 11.6 0 0 0 12 20c5.52 0 10-3.81 10-8.5S17.52 3 12 3Z",
    send: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7Z",
    close:
      "M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z",
    link:
      "M3.9 12A3.1 3.1 0 0 1 7 8.9h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12ZM8 13h8v-2H8v2Zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10Z",
    "star":
      "M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9L12 2.5Zm0 4.9-1.7 3.5-3.8.5 2.8 2.7-.7 3.8 3.4-1.8 3.4 1.8-.7-3.8 2.8-2.7-3.8-.5L12 7.4Z",
    "star-filled":
      "M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9L12 2.5Z",
    "chart-line":
      "M3 17.6 9.2 11l3.8 3.8L20.6 7l1.4 1.4-9 9.2-3.8-3.8-4.8 5-1.4-1.2Z",
    "chart-candle":
      "M7 3a1 1 0 0 1 1 1v2h1.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8v2a1 1 0 1 1-2 0v-2H4.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1H6V4a1 1 0 0 1 1-1Zm10 4a1 1 0 0 1 1 1v1h1.5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H18v1a1 1 0 1 1-2 0v-1h-1.5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1H16V8a1 1 0 0 1 1-1Z",
    "info":
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z",
    "chevron-right":
      "M9.4 5.6 8 7l5 5-5 5 1.4 1.4 6.4-6.4-6.4-6.4Z",
    "chevron-down":
      "M5.6 9.4 7 8l5 5 5-5 1.4 1.4-6.4 6.4-6.4-6.4Z",
    "book":
      "M5 3h11a3 3 0 0 1 3 3v13a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5V4a1 1 0 0 1 1-1Zm1 2v9.6c.4-.4 1-.6 1.5-.6H17V6a1 1 0 0 0-1-1H6Zm1.5 11a.5.5 0 0 0 0 1H17v-1H7.5Z",
    "mail":
      "M5 4h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm-.4 2.2L12 11.6l7.4-5.4A1 1 0 0 0 19 6H5a1 1 0 0 0-.4.2ZM20 8.7l-7.4 5.4a1 1 0 0 1-1.2 0L4 8.7V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8.7Z",
    "sliders":
      "M4 5h8v2H4V5Zm10-1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM16 5h4v2h-4V5ZM4 11h3v2H4v-2Zm5-1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM11 11h9v2h-9v-2ZM4 17h10v2H4v-2Zm12-1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM18 17h2v2h-2v-2Z",
    "lock":
      "M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z",
  };

  // Outline variants (stroked, no fill) — the inactive state of filled icons,
  // e.g. in the bottom nav. Rendered with stroke="currentColor", stroke-width 2.
  const OUTLINE_PATHS = {
    "home-outline": "M4 10.2 12 3.8l8 6.4V19.5a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.3Z",
    "price-alert": "M3.5 12h17M12 3.5v5.5M9.5 6 12 3.5 14.5 6M12 20.5V15M9.5 18l2.5 2.5 2.5-2.5",
    "chart-line-outline": "M3.5 17 9.2 11.2l3.8 3.8 7.5-7.6",
    "chat-outline": "M12 4C7.03 4 3.5 7.2 3.5 11.2c0 2.2 1.1 4.1 2.9 5.4-.1 1.1-.5 2-1.1 2.9 1.5-.2 2.7-.8 3.6-1.5.9.3 1.9.4 3.1.4 4.97 0 8.5-3.2 8.5-7.2S16.97 4 12 4Z",
    "book-outline": "M6 3.5h10a2.5 2.5 0 0 1 2.5 2.5v13.5H7A2.5 2.5 0 0 1 4.5 17V5A1.5 1.5 0 0 1 6 3.5ZM4.5 17A2.5 2.5 0 0 1 7 14.5h11.5",
    "sparkles":
      "M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9L10 3Zm8.5 10 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1ZM18 2.5l.7 1.8 1.8.7-1.8.7L18 7.5l-.7-1.8-1.8-.7 1.8-.7.7-1.8Z",
    "arrow-up":
      "M12 4a1 1 0 0 1 .7.3l6 6a1 1 0 0 1-1.4 1.4L13 7.4V19a1 1 0 1 1-2 0V7.4l-4.3 4.3a1 1 0 0 1-1.4-1.4l6-6A1 1 0 0 1 12 4Z",
    "arrow-down":
      "M12 20a1 1 0 0 1-.7-.3l-6-6a1 1 0 0 1 1.4-1.4l4.3 4.3V5a1 1 0 1 1 2 0v11.6l4.3-4.3a1 1 0 0 1 1.4 1.4l-6 6a1 1 0 0 1-.7.3Z",
    "play":
      "M8 5.6v12.8a1 1 0 0 0 1.5.86l10.4-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z",
    "stop":
      "M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z",
    "copy":
      "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1Zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2Zm0 16H8V7h11v14Z",
    "thumbs-up":
      "M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2Zm0-12 4.34-4.34L12 10h9v2l-3 7H9V9ZM1 9h4v12H1V9Z",
    "thumbs-down":
      "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2Zm0 12-4.34 4.34L12 14H3v-2l3-7h9v10Zm4-12h4v12h-4V3Z",
    "mic":
      "M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V20h2a1 1 0 1 1 0 2h-6a1 1 0 1 1 0-2h2v-2.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z",
    "clock":
      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 3v5.4l3.3 3.3 1.4-1.4-2.7-2.7V7h-2Z",
  };

  function renderIcon(name) {
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon");

    const path = document.createElementNS(svgNs, "path");
    if (OUTLINE_PATHS[name]) {
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      path.setAttribute("d", OUTLINE_PATHS[name]);
      svg.appendChild(path);
      return svg;
    }
    path.setAttribute("d", PATHS[name] || "");
    // evenodd (rather than the SVG default nonzero) so a multi-subpath icon
    // can punch a hole regardless of the winding direction of each subpath —
    // a no-op for single non-self-intersecting subpaths.
    path.setAttribute("fill-rule", "evenodd");
    svg.appendChild(path);

    return svg;
  }

  // Third-party brand logos (login providers). Kept apart from the UI icons:
  // Google's mark must keep its official colors, Apple's follows currentColor.
  const BRAND_LOGOS = {
    google: [
      ["#4285F4", "M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17Z"],
      ["#34A853", "M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46Z"],
      ["#FBBC05", "M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7Z"],
      ["#EA4335", "M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07Z"],
    ],
    apple: [
      ["currentColor", "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09ZM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"],
    ],
  };
  const BRAND_VIEWBOX = { google: "0 0 48 48", apple: "0 0 24 24" };

  function renderBrandLogo(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", BRAND_VIEWBOX[name]);
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon", "icon--brand");
    BRAND_LOGOS[name].forEach(([fill, d]) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", fill);
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  return { renderIcon, renderBrandLogo };
})();

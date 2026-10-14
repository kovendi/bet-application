// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// An inline notice strip: an icon plus a short text, optionally with a text
// action. Used for the delayed-price disclaimer (TK_009, TA_001, NYÁ_0021),
// "market closed" notes, offline/error hints.
//
// Requires modules/icon/icon.js and modules/i18n/i18n.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/banner/banner.js"></script>
//   <script>
//     container.appendChild(window.bannerModule.renderBanner({
//       text: 'A piac zárva.',
//       variant: 'info', // 'info' (default) | 'warning'
//       icon: 'info', // optional, default 'info'
//       actionLabel: 'Részletek', // optional
//       onAction: () => {...},
//     }));
//     // the standard "prices are delayed" strip:
//     container.appendChild(window.bannerModule.renderDelayedDisclaimer());
//   </script>

window.bannerModule = (function () {
  function renderBanner({ text, variant = "info", icon = "info", actionLabel, onAction } = {}) {
    const banner = document.createElement("div");
    banner.className = `banner banner--${variant}`;
    banner.setAttribute("role", variant === "warning" ? "alert" : "note");

    const iconEl = window.iconModule.renderIcon(icon);
    iconEl.classList.add("banner-icon");
    banner.appendChild(iconEl);

    const textEl = document.createElement("p");
    textEl.className = "banner-text";
    textEl.textContent = text;
    banner.appendChild(textEl);

    if (actionLabel) {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "banner-action";
      action.textContent = actionLabel;
      if (onAction) action.addEventListener("click", onAction);
      banner.appendChild(action);
    }
    return banner;
  }

  // Every quote except the indexes is delayed, so every price screen shows this.
  function renderDelayedDisclaimer() {
    return renderBanner({ text: window.i18n.t("disclaimer.delayed"), variant: "info", icon: "info" });
  }

  return { renderBanner, renderDelayedDisclaimer };
})();

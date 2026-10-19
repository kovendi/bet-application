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
//       text: 'The market is closed.',
//       variant: 'info', // 'info' (default) | 'warning'
//       icon: 'info', // optional, default 'info'
//       actionLabel: 'Details', // optional
//       onAction: () => {...},
//     }));
//     // the standard "prices are delayed" strip:
//     container.appendChild(window.bannerModule.renderDelayedDisclaimer());
//     // delayed strip plus a "market closed" note when closed (load market-status too):
//     container.appendChild(window.bannerModule.renderPriceNotices());
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

  // The delayed-price strip, preceded by a "market closed" note while the market
  // is closed (PS_001). Needs modules/market-status loaded; without it only the
  // delayed strip shows.
  function renderPriceNotices() {
    const fragment = document.createDocumentFragment();
    if (window.marketStatusModule && window.marketStatusModule.isClosed()) {
      fragment.appendChild(renderBanner({ text: window.i18n.t("disclaimer.market_closed"), variant: "info", icon: "clock" }));
    }
    fragment.appendChild(renderDelayedDisclaimer());
    return fragment;
  }

  return { renderBanner, renderDelayedDisclaimer, renderPriceNotices };
})();

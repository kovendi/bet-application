// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// One instrument in a list (market list, toplists, favorites, search results):
// ticker + name on the left, optional mini curve, price + signed daily change
// on the right, optional favorite star. The change always carries a +/− sign
// besides its color (NFK_003). The row is a link when `href` is given, a button
// when `onClick` is, otherwise static.
//
// Requires modules/icon, modules/money, modules/i18n, modules/motion (and
// modules/sparkline + modules/storage when `sparkline` is on) to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/price-row/price-row.js"></script>
//   <script>
//     list.appendChild(window.priceRowModule.renderPriceRow({
//       instrument: window.storage.getInstrument('OTP'),
//       href: '../product/product.html?ticker=OTP', // or onClick: () => {...}
//       favorite: false, // true/false shows the star; omit/null hides it
//       // The star flips instantly with a pop; return false to keep it as it
//       // was (guest -> showRegistrationRequired()).
//       onFavoriteToggle: (instrument, wasFavorite) => {...},
//       sparkline: true, // optional mini curve of today (storage.getDayCurve)
//       meta: 'name', // second line: 'name' (default) | 'turnover'
//       rank: 1, // optional position badge in front (toplists)
//     }));
//   </script>

window.priceRowModule = (function () {
  function renderPriceRow({
    instrument,
    href,
    onClick,
    favorite = null,
    onFavoriteToggle,
    sparkline = false,
    meta = "name",
    rank = null,
  } = {}) {
    const money = window.moneyModule;
    const change = window.storage.getChangePercent(instrument);
    const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";

    const row = document.createElement("div");
    row.className = "price-row";

    const main = document.createElement(href ? "a" : onClick ? "button" : "div");
    main.className = "price-row-main";
    if (href) main.href = href;
    else if (onClick) {
      main.type = "button";
      main.addEventListener("click", () => onClick(instrument));
    }

    if (rank !== null) {
      const badge = document.createElement("span");
      badge.className = "price-row-rank" + (rank === 1 ? " price-row-rank--first" : "");
      badge.textContent = rank;
      main.appendChild(badge);
    }

    const left = document.createElement("div");
    left.className = "price-row-left";
    const ticker = document.createElement("span");
    ticker.className = "price-row-ticker";
    ticker.textContent = instrument.ticker;
    const sub = document.createElement("span");
    sub.className = "price-row-sub";
    sub.textContent =
      meta === "turnover" && instrument.turnover
        ? money.formatCompactMoney(instrument.turnover)
        : instrument.name;
    left.appendChild(ticker);
    left.appendChild(sub);
    main.appendChild(left);

    if (sparkline) {
      const spark = window.sparklineModule.renderSparkline({ values: window.storage.getDayCurve(instrument.ticker) });
      spark.classList.add("price-row-spark");
      main.appendChild(spark);
    }

    const right = document.createElement("div");
    right.className = "price-row-right";
    const price = document.createElement("span");
    price.className = "price-row-price";
    price.textContent = money.formatPrice(instrument.price, instrument.unit);
    const delta = document.createElement("span");
    delta.className = `price-row-change price-row-change--${direction}`;
    delta.textContent = money.formatPercent(change);
    right.appendChild(price);
    right.appendChild(delta);
    main.appendChild(right);
    row.appendChild(main);

    if (favorite !== null) {
      row.appendChild(renderStar(instrument, favorite, onFavoriteToggle));
    }
    return row;
  }

  function paintStar(star, isOn) {
    star.setAttribute("aria-pressed", isOn ? "true" : "false");
    star.setAttribute(
      "aria-label",
      window.i18n.t(isOn ? "price_row.remove_favorite" : "price_row.add_favorite"),
    );
    star.classList.toggle("price-row-star--on", isOn);
    star.replaceChildren(window.iconModule.renderIcon(isOn ? "star-filled" : "star"));
  }

  function renderStar(instrument, favorite, onFavoriteToggle) {
    let isOn = favorite;
    const star = document.createElement("button");
    star.type = "button";
    star.className = "price-row-star";
    paintStar(star, isOn);
    star.addEventListener("click", () => {
      const accepted = onFavoriteToggle ? onFavoriteToggle(instrument, isOn) : true;
      if (accepted === false) return;
      isOn = !isOn;
      paintStar(star, isOn);
      window.motion.replay(star, "price-row-star--pop");
    });
    return star;
  }

  return { renderPriceRow };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Toplists (NYT_001–NYT_007): a segmented switcher (winners / losers /
// turnover) over a list of up to 5 price rows. Switching UX proposal for
// NYT_007: segmented control, no page reload.
//
// Requires modules/chips, modules/price-row (and the modules they need:
// icon, money, i18n) and modules/storage to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/toplist/toplist.js"></script>
//   <script>
//     container.appendChild(window.toplistModule.renderToplist({
//       instruments: window.storage.getInstruments('share'),
//       limit: 5, // optional, default 5
//       hrefFor: (instrument) => '../product/product.html?ticker=' + instrument.ticker,
//       sparkline: true, // optional mini curve per row
//     }));
//   </script>

window.toplistModule = (function () {
  const SORTERS = {
    winners: (a, b) => window.storage.getChangePercent(b) - window.storage.getChangePercent(a),
    losers: (a, b) => window.storage.getChangePercent(a) - window.storage.getChangePercent(b),
    turnover: (a, b) => b.turnover - a.turnover,
  };

  function renderToplist({ instruments = [], limit = 5, hrefFor, sparkline = false } = {}) {
    const t = window.i18n.t;
    const root = document.createElement("div");
    root.className = "toplist";
    const list = document.createElement("div");
    list.className = "toplist-rows";

    function show(id) {
      list.replaceChildren();
      instruments
        .slice()
        .sort(SORTERS[id])
        .slice(0, limit)
        .forEach((instrument, index) => {
          const row = window.priceRowModule.renderPriceRow({
            instrument,
            href: hrefFor ? hrefFor(instrument) : undefined,
            meta: id === "turnover" ? "turnover" : "name",
            sparkline,
            rank: index + 1,
          });
          row.style.setProperty("--stagger-index", index);
          row.classList.add("price-row--enter");
          list.appendChild(row);
        });
    }

    root.appendChild(
      window.chipsModule.renderChips({
        items: Object.keys(SORTERS).map((id) => ({ id, label: t("toplist." + id) })),
        variant: "segmented",
        activeId: "winners",
        ariaLabel: t("toplist.label"),
        onChange: show,
      }),
    );
    root.appendChild(list);
    show("winners");
    return root;
  }

  return { renderToplist };
})();

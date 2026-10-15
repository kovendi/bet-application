// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Logic-only (no paired CSS, same exception as i18n.js/storage.js).
//
// Money is always stored as an integer number of forints (HUF) — the fillér
// is no longer in circulation, so there is no smaller unit to track, and an
// integer avoids floating-point rounding errors on sums/comparisons. This
// module is the single place that converts an amount to a display string and
// back.
//
// Usage in a page:
//   <script src="../../modules/money/money.js"></script>
//   <script>
//     window.moneyModule.formatMoney(123456); // "123 456 Ft"
//     window.moneyModule.toHuf("1234.6"); // 1235
//     window.moneyModule.formatNumber(45123.4); // "45 123,40"
//     window.moneyModule.formatPercent(-1.234); // "−1,23%"
//     window.moneyModule.formatCompactMoney(8240000000); // "8,24 Mrd Ft"
//     window.moneyModule.formatPrice(98.45, "pct"); // "98,45%" (unit: HUF | pt | pct)
//   </script>

window.moneyModule = (function () {
  // Number grouping/decimal separators follow the app language (hu: "1 234,5", en: "1,234.5").
  const NUMBER_LOCALES = { hu: "hu-HU", en: "en-GB" };
  function numberLocale() {
    return NUMBER_LOCALES[window.i18n ? window.i18n.getLanguage() : "hu"] || NUMBER_LOCALES.hu;
  }

  // huf: integer number of forints. Negative values are supported (formatted
  // with a proper minus sign "−", not a hyphen) unless `sign` overrides the
  // prefix.
  //
  // options.sign: explicit prefix ("+" or "−") shown instead of the sign
  //   implied by `huf` — use this when the sign is determined by context
  //   (e.g. win/loss) rather than by the stored value itself.
  // options.withCurrency: set false to omit the trailing " Ft".
  function formatMoney(huf, options = {}) {
    const { sign, withCurrency = true } = options;
    const formatted = Math.abs(huf).toLocaleString(numberLocale(), {
      maximumFractionDigits: 0,
    });
    const prefix = sign !== undefined ? sign : huf < 0 ? "−" : "";
    return withCurrency ? `${prefix}${formatted} Ft` : `${prefix}${formatted}`;
  }

  // Converts an amount (number or numeric string, e.g. from a form input) to
  // an integer number of forints.
  function toHuf(value) {
    return Math.round(Number(value));
  }

  // Non-money numbers shown next to prices: index points, bond prices in % of
  // par, turnover in millions. Fixed decimals, Hungarian grouping/comma.
  function formatNumber(value, decimals = 2) {
    return Math.abs(value).toLocaleString(numberLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Price change in percent, always with an explicit sign (+/−) so direction
  // never relies on color alone (NFK_003). Zero gets no sign.
  function formatPercent(value, decimals = 2) {
    const rounded = Number(Math.abs(value).toFixed(decimals));
    const prefix = rounded === 0 ? "" : value > 0 ? "+" : "−";
    return `${prefix}${formatNumber(rounded, decimals)}%`;
  }

  // Large turnover figures in short form: "8,24 Mrd Ft", "512 M Ft".
  function formatCompactMoney(huf) {
    const billion = window.i18n && window.i18n.getLanguage() === "en" ? "bn" : "Mrd";
    if (huf >= 1e9) return `${formatNumber(huf / 1e9, 2)} ${billion} Ft`;
    if (huf >= 1e6) return `${formatNumber(huf / 1e6, 0)} M Ft`;
    return formatMoney(huf);
  }

  // A quote in its own unit: HUF -> "32 450 Ft", pt -> "112 480,35",
  // pct (bond price, % of par) -> "98,45%". Use this for every displayed price.
  function formatPrice(value, unit) {
    if (unit === "HUF") return formatMoney(value);
    if (unit === "pct") return `${formatNumber(value, 2)}%`;
    return formatNumber(value, 2);
  }

  return { formatMoney, toHuf, formatNumber, formatPercent, formatCompactMoney, formatPrice };
})();

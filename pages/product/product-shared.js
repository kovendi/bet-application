// Small helpers shared by the product page scripts (product.js and the tab
// panel files). Classic script, attaches window.productShared.
// Requires i18n, money and icon to be loaded first.

window.productShared = (function () {
  const t = window.i18n.t;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function directionOf(value) {
    return value > 0 ? "up" : value < 0 ? "down" : "flat";
  }

  // TA_000 proposal: a missing value shows "–" with a visually quiet style, and
  // the screen reader reads "Nincs adat".
  function valueNode(value) {
    if (value !== null && value !== undefined && value !== 0) return document.createTextNode(value);
    const missing = el("span", "product-fact-missing", "–");
    missing.setAttribute("aria-label", t("product.no_data"));
    return missing;
  }

  function fact(label, value) {
    const row = el("div", "product-fact");
    const data = el("dd");
    data.appendChild(valueNode(value));
    row.append(el("dt", "", label), data);
    return row;
  }

  function factList(rows) {
    const list = el("dl", "product-facts");
    rows.forEach((row) => list.appendChild(fact(row[0], row[1])));
    return list;
  }

  // Rows of [specKey, value] pairs from the seed data, labels from spec.<key>.
  function specList(specs) {
    return factList(specs.map((spec) => [t(`spec.${spec[0]}`), spec[1]]));
  }

  function section(title, content) {
    const wrap = el("div");
    wrap.append(el("h2", "product-section-title", title), content);
    return wrap;
  }

  function note(text) {
    return el("p", "product-note", text);
  }

  // Plain CSS range indicator (day range, target price range), not a chart.
  function rangeTrack({ low, high, value, caption, format }) {
    const wrap = el("div", "product-range");
    const labels = el("div", "product-range-labels");
    labels.append(el("span", "", format(low)), el("span", "product-range-caption", caption), el("span", "", format(high)));
    const track = el("div", "product-range-track");
    const span = high - low;
    const position = span > 0 ? ((value - low) / span) * 100 : 50;
    const marker = el("span", "product-range-marker");
    marker.style.setProperty("--range-position", `${Math.min(100, Math.max(0, position))}%`);
    track.appendChild(marker);
    wrap.append(labels, track);
    return wrap;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}. ${t(`date.month_${d.getMonth() + 1}`)} ${d.getDate()}.`;
  }

  return { el, directionOf, valueNode, fact, factList, specList, section, note, rangeTrack, formatDate };
})();

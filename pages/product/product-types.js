// Tab panels of the non-share product types: product characteristics + about
// text (bond TA_0022, ETF TA_0031, index TA_0041, certificate TA_0051), the
// index composition (TA_004) and the derivative info of futures, options and
// FX (TA_007). Classic script, attaches window.productTypes. Requires
// productShared and i18n.

window.productTypes = (function () {
  const t = window.i18n.t;
  const shared = window.productShared;
  const el = shared.el;

  // Product characteristics and the issuer / product introduction text.
  function specsPanel(detail, aboutTitleKey) {
    const fragment = document.createDocumentFragment();
    fragment.append(
      shared.section(t("issuer.section_facts"), shared.specList(detail.specs)),
      shared.section(t(aboutTitleKey), el("p", "product-text", detail.about)),
    );
    return fragment;
  }

  // Components without weights, as in the half-yearly official announcement.
  function compositionPanel(detail) {
    const list = el("ul", "product-doc-list");
    detail.components.forEach((component) => {
      const item = el("li");
      const row = el(component.ticker ? "a" : "div", "product-doc-row");
      if (component.ticker) row.href = `product.html?ticker=${encodeURIComponent(component.ticker)}`;
      const text = el("span", "product-doc-text");
      text.append(el("span", "product-doc-title", component.ticker || component.name));
      if (component.ticker) text.appendChild(el("span", "product-doc-meta", component.name));
      row.appendChild(text);
      if (component.ticker) row.appendChild(window.iconModule.renderIcon("chevron-right"));
      item.appendChild(row);
      list.appendChild(item);
    });
    const fragment = document.createDocumentFragment();
    fragment.append(
      shared.section(t("composition.section"), list),
      shared.note(t("composition.note").replace("{date}", shared.formatDate(detail.compositionDate))),
    );
    return fragment;
  }

  // The trading tab of a future, option or FX contract (TA_007).
  function derivativeSection(detail) {
    return shared.section(t(`derivative.kind_${detail.kind}`), shared.specList(detail.specs));
  }

  return { specsPanel, compositionPanel, derivativeSection };
})();

// Share-only tab panels of the product page: Pénzügyi adatok (TA_0011),
// Értékelés (TA_0012), Kibocsátó (TA_0013) and Elemzés (TA_0015).
// Classic script, attaches window.productShareTabs. Requires productShared,
// barChartModule, chipsModule, progressBarModule, money and i18n.

window.productShareTabs = (function () {
  const t = window.i18n.t;
  const money = window.moneyModule;
  const shared = window.productShared;
  const el = shared.el;

  const FINANCIAL_GROUPS = {
    income: ["revenue", "operating", "net"],
    balance: ["assets", "equity", "liabilities"],
    cashflow: ["operating", "investing", "financing"],
  };

  function signed(value, decimals) {
    return `${value < 0 ? "−" : ""}${money.formatNumber(value, decimals)}`;
  }

  // --- Pénzügyi adatok: yearly bars, the Warsaw sample's three statements ---------

  function financialCharts(detail, group) {
    const wrap = el("div", "product-chart-stack");
    FINANCIAL_GROUPS[group].forEach((metric) => {
      wrap.appendChild(
        window.barChartModule.renderBarChart({
          title: t(`financials.${group}_${metric}`),
          labels: detail.financials.years,
          values: detail.financials[group][metric],
          formatValue: (value) => signed(value, 1),
        }),
      );
    });
    return wrap;
  }

  function financialsPanel(detail) {
    const fragment = document.createDocumentFragment();
    const body = el("div");
    const groups = Object.keys(FINANCIAL_GROUPS);
    function paint(group) {
      body.replaceChildren(financialCharts(detail, group));
      window.motion.fadeIn(body);
    }
    fragment.append(
      window.chipsModule.renderChips({
        items: groups.map((id) => ({ id, label: t(`financials.group_${id}`) })),
        variant: "segmented",
        activeId: groups[0],
        ariaLabel: t("financials.groups"),
        onChange: paint,
      }),
      shared.note(t("financials.unit_note")),
      body,
    );
    paint(groups[0]);
    return fragment;
  }

  // --- Értékelés: 10 year dividend and the ratios ----------------------------------

  function dividendBlock(dividends) {
    const wrap = el("div");
    wrap.appendChild(
      window.barChartModule.renderBarChart({
        title: t("valuation.dividend_title"),
        labels: dividends.years,
        values: dividends.values,
        formatValue: (value) => money.formatNumber(value, 0),
      }),
    );
    const paidAny = dividends.values.some((value) => value !== null);
    wrap.appendChild(shared.note(t(paidAny ? "valuation.dividend_note" : "valuation.dividend_none")));
    return wrap;
  }

  function percent(value) {
    return `${money.formatNumber(value, 1)}%`;
  }

  function valuationPanel(detail) {
    const ratios = detail.ratios;
    const fragment = document.createDocumentFragment();
    const peRow = shared.fact(t("valuation.pe"), ratios.pe === null ? null : money.formatNumber(ratios.pe, 1));
    const list = el("dl", "product-facts");
    list.append(
      shared.fact(t("valuation.pb"), money.formatNumber(ratios.pb, 1)),
      peRow,
      shared.fact(t("valuation.debt"), `${ratios.debt}%`),
      shared.fact(t("valuation.roa"), percent(ratios.roa)),
      shared.fact(t("valuation.roe"), percent(ratios.roe)),
    );
    const ratiosBlock = el("div");
    ratiosBlock.append(list, shared.note(t("valuation.ratio_note").replace("{year}", window.SEED_PRODUCT.LAST_YEAR)));
    if (ratios.pe === null) ratiosBlock.appendChild(shared.note(t("valuation.pe_missing")));
    fragment.append(
      shared.section(t("valuation.section_dividend"), dividendBlock(detail.dividends)),
      shared.section(t("valuation.section_ratios"), ratiosBlock),
    );
    return fragment;
  }

  // --- Kibocsátó: product facts, about, shareholders, management ---------------------

  function issuerFactRows(facts) {
    const formatters = {
      shares: (value) => money.formatNumber(value, 0),
      market_cap: (value) => money.formatCompactMoney(value),
      free_float: (value) => `${value}%`,
    };
    return facts.map((row) => [t(`spec.${row[0]}`), formatters[row[0]] ? formatters[row[0]](row[1]) : row[1]]);
  }

  function shareholders(list) {
    const wrap = el("div", "product-bars");
    list.forEach((holder) => {
      wrap.appendChild(
        window.progressBarModule.renderProgressBar({
          label: holder.name,
          valueText: `${holder.percent}%`,
          percent: holder.percent,
          layout: "stacked",
        }),
      );
    });
    return wrap;
  }

  function management(list) {
    const wrap = el("dl", "product-facts");
    list.forEach((person) => wrap.appendChild(shared.fact(person.role, person.name)));
    return wrap;
  }

  function issuerPanel(detail) {
    const issuer = detail.issuer;
    const fragment = document.createDocumentFragment();
    fragment.append(
      shared.section(t("issuer.section_facts"), shared.factList(issuerFactRows(issuer.facts))),
      shared.section(t("issuer.section_about"), el("p", "product-text", issuer.about)),
      shared.section(t("issuer.section_shareholders"), shareholders(issuer.shareholders)),
      shared.section(t("issuer.section_management"), management(issuer.management)),
    );
    return fragment;
  }

  // --- Elemzés: recommendation counts and target price range --------------------------

  function recommendationBar(analysis) {
    const total = analysis.buy + analysis.hold + analysis.sell;
    const wrap = el("div", "product-reco");
    const bar = el("div", "product-reco-bar");
    const legend = el("ul", "product-reco-legend");
    [
      ["buy", analysis.buy],
      ["hold", analysis.hold],
      ["sell", analysis.sell],
    ].forEach(([id, count]) => {
      if (count > 0) {
        const segment = el("span", `product-reco-segment product-reco-segment--${id}`);
        segment.style.setProperty("--reco-share", count);
        bar.appendChild(segment);
      }
      const item = el("li", "product-reco-item");
      item.append(el("span", "product-reco-count", String(count)), el("span", "product-reco-label", t(`analysis.${id}`)));
      legend.appendChild(item);
    });
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", t("analysis.reco_total").replace("{count}", total));
    wrap.append(bar, legend);
    return wrap;
  }

  function reportList(reports, onOpen) {
    const list = el("ul", "product-doc-list");
    reports.forEach((report) => {
      const item = el("li");
      const row = el("button", "product-doc-row");
      row.type = "button";
      const text = el("span", "product-doc-text");
      text.append(
        el("span", "product-doc-title", report.title),
        el("span", "product-doc-meta", `${report.source} · ${shared.formatDate(report.date)}`),
      );
      row.append(text, el("span", "product-doc-format", "PDF"));
      row.addEventListener("click", () => onOpen(report));
      item.appendChild(row);
      list.appendChild(item);
    });
    return list;
  }

  function analysisPanel(detail, instrument, onOpenReport) {
    const analysis = detail.analysis;
    const fragment = document.createDocumentFragment();
    const format = (value) => money.formatPrice(value, instrument.unit);
    const target = el("div");
    target.append(
      shared.rangeTrack({ low: analysis.targetMin, high: analysis.targetMax, value: instrument.price, caption: t("analysis.target_caption"), format }),
      shared.factList([
        [t("analysis.target_avg"), format(analysis.targetAvg)],
        [t("analysis.updated"), shared.formatDate(analysis.updated)],
      ]),
    );
    fragment.append(
      shared.section(t("analysis.section_reco"), recommendationBar(analysis)),
      shared.section(t("analysis.section_target"), target),
      shared.section(t("analysis.section_reports"), reportList(analysis.reports, onOpenReport)),
      shared.note(t("analysis.source_note")),
    );
    return fragment;
  }

  return { financialsPanel, valuationPanel, issuerPanel, analysisPanel };
})();

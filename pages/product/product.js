window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

const shared = window.productShared;
const { el, directionOf, valueNode } = shared;

// Tabs per instrument type (TA_001–TA_007). BÉTa products and derivatives
// only have the trading content, so they get no tab row at all.
const TABS_BY_CATEGORY = {
  share: ["trading", "financials", "valuation", "issuer", "disclosures", "analysis"],
  bond: ["trading", "disclosures", "issuer"],
  etf: ["trading", "issuer", "disclosures"],
  index: ["trading", "specs", "composition", "disclosures"],
  certificate: ["trading", "issuer", "disclosures"],
  other: ["trading"],
};
const PERFORMANCE_RANGES = ["1w", "1m", "3m", "1y", "5y"];

const params = new URLSearchParams(window.location.search);
const ticker = params.get("ticker") || "OTP";
const instrument = window.storage.getInstrument(ticker);
const detail = instrument ? window.storage.getProductDetail(ticker) : null;
const markers = instrument && instrument.category === "share" ? window.storage.getProductMarkers(ticker) : [];
const forceEmpty = window.mockNetwork.isEmptyMock();

const els = {
  header: document.getElementById("product-header"),
  chart: document.getElementById("product-chart"),
  actions: document.getElementById("product-actions"),
  tabs: document.getElementById("product-tabs"),
  panel: document.getElementById("product-panel"),
  disclaimer: document.getElementById("product-disclaimer"),
};

// --- Favorites: registered users only (K_000) ---------------------------------

function renderFavoriteButton() {
  const user = window.storage.getCurrentUser();
  let isOn = user ? window.storage.isFavorite(user.id, ticker) : false;
  const button = el("button", "top-appbar-icon-button price-row-star");
  button.type = "button";

  function paint() {
    button.classList.toggle("price-row-star--on", isOn);
    button.setAttribute("aria-pressed", isOn ? "true" : "false");
    button.setAttribute("aria-label", t(isOn ? "price_row.remove_favorite" : "price_row.add_favorite"));
    button.replaceChildren(window.iconModule.renderIcon(isOn ? "star-filled" : "star"));
  }

  button.addEventListener("click", () => {
    const current = window.storage.getCurrentUser();
    if (!current) {
      window.bottomSheetModule.showRegistrationRequired();
      return;
    }
    isOn = window.storage.toggleFavorite(current.id, ticker);
    paint();
    window.motion.replay(button, "price-row-star--pop");
  });
  paint();
  return button;
}

// Price alert shortcut next to the star (ÁR_000): opens the new-alert form for this instrument.
function renderAppbarActions() {
  const bell = el("a", "top-appbar-icon-button");
  bell.href = "../alert-new/alert-new.html?ticker=" + encodeURIComponent(ticker);
  bell.setAttribute("aria-label", t("alerts.add"));
  bell.appendChild(window.iconModule.renderIcon("price-alert"));
  const group = el("div", "product-appbar-actions");
  group.append(bell, renderFavoriteButton());
  return group;
}

// --- Header ---------------------------------------------------------------------

function formatAbsoluteChange() {
  const diff = instrument.price - instrument.prevClose;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "";
  const decimals = instrument.unit === "HUF" ? 0 : 2;
  const suffix = instrument.unit === "HUF" ? " Ft" : instrument.unit === "pct" ? " pp" : "";
  return `${sign}${money.formatNumber(diff, decimals)}${suffix}`;
}

function paintHeader() {
  const change = window.storage.getChangePercent(instrument);
  const direction = directionOf(change);
  const changeRow = el("div", "product-change");
  const pill = el("span", `product-change-pill product-change--${direction}`);
  if (direction !== "flat") {
    const arrow = window.iconModule.renderIcon(direction === "up" ? "arrow-up" : "arrow-down");
    arrow.classList.add("product-change-icon");
    pill.appendChild(arrow);
  }
  pill.appendChild(document.createTextNode(`${formatAbsoluteChange()} (${money.formatPercent(change)})`));
  changeRow.append(pill, el("span", "product-change-note", t("product.since_close")));

  const price = el("span", "product-price");
  window.motion.countUp(price, instrument.price, (value) => money.formatPrice(value, instrument.unit), {
    fromRatio: 0.985,
  });
  els.header.replaceChildren(
    el("p", "product-name", instrument.name),
    price,
    changeRow,
    el("p", "product-feed", t(instrument.delayed ? "product.delayed" : "product.realtime")),
  );
  window.motion.fadeIn(els.header);
}

// --- Chart ------------------------------------------------------------------------

// Every chart in the real app is a TradingView chart (see CLAUDE.md), so the
// page only uses what the chart module offers: line/candle and time ranges.
function paintChart() {
  els.chart.replaceChildren(window.chartModule.renderChart({ instrument, range: "1m", type: "line", height: 220, markers }));
  window.motion.fadeIn(els.chart);
}

// --- Buy / sell: broker redirect (TA_000) -----------------------------------------

function showBrokerSheet(action) {
  const content = el("div");
  content.appendChild(el("p", "product-broker-hint", t("product.broker_hint")));
  const list = el("ul", "product-broker-list");
  window.storage.getBrokers().forEach((broker) => {
    const link = el("a", "product-broker-link");
    link.href = broker.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(el("span", "", broker.name), window.iconModule.renderIcon("link"));
    // Measurable redirect (TA_000): the tap is counted per broker, then the
    // browser opens the broker's site.
    link.addEventListener("click", () => {
      window.storage.logBrokerClick(broker.id, ticker, action);
      window.toastModule.showToast({ message: t("product.broker_redirect").replace("{broker}", broker.name), icon: "link" });
    });
    const item = el("li");
    item.appendChild(link);
    list.appendChild(item);
  });
  content.appendChild(list);
  window.bottomSheetModule.showBottomSheet({ title: t(`product.broker_sheet_${action}`), content });
}

function paintActions() {
  // Indexes are not tradable directly, so there is nothing to buy or sell.
  if (instrument.category === "index") {
    els.actions.replaceChildren();
    return;
  }
  els.actions.replaceChildren(
    window.buttonModule.renderButton({ label: t("product.buy"), variant: "primary", onClick: () => showBrokerSheet("buy") }),
    window.buttonModule.renderButton({ label: t("product.sell"), variant: "outline", onClick: () => showBrokerSheet("sell") }),
  );
}

// --- Tab panels ----------------------------------------------------------------------

function dayRange() {
  return shared.rangeTrack({
    low: instrument.dayLow,
    high: instrument.dayHigh,
    value: instrument.price,
    caption: t("product.day_range"),
    format: (value) => money.formatPrice(value, instrument.unit),
  });
}

// Table of TA_001–TA_007: indexes have no order book and no turnover.
function keyFacts() {
  const facts = el("dl", "product-facts");
  if (instrument.category === "index") {
    facts.append(shared.fact(t("product.prev_close"), money.formatPrice(instrument.prevClose, instrument.unit)), dayRange());
    return facts;
  }
  const hasBook = instrument.bid !== null;
  facts.append(
    shared.fact(t("product.bid"), hasBook ? money.formatPrice(instrument.bid, instrument.unit) : null),
    shared.fact(t("product.ask"), hasBook ? money.formatPrice(instrument.ask, instrument.unit) : null),
    shared.fact(t("product.prev_close"), money.formatPrice(instrument.prevClose, instrument.unit)),
    dayRange(),
    shared.fact(t("product.turnover"), instrument.turnover ? money.formatCompactMoney(instrument.turnover) : null),
    shared.fact(t("product.quantity"), instrument.quantity ? money.formatNumber(instrument.quantity, 0) : null),
  );
  return facts;
}

function periodChange(range) {
  const series = window.storage.getPriceSeries(ticker, range);
  if (!series.length) return null;
  return ((series[series.length - 1].c - series[0].o) / series[0].o) * 100;
}

function performance() {
  const grid = el("div", "product-performance");
  PERFORMANCE_RANGES.forEach((range) => {
    const value = periodChange(range);
    const item = el("div", "product-performance-item");
    item.appendChild(el("span", "product-performance-label", t(`chart.range_${range}`)));
    const number = el("span", `product-performance-value product-change--${directionOf(value)}`);
    number.appendChild(value === null ? valueNode(null) : document.createTextNode(money.formatPercent(value)));
    item.appendChild(number);
    grid.appendChild(item);
  });
  return grid;
}

// Split / dividend dates and ratios, only listed when there was one (TA_001).
function corporateEvents() {
  const rows = markers.map((marker) => {
    const label = `${t(`chart.marker_${marker.type}`)} · ${shared.formatDate(new Date(marker.t).toISOString())}`;
    const value = marker.type === "dividend" ? `${money.formatMoney(marker.value)}${t("product.per_share")}` : marker.ratio;
    return [label, value];
  });
  const block = el("div");
  block.append(shared.factList(rows), shared.note(t("product.marker_legend")));
  return shared.section(t("product.section_events"), block);
}

function tradingPanel() {
  const fragment = document.createDocumentFragment();
  if (detail.beta) {
    fragment.appendChild(window.bannerModule.renderBanner({ text: t("product.beta_delay"), variant: "info", icon: "clock" }));
  }
  if (instrument.category === "other") {
    fragment.appendChild(window.productTypes.derivativeSection(detail));
    return fragment;
  }
  fragment.append(shared.section(t("product.section_key"), keyFacts()), shared.section(t("product.section_performance"), performance()));
  if (markers.length) fragment.appendChild(corporateEvents());
  return fragment;
}

function buildPanel(tabId) {
  const shareTabs = window.productShareTabs;
  switch (tabId) {
    case "financials":
      return shareTabs.financialsPanel(detail);
    case "valuation":
      return shareTabs.valuationPanel(detail);
    case "analysis":
      return shareTabs.analysisPanel(detail, instrument, window.productDisclosures.openDocument);
    case "issuer":
      return instrument.category === "share"
        ? shareTabs.issuerPanel(detail)
        : window.productTypes.specsPanel(detail, `issuer.about_${instrument.category}`);
    case "specs":
      return window.productTypes.specsPanel(detail, `issuer.about_${instrument.category}`);
    case "composition":
      return window.productTypes.compositionPanel(detail);
    case "disclosures":
      return window.productDisclosures.disclosuresPanel(ticker);
    default:
      return tradingPanel();
  }
}

function paintPanel(tabId) {
  els.panel.replaceChildren(buildPanel(tabId));
  window.motion.fadeIn(els.panel);
}

// The analysis tab only exists where there is BÉT-supported coverage (TA_0015).
function tabIds() {
  if (detail.beta) return ["trading"];
  return TABS_BY_CATEGORY[instrument.category].filter((id) => id !== "analysis" || detail.analysis);
}

// Deep links (home disclosures, notifications K_005): ?tab=disclosures opens that
// tab, &doc=<id> also opens the notified disclosure.
function openLinkedDocument() {
  const docId = params.get("doc");
  const doc = docId && window.storage.getProductDisclosures(ticker).find((item) => item.id === docId);
  if (doc) window.productDisclosures.openDocument(doc);
}

function paintTabs() {
  const ids = tabIds();
  const startTab = ids.includes(params.get("tab")) ? params.get("tab") : "trading";
  if (ids.length < 2) {
    els.tabs.replaceChildren();
    paintPanel("trading");
    return;
  }
  els.tabs.replaceChildren(
    window.chipsModule.renderChips({
      items: ids.map((id) => ({ id, label: t(`product.tab_${id}`) })),
      variant: "chips",
      activeId: startTab,
      ariaLabel: t("product.tabs"),
      onChange: paintPanel,
    }),
  );
  paintPanel(startTab);
  if (startTab === "disclosures") openLinkedDocument();
}

// --- Loading / error / not found ---------------------------------------------------

function clearSections() {
  [els.header, els.chart, els.actions, els.tabs, els.panel].forEach((node) => node.replaceChildren());
}

function showSkeleton() {
  clearSections();
  els.panel.setAttribute("aria-busy", "true");
  els.header.appendChild(window.skeletonModule.renderSkeleton("product-skeleton-header"));
  els.chart.appendChild(window.skeletonModule.renderSkeleton("product-skeleton-chart"));
  els.panel.appendChild(window.skeletonModule.renderSkeleton("product-skeleton-panel"));
}

function showState(stateView) {
  clearSections();
  els.panel.removeAttribute("aria-busy");
  els.panel.appendChild(stateView);
}

function showError() {
  showState(
    window.stateViewModule.renderStateView({
      variant: "error",
      title: t("state.error_title"),
      message: t("state.error_message"),
      actionLabel: t("state.retry"),
      onAction: load,
    }),
  );
}

function showNotFound() {
  showState(
    window.stateViewModule.renderStateView({
      title: t("product.not_found_title"),
      message: t("product.not_found_message"),
      actionLabel: t("product.back_to_market"),
      onAction: () => {
        window.location.href = "../market/market.html";
      },
    }),
  );
}

function paintPage() {
  if (!instrument || forceEmpty) {
    showNotFound();
    return;
  }
  els.panel.removeAttribute("aria-busy");
  clearSections();
  paintHeader();
  paintChart();
  paintActions();
  paintTabs();
}

function load() {
  showSkeleton();
  window.mockNetwork
    .request(`product-${ticker}`, () => instrument)
    .then(paintPage)
    .catch(showError);
}

// --- Page chrome -------------------------------------------------------------------

function goBack() {
  if (document.referrer) window.pageTransition.back();
  else window.pageTransition.backTo("../market/market.html");
}

document.getElementById("product-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: instrument ? instrument.ticker : t("product.title"),
    onBack: goBack,
    right: instrument ? renderAppbarActions() : undefined,
  }),
);
load();
if (!instrument || instrument.delayed) {
  els.disclaimer.appendChild(window.bannerModule.renderPriceNotices());
}
document.getElementById("product-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("market"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

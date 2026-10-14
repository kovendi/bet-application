window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

const TABS_SHARE = ["trading", "financials", "valuation", "issuer", "disclosures", "analysis"];
const PERFORMANCE_RANGES = ["1w", "1m", "3m", "1y", "5y"];

const params = new URLSearchParams(window.location.search);
const ticker = params.get("ticker") || "OTP";
const instrument = window.storage.getInstrument(ticker);
const forceEmpty = window.mockNetwork.isEmptyMock();

const els = {
  header: document.getElementById("product-header"),
  chart: document.getElementById("product-chart"),
  actions: document.getElementById("product-actions"),
  tabs: document.getElementById("product-tabs"),
  panel: document.getElementById("product-panel"),
  disclaimer: document.getElementById("product-disclaimer"),
};

function directionOf(value) {
  return value > 0 ? "up" : value < 0 ? "down" : "flat";
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// TA_000 proposal: a missing value shows "–" with a visually quiet style, and
// the screen reader reads "Nincs adat".
function valueNode(value) {
  if (value !== null && value !== undefined && value !== 0) return document.createTextNode(value);
  const missing = el("span", "product-fact-missing", "–");
  missing.setAttribute("aria-label", t("product.no_data"));
  return missing;
}

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
  const changeRow = el("div", `product-change product-change--${directionOf(change)}`);
  changeRow.append(
    el("span", "", `${formatAbsoluteChange()} (${money.formatPercent(change)})`),
    el("span", "product-change-note", t("product.since_close")),
  );
  els.header.replaceChildren(
    el("p", "product-name", instrument.name),
    el("span", "product-price", money.formatPrice(instrument.price, instrument.unit)),
    changeRow,
    el("p", "product-feed", t(instrument.delayed ? "product.delayed" : "product.realtime")),
  );
  window.motion.fadeIn(els.header);
}

// --- Chart ------------------------------------------------------------------------

// Every chart in the real app is a TradingView chart (see CLAUDE.md), so the
// page only uses what the chart module offers: line/candle and time ranges.
function paintChart() {
  els.chart.replaceChildren(window.chartModule.renderChart({ instrument, range: "1m", type: "line", height: 220 }));
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

function fact(labelKey, value) {
  const row = el("div", "product-fact");
  const label = el("dt", "", t(labelKey));
  const data = el("dd");
  data.appendChild(valueNode(value));
  row.append(label, data);
  return row;
}

function dayRange() {
  const wrap = el("div", "product-range");
  const labels = el("div", "product-range-labels");
  labels.append(
    el("span", "", money.formatPrice(instrument.dayLow, instrument.unit)),
    el("span", "product-range-caption", t("product.day_range")),
    el("span", "", money.formatPrice(instrument.dayHigh, instrument.unit)),
  );
  const track = el("div", "product-range-track");
  const span = instrument.dayHigh - instrument.dayLow;
  const position = span > 0 ? ((instrument.price - instrument.dayLow) / span) * 100 : 50;
  const marker = el("span", "product-range-marker");
  marker.style.setProperty("--range-position", `${Math.min(100, Math.max(0, position))}%`);
  track.appendChild(marker);
  wrap.append(labels, track);
  return wrap;
}

function keyFacts() {
  const facts = el("dl", "product-facts");
  const hasBook = instrument.bid !== null;
  facts.append(
    fact("product.bid", hasBook ? money.formatPrice(instrument.bid, instrument.unit) : null),
    fact("product.ask", hasBook ? money.formatPrice(instrument.ask, instrument.unit) : null),
    fact("product.prev_close", money.formatPrice(instrument.prevClose, instrument.unit)),
    dayRange(),
    fact("product.turnover", instrument.turnover ? money.formatCompactMoney(instrument.turnover) : null),
    fact("product.quantity", instrument.quantity ? money.formatNumber(instrument.quantity, 0) : null),
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
    const number = el("span", `product-performance-value product-change--${directionOf(value)}`, value === null ? "–" : money.formatPercent(value));
    item.appendChild(number);
    grid.appendChild(item);
  });
  return grid;
}

function section(titleKey, content) {
  const wrap = el("div");
  wrap.append(el("h2", "product-section-title", t(titleKey)), content);
  return wrap;
}

function tradingPanel() {
  const fragment = document.createDocumentFragment();
  fragment.append(section("product.section_key", keyFacts()), section("product.section_performance", performance()));
  return fragment;
}

// The other tabs get their content in phase 2.
function comingSoonPanel() {
  return window.stateViewModule.renderStateView({
    title: t("product.soon_title"),
    message: t("product.soon_message"),
  });
}

function paintPanel(tabId) {
  els.panel.replaceChildren(tabId === "trading" ? tradingPanel() : comingSoonPanel());
  window.motion.fadeIn(els.panel);
}

function paintTabs() {
  if (instrument.category !== "share") {
    els.tabs.replaceChildren();
    paintPanel("trading");
    return;
  }
  els.tabs.replaceChildren(
    window.chipsModule.renderChips({
      items: TABS_SHARE.map((id) => ({ id, label: t(`product.tab_${id}`) })),
      variant: "chips",
      activeId: "trading",
      ariaLabel: t("product.tabs"),
      onChange: paintPanel,
    }),
  );
  paintPanel("trading");
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
  if (document.referrer) window.history.back();
  else window.location.href = "../market/market.html";
}

document.getElementById("product-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: instrument ? instrument.ticker : t("product.title"),
    onBack: goBack,
    right: instrument ? renderFavoriteButton() : undefined,
  }),
);
load();
if (!instrument || instrument.delayed) {
  els.disclaimer.appendChild(window.bannerModule.renderDelayedDisclaimer());
}
document.getElementById("product-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("market"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

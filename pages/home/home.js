window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

const productHref = (instrument) => "../product/product.html?ticker=" + encodeURIComponent(instrument.ticker);

// Top bar: simplified logo on the left (graphic element), menu button is built in.
const logo = document.createElement("img");
logo.src = "../../assets/logo-bet-simple.png";
logo.alt = t("app.name");
logo.className = "home-logo";
document.getElementById("home-top-appbar").appendChild(window.topAppbarModule.renderTopAppbar({ left: logo }));

document.getElementById("home-market-status").appendChild(window.marketStatusModule.renderMarketStatus());

// --- Feed sections -----------------------------------------------------------

function renderSection(titleKey, ...children) {
  const section = document.createElement("section");
  section.className = "home-section";
  if (titleKey) {
    const title = document.createElement("h2");
    title.className = "home-section-title";
    title.textContent = t(titleKey);
    section.appendChild(title);
  }
  section.append(...children);
  return section;
}

function directionOf(change) {
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

function renderChange(instrument) {
  const change = window.storage.getChangePercent(instrument);
  const delta = document.createElement("span");
  delta.className = `home-change home-change--${directionOf(change)}`;
  delta.textContent = money.formatPercent(change);
  return delta;
}

function renderText(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

// Overview (NYÁ_001–NYÁ_005): one big main card + horizontally scrollable small
// cards. Default: BUX, CETOP NTR, BUMIX and 4 blue chips, max 8. Tapping a small
// card promotes it to the main card.
const OVERVIEW_TICKERS = ["BUX", "CETOP NTR", "BUMIX", "OTP", "MOL", "RICHTER", "MTELEKOM"];
let mainTicker = OVERVIEW_TICKERS[0];

function renderMainCard(instrument) {
  const series = window.storage.getPriceSeries(instrument.ticker, "1m");

  const card = document.createElement("a");
  card.className = "home-main-card";
  card.href = productHref(instrument);
  card.setAttribute("aria-label", `${instrument.ticker} – ${t("home.details")}`);

  const info = document.createElement("div");
  info.className = "home-main-info";
  info.append(
    renderText("span", "home-main-name", instrument.ticker),
    renderText("span", "home-main-sub", instrument.name),
    renderText("span", "home-main-price", money.formatPrice(instrument.price, instrument.unit)),
    renderChange(instrument),
  );

  const spark = window.sparklineModule.renderSparkline({ values: series.map((c) => c.c), width: 120, height: 56 });
  card.append(info, spark);
  return card;
}

function renderSmallCard(instrument, onSelect) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "home-small-card";
  card.append(
    renderText("span", "home-small-name", instrument.ticker),
    renderText("span", "home-small-price", money.formatPrice(instrument.price, instrument.unit)),
    renderChange(instrument),
  );
  card.addEventListener("click", () => onSelect(instrument.ticker));
  return card;
}

function renderOverview() {
  const overview = document.createElement("div");

  function paint() {
    const mainCard = renderMainCard(window.storage.getInstrument(mainTicker));
    const strip = document.createElement("div");
    strip.className = "home-small-strip";
    OVERVIEW_TICKERS.filter((ticker) => ticker !== mainTicker).forEach((ticker) =>
      strip.appendChild(renderSmallCard(window.storage.getInstrument(ticker), select)),
    );
    overview.replaceChildren(mainCard, strip);
    return mainCard;
  }

  function select(ticker) {
    mainTicker = ticker;
    window.motion.fadeIn(paint());
  }

  paint();
  return overview;
}

// Latest 5 issuer disclosures (NYK_001–NYK_003).
function renderDisclosureRow(item) {
  const row = document.createElement("a");
  row.className = "home-disclosure";
  row.href = "../product/product.html?ticker=" + encodeURIComponent(item.ticker) + "&tab=disclosures";
  row.append(
    renderText("span", "home-disclosure-head", `${item.ticker} · ${item.category}`),
    renderText("span", "home-disclosure-title", item.title),
    renderText("span", "home-disclosure-date", item.date.replace(/-/g, ".") + "."),
  );
  return row;
}

function renderDisclosures(items) {
  if (items.length === 0) {
    return window.stateViewModule.renderStateView({
      title: t("home.disclosures_empty_title"),
      message: t("home.disclosures_empty_message"),
      actionLabel: t("state.refresh"),
      onAction: loadFeed,
    });
  }
  const list = document.createElement("div");
  items.forEach((item) => list.appendChild(renderDisclosureRow(item)));
  return list;
}

// --- Loading / loaded / error ------------------------------------------------

const feedEl = document.getElementById("home-feed");
const skeleton = (...classNames) => window.skeletonModule.renderSkeleton(...classNames);

function repeat(count, build) {
  return Array.from({ length: count }, build);
}

// Mirrors the loaded layout block for block, so nothing jumps on arrival.
function showSkeleton() {
  feedEl.setAttribute("aria-busy", "true");
  const strip = document.createElement("div");
  strip.className = "home-small-strip";
  strip.append(...repeat(4, () => skeleton("home-skeleton-small")));

  feedEl.replaceChildren(
    renderSection("home.overview", skeleton("home-skeleton-main"), strip),
    renderSection(null, skeleton("home-skeleton-carousel")),
    renderSection("home.toplists", skeleton("home-skeleton-segmented"), ...repeat(5, () => skeleton("home-skeleton-row"))),
    renderSection("home.disclosures", ...repeat(3, () => skeleton("home-skeleton-disclosure"))),
  );
}

function showFeed({ carouselItems, shares, disclosures }) {
  feedEl.removeAttribute("aria-busy");
  feedEl.replaceChildren(
    renderSection("home.overview", renderOverview()),
    renderSection(null, window.carouselModule.renderCarousel({ items: carouselItems })),
    renderSection("home.toplists", window.toplistModule.renderToplist({ instruments: shares, hrefFor: productHref })),
    renderSection("home.disclosures", renderDisclosures(disclosures)),
  );
  window.motion.fadeIn(feedEl);
}

function showError() {
  feedEl.removeAttribute("aria-busy");
  feedEl.replaceChildren(
    window.stateViewModule.renderStateView({
      variant: "error",
      title: t("state.error_title"),
      message: t("state.error_message"),
      actionLabel: t("state.retry"),
      onAction: loadFeed,
    }),
  );
}

function loadFeed() {
  showSkeleton();
  window.mockNetwork
    .request("home-feed", () => ({
      carouselItems: window.storage.getCarouselItems(),
      shares: window.storage.getInstruments("share"),
      disclosures: window.mockNetwork.isEmptyMock() ? [] : window.storage.getDisclosures().slice(0, 5),
    }))
    .then(showFeed)
    .catch(showError);
}

loadFeed();

document.getElementById("home-disclaimer").appendChild(window.bannerModule.renderDelayedDisclaimer());

document.getElementById("home-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("home"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

const homeEditLink = document.querySelector(".home-edit-link");
homeEditLink.setAttribute("aria-label", t("home.edit"));
homeEditLink.appendChild(window.iconModule.renderIcon("reorder"));

const productHref = (instrument) => "../product/product.html?ticker=" + encodeURIComponent(instrument.ticker);

// Bell with an unread dot, next to the menu button (K_005, ÁR_0051).
function renderNotificationsLink() {
  const link = document.createElement("a");
  link.className = "top-appbar-icon-button home-bell";
  link.href = "../notifications/notifications.html";
  link.setAttribute("aria-label", t("notifications.bell_label"));
  link.appendChild(window.iconModule.renderIcon("bell"));
  const user = window.storage.getCurrentUser();
  if (user && window.storage.getNotifications(user.id).some((n) => !n.read)) {
    const dot = document.createElement("span");
    dot.className = "home-bell-dot";
    dot.setAttribute("role", "img");
    dot.setAttribute("aria-label", t("notifications.unread"));
    link.appendChild(dot);
  }
  return link;
}

// Top bar: simplified logo on the left (graphic element), menu button is built in.
const logo = document.createElement("img");
logo.src = "../../assets/logo-bet-simple.png";
logo.alt = t("app.name");
logo.className = "home-logo";
// The bar is navy and runs straight into the brand hero band below it.
document
  .getElementById("home-top-appbar")
  .appendChild(window.topAppbarModule.renderTopAppbar({ left: logo, right: renderNotificationsLink(), tone: "brand" }));

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

// Hero pill: arrow + signed percent, then the absolute move "today".
function renderChangePill(instrument) {
  const change = window.storage.getChangePercent(instrument);
  const direction = directionOf(change);
  const pill = document.createElement("span");
  pill.className = `home-change-pill home-change-pill--${direction}`;
  if (direction !== "flat") {
    const arrow = window.iconModule.renderIcon(direction === "up" ? "arrow-up" : "arrow-down");
    arrow.classList.add("home-change-pill-icon");
    pill.appendChild(arrow);
  }
  pill.appendChild(document.createTextNode(money.formatPercent(change)));

  const delta = instrument.price - instrument.prevClose;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const absolute =
    instrument.unit === "HUF"
      ? money.formatMoney(delta, { sign })
      : sign + money.formatNumber(delta, 2);
  const wrap = document.createElement("span");
  wrap.className = "home-change-row";
  wrap.append(pill, renderText("span", "home-change-today", `${absolute} ${t("home.today")}`));
  return wrap;
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
const currentUser = window.storage.getCurrentUser();
const OVERVIEW_TICKERS = window.storage.getHomeCards(currentUser && currentUser.id);
let mainTicker = OVERVIEW_TICKERS[0];

function renderMainCard(instrument) {
  const card = document.createElement("a");
  card.className = "home-main-card";
  card.href = productHref(instrument);
  card.setAttribute("aria-label", `${instrument.ticker} – ${t("home.details")}`);

  const head = document.createElement("div");
  head.className = "home-main-head";
  head.append(
    renderText("span", "home-main-name", instrument.ticker),
    renderText("span", "home-main-sub", instrument.name),
  );

  const price = renderText("span", "home-main-price", "");
  window.motion.countUp(price, instrument.price, (value) => money.formatPrice(value, instrument.unit));

  // Fixed viewBox, stretched to the card width by CSS.
  const spark = window.sparklineModule.renderSparkline({
    values: window.storage.getDayCurve(instrument.ticker),
    width: 320,
    height: 64,
    area: true,
    animate: true,
    endDot: true,
  });
  spark.classList.add("home-main-spark");
  spark.setAttribute("preserveAspectRatio", "none");

  card.append(head, price, renderChangePill(instrument), spark);
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
  overview.className = "home-overview-body";

  function paint() {
    const mainCard = renderMainCard(window.storage.getInstrument(mainTicker));
    const strip = document.createElement("div");
    strip.className = "home-small-strip";
    OVERVIEW_TICKERS.filter((ticker) => ticker !== mainTicker).forEach((ticker) =>
      strip.appendChild(renderSmallCard(window.storage.getInstrument(ticker), select)),
    );
    overview.replaceChildren(mainCard, strip);
    window.motion.stagger(strip);
    return mainCard;
  }

  function select(ticker) {
    mainTicker = ticker;
    window.motion.fadeIn(paint());
  }

  paint();
  return overview;
}

// Favorites on the home page (tender 4) show the first FAVORITES_LIMIT items; the full,
// sortable list is the Favorites page. Registered-only (K_000), so a guest gets the
// same box with a registration CTA.
const FAVORITES_LIMIT = 4;

function renderFavoritesEmpty(isGuest) {
  const goToSearch = () => window.pageTransition.go("../search/search.html");
  const view = window.stateViewModule.renderStateView({
    icon: "star",
    title: t("home.favorites_empty_title"),
    message: t(isGuest ? "home.favorites_guest_message" : "home.favorites_empty_message"),
    actionLabel: t(isGuest ? "home.favorites_guest_action" : "home.favorites_empty_action"),
    onAction: isGuest ? () => window.bottomSheetModule.showRegistrationRequired() : goToSearch,
  });
  view.classList.add("home-fav-empty");
  return view;
}

function renderFavoriteRow(instrument, list, section) {
  const row = document.createElement("div");
  row.className = "home-fav-row";
  row.appendChild(
    window.priceRowModule.renderPriceRow({
      instrument,
      href: productHref(instrument),
      favorite: true,
      onFavoriteToggle: (inst) => {
        window.storage.toggleFavorite(currentUser.id, inst.ticker);
        window.toastModule.showToast({ message: t("favorites.removed"), icon: "check" });
        window.motion.playOut(row, "home-fav-row--leaving", () => {
          row.remove();
          if (list.children.length === 0) section.replaceWith(renderFavoritesSection());
        });
        return true;
      },
    }),
  );
  return row;
}

function renderFavoritesSection() {
  const section = document.createElement("section");
  section.className = "home-section";
  const head = document.createElement("div");
  head.className = "home-section-head";
  head.appendChild(renderText("h2", "home-section-title", t("home.favorites")));
  section.appendChild(head);

  const favorites = currentUser
    ? window.storage
        .getFavorites(currentUser.id)
        .map((ticker) => window.storage.getInstrument(ticker))
        .filter(Boolean)
    : [];
  if (favorites.length === 0 || window.mockNetwork.isEmptyMock()) {
    section.appendChild(renderFavoritesEmpty(!currentUser));
    return section;
  }

  const all = renderText("a", "home-section-link", t("home.favorites_all"));
  all.href = "../favorites/favorites.html";
  head.appendChild(all);
  const list = document.createElement("div");
  favorites.slice(0, FAVORITES_LIMIT).forEach((instrument) => list.appendChild(renderFavoriteRow(instrument, list, section)));
  section.appendChild(list);
  return section;
}

// Latest 5 issuer disclosures (NYK_001–NYK_003).
function renderDisclosureRow(item) {
  const row = document.createElement("a");
  row.className = "home-disclosure";
  row.href = "../product/product.html?ticker=" + encodeURIComponent(item.ticker) + "&tab=disclosures";
  const body = document.createElement("span");
  body.className = "home-disclosure-body";
  body.append(
    renderText("span", "home-disclosure-head", `${item.ticker} · ${item.category}`),
    renderText("span", "home-disclosure-title", item.title),
    renderText("span", "home-disclosure-date", item.date.replace(/-/g, ".") + "."),
  );
  const tile = renderText("span", "home-disclosure-tile", item.ticker.slice(0, 3));
  tile.setAttribute("aria-hidden", "true");
  row.append(tile, body);
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
const overviewEl = document.getElementById("home-overview");
const skeleton = (...classNames) => window.skeletonModule.renderSkeleton(...classNames);

function repeat(count, build) {
  return Array.from({ length: count }, build);
}

// Mirrors the loaded layout block for block, so nothing jumps on arrival.
function showSkeleton() {
  feedEl.setAttribute("aria-busy", "true");
  overviewEl.setAttribute("aria-busy", "true");
  const strip = document.createElement("div");
  strip.className = "home-small-strip";
  strip.append(...repeat(4, () => skeleton("home-skeleton-small")));
  overviewEl.replaceChildren(skeleton("home-skeleton-main"), strip);

  feedEl.replaceChildren(
    renderSection(null, skeleton("home-skeleton-carousel")),
    renderSection("home.favorites", ...repeat(2, () => skeleton("home-skeleton-row"))),
    renderSection("home.toplists", skeleton("home-skeleton-segmented"), ...repeat(5, () => skeleton("home-skeleton-row"))),
    renderSection("home.disclosures", ...repeat(3, () => skeleton("home-skeleton-disclosure"))),
  );
}

function showFeed({ carouselItems, shares, disclosures }) {
  feedEl.removeAttribute("aria-busy");
  overviewEl.removeAttribute("aria-busy");
  overviewEl.replaceChildren(renderOverview());
  window.motion.fadeIn(overviewEl);
  feedEl.replaceChildren(
    renderSection(null, window.carouselModule.renderCarousel({ items: carouselItems })),
    renderFavoritesSection(),
    renderSection(
      "home.toplists",
      window.toplistModule.renderToplist({ instruments: shares, hrefFor: productHref, sparkline: true }),
    ),
    renderSection("home.disclosures", renderDisclosures(disclosures)),
  );
  window.motion.stagger(feedEl);
}

function showError() {
  feedEl.removeAttribute("aria-busy");
  overviewEl.removeAttribute("aria-busy");
  overviewEl.replaceChildren();
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

document.getElementById("home-disclaimer").appendChild(window.bannerModule.renderPriceNotices());

document.getElementById("home-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("home"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

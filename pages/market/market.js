window.i18n.initI18n();
const t = window.i18n.t;

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

// TK_010: the list loads 20 items at a time and continues on scroll.
const PAGE_SIZE = 20;
const CATEGORY_IDS = ["all", "share", "index", "etf", "bond", "certificate", "other"];

// TK_003: ABC sorts by ticker; ties (equal turnover / change) fall back to ABC.
const byTicker = (a, b) => a.ticker.localeCompare(b.ticker, "hu");

const SORTERS = {
  abc: byTicker,
  turnover: (a, b) => b.turnover - a.turnover || byTicker(a, b),
  change: (a, b) => window.storage.getChangePercent(b) - window.storage.getChangePercent(a) || byTicker(a, b),
};

const CHANGE_FILTERS = {
  all: () => true,
  up: (instrument) => window.storage.getChangePercent(instrument) > 0,
  down: (instrument) => window.storage.getChangePercent(instrument) < 0,
};

const state = { category: "all", sort: "abc", change: "all", forceEmpty: window.mockNetwork.isEmptyMock() };

const listEl = document.getElementById("market-list");
const toolbarEl = document.getElementById("market-toolbar");
let observer = null;

const productHref = (instrument) => "../product/product.html?ticker=" + encodeURIComponent(instrument.ticker);

function matchingInstruments() {
  if (state.forceEmpty) return [];
  return window.storage
    .getInstruments(state.category === "all" ? undefined : state.category)
    .filter(CHANGE_FILTERS[state.change])
    .sort(SORTERS[state.sort]);
}

// --- Favorites: registered users only (K_000) ---------------------------------

function toggleFavorite(instrument) {
  const user = window.storage.getCurrentUser();
  if (!user) {
    window.bottomSheetModule.showRegistrationRequired();
    return false;
  }
  window.storage.toggleFavorite(user.id, instrument.ticker);
  return true;
}

function isFavorite(ticker) {
  const user = window.storage.getCurrentUser();
  return user ? window.storage.isFavorite(user.id, ticker) : false;
}

// --- List ----------------------------------------------------------------------

function renderRows(items) {
  const fragment = document.createDocumentFragment();
  items.forEach((instrument) => {
    fragment.appendChild(
      window.priceRowModule.renderPriceRow({
        instrument,
        href: productHref(instrument),
        favorite: isFavorite(instrument.ticker),
        onFavoriteToggle: toggleFavorite,
        meta: state.sort === "turnover" ? "turnover" : "name",
        sparkline: true,
      }),
    );
  });
  return fragment;
}

function stopObserving() {
  if (observer) observer.disconnect();
  observer = null;
}

function appendNextPage(items, sentinel) {
  const from = listEl.querySelectorAll(".price-row").length;
  const next = items.slice(from, from + PAGE_SIZE);
  const rows = renderRows(next);
  listEl.insertBefore(rows, sentinel);
  window.motion.stagger(Array.from(listEl.querySelectorAll(".price-row")).slice(from));
  if (from + next.length >= items.length) {
    stopObserving();
    sentinel.remove();
  }
}

function paintList() {
  stopObserving();
  const items = matchingInstruments();
  listEl.removeAttribute("aria-busy");
  toolbarEl.querySelector(".market-count").textContent = t("market.count").replace("{count}", items.length);

  if (items.length === 0) {
    listEl.replaceChildren(
      window.stateViewModule.renderStateView({
        title: t("market.empty_title"),
        message: t("market.empty_message"),
        actionLabel: t("market.reset"),
        onAction: resetAll,
      }),
    );
    return;
  }

  const sentinel = document.createElement("div");
  sentinel.className = "market-sentinel";
  listEl.replaceChildren(sentinel);
  appendNextPage(items, sentinel);
  window.motion.fadeIn(listEl);

  if (sentinel.isConnected) {
    observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && appendNextPage(items, sentinel),
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
  }
}

// --- Loading / error -------------------------------------------------------------

function showSkeleton() {
  stopObserving();
  listEl.setAttribute("aria-busy", "true");
  listEl.replaceChildren(
    ...Array.from({ length: 8 }, () => window.skeletonModule.renderSkeleton("market-skeleton-row")),
  );
}

function showError() {
  listEl.removeAttribute("aria-busy");
  listEl.replaceChildren(
    window.stateViewModule.renderStateView({
      variant: "error",
      title: t("state.error_title"),
      message: t("state.error_message"),
      actionLabel: t("state.retry"),
      onAction: load,
    }),
  );
}

function load() {
  showSkeleton();
  window.mockNetwork
    .request("market-list", matchingInstruments)
    .then(paintList)
    .catch(showError);
}

// --- Controls ----------------------------------------------------------------------

// Reloads without the ?mock= flag so the controls and the list start clean.
function resetAll() {
  window.location.href = window.location.pathname;
}

function renderSortFilterSheet() {
  const content = document.createElement("div");

  function group(labelKey, items, activeId, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "market-sheet-group";
    const label = document.createElement("p");
    label.className = "market-sheet-label";
    label.textContent = t(labelKey);
    wrap.append(
      label,
      window.chipsModule.renderChips({
        items: items.map((id) => ({ id, label: t(`${labelKey}.${id}`) })),
        variant: "bubble",
        activeId,
        ariaLabel: t(labelKey),
        onChange,
      }),
    );
    return wrap;
  }

  content.append(
    // Indexes have no turnover, so "Forgalom" is not offered for them (TK_003).
    group("market.sort", state.category === "index" ? ["abc", "change"] : ["abc", "turnover", "change"], state.sort, (id) => {
      state.sort = id;
      paintList();
    }),
    group("market.change", ["all", "up", "down"], state.change, (id) => {
      state.change = id;
      paintList();
    }),
  );
  window.bottomSheetModule.showBottomSheet({ title: t("market.sheet_title"), content });
}

function renderToolbar() {
  const count = document.createElement("span");
  count.className = "market-count";
  count.setAttribute("aria-live", "polite");
  const actions = document.createElement("div");
  actions.className = "market-toolbar-actions";
  actions.appendChild(
    window.textButtonModule.renderTextButton({
      label: t("market.sort_filter"),
      icon: "filter",
      onClick: renderSortFilterSheet,
    }),
  );
  toolbarEl.append(count, actions);
}

function renderControls() {
  document.getElementById("market-categories").appendChild(
    window.chipsModule.renderChips({
      items: CATEGORY_IDS.map((id) => ({ id, label: t(`category.${id}`) })),
      variant: "chips",
      activeId: state.category,
      ariaLabel: t("market.categories"),
      onChange: (id) => {
        state.category = id;
        // Indexes have no turnover: fall back to ABC (TK_003).
        if (id === "index" && state.sort === "turnover") state.sort = "abc";
        paintList();
      },
    }),
  );
  renderToolbar();
}

// --- Page chrome ---------------------------------------------------------------------

// TK_006: the search lives on its own page; the bar only holds an icon button.
function renderSearchButton() {
  const link = document.createElement("a");
  link.className = "top-appbar-icon-button";
  link.href = "../search/search.html";
  link.setAttribute("aria-label", t("topbar.search"));
  link.appendChild(window.iconModule.renderIcon("search"));
  return link;
}

document.getElementById("market-top-appbar").appendChild(window.topAppbarModule.renderTopAppbar({ title: t("nav.market"), right: renderSearchButton() }));
renderControls();
load();
document.getElementById("market-disclaimer").appendChild(window.bannerModule.renderPriceNotices());
document.getElementById("market-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("market"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

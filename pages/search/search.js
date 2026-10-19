window.i18n.initI18n();
const t = window.i18n.t;

const resultsEl = document.getElementById("search-results");

const productHref = (instrument) => "../product/product.html?ticker=" + encodeURIComponent(instrument.ticker);

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

const byTicker = (a, b) => a.ticker.localeCompare(b.ticker, "hu");

function findMatches(query) {
  const needle = query.toLowerCase();
  return window.storage
    .getInstruments()
    .filter(
      (i) =>
        i.ticker.toLowerCase().includes(needle) ||
        i.name.toLowerCase().includes(needle) ||
        i.isin.toLowerCase().includes(needle),
    )
    .sort(byTicker);
}

// The list narrows with every keystroke. Under 2 characters (TK_006) the
// search field reports '' and a hint is shown instead of a list.
let hasResults = false;

function showState(titleKey, messageKey) {
  hasResults = false;
  resultsEl.replaceChildren(
    window.stateViewModule.renderStateView({ icon: "search", title: t(titleKey), message: t(messageKey) }),
  );
  window.motion.fadeIn(resultsEl);
}

function showResults(matches) {
  const rows = matches.map((instrument) =>
    window.priceRowModule.renderPriceRow({
      instrument,
      href: productHref(instrument),
      favorite: isFavorite(instrument.ticker),
      onFavoriteToggle: toggleFavorite,
    }),
  );
  resultsEl.replaceChildren(...rows);
  // Only the first appearance fades; while typing the list just updates in place.
  if (!hasResults) window.motion.fadeIn(resultsEl);
  hasResults = true;
}

function onSearch(query) {
  if (!query) return showState("search.hint_title", "search.hint_message");
  const matches = findMatches(query);
  if (matches.length === 0) return showState("search.empty_title", "search.empty_message");
  showResults(matches);
}

// Back goes to wherever the search was opened from.
const field = window.searchFieldModule.renderSearchField({
  id: "search-input",
  label: t("market.search_label"),
  placeholder: t("market.search_placeholder"),
  minChars: 2,
  onSearch,
});
field.classList.add("search-bar-field");

document.getElementById("search-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ onBack: () => window.pageTransition.back(), center: field, hideMenuButton: true }),
);

onSearch("");
document.getElementById("search-disclaimer").appendChild(window.bannerModule.renderPriceNotices());

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

// Focus once the field is in the DOM (the frame move above re-parents it).
document.getElementById("search-input").focus();

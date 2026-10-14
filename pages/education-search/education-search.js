window.i18n.initI18n();
const t = window.i18n.t;

// TK_006-style search for the knowledge base (EF_001): from 2 characters,
// matches title and topic.
const resultsEl = document.getElementById("education-search-results");
let hasResults = false;

function findMatches(query) {
  const needle = query.toLowerCase();
  return window.storage
    .getEducation()
    .filter((item) => item.title.toLowerCase().includes(needle) || item.topic.toLowerCase().includes(needle));
}

function showState(titleKey, messageKey) {
  hasResults = false;
  resultsEl.replaceChildren(
    window.stateViewModule.renderStateView({ icon: "search", title: t(titleKey), message: t(messageKey) }),
  );
  window.motion.fadeIn(resultsEl);
}

function onSearch(query) {
  if (!query) return showState("edu.search_hint_title", "edu.search_hint_message");
  const matches = findMatches(query);
  if (matches.length === 0) return showState("edu.empty_title", "edu.search_empty_message");
  resultsEl.replaceChildren(...matches.map(window.educationShared.renderRow));
  // Only the first appearance fades; while typing the list updates in place.
  if (!hasResults) window.motion.fadeIn(resultsEl);
  hasResults = true;
}

const field = window.searchFieldModule.renderSearchField({
  id: "education-search-input",
  label: t("edu.search_label"),
  placeholder: t("edu.search_placeholder"),
  minChars: 2,
  onSearch,
});
field.classList.add("education-search-field");

document.getElementById("education-search-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ onBack: () => history.back(), center: field, hideMenuButton: true }),
);

onSearch("");

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

// Focus once the field is in the DOM (the frame move above re-parents it).
document.getElementById("education-search-input").focus();

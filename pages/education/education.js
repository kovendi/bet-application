window.i18n.initI18n();
const t = window.i18n.t;

// EF_001: categorized, searchable (own page) knowledge base. The first axis is
// the format (all / articles / videos / quizzes), so every format has one fixed
// place; topic and level filter inside a format. "All" is a browsable hub.
const FORMAT_IDS = ["all", ...window.educationShared.FORMATS];
const LEVEL_IDS = ["all", "beginner", "intermediate", "advanced"];

const params = new URLSearchParams(window.location.search);
const state = {
  format: FORMAT_IDS.includes(params.get("format")) ? params.get("format") : "all",
  topic: "all",
  level: "all",
  forceEmpty: window.mockNetwork.isEmptyMock(),
  loaded: false,
};

const viewEl = document.getElementById("education-view");
const filtersEl = document.getElementById("education-filters");
const countEl = document.getElementById("education-count");
let formatControl = null;

const topics = ["all", ...new Set(window.storage.getEducation().map((item) => item.topic))];

function allItems() {
  return state.forceEmpty ? [] : window.storage.getEducation();
}

function formatItems() {
  return allItems().filter(
    (item) =>
      item.type === state.format &&
      (state.topic === "all" || item.topic === state.topic) &&
      (state.level === "all" || item.level === state.level),
  );
}

// Reloads without ?mock= and without filters.
function resetAll() {
  window.location.href = window.location.pathname;
}

function renderEmpty() {
  return window.stateViewModule.renderStateView({
    icon: "search",
    title: t("edu.empty_title"),
    message: t("edu.empty_message"),
    actionLabel: t("edu.reset"),
    onAction: resetAll,
  });
}

function paintHub() {
  const items = allItems();
  if (!items.length) {
    viewEl.replaceChildren(renderEmpty());
    window.motion.fadeIn(viewEl);
    return;
  }
  const hub = window.educationHub.renderHub(items, selectFormat);
  viewEl.replaceChildren(hub);
  window.motion.stagger(hub);
}

function paintFormat() {
  const items = formatItems();
  countEl.textContent = t(`edu.count_${state.format}`).replace("{count}", items.length);
  if (!items.length) {
    viewEl.replaceChildren(renderEmpty());
    window.motion.fadeIn(viewEl);
    return;
  }
  const list = document.createElement("div");
  list.className = "education-list";
  list.append(...items.map((item) => window.educationShared.renderRow(item, { showType: false })));
  viewEl.replaceChildren(list);
  window.motion.stagger(list);
}

function paintView() {
  if (!state.loaded) return;
  viewEl.removeAttribute("aria-busy");
  const isHub = state.format === "all";
  filtersEl.hidden = isHub;
  if (isHub) paintHub();
  else paintFormat();
}

// The format lives in the URL, so coming back from a detail page lands on the same view.
function rememberFormat() {
  const url = new URL(window.location.href);
  if (state.format === "all") url.searchParams.delete("format");
  else url.searchParams.set("format", state.format);
  window.history.replaceState(null, "", url);
}

function onFormatChange(format) {
  state.format = format;
  rememberFormat();
  (document.querySelector(".iphone-screen") || document.scrollingElement).scrollTo({ top: 0, behavior: "smooth" });
  if (format !== "all") window.motion.fadeIn(filtersEl);
  paintView();
}

// "See all" and the hero switch the segmented control itself, so its thumb slides too.
function selectFormat(format) {
  formatControl.querySelectorAll(".chips-item")[FORMAT_IDS.indexOf(format)].click();
}

function showSkeleton() {
  viewEl.setAttribute("aria-busy", "true");
  const blocks = state.format === "all" ? ["education-skeleton-hero"] : [];
  viewEl.replaceChildren(
    ...blocks.concat(Array(5).fill("education-skeleton-row")).map((name) => window.skeletonModule.renderSkeleton(name)),
  );
}

function showError() {
  viewEl.removeAttribute("aria-busy");
  viewEl.replaceChildren(
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
    .request("education-list", allItems)
    .then(() => {
      state.loaded = true;
      paintView();
    })
    .catch(showError);
}

function renderControls() {
  formatControl = window.chipsModule.renderChips({
    items: FORMAT_IDS.map((id) => ({ id, label: t(`edu.format_${id}`) })),
    variant: "segmented",
    activeId: state.format,
    ariaLabel: t("edu.formats"),
    onChange: onFormatChange,
  });
  document.getElementById("education-formats").appendChild(formatControl);

  document.getElementById("education-topics").appendChild(
    window.chipsModule.renderChips({
      items: topics.map((id) => ({ id, label: id === "all" ? t("edu.topic_all") : id })),
      variant: "chips",
      activeId: state.topic,
      ariaLabel: t("edu.topics"),
      onChange: (id) => {
        state.topic = id;
        paintView();
      },
    }),
  );

  document.getElementById("education-levels").appendChild(
    window.chipsModule.renderChips({
      items: LEVEL_IDS.map((id) => ({ id, label: t(id === "all" ? "edu.level_any" : `edu.level_${id}`) })),
      variant: "segmented",
      activeId: state.level,
      ariaLabel: t("edu.levels"),
      onChange: (id) => {
        state.level = id;
        paintView();
      },
    }),
  );
  filtersEl.hidden = state.format === "all";
}

// EF_005: the Részvényfutam hand-off sits under the content.
function renderFutam() {
  document.getElementById("education-futam").appendChild(
    window.menuListModule.renderMenuList([
      {
        items: [
          {
            icon: "sparkles",
            title: t("edu.futam_title"),
            description: t("edu.futam_message"),
            onSelect: window.educationShared.openFutam,
          },
        ],
      },
    ]),
  );
}

function renderSearchButton() {
  const link = document.createElement("a");
  link.className = "top-appbar-icon-button";
  link.href = "../education-search/education-search.html";
  link.setAttribute("aria-label", t("topbar.search"));
  link.appendChild(window.iconModule.renderIcon("search"));
  return link;
}

document.getElementById("education-top-appbar").appendChild(window.topAppbarModule.renderTopAppbar({ title: t("nav.education"), right: renderSearchButton() }));
renderControls();
renderFutam();
load();
document.getElementById("education-bottom-nav").appendChild(window.bottomNavModule.renderMainNav("education"));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

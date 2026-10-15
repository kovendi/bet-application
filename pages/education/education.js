window.i18n.initI18n();
const t = window.i18n.t;

// EF_001: searchable (own page, like the market), categorized (topic, level) knowledge base.
const LEVEL_IDS = ["all", "beginner", "advanced"];

const state = { topic: "all", level: "all", forceEmpty: window.mockNetwork.isEmptyMock() };

const listEl = document.getElementById("education-list");
const countEl = document.getElementById("education-count");

const topics = ["all", ...new Set(window.storage.getEducation().map((item) => item.topic))];

function matchingItems() {
  if (state.forceEmpty) return [];
  return window.storage.getEducation().filter(
    (item) =>
      (state.topic === "all" || item.topic === state.topic) &&
      (state.level === "all" || item.level === state.level),
  );
}

// Reloads without ?mock= and without filters.
function resetAll() {
  window.location.href = window.location.pathname;
}

function paintList() {
  const items = matchingItems();
  listEl.removeAttribute("aria-busy");
  countEl.textContent = t("edu.count").replace("{count}", items.length);

  if (items.length === 0) {
    listEl.replaceChildren(
      window.stateViewModule.renderStateView({
        icon: "search",
        title: t("edu.empty_title"),
        message: t("edu.empty_message"),
        actionLabel: t("edu.reset"),
        onAction: resetAll,
      }),
    );
    return;
  }
  listEl.replaceChildren(...items.map(window.educationShared.renderRow));
  window.motion.stagger(listEl);
}

function showSkeleton() {
  listEl.setAttribute("aria-busy", "true");
  listEl.replaceChildren(
    ...Array.from({ length: 6 }, () => window.skeletonModule.renderSkeleton("education-skeleton-row")),
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
  window.mockNetwork.request("education-list", matchingItems).then(paintList).catch(showError);
}

function renderControls() {
  document.getElementById("education-topics").appendChild(
    window.chipsModule.renderChips({
      items: topics.map((id) => ({ id, label: id === "all" ? t("edu.topic_all") : id })),
      variant: "chips",
      activeId: state.topic,
      ariaLabel: t("edu.topics"),
      onChange: (id) => {
        state.topic = id;
        paintList();
      },
    }),
  );

  document.getElementById("education-levels").appendChild(
    window.chipsModule.renderChips({
      items: LEVEL_IDS.map((id) => ({ id, label: t(`edu.level_${id}`) })),
      variant: "segmented",
      activeId: state.level,
      ariaLabel: t("edu.levels"),
      onChange: (id) => {
        state.level = id;
        paintList();
      },
    }),
  );
}

// EF_005: the Részvényfutam hand-off sits under the list.
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

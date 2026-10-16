window.i18n.initI18n();
const t = window.i18n.t;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();
const ticker = new URLSearchParams(window.location.search).get("ticker");
const instrument = ticker ? window.storage.getInstrument(ticker) : null;

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ title: t("notify.title"), onBack: () => window.pageTransition.back() }),
);

const TYPES = [
  { id: "reports", label: t("notify.type_reports") },
  { id: "extraordinary", label: t("notify.type_extraordinary") },
  { id: "ownership", label: t("notify.type_ownership") },
];

function renderHeader() {
  const header = document.createElement("div");
  header.className = "notify-issuer";
  const name = document.createElement("span");
  name.className = "notify-issuer-ticker";
  name.textContent = instrument.ticker;
  const sub = document.createElement("span");
  sub.className = "pers-note";
  sub.textContent = instrument.name;
  header.append(name, sub);
  return header;
}

function renderTypes(types, onChange) {
  const section = document.createElement("div");
  section.className = "notify-types";
  const title = document.createElement("h2");
  title.className = "pers-section-title";
  title.textContent = t("notify.types_title");
  const hint = document.createElement("p");
  hint.className = "pers-note";
  hint.textContent = t("notify.types_hint");
  section.append(
    title,
    window.chipsModule.renderChips({
      items: TYPES,
      variant: "bubble",
      multi: true,
      activeIds: types,
      ariaLabel: t("notify.types_title"),
      onChange,
    }),
    hint,
  );
  return section;
}

function showLoading() {
  contentEl.setAttribute("aria-busy", "true");
  contentEl.replaceChildren(
    window.skeletonModule.renderSkeleton("notify-skeleton-header"),
    window.skeletonModule.renderSkeleton("notify-skeleton-toggle"),
  );
}

function load() {
  showLoading();
  window.mockNetwork
    .request("favorite-notify", () => window.storage.getFavoriteNotify(user.id, instrument.ticker))
    .then(() => {
      contentEl.removeAttribute("aria-busy");
      render();
    })
    .catch(() => {
      contentEl.removeAttribute("aria-busy");
      contentEl.replaceChildren(
        window.stateViewModule.renderStateView({
          variant: "error",
          title: t("state.error_title"),
          message: t("state.error_message"),
          actionLabel: t("state.retry"),
          onAction: load,
        }),
      );
    });
}

function render() {
  const current = window.storage.getFavoriteNotify(user.id, instrument.ticker);
  let enabled = Boolean(current);
  let types = current ? current.types : [];
  const typesSlot = document.createElement("div");

  function save() {
    window.storage.setFavoriteNotify(user.id, instrument.ticker, enabled ? { types } : null);
  }

  function paintTypes() {
    if (!enabled) return typesSlot.replaceChildren();
    typesSlot.replaceChildren(
      renderTypes(types, (value) => {
        types = value;
        save();
      }),
    );
    window.motion.fadeIn(typesSlot);
  }

  const toggle = window.toggleModule.renderToggle({
    id: "notify-enabled",
    label: t("notify.toggle_title"),
    description: t("notify.toggle_description"),
    checked: enabled,
    onChange: (checked) => {
      enabled = checked;
      save();
      paintTypes();
      window.toastModule.showToast({ message: t(checked ? "notify.on" : "notify.off"), icon: "bell" });
    },
  });

  contentEl.replaceChildren(renderHeader(), toggle, typesSlot);
  paintTypes();
}

if (!user) {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "lock",
      title: t("registration_required.title"),
      message: t("registration_required.message"),
      actionLabel: t("registration_required.register_button"),
      onAction: () => window.bottomSheetModule.showRegistrationRequired(),
    }),
  );
} else if (!instrument) {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({ title: t("notify.unknown"), message: "", actionLabel: t("favorites.title"), onAction: () => window.pageTransition.back() }),
  );
} else {
  load();
}

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

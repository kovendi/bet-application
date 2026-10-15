window.i18n.initI18n();
const t = window.i18n.t;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();

const productHref = (instrument) => "../product/product.html?ticker=" + encodeURIComponent(instrument.ticker);

// Adding a favorite goes through the search page (K_001).
const goToSearch = () => {
  window.pageTransition.go("../search/search.html");
};

function renderAddButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "top-appbar-icon-button";
  button.setAttribute("aria-label", t("favorites.add"));
  button.appendChild(window.iconModule.renderIcon("plus"));
  button.addEventListener("click", goToSearch);
  return button;
}

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("favorites.title"),
    onBack: () => window.pageTransition.back(),
    right: renderAddButton(),
  }),
);

// --- Reordering (K_0011): pointer drag on the handle, arrow keys as fallback ---

function saveOrder(list) {
  const tickers = [...list.children].map((item) => item.dataset.ticker);
  window.storage.setFavorites(user.id, tickers);
  window.toastModule.showToast({ message: t("favorites.moved"), icon: "check" });
}

function startDrag(event, item, list) {
  event.preventDefault();
  const handle = event.currentTarget;
  handle.setPointerCapture(event.pointerId);
  item.classList.add("fav-item--dragging");

  function onMove(moveEvent) {
    const siblings = [...list.children].filter((el) => el !== item);
    const next = siblings.find((el) => {
      const box = el.getBoundingClientRect();
      return moveEvent.clientY < box.top + box.height / 2;
    });
    if (next !== item.nextElementSibling) list.insertBefore(item, next || null);
  }

  function onEnd() {
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onEnd);
    handle.removeEventListener("pointercancel", onEnd);
    item.classList.remove("fav-item--dragging");
    saveOrder(list);
  }

  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onEnd);
  handle.addEventListener("pointercancel", onEnd);
}

function moveByKey(event, item, list) {
  const target = event.key === "ArrowUp" ? item.previousElementSibling : event.key === "ArrowDown" ? item.nextElementSibling : null;
  if (!target) return;
  event.preventDefault();
  if (event.key === "ArrowUp") list.insertBefore(item, target);
  else list.insertBefore(target, item);
  event.currentTarget.focus();
  saveOrder(list);
}

function renderHandle(instrument, item, list) {
  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "fav-handle";
  handle.setAttribute("aria-label", t("favorites.drag_handle").replace("{name}", instrument.ticker));
  handle.appendChild(window.iconModule.renderIcon("menu"));
  handle.addEventListener("pointerdown", (event) => startDrag(event, item, list));
  handle.addEventListener("keydown", (event) => moveByKey(event, item, list));
  return handle;
}

function renderNotifyButton(instrument) {
  const active = Boolean(window.storage.getFavoriteNotify(user.id, instrument.ticker));
  const button = document.createElement("a");
  button.className = "fav-notify" + (active ? " fav-notify--active" : "");
  button.href = "../favorite-notify/favorite-notify.html?ticker=" + encodeURIComponent(instrument.ticker);
  button.setAttribute("aria-label", t("favorites.notify_button").replace("{name}", instrument.ticker));
  button.appendChild(window.iconModule.renderIcon("bell"));
  return button;
}

// Unfavoriting from the star removes the row after its exit animation.
function onStarToggle(instrument, wasFavorite, item, list) {
  window.storage.toggleFavorite(user.id, instrument.ticker);
  window.toastModule.showToast({ message: t("favorites.removed"), icon: "check" });
  window.motion.playOut(item, "fav-item--leaving", () => {
    item.remove();
    if (list.children.length === 0) renderEmpty();
  });
  return true;
}

function renderItem(instrument, list) {
  const item = document.createElement("div");
  item.className = "fav-item";
  item.dataset.ticker = instrument.ticker;
  const row = window.priceRowModule.renderPriceRow({
    instrument,
    href: productHref(instrument),
    favorite: true,
    meta: "turnover",
    onFavoriteToggle: (inst, was) => onStarToggle(inst, was, item, list),
  });
  item.append(renderHandle(instrument, item, list), row, renderNotifyButton(instrument));
  return item;
}

function renderEmpty() {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "star",
      title: t("favorites.empty_title"),
      message: t("favorites.empty_message"),
      actionLabel: t("favorites.empty_action"),
      onAction: goToSearch,
    }),
  );
  window.motion.fadeIn(contentEl);
}

function renderList() {
  const instruments = window.storage
    .getFavorites(user.id)
    .map((ticker) => window.storage.getInstrument(ticker))
    .filter(Boolean);
  if (instruments.length === 0) return renderEmpty();

  const list = document.createElement("div");
  list.className = "fav-list";
  instruments.forEach((instrument) => list.appendChild(renderItem(instrument, list)));

  const hint = document.createElement("p");
  hint.className = "pers-note";
  hint.textContent = t("favorites.reorder_hint");
  contentEl.replaceChildren(list, hint);
  window.motion.stagger(list);
}

function showLoading() {
  contentEl.setAttribute("aria-busy", "true");
  const rows = Array.from({ length: 5 }, () => window.skeletonModule.renderSkeleton("fav-skeleton-row"));
  contentEl.replaceChildren(...rows);
}

function load() {
  showLoading();
  window.mockNetwork
    .request("favorites", () => (window.mockNetwork.isEmptyMock() ? [] : window.storage.getFavorites(user.id)))
    .then((tickers) => {
      contentEl.removeAttribute("aria-busy");
      if (tickers.length === 0) return renderEmpty();
      renderList();
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

if (user) {
  load();
  document.getElementById("pers-disclaimer").appendChild(window.bannerModule.renderDelayedDisclaimer());
} else {
  // Favorites are registered-only (K_000).
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "lock",
      title: t("registration_required.title"),
      message: t("registration_required.message"),
      actionLabel: t("registration_required.register_button"),
      onAction: () => window.bottomSheetModule.showRegistrationRequired(),
    }),
  );
}

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

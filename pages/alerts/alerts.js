window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();
const NEW_ALERT_URL = "../alert-new/alert-new.html";

const fill = (key, values) => Object.keys(values).reduce((text, name) => text.replace(`{${name}}`, values[name]), t(key));

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ title: t("alerts.title"), onBack: () => window.pageTransition.back() }),
);

function renderAlertRow(alert, onDelete) {
  const instrument = window.storage.getInstrument(alert.ticker);
  const row = document.createElement("div");
  row.className = "alert-row";

  const arrow = window.iconModule.renderIcon(alert.direction === "up" ? "arrow-up" : "arrow-down");
  arrow.classList.add("alert-row-icon", `alert-row-icon--${alert.direction}`);

  const body = document.createElement("div");
  body.className = "alert-row-body";
  const head = document.createElement("span");
  head.className = "alert-row-ticker";
  head.textContent = alert.ticker;
  const detail = document.createElement("span");
  detail.className = "alert-row-detail";
  detail.textContent = `${t(alert.direction === "up" ? "alerts.up" : "alerts.down")}: ${money.formatPrice(alert.level, instrument.unit)}`;
  body.append(head, detail);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "alert-row-delete";
  remove.setAttribute("aria-label", fill("alerts.delete", { name: alert.ticker }));
  remove.appendChild(window.iconModule.renderIcon("trash"));
  remove.addEventListener("click", () => onDelete(alert, row));

  row.append(arrow, body, remove);
  return row;
}

function render() {
  const alerts = window.storage.getAlerts(user.id);
  if (alerts.length === 0 || window.mockNetwork.isEmptyMock()) return renderEmpty();

  const list = document.createElement("div");
  alerts.forEach((alert) => list.appendChild(renderAlertRow(alert, deleteAlert)));

  const atLimit = alerts.length >= window.storage.ALERT_LIMIT;
  const count = document.createElement("p");
  count.className = "pers-note";
  count.textContent = fill("alerts.count", { count: alerts.length, max: window.storage.ALERT_LIMIT });
  const note = document.createElement("p");
  note.className = "pers-note";
  note.textContent = atLimit ? fill("alerts.limit_reached", { max: window.storage.ALERT_LIMIT }) : t("alerts.hint");

  const addButton = window.buttonModule.renderButton({
    label: t("alerts.add"),
    disabled: atLimit,
    onClick: () => {
      window.pageTransition.go(NEW_ALERT_URL);
    },
  });
  contentEl.replaceChildren(count, list, note, addButton);
  window.motion.stagger(list);
}

// Deleting is destructive and cannot be undone, so it asks first.
function deleteAlert(alert, row) {
  const instrument = window.storage.getInstrument(alert.ticker);
  const level = money.formatPrice(alert.level, instrument.unit);
  window.confirmDialogModule.showConfirmDialog({
    title: t("alerts.delete_confirm_title"),
    message: fill("alerts.delete_confirm_message", { name: alert.ticker, level }),
    confirmLabel: t("alerts.delete_confirm_button"),
    variant: "danger",
    onConfirm: () => {
      window.storage.removeAlert(user.id, alert.id);
      window.toastModule.showToast({ message: t("alerts.deleted"), icon: "check" });
      window.motion.playOut(row, "alert-row--leaving", render);
    },
  });
}

function renderEmpty() {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "price-alert",
      title: t("alerts.empty_title"),
      message: t("alerts.empty_message"),
      actionLabel: t("alerts.empty_action"),
      onAction: () => {
        window.pageTransition.go(NEW_ALERT_URL);
      },
    }),
  );
  window.motion.fadeIn(contentEl);
}

function load() {
  contentEl.setAttribute("aria-busy", "true");
  contentEl.replaceChildren(...Array.from({ length: 3 }, () => window.skeletonModule.renderSkeleton("alert-skeleton-row")));
  window.mockNetwork
    .request("alerts", () => window.storage.getAlerts(user.id))
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

if (user) {
  load();
  document.getElementById("pers-disclaimer").appendChild(window.bannerModule.renderPriceNotices());
} else {
  // Price alerts are registered-only (ÁR_000).
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

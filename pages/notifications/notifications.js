window.i18n.initI18n();
const t = window.i18n.t;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();

const productUrl = (notification) => {
  const base = "../product/product.html?ticker=" + encodeURIComponent(notification.ticker);
  // A disclosure notification opens that disclosure itself (K_005).
  return notification.kind === "disclosure" ? `${base}&tab=disclosures&doc=${notification.disclosureId}` : base;
};

function formatTime(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderItem(notification) {
  const item = document.createElement("a");
  item.className = "notif-item" + (notification.read ? "" : " notif-item--unread");
  item.href = productUrl(notification);
  item.addEventListener("click", () => window.storage.markNotificationRead(user.id, notification.id));

  const icon = window.iconModule.renderIcon(notification.kind === "alert" ? "bell" : "mail");
  icon.classList.add("notif-icon");

  const body = document.createElement("span");
  body.className = "notif-body";
  const title = document.createElement("span");
  title.className = "notif-title";
  title.textContent = notification.title;
  const text = document.createElement("span");
  text.className = "notif-text";
  text.textContent = notification.text;
  const time = document.createElement("span");
  time.className = "notif-time";
  time.textContent = formatTime(notification.at);
  body.append(title, text, time);

  item.append(icon, body);
  if (!notification.read) {
    const dot = document.createElement("span");
    dot.className = "notif-dot";
    dot.setAttribute("role", "img");
    dot.setAttribute("aria-label", t("notifications.unread"));
    item.appendChild(dot);
  }
  return item;
}

function render() {
  const items = window.storage.getNotifications(user.id);
  if (items.length === 0 || window.mockNetwork.isEmptyMock()) {
    contentEl.replaceChildren(
      window.stateViewModule.renderStateView({
        icon: "bell",
        title: t("notifications.empty_title"),
        message: t("notifications.empty_message"),
      }),
    );
    return;
  }
  const list = document.createElement("div");
  items
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .forEach((notification) => list.appendChild(renderItem(notification)));
  contentEl.replaceChildren(list);
  window.motion.stagger(list);
}

function renderMarkAll() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "top-appbar-icon-button";
  button.setAttribute("aria-label", t("notifications.mark_all"));
  button.appendChild(window.iconModule.renderIcon("check"));
  button.addEventListener("click", () => {
    window.storage.markAllNotificationsRead(user.id);
    window.toastModule.showToast({ message: t("notifications.all_read"), icon: "check" });
    render();
  });
  return button;
}

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("notifications.title"),
    onBack: () => window.pageTransition.back(),
    right: user ? renderMarkAll() : undefined,
  }),
);

if (user) {
  render();
} else {
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

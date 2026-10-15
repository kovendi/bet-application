window.i18n.initI18n();

function renderTopbar() {
  document.getElementById("menu-top-appbar").appendChild(
    // The hamburger button that opens this page would otherwise appear
    // here too, reopening the same screen — hide it.
    window.topAppbarModule.renderTopAppbar({
      title: window.i18n.t("menu.title"),
      // Reachable from the hamburger button on every page, so back goes the
      // way the user came instead of a hardcoded href.
      onBack: () => window.pageTransition.back(),
      hideMenuButton: true,
    }),
  );
}

function confirmLogout() {
  window.confirmDialogModule.showConfirmDialog({
    title: window.i18n.t("menu.logout_confirm_title"),
    message: window.i18n.t("menu.logout_confirm_message"),
    confirmLabel: window.i18n.t("menu.logout_confirm_button"),
    variant: "danger",
    onConfirm: () => {
      window.storage.logout();
      window.location.href = "../login/login.html";
    },
  });
}

function renderMenu() {
  const go = (url) => () => {
    window.pageTransition.go(url);
  };
  const groups = [
    {
      title: window.i18n.t("menu.group_personal"),
      items: [
        { icon: "star", title: window.i18n.t("menu.favorites_title"), description: window.i18n.t("menu.favorites_description"), onSelect: go("../favorites/favorites.html") },
        { icon: "price-alert", title: window.i18n.t("menu.alerts_title"), description: window.i18n.t("menu.alerts_description"), onSelect: go("../alerts/alerts.html") },
        { icon: "mail", title: window.i18n.t("menu.notifications_title"), description: window.i18n.t("menu.notifications_description"), onSelect: go("../notifications/notifications.html") },
        { icon: "home", title: window.i18n.t("menu.home_edit_title"), description: window.i18n.t("menu.home_edit_description"), onSelect: go("../home-edit/home-edit.html") },
      ],
    },
    {
      title: window.i18n.t("menu.group_account"),
      items: [
        {
          icon: "profile",
          title: window.i18n.t("menu.profile_title"),
          description: window.i18n.t("menu.profile_description"),
          onSelect: () => {
            window.pageTransition.go("../profile/profile.html");
          },
        },
        {
          icon: "logout",
          title: window.i18n.t("menu.logout_title"),
          description: window.i18n.t("menu.logout_description"),
          tone: "danger",
          onSelect: confirmLogout,
        },
      ],
    },
  ];

  return window.menuListModule.renderMenuList(groups);
}

renderTopbar();
document.getElementById("menu-content").appendChild(renderMenu());

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(
    window.iphoneFrame.renderIphoneFrame(
      document.getElementById("screen-content"),
    ),
  );
  document.body.classList.add("has-iphone-frame");
}

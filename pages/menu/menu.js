window.i18n.initI18n();

function renderTopbar() {
  document.getElementById("menu-top-appbar").appendChild(
    // The hamburger button that opens this page would otherwise appear
    // here too, reopening the same screen — hide it.
    window.topAppbarModule.renderTopAppbar({
      title: window.i18n.t("menu.title"),
      // Reachable from the hamburger button on every page, so back goes the
      // way the user came instead of a hardcoded href.
      onBack: () => history.back(),
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
  const groups = [
    {
      title: window.i18n.t("menu.group_account"),
      items: [
        {
          icon: "profile",
          title: window.i18n.t("menu.profile_title"),
          description: window.i18n.t("menu.profile_description"),
          // No profile screen yet: say so instead of doing nothing.
          onSelect: () =>
            window.toastModule.showToast({ message: window.i18n.t("menu.coming_soon"), icon: "info" }),
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

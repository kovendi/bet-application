window.i18n.initI18n();

const t = window.i18n.t;
const user = window.storage.getCurrentUser();

// FK_0096: the privacy notice lives on bet.hu, the app only redirects there.
const PRIVACY_URL = "https://bet.hu";

function openPrivacy() {
  window.toastModule.showToast({ message: t("profile.privacy_opened"), icon: "info" });
  window.open(PRIVACY_URL, "_blank", "noopener");
}

function openAccountFlow(flow) {
  window.pageTransition.go("../account-change/account-change.html?flow=" + flow);
}

// Account actions need a registered user; guests get the registration sheet.
function requireUser(action) {
  return () => {
    if (!user) window.bottomSheetModule.showRegistrationRequired();
    else action();
  };
}

function renderTopbar() {
  document.getElementById("profile-top-appbar").appendChild(
    window.topAppbarModule.renderTopAppbar({
      title: t("profile.title"),
      onBack: () => window.pageTransition.back(),
    }),
  );
}

function renderSummary() {
  const name = user ? user.name : t("profile.guest_name");
  const email = user ? user.username : t("profile.guest_email");

  const summary = document.createElement("div");
  summary.className = "profile-summary";

  const avatar = document.createElement("div");
  avatar.className = "profile-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = name.charAt(0).toUpperCase();

  const text = document.createElement("div");
  text.className = "profile-summary-text";
  const nameEl = document.createElement("p");
  nameEl.className = "profile-name";
  nameEl.textContent = name;
  const emailEl = document.createElement("p");
  emailEl.className = "profile-email";
  emailEl.textContent = email;
  text.append(nameEl, emailEl);

  summary.append(avatar, text);
  return summary;
}

// The theme applies instantly and is remembered by modules/theme (B_001);
// it is a device setting, so guests can change it too.
function renderThemeSection() {
  const section = document.createElement("div");

  const title = document.createElement("h2");
  title.className = "menu-list-group-title";
  title.textContent = t("profile.group_appearance");

  const chips = window.chipsModule.renderChips({
    variant: "segmented",
    ariaLabel: t("profile.theme_label"),
    activeId: window.theme.getTheme(),
    items: [
      { id: "system", label: t("profile.theme_system") },
      { id: "light", label: t("profile.theme_light") },
      { id: "dark", label: t("profile.theme_dark") },
    ],
    onChange: (theme) => window.theme.setTheme(theme),
  });

  const hint = document.createElement("p");
  hint.className = "profile-theme-hint";
  hint.textContent = t("profile.theme_hint");

  section.append(title, chips, hint);
  return section;
}

function onNewsletterChange(checked) {
  window.storage.updateUser(user.id, { newsletter: checked });
  window.toastModule.showToast({
    message: t(checked ? "profile.newsletter_on" : "profile.newsletter_off"),
    icon: "check",
  });
}

function confirmDelete() {
  window.confirmDialogModule.showConfirmDialog({
    title: t("profile.delete_confirm_title"),
    message: t("profile.delete_confirm_message"),
    confirmLabel: t("profile.delete_confirm_button"),
    variant: "danger",
    onConfirm: () => openAccountFlow("delete"),
  });
}

// FK_0092: hidden for Google / Apple / Portal logins without a separate app password.
function passwordItems() {
  if (user && !window.storage.canChangePassword()) return [];
  return [{ icon: "lock", title: t("profile.change_password_title"), onSelect: requireUser(() => openAccountFlow("password")) }];
}

function renderMenuGroups() {
  // A guest has no newsletter setting; the switch opens the registration sheet instead.
  const newsletterSwitch = window.toggleModule.renderSwitch({
    id: "profile-newsletter",
    checked: Boolean(user && user.newsletter),
    onChange: (checked) => {
      if (user) return onNewsletterChange(checked);
      document.getElementById("profile-newsletter").checked = false;
      window.bottomSheetModule.showRegistrationRequired();
    },
  });

  return window.menuListModule.renderMenuList([
    {
      title: t("profile.group_notifications"),
      items: [
        {
          icon: "mail",
          title: t("profile.newsletter_title"),
          description: t("profile.newsletter_description"),
          right: newsletterSwitch,
        },
      ],
    },
    {
      title: t("profile.group_account"),
      items: [
        { icon: "mail", title: t("profile.change_email_title"), onSelect: requireUser(() => openAccountFlow("email")) },
        ...passwordItems(),
        { icon: "shield", title: t("profile.privacy_title"), onSelect: openPrivacy },
      ],
    },
    {
      items: [
        {
          icon: "trash",
          title: t("profile.delete_title"),
          description: t("profile.delete_description"),
          tone: "danger",
          onSelect: requireUser(confirmDelete),
        },
      ],
    },
  ]);
}

renderTopbar();
const content = document.getElementById("profile-content");
content.append(renderSummary(), renderThemeSection(), renderMenuGroups());

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(
    window.iphoneFrame.renderIphoneFrame(
      document.getElementById("screen-content"),
    ),
  );
  document.body.classList.add("has-iphone-frame");
}

window.i18n.initI18n();

const t = window.i18n.t;
const content = document.getElementById("settings-content");

// B_002: the language choice is remembered by modules/i18n. English has no
// translation table yet (phase 5), so choosing it only explains that and the
// switch snaps back.
function renderLanguage() {
  const section = document.createElement("div");
  const title = document.createElement("h2");
  title.className = "menu-list-group-title";
  title.textContent = t("settings.group_language");

  const chips = window.chipsModule.renderChips({
    variant: "segmented",
    ariaLabel: t("settings.language_label"),
    activeId: window.i18n.getLanguage(),
    items: [
      { id: "hu", label: t("settings.language_hu") },
      { id: "en", label: t("settings.language_en") },
    ],
    onChange: (code) => {
      if (window.LOCALES[code]) {
        window.i18n.setLanguage(code);
        window.location.reload();
        return;
      }
      window.toastModule.showToast({ message: t("settings.language_en_soon"), icon: "info" });
      section.replaceWith(renderLanguage());
    },
  });
  section.append(title, chips);
  return section;
}

function renderInfoMenu() {
  const go = (url) => () => window.pageTransition.go(url);
  return window.menuListModule.renderMenuList([
    {
      title: t("settings.group_info"),
      items: [
        { icon: "info", title: t("settings.about_title"), description: t("settings.about_description"), onSelect: go("../about/about.html") },
        {
          icon: "chat",
          title: t("settings.feedback_title"),
          description: t("settings.feedback_description"),
          onSelect: go("../feedback/feedback.html"),
        },
      ],
    },
  ]);
}

document.getElementById("settings-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("settings.title"),
    onBack: () => window.pageTransition.back(),
  }),
);

const version = document.createElement("p");
version.className = "settings-version";
version.textContent = t("settings.version").replace("{version}", window.APP_VERSION || "");

content.append(renderLanguage(), renderInfoMenu(), version);

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

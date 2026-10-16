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

// Demo scenarios for the client: each choice is saved in localStorage
// (modules/mock-settings) and read by market-status and mock-network on the
// next page load. A URL parameter still overrides it.
function renderScenarioPicker(name, labelKey, optionKeys) {
  const wrap = document.createElement("div");
  wrap.className = "settings-scenario";
  const label = document.createElement("p");
  label.className = "app-input-label";
  label.textContent = t(labelKey);
  const chips = window.chipsModule.renderChips({
    variant: "segmented",
    ariaLabel: t(labelKey),
    activeId: window.mockSettings.get(name),
    items: window.mockSettings.OPTIONS[name].map((id) => ({ id, label: t(optionKeys + id) })),
    onChange: (value) => {
      window.mockSettings.set(name, value);
      window.toastModule.showToast({ message: t("settings.mock_saved"), icon: "check" });
    },
  });
  wrap.append(label, chips);
  return wrap;
}

function renderMockup() {
  const section = document.createElement("div");
  section.className = "settings-mockup";
  const title = document.createElement("h2");
  title.className = "menu-list-group-title";
  title.textContent = t("settings.group_mockup");
  const hint = document.createElement("p");
  hint.className = "settings-hint";
  hint.textContent = t("settings.mockup_hint");

  const reset = window.menuListModule.renderMenuList([
    {
      items: [
        {
          icon: "refresh",
          title: t("settings.mock_reset_title"),
          description: t("settings.mock_reset_description"),
          onSelect: () =>
            window.confirmDialogModule.showConfirmDialog({
              title: t("settings.mock_reset_title"),
              message: t("settings.mock_reset_confirm"),
              confirmLabel: t("settings.mock_reset_button"),
              onConfirm: () => {
                window.mockSettings.reset();
                window.location.reload();
              },
            }),
        },
      ],
    },
  ]);
  section.append(
    title,
    hint,
    renderScenarioPicker("market", "settings.mock_market_label", "settings.mock_market_"),
    renderScenarioPicker("network", "settings.mock_network_label", "settings.mock_network_"),
    reset,
  );
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

content.append(renderLanguage(), renderMockup(), renderInfoMenu(), version);

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

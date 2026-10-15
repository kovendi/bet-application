window.i18n.initI18n();

const t = window.i18n.t;

// B_003: imprint, legal notices and disclaimers open in a sheet (placeholder
// texts, the BÉT supplies the final ones); the official documents live on
// bet.hu, so those rows redirect there like the privacy notice in the profile.
const BET_URL = "https://bet.hu";

function showText(titleKey, bodyKey) {
  const body = document.createElement("p");
  body.className = "about-text";
  body.textContent = t(bodyKey);
  window.bottomSheetModule.showBottomSheet({ title: t(titleKey), content: body });
}

function openOnBet() {
  window.toastModule.showToast({ message: t("about.opened"), icon: "info" });
  window.open(BET_URL, "_blank", "noopener");
}

document.getElementById("about-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("about.title"),
    onBack: () => window.pageTransition.back(),
  }),
);

document.getElementById("about-content").appendChild(
  window.menuListModule.renderMenuList([
    {
      title: t("about.group_legal"),
      items: [
        { icon: "info", title: t("about.imprint_title"), onSelect: () => showText("about.imprint_title", "about.imprint_body") },
        { icon: "shield", title: t("about.legal_title"), onSelect: () => showText("about.legal_title", "about.legal_body") },
        { icon: "clock", title: t("about.disclaimer_title"), onSelect: () => showText("about.disclaimer_title", "about.disclaimer_body") },
      ],
    },
    {
      title: t("about.group_documents"),
      items: [
        { icon: "lock", title: t("about.privacy_title"), onSelect: openOnBet },
        { icon: "book", title: t("about.terms_title"), onSelect: openOnBet },
      ],
    },
  ]),
);

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

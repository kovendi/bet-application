// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// The "install the app" offer, shown only on a phone/tablet browser and never
// once the app already runs installed (standalone). Browsing on in the browser
// stays possible: "Continue in browser" hides the card and remembers it for a
// while (cooldownDays), so it is not nagging.
//   - Android: one tap on "Install" opens the native install dialog.
//   - iOS Safari: "Install" opens a bottom sheet with the three steps of
//     Share → Add to Home Screen (iOS has no install API).
//   - iOS in another browser / in-app browser: only Safari can install, so the
//     card asks to open the page there and offers a copy-link button.
//
// Requires modules/pwa/pwa.js (loaded + init() called in <head>), i18n, icon,
// button, text-button, toast, motion, overlay and bottom-sheet (js + css), the
// `pwa.*` locale keys and modules/pwa/pwa.css.
//
// Usage in a page:
//   <div id="pwa-install"></div>
//   <script>
//     window.pwaInstallModule.renderInstallCard(document.getElementById('pwa-install'));
//   </script>
//
//   // { preview: true } always shows the iOS Safari variant and never stores a
//   // dismissal — for the style guide.
//   window.pwaInstallModule.showIosSteps(); // the steps sheet on its own
//   window.pwaInstallModule.resetDismissal(); // offer the card again

window.pwaInstallModule = (function () {
  const STORAGE_KEY = "pwaInstallDismissedAt";
  const DEFAULT_COOLDOWN_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function t(key) {
    return window.i18n.t(key);
  }

  function isDismissed(cooldownDays) {
    try {
      const dismissedAt = Number(localStorage.getItem(STORAGE_KEY));
      return dismissedAt > 0 && Date.now() - dismissedAt < cooldownDays * DAY_MS;
    } catch (e) {
      return false;
    }
  }

  function rememberDismissal() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
  }

  function resetDismissal() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function renderStep(iconName, text) {
    const item = document.createElement("li");
    item.className = "pwa-step";
    const badge = document.createElement("span");
    badge.className = "pwa-step-badge";
    badge.appendChild(window.iconModule.renderIcon(iconName));
    const label = document.createElement("span");
    label.className = "pwa-step-text";
    label.textContent = text;
    item.append(badge, label);
    return item;
  }

  function showIosSteps() {
    const content = document.createElement("div");
    const steps = document.createElement("ol");
    steps.className = "pwa-steps";
    steps.append(
      renderStep("share", t("pwa.step_share")),
      renderStep("add-to-home", t("pwa.step_add")),
      renderStep("check", t("pwa.step_confirm")),
    );
    const hint = document.createElement("p");
    hint.className = "pwa-steps-hint";
    hint.textContent = t("pwa.steps_hint");
    content.append(steps, hint);
    return window.bottomSheetModule.showBottomSheet({ title: t("pwa.steps_title"), content });
  }

  function copyLink() {
    const showCopied = () => window.toastModule.showToast({ message: t("pwa.link_copied"), icon: "check" });
    if (!navigator.clipboard) {
      showCopied();
      return;
    }
    navigator.clipboard.writeText(location.href).then(showCopied, showCopied);
  }

  function removeCard(card) {
    window.motion.playOut(card, "pwa-card--leaving", () => card.remove());
  }

  // Which offer fits this browser: { text, button: { label, icon, onClick } }.
  function describeOffer(platform, card) {
    if (platform.os === "ios" && !platform.isIosSafari) {
      return { text: t("pwa.text_ios_other"), button: { label: t("pwa.copy_link"), icon: "link", onClick: copyLink } };
    }
    if (platform.os === "ios") {
      return { text: t("pwa.text_ios"), button: { label: t("pwa.install"), icon: "download", onClick: showIosSteps } };
    }
    const install = () => {
      window.pwaModule.promptInstall().then((outcome) => {
        if (outcome === "accepted") removeCard(card);
      });
    };
    return { text: t("pwa.text_android"), button: { label: t("pwa.install"), icon: "download", onClick: install } };
  }

  function buildCard(platform, preview) {
    const card = document.createElement("section");
    card.className = "pwa-card";
    card.setAttribute("aria-labelledby", "pwa-card-title");

    const offer = describeOffer(platform, card);

    const head = document.createElement("div");
    head.className = "pwa-card-head";
    const badge = document.createElement("span");
    badge.className = "pwa-card-badge";
    badge.appendChild(window.iconModule.renderIcon("add-to-home"));
    const copy = document.createElement("div");
    const title = document.createElement("h2");
    title.id = "pwa-card-title";
    title.className = "pwa-card-title";
    title.textContent = t("pwa.title");
    const text = document.createElement("p");
    text.className = "pwa-card-text";
    text.textContent = offer.text;
    copy.append(title, text);
    head.append(badge, copy);

    const actions = document.createElement("div");
    actions.className = "pwa-card-actions";
    actions.appendChild(
      window.buttonModule.renderButton({
        label: offer.button.label,
        variant: "primary",
        iconNode: window.iconModule.renderIcon(offer.button.icon),
        onClick: offer.button.onClick,
      }),
    );
    actions.appendChild(
      window.textButtonModule.renderTextButton({
        label: t("pwa.continue_browser"),
        onClick: () => {
          if (!preview) rememberDismissal();
          removeCard(card);
        },
      }),
    );

    card.append(head, actions);
    return card;
  }

  function mountCard(container, platform, preview) {
    const card = buildCard(platform, preview);
    container.appendChild(card);
    window.motion.fadeIn(card);
    window.addEventListener("pwa:installed", () => removeCard(card), { once: true });
    return card;
  }

  // Shows the card when an install offer makes sense; returns false when not.
  function renderInstallCard(container, { cooldownDays = DEFAULT_COOLDOWN_DAYS, preview = false } = {}) {
    if (preview) {
      mountCard(container, { os: "ios", isIosSafari: true }, true);
      return true;
    }
    const platform = window.pwaModule.getPlatform();
    if (!platform.isMobile || platform.isStandalone || isDismissed(cooldownDays)) return false;

    if (platform.os === "android" && !window.pwaModule.canPromptInstall()) {
      // Chrome fires the install event a moment after load; wait for it.
      window.addEventListener("pwa:installable", () => mountCard(container, platform), { once: true });
      return true;
    }
    mountCard(container, platform);
    return true;
  }

  return { renderInstallCard, showIosSteps, resetDismissal };
})();

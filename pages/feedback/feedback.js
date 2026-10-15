window.i18n.initI18n();

const t = window.i18n.t;
const content = document.getElementById("feedback-content");
const user = window.storage.getCurrentUser();
const MAX_LENGTH = 300;

// B_004: registered users send up to 300 characters (the real app mails them to
// appfeedback@bse.hu with the user's e-mail and device info); a thank-you pop-up
// follows. Guests get the registration notice instead of the form.

document.getElementById("feedback-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("feedback.title"),
    onBack: () => window.pageTransition.back(),
  }),
);

function showThanks() {
  const body = document.createElement("div");
  body.className = "feedback-thanks";
  const message = document.createElement("p");
  message.className = "feedback-thanks-message";
  message.textContent = t("feedback.thanks_message");
  const done = window.buttonModule.renderButton({
    label: t("feedback.thanks_button"),
    onClick: () => sheet.close(),
  });
  body.append(message, done);
  const sheet = window.bottomSheetModule.showBottomSheet({
    title: t("feedback.thanks_title"),
    content: body,
    onClose: () => window.pageTransition.back(),
  });
}

function renderForm() {
  const form = document.createElement("form");
  form.className = "feedback-form";
  form.noValidate = true;

  const subtitle = document.createElement("p");
  subtitle.className = "feedback-subtitle";
  subtitle.textContent = t("feedback.subtitle");

  const field = window.inputModule.renderInput({
    id: "feedback-text",
    label: t("feedback.label"),
    placeholder: t("feedback.placeholder"),
    name: "feedback",
    multiline: true,
    maxLength: MAX_LENGTH,
  });
  const textarea = field.querySelector("textarea");

  const counter = document.createElement("p");
  counter.className = "feedback-counter";
  counter.setAttribute("aria-live", "polite");
  const updateCounter = () => {
    counter.textContent = t("feedback.counter")
      .replace("{count}", textarea.value.length)
      .replace("{max}", MAX_LENGTH);
  };
  textarea.addEventListener("input", updateCounter);
  updateCounter();

  const submit = window.buttonModule.renderButton({ label: t("feedback.submit"), type: "submit" });
  form.append(subtitle, field, counter, submit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.inputModule.clearFieldError(textarea);
    if (!textarea.value.trim()) {
      window.inputModule.setFieldError(textarea, t("feedback.required"));
      textarea.focus();
      return;
    }
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork.request("feedback-send", () => true).then(showThanks);
  });
  return form;
}

function renderGuest() {
  return window.stateViewModule.renderStateView({
    icon: "lock",
    title: t("feedback.guest_title"),
    message: t("feedback.guest_message"),
    actionLabel: t("feedback.guest_action"),
    onAction: () => window.bottomSheetModule.showRegistrationRequired(),
  });
}

content.appendChild(user ? renderForm() : renderGuest());

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

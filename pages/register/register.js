window.i18n.initI18n();

const t = window.i18n.t;
const contentEl = document.getElementById("flow-content");

// Registration (FK_004–FK_0065): form -> six-digit e-mail code -> done (+ biometric offer).
// The data waits in storage between the form and the code, so an abandoned
// registration can be continued (FK_0064).

document.getElementById("flow-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("register.title"),
    hideMenuButton: true,
    onBack: () => window.pageTransition.backTo("../login/login.html"),
  }),
);

function show(...nodes) {
  contentEl.replaceChildren(...nodes);
  window.motion.fadeIn(contentEl);
}

function text(tag, className, value) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = value;
  return el;
}

function goHome() {
  window.location.href = "../home/home.html";
}

function renderPendingBanner(pending) {
  return window.bannerModule.renderBanner({
    text: t("register.pending").replace("{email}", pending.email),
    icon: "info",
    actionLabel: t("register.pending_continue"),
    onAction: () => showCodeStep(pending),
  });
}

function renderForm() {
  const form = document.createElement("form");
  form.className = "flow-form";
  form.noValidate = true;

  const email = window.inputModule.renderInput({
    id: "register-email",
    label: t("register.email_label"),
    placeholder: t("register.email_placeholder"),
    type: "email",
    name: "email",
    icon: "mail",
    required: true,
  });
  const password = window.inputModule.renderInput({
    id: "register-password",
    label: t("register.password_label"),
    placeholder: t("register.password_placeholder"),
    type: "password",
    name: "new-password",
    icon: "lock",
    required: true,
  });
  const confirm = window.inputModule.renderInput({
    id: "register-confirm",
    label: t("register.confirm_label"),
    placeholder: t("register.confirm_placeholder"),
    type: "password",
    name: "confirm-password",
    icon: "lock",
    required: true,
  });
  const [emailInput, passwordInput, confirmInput] = [email, password, confirm].map((f) => f.querySelector("input"));

  const declarations = { terms: false, privacy: false, newsletter: false };
  const switchFor = (key) =>
    window.toggleModule.renderSwitch({
      id: `register-${key}`,
      checked: false,
      onChange: (checked) => {
        declarations[key] = checked;
        errorSlot.replaceChildren();
      },
    });
  const declarationList = window.menuListModule.renderMenuList([
    {
      items: [
        { icon: "shield", title: t("register.terms_title"), description: t("register.terms_description"), right: switchFor("terms") },
        { icon: "shield", title: t("register.privacy_title"), description: t("register.privacy_description"), right: switchFor("privacy") },
        { icon: "mail", title: t("register.newsletter_title"), description: t("register.newsletter_description"), right: switchFor("newsletter") },
      ],
    },
  ]);

  const errorSlot = document.createElement("div");
  errorSlot.className = "flow-error";
  const submit = window.buttonModule.renderButton({ label: t("register.submit"), type: "submit" });

  form.append(
    window.inputModule.renderInputStack([email, password, confirm]),
    text("p", "flow-hint", t("register.password_hint")),
    declarationList,
    errorSlot,
    submit,
    window.textButtonModule.renderTextButton({
      label: t("register.have_account"),
      onClick: () => window.pageTransition.backTo("../login/login.html"),
    }),
  );

  function check(input, key) {
    window.inputModule.clearFieldError(input);
    if (!key) return true;
    window.inputModule.setFieldError(input, t(key));
    return false;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorSlot.replaceChildren();
    const results = [
      check(emailInput, window.validators.validateEmail(emailInput.value)),
      check(passwordInput, window.validators.validatePassword(passwordInput.value)),
      check(confirmInput, window.validators.validateConfirm(confirmInput.value, passwordInput.value)),
    ];
    const firstBad = [emailInput, passwordInput, confirmInput].find((_, i) => !results[i]);
    if (firstBad) return firstBad.focus();
    if (!declarations.terms || !declarations.privacy) {
      errorSlot.replaceChildren(
        window.motion.fadeIn(
          window.bannerModule.renderBanner({ text: t("register.declarations_required"), variant: "warning", icon: "exclamationmark-circle" }),
        ),
      );
      return;
    }

    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork
      .request("register", () => window.storage.findUserByUsername(emailInput.value.trim()))
      .then((existing) => {
        window.buttonModule.setButtonLoading(submit, false);
        if (existing) return check(emailInput, "register.email_taken");
        const pending = { email: emailInput.value.trim(), password: passwordInput.value, newsletter: declarations.newsletter };
        window.storage.setPendingRegistration(pending);
        showCodeStep(pending);
      });
  });
  return form;
}

function showCodeStep(pending) {
  show(
    text("h2", "flow-title", t("register.code_title")),
    window.codeStepModule.renderCodeStep({
      email: pending.email,
      submitLabel: t("register.code_submit"),
      onVerified: () => completeRegistration(pending),
    }),
  );
}

function completeRegistration(pending) {
  const user = window.storage.addUser({
    id: `user-${Date.now()}`,
    username: pending.email,
    password: pending.password,
    name: pending.email.split("@")[0],
    newsletter: pending.newsletter,
  });
  window.storage.setPendingRegistration(null);
  window.storage.setCurrentUser(user.id);
  showDone(user);
}

// FK_005: the biometric login is offered right after registration.
function showDone(user) {
  const view = window.stateViewModule.renderStateView({
    icon: "check",
    title: t("register.done_title"),
    message: t("register.done_message"),
    actionLabel: t("register.biometric_enable"),
    onAction: () => {
      window.storage.updateUser(user.id, { biometric: true });
      window.toastModule.showToast({ message: t("register.biometric_on"), icon: "check" });
      goHome();
    },
  });
  view.appendChild(window.textButtonModule.renderTextButton({ label: t("register.biometric_skip"), onClick: goHome }));
  show(view);
}

const pending = window.storage.getPendingRegistration();
show(
  text("p", "flow-subtitle", t("register.subtitle")),
  ...(pending ? [renderPendingBanner(pending)] : []),
  renderForm(),
);

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

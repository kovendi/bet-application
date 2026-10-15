window.i18n.initI18n();

const t = window.i18n.t;
const contentEl = document.getElementById("flow-content");

// Forgot password (FK_008–FK_0081): e-mail -> six-digit code -> new password ->
// confirmation. The flow is identical for unknown addresses, so it never reveals
// whether an account exists (same principle as FK_0071).

document.getElementById("flow-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("forgot.title"),
    hideMenuButton: true,
    onBack: () => window.pageTransition.back(),
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

function check(input, key) {
  window.inputModule.clearFieldError(input);
  if (!key) return true;
  window.inputModule.setFieldError(input, t(key));
  input.focus();
  return false;
}

function showEmailStep() {
  const form = document.createElement("form");
  form.className = "flow-form";
  form.noValidate = true;
  const field = window.inputModule.renderInput({
    id: "forgot-email",
    label: t("login.username_label"),
    placeholder: t("login.username_placeholder"),
    type: "email",
    name: "email",
    icon: "mail",
    required: true,
  });
  const input = field.querySelector("input");
  const submit = window.buttonModule.renderButton({ label: t("forgot.submit"), type: "submit" });
  form.append(window.inputModule.renderInputStack([field]), submit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!check(input, window.validators.validateEmail(input.value))) return;
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork.request("forgot-send", () => input.value.trim()).then(showCodeStep);
  });

  show(text("p", "flow-subtitle", t("forgot.subtitle")), form);
}

function showCodeStep(email) {
  show(
    window.codeStepModule.renderCodeStep({
      email,
      submitLabel: t("forgot.code_submit"),
      onVerified: () => showPasswordStep(email),
    }),
  );
}

function showPasswordStep(email) {
  const form = document.createElement("form");
  form.className = "flow-form";
  form.noValidate = true;
  const password = window.inputModule.renderInput({
    id: "forgot-password",
    label: t("forgot.new_password_label"),
    placeholder: t("register.password_placeholder"),
    type: "password",
    name: "new-password",
    icon: "lock",
    required: true,
  });
  const confirm = window.inputModule.renderInput({
    id: "forgot-confirm",
    label: t("register.confirm_label"),
    placeholder: t("register.confirm_placeholder"),
    type: "password",
    name: "confirm-password",
    icon: "lock",
    required: true,
  });
  const [passwordInput, confirmInput] = [password, confirm].map((f) => f.querySelector("input"));
  const submit = window.buttonModule.renderButton({ label: t("forgot.new_submit"), type: "submit" });
  form.append(
    window.inputModule.renderInputStack([password, confirm]),
    text("p", "flow-hint", t("register.password_hint")),
    submit,
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const passwordOk = check(passwordInput, window.validators.validatePassword(passwordInput.value));
    const confirmOk = check(confirmInput, window.validators.validateConfirm(confirmInput.value, passwordInput.value));
    if (!passwordOk) return passwordInput.focus();
    if (!confirmOk) return;
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork
      .request("forgot-save", () => {
        const user = window.storage.findUserByUsername(email);
        if (user) window.storage.updateUser(user.id, { password: passwordInput.value });
      })
      .then(() => {
        window.storage.clearLoginFailures();
        showDone();
      });
  });

  show(text("h2", "flow-title", t("forgot.new_title")), text("p", "flow-subtitle", t("forgot.new_subtitle")), form);
}

function showDone() {
  show(
    window.stateViewModule.renderStateView({
      icon: "check",
      title: t("forgot.done_title"),
      message: t("forgot.done_message"),
      actionLabel: t("forgot.done_button"),
      onAction: () => window.pageTransition.backTo("../login/login.html"),
    }),
  );
}

showEmailStep();

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

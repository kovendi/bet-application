window.i18n.initI18n();

const t = window.i18n.t;
const contentEl = document.getElementById("flow-content");
const user = window.storage.getCurrentUser();
const flow = new URLSearchParams(window.location.search).get("flow");

// Profile account changes, one screen per flow (?flow=email|password|delete):
//   email    (FK_0091): new address -> six-digit code sent to it -> saved
//   password (FK_0092): current + new + confirmation -> confirmation e-mail
//   delete   (FK_0095): six-digit code -> data deleted -> confirmation e-mail

const FLOWS = { email: startEmail, password: startPassword, delete: startDelete };

document.getElementById("flow-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: t("account." + (FLOWS[flow] ? flow : "email") + "_title"),
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

function passwordField(id, label, name, placeholder) {
  return window.inputModule.renderInput({
    id,
    label,
    placeholder,
    type: "password",
    name,
    icon: "lock",
    required: true,
  });
}

function showDone({ title, message, buttonLabel, onAction }) {
  show(
    window.stateViewModule.renderStateView({
      icon: "check",
      title,
      message,
      actionLabel: buttonLabel,
      onAction,
    }),
  );
}

function backToProfile() {
  window.pageTransition.backTo("../profile/profile.html");
}

// --- E-mail change ---------------------------------------------------------

function startEmail() {
  const form = document.createElement("form");
  form.className = "flow-form";
  form.noValidate = true;
  const field = window.inputModule.renderInput({
    id: "account-email",
    label: t("account.email_new_label"),
    placeholder: t("login.username_placeholder"),
    type: "email",
    name: "email",
    icon: "mail",
    required: true,
  });
  const input = field.querySelector("input");
  const submit = window.buttonModule.renderButton({ label: t("account.email_submit"), type: "submit" });
  form.append(window.inputModule.renderInputStack([field]), submit);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const key = window.validators.validateEmail(input.value);
    const same = input.value.trim().toLowerCase() === user.username.toLowerCase();
    if (!check(input, key || (same ? "account.email_same" : null))) return;
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork.request("account-email-send", () => input.value.trim()).then(showEmailCodeStep);
  });

  show(
    text("p", "flow-subtitle", t("account.email_subtitle").replace("{email}", user.username)),
    form,
  );
}

function showEmailCodeStep(newEmail) {
  show(
    window.codeStepModule.renderCodeStep({
      email: newEmail,
      submitLabel: t("account.email_confirm"),
      onVerified: () => {
        window.storage.updateUser(user.id, { username: newEmail });
        showDone({
          title: t("account.email_done_title"),
          message: t("account.email_done_message").replace("{email}", newEmail),
          buttonLabel: t("account.back_to_profile"),
          onAction: backToProfile,
        });
      },
    }),
  );
}

// --- Password change -------------------------------------------------------

function startPassword() {
  const form = document.createElement("form");
  form.className = "flow-form";
  form.noValidate = true;
  const current = passwordField("account-current", t("account.password_current_label"), "current-password", t("login.password_placeholder"));
  const next = passwordField("account-new", t("forgot.new_password_label"), "new-password", t("register.password_placeholder"));
  const confirm = passwordField("account-confirm", t("register.confirm_label"), "confirm-password", t("register.confirm_placeholder"));
  const [currentInput, nextInput, confirmInput] = [current, next, confirm].map((f) => f.querySelector("input"));
  const submit = window.buttonModule.renderButton({ label: t("forgot.new_submit"), type: "submit" });
  form.append(
    window.inputModule.renderInputStack([current, next, confirm]),
    text("p", "flow-hint", t("register.password_hint")),
    submit,
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentOk = check(currentInput, currentInput.value ? null : "validation.password_required");
    const nextOk = check(nextInput, window.validators.validatePassword(nextInput.value));
    const confirmOk = check(confirmInput, window.validators.validateConfirm(confirmInput.value, nextInput.value));
    if (!currentOk) return currentInput.focus();
    if (!nextOk) return nextInput.focus();
    if (!confirmOk) return;
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork
      .request("account-password-save", () => currentInput.value === user.password)
      .then((valid) => {
        if (!valid) {
          window.buttonModule.setButtonLoading(submit, false);
          return check(currentInput, "account.password_current_wrong");
        }
        window.storage.updateUser(user.id, { password: nextInput.value });
        showDone({
          title: t("account.password_done_title"),
          message: t("account.password_done_message"),
          buttonLabel: t("account.back_to_profile"),
          onAction: backToProfile,
        });
      });
  });

  show(form);
}

// --- Account deletion ------------------------------------------------------

function startDelete() {
  show(
    window.codeStepModule.renderCodeStep({
      email: user.username,
      submitLabel: t("account.delete_submit"),
      onVerified: () => {
        window.storage.deleteUser(user.id);
        window.storage.logout();
        showDone({
          title: t("account.delete_done_title"),
          message: t("account.delete_done_message"),
          buttonLabel: t("forgot.done_button"),
          onAction: () => {
            window.location.href = "../login/login.html";
          },
        });
      },
    }),
  );
}

// Guests and unknown flows have nothing to change here.
if (!user) {
  window.location.replace("../profile/profile.html");
} else if (FLOWS[flow] && (flow !== "password" || window.storage.canChangePassword())) {
  FLOWS[flow]();
} else {
  backToProfile();
}

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

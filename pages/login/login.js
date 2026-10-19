window.i18n.initI18n();

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = window.i18n.t(el.dataset.i18n);
});

document.getElementById("login-fields").appendChild(
  window.inputModule.renderInputStack([
    window.inputModule.renderInput({
      id: "login-username",
      label: window.i18n.t("login.username_label"),
      placeholder: window.i18n.t("login.username_placeholder"),
      name: "username",
      icon: "mail",
      required: true,
    }),
    window.inputModule.renderInput({
      id: "login-password",
      label: window.i18n.t("login.password_label"),
      type: "password",
      placeholder: window.i18n.t("login.password_placeholder"),
      name: "password",
      icon: "lock",
      required: true,
    }),
  ]),
);

const submitButton = window.buttonModule.renderButton({
  label: window.i18n.t("login.submit_button"),
  variant: "primary",
  type: "submit",
});
document.getElementById("login-submit-button").appendChild(submitButton);

function goHome() {
  window.location.href = "../home/home.html";
}

// Social / BÉT Portal logins are mocked: they sign in the demo user after a
// short simulated round trip, with the tapped button showing progress.
function providerLogo(provider) {
  if (provider !== "bet_portal") return window.iconModule.renderBrandLogo(provider);
  // Simplified BÉT logo on a light tile (navy is unreadable on dark, no recoloring).
  const img = document.createElement("img");
  img.src = "../../assets/logo-bet-simple.png";
  img.alt = "";
  img.className = "login-portal-logo";
  return img;
}

["google", "apple", "bet_portal"].forEach((provider) => {
  const button = window.buttonModule.renderButton({
    label: window.i18n.t("login." + provider),
    variant: "outline",
    iconNode: providerLogo(provider),
    onClick: () => {
      window.buttonModule.setButtonLoading(button, true);
      window.mockNetwork.delay().then(() => {
        window.storage.setCurrentUser("demouser", provider);
        goHome();
      });
    },
  });
  const target = provider === "bet_portal" ? "login-portal-button" : "login-social-buttons";
  document.getElementById(target).appendChild(button);
});

// Guest mode: no session; registered-only features show the "registration
// required" sheet.
document.getElementById("login-guest-button").appendChild(
  window.textButtonModule.renderTextButton({
    label: window.i18n.t("login.guest"),
    icon: "chevron-right",
    onClick: () => {
      window.storage.logout();
      goHome();
    },
  }),
);

document.getElementById("login-forgot").appendChild(
  window.textButtonModule.renderTextButton({
    label: window.i18n.t("login.forgot"),
    onClick: () => window.pageTransition.go("../forgot-password/forgot-password.html"),
  }),
);

const registerPrompt = document.createElement("span");
registerPrompt.className = "login-register-prompt";
registerPrompt.textContent = window.i18n.t("login.register_prompt");
document.getElementById("login-register").append(
  registerPrompt,
  window.textButtonModule.renderTextButton({
    label: window.i18n.t("login.register"),
    onClick: () => window.pageTransition.go("../register/register.html"),
  }),
);

// Biometric login (FK_005) is offered once a user turned it on after registering.
const biometricUser = window.storage.getUsers().find((user) => user.biometric);
if (biometricUser) {
  const biometricButton = window.buttonModule.renderButton({
    label: window.i18n.t("login.biometric"),
    variant: "outline",
    iconNode: window.iconModule.renderIcon("shield"),
    onClick: () => {
      window.buttonModule.setButtonLoading(biometricButton, true);
      window.mockNetwork.delay().then(() => {
        window.storage.setCurrentUser(biometricUser.id);
        goHome();
      });
    },
  });
  document.getElementById("login-biometric").appendChild(biometricButton);
}

// Validation runs in JS (the form is `novalidate`): empty fields get an inline
// message; a wrong password shows a banner above the button and keeps
// whatever the user typed.
const usernameInput = document.getElementById("login-username");
const passwordInput = document.getElementById("login-password");
const errorSlot = document.getElementById("login-error");
// Disabled while a field is empty and during a lockout (FK_0072).
let locked = false;
const syncSubmit = window.buttonModule.requireFilled(submitButton, [usernameInput, passwordInput], () => !locked);

function validateFields() {
  // Autofill doesn't fire `input`, so stale messages are cleared here too.
  window.inputModule.clearFieldError(usernameInput);
  window.inputModule.clearFieldError(passwordInput);
  let firstInvalid = null;
  if (!usernameInput.value.trim()) {
    window.inputModule.setFieldError(usernameInput, window.i18n.t("login.username_required"));
    firstInvalid = usernameInput;
  }
  if (!passwordInput.value) {
    window.inputModule.setFieldError(passwordInput, window.i18n.t("login.password_required"));
    firstInvalid = firstInvalid || passwordInput;
  }
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function showLoginError(messageKey) {
  window.buttonModule.setButtonLoading(submitButton, false);
  const banner = window.bannerModule.renderBanner({
    text: window.i18n.t(messageKey),
    variant: "warning",
    icon: "exclamationmark-circle",
  });
  errorSlot.replaceChildren(window.motion.fadeIn(banner));
  passwordInput.focus();
  passwordInput.select();
}

// After five failed attempts the button locks for 5, 10, 30, then 60 seconds (FK_0072).
// The banner counts down; the lock lives in storage, so a reload does not skip it.
function showLock(seconds) {
  locked = true;
  syncSubmit();
  const banner = window.bannerModule.renderBanner({ text: "", variant: "warning", icon: "clock" });
  errorSlot.replaceChildren(banner);
  window.mockNetwork.countdown(
    seconds,
    (left) => {
      banner.querySelector(".banner-text").textContent = window.i18n.t("login.locked").replace("{seconds}", left);
    },
    () => {
      locked = false;
      syncSubmit();
      errorSlot.replaceChildren();
    },
  );
}

function applyExistingLock() {
  const seconds = window.storage.getLoginLockSeconds();
  if (seconds > 0) showLock(seconds);
}
applyExistingLock();

function signIn(username, password) {
  return window.mockNetwork.request("login", () => {
    const user = window.storage.findUserByUsername(username);
    return user && user.password === password ? user : null;
  });
}

document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  errorSlot.replaceChildren();
  if (window.storage.getLoginLockSeconds() > 0) return applyExistingLock();
  if (!validateFields()) return;

  window.buttonModule.setButtonLoading(submitButton, true);
  signIn(usernameInput.value.trim(), passwordInput.value)
    .then((user) => {
      if (!user) {
        const lockSeconds = window.storage.registerLoginFailure();
        if (lockSeconds > 0) {
          window.buttonModule.setButtonLoading(submitButton, false);
          showLock(lockSeconds);
        } else {
          showLoginError("login.error");
        }
        return;
      }
      window.storage.clearLoginFailures();
      window.storage.setCurrentUser(user.id);
      goHome();
    })
    .catch(() => showLoginError("state.error_message"));
});

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(
    window.iphoneFrame.renderIphoneFrame(
      document.getElementById("screen-content"),
    ),
  );
  document.body.classList.add("has-iphone-frame");
}

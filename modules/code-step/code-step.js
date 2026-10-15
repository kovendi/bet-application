// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// The "enter the six-digit e-mail code" step shared by registration (FK_0063),
// password reset (FK_008) and account deletion (FK_0095): lead text, the code
// field, a submit button and a resend link that unlocks 1 minute after sending
// (FK_0064). The code does not expire. The mockup accepts MOCK_CODE only and
// shows it in an info banner, since no e-mail is really sent.
//
// The code is entered in six single-digit boxes (auto-advance, paste, backspace); it submits itself
// when the sixth digit is in. Needs: i18n, icon, input, button, text-button, banner, motion, mock-network, validators
// (js + css where a module has one).
//
// Usage:
//   container.appendChild(window.codeStepModule.renderCodeStep({
//     email: 'demo@example.com',
//     submitLabel: 'Megerősítés',
//     onVerified: () => {...},
//   }));

window.codeStepModule = (function () {
  const MOCK_CODE = "123456";
  const CODE_LENGTH = 6;
  const RESEND_SECONDS = 60;
  const t = (key) => window.i18n.t(key);

  function renderCodeStep({ email, submitLabel, onVerified } = {}) {
    const form = document.createElement("form");
    form.className = "code-step";
    form.noValidate = true;

    const lead = document.createElement("p");
    lead.className = "code-step-lead";
    lead.textContent = t("code_step.lead").replace("{email}", email);

    const demo = window.bannerModule.renderBanner({
      text: t("code_step.demo_hint").replace("{code}", MOCK_CODE),
      icon: "info",
    });

    const group = document.createElement("div");
    group.className = "code-step-group";
    const label = document.createElement("label");
    label.className = "code-step-label";
    label.setAttribute("for", "code-step-0");
    label.textContent = t("code_step.label");
    const boxes = document.createElement("div");
    boxes.className = "code-step-boxes";
    boxes.setAttribute("role", "group");
    boxes.setAttribute("aria-label", t("code_step.label"));
    const errorEl = document.createElement("p");
    errorEl.className = "code-step-error";
    errorEl.setAttribute("role", "alert");

    const inputs = Array.from({ length: CODE_LENGTH }, (_, index) => {
      const box = document.createElement("input");
      box.className = "code-step-box";
      box.id = `code-step-${index}`;
      box.type = "text";
      box.inputMode = "numeric";
      box.autocomplete = index === 0 ? "one-time-code" : "off";
      box.maxLength = 1;
      box.setAttribute("aria-label", `${index + 1} / ${CODE_LENGTH}`);
      return box;
    });
    boxes.append(...inputs);
    group.append(label, boxes, errorEl);

    const getCode = () => inputs.map((box) => box.value).join("");
    const setError = (message) => {
      errorEl.textContent = message;
      errorEl.classList.toggle("code-step-error--visible", Boolean(message));
      inputs.forEach((box) => box.classList.toggle("code-step-box--error", Boolean(message)));
    };
    // Digits only; typing moves on, backspace goes back, pasting fills all boxes.
    const fill = (start, digits) => {
      digits.split("").forEach((digit, offset) => {
        if (inputs[start + offset]) inputs[start + offset].value = digit;
      });
      const next = Math.min(start + digits.length, CODE_LENGTH - 1);
      inputs[next].focus();
      setError("");
      if (getCode().length === CODE_LENGTH) form.requestSubmit();
    };
    inputs.forEach((box, index) => {
      box.addEventListener("input", () => {
        const digits = box.value.replace(/\D/g, "");
        box.value = "";
        if (digits) fill(index, digits);
      });
      box.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !box.value && index > 0) {
          inputs[index - 1].value = "";
          inputs[index - 1].focus();
        }
        if (event.key === "ArrowLeft" && index > 0) inputs[index - 1].focus();
        if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs[index + 1].focus();
      });
      box.addEventListener("paste", (event) => {
        event.preventDefault();
        const digits = (event.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, CODE_LENGTH);
        if (digits) fill(0, digits);
      });
      box.addEventListener("focus", () => box.select());
    });

    const submit = window.buttonModule.renderButton({ label: submitLabel, type: "submit" });
    const resendSlot = document.createElement("div");
    resendSlot.className = "code-step-resend";
    startResendCountdown(resendSlot);

    form.append(lead, demo, group, submit, resendSlot);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setError("");
      if (getCode().length !== CODE_LENGTH) {
        setError(t("code_step.error_length"));
        inputs.find((box) => !box.value).focus();
        return;
      }
      window.buttonModule.setButtonLoading(submit, true);
      window.mockNetwork.request("verify-code", () => getCode() === MOCK_CODE).then((ok) => {
        window.buttonModule.setButtonLoading(submit, false);
        if (!ok) {
          setError(t("code_step.error_wrong"));
          inputs.forEach((box) => (box.value = ""));
          inputs[0].focus();
          return;
        }
        onVerified();
      });
    });

    return form;
  }

  // While the countdown runs the resend control is plain text; afterwards it becomes a button.
  function startResendCountdown(slot) {
    const waiting = document.createElement("p");
    waiting.className = "code-step-wait";
    waiting.setAttribute("aria-live", "polite");
    slot.replaceChildren(waiting);
    window.mockNetwork.countdown(
      RESEND_SECONDS,
      (left) => {
        waiting.textContent = t("code_step.resend_wait").replace("{seconds}", left);
      },
      () => {
        slot.replaceChildren(
          window.textButtonModule.renderTextButton({
            label: t("code_step.resend"),
            icon: "refresh",
            onClick: () => {
              window.toastModule.showToast({ message: t("code_step.resent"), icon: "check" });
              startResendCountdown(slot);
            },
          }),
        );
      },
    );
  }

  return { MOCK_CODE, renderCodeStep };
})();

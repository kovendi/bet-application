// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Logic-only form validators (no paired CSS). Each returns `null` when the value
// is valid, otherwise the i18n key of the error message.
//
//   window.validators.validateEmail(value)          -> null | 'validation.email_required' | 'validation.email_invalid'
//   window.validators.validatePassword(value)       -> null | 'validation.password_*' (FK_004: 12–32 chars,
//                                                      lower + upper case + digit, special characters allowed)
//   window.validators.validateConfirm(value, other) -> null | 'validation.confirm_required' | 'validation.confirm_mismatch'

window.validators = (function () {
  const PASSWORD_MIN = 12;
  const PASSWORD_MAX = 32;

  function validateEmail(value) {
    const email = (value || "").trim();
    if (!email) return "validation.email_required";
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? null : "validation.email_invalid";
  }

  function validatePassword(value) {
    if (!value) return "validation.password_required";
    if (value.length < PASSWORD_MIN) return "validation.password_short";
    if (value.length > PASSWORD_MAX) return "validation.password_long";
    if (!/[a-zá-űő]/.test(value) || !/[A-ZÁ-ŰŐ]/.test(value) || !/[0-9]/.test(value)) return "validation.password_weak";
    return null;
  }

  function validateConfirm(value, other) {
    if (!value) return "validation.confirm_required";
    return value === other ? null : "validation.confirm_mismatch";
  }

  return { PASSWORD_MIN, PASSWORD_MAX, validateEmail, validatePassword, validateConfirm };
})();

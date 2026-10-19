// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Renders a labeled form field (label + input) — every input needs a real
// <label>, not just a placeholder.
//
// Usage in a page:
//   <script src="../../modules/input/input.js"></script>
//   <script>
//     container.appendChild(window.inputModule.renderInput({
//       id: 'login-username',
//       label: 'Username',
//       placeholder: 'Enter your username',
//       type: 'text',
//       name: 'username',
//       required: true,
//       autofocus: false,
//       multiline: false, // true -> textarea (rows, maxLength options)
//       icon: 'mail', // optional leading icon (needs modules/icon): compact row style,
//                     // label small above the value — meant for renderInputStack
//     }));
//     // several icon fields grouped in one rounded container with dividers:
//     container.appendChild(window.inputModule.renderInputStack([field1, field2]));
//
//     // Field-level validation message (icon + text in the negative color,
//     // aria-invalid + aria-describedby). It clears itself as soon as the user
//     // edits the field; forms use `novalidate` and validate in JS.
//     window.inputModule.setFieldError(inputEl, t('login.username_required'));
//     window.inputModule.clearFieldError(inputEl);
//   </script>

window.inputModule = (function () {
  function renderInput({
    id,
    label,
    type = "text",
    placeholder = "",
    name,
    required = false,
    autofocus = false,
    icon,
    multiline = false,
    maxLength,
    rows = 5,
  } = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "app-input-group";

    const labelEl = document.createElement("label");
    labelEl.className = "app-input-label";
    labelEl.setAttribute("for", id);
    labelEl.textContent = label;

    // multiline: a textarea with the same look (feedback text); maxLength caps it.
    const inputEl = document.createElement(multiline ? "textarea" : "input");
    inputEl.className = multiline ? "app-input app-input--multiline" : "app-input";
    inputEl.id = id;
    if (multiline) inputEl.rows = rows;
    else inputEl.type = type;
    if (maxLength) inputEl.maxLength = maxLength;
    inputEl.placeholder = placeholder;
    inputEl.name = name || id;
    inputEl.required = required;
    inputEl.autofocus = autofocus;

    if (icon) {
      wrapper.classList.add("app-input-group--row");
      const iconEl = window.iconModule.renderIcon(icon);
      iconEl.classList.add("app-input-icon");
      const body = document.createElement("div");
      body.className = "app-input-body";
      body.append(labelEl, inputEl);
      wrapper.append(iconEl, body);
      return wrapper;
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(inputEl);
    return wrapper;
  }

  function renderInputStack(fields = []) {
    const stack = document.createElement("div");
    stack.className = "app-input-stack";
    fields.forEach((field) => stack.appendChild(field));
    return stack;
  }

  // The error line sits under the input: inside the row body for icon fields,
  // at the end of the group otherwise. Built once, then only toggled, so it can
  // animate open and closed.
  function getErrorElement(inputEl) {
    const host = inputEl.closest(".app-input-body") || inputEl.closest(".app-input-group");
    let errorEl = host.querySelector(".app-input-error");
    if (errorEl) return errorEl;

    errorEl = document.createElement("div");
    errorEl.className = "app-input-error";
    errorEl.id = `${inputEl.id}-error`;
    const inner = document.createElement("div");
    inner.className = "app-input-error-inner";
    inner.appendChild(window.iconModule.renderIcon("exclamationmark-circle"));
    const text = document.createElement("span");
    text.className = "app-input-error-text";
    inner.appendChild(text);
    errorEl.appendChild(inner);
    host.appendChild(errorEl);

    inputEl.addEventListener("input", () => clearFieldError(inputEl));
    return errorEl;
  }

  function setFieldError(inputEl, message) {
    const errorEl = getErrorElement(inputEl);
    errorEl.querySelector(".app-input-error-text").textContent = message;
    errorEl.setAttribute("role", "alert");
    errorEl.classList.add("app-input-error--visible");
    inputEl.setAttribute("aria-invalid", "true");
    inputEl.setAttribute("aria-describedby", errorEl.id);
  }

  function clearFieldError(inputEl) {
    const host = inputEl.closest(".app-input-body") || inputEl.closest(".app-input-group");
    const errorEl = host && host.querySelector(".app-input-error");
    if (!errorEl) return;
    errorEl.classList.remove("app-input-error--visible");
    errorEl.removeAttribute("role");
    inputEl.removeAttribute("aria-invalid");
    inputEl.removeAttribute("aria-describedby");
  }

  return { renderInput, renderInputStack, setFieldError, clearFieldError };
})();

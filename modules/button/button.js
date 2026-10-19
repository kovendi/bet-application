// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Usage in a page:
//   <script src="../../modules/button/button.js"></script>
//   <script>
//     container.appendChild(window.buttonModule.renderButton({
//       label: 'Log in',
//       variant: 'primary', // 'primary' | 'secondary' | 'outline'
//       type: 'submit',
//       iconNode: someElement, // optional leading icon/logo element
//       onClick: () => {...},
//     }));
//
//     // Disabled until every required field is filled:
//     buttonModule.requireFilled(submitButton, [inputEl, textareaEl]);
//     // While a (mock) request runs: spinner instead of the label, disabled,
//     // aria-busy. Turn it off again on success or error.
//     window.buttonModule.setButtonLoading(button, true);
//   </script>

window.buttonModule = (function () {
  function renderButton({
    label,
    variant = "primary",
    type = "button",
    fullWidth = true,
    disabled = false,
    iconNode,
    onClick,
  } = {}) {
    const button = document.createElement("button");
    button.type = type;
    button.className = `app-button app-button--${variant}`;
    if (fullWidth) button.classList.add("app-button--full-width");
    if (iconNode) {
      // Optional leading element (e.g. a provider logo), placed before the label.
      button.classList.add("app-button--with-icon");
      iconNode.classList.add("app-button-icon");
      button.appendChild(iconNode);
    }
    const labelEl = document.createElement("span");
    labelEl.className = "app-button-label";
    labelEl.textContent = label;
    button.appendChild(labelEl);
    button.disabled = disabled;
    if (onClick) button.addEventListener("click", onClick);
    return button;
  }

  function setButtonLoading(button, isLoading) {
    let spinner = button.querySelector(".app-button-spinner");
    if (isLoading && !spinner) {
      spinner = document.createElement("span");
      spinner.className = "app-button-spinner";
      spinner.setAttribute("aria-hidden", "true");
      button.appendChild(spinner);
    }
    button.classList.toggle("app-button--loading", isLoading);
    // After loading a form button goes back to what its required fields say.
    button.disabled = isLoading || (button.syncRequired ? !button.syncRequired(false) : false);
    button.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  // A submit button that stays disabled until every required field has a value,
  // so an empty form can never be sent. `fields` are the input/textarea elements;
  // `isReady` adds a condition of its own (e.g. a switch, a lock). Returns a sync
  // function to call after the state changes without an `input` event (programmatic
  // value changes, switches).
  function requireFilled(button, fields, isReady = () => true) {
    const sync = (apply = true) => {
      const ready = fields.every((field) => field.value.trim()) && isReady();
      if (apply) button.disabled = !ready;
      return ready;
    };
    button.syncRequired = sync;
    fields.forEach((field) => field.addEventListener("input", () => sync()));
    sync();
    return sync;
  }

  return { renderButton, setButtonLoading, requireFilled };
})();

// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Short success / info message that drops in from the top and dismisses
// itself (tap dismisses it early). The visible time is a CSS animation delay
// (--duration-toast-visible), not a timer. One region per page, created on
// first use, inside the iPhone frame on desktop.
//
// Requires modules/icon/icon.js and modules/motion/motion.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/toast/toast.js"></script>
//   <script>
//     window.toastModule.showToast({ message: 'Mentve', icon: 'check' }); // icon optional
//   </script>

window.toastModule = (function () {
  function getRegion() {
    let region = document.querySelector(".toast-region");
    if (region) return region;

    const frame = document.querySelector(".iphone-frame");
    region = document.createElement("div");
    region.className = "toast-region";
    if (frame) region.classList.add("toast-region--framed");
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    (frame || document.body).appendChild(region);
    return region;
  }

  function dismiss(toast) {
    if (toast.classList.contains("toast--leaving")) return;
    toast.classList.remove("toast--auto-leave");
    window.motion.playOut(toast, "toast--leaving", () => toast.remove());
  }

  function showToast({ message, icon } = {}) {
    const toast = document.createElement("div");
    toast.className = "toast toast--auto-leave";

    if (icon) {
      const iconEl = window.iconModule.renderIcon(icon);
      iconEl.classList.add("toast-icon");
      toast.appendChild(iconEl);
    }
    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);

    // The auto-leave animation is the second one in the list; when it ends the
    // toast is gone visually, so drop it from the DOM.
    toast.addEventListener("animationend", (event) => {
      if (event.animationName === "toast-out") toast.remove();
    });
    toast.addEventListener("click", () => dismiss(toast));

    getRegion().appendChild(toast);
    return toast;
  }

  return { showToast };
})();

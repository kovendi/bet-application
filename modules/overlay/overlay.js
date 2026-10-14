// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// The one shared modal layer behind confirm-dialog and bottom-sheet: blurred,
// dimmed backdrop that fades in and out, closes on Esc and on a backdrop tap,
// returns focus to where it was. On desktop it lives inside the iPhone frame
// (clipped to the screen's rounded corners), otherwise on <body>.
//
// Requires modules/motion/motion.js to be loaded first.
//
// Usage (inside a module — pages use confirm-dialog / bottom-sheet instead):
//   const layer = window.overlayModule.openOverlay({
//     placement: 'bottom', // 'center' | 'bottom'
//     content: panelEl, // gets its own exit animation via `.overlay--closing <panel>`
//     onDismiss: () => layer.close(), // Esc / backdrop tap
//   });
//   layer.close(() => {...}); // animates out, then removes; callback optional

window.overlayModule = (function () {
  function openOverlay({ placement = "center", content, onDismiss } = {}) {
    const frame = document.querySelector(".iphone-frame");
    const previousFocus = document.activeElement;

    const overlay = document.createElement("div");
    overlay.className = `overlay overlay--${placement}`;
    if (frame) overlay.classList.add("overlay--framed");
    if (content) overlay.appendChild(content);

    let isClosing = false;

    function onKeydown(event) {
      if (event.key === "Escape" && onDismiss) onDismiss();
    }

    function close(onClosed) {
      if (isClosing) return;
      isClosing = true;
      document.removeEventListener("keydown", onKeydown);
      window.motion.playOut(overlay, "overlay--closing", () => {
        overlay.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        if (onClosed) onClosed();
      });
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay && onDismiss) onDismiss();
    });
    document.addEventListener("keydown", onKeydown);

    (frame || document.body).appendChild(overlay);
    return { overlay, close };
  }

  return { openOverlay };
})();

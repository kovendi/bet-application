// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so every module here attaches its API to `window` instead.
//
// Wraps a page's content in a realistic iPhone frame on desktop, so the
// mockup looks right without forcing anyone into mobile browser mode.
// On a real mobile device, the frame is skipped (see isRealMobileDevice).
//
// Usage in a page:
//   <div id="screen-content">...page markup...</div>
//   <script src="../../modules/iphone-frame/iphone-frame.js"></script>
//   <script>
//     if (!window.iphoneFrame.isRealMobileDevice()) {
//       document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById('screen-content')));
//       document.body.classList.add('has-iphone-frame');
//     }
//   </script>

window.iphoneFrame = (function () {
  function isRealMobileDevice() {
    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const uaData = navigator.userAgentData;
    const isMobileUA = uaData ? uaData.mobile : /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return hasCoarsePointer && isMobileUA;
  }

  function renderIphoneFrame(contentEl) {
    const frame = document.createElement("div");
    frame.className = "iphone-frame";

    const notch = document.createElement("div");
    notch.className = "iphone-notch";

    const screen = document.createElement("div");
    screen.className = "iphone-screen";
    screen.appendChild(contentEl);

    frame.appendChild(notch);
    frame.appendChild(screen);

    return frame;
  }

  return { isRealMobileDevice, renderIphoneFrame };
})();

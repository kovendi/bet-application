// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so every module here attaches its API to `window` instead.
//
// Wraps a page's content in a realistic device frame on desktop, so the
// mockup looks right without forcing anyone into mobile browser mode.
// On a real mobile device, the frame is skipped (see isRealMobileDevice).
// With the frame, a device switcher sits top right of the browser window:
// mobile / tablet / desktop / custom (width x height in px), plus a
// portrait/landscape toggle for the presets. The choice is remembered across
// pages (localStorage). Frames larger than the window are scaled down to fit,
// so the page still lays out at the device's real CSS width.
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
  // Screen size in CSS px, portrait (short side first). `landscape` is the
  // orientation picked when switching to that device.
  const DEVICES = {
    mobile: { width: 390, height: 844, landscape: false }, // iPhone 14/15
    tablet: { width: 820, height: 1180, landscape: false }, // iPad Air
    desktop: { width: 900, height: 1440, landscape: true }, // 1440 x 900 laptop
  };
  const CUSTOM_MIN = 200;
  const CUSTOM_MAX = 3840;
  const FIT_MARGIN_X = 24;
  const FIT_MARGIN_Y = 64; // keeps the frame clear of the switcher on small windows

  const STORAGE_KEY = "iphoneFrameState";
  const DEFAULT_STATE = { device: "mobile", orientation: "portrait", customWidth: 1024, customHeight: 768 };

  function isRealMobileDevice() {
    const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const uaData = navigator.userAgentData;
    const isMobileUA = uaData ? uaData.mobile : /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return hasCoarsePointer && isMobileUA;
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const state = Object.assign({}, DEFAULT_STATE, stored);
      if (state.device !== "custom" && !DEVICES[state.device]) state.device = DEFAULT_STATE.device;
      return state;
    } catch (e) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function tr(key) {
    return window.i18n ? window.i18n.t(key) : key;
  }

  function clampSize(value) {
    const n = Math.round(Number(value));
    if (!isFinite(n)) return CUSTOM_MIN;
    return Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, n));
  }

  function screenSize(state) {
    if (state.device === "custom") return { width: state.customWidth, height: state.customHeight };
    const d = DEVICES[state.device];
    return state.orientation === "landscape" ? { width: d.height, height: d.width } : { width: d.width, height: d.height };
  }

  // Scale the frame down (never up) so it fits the browser window.
  function fit(frame) {
    const style = getComputedStyle(frame);
    const pad = parseFloat(style.getPropertyValue("--frame-padding")) || 0;
    const w = parseFloat(style.getPropertyValue("--frame-screen-width")) + 2 * pad;
    const h = parseFloat(style.getPropertyValue("--frame-screen-height")) + 2 * pad;
    const scale = Math.min(1, (window.innerWidth - 2 * FIT_MARGIN_X) / w, (window.innerHeight - 2 * FIT_MARGIN_Y) / h);
    if (!isFinite(scale)) return; // detached frame: computed style not available yet
    frame.style.setProperty("--frame-scale", String(Math.max(0.1, scale)));
  }

  function applyState(frame, controls, state) {
    const size = screenSize(state);
    const isCustom = state.device === "custom";
    ["mobile", "tablet", "desktop", "custom"].forEach(function (name) {
      frame.classList.toggle("iphone-frame--" + name, state.device === name);
    });
    frame.classList.toggle("iphone-frame--landscape", !isCustom && state.orientation === "landscape");
    frame.style.setProperty("--frame-screen-width", size.width + "px");
    frame.style.setProperty("--frame-screen-height", size.height + "px");

    controls.select.value = state.device;
    controls.customGroup.hidden = !isCustom;
    controls.orientationGroup.hidden = isCustom;
    controls.widthInput.value = state.customWidth;
    controls.heightInput.value = state.customHeight;
    controls.orientationButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.orientation === state.orientation));
    });

    fit(frame);
  }

  // Short visible label ("Sz" / "W") wrapping the number field.
  function renderSizeField(labelKey, input) {
    const field = document.createElement("label");
    field.className = "frame-switcher-field";
    const text = document.createElement("span");
    text.textContent = tr(labelKey + "_short");
    field.append(text, input);
    return field;
  }

  function renderSizeInput(labelKey) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "frame-switcher-input";
    input.min = String(CUSTOM_MIN);
    input.max = String(CUSTOM_MAX);
    input.step = "1";
    input.inputMode = "numeric";
    input.title = tr(labelKey);
    return input;
  }

  function renderControls(frame, state) {
    const bar = document.createElement("div");
    bar.className = "frame-switcher";

    const select = document.createElement("select");
    select.className = "frame-switcher-select";
    select.setAttribute("aria-label", tr("frame.device"));
    ["mobile", "tablet", "desktop", "custom"].forEach(function (name) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = tr("frame." + name);
      select.appendChild(option);
    });

    const customGroup = document.createElement("div");
    customGroup.className = "frame-switcher-group";
    const widthInput = renderSizeInput("frame.width");
    const heightInput = renderSizeInput("frame.height");
    customGroup.append(renderSizeField("frame.width", widthInput), renderSizeField("frame.height", heightInput));

    const orientationGroup = document.createElement("div");
    orientationGroup.className = "frame-switcher-group";
    const orientationButtons = [
      ["portrait", "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"],
      ["landscape", "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"],
    ].map(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "frame-switcher-btn";
      btn.dataset.orientation = item[0];
      btn.setAttribute("aria-label", tr("frame." + item[0]));
      btn.title = tr("frame." + item[0]);
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="' +
        item[1] +
        '"/></svg>';
      orientationGroup.appendChild(btn);
      return btn;
    });

    bar.append(select, customGroup, orientationGroup);

    const controls = { select, customGroup, orientationGroup, widthInput, heightInput, orientationButtons };

    function update(patch) {
      Object.assign(state, patch);
      saveState(state);
      applyState(frame, controls, state);
    }

    select.addEventListener("change", function () {
      const device = select.value;
      const patch = { device: device };
      if (DEVICES[device]) patch.orientation = DEVICES[device].landscape ? "landscape" : "portrait";
      update(patch);
    });
    orientationButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        update({ orientation: btn.dataset.orientation });
      });
    });
    [
      [widthInput, "customWidth"],
      [heightInput, "customHeight"],
    ].forEach(function (pair) {
      pair[0].addEventListener("change", function () {
        const patch = {};
        patch[pair[1]] = clampSize(pair[0].value);
        update(patch);
      });
    });

    return { bar, controls };
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

    // State is applied before the frame is in the DOM, so a stored
    // device/orientation shows up immediately instead of animating in.
    const state = loadState();
    const switcher = renderControls(frame, state);
    document.body.appendChild(switcher.bar);
    applyState(frame, switcher.controls, state);
    window.addEventListener("resize", function () {
      fit(frame);
    });
    // The first fit ran while the frame was detached (padding unknown); redo it once attached.
    requestAnimationFrame(function () {
      frame.classList.add("iphone-frame--static");
      fit(frame);
      requestAnimationFrame(function () {
        frame.classList.remove("iphone-frame--static");
      });
    });

    return frame;
  }

  return { isRealMobileDevice, renderIphoneFrame };
})();

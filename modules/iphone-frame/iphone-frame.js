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
// The camera button in the switcher downloads a PNG of the current screen in
// its frame (transparent corners) via the browser's tab-share API; the first
// click asks for permission to share the tab.
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

  // --- Screenshot -----------------------------------------------------------
  // Captures this tab with the browser's screen-share API (pixel-exact, no
  // library, works on file://), crops it to the device frame and downloads a
  // PNG with transparent corners. The share stays open, so only the first
  // capture asks for permission.

  const CAMERA_PATH =
    "M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z";
  let captureVideo = null;

  function stopCapture() {
    if (!captureVideo) return;
    captureVideo.srcObject.getTracks().forEach(function (track) {
      track.stop();
    });
    captureVideo.remove();
    captureVideo = null;
  }

  function ensureCaptureVideo() {
    if (captureVideo) return Promise.resolve(captureVideo);
    return navigator.mediaDevices
      .getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      })
      .then(function (stream) {
        const video = document.createElement("video");
        video.className = "frame-capture-video";
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        document.body.appendChild(video);
        stream.getVideoTracks()[0].addEventListener("ended", stopCapture);
        captureVideo = video;
        return video.play().then(function () {
          return video;
        });
      });
  }

  // Resolves with the first video frame captured after `since` (performance.now()).
  function nextFrameAfter(video, since) {
    return new Promise(function (resolve) {
      function onFrame(now, meta) {
        if (meta.captureTime !== undefined && meta.captureTime < since) {
          video.requestVideoFrameCallback(onFrame);
          return;
        }
        resolve();
      }
      video.requestVideoFrameCallback(onFrame);
    });
  }

  function cropToFrame(video, frame) {
    const style = getComputedStyle(frame);
    const scale = parseFloat(style.getPropertyValue("--frame-scale")) || 1;
    const edge = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--space-2")) || 0) * scale;
    const ratio = video.videoWidth / window.innerWidth;
    const rect = frame.getBoundingClientRect();
    const x = Math.round((rect.left - edge) * ratio);
    const y = Math.round((rect.top - edge) * ratio);
    const w = Math.round((rect.width + 2 * edge) * ratio);
    const h = Math.round((rect.height + 2 * edge) * ratio);
    const radius = ((parseFloat(style.borderTopLeftRadius) || 0) * scale + edge) * ratio;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.clip();
    ctx.drawImage(video, x, y, w, h, 0, 0, w, h);
    return canvas;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  // e.g. home-mock-error-mobile-portrait-20261019-1432.png
  function captureFileName(state) {
    const page = (location.pathname.split("/").pop() || "screen").replace(/\.html?$/, "");
    const query = location.search.slice(1).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    const now = new Date();
    const stamp =
      now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate()) + "-" + pad2(now.getHours()) + pad2(now.getMinutes());
    const orientation = state.device === "custom" ? state.customWidth + "x" + state.customHeight : state.orientation;
    return [page, query, state.device, orientation, stamp].filter(Boolean).join("-") + ".png";
  }

  function downloadCanvas(canvas, fileName) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("empty capture"));
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  }

  function captureFrame(frame, state) {
    return ensureCaptureVideo().then(function (video) {
      document.body.classList.add("is-capturing");
      const since = performance.now();
      return nextFrameAfter(video, since)
        .then(function () {
          return downloadCanvas(cropToFrame(video, frame), captureFileName(state));
        })
        .finally(function () {
          document.body.classList.remove("is-capturing");
        });
    });
  }

  function flashButton(btn, className) {
    btn.classList.remove("frame-switcher-btn--done", "frame-switcher-btn--error");
    btn.classList.add(className);
    btn.addEventListener(
      "animationend",
      function () {
        btn.classList.remove(className);
      },
      { once: true },
    );
  }

  function renderCaptureButton(frame, state) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "frame-switcher-btn frame-switcher-capture";
    btn.setAttribute("aria-label", tr("frame.screenshot"));
    btn.title = tr("frame.screenshot");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
      CAMERA_PATH +
      '"/></svg>';

    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    btn.addEventListener("click", function () {
      if (!supported) {
        btn.title = tr("frame.screenshot_error");
        flashButton(btn, "frame-switcher-btn--error");
        return;
      }
      btn.disabled = true;
      captureFrame(frame, state)
        .then(function () {
          btn.title = tr("frame.screenshot");
          flashButton(btn, "frame-switcher-btn--done");
        })
        .catch(function () {
          btn.title = tr("frame.screenshot_error");
          flashButton(btn, "frame-switcher-btn--error");
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
    window.addEventListener("pagehide", stopCapture);
    return btn;
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

    const captureGroup = document.createElement("div");
    captureGroup.className = "frame-switcher-group";
    captureGroup.appendChild(renderCaptureButton(frame, state));

    bar.append(select, customGroup, orientationGroup, captureGroup);

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

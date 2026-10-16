// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Simulated network for the mockup: the ONLY place in the codebase allowed to
// use setTimeout (see CLAUDE.md "Premium UI & interaction feedback"). Every
// screen that "loads" or "submits" goes through here, so loading, error and
// empty states can be demoed from the URL:
//
//   ?mock=error  every request() fails on its first try per key, then
//                succeeds — so the Retry action visibly recovers
//   ?mock=empty  pages render their empty state (they ask isEmptyMock())
//   ?mock=slow   3× the normal delay, to look at skeletons
//
// Logic-only module: no paired CSS.
//
// Usage in a page:
//   <script src="../../modules/mock-network/mock-network.js"></script>
//   <script>
//     window.mockNetwork
//       .request('home-feed', () => window.storage.getInstruments())
//       .then(render)
//       .catch(showError);
//     await window.mockNetwork.delay(); // plain wait, e.g. a mock submit
//     const cancel = window.mockNetwork.countdown(60, (left) => {...}, () => {...}); // 1 s ticks
//   </script>

window.mockNetwork = (function () {
  const DEFAULT_DELAY_MS = 700;
  const failedKeys = new Set();

  // ?mock= in the URL wins, else the saved Settings → Mockup choice
  // (modules/mock-settings, optional); 'normal' means no mock state.
  function getMockState() {
    const fromUrl = new URLSearchParams(window.location.search).get("mock");
    if (fromUrl) return fromUrl;
    const saved = window.mockSettings ? window.mockSettings.get("network") : "normal";
    return saved === "normal" ? null : saved;
  }

  function isEmptyMock() {
    return getMockState() === "empty";
  }

  function delay(ms = DEFAULT_DELAY_MS) {
    const factor = getMockState() === "slow" ? 3 : 1;
    return new Promise((resolve) => setTimeout(resolve, ms * factor));
  }

  function request(key, produce, { ms } = {}) {
    return delay(ms).then(() => {
      if (getMockState() === "error" && !failedKeys.has(key)) {
        failedKeys.add(key);
        throw new Error(`mock network error: ${key}`);
      }
      return produce();
    });
  }

  // One-second ticks for UI countdowns (resend code, login lock). Like delay(), the
  // timer lives here so pages never touch setInterval. Calls onTick(secondsLeft)
  // right away and every second, then onDone(); returns a function that cancels it.
  function countdown(seconds, onTick, onDone) {
    let left = seconds;
    onTick(left);
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        onTick(left);
        return;
      }
      clearInterval(timer);
      onDone();
    }, 1000);
    return () => clearInterval(timer);
  }

  return { delay, request, countdown, getMockState, isEmptyMock };
})();

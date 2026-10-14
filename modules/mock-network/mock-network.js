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
//   </script>

window.mockNetwork = (function () {
  const DEFAULT_DELAY_MS = 700;
  const failedKeys = new Set();

  function getMockState() {
    return new URLSearchParams(window.location.search).get("mock");
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

  return { delay, request, getMockState, isEmptyMock };
})();

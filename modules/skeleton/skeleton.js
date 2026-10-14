// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Loading placeholders. A skeleton must match the final layout, so the module
// only provides the shimmering block; the page gives each block its size with
// its own class (e.g. `.home-skeleton-main`). Swap the real content in with
// window.motion.fadeIn().
//
// Usage in a page:
//   <script src="../../modules/skeleton/skeleton.js"></script>
//   <script>
//     container.setAttribute('aria-busy', 'true');
//     container.append(
//       window.skeletonModule.renderSkeleton('home-skeleton-main'),
//       window.skeletonModule.renderSkeleton('home-skeleton-row', 'skeleton--text'),
//     );
//   </script>

window.skeletonModule = (function () {
  function renderSkeleton(...classNames) {
    const block = document.createElement("div");
    block.className = ["skeleton", ...classNames].join(" ");
    block.setAttribute("aria-hidden", "true");
    return block;
  }

  return { renderSkeleton };
})();

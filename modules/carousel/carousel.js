// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Swipeable highlight carousel (NYC_001–NYC_003): each slide has a title, a
// category tag and a link; it auto-advances (default 5 s, our proposal for
// NYC_002) and pauses while the user touches it. Slides are colored brand
// gradients (mock content has no real images).
//
// Requires modules/i18n/i18n.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/carousel/carousel.js"></script>
//   <script>
//     container.appendChild(window.carouselModule.renderCarousel({
//       items: window.storage.getCarouselItems(), // { id, title, category, gradient, link }
//       intervalMs: 5000, // optional, 0 turns auto-advance off
//     }));
//   </script>

window.carouselModule = (function () {
  function renderCarousel({ items = [], intervalMs = 5000 } = {}) {
    const root = document.createElement("div");
    root.className = "carousel";

    const track = document.createElement("div");
    track.className = "carousel-track";
    track.setAttribute("role", "region");
    track.setAttribute("aria-label", window.i18n.t("carousel.label"));

    items.forEach((item) => {
      const slide = document.createElement("a");
      slide.className = `carousel-slide carousel-slide--${item.gradient}`;
      slide.href = item.link;
      slide.target = "_blank";
      slide.rel = "noopener";
      const tag = document.createElement("span");
      tag.className = "carousel-tag";
      tag.textContent = item.category;
      const title = document.createElement("span");
      title.className = "carousel-title";
      title.textContent = item.title;
      slide.append(tag, title);
      track.appendChild(slide);
    });

    const dots = document.createElement("div");
    dots.className = "carousel-dots";
    const dotEls = items.map(() => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot";
      dots.appendChild(dot);
      return dot;
    });

    function currentIndex() {
      return Math.round(track.scrollLeft / (track.clientWidth || 1));
    }
    function markActive() {
      const index = currentIndex();
      dotEls.forEach((dot, i) => dot.classList.toggle("carousel-dot--active", i === index));
    }
    function goTo(index) {
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    }

    track.addEventListener("scroll", markActive, { passive: true });
    markActive();
    dotEls[0] && dotEls[0].classList.add("carousel-dot--active");

    let paused = false;
    ["pointerdown", "touchstart", "focusin"].forEach((evt) => track.addEventListener(evt, () => (paused = true)));
    ["pointerup", "touchend", "focusout"].forEach((evt) => track.addEventListener(evt, () => (paused = false)));

    if (intervalMs > 0 && items.length > 1) {
      setInterval(() => {
        if (paused || !root.isConnected) return;
        goTo((currentIndex() + 1) % items.length);
      }, intervalMs);
    }

    root.append(track, dots);
    return root;
  }

  return { renderCarousel };
})();

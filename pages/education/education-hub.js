// Classic script (not a module). The "All" view of the education tab: a quiz
// hero, then one section per format (articles as rows, videos and quizzes as
// horizontal shelves), each with a "See all" that opens that format's view.
// Needs i18n, icon, button, storage and education-shared loaded first.
//
// window.educationHub.renderHub(items, onSeeAll) -> element; onSeeAll(format).

window.educationHub = (function () {
  const t = window.i18n.t;
  const shared = window.educationShared;
  const ARTICLE_PREVIEW = 3;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Brand-navy band (dark island) that points straight at the quizzes.
  function renderHero(quizCount, onOpen) {
    const hero = element("section", "education-hero theme-dark");
    const eyebrow = element("span", "education-hero-eyebrow");
    eyebrow.append(window.iconModule.renderIcon("check"), document.createTextNode(t("edu.hero_eyebrow")));
    hero.append(
      element("span", "education-hero-glow education-hero-glow--gold"),
      element("span", "education-hero-glow education-hero-glow--blue"),
      eyebrow,
      element("h2", "education-hero-title", t("edu.hero_title")),
      element("p", "education-hero-message", t("edu.hero_message").replace("{count}", quizCount)),
      window.buttonModule.renderButton({ label: t("edu.hero_cta"), variant: "primary", fullWidth: false, onClick: onOpen }),
    );
    return hero;
  }

  function renderSectionHead(format, count, onSeeAll) {
    const head = element("div", "education-section-head");
    const title = element("h2", "education-section-title", t(`edu.format_${format}`));
    title.appendChild(element("span", "education-section-count", t(`edu.count_${format}`).replace("{count}", count)));

    const link = element("button", "education-section-link");
    link.type = "button";
    link.append(document.createTextNode(t("edu.see_all")), window.iconModule.renderIcon("chevron-right"));
    link.addEventListener("click", () => onSeeAll(format));
    head.append(title, link);
    return head;
  }

  function renderShelf(cards) {
    const shelf = element("div", "education-shelf");
    shelf.append(...cards);
    return shelf;
  }

  function renderSectionBody(format, items) {
    if (format === "video") return renderShelf(items.map(shared.renderVideoCard));
    if (format === "quiz") return renderShelf(items.map(shared.renderQuizCard));
    const list = element("div", "education-list");
    list.append(...items.slice(0, ARTICLE_PREVIEW).map((item) => shared.renderRow(item, { showType: false })));
    return list;
  }

  function renderHub(items, onSeeAll) {
    const hub = element("div", "education-hub");
    const quizzes = items.filter((item) => item.type === "quiz");
    if (quizzes.length) hub.appendChild(renderHero(quizzes.length, () => onSeeAll("quiz")));

    shared.FORMATS.forEach((format) => {
      const ofFormat = items.filter((item) => item.type === format);
      if (!ofFormat.length) return;
      const section = element("section", "education-section");
      section.append(renderSectionHead(format, ofFormat.length, onSeeAll), renderSectionBody(format, ofFormat));
      hub.appendChild(section);
    });
    return hub;
  }

  return { renderHub };
})();

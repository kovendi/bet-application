// Classic script (not a module). Helpers shared by the education list, search
// and detail pages. Needs i18n, icon, storage, confirm-dialog and toast loaded.
//
// Every format has its own look, so the lists scan by format at a glance:
// article = book tile, video = 16:9 poster with its duration, quiz = check
// tile with the best score. The meta line names the format too (not by look alone).

window.educationShared = (function () {
  const t = window.i18n.t;
  const FORMATS = ["article", "video", "quiz"];
  const TYPE_ICONS = { article: "book-outline", video: "play", quiz: "check" };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // EF_005: hand-off to the Részvényfutam app. In the mockup the confirmed
  // transfer only shows a toast.
  function openFutam() {
    window.confirmDialogModule.showConfirmDialog({
      title: t("edu.futam_confirm_title"),
      message: t("edu.futam_confirm_message"),
      confirmLabel: t("edu.futam_confirm_button"),
      variant: "default",
      onConfirm: () => window.toastModule.showToast({ message: t("edu.futam_opened"), icon: "link" }),
    });
  }

  function metaText(item) {
    return [t(`edu.type_${item.type}`), t(`edu.level_${item.level}`), t("edu.minutes").replace("{minutes}", item.minutes)].join(" · ");
  }

  function questionCount(item) {
    return window.storage.getEducationItem(item.id).questions.length;
  }

  // Format-specific size info: reading time, video length (on the poster) or question count.
  function sizeText(item) {
    if (item.type === "quiz") return t("edu.questions").replace("{count}", questionCount(item));
    if (item.type === "video") return "";
    return t("edu.minutes").replace("{minutes}", item.minutes);
  }

  // Meta line: topic · (format) · level · size. The format label is left out
  // where the surrounding section already names it.
  function rowMeta(item, showType) {
    const parts = [item.topic];
    if (showType) parts.push(t(`edu.type_${item.type}`));
    parts.push(t(`edu.level_${item.level}`), sizeText(item));
    return parts.filter(Boolean).join(" · ");
  }

  function detailHref(item) {
    return "../education-detail/education-detail.html?id=" + encodeURIComponent(item.id);
  }

  function renderTypeTile(type) {
    const icon = window.iconModule.renderIcon(TYPE_ICONS[type]);
    icon.classList.add("education-row-icon", `education-row-icon--${type}`);
    return icon;
  }

  // Video poster (brand navy, play button, duration badge); `large` for shelf cards.
  function renderPoster(item, large) {
    const poster = element("span", "education-poster" + (large ? " education-poster--large" : ""));
    poster.setAttribute("aria-hidden", "true");
    const play = element("span", "education-poster-play");
    play.appendChild(window.iconModule.renderIcon("play"));
    poster.append(play, element("span", "education-poster-duration", window.storage.getEducationItem(item.id).video.duration));
    return poster;
  }

  // List row. options.showType: false inside a section that already names the format.
  function renderRow(item, options) {
    const showType = !options || options.showType !== false;
    const row = element("a", `education-row education-row--${item.type}`);
    row.href = detailHref(item);

    const leading = item.type === "video" ? renderPoster(item, false) : renderTypeTile(item.type);
    const body = element("span", "education-row-body");
    body.append(element("span", "education-row-title", item.title), element("span", "education-row-meta", rowMeta(item, showType)));

    const chevron = window.iconModule.renderIcon("chevron-right");
    chevron.classList.add("education-row-chevron");
    row.append(leading, body);
    row.appendChild(chevron);
    return row;
  }

  // Shelf card for videos: big poster, title, meta.
  function renderVideoCard(item) {
    const card = element("a", "education-video-card");
    card.href = detailHref(item);
    card.append(
      renderPoster(item, true),
      element("span", "education-card-title", item.title),
      element("span", "education-row-meta", rowMeta(item, false)),
    );
    return card;
  }

  // Shelf card for quizzes: tile on top, title, meta.
  function renderQuizCard(item) {
    const card = element("a", "education-quiz-card");
    card.href = detailHref(item);
    const top = element("span", "education-quiz-card-top");
    top.append(renderTypeTile("quiz"));
    card.append(top, element("span", "education-card-title", item.title), element("span", "education-row-meta", rowMeta(item, false)));
    return card;
  }

  return { FORMATS, TYPE_ICONS, openFutam, metaText, renderRow, renderVideoCard, renderQuizCard };
})();

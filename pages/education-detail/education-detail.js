window.i18n.initI18n();
const t = window.i18n.t;

const LIST_HREF = "../education/education.html";
const contentEl = document.getElementById("education-detail-content");
const item = window.storage.getEducationItem(new URLSearchParams(window.location.search).get("id"));

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderHeader() {
  const header = element("header", "education-detail-header");
  header.append(
    element("p", "education-detail-meta", item.topic + " · " + window.educationShared.metaText(item)),
    element("h1", "education-detail-title", item.title),
  );
  return header;
}

function renderArticle() {
  const body = element("div", "education-article");
  item.blocks.forEach((block) => {
    body.appendChild(block.h ? element("h2", "education-article-heading", block.h) : element("p", "education-article-text", block.p));
  });
  return body;
}

// EF_003: embedded video. The mockup has no real player: the poster toggles a
// "playing" state with a progress sweep that mimics playback.
function renderVideo() {
  const wrap = element("div", "education-video-wrap");
  const player = element("button", "education-video");
  player.type = "button";
  player.setAttribute("aria-label", t("edu.video_play"));
  const icon = element("span", "education-video-icon");
  icon.appendChild(window.iconModule.renderIcon("play"));
  const duration = element("span", "education-video-duration", item.video.duration);
  const progress = element("span", "education-video-progress");
  progress.appendChild(element("span", "education-video-progress-fill"));
  player.append(icon, duration, progress);

  function setPlaying(playing) {
    player.classList.toggle("is-playing", playing);
    player.setAttribute("aria-label", t(playing ? "edu.video_stop" : "edu.video_play"));
    icon.replaceChildren(window.iconModule.renderIcon(playing ? "stop" : "play"));
  }
  player.addEventListener("click", () => setPlaying(!player.classList.contains("is-playing")));
  progress.firstChild.addEventListener("animationend", () => setPlaying(false));

  const chapters = element("ul", "education-chapters");
  item.video.chapters.forEach((text) => chapters.appendChild(element("li", "education-chapter", text)));
  wrap.append(
    player,
    element("p", "education-article-text", item.video.description),
    element("h2", "education-article-heading", t("edu.video_chapters")),
    chapters,
  );
  return wrap;
}

function renderFutamAction() {
  const wrap = element("div", "education-futam");
  wrap.append(
    element("p", "education-futam-text", t("edu.futam_message")),
    window.buttonModule.renderButton({ label: t("edu.futam_open"), variant: "outline", onClick: window.educationShared.openFutam }),
  );
  return wrap;
}

function renderNotFound() {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      title: t("edu.not_found_title"),
      message: t("edu.not_found_message"),
      actionLabel: t("edu.back_to_list"),
      onAction: () => (window.location.href = LIST_HREF),
    }),
  );
}

function renderItem() {
  const body = item.type === "quiz" ? window.educationQuiz.renderQuiz(item) : item.type === "video" ? renderVideo() : renderArticle();
  contentEl.append(renderHeader(), body);
  // The quiz offers the hand-off on its result screen instead.
  if (item.futam && item.type !== "quiz") contentEl.appendChild(renderFutamAction());
  window.motion.fadeIn(contentEl);
}

document.getElementById("education-detail-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({
    title: item ? t(`edu.type_${item.type}`) : t("nav.education"),
    onBack: () => (document.referrer ? history.back() : (window.location.href = LIST_HREF)),
  }),
);

if (item) renderItem();
else renderNotFound();

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

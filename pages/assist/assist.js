window.i18n.initI18n();
const t = window.i18n.t;

// AI_006 proposal: 10 questions per day, 300 characters per question.
const DAILY_LIMIT = 10;
const MAX_LENGTH = 300;
const SCROLL_STICK_PX = 120;

const user = window.storage.getCurrentUser();
let data = user ? window.storage.getAssist(user.id) : { accepted: false, activeChatId: null, chats: [], usage: { date: "", count: 0 } };
let chat = data.chats.find((c) => c.id === data.activeChatId) || null;
let runId = 0; // bumped on every new reply / stop, so late results can be ignored
let active = null; // { message, row, streaming } while an answer is typed out
let idCounter = 0;

const messagesEl = document.getElementById("assist-messages");
const anchorEl = document.getElementById("assist-anchor");
const quotaSlotEl = document.getElementById("assist-quota-slot");
const fabEl = document.getElementById("assist-fab");

// --- Small helpers -----------------------------------------------------------------

const newId = (prefix) => prefix + Date.now().toString(36) + (idCounter += 1);
const todayKey = () => new Date().toISOString().slice(0, 10);
const toast = (message, icon) => window.toastModule.showToast({ message, icon });

function persist() {
  if (user) window.storage.saveAssist(user.id, data);
}

function usageToday() {
  if (data.usage.date !== todayKey()) data.usage = { date: todayKey(), count: 0 };
  return data.usage;
}

const quotaLeft = () => Math.max(0, DAILY_LIMIT - usageToday().count);

function getScroller() {
  return document.querySelector(".iphone-screen") || document.scrollingElement;
}

function isNearBottom() {
  const scroller = getScroller();
  return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < SCROLL_STICK_PX;
}

function scrollToEnd(smooth) {
  getScroller().scrollTo({ top: getScroller().scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

function dayLabel(ts) {
  const date = new Date(ts);
  const diffDays = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return t("assist.today");
  if (diffDays === 1) return t("assist.yesterday");
  return date.toLocaleDateString(window.i18n.getLanguage() === "en" ? "en-GB" : "hu-HU", { month: "long", day: "numeric" });
}

// Daily question meter: a small pill in the app bar.
const quotaPill = document.createElement("span");
quotaPill.className = "assist-quota";

function paintQuota() {
  const left = quotaLeft();
  quotaPill.textContent = `${left}/${DAILY_LIMIT}`;
  quotaPill.setAttribute("aria-label", t("assist.quota_left").replace("{count}", left));
  quotaPill.title = t("assist.quota_left").replace("{count}", left);
  quotaPill.classList.toggle("assist-quota--low", left <= 2);
}

// --- Gate: guest, disclaimer, daily limit ----------------------------------------------

const composer = window.assistComposer.renderComposer({
  maxLength: MAX_LENGTH,
  onSubmit: (text) => sendQuestion(text),
  onStop: stopReply,
  onVoice: () => toast(t("assist.voice_soon"), "mic"),
  onGateTouch: handleGateTouch,
});

function currentGate() {
  if (!user) return "guest";
  if (!data.accepted) return "unaccepted";
  return quotaLeft() <= 0 ? "quota" : null;
}

function applyGate() {
  const gate = currentGate();
  composer.setGate(gate);
  paintQuota();
  const banner = gate === "quota"
    ? window.bannerModule.renderBanner({
        text: t("assist.quota_banner").replace("{limit}", DAILY_LIMIT),
        variant: "warning",
        icon: "exclamationmark-circle",
      })
    : null;
  quotaSlotEl.replaceChildren(...(banner ? [banner] : []), quotaPill);
}

function handleGateTouch(kind) {
  if (kind === "guest") window.bottomSheetModule.showRegistrationRequired();
  else if (kind === "unaccepted") showGate();
  else toast(t("assist.quota_none"), "exclamationmark-circle");
}

function showGate() {
  const content = document.createElement("div");
  content.className = "assist-gate";
  const hero = document.createElement("span");
  hero.className = "assist-gate-hero";
  hero.appendChild(window.iconModule.renderIcon("shield"));
  const intro = document.createElement("p");
  intro.className = "assist-gate-intro";
  intro.textContent = t("assist.gate_intro");
  const points = document.createElement("ul");
  points.className = "assist-gate-points";
  ["assist.gate_point_info", "assist.gate_point_errors", "assist.gate_point_limit"].forEach((key) => {
    const item = document.createElement("li");
    item.append(window.iconModule.renderIcon("check"), document.createTextNode(t(key).replace("{limit}", DAILY_LIMIT)));
    points.appendChild(item);
  });
  const sheet = window.bottomSheetModule.showBottomSheet({ title: t("assist.gate_title"), content });
  content.append(
    hero,
    intro,
    points,
    window.buttonModule.renderButton({
      label: t("assist.gate_accept"),
      variant: "primary",
      onClick: () => {
        data.accepted = true;
        persist();
        applyGate();
        sheet.close();
        composer.focus();
      },
    }),
    window.buttonModule.renderButton({
      label: t("assist.gate_decline"),
      variant: "secondary",
      onClick: () => {
        window.location.href = "../home/home.html";
      },
    }),
  );
}

// --- Rendering the conversation -----------------------------------------------------------

const handlers = {
  onCopy: copyText,
  onFeedback: handleFeedback,
  onRegenerate: regenerate,
  onPickFollowup: (question) => sendQuestion(question),
  onOpenEducation: () => toast(t("assist.edu_soon"), "book"),
};

function copyText(text) {
  const done = () => toast(t("assist.copied"), "check");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
  else done();
}

function markEditable() {
  messagesEl.querySelectorAll(".assist-msg--editable").forEach((row) => row.classList.remove("assist-msg--editable"));
  const rows = messagesEl.querySelectorAll(".assist-msg--user");
  if (rows.length) rows[rows.length - 1].classList.add("assist-msg--editable");
}

function renderMessageRow(message, isLast) {
  if (message.role === "user") {
    return window.assistRender.renderUserMessage(message, { onEdit: editMessage, onCopy: copyText });
  }
  if (message.status === "error") {
    return window.assistRender.renderErrorMessage(message, { onRetry: retryError });
  }
  return window.assistRender.renderAiMessage(message, handlers, { isLast }).el;
}

function renderAll() {
  messagesEl.replaceChildren();
  if (!chat || chat.messages.length === 0) {
    messagesEl.appendChild(
      window.assistRender.renderWelcome({
        name: user ? user.name : "",
        suggestions: window.assistReply.getSuggestions(),
        onPick: sendQuestion,
      }),
    );
    updateFab();
    return;
  }
  let lastDay = "";
  chat.messages.forEach((message, index) => {
    const label = dayLabel(message.ts);
    if (label !== lastDay) {
      messagesEl.appendChild(window.assistRender.renderDateSeparator(label));
      lastDay = label;
    }
    messagesEl.appendChild(renderMessageRow(message, index === chat.messages.length - 1));
  });
  markEditable();
  scrollToEnd(false);
  updateFab();
}

function removeWelcome() {
  const welcome = messagesEl.querySelector(".assist-welcome");
  if (welcome) welcome.remove();
}

function appendRow(row) {
  messagesEl.appendChild(window.motion.fadeIn(row));
  markEditable();
}

// Followups only belong under the newest answer.
function clearOldFollowups() {
  messagesEl.querySelectorAll(".assist-followups").forEach((el) => el.remove());
}

// --- Sending and answering ------------------------------------------------------------------

function ensureChat(firstQuestion) {
  if (chat) return;
  const title = firstQuestion.length > 40 ? firstQuestion.slice(0, 40).trim() + "…" : firstQuestion;
  chat = { id: newId("c"), title, created: Date.now(), updated: Date.now(), messages: [] };
  data.chats.push(chat);
  data.activeChatId = chat.id;
}

function sendQuestion(text) {
  const gate = currentGate();
  if (gate) return handleGateTouch(gate);
  if (active) return;

  ensureChat(text);
  const message = { id: newId("m"), role: "user", text, ts: Date.now() };
  chat.messages.push(message);
  chat.updated = message.ts;
  persist();

  removeWelcome();
  clearOldFollowups();
  appendRow(renderMessageRow(message, false));
  scrollToEnd(true);
  startReply(text, { consume: true });
}

function startReply(question, { consume }) {
  runId += 1;
  const myRun = runId;
  composer.setStreaming(true);
  const typing = window.assistRender.renderTyping();
  active = { typing };
  appendRow(typing);
  scrollToEnd(true);

  window.mockNetwork
    .request("assist-reply", () => window.assistReply.buildReply(question))
    .then((reply) => {
      if (myRun !== runId) return;
      typing.remove();
      showAnswer(reply, { consume });
    })
    .catch(() => {
      if (myRun !== runId) return;
      typing.remove();
      showError(question);
    });
}

function showAnswer(reply, { consume }) {
  if (consume) usageToday().count += 1;
  const message = {
    id: newId("m"),
    role: "ai",
    text: reply.text,
    blocks: reply.blocks,
    followups: reply.followups,
    ts: Date.now(),
    status: "streaming",
    feedback: null,
  };
  chat.messages.push(message);
  chat.updated = message.ts;

  const stickToBottom = () => isNearBottom() && scrollToEnd(false);
  const rendered = window.assistRender.renderAiMessage(message, handlers, { stream: true, onProgress: stickToBottom });
  active = { message, streaming: rendered.streaming };
  appendRow(rendered.el);

  rendered.streaming.done.then((completed) => {
    if (active && active.message === message) active = null;
    composer.setStreaming(false);
    if (!completed) return;
    message.status = "done";
    persist();
    applyGate();
  });
  applyGate();
  persist();
}

function showError(question) {
  const message = { id: newId("m"), role: "ai", status: "error", question, text: "", ts: Date.now() };
  chat.messages.push(message);
  persist();
  active = null;
  composer.setStreaming(false);
  appendRow(window.assistRender.renderErrorMessage(message, { onRetry: retryError }));
  scrollToEnd(true);
}

function retryError(message) {
  const index = chat.messages.indexOf(message);
  chat.messages.splice(index, 1);
  const row = messagesEl.querySelector(`[data-id="${message.id}"]`);
  if (row) row.remove();
  startReply(message.question, { consume: true });
}

function stopReply() {
  if (!active) return;
  runId += 1;
  if (active.typing) {
    active.typing.remove();
    active = null;
    composer.setStreaming(false);
    return;
  }
  const { message, streaming } = active;
  message.shown = streaming.stop();
  message.status = "stopped";
  persist();
}

function regenerate(message) {
  if (active) return;
  const index = chat.messages.indexOf(message);
  const question = chat.messages.slice(0, index).reverse().find((m) => m.role === "user");
  if (!question) return;
  chat.messages.slice(index).forEach((m) => {
    const row = messagesEl.querySelector(`[data-id="${m.id}"]`);
    if (row) row.remove();
  });
  chat.messages.length = index;
  persist();
  startReply(question.text, { consume: false });
}

function editMessage(message) {
  if (active) stopReply();
  const index = chat.messages.indexOf(message);
  chat.messages.length = index;
  usageToday().count = Math.max(0, usageToday().count - 1);
  persist();
  renderAll();
  applyGate();
  composer.setValue(message.text);
  composer.focus();
  toast(t("assist.edit_hint"), "edit");
}

// --- Feedback ---------------------------------------------------------------------------------

function setFeedback(message, value, buttons) {
  message.feedback = value;
  persist();
  buttons.up.classList.toggle("assist-action--on", value === "up");
  buttons.down.classList.toggle("assist-action--on", value === "down");
  buttons.up.setAttribute("aria-pressed", String(value === "up"));
  buttons.down.setAttribute("aria-pressed", String(value === "down"));
  const pressed = value === "up" ? buttons.up : value === "down" ? buttons.down : null;
  if (pressed) window.motion.replay(pressed, "assist-action--pop");
}

function handleFeedback(message, value, buttons) {
  if (message.feedback === value) return setFeedback(message, null, buttons);
  if (value === "up") {
    setFeedback(message, "up", buttons);
    return toast(t("assist.feedback_thanks"), "thumbs-up");
  }
  showFeedbackSheet(() => {
    setFeedback(message, "down", buttons);
    toast(t("assist.feedback_thanks"), "thumbs-down");
  });
}

function showFeedbackSheet(onSend) {
  const content = document.createElement("div");
  content.className = "assist-feedback";
  content.appendChild(
    window.chipsModule.renderChips({
      items: ["wrong", "irrelevant", "long", "unclear", "other"].map((id) => ({ id, label: t(`assist.reason_${id}`) })),
      variant: "bubble",
      multi: true,
      ariaLabel: t("assist.feedback_title"),
    }),
  );
  const sheet = window.bottomSheetModule.showBottomSheet({ title: t("assist.feedback_title"), content });
  content.appendChild(
    window.buttonModule.renderButton({
      label: t("assist.feedback_send"),
      variant: "primary",
      onClick: () => {
        sheet.close();
        onSend();
      },
    }),
  );
}


// --- Page chrome ----------------------------------------------------------------------------------------

function renderBarButton(iconName, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "top-appbar-icon-button";
  button.setAttribute("aria-label", label);
  button.appendChild(window.iconModule.renderIcon(iconName));
  button.addEventListener("click", onClick);
  return button;
}

function renderBarActions() {
  const wrap = document.createElement("div");
  wrap.className = "assist-bar-actions";
  wrap.append(
    renderBarButton("edit", t("assist.new_chat"), newChat),
    renderBarButton("clock", t("assist.history"), openHistory),
  );
  return wrap;
}

function updateFab() {
  const hasMessages = chat && chat.messages.length > 0;
  fabEl.classList.toggle("assist-fab--visible", Boolean(hasMessages) && !isNearBottom());
}

function observeBottomBar() {
  const bottom = document.getElementById("assist-bottom");
  const apply = () => document.documentElement.style.setProperty("--assist-bottom-height", bottom.offsetHeight + "px");
  new ResizeObserver(apply).observe(bottom);
  apply();
}

document.getElementById("assist-top-appbar").appendChild(window.topAppbarModule.renderTopAppbar({ title: t("assist.title"), right: renderBarActions() }));
document.getElementById("assist-composer-slot").appendChild(composer.el);
window.assistNav.init(composer.el);
fabEl.setAttribute("aria-label", t("assist.scroll_down"));
fabEl.appendChild(window.iconModule.renderIcon("arrow-down"));
fabEl.addEventListener("click", () => scrollToEnd(true));

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

getScroller().addEventListener("scroll", updateFab, { passive: true });
if (getScroller() === document.scrollingElement) window.addEventListener("scroll", updateFab, { passive: true });
observeBottomBar();
renderAll();
applyGate();
if (user && !data.accepted) requestAnimationFrame(showGate);

// Classic script. The message composer of the Bet assist chat: auto-growing
// field, "@" instrument mentions, a send button that morphs between
// microphone / send / stop, character counter and the daily question meter.
//
// Requires i18n, icon, money, storage and assist-reply.js loaded first.
//
// const composer = window.assistComposer.renderComposer({
//   maxLength: 300,
//   onSubmit: (text) => {...},
//   onStop: () => {...},
//   onVoice: () => {...},
//   onGateTouch: (kind) => {...}, // field tapped while gated
// });
// composer.el; composer.setGate('guest' | 'unaccepted' | 'quota' | null);
// composer.setStreaming(bool);
// composer.setValue(text); composer.focus();

window.assistComposer = (function () {
  const t = window.i18n.t;
  const COUNTER_FROM = 0.8; // show the character counter from 80 % of the limit
  const LOW_QUOTA = 2;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderComposer({ maxLength, onSubmit, onStop, onVoice, onGateTouch }) {
    const form = element("form", "assist-composer");
    form.noValidate = true;
    const state = { streaming: false, gate: null };

    const mentions = element("div", "assist-mentions");
    mentions.hidden = true;
    mentions.setAttribute("aria-label", t("assist.mentions_label"));

    const row = element("div", "assist-input-row");
    const field = element("div", "assist-field");
    const label = element("label", "sr-only", t("assist.input_label"));
    label.htmlFor = "assist-input";
    const input = document.createElement("textarea");
    input.id = "assist-input";
    input.rows = 1;
    input.maxLength = maxLength;
    input.placeholder = t("assist.input_placeholder");
    input.enterKeyHint = "send";
    const counter = element("span", "assist-count");
    counter.setAttribute("aria-live", "polite");
    field.append(label, input, counter);

    const send = element("button", "assist-send");
    send.type = "submit";
    ["mic", "arrow-up", "stop"].forEach((name) => {
      const wrap = element("span", `assist-send-icon assist-send-icon--${name}`);
      wrap.appendChild(window.iconModule.renderIcon(name));
      send.appendChild(wrap);
    });
    row.append(field, send);

    form.append(mentions, row);

    // --- Mode of the send button ----------------------------------------------------
    function mode() {
      if (state.streaming) return "stop";
      return input.value.trim() ? "send" : "mic";
    }

    function refresh() {
      const text = input.value;
      send.dataset.mode = mode();
      const labelKey = { stop: "assist.stop", send: "assist.send", mic: "assist.voice" }[mode()];
      send.setAttribute("aria-label", t(labelKey));
      const showCount = text.length >= maxLength * COUNTER_FROM;
      counter.textContent = showCount ? t("assist.char_count").replace("{count}", text.length).replace("{max}", maxLength) : "";
      counter.classList.toggle("assist-count--limit", text.length >= maxLength);
      input.style.height = "auto";
      if (input.scrollHeight > 0) input.style.height = input.scrollHeight + "px";
      form.classList.toggle("assist-composer--filled", text.length > 0);
    }

    // --- @mentions ----------------------------------------------------------------------
    function mentionQuery() {
      const before = input.value.slice(0, input.selectionStart);
      const match = before.match(/(^|\s)@([^\s@]*)$/);
      return match ? { query: match[2], start: before.length - match[2].length - 1 } : null;
    }

    function hideMentions() {
      mentions.hidden = true;
      mentions.replaceChildren();
    }

    function insertMention(ticker, start) {
      const end = input.selectionStart;
      input.value = input.value.slice(0, start) + "@" + ticker + " " + input.value.slice(end);
      const caret = start + ticker.length + 2;
      input.setSelectionRange(caret, caret);
      hideMentions();
      refresh();
      input.focus();
    }

    function updateMentions() {
      const found = mentionQuery();
      if (!found) return hideMentions();
      const matches = window.assistReply.searchInstruments(found.query);
      if (!matches.length) return hideMentions();
      const money = window.moneyModule;
      mentions.replaceChildren(
        ...matches.map((instrument) => {
          const change = window.storage.getChangePercent(instrument);
          const chip = element("button", "assist-mention");
          chip.type = "button";
          chip.append(
            element("span", "assist-mention-ticker", instrument.ticker),
            element("span", change >= 0 ? "assist-mention-change assist-mention-change--up" : "assist-mention-change assist-mention-change--down", money.formatPercent(change)),
          );
          chip.addEventListener("mousedown", (event) => event.preventDefault());
          chip.addEventListener("click", () => insertMention(instrument.ticker, found.start));
          return chip;
        }),
      );
      mentions.hidden = false;
    }

    // --- Events ---------------------------------------------------------------------------
    function submit() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      hideMentions();
      refresh();
      onSubmit(text);
    }

    input.addEventListener("input", () => {
      refresh();
      updateMentions();
    });
    input.addEventListener("keyup", (event) => {
      if (event.key.startsWith("Arrow")) updateMentions();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!state.streaming) submit();
      }
    });
    input.addEventListener("blur", hideMentions);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.gate) return onGateTouch(state.gate);
      if (state.streaming) return onStop();
      if (input.value.trim()) return submit();
      onVoice();
    });

    // A gated field must not take focus (no keyboard): tap goes to the gate handler.
    field.addEventListener("pointerdown", (event) => {
      if (!state.gate) return;
      event.preventDefault();
      onGateTouch(state.gate);
    });

    function setGate(kind) {
      state.gate = kind;
      form.classList.toggle("assist-composer--gated", Boolean(kind));
      form.classList.toggle("assist-composer--quota", kind === "quota");
      input.readOnly = Boolean(kind);
      input.placeholder = kind === "quota" ? t("assist.quota_none") : t("assist.input_placeholder");
    }

    function setStreaming(value) {
      state.streaming = value;
      form.classList.toggle("assist-composer--streaming", value);
      refresh();
    }

    function setValue(text) {
      input.value = text;
      refresh();
    }

    function focus() {
      if (state.gate) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }

    refresh();
    return { el: form, setGate, setStreaming, setValue, focus };
  }

  return { renderComposer };
})();

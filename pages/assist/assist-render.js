// Classic script. Builds the DOM of the Bet assist chat: messages, rich answer
// blocks, the welcome screen and the typing indicator. Pure rendering — all
// state and behavior live in assist.js.
//
// Requires i18n, icon, money, storage, motion, sparkline, price-row (js)
// loaded first.
//
// Text markup (same as seed-assist.js): **bold**, "- " bullets, blank line =
// paragraph. It is turned into DOM nodes (never innerHTML), so answers can
// never inject markup.

window.assistRender = (function () {
  const t = window.i18n.t;
  const HIDDEN = "assist-hidden";

  function icon(name, className) {
    const el = window.iconModule.renderIcon(name);
    if (className) el.classList.add(className);
    return el;
  }

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function iconButton(name, label, className) {
    const button = element("button", "assist-action " + (className || ""));
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.appendChild(icon(name));
    return button;
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
  }

  // --- Markup -> DOM --------------------------------------------------------------

  function appendInline(parent, line) {
    line.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
      if (!part) return;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        parent.appendChild(element("strong", "", part.slice(2, -2)));
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  }

  function parseMarkup(text) {
    const fragment = document.createDocumentFragment();
    text.split(/\n\n+/).forEach((chunk) => {
      let list = null;
      let paragraph = null;
      chunk.split("\n").forEach((line) => {
        if (line.startsWith("- ")) {
          paragraph = null;
          if (!list) {
            list = element("ul", "assist-list");
            fragment.appendChild(list);
          }
          const item = element("li");
          appendInline(item, line.slice(2));
          list.appendChild(item);
          return;
        }
        list = null;
        if (!paragraph) {
          paragraph = element("p", "assist-paragraph");
          fragment.appendChild(paragraph);
        } else {
          paragraph.appendChild(document.createElement("br"));
        }
        appendInline(paragraph, line);
      });
    });
    return fragment;
  }

  // Word-by-word typewriter over an already built DOM, so bold and bullets are
  // right from the first character. Uses requestAnimationFrame (no timers).
  // Returns { done: Promise<boolean>, stop() } — done resolves true when fully
  // revealed, false when stopped.
  const CHARS_PER_SECOND = 140;

  function streamText(container, onProgress) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let total = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      nodes.push({ node, full: node.data, start: total, block: node.parentElement.closest("p, li") });
      total += node.data.length;
    }
    const blocks = Array.from(container.querySelectorAll("p, li, ul"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let revealed = 0;
    let last = null;
    let frame = 0;
    let finish;
    const done = new Promise((resolve) => (finish = resolve));

    function paint(count) {
      let activeBlock = null;
      nodes.forEach((entry) => {
        const visible = Math.max(0, Math.min(entry.full.length, count - entry.start));
        entry.node.data = entry.full.slice(0, visible);
        if (visible > 0 && entry.block) activeBlock = entry.block;
      });
      blocks.forEach((block) => {
        const started = nodes.some((e) => e.block && block.contains(e.block) && count > e.start);
        block.classList.toggle(HIDDEN, !started);
        block.classList.toggle("assist-caret", block === activeBlock && count < total);
      });
    }

    function tick(now) {
      const dt = last === null ? 16 : now - last;
      last = now;
      revealed = Math.min(total, revealed + Math.max(1, Math.round((dt * CHARS_PER_SECOND) / 1000)));
      paint(revealed);
      if (onProgress) onProgress();
      if (revealed >= total) return finish(true);
      frame = requestAnimationFrame(tick);
    }

    paint(0);
    if (reduced) {
      paint(total);
      finish(true);
    } else {
      frame = requestAnimationFrame(tick);
    }
    return {
      done,
      stop() {
        cancelAnimationFrame(frame);
        paint(revealed);
        container.querySelectorAll(".assist-caret").forEach((el) => el.classList.remove("assist-caret"));
        finish(false);
        return revealed;
      },
      revealedCount: () => revealed,
    };
  }

  // --- Rich blocks ------------------------------------------------------------------

  function renderInstrumentsBlock(tickers) {
    const wrap = element("div", "assist-rich assist-rich--rows");
    tickers.forEach((ticker) => {
      const instrument = window.storage.getInstrument(ticker);
      if (!instrument) return;
      wrap.appendChild(
        window.priceRowModule.renderPriceRow({
          instrument,
          href: "../product/product.html?ticker=" + encodeURIComponent(ticker),
          sparkline: true,
        }),
      );
    });
    return wrap;
  }

  function renderBrokersBlock() {
    const wrap = element("div", "assist-rich assist-rich--chips");
    window.storage.getBrokers().forEach((broker) => {
      const link = element("a", "assist-link-chip");
      link.href = broker.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.append(icon("link", "assist-link-chip-icon"), document.createTextNode(broker.name));
      wrap.appendChild(link);
    });
    return wrap;
  }

  function renderEducationBlock(ids, onOpenEducation) {
    const wrap = element("div", "assist-rich assist-rich--rows");
    const items = window.storage.getEducation().filter((item) => ids.includes(item.id));
    items.forEach((item) => {
      const row = element("button", "assist-edu");
      row.type = "button";
      row.appendChild(icon("book", "assist-edu-icon"));
      const body = element("span", "assist-edu-body");
      body.append(
        element("span", "assist-edu-title", item.title),
        element(
          "span",
          "assist-edu-meta",
          [t(`assist.type_${item.type}`), t(`assist.level_${item.level}`), t("assist.edu_minutes").replace("{minutes}", item.minutes)].join(" · "),
        ),
      );
      row.append(body, icon("chevron-right", "assist-edu-chevron"));
      row.addEventListener("click", () => onOpenEducation(item));
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderBlocks(blocks, handlers) {
    const wrap = element("div", "assist-blocks");
    blocks.forEach((block) => {
      let node = null;
      if (block.type === "instruments") node = renderInstrumentsBlock(block.tickers);
      if (block.type === "brokers") node = renderBrokersBlock();
      if (block.type === "education") node = renderEducationBlock(block.ids, handlers.onOpenEducation);
      if (node) wrap.appendChild(node);
    });
    return wrap;
  }

  // --- Messages ---------------------------------------------------------------------

  function renderAvatar() {
    const avatar = element("span", "assist-avatar");
    avatar.appendChild(icon("sparkles"));
    return avatar;
  }

  function renderUserMessage(message, { onEdit, onCopy }) {
    const row = element("article", "assist-msg assist-msg--user");
    row.dataset.id = message.id;
    const bubble = element("button", "assist-bubble", message.text);
    bubble.type = "button";
    bubble.setAttribute("aria-expanded", "false");

    const meta = element("div", "assist-meta");
    const metaInner = element("div", "assist-meta-inner");
    metaInner.appendChild(element("span", "assist-time", formatTime(message.ts)));
    const copy = iconButton("copy", t("assist.copy"));
    copy.addEventListener("click", () => onCopy(message.text));
    metaInner.appendChild(copy);
    // Only the last question can be edited; assist.css hides the button elsewhere.
    const edit = iconButton("edit", t("assist.edit"), "assist-edit");
    edit.addEventListener("click", () => onEdit(message));
    metaInner.appendChild(edit);
    meta.appendChild(metaInner);

    bubble.addEventListener("click", () => {
      const open = !row.classList.contains("assist-msg--open");
      row.classList.toggle("assist-msg--open", open);
      bubble.setAttribute("aria-expanded", String(open));
    });
    row.append(bubble, meta);
    return row;
  }

  function renderActions(message, handlers) {
    const bar = element("div", "assist-actions");
    const copy = iconButton("copy", t("assist.copy"));
    copy.addEventListener("click", () => handlers.onCopy(message.text.replace(/\*\*/g, "")));
    const up = iconButton("thumbs-up", t("assist.like"), message.feedback === "up" ? "assist-action--on" : "");
    const down = iconButton("thumbs-down", t("assist.dislike"), message.feedback === "down" ? "assist-action--on" : "");
    up.setAttribute("aria-pressed", String(message.feedback === "up"));
    down.setAttribute("aria-pressed", String(message.feedback === "down"));
    up.addEventListener("click", () => handlers.onFeedback(message, "up", { up, down }));
    down.addEventListener("click", () => handlers.onFeedback(message, "down", { up, down }));
    const again = iconButton("refresh", t("assist.regenerate"));
    again.addEventListener("click", () => handlers.onRegenerate(message));
    bar.append(copy, up, down, again, element("span", "assist-time", formatTime(message.ts)));
    return bar;
  }

  function renderFollowups(followups, onPick) {
    const wrap = element("div", "assist-followups");
    wrap.setAttribute("aria-label", t("assist.followups_label"));
    followups.forEach((question) => {
      const chip = element("button", "assist-chip", question);
      chip.type = "button";
      chip.addEventListener("click", () => onPick(question));
      wrap.appendChild(chip);
    });
    return wrap;
  }

  // The finished parts under the text. `animate` staggers them in.
  function renderAnswerExtras(message, handlers, { isLast, animate }) {
    const extras = element("div", "assist-extras");
    if (message.status === "stopped") {
      const stopped = element("p", "assist-stopped");
      stopped.append(icon("stop"), document.createTextNode(t("assist.stopped")));
      extras.appendChild(stopped);
    }
    if (message.status !== "stopped" && message.blocks && message.blocks.length) {
      extras.appendChild(renderBlocks(message.blocks, handlers));
    }
    extras.appendChild(element("p", "assist-disclaimer", t("assist.disclaimer_short")));
    extras.appendChild(renderActions(message, handlers));
    if (isLast && message.followups && message.followups.length && message.status !== "stopped") {
      extras.appendChild(renderFollowups(message.followups, handlers.onPickFollowup));
    }
    if (animate) extras.classList.add("assist-extras--enter");
    return extras;
  }

  // Cuts the rendered text after `count` characters (a stopped answer) and
  // drops the paragraphs and list items that never started.
  function truncateText(container, count) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let seen = 0;
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const keep = Math.max(0, Math.min(node.data.length, count - seen));
      seen += node.data.length;
      node.data = node.data.slice(0, keep);
    });
    container.querySelectorAll("li, p").forEach((block) => {
      if (!block.textContent) block.remove();
    });
    container.querySelectorAll("ul").forEach((list) => {
      if (!list.children.length) list.remove();
    });
  }

  // An answer. `stream: true` types it out; the extras appear once it is done.
  function renderAiMessage(message, handlers, { stream = false, isLast = false, onProgress } = {}) {
    const row = element("article", "assist-msg assist-msg--ai");
    row.dataset.id = message.id;
    const main = element("div", "assist-main");
    const text = element("div", "assist-text");
    text.appendChild(parseMarkup(message.text));
    if (message.status === "stopped" && typeof message.shown === "number") truncateText(text, message.shown);
    main.appendChild(text);
    row.append(renderAvatar(), main);

    if (!stream) {
      main.appendChild(renderAnswerExtras(message, handlers, { isLast, animate: false }));
      return { el: row, streaming: null };
    }
    const streaming = streamText(text, onProgress);
    streaming.done.then((completed) => {
      if (completed) message.status = "done";
      main.appendChild(renderAnswerExtras(message, handlers, { isLast: true, animate: true }));
      if (onProgress) onProgress();
    });
    return { el: row, streaming, text };
  }

  function renderErrorMessage(message, { onRetry }) {
    const row = element("article", "assist-msg assist-msg--ai assist-msg--error");
    row.dataset.id = message.id;
    const main = element("div", "assist-main");
    main.append(
      element("p", "assist-error-title", t("assist.error_title")),
      element("p", "assist-error-text", t("assist.error_message")),
    );
    const retry = element("button", "assist-retry");
    retry.type = "button";
    retry.append(icon("refresh"), document.createTextNode(t("state.retry")));
    retry.addEventListener("click", () => onRetry(message));
    main.appendChild(retry);
    row.append(renderAvatar(), main);
    return row;
  }

  function renderTyping() {
    const row = element("article", "assist-msg assist-msg--ai assist-msg--typing");
    row.setAttribute("aria-label", t("assist.thinking"));
    const main = element("div", "assist-main assist-main--typing");
    const dots = element("span", "assist-dots");
    dots.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i += 1) dots.appendChild(element("span", "assist-dot"));
    main.append(dots, element("span", "assist-thinking", t("assist.thinking")));
    row.append(renderAvatar(), main);
    return row;
  }

  function renderDateSeparator(label) {
    return element("div", "assist-date", label);
  }

  function renderWelcome({ name, suggestions, onPick }) {
    const section = element("section", "assist-welcome");
    const hero = element("span", "assist-hero");
    hero.appendChild(icon("sparkles"));
    section.append(
      hero,
      element("h2", "assist-welcome-title", name ? t("assist.welcome_title").replace("{name}", name) : t("assist.welcome_guest")),
      element("p", "assist-welcome-subtitle", t("assist.welcome_subtitle")),
    );
    const list = element("div", "assist-suggestions");
    list.setAttribute("role", "list");
    suggestions.forEach((question) => {
      const button = element("button", "assist-suggestion");
      button.type = "button";
      button.setAttribute("role", "listitem");
      button.append(icon("sparkles", "assist-suggestion-icon"), element("span", "assist-suggestion-text", question), icon("arrow-up", "assist-suggestion-go"));
      button.addEventListener("click", () => onPick(question));
      list.appendChild(button);
    });
    section.append(
      element("p", "assist-welcome-label", t("assist.suggestions_label")),
      list,
      element("p", "assist-welcome-note", t("assist.footnote")),
    );
    return section;
  }

  return {
    renderUserMessage,
    renderAiMessage,
    renderErrorMessage,
    renderTyping,
    renderDateSeparator,
    renderWelcome,
    renderFollowups,
    formatTime,
  };
})();

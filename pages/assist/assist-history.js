// Chat history: new chat, open, delete and the history sheet. Classic script that
// shares the page globals (chat, data, persist, toast, ...) declared in assist.js;
// everything here only runs on user action, after assist.js has loaded.

function newChat() {
  if (active) stopReply();
  chat = null;
  data.activeChatId = null;
  persist();
  renderAll();
  scrollToEnd(false);
  composer.focus();
}

function openChat(id) {
  if (active) stopReply();
  chat = data.chats.find((c) => c.id === id) || null;
  data.activeChatId = chat ? chat.id : null;
  persist();
  renderAll();
}

function deleteChat(target, refresh) {
  window.confirmDialogModule.showConfirmDialog({
    title: t("assist.delete_title"),
    message: t("assist.delete_message"),
    confirmLabel: t("assist.delete"),
    onConfirm: () => {
      data.chats = data.chats.filter((c) => c.id !== target.id);
      if (chat && chat.id === target.id) {
        chat = null;
        data.activeChatId = null;
        renderAll();
      }
      persist();
      refresh();
      toast(t("assist.deleted"), "trash");
    },
  });
}

function renderHistoryList(listEl, sheetRef) {
  const chats = data.chats.filter((c) => c.messages.length).sort((a, b) => b.updated - a.updated);
  if (!chats.length) {
    listEl.replaceChildren(
      window.stateViewModule.renderStateView({
        title: t("assist.history_empty_title"),
        message: t("assist.history_empty_message"),
      }),
    );
    return;
  }
  listEl.replaceChildren(
    ...chats.map((item) => {
      const row = document.createElement("div");
      row.className = "assist-history-row";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "assist-history-open" + (chat && chat.id === item.id ? " assist-history-open--active" : "");
      const title = document.createElement("span");
      title.className = "assist-history-title";
      title.textContent = item.title;
      const meta = document.createElement("span");
      meta.className = "assist-history-meta";
      meta.textContent = `${dayLabel(item.updated)} ${window.assistRender.formatTime(item.updated)} · ${t("assist.history_messages").replace("{count}", item.messages.length)}`;
      open.append(title, meta);
      open.addEventListener("click", () => {
        sheetRef.current.close();
        openChat(item.id);
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "assist-history-delete";
      remove.setAttribute("aria-label", t("assist.delete"));
      remove.appendChild(window.iconModule.renderIcon("trash"));
      remove.addEventListener("click", () => deleteChat(item, () => renderHistoryList(listEl, sheetRef)));
      row.append(open, remove);
      return row;
    }),
  );
}

function openHistory() {
  const content = document.createElement("div");
  const list = document.createElement("div");
  list.className = "assist-history-list";
  const sheetRef = { current: null };
  content.append(
    window.buttonModule.renderButton({
      label: t("assist.new_chat"),
      variant: "primary",
      iconNode: window.iconModule.renderIcon("edit"),
      onClick: () => {
        sheetRef.current.close();
        newChat();
      },
    }),
    list,
  );
  sheetRef.current = window.bottomSheetModule.showBottomSheet({ title: t("assist.history"), content });
  renderHistoryList(list, sheetRef);
}

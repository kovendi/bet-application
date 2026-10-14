// Classic script (not a module). Small helpers shared by the education list
// and the education detail page. Needs i18n, icon, confirm-dialog and toast loaded.

window.educationShared = (function () {
  const t = window.i18n.t;
  const TYPE_ICONS = { article: "book-outline", video: "play", quiz: "check" };

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

function renderRow(item) {
  const row = document.createElement("a");
  row.className = "education-row";
  row.href = "../education-detail/education-detail.html?id=" + encodeURIComponent(item.id);

  const icon = window.iconModule.renderIcon(TYPE_ICONS[item.type]);
  icon.classList.add("education-row-icon");

  const body = document.createElement("span");
  body.className = "education-row-body";
  const title = document.createElement("span");
  title.className = "education-row-title";
  title.textContent = item.title;
  const meta = document.createElement("span");
  meta.className = "education-row-meta";
  meta.textContent = item.topic + " · " + metaText(item);
  body.append(title, meta);

  const chevron = window.iconModule.renderIcon("chevron-right");
  chevron.classList.add("education-row-chevron");
  row.append(icon, body, chevron);
  return row;
}

  return { TYPE_ICONS, openFutam, metaText, renderRow };
})();

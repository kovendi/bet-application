// Style guide, part 2: feedback patterns (loading, errors, empty states,
// toasts, motion). Split from style-guide.js to keep both files short; reuses
// its global `t`, `addSection` and `textEl`.

// button: loading state
const loadingButton = window.buttonModule.renderButton({
  label: t("style_guide.demo_loading_button"),
  variant: "primary",
  onClick: () => {
    window.buttonModule.setButtonLoading(loadingButton, true);
    window.mockNetwork.delay().then(() => {
      window.buttonModule.setButtonLoading(loadingButton, false);
      window.toastModule.showToast({ message: t("style_guide.demo_toast_message"), icon: "check" });
    });
  },
});
addSection("button · loading", loadingButton);

// input: field-level error
const errorField = window.inputModule.renderInput({
  id: "style-guide-input-error",
  label: t("login.username_label"),
  placeholder: t("login.username_placeholder"),
});
addSection("input · error", errorField);
window.inputModule.setFieldError(
  errorField.querySelector("input"),
  t("style_guide.demo_field_error"),
);

// toast
addSection(
  "toast",
  window.buttonModule.renderButton({
    label: t("style_guide.demo_show_toast"),
    variant: "secondary",
    onClick: () => window.toastModule.showToast({ message: t("style_guide.demo_toast_message"), icon: "check" }),
  }),
);

// skeleton
const skeleton = (...classNames) => window.skeletonModule.renderSkeleton(...classNames);
const skeletonCard = document.createElement("div");
skeletonCard.className = "style-guide-skeleton-row";
skeletonCard.append(
  skeleton("style-guide-skeleton-title"),
  skeleton("skeleton--text", "style-guide-skeleton-line"),
  skeleton("skeleton--text", "style-guide-skeleton-line--short"),
);
addSection("skeleton", skeletonCard);

// state-view
addSection(
  "state-view",
  window.stateViewModule.renderStateView({
    title: t("style_guide.demo_empty_title"),
    message: t("style_guide.demo_empty_message"),
    actionLabel: t("style_guide.demo_empty_action"),
    onAction: () => {},
  }),
  window.stateViewModule.renderStateView({
    variant: "error",
    title: t("state.error_title"),
    message: t("state.error_message"),
    actionLabel: t("state.retry"),
    onAction: () => {},
  }),
);

// overlay / motion / mock-network (used through other modules)
addSection("overlay", textEl("confirm-dialog, bottom-sheet", "style-guide-caption"));
addSection("motion", textEl("playOut · replay · fadeIn", "style-guide-caption"));
addSection("mock-network", textEl(t("style_guide.demo_mock_hint"), "style-guide-caption"));

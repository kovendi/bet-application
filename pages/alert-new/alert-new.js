window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();
const ALERTS_URL = "../alerts/alerts.html";

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ title: t("alert_new.title"), onBack: () => window.pageTransition.back() }),
);

// --- Step 1: pick the instrument (search from 2 characters, ÁR_0053) -----------------

const byTicker = (a, b) => a.ticker.localeCompare(b.ticker, "hu");

function findMatches(query) {
  const needle = query.toLowerCase();
  return window.storage
    .getInstruments()
    .filter(
      (i) =>
        i.ticker.toLowerCase().includes(needle) ||
        i.name.toLowerCase().includes(needle) ||
        i.isin.toLowerCase().includes(needle),
    )
    .sort(byTicker);
}

function renderPicker(onPick) {
  const results = document.createElement("div");
  results.className = "alert-new-results";
  const hint = document.createElement("p");
  hint.className = "pers-note";
  hint.textContent = t("alert_new.instrument_hint");
  results.appendChild(hint);

  const field = window.searchFieldModule.renderSearchField({
    id: "alert-search",
    label: t("alert_new.instrument_label"),
    placeholder: t("market.search_placeholder"),
    minChars: 2,
    onSearch: (query) => {
      if (!query) return results.replaceChildren(hint);
      const matches = findMatches(query);
      if (matches.length === 0) {
        const none = hint.cloneNode();
        none.textContent = t("alert_new.no_results");
        return results.replaceChildren(none);
      }
      results.replaceChildren(
        ...matches.map((instrument) => window.priceRowModule.renderPriceRow({ instrument, onClick: onPick })),
      );
    },
  });
  const wrap = document.createElement("div");
  wrap.append(field, results);
  return wrap;
}

// --- Step 2: direction + level -----------------------------------------------------------

function renderForm(instrument) {
  let direction = "up";
  const form = document.createElement("form");
  form.className = "alert-new-form";
  form.noValidate = true;

  const selected = document.createElement("div");
  selected.className = "alert-new-selected";
  selected.appendChild(window.priceRowModule.renderPriceRow({ instrument }));
  const change = document.createElement("button");
  change.type = "button";
  change.className = "alert-new-change";
  change.textContent = t("alert_new.change_instrument");
  change.addEventListener("click", showPicker);
  selected.appendChild(change);

  const current = document.createElement("p");
  current.className = "pers-note";
  current.textContent = `${t("alert_new.current_price")}: ${money.formatPrice(instrument.price, instrument.unit)}`;

  const directionLabel = document.createElement("p");
  directionLabel.className = "app-input-label";
  directionLabel.textContent = t("alert_new.direction_label");
  const segmented = window.chipsModule.renderChips({
    items: [
      { id: "up", label: t("alert_new.direction_up") },
      { id: "down", label: t("alert_new.direction_down") },
    ],
    variant: "segmented",
    activeId: direction,
    ariaLabel: t("alert_new.direction_label"),
    onChange: (value) => {
      direction = value;
    },
  });

  const level = window.inputModule.renderInput({
    id: "alert-level",
    label: t("alert_new.level_label"),
    placeholder: t("alert_new.level_placeholder"),
    type: "text",
    name: "level",
    icon: "price-alert",
  });
  const levelInput = level.querySelector("input");
  levelInput.inputMode = "decimal";

  // Disabled until the user types a level.
  const submit = window.buttonModule.renderButton({ label: t("alert_new.submit"), type: "submit", disabled: true });
  levelInput.addEventListener("input", () => {
    submit.disabled = !levelInput.value.trim();
  });

  function validate() {
    const value = Number(levelInput.value.replace(/\s/g, "").replace(",", "."));
    if (!levelInput.value.trim() || !Number.isFinite(value) || value <= 0) {
      window.inputModule.setFieldError(levelInput, t("alert_new.error_level"));
      return null;
    }
    if (direction === "up" && value <= instrument.price) {
      window.inputModule.setFieldError(levelInput, t("alert_new.error_level_up"));
      return null;
    }
    if (direction === "down" && value >= instrument.price) {
      window.inputModule.setFieldError(levelInput, t("alert_new.error_level_down"));
      return null;
    }
    return value;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = validate();
    if (value === null) return;
    window.buttonModule.setButtonLoading(submit, true);
    window.mockNetwork.delay().then(() => {
      window.storage.addAlert(user.id, { ticker: instrument.ticker, direction, level: value });
      window.pageTransition.backTo(ALERTS_URL);
    });
  });

  form.append(selected, current, directionLabel, segmented, window.inputModule.renderInputStack([level]), submit);
  return form;
}

function showPicker() {
  contentEl.replaceChildren(renderPicker(showForm));
  window.motion.fadeIn(contentEl);
  document.getElementById("alert-search").focus();
}

function showForm(instrument) {
  contentEl.replaceChildren(renderForm(instrument));
  window.motion.fadeIn(contentEl);
}

if (!user) {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "lock",
      title: t("registration_required.title"),
      message: t("registration_required.message"),
      actionLabel: t("registration_required.register_button"),
      onAction: () => window.bottomSheetModule.showRegistrationRequired(),
    }),
  );
} else if (window.storage.getAlerts(user.id).length >= window.storage.ALERT_LIMIT) {
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "bell",
      title: t("alerts.title"),
      message: t("alerts.limit_reached").replace("{max}", window.storage.ALERT_LIMIT),
      actionLabel: t("alerts.title"),
      onAction: () => {
        window.pageTransition.backTo(ALERTS_URL);
      },
    }),
  );
} else {
  const preset = window.storage.getInstrument(new URLSearchParams(window.location.search).get("ticker"));
  if (preset) showForm(preset);
  else showPicker();
  document.getElementById("pers-disclaimer").appendChild(window.bannerModule.renderPriceNotices());
}

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

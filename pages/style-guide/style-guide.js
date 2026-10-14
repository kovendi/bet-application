window.i18n.initI18n();
const t = window.i18n.t;

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

const sectionsEl = document.getElementById("style-guide-sections");

// One section per module — the heading is the module's folder name, so it's
// a code identifier rather than translated UI text.
function addSection(moduleName, ...elements) {
  const section = document.createElement("section");
  section.className = "style-guide-section";

  const heading = document.createElement("h2");
  heading.className = "style-guide-section-title";
  heading.textContent = moduleName;
  section.appendChild(heading);

  const demo = document.createElement("div");
  demo.className = "style-guide-demo";
  elements.forEach((el) => demo.appendChild(el));
  section.appendChild(demo);

  sectionsEl.appendChild(section);
}

function textEl(text, className) {
  const el = document.createElement("span");
  el.className = className || "";
  el.textContent = text;
  return el;
}

// icon
const iconGrid = document.createElement("div");
iconGrid.className = "style-guide-icon-grid";
["home", "calendar", "profile", "bell", "search", "plus", "back", "filter", "edit", "check",
  "refresh", "menu", "trash", "logout", "users", "shield", "chat", "send", "close", "link",
  "book", "mail", "star", "star-filled", "chart-line", "chart-candle", "info", "chevron-right", "chevron-down", "lock"].forEach((name) => {
  const cell = document.createElement("div");
  cell.className = "style-guide-icon-cell";
  cell.appendChild(window.iconModule.renderIcon(name));
  cell.appendChild(textEl(name, "style-guide-caption"));
  iconGrid.appendChild(cell);
});
addSection("icon", iconGrid);

// button
addSection(
  "button",
  window.buttonModule.renderButton({ label: t("style_guide.demo_primary"), variant: "primary" }),
  window.buttonModule.renderButton({ label: t("style_guide.demo_secondary"), variant: "secondary" }),
  window.buttonModule.renderButton({ label: t("style_guide.demo_outline"), variant: "outline" }),
  window.buttonModule.renderButton({
    label: "Google",
    variant: "outline",
    iconNode: window.iconModule.renderBrandLogo("google"),
  }),
  window.buttonModule.renderButton({
    label: "Apple",
    variant: "outline",
    iconNode: window.iconModule.renderBrandLogo("apple"),
  }),
);

// text-button
addSection(
  "text-button",
  window.textButtonModule.renderTextButton({ label: t("style_guide.demo_text_button"), icon: "refresh" }),
);

// input
addSection(
  "input",
  window.inputModule.renderInput({
    id: "style-guide-input",
    label: t("login.username_label"),
    placeholder: t("login.username_placeholder"),
  }),
  window.inputModule.renderInputStack([
    window.inputModule.renderInput({
      id: "style-guide-input-mail",
      label: t("login.username_label"),
      placeholder: t("login.username_placeholder"),
      icon: "mail",
    }),
    window.inputModule.renderInput({
      id: "style-guide-input-password",
      label: t("login.password_label"),
      type: "password",
      placeholder: t("login.password_placeholder"),
      icon: "lock",
    }),
  ]),
);

// datepicker
addSection(
  "datepicker",
  window.datepickerModule.renderDatePicker({
    id: "style-guide-date",
    label: t("style_guide.demo_date"),
    name: "date",
  }),
);

// toggle
addSection(
  "toggle",
  window.toggleModule.renderToggle({
    id: "style-guide-toggle",
    label: t("style_guide.demo_toggle"),
    description: t("style_guide.demo_toggle_description"),
    checked: true,
  }),
);

// tabs
addSection(
  "tabs",
  window.tabsModule.renderTabs({
    tabs: [
      { id: "first", label: t("style_guide.demo_tab_first"), icon: "home" },
      { id: "second", label: t("style_guide.demo_tab_second"), icon: "search" },
    ],
    activeId: "first",
  }),
);

// progress-bar
addSection(
  "progress-bar",
  window.progressBarModule.renderProgressBar({
    label: t("style_guide.demo_progress"),
    valueText: "62%",
    percent: 62,
    layout: "inline",
    color: "primary",
  }),
  window.progressBarModule.renderProgressBar({
    label: t("style_guide.demo_progress"),
    valueText: window.moneyModule.formatMoney(45000),
    percent: 45,
    layout: "stacked",
    color: "accent",
  }),
);

// card
addSection(
  "card",
  window.cardModule.renderCard({
    icon: "home",
    title: t("style_guide.demo_card_title"),
    content: textEl(t("style_guide.demo_card_content")),
  }),
);

// menu-list
addSection(
  "menu-list",
  window.menuListModule.renderMenuList([
    {
      title: t("menu.group_account"),
      items: [
        { icon: "profile", title: t("menu.profile_title"), description: t("menu.profile_description"), onSelect: () => {} },
        { icon: "logout", title: t("menu.logout_title"), tone: "danger", onSelect: () => {} },
      ],
    },
  ]),
);

// top-appbar
addSection(
  "top-appbar",
  window.topAppbarModule.renderTopAppbar({ title: t("app.name") }),
  window.topAppbarModule.renderTopAppbar({ title: t("app.name"), onBack: () => {} }),
);

// bottom-nav
addSection(
  "bottom-nav",
  window.bottomNavModule.renderBottomNav({
    items: [
      { id: "home", icon: "home", labelKey: "nav.home", href: "#" },
      { id: "search", icon: "search", labelKey: "nav.search", href: "#" },
    ],
    activeId: "home",
  }),
);

// action-bar
addSection(
  "action-bar",
  window.actionBarModule.renderActionBar({ label: t("action_bar.new_record") }),
);

// confirm-dialog
addSection(
  "confirm-dialog",
  window.buttonModule.renderButton({
    label: t("style_guide.demo_open_dialog"),
    variant: "secondary",
    onClick: () => {
      window.confirmDialogModule.showConfirmDialog({
        title: t("style_guide.demo_dialog_title"),
        message: t("style_guide.demo_dialog_message"),
        confirmLabel: t("style_guide.demo_dialog_confirm"),
      });
    },
  }),
);

// tag-color
const swatches = document.createElement("div");
swatches.className = "style-guide-swatches";
Object.keys(window.tagColorModule.PRESET_COLORS).forEach((key) => {
  const swatch = document.createElement("div");
  swatch.className = "style-guide-swatch";
  swatch.style.background = window.tagColorModule.resolveTagColor(key);
  swatch.title = key;
  swatches.appendChild(swatch);
});
addSection("tag-color", swatches);

// money
addSection(
  "money",
  textEl(window.moneyModule.formatMoney(123456)),
  textEl(window.moneyModule.formatMoney(-2500)),
  textEl(window.moneyModule.formatMoney(9900, { sign: "+" })),
  textEl(window.moneyModule.formatPrice(112480.35, "pt")),
  textEl(window.moneyModule.formatPercent(-1.234)),
  textEl(window.moneyModule.formatCompactMoney(8240000000)),
);

// theme (logic-only; this switch lets both color modes be checked here)
addSection(
  "theme",
  textEl(t("style_guide.demo_theme"), "style-guide-caption"),
  window.chipsModule.renderChips({
    items: window.theme.THEMES.map((id) => ({ id, label: t(`theme.${id}`) })),
    variant: "segmented",
    activeId: window.theme.getTheme(),
    ariaLabel: t("theme.label"),
    onChange: (id) => window.theme.setTheme(id),
  }),
);

// chips
const chipCategories = ["share", "index", "etf", "bond", "certificate", "other"].map((id) => ({
  id,
  label: t(`category.${id}`),
}));
addSection(
  "chips",
  window.chipsModule.renderChips({ items: chipCategories, variant: "chips", activeId: "share" }),
  window.chipsModule.renderChips({
    items: window.chartModule.RANGES.map((id) => ({ id, label: t(`chart.range_${id}`) })),
    variant: "segmented",
    activeId: "1m",
  }),
  window.chipsModule.renderChips({
    items: chipCategories.slice(0, 4),
    variant: "bubble",
    multi: true,
    activeIds: ["share"],
  }),
);

// search-field
const searchResult = textEl("", "style-guide-caption");
addSection(
  "search-field",
  window.searchFieldModule.renderSearchField({
    id: "style-guide-search",
    label: t("style_guide.demo_search_label"),
    placeholder: t("style_guide.demo_search_placeholder"),
    onSearch: (query) => {
      searchResult.textContent = query ? `${t("style_guide.demo_search_result")} ${query}` : "";
    },
  }),
  searchResult,
);

// banner
addSection(
  "banner",
  window.bannerModule.renderDelayedDisclaimer(),
  window.bannerModule.renderBanner({ text: t("style_guide.demo_banner_warning"), variant: "warning" }),
);

// bottom-sheet
function brokerList() {
  const list = document.createElement("ul");
  list.className = "style-guide-list";
  window.storage.getBrokers().forEach((broker) => {
    const item = document.createElement("li");
    item.textContent = broker.name;
    list.appendChild(item);
  });
  return list;
}
addSection(
  "bottom-sheet",
  window.buttonModule.renderButton({
    label: t("style_guide.demo_open_sheet"),
    variant: "secondary",
    onClick: () => window.bottomSheetModule.showBottomSheet({ title: t("style_guide.demo_sheet_title"), content: brokerList() }),
  }),
  window.buttonModule.renderButton({
    label: t("style_guide.demo_open_registration"),
    variant: "secondary",
    onClick: () => window.bottomSheetModule.showRegistrationRequired({ registerUrl: "../login/login.html" }),
  }),
);

// sparkline
const sparkRow = document.createElement("div");
sparkRow.className = "style-guide-icon-grid";
["OTP", "MOL", "BUX"].forEach((ticker) => {
  const values = window.storage.getPriceSeries(ticker, "1m").map((c) => c.c);
  sparkRow.appendChild(window.sparklineModule.renderSparkline({ values, width: 80, height: 28 }));
});
addSection("sparkline", sparkRow);

// price-row
const demoFavorites = { OTP: true };
const priceRows = document.createElement("div");
function renderPriceRows() {
  priceRows.textContent = "";
  ["OTP", "MOL", "BUX", "HGB30A"].forEach((ticker) => {
    priceRows.appendChild(
      window.priceRowModule.renderPriceRow({
        instrument: window.storage.getInstrument(ticker),
        favorite: !!demoFavorites[ticker],
        sparkline: ticker !== "HGB30A",
        onFavoriteToggle: (instrument, wasFavorite) => {
          demoFavorites[instrument.ticker] = !wasFavorite;
        },
      }),
    );
  });
  priceRows.appendChild(
    window.priceRowModule.renderPriceRow({ instrument: window.storage.getInstrument("RICHTER"), meta: "turnover" }),
  );
}
renderPriceRows();
addSection("price-row", priceRows);

// chart
addSection("chart", window.chartModule.renderChart({ instrument: window.storage.getInstrument("OTP") }));

// market-status (open: Wednesday 10:30 / closed: Saturday 12:00, Budapest time)
const statusDemo = document.createElement("div");
statusDemo.className = "style-guide-stack";
statusDemo.append(
  window.marketStatusModule.renderMarketStatus({ now: new Date("2026-10-14T08:30:00Z") }),
  window.marketStatusModule.renderMarketStatus({ now: new Date("2026-10-17T10:00:00Z") }),
);
addSection("market-status", statusDemo);

// carousel
addSection("carousel", window.carouselModule.renderCarousel({ items: window.storage.getCarouselItems() }));

// toplist
addSection("toplist", window.toplistModule.renderToplist({ instruments: window.storage.getInstruments("share") }));

// iphone-frame (wraps whole app pages, can't be demoed inline here)
addSection("iphone-frame", textEl(t("style_guide.demo_iphone_frame"), "style-guide-caption"));

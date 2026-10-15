window.i18n.initI18n();
const t = window.i18n.t;
const money = window.moneyModule;

document.querySelectorAll("[data-i18n]").forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});

const user = window.storage.getCurrentUser();
// Default order from the tender (ÁF_001) and the per-size counts live in storage;
// a registered user can customize each size (ÁF_0033).
const SIZES = ["small", "medium", "large"];

function directionOf(change) {
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

function renderText(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

function renderQuote(instrument, size) {
  const change = window.storage.getChangePercent(instrument);
  const series = window.storage.getPriceSeries(instrument.ticker, "1m");
  const quote = document.createElement("div");
  quote.className = `widget-quote widget-quote--${size}`;

  const spark = window.sparklineModule.renderSparkline({
    values: series.map((c) => c.c),
    width: size === "large" ? 56 : 48,
    height: size === "large" ? 24 : 20,
  });
  const changeEl = renderText("span", `widget-change widget-change--${directionOf(change)}`, money.formatPercent(change));
  quote.append(
    renderText("span", "widget-ticker", instrument.ticker),
    renderText("span", "widget-price", money.formatPrice(instrument.price, instrument.unit)),
    changeEl,
    spark,
  );
  return quote;
}

function renderWidget({ size, tickers }) {
  const widget = document.createElement("a");
  widget.className = `widget widget--${size}`;
  widget.href = "../home/home.html";
  widget.setAttribute("aria-label", `${t("widgets." + size)} – ${t("app.name")}`);

  const header = document.createElement("div");
  header.className = "widget-header";
  const logo = document.createElement("img");
  logo.src = "../../assets/logo-bet-simple.png";
  logo.alt = "";
  logo.className = "widget-logo";
  header.append(logo, renderText("span", "widget-delayed", t("widgets.delayed")));

  const body = document.createElement("div");
  body.className = "widget-body";
  tickers.forEach((ticker) => {
    const instrument = window.storage.getInstrument(ticker);
    if (instrument) body.appendChild(renderQuote(instrument, size));
  });

  widget.append(header, body);
  return widget;
}

const list = document.getElementById("widgets-list");
SIZES.map((size) => ({ size, tickers: window.storage.getWidgetTickers(user && user.id, size) })).forEach((config) => {
  const section = document.createElement("section");
  section.className = "widgets-item";
  const head = document.createElement("div");
  head.className = "widgets-head";
  const editLink = document.createElement("a");
  editLink.className = "widgets-edit";
  editLink.href = `../home-edit/home-edit.html?target=${config.size}`;
  editLink.textContent = t("widgets.edit");
  editLink.setAttribute("aria-label", `${t("widgets.edit")} – ${t("widgets." + config.size)}`);
  head.append(
    renderText("h2", "widgets-label", `${t("widgets." + config.size)} · ${config.tickers.length} ${t("widgets.instruments")}`),
    editLink,
  );
  section.append(head, renderWidget(config));
  list.appendChild(section);
  window.motion.fadeIn(section);
});

document.getElementById("widgets-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ title: t("widgets.title"), onBack: () => window.pageTransition.back() }),
);

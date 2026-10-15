window.i18n.initI18n();
const t = window.i18n.t;

const contentEl = document.getElementById("pers-content");
const user = window.storage.getCurrentUser();
const MAX = window.storage.HOME_CARDS_LIMIT;

const fill = (key, values) => Object.keys(values).reduce((text, name) => text.replace(`{${name}}`, values[name]), t(key));

document.getElementById("pers-top-appbar").appendChild(
  window.topAppbarModule.renderTopAppbar({ title: t("home_edit.title"), onBack: () => window.pageTransition.back() }),
);

let tickers = user ? window.storage.getHomeCards(user.id) : [];

function commit() {
  window.storage.setHomeCards(user.id, tickers);
  render();
}

function iconButton(icon, label, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hedit-button";
  button.disabled = disabled;
  button.setAttribute("aria-label", label);
  button.appendChild(window.iconModule.renderIcon(icon));
  button.addEventListener("click", onClick);
  return button;
}

function move(index, offset) {
  const target = index + offset;
  [tickers[index], tickers[target]] = [tickers[target], tickers[index]];
  commit();
}

function remove(index) {
  if (tickers.length <= 1) {
    window.toastModule.showToast({ message: t("home_edit.min"), icon: "exclamationmark-circle" });
    return;
  }
  tickers.splice(index, 1);
  commit();
}

function renderCurrent() {
  const list = document.createElement("div");
  tickers.forEach((ticker, index) => {
    const instrument = window.storage.getInstrument(ticker);
    const row = document.createElement("div");
    row.className = "hedit-row";
    const name = document.createElement("span");
    name.className = "hedit-name";
    name.textContent = instrument.ticker;
    const sub = document.createElement("span");
    sub.className = "hedit-sub";
    sub.textContent = index === 0 ? t("home_edit.main_card") : instrument.name;
    const text = document.createElement("span");
    text.className = "hedit-text";
    text.append(name, sub);
    row.append(
      text,
      iconButton("arrow-up", fill("home_edit.move_up", { name: ticker }), () => move(index, -1), index === 0),
      iconButton("arrow-down", fill("home_edit.move_down", { name: ticker }), () => move(index, 1), index === tickers.length - 1),
      iconButton("trash", fill("home_edit.remove", { name: ticker }), () => remove(index)),
    );
    list.appendChild(row);
  });
  return list;
}

function renderCandidates() {
  const favorites = window.storage.getFavorites(user.id);
  const all = window.storage.getInstruments().filter((i) => !tickers.includes(i.ticker));
  const favoriteItems = all.filter((i) => favorites.includes(i.ticker));
  const others = all.filter((i) => !favorites.includes(i.ticker) && ["share", "index"].includes(i.category));
  const full = tickers.length >= MAX;

  const wrap = document.createElement("div");
  wrap.className = "hedit-candidates";
  const section = (titleKey, items) => {
    if (items.length === 0) return;
    const title = document.createElement("h2");
    title.className = "pers-section-title";
    title.textContent = t(titleKey);
    wrap.appendChild(title);
    items.forEach((instrument) => {
      const row = document.createElement("div");
      row.className = "hedit-row";
      const text = document.createElement("span");
      text.className = "hedit-text";
      const name = document.createElement("span");
      name.className = "hedit-name";
      name.textContent = instrument.ticker;
      const sub = document.createElement("span");
      sub.className = "hedit-sub";
      sub.textContent = instrument.name;
      text.append(name, sub);
      row.append(
        text,
        iconButton("plus", fill("home_edit.add", { name: instrument.ticker }), () => {
          tickers.push(instrument.ticker);
          commit();
        }, full),
      );
      wrap.appendChild(row);
    });
  };
  section("home_edit.add_favorites", favoriteItems);
  section("home_edit.add_other", others);
  if (!wrap.children.length) {
    const none = document.createElement("p");
    none.className = "pers-note";
    none.textContent = t("home_edit.no_candidates");
    wrap.appendChild(none);
  }
  return wrap;
}

function render() {
  const title = document.createElement("h2");
  title.className = "pers-section-title";
  title.textContent = `${t("home_edit.current_title")} · ${fill("home_edit.counter", { count: tickers.length, max: MAX })}`;

  const hint = document.createElement("p");
  hint.className = "pers-note";
  hint.textContent = tickers.length >= MAX ? fill("home_edit.full", { max: MAX }) : t("home_edit.hint");

  const reset = window.buttonModule.renderButton({
    label: t("home_edit.reset"),
    variant: "outline",
    onClick: () => {
      tickers = window.storage.DEFAULT_HOME_CARDS.slice();
      window.storage.setHomeCards(user.id, null);
      window.toastModule.showToast({ message: t("home_edit.reset_done"), icon: "check" });
      render();
    },
  });

  contentEl.replaceChildren(title, renderCurrent(), hint, renderCandidates(), reset);
}

if (user) {
  render();
} else {
  // The overview is the same for every guest; editing is a registered feature.
  contentEl.replaceChildren(
    window.stateViewModule.renderStateView({
      icon: "lock",
      title: t("registration_required.title"),
      message: t("registration_required.message"),
      actionLabel: t("registration_required.register_button"),
      onAction: () => window.bottomSheetModule.showRegistrationRequired(),
    }),
  );
}

if (!window.iphoneFrame.isRealMobileDevice()) {
  document.body.appendChild(window.iphoneFrame.renderIphoneFrame(document.getElementById("screen-content")));
  document.body.classList.add("has-iphone-frame");
}

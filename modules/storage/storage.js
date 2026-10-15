// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// No backend — localStorage simulates a database.
// Single localStorage key holding one JSON object, one property per "table".
// Add per-entity helpers below as new tables are introduced; pages never call
// getDb()/saveDb() directly.
//
// Static reference data (instruments, disclosures, education, brokers, price
// history) comes from the seed-*.js files, which must be loaded before this
// script. It is read-only and never copied into localStorage; only user state
// (users, favorites, ...) lives in the db.
window.storage = (function () {
  const DB_KEY = "appDb";
  // Separate from DB_KEY on purpose — it's ephemeral auth state (who's
  // currently logged in), not a "table" of app data, so it shouldn't live
  // inside the same JSON blob as the seeded db.
  const SESSION_KEY = "appSession";

  const DEMO_USER = { id: "demouser", username: "demo@example.com", password: "12345678", name: "Demo" };

  function defaultDb() {
    return {
      users: [{ ...DEMO_USER }],
      // userId -> ordered list of tickers
      favorites: {},
    };
  }

  function getDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const db = defaultDb();
      saveDb(db);
      return db;
    }
    const db = JSON.parse(raw);
    // Older databases stored the demo user with different credentials.
    const demo = db.users.find((u) => u.id === DEMO_USER.id);
    if (demo && (demo.username !== DEMO_USER.username || demo.password !== DEMO_USER.password)) {
      Object.assign(demo, DEMO_USER);
      saveDb(db);
    }
    return db;
  }

  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function getUsers() {
    return getDb().users;
  }

  function addUser(user) {
    const db = getDb();
    db.users.push(user);
    saveDb(db);
    return user;
  }

  function findUserByUsername(username) {
    return getUsers().find((user) => user.username === username) || null;
  }

  function findUserById(id) {
    return getUsers().find((user) => user.id === id) || null;
  }

  function updateUser(id, changes) {
    const db = getDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, changes);
    saveDb(db);
    return user;
  }

  function deleteUser(id) {
    const db = getDb();
    db.users = db.users.filter((u) => u.id !== id);
    delete db.favorites[id];
    if (db.assist) delete db.assist[id];
    saveDb(db);
  }

  // Instruments (mock market data). category: share | index | etf | bond |
  // certificate | other — see seed-instruments.js.
  function getInstruments(category) {
    const all = window.SEED_INSTRUMENTS;
    return category ? all.filter((i) => i.category === category) : all.slice();
  }

  function getInstrument(ticker) {
    return window.SEED_INSTRUMENTS.find((i) => i.ticker === ticker) || null;
  }

  // Daily change in percent against the previous close.
  function getChangePercent(instrument) {
    return ((instrument.price - instrument.prevClose) / instrument.prevClose) * 100;
  }

  function getPriceSeries(ticker, range) {
    const instrument = getInstrument(ticker);
    return instrument ? window.generatePriceSeries(instrument, range) : [];
  }

  // Today's curve for mini charts (mock): runs from the previous close to the
  // current price, so its direction always matches the daily change shown next
  // to it. The intraday series only lends its wiggle (trend removed), scaled
  // to the size of today's move.
  function getDayCurve(ticker) {
    const instrument = getInstrument(ticker);
    if (!instrument) return [];
    const shape = getPriceSeries(ticker, "1d").map((candle) => candle.c);
    const last = shape.length - 1;
    const start = instrument.prevClose;
    const end = instrument.price;
    const wiggle = shape.map((value, i) => value - (shape[0] + ((shape[last] - shape[0]) * i) / last));
    const maxWiggle = Math.max(...wiggle.map(Math.abs)) || 1;
    const amplitude = Math.abs(end - start) * 0.6 || end * 0.002;
    return wiggle.map((w, i) => start + ((end - start) * i) / last + (w / maxWiggle) * amplitude);
  }

  function getDisclosures(ticker) {
    const all = window.SEED_CONTENT.disclosures;
    return ticker ? all.filter((d) => d.ticker === ticker) : all.slice();
  }

  // Tab content per instrument (financials, issuer, specs, ...). Shares come
  // from seed-product.js, the other types from seed-product-types.js. Returns
  // null for an unknown ticker. BÉTa products get a flag, they only have the
  // trading tab (TA_006).
  function getProductDetail(ticker) {
    const instrument = getInstrument(ticker);
    if (!instrument) return null;
    const base =
      instrument.category === "share"
        ? window.SEED_PRODUCT.shareDetail(instrument)
        : window.SEED_PRODUCT_TYPES.detail(instrument) || {};
    return Object.assign({ beta: window.SEED_PRODUCT.BETA_TICKERS.indexOf(ticker) !== -1 }, base);
  }

  // Split / dividend markers for the chart time axis (TA_001).
  function getProductMarkers(ticker) {
    return window.SEED_PRODUCT.markers(ticker);
  }

  // Disclosure list of one product (TA_0014): the home feed entries merged
  // with the generated per-type list, newest first.
  function getProductDisclosures(ticker) {
    const instrument = getInstrument(ticker);
    if (!instrument) return [];
    const categoryMap = { Rendszeres: "Pénzügyi jelentések", Rendkívüli: "Rendkívüli tájékoztatások", Tulajdonosi: "Tulajdonosi bejelentések" };
    const fromFeed = getDisclosures(ticker).map((item) => Object.assign({}, item, { category: categoryMap[item.category] || item.category }));
    const merged = fromFeed.concat(window.SEED_PRODUCT.disclosures(instrument));
    return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  // Measurable broker redirect (TA_000): every tap on a broker is counted.
  function logBrokerClick(brokerId, ticker, action) {
    const db = getDb();
    db.brokerClicks = db.brokerClicks || [];
    db.brokerClicks.push({ brokerId, ticker, action, at: new Date().toISOString() });
    saveDb(db);
  }

  function getCarouselItems() {
    return window.SEED_CONTENT.carousel.slice();
  }

  function getEducation() {
    return window.SEED_CONTENT.education.slice();
  }

  // List entry merged with its body (blocks / video / questions) from seed-education.js.
  function getEducationItem(id) {
    const item = window.SEED_CONTENT.education.find((entry) => entry.id === id);
    return item ? Object.assign({}, item, window.SEED_EDUCATION[id]) : null;
  }

  function getBrokers() {
    return window.SEED_CONTENT.brokers.slice();
  }

  function getMarketHours() {
    return window.SEED_CONTENT.marketHours;
  }

  // Favorites are a registered-user feature; guests (no session) have none.
  function getFavorites(userId) {
    const favorites = getDb().favorites || {};
    return (favorites[userId] || []).slice();
  }

  function isFavorite(userId, ticker) {
    return getFavorites(userId).includes(ticker);
  }

  // Returns true when the ticker is a favorite after the toggle.
  function toggleFavorite(userId, ticker) {
    const db = getDb();
    db.favorites = db.favorites || {};
    const list = db.favorites[userId] || [];
    const index = list.indexOf(ticker);
    if (index === -1) list.push(ticker);
    else list.splice(index, 1);
    db.favorites[userId] = list;
    saveDb(db);
    return index === -1;
  }

  // Manual order of the favorites list (K_0011): the whole ordered list is saved.
  function setFavorites(userId, tickers) {
    const db = getDb();
    db.favorites = db.favorites || {};
    db.favorites[userId] = tickers.slice();
    saveDb(db);
  }

  // Issuer disclosure notification per favorite (K_003). One issuer, optional
  // list of disclosure types; an empty list means every type. null = off.
  function getFavoriteNotify(userId, ticker) {
    const all = (getDb().favoriteNotify || {})[userId] || {};
    return all[ticker] || null;
  }

  function setFavoriteNotify(userId, ticker, settings) {
    const db = getDb();
    db.favoriteNotify = db.favoriteNotify || {};
    const all = db.favoriteNotify[userId] || {};
    if (settings) all[ticker] = { types: settings.types.slice() };
    else delete all[ticker];
    db.favoriteNotify[userId] = all;
    saveDb(db);
  }

  // Price alerts (ÁR_000–ÁR_0053): { id, ticker, direction: 'up' | 'down', level, createdAt }.
  // The page enforces the limit of ALERT_LIMIT per user.
  const ALERT_LIMIT = 10;

  function getAlerts(userId) {
    return ((getDb().alerts || {})[userId] || []).slice();
  }

  function addAlert(userId, { ticker, direction, level }) {
    const db = getDb();
    db.alerts = db.alerts || {};
    const list = db.alerts[userId] || [];
    const alert = { id: "a" + Date.now(), ticker, direction, level, createdAt: new Date().toISOString() };
    list.push(alert);
    db.alerts[userId] = list;
    saveDb(db);
    return alert;
  }

  // A fulfilled alert disappears (ÁR_0052); the deletion is the same call.
  function removeAlert(userId, alertId) {
    const db = getDb();
    db.alerts = db.alerts || {};
    db.alerts[userId] = (db.alerts[userId] || []).filter((a) => a.id !== alertId);
    saveDb(db);
  }

  // In-app notification inbox: { id, kind: 'alert' | 'disclosure', ticker, title,
  // text, at, read }. First read seeds a few demo entries per user.
  function getNotifications(userId) {
    const db = getDb();
    db.notifications = db.notifications || {};
    if (!db.notifications[userId]) {
      db.notifications[userId] = window.SEED_CONTENT.notifications.map((n) => Object.assign({ read: false }, n));
      saveDb(db);
    }
    return db.notifications[userId].slice();
  }

  function saveNotifications(userId, list) {
    const db = getDb();
    db.notifications = db.notifications || {};
    db.notifications[userId] = list;
    saveDb(db);
  }

  function markNotificationRead(userId, id) {
    saveNotifications(
      userId,
      getNotifications(userId).map((n) => (n.id === id ? Object.assign({}, n, { read: true }) : n)),
    );
  }

  function markAllNotificationsRead(userId) {
    saveNotifications(
      userId,
      getNotifications(userId).map((n) => Object.assign({}, n, { read: true })),
    );
  }

  // Home overview (NYÁ_001, NYÁ_004): ordered tickers on the cards, max 8. Guests and
  // users who never edited see the default set (configured by the developers).
  const DEFAULT_HOME_CARDS = ["BUX", "CETOP NTR", "BUMIX", "OTP", "MOL", "RICHTER", "MTELEKOM"];
  const HOME_CARDS_LIMIT = 8;

  function getHomeCards(userId) {
    const saved = userId ? (getDb().homeCards || {})[userId] : null;
    return (saved || DEFAULT_HOME_CARDS).slice();
  }

  function setHomeCards(userId, tickers) {
    const db = getDb();
    db.homeCards = db.homeCards || {};
    if (tickers) db.homeCards[userId] = tickers.slice();
    else delete db.homeCards[userId];
    saveDb(db);
  }

  // Bet assist AI chat state per registered user: accepted disclaimer, the
  // conversations and the daily question counter (AI_000–AI_007).
  function getAssist(userId) {
    const assist = (getDb().assist || {})[userId];
    return assist || { accepted: false, activeChatId: null, chats: [], usage: { date: "", count: 0 } };
  }

  function saveAssist(userId, state) {
    const db = getDb();
    db.assist = db.assist || {};
    db.assist[userId] = state;
    saveDb(db);
  }

  function setCurrentUser(id) {
    localStorage.setItem(SESSION_KEY, id);
  }

  function getCurrentUser() {
    const id = localStorage.getItem(SESSION_KEY);
    return id ? findUserById(id) : null;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return {
    getDb,
    saveDb,
    getUsers,
    addUser,
    findUserByUsername,
    findUserById,
    updateUser,
    deleteUser,
    getInstruments,
    getInstrument,
    getChangePercent,
    getPriceSeries,
    getDayCurve,
    getDisclosures,
    getProductDetail,
    getProductMarkers,
    getProductDisclosures,
    logBrokerClick,
    getCarouselItems,
    getEducation,
    getEducationItem,
    getBrokers,
    getMarketHours,
    getFavorites,
    isFavorite,
    toggleFavorite,
    setFavorites,
    getFavoriteNotify,
    setFavoriteNotify,
    ALERT_LIMIT,
    getAlerts,
    addAlert,
    removeAlert,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    DEFAULT_HOME_CARDS,
    HOME_CARDS_LIMIT,
    getHomeCards,
    setHomeCards,
    getAssist,
    saveAssist,
    setCurrentUser,
    getCurrentUser,
    logout,
  };
})();

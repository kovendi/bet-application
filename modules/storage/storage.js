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

  function getDisclosures(ticker) {
    const all = window.SEED_CONTENT.disclosures;
    return ticker ? all.filter((d) => d.ticker === ticker) : all.slice();
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
    getDisclosures,
    getCarouselItems,
    getEducation,
    getEducationItem,
    getBrokers,
    getMarketHours,
    getFavorites,
    isFavorite,
    toggleFavorite,
    getAssist,
    saveAssist,
    setCurrentUser,
    getCurrentUser,
    logout,
  };
})();

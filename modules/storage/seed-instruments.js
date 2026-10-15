// Classic script (not a module). Static mock reference data — there is no
// backend and none of this is real market data; names, tickers and prices are
// illustrative. Read it through window.storage (getInstruments() & co.), never
// directly from a page.
//
// Row: [ticker, name, category, unit, price, prevClose, dayLow, dayHigh,
//       turnover (Ft), quantity]
//   category: share | index | etf | bond | certificate | other
//   unit: HUF (price in forints, integer) | pt (index points / quote) | pct (% of par)
// Indexes are the only real-time instruments; everything else is delayed
// (disclaimer required, TK_009).

window.SEED_INSTRUMENTS = (function () {
  const ROWS = [
    ["OTP", "OTP Bank Nyrt.", "share", "HUF", 32450, 32100, 32000, 32620, 8240000000, 255000],
    ["MOL", "MOL Magyar Olaj- és Gázipari Nyrt.", "share", "HUF", 3180, 3215, 3160, 3225, 3510000000, 1103000],
    ["RICHTER", "Richter Gedeon Nyrt.", "share", "HUF", 10220, 10090, 10050, 10300, 2960000000, 290000],
    ["MTELEKOM", "Magyar Telekom Nyrt.", "share", "HUF", 1080, 1072, 1068, 1088, 1120000000, 1037000],
    ["ANY", "ANY Biztonsági Nyomda Nyrt.", "share", "HUF", 2540, 2540, 2520, 2560, 41000000, 16000],
    ["OPUS", "OPUS GLOBAL Nyrt.", "share", "HUF", 810, 826, 802, 830, 612000000, 752000],
    ["MASTERPLAST", "Masterplast Nyrt.", "share", "HUF", 1420, 1395, 1390, 1430, 96000000, 68000],
    ["PANNERGY", "Pannergy Nyrt.", "share", "HUF", 1150, 1166, 1148, 1170, 188000000, 163000],
    ["ALTEO", "ALTEO Nyrt.", "share", "HUF", 3960, 3880, 3880, 3990, 254000000, 64000],
    ["4IG", "4iG Nyrt.", "share", "HUF", 1020, 1052, 1015, 1058, 1480000000, 1440000],
    ["WABERERS", "Waberer's International Nyrt.", "share", "HUF", 5400, 5310, 5300, 5440, 132000000, 24000],
    ["ZWACK", "Zwack Unicum Nyrt.", "share", "HUF", 14800, 14800, 14700, 14900, 19000000, 1300],
    ["AUTOWALLIS", "Autowallis Nyrt.", "share", "HUF", 190, 187, 186, 192, 72000000, 380000],
    ["APPENINN", "Appeninn Nyrt.", "share", "HUF", 4700, 4780, 4690, 4790, 31000000, 6600],
    ["RABA", "Rába Automotive Holding Nyrt.", "share", "HUF", 1300, 1286, 1280, 1310, 54000000, 41000],
    ["DUNAHOUSE", "Duna House Holding Nyrt.", "share", "HUF", 1650, 1672, 1640, 1678, 22000000, 13000],
    ["BUX", "BUX index", "index", "pt", 112480.35, 111902.1, 111650.2, 112710.8, 0, 0],
    ["BUMIX", "BUMIX index", "index", "pt", 5842.12, 5861.4, 5830.5, 5868.9, 0, 0],
    ["CETOP NTR", "CETOP NTR index", "index", "pt", 3120.55, 3098.2, 3095.1, 3126.4, 0, 0],
    ["BUX NTR", "BUX NTR index", "index", "pt", 214300.8, 213190.3, 212950.0, 214620.5, 0, 0],
    ["BUXETF", "BUX Index ETF", "etf", "HUF", 1245, 1238, 1236, 1250, 38000000, 30500],
    ["PREMETF", "Prémium Részvény ETF", "etf", "HUF", 8830, 8860, 8800, 8885, 12000000, 1360],
    ["BLUEETF", "Magyar Blue Chip ETF", "etf", "HUF", 2105, 2092, 2090, 2112, 9000000, 4300],
    ["HGB30A", "Magyar Állampapír 2030/A", "bond", "pct", 98.45, 98.3, 98.2, 98.55, 410000000, 0],
    ["HGB35B", "Államkötvény 2035/B", "bond", "pct", 94.2, 94.35, 94.1, 94.4, 230000000, 0],
    ["OTPJ28", "OTP Jelzálogkötvény 2028", "bond", "pct", 99.1, 99.1, 99.0, 99.15, 85000000, 0],
    ["ERBUXTL", "Erste BUX Turbo Long certifikát", "certificate", "HUF", 1240, 1196, 1190, 1252, 14000000, 11300],
    ["RBOTP27", "Raiffeisen OTP Bonus certifikát 2027", "certificate", "HUF", 10450, 10380, 10380, 10480, 6000000, 580],
    ["ERMOLFS", "Erste MOL Faktor Short certifikát", "certificate", "HUF", 560, 574, 556, 578, 3000000, 5300],
    ["BUXZ26", "BUX határidős 2026. dec.", "other", "pt", 112650, 112060, 111800, 112900, 5200000000, 0],
    ["OTPZ26", "OTP határidős 2026. dec.", "other", "pt", 32600, 32240, 32150, 32780, 1900000000, 0],
    ["EURZ26", "EUR/HUF határidős 2026. dec.", "other", "pt", 395.4, 396.1, 395.0, 396.4, 980000000, 0],
    ["BUXC12", "BUX vételi opció 112 000 2026. dec.", "other", "pt", 1180, 1150, 1140, 1210, 640000000, 0],
  ];

  return ROWS.map(function (r) {
    const price = r[4];
    const spread = r[3] === "HUF" ? Math.max(1, Math.round(price * 0.0008)) : price * 0.0004;
    const hasBook = r[2] !== "index";
    return {
      ticker: r[0],
      name: r[1],
      category: r[2],
      unit: r[3],
      price: price,
      prevClose: r[5],
      dayLow: r[6],
      dayHigh: r[7],
      turnover: r[8],
      quantity: r[9],
      bid: hasBook ? price - spread : null,
      ask: hasBook ? price + spread : null,
      delayed: r[2] !== "index",
    };
  });
})();

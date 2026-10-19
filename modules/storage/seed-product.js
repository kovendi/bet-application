// Classic script (not a module). Static mock detail data for the product page
// tabs of shares (financials, valuation, issuer, analysis), the chart markers
// (split / dividend, TA_001) and the issuer disclosure lists (TA_0014).
// Illustrative only: there is no real company data here. Names of people are
// made up on purpose. Read it through window.storage (getProductDetail(),
// getProductMarkers(), getProductDisclosures()), never directly from a page.
//
// Text in this file is mock content, not UI chrome, so it is intentionally not
// routed through t() (same rule as seed-content.js). The per-type detail
// (bond, ETF, index, certificate, derivatives) is in seed-product-types.js.

window.SEED_PRODUCT = (function () {
  const LAST_YEAR = 2025;
  const DAY = 24 * 3600 * 1000;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // mulberry32, same generator as seed-series.js
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function makeIsin(ticker) {
    const known = (window.SEED_INSTRUMENTS || []).find((i) => i.ticker === ticker);
    if (known) return known.isin;
    const digits = String(hash("isin" + ticker)).padStart(10, "0").slice(0, 7);
    return "HU000" + digits + String(hash(ticker) % 10);
  }

  // Tickers picked so the demo shows the interesting states (BÉTa, no dividend, loss).
  const BETA_TICKERS = ["DUNAHOUSE", "AUTOWALLIS", "BLUEETF"];
  const REVENUE_SCALE = { OTP: 2400, MOL: 5200, RICHTER: 800, MTELEKOM: 700 };
  const NO_DIVIDEND = ["OPUS"];
  const LOSS_MAKING = ["OPUS"];
  const SEGMENTS = {
    OTP: ["Prémium", "Pénzügyi szolgáltatások"],
    MOL: ["Prémium", "Energia"],
    RICHTER: ["Prémium", "Gyógyszeripar"],
    MTELEKOM: ["Prémium", "Távközlés"],
    "4IG": ["Prémium", "Informatika"],
    ANY: ["Standard", "Nyomdaipar"],
    OPUS: ["Standard", "Holding"],
    MASTERPLAST: ["Standard", "Építőanyag"],
    PANNERGY: ["Xtend", "Energia"],
    ALTEO: ["Standard", "Energia"],
    WABERERS: ["Standard", "Logisztika"],
    ZWACK: ["Standard", "Élelmiszer, ital"],
    AUTOWALLIS: ["BÉTa", "Autókereskedelem"],
    APPENINN: ["Xtend", "Ingatlan"],
    RABA: ["Standard", "Autóipar"],
    DUNAHOUSE: ["BÉTa", "Ingatlan"],
  };

  const ABOUT = {
    OTP: "Közép- és kelet-európai bankcsoport, amely lakossági, vállalati és vagyonkezelési szolgáltatásokat nyújt. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)",
    MOL: "Integrált olaj- és gázipari vállalatcsoport kutatással, finomítással és kiskereskedelemmel. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)",
    RICHTER: "Gyógyszeripari vállalatcsoport, amely originális és generikus készítményeket fejleszt és gyárt. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)",
    MTELEKOM: "Távközlési szolgáltató mobil, vezetékes és televíziós szolgáltatásokkal. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)",
  };

  const FIRST_NAMES = ["Anna", "Béla", "Katalin", "Márton", "Eszter", "Gábor", "Zsófia", "Dániel"];
  const LAST_NAMES = ["Minta", "Példa", "Teszt", "Demó", "Mock", "Próba"];
  const ROLES = ["Vezérigazgató", "Pénzügyi igazgató", "Igazgatóság elnöke", "Felügyelőbizottság elnöke"];

  function financialSeries(rand, base, ratio, spread) {
    return [0, 1, 2, 3, 4].map(function (i) {
      return round1(base * ratio * (0.82 + i * 0.045 + rand() * spread));
    });
  }

  // Annual figures for the last 5 years, in billion forints (TA_0011).
  function financials(inst, rand) {
    const base = REVENUE_SCALE[inst.ticker] || 5 + rand() * 90;
    const lossMaking = LOSS_MAKING.indexOf(inst.ticker) !== -1;
    const revenue = financialSeries(rand, base, 1, 0.08);
    const operating = financialSeries(rand, base, 0.08 + rand() * 0.12, 0.1);
    const net = operating.map(function (v, i) {
      return round1(lossMaking && i > 2 ? -v * 0.6 : v * 0.72);
    });
    const assets = financialSeries(rand, base, 1.6 + rand() * 1.4, 0.06);
    const equity = assets.map(function (v) {
      return round1(v * (0.28 + rand() * 0.2));
    });
    const liabilities = assets.map(function (v, i) {
      return round1(v - equity[i]);
    });
    const cfo = net.map(function (v) {
      return round1(v * 1.25 + base * 0.02);
    });
    const cfi = revenue.map(function (v) {
      return round1(-v * (0.05 + rand() * 0.05));
    });
    const cff = cfo.map(function (v, i) {
      return round1(-(v + cfi[i]) * (0.4 + rand() * 0.4));
    });
    return {
      years: [0, 1, 2, 3, 4].map(function (i) {
        return LAST_YEAR - 4 + i;
      }),
      income: { revenue: revenue, operating: operating, net: net },
      balance: { assets: assets, equity: equity, liabilities: liabilities },
      cashflow: { operating: cfo, investing: cfi, financing: cff },
    };
  }

  // 10 years of dividend per share in HUF; null = no dividend that year (TA_0012).
  function dividends(inst, rand) {
    const years = [];
    for (let year = LAST_YEAR - 9; year <= LAST_YEAR; year++) years.push(year);
    const skipUntil = inst.ticker === "4IG" ? 6 : 0;
    const noDividend = NO_DIVIDEND.indexOf(inst.ticker) !== -1;
    const values = years.map(function (year, i) {
      if (noDividend || i < skipUntil) return null;
      return Math.max(1, Math.round(inst.price * 0.03 * (0.5 + i * 0.07 + rand() * 0.1)));
    });
    return { years: years, values: values };
  }

  function ratios(inst, rand) {
    const loss = LOSS_MAKING.indexOf(inst.ticker) !== -1;
    return {
      pb: round1(0.8 + rand() * 2.2),
      pe: loss ? null : round1(6 + rand() * 14),
      debt: Math.round(20 + rand() * 50),
      roa: round1(1 + rand() * 8),
      roe: round1(8 + rand() * 14),
    };
  }

  function issuer(inst, rand) {
    const segment = SEGMENTS[inst.ticker] || ["Standard", "Egyéb"];
    const shares = Math.round((10 + rand() * 150) * 1000000);
    const foreign = Math.round(25 + rand() * 30);
    const domestic = Math.round(15 + rand() * 20);
    const retail = Math.round(8 + rand() * 12);
    const names = FIRST_NAMES.slice().sort(function () {
      return rand() - 0.5;
    });
    return {
      facts: [
        ["isin", makeIsin(inst.ticker)],
        ["market", segment[0]],
        ["sector", segment[1]],
        ["shares", shares],
        ["market_cap", inst.price * shares],
        ["free_float", Math.round(40 + rand() * 50)],
        ["currency", "HUF"],
      ],
      about: ABOUT[inst.ticker] || inst.name + " a Budapesti Értéktőzsde kereskedett társasága. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)",
      shareholders: [
        { name: "Külföldi intézményi befektetők", percent: foreign },
        { name: "Belföldi intézményi befektetők", percent: domestic },
        { name: "Magánbefektetők", percent: retail },
        { name: "Egyéb, saját részvény", percent: 100 - foreign - domestic - retail },
      ],
      management: ROLES.map(function (role, i) {
        return { name: LAST_NAMES[(i + names.length) % LAST_NAMES.length] + " " + names[i], role: role };
      }),
    };
  }

  // Only the BÉT-supported coverage has an analysis tab (TA_0015).
  function analysis(inst) {
    const covered = { OTP: [9, 3, 1], MOL: [7, 4, 1], RICHTER: [6, 3, 2], MTELEKOM: [5, 4, 0] };
    const counts = covered[inst.ticker];
    if (!counts) return null;
    const price = inst.price;
    return {
      buy: counts[0],
      hold: counts[1],
      sell: counts[2],
      targetMin: Math.round(price * 0.92),
      targetAvg: Math.round(price * 1.12),
      targetMax: Math.round(price * 1.31),
      updated: "2026-10-02",
      reports: [
        { id: "an1", title: "Részvényelemzés: célár emelése", source: "Minta Elemzőház", date: "2026-10-02" },
        { id: "an2", title: "Negyedéves eredmény-előzetes", source: "Példa Befektetési Zrt.", date: "2026-09-18" },
        { id: "an3", title: "Kiemelt ajánlás", source: "Teszt Elemzési Kft.", date: "2026-08-27" },
      ],
    };
  }

  function shareDetail(inst) {
    const rand = rng(hash(inst.ticker + "share"));
    return {
      financials: financials(inst, rand),
      dividends: dividends(inst, rand),
      ratios: ratios(inst, rand),
      issuer: issuer(inst, rand),
      analysis: analysis(inst),
    };
  }

  // Dividend and split / reverse split markers on the chart time axis (TA_001).
  // daysAgo is relative to today so the markers fall into the shown ranges.
  const MARKERS = {
    OTP: [
      { daysAgo: 38, type: "dividend", value: 1250 },
      { daysAgo: 395, type: "dividend", value: 1080 },
    ],
    MOL: [
      { daysAgo: 52, type: "dividend", value: 160 },
      { daysAgo: 410, type: "dividend", value: 142 },
      { daysAgo: 640, type: "split", ratio: "1:10" },
    ],
    RICHTER: [
      { daysAgo: 70, type: "dividend", value: 540 },
      { daysAgo: 430, type: "dividend", value: 480 },
    ],
    MTELEKOM: [
      { daysAgo: 60, type: "dividend", value: 55 },
      { daysAgo: 420, type: "dividend", value: 48 },
    ],
    OPUS: [{ daysAgo: 1000, type: "reverse_split", ratio: "2:1" }],
  };

  function markers(ticker) {
    const now = Date.now();
    return (MARKERS[ticker] || []).map(function (marker) {
      return Object.assign({}, marker, { t: now - marker.daysAgo * DAY });
    });
  }

  // --- Issuer disclosures per type (TA_0014, TA_0021, TA_0032, TA_0052) ---------

  const DISCLOSURE_CATEGORIES = {
    share: {
      "Pénzügyi jelentések": ["Féléves jelentés", "Negyedéves gyorsjelentés", "Éves beszámoló", "Konszolidált eredmény"],
      "Rendkívüli tájékoztatások": ["Osztalékfizetés időpontja", "Vezetőségi változás", "Akvizíció bejelentése", "Hitelminősítés változása"],
      "Közgyűlési dokumentumok": ["Közgyűlési meghívó", "Határozati javaslatok", "Közgyűlési jegyzőkönyv"],
      "Tulajdonosi bejelentések": ["Szavazati jogok megváltozása", "Vezetői tranzakció", "Saját részvény vásárlása"],
    },
    bond: {
      "Kamatfizetés": ["Kamatfizetési értesítés", "Kamatperiódus kezdete"],
      "Rendkívüli tájékoztatások": ["Kibocsátói közlemény", "Hitelminősítés változása"],
      "Tájékoztatók": ["Alaptájékoztató", "Végleges feltételek"],
    },
    etf: {
      "Nettó eszközérték": ["Nettó eszközérték közzététele", "Havi portfólió-összetétel"],
      "Rendkívüli tájékoztatások": ["Alapkezelői közlemény", "Díjváltozás"],
      "Tájékoztatók": ["Kezelési szabályzat", "Kiemelt befektetői információk"],
    },
    certificate: {
      "Végleges feltételek": ["Végleges feltételek", "Kibocsátási feltételek módosítása"],
      "Rendkívüli tájékoztatások": ["Kibocsátói közlemény", "Korrekciós esemény"],
      "Tájékoztatók": ["Alaptájékoztató", "Kiegészítés az alaptájékoztatóhoz"],
    },
    index: {
      Kézikönyv: ["BUX index kézikönyv"],
      "Összetétel-közlemények": ["Félévi összetétel-felülvizsgálat", "Súlykorlát közlemény"],
    },
  };
  const FORMAT_ORDER = ["pdf", "pdf", "pdf", "docx", "pdf", "xlsx", "pdf", "pdf", "zip", "pdf", "html", "pdf"];

  function isoDate(daysAgo) {
    return new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10);
  }

  function disclosures(inst) {
    const categories = DISCLOSURE_CATEGORIES[inst.category] || DISCLOSURE_CATEGORIES.share;
    const names = Object.keys(categories);
    const rand = rng(hash(inst.ticker + "disc"));
    const count = inst.category === "index" ? 4 : 12;
    const list = [];
    for (let i = 0; i < count; i++) {
      const category = names[Math.floor(rand() * names.length)];
      const titles = categories[category];
      list.push({
        id: inst.ticker + "-" + i,
        ticker: inst.ticker,
        title: titles[Math.floor(rand() * titles.length)] + " " + (LAST_YEAR + 1 - Math.floor(i / 4)),
        category: category,
        date: isoDate(4 + i * 17 + Math.floor(rand() * 9)),
        format: inst.category === "index" && i === 0 ? "pdf" : FORMAT_ORDER[i % FORMAT_ORDER.length],
      });
    }
    return list;
  }

  return {
    LAST_YEAR: LAST_YEAR,
    BETA_TICKERS: BETA_TICKERS,
    hash: hash,
    rng: rng,
    round1: round1,
    makeIsin: makeIsin,
    shareDetail: shareDetail,
    markers: markers,
    disclosures: disclosures,
  };
})();

// Classic script (not a module). Static mock detail data for the non-share
// instrument types of the product page: bonds (TA_002), ETFs (TA_003), indexes
// (TA_004), certificates (TA_005) and derivatives (TA_007). Illustrative only.
// Must be loaded after seed-product.js; read it through
// window.storage.getProductDetail(), never directly from a page.
//
// Every detail is { specs: [[key, value]], about, ... }. The spec key is
// translated in the UI (spec.<key>), the value is mock content.

window.SEED_PRODUCT_TYPES = (function () {
  const product = window.SEED_PRODUCT;

  function yearOf(text, fallback) {
    const match = /\d{4}/.exec(text);
    return match ? Number(match[0]) : fallback;
  }

  function bond(inst) {
    const rand = product.rng(product.hash(inst.ticker + "bond"));
    const government = inst.ticker.indexOf("HGB") === 0;
    const maturity = yearOf(inst.name, 2030);
    const coupon = Math.round((3 + rand() * 4) * 4) / 4;
    const years = Math.max(1, maturity - 2026);
    const yieldToMaturity = coupon + (100 - inst.price) / years;
    return {
      specs: [
        ["isin", product.makeIsin(inst.ticker)],
        ["bond_type", government ? "Államkötvény" : "Jelzáloglevél"],
        ["nominal", "10 000 Ft"],
        ["coupon", coupon.toString().replace(".", ",") + "% (fix)"],
        ["coupon_frequency", "Éves"],
        ["maturity", maturity + ". június 24."],
        ["yield", yieldToMaturity.toFixed(2).replace(".", ",") + "%"],
        ["market", government ? "Fő" : "Xbond"],
        ["currency", "HUF"],
      ],
      about: government
        ? "A magyar állam által kibocsátott, forintban denominált államkötvény. (Mintaszöveg, a végleges bemutatót a BÉT adja.)"
        : "Bank által kibocsátott, ingatlanfedezettel biztosított értékpapír. (Mintaszöveg, a végleges bemutatót a BÉT adja.)",
    };
  }

  function etf(inst) {
    const beta = product.BETA_TICKERS.indexOf(inst.ticker) !== -1;
    return {
      specs: [
        ["isin", product.makeIsin(inst.ticker)],
        ["benchmark", inst.ticker === "BUXETF" ? "BUX index" : inst.ticker === "PREMETF" ? "Prémium kategória részvényei" : "Magyar blue chip részvények"],
        ["manager", "Minta Alapkezelő Zrt."],
        ["replication", "Fizikai"],
        ["fee", "0,35% / év"],
        ["distribution", "Évente fizet osztalékot"],
        ["market", beta ? "BÉTa" : "Fő"],
        ["currency", "HUF"],
      ],
      about: "Tőzsdén kereskedett alap, amely a követett index teljesítményét másolja. (Mintaszöveg, a végleges alapkezelői bemutatót a BÉT adja.)",
    };
  }

  const CERTIFICATES = {
    ERBUXTL: { kind: "Turbó Long", underlying: "BUX index", issuer: "Erste Group Bank AG", expiry: "Nyílt végű", level: "108 000 pont (kigyulladási szint)", leverage: "8x" },
    RBOTP27: { kind: "Bonus", underlying: "OTP részvény", issuer: "Raiffeisen Centrobank AG", expiry: "2027. december 17.", level: "26 000 Ft (védelmi szint)", leverage: "–" },
    ERMOLFS: { kind: "Faktor Short", underlying: "MOL részvény", issuer: "Erste Group Bank AG", expiry: "Nyílt végű", level: "Napi újraállítás", leverage: "−5x faktor" },
  };

  function certificate(inst) {
    const data = CERTIFICATES[inst.ticker] || CERTIFICATES.ERBUXTL;
    return {
      specs: [
        ["isin", product.makeIsin(inst.ticker)],
        ["certificate_type", data.kind],
        ["underlying", data.underlying],
        ["issuer", data.issuer],
        ["expiry", data.expiry],
        ["level", data.level],
        ["leverage", data.leverage],
        ["currency", "HUF"],
      ],
      about: "Strukturált termék, amelynek értéke az alaptermék árfolyamától függ. (Mintaszöveg, a végleges kibocsátói bemutatót a BÉT adja.)",
    };
  }

  const INDEX_COMPONENTS = {
    BUX: ["OTP", "MOL", "RICHTER", "MTELEKOM", "4IG", "OPUS", "ALTEO", "PANNERGY", "MASTERPLAST", "ANY", "WABERERS", "ZWACK", "RABA"],
    BUMIX: ["OPUS", "4IG", "ALTEO", "PANNERGY", "MASTERPLAST", "WABERERS", "ANY", "RABA", "ZWACK", "APPENINN", "DUNAHOUSE", "AUTOWALLIS"],
    "CETOP NTR": ["OTP", "MOL", "RICHTER", "PKO Bank Polski", "ČEZ", "Komerční banka", "Erste Group", "PZU"],
  };

  function index(inst) {
    const isTotalReturn = inst.ticker.indexOf("NTR") !== -1;
    const listKey = inst.ticker === "BUX NTR" ? "BUX" : inst.ticker;
    return {
      specs: [
        ["official_name", inst.name.replace(" index", "") + " (hivatalos név)"],
        ["index_type", isTotalReturn ? "Nettó teljes hozam index" : "Árindex"],
        ["isin", inst.ticker === "BUX" ? "HU0005060210" : product.makeIsin(inst.ticker)],
        ["weighting", "Szabad lebegésű piaci kapitalizációval súlyozott"],
        ["calc_currency", "Forint"],
        ["structure", "12–25 részvény"],
        ["review", "Évente kétszer: márciusban és szeptemberben"],
        ["calc_frequency", "Folyamatosan, a kereskedési idő alatt"],
        ["codes", "Reuters: ." + inst.ticker.replace(" ", "") + ", Bloomberg: " + inst.ticker + " Index"],
        ["base_value", "1 000 pont (1991. január 2.)"],
      ],
      about: "A tőzsde hivatalos indexe, amelyet a BÉT számol és tesz közzé. (Mintaszöveg, a végleges leírást a BÉT adja.)",
      components: (INDEX_COMPONENTS[listKey] || INDEX_COMPONENTS.BUX).map(function (name) {
        const known = window.SEED_INSTRUMENTS.find(function (item) {
          return item.ticker === name;
        });
        return { ticker: known ? known.ticker : null, name: known ? known.name : name };
      }),
      compositionDate: "2026-09-21",
    };
  }

  // TA_007: the future, option and FX sections all have to be shown.
  const DERIVATIVES = {
    BUXZ26: { kind: "future", underlying: "BUX index", size: "1 pont = 10 Ft", tick: "1 pont", settlement: "Készpénzes", margin: "8%", openInterest: "12 480 szerződés" },
    OTPZ26: { kind: "future", underlying: "OTP részvény", size: "100 részvény", tick: "1 Ft", settlement: "Készpénzes", margin: "12%", openInterest: "8 120 szerződés" },
    EURZ26: { kind: "fx", underlying: "EUR/HUF árfolyam", size: "10 000 EUR", tick: "0,01 Ft", settlement: "Készpénzes", margin: "4%", openInterest: "21 300 szerződés" },
    BUXC12: { kind: "option", underlying: "BUX index", size: "1 pont = 10 Ft", tick: "1 pont", settlement: "Készpénzes, európai típusú", margin: "–", openInterest: "3 960 szerződés", strike: "112 000 pont", optionType: "Vételi (Call)" },
  };

  function derivative(inst) {
    const data = DERIVATIVES[inst.ticker] || DERIVATIVES.BUXZ26;
    const specs = [
      ["underlying", data.underlying],
      ["expiry", "2026. december 18."],
      ["contract_size", data.size],
      ["tick_size", data.tick],
      ["settlement", data.settlement],
      ["margin", data.margin],
      ["open_interest", data.openInterest],
    ];
    if (data.kind === "option") {
      specs.splice(1, 0, ["option_type", data.optionType], ["strike", data.strike]);
    }
    return { kind: data.kind, specs: specs };
  }

  const BUILDERS = { bond: bond, etf: etf, index: index, certificate: certificate, other: derivative };

  function detail(inst) {
    const build = BUILDERS[inst.category];
    return build ? build(inst) : null;
  }

  return { detail: detail };
})();

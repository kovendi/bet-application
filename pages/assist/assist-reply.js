// Classic script. Fake answer engine of the Bet assist AI (AI_007): keyword
// matching over window.SEED_ASSIST plus live mock market data. There is no
// model behind it.
//
// window.assistReply.buildReply(question) -> {
//   text,       // markup string (**bold**, "- " bullets, blank line = paragraph)
//   blocks,     // [{ type: 'instruments', tickers } | { type: 'brokers' } | { type: 'education', ids }]
//   followups,  // suggested next questions
// }
// window.assistReply.getSuggestions() -> starter questions in the app language.

window.assistReply = (function () {
  const HU_MARKET_HOURS_KEYS = ["nyitva", "nyitvatartas", "mikor nyit", "mikor zar", "zarva", "kereskedesi ido", "nyitas"];
  const HU_GAINERS_KEYS = ["nyertes", "legjobban emelked", "legtobbet emelked", "emelked"];
  const HU_LOSERS_KEYS = ["vesztes", "legjobban esett", "legtobbet esett", "esett", "csokken"];

  // UI-ish sentences of the dynamic answers, per language.
  const STRINGS = {
    hu: {
      rose: "emelkedett",
      fell: "csökkent",
      unchanged: "nem változott",
      priceLine: (name, ticker, price, direction, change) =>
        `**${name}** (${ticker}) árfolyama jelenleg **${price}**. Az előző záráshoz képest ${direction}: **${change}**.`,
      dayRange: "Napi sáv",
      turnover: "Forgalom",
      data: "Adat",
      delayed: "késleltetett árfolyam",
      realtime: "valós idejű árfolyam",
      compareIntro: "Itt a két termék legfontosabb adatai egymás mellett:",
      compareRow: (ticker, price, change, turnover) => `- **${ticker}:** ${price} (${change}), forgalom ${turnover}`,
      compareOutro: "A számok önmagukban nem döntik el, melyik „jobb”: más a kockázatuk, az iparáguk és a hozamprofiljuk.",
      isOpen: "A tőzsde **jelenleg nyitva van**.",
      isClosed: "A tőzsde **jelenleg zárva van**.",
      hoursText: (open, close) =>
        `A folyamatos kereskedés **hétfőtől péntekig ${open}–${close}** között zajlik (budapesti idő szerint). Hétvégén és ünnepnapokon a piac zárva tart.\n\nA főoldalon a piaci státusz mindig mutatja a hátralévő időt vagy a következő nyitást.`,
      hoursFollowups: ["Melyek ma a legnagyobb nyertesek?", "Mi az a részvény?", "Hogyan vásárolhatok részvényt?"],
      moversText: (label) =>
        `A mai nap **legnagyobb részvény-${label}** a késleltetett árfolyamok alapján:\n\nA lista a Főoldalon is megtalálható, ott forgalom szerint is rendezheted. Az árfolyamok késleltetettek, a változás az előző záráshoz viszonyított.`,
      winners: "nyertesei",
      losers: "vesztesei",
      upFollowups: ["Melyek ma a legnagyobb vesztesek?", "Mi az a P/E mutató?"],
      downFollowups: ["Melyek ma a legnagyobb nyertesek?"],
      notes: {
        index: "\n\nAz index egy kosár teljesítményét összegzi, ezért közvetlenül nem vásárolható, de ETF-en keresztül követhető.",
        bond: "\n\nA kötvény árfolyama a névérték százalékában szerepel.",
        certificate: "\n\nA certifikátok tőkeáttételes termékek lehetnek, a veszteség gyorsan nőhet.",
      },
      instrumentFollowups: ["Hogyan vásárolhatok részvényt?", "Mi az a P/E mutató?", "Mi az az osztalék?"],
      compareFollowups: ["Mi az a P/E mutató?", "Mi az az osztalék?", "Mi a diverzifikáció?"],
    },
    en: {
      rose: "risen",
      fell: "fallen",
      unchanged: "not changed",
      priceLine: (name, ticker, price, direction, change) =>
        `The price of **${name}** (${ticker}) is currently **${price}**. Compared with the previous close it has ${direction}: **${change}**.`,
      dayRange: "Daily range",
      turnover: "Turnover",
      data: "Data",
      delayed: "delayed price",
      realtime: "real-time price",
      compareIntro: "Here are the key data of the two products side by side:",
      compareRow: (ticker, price, change, turnover) => `- **${ticker}:** ${price} (${change}), turnover ${turnover}`,
      compareOutro: "The numbers alone do not decide which one is “better”: their risk, industry and return profile differ.",
      isOpen: "The exchange is **currently open**.",
      isClosed: "The exchange is **currently closed**.",
      hoursText: (open, close) =>
        `Continuous trading takes place **Monday to Friday, ${open}–${close}** (Budapest time). The market is closed on weekends and public holidays.\n\nOn the home screen the market status always shows the time left or the next opening.`,
      hoursFollowups: ["What are today's biggest gainers?", "What is a share?", "How do I buy shares?"],
      moversText: (label) =>
        `Today's **biggest share ${label}** based on delayed prices:\n\nThe list is also on the Home screen, where you can sort it by turnover too. Prices are delayed, and the change is relative to the previous close.`,
      winners: "gainers",
      losers: "losers",
      upFollowups: ["What are today's biggest losers?", "What is the P/E ratio?"],
      downFollowups: ["What are today's biggest gainers?"],
      notes: {
        index: "\n\nAn index summarizes the performance of a basket, so it cannot be bought directly, but it can be followed through an ETF.",
        bond: "\n\nA bond's price is shown as a percentage of its nominal value.",
        certificate: "\n\nCertificates can be leveraged products, and losses can grow quickly.",
      },
      instrumentFollowups: ["How do I buy shares?", "What is the P/E ratio?", "What is a dividend?"],
      compareFollowups: ["What is the P/E ratio?", "What is a dividend?", "What is diversification?"],
    },
  };

  const isEnglish = () => window.i18n.getLanguage() === "en";
  const str = () => (isEnglish() ? STRINGS.en : STRINGS.hu);

  // Hungarian seed, with the English texts laid over it in English mode. The
  // Hungarian keys stay active so a question in either language is understood.
  function getSeed() {
    const hu = window.SEED_ASSIST;
    const en = window.SEED_ASSIST_EN;
    if (!isEnglish() || !en) return hu;
    const topics = hu.topics.map((topic) => {
      const own = en.topics[topic.id];
      return own ? Object.assign({}, topic, own, { keys: topic.keys.concat(own.keys) }) : topic;
    });
    return Object.assign({}, hu, en, {
      topics,
      adviceKeys: hu.adviceKeys.concat(en.adviceKeys),
      greetingKeys: hu.greetingKeys.concat(en.greetingKeys),
      thanksKeys: hu.thanksKeys.concat(en.thanksKeys),
    });
  }
  // Name words that never identify a company on their own.
  const GENERIC_WORDS = ["magyar", "nyrt", "zrt", "holding", "index", "bux", "etf", "allamkotveny", "jelzalogkotveny"];
  const MAX_CARDS = 3;

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9/ ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function containsPhrase(haystack, phrase) {
    const needle = normalize(phrase);
    return new RegExp("(^| )" + needle.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).test(haystack);
  }

  const matchesAny = (haystack, keys) => keys.some((key) => containsPhrase(haystack, key));

  // --- Instruments mentioned in the question ---------------------------------

  function aliasesOf(instrument) {
    const aliases = [normalize(instrument.ticker)];
    if (instrument.category === "share") {
      const first = normalize(instrument.name)
        .split(" ")
        .find((word) => word.length >= 3 && !GENERIC_WORDS.includes(word));
      if (first) aliases.push(first);
    }
    return aliases;
  }

  function findInstruments(normalized) {
    return window.storage.getInstruments().filter((instrument) =>
      aliasesOf(instrument).some((alias) => new RegExp("(^| )" + alias + "( |$)").test(normalized)),
    );
  }

  function describeInstrument(instrument) {
    const money = window.moneyModule;
    const change = window.storage.getChangePercent(instrument);
    const price = money.formatPrice(instrument.price, instrument.unit);
    const low = money.formatPrice(instrument.dayLow, instrument.unit);
    const high = money.formatPrice(instrument.dayHigh, instrument.unit);
    const words = str();
    const direction = change > 0 ? words.rose : change < 0 ? words.fell : words.unchanged;
    const lines = [
      words.priceLine(instrument.name, instrument.ticker, price, direction, money.formatPercent(change)),
      `- **${words.dayRange}:** ${low} – ${high}`,
    ];
    if (instrument.turnover > 0) lines.push(`- **${words.turnover}:** ${money.formatCompactMoney(instrument.turnover)}`);
    lines.push(`- **${words.data}:** ${instrument.delayed ? words.delayed : words.realtime}`);
    return lines.join("\n");
  }

  function compareInstruments(list) {
    const money = window.moneyModule;
    const rows = list.map((instrument) => {
      const change = window.storage.getChangePercent(instrument);
      return str().compareRow(instrument.ticker, money.formatPrice(instrument.price, instrument.unit), money.formatPercent(change), money.formatCompactMoney(instrument.turnover));
    });
    return str().compareIntro + "\n\n" + rows.join("\n") + "\n\n" + str().compareOutro;
  }

  // --- Dynamic topics ----------------------------------------------------------

  function marketHoursReply() {
    const hours = window.storage.getMarketHours();
    const status = window.marketStatusModule ? window.marketStatusModule.getStatus() : null;
    const words = str();
    const now = status ? (status.open ? words.isOpen : words.isClosed) : "";
    return {
      text: `${now}\n\n${words.hoursText(hours.open, hours.close)}`,
      blocks: [],
      followups: words.hoursFollowups,
    };
  }

  function topMoversReply(direction) {
    const sorted = window.storage
      .getInstruments("share")
      .sort((a, b) => window.storage.getChangePercent(b) - window.storage.getChangePercent(a));
    const picked = (direction === "down" ? sorted.reverse() : sorted).slice(0, MAX_CARDS);
    const words = str();
    const label = direction === "down" ? words.losers : words.winners;
    return {
      text: words.moversText(label),
      blocks: [{ type: "instruments", tickers: picked.map((instrument) => instrument.ticker) }],
      followups: direction === "down" ? words.downFollowups : words.upFollowups,
    };
  }

  // --- Entry point ----------------------------------------------------------------

  function topicReply(topic, instruments) {
    const tickers = Array.from(new Set([...(topic.tickers || []), ...instruments.map((i) => i.ticker)])).slice(0, MAX_CARDS);
    const blocks = [];
    if (topic.blocks && topic.blocks.includes("brokers")) blocks.push({ type: "brokers" });
    if (tickers.length) blocks.push({ type: "instruments", tickers });
    if (topic.edu) blocks.push({ type: "education", ids: topic.edu });
    return { text: topic.text, blocks, followups: topic.followups };
  }

  function instrumentReply(instruments) {
    const main = instruments[0];
    const categoryNote = str().notes[main.category] || "";
    return {
      text: describeInstrument(main) + categoryNote,
      blocks: [{ type: "instruments", tickers: instruments.slice(0, MAX_CARDS).map((i) => i.ticker) }],
      followups: str().instrumentFollowups,
    };
  }

  function buildReply(question) {
    const seed = getSeed();
    const normalized = normalize(question);
    const instruments = findInstruments(normalized);

    if (matchesAny(normalized, seed.adviceKeys)) {
      return { text: seed.adviceText, blocks: [], followups: seed.adviceFollowups };
    }
    if (matchesAny(normalized, HU_MARKET_HOURS_KEYS.concat(seed.marketHoursKeys || []))) {
      return marketHoursReply();
    }
    if (matchesAny(normalized, HU_GAINERS_KEYS.concat(seed.gainersKeys || []))) {
      return topMoversReply("up");
    }
    if (matchesAny(normalized, HU_LOSERS_KEYS.concat(seed.losersKeys || []))) {
      return topMoversReply("down");
    }
    if (instruments.length >= 2) {
      return {
        text: compareInstruments(instruments.slice(0, MAX_CARDS)),
        blocks: [{ type: "instruments", tickers: instruments.slice(0, MAX_CARDS).map((i) => i.ticker) }],
        followups: str().compareFollowups,
      };
    }

    // "Hogyan vásárolhatok részvényt?" is about buying, not about what a share is.
    const first = seed.priority || ["howto-buy"];
    const ordered = first.map((id) => seed.topics.find((c) => c.id === id)).filter(Boolean).concat(seed.topics.filter((c) => !first.includes(c.id)));
    const topic = ordered.find((candidate) => matchesAny(normalized, candidate.keys));
    if (topic && !(instruments.length === 1 && containsPhrase(normalized, instruments[0].ticker) && topic.id === "index")) {
      return topicReply(topic, instruments);
    }
    if (instruments.length === 1) return instrumentReply(instruments);
    if (matchesAny(normalized, seed.thanksKeys)) return { text: seed.thanksText, blocks: [], followups: seed.suggestions.slice(0, 3) };
    if (matchesAny(normalized, seed.greetingKeys)) return { text: seed.greetingText, blocks: [], followups: seed.suggestions.slice(0, 3) };
    return { text: seed.fallbackText, blocks: [], followups: seed.fallbackFollowups };
  }

  // Autocomplete for "@" mentions in the composer: matches ticker or name.
  function searchInstruments(query) {
    const needle = normalize(query);
    return window.storage
      .getInstruments()
      .filter((i) => !needle || normalize(i.ticker).startsWith(needle) || normalize(i.name).includes(needle))
      .slice(0, 8);
  }

  const getSuggestions = () => getSeed().suggestions;

  return { buildReply, searchInstruments, normalize, getSuggestions };
})();

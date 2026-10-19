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

  // UI-ish sentences of the dynamic answers, read from the locale tables
  // (assist.reply.* in hu-assist.js / en-assist.js) in the current language.
  const t = (key) => window.i18n.t(key);
  const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, name) => values[name]);
  const list = (key) => t("assist.reply." + key).split("|");
  const isEnglish = () => window.i18n.getLanguage() === "en";
  const str = () => ({
    rose: t("assist.reply.rose"),
    fell: t("assist.reply.fell"),
    unchanged: t("assist.reply.unchanged"),
    priceLine: (name, ticker, price, direction, change) => fill(t("assist.reply.price_line"), { name, ticker, price, direction, change }),
    dayRange: t("assist.reply.day_range"),
    turnover: t("assist.reply.turnover"),
    data: t("assist.reply.data"),
    delayed: t("assist.reply.delayed"),
    realtime: t("assist.reply.realtime"),
    compareIntro: t("assist.reply.compare_intro"),
    compareRow: (ticker, price, change, turnover) => fill(t("assist.reply.compare_row"), { ticker, price, change, turnover }),
    compareOutro: t("assist.reply.compare_outro"),
    isOpen: t("assist.reply.is_open"),
    isClosed: t("assist.reply.is_closed"),
    hoursText: (open, close) => fill(t("assist.reply.hours_text"), { open, close }),
    hoursFollowups: list("hours_followups"),
    moversText: (label) => fill(t("assist.reply.movers_text"), { label }),
    winners: t("assist.reply.winners"),
    losers: t("assist.reply.losers"),
    upFollowups: list("up_followups"),
    downFollowups: list("down_followups"),
    notes: { index: t("assist.reply.note_index"), bond: t("assist.reply.note_bond"), certificate: t("assist.reply.note_certificate") },
    instrumentFollowups: list("instrument_followups"),
    compareFollowups: list("compare_followups"),
  });

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

    // "How do I buy shares?" is about buying, not about what a share is.
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

// Classic script. Fake answer engine of the Bet assist AI (AI_007): keyword
// matching over window.SEED_ASSIST plus live mock market data. There is no
// model behind it.
//
// window.assistReply.buildReply(question) -> {
//   text,       // markup string (**bold**, "- " bullets, blank line = paragraph)
//   blocks,     // [{ type: 'instruments', tickers } | { type: 'brokers' } | { type: 'education', ids }]
//   followups,  // suggested next questions
// }

window.assistReply = (function () {
  const seed = window.SEED_ASSIST;
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
    const direction = change > 0 ? "emelkedett" : change < 0 ? "csökkent" : "nem változott";
    const lines = [
      `**${instrument.name}** (${instrument.ticker}) árfolyama jelenleg **${price}**. Az előző záráshoz képest ${direction}: **${money.formatPercent(change)}**.`,
      `- **Napi sáv:** ${low} – ${high}`,
    ];
    if (instrument.turnover > 0) lines.push(`- **Forgalom:** ${money.formatCompactMoney(instrument.turnover)}`);
    lines.push(instrument.delayed ? "- **Adat:** késleltetett árfolyam" : "- **Adat:** valós idejű árfolyam");
    return lines.join("\n");
  }

  function compareInstruments(list) {
    const money = window.moneyModule;
    const rows = list.map((instrument) => {
      const change = window.storage.getChangePercent(instrument);
      return `- **${instrument.ticker}:** ${money.formatPrice(instrument.price, instrument.unit)} (${money.formatPercent(change)}), forgalom ${money.formatCompactMoney(instrument.turnover)}`;
    });
    return "Itt a két termék legfontosabb adatai egymás mellett:\n\n" + rows.join("\n") + "\n\nA számok önmagukban nem döntik el, melyik „jobb”: más a kockázatuk, az iparáguk és a hozamprofiljuk.";
  }

  // --- Dynamic topics ----------------------------------------------------------

  function marketHoursReply() {
    const hours = window.storage.getMarketHours();
    const status = window.marketStatusModule ? window.marketStatusModule.getStatus() : null;
    const now = status ? (status.open ? "A tőzsde **jelenleg nyitva van**." : "A tőzsde **jelenleg zárva van**.") : "";
    return {
      text: `${now}\n\nA folyamatos kereskedés **hétfőtől péntekig ${hours.open}–${hours.close}** között zajlik (budapesti idő szerint). Hétvégén és ünnepnapokon a piac zárva tart.\n\nA főoldalon a piaci státusz mindig mutatja a hátralévő időt vagy a következő nyitást.`,
      blocks: [],
      followups: ["Melyek ma a legnagyobb nyertesek?", "Mi az a részvény?", "Hogyan vásárolhatok részvényt?"],
    };
  }

  function topMoversReply(direction) {
    const sorted = window.storage
      .getInstruments("share")
      .sort((a, b) => window.storage.getChangePercent(b) - window.storage.getChangePercent(a));
    const picked = (direction === "down" ? sorted.reverse() : sorted).slice(0, MAX_CARDS);
    const label = direction === "down" ? "vesztesei" : "nyertesei";
    return {
      text: `A mai nap **legnagyobb részvény-${label}** a késleltetett árfolyamok alapján:\n\nA lista a Főoldalon is megtalálható, ott forgalom szerint is rendezheted. Az árfolyamok késleltetettek, a változás az előző záráshoz viszonyított.`,
      blocks: [{ type: "instruments", tickers: picked.map((instrument) => instrument.ticker) }],
      followups: direction === "down" ? ["Melyek ma a legnagyobb nyertesek?"] : ["Melyek ma a legnagyobb vesztesek?", "Mi az a P/E mutató?"],
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
    const categoryNote = {
      index: "\n\nAz index egy kosár teljesítményét összegzi, ezért közvetlenül nem vásárolható, de ETF-en keresztül követhető.",
      bond: "\n\nA kötvény árfolyama a névérték százalékában szerepel.",
      certificate: "\n\nA certifikátok tőkeáttételes termékek lehetnek, a veszteség gyorsan nőhet.",
    }[main.category] || "";
    return {
      text: describeInstrument(main) + categoryNote,
      blocks: [{ type: "instruments", tickers: instruments.slice(0, MAX_CARDS).map((i) => i.ticker) }],
      followups: ["Hogyan vásárolhatok részvényt?", "Mi az a P/E mutató?", "Mi az az osztalék?"],
    };
  }

  function buildReply(question) {
    const normalized = normalize(question);
    const instruments = findInstruments(normalized);

    if (matchesAny(normalized, seed.adviceKeys)) {
      return { text: seed.adviceText, blocks: [], followups: seed.adviceFollowups };
    }
    if (matchesAny(normalized, ["nyitva", "nyitvatartas", "mikor nyit", "mikor zar", "zarva", "kereskedesi ido", "nyitas"])) {
      return marketHoursReply();
    }
    if (matchesAny(normalized, ["nyertes", "legjobban emelked", "legtobbet emelked", "emelked"])) {
      return topMoversReply("up");
    }
    if (matchesAny(normalized, ["vesztes", "legjobban esett", "legtobbet esett", "esett", "csokken"])) {
      return topMoversReply("down");
    }
    if (instruments.length >= 2) {
      return {
        text: compareInstruments(instruments.slice(0, MAX_CARDS)),
        blocks: [{ type: "instruments", tickers: instruments.slice(0, MAX_CARDS).map((i) => i.ticker) }],
        followups: ["Mi az a P/E mutató?", "Mi az az osztalék?", "Mi a diverzifikáció?"],
      };
    }

    // "Hogyan vásárolhatok részvényt?" is about buying, not about what a share is.
    const ordered = seed.topics.filter((c) => c.id === "howto-buy").concat(seed.topics.filter((c) => c.id !== "howto-buy"));
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

  return { buildReply, searchInstruments, normalize };
})();

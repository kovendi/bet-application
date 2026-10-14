// Classic script (not a module). Deterministic mock price history for the
// chart: a seeded random walk that is generated backwards so it always ends
// exactly at the instrument's current price. Same ticker + range always gives
// the same curve, so screens look stable between reloads.
//
// window.generatePriceSeries(instrument, range) -> [{ t, o, h, l, c }]
//   range: 1d | 1w | 1m | 3m | 1y | 5y | max
//   t: timestamp (ms). 1d is intraday (5-minute candles over the 9:00–17:00
//   session), the rest are daily / weekly / monthly candles.

window.generatePriceSeries = (function () {
  // range -> [candle count, step in ms, daily volatility factor]
  const RANGES = {
    "1d": [48, 10 * 60 * 1000, 0.0012],
    "1w": [35, 60 * 60 * 1000, 0.003],
    "1m": [22, 24 * 3600 * 1000, 0.009],
    "3m": [63, 24 * 3600 * 1000, 0.009],
    "1y": [52, 7 * 24 * 3600 * 1000, 0.02],
    "5y": [60, 30 * 24 * 3600 * 1000, 0.045],
    max: [120, 30 * 24 * 3600 * 1000, 0.045],
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // mulberry32
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  return function generatePriceSeries(instrument, range) {
    const cfg = RANGES[range] || RANGES["1m"];
    const count = cfg[0];
    const step = cfg[1];
    const vol = cfg[2] * (instrument.category === "index" ? 0.6 : 1);
    const rand = rng(hash(instrument.ticker + range));
    const round = instrument.unit === "HUF" ? Math.round : function (v) { return Math.round(v * 100) / 100; };

    // 1d spans today's 9:00 session; the other ranges end now.
    const now = new Date();
    let last = now.getTime();
    if (range === "1d") {
      const open = new Date(now);
      open.setHours(9, 0, 0, 0);
      last = open.getTime() + (count - 1) * step;
    }
    const first = last - (count - 1) * step;

    const candles = [];
    let close = instrument.price;
    for (let i = count - 1; i >= 0; i--) {
      const open = close / (1 + (rand() - 0.5) * 2 * vol);
      const wick = close * vol * 0.5;
      candles.unshift({
        t: first + i * step,
        o: round(open),
        h: round(Math.max(open, close) + rand() * wick),
        l: round(Math.min(open, close) - rand() * wick),
        c: round(close),
      });
      close = open;
    }
    return candles;
  };
})();

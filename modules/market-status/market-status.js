// Classic script (not a module) — pages are opened via file://, which blocks
// ES module imports, so this attaches its API to `window` instead.
//
// Market status strip (PS_001–PS_005): open/closed dot + label, time left until
// the close when open, the next opening when closed. Uses Budapest time and the
// trading hours from window.storage.getMarketHours(); refreshes every minute.
//
// Requires modules/i18n/i18n.js and modules/storage/storage.js to be loaded first.
//
// Usage in a page:
//   <script src="../../modules/market-status/market-status.js"></script>
//   <script>
//     container.appendChild(window.marketStatusModule.renderMarketStatus());
//     // tests/demos can pass a fixed moment: renderMarketStatus({ now: new Date(...) })
//   </script>

window.marketStatusModule = (function () {
  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  // Budapest wall-clock parts for a given instant.
  function budapestParts(date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Budapest",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type).value;
    return { day: WEEKDAYS[get("weekday")], minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  }

  function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }

  // { open: bool, minutesLeft (when open), nextOpen: { dayOffset, time } (when closed) }
  function getStatus(date) {
    const hours = window.storage.getMarketHours();
    const openAt = toMinutes(hours.open);
    const closeAt = toMinutes(hours.close);
    const { day, minutes } = budapestParts(date);
    const tradingDay = hours.days.includes(day);

    if (tradingDay && minutes >= openAt && minutes < closeAt) {
      return { open: true, minutesLeft: closeAt - minutes };
    }
    // Next opening: later today if before the open, otherwise the next trading day.
    let dayOffset = tradingDay && minutes < openAt ? 0 : 1;
    while (!hours.days.includes((day + dayOffset) % 7)) dayOffset += 1;
    return { open: false, nextOpen: { dayOffset, day: (day + dayOffset) % 7, time: hours.open } };
  }

  function formatLeft(minutes) {
    const t = window.i18n.t;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} ${t("market_status.hour_short")} ${m} ${t("market_status.minute_short")}` : `${m} ${t("market_status.minute_short")}`;
  }

  function dayLabel(next) {
    const t = window.i18n.t;
    if (next.dayOffset === 0) return t("date.today");
    if (next.dayOffset === 1) return t("date.tomorrow");
    return t("date.weekday_" + next.day);
  }

  function renderMarketStatus({ now } = {}) {
    const t = window.i18n.t;
    const el = document.createElement("div");
    el.className = "market-status";
    el.setAttribute("role", "status");

    const dot = document.createElement("span");
    dot.className = "market-status-dot";
    const label = document.createElement("span");
    label.className = "market-status-label";
    const detail = document.createElement("span");
    detail.className = "market-status-detail";
    el.append(dot, label, detail);

    function update() {
      const status = getStatus(now || new Date());
      el.classList.toggle("market-status--open", status.open);
      label.textContent = t(status.open ? "market_status.open" : "market_status.closed");
      detail.textContent = status.open
        ? t("market_status.closes_in").replace("{time}", formatLeft(status.minutesLeft))
        : t("market_status.opens_at")
            .replace("{day}", dayLabel(status.nextOpen))
            .replace("{time}", status.nextOpen.time);
    }

    update();
    if (!now) setInterval(update, 60000);
    return el;
  }

  return { renderMarketStatus, getStatus };
})();

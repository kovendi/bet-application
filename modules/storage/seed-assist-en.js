// Classic script (not a module). English version of seed-assist.js (the Bet
// assist mock knowledge base). Text here is mock content, not UI chrome, so it
// is intentionally not routed through t(). pages/assist/assist-reply.js merges
// it over window.SEED_ASSIST when the app language is "en": topic texts and
// follow-ups are replaced, and the English keys are added to the Hungarian
// ones, so a question in either language is understood.
//
// keys: accent-free lowercase word starts, same rules as in seed-assist.js.
// priority: topic ids checked before all others (a "difference" question is
// about the comparison, not about what a share is).

window.SEED_ASSIST_EN = {
  suggestions: [
    "What is a share and how does it work?",
    "What is the difference between a share and an ETF?",
    "When is the stock exchange open?",
    "What are today's biggest gainers?",
  ],

  priority: ["howto-buy", "stock-vs-etf"],

  topics: {
    stock: {
      keys: ["share", "stock", "equit", "ownership"],
      text: "A **share** is a small piece of ownership of a company. Whoever buys a share becomes a part-owner of the company and can take part in its profit (dividend) and in the change of its price.\n\n- **Opportunity:** price gains and dividends over the longer term\n- **Risk:** the price fluctuates from day to day, and part of the invested amount can be lost\n\nThe best-known shares on the Budapest exchange are, for example, OTP, MOL and Richter.",
      followups: ["What is a dividend?", "What is the P/E ratio?", "How do I buy shares?"],
    },
    etf: {
      keys: ["etf", "exchange traded fund", "index fund", "index tracker"],
      text: "An **ETF** (exchange-traded fund) is an investment fund whose units can be bought and sold on the exchange like a share.\n\n- It mostly **tracks an index**, so a single product lets you invest in many companies\n- Risk is spread but **does not disappear**: if the index falls, so does the ETF\n- Its management fee is usually lower than that of actively managed funds\n\nUnlike a share, you follow the price of a whole basket instead of one company.",
      followups: ["What is an index?", "What is the difference between a share and an ETF?", "What is diversification?"],
    },
    "stock-vs-etf": {
      keys: ["difference", "versus", " vs ", "compared to", "share or etf"],
      text: "**Share or ETF?** The main difference is diversification:\n\n- **Share:** a single company. Bigger swings, bigger company-specific risk\n- **ETF:** a basket of many companies. Usually more balanced, but not risk-free\n- **Cost:** an ETF has an annual management cost, a share does not\n- **Dividend:** both can pay one; for an ETF it comes from the dividends of the companies in the basket\n\nThere is no “better” option, it depends on your goal and risk tolerance.",
      followups: ["What is diversification?", "What is an ETF?", "What is a dividend?"],
    },
    bond: {
      keys: ["bond", "government securit", "fixed income", "debt securit"],
      text: "A **bond** is a security representing a debt: you lend money to the issuer (the state or a company), who pays interest and repays the nominal value at maturity.\n\n- **Interest (coupon):** regular payment\n- **Maturity:** when the nominal value is repaid\n- **Price:** shown as a % of the nominal value, which is why you see 98.45%\n\nA bond's price also moves before maturity, mainly depending on changes in interest rates.",
      followups: ["What is the price of a government bond?", "What is a share?", "What is the relationship between risk and return?"],
    },
    index: {
      keys: ["index", "indices", "indexes"],
      text: "An **index** shows the combined performance of a selected basket of securities in a single number, so you can quickly see which way the market is moving.\n\n- **BUX:** the index of the largest, most actively traded Hungarian shares\n- **BUMIX:** the index of smaller and mid-sized companies\n- **CETOP NTR:** leading Central European companies, calculated with dividends included\n\nIndices are the only products for which you see **real-time** data in the app.",
      followups: ["What is an ETF?", "What is the BUX?", "Where can I follow an index?"],
    },
    dividend: {
      keys: ["dividend"],
      text: "A **dividend** is the part of a company's profit that is distributed among its shareholders, usually yearly or half-yearly.\n\n- **Dividend yield:** the dividend per share as a percentage of the price\n- **Due date:** the company's general meeting decides and announces it in a disclosure\n- **Not guaranteed:** the company can decide not to pay\n\nYou can follow issuer disclosures on the Disclosures tab of the product pages.",
      followups: ["What is the P/E ratio?", "Where can I see disclosures?", "What is a share?"],
    },
    pe: {
      keys: ["p/e", "pe ratio", "price earnings", "price to earnings", "p e"],
      text: "The **P/E ratio** (price-to-earnings ratio) shows how many times its annual earnings per share the market pays for a company.\n\n- **Low P/E:** may look cheap, but the market may also be pricing in weaker prospects\n- **High P/E:** may signal higher growth expectations\n\nIt is never enough on its own: compare it with companies in the same industry and with the company's own history.",
      followups: ["What is a dividend?", "What is the ROE?", "What is a share?"],
    },
    diversification: {
      keys: ["diversif", "risk", "volatil"],
      text: "**Diversification** means not putting all your eggs in one basket: you invest in several companies, industries and asset classes, so one piece of bad news spoils the whole portfolio less.\n\n- **Higher return, higher risk:** the two usually go together\n- **Time:** short-term fluctuation often evens out over the longer term, but this is not guaranteed\n- **Your own tolerance:** only risk what you can afford to lose\n\nThis is general knowledge, not personal advice.",
      followups: ["What is an ETF?", "What is the difference between a share and an ETF?", "What is a bond?"],
    },
    certificate: {
      keys: ["certificate", "turbo", "factor", "leverag"],
      text: "A **certificate** is a derivative product issued by a bank that follows the price of an underlying asset (e.g. an index or a share).\n\n- **Turbo / factor:** uses leverage, so both gains and losses are magnified\n- **Bonus certificate:** promises a minimum payout under certain conditions\n- **Issuer risk:** if the issuer becomes insolvent, the investment can be lost\n\nLeveraged products are complex and need special care from beginners.",
      followups: ["What is the risk?", "What is an ETF?", "What is a future?"],
    },
    futures: {
      keys: ["future", "option", "derivativ", "forward"],
      text: "A **future** is an agreement to buy or sell an asset at a price fixed in advance at a future date.\n\n- **Margin:** you do not have to deposit the full value, which creates leverage\n- **Daily settlement:** gains and losses are settled continuously\n- **Risk:** the loss can exceed the margin deposited\n\nFutures products are advanced level.",
      followups: ["What is a certificate?", "What is diversification?", "What is the BUX?"],
    },
    "howto-buy": {
      keys: ["how do i buy", "how to buy", "how can i buy", "how can i invest", "how do i invest", "buy shares", "buy stock", "open an account", "brokerage account", "broker", "trading account"],
      text: "You **cannot trade directly in the app**: the Buy / Sell button on the product page redirects you to the broker you choose.\n\nHere is how to start:\n\n- Choose an exchange member (broker) and open a securities account with them\n- You can place orders from that account\n- In the app you can jump from a product's page to the broker's site\n\nThe firms below are among the BSE members available:",
      followups: ["What is a share?", "What is an ETF?", "What is the risk?"],
    },
    education: {
      keys: ["learn", "educat", "beginner", "basics", "tutorial", "teach"],
      text: "Happy to help with the basics! The knowledge base has beginner-friendly material, and these are good places to start:",
      followups: ["What is a share?", "What is an ETF?", "What is diversification?"],
    },
    disclosures: {
      keys: ["disclosure", "announcement", "report", "issuer"],
      text: "**Disclosures** are the issuers' official announcements (e.g. flash reports, dividend payments, general meetings). The home screen shows the latest 5, and on the product page they can be filtered by issuer and category.\n\nYou can also set up notifications for your favorites, so you do not miss an announcement.",
      followups: ["How do I set up a notification?", "What is a dividend?", "What is a share?"],
    },
    alerts: {
      keys: ["alert", "notif", "favorite", "favourite", "watchlist"],
      text: "You can set a **price alert** from the product page: you enter the price level, and the app tells you when it is crossed. You can have up to **10 active alerts**, one per product, and an alert disappears after it is triggered.\n\nFor favorites you can also ask for notifications about the issuer's disclosures. Both features require registration.",
      followups: ["How does something become a favorite?", "What is a disclosure?", "When is the stock exchange open?"],
    },
  },

  adviceKeys: ["should i", "recommend", "advice", "advise", "worth buying", "worth it", "good investment", "what to invest", "best stock", "best share", "which stock", "which share", "tip"],
  adviceText: "I **cannot give investment advice**, and I cannot recommend buying or selling a specific security. I can, however, help you understand the basis of your decision better:\n\n- I show the data and movement of a product\n- I explain concepts (e.g. P/E, dividend, ETF)\n- I compare the key numbers of two products\n\nBefore deciding, it is also worth talking to a licensed investment adviser.",
  adviceFollowups: ["What is diversification?", "What is the P/E ratio?", "What is the difference between a share and an ETF?"],

  greetingKeys: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon"],
  thanksKeys: ["thanks", "thank you", "thx", "great", "awesome", "perfect"],

  greetingText: "Hi! I am **Bet assist**, the BSE's assistant. I can help with stock market concepts, product data and using the app.\n\nHow can I help?",
  thanksText: "You are welcome! If anything else comes up, feel free to ask.",
  fallbackText: "I cannot find a reliable answer to this question in my knowledge base right now. You can try rephrasing it, or ask about a specific product (e.g. **OTP**) or concept (e.g. **ETF**).",
  fallbackFollowups: ["What is a share?", "When is the stock exchange open?", "What are today's biggest gainers?"],

  // Keywords of the dynamic answers in assist-reply.js.
  marketHoursKeys: ["stock exchange open", "exchange open", "market open", "opening hours", "trading hours", "trading time", "market hours", "when does the stock exchange", "when does the exchange", "when does the market", "market closed", "exchange closed", "when is the market"],
  gainersKeys: ["winner", "gainer", "gained", "rising", "risen", "went up", "best performing"],
  losersKeys: ["loser", "biggest loss", "falling", "fell", "dropped", "went down", "worst performing"],
};

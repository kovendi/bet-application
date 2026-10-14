// Classic script (not a module). Mock knowledge base of the Bet assist AI
// (AI_007: the answers are fake — no model, no backend). Text here is mock
// content, not UI chrome, so it is intentionally not routed through t().
// Read it through pages/assist/assist-reply.js, never from another page.
//
// Text markup understood by the chat renderer: **bold**, "- " bullet lines,
// blank line = new paragraph.
//
// Topic: { id, keys, text, tickers?, edu?, followups }
//   keys      accent-free lowercase word starts that trigger the topic
//   tickers   instruments shown as price rows under the answer
//   edu       education item ids (SEED_CONTENT.education) offered as reading

window.SEED_ASSIST = {
  suggestions: [
    "Mi az a részvény, és hogyan működik?",
    "Mi a különbség a részvény és az ETF között?",
    "Mikor tart nyitva a tőzsde?",
    "Melyek ma a legnagyobb nyertesek?",
  ],

  topics: [
    {
      id: "stock",
      keys: ["reszveny", "tulajdonresz"],
      text: "A **részvény** a vállalat tulajdonának egy kis darabja. Aki részvényt vásárol, résztulajdonosa lesz a cégnek, és részesedhet a nyereségből (osztalék), illetve az árfolyam változásából.\n\n- **Lehetőség:** hosszabb távon árfolyamnyereség és osztalék\n- **Kockázat:** az árfolyam napról napra ingadozik, a befektetett összeg egy része elveszhet\n\nA budapesti tőzsde legismertebb részvényei például az OTP, a MOL és a Richter.",
      tickers: ["OTP", "MOL", "RICHTER"],
      edu: ["e1"],
      followups: ["Mi az az osztalék?", "Mi az a P/E mutató?", "Hogyan vásárolhatok részvényt?"],
    },
    {
      id: "etf",
      keys: ["etf", "tozsdei alap", "indexkoveto"],
      text: "Az **ETF** (tőzsdén kereskedett alap) egy olyan befektetési alap, amelynek jegyeit a tőzsdén lehet venni és eladni, mint egy részvényt.\n\n- Többnyire egy **indexet követ**, így egyetlen termékkel sok cégbe fektethetsz\n- A kockázat szétoszlik, de **nem szűnik meg**: ha az index esik, az ETF is\n- Kezelési díja általában alacsonyabb, mint az aktívan kezelt alapoké\n\nA részvénnyel szemben nem egy cég, hanem egy egész kosár árfolyamát követed.",
      tickers: ["BUXETF", "BLUEETF"],
      edu: ["e2"],
      followups: ["Mi az az index?", "Mi a különbség a részvény és az ETF között?", "Mi a diverzifikáció?"],
    },
    {
      id: "stock-vs-etf",
      keys: ["kulonbseg", "versus", "vagy etf"],
      text: "**Részvény vagy ETF?** A fő különbség a szóródás:\n\n- **Részvény:** egyetlen vállalat. Nagyobb kilengések, nagyobb cégspecifikus kockázat\n- **ETF:** sok vállalat kosara. Általában kiegyensúlyozottabb, de nem kockázatmentes\n- **Költség:** az ETF-nek éves kezelési költsége van, a részvénynek nincs\n- **Osztalék:** mindkettő fizethet, az ETF-nél a kosár cégeinek osztalékából jön\n\nNincs „jobb” megoldás, a célodtól és a kockázattűrésedtől függ.",
      edu: ["e2", "e7"],
      followups: ["Mi az a diverzifikáció?", "Mi az az ETF?", "Mi az az osztalék?"],
    },
    {
      id: "bond",
      keys: ["kotveny", "allampapir", "hitelviszony"],
      text: "A **kötvény** egy hitelviszonyt megtestesítő értékpapír: te kölcsönt adsz a kibocsátónak (az államnak vagy egy vállalatnak), ő pedig kamatot fizet, és a lejáratkor visszafizeti a névértéket.\n\n- **Kamat (kupon):** rendszeres kifizetés\n- **Lejárat:** amikor a névérték visszajár\n- **Árfolyam:** a névérték %-ában mutatjuk, ezért látsz 98,45%-ot\n\nA kötvény árfolyama a lejárat előtt is mozog, főleg a kamatok változásától függően.",
      tickers: ["HGB30A", "OTPJ28"],
      edu: ["e10"],
      followups: ["Mi az az államkötvény árfolyama?", "Mi az a részvény?", "Mi a kockázat és hozam összefüggése?"],
    },
    {
      id: "index",
      keys: ["index", "indexek"],
      text: "Az **index** egy kijelölt papírkosár együttes teljesítményét mutatja egyetlen számban, így gyorsan látható, merre mozog a piac.\n\n- **BUX:** a legnagyobb, legaktívabban forgó magyar részvények indexe\n- **BUMIX:** a kisebb, közepes méretű cégek indexe\n- **CETOP NTR:** közép-európai vezető cégek, osztalékkal együtt számolva\n\nAz indexek az egyetlen termékek, amelyeknél **valós idejű** adatot látsz az appban.",
      tickers: ["BUX", "BUMIX", "CETOP NTR"],
      edu: ["e1"],
      followups: ["Mi az az ETF?", "Mi a BUX?", "Hol lehet indexet követni?"],
    },
    {
      id: "dividend",
      keys: ["osztalek"],
      text: "Az **osztalék** a vállalat nyereségének az a része, amelyet a részvényesei között szétosztanak, általában évente vagy félévente.\n\n- **Osztalékhozam:** az egy részvényre jutó osztalék az árfolyam százalékában\n- **Esedékesség:** a vállalat közgyűlése dönt, és közzétételben jelenti be\n- **Nem garantált:** a cég dönthet úgy, hogy nem fizet\n\nA kibocsátói közzétételeket az adatlapok Közzétételek fülén követheted.",
      tickers: ["OTP", "MOL"],
      edu: ["e5"],
      followups: ["Mi az a P/E mutató?", "Hol látom a közzétételeket?", "Mi az a részvény?"],
    },
    {
      id: "pe",
      keys: ["p/e", "pe mutato", "ar/nyereseg", "arfolyam nyereseg", "ar nyereseg", "p e"],
      text: "A **P/E mutató** (ár/nyereség arány) azt mutatja, hányszorosát fizeti a piac a cég egy részvényre jutó éves nyereségének.\n\n- **Alacsony P/E:** olcsónak tűnhet, de a piac gyengébb kilátásokat is beárazhat\n- **Magas P/E:** nagyobb növekedési várakozást jelezhet\n\nÖnmagában sosem elég: érdemes ugyanabban az iparágban lévő cégekkel és a saját múltjával összevetni.",
      edu: ["e4"],
      followups: ["Mi az az osztalék?", "Mi a ROE?", "Mi az a részvény?"],
    },
    {
      id: "diversification",
      keys: ["diverzifik", "kockazat", "szoras"],
      text: "A **diverzifikáció** azt jelenti, hogy nem teszel mindent egy lapra: több cégbe, iparágba, eszközosztályba fektetsz, így egy rossz hír kevésbé rontja el az egész portfóliót.\n\n- **Magasabb hozam, magasabb kockázat:** a kettő általában együtt jár\n- **Idő:** a rövid távú ingadozás hosszabb távon gyakran kisimul, de ez nem garantált\n- **Saját tűréshatár:** csak annyit kockáztass, amennyit el tudsz veszíteni\n\nEz általános ismeret, nem személyes tanács.",
      edu: ["e7", "e9"],
      followups: ["Mi az az ETF?", "Mi a különbség a részvény és az ETF között?", "Mi a kötvény?"],
    },
    {
      id: "certificate",
      keys: ["certifikat", "turbo", "faktor", "tokeattet"],
      text: "A **certifikát** egy bank által kibocsátott származtatott termék, amely egy alapeszköz (pl. index vagy részvény) árfolyamát követi.\n\n- **Turbo / faktor:** tőkeáttételt használ, így a nyereség és a veszteség is felnagyítódik\n- **Bónusz certifikát:** bizonyos feltételek mellett minimális kifizetést ígér\n- **Kibocsátói kockázat:** ha a kibocsátó fizetésképtelenné válik, a befektetés elveszhet\n\nA tőkeáttételes termékek összetettek, kezdőknek különös odafigyelést igényelnek.",
      tickers: ["ERBUXTL", "RBOTP27"],
      edu: ["e8"],
      followups: ["Mi a kockázat?", "Mi az az ETF?", "Mi a határidős ügylet?"],
    },
    {
      id: "futures",
      keys: ["hatarido", "opcio", "derivativ"],
      text: "A **határidős ügylet** megállapodás arról, hogy egy eszközt egy előre rögzített áron, egy jövőbeli időpontban adnak-vesznek.\n\n- **Fedezet:** nem a teljes értéket kell letenni, ezért tőkeáttétel keletkezik\n- **Napi elszámolás:** a nyereség és a veszteség folyamatosan elszámolódik\n- **Kockázat:** a veszteség meghaladhatja a letett fedezetet\n\nA határidős termékek haladó szintűek.",
      tickers: ["BUXZ26", "OTPZ26"],
      edu: ["e8"],
      followups: ["Mi a certifikát?", "Mi az a diverzifikáció?", "Mi a BUX?"],
    },
    {
      id: "howto-buy",
      keys: ["hogyan vas", "hogyan vegy", "vasarolhat", "vehetek", "megvenni", "megvasarol", "vegyem meg", "bróker", "broker", "szamlat nyit", "szamlanyit", "kereskedocég", "kereskedoceg"],
      text: "Az appban **nem lehet közvetlenül kereskedni**: a Vétel / Eladás gomb a termékadatlapon a kiválasztott brókercéghez irányít át.\n\nÍgy indulhatsz:\n\n- Válassz egy tőzsdei tagot (bróker), és nyiss nála értékpapírszámlát\n- A számláról ott adhatsz megbízást\n- Az appban a termék adatlapjáról a bróker oldalára ugorhatsz\n\nA BÉT tagjai közül a lenti cégek elérhetők:",
      blocks: ["brokers"],
      edu: ["e1"],
      followups: ["Mi az a részvény?", "Mi az az ETF?", "Mi a kockázat?"],
    },
    {
      id: "education",
      keys: ["tanul", "edukacio", "kezdo", "alapok", "oktat", "ismeret"],
      text: "Szívesen segítek az alapokban! A tudástárban kezdőbarát anyagokat találsz, ezekkel érdemes indulni:",
      edu: ["e1", "e2", "e6"],
      followups: ["Mi az a részvény?", "Mi az az ETF?", "Mi az a diverzifikáció?"],
    },
    {
      id: "disclosures",
      keys: ["kozzetetel", "hirdetmeny", "jelentes", "kibocsato"],
      text: "A **közzétételek** a kibocsátók hivatalos bejelentései (pl. gyorsjelentés, osztalékfizetés, közgyűlés). Ezeket a főoldalon a legfrissebb 5 mutatja, a termékadatlapon pedig kibocsátónként, kategória szerint szűrhetők.\n\nA kedvenceidhez beállíthatsz értesítést is, így nem maradsz le egy bejelentésről.",
      edu: ["e1"],
      followups: ["Hogyan állítok be értesítést?", "Mi az az osztalék?", "Mi az a részvény?"],
    },
    {
      id: "alerts",
      keys: ["riaszt", "ertesit", "arfolyamfigyel"],
      text: "**Árfolyamriasztást** a termékadatlapról állíthatsz be: megadod, mely árszint átlépésekor szóljon az app. Legfeljebb **10 aktív riasztásod** lehet, egy termékre egy darab, és a teljesülés után a riasztás eltűnik.\n\nA kedvenceknél a kibocsátói közzétételekről is kérhetsz értesítést. Mindkét funkcióhoz regisztráció kell.",
      followups: ["Hogyan lesz valami kedvenc?", "Mi az a közzététel?", "Mikor tart nyitva a tőzsde?"],
    },
  ],

  // Questions the assistant may not answer as advice (AI_007 mock + compliance).
  adviceKeys: ["vegyek", "vegyem", "eladjak", "eladjam", "erdemes", "ajanl", "tanacs", "befektessek", "jo befektetes", "megeri", "mibe fektes", "tippje", "melyiket"],
  adviceText: "Befektetési tanácsot **nem adhatok**, és konkrét papír vételét vagy eladását sem ajánlhatom. Abban viszont tudok segíteni, hogy jobban megértsd a döntésed alapjait:\n\n- Megmutatom egy termék adatait és mozgását\n- Elmagyarázom a fogalmakat (pl. P/E, osztalék, ETF)\n- Összehasonlítom két termék legfontosabb számait\n\nA döntés előtt érdemes engedéllyel rendelkező befektetési tanácsadóval is egyeztetni.",
  adviceFollowups: ["Mi az a diverzifikáció?", "Mi az a P/E mutató?", "Mi a különbség a részvény és az ETF között?"],

  greetingKeys: ["szia", "hello", "udv", "jo napot", "szervusz", "hali", "jo reggelt", "jo estet"],
  thanksKeys: ["koszi", "koszonom", "thx", "szupi", "remek", "nagyszeru"],

  greetingText: "Szia! Én a **Bet assist** vagyok, a BÉT asszisztense. Tőzsdei fogalmakkal, termékadatokkal és az app használatával tudok segíteni.\n\nMiben segíthetek?",
  thanksText: "Szívesen! Ha bármi más felmerül, kérdezz nyugodtan.",
  fallbackText: "Erre a kérdésre most nem találok megbízható választ a tudásbázisomban. Megpróbálhatod másképp megfogalmazni, vagy kérdezhetsz egy konkrét termékről (pl. **OTP**) vagy fogalomról (pl. **ETF**).",
  fallbackFollowups: ["Mi az a részvény?", "Mikor tart nyitva a tőzsde?", "Melyek ma a legnagyobb nyertesek?"],
};

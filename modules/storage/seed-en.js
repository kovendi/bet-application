// Classic script (not a module). English versions of the Hungarian mock content
// in seed-instruments.js, seed-content.js, seed-education.js, seed-product.js
// and seed-product-types.js. The seeds stay Hungarian (the default language);
// storage.js passes everything it returns through window.SEED_EN.localize(), which
// leaves the data untouched in Hungarian and swaps each known string for its
// English text when the app language is "en". Link this file before storage.js.
//
// Add a new mock string to seed-*.js -> add the same string here as a key.

window.SEED_EN = (function () {
  const DICT = {
    // --- seed-instruments.js -------------------------------------------------
    "MOL Magyar Olaj- és Gázipari Nyrt.": "MOL Hungarian Oil and Gas Nyrt.",
    "Prémium Részvény ETF": "Premium Shares ETF",
    "Magyar Blue Chip ETF": "Hungarian Blue Chip ETF",
    "Magyar Állampapír 2030/A": "Hungarian Government Bond 2030/A",
    "Államkötvény 2035/B": "Government Bond 2035/B",
    "OTP Jelzálogkötvény 2028": "OTP Mortgage Bond 2028",
    "Erste BUX Turbo Long certifikát": "Erste BUX Turbo Long certificate",
    "Raiffeisen OTP Bonus certifikát 2027": "Raiffeisen OTP Bonus certificate 2027",
    "Erste MOL Faktor Short certifikát": "Erste MOL Factor Short certificate",
    "BUX határidős 2026. dec.": "BUX future Dec 2026",
    "OTP határidős 2026. dec.": "OTP future Dec 2026",
    "EUR/HUF határidős 2026. dec.": "EUR/HUF future Dec 2026",
    "BUX vételi opció 112 000 2026. dec.": "BUX call option 112,000 Dec 2026",

    // --- seed-content.js: carousel ---------------------------------------------
    "Új szintek a BUX-on: rekordközelben zárt a hét": "New levels on the BUX: the week closed near a record",
    "Ismerd meg a Részvényfutamot!": "Get to know Részvényfutam!",
    "Közgyűlési szezon: ezekre a naptári eseményekre figyelj": "AGM season: calendar events to watch",
    "Mi az az ETF, és hogyan kereskedhetsz vele?": "What is an ETF and how can you trade it?",
    "Piaci hírek": "Market news",
    "Edukáció": "Education",
    "Naptár": "Calendar",

    // --- seed-content.js: disclosures ------------------------------------------
    "Féléves jelentés": "Half-year report",
    "Osztalékfizetés időpontja": "Dividend payment date",
    "Vezetői tranzakció bejelentése": "Notification of managerial transaction",
    "Harmadik negyedéves gyorsjelentés": "Third-quarter flash report",
    "Akvizíció megkötése": "Acquisition agreement",
    "Szavazati jogok megváltozása": "Change in voting rights",
    "Éves rendes közgyűlés összehívása": "Convening the annual general meeting",
    "Saját részvény vásárlása": "Purchase of treasury shares",
    "Rendszeres": "Regular",
    "Rendkívüli": "Extraordinary",
    "Tulajdonosi": "Ownership",

    // --- seed-content.js: notifications ------------------------------------------
    "Az árfolyam átlépte a 32 000 Ft szintet felfelé.": "The price crossed the 32,000 Ft level upward.",
    "Új rendkívüli tájékoztatás érkezett.": "A new extraordinary announcement has arrived.",
    "Új rendszeres jelentés érkezett.": "A new regular report has arrived.",

    // --- seed-content.js: education ----------------------------------------------
    "Mi az a tőzsde, és hogyan működik?": "What is a stock exchange and how does it work?",
    "Részvény, kötvény, ETF: a legfontosabb különbségek": "Shares, bonds, ETFs: the key differences",
    "Hogyan olvassunk árfolyamgrafikont?": "How to read a price chart",
    "Mit jelent a P/E mutató?": "What does the P/E ratio mean?",
    "Osztalék és osztalékhozam": "Dividends and dividend yield",
    "Kvíz: tőzsdei alapfogalmak": "Quiz: stock market basics",
    "Kockázat és diverzifikáció": "Risk and diversification",
    "Certifikátok és turbók működése": "How certificates and turbos work",
    "Kvíz: kockázat és hozam": "Quiz: risk and return",
    "Állampapírok a tőzsdén": "Government securities on the exchange",
    "Alapok": "Basics",
    "Elemzés": "Analysis",
    "Befektetés": "Investing",
    "Termékek": "Products",

    // --- seed-education.js: articles -----------------------------------------------
    "A tőzsde olyan szervezett piac, ahol vállalatok részvényei, kötvények és más értékpapírok cserélnek gazdát. Az eladók és a vevők ajánlatai itt találkoznak, így az ár mindig a kereslet és a kínálat egyensúlyából alakul ki.":
      "A stock exchange is an organized market where company shares, bonds and other securities change hands. Offers from sellers and buyers meet here, so the price always comes from the balance of supply and demand.",
    "Miért van rá szükség?": "Why is it needed?",
    "A vállalatok a tőzsdén keresztül juthatnak tőkéhez, a befektetők pedig részesedést szerezhetnek a növekedésükből. A tőzsde átláthatóvá és gyorssá teszi a kereskedést: az árak nyilvánosak, az ügyletek pedig percek alatt lezajlanak.":
      "Companies can raise capital through the exchange, and investors can share in their growth. The exchange makes trading transparent and fast: prices are public and trades take place within minutes.",
    "Hogyan vásárolhatsz?": "How can you buy?",
    "Közvetlenül a tőzsdén csak a tőzsdetagok, azaz a brókercégek kereskednek. Befektetőként egy brókernél nyitsz számlát, és ő adja le a megbízásaidat. Az appban a Vétel / Eladás gomb a bróker listájára visz.":
      "Only exchange members, that is brokerage firms, trade directly on the exchange. As an investor you open an account with a broker, who places your orders. In the app the Buy / Sell button takes you to the list of brokers.",
    "Három eszközosztály, három különböző működés. A videó végigvezet azon, hogy mikor érdemes részvényt, kötvényt vagy ETF-et választani.":
      "Three asset classes, three different ways of working. The video walks you through when to choose a share, a bond or an ETF.",
    "0:00 Részvény: részesedés egy cégből": "0:00 Shares: a stake in a company",
    "2:40 Kötvény: kölcsön fix kamatra": "2:40 Bonds: a loan at a fixed interest rate",
    "5:10 ETF: egy kosárnyi értékpapír egyben": "5:10 ETFs: a basket of securities in one",
    "Az árfolyamgrafikon azt mutatja, hogyan változott egy értékpapír ára az idő múlásával. A vízszintes tengely az idő, a függőleges az ár.":
      "A price chart shows how the price of a security has changed over time. The horizontal axis is time, the vertical axis is price.",
    "Vonal és gyertya": "Line and candlestick",
    "A vonalgrafikon a záróárakat köti össze, ezért átlátható és nyugodt. A gyertyagrafikon minden időszakról négy adatot mutat: nyitó, záró, legmagasabb és legalacsonyabb ár. A zöld gyertya emelkedést, a piros csökkenést jelez.":
      "A line chart connects closing prices, so it is clear and calm. A candlestick chart shows four values for every period: the open, close, high and low price. A green candle means a rise, a red one a fall.",
    "Idősáv": "Time range",
    "Ugyanaz az árfolyam más képet mutat egy napon, egy hónapon vagy öt éven át. Rövid távon a zaj dominál, hosszú távon a trend látszik. Érdemes mindig több idősávot is megnézni.":
      "The same price looks different over a day, a month or five years. In the short term noise dominates, in the long term the trend shows. It is worth checking several time ranges.",
    "A P/E (price to earnings) mutató azt adja meg, hányszoros az árfolyam az egy részvényre jutó éves nyereséghez képest. Ha egy részvény 2 000 Ft-ba kerül, és az egy részvényre jutó nyereség 200 Ft, a P/E értéke 10.":
      "The P/E (price to earnings) ratio tells you how many times the share price is the annual earnings per share. If a share costs 2,000 Ft and earnings per share are 200 Ft, the P/E is 10.",
    "Hogyan értelmezd?": "How to interpret it",
    "Az alacsony P/E olcsóbb értékeltséget jelezhet, a magas P/E azt, hogy a piac gyors növekedést vár. Egyik sem jó vagy rossz önmagában: iparáganként más a megszokott szint.":
      "A low P/E can signal a cheaper valuation, a high P/E that the market expects fast growth. Neither is good or bad on its own: the usual level differs by industry.",
    "Mire figyelj?": "What to watch for",
    "Csak azonos iparágba tartozó cégeket érdemes összehasonlítani, és a mutatót mindig egészítsd ki más adatokkal, például a P/BV-vel, az eladósodottsággal vagy az osztalékhozammal.":
      "Only compare companies in the same industry, and always complement the ratio with other data, such as P/BV, leverage or dividend yield.",
    "Mi az osztalék, mikor fizetik, és hogyan számolható ki az osztalékhozam? Rövid, példákkal szemléltetett magyarázat.":
      "What is a dividend, when is it paid, and how is the dividend yield calculated? A short explanation with examples.",
    "0:00 Mi az osztalék?": "0:00 What is a dividend?",
    "1:30 Osztalékhozam kiszámítása": "1:30 Calculating the dividend yield",
    "3:00 Mit jelent az utolsó osztalékos nap?": "3:00 What is the last day with dividend?",
    "Mi a részvény?": "What is a share?",
    "Kölcsön egy cégnek": "A loan to a company",
    "Tulajdonrész egy cégben": "An ownership stake in a company",
    "Bankbetét": "A bank deposit",
    "A részvényes tulajdonrészt szerez a társaságban, ezért részesedik a nyereségből is.":
      "A shareholder gets an ownership stake in the company and therefore also shares in the profit.",
    "Mi határozza meg a tőzsdei árfolyamot?": "What determines the exchange price?",
    "A bróker döntése": "The broker's decision",
    "A kereslet és a kínálat": "Supply and demand",
    "A cég vezetője": "The company's CEO",
    "Az árat a vevők és az eladók ajánlatai alakítják ki.": "The price is formed by the offers of buyers and sellers.",
    "Mit mutat a BUX?": "What does the BUX show?",
    "Egy cég árfolyamát": "The price of one company",
    "A legnagyobb magyar részvények átlagos mozgását": "The average movement of the largest Hungarian shares",
    "A forint árfolyamát": "The forint exchange rate",
    "A BUX a BÉT legfontosabb részvényindexe, a likvid blue chipek teljesítményét méri.":
      "The BUX is the BSE's main share index; it measures the performance of liquid blue chips.",
    "Ki adhat le megbízást közvetlenül a tőzsdén?": "Who can place orders directly on the exchange?",
    "Bárki, az appból": "Anyone, from the app",
    "A tőzsdetag brókercégek": "Exchange member brokerage firms",
    "Csak a kibocsátók": "Only issuers",
    "Befektetőként brókercégen keresztül kereskedsz, aki továbbítja a megbízásodat.":
      "As an investor you trade through a brokerage firm, which forwards your order.",
    "Minden befektetés kockázattal jár: az árfolyam nemcsak emelkedhet, hanem csökkenhet is. A magasabb hozam lehetősége általában magasabb kockázattal párosul.":
      "Every investment carries risk: the price can rise, but it can also fall. The chance of a higher return usually comes with higher risk.",
    "Mit jelent a diverzifikáció?": "What does diversification mean?",
    "A diverzifikáció azt jelenti, hogy nem teszed fel mindent egy lapra. Ha több cégbe, iparágba és eszközosztályba fekteted a pénzed, egyetlen tétel gyenge teljesítménye kevésbé rontja az egész portfóliót.":
      "Diversification means not putting all your eggs in one basket. If you invest in several companies, industries and asset classes, the weak performance of a single item hurts the whole portfolio less.",
    "Gyakorlati szempontok": "Practical points",
    "Csak olyan összeget fektess be, amire hosszabb távon nincs szükséged. Határozd meg előre a céljaidat és a kockázattűrő képességedet, és időnként vizsgáld felül a portfóliót.":
      "Only invest an amount you won't need in the longer term. Define your goals and risk tolerance in advance, and review your portfolio from time to time.",
    "Hogyan működik a tőkeáttétel, mi a különbség a certifikát és a turbó között, és milyen kockázatokat hordoznak? Haladó szintű áttekintés.":
      "How does leverage work, what is the difference between a certificate and a turbo, and what risks do they carry? An advanced overview.",
    "0:00 Mi az a certifikát?": "0:00 What is a certificate?",
    "3:45 Turbók és tőkeáttétel": "3:45 Turbos and leverage",
    "8:20 Kockázatok és költségek": "8:20 Risks and costs",
    "Egyetlen jó részvény vásárlása": "Buying a single good share",
    "A befektetés szétosztása több eszköz között": "Spreading the investment across several assets",
    "Csak kötvények vásárlása": "Buying only bonds",
    "A szétosztás csökkenti az egyes tételekhez kötődő kockázatot.": "Spreading reduces the risk tied to individual items.",
    "Mi igaz általában a hozam és a kockázat kapcsolatára?": "What is generally true about the relationship between return and risk?",
    "A magasabb hozam magasabb kockázattal jár": "A higher return comes with higher risk",
    "A kockázat és a hozam független": "Risk and return are independent",
    "A kockázat mindig nulla": "Risk is always zero",
    "Magasabb várható hozamért a piac magasabb kockázatot áraz be.": "For a higher expected return the market prices in higher risk.",
    "Mekkora összeget érdemes befektetni?": "How much is it worth investing?",
    "Amit hosszabb távon nem kell elérni": "An amount you won't need to access in the longer term",
    "Minden megtakarítást": "All your savings",
    "Hitelből felvett pénzt": "Money borrowed on credit",
    "Árfolyamesésnél nem szabad kényszereladásra szorulnod.": "In a price drop you must not be forced to sell.",
    "Az állampapírok az állam által kibocsátott kötvények és kincstárjegyek. Aki megveszi őket, hitelt nyújt az államnak, amiért kamatot kap.":
      "Government securities are bonds and treasury bills issued by the state. Whoever buys them lends money to the state and receives interest for it.",
    "Tőzsdei kereskedés": "Trading on the exchange",
    "Egyes állampapírok a tőzsdén is forgalmazhatók, így lejárat előtt is eladhatók. Az eladási ár ekkor eltérhet a névértéktől, mert a piaci kamatok változásával az árfolyam is mozog.":
      "Some government securities can also be traded on the exchange, so they can be sold before maturity. The selling price may then differ from the nominal value, because the price moves as market interest rates change.",
    "Kinek való?": "Who is it for?",
    "Az állampapír általában kisebb kockázatú, mint a részvény, ezért a portfólió stabilabb részeként szokták használni. A hozama azonban ennek megfelelően szerényebb lehet.":
      "A government security usually carries less risk than a share, so it is typically used as the more stable part of a portfolio. Its return can accordingly be more modest.",

    // --- seed-product.js ------------------------------------------------------------
    "Prémium": "Premium",
    "Pénzügyi szolgáltatások": "Financial services",
    "Energia": "Energy",
    "Gyógyszeripar": "Pharmaceuticals",
    "Távközlés": "Telecommunications",
    "Informatika": "IT",
    "Nyomdaipar": "Printing",
    "Holding": "Holding",
    "Építőanyag": "Building materials",
    "Logisztika": "Logistics",
    "Élelmiszer, ital": "Food and beverages",
    "Autókereskedelem": "Car trading",
    "Ingatlan": "Real estate",
    "Autóipar": "Automotive",
    "Egyéb": "Other",
    "Közép- és kelet-európai bankcsoport, amely lakossági, vállalati és vagyonkezelési szolgáltatásokat nyújt. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)":
      "A Central and Eastern European banking group providing retail, corporate and wealth management services. (Sample text, the final company profile is provided by the BSE.)",
    "Integrált olaj- és gázipari vállalatcsoport kutatással, finomítással és kiskereskedelemmel. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)":
      "An integrated oil and gas group with exploration, refining and retail. (Sample text, the final company profile is provided by the BSE.)",
    "Gyógyszeripari vállalatcsoport, amely originális és generikus készítményeket fejleszt és gyárt. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)":
      "A pharmaceutical group that develops and manufactures original and generic products. (Sample text, the final company profile is provided by the BSE.)",
    "Távközlési szolgáltató mobil, vezetékes és televíziós szolgáltatásokkal. (Mintaszöveg, a végleges cégbemutatót a BÉT adja.)":
      "A telecommunications provider with mobile, fixed-line and television services. (Sample text, the final company profile is provided by the BSE.)",
    "Külföldi intézményi befektetők": "Foreign institutional investors",
    "Belföldi intézményi befektetők": "Domestic institutional investors",
    "Magánbefektetők": "Private investors",
    "Egyéb, saját részvény": "Other, treasury shares",
    "Vezérigazgató": "Chief Executive Officer",
    "Pénzügyi igazgató": "Chief Financial Officer",
    "Igazgatóság elnöke": "Chairman of the Board",
    "Felügyelőbizottság elnöke": "Chairman of the Supervisory Board",
    "Részvényelemzés: célár emelése": "Equity research: target price raised",
    "Negyedéves eredmény-előzetes": "Quarterly earnings preview",
    "Kiemelt ajánlás": "Top pick",
    "Minta Elemzőház": "Sample Research House",
    "Példa Befektetési Zrt.": "Example Investment Zrt.",
    "Teszt Elemzési Kft.": "Test Research Kft.",
    // disclosure categories and titles (generated per type)
    "Pénzügyi jelentések": "Financial reports",
    "Rendkívüli tájékoztatások": "Extraordinary announcements",
    "Közgyűlési dokumentumok": "General meeting documents",
    "Tulajdonosi bejelentések": "Ownership notifications",
    "Kamatfizetés": "Interest payment",
    "Tájékoztatók": "Prospectuses",
    "Nettó eszközérték": "Net asset value",
    "Végleges feltételek": "Final terms",
    "Kézikönyv": "Handbook",
    "Összetétel-közlemények": "Composition notices",
    "Negyedéves gyorsjelentés": "Quarterly flash report",
    "Éves beszámoló": "Annual report",
    "Konszolidált eredmény": "Consolidated results",
    "Vezetőségi változás": "Management change",
    "Akvizíció bejelentése": "Acquisition announcement",
    "Hitelminősítés változása": "Change in credit rating",
    "Közgyűlési meghívó": "General meeting invitation",
    "Határozati javaslatok": "Draft resolutions",
    "Közgyűlési jegyzőkönyv": "General meeting minutes",
    "Vezetői tranzakció": "Managerial transaction",
    "Kamatfizetési értesítés": "Interest payment notice",
    "Kamatperiódus kezdete": "Start of interest period",
    "Kibocsátói közlemény": "Issuer notice",
    "Alaptájékoztató": "Base prospectus",
    "Nettó eszközérték közzététele": "Publication of net asset value",
    "Havi portfólió-összetétel": "Monthly portfolio composition",
    "Alapkezelői közlemény": "Fund manager notice",
    "Díjváltozás": "Fee change",
    "Kezelési szabályzat": "Management regulations",
    "Kiemelt befektetői információk": "Key investor information",
    "Kibocsátási feltételek módosítása": "Amendment of issue terms",
    "Korrekciós esemény": "Adjustment event",
    "Kiegészítés az alaptájékoztatóhoz": "Supplement to the base prospectus",
    "BUX index kézikönyv": "BUX index handbook",
    "Félévi összetétel-felülvizsgálat": "Half-year composition review",
    "Súlykorlát közlemény": "Weight cap notice",

    // --- seed-product-types.js ---------------------------------------------------
    "Államkötvény": "Government bond",
    "Jelzáloglevél": "Mortgage bond",
    "10 000 Ft": "10,000 Ft",
    "Éves": "Annual",
    "Fő": "Main",
    "A magyar állam által kibocsátott, forintban denominált államkötvény. (Mintaszöveg, a végleges bemutatót a BÉT adja.)":
      "A forint-denominated government bond issued by the Hungarian state. (Sample text, the final description is provided by the BSE.)",
    "Bank által kibocsátott, ingatlanfedezettel biztosított értékpapír. (Mintaszöveg, a végleges bemutatót a BÉT adja.)":
      "A security issued by a bank and backed by real estate collateral. (Sample text, the final description is provided by the BSE.)",
    "Prémium kategória részvényei": "Premium category shares",
    "Magyar blue chip részvények": "Hungarian blue chip shares",
    "Minta Alapkezelő Zrt.": "Sample Asset Management Zrt.",
    "Fizikai": "Physical",
    "0,35% / év": "0.35% / year",
    "Évente fizet osztalékot": "Pays a dividend annually",
    "Tőzsdén kereskedett alap, amely a követett index teljesítményét másolja. (Mintaszöveg, a végleges alapkezelői bemutatót a BÉT adja.)":
      "An exchange-traded fund that replicates the performance of the tracked index. (Sample text, the final fund manager description is provided by the BSE.)",
    "Turbó Long": "Turbo Long",
    "Bonus": "Bonus",
    "Faktor Short": "Factor Short",
    "BUX index": "BUX index",
    "OTP részvény": "OTP share",
    "MOL részvény": "MOL share",
    "Nyílt végű": "Open-ended",
    "2027. december 17.": "17 December 2027",
    "108 000 pont (kigyulladási szint)": "108,000 points (knock-out level)",
    "26 000 Ft (védelmi szint)": "26,000 Ft (barrier level)",
    "Napi újraállítás": "Daily reset",
    "−5x faktor": "−5x factor",
    "Strukturált termék, amelynek értéke az alaptermék árfolyamától függ. (Mintaszöveg, a végleges kibocsátói bemutatót a BÉT adja.)":
      "A structured product whose value depends on the price of the underlying. (Sample text, the final issuer description is provided by the BSE.)",
    "Nettó teljes hozam index": "Net total return index",
    "Árindex": "Price index",
    "Szabad lebegésű piaci kapitalizációval súlyozott": "Weighted by free-float market capitalization",
    "Forint": "Forint",
    "12–25 részvény": "12–25 shares",
    "Évente kétszer: márciusban és szeptemberben": "Twice a year: in March and September",
    "Folyamatosan, a kereskedési idő alatt": "Continuously, during trading hours",
    "1 000 pont (1991. január 2.)": "1,000 points (2 January 1991)",
    "A tőzsde hivatalos indexe, amelyet a BÉT számol és tesz közzé. (Mintaszöveg, a végleges leírást a BÉT adja.)":
      "The official index of the exchange, calculated and published by the BSE. (Sample text, the final description is provided by the BSE.)",
    "1 pont = 10 Ft": "1 point = 10 Ft",
    "1 pont": "1 point",
    "Készpénzes": "Cash-settled",
    "12 480 szerződés": "12,480 contracts",
    "100 részvény": "100 shares",
    "8 120 szerződés": "8,120 contracts",
    "EUR/HUF árfolyam": "EUR/HUF exchange rate",
    "10 000 EUR": "10,000 EUR",
    "21 300 szerződés": "21,300 contracts",
    "Készpénzes, európai típusú": "Cash-settled, European style",
    "3 960 szerződés": "3,960 contracts",
    "112 000 pont": "112,000 points",
    "Vételi (Call)": "Call",
    "2026. december 18.": "18 December 2026",
  };

  const MONTHS = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const SURNAMES = { Minta: "Sample", Példa: "Example", Teszt: "Test", Demó: "Demo", Mock: "Mock", Próba: "Trial" };

  // Pattern rules for generated strings: [regexp, function(match...) -> English].
  const RULES = [
    // "2030. június 24." -> "24 June 2030"
    [/^(\d{4})\. (\S+) (\d{1,2})\.$/, (m, y, mo, d) => (MONTHS.includes(mo) ? `${d} ${MONTHS_EN[MONTHS.indexOf(mo)]} ${y}` : null)],
    // "3,25% (fix)", "4,10%": decimal comma -> point, "(fix)" -> "(fixed)"
    [/^(\d+),(\d+)%( \(fix\))?$/, (m, a, b, fix) => `${a}.${b}%${fix ? " (fixed)" : ""}`],
    // "<title> 2026" (disclosure titles end with the year)
    [/^(.+) (\d{4})$/, (m, title, year) => (DICT[title] ? `${DICT[title]} ${year}` : null)],
    // "Árfolyamriasztás: OTP"
    [/^Árfolyamriasztás: (.+)$/, (m, name) => `Price alert: ${name}`],
    // "MOL: Osztalékfizetés időpontja" (ticker: translated title, with an optional year)
    [/^([A-Z0-9 ]+): (.+)$/, (m, ticker, title) => `${ticker}: ${translate(title)}`],
    // "<index name> (hivatalos név)"
    [/^(.+) \(hivatalos név\)$/, (m, name) => `${name} (official name)`],
    // Company default profile text
    [
      /^(.+) a Budapesti Értéktőzsde kereskedett társasága\. \(Mintaszöveg, a végleges cégbemutatót a BÉT adja\.\)$/,
      (m, name) => `${name} is a company traded on the Budapest Stock Exchange. (Sample text, the final company profile is provided by the BSE.)`,
    ],
    // Made-up management names: "Minta Anna" -> "Anna Sample"
    [/^(Minta|Példa|Teszt|Demó|Mock|Próba) (\S+)$/, (m, last, first) => `${first} ${SURNAMES[last]}`],
  ];

  const cache = {};

  function translate(text) {
    if (Object.prototype.hasOwnProperty.call(DICT, text)) return DICT[text];
    if (Object.prototype.hasOwnProperty.call(cache, text)) return cache[text];
    let result = text;
    for (const [pattern, build] of RULES) {
      const match = pattern.exec(text);
      const built = match ? build.apply(null, match) : null;
      if (built) {
        result = built;
        break;
      }
    }
    cache[text] = result;
    return result;
  }

  function isEnglish() {
    return !!(window.i18n && window.i18n.getLanguage() === "en");
  }

  function deep(value) {
    if (typeof value === "string") return translate(value);
    if (Array.isArray(value)) return value.map(deep);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => {
        copy[key] = key === "url" ? value[key] : deep(value[key]);
      });
      return copy;
    }
    return value;
  }

  // Returns `value` unchanged in Hungarian, an English copy in English.
  function localize(value) {
    return isEnglish() ? deep(value) : value;
  }

  return { localize, translate };
})();

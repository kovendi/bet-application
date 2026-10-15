// Classic script (not a module). Body content of the education items listed
// in seed-content.js (EF_001–EF_005): article text, video info, quiz
// questions. Illustrative only — read it through window.storage.getEducationItem(),
// never directly. Mock content, so intentionally not routed through t().
//
// blocks: { h: heading } | { p: paragraph }. `futam: true` marks items that
// offer the hand-off to the Részvényfutam app (EF_005).

window.SEED_EDUCATION = {
  e1: {
    futam: true,
    blocks: [
      { p: "A tőzsde olyan szervezett piac, ahol vállalatok részvényei, kötvények és más értékpapírok cserélnek gazdát. Az eladók és a vevők ajánlatai itt találkoznak, így az ár mindig a kereslet és a kínálat egyensúlyából alakul ki." },
      { h: "Miért van rá szükség?" },
      { p: "A vállalatok a tőzsdén keresztül juthatnak tőkéhez, a befektetők pedig részesedést szerezhetnek a növekedésükből. A tőzsde átláthatóvá és gyorssá teszi a kereskedést: az árak nyilvánosak, az ügyletek pedig percek alatt lezajlanak." },
      { h: "Hogyan vásárolhatsz?" },
      { p: "Közvetlenül a tőzsdén csak a tőzsdetagok, azaz a brókercégek kereskednek. Befektetőként egy brókernél nyitsz számlát, és ő adja le a megbízásaidat. Az appban a Vétel / Eladás gomb a bróker listájára visz." },
    ],
  },
  e2: {
    futam: false,
    video: { duration: "8:12", description: "Három eszközosztály, három különböző működés. A videó végigvezet azon, hogy mikor érdemes részvényt, kötvényt vagy ETF-et választani.", chapters: ["0:00 Részvény: részesedés egy cégből", "2:40 Kötvény: kölcsön fix kamatra", "5:10 ETF: egy kosárnyi értékpapír egyben"] },
  },
  e3: {
    futam: false,
    blocks: [
      { p: "Az árfolyamgrafikon azt mutatja, hogyan változott egy értékpapír ára az idő múlásával. A vízszintes tengely az idő, a függőleges az ár." },
      { h: "Vonal és gyertya" },
      { p: "A vonalgrafikon a záróárakat köti össze, ezért átlátható és nyugodt. A gyertyagrafikon minden időszakról négy adatot mutat: nyitó, záró, legmagasabb és legalacsonyabb ár. A zöld gyertya emelkedést, a piros csökkenést jelez." },
      { h: "Idősáv" },
      { p: "Ugyanaz az árfolyam más képet mutat egy napon, egy hónapon vagy öt éven át. Rövid távon a zaj dominál, hosszú távon a trend látszik. Érdemes mindig több idősávot is megnézni." },
    ],
  },
  e4: {
    futam: false,
    blocks: [
      { p: "A P/E (price to earnings) mutató azt adja meg, hányszoros az árfolyam az egy részvényre jutó éves nyereséghez képest. Ha egy részvény 2 000 Ft-ba kerül, és az egy részvényre jutó nyereség 200 Ft, a P/E értéke 10." },
      { h: "Hogyan értelmezd?" },
      { p: "Az alacsony P/E olcsóbb értékeltséget jelezhet, a magas P/E azt, hogy a piac gyors növekedést vár. Egyik sem jó vagy rossz önmagában: iparáganként más a megszokott szint." },
      { h: "Mire figyelj?" },
      { p: "Csak azonos iparágba tartozó cégeket érdemes összehasonlítani, és a mutatót mindig egészítsd ki más adatokkal, például a P/BV-vel, az eladósodottsággal vagy az osztalékhozammal." },
    ],
  },
  e5: {
    futam: false,
    video: { duration: "4:05", description: "Mi az osztalék, mikor fizetik, és hogyan számolható ki az osztalékhozam? Rövid, példákkal szemléltetett magyarázat.", chapters: ["0:00 Mi az osztalék?", "1:30 Osztalékhozam kiszámítása", "3:00 Mit jelent az utolsó osztalékos nap?"] },
  },
  e6: {
    futam: true,
    questions: [
      { q: "Mi a részvény?", options: ["Kölcsön egy cégnek", "Tulajdonrész egy cégben", "Bankbetét"], correct: 1, explain: "A részvényes tulajdonrészt szerez a társaságban, ezért részesedik a nyereségből is." },
      { q: "Mi határozza meg a tőzsdei árfolyamot?", options: ["A bróker döntése", "A kereslet és a kínálat", "A cég vezetője"], correct: 1, explain: "Az árat a vevők és az eladók ajánlatai alakítják ki." },
      { q: "Mit mutat a BUX?", options: ["Egy cég árfolyamát", "A legnagyobb magyar részvények átlagos mozgását", "A forint árfolyamát"], correct: 1, explain: "A BUX a BÉT legfontosabb részvényindexe, a likvid blue chipek teljesítményét méri." },
      { q: "Ki adhat le megbízást közvetlenül a tőzsdén?", options: ["Bárki, az appból", "A tőzsdetag brókercégek", "Csak a kibocsátók"], correct: 1, explain: "Befektetőként brókercégen keresztül kereskedsz, aki továbbítja a megbízásodat." },
    ],
  },
  e7: {
    futam: false,
    blocks: [
      { p: "Minden befektetés kockázattal jár: az árfolyam nemcsak emelkedhet, hanem csökkenhet is. A magasabb hozam lehetősége általában magasabb kockázattal párosul." },
      { h: "Mit jelent a diverzifikáció?" },
      { p: "A diverzifikáció azt jelenti, hogy nem teszed fel mindent egy lapra. Ha több cégbe, iparágba és eszközosztályba fekteted a pénzed, egyetlen tétel gyenge teljesítménye kevésbé rontja az egész portfóliót." },
      { h: "Gyakorlati szempontok" },
      { p: "Csak olyan összeget fektess be, amire hosszabb távon nincs szükséged. Határozd meg előre a céljaidat és a kockázattűrő képességedet, és időnként vizsgáld felül a portfóliót." },
    ],
  },
  e8: {
    futam: false,
    video: { duration: "11:20", description: "Hogyan működik a tőkeáttétel, mi a különbség a certifikát és a turbó között, és milyen kockázatokat hordoznak? Haladó szintű áttekintés.", chapters: ["0:00 Mi az a certifikát?", "3:45 Turbók és tőkeáttétel", "8:20 Kockázatok és költségek"] },
  },
  e9: {
    futam: true,
    questions: [
      { q: "Mit jelent a diverzifikáció?", options: ["Egyetlen jó részvény vásárlása", "A befektetés szétosztása több eszköz között", "Csak kötvények vásárlása"], correct: 1, explain: "A szétosztás csökkenti az egyes tételekhez kötődő kockázatot." },
      { q: "Mi igaz általában a hozam és a kockázat kapcsolatára?", options: ["A magasabb hozam magasabb kockázattal jár", "A kockázat és a hozam független", "A kockázat mindig nulla"], correct: 0, explain: "Magasabb várható hozamért a piac magasabb kockázatot áraz be." },
      { q: "Mekkora összeget érdemes befektetni?", options: ["Amit hosszabb távon nem kell elérni", "Minden megtakarítást", "Hitelből felvett pénzt"], correct: 0, explain: "Árfolyamesésnél nem szabad kényszereladásra szorulnod." },
    ],
  },
  e11: {
    futam: false,
    video: { duration: "6:30", description: "Nyitóaukció, folyamatos kereskedés, záróaukció: így telik egy nap a Budapesti Értéktőzsdén, és ezért változik napközben az árfolyam.", chapters: ["0:00 Nyitóaukció", "2:10 Folyamatos kereskedés", "4:40 Záróaukció és záróár"] },
  },
  e12: {
    futam: true,
    questions: [
      { q: "Mit mutat egy zöld gyertya a gyertyagrafikonon?", options: ["Az időszak végén magasabb volt az ár, mint az elején", "A forgalom nőtt", "Osztalékfizetés történt"], correct: 0, explain: "A zöld gyertya záróára magasabb a nyitóáránál, vagyis az ár emelkedett." },
      { q: "Mit jelent a 10-es P/E érték?", options: ["Az árfolyam az éves nyereség tízszerese", "A részvény 10%-ot hozott", "10 elemző ajánlja"], correct: 0, explain: "A P/E az árfolyam és az egy részvényre jutó nyereség hányadosa." },
      { q: "Milyen cégeket érdemes P/E alapján összevetni?", options: ["Bármelyik kettőt", "Azonos iparágba tartozókat", "Csak külföldieket"], correct: 1, explain: "Iparáganként más a megszokott P/E szint, ezért csak azonos iparágon belül beszédes." },
    ],
  },
  e10: {
    futam: false,
    blocks: [
      { p: "Az állampapírok az állam által kibocsátott kötvények és kincstárjegyek. Aki megveszi őket, hitelt nyújt az államnak, amiért kamatot kap." },
      { h: "Tőzsdei kereskedés" },
      { p: "Egyes állampapírok a tőzsdén is forgalmazhatók, így lejárat előtt is eladhatók. Az eladási ár ekkor eltérhet a névértéktől, mert a piaci kamatok változásával az árfolyam is mozog." },
      { h: "Kinek való?" },
      { p: "Az állampapír általában kisebb kockázatú, mint a részvény, ezért a portfólió stabilabb részeként szokták használni. A hozama azonban ennek megfelelően szerényebb lehet." },
    ],
  },
};

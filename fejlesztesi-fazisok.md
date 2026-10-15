# Fejlesztési fázisok

A BÉT tőzsdei mobilapp mockupjának teljes terve. A követelmények tömör kivonata a `docs/követelmenyek-osszefoglalo.md`, ezt olvassuk először. A források: a tender (`docs/BET_Mobilapp_tender_260929_Final (1).pdf`, a követelménykódok zárójelben szerepelnek) és a BÉT összesített kérdés-válasz anyaga (`docs/BET_Mobilapp_kerdesek_BEKULDENDO_VEGLEGES_BET.docx`, az összes pályázó kérdése és a BÉT válaszai).

A mockup célja a tender 5.1 pontja szerint a főbb felületek látványterve, hogy az ajánlathoz képernyőtervek csatolhatók legyenek. Ezért a fázisok a bemutathatóság szerint követik egymást: az első fázisokból már összeáll egy kattintható demo. Az ajánlat beadási határideje 2026.10.19 23:59.

## Alapelvek (minden fázisra)

- Mobil nézet elsődleges, asztali böngészőben iPhone-keretben jelenik meg (lásd CLAUDE.md). Tablet elrendezés nem kell
- Dark és light mód mindenhol (B_001), alapértelmezetten az eszköz beállítása. Minden oldalt mindkét módban ellenőrzünk
- Arculat: `docs/arculat`, színek és logó szabályai a CLAUDE.md "Brand / Arculat" és "Color Palette" részében
- Nyelv: egyelőre magyar. A magyar/angol váltás (B_002) az 5. fázisban jön, de a szövegek mindig `t()`-n keresztül mennek. A jogi és tartalmi szövegeket a BÉT adja élesítés előtt, a mockupban helykitöltők
- Az indexek kivételével minden árfolyam késleltetett, ezért mindenhol megjelenik a disclaimer (TK_009, TA_001, K_002, ÁF_003, NYÁ_0021, NYT_003, ÁR_001)
- Vendég módban a regisztrált funkciók (kedvencek, riasztás, AI chat, visszajelzés küldése) egy "Regisztráció szükséges" ablakot mutatnak, benne a regisztrációra vivő gombbal (K_000, ÁR_000, AI_001, B_004)
- A mock adatok a `storage` modulban vannak, nincs backend és nincs valódi adat. A kategóriák és szűrők a valóságban adatból jönnek (TK_005), ezért nem égetjük be őket
- Ahol a BÉT még nem válaszolt, a `docs/kerdesek-kliensnek.md` munkahipotézise szerint haladunk (lásd lent: Függő tételek)
- Új, ismétlődő elemnél előbb megnézzük, van-e már modul, és megkérdezzük, legyen-e új (CLAUDE.md)

## 0. fázis: Alapok

Cél: minden későbbi oldal erre épül.

- [x] `global.css` frissítése a CLAUDE.md színtáblázatára (új tokenek: positive, on-accent), kézi dark/light váltás az eszközbeállítás mellett
- [x] Logó és arculati elemek bekötése (BÉT embléma a belépő és kezdő oldalon)
- [x] Mock adatmodul: ~30 instrumentum (részvény, index, ETF, kötvény, certifikát, egyéb), árfolyamok, napi min/max, forgalom, közzétételek, edukációs anyagok, brókerek
- [x] Hiányzó modulok (mindegyik a style-guide-ba is kerül):
  - [x] **chart**: vonal/gyertya grafikon, idősáv-választó (a TradingView Lightweight stílusát utánozza), a CLAUDE.md chart színeivel
  - [x] **price-row**: ticker, cégnév, árfolyam, %-változás (+/− jellel és színnel), csillag a kedvencekhez
  - [x] **chips / segmented**: vízszintes kategóriaválasztó (TK_001), buborékos szűrő (TA_0014)
  - [x] **search-field**: 2 karaktertől listáz (TK_006)
  - [x] **bottom-sheet** és **banner**: bróker lista, szűrők, disclaimer, "regisztráció szükséges" ablak
  - [x] **sparkline**: mini árfolyamgörbe (nice-to-have)

## 1. fázis: Fő demo

Cél: egy bemutatható, végigkattintható mag.

- [x] **iPhone widgetek**: small / medium / large (ÁF_001–ÁF_0021), ticker, árfolyam, változás, mini görbe. Javaslat a darabszámra: small 2, medium 4, large 8 instrumentum
- [x] **Belépés** (FK_001–FK_003)
  - [x] Vendégként tovább gomb (regisztráció nélkül is használható)
  - [x] E-mail + jelszó, Google, Apple, BÉT Portál belépés (a Portál külön belépési lehetőség, nem közös fiók)
  - [x] Hibás belépésnél nem derül ki, melyik adat rossz (FK_0071)
  - [x] Demo belépés: `demo@example.com` / `12345678`
- [x] **Home / nyitófelület** (NYÁ, NYC, NYT, NYK, PS)
  - [x] Piaci státusz: nyitva/zárva, hátralévő idő, zárva esetén a következő nyitás (PS_001–PS_005)
  - [x] Árfolyam-áttekintő: nagy fő kártya + vízszintesen csúsztatható kis kártyák, alapból BUX, CETOP NTR, BUMIX és 4 blue chip, max. 8 elem (NYÁ_001–NYÁ_005)
  - [x] Carousel: cím, kategória, kép, link, automatikus váltás 5 másodpercenként (NYC_001–NYC_003)
  - [x] Toplisták: nyertesek / vesztesek / forgalom chipekkel váltva, listánként max. 5 részvény a fő, Xtend és BÉTa piacról (NYT_001–NYT_007)
  - [x] Legutóbbi 5 kibocsátói közzététel (NYK_001–NYK_003)
- [x] **Piactér / termékkeresés** (TK_001–TK_010)
  - Szabad szöveges kereső, alatta kategóriák: Részvény, Index, ETF, Kötvény, Certifikát, Egyéb
  - Rendezés (ABC, forgalom, napi változás) és szűrők kategóriánként
  - Egyszerre 20 elem, görgetésre tölt tovább
- [x] **Termékadatlap: részvény (példa: OTP)** (TA_000–TA_001)
  - Fejléc, árfolyamgrafikon (gyertya/vonal, idősáv), legjobb vételi/eladási ár, forgalom, day range, teljesítménymutatók
  - Hiányzó adat: halvány `–`, képernyőolvasónak "Nincs adat" (TA_000 javaslat)
  - Vétel / eladás gomb: bróker lista (a bet.hu kereskedőcégek oldala alapján)
  - Fülek: Kereskedés, Pénzügyi adatok, Értékelés, Kibocsátó, Közzétételek, Elemzés (a többi fül tartalma a 2. fázisban)
- [x] **Bet assist AI** (AI_000–AI_007): chat, első használatkor disclaimer elfogadása, javasolt kérdések, kérdéskeret (javaslat: napi 10 kérdés, kérdésenként 300 karakter), kamu válaszok
- [x] **Edukáció** (EF_001–EF_005): kategorizált és kereshető tudástár (téma, szint), beágyazott videó (YouTube/Vimeo), kvíz visszajelzéssel, átvitel a Részvényfutam alkalmazásba
- [x] **Alsó navigáció**: Home, Piactér, Bet assist AI, Edukáció (az AI helye az alsó menüsor, ez a javaslat az AI_000-re)
  - [x] `bottom-nav` modul a közös menüvel (`renderMainNav`), bekötve: Home, Piactér, Bet assist, Edukáció, termékadatlap
  - [x] Bet assist oldal: alsó menüt kapott, a beviteli mező fókuszakor animálva elrejtőzik

## 2. fázis: Termékadatlapok teljesen

Cél: minden instrumentumtípus megvan, a fülek tartalommal.

- [x] Részvény fülek (TA_0011–TA_0015)
  - Pénzügyi adatok: éves bontás, 5 év, oszlopdiagram a varsói minta alapján (eredménykimutatás, mérleg, cash flow). Sima CSS/HTML vizuál, nem TradingView-chart
  - Értékelés: 10 év osztalék oszlopdiagramon (ha nem fizetett, üres), P/BV, P/E, eladósodottság, ROA, ROE. A P/E-nél a "nincs adat" állapot is kell (kérdés 15)
  - Kibocsátó: termékjellemzők, részvényesek, vezetés, cégbemutató
  - Közzétételek: összevont lista, kategória-buborékok (a bet.hu közzététel-típusai) és keresés, PDF az appon belül
  - Elemzés: csak ha van BÉT-támogatott elemzés. Dashboard: ajánlások darabszáma és célár-tartomány (kérdés 16)
- [x] Kötvény (TA_002), ETF (TA_003), index (TA_004: összetétel súlyok nélkül, termékjellemzők, kézikönyv PDF letöltés), certifikát (TA_005), BÉTa termékek (TA_006, Ft-ban), határidős / opció / deviza (TA_007, mindhárom szekció)
- [x] Split / osztalék jelölése a grafikonon: jelölők (marker) az idő tengelyen (TA_001 javaslat)
- [x] Közzététel megnyitása: PDF az appon belül, más formátum (docx, xls, xlsx, zip) böngészőben (TA_0014, NYK_003 javaslat)
- [x] Mérhető bróker-átirányítás: bróker lista kattintás-visszajelzéssel

Megjegyzések a 2. fázishoz: új `bar-chart` modul (sima CSS oszlopok, negatív és hiányzó érték is), a fülek külön fájlokban (`product-share-tabs.js`, `product-types.js`, `product-disclosures.js`). A BÉTa és a származékos termékeknek csak Kereskedés fülük van. Az Elemzés fül csak OTP, MOL, RICHTER, MTELEKOM esetén jelenik meg. A mock adatok a `seed-product*.js` fájlokban vannak (a nevek kitaltak). A `locales/hu.js` témák szerint szét lett vágva (`hu-product.js`, `hu-assist.js`, ...).

## 3. fázis: Személyre szabás

- [x] **Kedvencek** (K_000–K_005): a hozzáadás a keresőre visz (K_001), új elem a lista végére kerül, húzással rendezhető (K_0011). Lista: ticker, árfolyam, napi változás, napi forgalom (K_002). Kibocsátói közzététel értesítés beállítása: egy kibocsátó, opcionális többes típusválasztás (K_003)
- [x] **Árfolyamriasztás** (ÁR_000–ÁR_0053): max. 10 riasztás, egy instrumentum / riasztás, árszint átlépése felfelé és lefelé, teljesülés után eltűnik, törölhető (módosítás nem kell), késleltetett árfolyam disclaimer
- [x] Kezdőlap szerkesztése: kártyák törlése, hozzáadása és átrendezése (NYÁ_004), kedvencekkel is
- [ ] Widget testreszabása, kedvencekkel is (ÁF_0033): a widgetek oldal még csak az alapértelmezett listát mutatja
- [x] Értesítések (appon belüli lista, olvasatlan jelzés a Home harangján; a push csak a tervekben): push és appon belüli (riasztás, kibocsátói közzététel). Megnyitáskor az adott közzététel vagy instrumentum nyílik (K_005)

Megjegyzések a 3. fázishoz: új oldalak a `favorites`, `favorite-notify`, `alerts`, `alert-new`, `notifications`, `home-edit` (kulcsok: `locales/hu-personal.js`). A Menü oldalon a Személyes csoport, a termékadatlapon harang gomb a riasztáshoz. A termékadatlap mostantól kezeli a `?tab=` és `&doc=` paramétert (korábban a Home linkje a `tab`-ot figyelmen kívül hagyta). A kedvencek sorrendje húzással és nyíl billentyűkkel is módosítható.

## 4. fázis: Fiók és beállítások

- [ ] **Regisztráció** (FK_004–FK_0065): e-mail, jelszó (12–32 karakter, kis- és nagybetű, szám, speciális karakter is lehet), megerősítés, kötelező nyilatkozatok, hírlevél (opcionális jelölőnégyzet), hatjegyű kód megerősítés, kód újraküldés 1 perc után, félbehagyott regisztráció folytatása
- [ ] **Elfelejtett jelszó** (FK_008–FK_0081), biometrikus belépés (FK_005), fiók zárolás hibás belépés után növekvő várakozással: 5, 10, 30, 60 mp (FK_0072)
- [ ] **Profil** (FK_009–FK_0096)
  - [x] Megjelenés (téma: rendszer / világos / sötét), hírlevél kapcsoló, fiók törlése megerősítő dialógussal, adatkezelési tájékoztató sor
  - [ ] E-mail és jelszó módosítás saját képernyőn (most "hamarosan" toast), fiók törlése megerősítő kóddal, az adatkezelési tájékoztató a bet.hu-ra visz
- [ ] **Beállítások** (B_001–B_004): nyelv, Névjegy / Jogi információk, visszajelzés küldése (300 karakter, köszönő pop-up). A téma már a Profilban van
- [ ] Menü oldal teljes tartalommal (most: profil és kijelentkezés)

## 5. fázis: Angol nyelv és állapotok

- [ ] Angol nyelv (`locales/en.js`), nyelvváltó a beállításokban (B_002). A rendszer erre már fel van készítve
- [ ] Betöltés, üres és hiba állapot (`?mock=slow|empty|error`) a még hiányzó oldalakon. Kész: Home, Piactér, Edukáció, termékadatlap, Bet assist
- [ ] "Piac zárva" és "nincs adat" állapotok végigvezetése. A BÉT csak kereskedési napokon 8–18 óra között vállal rendelkezésre állást, ezért a hibaállapot (Újra gomb) mindenhol legyen meg

## 6. fázis: Csiszolás és átadás

- [ ] Mindkét téma végigellenőrzése minden oldalon, kontraszt és akadálymentesség (NFK_003)
- [ ] Kis és nagy képernyő (iPhone SE – Pro Max) ellenőrzés
- [ ] Style guide teljes naprakésszé tétele
- [ ] `index.html` átnézése: minden oldal elérhető legyen onnan
- [ ] Update history és verzió frissítése
- [ ] Képernyőtervek exportja az ajánlathoz (a tender 5.1 szerint a fő felületek látványtervei). E-mailenként max. 20 MB, letöltési link és több e-mail is elfogadott

## Javítási pontok (végigmenni rajta)

Az eddig elkészült részek átnézésén talált eltérések és ellenőrizendő pontok. Nem mind hiba: ahol "ellenőrizni" áll, még meg kell nézni a kódban. Ha egy pont kész, pipáljuk ki.

**1. fázis (kész részek):**
- [x] Bet assist oldal: főmenüpont, alsó menüvel, vissza nyíl nélkül. Ha a beviteli mező fókuszban van, a menü animálva eltűnik (magasság + áttűnés), fókusz nélkül visszacsúszik (`assist-nav.js`)
- [x] Bet assist kérdéskeret: a tender (AI_006) munkamenetenkénti korlátot említ, de darabszámra és időtartamra javaslatot kér. A napi 10 kérdés érvényes javaslat (az időtartam a nap), marad
- [x] Widgetek alapértelmezett listája: javítva, small BUX + CETOP NTR, medium + BUMIX, OTP, large a teljes sor
- [x] Nagy cím (`--font-size-large-title`): a termékadatlapon az árfolyam, az edukáció részleten a kvíz pontszáma (adat, marad). A widgetek oldalon oldalcím volt és app bar sem volt: javítva, app bar címmel és vissza nyíllal
- [x] Disclaimer: minden késleltetett árfolyamot mutató felületen megvan, az AI chat termékkártyái alatt is ("Az árfolyamok késleltetettek" megjegyzés)
- [x] Hiányzó termékadat (`–`): a teljesítménysor `–` értéke nem kapott "Nincs adat" címkét, javítva (közös `valueNode`). A többi típus és a P/E a 2. fázissal jön, akkor újra ellenőrizni

**2–4. fázis (nyitott részek):**
- [ ] Profil: az e-mail és jelszó módosítás, az adatkezelési tájékoztató most csak "hamarosan" toast. Cél: saját képernyő, illetve átirányítás a bet.hu-ra (FK_0096)
- [ ] Menü oldal: most csak profil és kijelentkezés, a Beállítások és Névjegy / Jogi információk hiányzik
- [x] Belépés: a Google, Apple és Portál gomb nem üres, a demo felhasználóval belép (szimulált várakozás után), toast nem kell

**Minden fázisra, átadás előtt:**
- [x] Style guide: minden modul szerepel (az `iphone-frame` keret kivételével, az maga a meta oldalak között nem használt), törölt modul nincs benne
- [x] `index.html`: minden oldal elérhető (keresés és edukáció keresés hozzáadva), a piactér, termékadatlap és edukáció `?mock=slow` állapota is linkelve
- [x] Hardcode-olt színek, méretek és időtartamok: színből nincs, az assist animációk időtartamai új tokenek (`--duration-pulse|loop|shimmer|glow`), a `linear` kikerült
- [x] Inline `style=""`, `onclick` és `setTimeout` nincs (a bottom-nav `transitionend`-et használ)
- [x] Fájlméret: `assist.js` 467 sor (előzmények az `assist-history.js`-ben), `assist-message.css` 380 sor (rich blokkok az `assist-rich.css`-ben)

## A tender javaslatkérései

A mockup ezekre ad látható választ:

- [x] Widgetenként megjelenő instrumentumok száma (ÁF_0021): small 2, medium 4, large 8
- [x] Hiányzó termékadat megjelenítése (TA_000): halvány `–`
- [x] Carousel automatikus váltási ideje (NYC_002): 5 másodperc
- [x] Toplisták közötti váltás UX-e (NYT_007): chipek
- [x] AI chat elhelyezése (AI_000): alsó menüsor
- [x] AI kérdések maximális száma és az időtartam (AI_006): napi 10 kérdés, kérdésenként 300 karakter
- [ ] Widget és toplista frissítési időköze (ÁF_004, NYT_004)
- [x] Split és osztalék a grafikonon (TA_001): jelölők az idő tengelyen (O, F, Ö), alatta a dátum és arány listája
- [x] PDF és más formátumú közzétételek megnyitása (TA_0014, NYK_003): PDF az appon belül (előnézet + letöltés), a többi formátum böngészőben

## Függő tételek (a BÉT válaszára vár)

A kérdések a `docs/kerdesek-kliensnek.md`-ben vannak, még nincsenek elküldve. Addig az ott leírt munkahipotézis szerint dolgozunk, és válasz után ezeket a pontokat nézzük át:

- 1–11. Arculat és logó: fejléc logó, sötét módú logó, app ikon, arany gomb, emelkedés/esés színek, angol logóváltozat. Érinti: minden oldal
- 12. Analitikai hozzájárulás: ha kell, első indításkor egy hozzájárulási képernyő és egy kapcsoló a Beállításokban (4. fázis). Addig nem építjük meg
- 13. BÉTa késleltetés: a disclaimer szövege (2. fázis, BÉTa termékek)
- 14. Idősorok mélysége, pénzügyi adatok bontása: a grafikon idősávjai és a Pénzügyi adatok fül (2. fázis)
- 15. P/E: Értékelés fül (2. fázis)
- 16. Elemzések: az Elemzés fül dashboardja (2. fázis)
- 17. Edukációs tartalom: a tudástár és a kvíz mennyisége, felépítése (Edukáció)

## Ami nincs a mockupban

- Valódi adatok, backend, admin felület (PRD_012). Az admin felületet legfeljebb a tervekben jelezzük
- Valódi vétel / eladás (csak átirányítás a brókerhez)
- Tablet elrendezés (a BÉT szerint nem szükséges)
- Biztonsági és megfelelőségi követelmények (NFK_006–NFK_025): ezek a megvalósítási terv részei, nem a mockupé

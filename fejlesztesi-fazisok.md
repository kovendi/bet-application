# Fejlesztési fázisok

A BÉT tőzsdei mobilapp mockupjának teljes terve. A forrás a BÉT tender (`docs/BET_Mobilapp_tender_260929_Final (1).pdf`), a követelménykódok zárójelben szerepelnek. A BÉT kérdéseinkre adott válaszai a `docs/BET_Mobilapp_kerdesek_BEKULDENDO_VEGLEGES_BET.docx` fájlban vannak.

A mockup célja a tender 5.1 pontja szerint a főbb felületek látványterve, hogy az ajánlathoz képernyőtervek csatolhatók legyenek. Ezért a fázisok a bemutathatóság szerint követik egymást: az első fázisokból már összeáll egy kattintható demo.

## Alapelvek (minden fázisra)

- Mobil nézet elsődleges, asztali böngészőben iPhone-keretben jelenik meg (lásd CLAUDE.md)
- Dark és light mód mindenhol (B_001), alapértelmezetten az eszköz beállítása. Minden oldalt mindkét módban ellenőrzünk
- Arculat: `docs/arculat`, színek és logó szabályai a CLAUDE.md "Brand / Arculat" és "Color Palette" részében
- Nyelv: egyelőre magyar. A magyar/angol váltás (B_002) az 5. fázisban jön, de a szövegek mindig `t()`-n keresztül mennek
- Minden árfolyam késleltetett (indexek kivételével), ezért mindenhol megjelenik a disclaimer (TK_009, TA_001, NYÁ_0021)
- Vendég módban a regisztrált funkciók (kedvencek, riasztás, AI chat) egy "Regisztráció szükséges" ablakot mutatnak, benne a regisztrációra vivő gombbal (K_000, ÁR_000, AI_001)
- A mock adatok a `storage` modulban vannak, nincs backend és nincs valódi adat
- Új, ismétlődő elemnél előbb megnézzük, van-e már modul, és megkérdezzük, legyen-e új (CLAUDE.md)

## 0. fázis: Alapok

Cél: minden későbbi oldal erre épül.

- [x] `global.css` frissítése a CLAUDE.md színtáblázatára (új tokenek: positive, on-accent), kézi dark/light váltás az eszközbeállítás mellett
- [x] Logó és arculati elemek bekötése (BÉT embléma a belépő és kezdő oldalon)
- [x] Mock adatmodul: ~30 instrumentum (részvény, index, ETF, kötvény, certifikát, határidős), árfolyamok, napi min/max, forgalom, közzétételek, edukációs anyagok, brókerek
- [x] Hiányzó modulok (mindegyik a style-guide-ba is kerül):
  - [x] **chart**: vonal/gyertya grafikon, idősík-választó (a TradingView Lightweight stílusát utánozza), a CLAUDE.md chart színeivel
  - [x] **price-row**: ticker, cégnév, árfolyam, %-változás (+/− jellel és színnel), csillag a kedvencekhez
  - [x] **chips / segmented**: vízszintes kategóriaválasztó (TK_001), buborékos szűrő (TA_0014)
  - [x] **search-field**: 2 karaktertől listáz (TK_006)
  - [x] **bottom-sheet** és **banner**: bróker lista, szűrők, disclaimer, "regisztráció szükséges" ablak
  - [x] **sparkline**: mini árfolyamgörbe (nice-to-have)

## 1. fázis: Fő demo (a korábbi "phase-1" anyag)

Cél: egy bemutatható, végigkattintható mag.

- [x] **iPhone widgetek**: small / medium / large (ÁF_001–ÁF_0021), ticker, árfolyam, változás, mini görbe. Javaslat a tenderben kért darabszámra: small 2, medium 4, large 8 instrumentum
- [x] **Belépés** (FK_001–FK_003)
  - [x] Vendégként tovább gomb (regisztráció nélkül is használható)
  - [x] E-mail + jelszó, Google, Apple, BÉT Portál belépés
  - [x] Hibás belépésnél nem derül ki, melyik adat rossz (FK_0071)
  - [x] Demo belépés: `demouser` / `123456`
- [x] **Home / nyitófelület** (NYÁ, NYC, NYT, NYK, PS)
  - [x] Piaci státusz: nyitva/zárva, hátralévő idő, zárva esetén a következő nyitás (PS_001–PS_005)
  - [x] Árfolyam-áttekintő: nagy fő kártya + vízszintesen csúsztatható kis kártyák, alapból BUX, CETOP NTR, BUMIX és 4 blue chip, max. 8 elem (NYÁ_001–NYÁ_005)
  - [x] Carousel: cím, kategória, kép, link, automatikus váltás (NYC_001–NYC_003)
  - [x] Toplisták: nyertesek / vesztesek / forgalom, listánként max. 5 elem (NYT_001–NYT_007)
  - [x] Legutóbbi 5 kibocsátói közzététel (NYK_001–NYK_003)
- [x] **Piactér / termékkeresés** (TK_001–TK_010)
  - Szabad szöveges kereső, alatta kategóriák: Részvény, Index, ETF, Kötvény, Certifikát, Egyéb
  - Rendezés (ABC, forgalom, napi változás) és szűrők kategóriánként
  - Egyszerre 20 elem, görgetésre tölt tovább
- [x] **Termékadatlap: részvény (példa: OTP)** (TA_000–TA_001)
  - Fejléc, árfolyamgrafikon (gyertya/vonal, idősáv), legjobb vételi/eladási ár, forgalom, day range, teljesítménymutatók
  - Vétel / eladás gomb: bróker lista (a bet.hu kereskedőcégek oldala alapján)
  - Fülek: Kereskedés, Pénzügyi adatok, Értékelés, Kibocsátó, Közzétételek, Elemzés (a fülek tartalma a 2. fázisban)
- [ ] **Bet assist AI** (AI_000–AI_007): chat, első használatkor disclaimer elfogadása, javasolt kérdések, kérdésszám-korlát jelzése, kamu válaszok
- [ ] **Edukáció** (EF_001–EF_005): kategorizált és kereshető tudástár (téma, szint), beágyazott videó, kvíz visszajelzéssel, átvitel a Részvényfutam alkalmazásba
- [ ] **Alsó navigáció**: Home, Piactér, Bet assist AI, Edukáció (az AI helye: alsó menüsor, javaslat az AI_000-re)

## 2. fázis: Termékadatlapok teljesen

Cél: minden instrumentumtípus megvan, a fülek tartalommal.

- [ ] Részvény fülek (TA_0011–TA_0015)
  - Pénzügyi adatok: 5 év, oszlopdiagram (a varsói minta alapján)
  - Értékelés: 10 év osztalék, P/BV, P/E, eladósodottság, ROA, ROE
  - Kibocsátó: termékjellemzők, részvényesek, vezetés, cégbemutató
  - Közzétételek: kategória-buborékok és keresés, PDF az appon belül
  - Elemzés: csak ha van BÉT-támogatott elemzés, vétel/eladás darabszám és célár-tartomány dashboard
- [ ] Kötvény (TA_002), ETF (TA_003), index (TA_004: összetétel súly nélkül, termékjellemzők, kézikönyv PDF letöltés), certifikát (TA_005), BÉTa termékek (TA_006), határidős / opció / deviza (TA_007)
- [ ] Split / osztalék jelölése a grafikonon, hiányzó adat megjelenítése (a tender javaslatot kér mindkettőre)
- [ ] Közzététel megnyitása: PDF az appon belül, más formátum böngészőben (javaslatot kérnek)
- [ ] Mérhető bróker-átirányítás: bróker lista kattintás-visszajelzéssel

## 3. fázis: Személyre szabás

- [ ] **Kedvencek** (K_000–K_005): lista (ticker, árfolyam, változás, forgalom), húzással rendezhető sorrend, kibocsátói közzététel értesítés beállítása (egy kibocsátó, opcionális típusválasztás)
- [ ] **Árfolyamriasztás** (ÁR_000–ÁR_0053): max. 10 riasztás, egy instrumentum / riasztás, árszint átlépése, teljesülés után eltűnik, késleltetett árfolyam disclaimer
- [ ] Kezdőlap szerkesztése: kártyák törlése és hozzáadása (NYÁ_004), widget testreszabása (ÁF_0033)
- [ ] Értesítések listája az appon belül (push és belső)

## 4. fázis: Fiók és beállítások

- [ ] **Regisztráció** (FK_004–FK_0065): e-mail, jelszó (12–32 karakter, kis- és nagybetű, szám), megerősítés, nyilatkozatok, hírlevél opt-in, hatjegyű kód megerősítés, kód újraküldés 1 perc után, félbehagyott regisztráció folytatása
- [ ] **Elfelejtett jelszó** (FK_008–FK_0081), biometrikus belépés (FK_005), fiók zárolás hibás belépés után növekvő várakozással (FK_0072)
- [ ] **Profil** (FK_009–FK_0096): e-mail és jelszó módosítás, hírlevél, kijelentkezés, fiók törlése kóddal, adatkezelési tájékoztató
- [ ] **Beállítások** (B_001–B_004): téma (rendszer / sötét / világos), nyelv, Névjegy / Jogi információk, visszajelzés küldése (300 karakter, köszönő pop-up)
- [ ] Menü oldal teljes tartalommal

## 5. fázis: Angol nyelv és tartalmi pótlások

- [ ] Angol nyelv (`locales/en.js`), nyelvváltó a beállításokban (B_002). A rendszer erre már fel van készítve
- [ ] Üres, hiba és betöltés állapotok minden listára és adatlapra
- [ ] Offline / sikertelen betöltés állapot, "piac zárva", "nincs adat" állapotok

## 6. fázis: Csiszolás és átadás

- [ ] Mindkét téma végigellenőrzése minden oldalon, kontraszt és akadálymentesség (NFK_003)
- [ ] Dark/light, kis és nagy képernyő (iPhone SE – Pro Max) ellenőrzés
- [ ] Style guide teljes naprakésszé tétele
- [ ] `index.html` átnézése: minden oldal elérhető legyen onnan
- [ ] Update history és verzió frissítése
- [ ] Képernyőtervek exportja az ajánlathoz (a tender 5.1 szerint a fő felületek látványtervei)

## Nyitott kérdések, amelyekre a tender javaslatot vár

A mockup ezekre ad látható választ, a javaslatot a megfelelő fázisban rögzítjük:

- Widgetenként megjelenő instrumentumok száma (1. fázis, javaslat fent)
- Widget és toplista frissítési időköze (ÁF_004, NYT_004)
- Carousel automatikus váltási ideje (NYC_002)
- Toplisták közötti váltás UX-e (NYT_007)
- Hiányzó termékadat megjelenítése (TA_000)
- Split és osztalék a grafikonon (TA_001)
- PDF és más formátumú közzétételek megnyitása (NYK_003)
- AI kérdések maximális száma és az időtartam (AI_006)
- AI chat elhelyezése (AI_000)

## Ami nincs a mockupban

- Valódi adatok, backend, admin felület (PRD_012). Az admin felületet legfeljebb a tervekben jelezzük
- Valódi vétel / eladás (csak átirányítás a brókerhez)
- Tablet elrendezés (a BÉT szerint nem szükséges)
- Biztonsági és megfelelőségi követelmények (NFK_006–NFK_025): ezek a megvalósítási terv részei, nem a mockupé

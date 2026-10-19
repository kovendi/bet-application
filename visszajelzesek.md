# Visszajelzések

A mockupra érkezett észrevételek és a belőlük következő feladatok. A `fejlesztesi-fazisok.md` a tervezett munkát követi, ez a fájl a már elkészült felületek javítandó eltéréseit (kiírás, BÉT kérdés-válasz, pályázati szöveg és mockup között). Új visszajelzés új szakaszba kerül, forrással és dátummal.

Források: **kiírás** = `docs/BET_Mobilapp_tender_260929_Final (1).pdf`, **BÉT válaszai** = `docs/arculat/BÉT_Mobilapp_tender_kérdések_válaszok.pdf`, **pályázat** = a beadott ajánlat szövege (nincs a repóban).

## 1. Mockup észrevételek (2026-10-19)

Mind a hat pontot ellenőriztük a kiírás és a Q&A szövegével, valamint a mockup kódjával: az eltérések fennállnak.

### Javítandó mockuphibák (a kiírás egyértelmű)

- [x] **NYT_006: kedvenccsillag a toplistasorokban.** Kiírás (16. o.): „Kedvencekhez hozzáadási/elvételi lehetőség.” A toplista sorain nincs csillag: `modules/toplist/toplist.js` nem ad át `favorite`-ot a `price-row`-nak. A piactér és a kedvencek oldal már használja (`pages/market/market.js`: `isFavorite` / `toggleFavorite`), ugyanazt a logikát kell bekötni (vendégnek „Regisztráció szükséges”, K_000). A toplistát a kezdőlap és a piactér is használja.
- [x] **TK_003: rendezési feltételek.** Kiírás (8. o.): „ABC sorrend ticker alapján (összes kategória)”, „Forgalom (kivéve indexek …)”.
  - [x] Az ABC rendezés ticker szerint menjen (most: `a.name.localeCompare` a `SORTERS.abc`-ben, `pages/market/market.js`).
  - [x] Index kategóriánál a rendezőlapon ne legyen „Forgalom” (most mindhárom opció mindig látszik, `renderSortFilterSheet`). Ha az „Index” kategória van kijelölve és a Forgalom volt az aktív rendezés, essen vissza ABC-re.
  - [x] Az azonos forgalmú sorok ABC (ticker) szerint rendeződjenek (TK_003), egyenlő napi változásnál is ABC.
- [x] **TK_006 és ÁR_0051: keresés ISIN alapján.** Kiírás (8. és 7. o.): „A kereső a ticker, kibocsátó neve és isin-kód alapján listázza a találatokat.”
  - [x] ISIN a mock instrumentumokba (a `makeIsin` a `seed-product.js`-ben már létezik, de az instrumentum-seed nem használja).
  - [x] A keresés (`pages/search/search.js`) és az árfolyamriasztás kereső (`pages/alert-new`) is illeszkedjen az ISIN-re.
  - [x] A súgószöveg (`search.hint_message`, hu + en) említse az ISIN-t.
- [x] **Cégforma az impresszumban.** Kiírás: „Budapesti Értéktőzsde Nyrt.” A `locales/hu-account.js` `about.imprint_body` kulcsában „Zrt.” áll. Javítani hu-ban, és ellenőrizni az `en-account.js`-t is.

### Döntést igénylő pontok (a mockup többet tud, mint amit a BÉT kért)

Ellentmondás a mockup és a pályázati szöveg között. A BÉT kifejezetten azt válaszolta, hogy nem elvárás. Javaslat: a funkciót kivenni a mockupból, mert a pályázat is azt állítja, hogy nincs.

- [ ] **Chatbot-előzmények (AI_003).** BÉT válaszai (18. o.): „Elvárás-e, hogy a felhasználó a korábbi chatbot-beszélgetéseit későbbi munkamenetekben is elérje? – Nem elvárás.” Pályázat: „Korábbi beszélgetéseket a felhasználó számára nem tárolunk; ezt a BÉT nem várja el.” Mockup: a beszélgetések mentődnek, és a „Korábbi beszélgetések” gombbal újranyithatók (`pages/assist/assist-history.js`, `assist.history*` kulcsok hu + en).
  - Javaslat: előzménylista, mentés és gomb kivétele. A beszélgetés csak a munkamenet végéig él, „Új beszélgetés” marad.
  - Alternatíva: a pályázati szöveg átírása. Kockázatos, mert a BÉT azt mondta, nem kell.
- [ ] **Kvíz eredménymentése (EF_004).** Kiírás (18. o.): „interaktív, feleletválasztós tudáskvíz, amely a kitöltést követően visszajelzést ad a felhasználó válaszairól.” BÉT válaszai (46. o.): „Kell-e időkorlát, eredmények mentése …? – Nem szükséges időkorlát, sem mentés.” Visszajelzés: magyarázat kérdésenként, pontszám a végén. Pályázat: „Időkorlát és eredménymentés nincs, mert a BÉT ezt nem igényli.” Mockup: menti és mutatja a legjobb eredményt („Legjobb eredmény”, „Új legjobb eredmény”, `pages/education-detail/education-quiz.js`, `edu.quiz_*` kulcsok).
  - Javaslat: a legjobb eredmény mentése és kijelzése kikerül, a végén a pontszám és a kérdésenkénti magyarázat marad.
  - A kvíz állapota (kitöltés közben) csak a munkamenetben él, a localStorage-ba nem kerül.

### Kapcsolódó teendők (minden javításnál)

- [ ] Új vagy módosított szöveg hu + en kulccsal (CLAUDE.md i18n szabály).
- [ ] Ha a kulcsok kikerülnek (előzmények, legjobb eredmény), a hu/en fájlokból is törölni.
- [ ] Style guide frissítése, ha modul változik.
- [ ] `követelmenyek-osszefoglalo.md`: jelezni, hogy a chatbot-előzmény és a kvízmentés nem kell (a BÉT válasza már benne van, a mockup-döntés még nem).
- [ ] Push előtt `APP_VERSION` emelése és egy sor az `update-history.html`-ben (CLAUDE.md).

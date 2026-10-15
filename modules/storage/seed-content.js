// Classic script (not a module). Static mock content for the home screen,
// product pages, education and broker redirect. Illustrative only — read it
// through window.storage, never directly. Text here is mock content (not UI
// chrome), so it is intentionally not routed through t().
//
// Broker names follow the BÉT member firms listed on bet.hu; the final list
// and links are to be confirmed against the bet.hu "kereskedőcégek" page.

window.SEED_CONTENT = {
  // Mon–Fri continuous trading (PS_001–PS_005), Budapest time.
  marketHours: { open: "09:00", close: "17:00", days: [1, 2, 3, 4, 5] },

  carousel: [
    { id: "c1", title: "Új szintek a BUX-on: rekordközelben zárt a hét", category: "Piaci hírek", gradient: "navy-gold", link: "https://bet.hu" },
    { id: "c2", title: "Ismerd meg a Részvényfutamot!", category: "Edukáció", gradient: "blue-teal", link: "https://bet.hu" },
    { id: "c3", title: "Közgyűlési szezon: ezekre a naptári eseményekre figyelj", category: "Naptár", gradient: "gold-navy", link: "https://bet.hu" },
    { id: "c4", title: "Mi az az ETF, és hogyan kereskedhetsz vele?", category: "Edukáció", gradient: "teal-navy", link: "https://bet.hu" },
  ],

  // Issuer announcements (közzétételek), newest first.
  disclosures: [
    { id: "d1", ticker: "OTP", title: "Féléves jelentés 2026", category: "Rendszeres", date: "2026-10-13", format: "pdf" },
    { id: "d2", ticker: "MOL", title: "Osztalékfizetés időpontja", category: "Rendkívüli", date: "2026-10-13", format: "pdf" },
    { id: "d3", ticker: "RICHTER", title: "Vezetői tranzakció bejelentése", category: "Tulajdonosi", date: "2026-10-12", format: "pdf" },
    { id: "d4", ticker: "MTELEKOM", title: "Harmadik negyedéves gyorsjelentés", category: "Rendszeres", date: "2026-10-12", format: "pdf" },
    { id: "d5", ticker: "4IG", title: "Akvizíció megkötése", category: "Rendkívüli", date: "2026-10-11", format: "pdf" },
    { id: "d6", ticker: "ALTEO", title: "Szavazati jogok megváltozása", category: "Tulajdonosi", date: "2026-10-10", format: "pdf" },
    { id: "d7", ticker: "OPUS", title: "Éves rendes közgyűlés összehívása", category: "Rendkívüli", date: "2026-10-09", format: "html" },
    { id: "d8", ticker: "OTP", title: "Saját részvény vásárlása", category: "Tulajdonosi", date: "2026-10-08", format: "pdf" },
  ],

  // Demo notification inbox (K_005, ÁR_0051): an alert hit and issuer disclosures.
  notifications: [
    { id: "n1", kind: "alert", ticker: "OTP", title: "Árfolyamriasztás: OTP", text: "Az árfolyam átlépte a 32 000 Ft szintet felfelé.", at: "2026-10-15T09:42:00" },
    { id: "n2", kind: "disclosure", ticker: "MOL", title: "MOL: Osztalékfizetés időpontja", text: "Új rendkívüli tájékoztatás érkezett.", at: "2026-10-13T16:05:00", disclosureId: "d2" },
    { id: "n3", kind: "disclosure", ticker: "OTP", title: "OTP: Féléves jelentés 2026", text: "Új rendszeres jelentés érkezett.", at: "2026-10-13T08:30:00", disclosureId: "d1" },
  ],

  // Education (EF_001–EF_005). type: article | video | quiz; level: beginner | advanced.
  education: [
    { id: "e1", title: "Mi az a tőzsde, és hogyan működik?", topic: "Alapok", level: "beginner", type: "article", minutes: 5 },
    { id: "e2", title: "Részvény, kötvény, ETF: a legfontosabb különbségek", topic: "Alapok", level: "beginner", type: "video", minutes: 8 },
    { id: "e3", title: "Hogyan olvassunk árfolyamgrafikont?", topic: "Elemzés", level: "beginner", type: "article", minutes: 6 },
    { id: "e4", title: "Mit jelent a P/E mutató?", topic: "Elemzés", level: "advanced", type: "article", minutes: 7 },
    { id: "e5", title: "Osztalék és osztalékhozam", topic: "Befektetés", level: "beginner", type: "video", minutes: 4 },
    { id: "e6", title: "Kvíz: tőzsdei alapfogalmak", topic: "Alapok", level: "beginner", type: "quiz", minutes: 3 },
    { id: "e7", title: "Kockázat és diverzifikáció", topic: "Befektetés", level: "advanced", type: "article", minutes: 9 },
    { id: "e8", title: "Certifikátok és turbók működése", topic: "Termékek", level: "advanced", type: "video", minutes: 11 },
    { id: "e9", title: "Kvíz: kockázat és hozam", topic: "Befektetés", level: "advanced", type: "quiz", minutes: 4 },
    { id: "e10", title: "Állampapírok a tőzsdén", topic: "Termékek", level: "beginner", type: "article", minutes: 6 },
  ],

  brokers: [
    { id: "b1", name: "Erste Befektetési Zrt.", url: "https://www.erstebroker.hu" },
    { id: "b2", name: "OTP Bank Nyrt.", url: "https://www.otpbank.hu" },
    { id: "b3", name: "Concorde Értékpapír Zrt.", url: "https://www.concorde.hu" },
    { id: "b4", name: "Equilor Befektetési Zrt.", url: "https://www.equilor.hu" },
    { id: "b5", name: "MBH Befektetési Bank Zrt.", url: "https://www.mbhbank.hu" },
    { id: "b6", name: "K&H Bank Zrt.", url: "https://www.kh.hu" },
    { id: "b7", name: "Raiffeisen Bank Zrt.", url: "https://www.raiffeisen.hu" },
  ],
};

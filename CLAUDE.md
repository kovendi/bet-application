# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## App

Name: **BET** (placeholder — update once the product name is final). Project docs live in `../docs/`.

## Stack

This `mockup/` folder is the UI phase only — the goal is a lovable interface before the final implementation starts. Functionality, data model and logic follow the project docs; the tech stack does not.

Static HTML/CSS/JavaScript mockup. No build step, no framework, no backend. Pages are opened directly via `file://` (no dev server, ever) — this means **no ES modules (`type="module"`, `import`/`export`) and no `fetch`**, since browsers block both under the `file://` origin. All JS is classic `<script src="...">` files that attach their API to `window` (e.g. `window.buttonModule.renderButton(...)`).

## Viewport

This is a mobile app mockup — design and test for mobile viewport first, always.

- Avoid vertically tall elements; keep components compact.
- Be conservative with padding/margin — mobile screen space is limited.
- Avoid "box in a box" nesting (e.g. a card inside a card, or a bordered container inside another bordered container) — it reads as a desktop-web pattern, not a native mobile one.

## Project Structure

```
mockup/
├── index.html      # overview page, links to every page in /pages
├── global.css      # global rules only: design tokens (colors, spacing, type, motion, …), base typography, resets
├── version.js      # window.APP_VERSION
├── assets/         # all SVG files live here, referenced by path from pages/modules
├── locales/        # translation tables (hu.js, ...)
├── pages/          # one folder per app screen
│   └── <name>/
│       ├── <name>.html
│       ├── <name>.js   # page logic (optional)
│       └── <name>.css  # page-specific styles only
└── modules/        # one folder per reusable component
    └── <name>/
        ├── <name>.js   # classic script; assigns a namespace on window, e.g. window.buttonModule.renderButton(props) — does not auto-run on load
        └── <name>.css
```

Every SVG belongs in `assets/`, regardless of which page or module uses it — never place an SVG file inside a `pages/<name>/` or `modules/<name>/` folder. Icons rendered at runtime are inlined via `modules/icon/icon.js` (file:// can't load external SVG markup); keep its path data in sync with `assets/icon-<name>.svg`.

Each page links `global.css`, its own `<name>.css`, plus the CSS of every module it uses, and loads (`<script src="...">`, no `type="module"`) the JS of every module it uses, in dependency order (e.g. locale files and `i18n.js` before any script that calls `t()`).

## Top inset / sticky bars (do not regress)

Never put `padding-top` on `body`, `.iphone-screen` or any scroll container that holds a sticky app bar — sticky sticks at the padding edge, so content scrolls visibly in the strip above the bar. The notch/status-bar inset is the CSS variable `--screen-inset-top` (global.css; `.iphone-frame` overrides it to 46px). `.top-appbar` absorbs it into its own opaque box; pages without an app bar get it automatically on `#screen-content`. App bar background must stay opaque.

## i18n

Languages: hu (default) and en. Translations live in `locales/hu.js`, which assigns a flat, dot-notation object to `window.LOCALES.hu` (e.g. `window.LOCALES.hu = { "nav.home": "...", "login.submit_button": "..." }`), never full sentences as keys. Plain `.js` (not `.json`) because `file://` pages can't `fetch()` JSON.

The table is split by area: `locales/hu.js` holds the shared keys (nav, dates, states, common modules) and `hu-assist.js`, `hu-education.js`, `hu-product.js`, `hu-market.js`, `hu-account.js`, `hu-meta.js` extend it with `Object.assign(window.LOCALES.hu, {...})`. A new key goes into the file of the area it belongs to (`hu.js` only if several areas share it); a new area gets its own `hu-<area>.js`. Every page must include `locales/hu.js` first, then all the `hu-*.js` files, before `modules/i18n/i18n.js`. English is the same file set under `locales/en*.js` (`en.js`, `en-assist.js`, ...), loaded by every page right after the `hu-*.js` files. Every key must exist in both languages: add it to `hu-<area>.js` and `en-<area>.js` together.

The system (`modules/i18n/i18n.js`, `t()`, `window.LOCALES`) is built to support more languages later — adding one should only require dropping in a new `locales/<code>.js` file and linking it from pages, no logic changes. Don't hardcode `hu` outside of `locales/hu.js` and the default-language fallback in `i18n.js`.

`modules/i18n/i18n.js` exposes `window.i18n`:

- `initI18n()` — call once on page load
- `t(key)` — returns the translated string for the current language
- `setLanguage(code)` / `getLanguage()` — switch/read current language, persisted in `localStorage`. `initI18n()` also sets `<html lang>` and the page `<title>` (`<title data-i18n="key">`)

Mock content (seeds) stays Hungarian in `modules/storage/seed-*.js`. `modules/storage/seed-en.js` holds its English text (an exact-string dictionary plus a few pattern rules) and `storage.js` passes everything it returns through `window.SEED_EN.localize()`; a new mock string in a seed needs an entry there. The Bet assist answers have their own English file, `seed-assist-en.js` (merged by `pages/assist/assist-reply.js`, with English keywords). Number formatting follows the language in `modules/money`.

Pages/modules must render text via `t('some.key')`, never hardcoded strings. This module has no paired CSS (logic-only, exception to the module js+css pairing rule).

## Data / Storage

No backend, so `localStorage` simulates a database. `modules/storage/storage.js` exposes `window.storage` over a single `localStorage` key `appDb`, whose value is a JSON object with one property per "table" (e.g. `users: []`). The logged-in user's id is kept separately under `appSession`.

- `getDb()` / `saveDb(db)` — read/write the whole object; `getDb()` auto-initializes `{ users: [{ id: "demouser", username: "demo@example.com", password: "12345678", name: "Demo" }] }` on first use.
- Per-entity helpers (e.g. `getUsers()`, `addUser(user)`, `findUserByUsername(username)`) and session helpers (`setCurrentUser(id)`, `getCurrentUser()`, `logout()`) live alongside the generic ones — add more as new entities are introduced, don't call `getDb()`/`saveDb()` directly from pages.
- Don't store `File`/`Blob` objects (not JSON-serializable) — convert to a base64 data URL via `FileReader.readAsDataURL` first.
- Static mock reference data (instruments, disclosures, carousel, education, brokers, price history) lives in `modules/storage/seed-*.js` and is read-only through `getInstruments()`, `getInstrument()`, `getChangePercent()`, `getPriceSeries()`, `getDisclosures()`, `getCarouselItems()`, `getEducation()`, `getEducationItem(id)` (list entry + body from `seed-education.js`), `getBrokers()`; `getDayCurve(ticker)` (today's mini curve from the previous close to the current price, so its direction always matches the daily change; used by price-row sparklines and the home hero); favorites (`getFavorites/isFavorite/toggleFavorite`) are user state in the db. Pages using them link `seed-instruments.js`, `seed-content.js`, `seed-series.js` (and `seed-education.js` for education bodies) before `storage.js`.
- Any page reading/writing data must link `modules/storage/storage.js` (no paired CSS — logic-only, same exception as `i18n.js`).

## Modules (reusable components)

If an element looks like it could repeat elsewhere (button, input, card, etc.), ask the user before building it whether it should be a module — don't decide this unilaterally.

When the user says an element is repeating and should be a "common module" (e.g. button, input, card):

- Build it as a module: one JS file that builds the HTML, plus one paired CSS file.
- A page that uses the module imports both the JS file and its CSS file.
- Before building any element, check if a matching module already exists — if so, reuse/import it instead of recreating it.
- Do not duplicate/reimplement an existing module's markup on a new page — import it.

Current modules: action-bar, banner, bar-chart, bottom-nav, bottom-sheet, button, card, carousel, chart, chips, confirm-dialog, datepicker, i18n, icon, input, iphone-frame, market-status, menu-list, mock-network, money, motion, overlay, page-transition, price-row, progress-bar, search-field, skeleton, sparkline, state-view, storage, tabs, tag-color, text-button, theme, toast, toggle, toplist, top-appbar. Each file's header comment documents its usage. Logic-only modules without paired CSS: i18n, storage, theme, money, tag-color, mock-network.

## Rules

### Docs first

Before starting any page, feature or phase, read the relevant requirements in `../docs/`. Start with `../docs/követelmenyek-osszefoglalo.md`: it is the digest of the tender (requirement codes, per-type tables), the BÉT's consolidated Q&A (every bidder's questions with the BÉT's answers) and the reference screens, so the PDF/docx do not have to be re-read every time. Only open the originals (`BET_Mobilapp_tender_...pdf`, `BET_Mobilapp_kerdesek_...docx`, `arculat/`) when the digest is missing a detail or is unclear.

When you find something in the originals that affects the design and is not in the digest, add it to `követelmenyek-osszefoglalo.md` in the same task. Keep the digest short: requirements that matter for the mockup only.

New questions for the BÉT go into `../docs/kerdesek-kliensnek.md` (collected for the next round, not sent yet), each with the source file, page or section and the quoted passage, plus a working hypothesis.

### Efficient workflow

When starting a new page/element, do the module-existence check (`modules/`) and any new-string i18n additions (`locales/hu.js`) together in one batch of tool calls rather than as separate round trips later in the task.

### Apple HIG (web translation)

The mockup should feel like a native iOS app. We follow the Apple Human Interface Guidelines (Clarity, Deference, Depth) in their web form. The SwiftUI specifics (NavigationStack, `@Observable`, SF Symbols, SensoryFeedback) don't apply: this is plain HTML/CSS/JS.

- **Priority:** the BÉT brand (Brand / Arculat, Color Palette) and the tender requirements win over the HIG whenever they conflict. Colors always come from the tokens, never from iOS system colors.
- **Clarity:** the content is the star, not the chrome. Prefer lists and grouped rows over bordered boxes (also see "box in a box"). Never rely on color alone (icon, sign or text too).
- **Depth:** layers via `--color-background` → `--color-card-background`, bottom sheets for secondary tasks, subtle shadows only.
- **Typography:** system font stack only, iOS type scale through the `--font-size-*` tokens (see Design system first).
- **Touch targets:** at least `var(--tap-min)` (44 px) tall and wide for every tappable element (the visible shape may be smaller if the hit area is padded). Side margin `var(--page-gutter)` (16 px).
- **Icons:** SF Symbols can't be used on the web (license). Icons go through `modules/icon` only, in an SF-like style: outlined, uniform stroke, rounded caps. When adding an icon, use the SF Symbols name as the reference for the file name where one fits (e.g. `chevron-right`, `gearshape`).
- **Motion:** see Premium UI → Motion and Interactive states.
- **Haptics:** not possible in a browser, so the visual press/toggle feedback stands in for it. Don't add `navigator.vibrate`.
- **Patterns:** standard iOS ones: bottom tab bar, inset grouped lists (`menu-list`), segmented control (`chips`), swipe actions, pull-friendly lists. No collapsing large title: page titles always sit in the app bar (see Top app bar).

### Premium UI & interaction feedback

The UI must feel premium: a static mockup that behaves like a real, polished app — calm, smooth, responsive. Nothing changes silently; every click or tap gets visible feedback. Never trade correct UX for an easier implementation.

**Design system first**

- New screens and elements match the existing ones. Reuse existing modules and classes (button, input, card, menu-list, chips, tabs, …) before writing anything new.
- Every color, spacing, radius, font size, icon size, shadow, z-index, duration and easing is a CSS custom property on `:root` in `global.css`. Never hardcode a value in a component rule. Use the existing steps: `--space-N` (N = px: 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32; `--page-gutter`), `--radius-xs|sm|md|lg|xl|pill|round`, `--font-size-*` (iOS scale: large-title 34, title2 22, title3 20, headline/body 17, callout 16, subheadline 15, footnote 13, caption1 12, caption2 11), `--icon-xs…2xl`, `--shadow-card|popover|floating`, `--z-sticky|overlay|toast|popover`, `--duration-fast|base|slow` (plus effect durations: `--duration-draw`, `--duration-countup`, `--duration-live-pulse`, `--duration-ambient`, `--stagger-step`), `--ease-ios|out|in-out`, `--press-scale|opacity`. Need a value that isn't there? Add a token (both themes if it differs) rather than an ad-hoc number. Fixed component dimensions (e.g. a 51×31 switch) may stay in px.
- If a pattern already appears in two places, propose turning it into a shared module (see [Modules](#modules-reusable-components)) instead of copying it a third time.
- If a new element has no counterpart in the existing mockup, ask before introducing a new visual pattern.

**Interactive states** — every clickable element (button, link, list row, chip, icon button):

- `:hover` only inside `@media (hover: hover)` (no sticky hover on touch).
- `:active` press state: `transform: scale(var(--press-scale))` or `opacity: var(--press-opacity)`, animated with `var(--duration-fast)`. Row/surface feedback uses `--color-hover` / `--color-pressed`.
- `cursor: pointer`, `-webkit-tap-highlight-color: transparent` and the `:focus-visible` ring (`--color-primary`) come from the baseline in `global.css`; components only add their own hover/active look and must not remove the focus ring.
- Icon-only buttons in a top bar use `.top-appbar-icon-button` (44 px hit area).

**Motion**

- Every state change animates: appear/disappear, expand/collapse, list insert/remove, tab/segment switch, sheet/dialog open/close. No element pops in or out instantly. Use `modules/motion`: `fadeIn(el)` for arriving content, `stagger(containerOrArray)` for lists/feeds arriving one after another, `countUp(el, value, format)` for a headline figure rolling up to its value, `playOut(el, class, done)` for exit animations, `replay(el, class)` for one-shot effects (e.g. the favorite star pop).
- Durations: `--duration-fast` (150 ms, press feedback), `--duration-base` (250 ms, state changes), `--duration-slow` (300 ms, sheets/larger moves); `--duration-ambient` only for slow decorative drift (hero glows, carousel rings, AI orb). Easing: `--ease-ios` (spring-like), `--ease-out` or `--ease-in-out` (looping drift), never `linear` and never a hardcoded curve.
- Premium touches already in the system, reuse them rather than inventing new ones: brand hero band (home), glass surfaces (`--color-glass`, bottom nav), live pulse (market-status, sparkline `endDot`), sliding segmented thumb (chips), tinted change pills (price-row), chart/sparkline reveal.
- **Page transitions:** sub-pages slide in from the right and going back slides the screen out to the right (`modules/page-transition`, linked in the `<head>` of every app page, before `theme.js`). Plain `<a href>` links push automatically; script navigation must use `window.pageTransition.go(url)`, `.back()` (instead of `history.back()`) or `.backTo(url)` (fixed parent), never `window.location.href` / `history.back()` for sub-page navigation. Bottom-nav tab switches, logout/login and reloads are not transitions and keep a plain `location.href`.
- `global.css` already shortens all motion under `prefers-reduced-motion`; don't override it.

**Loading, empty and error states**

- Where a real app would wait for data (lists, charts, details), load it through `window.mockNetwork.request(key, produce)`, show `modules/skeleton` blocks sized by page classes to match the final layout (see `pages/home`), then `motion.fadeIn` the content.
- Mock the error state for important screens too: `modules/state-view` with `variant: 'error'` and a Retry action.
- Never leave a blank area: an empty state (`state-view`, default variant) has a short explanation and the primary action that fills it.
- Demo any state from the URL: `?mock=slow` (skeletons), `?mock=error` (first request fails, Retry recovers), `?mock=empty` (pages call `mockNetwork.isEmptyMock()`). `index.html` lists them in its "Állapotok" section (one row per screen, chips for slow/error/empty).

**Submitting & validation**

- Forms use `novalidate` and are validated in JS. Never rely on the browser's native `required` bubbles.
- **Input pattern (login is the reference):** a text/number/password field is always `inputModule.renderInput({ icon, ... })` (icon row, label small above the value) inside `inputModule.renderInputStack([...])` (one rounded container, dividers between fields), even for a single field. Never a bare `renderInput` without `icon`, never a custom-styled input. The form is a flex column with `gap: var(--space-14)`: fields stack, then the form-level error banner, then the submit button. Fields without a fitting icon get the closest SF-like one (add it to `modules/icon` if missing). Selection controls (chips/segmented, toggle) sit above the stack with a `.app-input-label` caption.
- Errors are inline, per field, in `--color-negative` (text + icon, not color alone), translated via `t()`: `inputModule.setFieldError(input, msg)` / `clearFieldError(input)`. Form-level errors (wrong password, network) are a `warning` banner above the submit button.
- The submit button shows a progress state and is disabled while "sending": `buttonModule.setButtonLoading(button, true)`. On success give clear confirmation (toast, inline checkmark, or navigation back); on error show an inline message and keep the user's input.
- Toggles, checkboxes, favorites and reactions update immediately with a small animation (no waiting). `price-row` flips its star itself; `onFavoriteToggle` returns `false` to veto (guest).

**Dialogs & toasts**

- Never use `alert()`, `confirm()` or `prompt()`. Use `confirm-dialog` (a confirmation drawer sliding up from the bottom) or `bottom-sheet` — never a centered popup; both sit on the shared `modules/overlay` (blurred backdrop, animated in and out, Esc and backdrop tap close it, focus returns). Destructive actions use `--color-negative`, and the dialog focuses Cancel first. Pages using either link `motion` + `overlay` (js + css) too.
- Short success/info messages: `window.toastModule.showToast({ message, icon })`. It drops in, dismisses itself via a CSS animation delay, and tap dismisses it early.
- A tap must never do nothing: an unfinished feature shows a "coming soon" toast instead of an empty handler.
- Forms live on their own screen or inline, not inside popups, unless the user explicitly asks.

**Layout**

- Mobile-first; desktop shows the app in `iphone-frame`. Every page has `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` and respects `env(safe-area-inset-*)`.
- Body text uses `--font-size-body` (17 px); running text never goes below `--font-size-callout` (16 px). The smaller steps (subheadline, footnote, caption) are for secondary info only. Hierarchy through weight and size, not color alone.

**Code**

- No `setTimeout` for UI sequencing — use `transitionend` / `animationend` (`modules/motion`). Its only allowed use is simulating network delay in `modules/mock-network` (`delay()`, `request()`), never scattered across pages.
- Structure, style and behavior stay separate: HTML in `.html`, styles in `.css`, behavior in `.js`. No inline `style=""` for static values, no inline `onclick` (use `addEventListener`).
- Readable code: clear names, small functions, no clever one-liners.

### Form fields

Every form input needs a `<label>`, not just a `placeholder` — placeholders disappear on focus/input and are not a substitute for a label.

### Style guide

`pages/style-guide/style-guide.html` must stay up to date with the current set of modules. Whenever a module is added, update the style guide to showcase it; whenever a module is removed, remove its section from the style guide. Treat this as part of the module change itself, not a follow-up task.

### File length

Keep files short. If a file is approaching 500 lines, flag it to the user and suggest splitting it (e.g. extracting a sub-component into its own module) instead of letting it keep growing. Exception: `pages/update-history/update-history.html` has no line limit.

### No horizontal scroll

Pages must never produce horizontal scroll. Watch for decorative elements (e.g. background blobs) positioned with negative `left`/`right`/`top` offsets that extend past the viewport edge — the scrollable content container (e.g. `#screen-content`) should set `overflow-x: clip` (not `hidden`) as a safeguard. Setting only `overflow-x: hidden` forces the browser to also treat `overflow-y` as `auto` (a CSS spec rule: one axis can't be `visible` while the other isn't), turning `#screen-content` into its own scroll container — this breaks `position: sticky` on any `bottom-nav` inside it, since it then sticks to that container's own (content-sized) box instead of the real viewport. `overflow-x: clip` avoids triggering that rule.

### Bottom nav pinning

On pages using `bottom-nav` (which is `position: sticky; bottom: 0;`), the content element directly above it inside `#screen-content`'s flex column must have `flex: 1` (all sibling states — loaded, empty, error, etc.) so it fills the remaining viewport height. Without this, short content leaves `bottom-nav` floating right below it instead of pinned to the bottom of the screen.

Main pages render the shared main menu with `bottomNavModule.renderMainNav(activeId)` (items defined once in `MAIN_ITEMS` inside the module), so it is identical everywhere. `renderBottomNav({ items, activeId })` is the generic builder underneath; don't pass a custom items list on app pages.

### Top app bar

Every app page uses `top-appbar` (`modules/top-appbar/top-appbar.js`). The hamburger menu button (built into `top-appbar`, opens `pages/menu/menu.html`) must appear on every page except the login page and the menu page itself — pass `hideMenuButton: true` to omit it there.

Page titles live in the **left slot** of the app bar (`title` option), never as a heading in the page body. On a sub-page (anything not a main-nav destination) a **circled back arrow** sits to the left of the title (`onBack` option). It is a round button with a visible background and ring, not a bare arrow, so it is obvious it can be tapped to go back. Main-nav destinations (Home, Piactér, Bet assist, Edukáció) have no back arrow. Back goes to where the user came from (`history.back()`) unless the page has one fixed parent. Pages with a search field in the bar (search page) keep the back arrow and put the field in the center slot instead of a title.

### iPhone frame

Every page must wrap its content in the `iphone-frame` module so the mockup looks right in a desktop browser without forcing anyone into mobile view. On a real mobile device the frame is skipped and the content renders natively full-width.

Page template:

```html
<body>
  <div id="screen-content">
    <!-- actual page content -->
  </div>

  <script src="../../modules/iphone-frame/iphone-frame.js"></script>
  <script>
    if (!window.iphoneFrame.isRealMobileDevice()) {
      document.body.appendChild(
        window.iphoneFrame.renderIphoneFrame(
          document.getElementById("screen-content"),
        ),
      );
      document.body.classList.add("has-iphone-frame");
    }
  </script>
</body>
```

Also link `modules/iphone-frame/iphone-frame.css` in `<head>`.

Exception: `index.html` (root landing page), `pages/style-guide/style-guide.html`, and `pages/update-history/update-history.html` are meta/overview pages, not app screens — they render full-width and must NOT be wrapped in `iphone-frame`.

### Update history

`pages/update-history/update-history.html` is a table (Date, Version, Change) listing every change made to the codebase, newest entries added at the top. It is a meta/overview page (no `iphone-frame`, see exception above) and is exempt from the [File length](#file-length) line limit — never split or trim it. The page chrome (title, column headers, back button) is translated via `t()` like any other page; the Change column's text stays hardcoded in English regardless of language, since it's a developer-facing log.

Before every `git push`, bump `APP_VERSION` (see App version) and add one row to the top of this table: the current date and time (hour and minute too), the new `APP_VERSION`, and a one-line summary of what changed. Do not add a row on plain `git commit` — only when pushing. Treat this as part of the push itself, not a follow-up task.

Never guess the time: read the local date and time with the `date` shell command right before adding the row.

The page has a back button that always navigates to `index.html` (not `history.back()`).

### Git repository and GitHub user

The git repository root is **this `mockup/` folder**, not its parent `bet-application/` (the parent has no `.git`, so `git` there fails with "not a git repository"). Always run git commands from `mockup/`. Don't conclude "no repo" from the parent folder or the environment's "Is a git repository: false" note.

- Remote: `origin` = `git@github.com:kovendi/bet-application.git` (SSH), branch `main`. Commits go straight to `main` (the existing history does the same), no feature branches unless asked.
- Push as the GitHub user **`kovendi`**: the repo's git identity is `user.name kovendi` / `kovendi@users.noreply.github.com`, and pushes go over SSH with that account's key. The `gh` CLI is logged in as a different account (`levikovendi`); don't use it for pushing and don't switch the remote to HTTPS.
- Commit message: short English summary line, no trailing period.

### App version

`version.js` (project root) assigns `window.APP_VERSION` (e.g. `"v1.0.0"`), loaded via classic `<script>` before any script that reads it. `index.html` shows it next to the Update History link, and `update-history.html` shows it near its header. Bump it on every push, together with the update-history row.

## Charts / TradingView

Every price chart in the real app will be a **TradingView** chart (Lightweight Charts or the TradingView widget/Charting Library). The mockup must therefore only show what TradingView can actually do, so we never design something that cannot be built. The `chart` module imitates the Lightweight Charts look.

- **Supported, design freely:** line, area, candlestick, bar (OHLC) and baseline series; histogram (volume, usually as an overlay under the price); crosshair with price/time tooltip; time-range switching (1N, 1H, 1Hó, 1É, ...); price scale on the right, time scale at the bottom; last-price line and label; markers on the time axis (usable for split/dividend marks, TA_001); themes (dark/light) with custom colors.
- **Not supported, do not design:** donut/pie, radar, treemap, bubble, gauge or any other non-time-series chart; free-form decorations inside the plot; custom animated transitions between chart types. Anything that is not a time series (financial bars per year, valuation ratios, analyst buy/sell counts, target price range, index composition) is **not a TradingView chart**: build it as a plain CSS/HTML visual (bars, progress, table) or a separate non-chart module, and name it that way, not "chart".
- Multi-series comparison is only time series on the same axes (overlay lines). A year-by-year column chart (e.g. the 5-year financials, TA_0011) is a histogram-style series at best: keep it simple, one value per period, no stacked or grouped bars.
- When a requirement asks for a visual that TradingView cannot do, flag it to the user before building and propose a TradingView-compatible alternative.
- **Audit of existing screens (done):** `chart` module (line/area + candle, ranges, crosshair, right price scale) maps 1:1 to Lightweight Charts, used on the product page and in the style guide. `sparkline` (home cards, price rows) is a plain line series with hidden axes, which Lightweight Charts can render with scales and crosshair turned off. The iPhone widgets (`pages/widgets`) are native WidgetKit, so TradingView does not apply there: they need a native mini chart (Swift Charts), and the mockup's sparkline is only a visual reference. The day-range bar and the performance row on the product page are plain CSS, not charts. Nothing built so far needs changing.
- The colors still come from the `--chart-*` tokens (see Brand / Arculat); the real implementation maps them into the TradingView theme options.
- **Reveal on draw:** the chart and the animated sparkline appear with a left-to-right `clip-path` reveal of the whole element, not a stroke animation inside the plot. That is deliberate: the same clip can be animated on the TradingView canvas container, so it stays buildable.

## Currency

The app's currency is **HUF** (Hungarian forint), displayed as `Ft`. Never use any other currency symbol/code.

Money is always stored as an integer number of **forints** (the fillér is no longer in circulation), never as a float — this avoids floating-point rounding errors on sums/comparisons. `modules/money/money.js` is the single place that converts an amount to a display string and back:

- `formatMoney(huf, options)` — forints → `<grouped number> Ft` (e.g. `1 234 Ft`). `options.sign` overrides the +/− prefix (use when the sign comes from context, e.g. win/loss, rather than the stored value); `options.withCurrency: false` omits the trailing ` Ft`.
- `toHuf(value)` — converts a number or numeric string (e.g. from a form input) to an integer number of forints.

Any page/module that stores, formats, or compares a money amount must go through this module rather than reimplementing `toLocaleString` formatting or rounding inline.

## Brand / Arculat

The app follows the Budapesti Értéktőzsde (BÉT) brand identity. Source material lives in `../docs/arculat/`: `Arcluati_kezikony1.pdf` (main brand manual, 2016), `Arculati_kezikonyv_elektronikus_feluletek.pdf` (electronic surfaces, incl. the chart color set) and the two logo PNGs. BÉT confirmed no newer or digital-specific brand material / design system / Figma exists, so these are the reference.

- **Logos:** `01 - BET-egyszerusitett logo-RGB-640px.png` (simplified: navy "BÉT" + gold ring; graphic element only, never replaces the full logo) and `02 - BET logo-RGB-640px.png` (full emblem, "BUDAPESTI BÉT ÉRTÉKTŐZSDE"; use whenever the logo identifies the Exchange). Don't rotate, distort, recolor, outline, crop to another shape or place on a busy background; keep clear space of 1/5 of the emblem width on every side; minimum size 12 mm / 72 px (full) and 8 mm / 24 px (simplified). On the dark navy background the emblem is used as-is.
- **Typeface:** the manual prescribes Myriad Pro and allows Arial / platform system fonts as a substitute. BÉT has not decided on a Myriad Pro license, so the mockup uses the system font stack from `global.css`. Do not embed or reference Myriad Pro.
- **Brand colors** (from the manual, `RGB`):
  - MNB kék (navy): `#232157` (35 33 87), tints 70/50/30/10/5 %
  - MNB arany (gold): `#BA8C5D` (186 140 93), tints 70/50/30/10/5 %
- **Chart color set** (electronic-surfaces manual p. 35–37, "Diagramok, grafikonok"): 3 groups (primary / secondary / supplementary) × 7 steps from dark to light, with exact RGB/CMYK on p. 36. Use it for every chart/diagram instead of inventing colors. Single-series / monochrome: the blue ramp `#00142A`, `#002955`, `#003D80`, `#0051AA`, `#3374BB`, `#6697CC`, `#99B9DD`. Multi-series: `#0051AA` (blue), `#232151` (navy), `#BA8C5D` (gold), `#0F809A` (teal), `#ED6B6A` (coral), `#BBC761` (lime), `#00B1B9` (cyan), `#A04863` (plum), `#3A956C` (green). These live in `global.css` as `--chart-1…9` and `--chart-grid`; dark mode uses lighter blue steps for `--chart-1`/`--chart-2`, because the darkest blues fail contrast against `--color-card-background`. Need another one? Add it as a `--chart-*` token in both themes.
- **Presentation-style accents:** the manual's 1.5 pt gold line between a title and its content may be echoed sparingly (`--color-accent`). Headings use `--color-text-main`, not navy (navy text is unreadable in dark mode, see Color Palette).

## Color Palette

Both themes are first-class: the tender (B_001) requires dark/light selection with the **device setting as default**, so every screen must be checked in dark and light. Every token is defined for both in `global.css`. All values below are taken from the brand manual's color sets and pass WCAG AA (4.5:1) for text on `--color-card-background` and `--color-background`.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--color-background` | `#090814` | `#EFEFF5` | app screen background (light is a cool off-white so white cards lift off it) |
| `--color-card-background` | `#1A193D` | `#FFFFFF` | cards, inputs, sheets (subtle border/shadow, no pure black shadow in dark) |
| `--color-text-main` | `#F4F4F7` | `#121129` | titles, button labels, key info (never pure white/black) |
| `--color-text-secondary` | `#A7A6B9` | `#4F4D74` | dates, stats, descriptions, inactive nav, disclaimers |
| `--color-primary` | `#6697CC` | `#232157` | active nav, links, selected states, progress fill, key figures |
| `--color-accent` | `#BA8C5D` | `#BA8C5D` | primary CTAs (button background), brand gold |
| `--color-on-accent` | `#121129` | `#121129` | text/icons on `--color-accent` (white on gold fails contrast) |
| `--color-highlight` | `#D6BA96` | `#8B6946` | badges, small icon accents, gold text — sparingly, not for large surfaces |
| `--color-positive` | `#61AA89` | `#2C7051` | price gains, positive change, success |
| `--color-negative` | `#ED6B6A` | `#B25050` | price losses, errors, warnings |
| `--color-brand-surface` | `#232157` | `#232157` | brand navy as a *surface* (carousel slides, header bands), same in both themes |
| `--color-on-brand` | `#F4F4F7` | `#F4F4F7` | text/icons on `--color-brand-surface` |
| `--color-on-primary` | `#121129` | `#F4F4F7` | text/icons on `--color-primary` (active chip, selected day, default dialog button) |
| `--color-on-negative` | `#121129` | `#F4F4F7` | text on `--color-negative` (destructive dialog button) |
| `--color-separator` | `rgba(167,166,185,.18)` | `rgba(79,77,116,.16)` | hairlines, dividers, outline buttons |
| `--color-card-border` | `rgba(244,244,247,.06)` | `rgba(18,17,41,.06)` | subtle edge on cards, inputs, bars |
| `--color-hover` / `--color-pressed` | `rgba(244,244,247,.05/.09)` | `rgba(18,17,41,.04/.08)` | row/icon-button hover and press tint |
| `--color-skeleton` / `-shine` | `rgba(167,166,185,.14)` / `rgba(244,244,247,.08)` | `rgba(79,77,116,.10)` / `rgba(255,255,255,.6)` | loading placeholders |
| `--color-backdrop` | `rgba(4,3,12,.55)` | `rgba(18,17,41,.30)` | dialog/sheet backdrop (with `--backdrop-blur`) |
| `--color-toast-background` | `rgba(38,37,82,.92)` | `rgba(18,17,41,.90)` | toast pill (text: `--color-on-brand`) |
| `--color-knob` | `#FFFFFF` | `#FFFFFF` | toggle knob (iOS style) |
| `--color-glass` / `--color-glass-border` | `rgba(26,25,61,.72)` / `rgba(244,244,247,.08)` | `rgba(255,255,255,.78)` / `rgba(35,33,87,.08)` | frosted floating surfaces (bottom nav), with `--backdrop-blur` |
| `--color-brand-deep` | `#15143B` | `#15143B` | lower end of the brand hero gradient (from `--color-brand-surface`) |
| `--color-glow-gold` / `--color-glow-blue` | `rgba(186,140,93,.5)` / `rgba(102,151,204,.42)` | same | blurred decorative glows (hero, login, AI orb), never behind the logo |

Rules:

- `--color-positive` / `--color-negative` are for market direction and status only; never use them for decoration or brand elements. Never rely on color alone for a price change — also show the sign (+/−) or an arrow, for accessibility (NFK_003).
- The navy `#232157` is too dark to read on the dark background, so `--color-primary` switches to the lighter brand blue `#6697CC` in dark mode. Use the real brand navy as a *surface* (e.g. the emblem background, a header band), not as text, in dark mode.
- Don't hardcode hex values in pages or modules — use the tokens (`var(--color-…)`). Chart colors use `--chart-*` tokens (see Brand / Arculat).
- The color tokens in `global.css` are exactly this table plus the `--chart-*` tokens (spacing, type, motion etc. are separate tokens, see Premium UI → Design system first). Dark is the base; light applies via `prefers-color-scheme` unless the user chose a theme by hand: `modules/theme/theme.js` (`window.theme`, `initTheme()` in `<head>` of every page, `setTheme('system'|'dark'|'light')`) sets `data-theme` on `<html>`. The light values therefore exist twice in `global.css` (media query + `[data-theme="light"]`) — change both. Text on `--color-accent` uses `--color-on-accent`.
- **Dark islands:** the color tokens are declared on `:root, .theme-dark`. Adding `theme-dark` to an element gives its whole subtree the dark tokens in both themes; use it for anything sitting on the brand navy (home hero band, `top-appbar` with `tone: "brand"`), so modules inside (market-status, skeleton, change colors) stay readable without page-specific overrides.
- Shadows: `--shadow-card` (cards), `--shadow-popover` (sheets, dialogs), `--shadow-floating` (floating bars, the hero band); all tinted navy, never pure black.
- If a token value changes, change this table in the same edit.

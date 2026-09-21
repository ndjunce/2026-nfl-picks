# Picks site — pull picks from a public Google Sheet (spec for EDIT chat)

## Goal
Instead of Nick generating `picks.js` via admin.html + git push each week, let the picks site **pull picks live
from a public Google Sheet** on load — the same "refresh from a live source each load" pattern the trade tool uses
with Sleeper. Nick (or the group) updates the sheet; the site reflects it without a commit/deploy.

## How (the workable approach — honest)
A public Google Sheet can be read WITHOUT auth in a couple of ways; pick the simplest that works:
- **Option A (recommended): published CSV.** File → Share → Publish to web → CSV. Gives a stable URL the browser
  can `fetch()` directly (CORS-friendly). Parse CSV → picks structure. No API key, no secret.
- **Option B: gviz endpoint** `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:json&sheet=<name>` —
  also keyless, returns JSON-ish (needs a small parse to strip the wrapper). More columns/flexibility.
- **Option C: Google Sheets API v4** — needs an API key (a mild secret) + the sheet shared readable. More power but
  more setup; only if A/B are too limiting. Prefer A/B (no secret) for a static GitHub Pages site.

## FREEZE POINT (safety)
Current working site frozen at tag **`good-picks-presheet` → 34beda0** (pushed to origin). Build the sheet feature on
the SAME repo; if anything breaks, `git reset --hard good-picks-presheet` restores the live site. The design is also
self-recovering: picks.js stays as the automatic fallback, so a sheet failure never breaks the live page.

## ***UPDATE — OPTION 2: ALL-WEEKS, ONE TAB PER WEEK (Nick's choice)***
Nick wants the sheet to hold the WHOLE SEASON with ONE TAB PER WEEK (Week 1 tab, Week 2 tab, ...), mirroring the
site's Week 1..18 tabs. Drives BOTH the current week (live) AND archived week tabs. Unifies picks.js + season.js
into one sheet source.
- **Layout: ONE TAB PER WEEK.** Tab named e.g. "Week 1", "Week 2". Each tab uses the same columns:
  `team1 | team2 | Nick | Clyde | Chet | Henry | Riley | Bobby` (no `week` column needed — the TAB is the week),
  plus a TIEBREAKER row at the bottom of each tab.
- **Reading tabs as CSV:** each tab has its own numeric `gid`. Per-tab CSV URL =
  `https://docs.google.com/spreadsheets/d/1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw/export?format=csv&gid=<GID>`
  (base sheet id confirmed: `1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw`; Nick set "Anyone with link → Viewer").
  - EDIT CHAT: build a `SHEET.weeks` config mapping week number → gid (Nick provides each tab's gid from its URL when
    he opens that tab — the `gid=` in the address bar). OR, better, discover tabs via the gviz/sheets metadata if
    feasible keylessly; if not, the week→gid config map is the reliable path. Decide + document what Nick must supply.
  - Fetch the CURRENT week's tab for live; fetch past weeks' tabs to populate archive tabs; missing tab → "not entered yet."
- **Winners/results:** sheet is PICKS-only (+ tiebreaker). Winners come from ESPN (live/finalized current week; by-week
  for past weeks) — same grading as now. NO winner column; don't make Nick enter results.
- **FALLBACK:** if a tab fetch/parse fails, fall back to picks.js (live) + season.js (archive) as today. Never blank.
  Freeze tag good-picks-presheet → 34beda0 = rollback.

## FANCY DATA ENTRY — dropdowns (Nick sets up in the Sheet; site just reads the result)
Nick wants to pick teams via dropdown, not typing. Google Sheets DATA VALIDATION does this (a you-set-up-in-sheet
feature, not site code):
- Select a game's pick cells → Data → Data validation → Dropdown → list the valid options → Done. Cells become a
  click-to-pick dropdown; no typos.
- Best practice: each game's pick dropdown offers just that game's two team abbreviations (team1/team2).
- HONEST LIMIT: Google Sheets dropdowns are TEXT ONLY — you CANNOT put clickable team-LOGO images inside a dropdown.
  So dropdowns = team ABBREVIATIONS (NE, SEA). (A separate `=IMAGE(...)` cell could show a logo based on the pick, but
  that's display-only decoration; the site reads the abbreviation regardless. Not required.)
- The site reads whatever text the cell ends up holding (the abbreviation) — dropdowns don't change the parser.
- EDIT CHAT: provide short instructions (in README) for Nick to add per-game dropdowns; optionally generate the
  validation-friendly template. The parser must still accept plain abbreviations (dropdown or typed).

## Nick to do (once): Week 1 tab too + tab gids
Add a "Week 1" tab (Week 1 games+picks, from season.js) so the archive reads from the sheet. Edit chat regenerates a
template (Week 1 + Week 2) and tells Nick how to grab each tab's `gid` for the week→gid config.

## Sheet layout — CONCRETE SCHEMA (so Nick's sheet + the parser match exactly)
One tab per approach; recommend ONE row per game. Proposed columns (header row must match exactly):
```
week | team1 | team2 | Nick | Clyde | Chet | Henry | Riley | Bobby
```
- `week` = integer (all rows for a week share it; or one sheet/tab per week — edit chat picks the simpler parse).
- `team1`/`team2` = NFL abbreviations (e.g. NE, SEA) matching what the render/ESPN matching already uses.
- Each player column = that player's pick for the game (an abbreviation matching team1 or team2), blank = no pick.
- **Tiebreaker:** a dedicated row where `team1`="TIEBREAKER" (or a separate small block), with each player's numeric
  predicted total in their column, plus the tiebreaker game teams. Edit chat: define the exact tiebreaker
  convention and DOCUMENT it in the sheet (a header note row) so Nick fills it correctly.
- Players list is fixed: Nick, Clyde, Chet, Henry, Riley, Bobby (same as current picks.js).
- EDIT CHAT: after building, produce a TEMPLATE (either a sample CSV in the repo or exact instructions) so Nick can
  create the Google Sheet in this precise layout, then publish it and hand back the URL.

## Behavior
- On load, fetch the published sheet (Option A/B), parse into the same structure `window.PICKS` uses today, then
  feed the existing render/leaderboard/Path-to-Win code UNCHANGED. Live scores from ESPN stay as-is.
- Cache/last-good: if the sheet fetch fails, fall back to the last committed `picks.js` (or last good fetch) so the
  page never blanks — same resilience the site already has with ESPN.
- Keep admin.html as a fallback entry method; the Google Sheet becomes the primary weekly input.

## Honest tradeoffs to tell Nick
- PRO: no weekly git push; anyone with sheet edit access can enter picks; instant updates.
- CON: the sheet must stay PUBLIC-readable (published) — fine, it's just game picks, nothing sensitive.
- CON: parsing is only as reliable as the sheet's format — if someone changes columns/typos a team abbr, the parse
  can break. Add light validation + a clear expected-format note. This is the main risk vs the controlled admin grid.
- The current git/commit "receipt" trail goes away for sheet-entered weeks; the sheet's own version history is the
  new receipt. Acceptable, just note it.

## Scope / guardrails
- Static site, no backend, no secret (Option A/B). Mobile-first, view-only for friends (unchanged).
- Reuse ALL existing render/leaderboard/Path-to-Win logic — only swap the DATA SOURCE (picks.js → sheet fetch,
  with picks.js as fallback). Keep it a clean, reversible change.
- Weekly archive (season.js) still applies — a finished week can still be archived as before.


## FUTURE IDEAS (Nick, 2026-09-16) — schedule-populated tabs + Google Apps Script
Sheet is titled "Phipps Tavern 2026 Picks".

### Idea A — all week tabs clickable + show that week's NFL schedule
Make every week tab (1-18) clickable; a future week with no picks yet still shows that week's NFL SCHEDULE (the
matchups) pulled from ESPN's schedule endpoint (by week), so tapping "Week 8" shows the Week 8 games even before
picks are entered. (Weeks with picks already render; this adds schedule-only display for un-entered weeks.) Small
separate build.

### Idea B — Google Apps Script (RECOMMENDED "fancy" path, bigger build)
Apps Script = free code running inside the Google Sheet. Unlocks a much nicer workflow than raw CSV+gids:
- AUTO-FILL each week's NFL schedule into a new tab (script pulls week matchups from ESPN, writes team1/team2 rows) →
  Nick doesn't hand-type games, just picks winners via dropdowns.
- PUBLISH the whole sheet as ONE JSON URL (Apps Script web app / doGet) → the site reads one URL for ALL weeks
  instead of juggling a gid per tab. Cleaner than the export-CSV-per-tab model.
- Could auto-create the per-game dropdowns (data validation) too.
TRADEOFFS (honest): a real script to write + deploy; Nick authorizes it once (simpler than Yahoo OAuth); bigger build
than the CSV path. If Nick will use this sheet all season, Apps Script is the better long-term workflow. NOT a
tonight task — proper build, and interview tomorrow. Decide CSV-now vs Apps-Script-upgrade later.

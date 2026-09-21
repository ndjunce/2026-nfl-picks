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

## ***UPDATE — OPTION 2: ALL-WEEKS in ONE sheet (Nick's choice)***
Nick wants the ONE sheet to hold the WHOLE SEASON (all weeks), driving BOTH the current week AND the archived week
tabs — mirroring the site's existing Week 1..18 tabs. This UNIFIES what's currently split across picks.js (live week)
+ season.js (archive) into a single sheet source.
- **Layout: ONE tab, ALL rows** (recommended over one-tab-per-week — single CSV URL, simplest). Every game for every
  week is a row; the `week` column distinguishes them. Nick keeps adding rows as weeks happen.
- **Parser must:** read ALL rows, GROUP by `week`. For each week build the picks structure. The site then:
  - Uses the CURRENT NFL week's rows as the live week (ESPN live scores as now).
  - Uses PAST weeks' rows to populate the archived week tabs (replacing/augmenting season.js — see fallback note).
  - Future weeks with no rows yet → tab shows "not entered yet" (as now).
- **Live sheet URL (Nick's, confirmed real Google Sheet):**
  `https://docs.google.com/spreadsheets/d/1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw/export?format=csv`
  (Nick set/confirm "Anyone with the link → Viewer" so the export CSV is publicly fetchable.)
- **Tiebreaker per week:** the TIEBREAKER row must carry the `week` too, so each week's tiebreaker is grouped correctly.
- **Winners/results:** the sheet holds PICKS (+ tiebreaker). Game WINNERS still come from ESPN live/finalized (current
  week) and, for past weeks, from ESPN by that week — same grading the site already does. The sheet is picks-only;
  it does NOT need a winner column (don't make Nick enter results).
- **FALLBACK (keep it safe):** if the sheet fetch/parse fails, fall back to the existing picks.js (live week) +
  season.js (archive) exactly as today. Never blank. The freeze tag + these fallbacks = fully reversible.

## Nick to do (once): put Week 1 rows into the sheet too
For a full-season sheet, Week 1's games+picks should be added as rows (week=1) alongside Week 2, so the archive tab
reads from the sheet. (Week 1 data exists in season.js already — can be transcribed, or the edit chat can generate an
updated SHEET_TEMPLATE.csv containing BOTH weeks for Nick to re-import.) EDIT CHAT: regenerate the template with
Week 1 + Week 2 rows so Nick just re-imports the full-season starter.

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

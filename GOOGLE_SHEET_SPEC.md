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

## Sheet layout (define a clear schema Nick fills in)
One row per game, columns: week, team1, team2, then one column per player (Nick, Clyde, Chet, Henry, Riley, Bobby)
holding that player's pick, plus a tiebreaker row/section. Keep it close to the current `picks.js` shape so the
render layer barely changes. Document the exact expected columns in the sheet + a note on the site.

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

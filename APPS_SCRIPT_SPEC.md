# Picks site — Google Apps Script workflow (BUILD spec for EDIT chat)

Sheet: "Phipps Tavern 2026 Picks" (id 1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw). Used ALL SEASON — so build the
nicer Apps-Script-powered workflow instead of raw CSV+gids. Freeze tag `good-picks-presheet` → 34beda0 = rollback.
picks.js + season.js stay as automatic fallback (never blank).

## THE WORKFLOW (what Nick gets)
1. Nick opens the sheet → picks winners via per-game DROPDOWNS (one tab per week).
2. A Google Apps Script bound to the sheet publishes it as a WEB APP (doGet) returning JSON of ALL weeks' picks.
3. The picks SITE fetches that ONE JSON URL on load → picks auto-appear on the site. NO git push, NO admin.html.
   Enter in sheet → site updates. (Site reads the URL each load, same live-source pattern as the trade tool.)

## PART 1 — Apps Script (lives in the Sheet: Extensions → Apps Script)
Write `Code.gs` with:
- **`doGet()`** — reads every week tab, returns JSON: `{ weeks: { "1": {games:[{team1,team2,picks:{player:pick}}],
  tiebreaker:{player:total}, tiebreakerGame:{team1,team2}}, "2": {...} }, players:[...], season:2026 }`.
  Deployed as a Web App (Execute as: me; Who has access: Anyone) → gives a stable `https://script.google.com/macros/s/.../exec` URL.
- **`buildWeekSchedule(week)`** — a menu function that pulls that week's NFL matchups from ESPN's public scoreboard
  (`site.api.espn.com/.../scoreboard?week=N&seasontype=2&dates=2026`) and WRITES team1/team2 rows into (or creates)
  the "Week N" tab — so Nick never hand-types games, just picks winners.
- **`addDropdowns(week)`** — sets Data Validation on each game's player-pick cells to that game's two team abbrevs
  (so entry is click-only, no typos). Run after buildWeekSchedule.
- A custom menu ("Picks Tools") wiring buildWeekSchedule + addDropdowns for easy per-week setup.
- (OPTIONAL bonus) an `=IMAGE()` logo cell next to each pick in the sheet for looks — display-only, not required.

## PART 2 — Site reads the Apps Script JSON
- Replace/augment the current one-tab-CSV `SHEET` config with a single `SHEET.jsonUrl` = the Apps Script web-app
  `/exec` URL. On load, fetch it, parse the `weeks` object → drive the live week (current) + archived week tabs
  (past), exactly like the current one-tab-per-week model does, but from ONE URL instead of per-gid CSVs.
- Winners still come from ESPN (live/finalized current week; by-week grading for past weeks) — sheet is picks-only.
- FALLBACK to picks.js + season.js if the JSON fetch/parse fails. Never blank.
- LOGOS: the SITE already renders team logos next to picks (existing `.logo`/teamChip). So a text pick like "SEA"
  shows the Seahawks logo on the site automatically — no dropdown-logo needed. Confirm that still works with
  sheet-sourced picks.

## Setup steps Nick will do (once) — edit chat must document these clearly
1. Sheet → Extensions → Apps Script → paste `Code.gs` → Save.
2. Deploy → New deployment → type Web app → Execute as me, Access Anyone → Deploy → authorize (one-time Google
   consent) → copy the `/exec` URL.
3. Hand the `/exec` URL back → edit chat wires `SHEET.jsonUrl` + tests live.
4. Use "Picks Tools" menu each week: buildWeekSchedule(N) → addDropdowns(N) → pick winners.

## Guardrails
- Static site + Apps Script web app; no secret in the site (the /exec URL is public-read, picks only — fine).
- Reuse ALL existing render/leaderboard/Path-to-Win + ESPN grading. Only the DATA SOURCE changes (→ Apps Script JSON),
  with picks.js/season.js fallback. Reversible (freeze tag).
- Honest: parse only as reliable as the sheet format; wrong tab/format → that week falls back, site never breaks.
- EDIT CHAT: provide the full `Code.gs` for Nick to paste, plus exact deploy instructions, plus the site-side reader.

## Status
BUILD-READY. Two parts: (1) Code.gs + deploy instructions for Nick, (2) site-side JSON reader. Nick deploys the
script + hands back the /exec URL for wiring. Decided over CSV-per-gid because the sheet is a season-long workflow.

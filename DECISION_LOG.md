# Decision Log — NFL Pick'em (2026-nfl-picks)

Append-only log of changes, decisions, and outcomes for this project.
Live: https://ndjunce.github.io/2026-nfl-picks/ (GitHub Pages, `main` branch, root).
Source of truth: local clone at `C:\Users\ndjun\OneDrive\Desktop\nfl-picks-tracker` ↔ GitHub `ndjunce/2026-nfl-picks`.
Stack: static HTML/JS/CSS. Picks live in `picks.js` (`window.PICKS`), generated via `admin.html`, committed by hand.

---

## 2026-08-13 — Established source of truth + created this log
- Confirmed the local folder IS the git clone of `ndjunce/2026-nfl-picks`, in sync with `origin/main` (HEAD 34cf85a). Live GitHub Pages serves from this repo (HTTP 200 verified). No second divergent copy to reconcile.
- **Decision (item 1):** stay on **GitHub Pages, skip Vercel** for now. Live-saving picks (a backend feature) is a convenience, not needed this season; the commit-a-file flow (`admin.html` → `picks.js` → git commit/push) stays. Vercel only becomes worth it if/when live-saving is wanted (would migrate the whole site to Vercel then, like the fantasy-dashboard project).
- **Skipped for now:** item 2 (live-saving backend) and item 3 (admin password gate).
- **Front-end work queue (approved order):** item 6 dark-logo readability → item 5 path-to-win readability → item 4 stats additions.
- Created `DECISION_LOG.md` (this file). This site is on the resume/LinkedIn — keep it clean and professional; verify each change live before calling it done.

## 2026-08-13 — Baseline tag + Item 6: dark-logo readability (circular light chip)
- **Froze baseline:** annotated tag `good-2026-picks-baseline` → commit `34cf85a` (pushed to remote, verified via `git ls-remote --tags`). Rollback: `git reset --hard good-2026-picks-baseline && git push --force origin main` (only on explicit request).
- **Item 6 (CSS only):** dark-primary team logos (NYG, BAL, CHI, NE, JAX, LV…) were blending into the dark bg. Added a light chip behind every logo — `background:#f2f4f8; border-radius:50%; padding:2px; box-shadow:0 0 0 1px rgba(255,255,255,.18)` — on `.logo` (index.html, inherits to all size variants) and `.tlogo` (stats.html). Logos are designed for white, so all 32 read cleanly. No markup/JS/data touched; text-abbr fallback unaffected. Rejected alternatives: outline-only (still muddy on navy), dark-variant logos (no reliable CDN variant per team).
- Verified: both files' JS still parses. Live verification after push.

### Item 6 — outcome (live-verified)
- Push initially rejected: remote had a new commit `c3926d9 "Rename site to 2026 Picks"` (title change) made after the baseline, touching the same files. Rebased my logo-fix commit on top (clean, no conflicts) so BOTH survive — did NOT force-push over the rename. Final history: `0518578` (logo chip) → `c3926d9` (rename) → `34cf85a` (tagged baseline).
- **Live verified** (headless, https://ndjunce.github.io/2026-nfl-picks/): 178 logos render with the chip (`background rgb(242,244,248)`, `border-radius 50%`, `padding 2px`); dark team (NE) confirmed sitting on the light chip; title now "2026 Picks". Item 6 DONE.
- Note: someone/another machine pushes to this repo (the rename); always `git fetch` + rebase before pushing future changes here.

### Item 6 v2 — stronger chip + bigger small logos (live-verified on NYG/DAL)
- Base `.logo` (index.html) + `.tlogo` (stats.html): chip now **pure white `#ffffff`**, **padding 3px**, **dark defining ring `box-shadow:0 0 0 1px rgba(0,0,0,.15)`** (was #f2f4f8 / 2px / faint white ring). Small logos bumped to **20px**: `.pn-need-g .logo` + `.mm-g .logo` (desktop + mobile blocks), stats `.tlogo` 18→20. CSS only.
- Fetch showed no external commits this time; clean push `7e19f3a..031fea7`.
- **Live-verified on the actual NYG-over-DAL row** (Chet's games-that-matter, text "NYG root NYG (over DAL)"): that NYG logo computes width/height 20px, background rgb(255,255,255), border-radius 50%, padding 3px, box-shadow rgba(0,0,0,.15) 0 0 0 1px. All approved values confirmed on the real row (not a generic render).
- Pending user judgment: if the white chip feels too loud, dial to light-gray `#f7f8fa` (one-line change, both files).

## 2026-08-13 — Item 5: Path-to-Win readability (full 5) — live-verified
Restore point before this: tag `good-2026-logos-done` (bc9807f). This change is `5dd5925`.
- **De-boxed** the "games that matter" mini-list: removed the `.mm` card chrome (blue bg / border / left-accent / padding) → tight indented sub-list under the player name (no card-in-a-card).
- **Tightened rows:** avatar 44→36px, list gap 8→6, row gap 11→9, padding 10/12→8/10, name 16→15px.
- **Short intensity tags** replace wordy phrases: 🔥 must-win / ⚠️ big / · minor (colored red/yellow/muted); full phrase kept in the row `title` tooltip.
- **Plain phrasing, no chevron** (per user): `root NYG (over DAL)` → `[logo] NYG over DAL`. Rejected `›` to avoid reading as "vs".
- **One compact line per game.** CSS + template only; no math/ranking/data touched (computePathToWin/mattersToMe unchanged).
- **Live-verified** (headless, cache-disabled, on the real NYG-over-DAL row): `.mm` bg rgba(0,0,0,0) / border 0 / pad 0 (de-boxed), avatar 36px, tag "big", row text "NYG over DAL", no chevron, 6 player rows. 
- GitHub Pages CDN took ~1-2 min to rebuild after push (verify waited for `.mm-tag` to appear in the raw CDN file, then re-rendered with Network.setCacheDisabled to beat browser cache). Rollback if disliked: `git reset --hard good-2026-logos-done && git push --force origin main`.


## 2026-09-16 — BUG FIX: Week 1 tab greyed out after advancing to Week 2 — FIXED + pushed
**Symptom (Nick, w/ screenshot):** live site showed "Week 2" as current, Week 1 tab greyed/unclickable — Week 2 "took Week 1's spot."
**Root cause (confirmed via git):** commit `78e0dbe "Week 2 2026 picks"` bumped `picks.js` to `week:2` (so LIVE_WEEK=2), but Week 1 was NEVER archived to `season.js` (that file was still just the commented example). `weekHasData(n)` returns true only if n===LIVE_WEEK OR n is in the season.js archive with games[]. So Week 1 (not live, not archived) greyed out. This is a design gap: advancing weeks does NOT auto-archive the prior week — it must be added to season.js `weeks[]` or it vanishes from the UI.
**Fix:** pulled Week 1 2026 FINAL results from ESPN (all 16 games final), graded vs the Week 1 picks, and added a full Week 1 entry to `season.js` weeks[] (results W-L, tiebreaker, tbActual=41 DEN/KC total, and per-game winner+picks). Verified: season.js parses clean (node), `weekHasData(1)` now true (clickable), Week 2 stays live, Week 3+ correctly greyed. Week 1 standings: Bobby 12-4 (win, Nick-confirmed), Nick 11-5, Chet 11-5, Clyde/Henry/Riley 9-7.
**Local sync note:** local was behind origin (didn't have the Week 2 commit); fast-forwarded local to origin first, then added the archive on top. Commit `16623b5`, pushed to origin/main (token was stale mid-session; Nick regenerated the PAT, push then succeeded). Pages will rebuild.
**FOLLOW-UP (process gap to fix later):** the admin week-advance flow should AUTO-archive the outgoing week into season.js so this never recurs. Logged as a known issue — right now archiving is manual and was missed when Week 2 was entered. Temp script `_build_week1_archive.mjs` used to generate the entry, then deleted.


## 2026-09-16 — Path to Win: added "How the win % is calculated" explainer — DONE + pushed
Nick wanted the win-% methodology visible to the league. Added a collapsible `<details>` box (`.pct-explain`) below the Path-to-Win banner, above "Each player's path". Content = full plain-English breakdown: odds hierarchy (ESPN live win% → pregame spread via logistic curve 50-92% cap → live score/time heuristic → 50/50), exact 2^k enumeration over undecided games, per-scenario prob = product of chosen-side probs, tally correct picks + tiebreaker (DEN/KC total) to pick each scenario's winner, player win% = sum of prob of scenarios they win; accounts for BOTH other players' picks AND the odds; 🔥/⚠️/· tags = win-share swing per game; honest limits (assumes game independence, spread→prob is approximate, labeled ESTIMATE, flags when no odds source). Collapsed by default (doesn't push picks down). CSS-only + one render insertion; inline script still parses clean (node). Commit `6819324`, pushed origin/main (0/0 sync confirmed). Pages rebuild.


## 2026-09-16 — NEW spec queued: pull picks from a public Google Sheet
Nick wants the picks site to pull picks LIVE from a public Google Sheet on load (like the trade tool refreshes from Sleeper) instead of the admin.html→picks.js→git-push flow. Approach: publish the sheet to web as CSV (Option A, keyless, CORS-friendly) or use the gviz JSON endpoint (Option B); fetch + parse into the same `window.PICKS` structure so the existing render/leaderboard/Path-to-Win code is unchanged. Fallback to committed picks.js if the fetch fails (never blank). Keep admin.html as backup input. Honest tradeoffs: no weekly push + anyone with sheet access can enter, BUT sheet must stay public-readable + parse is only as reliable as the sheet format (add validation + format note) + git "receipt" trail replaced by sheet version history. Static, no backend, no secret. Spec: `GOOGLE_SHEET_SPEC.md`.


## 2026-09-16 — Google Sheet picks: froze current site + finalized schema before build
Nick wants the Google Sheet picks feature but to protect the working site. DECISION: Option A (freeze tag + build on same repo) over a separate site — because the design already keeps picks.js as an automatic fallback (sheet failure never blanks the page), so a freeze tag fully covers the risk without the overhead of maintaining two sites/URLs. Froze current working commit as tag `good-picks-presheet` → 34beda0 (pushed to origin) = instant rollback. Updated `GOOGLE_SHEET_SPEC.md` with a CONCRETE column schema (week|team1|team2|Nick|Clyde|Chet|Henry|Riley|Bobby + a TIEBREAKER row convention) so Nick's sheet and the parser match exactly, and asked the edit chat to produce a template + instructions so Nick can build the sheet, publish it, and hand back the URL. TWO-PARTER (like Yahoo): edit chat builds reader + template (placeholder URL) → Nick creates+publishes sheet → edit chat wires real URL + tests. picks.js fallback + admin.html retained.


## 2026-08-13 — Google Sheet picks source (Option A: published CSV) — WORKS (URL pending from Nick)
Per GOOGLE_SHEET_SPEC.md. Site now pulls picks LIVE from a published public Google Sheet on load, parsed into the SAME window.PICKS structure so ALL render/leaderboard/Path-to-Win code is UNCHANGED — only the data SOURCE swaps. picks.js stays the automatic fallback (never blanks); admin.html remains a backup. Freeze point: good-picks-presheet -> 34beda0 (rollback via git reset --hard).

**Approach:** Option A (published CSV, File→Share→Publish to web→CSV) — keyless, CORS-friendly, no secret, right for static GitHub Pages. Rejected Option C (Sheets API v4) = needs an API key.

**Added (index.html):** `SHEET` config (csvUrl placeholder "" + season + players); `parseCSV()` (RFC-4180-ish: quoted fields, commas, CRLF, BOM); `parseSheetToPicks()` -> window.PICKS shape (throws on missing column / no rows so caller falls back); `loadPicksFromSheet()` (fetch+parse, returns null on ANY failure). boot() made async: awaits the sheet, overrides window.PICKS on success, else keeps picks.js; LIVE_WEEK/selectedWeek finalized AFTER PICKS settles (sheet can set a different week); small `#srcNote` badge shows "live Google Sheet" vs "picks.js (committed)".

**Schema (documented in README + SHEET_TEMPLATE.csv):** header `week,team1,team2,Nick,Clyde,Chet,Henry,Riley,Bobby`, one row per game, team abbrevs = scoreboard abbrevs. Tiebreaker = a row with team1="TIEBREAKER" holding each player's numeric total; **tiebreaker game = the LAST game row** (same convention picks.js uses). SHEET_TEMPLATE.csv seeded with the current Week 2 picks so it matches the live site 1:1.

**Verified (node):** page JS parses clean; template CSV parses to PICKS and matches committed picks.js field-for-field (16 games + tiebreakerGame NYG/LAR + tiebreaker values); invalid sheets (missing player col / garbage) throw -> fallback; no-URL -> loadPicksFromSheet() returns null (site behaves exactly as pre-change until wired); quoted-comma CSV field parsed correctly. Removed scratch.

**PENDING:** csvUrl is "" — Nick creates the sheet from SHEET_TEMPLATE.csv, publishes as CSV, hands back the URL; then wire SHEET.csvUrl + test live. Commit ndjunce/noreply. Blast radius: index.html data-source + boot + one note span; README + new template. Zero change to render/grade/Path-to-Win/ESPN/archive logic.


## 2026-09-16 — Google Sheet picks = OPTION 2 (all-weeks in one sheet), unifies picks.js + season.js
Nick chose Option 2: ONE Google Sheet holds the WHOLE SEASON (all weeks), driving BOTH the live current week AND the archived week tabs (mirrors the site's Week 1..18 tabs). Layout = ONE tab, ALL rows, distinguished by the `week` column (recommended over tab-per-week: single CSV URL). Parser groups rows by week; current NFL week = live (ESPN scores), past weeks = archive tabs, future = "not entered yet". Winners still come from ESPN (sheet is picks-only, no winner column — don't make Nick enter results). Tiebreaker row must carry `week`. FALLBACK to picks.js + season.js if sheet fails (never blank); freeze tag good-picks-presheet → 34beda0 = rollback. Nick's real sheet CSV URL captured in spec (export?format=csv; set Anyone-with-link Viewer). Edit chat to: (1) update parser to all-weeks group-by-week, (2) wire the real URL, (3) regenerate SHEET_TEMPLATE.csv with BOTH Week 1 + Week 2 rows so Nick re-imports a full-season starter. Updated `GOOGLE_SHEET_SPEC.md`.

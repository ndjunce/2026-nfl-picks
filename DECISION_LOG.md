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


## 2026-09-16 — Google Sheet picks: switched to ONE TAB PER WEEK + dropdown data entry
Nick refined: (1) ONE TAB PER WEEK (not one big tab) — mirrors the site's week tabs. Each tab = team1|team2|Nick|Clyde|Chet|Henry|Riley|Bobby + tiebreaker row; NO week column (tab = the week). Per-tab CSV read via export?format=csv&gid=<GID>; edit chat builds a week→gid config (Nick supplies each tab's gid from its URL) or discovers tabs keylessly if feasible. Base sheet id 1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw. Fetch current-week tab (live) + past tabs (archive); fallback to picks.js+season.js. (2) DROPDOWN entry via Google Sheets Data Validation (Nick sets up in-sheet; per-game dropdown of the 2 team abbreviations, no typos). HONEST LIMIT logged: Sheets dropdowns are TEXT ONLY — can't put team-logo images in a dropdown; abbreviations only (optional =IMAGE() cell is display-only decoration). Parser reads the abbreviation regardless. Winners still from ESPN (picks-only sheet). Updated `GOOGLE_SHEET_SPEC.md`.


## 2026-08-13 — Google Sheet picks v2: ONE TAB PER WEEK + dropdown entry — WORKS (gids pending from Nick)
Per updated GOOGLE_SHEET_SPEC.md (Option 2, Nick's choice). Replaced the single published-CSV model with a whole-season sheet, ONE TAB PER WEEK, read per-tab as CSV. Drives BOTH the live week AND the archived week tabs. picks.js (live) + season.js (archive) remain automatic fallback; never blanks. Rollback: good-picks-presheet → 34beda0.

**Read method:** per-tab CSV export `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>` (base id 1fr3FephcCutOiRaNB7yi78o9DCExXdYbV-CdC2gkqtw, "Anyone with link → Viewer" — NO publish-to-web needed). Chose the week→gid config map (SHEET.weeks) as the reliable path — keyless tab-metadata discovery isn't reliable without the Sheets API (a secret), which the spec rejects. Guard: a wrong/unpublished gid returns an HTML page not CSV → detected (`/^\s*</`) and that week falls back.

**Tab layout (no week column — the tab IS the week):** header `team1,team2,Nick,Clyde,Chet,Henry,Riley,Bobby`, one row per game, TIEBREAKER row at bottom (numeric totals), tiebreaker game = LAST game row. Winners/results NOT in sheet — come from ESPN (live current week; by-week for past).

**index.html:** replaced old SHEET/csvUrl block with `SHEET{id,season,players,weeks:{}}` + `sheetCsvUrl(gid)`, `sheetConfigured()`, `parseWeekTab(csv,week)`, `fetchWeekTab`, `loadAllWeekTabs()`, `weekTabToArchive()`, `enrichArchiveWithEspn()` (fetches ESPN by week, reuses indexGames+mkey to fill winner/scores/tbActual so renderArchivedWeek grades a sheet week exactly like a season.js week). boot() now: load all tabs → highest tab = live week → window.PICKS; lower tabs → ARCHIVE (season.js precedence); after first paint, grade sheet-sourced past weeks from ESPN + repaint. LIVE_WEEK = highest parsed tab, else picks.js.

**Templates:** removed old SHEET_TEMPLATE.csv (had week column); added SHEET_TEMPLATE_Week1.csv (real Week 1 from season.js) + SHEET_TEMPLATE_Week2.csv (real Week 2 from picks.js). README rewritten: one-tab-per-week layout, per-game Data-Validation DROPDOWN setup (abbrevs only — logos-in-dropdown NOT supported by Sheets, noted; optional =IMAGE() decoration), and EXACTLY what Nick provides = each week tab's number + gid (from #gid= in the tab URL) for SHEET.weeks.

**Verified (node):** page JS parses clean; 10/10 presence checks; Week 2 template matches picks.js field-for-field; Week 1 template matches season.js W1 picks+tiebreaker and carries NO winner field; export URL builder correct; sheetConfigured() gates; weekTabToArchive shape OK; invalid tab (missing col / HTML) throws → fallback; no-config → loadAllWeekTabs()=={} (site behaves exactly as pre-change). get_diagnostics clean.

**PENDING (Nick):** add a "Week 1" tab (+ keep Week 2), set per-game dropdowns, send each tab's week→gid; I wire SHEET.weeks and test live. Commit ndjunce/noreply. Blast radius: index.html sheet module + boot + note; README; templates. Zero change to render/grade/Path-to-Win/ESPN/archive-render logic.


## 2026-09-16 — Picks sheet: captured 2 future ideas (schedule-populated tabs + Apps Script)
Sheet titled "Phipps Tavern 2026 Picks". Nick asked: (A) make all week tabs clickable + show that week's NFL SCHEDULE (from ESPN by week) even for un-entered future weeks — small separate build; (B) Google Apps Script — YES it helps: can AUTO-FILL each week's schedule into a tab (no hand-typing games), PUBLISH the whole sheet as ONE JSON URL (Apps Script web app — cleaner than gid-per-tab CSV), and auto-create dropdowns. RECOMMENDED as the long-term "fancy" workflow if Nick uses the sheet all season, but it's a bigger build + needs a one-time script authorize — NOT tonight (interview tomorrow). Decision pending: stick with CSV-now vs upgrade to Apps Script later. Both logged in GOOGLE_SHEET_SPEC.md so not lost.


## 2026-09-16 — Picks sheet: GO with Google Apps Script workflow (season-long) — spec build-ready
Nick will use the sheet all season → chose Apps Script over raw CSV+gids. Workflow: Nick picks via dropdowns in the sheet → Apps Script web app (doGet) publishes ALL weeks as ONE JSON URL (/exec) → picks site fetches that URL on load → picks auto-appear, NO git push / NO admin.html. Apps Script also: buildWeekSchedule(N) pulls the week's NFL matchups from ESPN into the tab (no hand-typing games), addDropdowns(N) sets per-game data-validation dropdowns, custom "Picks Tools" menu. Site swaps SHEET to a single jsonUrl reader (drives live + archive weeks), winners still from ESPN, fallback to picks.js+season.js (never blank), freeze tag rollback.
LOGOS answer: dropdown itself stays text-only (Google limit), BUT the SITE already renders team logos next to picks — so a "SEA" pick shows the Seahawks logo on the site automatically. Optional =IMAGE() logo cell in-sheet is display-only bonus.
Nick does once: paste Code.gs → deploy web app (authorize) → hand back /exec URL → edit chat wires + tests. Spec: `APPS_SCRIPT_SPEC.md`. Edit chat delivers full Code.gs + deploy steps + site reader.


## 2026-08-13 — Google Sheet picks v3: Apps Script WEB APP (one JSON URL) — WORKS (/exec pending from Nick)
Per APPS_SCRIPT_SPEC.md (chosen over CSV-per-gid because the sheet is a season-long workflow). Sheet holds one tab per week; a bound Apps Script web app (doGet) returns ALL weeks as JSON at one /exec URL; site fetches that single URL. Winners still from ESPN; picks.js+season.js fallback (never blanks). Rollback: good-picks-presheet → 34beda0.

**PART 1 — Code.gs (new file, for Nick to paste into Extensions → Apps Script):**
- `doGet()` → `ContentService` JSON `{season, players, weeks:{"N":{games:[{team1,team2,picks}], tiebreaker, tiebreakerGame}}}`; iterates only tabs matching /^week\s*(\d+)$/i; `readWeekSheet_()` parses header team1|team2|Nick..Bobby + TIEBREAKER row; tiebreaker game = last game row; skips malformed tabs.
- `buildWeekSchedule(N)` → `UrlFetchApp` ESPN scoreboard (week N, seasontype 2, dates 2026), writes away=team1/home=team2 rows (sorted by kickoff) into a created/cleared "Week N" tab with header + blank pick cells + TIEBREAKER row; then calls addDropdowns(N).
- `addDropdowns(N)` → per game row, DataValidation requireValueInList([team1,team2]) on the six player cells (skips TIEBREAKER row).
- `onOpen()` → "Picks Tools" menu (build week…, add dropdowns…, URL note) via prompts. Verified Code.gs parses clean; has doGet/buildWeekSchedule/addDropdowns/onOpen/ContentService/UrlFetchApp/requireValueInList/.addToUi().

**PART 2 — site reader (index.html):** replaced the CSV-per-gid SHEET block with `SHEET{jsonUrl:"",season,players}` + `sheetConfigured()` (on jsonUrl) + `normalizeWeek(raw,week)` (uppercases teams/picks, derives tiebreakerGame from last game if omitted, throws on empty) + `loadAllWeekTabs()` (fetch jsonUrl → JSON.parse → {week:obj}; HTML-body guard for unauthorized deploys; adopts players/season from payload; skips bad weeks). Removed parseCSV/parseWeekTab/fetchWeekTab/sheetCsvUrl. boot() + weekTabToArchive + enrichArchiveWithEspn UNCHANGED (loadAllWeekTabs keeps the same {week:obj} return shape) — newest week = live (window.PICKS), older = ARCHIVE graded via ESPN. Updated note/source-badge wording.

**LOGOS confirmed:** teamChip() (logo renderer) unchanged, 10 render call sites; sheet picks flow into the same PICKS/ARCHIVE structures, so a text pick "SEA" auto-renders the Seahawks logo. (Sheet dropdowns are text-only — abbrevs — documented.)

**Verified (node):** page JS parses clean; 9/9 presence checks (incl. CSV parser removed); no-URL → {} fallback; wired fake /exec → weeks 1+2 parsed, picks/tiebreaker preserved, abbrevs uppercased, W1 tiebreakerGame derived from last game; malformed week skipped while valid week survives; HTML/unauthorized body → {} fallback. get_diagnostics clean. Removed scratch.

**PENDING (Nick):** paste Code.gs → deploy Web app (Execute as me, Access Anyone) → authorize → send /exec URL; I wire SHEET.jsonUrl + test live. Commit ndjunce/noreply. Blast radius: index.html sheet module + note; README rewrite; new Code.gs. Zero change to render/grade/Path-to-Win/ESPN/archive-render.


## 2026-09-16 — Apps Script deployed (/exec works) BUT buildWeekSchedule = ESPN 403 (Google-server block)
Nick deployed the web app; /exec URL obtained (AKfycbze...exec). doGet/JSON picks reading works. BUG: buildWeekSchedule(N) → "ESPN HTTP 403" — ESPN's Akamai blocks Google's servers (same root cause as ESPN being un-hittable server-side from Node). Schedule auto-fill can't reach ESPN from Apps Script. Everything else (JSON reading, dropdowns, sheet→site flow) unaffected. FIX options logged in APPS_SCRIPT_SPEC.md: (1) browser-like headers on UrlFetchApp, (2) alternate feed that doesn't block Google (sports.core.api.espn.com CDN / Sleeper schedule), (3) graceful degrade — create tab+dropdowns+tiebreaker even if fetch 403s, schedule-fill is nice-to-have not required (never throw). PRIORITY: wire the site to /exec (core picks flow works) first; fix schedule-fill via 1/2/3 after. Core workflow is functional; auto-schedule is the only broken piece.


## 2026-09-16 — Fix buildWeekSchedule ESPN 403 (degrade gracefully) — WORKS
Per APPS_SCRIPT_SPEC.md BUG section. ROOT CAUSE: Apps Script runs on Google's servers; ESPN's Akamai layer 403s datacenter IPs, so the old buildWeekSchedule threw "ESPN HTTP 403". doGet/JSON/dropdowns/site flow were unaffected — only the auto-schedule-fill.

**FIX (Code.gs only — re-paste + re-deploy):** buildWeekSchedule now NEVER throws on a fetch failure. New `fetchWeekGames_(week)` tries sources in order and returns [] if all fail: (1) `espnSiteGames_` ESPN site scoreboard WITH browser-like headers (User-Agent/Referer/Accept — cheap Akamai-bypass attempt); (2) `espnCoreGames_` ESPN core CDN `sports.core.api.espn.com` (different host, follows event/team $ref links — the strong fallback); (3) `sleeperGames_` Sleeper public schedule. Each source wrapped in try/catch. Games sorted by kickoff (away=team1, home=team2) so the last row = tiebreaker game.
- If games found → build tab with real rows + dropdowns (toast "Built Week N with X games").
- If ALL sources fail → still create the Week N tab: header + 16 blank game rows + TIEBREAKER row; dropdowns skipped on blank rows (added later when Nick types teams + reruns Add dropdowns). Toast explains hand-entry. No throw.
- `addDropdowns` already skips rows without both teams (safe on empty tab); switched its toast to `safeToast_` (never-throws).

**Verified (node, mimics datacenter/server-side):** Code.gs parses clean; has fetchWeekGames_/espnCoreGames_/sleeperGames_/safeToast_; buildWeekSchedule no longer contains the 403/no-games throws. Live source probe: ESPN site 200 (16 games, but Node IP isn't Google's — not proof), ESPN core CDN 200 (16 events) — and replicated the core $ref-follow parse: correctly yields away@home (NYG@LAR, DET@BUF, CAR@ATL) with site-matching abbrevs. Sleeper 2026 week returned empty/other shape → stays last-ditch only. So core CDN is the likely workhorse from Apps Script; empty-tab fallback guarantees it never hard-errors regardless.

**PENDING (Nick):** re-paste Code.gs → Manage deployments → Edit → Deploy (same /exec URL). Then Picks Tools → Build week schedule. Commit ndjunce/noreply. Blast radius: Code.gs buildWeekSchedule + 4 new helpers; doGet/site untouched. (Separately still open: the /exec deployment was returning a Google login page = access not "Anyone"; unrelated to this fix.)


## 2026-09-16 — Apps Script /exec CONFIRMED PUBLIC + returning JSON; ready to wire site
Access fix worked. Tested /exec live (AKfycbze...exec): HTTP 200, content-type application/json, returns {season:2026, 6 players, weeks 1-8, Week2=16 games}. No more login page — public confirmed. Picks Tools menu + buildWeekSchedule working (Nick entered weeks 1-7 via the script; auto-schedule fetch succeeding now). FINAL STEP: edit chat sets SHEET.jsonUrl = the /exec URL + tests (weeks populate, picks+tiebreakers parse, logos render, fallback intact). Workflow once wired: enter pick in sheet → (Apps Script caches ~few min) → refresh site → pick shows. Replaces the admin.html→picks.js→git push chore. Viewer must reload (site reads sheet on load / auto-refresh). Nick happy with the trade-off (load delay >> manual git push). picks.js+season.js remain fallback; freeze tag good-picks-presheet = rollback.


## 2026-09-16 — Wired the site to the live Apps Script /exec — WORKS (picks pull from sheet)
Deployment is now public (Nick fixed access → Anyone). Verified /exec live: HTTP 200, JSON (NOT html), season 2026, 6 players, weeks 1-10 (schedules auto-filled — buildWeekSchedule reached ESPN this time), Week 2 = 16 games. Set `SHEET.jsonUrl` in index.html to the /exec URL.

**Site test (jsdom vs the real payload + committed picks.js/season.js eval'd in as the real page loads them):**
- TEST A (sheet wired): window.PICKS._source="google-sheet", live week=10 (newest tab), 14 games; week bar shows the "has" (clickable) class on weeks 1,2,3,4,5,6,7,8,9,10 → past weeks populate ARCHIVE + live week present; 28 team-logo <img class="logo"> in the games pane → logos render next to sheet picks (teamChip unchanged, picks flow into same PICKS/ARCHIVE); source badge "picks: live Google Sheet (Apps Script)". ✓
- TEST B (URL HTTP 500): falls back to picks.js (week 2, 16 games), page does NOT blank, no fatal "No picks available". ✓
- TEST C (unauthorized HTML body): HTML guard trips → falls back to picks.js. ✓
(Note: ARCHIVE/SEASON read as empty via window in the harness because they're top-level `const` not attached to window — confirmed real population via the rendered week-bar "has" classes instead.)

**HONEST STATE:** the sheet currently has games (real matchups, auto-filled) but picks are still BLANK / tiebreakers null for every week — nobody has entered picks yet. So the site now shows each week's matchups from the sheet with no highlighted picks until the group fills the sheet. That's correct, not a bug; leaderboard/paths populate as picks + ESPN winners come in.

Commit ndjunce/noreply. Blast radius: index.html SHEET.jsonUrl one-liner only. Fallback path proven intact (freeze tag good-picks-presheet still valid).


## 2026-09-16 — Picks site live from sheet; 2 fixes needed (live-week default + Week 2 blank override)
Site wired to /exec + loading (weeks 1-10 clickable, Week 1 picks show). Nick found 2 issues: (1) page OPENS on Week 10 because live-week = highest sheet week, but Nick auto-filled SCHEDULES thru Week 10 → should open on the ACTUAL current NFL week (~2/3) instead; weeks beyond current = future schedule-only. (2) Week 2 picks not showing — Nick's Week 2 picks are in picks.js but the sheet's Week 2 tab has blank picks (schedule auto-filled, no picks entered) and is overriding picks.js with blanks. FIX: a sheet week with games but ALL-blank picks should NOT clobber committed picks — fall back to picks.js/season.js for that week (Nick won't re-enter Week 1/2). Result: Week 1+2 picks always show; future blank weeks show schedules only; page opens on current NFL week. Spec: APPS_SCRIPT_SPEC.md FIXES section. Edit chat to implement + verify.


## 2026-09-16 — Two fixes: real current-NFL-week green dot + blank-sheet-week fallback — WORKS
Per APPS_SCRIPT_SPEC.md FIXES section. index.html boot only.

**FIX 1 — LIVE_WEEK = real current NFL week (green dot), not max sheet week.** Auto-filling schedules through Week 10 had made LIVE_WEEK=10 (green dot on wk 10). Added `fetchCurrentNflWeek()` → ESPN scoreboard (no week= param) reads `data.week.number` (+season.year), fallback to committed picks.js.week then 1. boot sets LIVE_WEEK from that; selectedWeek (blue) defaults to LIVE_WEEK on first load so the page OPENS on the current week; clicks still move blue (selectWeek unchanged); green dot fixed on current week. Weeks > current = future schedule-only (clickable). Also adopts ESPN season into SHEET.season.

**FIX 2 — schedule-only sheet week must NOT clobber committed picks.** Added `weekHasPicks(wk)` = any game has a non-blank pick. boot logic: live window.PICKS = sheet-with-picks[LIVE_WEEK] → else committed picks.js if it IS LIVE_WEEK → else sheet schedule-only[LIVE_WEEK] → else committed. ARCHIVE per non-live week: sheet-with-picks wins; else keep committed season.js (blank sheet week does NOT overwrite); else sheet schedule-only when nothing committed. So Week 1 (season.js) + Week 2 (picks.js) keep showing their real picks even though the sheet has blank auto-filled tabs for them.

**Verified (jsdom, exact failure scenario: current wk=2 mocked from ESPN state, sheet weeks 1-10 ALL blank/schedule-only, picks.js=wk2, season.js=wk1):** green/live dot = week 2 (not 10); blue/active = week 2 on open; weeks 1-10 all clickable; live window.PICKS = picks.js wk2 with REAL picks (BUF...), games pane shows DET/BUF (committed) NOT the blank AAA/BBB sheet; source badge "picks: picks.js (committed)". get_diagnostics clean. Removed scratch + jsdom.

Commit ndjunce/noreply. Blast radius: index.html boot week-selection + 2 helpers (fetchCurrentNflWeek, weekHasPicks). Sheet→site flow + fallback intact; freeze tag good-picks-presheet still valid.


## 2026-09-16 — Picks site: clinch bug (leader shows "needs help" when everyone else is eliminated) + load speed
Nick on live site (Week 2): Henry 11 correct ~100%, everyone else ELIMINATED — but Henry still shows "in play — needs help: any of LAR (beat NYG)" instead of CLINCHED/WON. BUG: Path-to-Win won't declare a winner while any tracked game is undecided (LAR/NYG), even though the leader has ALREADY mathematically clinched (all other players eliminated = can't be caught). FIX: if every other player is ELIMINATED (or leader's guaranteed min > everyone else's max possible), the leader is CLINCHED/WON — label him "CLINCHED"/"WON", NOT "needs help", regardless of remaining undecided games. (Also check: LAR/NYG may already be final IRL but not marked in the feed being used — but the clinch-when-others-eliminated logic fixes it either way.)
LOAD SPEED: first load slow = Apps Script cold start (Google wakes the web app) + fetching all-weeks JSON on top of ESPN scoreboard + player dict. Mostly first-hit. OPTION (if slow every time): cache the /exec response in localStorage (short TTL) + add a loading indicator so repeat visits are instant. Nick to confirm if slow every time or just first.


## 2026-09-16 — Clinch bug fix (leader clinched when all others eliminated) — WORKS
Per the 2026-09-16 clinch-bug entry. BUG: Path-to-Win only set `clinched = cur > oppMax` (leader's current > every rival's maxPossible), computed per-player in the map. In Henry's Week 2 case (11 correct, LAR/NYG undecided, everyone else eliminated) that check didn't fire, so he showed "in play — needs help: any of LAR" instead of CLINCHED.

**FIX (index.html, computePathToWin, post-map pass before sort):** after the per-player results are built, if exactly ONE player is non-eliminated (and there's >1 player), promote that survivor to `clinched=true` — last player standing = winner, regardless of undecided games (incl. their own picks). If >1 remain, re-assert the strict `correct > oppMax` clinch as a safety net (no behavior change for real races). `pathNeedsText` already renders CLINCHED (👑, "can't be caught") first, so the leader now displays as the winner.

**Verified (node, computePathToWin directly):** Henry scenario — 11 correct, LAR/NYG undecided, others 2 correct/max 3 → all others eliminated, Henry `clinched:true eliminated:false` → "✓ Henry CLINCHED (winner)". Control — Henry/Bobby tied 5-5 with an undecided game each picked → clinched set EMPTY (no false clinch). Page JS parses clean; get_diagnostics clean. Removed scratch.

Commit ndjunce/noreply. Blast radius: computePathToWin clinch post-pass only (~14 lines); elimination logic, enumeration, win%, rendering untouched. Note: also robust if the LAR/NYG feed game is actually final IRL but unmarked — clinch-by-elimination fires either way.


## 2026-09-16 — Picks clinch/elim bug #2: Riley shows ~0% but NOT eliminated (inconsistent with enumeration)
Week 2 live: Henry 11 (needs LAR, ~100%), Riley 10 (needs LAR, ~0%, NOT eliminated), everyone else ELIMINATED. One game left: NYG vs LAR (both Henry & Riley picked LAR).
Math: LAR wins → Henry 12, Riley 11 (Henry wins). NYG wins → Henry 11, Riley 10 (Henry wins). So Henry wins in EVERY outcome = truly CLINCHED; Riley truly ELIMINATED.
BUG: the `eliminated` flag uses `maxPossible < oppCurTop` → Riley max=11 vs Henry current=11 → 11<11 false → "not eliminated (alive tie)". But that ignores that Henry ALSO has a live pick in the SAME game — the scenario that lifts Riley to 11 (LAR win) ALSO lifts Henry to 12. So Riley can NEVER catch Henry. The simple max-possible math is scenario-blind.
KEY: the win% ENUMERATION already knows this — it shows Riley ~0%. So the flags are INCONSISTENT with the enumeration. FIX: derive eliminated/clinched FROM the enumeration (win-share): a player with 0 winning scenarios (across all remaining game outcomes, tiebreaker-aware) = ELIMINATED; if only one player has >0 win scenarios = CLINCHED. Make elim/clinch consistent with the % the tool already computes. This also fixes the prior Henry "needs help" issue at the root (Henry = only player with >0 → CLINCHED; Riley 0% → ELIMINATED). Spec/fix: edit chat.


## 2026-09-16 — Clinch/elim bug #2: derive flags FROM the enumeration (fix %↔flag disagreement) — WORKS
Per the 2026-09-16 clinch/elim #2 entry. BUG: eliminated/clinched used scenario-BLIND max-possible math (`mx < oppCurTop` / `cur > oppMax`) while win% came from the 2^k enumeration. They disagreed on CORRELATED picks: Henry & Riley both picked LAR in the last game, so the LAR-win scenario that lifts Riley also lifts Henry (who leads) → Riley can never catch him. Max-possible said Riley not-eliminated (mx 11 == Henry's cur 11), but the enumeration correctly gave Riley 0%. So Riley showed ~0% yet un-eliminated, and Henry wasn't clinched.

**FIX (index.html, computePathToWin):** when the enumeration ran (`enumerated`), derive the flags from the SAME winCnt the win% uses:
- `eliminated = (WC[p]||0)===0`  → 0 winning scenarios (tiebreaker-aware) = can't win.
- `clinched = WC[p]>0 && winnersWithScenarios===1` → sole player with any winning scenario = has won.
Removed the duplicate `const WC` I'd first added (reused the existing one at the needed-games block — that name collision was a real syntax error I caught in verify). Kept the scenario-blind heuristic ONLY as the non-enumerated fallback (k>18, not hit in practice). The later clinch-by-elimination post-pass now just re-asserts the same result (and covers the fallback) — comment updated.

**Verified (node, correlated-picks repro):** Henry 11 correct / Riley 10, both pick LAR in the lone undecided game → Henry CLINCH (100%), Riley ELIM (0%); consistency check passes for ALL players (0% ⟺ eliminated, sole >0% ⟺ clinched). Control (Henry/Bobby genuine 5-5 race, 1 undecided each picked) → NO false clinch, only buried players eliminated. Page JS + get_diagnostics clean. Removed scratch.

Commit ndjunce/noreply. Blast radius: computePathToWin flag derivation (enumerated branch) + removed dup WC; win%/enumeration/rendering untouched. Flags now always consistent with the displayed %.

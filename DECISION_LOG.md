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

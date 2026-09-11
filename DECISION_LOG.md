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

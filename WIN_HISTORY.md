# Shared weekly win history

The chart reads timestamped Path to Win estimates, not a second game-prediction model. `scripts/log-win-probability.cjs` loads the actual `indexGames` and `computePathToWin` functions from index.html in an isolated Node context. Changed scorer boundaries fail closed. No recommendation files, private sheets, raw picks, credentials or personal data sources are read or written. Saved JSON contains public participant names, observation time, source-coverage status, calculation/picks fingerprints and computed probabilities only.

## Capture and display

- After publication approval, `.github/workflows/win-probability-history.yml` runs on main at minutes7/17/27/37/47/57. It can also be dispatched manually. GitHub schedules are best effort, can be delayed/dropped and can be disabled for inactivity. This is not a guaranteed ten-minute service.
- The job reads the public Apps Script feed and ESPN scoreboard. It waits for every participant's valid pick in every matchup. It does not synthesize missing choices or use the browser's committed fallback. Thus capture can start later than the first browser estimate.
- Invalid/missing probability coverage is saved as null, never50/50. Source/network failure fails the job without fabricating an observation. Chart lines break for nulls, capture gaps over30minutes, changed public picks or changed calculation fingerprint.
- Current and previously recorded prior week are checked; finalized histories stop capturing. The final observation records final status without inventing terminal percentages not displayed by the existing live scorer. Week/season mismatch fails closed.
- Normal ten-minute unchanged values are retained. Duplicate identical reruns within five minutes are suppressed. Files are appended chronologically via atomic replacement; old observations are not regenerated from later information.
- The workflow commits ONLY `data/win-history/*.json` using the repository's Actions token. Concurrent jobs queue; a remote push conflict fails safely, without force-push or history rewriting.
- Production chart fetches shared JSON from `raw.githubusercontent.com/ndjunce/2026-nfl-picks/main/data/win-history/`. This deliberately avoids relying on Pages rebuilds from Actions-token commits, which do not trigger the normal build. The browser and raw CDN can add propagation delay. The ordinary owner-approved site release still uses existing branch/root GitHub Pages.
- Browser polls the shared file alongside Path to Win rendering, at most once a minute. Closing every browser does not stop the GitHub job once enabled. No localStorage history is used. Existing week tabs select that week's history.
- Original pre-capture Week7 history does not exist. The initial local file is a genuine current capture, not a backfill or demonstration series. All test series remain outside this public repo.

## Week7 retrospective option

At the owner's explicit request, a separate `2026-week-7-reconstructed.json` replays current public choices through the current PathToWin scorer using genuine pregame ESPN summary quotes retained October20 and historical ESPN play-level probabilities joined to play wallclock times. It is sampled roughly every five minutes of game-event time, not a reproduction of browser polls. Current public choices/guesses are assumed constant, later pregame line movement is omitted, and the most recent matched live value is held until another matched play or final event. Missing interior play probabilities can appear flat, not necessarily as gaps. Final outcomes enter only at retained End of Game events (overtime need not reach0:00) or final-period0:00 events. Assumptions are prominent in the UI and JSON.

The selector defaults to recorded snapshots. Reconstructed points are never merged into that file; future automatic capture remains our own observed live calculation. The one-off builder and public-source evidence are retained in the private analytics project's ignored output, outside this public repo. This is estimated historical context, not proof of past site values or forecast performance. There is no automatic retrospective build for future weeks.

The history panel loads collapsed. Labels show names side by side at the inspected percentage instead of overlapping dots; the inspector moves a vertical time marker. Opening the panel redraws for the available mobile width.

## Preview and activation boundary

Owner approved publication and automatic logging on2026-10-27. Preview index.html for the graph and stats.html for Heartbreak. Cloud activation and first-run verification are recorded in DECISION_LOG.md. Before initial push, verify only intended files are staged, inspect captured JSON, and preserve private analytics files outside this public repo.

After explicit publication approval: deploy ordinary site changes, verify raw JSON CORS and chart, run/observe the workflow on main, verify a new timestamp appears without a browser, then check a scheduled run. Do not claim unattended cloud execution before observing it. Job failures appear under Actions; no notification integration was added. Disable the workflow in GitHub to stop capture; historical files remain readable.

## Heartbreak

Stats reuses `decideWeek` winners. A heartbreak requires a finalized week, multiple top correct-pick totals, valid actual combined total and valid guesses for every tied leader, and a losing absolute error larger than the winning error. Shared winners and ordinary pick-count losses are excluded. Missing tied-leader evidence marks the week unknown rather than assigning zero as a guess. Historical season.js entries without completeness flags retain the existing completed-archive convention.

Equal-distance guesses remain shared winners in stats, with no over/under or secondary rule invented. This feature does not change existing PathToWin's separate handling of exact equal-distance tiebreakers; that inherited discrepancy is logged in the private project's known-issues list rather than silently changing scoring here.

Local preview revision2026-10-26: compressed timeline preserves original percentages/timestamps; long gaps capped, known idle intervals compressed, skip marks/day labels explain the axis. Replay gameWindows are derived only from saved public kickoff/final evidence. Future recorded points include activeGames; older unknown activity remains explicitly a long gap rather than assumed game evidence. Names now sit below the chart; phone chart scrolls sideways. No publication or logger activation.

2026-10-27 local update: Week7 separate reconstruction includes all14finals throughMNF and a separately graded finalResult, preserving original captured file. Coincident full polyline paths alternate player colors with SVG dash patterns; no displaced probability values. Final outcome displayed as settled result rather than manufactured forecast percentages. Preview only, no workflow activation/publication.

Approved final endpoint: recorded finalResult metadata supplies settled100%/0% chart values; forecast probabilities remain null on final captures and earlier captures remain immutable. Shared settled winners split equally.
# Optional against-the-spread week

Weeks without `PICK_MODE = SPREAD` remain straight-up. Week 10 is not switched merely by shipping this code.

## Sheet setup, in order

Live progress (2026-11-10): bound script saved and existing /exec updated to version 2; installable captureEspnSpreadOnEdit_ trigger verified in Google. Read-only Google-side ESPN tests passed for events 401873052 (NYG -2.5), 401873058 (ATL +3.5), and 401873065 (BAL -4.5). No official lines/picks were created. During setup, Week 10, 11, 12, 13 and 18 tabs disappeared from both live metadata and /exec; awaiting owner clarification before restoring tabs or adding spread configuration. Earlier weeks remain straight-up. Frontend spread release is still local/unpublished.

1. Update the bound Apps Script from `Code.gs` and redeploy the existing `/exec` web app. Confirm the feed still returns prior weeks and `Week 10` has 14 games.
2. In `Week 10`, append a `team2_spread` header after Bobby. Leave the line cells blank; the trigger will fill them. A signed line belongs to `team2`: `WSH | NYG | ... | -3.5` means NYG must win by 4 or more to cover.
3. Add a row with `PICK_MODE` in `team1` and `SPREAD` in `team2`. It is metadata, not a game. Do this **after** the Apps Script redeploy; the old script would misread the row as a game.
4. As the Sheet owner, choose **Picks Tools → Enable ESPN spread auto-lock** once and authorize it. This installs an edit trigger. On the first valid pick in each game row, it requests the ESPN Week 10 scoreboard, verifies both teams and opposite signed home/away lines, and saves that game's line, provider, ESPN event ID, and timestamp in the Sheet's document properties. Later picks or cell edits cannot change that game's receipt. It also writes the line to `team2_spread` for visibility. Do not reorder either team after locking.
5. Before relying on it, test one game with a real first pick and inspect `/exec`: that game's `lineLocked` must be `true`, with `lineSource` beginning `ESPN /`, a timestamp and the correct `team2Spread`. Other games stay unlocked until their first picks. `linesLocked` becomes true only when every game is locked. **This local code has not yet been installed or tested from Google's servers.** ESPN may reject Apps Script fetches. If that happens, the edit trigger throws and leaves the line unlocked; enter the ESPN line in the Sheet and use **Lock official spreads for a week…** to lock remaining rows manually. That fallback preserves already locked lines.

## Scoring

The site still stores each person's selected team abbreviation. In spread mode it awards a correct pick when that team covers the locked `team2_spread`, using the final game score. A game landing exactly on the line is a **push**: neither a win nor a loss for anyone. Missing/unlocked lines award no points and keep the week incomplete. The weekly tiebreaker remains the predicted combined score of the last game.

Earlier weeks keep their straight-up grades and records. Spread weeks use the same Path to Win pool calculation with estimated cover and push probabilities at the locked line. Pregame estimates center on the ESPN market line when available and otherwise on the locked line. In-game estimates use score and clock with the locked line as the starting margin estimate. These are model estimates and have not been calibrated to historical cover results. Each possible push awards no points. Win percentages require complete inputs and are computed exactly up to 262,144 combinations. The shared history logger skips spread weeks. Underdog and favorite historical stats cover straight-up weeks.

## Local preview

`prototypes/picks-spread-20261106` in the private analytics workspace serves the Week 10 review with the real submitted picks and the ESPN lines captured Nov. 11 at 5:08 p.m. CT. Spread scoring remains inactive in the live Sheet. Run `python -m http.server 8810 --bind 127.0.0.1` in that folder and open `http://127.0.0.1:8810/site/index.html`.

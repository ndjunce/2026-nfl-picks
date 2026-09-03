# NFL Picks Tracker

A **static** website (instant load, no server, no cold-start) that shows the group's weekly
NFL picks and a live leaderboard. Friends just open the link on their phones — no login.
Live scores come from ESPN's free public scoreboard, polled in the visitor's browser and
updated every 30 seconds as games finish.

- **`index.html`** — the whole site (never needs editing).
- **`picks.js`** — the ONLY file you edit each week (paste your picks, push).

Players (fixed): **Nick, Clyde, Chet, Henry, Riley, Bobby**.

---

## ⏱ Your weekly workflow (2 minutes)

1. Open **`picks.js`**.
2. Set **`week`** to the NFL week number (e.g. `1`) and **`season`** to the year (`2026`).
3. Fill in **`games`** — one line per game. For each: the two teams (ESPN abbreviations,
   e.g. `KC`, `BUF`, `SF`, `PHI`) and each player's winner pick.
4. Fill in **`tiebreakerGame`** (the last game of the week) and each player's
   **`tiebreaker`** (predicted total combined points of that game).
5. Save. Then publish (one-time setup below, then just 3 commands each week):
   ```
   git add picks.js
   git commit -m "Week N picks"
   git push
   ```
6. The live site updates within ~1 minute. Done.

### Pasting from your spreadsheet (fastest)
Lay your spreadsheet out with these columns, in this order:

| team1 | team2 | Nick | Clyde | Chet | Henry | Riley | Bobby |
|-------|-------|------|-------|------|-------|-------|-------|
| DAL   | PHI   | PHI  | PHI   | DAL  | PHI   | DAL   | PHI   |

Then each spreadsheet row becomes one `games` entry in `picks.js`:
```js
{ team1: "DAL", team2: "PHI",
  picks: { Nick: "PHI", Clyde: "PHI", Chet: "DAL", Henry: "PHI", Riley: "DAL", Bobby: "PHI" } },
```
(Just match the abbreviations to the two teams; home/away order does not matter — grading
is done by matchup, not by which team you list first.)

**Team abbreviations** are the standard ESPN ones (KC, BUF, SF, PHI, DAL, LAC, NE, SEA, …).
If unsure, check espn.com — the site grades by these exact codes, so they must match ESPN.

---

## 🚀 One-time setup: publish free on GitHub Pages (instant load, no cold-start)

1. Create a new GitHub repo, e.g. **`nfl-picks`** (Public is simplest for Pages; the picks
   aren't secret. If you want it private, GitHub Pages on private repos needs a paid plan —
   Public is the easy free path here).
2. In this folder:
   ```
   git init
   git add index.html picks.js README.md
   git commit -m "NFL picks tracker"
   git branch -M main
   git remote add origin https://github.com/ndjunce/nfl-picks.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source = "Deploy from a branch"**,
   Branch = **main**, folder = **/(root)**. Save.
4. Wait ~1 minute. Your live link is:
   **`https://ndjunce.github.io/nfl-picks/`** — share that with the group.

That's it. Every future week: edit `picks.js`, `git add/commit/push`, site updates itself.

### Alternative host (also instant, also free)
Netlify or Vercel — drag-and-drop this folder, or connect the repo. Either gives an instant-
loading static URL. GitHub Pages is recommended since you already use GitHub.

---

## Why static (and not Render like last year)
Render's free tier **spins down** and takes ~30-60s to wake up (the cold-start delay you hit).
This site is pure static files served from a CDN — it loads **instantly**, every time, with no
server to wake. The "live" part (scores) runs in each visitor's browser calling ESPN directly,
so there's no backend to host, sleep, or pay for.

## Notes / limits
- Live scores depend on ESPN's public feed (`site.api.espn.com/.../nfl/scoreboard`). It's free
  and needs no key; if ESPN is briefly down, the page keeps showing picks and fills scores in
  on the next 30s refresh (it won't crash or blank out).
- The leaderboard counts a win only when a game is **final** and ESPN marks a winner.
- Ties are broken by who's closest on the tiebreaker game's total (once that game is final).
- Everything is client-side; there's nothing to secure and no personal data.

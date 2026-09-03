/* ============================================================================
   PICKS DATA FILE  — this is the ONLY file you edit each week.
   ----------------------------------------------------------------------------
   HOW TO UPDATE (see README for the full walkthrough):
   1. Set WEEK to the NFL week number (matches ESPN).
   2. Each game already has the two teams (ESPN abbreviations). You just fill each
      player's winner pick — replace the "" with the abbreviation they picked.
   3. TIEBREAKER: each player's predicted TOTAL combined points of the LAST game of
      the week (already set to the Monday-night game). Replace 0 with their number.
   4. Save, then: git add picks.js ; git commit -m "Week N picks" ; git push
      The live site updates within ~1 minute. NOTHING ELSE needs to change.

   PLAYERS (fixed, 6): Nick, Clyde, Chet, Henry, Riley, Bobby
   ============================================================================ */
window.PICKS = {
  week: 1,
  season: 2026,

  players: ["Nick", "Clyde", "Chet", "Henry", "Riley", "Bobby"],

  // REAL 2026 Week 1 slate (from ESPN, in kickoff order). Fill in each player's winner
  // (an ESPN abbreviation — must be one of the two teams on that line).
  games: [
    // Thu 9/9
    { team1: "NE",  team2: "SEA", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    // Thu 9/10 (intl)
    { team1: "SF",  team2: "LAR", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    // Sun 9/13 early
    { team1: "CHI", team2: "CAR", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "ATL", team2: "PIT", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "BUF", team2: "HOU", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "CLE", team2: "JAX", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "NO",  team2: "DET", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "TB",  team2: "CIN", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "BAL", team2: "IND", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "NYJ", team2: "TEN", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    // Sun 9/13 late
    { team1: "WSH", team2: "PHI", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "ARI", team2: "LAC", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "MIA", team2: "LV",  picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    { team1: "GB",  team2: "MIN", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    // Sun night 9/13
    { team1: "DAL", team2: "NYG", picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
    // Mon night 9/14 — the LAST game of the week (tiebreaker game)
    { team1: "DEN", team2: "KC",  picks: { Nick: "", Clyde: "", Chet: "", Henry: "", Riley: "", Bobby: "" } },
  ],

  // TIEBREAKER = last game of the week (DEN @ KC, Monday night). Each player predicts the
  // TOTAL combined score. Closest to the actual final total wins any leaderboard tie.
  tiebreakerGame: { team1: "DEN", team2: "KC" },
  tiebreaker: { Nick: 0, Clyde: 0, Chet: 0, Henry: 0, Riley: 0, Bobby: 0 },
};

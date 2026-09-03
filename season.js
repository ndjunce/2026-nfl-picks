/* ============================================================================
   SEASON ARCHIVE — finalized weekly results, for the Season Standings page.
   ----------------------------------------------------------------------------
   After a week is COMPLETE (all games final), add one entry with each player's
   wins and losses for that week, plus the tiebreaker info so the stats page can
   award the week (outright vs via-tiebreaker). The stats page sums these across
   the season. The CURRENT in-progress week is added automatically by stats.html
   from picks.js + live ESPN scores, so you only archive a week ONCE it's done.

   Each week entry:
   {
     week: 1,
     results: { Nick:{w:11,l:5}, Clyde:{w:9,l:7}, ... },   // correct picks per player
     tiebreaker: { Nick:44, Clyde:51, ... },               // each player's predicted total (optional)
     tbActual: 48,                                         // actual last-game combined total (optional)
     games: [ { team1:"KC", team2:"LAC", winner:"KC",      // (optional) per-game detail powers the
                picks:{Nick:"KC",Clyde:"LAC", ...} } ]     //   "Team tendencies" panel; omit if you
                                                           //   only want W-L totals for that week.
   }
   If tiebreaker/tbActual are omitted, a tied week is shown as TIED (no winner).
   ============================================================================ */
window.SEASON = {
  players: ["Nick", "Clyde", "Chet", "Henry", "Riley", "Bobby"],

  // One entry per COMPLETED week.
  weeks: [
    // Example (delete once you add real weeks):
    // { week: 1,
    //   results: { Nick:{w:11,l:5}, Clyde:{w:9,l:7}, Chet:{w:10,l:6},
    //              Henry:{w:8,l:8}, Riley:{w:12,l:4}, Bobby:{w:7,l:9} },
    //   tiebreaker: { Nick:44, Clyde:51, Chet:47, Henry:40, Riley:45, Bobby:52 },
    //   tbActual: 48 },
  ],
};

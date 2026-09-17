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
    { week: 1,
      results: { Nick:{w:11,l:5}, Clyde:{w:9,l:7}, Chet:{w:11,l:5}, Henry:{w:9,l:7}, Riley:{w:9,l:7}, Bobby:{w:12,l:4} },
      tiebreaker: { Nick:43, Clyde:47, Chet:50, Henry:42, Riley:49, Bobby:40 },
      tbActual: 41,
      games: [
      { team1:"NE", team2:"SEA", winner:"SEA", picks:{ Nick:"NE", Clyde:"SEA", Chet:"SEA", Henry:"NE", Riley:"SEA", Bobby:"SEA" } },
      { team1:"SF", team2:"LAR", winner:"SF", picks:{ Nick:"SF", Clyde:"LAR", Chet:"LAR", Henry:"LAR", Riley:"LAR", Bobby:"LAR" } },
      { team1:"TB", team2:"CIN", winner:"CIN", picks:{ Nick:"CIN", Clyde:"CIN", Chet:"CIN", Henry:"CIN", Riley:"TB", Bobby:"CIN" } },
      { team1:"NO", team2:"DET", winner:"DET", picks:{ Nick:"DET", Clyde:"NO", Chet:"DET", Henry:"DET", Riley:"DET", Bobby:"DET" } },
      { team1:"NYJ", team2:"TEN", winner:"NYJ", picks:{ Nick:"NYJ", Clyde:"NYJ", Chet:"TEN", Henry:"TEN", Riley:"TEN", Bobby:"NYJ" } },
      { team1:"BAL", team2:"IND", winner:"BAL", picks:{ Nick:"BAL", Clyde:"BAL", Chet:"BAL", Henry:"IND", Riley:"BAL", Bobby:"BAL" } },
      { team1:"ATL", team2:"PIT", winner:"PIT", picks:{ Nick:"PIT", Clyde:"ATL", Chet:"PIT", Henry:"PIT", Riley:"PIT", Bobby:"PIT" } },
      { team1:"CHI", team2:"CAR", winner:"CHI", picks:{ Nick:"CHI", Clyde:"CHI", Chet:"CHI", Henry:"CHI", Riley:"CHI", Bobby:"CHI" } },
      { team1:"CLE", team2:"JAX", winner:"JAX", picks:{ Nick:"JAX", Clyde:"JAX", Chet:"JAX", Henry:"JAX", Riley:"JAX", Bobby:"JAX" } },
      { team1:"BUF", team2:"HOU", winner:"BUF", picks:{ Nick:"HOU", Clyde:"BUF", Chet:"BUF", Henry:"BUF", Riley:"HOU", Bobby:"HOU" } },
      { team1:"MIA", team2:"LV", winner:"LV", picks:{ Nick:"LV", Clyde:"MIA", Chet:"MIA", Henry:"LV", Riley:"LV", Bobby:"LV" } },
      { team1:"GB", team2:"MIN", winner:"MIN", picks:{ Nick:"MIN", Clyde:"MIN", Chet:"MIN", Henry:"MIN", Riley:"MIN", Bobby:"MIN" } },
      { team1:"WSH", team2:"PHI", winner:"PHI", picks:{ Nick:"PHI", Clyde:"PHI", Chet:"PHI", Henry:"PHI", Riley:"PHI", Bobby:"PHI" } },
      { team1:"ARI", team2:"LAC", winner:"ARI", picks:{ Nick:"LAC", Clyde:"LAC", Chet:"LAC", Henry:"LAC", Riley:"LAC", Bobby:"LAC" } },
      { team1:"DAL", team2:"NYG", winner:"NYG", picks:{ Nick:"DAL", Clyde:"DAL", Chet:"NYG", Henry:"DAL", Riley:"DAL", Bobby:"DAL" } },
      { team1:"DEN", team2:"KC", winner:"KC", picks:{ Nick:"DEN", Clyde:"DEN", Chet:"DEN", Henry:"DEN", Riley:"DEN", Bobby:"KC" } }
      ] },
  ],
};

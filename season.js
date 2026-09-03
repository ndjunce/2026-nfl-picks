/* ============================================================================
   SEASON ARCHIVE — finalized weekly results, for the Season Standings page.
   ----------------------------------------------------------------------------
   After a week is COMPLETE (all games final), add one entry with each player's
   wins and losses for that week. The stats page sums these across the season.
   (The CURRENT in-progress week is added automatically by stats.html from
   picks.js + live ESPN scores, so you only archive a week ONCE it's done.)

   The admin page will also print a ready-to-paste WEEKS entry when a week is final.
   ============================================================================ */
window.SEASON = {
  players: ["Nick", "Clyde", "Chet", "Henry", "Riley", "Bobby"],

  // One entry per COMPLETED week. wins/losses per player. tb = tiebreaker total (optional).
  weeks: [
    // Example (delete once you add real weeks):
    // { week: 1, results: {
    //     Nick:{w:11,l:5}, Clyde:{w:9,l:7}, Chet:{w:10,l:6},
    //     Henry:{w:8,l:8}, Riley:{w:12,l:4}, Bobby:{w:7,l:9} } },
  ],
};

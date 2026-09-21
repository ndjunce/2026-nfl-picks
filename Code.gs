/* ============================================================================
   Phipps Tavern 2026 Picks — Google Apps Script (bound to the picks Sheet)
   Sheet: "Phipps Tavern 2026 Picks"
   ----------------------------------------------------------------------------
   WHAT THIS DOES
   - doGet()            : Web App endpoint. Reads every "Week N" tab and returns
                          ALL weeks' picks as JSON for the picks website to fetch.
   - buildWeekSchedule(N): Pulls Week N's NFL matchups from ESPN's public
                          scoreboard and writes team1/team2 rows into a "Week N"
                          tab (creates the tab + header + TIEBREAKER row). So you
                          never hand-type games — just pick winners.
   - addDropdowns(N)    : Sets a click-to-pick dropdown on each game's six player
                          cells (that game's two team abbreviations only).
   - "Picks Tools" menu : run the above per week from the Sheet toolbar.

   ONE-TIME DEPLOY (see README "Apps Script" section for the click-path):
     Extensions → Apps Script → paste this file → Save →
     Deploy → New deployment → Web app → Execute as: Me · Who has access: Anyone
     → Deploy → authorize → copy the /exec URL → hand it to the site (SHEET.jsonUrl).

   TAB LAYOUT (matches the website parser exactly):
     Row 1 header:  team1 | team2 | Nick | Clyde | Chet | Henry | Riley | Bobby
     One row per game (team abbrevs the scoreboard uses: WSH, LAR, LAC, LV, ...).
     Last content row: team1 = "TIEBREAKER", team2 blank, each player's cell = their
     numeric predicted total for the LAST game (that game is the tiebreaker game).
   ============================================================================ */

var SEASON  = 2026;
var PLAYERS = ["Nick", "Clyde", "Chet", "Henry", "Riley", "Bobby"];
var HEADER  = ["team1", "team2"].concat(PLAYERS);
var TIEBREAKER_LABEL = "TIEBREAKER";

/* ---------- Web App: return every week's picks as JSON ---------- */
function doGet(e) {
  var out = { season: SEASON, players: PLAYERS, weeks: {} };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    var m = /^week\s*(\d+)$/i.exec(name.trim());   // only "Week N" tabs
    if (!m) continue;
    var wk = parseInt(m[1], 10);
    try {
      var parsed = readWeekSheet_(sheets[i]);
      if (parsed && parsed.games.length) out.weeks[String(wk)] = parsed;
    } catch (err) {
      // skip a malformed tab rather than failing the whole payload
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// Read one "Week N" sheet into { games:[{team1,team2,picks}], tiebreaker, tiebreakerGame }.
function readWeekSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { games: [], tiebreaker: {}, tiebreakerGame: null };
  var header = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = {};
  ["team1", "team2"].concat(PLAYERS).forEach(function (name) {
    col[name] = header.indexOf(name.toLowerCase());
  });
  if (col.team1 < 0 || col.team2 < 0) throw new Error("missing team columns");

  var games = [], tiebreaker = {};
  var up = function (v) { return String(v == null ? "" : v).trim().toUpperCase(); };
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var t1 = String(row[col.team1] == null ? "" : row[col.team1]).trim();
    if (!t1) continue;
    if (t1.toUpperCase() === TIEBREAKER_LABEL) {
      PLAYERS.forEach(function (p) {
        var v = parseFloat(row[col[p]]);
        tiebreaker[p] = isNaN(v) ? null : v;
      });
      continue;
    }
    var t2 = String(row[col.team2] == null ? "" : row[col.team2]).trim();
    if (!t2) continue;
    var picks = {};
    PLAYERS.forEach(function (p) { picks[p] = up(row[col[p]]); });
    games.push({ team1: up(t1), team2: up(t2), picks: picks });
  }
  var last = games.length ? games[games.length - 1] : null;   // tiebreaker game = LAST game row
  return {
    games: games,
    tiebreaker: tiebreaker,
    tiebreakerGame: last ? { team1: last.team1, team2: last.team2 } : null
  };
}

/* ---------- Build a "Week N" tab (auto-fill games if reachable; else empty for hand-entry) ----------
   NOTE: Apps Script runs on Google's servers, and ESPN's Akamai layer often 403s datacenter IPs.
   So the schedule auto-fill is a NICE-TO-HAVE: we try several sources, but if ALL fail we still
   create the tab (header + TIEBREAKER row + dropdowns) so Nick can hand-enter the games.
   This function NEVER throws for a fetch failure — it degrades gracefully. -------------------------- */
function buildWeekSchedule(week) {
  week = Number(week);
  if (!week || week < 1 || week > 18) { safeToast_("Enter a week number 1-18."); return 0; }

  var games = fetchWeekGames_(week);            // [] if every source is blocked/unreachable
  var autoFilled = games.length > 0;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = "Week " + week;
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clear();

  // header
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight("bold");

  // game rows (team1/team2 filled if we got them; else NONE — Nick types team1/team2 by hand)
  var rows = games.map(function (g) {
    return [g.team1, g.team2].concat(PLAYERS.map(function () { return ""; }));
  });
  if (!autoFilled) {
    // seed a handful of blank game rows so there's an obvious place to type teams + a shape to fill
    for (var i = 0; i < 16; i++) rows.push(["", ""].concat(PLAYERS.map(function () { return ""; })));
  }
  // TIEBREAKER row (blank totals for each player to fill)
  rows.push([TIEBREAKER_LABEL, ""].concat(PLAYERS.map(function () { return ""; })));
  sheet.getRange(2, 1, rows.length, HEADER.length).setValues(rows);

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADER.length);

  // dropdowns only make sense once team1/team2 exist; safe to run either way (skips blank rows).
  try { addDropdowns(week); } catch (e) { /* never let dropdowns break tab creation */ }

  if (autoFilled) {
    safeToast_("Built " + name + " with " + games.length + " games + dropdowns.");
  } else {
    safeToast_("Built " + name + " (empty). Schedule sources were unreachable from Google — type each game's " +
               "team1/team2, then run Picks Tools → Add dropdowns.");
  }
  return games.length;
}

/* ---------- Schedule fetch: try several sources; return [] on total failure (never throws) ----------
   Order: (1) ESPN site scoreboard with browser-like headers, (2) ESPN core CDN API,
          (3) Sleeper's public NFL schedule. First one that yields games wins. --------------------- */
function fetchWeekGames_(week) {
  var sources = [espnSiteGames_, espnCoreGames_, sleeperGames_];
  for (var i = 0; i < sources.length; i++) {
    try {
      var games = sources[i](week);
      if (games && games.length) {
        games.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
        return games;                           // away=team1, home=team2, sorted by kickoff
      }
    } catch (e) { /* try the next source */ }
  }
  return [];
}

// (1) ESPN site scoreboard, with browser-like headers (sometimes gets past Akamai from Google IPs).
function espnSiteGames_(week) {
  var url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
          + "?week=" + week + "&seasontype=2&dates=" + SEASON;
  var res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "Referer": "https://www.espn.com/nfl/scoreboard",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  if (res.getResponseCode() !== 200) return [];
  var data = JSON.parse(res.getContentText());
  var out = [];
  (data.events || []).forEach(function (ev) {
    var comp = ev.competitions && ev.competitions[0];
    if (!comp || !comp.competitors || comp.competitors.length < 2) return;
    var c0 = comp.competitors[0], c1 = comp.competitors[1];
    var a0 = c0.team && c0.team.abbreviation, a1 = c1.team && c1.team.abbreviation;
    if (!a0 || !a1) return;
    var away = c0.homeAway === "away" ? a0 : a1;
    var home = c0.homeAway === "home" ? a0 : a1;
    out.push({ team1: String(away || a0).toUpperCase(), team2: String(home || a1).toUpperCase(),
               date: ev.date || (comp && comp.date) || "" });
  });
  return out;
}

// (2) ESPN core CDN API (different host than the Akamai-guarded site API; often reachable).
// Lists events with $ref links, then reads each event's competitors for team abbreviations.
function espnCoreGames_(week) {
  var base = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/" + SEASON
           + "/types/2/weeks/" + week + "/events?lang=en&region=us";
  var res = UrlFetchApp.fetch(base, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return [];
  var data = JSON.parse(res.getContentText());
  var items = data.items || [];
  var out = [];
  for (var i = 0; i < items.length; i++) {
    var ref = items[i] && items[i].$ref;
    if (!ref) continue;
    try {
      var er = UrlFetchApp.fetch(ref.replace(/^http:/, "https:"), { muteHttpExceptions: true });
      if (er.getResponseCode() !== 200) continue;
      var ev = JSON.parse(er.getContentText());
      var comp = ev.competitions && ev.competitions[0];
      if (!comp || !comp.competitors || comp.competitors.length < 2) continue;
      // each competitor carries a team $ref; fetch the abbreviation
      var abbr = comp.competitors.map(function (c) {
        try {
          var tr = UrlFetchApp.fetch(String(c.team.$ref).replace(/^http:/, "https:"), { muteHttpExceptions: true });
          if (tr.getResponseCode() !== 200) return null;
          var t = JSON.parse(tr.getContentText());
          return { abbr: t.abbreviation, homeAway: c.homeAway };
        } catch (e) { return null; }
      });
      if (abbr[0] && abbr[1]) {
        var away = abbr[0].homeAway === "away" ? abbr[0].abbr : abbr[1].abbr;
        var home = abbr[0].homeAway === "home" ? abbr[0].abbr : abbr[1].abbr;
        out.push({ team1: String(away).toUpperCase(), team2: String(home).toUpperCase(),
                   date: ev.date || "" });
      }
    } catch (e) { /* skip this event */ }
  }
  return out;
}

// (3) Sleeper's public NFL schedule (doesn't block Google). Returns games w/ home/away abbrevs.
function sleeperGames_(week) {
  var url = "https://api.sleeper.app/schedule/nfl/regular/" + week;
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return [];
  var arr = JSON.parse(res.getContentText());
  if (!arr || !arr.length) return [];
  var out = [];
  arr.forEach(function (g) {
    var away = g.away, home = g.home;
    if (!away || !home) return;
    out.push({ team1: String(away).toUpperCase(), team2: String(home).toUpperCase(),
               date: g.date || (g.gameday ? (g.gameday + " " + (g.time || "")) : "") });
  });
  return out;
}

// Toast that never throws (menu context always has a spreadsheet; guard anyway).
function safeToast_(msg) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Picks Tools", 6); } catch (e) {}
}

/* ---------- Per-game dropdowns (each game's two team abbrevs) ---------- */
function addDropdowns(week) {
  week = Number(week);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Week " + week);
  if (!sheet) throw new Error("no 'Week " + week + "' tab — run buildWeekSchedule first");
  var values = sheet.getDataRange().getValues();
  var firstPlayerCol = 3;                       // col C (1-based): team1=A, team2=B, players start C
  for (var r = 1; r < values.length; r++) {     // skip header row
    var t1 = String(values[r][0] == null ? "" : values[r][0]).trim();
    var t2 = String(values[r][1] == null ? "" : values[r][1]).trim();
    if (!t1 || t1.toUpperCase() === TIEBREAKER_LABEL) continue;   // no dropdown on the tiebreaker row
    if (!t2) continue;
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList([t1.toUpperCase(), t2.toUpperCase()], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(r + 1, firstPlayerCol, 1, PLAYERS.length).setDataValidation(rule);
  }
  safeToast_("Dropdowns set for Week " + week + " (games with both teams filled).");
}

/* ---------- Custom menu ---------- */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Picks Tools")
    .addItem("Build week schedule…", "menuBuildWeek_")
    .addItem("Add dropdowns to a week…", "menuAddDropdowns_")
    .addSeparator()
    .addItem("Show Web App JSON URL note", "menuShowUrlNote_")
    .addToUi();
}

function menuBuildWeek_() {
  var wk = promptWeek_("Build schedule — which week? (1-18)");
  if (wk) buildWeekSchedule(wk);
}
function menuAddDropdowns_() {
  var wk = promptWeek_("Add dropdowns — which week? (1-18)");
  if (wk) addDropdowns(wk);
}
function menuShowUrlNote_() {
  SpreadsheetApp.getUi().alert(
    "Deploy → New deployment → Web app (Execute as: Me · Access: Anyone) → copy the /exec URL, " +
    "then paste it into the website's SHEET.jsonUrl. Re-deploy (Manage deployments → edit → Deploy) " +
    "after code changes to update the live URL."
  );
}
function promptWeek_(msg) {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Picks Tools", msg, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return null;
  var wk = parseInt(String(resp.getResponseText()).trim(), 10);
  if (isNaN(wk) || wk < 1 || wk > 18) { ui.alert("Please enter a week number 1-18."); return null; }
  return wk;
}

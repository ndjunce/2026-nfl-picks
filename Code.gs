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
var HEADER  = ["team1", "team2"].concat(PLAYERS).concat(["team2_spread"]);
var TIEBREAKER_LABEL = "TIEBREAKER";
var MODE_LABEL = "PICK_MODE";

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

  var games = [], tiebreaker = {}, mode = "straight";
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
    if (t1.toUpperCase() === MODE_LABEL) {
      mode = up(row[col.team2]) === "SPREAD" ? "spread" : "straight";
      continue;
    }
    var t2 = String(row[col.team2] == null ? "" : row[col.team2]).trim();
    if (!t2) continue;
    var picks = {};
    PLAYERS.forEach(function (p) { picks[p] = up(row[col[p]]); });
    var spreadCol = header.indexOf("team2_spread");
    var spreadRaw = spreadCol < 0 ? "" : row[spreadCol];
    var team2Spread = spreadRaw === "" || spreadRaw == null ? null : Number(spreadRaw);
    games.push({ team1: up(t1), team2: up(t2), picks: picks,
      team2Spread: isFinite(team2Spread) ? team2Spread : null });
  }
  var locked = PropertiesService.getDocumentProperties().getProperty("SPREAD_LINES_" + SEASON + "_" + sheet.getName().match(/\d+/)[0]);
  var receipt = locked ? JSON.parse(locked) : null;
  if (mode === "spread") {
    var saved = receipt ? receipt.games : {};
    games.forEach(function (g) {
      var key = [g.team1, g.team2].sort().join("|");
      var official = saved[key];
      g.lineLocked = !!(official && official.team2 === g.team2 && isFinite(Number(official.line)));
      g.team2Spread = g.lineLocked ? Number(official.line) : null;
      g.lineSource = g.lineLocked ? (official.source || "sheet-manual") : null;
      g.lineLockedAt = g.lineLocked ? (official.lockedAt || receipt.lockedAt || null) : null;
    });
  }
  var last = games.length ? games[games.length - 1] : null;   // tiebreaker game = LAST game row
  return {
    mode: mode,
    linesLocked: mode === "spread" && games.length > 0 && games.every(function (g) { return g.lineLocked; }),
    lineLockedAt: mode === "spread" && receipt ? receipt.lockedAt : null,
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
    return [g.team1, g.team2].concat(PLAYERS.map(function () { return ""; })).concat([""]);
  });
  if (!autoFilled) {
    // seed a handful of blank game rows so there's an obvious place to type teams + a shape to fill
    for (var i = 0; i < 16; i++) rows.push(["", ""].concat(PLAYERS.map(function () { return ""; })).concat([""]));
  }
  // TIEBREAKER row (blank totals for each player to fill)
  rows.push([TIEBREAKER_LABEL, ""].concat(PLAYERS.map(function () { return ""; })).concat([""]));
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
    .addItem("Enable ESPN spread auto-lock", "installSpreadLockTrigger")
    .addItem("Lock official spreads for a week…", "menuLockSpreads_")
    .addSeparator()
    .addItem("Show Web App JSON URL note", "menuShowUrlNote_")
    .addToUi();
}

// Install once as the Sheet owner. A simple onEdit cannot use authorized UrlFetchApp.
function installSpreadLockTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === "captureEspnSpreadOnEdit_";
  });
  if (!exists) ScriptApp.newTrigger("captureEspnSpreadOnEdit_").forSpreadsheet(ss).onEdit().create();
  safeToast_(exists ? "ESPN spread auto-lock already enabled." : "ESPN spread auto-lock enabled. Test one pick before relying on it.");
}

function captureEspnSpreadOnEdit_(event) {
  if (!event || !event.range) return;
  var sheet = event.range.getSheet();
  var match = /^Week\s+(\d+)$/i.exec(sheet.getName());
  if (!match || event.range.getRow() < 2) return;
  var week = Number(match[1]);
  var guard = LockService.getDocumentLock();
  guard.waitLock(30000);
  try {
    var values = sheet.getDataRange().getValues();
    var header = values[0].map(function (v) { return String(v).trim().toLowerCase(); });
    var a = header.indexOf("team1"), b = header.indexOf("team2"), s = header.indexOf("team2_spread");
    if (a < 0 || b < 0 || s < 0) return;
    var firstPlayer = header.indexOf(PLAYERS[0].toLowerCase()) + 1;
    if (firstPlayer < 1 || event.range.getColumn() > firstPlayer + PLAYERS.length - 1 ||
        event.range.getLastColumn() < firstPlayer) return;
    var spreadMode = values.some(function (row) {
      return String(row[a]).trim().toUpperCase() === MODE_LABEL &&
        String(row[b]).trim().toUpperCase() === "SPREAD";
    });
    if (!spreadMode) return;
    var key = "SPREAD_LINES_" + SEASON + "_" + week;
    var props = PropertiesService.getDocumentProperties();
    var receipt = JSON.parse(props.getProperty(key) || '{"games":{}}');
    for (var rowNum = event.range.getRow(); rowNum <= event.range.getLastRow(); rowNum++) {
      var row = values[rowNum - 1];
      var team1 = String(row[a] || "").trim().toUpperCase();
      var team2 = String(row[b] || "").trim().toUpperCase();
      if (!team1 || !team2 || team1 === MODE_LABEL || team1 === TIEBREAKER_LABEL) continue;
      var matchup = [team1, team2].sort().join("|");
      if (receipt.games[matchup]) continue;
      var hasPick = PLAYERS.some(function (player) {
        var col = header.indexOf(player.toLowerCase());
        var pick = String(row[col] || "").trim().toUpperCase();
        return pick === team1 || pick === team2;
      });
      if (!hasPick) continue;
      var line = fetchEspnLine_(week, team1, team2);
      if (!line) throw new Error("ESPN spread unavailable for " + team1 + " vs " + team2 + "; line remains unlocked");
      receipt.games[matchup] = {team2:team2,line:line.line,source:"ESPN / " + line.provider,
        eventId:line.eventId,lockedAt:new Date().toISOString()};
      receipt.lockedAt = receipt.lockedAt || receipt.games[matchup].lockedAt;
      props.setProperty(key, JSON.stringify(receipt));
      sheet.getRange(rowNum, s + 1).setValue(line.line);
    }
  } finally { guard.releaseLock(); }
}

function fetchEspnLine_(week, team1, team2) {
  var base = "/apis/site/v2/sports/football/nfl/scoreboard?week=" + week +
    "&seasontype=2&dates=" + SEASON;
  var hosts = ["https://site.web.api.espn.com", "https://site.api.espn.com"];
  for (var i = 0; i < hosts.length; i++) {
    try {
      var res = UrlFetchApp.fetch(hosts[i] + base, {muteHttpExceptions:true});
      if (res.getResponseCode() !== 200) continue;
      var data = JSON.parse(res.getContentText());
      for (var j = 0; j < (data.events || []).length; j++) {
        var ev = data.events[j], comp = ev.competitions && ev.competitions[0];
        if (!comp) continue;
        var teams = comp.competitors || [];
        var home = teams.filter(function (c) { return c.homeAway === "home"; })[0];
        var away = teams.filter(function (c) { return c.homeAway === "away"; })[0];
        if (!home || !away) continue;
        var homeAbbr = String(home.team.abbreviation).toUpperCase();
        var awayAbbr = String(away.team.abbreviation).toUpperCase();
        if ([homeAbbr, awayAbbr].sort().join("|") !== [team1, team2].sort().join("|")) continue;
        var odds = (comp.odds || [])[0];
        if (!odds || !odds.pointSpread) return null;
        var homeRaw = odds.pointSpread.home && odds.pointSpread.home.close && odds.pointSpread.home.close.line;
        var awayRaw = odds.pointSpread.away && odds.pointSpread.away.close && odds.pointSpread.away.close.line;
        if (homeRaw == null || awayRaw == null || homeRaw === "" || awayRaw === "") return null;
        var homeLine = Number(homeRaw), awayLine = Number(awayRaw);
        if (!isFinite(homeLine) || !isFinite(awayLine) || Math.abs(homeLine + awayLine) > 0.001 ||
            Math.abs(homeLine) > 50) return null;
        return {line:team2 === homeAbbr ? homeLine : awayLine,
          provider:odds.provider && odds.provider.name || "unknown provider",eventId:String(ev.id)};
      }
    } catch (err) { /* try the other ESPN host */ }
  }
  return null;
}

// Read-only diagnostic for the owner before enabling automatic locks.
function testWeek10EspnAccess() {
  var checks = [["WSH", "NYG"], ["KC", "ATL"], ["LAC", "BAL"]];
  checks.forEach(function (teams) {
    var result = fetchEspnLine_(10, teams[0], teams[1]);
    if (!result) throw new Error("ESPN access/line failed for " + teams.join(" vs "));
    console.log(JSON.stringify({teams:teams,espn:result}));
  });
}

function menuBuildWeek_() {
  var wk = promptWeek_("Build schedule — which week? (1-18)");
  if (wk) buildWeekSchedule(wk);
}
function menuAddDropdowns_() {
  var wk = promptWeek_("Add dropdowns — which week? (1-18)");
  if (wk) addDropdowns(wk);
}
function menuLockSpreads_() {
  var wk = promptWeek_("Lock official spreads — which week? (1-18)");
  if (wk) lockWeekSpreads(wk);
}
function lockWeekSpreads(week) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Week " + Number(week));
  if (!sheet) throw new Error("Week tab missing");
  var key = "SPREAD_LINES_" + SEASON + "_" + Number(week);
  var properties = PropertiesService.getDocumentProperties();
  var receipt = JSON.parse(properties.getProperty(key) || '{"games":{}}');
  var values = sheet.getDataRange().getValues();
  var header = values[0].map(function (cell) { return String(cell).trim().toLowerCase(); });
  var a = header.indexOf("team1"), b = header.indexOf("team2"), s = header.indexOf("team2_spread");
  if (a < 0 || b < 0 || s < 0) throw new Error("team1, team2 and team2_spread columns required");
  var modeRow = values.some(function (row) { return String(row[a]).trim().toUpperCase() === MODE_LABEL && String(row[b]).trim().toUpperCase() === "SPREAD"; });
  if (!modeRow) throw new Error("Add a PICK_MODE / SPREAD row before locking lines");
  var saved = receipt.games, count = 0;
  values.slice(1).forEach(function (row) {
    var first = String(row[a] || "").trim().toUpperCase(), second = String(row[b] || "").trim().toUpperCase();
    if (!first || !second || first === MODE_LABEL || first === TIEBREAKER_LABEL) return;
    var matchup = [first, second].sort().join("|");
    if (Object.prototype.hasOwnProperty.call(saved, matchup)) {
      if (saved[matchup].team2 !== second) throw new Error("Locked side changed for " + matchup);
      return;
    }
    var raw = row[s], number = Number(raw);
    if (raw === "" || raw == null || !isFinite(number) || Math.abs(number) > 50) throw new Error("Missing/invalid signed team2 spread for " + first + " vs " + second);
    saved[matchup] = {team2:second,line:number,source:"sheet-manual",lockedAt:new Date().toISOString()}; count++;
  });
  if (count < 1) throw new Error("No unlocked game rows to lock");
  receipt.lockedAt = receipt.lockedAt || new Date().toISOString();
  properties.setProperty(key, JSON.stringify(receipt));
  safeToast_("Locked " + count + " remaining Week " + week + " spreads; existing locks were preserved.");
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

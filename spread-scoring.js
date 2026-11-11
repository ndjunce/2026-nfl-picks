/* Week-level contest mode. Signed line is always attached to team2. */
(function(root){
  function mode(value){ return String(value||'straight').trim().toLowerCase()==='spread'?'spread':'straight'; }
  function line(value){
    if(value===null||value===undefined||String(value).trim()==='')return null;
    const number=Number(value);
    return Number.isFinite(number)&&Math.abs(number)<=50?number:null;
  }
  function grade(game,info,contestMode){
    if(!info||!info.completed)return {winner:null,push:false,missingLine:false};
    if(mode(contestMode)!=='spread')return {winner:info.winner||null,push:!info.winner,missingLine:false};
    const spread=line(game.team2Spread);
    if(spread===null)return {winner:null,push:false,missingLine:true};
    const a=Number(info.scores?.[String(game.team1).toUpperCase()]);
    const b=Number(info.scores?.[String(game.team2).toUpperCase()]);
    if(!Number.isFinite(a)||!Number.isFinite(b))return {winner:null,push:false,missingLine:false};
    const margin=b+spread-a;
    return {winner:margin>0?String(game.team2).toUpperCase():margin<0?String(game.team1).toUpperCase():null,
      push:margin===0,missingLine:false};
  }
  function label(game){
    const spread=line(game.team2Spread);
    if(spread===null)return Object.values(game.picks||{}).some(Boolean)?'line unavailable':'awaiting first pick';
    if(spread===0)return 'Pick’em';
    const favorite=spread<0?game.team2:game.team1;
    return String(favorite).toUpperCase()+' −'+Math.abs(spread);
  }
  function signedFor(game,team){
    const saved=line(game.team2Spread);
    if(saved===null || (team!==game.team1 && team!==game.team2))return '';
    const side=team===game.team2?saved:-saved;
    return side===0?'PK':(side<0?'−':'+')+Math.abs(side);
  }
  // Use the site's pregame sigmoid for a margin relative to the locked line.
  // Live updates narrow the margin distribution as regulation time runs out.
  function coverForecast(game, info){
    const locked = line(game.team2Spread);
    if(locked===null || !info || !['pre','in'].includes(info.state)) return null;
    const [a,b] = [game.team1,game.team2];
    let expectedMargin = -(line(info.marketSpread?.[b]) ?? locked);
    let scale = 0.14;
    if(info.state==='in'){
      const period = info.period;
      const clock = info.clock;
      const aScore = info.scores?.[a], bScore = info.scores?.[b];
      if(!Number.isInteger(period) || period<1 || !Number.isFinite(clock) ||
         clock<0 || clock>900 || !Number.isFinite(aScore) || !Number.isFinite(bScore)) return null;
      // Keep a small uncertainty floor for the last plays and overtime.
      const remaining = period<=4 ? ((4-period)*900 + clock)/3600 : clock/3600;
      scale /= Math.sqrt(Math.max(0.01,remaining));
      expectedMargin = bScore - aScore - locked * remaining;
    }
    const adjustedMargin = expectedMargin + locked;
    const sigmoid = x => 1/(1+Math.exp(-x));
    const halfPoint = Number.isInteger(locked) ? 0.5 : 0;
    const pB = sigmoid(scale*(adjustedMargin-halfPoint));
    const pA = sigmoid(scale*(-adjustedMargin-halfPoint));
    const pushProb = halfPoint ? Math.max(0,1-pA-pB) : 0;
    return { winProb:{[a]:pA,[b]:pB}, pushProb, probSource:'cover-model' };
  }
  root.SpreadScoring={mode,line,grade,label,signedFor,coverForecast};
})(typeof window!=='undefined'?window:globalThis);

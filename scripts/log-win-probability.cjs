const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
function loadEngine(source,picks){
  const context={PICKS:picks,LOGOS:{},mkey:(first,second)=>[first.toUpperCase(),second.toUpperCase()].sort().join('|')};
  vm.createContext(context);
  const start=source.indexOf('function indexGames(data){'),end=source.indexOf('function pathNeedsText(');
  if(start<0||end<start) throw new Error('Scorer boundaries changed; refusing alternate scoring');
  vm.runInContext(source.slice(start,end),context,{timeout:2000});
  return context;
}
function observation(source,picks,scoreboard,now=new Date()){
  const engine=loadEngine(source,picks);
  const index=engine.indexGames(scoreboard);
  if(!picks.games.length || Object.keys(index).length!==picks.games.length) throw new Error('Incomplete scoreboard coverage');
  const games=picks.games.map(game=>{
    const info=index[engine.mkey(game.team1,game.team2)];
    if(!info) throw new Error('Scheduled matchup missing');
    return {g:game,info};
  });
  const last=index[engine.mkey(picks.tiebreakerGame.team1,picks.tiebreakerGame.team2)];
  const result=engine.computePathToWin(games,picks.players,picks.tiebreaker,last.completed?last.total:null);
  const valid=result.enumerated&&result.hasProbSource;
  const probabilities=valid?Object.fromEntries(result.results.map(row=>[row.name,row.winPct])):null;
  let finalResult=null;
  if(result.state==='final'){
    const standings=picks.players.map(name=>({name,correct:games.filter(({g,info})=>info.winner===g.picks[name]).length,guess:picks.tiebreaker[name]==null?null:Number(picks.tiebreaker[name])}));
    const correct=Math.max(...standings.map(row=>row.correct)),leaders=standings.filter(row=>row.correct===correct);
    const canResolve=leaders.length===1||(Number.isFinite(last.total)&&leaders.every(row=>Number.isFinite(row.guess)));
    if(canResolve){
      const distance=Math.min(...leaders.map(row=>Math.abs(row.guess-last.total)));
      finalResult={at:now.toISOString(),winners:leaders.filter(row=>leaders.length===1||Math.abs(row.guess-last.total)===distance).map(row=>row.name),correct,totalGames:games.length,tiebreakerActual:last.total,decidedBy:leaders.length>1?'tiebreaker':'correct picks',standings};
    }
  }
  if(probabilities && (!Object.values(probabilities).every(value=>Number.isFinite(value)&&value>=0&&value<=1)||Math.abs(Object.values(probabilities).reduce((sum,value)=>sum+value,0)-1)>1e-6)) throw new Error('Invalid computed probabilities');
  return {at:now.toISOString(),state:result.state,activeGames:(scoreboard.events||[]).filter(event=>(event.competitions?.[0]?.status||event.status)?.type?.state==='in').length,finalGames:result.finalsCount,totalGames:result.totalGames,
    calculation:crypto.createHash('sha256').update(source.slice(source.indexOf('function indexGames(data){'),source.indexOf('function pathNeedsText('))).digest('hex').slice(0,16),
    fingerprint:crypto.createHash('sha256').update(JSON.stringify(picks)).digest('hex').slice(0,16),
    ...(finalResult?{finalResult}:{}),probabilities,reason:valid?null:result.state==='final'?'Week finalized; no live percentage displayed':'Incomplete probability coverage'};
}
function append(history,record){
  const previous=history.points.at(-1);
  const content=point=>JSON.stringify({...point,at:undefined});
  if(previous&&Date.parse(record.at)<=Date.parse(previous.at)) throw new Error('Observation timestamp must advance');
  if(previous&&content(previous)===content(record)&&Date.parse(record.at)-Date.parse(previous.at)<5*60000) return false;
  history.points.push(record);
  return true;
}
async function json(url){
  const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 NFL-Picks-History/1.0'},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`Source HTTP ${response.status}`);
  return response.json();
}
async function main(){
  const source=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const feedUrl=source.match(/jsonUrl:\s*"([^"]+)"/)?.[1];
  if(!feedUrl) throw new Error('Public picks feed not configured');
  const [feed,current]=await Promise.all([json(feedUrl),json('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')]);
  const season=Number(current.season?.year);
  let week=Number(current.week?.number),scoreboard=current;
  if(season!==Number(feed.season)||!Number.isInteger(week)||week<1||week>18||Number(current.season?.type)!==2) throw new Error('Season/week mismatch or not regular season');
  // ESPN may leave the completed prior week as its default after all next-week
  // picks arrive. Start the next week only when every public player picked its slate.
  const next=feed.weeks?.[week+1];
  const priorComplete=Array.isArray(current.events)&&current.events.length>0&&current.events.every(event=>
    !!(event.competitions?.[0]?.status?.type?.completed));
  const nextComplete=Array.isArray(next?.games)&&next.games.length>0&&Array.isArray(feed.players)&&
    next.games.every(game=>feed.players.every(player=>[game.team1,game.team2].includes(game.picks?.[player])));
  if(priorComplete&&nextComplete&&week<18){
    const upcoming=await json(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${week+1}`);
    if(Number(upcoming.season?.year)!==season||Number(upcoming.week?.number)!==week+1) throw new Error('Next-week scoreboard mismatch');
    week++;
    scoreboard=upcoming;
  }
  const directory=path.join(ROOT,'data','win-history');
  fs.mkdirSync(directory,{recursive:true});
  for(const number of [week-1,week].filter(value=>value>=1)){
    const file=path.join(directory,`${season}-week-${number}.json`);
    const existing=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
    if(existing?.points.at(-1)?.state==='final') continue;
    if(number!==week&&!existing) continue;
    const raw=feed.weeks?.[number];
    if(!raw?.games?.length) continue;
    const players=feed.players;
    if(!Array.isArray(players)||!players.length||players.length>12||players.some(player=>typeof player!=='string')) throw new Error('Invalid public roster');
    const games=raw.games.map(game=>({team1:String(game.team1).trim().toUpperCase(),team2:String(game.team2).trim().toUpperCase(),picks:Object.fromEntries(players.map(player=>[player,String(game.picks?.[player]||'').trim().toUpperCase()]))}));
    if(games.some(game=>players.some(player=>![game.team1,game.team2].includes(game.picks[player])))) continue;
    const tiebreaker=Object.fromEntries(players.map(player=>{
      const value=raw.tiebreaker?.[player];
      return [player,value==null||String(value).trim()===''?null:Number(value)];
    }));
    if(Object.values(tiebreaker).some(value=>value!==null&&!Number.isFinite(value))) throw new Error('Invalid public tiebreaker');
    const picks={season,week:number,players,games,tiebreaker,tiebreakerGame:raw.tiebreakerGame||games.at(-1)};
    const board=number===week?scoreboard:await json(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${number}`);
    if(Number(board.season?.year)!==season||Number(board.week?.number)!==number) throw new Error('Scoreboard week mismatch');
    const history=existing||{version:1,season,week:number,players,points:[]};
    if(history.version!==1||JSON.stringify(history.players)!==JSON.stringify(players)) throw new Error('History roster/schema changed; preserve existing file');
    const record=observation(source,picks,board);
    if(append(history,record)){
      const temporary=file+'.tmp';
      fs.writeFileSync(temporary,JSON.stringify(history)+'\n');
      fs.renameSync(temporary,file);
    }
    console.log(`Week ${number}: ${record.probabilities?'valid estimate':record.reason}; ${history.points.length} shared observations`);
  }
}
module.exports={loadEngine,observation,append};
if(require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});

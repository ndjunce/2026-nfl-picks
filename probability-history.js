(function(){
  const colors=['#4aa8ff','#33e08a','#ffd23f','#ff8596','#bb9aff','#5ddbdd'];
  let request=0,lastKey='',lastFetch=0;
  let displayed=null;
  const selections=new WeakMap();
  const escape=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const time=value=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))+' CT';
  function timeline(points,windows=[]){
    const stamps=points.map(point=>Date.parse(point.at));
    const spans=windows.map(window=>[Date.parse(window.start),Date.parse(window.end)]).filter(([start,end])=>Number.isFinite(start)&&Number.isFinite(end)&&end>=start);
    const positions=[0],breaks=[];
    for(let index=1;index<points.length;index++){
      const start=stamps[index-1],end=stamps[index],elapsed=end-start;
      const idle=spans.length?!spans.some(([a,b])=>a<end&&b>start):points[index-1].activeGames===0&&points[index].activeGames===0;
      const compressed=elapsed>30*60000||idle;
      const duration=idle?Math.min(elapsed*.01,10*60000):compressed?Math.min(elapsed,10*60000):elapsed;
      positions.push(positions.at(-1)+duration);
      if(elapsed>duration)breaks.push({index,start,end});
    }
    return {positions,breaks,total:positions.at(-1),stamps};
  }
  function segments(points,player){
    const paths=[];let current=[];let previous=null;
    for(const point of points){
      const value=point.probabilities?.[player];
      if(value==null||!Number.isFinite(value)||value<0||value>1){if(current.length)paths.push(current);current=[];previous=null;continue;}
      if(previous&&(Date.parse(point.at)-Date.parse(previous.at)>30*60000||previous.fingerprint!==point.fingerprint||previous.calculation!==point.calculation)){if(current.length)paths.push(current);current=[];}
      current.push({at:Date.parse(point.at),value});previous=point;
    }
    if(current.length)paths.push(current);
    return paths;
  }
  function render(data,element){
    displayed={data,element};
    if(data.version!==1||!Array.isArray(data.players)||!Array.isArray(data.points)||data.points.length>10000)throw new Error('History format unavailable');
    const finalResult=data.finalResult||data.points.findLast(point=>point.finalResult)?.finalResult;
    const points=data.points.filter(point=>Number.isFinite(Date.parse(point.at))).sort((first,second)=>Date.parse(first.at)-Date.parse(second.at)).map(point=>point.state==='final'&&finalResult?{...point,settled:true,probabilities:Object.fromEntries(data.players.map(player=>[player,finalResult.winners.includes(player)?1/finalResult.winners.length:0]))}:point);
    if(data.players.some(player=>typeof player!=='string')||new Set(data.players).size!==data.players.length||points.some(point=>point.probabilities && data.players.some(player=>!Number.isFinite(point.probabilities[player])||point.probabilities[player]<0||point.probabilities[player]>1)))throw new Error('Invalid saved probabilities');
    const valid=points.filter(point=>point.probabilities&&!point.settled);
    if(!points.length){element.textContent='No shared observations yet for this week.';return;}
    const first=Date.parse(points[0].at),last=Date.parse(points.at(-1).at);
    if(points.length===1){
      const point=points[0];
      element.innerHTML=`<p><strong>Only one snapshot saved — no history curve yet.</strong></p><p class="note" style="text-align:left">Saved ${escape(time(point.at))}. These are the percentages at that time, not the current standings. Shared logging runs automatically; this file has only one saved point so far.</p><div data-name-labels style="display:flex;flex-wrap:wrap;gap:8px">${data.players.map((player,index)=>`<div style="border:1px solid #526079;border-radius:6px;padding:10px"><span style="color:${colors[index%colors.length]}">${escape(player)}</span> <strong>${point.probabilities?(point.probabilities[player]*100).toFixed(1)+'%':'Unavailable'}</strong></div>`).join('')}</div><p class="note" style="text-align:left">Earlier live percentages were not saved. The separate reconstructed view is an estimate, not captured history.</p>`;
      return;
    }
    const width=Math.max(600,Math.min(760,element.clientWidth||760)),right=width-20;
    const axis=timeline(points,data.gameWindows);
    const x=value=>{
      if(!axis.total)return width/2;
      let index=axis.stamps.findIndex(stamp=>stamp>=value);if(index<0)index=points.length-1;
      const before=Math.max(0,index-1),fraction=index===before?0:(value-axis.stamps[before])/(axis.stamps[index]-axis.stamps[before]);
      return 45+(axis.positions[before]+fraction*(axis.positions[index]-axis.positions[before]))/axis.total*(right-45);
    };
    const y=value=>230-value*200;
    const grid=[0,.25,.5,.75,1].map(value=>`<line x1="45" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="#28313f"${value===.5?' stroke-dasharray="5 5"':''}/><text x="36" y="${y(value)+4}" text-anchor="end" fill="#8f9cb0" font-size="12">${value*100}%</text>`).join('');
    const sharedPaths=new Map();
    data.players.forEach((player,index)=>segments(points,player).forEach(segment=>{
      const coordinates=segment.length===1?`${x(segment[0].at)-6},${y(segment[0].value)} ${x(segment[0].at)+6},${y(segment[0].value)}`:segment.map(point=>`${x(point.at)},${y(point.value)}`).join(' ');
      if(!sharedPaths.has(coordinates))sharedPaths.set(coordinates,[]);
      sharedPaths.get(coordinates).push({player,index});
    }));
    const curves=[...sharedPaths].map(([coordinates,players])=>players.map(({player,index},stripe)=>`<polyline data-player="${escape(player)}" fill="none" stroke="${colors[index%colors.length]}" stroke-width="3"${players.length>1?` stroke-dasharray="8 ${(players.length-1)*8}" stroke-dashoffset="${-stripe*8}"`:''} points="${coordinates}"><title>${escape(players.length>1?'Shared line: '+players.map(row=>row.player).join(', '):player)}</title></polyline>`).join('')).join('');
    const breaks=axis.breaks.map(gap=>`<g data-time-break><title>Skipped time: ${escape(time(gap.start))} to ${escape(time(gap.end))}</title><line x1="${(x(gap.start)+x(gap.end))/2}" x2="${(x(gap.start)+x(gap.end))/2}" y1="30" y2="230" stroke="#8f9cb0" stroke-dasharray="2 5"/><text x="${(x(gap.start)+x(gap.end))/2}" y="247" text-anchor="middle" fill="#ffd23f" font-size="14">»</text></g>`).join('');
    const days=axis.breaks.filter(gap=>gap.end-gap.start>3*3600000).map(gap=>`<text x="${Math.max(95,Math.min(right-45,x(gap.end)+35))}" y="20" text-anchor="middle" fill="#8f9cb0" font-size="11">${escape(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',month:'numeric',day:'numeric'}).format(new Date(gap.end)))}</text>`).join('');
    const reconstructed=data.kind==='reconstruction';
    element.innerHTML=`${reconstructed?`<p style="padding:10px;border:1px solid #ffd23f;color:#ffd23f;font-size:13px"><b>RECONSTRUCTED ESTIMATE — not recorded site history.</b> Archived public picks replayed against archived odds and ESPN play-level probabilities. This does not prove what the site showed at the time.</p><details style="font-size:13px"><summary>Reconstruction assumptions and sources</summary><p>${escape(data.method||'')}</p><ul>${(data.limitations||[]).map(item=>`<li>${escape(item)}</li>`).join('')}</ul><p>Generated ${escape(time(data.generatedAt))}. Original recorded snapshots are kept separately.</p></details>`:''}<p class="note" style="text-align:left">${location.hostname==='127.0.0.1'||location.hostname==='localhost'?'Local preview. ':''}Week ${data.week} · ${reconstructed?'reconstruction begins':'shared history starts'} ${escape(time(points[0].at))}. ${valid.length} valid ${reconstructed?'retrospective estimates':'observations'}. Latest ${reconstructed?'replayed time':'capture'}: ${escape(time(points.at(-1).at))}${!reconstructed&&Date.now()-last>30*60000?' · history may be stale':''}.</p>
      ${valid.length?`<p class="note" style="text-align:left">Game-time view · idle time and long gaps are compressed (»). Tap the chart or use the controls below for the actual time. Missing observations remain breaks in the lines. On a phone, swipe the chart sideways.</p><div style="overflow-x:auto"><svg viewBox="0 0 ${width} 275" role="img" aria-label="Each player's saved weekly win percentage on a compressed timeline" style="display:block;width:100%;height:auto;min-width:600px">${grid}${curves}${breaks}${days}<text x="45" y="263" fill="#8f9cb0" font-size="11">${escape(time(points[0].at))}</text>${last!==first?`<text x="${right}" y="275" text-anchor="end" fill="#8f9cb0" font-size="11">${escape(time(points.at(-1).at))}</text>`:''}</svg></div>`:'<p class="note">No reliable percentages captured yet. Unavailable odds are recorded as gaps.</p>'}
      <div id="history-names" data-name-labels style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:13px"></div><label style="display:block;margin-top:12px;font-size:13px">Inspect observation <input id="history-point" type="range" min="0" max="${points.length-1}" value="${points.length-1}" style="width:100%"></label><div id="history-values" role="status" style="font-size:13px"></div>`;
    const slider=element.querySelector('#history-point');
    if(finalResult){
      const result=finalResult,notice=document.createElement('p');
      notice.style.cssText='padding:12px;border:1px solid #33e08a;border-radius:6px;color:#33e08a;font-weight:700';
      notice.textContent='🏆 '+result.winners.join(' & ')+' won Week '+data.week+' · '+result.correct+'/'+result.totalGames+' correct · '+(result.decidedBy==='tiebreaker'?'tiebreaker total '+result.tiebreakerActual:'most correct picks')+'. '+(data.kind==='reconstruction'?'Final ':'Result captured ')+time(result.at)+'.';
      element.prepend(notice);
    }
    if(reconstructed){
      const notice=document.createElement('p');notice.style.cssText='font-size:13px;color:#ffd23f';
      notice.textContent=(finalResult?'Full-week replay through the final game. The final 100%/0% endpoint is the settled result, not an earlier forecast.':'Partial replay ends '+time(points.at(-1).at)+'. Later game action and the final weekly result are not included.')+' Alternating colors mark identical shared lines; percentages are unchanged.';
      element.prepend(notice);
    }
    slider.value=String(Math.min(points.length-1,selections.get(data)??points.length-1));
    const controls=document.createElement('div');
    controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0';
    controls.innerHTML='<button type="button" data-history-step="first">First</button><button type="button" data-history-step="previous" aria-label="Previous observation">← Previous</button><button type="button" data-history-step="next" aria-label="Next observation">Next →</button><button type="button" data-history-step="latest">Latest</button>';
    slider.parentElement.after(controls);
    controls.querySelectorAll('button').forEach(button=>{button.style.cssText='padding:8px 12px;min-height:44px;border:1px solid #526079;border-radius:6px;background:#161d2a;color:#f2f6fb;cursor:pointer';});
    const show=()=>{
      selections.set(data,Number(slider.value));
      controls.querySelector('[data-history-step="first"]').disabled=controls.querySelector('[data-history-step="previous"]').disabled=Number(slider.value)===0;
      controls.querySelector('[data-history-step="next"]').disabled=controls.querySelector('[data-history-step="latest"]').disabled=Number(slider.value)===points.length-1;
      controls.querySelectorAll('button').forEach(button=>button.style.opacity=button.disabled?'.45':'1');
      const point=points[Number(slider.value)];
      const svg=element.querySelector('svg');
      element.querySelector('#history-names').replaceChildren();
      if(svg){
        svg.querySelector('[data-time-cursor]')?.remove();
        if(point.probabilities){
          const groups=new Map();
          data.players.forEach((player,index)=>{
            const percent=(point.probabilities[player]*100).toFixed(1);
            if(!groups.has(percent))groups.set(percent,{value:Number(percent)/100,players:[]});
            groups.get(percent).players.push({player,color:colors[index%colors.length]});
          });
          const markup=[...groups.values()].sort((a,b)=>b.value-a.value).map(label=>`<div style="display:flex;flex-wrap:wrap;gap:6px 12px;padding:6px 10px;border:1px solid #28313f;border-radius:6px"><strong>${(label.value*100).toFixed(1)}%</strong>${label.players.map(row=>`<span style="color:${row.color}">${escape(row.player)}</span>`).join('')}</div>`).join('');
          const group=document.createElementNS('http://www.w3.org/2000/svg','g');
          group.setAttribute('data-time-cursor','');group.innerHTML=`<line x1="${x(Date.parse(point.at))}" x2="${x(Date.parse(point.at))}" y1="30" y2="230" stroke="#8f9cb0" stroke-dasharray="3 4"/>`;
          svg.appendChild(group);
          element.querySelector('#history-names').innerHTML=markup;
        }
      }
      element.querySelector('#history-values').textContent=time(point.at)+(point.settled?' · FINAL RESULT · ':' · ')+(point.probabilities?data.players.map(player=>`${player} ${(point.probabilities[player]*100).toFixed(1)}%`).join(' · '):point.state==='final'&&finalResult?'Final result: '+finalResult.winners.join(' & ')+' won (settled result, not a forecast percentage).':point.reason||'Unavailable');
      if(point.state==='final'&&finalResult){
        element.querySelector('#history-names').innerHTML=finalResult.standings.map(row=>`<div style="border:1px solid #526079;border-radius:6px;padding:8px"><strong>${finalResult.winners.includes(row.name)?'🏆 ':''}${escape(row.name)}</strong> · ${row.correct} correct · ${finalResult.winners.includes(row.name)?100/finalResult.winners.length:0}% final · total guess ${row.guess}</div>`).join('');
      }
    };
    slider.addEventListener('input',show);
    controls.addEventListener('click',event=>{
      const step=event.target.closest('button')?.dataset.historyStep;if(!step)return;
      slider.value=String(step==='first'?0:step==='latest'?points.length-1:Math.max(0,Math.min(points.length-1,Number(slider.value)+(step==='next'?1:-1))));show();
    });
    const chart=element.querySelector('svg');
    if(chart){
      chart.style.cursor='crosshair';
      chart.addEventListener('click',event=>{
        const bounds=chart.getBoundingClientRect(),position=(event.clientX-bounds.left)/bounds.width*width;
        let nearest=0;
        points.forEach((point,index)=>{if(Math.abs(x(Date.parse(point.at))-position)<Math.abs(x(Date.parse(points[nearest].at))-position))nearest=index;});
        slider.value=String(nearest);show();
      });
    }
    show();
  }
  async function update(season,week){
    const element=document.getElementById('probability-history');if(!element)return;
    const key=`${season}-week-${week}`;
    if(key===lastKey&&Date.now()-lastFetch<60000)return;
    const keepReconstruction=lastKey===key&&displayed?.data.kind==='reconstruction';
    lastKey=key;lastFetch=Date.now();const active=++request;
    element.textContent='Loading shared observations…';
    displayed=null;
    const modes=document.getElementById('history-modes');if(modes)modes.replaceChildren();
    const base=location.hostname==='ndjunce.github.io'?'https://raw.githubusercontent.com/ndjunce/2026-nfl-picks/main/':'';
    try{
      const response=await fetch(`${base}data/win-history/${key}.json`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(active!==request)return;
      if(!response.ok&&response.status!==404)throw new Error('History request failed');
      const data=response.status===404?{version:1,season:Number(season),week:Number(week),players:[],points:[]}:await response.json();if(active!==request)return;
      if(data.season!==Number(season)||data.week!==Number(week))throw new Error('History week mismatch');
      render(data,element);
      try{
        const retrospective=await fetch(`${base}data/win-history/${key}-reconstructed.json`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
        if(!retrospective.ok||active!==request||!modes)return;
        const reconstruction=await retrospective.json();
        if(reconstruction.kind!=='reconstruction'||reconstruction.season!==Number(season)||reconstruction.week!==Number(week))return;
        const label=document.createElement('label');label.textContent='History view: ';label.style.fontSize='13px';
        const select=document.createElement('select');select.id='history-mode';
        select.style.cssText='background:#0b0f16;color:#f2f6fb;padding:8px;border:1px solid #28313f;border-radius:6px;max-width:100%';
        const capturedOption=new Option(data.points.length?'Recorded live snapshots':'Recorded snapshots — none saved','recorded');
        select.add(capturedOption);
        select.add(new Option('Reconstructed Week '+week+' (estimate)','reconstruction'));
        select.value=keepReconstruction||!data.points.length?'reconstruction':'recorded';
        select.addEventListener('change',()=>render(select.value==='recorded'?data:reconstruction,element));
        label.appendChild(select);modes.appendChild(label);
        if(select.value==='reconstruction')render(reconstruction,element);
      }catch(error){}
    }catch(error){if(active===request)element.textContent='Shared history unavailable right now. Live Path to Win above still updates independently.';}
  }
  window.ProbabilityHistory={update,render,segments,timeline};
  window.addEventListener?.('resize',()=>{if(displayed)render(displayed.data,displayed.element);});
  if(typeof document!=='undefined')document.getElementById('win-history-panel')?.addEventListener('toggle',event=>{if(event.target.open&&displayed)render(displayed.data,displayed.element);});
})();

/* DCC v27 — bottom Map = live all parks, rides + character meets right now */
const dccV27BaseRefresh=dccRefreshOverlays;
const dccV27BaseOpenPark=dccOpenPark;
let dccV27LiveAllActive=false;

function dccV27Time(t){try{return new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch(e){return''}}
function dccV27CharacterState(row){
 const live=row&&row.live,shows=(live&&live.showtimes)||[],now=Date.now();
 let future=[];
 for(const s of shows){let st=new Date(s.startTime||s.start||'').getTime(),en=new Date(s.endTime||s.end||'').getTime();if(!Number.isFinite(st))continue;if(!Number.isFinite(en))en=st+30*60000;if(now>=st&&now<=en)return{kind:'now',label:'NOW',detail:'Scheduled now • until '+dccV27Time(en)};if(st>now)future.push({st,en})}
 future.sort((a,b)=>a.st-b.st);
 if(future[0])return{kind:'next',label:'NEXT '+dccV27Time(future[0].st),detail:'Next scheduled meet today at '+dccV27Time(future[0].st)};
 if(live&&live.status==='OPERATING')return{kind:'now',label:'OPEN',detail:'Venue currently reports operating'};
 return{kind:'location',label:'LOCATION',detail:'Meet location confirmed; live schedule not available in this feed'};
}
function dccV27CharIcon(state){return L.divIcon({className:'dccDivIcon',html:'<div class="characterPin '+state.kind+'">★</div>',iconSize:[30,30],iconAnchor:[15,15]})}

dccAddCharacters=async function(pk,target=dccCharLayer){
 let rows=await dccCharacterRows(pk);
 for(const x of rows){let state=dccV27CharacterState(x);L.marker([x.lat,x.lon],{icon:dccV27CharIcon(state),zIndexOffset:350}).addTo(target).bindPopup('<b>★ '+x.name+'</b><br>'+x.venue+'<br><strong>'+state.label+'</strong><br><small>'+state.detail+'</small><br><small>'+P[pk].n+' • '+x.source+'</small><br><small>Character schedules can change — verify same-day in Disney.</small>')}
 return rows;
};

function dccV27SummaryIcon(pk,stats){let txt=stats.avg==null?'waits —':'avg '+stats.avg+'m';return L.divIcon({className:'dccDivIcon',html:'<div class="liveParkSummary"><b>'+P[pk].n+'</b><span>'+txt+' • '+stats.open+' open • '+stats.down+' down</span></div>',iconSize:[142,44],iconAnchor:[71,22]})}
async function dccV27Stats(pk){let j=await dccGetLive(pk),rides=(j.liveData||[]).filter(x=>x.entityType==='ATTRACTION'),waits=[],open=0,down=0;for(const x of rides){if(x.status==='OPERATING')open++;else if(x.status)down++;let q=x.queue||{},w=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;if(w!=null)waits.push(w)}let chars=await dccCharacterRows(pk);return{pk,j,rides,open,down,avg:waits.length?Math.round(waits.reduce((a,b)=>a+b,0)/waits.length):null,chars}}
function dccV27ConfigureControls(){let c=document.getElementById('dccMapControls');if(!c)return;let liveBtn=c.querySelector('[data-dcc-mode="live"]'),allBtn=c.querySelector('[data-dcc-mode="all"]');if(liveBtn)liveBtn.textContent='🌐 Live All Parks';if(allBtn)allBtn.style.display='none';dccUpdateControlState()}

async function dccV27RefreshAllOverlays(stats=null){
 if(!map)return;dccEnsureLayers();dccRideLayer.clearLayers();dccCharLayer.clearLayers();dccTransportLayer.clearLayers();
 let pks=Object.keys(P);stats=stats||await Promise.all(pks.map(dccV27Stats));
 for(const st of stats)L.marker(P[st.pk].c,{icon:dccV27SummaryIcon(st.pk,st),zIndexOffset:80}).addTo(dccTransportLayer).on('click',()=>{dccV27LiveAllActive=false;dccOpenPark(st.pk)});
 if(dccFilters.rides)for(const pk of pks)await dccAddRides(pk);
 if(dccFilters.characters)for(const pk of pks)await dccAddCharacters(pk);
 if(dccFilters.transport)dccAddTransport('all');
 dccSyncZoom();return stats;
}

async function dccV27Dashboard(stats){
 let rides=[],chars=[];
 for(const st of stats){for(const x of st.j.liveData||[]){let q=x.queue||{},w=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;if(x.entityType==='ATTRACTION'&&w!=null)rides.push({pk:st.pk,name:x.name,w,status:x.status})}for(const c of st.chars){let state=dccV27CharacterState(c);chars.push({pk:st.pk,name:c.name,venue:c.venue,state})}}
 rides.sort((a,b)=>b.w-a.w);chars.sort((a,b)=>({now:0,next:1,location:2}[a.state.kind]-({now:0,next:1,location:2}[b.state.kind])));
 let nowChars=chars.filter(x=>x.state.kind==='now'),nextChars=chars.filter(x=>x.state.kind==='next');
 $('routeSummary').innerHTML='<div class="parkPlanKey"><b>🌐 LIVE WALT DISNEY WORLD • RIGHT NOW</b><small>All 4 parks are on one map. Ride pins show current posted standby waits. Character pins are ON: green ★ = scheduled/open now, purple ★ = next scheduled meet, gray ★ = confirmed location without a live schedule.</small><div class="dccLiveLegend"><span>🎢 rides '+rides.length+'</span><span>★ characters now '+nowChars.length+'</span><span>⏭ upcoming '+nextChars.length+'</span></div></div>';
 let charHtml=(nowChars.length||nextChars.length)?'<div class="parkPlanKey"><b>★ Character meets</b><small>Live/scheduled character information available right now.</small></div>'+chars.slice(0,14).map(x=>'<div class="dccLiveCharacterRow"><div><b>★ '+x.name+'</b><small>'+P[x.pk].n+' • '+x.venue+'</small></div><span class="dccCharStatus '+x.state.kind+'">'+x.state.label+'</span></div>').join(''):'';
 $('waitlist').innerHTML=rides.slice(0,18).map(x=>'<div class="ride"><div><b>'+x.name+'</b><div class="sub">'+P[x.pk].n+'</div></div><div class="wait '+(x.status==='OPERATING'?'':'down')+'">'+x.w+'m</div></div>').join('')+charHtml;
 $('waittitle').textContent='Live across all 4 parks';$('waitupdated').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' • refresh ~5 min';
}

async function dccOpenLiveAllParks(){
 dccV27LiveAllActive=true;dccMapMode='live';mapMode='all';dccFilters.rides=true;dccFilters.characters=true;dccFilters.transport=true;
 openShell();$('mapview').classList.remove('liveMode');$('tabs').style.display='none';$('maptitle').textContent='Live Disney Now';
 await ensureMainMap();layer.clearLayers();routeLayer.clearLayers();dccEnsureControls();dccV27ConfigureControls();
 map.fitBounds([[28.345,-81.606],[28.426,-81.515]],{animate:false,padding:[18,18]});
 let stats=await Promise.all(Object.keys(P).map(dccV27Stats));await dccV27RefreshAllOverlays(stats);await dccV27Dashboard(stats);setTimeout(()=>map.invalidateSize(false),60);
}

/* Filter toggles must keep all four parks populated while this live view is open. */
dccRefreshOverlays=async function(){if(dccV27LiveAllActive){let stats=await Promise.all(Object.keys(P).map(dccV27Stats));await dccV27RefreshAllOverlays(stats);await dccV27Dashboard(stats);return}return dccV27BaseRefresh()};
dccOpenPark=async function(pk){dccV27LiveAllActive=false;return dccV27BaseOpenPark(pk)};
dccOpenNow=dccOpenLiveAllParks;
dccOpenAll=dccOpenLiveAllParks;
document.querySelectorAll('.mapbtn').forEach(b=>b.onclick=dccOpenLiveAllParks);
document.querySelectorAll('.waitbtn').forEach(b=>b.onclick=()=>dccOpenPark(park));
setInterval(()=>{if(dccV27LiveAllActive&&document.getElementById('mapview')?.classList.contains('open'))dccOpenLiveAllParks().catch(()=>{})},300000);

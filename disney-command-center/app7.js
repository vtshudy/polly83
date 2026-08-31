/* DCC v25 — all-in-one Disney map, wait badges, character toggle, transport hubs, fastest-route planning */
const dccBaseLegMode=legMode;
const dccOriginalOpenLiveMap=openLiveMap;
const dccOriginalOpenParkMap=openParkMap;
let dccRideLayer=null,dccCharLayer=null,dccTransportLayer=null,dccMapMode='live';
const dccFilters={rides:true,characters:false,transport:true};
const dccLiveCache=new Map(),dccChildrenCache=new Map();

const dccCharacterFallback={
 mk:[
  {name:'Meet Mickey at Town Square Theater',venue:'Town Square Theater',lat:28.41686,lon:-81.58104},
  {name:'Meet Characters from Aladdin in Adventureland',venue:'Adventureland',lat:28.41862,lon:-81.58355},
  {name:'Cinderella and a Visiting Princess',venue:'Princess Fairytale Hall',lat:28.42021,lon:-81.58032},
  {name:'Dashing Disney Pals',venue:"Pete’s Silly Sideshow",lat:28.42178,lon:-81.57867},
  {name:'Daring Disney Pals',venue:"Pete’s Silly Sideshow",lat:28.42178,lon:-81.57867},
  {name:'Meet Mirabel',venue:'Fairytale Garden',lat:28.41963,lon:-81.58083}
 ],
 ep:[
  {name:'Mickey & Friends',venue:'World Celebration',lat:28.37453,lon:-81.54947},
  {name:'Donald Duck',venue:'Mexico Pavilion',lat:28.37157,lon:-81.54632},
  {name:'Disney Pals near EPCOT Entrance',venue:'EPCOT Entrance',lat:28.37672,lon:-81.54942},
  {name:'Friend from the Hundred Acre Wood',venue:'United Kingdom Pavilion',lat:28.37020,lon:-81.55175},
  {name:'Anna & Elsa',venue:'Royal Sommerhus — Norway',lat:28.37074,lon:-81.54611}
 ],
 hs:[
  {name:'Disney Stars at Red Carpet Dreams',venue:'Commissary Lane',lat:28.35688,lon:-81.55935},
  {name:'Pixar Pals',venue:'Pixar Plaza',lat:28.35628,lon:-81.56105},
  {name:'The Toys',venue:'Toy Story Land',lat:28.35563,lon:-81.56243},
  {name:'Darth Vader',venue:'Star Wars Launch Bay',lat:28.35769,lon:-81.56062}
 ],
 ak:[
  {name:'Favorite Disney Pals',venue:'Adventurers Outpost',lat:28.35757,lon:-81.59002},
  {name:'Moana',venue:'Character Landing — Discovery Island',lat:28.35704,lon:-81.58942},
  {name:'Kevin',venue:'Discovery Island',lat:28.35742,lon:-81.59015}
 ]
};

const dccTransportHubs=[
 {name:'Magic Kingdom Bus / Monorail / Ferry',kind:'multi',parks:['mk'],lat:28.41620,lon:-81.57993},
 {name:'Transportation & Ticket Center',kind:'monorail',parks:['mk','ep'],lat:28.40573,lon:-81.57988},
 {name:'EPCOT Main Entrance / Monorail',kind:'monorail',parks:['ep'],lat:28.37644,lon:-81.54940},
 {name:'EPCOT International Gateway',kind:'walk',parks:['ep','hs'],lat:28.36811,lon:-81.55177},
 {name:'EPCOT Skyliner Station',kind:'skyliner',parks:['ep','hs'],lat:28.36793,lon:-81.55236},
 {name:'Hollywood Studios Skyliner Station',kind:'skyliner',parks:['hs','ep'],lat:28.35827,lon:-81.55735},
 {name:'Hollywood Studios Friendship Boat Dock',kind:'boat',parks:['hs','ep'],lat:28.35866,lon:-81.55866},
 {name:'Hollywood Studios Bus Loop',kind:'bus',parks:['hs'],lat:28.35686,lon:-81.55641},
 {name:'Animal Kingdom Bus Loop',kind:'bus',parks:['ak'],lat:28.35310,lon:-81.58912},
 {name:'BoardWalk Friendship Boat Dock',kind:'boat',parks:['hs','ep'],lat:28.36780,lon:-81.55770},
 {name:'Yacht & Beach Club Friendship Boat Dock',kind:'boat',parks:['hs','ep'],lat:28.36942,lon:-81.55866},
 {name:'Disney Springs Bus Center',kind:'bus',parks:[],lat:28.37022,lon:-81.52096},
 {name:'Disney Springs Boat Dock',kind:'boat',parks:[],lat:28.37118,lon:-81.52288},
 {name:'Saratoga Springs Congress Park / Disney Springs walkway',kind:'walk',parks:[],lat:28.37330,lon:-81.52346}
];

function dccTransportEmoji(kind){return kind==='boat'?'🚤':kind==='skyliner'?'🚡':kind==='monorail'?'🚝':kind==='bus'?'🚌':kind==='walk'?'🚶':'🚏'}
function dccNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function dccIsCharacterName(name){let n=dccNorm(name);return /(^meet |character|pals|princess|silly sideshow|fairytale hall|mirabel|aladdin|adventurers outpost|character landing|red carpet dreams|pixar pals|toys in toy story land|darth vader|chewbacca|hundred acre wood|mickey friends|donald duck|anna elsa|royal sommerhus|kevin)/.test(n)}
function dccFlattenChildren(node,out=[]){for(const x of (node&&node.children)||[]){out.push(x);if(x.children)dccFlattenChildren(x,out)}return out}
async function dccGetChildren(pk){if(dccChildrenCache.has(pk))return dccChildrenCache.get(pk);let data=[];try{let r=await fetch('https://api.themeparks.wiki/v1/entity/'+P[pk].id+'/children',{cache:'no-store'});if(r.ok){let j=await r.json();data=dccFlattenChildren(j)}}catch(e){}dccChildrenCache.set(pk,data);return data}
async function dccGetLive(pk){let c=dccLiveCache.get(pk),now=Date.now();if(c&&now-c.at<270000)return c.data;let j=await live(P[pk].id);dccLiveCache.set(pk,{at:now,data:j});return j}
function dccEnsureLayers(){if(!map)return;if(!dccRideLayer)dccRideLayer=L.layerGroup().addTo(map);if(!dccCharLayer)dccCharLayer=L.layerGroup().addTo(map);if(!dccTransportLayer)dccTransportLayer=L.layerGroup().addTo(map)}
function dccClearOverlays(){dccEnsureLayers();dccRideLayer.clearLayers();dccCharLayer.clearLayers();dccTransportLayer.clearLayers()}
function dccWaitClass(status,w){if(status&&status!=='OPERATING')return'down';if(w==null)return'none';if(w>=60)return'hot';if(w>=35)return'busy';return'good'}
function dccWaitLabel(status,w){return status&&status!=='OPERATING'?'×':w==null?'—':w+'m'}
function dccRideIcon(status,w){return L.divIcon({className:'dccDivIcon',html:'<div class="rideWaitPin '+dccWaitClass(status,w)+'">'+dccWaitLabel(status,w)+'</div>',iconSize:[38,28],iconAnchor:[19,14]})}
function dccCharIcon(){return L.divIcon({className:'dccDivIcon',html:'<div class="characterPin">★</div>',iconSize:[30,30],iconAnchor:[15,15]})}
function dccTransportIcon(kind){return L.divIcon({className:'dccDivIcon',html:'<div class="transportPin">'+dccTransportEmoji(kind)+'</div>',iconSize:[30,30],iconAnchor:[15,15]})}
function dccParkIcon(pk){return L.divIcon({className:'dccDivIcon',html:'<div class="parkHubPin">'+P[pk].n+'</div>',iconSize:[130,34],iconAnchor:[65,17]})}
function dccShowtimes(entry){let a=entry&&entry.showtimes||[];if(!a.length)return'';let vals=a.slice(0,5).map(x=>{let t=x.startTime||x.start||x;try{return new Date(t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}catch(e){return''}}).filter(Boolean);return vals.length?'<br><small>Today: '+vals.join(' • ')+(a.length>5?' …':'')+'</small>':''}

async function dccAddRides(pk,target=dccRideLayer){let j=await dccGetLive(pk),rides=(j.liveData||[]).filter(x=>x.entityType==='ATTRACTION'&&x.location&&Number.isFinite(x.location.latitude)&&Number.isFinite(x.location.longitude));for(const x of rides){let q=x.queue||{},w=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;L.marker([x.location.latitude,x.location.longitude],{icon:dccRideIcon(x.status,w),zIndexOffset:200}).addTo(target).bindPopup('<b>'+x.name+'</b><br>'+P[pk].n+'<br><strong>'+(x.status==='OPERATING'?(w==null?'Standby wait not posted':w+' min standby'):String(x.status||'Status unavailable').replaceAll('_',' '))+'</strong>')}return rides}
async function dccCharacterRows(pk){let rows=[],seen=new Set(),children=await dccGetChildren(pk),liveJ=await dccGetLive(pk),liveArr=liveJ.liveData||[],liveBy=new Map(liveArr.map(x=>[dccNorm(x.name),x]));for(const x of children){if(!dccIsCharacterName(x.name))continue;let loc=x.location;if(loc&&Number.isFinite(loc.latitude)&&Number.isFinite(loc.longitude)){let k=dccNorm(x.name);if(!seen.has(k)){seen.add(k);rows.push({name:x.name,venue:x.name,lat:loc.latitude,lon:loc.longitude,source:'ThemeParks.wiki / Disney entity',live:liveBy.get(k)})}}}for(const x of liveArr){if(!dccIsCharacterName(x.name)||!x.location)continue;let k=dccNorm(x.name);if(!seen.has(k)&&Number.isFinite(x.location.latitude)){seen.add(k);rows.push({name:x.name,venue:x.name,lat:x.location.latitude,lon:x.location.longitude,source:'ThemeParks.wiki live',live:x})}}for(const x of dccCharacterFallback[pk]||[]){let k=dccNorm(x.name);if(![...seen].some(s=>s.includes(k)||k.includes(s))){seen.add(k);rows.push({...x,source:'Official Disney venue reference'})}}return rows}
async function dccAddCharacters(pk,target=dccCharLayer){let rows=await dccCharacterRows(pk);for(const x of rows)L.marker([x.lat,x.lon],{icon:dccCharIcon(),zIndexOffset:350}).addTo(target).bindPopup('<b>★ '+x.name+'</b><br>'+x.venue+'<br><small>'+P[pk].n+' • '+x.source+'</small>'+dccShowtimes(x.live)+'<br><small>Character schedules can change — verify same-day in Disney.</small>');return rows}
function dccAddTransport(scope='all'){let pks=scope==='all'?null:Array.isArray(scope)?scope:[scope];for(const x of dccTransportHubs){if(pks&&x.parks.length&&!x.parks.some(k=>pks.includes(k)))continue;L.marker([x.lat,x.lon],{icon:dccTransportIcon(x.kind),zIndexOffset:300}).addTo(dccTransportLayer).bindPopup('<b>'+dccTransportEmoji(x.kind)+' '+x.name+'</b><br><small>Disney transportation / walking planning point</small>')}}
function dccAddParkHubs(){for(const pk of Object.keys(P))L.marker(P[pk].c,{icon:dccParkIcon(pk),zIndexOffset:50}).addTo(dccTransportLayer).on('click',()=>dccOpenPark(pk))}
function dccSyncZoom(){let s=document.querySelector('.mapstage');if(!s||!map)return;s.classList.toggle('dccDetailZoom',map.getZoom()>=14)}

function dccEnsureControls(){let stage=document.querySelector('.mapstage');if(!stage||document.getElementById('dccMapControls'))return;let c=document.createElement('div');c.id='dccMapControls';c.className='dccMapControls';c.innerHTML='<div class="dccModeRow"><button data-dcc-mode="live">📍 Now</button><button data-dcc-mode="all">🌐 All Disney</button></div><div class="dccFilterRow"><button data-dcc-filter="rides">🎢 Rides</button><button data-dcc-filter="characters">★ Characters</button><button data-dcc-filter="transport">🚌 Transport</button></div>';stage.append(c);c.onclick=async e=>{let mb=e.target.closest('[data-dcc-mode]'),fb=e.target.closest('[data-dcc-filter]');if(mb){if(mb.dataset.dccMode==='all')await dccOpenAll();else await dccOpenNow();return}if(fb){let k=fb.dataset.dccFilter;dccFilters[k]=!dccFilters[k];dccUpdateControlState();await dccRefreshOverlays()}};dccUpdateControlState();map.on('zoomend',dccSyncZoom);dccSyncZoom()}
function dccUpdateControlState(){document.querySelectorAll('[data-dcc-mode]').forEach(b=>b.classList.toggle('on',b.dataset.dccMode===dccMapMode));document.querySelectorAll('[data-dcc-filter]').forEach(b=>b.classList.toggle('on',!!dccFilters[b.dataset.dccFilter]))}

async function dccRefreshOverlays(){if(!map)return;dccEnsureLayers();dccRideLayer.clearLayers();dccCharLayer.clearLayers();dccTransportLayer.clearLayers();let pks=dccMapMode==='all'?Object.keys(P):dccMapMode==='park'?[park]:(dayParkKeys[liveDay]||[]);if(dccMapMode==='all')dccAddParkHubs();if(dccFilters.rides){for(const pk of pks)await dccAddRides(pk)}if(dccFilters.characters){for(const pk of pks)await dccAddCharacters(pk)}if(dccFilters.transport)dccAddTransport(dccMapMode==='all'?'all':pks);dccSyncZoom()}
async function dccOpenNow(){dccMapMode='live';await dccOriginalOpenLiveMap();dccEnsureControls();dccUpdateControlState();await dccRefreshOverlays();$('waitupdated').textContent='Live waits refresh about every 5 min'}
async function dccOpenAll(){dccMapMode='all';mapMode='all';openShell();$('mapview').classList.remove('liveMode');$('tabs').style.display='none';$('maptitle').textContent='All Disney Map';$('waittitle').textContent='Highest current waits';await ensureMainMap();layer.clearLayers();routeLayer.clearLayers();dccEnsureControls();dccUpdateControlState();map.fitBounds([[28.342,-81.615],[28.429,-81.505]],{animate:false,padding:[15,15]});await dccRefreshOverlays();let all=[];for(const pk of Object.keys(P)){let j=await dccGetLive(pk);for(const x of j.liveData||[]){let q=x.queue||{},w=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;if(x.entityType==='ATTRACTION'&&w!=null)all.push({pk,name:x.name,w})}}all.sort((a,b)=>b.w-a.w);$('routeSummary').innerHTML='<div class="parkPlanKey"><b>🌐 All-in-one Walt Disney World map</b><small>Zoom into a park to reveal ride wait badges. Rides use live ThemeParks.wiki coordinates; character venues use current park entities plus official Disney venue references; transport hubs are cross-checked planning points from Disney/WDW map references.</small></div>';$('waitlist').innerHTML=all.slice(0,15).map(x=>'<div class="ride"><div><b>'+x.name+'</b><div class="sub">'+P[x.pk].n+'</div></div><div class="wait">'+x.w+'m</div></div>').join('');$('waitupdated').textContent='Live • ~5 min refresh'}
async function dccOpenPark(pk){if(pk)park=pk;dccMapMode='park';await dccOriginalOpenParkMap();dccEnsureControls();dccUpdateControlState();await dccRefreshOverlays()}

/* Faster-route chooser: walking first when truly quicker; compare known Disney transport links. */
function dccEstimateWalk(d){return Math.max(4,Math.round(d*1.28*20+3))}
function dccOption(mode,mins,detail){return{mode,mins,detail}}
function dccFastestOptions(day,a,b,d){let n=dccNorm(a.name+' '+b.name),opts=[];if(d<=1.65)opts.push(dccOption('Walk',dccEstimateWalk(d),'Fastest mapped walking path with a family/crowd buffer'));let board=/boardwalk|beach club|yacht club|cake bake/.test(n),hs=/hollywood studios|jollywood/.test(n),ep=/epcot|international gateway/.test(n),spr=/disney springs/.test(n),saratoga=/saratoga/.test(n),mk=/magic kingdom/.test(n);if(board&&hs){opts.push(dccOption('Friendship Boat',28,'Boat ride plus a typical wait; walking can beat it if a boat is not boarding'));opts.push(dccOption('Walk',Math.max(20,dccEstimateWalk(d)),'Crescent Lake walking path'))}if((ep&&hs)||(board&&ep)){if(ep&&hs)opts.push(dccOption('Skyliner',24,'International Gateway ↔ Hollywood Studios via Caribbean Beach transfer'));opts.push(dccOption('Friendship Boat',30,'Friendship Boat including a typical wait'));opts.push(dccOption('Walk',ep&&hs?28:10,'Direct resort-area / International Gateway walking path'))}if(spr&&saratoga){opts.push(dccOption('Walk',Math.max(12,dccEstimateWalk(d)),'Disney Springs pedestrian path; exact time depends on Saratoga section'));opts.push(dccOption('Boat',25,'Boat plus typical wait; useful from farther Saratoga sections'))}if(mk&&ep)opts.push(dccOption('Monorail',38,'Monorail with TTC transfer and a typical platform wait'));if(d>1.4){opts.push(dccOption('Disney Bus',Math.max(28,Math.round(d/18*60+18)),'Includes a planning allowance for bus wait/loading; actual Disney bus arrival times are not publicly verified live'));opts.push(dccOption('Rideshare',Math.max(18,Math.round(d/24*60+9)),'Road route plus pickup buffer'))}if(/parking|tram|trolley/.test(n))opts.push(dccOption('Parking Tram',12,'Use only where Disney parking trams are operating'));if(!opts.length){let b=dccBaseLegMode(day,a,b,d);opts.push(dccOption(b.mode,b.mins||25,b.detail))}let uniq=[];for(const o of opts){let u=uniq.find(x=>x.mode===o.mode);if(!u||o.mins<u.mins){if(u)uniq.splice(uniq.indexOf(u),1);uniq.push(o)}}uniq.sort((x,y)=>x.mins-y.mins);return uniq}
legMode=function(day,a,b,d){let opts=dccFastestOptions(day,a,b,d),best=opts[0],alts=opts.slice(1,4).map(x=>x.mode+' ~'+x.mins+' min').join(' • ');return{mode:'Fastest: '+best.mode,mins:best.mins,detail:best.detail+(alts?' • Alternatives: '+alts:'')}};

/* Replace park loader so wait TIME is visible directly on the map. */
loadPark=async function(){dccMapMode='park';dccEnsureLayers();layer.clearLayers();routeLayer.clearLayers();let j=await dccGetLive(park),a=(j.liveData||[]).filter(x=>x.entityType==='ATTRACTION').map(x=>{let q=x.queue||{},w=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;return{name:x.name,status:x.status,wait:w,loc:x.location}}).sort((a,b)=>(b.wait??-1)-(a.wait??-1));$('waittitle').textContent=P[park].n+' live waits';$('waitupdated').textContent='Updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});$('waitlist').innerHTML=a.map(x=>'<div class="ride"><div><b>'+x.name+'</b><div class="sub">'+(x.status==='OPERATING'?'Standby':String(x.status||'').replaceAll('_',' '))+'</div></div><div class="wait '+(x.status==='OPERATING'?'':'down')+'">'+(x.status!=='OPERATING'?'DOWN':x.wait==null?'—':x.wait+'m')+'</div></div>').join('');$('routeSummary').innerHTML='<div class="parkPlanKey"><b>🎢 Waits on the map</b><small>Each ride marker displays its current posted standby wait. Turn Characters on to add current character venues.</small></div>';await overlayParkItinerary(park);await dccRefreshOverlays()};

/* Rebind map controls after app6 assigned the old handlers. */
document.querySelectorAll('.mapbtn').forEach(b=>b.onclick=dccOpenNow);
document.querySelectorAll('.waitbtn').forEach(b=>b.onclick=()=>dccOpenPark(park));
$('tabs').onclick=e=>{let b=e.target.closest('[data-park]');if(!b)return;park=b.dataset.park;dccMapMode='park';mapMode='park';document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));$('maptitle').textContent=P[park].n;if(map)map.setView(P[park].c,P[park].z,{animate:false});loadPark()};

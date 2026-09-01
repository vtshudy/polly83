/* DCC v38 — rock-solid day maps: resilient Leaflet loading, cached locations, fast rendering, self-healing */
(()=>{
 let dccLeafletRobustPromise=null;
 let dccDayMapGeneration=0;
 let dccActiveDayRoute=null;
 let dccDayResizeObserver=null;
 let dccLastHealAttempt=0;
 const PARK_CACHE='dcc-park-locations-v38-';
 const GEO_CACHE='dcc-geo-v38-';

 function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))}
 async function fetchJSON(url,opts={},ms=7000){
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),ms);
  try{let r=await fetch(url,{...opts,signal:ac.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}
 }
 function ensureLeafletCss(){
  if(document.querySelector('link[data-dcc-leaflet]'))return;
  for(const href of ['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.css']){
   let l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.dccLeaflet='1';document.head.append(l);
  }
 }
 function loadScript(src,ms=7000){return new Promise((resolve,reject)=>{let s=document.createElement('script'),done=false,t=setTimeout(()=>{if(done)return;done=true;s.remove();reject(new Error('Leaflet load timeout'))},ms);s.src=src;s.async=true;s.onload=()=>{if(done)return;done=true;clearTimeout(t);resolve()};s.onerror=()=>{if(done)return;done=true;clearTimeout(t);s.remove();reject(new Error('Leaflet load failed'))};document.head.append(s)})}
 leaflet=async function(){
  if(window.L&&typeof L.map==='function')return L;
  if(dccLeafletRobustPromise)return dccLeafletRobustPromise;
  ensureLeafletCss();
  dccLeafletRobustPromise=(async()=>{
   const sources=['https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'];
   let last;
   for(const src of sources){try{await loadScript(src);if(window.L&&typeof L.map==='function')return L}catch(e){last=e}}
   dccLeafletRobustPromise=null;throw last||new Error('Leaflet unavailable');
  })();
  return dccLeafletRobustPromise;
 };

 function readCache(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
 function writeCache(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch(e){}}
 function cacheRows(pk,arr){writeCache(PARK_CACHE+pk,{at:Date.now(),rows:arr})}
 function getCachedRows(pk){let c=readCache(PARK_CACHE+pk);return c&&Array.isArray(c.rows)?c.rows:[]}

 parkLocations=async function(day){
  let out=new Map(),keys=dayParkKeys[day]||[];
  await Promise.all(keys.map(async pk=>{
   let rows=[];
   try{
    let j=await fetchJSON('https://api.themeparks.wiki/v1/entity/'+P[pk].id+'/live',{cache:'no-store'},6500);
    rows=(j.liveData||[]).filter(x=>x.location&&Number.isFinite(x.location.latitude)&&Number.isFinite(x.location.longitude)).map(x=>({name:x.name,lat:x.location.latitude,lon:x.location.longitude,label:x.name,source:P[pk].n,entityType:x.entityType}));
    if(rows.length)cacheRows(pk,rows);
   }catch(e){rows=getCachedRows(pk)}
   for(const x of rows){out.set(nrm(x.name),x);out.set(canonName(x.name),x)}
  }));
  return out;
 };

 geocodePlace=async function(name){
  const key=GEO_CACHE+nrm(name).slice(0,80),cached=readCache(key);if(cached&&Number.isFinite(cached.lat))return cached;if(!likelyPlace(name))return null;
  try{let j=await fetchJSON('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(name+' Walt Disney World Florida'),{headers:{Accept:'application/json'}},5500);if(j&&j[0]){let c={lat:+j[0].lat,lon:+j[0].lon,label:String(j[0].display_name||name).split(',').slice(0,2).join(','),source:'OpenStreetMap'};writeCache(key,c);return c}}catch(e){}
  return null;
 };

 resolveDayPoints=async function(day){
  let pmap=await parkLocations(day),raw=(itinerary[day]?.items||[]).map((x,i)=>({index:i,time:x[0],icon:x[1],name:x[2],note:x[3]}));
  let rows=await Promise.all(raw.map(async it=>{
   let p=placeStatic(it.name)||fuzzyPark(it.name,pmap);
   if(!p&&likelyPlace(it.name))p=await geocodePlace(it.name);
   if(!p){let keys=dayParkKeys[day]||[],low=nrm(it.name);if(keys.length===1&&(low.includes('entry')||low.includes('party')||low.includes('exit')))p={lat:P[keys[0]].c[0],lon:P[keys[0]].c[1],label:P[keys[0]].n,source:'park center'}}
   return p?{...it,...p}:null;
  }));
  return rows.filter(Boolean).sort((a,b)=>a.index-b.index);
 };

 brouterProfileLine=async function(a,b,profile='trekking'){
  try{let j=await fetchJSON('https://brouter.de/brouter?lonlats='+a.lon+','+a.lat+'%7C'+b.lon+','+b.lat+'&profile='+encodeURIComponent(profile)+'&alternativeidx=0&format=geojson',{},5000);if(j&&j.features&&j.features[0])return j.features[0].geometry.coordinates.map(c=>[c[1],c[0]])}catch(e){}return null;
 };
 brouterLine=async function(a,b){return brouterProfileLine(a,b,'trekking')};

 destroyDayMap=function(){
  dccDayMapGeneration++;
  if(dccDayResizeObserver){try{dccDayResizeObserver.disconnect()}catch(e){}dccDayResizeObserver=null}
  if(dayMap){try{dayMap.off();dayMap.remove()}catch(e){}dayMap=null;dayLayers=null}
  let box=document.getElementById('dayMap');if(box){try{delete box._leaflet_id}catch(e){}box.innerHTML=''}
 };

 function waitForBox(box,token){return new Promise(resolve=>{let tries=0;function tick(){if(token!==dccDayMapGeneration||!box.isConnected)return resolve(false);let r=box.getBoundingClientRect();if(r.width>120&&r.height>180)return resolve(true);if(++tries>30)return resolve(false);requestAnimationFrame(tick)}tick()})}
 function addReloadButton(day){let head=document.querySelector('.dayMapHead');if(!head||head.querySelector('.dccMapReload'))return;let b=document.createElement('button');b.type='button';b.className='dccMapReload';b.textContent='↻ Reload';b.onclick=e=>{e.stopPropagation();initDayRouteMap(day,true)};head.append(b)}
 function tileLayerWithFallback(m,status){
  let failures=0,switched=false;
  const primary=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,updateWhenIdle:true,keepBuffer:3});
  const fallback=()=>{if(switched||!m)return;switched=true;try{m.removeLayer(primary)}catch(e){}let alt=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,updateWhenIdle:true,keepBuffer:3});alt.on('tileerror',()=>{if(status&&!status.dataset.tileWarn){status.dataset.tileWarn='1';status.textContent+=' • Base-map tiles are temporarily unavailable; itinerary pins still work.'}});alt.addTo(m)};
  primary.on('tileerror',()=>{if(++failures>=4)fallback()});primary.addTo(m);return primary;
 }
 function markerIcon(num){return L.divIcon({className:'',html:'<div class="routePin">'+num+'</div>',iconSize:[26,26],iconAnchor:[13,13]})}
 function renderLegList(day,pts){
  let legs=[];for(let i=0;i<pts.length-1;i++){let a=pts[i],b=pts[i+1],d=miles(a,b),g=legMode(day,a,b,d);legs.push({a,b,d,...g})}
  let list=$('dayRouteList');if(list)list.innerHTML=legs.map((g,i)=>{let mode=(g.mode||'').toLowerCase(),walk=mode.includes('walk'),road=!walk&&!mode.includes('boat')&&!mode.includes('skyliner'),link=walk?'<a class="walkLink" target="_blank" rel="noopener" href="'+appleWalkLink(g.a,g.b)+'">Open walking directions ↗</a>':road?'<a class="walkLink" target="_blank" rel="noopener" href="'+appleDriveLink(g.a,g.b)+'">Open road directions ↗</a>':'';return'<div class="routeLeg"><div class="routeNum">'+(i+1)+'→'+(i+2)+'</div><div><b>'+g.mode+'</b><small>'+g.a.name+' → '+g.b.name+' • '+g.detail+'</small>'+link+'</div><div class="routeEta">'+(g.mins?g.mins+' min':'Plan')+'</div></div>'}).join('');
  return legs;
 }

 initDayRouteMap=async function(day,force=false){
  dccActiveDayRoute=day;
  let box=$('dayMap');if(!box)return;
  const token=++dccDayMapGeneration;
  if(dayMap){try{dayMap.off();dayMap.remove()}catch(e){}dayMap=null;dayLayers=null}
  try{delete box._leaflet_id}catch(e){}box.innerHTML='';addReloadButton(day);
  let status=$('dayMapStatus');if(status){status.dataset.tileWarn='';status.textContent='Starting map…'}
  let ready=await waitForBox(box,token);if(!ready||token!==dccDayMapGeneration)return;
  try{await Promise.race([leaflet(),timeout(22000)])}catch(e){if(token!==dccDayMapGeneration)return;if(status)status.innerHTML='Map engine could not load. <button class="dccInlineRetry" type="button">Try again</button>';status?.querySelector('.dccInlineRetry')?.addEventListener('click',()=>initDayRouteMap(day,true));return}
  if(token!==dccDayMapGeneration||!box.isConnected||document.getElementById('dayMap')!==box)return;
  try{
   dayMap=L.map(box,{zoomControl:true,inertia:false,scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,preferCanvas:true});
   tileLayerWithFallback(dayMap,status);dayLayers=L.layerGroup().addTo(dayMap);
   let keys=dayParkKeys[day]||[],center=keys.length?P[keys[0]].c:[28.377,-81.55];dayMap.setView(center,keys.length?15:12,{animate:false});
   requestAnimationFrame(()=>{try{dayMap&&dayMap.invalidateSize(false)}catch(e){}});
   setTimeout(()=>{try{dayMap&&dayMap.invalidateSize(false)}catch(e){}},120);
   if(typeof ResizeObserver!=='undefined'){dccDayResizeObserver=new ResizeObserver(()=>{try{dayMap&&dayMap.invalidateSize(false)}catch(e){}});dccDayResizeObserver.observe(box)}
   if(status)status.textContent='Map ready • loading itinerary locations…';
  }catch(e){if(status)status.innerHTML='Map container needed a reset. <button class="dccInlineRetry" type="button">Reload map</button>';status?.querySelector('.dccInlineRetry')?.addEventListener('click',()=>initDayRouteMap(day,true));return}

  let pts=[];try{pts=await resolveDayPoints(day)}catch(e){}
  if(token!==dccDayMapGeneration||!dayMap||!box.isConnected)return;
  document.querySelectorAll('.itin[data-itidx]').forEach(el=>el.querySelector('.mapBadge')?.remove());
  if(!pts.length){if(status)status.textContent='Map is online, but no itinerary locations resolved yet. Tap Reload to retry location data.';return}
  let ll=[];
  pts.forEach((p,i)=>{
   let num=i+1;ll.push([p.lat,p.lon]);let marker=L.marker([p.lat,p.lon],{icon:markerIcon(num)}).addTo(dayLayers).bindPopup('<b>'+num+'. '+p.name+'</b><br>'+(p.time?fmt(p.time):'Flexible')+'<br><small>'+p.label+'</small>');
   let row=document.querySelector('.itin[data-itidx="'+p.index+'"]');if(row){let target=row.querySelector('b');if(target){let badge=document.createElement('span');badge.className='mapBadge';badge.textContent='#'+num;badge.title='Matches map pin '+num;target.prepend(badge)}row.onclick=()=>{if(dayMap){dayMap.setView([p.lat,p.lon],18,{animate:false});marker.openPopup()}}}
  });
  try{if(ll.length===1)dayMap.setView(ll[0],16,{animate:false});else dayMap.fitBounds(L.latLngBounds(ll).pad(.18),{animate:false,maxZoom:17})}catch(e){}
  setTimeout(()=>{try{dayMap&&dayMap.invalidateSize(false)}catch(e){}},80);
  let legs=renderLegList(day,pts);
  if(status)status.textContent=pts.length+' mapped stop'+(pts.length===1?'':'s')+' • map is ready; route paths are loading in the background.';

  let routed=0;
  await Promise.all(legs.map(async g=>{if(token!==dccDayMapGeneration||!dayMap)return;try{let lines=await routeLines(day,g.a,g.b,g);if(token!==dccDayMapGeneration||!dayMap)return;if(lines&&lines.length){drawRouteLines(dayLayers,lines);routed++}}catch(e){}}));
  if(token!==dccDayMapGeneration||!dayMap)return;
  if(status)status.textContent=pts.length+' mapped stop'+(pts.length===1?'':'s')+' • '+routed+'/'+legs.length+' travel segment'+(legs.length===1?'':'s')+' drawn on actual walking/road/Disney transport paths.'+(routed<legs.length?' Estimated timing remains available for any segment whose routing service did not respond.':'');
  try{if(typeof dccV28DrawFlexCircuit==='function')dccV28DrawFlexCircuit(day).catch(()=>{})}catch(e){}
 };

 function healDayMap(reason){
  if(document.visibilityState==='hidden')return;let panel=$('panel'),box=$('dayMap');if(!panel?.classList.contains('open')||!box||!dccActiveDayRoute)return;
  let now=Date.now();if(dayMap){try{dayMap.invalidateSize(false);return}catch(e){}}
  if(now-dccLastHealAttempt<4500)return;dccLastHealAttempt=now;initDayRouteMap(dccActiveDayRoute,true).catch(()=>{});
 }
 window.addEventListener('pageshow',()=>setTimeout(()=>healDayMap('pageshow'),100));
 window.addEventListener('resize',()=>setTimeout(()=>healDayMap('resize'),100));
 window.addEventListener('orientationchange',()=>setTimeout(()=>healDayMap('orientation'),180));
 window.addEventListener('online',()=>setTimeout(()=>healDayMap('online'),100));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>healDayMap('visible'),120)});
 setInterval(()=>healDayMap('watchdog'),5000);

 /* Existing dayPanel wrappers still call initDayRouteMap; this observer covers UI re-renders that replace the map container mid-load. */
 const panel=$('panel');if(panel)new MutationObserver(()=>{let box=$('dayMap');if(panel.classList.contains('open')&&box&&dccActiveDayRoute&&!dayMap)setTimeout(()=>healDayMap('panel-change'),80)}).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();

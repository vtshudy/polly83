/* DCC v39 — tap any attraction in the live list to focus the map */
(()=>{
 let focusHalo=null,focusTimer=null;
 const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const parkKeyFromName=name=>Object.keys(P).find(k=>norm(P[k].n)===norm(name))||null;

 function toast(text){
  let stage=document.querySelector('.mapstage');if(!stage)return;
  let el=document.getElementById('dccMapFocusToast');
  if(!el){el=document.createElement('div');el.id='dccMapFocusToast';el.className='dccMapFocusToast';stage.append(el)}
  el.textContent=text;el.classList.add('show');clearTimeout(focusTimer);focusTimer=setTimeout(()=>el.classList.remove('show'),2200);
 }

 async function findRide(row){
  let b=row.querySelector('b');if(!b)return null;
  let name=b.textContent.trim(),sub=row.querySelector('.sub')?.textContent.trim()||'',pk=parkKeyFromName(sub),keys=pk?[pk]:Object.keys(P),n=norm(name),best=null;
  for(const k of keys){
   let j=null;try{j=await dccGetLive(k)}catch(e){continue}
   for(const x of j.liveData||[]){
    if(x.entityType!=='ATTRACTION'||!x.location||!Number.isFinite(x.location.latitude)||!Number.isFinite(x.location.longitude))continue;
    let xn=norm(x.name),score=xn===n?10:(xn.includes(n)||n.includes(xn)?7:0);
    if(!score){let a=n.split(' ').filter(w=>w.length>2),bb=xn.split(' ').filter(w=>w.length>2),same=a.filter(w=>bb.includes(w)).length;score=same/Math.max(1,new Set([...a,...bb]).size)}
    if(!best||score>best.score)best={score,pk:k,ride:x};
   }
  }
  return best&&best.score>=.34?best:null;
 }

 function openExistingMarker(lat,lon){
  let found=null,best=Infinity;
  try{dccRideLayer?.eachLayer(l=>{if(typeof l.getLatLng!=='function')return;let p=l.getLatLng(),d=Math.abs(p.lat-lat)+Math.abs(p.lng-lon);if(d<best){best=d;found=l}})}catch(e){}
  if(found&&best<.00025){try{found.openPopup()}catch(e){}}
 }

 async function focusRide(row){
  if(!map)return;
  document.querySelectorAll('#waitlist .ride.mapFocused').forEach(x=>x.classList.remove('mapFocused'));row.classList.add('mapFocused');
  row.setAttribute('aria-busy','true');
  let hit=await findRide(row);row.removeAttribute('aria-busy');
  if(!hit){toast('Location not available yet');return}
  let x=hit.ride,lat=x.location.latitude,lon=x.location.longitude;
  try{map.invalidateSize(false);map.setView([lat,lon],18,{animate:false})}catch(e){}
  try{if(focusHalo)map.removeLayer(focusHalo);focusHalo=L.circleMarker([lat,lon],{radius:24,weight:4,color:'#0b63ce',fillColor:'#fff',fillOpacity:.12,opacity:.95,className:'dccFocusHalo'}).addTo(map);setTimeout(()=>{try{if(focusHalo){map.removeLayer(focusHalo);focusHalo=null}}catch(e){}},4200)}catch(e){}
  openExistingMarker(lat,lon);
  let q=x.queue||{},wait=q.STANDBY&&Number.isFinite(q.STANDBY.waitTime)?q.STANDBY.waitTime:null;
  toast('📍 '+x.name+(wait!=null?' • '+wait+' min':''));
 }

 function makeRowsInteractive(){
  document.querySelectorAll('#waitlist .ride').forEach(row=>{
   if(row.dataset.mapFocusReady)return;row.dataset.mapFocusReady='1';row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label','Show '+(row.querySelector('b')?.textContent||'attraction')+' on map');
  });
 }
 const list=document.getElementById('waitlist');
 if(list){
  list.addEventListener('click',e=>{let row=e.target.closest('.ride');if(!row||!list.contains(row))return;e.preventDefault();focusRide(row)});
  list.addEventListener('keydown',e=>{let row=e.target.closest('.ride');if(!row||!list.contains(row)||!(e.key==='Enter'||e.key===' '))return;e.preventDefault();focusRide(row)});
  new MutationObserver(makeRowsInteractive).observe(list,{childList:true,subtree:true});makeRowsInteractive();
 }
})();

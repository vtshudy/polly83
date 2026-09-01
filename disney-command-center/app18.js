/* DCC v36 — move hero status controls to bottom + Disney guide map library */
(()=>{
 const refs=[
  {key:'transport',icon:'🚌',name:'Disney Transportation Map',sub:'Buses • boats • monorail • Skyliner • park-to-park',url:'https://magicguides.com/disney-world-transportation-map'},
  {key:'ep',icon:'🌐',name:'EPCOT / Resort Overview Reference',sub:'Property-wide overview supplied for EPCOT planning',url:'https://magicguides.com/wp-content/uploads/2019/01/Disney-World-Resort-Map-1.pdf'},
  {key:'ds',icon:'🛍️',name:'Disney Springs Guide Map',sub:'Dining • shopping • bus and boat areas',url:'https://magicguides.com/wp-content/uploads/2025/01/WDW-Map-DS-2024-12-21.pdf'},
  {key:'mk',icon:'🏰',name:'Magic Kingdom Guide Map',sub:'2026 park reference',url:'https://magicguides.com/wp-content/uploads/2026/02/WDW-Map-MK-2026-01-05.pdf'},
  {key:'hs',icon:'🎬',name:'Hollywood Studios Guide Map',sub:'2025 park reference',url:'https://magicguides.com/wp-content/uploads/2025/09/WDW-Map-DHS-2025-09-25.pdf'},
  {key:'ak',icon:'🌳',name:'Animal Kingdom Guide Map',sub:'2026 park reference',url:'https://magicguides.com/wp-content/uploads/2026/02/WDW-Map-DAK-2026-02-02.pdf'},
  {key:'saratoga',icon:'🏨',name:'Saratoga Springs Resort Map',sub:'Resort sections • walkways • transportation',url:'https://magicguides.com/wp-content/uploads/2019/01/Saratoga-Springs-Resort-Map.pdf'},
  {key:'tl',icon:'🌊',name:'Typhoon Lagoon Guide Map',sub:'Water park reference',url:'https://magicguides.com/wp-content/uploads/2024/06/WDW-Map-TL-2023-03-01.pdf'},
  {key:'bb',icon:'❄️',name:'Blizzard Beach Guide Map',sub:'Water park reference',url:'https://magicguides.com/wp-content/uploads/2024/06/WDW-Map-BB-2023-03-01.pdf'},
  {key:'wdwprep',icon:'🗺️',name:'WDW Prep School Map Library',sub:'Additional park and resort map cross-checks',url:'https://wdwprepschool.com/disney-world-maps/'}
 ];
 window.dccGuideMaps=refs;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 function ensureFooter(){
  let footer=document.getElementById('dccBottomStatus');
  if(!footer){
   footer=document.createElement('div');footer.id='dccBottomStatus';footer.className='dccBottomStatus';
   footer.innerHTML='<div class="dccBottomFamily"><span class="dccBottomCastle">✨</span><div><b>Tshudy Family • Disney 2026</b><small>Private trip command center</small></div></div><div class="dccBottomActions"></div>';
   let content=document.querySelector('.content');if(content)content.append(footer);
  }
  return footer;
 }
 function moveHeroControls(){
  let footer=ensureFooter(),actions=footer?.querySelector('.dccBottomActions');if(!actions)return;
  let pill=document.querySelector('.heroTop .pill');
  if(pill&&!actions.contains(pill)){pill.classList.add('dccBottomBuild');actions.append(pill)}
  let out=document.querySelector('.dccLogoutBtn');
  if(out&&!actions.contains(out))actions.append(out);
 }
 moveHeroControls();
 new MutationObserver(moveHeroControls).observe(document.body,{childList:true,subtree:true});
 setTimeout(moveHeroControls,50);setTimeout(moveHeroControls,300);

 const mapPoints={
  ds:{name:'Disney Springs',lat:28.3705,lon:-81.5207,icon:'🛍️'},
  saratoga:{name:"Disney's Saratoga Springs Resort & Spa",lat:28.3767,lon:-81.5202,icon:'🏨'},
  tl:{name:"Disney's Typhoon Lagoon",lat:28.3650,lon:-81.5295,icon:'🌊'},
  bb:{name:"Disney's Blizzard Beach",lat:28.3527,lon:-81.5759,icon:'❄️'}
 };
 function refFor(key){return refs.find(x=>x.key===key)}
 function guideIcon(x){return L.divIcon({className:'dccDivIcon',html:'<div class="dccGuidePin">'+x.icon+'</div>',iconSize:[34,34],iconAnchor:[17,17]})}
 function guideCard(r){return '<a class="dccGuideCard" target="_blank" rel="noopener" href="'+esc(r.url)+'"><span class="dccGuideCardIcon">'+r.icon+'</span><span><b>'+esc(r.name)+'</b><small>'+esc(r.sub)+'</small></span><strong>Open ›</strong></a>'}
 function addGuideModeButton(){
  let c=document.getElementById('dccMapControls');if(!c)return;let row=c.querySelector('.dccModeRow');if(!row||row.querySelector('[data-dcc-mode="guides"]'))return;
  let b=document.createElement('button');b.dataset.dccMode='guides';b.textContent='🗺️ Guide Maps';b.onclick=e=>{e.stopPropagation();dccOpenGuideMaps()};row.append(b);
 }
 const baseEnsure=window.dccEnsureControls;
 if(typeof baseEnsure==='function')window.dccEnsureControls=function(){baseEnsure();addGuideModeButton()};
 setTimeout(addGuideModeButton,0);

 window.dccOpenGuideMaps=async function(){
  try{if(typeof dccV27LiveAllActive!=='undefined')dccV27LiveAllActive=false}catch(e){}
  try{if(typeof dccV28SaratogaActive!=='undefined')dccV28SaratogaActive=false}catch(e){}
  dccMapMode='guides';mapMode='all';openShell();$('mapview').classList.remove('liveMode');$('tabs').style.display='none';$('maptitle').textContent='Disney Guide Maps';
  await ensureMainMap();layer.clearLayers();routeLayer.clearLayers();if(typeof dccEnsureLayers==='function')dccEnsureLayers();
  if(dccRideLayer)dccRideLayer.clearLayers();if(dccCharLayer)dccCharLayer.clearLayers();if(dccTransportLayer)dccTransportLayer.clearLayers();
  dccEnsureControls();addGuideModeButton();document.querySelectorAll('[data-dcc-mode]').forEach(b=>b.classList.toggle('on',b.dataset.dccMode==='guides'));
  if(typeof dccAddParkHubs==='function')dccAddParkHubs();if(typeof dccAddTransport==='function')dccAddTransport('all');
  for(const [key,p] of Object.entries(mapPoints)){let r=refFor(key);L.marker([p.lat,p.lon],{icon:guideIcon(p),zIndexOffset:220}).addTo(layer).bindPopup('<b>'+p.icon+' '+p.name+'</b><br><small>Map reference available below.</small>'+(r?'<br><a target="_blank" rel="noopener" href="'+esc(r.url)+'">Open guide map</a>':''))}
  map.fitBounds([[28.342,-81.607],[28.427,-81.505]],{animate:false,padding:[18,18]});
  $('routeSummary').innerHTML='<div class="parkPlanKey"><b>🗺️ Disney reference map library</b><small>The interactive map keeps GPS/ride coordinates and live wait data. These park, resort and transportation maps are saved as visual cross-checks for entrances, walkways, docks, bus areas and route planning.</small></div>';
  $('waittitle').textContent='Park, resort & transportation maps';$('waitupdated').textContent=refs.length+' references saved';
  $('waitlist').innerHTML='<div class="dccGuideGrid">'+refs.map(guideCard).join('')+'</div>';
  setTimeout(()=>map.invalidateSize(false),60);
 };

 function appendRefLink(key){
  let r=refFor(key),sum=document.getElementById('routeSummary');if(!r||!sum||sum.querySelector('[data-guide-ref="'+key+'"]'))return;
  let a=document.createElement('a');a.className='dccInlineGuideLink';a.dataset.guideRef=key;a.target='_blank';a.rel='noopener';a.href=r.url;a.innerHTML=r.icon+' Open '+esc(r.name)+' ›';sum.append(a);
 }
 const baseOpenPark=window.dccOpenPark;
 if(typeof baseOpenPark==='function')window.dccOpenPark=async function(pk){let out=await baseOpenPark(pk);appendRefLink(pk);return out};
 const baseSaratoga=window.dccOpenSaratogaMap;
 if(typeof baseSaratoga==='function')window.dccOpenSaratogaMap=async function(){let out=await baseSaratoga();appendRefLink('saratoga');appendRefLink('ds');return out};
})();

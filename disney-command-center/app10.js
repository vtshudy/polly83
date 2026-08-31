/* DCC v28 — Saratoga Springs / Disney Springs resort map + FLEX ride circuit */
const dccV28BaseInitDayRouteMap=initDayRouteMap;
let dccV28SaratogaActive=false;

const dccSaratogaPoints=[
 {name:"Disney's Saratoga Springs Resort & Spa",kind:'resort',lat:28.37670,lon:-81.52020,note:'Main resort / Carriage House area'},
 {name:'The Springs',kind:'bus',lat:28.37715,lon:-81.52002,note:'Resort section • bus stop near High Rock Spring Pool'},
 {name:'The Paddock',kind:'bus',lat:28.37785,lon:-81.51658,note:'Resort section • Disney bus stop'},
 {name:'The Carousel',kind:'bus',lat:28.38010,lon:-81.51788,note:'Resort section • Disney bus stop'},
 {name:'The Grandstand',kind:'bus',lat:28.37708,lon:-81.52342,note:'Resort section • Disney bus stop'},
 {name:'Congress Park',kind:'bus',lat:28.37362,lon:-81.52145,note:'Closest Saratoga section for walking to Disney Springs'},
 {name:'Treehouse Villas',kind:'boat',lat:28.37748,lon:-81.52775,note:'Treehouse Villas • watercraft / internal transportation area'},
 {name:'The Turf Club Bar and Grill',kind:'food',lat:28.37655,lon:-81.52230,note:'Near the Saratoga boat launch'},
 {name:'Saratoga Springs Boat Launch',kind:'boat',lat:28.37615,lon:-81.52292,note:'Water taxi to Disney Springs'},
 {name:'Congress Park Pedestrian Bridge',kind:'walk',lat:28.37298,lon:-81.52146,note:'Walking connection toward Disney Springs Marketplace'},
 {name:'Disney Springs Marketplace',kind:'walk',lat:28.37118,lon:-81.51966,note:'Marketplace side of the Saratoga walking route'},
 {name:'Disney Springs Town Center Bus Loop',kind:'bus',lat:28.37022,lon:-81.52096,note:'Disney bus transportation'},
 {name:'Disney Springs Boat Dock',kind:'boat',lat:28.37118,lon:-81.52288,note:'Disney Springs water transportation'}
];

function dccV28ResortIcon(p){
 let emoji=p.kind==='boat'?'🚤':p.kind==='bus'?'🚌':p.kind==='walk'?'🚶':p.kind==='food'?'🍽️':'🏨';
 return L.divIcon({className:'dccDivIcon',html:'<div class="resortMapPin '+p.kind+'">'+emoji+'</div>',iconSize:[32,32],iconAnchor:[16,16]});
}
function dccV28AddSaratogaButton(){
 let c=document.getElementById('dccMapControls');if(!c)return;
 let row=c.querySelector('.dccModeRow');if(!row||row.querySelector('[data-dcc-mode="saratoga"]'))return;
 let b=document.createElement('button');b.dataset.dccMode='saratoga';b.textContent='🏨 Saratoga';b.onclick=e=>{e.stopPropagation();dccOpenSaratogaMap()};row.append(b);
}
async function dccV28WalkLine(a,b,target,style={color:'#0b63ce',weight:5,opacity:.88}){
 let line=await brouterProfileLine(a,b,'trekking');if(line)L.polyline(line,style).addTo(target);return line;
}
function dccV28BoatLine(){return [[28.37615,-81.52292],[28.37455,-81.52415],[28.37275,-81.52405],[28.37125,-81.52288]]}

async function dccOpenSaratogaMap(){
 dccV28SaratogaActive=true;
 if(typeof dccV27LiveAllActive!=='undefined')dccV27LiveAllActive=false;
 dccMapMode='saratoga';mapMode='saratoga';openShell();$('mapview').classList.remove('liveMode');$('tabs').style.display='none';$('maptitle').textContent='Saratoga Springs + Disney Springs';
 await ensureMainMap();layer.clearLayers();routeLayer.clearLayers();if(typeof dccEnsureLayers==='function')dccEnsureLayers();
 if(dccRideLayer)dccRideLayer.clearLayers();if(dccCharLayer)dccCharLayer.clearLayers();if(dccTransportLayer)dccTransportLayer.clearLayers();
 dccEnsureControls();dccV28AddSaratogaButton();document.querySelectorAll('[data-dcc-mode]').forEach(b=>b.classList.toggle('on',b.dataset.dccMode==='saratoga'));
 for(const p of dccSaratogaPoints)L.marker([p.lat,p.lon],{icon:dccV28ResortIcon(p),zIndexOffset:260}).addTo(layer).bindPopup('<b>'+p.name+'</b><br><small>'+p.note+'</small>');
 let congress=dccSaratogaPoints.find(x=>x.name==='Congress Park'),bridge=dccSaratogaPoints.find(x=>x.name==='Congress Park Pedestrian Bridge'),market=dccSaratogaPoints.find(x=>x.name==='Disney Springs Marketplace');
 await dccV28WalkLine(congress,bridge,routeLayer);await dccV28WalkLine(bridge,market,routeLayer);
 L.polyline(dccV28BoatLine(),{color:'#13a3b8',weight:5,opacity:.88,dashArray:'10 7'}).addTo(routeLayer);
 map.fitBounds([[28.3688,-81.5292],[28.3812,-81.5140]],{animate:false,padding:[18,18]});
 $('routeSummary').innerHTML='<div class="parkPlanKey"><b>🏨 Saratoga Springs resort map</b><small>Shows the resort sections, bus stops, boat launch, Congress Park pedestrian connection and Disney Springs. Blue = walking path • aqua dashed = watercraft corridor. Disney confirms Saratoga has bus and water transportation, plus a pedestrian bridge from Saratoga to Disney Springs Marketplace.</small></div>';
 $('waittitle').textContent='Getting around from Saratoga';
 $('waitupdated').textContent='Planning map';
 $('waitlist').innerHTML='<div class="routeLeg"><div class="routeNum">🚶</div><div><b>Congress Park → Disney Springs</b><small>Usually the simplest walking option because Congress Park sits closest to the pedestrian bridge.</small></div><div class="routeEta">Walk</div></div><div class="routeLeg"><div class="routeNum">🚤</div><div><b>Saratoga boat launch → Disney Springs</b><small>Useful when a boat is convenient; include wait/boarding time when comparing against walking.</small></div><div class="routeEta">Boat</div></div><div class="routeLeg"><div class="routeNum">🚌</div><div><b>Resort bus stops</b><small>The Springs, Paddock, Carousel, Congress Park and Grandstand are shown so the app can choose the closest stop once your room section is known.</small></div><div class="routeEta">Bus</div></div>';
 setTimeout(()=>map.invalidateSize(false),60);
}

/* Make sure the regular map controls can always reach the resort map. */
const dccV28BaseEnsureControls=dccEnsureControls;
dccEnsureControls=function(){dccV28BaseEnsureControls();dccV28AddSaratogaButton()};

/* FLEX attractions are explicitly connected as a walking circuit in itinerary order. */
function dccV28IsFlexRide(p){return !p.time&&p.entityType==='ATTRACTION'}
async function dccV28DrawFlexCircuit(day){
 if(!dayMap||!dayLayers)return;let pts=await resolveDayPoints(day),flex=pts.filter(dccV28IsFlexRide);if(!flex.length)return;
 let firstIndex=pts.findIndex(p=>p===flex[0]),seq=[];if(firstIndex>0)seq.push(pts[firstIndex-1]);seq.push(...flex);
 for(const p of flex)L.circleMarker([p.lat,p.lon],{radius:14,weight:3,color:'#7a52d1',fillColor:'#fff',fillOpacity:.08,opacity:.9}).addTo(dayLayers).bindTooltip('FLEX ride: '+p.name,{direction:'top'});
 for(let i=0;i<seq.length-1;i++){let line=await brouterProfileLine(seq[i],seq[i+1],'trekking');if(line)L.polyline(line,{color:'#7a52d1',weight:4,opacity:.88,dashArray:'7 7'}).addTo(dayLayers)}
 let s=$('dayMapStatus');if(s)s.innerHTML+= ' <span class="flexRouteKey">● FLEX rides are connected in itinerary order.</span>';
}
initDayRouteMap=async function(day){await dccV28BaseInitDayRouteMap(day);try{await dccV28DrawFlexCircuit(day)}catch(e){}};

/* If the live all-parks map is present, keep its button behavior while adding Saratoga. */
setTimeout(()=>{try{dccV28AddSaratogaButton()}catch(e){}},0);

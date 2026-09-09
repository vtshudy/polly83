/* DCC v43 — visual/tab sync for the September 8 itinerary update */
(()=>{
 if(typeof dccV34Img==='undefined')return;
 dccV34DayImage=function(day){
  if(day==='2026-11-27'||day==='2026-12-05')return dccV34Img.plane;
  if(day==='2026-11-28')return dccV34Img.jollywood;
  if(day==='2026-11-29')return dccV34Img.saratoga;
  if(day==='2026-11-30')return dccV34Img.ak;
  if(day==='2026-12-01'||day==='2026-12-04')return dccV34Img.castle;
  if(day==='2026-12-02')return dccV34Img.skyliner;
  if(day==='2026-12-03')return dccV34Img.epcot;
  return dccV34Img.castle;
 };
 dccV34Travel=function(){
  let h=dccV34Hero('Getting around Disney','Walking, boats, Skyliner, buses and rideshare — the planner compares the fastest practical choice.',dccV34Img.skyliner,'Best route');h+='<div class="dccVisualGrid">';
  h+=dccV34Card({img:dccV34Img.skyliner,title:'EPCOT → Hollywood Studios',sub:'Dec 2 park hop via Skyliner',badges:['Skyliner',{text:'Dec 2',cls:'purple'}],meta:[['ROUTE','International Gateway → Skyliner → Studios'],['USE WHEN','After EPCOT priorities on Dec 2']],note:'The updated itinerary moved the EPCOT-to-Hollywood Studios hop to Dec 2. The route planner uses your location, the next fixed event and transportation status to choose the best timing.',actions:[{label:'Open Dec 2',day:'2026-12-02',primary:true},{label:'Disney Skyliner',href:'https://disneyworld.disney.go.com/skyliner/'}]});
  h+=dccV34Card({img:dccV34Img.hs,title:'BoardWalk → Hollywood Studios',sub:'Walk or Friendship Boat',badges:['Walk / Boat',{text:'Nov 28',cls:'gold'}],meta:[['WALK','~20 min in the source plan + family buffer'],['BOAT','Best if one is boarding soon']],note:'Compare walking against the next Friendship Boat so you do not waste time waiting when walking is faster.',actions:[{label:'Open Jollywood day',day:'2026-11-28',primary:true},{label:'Map BoardWalk',href:dccV34MapHref("Disney's BoardWalk")}]});
  h+=dccV34Card({img:dccV34Img.saratoga,title:'Saratoga Springs ↔ Disney Springs',sub:'Your main resort transportation hub',badges:['Home base',{text:'Nov 29–Dec 5',cls:'green'}],meta:[['BEST CASE','Walk from Congress Park'],['ALTERNATES','Boat / bus / rideshare']],note:'Saratoga Springs remains your home base, so transportation alerts and return-to-hotel recommendations prioritize routes that affect this resort.',actions:[{label:'Open Nov 29',day:'2026-11-29',primary:true},{label:'Resort Map',href:'https://magicguides.com/wp-content/uploads/2019/01/Saratoga-Springs-Resort-Map.pdf'}]});
  return h+'</div>';
 };
 dccV34Dining=function(){
  let h=dccV34Hero('Dining plans','Reservations, meal candidates and food stops organized around your updated park route.',dccV34Img.dining,'Eat without backtracking'),rows=[];
  const foodRE=/restaurant|dinner|lunch|breakfast|brunch|meal|snack|cake bake|yak & yeti|via napoli|tutto|brown derby|hollywood & vine|turf club|bakery|boathouse|geyser point|cape may|topolino|fife & drum|columbia harbour|auntie gravity/i;
  for(const [day,v] of Object.entries(itinerary))for(const x of v.items)if(foodRE.test(x[2]+' '+x[3]))rows.push({day,v,x});
  h+='<div class="dccVisualGrid">';
  for(const r of rows){h+=dccV34Card({img:dccV34Img.dining,title:r.x[2],sub:r.v.title+' • '+(r.x[0]?fmt(r.x[0]):'FLEX'),badges:[r.x[0]?{text:fmt(r.x[0]),cls:'gold'}:'FLEX','Dining'],meta:[['DAY',r.v.title],['LOCATION / FLOW',r.v.sub]],note:r.x[3],actions:[{label:'📍 Map',href:dccV34MapHref(r.x[2])},{label:'Open day',day:r.day,primary:true}]})}
  if(!rows.length)h+='<div class="dccVisualEmpty">No dining items are planned yet.</div>';
  return h+'</div>';
 };
})();

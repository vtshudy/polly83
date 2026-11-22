/* DCC v45 — Nov 22 family schedule: travel + dedicated Lightning Lane selections */
(()=>{
 if(typeof dccV34Img==='undefined')return;
 dccV34DayImage=function(day){
  if(day==='2026-11-27'||day==='2026-12-05')return dccV34Img.plane;
  if(day==='2026-11-28')return dccV34Img.jollywood;
  if(day==='2026-11-29')return dccV34Img.saratoga;
  if(day==='2026-11-30')return dccV34Img.ak;
  if(day==='2026-12-01'||day==='2026-12-04')return dccV34Img.castle;
  if(day==='2026-12-02')return dccV34Img.epcot;
  if(day==='2026-12-03')return dccV34Img.skyliner;
  return dccV34Img.castle;
 };
 dccV34Travel=function(){
  let h=dccV34Hero('Getting around Disney','Walking, boats, Skyliner, buses and rideshare — the planner compares the fastest practical choice.',dccV34Img.skyliner,'Best route');h+='<div class="dccVisualGrid">';
  h+=dccV34Card({img:dccV34Img.skyliner,title:'Hollywood Studios → EPCOT',sub:'Dec 3 park hop via Skyliner',badges:['Skyliner',{text:'Dec 3',cls:'purple'}],meta:[['ROUTE','Hollywood Studios → Skyliner → International Gateway'],['USE WHEN','After the Studios show block on Dec 3']],note:'The updated itinerary puts the Skyliner transfer on Dec 3. The 12:55 PM Mermaid show makes the 1:40 PM Test Track window tight. Tutto Italia dining package is 4:10 PM, Candlelight Processional at 6:30 PM.',actions:[{label:'Open Dec 3',day:'2026-12-03',primary:true},{label:'Disney Skyliner',href:'https://disneyworld.disney.go.com/skyliner/'}]});
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

 dccV34Lightning=function(){
  let h=dccV34Hero('Lightning Lane timetable','Times copied from your handwritten plan. These are planned selections: verify actual return windows and attraction operation in My Disney Experience.',dccV34Img.epcot,'Nov 30 – Dec 4 • 2026');
  const groups=[
   {day:'2026-11-30',name:'Animal Kingdom',img:dccV34Img.ak,cost:'$22 per person Multi Pass + $19 Single Pass',rows:[['8:45 AM','Kilimanjaro Safaris','Multi Pass'],['11:45 AM','Kali River Rapids','Multi Pass'],['12:30 PM','Flight of Passage','$19 Single Pass'],['1:10 PM','Na\'vi River Journey','Multi Pass']],note:'Feathered Friends at roughly 11:45 conflicts with Kali if both are fixed.'},
   {day:'2026-12-02',name:'EPCOT + Magic Kingdom',img:dccV34Img.epcot,cost:'$32 per person Multi Pass + optional $16 Single Pass',rows:[['9:40 AM','Spaceship Earth','Multi Pass'],['10:40 AM','Soarin\'','Multi Pass'],['1:10 PM','Frozen Ever After','Multi Pass'],['7:00 PM','Seven Dwarfs Mine Train','Possible $16 Single Pass; not booked']],note:'Try Remy after the first scan. The evening Mine Train option is for the Magic Kingdom hop.'},
   {day:'2026-12-03',name:'EPCOT after Hollywood Studios',img:dccV34Img.skyliner,cost:'$32 per person Multi Pass',rows:[['1:40 PM','Test Track','Multi Pass'],['2:20 PM','The Seas with Nemo & Friends','Multi Pass'],['3:00 PM','Turtle Talk with Crush','Planned experience']],note:'Tight transfer after the 12:55 PM Little Mermaid show. 4:10 Tutto Italia dining package and 6:30 Candlelight are fixed anchors.'},
   {day:'2026-12-04',name:'Magic Kingdom',img:dccV34Img.castle,cost:'$39 per person Multi Pass + $16 Single Pass',rows:[['TBD','Seven Dwarfs Mine Train','$16 Single Pass'],['TBD','Big Thunder Mountain','Multi Pass'],['TBD','Buzz Lightyear','Multi Pass'],['TBD','Winnie the Pooh','Multi Pass']],note:'Return windows not written on the sheet. Cinderella’s Royal Table 3:50 PM; Magic Kingdom exit 6 PM.'}
  ];
  h+='<div class="dccVisualGrid">';
  for(const g of groups){
   let rows=g.rows.map(r=>'<div class="dccMiniCard"><div class="dccMiniTime">'+dccEsc(r[0])+'</div><div><b>'+dccEsc(r[1])+'</b><small>'+dccEsc(r[2])+'</small></div></div>').join('');
   h+=dccV34Card({img:g.img,title:g.name,sub:g.cost,badges:[{text:g.day.slice(5),cls:'gold'},'Planning schedule'],note:g.note,actions:[{label:'Open this day',day:g.day,primary:true}]});
   h+='<div class="dccLaneRows">'+rows+'</div>';
  }
  return h+'</div>';
 };
})();

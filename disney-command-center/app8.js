/* DCC v26 — edit itinerary times / delete plans with device persistence */
const dccEditStorageKey='dcc-itinerary-edits-v1';
const dccOriginalItems={};
for(const [day,v] of Object.entries(itinerary))dccOriginalItems[day]=v.items.map(x=>[...x]);
function dccReadItineraryEdits(){try{return JSON.parse(localStorage.getItem(dccEditStorageKey)||'{}')||{}}catch(e){return{}}}
function dccWriteItineraryEdits(edits){try{localStorage.setItem(dccEditStorageKey,JSON.stringify(edits))}catch(e){}}
function dccApplySavedItineraryEdits(){let edits=dccReadItineraryEdits();for(const [day,items] of Object.entries(edits)){if(itinerary[day]&&Array.isArray(items))itinerary[day].items=items.filter(Array.isArray).map(x=>[String(x[0]||''),String(x[1]||''),String(x[2]||''),String(x[3]||'')])}}
function dccSaveEditedDay(day){let edits=dccReadItineraryEdits();edits[day]=itinerary[day].items.map(x=>[...x]);dccWriteItineraryEdits(edits)}
function dccRestoreDay(day){let edits=dccReadItineraryEdits();delete edits[day];dccWriteItineraryEdits(edits);itinerary[day].items=dccOriginalItems[day].map(x=>[...x])}
function dccRefreshAfterItineraryEdit(day){try{renderToday()}catch(e){}try{renderDays()}catch(e){}try{destroyDayMap();setTimeout(()=>initDayRouteMap(day),35)}catch(e){}}
function dccEsc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const dccEditModes={};
const dccBaseDayPanel=dayPanel;
dayPanel=function(day){
 dccBaseDayPanel(day);
 const cards=[...document.querySelectorAll('#pb .pCard')],card=cards.find(c=>{let b=c.querySelector(':scope > b');return b&&b.textContent.trim()==='Itinerary breakdown'});
 if(!card)return;
 let title=card.querySelector(':scope > b');
 let head=document.createElement('div');head.className='itinEditHead';title.replaceWith(head);head.innerHTML='<b>Itinerary breakdown</b><button class="itinEditBtn">'+(dccEditModes[day]?'Done':'✏️ Edit')+'</button>';
 head.querySelector('.itinEditBtn').onclick=e=>{e.stopPropagation();dccEditModes[day]=!dccEditModes[day];dayPanel(day)};
 if(!dccEditModes[day])return;
 let tip=document.createElement('div');tip.className='itinEditTip';tip.innerHTML='<span>Change a time, make it FLEX, or delete a plan. Changes save automatically on this device.</span><button class="itinRestoreBtn">Restore original day</button>';
 head.after(tip);
 tip.querySelector('.itinRestoreBtn').onclick=e=>{e.stopPropagation();if(confirm('Restore the original '+itinerary[day].title+' itinerary? Your time changes and deletions for this day will be removed.')){dccRestoreDay(day);dccEditModes[day]=false;dayPanel(day);dccRefreshAfterItineraryEdit(day)}};
 card.querySelectorAll('.itin[data-itidx]').forEach(row=>{
   let idx=+row.dataset.itidx,item=itinerary[day].items[idx];if(!item)return;
   row.classList.add('itinEditing');
   let timeBox=row.querySelector('.itime'),body=row.children[1];
   timeBox.classList.remove('flex');
   timeBox.innerHTML='<label>TIME<input class="itinTimeInput" type="time" value="'+dccEsc(item[0])+'"></label><button class="itinFlexBtn" type="button">FLEX</button>';
   let controls=document.createElement('div');controls.className='itinEditActions';controls.innerHTML='<button class="itinDeleteBtn" type="button">🗑 Delete</button>';
   body.append(controls);
   let input=timeBox.querySelector('.itinTimeInput');
   input.onchange=e=>{e.stopPropagation();item[0]=input.value||'';dccSaveEditedDay(day);dccRefreshAfterItineraryEdit(day)};
   input.onclick=e=>e.stopPropagation();
   timeBox.querySelector('.itinFlexBtn').onclick=e=>{e.stopPropagation();item[0]='';dccSaveEditedDay(day);dayPanel(day);dccRefreshAfterItineraryEdit(day)};
   controls.querySelector('.itinDeleteBtn').onclick=e=>{e.stopPropagation();if(confirm('Delete “'+item[2]+'” from this day?')){itinerary[day].items.splice(idx,1);dccSaveEditedDay(day);dayPanel(day);dccRefreshAfterItineraryEdit(day)}};
 });
};

dccApplySavedItineraryEdits();
try{renderDays();renderToday()}catch(e){}

/* Load v27 live all-parks map after all earlier map handlers are installed. */
(()=>{let l=document.createElement('link');l.rel='stylesheet';l.href='/disney-command-center/live27.css?v=27';document.head.append(l);let s=document.createElement('script');s.src='/disney-command-center/app9.js?v=27';s.defer=false;document.body.append(s)})();

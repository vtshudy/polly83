/* DCC v33 — user-controlled timing selection. Only checked itinerary items may be retimed. */
const dccV33SelectPrefix='dcc-time-select-v33-';
function dccV33ItemKey(item){return [item?.[1]||'',item?.[2]||'',item?.[3]||''].join('|')}
function dccV33Read(day){try{return new Set(JSON.parse(localStorage.getItem(dccV33SelectPrefix+day)||'[]'))}catch(e){return new Set()}}
function dccV33Write(day,set){try{localStorage.setItem(dccV33SelectPrefix+day,JSON.stringify([...set]))}catch(e){}}
function dccV33Selected(day,item){return dccV33Read(day).has(dccV33ItemKey(item))}
function dccV33UpdateCount(day){let el=document.querySelector('.itinSelectedCount');if(!el)return;let set=dccV33Read(day),count=(itinerary[day]?.items||[]).filter(x=>set.has(dccV33ItemKey(x))).length;el.textContent=count+' selected'}
function dccV33RenderSelection(day){
 if(!dccEditModes?.[day])return;let pb=$('pb'),card=[...pb.querySelectorAll('.pCard')].find(c=>c.querySelector('.itinEditHead'));if(!card||card.querySelector('.itinSelectToolbar'))return;
 let tip=card.querySelector('.itinEditTip'),bar=document.createElement('div');bar.className='itinSelectToolbar';bar.innerHTML='<div><b>🕒 Choose what I can schedule</b><small>Nothing is changed unless you check it. “Select All FLEX” selects only items that do not already have a time. Existing reservation/show times stay protected unless you manually check them.</small></div><span class="itinSelectedCount">0 selected</span><div class="itinSelectActions"><button type="button" class="itinSelectAll">Select All FLEX</button><button type="button" class="itinSelectClear">Clear</button></div>';
 (tip||card.querySelector('.itinEditHead')).after(bar);
 let set=dccV33Read(day);
 card.querySelectorAll('.itin[data-itidx]').forEach(row=>{let idx=+row.dataset.itidx,item=itinerary[day].items[idx];if(!item)return;let body=row.children[1];if(!body||body.querySelector('.itinPlanCheck'))return;let key=dccV33ItemKey(item),label=document.createElement('label');label.className='itinPlanCheck'+(set.has(key)?' selected':'')+(item[0]?' locked':'');label.innerHTML='<input type="checkbox" '+(set.has(key)?'checked':'')+'><span>'+(item[0]?'Allow planner to change this time':'Give this item a recommended time')+'</span>'+(item[0]?'<em>currently '+dccEsc(fmt(item[0]))+'</em>':'');body.append(label);let cb=label.querySelector('input');cb.onclick=e=>e.stopPropagation();cb.onchange=e=>{e.stopPropagation();let s=dccV33Read(day);if(cb.checked)s.add(key);else s.delete(key);dccV33Write(day,s);label.classList.toggle('selected',cb.checked);dccV33UpdateCount(day)};label.onclick=e=>e.stopPropagation()});
 bar.querySelector('.itinSelectAll').onclick=e=>{e.stopPropagation();let s=dccV33Read(day);for(const item of itinerary[day].items)if(!item[0])s.add(dccV33ItemKey(item));dccV33Write(day,s);dayPanel(day)};
 bar.querySelector('.itinSelectClear').onclick=e=>{e.stopPropagation();dccV33Write(day,new Set());dayPanel(day)};
 dccV33UpdateCount(day);let b=document.getElementById('dccFlexTimeBtn');if(b)b.textContent='🗺️ Optimize Selected + Times';let r=document.getElementById('dccPlannerResult');if(r)r.innerHTML='Select the itinerary items you want me to schedule. Unchecked times and FLEX items are left alone.';
}

async function dccV33OptimizeSelectedOrder(day,selected){
 let items=itinerary[day]?.items||[],pts=await resolveDayPoints(day),byIndex=new Map(pts.map(p=>[p.index,p]));
 const movable=i=>{let it=items[i],p=byIndex.get(i);return !!(it&&p&&selected.has(dccV33ItemKey(it))&&!it[0]&&p.entityType==='ATTRACTION')};
 let groups=[];for(let i=0;i<items.length;){if(!movable(i)){i++;continue}let s=i,a=[];while(i<items.length&&movable(i)){a.push(i);i++}if(a.length>1)groups.push({s,e:i-1,idx:a})}
 if(!groups.length)return[];let cache=new Map(),summary=[];
 for(let gi=groups.length-1;gi>=0;gi--){let g=groups[gi],entries=g.idx.map(i=>({...byIndex.get(i),item:items[i]})),start=null,end=null;for(let i=g.s-1;i>=0;i--){if(byIndex.get(i)){start=byIndex.get(i);break}}for(let i=g.e+1;i<items.length;i++){if(byIndex.get(i)){end=byIndex.get(i);break}}let best=await dccV31BestOrder(entries,start,end,cache),old=entries.map(x=>x.name),neo=best.map(x=>x.name);if(old.join('|')!==neo.join('|')){items.splice(g.s,g.idx.length,...best.map(x=>x.item));summary.push(neo)}}return summary
}
function dccV33NextProtectedFixed(items,start,lastAbsolute,selected){let offset=Math.floor((lastAbsolute||0)/1440)*1440;for(let j=start+1;j<items.length;j++){let it=items[j];if(!it[0]||selected.has(dccV33ItemKey(it)))continue;let raw=dccV30ParseTime(it[0]),abs=raw+offset;while(lastAbsolute!=null&&abs<lastAbsolute-360)abs+=1440;return abs}return null}
async function dccV33RecommendSelected(day){
 let items=itinerary[day]?.items||[],selected=dccV33Read(day),chosen=items.filter(x=>selected.has(dccV33ItemKey(x)));if(!chosen.length){dccV30PlannerMessage(day,'Select at least one itinerary item first. I will not change anything that is unchecked.','warn');return}
 dccV30PlannerMessage(day,'Optimizing only the checked items. Your unchecked times and plans are protected…');
 let routeChanges=[];try{routeChanges=await dccV33OptimizeSelectedOrder(day,selected)}catch(e){}
 items=itinerary[day].items;let pts=[];try{pts=await resolveDayPoints(day)}catch(e){}let by=new Map(pts.map(p=>[p.index,p]));let cursor=null,lastAbsolute=null,prevPoint=null,assigned=[],kept=[];
 for(let i=0;i<items.length;i++){
  let it=items[i],p=by.get(i),isSelected=selected.has(dccV33ItemKey(it)),raw=dccV30ParseTime(it[0]);
  if(raw!=null&&!isSelected){let abs=raw+(lastAbsolute==null?0:Math.floor(lastAbsolute/1440)*1440);while(lastAbsolute!=null&&abs<lastAbsolute-360)abs+=1440;lastAbsolute=abs;cursor=abs+dccV30Dwell(it,p);if(p)prevPoint=p;continue}
  if(cursor==null){cursor=dccV30DefaultStart(day);lastAbsolute=cursor}
  let travel=0;if(prevPoint&&p){let d=miles(prevPoint,p),g=legMode(day,prevPoint,p,d);travel=Number.isFinite(g.mins)?g.mins:Math.max(4,Math.round(d*20+3))}
  if(!isSelected){cursor=dccV30Round5(cursor+travel+dccV30Dwell(it,p));if(p)prevPoint=p;continue}
  let proposed=dccV30Round5(cursor+travel),dwell=dccV30Dwell(it,p),nextFixed=dccV33NextProtectedFixed(items,i,proposed,selected);
  if(nextFixed!=null&&proposed+dwell>nextFixed-5){kept.push(it[2]);if(p)prevPoint=p;continue}
  it[0]=dccV30Clock(proposed);assigned.push([it[2],fmt(it[0])]);lastAbsolute=proposed;cursor=proposed+dwell;if(p)prevPoint=p;
 }
 dccSaveEditedDay(day);dayPanel(day);dccRefreshAfterItineraryEdit(day);setTimeout(()=>{let parts=[];if(routeChanges.length)parts.push('<b>Selected ride order optimized:</b><br>'+routeChanges.map(x=>'• '+x.map(dccEsc).join(' → ')).join('<br>'));if(assigned.length)parts.push('<b>Times changed only for checked items:</b><br>'+assigned.map(x=>dccEsc(x[1])+' • '+dccEsc(x[0])).join('<br>'));if(kept.length)parts.push('<b>Not changed:</b> '+kept.map(dccEsc).join(', ')+' — not enough room before the next protected fixed time.');parts.push('<small>Unchecked itinerary items were not retimed or reordered.</small>');dccV30PlannerMessage(day,parts.join('<br><br>'),assigned.length?'ok':'warn')},100)
}
/* Replace the previous all-FLEX optimizer with the selection-aware version. */
dccV30RecommendFlex=dccV33RecommendSelected;
const dccV33BaseDayPanel=dayPanel;
dayPanel=function(day){dccV33BaseDayPanel(day);setTimeout(()=>dccV33RenderSelection(day),0)};

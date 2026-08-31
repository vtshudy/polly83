/* DCC v30 — flight snapshot instead of flight countdown + day planner question/FLEX-time tools */
const dccV30Flights={
 'AA 1697':{date:'Friday • Nov 27, 2026',route:'PHL → MCO',depart:'2:27 PM',arrive:'5:20 PM',from:'Philadelphia',to:'Orlando',seats:[['Clement','16F'],['Cameron','16E']]},
 'AA 2084':{date:'Saturday • Dec 5, 2026',route:'MCO → PHL',depart:'12:21 PM',arrive:'2:54 PM',from:'Orlando',to:'Philadelphia',seats:[['Clement','25F'],['Cameron','25E']]}
};
function dccV30FlightForName(s){s=String(s||'');for(const k of Object.keys(dccV30Flights))if(s.includes(k))return[k,dccV30Flights[k]];return null}
function dccV30FlightHtml(num,f){return '<div class="flightSnapshot"><div class="flightSnapshotTop"><div><span>✈️ NEXT FLIGHT</span><b>'+num+' • '+f.route+'</b></div><strong>'+f.date+'</strong></div><div class="flightSnapshotTimes"><div><small>DEPART</small><b>'+f.depart+'</b><span>'+f.from+'</span></div><div class="flightArrow">→</div><div><small>ARRIVE</small><b>'+f.arrive+'</b><span>'+f.to+'</span></div></div><div class="flightSeats"><small>SEATS</small>'+f.seats.map(x=>'<span>💺 '+x[0]+' <b>'+x[1]+'</b></span>').join('')+'</div></div>'}
function dccV30DecorateToday(){let next=document.querySelector('#today .next');if(!next)return;let name=next.querySelector('.name'),hit=dccV30FlightForName(name?.textContent);if(!hit)return;if(next.querySelector('.flightSnapshot'))return;let clock=next.querySelector('.miniClock');if(clock)clock.outerHTML=dccV30FlightHtml(hit[0],hit[1]);else next.insertAdjacentHTML('beforeend',dccV30FlightHtml(hit[0],hit[1]))}
const dccV30TodayObserver=new MutationObserver(()=>queueMicrotask(dccV30DecorateToday));
if($('today'))dccV30TodayObserver.observe($('today'),{childList:true,subtree:true});
setInterval(dccV30DecorateToday,1000);dccV30DecorateToday();

function dccV30QKey(day){return'dcc-plan-question-'+day}
function dccV30PlannerMessage(day,msg,kind='info'){let x=document.getElementById('dccPlannerResult');if(x){x.className='dccPlannerResult '+kind;x.innerHTML=msg}}
async function dccV30BuildChatPrompt(day,q){
 let v=itinerary[day],pts=[];try{pts=await resolveDayPoints(day)}catch(e){}
 let by=new Map(pts.map(p=>[p.index,p])),lines=v.items.map((x,i)=>'- '+fmt(x[0])+' • '+x[1]+' '+x[2]+' — '+x[3]).join('\n'),routes=[];
 for(let i=0;i<v.items.length-1;i++){let a=by.get(i),b=by.get(i+1);if(!a||!b)continue;let d=miles(a,b),g=legMode(day,a,b,d);routes.push('- '+a.name+' → '+b.name+': '+g.mode+(g.mins?' ~'+g.mins+' min':'')+' — '+g.detail)}
 return 'Help me plan this Walt Disney World trip day. Use the itinerary order, mapped locations, realistic walking/Disney-transport time, and fixed reservation/show times. Avoid unnecessary backtracking.\n\nDAY: '+v.title+'\n'+v.sub+'\n\nITINERARY:\n'+lines+'\n\nMAP/TRAVEL NOTES:\n'+(routes.join('\n')||'No mapped route notes available yet.')+'\n\nMY QUESTION:\n'+q+'\n\nPlease give a practical recommendation and call out any timing conflict or better route.';
}
async function dccV30AskChatGPT(day){
 let ta=document.getElementById('dccAskQuestion'),q=(ta?.value||'').trim();if(!q){dccV30PlannerMessage(day,'Type a question first.','warn');ta?.focus();return}
 localStorage.setItem(dccV30QKey(day),q);dccV30PlannerMessage(day,'Building the day context…');
 let prompt=await dccV30BuildChatPrompt(day,q),copied=false;try{await navigator.clipboard.writeText(prompt);copied=true}catch(e){}
 let w=window.open('https://chatgpt.com/','_blank','noopener');
 dccV30PlannerMessage(day,copied?'Full itinerary + map context copied. ChatGPT opened — paste the copied question there.':'ChatGPT opened. Copy this question and include the current day itinerary: <b>'+dccEsc(q)+'</b>',copied?'ok':'warn');
 if(!w&&!copied)location.href='https://chatgpt.com/';
}
function dccV30ParseTime(t){if(!t)return null;let[a,b]=t.split(':').map(Number);return a*60+b}
function dccV30Clock(min){min=((Math.round(min)%1440)+1440)%1440;return String(Math.floor(min/60)).padStart(2,'0')+':'+String(min%60).padStart(2,'0')}
function dccV30Round5(n){return Math.ceil(n/5)*5}
function dccV30DefaultStart(day){let t=(itinerary[day]?.title||'').toLowerCase();if(t.includes('jollywood'))return 10*60+30;if(t.includes('rest'))return 8*60+30;if(t.includes('travel'))return 8*60;return 9*60}
function dccV30Dwell(item,p){let n=nrm(item?.[2]||'');if(/pool|relax/.test(n))return 90;if(/restaurant|dinner|breakfast|brunch|cake bake|meal|royal table|brown derby|yak yeti|via napoli|le cellier/.test(n))return 75;if(/fantasmic|show|sing along|entertainment|philharmagic|tiki room|festival of the lion king|finding nemo/.test(n))return 35;if(p?.entityType==='ATTRACTION'||/slinky|resistance|toy story|runaway railway|mine train|haunted|pirates|dumbo|peter pan|jungle cruise|soarin|frozen|test track|remy|spaceship|living with the land|safari|everest|river journey|flight of passage/.test(n))return 45;if(/shopping|bakery|pearl|sir mickey/.test(n))return 25;if(/entry|party begins|jollywood nights$/.test(n))return 15;if(/uber|boat|skyliner|bus|transport|transfer|leave for|target leave/.test(n))return 20;return 30}
function dccV30NextFixed(items,start,lastAbsolute){let offset=Math.floor((lastAbsolute||0)/1440)*1440;for(let j=start+1;j<items.length;j++){if(!items[j][0])continue;let raw=dccV30ParseTime(items[j][0]),abs=raw+offset;while(lastAbsolute!=null&&abs<lastAbsolute-360)abs+=1440;return abs}return null}
async function dccV30RecommendFlex(day){
 let items=itinerary[day].items,flexCount=items.filter(x=>!x[0]).length;if(!flexCount){dccV30PlannerMessage(day,'Everything on this day already has a time.','ok');return}
 dccV30PlannerMessage(day,'Using mapped locations and the previous stop to build suggested times…');
 let pts=[];try{pts=await resolveDayPoints(day)}catch(e){}let by=new Map(pts.map(p=>[p.index,p]));
 let cursor=null,lastAbsolute=null,prevPoint=null,assigned=[],kept=[];
 for(let i=0;i<items.length;i++){
  let it=items[i],p=by.get(i),raw=dccV30ParseTime(it[0]);
  if(raw!=null){let abs=raw+(lastAbsolute==null?0:Math.floor(lastAbsolute/1440)*1440);while(lastAbsolute!=null&&abs<lastAbsolute-360)abs+=1440;lastAbsolute=abs;cursor=abs+dccV30Dwell(it,p);if(p)prevPoint=p;continue}
  if(cursor==null){cursor=dccV30DefaultStart(day);lastAbsolute=cursor}
  let travel=0;if(prevPoint&&p){let d=miles(prevPoint,p),g=legMode(day,prevPoint,p,d);travel=Number.isFinite(g.mins)?g.mins:Math.max(4,Math.round(d*20+3))}
  let proposed=dccV30Round5(cursor+travel),dwell=dccV30Dwell(it,p),nextFixed=dccV30NextFixed(items,i,proposed);
  if(nextFixed!=null&&proposed+dwell>nextFixed-5){kept.push(it[2]);continue}
  it[0]=dccV30Clock(proposed);assigned.push([it[2],fmt(it[0])]);lastAbsolute=proposed;cursor=proposed+dwell;if(p)prevPoint=p;
 }
 if(assigned.length){dccSaveEditedDay(day);dayPanel(day);dccRefreshAfterItineraryEdit(day);setTimeout(()=>{let summary='<b>Suggested times added:</b><br>'+assigned.map(x=>x[1]+' • '+dccEsc(x[0])).join('<br>')+(kept.length?'<br><br><b>Kept FLEX:</b> '+kept.map(dccEsc).join(', ')+' because the next fixed time was too close.':'');dccV30PlannerMessage(day,summary,'ok')},60)}else dccV30PlannerMessage(day,'I kept these items FLEX because there was not enough room before the next fixed itinerary time.','warn');
}
function dccV30AppendPlanner(day){
 if(!dccEditModes?.[day]||document.getElementById('dccPlannerTools'))return;let pb=$('pb');if(!pb)return;
 let box=document.createElement('div');box.id='dccPlannerTools';box.className='dccPlannerTools';let saved=localStorage.getItem(dccV30QKey(day))||'';
 box.innerHTML='<div class="dccPlannerHead"><div><b>✨ Plan this day with me</b><small>Ask about the route, timing, food, attractions, or what to do next.</small></div></div><textarea id="dccAskQuestion" placeholder="Example: What should we do after Fantasmic without backtracking?">'+dccEsc(saved)+'</textarea><div class="dccPlannerButtons"><button id="dccAskBtn">💬 Ask ChatGPT</button><button id="dccFlexTimeBtn">🕒 Recommend FLEX Times</button></div><div id="dccPlannerResult" class="dccPlannerResult">FLEX-time recommendations use the mapped stop locations, the previous itinerary item, travel time, and the next fixed-time anchor.</div>';
 pb.append(box);box.querySelector('#dccAskQuestion').oninput=e=>localStorage.setItem(dccV30QKey(day),e.target.value);box.querySelector('#dccAskBtn').onclick=()=>dccV30AskChatGPT(day);box.querySelector('#dccFlexTimeBtn').onclick=()=>dccV30RecommendFlex(day);
}
const dccV30BaseDayPanel=dayPanel;
dayPanel=function(day){dccV30BaseDayPanel(day);setTimeout(()=>dccV30AppendPlanner(day),0)};

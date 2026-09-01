/* DCC v41 — Walt Disney World ride + transportation alerts, Saratoga Springs priority */
(()=>{
 const SEEN_KEY='dcc-alert-seen-v41';
 let alerts=[],updated='',homeBase="Disney's Saratoga Springs Resort & Spa",pollTimer=null;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function seen(){try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'))}catch(e){return new Set()}}
 function saveSeen(set){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...set].slice(-300)))}catch(e){}}
 function unread(){let s=seen();return alerts.filter(a=>!s.has(a.id))}
 function fmtTime(v){try{return new Date(v).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return''}}
 function ensureUI(){
  let app=document.querySelector('.app');if(app&&!document.getElementById('dccAlertBanner')){let b=document.createElement('button');b.type='button';b.id='dccAlertBanner';b.className='dccAlertBanner';b.hidden=true;b.innerHTML='<span class="dccAlertSiren">🚨</span><span class="dccAlertBannerText"><b>Walt Disney World alert</b><small>Orlando, Florida only • Checking…</small></span><span class="dccAlertBannerGo">View ›</span>';b.onclick=()=>openAlerts();app.prepend(b)}
  let nav=[...document.querySelectorAll('.nav [data-open="conditions"]')].find(x=>/Alerts/i.test(x.textContent));if(nav&&!nav.querySelector('.dccAlertCount')){nav.classList.add('dccAlertNav');let c=document.createElement('i');c.className='dccAlertCount';c.hidden=true;nav.append(c);nav.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openAlerts()})}
 }
 function urgency(a){if(a.homeBaseImpact==='direct')return 0;if(a.homeBaseImpact==='possible')return 1;if(a.verified&&a.severity==='urgent')return 2;if(a.category==='transport')return 3;return 4}
 function renderSignal(){
  ensureUI();let u=unread().sort((a,b)=>urgency(a)-urgency(b)),banner=document.getElementById('dccAlertBanner'),nav=document.querySelector('.dccAlertNav'),count=nav?.querySelector('.dccAlertCount');
  if(nav)nav.classList.toggle('dccAlertUnread',u.length>0);
  if(count){count.hidden=!u.length;count.textContent=u.length>9?'9+':String(u.length)}
  if(!banner)return;
  if(!u.length){banner.hidden=true;return}
  let urgent=u[0],direct=urgent.homeBaseImpact==='direct'||urgent.homeBaseImpact==='possible';banner.hidden=false;banner.classList.toggle('verified',!!urgent.verified);banner.querySelector('b').textContent=direct?'🏨 Saratoga transportation alert':urgent.category==='transport'?'🚌 Disney transportation alert':urgent.verified?'🎢 Ride status alert':'Disney news/social alert';banner.querySelector('small').textContent=(urgent.mode?urgent.mode+' • ':urgent.park?urgent.park+' • ':'')+urgent.title+(u.length>1?' • +'+(u.length-1)+' more':'');
 }
 function kindLabel(a){if(a.homeBaseImpact==='direct')return'🏨 YOUR RESORT ROUTE';if(a.homeBaseImpact==='possible')return'🏨 SARATOGA PRIORITY';if(a.category==='transport')return a.kind==='social'?'🚌 TRANSPORT SOCIAL':'🚌 TRANSPORT REPORT';return a.verified?'✓ LIVE WDW STATUS':a.kind==='social'?'WDW SOCIAL REPORT':'WDW ONLINE REPORT'}
 function card(a){let cls=a.verified?'verified':a.kind==='social'?'social':'report',link=a.url?'<a class="dccAlertSource" target="_blank" rel="noopener" href="'+esc(a.url)+'">Open source ↗</a>':'',park=a.park?'<span>'+esc(a.park)+'</span>':'',mode=a.mode?'<span>'+esc(a.mode)+'</span>':'',home=a.homeBaseImpact?'<span>🏨 Saratoga priority</span>':'';return '<article class="dccAlertCard '+cls+'"><div class="dccAlertCardTop"><strong>'+kindLabel(a)+'</strong><time>'+esc(fmtTime(a.published))+'</time></div><h3>'+esc(a.title)+'</h3><div class="dccAlertMeta">'+home+mode+park+'<span>'+esc(a.status||'Alert')+'</span><span>'+esc(a.source||'Source')+'</span></div><p>'+esc(a.detail||'')+'</p>'+link+'</article>'}
 function openAlerts(){
  ensureUI();let s=seen();for(const a of alerts)s.add(a.id);saveSeen(s);renderSignal();
  let pb=$('pb');$('pt').textContent='Disney World Alerts';
  let transport=alerts.filter(a=>a.category==='transport'),direct=transport.filter(a=>a.homeBaseImpact==='direct'||a.homeBaseImpact==='possible'),live=alerts.filter(a=>a.verified&&a.category!=='transport'),reported=alerts.filter(a=>!a.verified&&a.category!=='transport'),html='<div class="dccAlertsHero"><div><span>🚨 WALT DISNEY WORLD • ORLANDO ONLY</span><h2>Ride & Transportation Alerts</h2><p>Home base: '+esc(homeBase)+'. Saratoga-related transportation issues are moved to the top automatically.</p></div><div class="dccAlertsHeroCount">'+alerts.length+'<small>active/recent</small></div></div>';
  if(!alerts.length)html+='<div class="dccAlertEmpty">✅ No current Walt Disney World ride-down or transportation disruption reports are showing.</div>';
  if(direct.length)html+='<div class="dccAlertSection"><h3>🏨 Saratoga Springs priority</h3><small>Issues most likely to affect your resort-to-park or resort-to-Disney Springs route.</small></div>'+direct.map(card).join('');
  if(transport.length-direct.length)html+='<div class="dccAlertSection"><h3>🚌 Walt Disney World transportation</h3><small>Skyliner, monorail, buses, boats, ferries and park-hop transportation reports.</small></div>'+transport.filter(a=>!direct.includes(a)).map(card).join('');
  if(live.length)html+='<div class="dccAlertSection"><h3>Verified Walt Disney World attraction status</h3><small>Current Orlando attraction status feed</small></div>'+live.map(card).join('');
  if(reported.length)html+='<div class="dccAlertSection"><h3>Ride news & social reports</h3><small>Only Orlando/Florida reports are included. Public reports can be early or incorrect — use them as a heads-up until confirmed.</small></div>'+reported.map(card).join('');
  html+='<div class="dccAlertFoot">Scope: Walt Disney World Resort • Orlando, Florida only. Disneyland and other Disney destinations are excluded.<br>Updated '+esc(updated?fmtTime(updated):'just now')+' • checks about every 5 minutes while the app is open.</div>';
  pb.innerHTML=html;$('panel').classList.add('open');
 }
 function resetRecoveredLiveSeen(next){let s=seen(),active=new Set(next.filter(a=>a.verified).map(a=>a.id)),changed=false;for(const id of [...s]){if(String(id).startsWith('live-')&&!active.has(id)){s.delete(id);changed=true}}if(changed)saveSeen(s)}
 async function load(){
  ensureUI();try{let r=await fetch('/api/disney-alerts?ts='+Math.floor(Date.now()/240000),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);let j=await r.json();if(j&&Array.isArray(j.alerts)){resetRecoveredLiveSeen(j.alerts);alerts=j.alerts;updated=j.updated||new Date().toISOString();homeBase=j.homeBase||homeBase;renderSignal()}}catch(e){/* keep last good state silently */}
 }
 window.dccOpenAlerts=openAlerts;
 ensureUI();load();pollTimer=setInterval(load,300000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
 window.addEventListener('online',load);
})();
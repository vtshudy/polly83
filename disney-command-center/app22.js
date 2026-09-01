/* DCC v40 — Disney ride outage/news/social alert banner + blinking unread Alerts button */
(()=>{
 const SEEN_KEY='dcc-alert-seen-v40';
 let alerts=[],updated='',pollTimer=null;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function seen(){try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'))}catch(e){return new Set()}}
 function saveSeen(set){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...set].slice(-250)))}catch(e){}}
 function unread(){let s=seen();return alerts.filter(a=>!s.has(a.id))}
 function fmtTime(v){try{return new Date(v).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return''}}
 function ensureUI(){
  let app=document.querySelector('.app');if(app&&!document.getElementById('dccAlertBanner')){let b=document.createElement('button');b.type='button';b.id='dccAlertBanner';b.className='dccAlertBanner';b.hidden=true;b.innerHTML='<span class="dccAlertSiren">🚨</span><span class="dccAlertBannerText"><b>Disney attraction alert</b><small>Checking…</small></span><span class="dccAlertBannerGo">View ›</span>';b.onclick=()=>openAlerts();app.prepend(b)}
  let nav=[...document.querySelectorAll('.nav [data-open="conditions"]')].find(x=>/Alerts/i.test(x.textContent));if(nav&&!nav.querySelector('.dccAlertCount')){nav.classList.add('dccAlertNav');let c=document.createElement('i');c.className='dccAlertCount';c.hidden=true;nav.append(c);nav.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openAlerts()})}
 }
 function renderSignal(){
  ensureUI();let u=unread(),banner=document.getElementById('dccAlertBanner'),nav=document.querySelector('.dccAlertNav'),count=nav?.querySelector('.dccAlertCount');
  if(nav)nav.classList.toggle('dccAlertUnread',u.length>0);
  if(count){count.hidden=!u.length;count.textContent=u.length>9?'9+':String(u.length)}
  if(!banner)return;
  if(!u.length){banner.hidden=true;return}
  let urgent=u.find(x=>x.verified&&x.severity==='urgent')||u[0];banner.hidden=false;banner.classList.toggle('verified',!!urgent.verified);banner.querySelector('b').textContent=urgent.verified?'Ride status alert':'Disney news/social alert';banner.querySelector('small').textContent=(urgent.park?urgent.park+' • ':'')+urgent.title+(u.length>1?' • +'+(u.length-1)+' more':'');
 }
 function kindLabel(a){return a.verified?'✓ LIVE STATUS':a.kind==='social'?'SOCIAL REPORT':'ONLINE REPORT'}
 function card(a){let cls=a.verified?'verified':a.kind==='social'?'social':'report',link=a.url?'<a class="dccAlertSource" target="_blank" rel="noopener" href="'+esc(a.url)+'">Open source ↗</a>':'',park=a.park?'<span>'+esc(a.park)+'</span>':'';return '<article class="dccAlertCard '+cls+'"><div class="dccAlertCardTop"><strong>'+kindLabel(a)+'</strong><time>'+esc(fmtTime(a.published))+'</time></div><h3>'+esc(a.title)+'</h3><div class="dccAlertMeta">'+park+'<span>'+esc(a.status||'Alert')+'</span><span>'+esc(a.source||'Source')+'</span></div><p>'+esc(a.detail||'')+'</p>'+link+'</article>'}
 function openAlerts(){
  ensureUI();let s=seen();for(const a of alerts)s.add(a.id);saveSeen(s);renderSignal();
  let pb=$('pb');$('pt').textContent='Disney Alerts';
  let live=alerts.filter(a=>a.verified),reported=alerts.filter(a=>!a.verified),html='<div class="dccAlertsHero"><div><span>🚨 DISNEY WATCH</span><h2>Ride & Attraction Alerts</h2><p>Live ride status plus recent public news and social reports.</p></div><div class="dccAlertsHeroCount">'+alerts.length+'<small>active/recent</small></div></div>';
  if(!alerts.length)html+='<div class="dccAlertEmpty">✅ No ride-down or recent closure reports are showing right now.</div>';
  if(live.length)html+='<div class="dccAlertSection"><h3>Verified live status</h3><small>Current attraction status feed</small></div>'+live.map(card).join('');
  if(reported.length)html+='<div class="dccAlertSection"><h3>News & social reports</h3><small>Public reports can be early or incorrect — use them as a heads-up until confirmed by live Disney status.</small></div>'+reported.map(card).join('');
  html+='<div class="dccAlertFoot">Updated '+esc(updated?fmtTime(updated):'just now')+' • automatically checks about every 5 minutes while the app is open.</div>';
  pb.innerHTML=html;$('panel').classList.add('open');
 }
 async function load(){
  ensureUI();try{let r=await fetch('/api/disney-alerts?ts='+Math.floor(Date.now()/240000),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);let j=await r.json();if(j&&Array.isArray(j.alerts)){alerts=j.alerts;updated=j.updated||new Date().toISOString();renderSignal()}}catch(e){/* keep last good state silently */}
 }
 window.dccOpenAlerts=openAlerts;
 ensureUI();load();pollTimer=setInterval(load,300000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
 window.addEventListener('online',load);
})();

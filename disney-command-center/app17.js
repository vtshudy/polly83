/* DCC v36 — family login gate + bottom status controls. Password is not stored in plaintext in the repo. */
(()=>{
 const AUTH_KEY='dcc-family-auth-v1';
 const EXPECTED='005dc4ea3f1b623e00cf54375168871165dae0f627c47cdb7e3e1b3ef50d8eb3';
 const remembered=()=>localStorage.getItem(AUTH_KEY)==='ok'||sessionStorage.getItem(AUTH_KEY)==='ok';
 async function digest(text){let data=new TextEncoder().encode(text),buf=await crypto.subtle.digest('SHA-256',data);return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
 function unlock(){document.body.classList.remove('authLocked');document.getElementById('dccAuth')?.setAttribute('hidden','');setTimeout(()=>{try{map?.invalidateSize(false)}catch(e){}try{dayMap?.invalidateSize(false)}catch(e){}},80)}
 function logout(){localStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(AUTH_KEY);location.reload()}
 function ensureBottomStatus(){
  let content=document.querySelector('.content');if(!content)return null;
  let row=document.querySelector('.dccBottomStatus');if(!row){row=document.createElement('div');row.className='dccBottomStatus';row.innerHTML='<div class="dccBottomStatusLabel"><span>✨</span><div><b>Disney Command Center</b><small>Family trip controls</small></div></div>';content.append(row)}
  let pill=document.querySelector('.heroTop .pill')||document.querySelector('.dccBottomStatus .pill');if(pill&&pill.parentElement!==row)row.append(pill);
  return row
 }
 function addLogout(){
  let row=ensureBottomStatus();if(!row)return;
  let b=document.querySelector('.dccLogoutBtn');if(!b){b=document.createElement('button');b.type='button';b.className='dccLogoutBtn';b.textContent='🔒 Sign out';b.onclick=logout}
  if(b.parentElement!==row)row.append(b)
 }
 function show(){let wrap=document.createElement('section');wrap.id='dccAuth';wrap.className='dccAuth';wrap.setAttribute('aria-label','Disney Command Center sign in');wrap.innerHTML='<form class="dccAuthCard" id="dccAuthForm"><div class="dccAuthMark">✨</div><div class="dccAuthEyebrow">Tshudy Family • Disney 2026</div><h1>Disney Command Center</h1><p class="dccAuthSub">Sign in to open your family trip planner, live maps, itinerary and Disney travel tools.</p><label class="dccAuthField"><span>Username</span><input id="dccAuthUser" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Username" required></label><label class="dccAuthField"><span>Password</span><div class="dccPasswordWrap"><input id="dccAuthPass" name="password" type="password" autocomplete="current-password" placeholder="Password" required><button type="button" class="dccPasswordToggle" id="dccPasswordToggle">Show</button></div></label><label class="dccRemember"><input type="checkbox" id="dccRemember" checked><span>Remember this device</span></label><button class="dccLoginBtn" type="submit">Enter Disney Command Center ✨</button><div class="dccAuthError" id="dccAuthError" role="alert" aria-live="polite"></div><div class="dccAuthFoot">Private family trip access • Your itinerary stays on this device/browser where applicable.</div></form>';document.body.prepend(wrap);
 let form=wrap.querySelector('#dccAuthForm'),user=wrap.querySelector('#dccAuthUser'),pass=wrap.querySelector('#dccAuthPass'),err=wrap.querySelector('#dccAuthError'),toggle=wrap.querySelector('#dccPasswordToggle');
 toggle.onclick=()=>{let open=pass.type==='text';pass.type=open?'password':'text';toggle.textContent=open?'Show':'Hide'};
 form.onsubmit=async e=>{e.preventDefault();err.textContent='Checking…';let u=user.value.trim().toLowerCase(),p=pass.value;try{let h=await digest(u+'\n'+p);if(h===EXPECTED){if(wrap.querySelector('#dccRemember').checked)localStorage.setItem(AUTH_KEY,'ok');else sessionStorage.setItem(AUTH_KEY,'ok');err.textContent='';unlock();addLogout()}else{err.textContent='Username or password is incorrect.';pass.value='';pass.focus()}}catch(ex){err.textContent='Sign-in check could not run. Please refresh and try again.'}};
 setTimeout(()=>user.focus(),80)
 }
 if(remembered()){unlock();setTimeout(addLogout,0)}else show();
})();

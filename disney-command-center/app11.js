/* DCC v29 — make bottom Map visibly show live all-parks map + park tabs */
const dccV29BaseOpenLiveAll=dccOpenLiveAllParks;
const dccV29BaseOpenPark=dccOpenPark;

function dccV29EnsureAllParksTab(){
 const tabs=$('tabs');if(!tabs)return;
 let all=tabs.querySelector('.allParksTab');
 if(!all){all=document.createElement('button');all.className='allParksTab';all.textContent='All Parks';tabs.prepend(all)}
 all.onclick=e=>{e.stopPropagation();dccOpenLiveAllParks()};
}

async function dccV29OpenLiveAll(){
 await dccV29BaseOpenLiveAll();
 const mv=$('mapview');
 mv.classList.remove('liveMode');
 mv.classList.add('liveAllMode');
 dccV29EnsureAllParksTab();
 $('tabs').style.display='grid';
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.classList.contains('allParksTab')));
 $('maptitle').textContent='Live Disney Now';
 setTimeout(()=>{try{map.invalidateSize(false);map.fitBounds([[28.345,-81.606],[28.426,-81.515]],{animate:false,padding:[18,18]})}catch(e){}},80);
}

dccOpenLiveAllParks=dccV29OpenLiveAll;
dccOpenNow=dccV29OpenLiveAll;
dccOpenAll=dccV29OpenLiveAll;

dccOpenPark=async function(pk){
 $('mapview')?.classList.remove('liveAllMode');
 return dccV29BaseOpenPark(pk);
};

dccV29EnsureAllParksTab();
$('tabs').onclick=e=>{
 const all=e.target.closest('.allParksTab');if(all){dccV29OpenLiveAll();return}
 const b=e.target.closest('[data-park]');if(!b)return;
 $('mapview')?.classList.remove('liveAllMode');
 park=b.dataset.park;
 document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));
 dccOpenPark(park);
};

document.querySelectorAll('.mapbtn').forEach(b=>b.onclick=dccV29OpenLiveAll);

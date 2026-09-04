const CACHE='lockdown-pwa-v17-chapter-story';
const CORE=[
 './','./index.html','./app.css?v=0.17','./app.js?v=0.17','./manifest.webmanifest',
 './assets/menu-bg.webp','./assets/icon-192.png','./assets/icon-512.png','./assets/concept-board.webp',
 './assets/prologue/prologue_01_emergency.webp',
 './assets/prologue/prologue_02_flash.webp',
 './assets/prologue/prologue_03_chaos.webp',
 './assets/prologue/prologue_04_bunker.webp',
 './assets/prologue/prologue_05_door.webp',
 './assets/prologue/prologue_06_generator.webp',
 './assets/prologue/prologue_07_command.webp'
];
const AUDIO=[
 './assets/audio/Radio Static SFX.wav',
 './assets/audio/Craft item SFX.wav',
 './assets/audio/Heal SFX.wav',
 './assets/audio/Bunker AMBIENCE.wav'
];
self.addEventListener('install',e=>e.waitUntil(
 caches.open(CACHE).then(async c=>{
  await c.addAll(CORE);
  await Promise.allSettled(AUDIO.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(r.ok)await c.put(url,r)}));
 }).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const keys=await caches.keys();
 const hadOld=keys.some(k=>k.startsWith('lockdown-pwa-')&&k!==CACHE);
 await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
 if(hadOld){
  const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  await Promise.all(wins.map(c=>c.navigate(c.url).catch(()=>null)));
 }
})()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 const same=url.origin===self.location.origin;
 const shell=same&&(e.request.mode==='navigate'||/\/(?:index\.html|app\.js|app\.css|manifest\.webmanifest)$/.test(url.pathname));
 if(shell){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
   if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
   return r;
  }).catch(async()=>{
   const cached=await caches.match(e.request);
   return cached||(e.request.mode==='navigate'?caches.match('./index.html'):new Response('',{status:503,statusText:'Offline'}));
  }));
  return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
  if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}
  return r;
 }).catch(()=>new Response('',{status:503,statusText:'Offline'}))));
});

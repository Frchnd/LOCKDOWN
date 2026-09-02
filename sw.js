const CACHE='lockdown-pwa-v4-ambience';
const CORE=['./','./index.html','./app.css','./app.js','./manifest.webmanifest','./assets/menu-bg.webp','./assets/icon-192.png','./assets/icon-512.png','./assets/concept-board.webp'];
const AUDIO=['./assets/audio/Radio Static SFX.wav','./assets/audio/Craft item SFX.wav','./assets/audio/Heal SFX.wav','./assets/audio/Bunker AMBIENCE.wav'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(async c=>{
    await c.addAll(CORE);
    await Promise.allSettled(AUDIO.map(async url=>{const r=await fetch(url);if(r.ok)await c.put(url,r)}));
  }).then(()=>self.skipWaiting())
));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{
    if(r&&r.ok){const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}
    return r;
  }).catch(()=>caches.match('./index.html'))));
});

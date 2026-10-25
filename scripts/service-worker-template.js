// Generated at build time. Cache only this release's PUBLIC application shell.
const CACHE=__CACHE_NAME__,ASSETS=__PUBLIC_ASSETS__;
const allowed=new Set(ASSETS);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('arteria-shell-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')void self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/.netlify/'))return;
 const path=event.request.mode==='navigate'&&(url.pathname==='/'||url.pathname==='/index.html')?'/index.html':url.pathname;
 if(!allowed.has(path))return;
 // A release-consistent shell: updates install as a complete new cache and wait for consent.
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(path))||fetch(event.request)));
});

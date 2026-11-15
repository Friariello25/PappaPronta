/* Pappa Pronta - service worker. Cambia VERSION a ogni aggiornamento dell'app. */
var VERSION='pp-v7';
var CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function store(req,res){
  if(res&&(res.ok||res.type==='opaque')){var cp=res.clone();caches.open(VERSION).then(function(c){c.put(req,cp)})}
  return res;
}
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;
  var u=new URL(r.url);
  /* i dati dei prodotti (Open Food Facts) vanno sempre in rete, mai in memoria */
  if(/openfoodfacts\.org$/.test(u.hostname))return;
  var own=u.origin===self.location.origin,zx=/cdn\.jsdelivr\.net$/.test(u.hostname)&&/zxing/.test(u.pathname);
  if(!own&&!zx)return;
  if(r.mode==='navigate'){
    /* apre subito la copia salvata e intanto cerca la versione nuova */
    e.respondWith(caches.match('index.html').then(function(m){
      var net=fetch(r).then(function(res){return store(new Request('index.html'),res)}).catch(function(){return m});
      return m||net;
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){
    if(m)return m;
    return fetch(r).then(function(res){return store(r,res)});
  }));
});

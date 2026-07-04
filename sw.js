/* Erdem Maliyet Sistemi - Service Worker
   Strateji: app kabugu (HTML + ikonlar) icin AGDAN-ONCE (network-first),
   cevrimdisi olunca cache'e dus. Firebase istekleri (canli veri, auth, token)
   HIC dokunulmadan dogrudan aga gider -> canli veri asla eskimeZ. */
var CACHE = 'erdem-shell-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL).catch(function () {});
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (k) { return k !== CACHE; })
                          .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  // Sadece kendi originimizdeki GET isteklerini yonet.
  // Firebase / Google Fonts / diger her sey dogrudan aga gider.
  if (url.origin !== self.location.origin) { return; }

  e.respondWith((async function () {
    try {
      var fresh = await fetch(req);
      var cache = await caches.open(CACHE);
      cache.put(req, fresh.clone()).catch(function () {});
      return fresh;
    } catch (err) {
      var cached = await caches.match(req);
      if (cached) { return cached; }
      if (req.mode === 'navigate') {
        var idx = await caches.match('./index.html');
        if (idx) { return idx; }
      }
      throw err;
    }
  })());
});

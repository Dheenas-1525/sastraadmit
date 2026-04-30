/* ── SASTRA Service Worker ─────────────────────────────────────
   Bump CACHE_NAME whenever you deploy new code so old caches
   are discarded and users get fresh files on next visit.
   ─────────────────────────────────────────────────────────── */
var CACHE_NAME = 'sastra-v1';

/* Critical assets pre-fetched on first install */
var PRECACHE = [
  '/index.html',
  '/pages/schools.html',
  '/pages/courses.html',
  '/pages/main.html',
  '/assets/css/main.css',
  '/assets/css/chat.css',
  '/assets/css/courses.css',
  '/assets/css/index.css',
  '/assets/js/main.js',
  '/assets/js/chat.js',
  '/assets/js/videos.js',
  '/assets/js/index.js'
];

/* ── Install: cache the skeleton ──────────────────────────── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

/* ── Activate: delete stale caches ───────────────────────── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* ── Fetch: smart caching per asset type ─────────────────── */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);

  /* 1. Skip non-GET and cross-origin (Google Fonts, CDNs) */
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  /* 2. Skip videos — too large; range-request streaming must
        go directly to the server/CDN, not through SW cache    */
  if (url.pathname.indexOf('/assets/videos/') === 0) return;

  /* 3. HTML pages — network-first so new deployments show up
        immediately; fall back to cache when offline            */
  if (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () { return caches.match(req); })
    );
    return;
  }

  /* 4. CSS / JS — stale-while-revalidate
        Serve from cache instantly; refresh cache in background */
  if (/\.(css|js)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(req).then(function (cached) {
          var networkFetch = fetch(req).then(function (res) {
            cache.put(req, res.clone());
            return res;
          });
          return cached || networkFetch;
        });
      })
    );
    return;
  }

  /* 5. Images — cache-first (images don't change often) */
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

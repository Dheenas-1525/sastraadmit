/* ── SASTRA Service Worker ─────────────────────────────────────
   Bump CACHE_NAME on every deployment so stale caches are
   discarded and users always get fresh files.
   ─────────────────────────────────────────────────────────── */
const CACHE_NAME = 'sastra-v1';

const PRECACHE = [
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

/* ── Install ──────────────────────────────────────────────── */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: remove old caches ─────────────────────────── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Video range-request handler ─────────────────────────────
   Problem: browsers stream video using HTTP Range requests
   (e.g. "bytes=0-1048576"). A plain SW cache stores a full
   200 response and cannot answer a 206 Partial Content request,
   so seeking and playback break.

   Solution:
   1. First request  → fetch the FULL video (no Range header),
                        cache it as a complete ArrayBuffer.
   2. Every request  → slice the exact byte range from the
                        cached buffer and return a proper 206.
   ─────────────────────────────────────────────────────────── */
function makeRangeResponse(buf, contentType, rangeHeader) {
  const total = buf.byteLength;
  let start = 0;
  let end   = total - 1;

  if (rangeHeader) {
    const [s, e] = rangeHeader.replace('bytes=', '').split('-');
    start = parseInt(s, 10);
    end   = e ? parseInt(e, 10) : total - 1;
  }

  return new Response(buf.slice(start, end + 1), {
    status: rangeHeader ? 206 : 200,
    headers: {
      'Content-Type':   contentType || 'video/mp4',
      'Content-Length': String(end - start + 1),
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Accept-Ranges':  'bytes'
    }
  });
}

async function serveVideo(req) {
  const rangeHeader = req.headers.get('range');
  const cacheKey    = new Request(req.url);
  const cache       = await caches.open(CACHE_NAME);
  const cached      = await cache.match(cacheKey);

  /* Already cached — slice and serve instantly */
  if (cached) {
    const buf = await cached.arrayBuffer();
    return makeRangeResponse(buf, cached.headers.get('Content-Type'), rangeHeader);
  }

  /* Not cached — fetch the full file (no Range header so we get a
     complete 200, not a partial 206 that can't be stored cleanly) */
  const res = await fetch(new Request(req.url, { headers: {} }));
  if (!res.ok) return res;

  const contentType = res.headers.get('Content-Type') || 'video/mp4';
  const buf         = await res.arrayBuffer();

  /* Store the full file for all future visits */
  cache.put(cacheKey, new Response(buf.slice(0), {
    status:  200,
    headers: {
      'Content-Type':   contentType,
      'Content-Length': String(buf.byteLength),
      'Accept-Ranges':  'bytes'
    }
  }));

  /* Return the requested range to the browser right now */
  return makeRangeResponse(buf, contentType, rangeHeader);
}

/* ── Main fetch handler ───────────────────────────────────── */
self.addEventListener('fetch', (e) => {
  const { request: req } = e;
  const url = new URL(req.url);

  /* Skip non-GET and cross-origin (Google Fonts, CDNs) */
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  /* Videos — range-request aware cache */
  if (url.pathname.startsWith('/assets/videos/')) {
    e.respondWith(serveVideo(req));
    return;
  }

  /* HTML — network-first so deployments show up immediately */
  if (req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  /* CSS / JS — stale-while-revalidate (instant serve, background refresh) */
  if (/\.(css|js)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached      = await cache.match(req);
        const networkFetch = fetch(req).then((res) => {
          cache.put(req, res.clone());
          return res;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  /* Images — cache-first */
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
        return res;
      });
    })
  );
});

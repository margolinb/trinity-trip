const CACHE = 'trinity-trip-v1';

// Everything to cache on install
const PRECACHE = [
  './',
  './index.html'
];

// Install — cache the page itself
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, fall back to network
// For external resources (photos, GA) try network, fail silently
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Our own pages: cache first
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  } else {
    // External (photos, analytics): network only, fail silently offline
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 408 }))
    );
  }
});

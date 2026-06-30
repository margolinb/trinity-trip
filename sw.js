const CACHE = 'trinity-trip-v6';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Network first — always try to get fresh content
    // cache:'reload' bypasses the HTTP cache so GitHub Pages' max-age=600
    // header can't serve a stale copy from disk before the SW even runs
    // Fall back to cache only when offline
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // External resources — network only, fail silently
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 408 }))
    );
  }
});

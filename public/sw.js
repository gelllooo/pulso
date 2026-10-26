// Service Worker for PULSO Offline-First Operation
const CACHE_NAME = 'pulso-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const indexResponse = await fetch('/index.html', { cache: 'no-store' });
      if (!indexResponse.ok) {
        throw new Error(`Unable to precache app shell: HTTP ${indexResponse.status}`);
      }

      const html = await indexResponse.text();
      const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)]
        .map((match) => new URL(match[1], self.location.origin))
        .filter((url) => url.origin === self.location.origin)
        .map((url) => url.pathname + url.search);

      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([...new Set([...PRECACHE_ASSETS, ...assetPaths])]);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith('pulso-') && key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith('/api/')
  ) return;
  event.respondWith(
    fetch(event.request)
      .then(async (networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
          } catch (error) {
            console.error('Failed to update PULSO cache', error);
          }
        }
        return networkResponse;
      })
      .catch(async (networkError) => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw networkError;
      })
  );
});

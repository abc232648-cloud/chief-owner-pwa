// CHIEF Owner Mobile - Conservative scoped PWA Service Worker
const CACHE_PREFIX = 'chief-owner-static-';
const CACHE_VERSION = `${CACHE_PREFIX}v2`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const shell = suffix => `${SCOPE_PATH}${suffix}`;
const STATIC_ASSETS = [
  shell('/'),
  shell('/index.html'),
  shell('/manifest.webmanifest'),
  shell('/icon.svg'),
  shell('/pwa-192x192.png'),
  shell('/pwa-512x512.png'),
  shell('/pwa-512x512-maskable.png'),
  shell('/apple-touch-icon.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_VERSION
        ? caches.delete(cacheName) : Promise.resolve(false))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API and mutations are always network-only and never become synthetic successes.
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Even if registration is accidentally broadened later, this worker refuses
  // to intercept Owner-external paths such as /staff/.
  if (url.origin !== self.location.origin
      || !(url.pathname === SCOPE_PATH || url.pathname.startsWith(`${SCOPE_PATH}/`))) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          void caches.open(CACHE_VERSION).then(cache => cache.put(shell('/index.html'), responseClone));
        }
        return networkResponse;
      }).catch(async () => {
        const cachedShell = await caches.match(shell('/index.html'));
        if (cachedShell) return cachedShell;
        return new Response('CHIEF Operational Command - Offline Shell Unavailable', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            void caches.open(CACHE_VERSION).then(cache => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') return networkResponse;
        const responseToCache = networkResponse.clone();
        void caches.open(CACHE_VERSION).then(cache => cache.put(request, responseToCache));
        return networkResponse;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

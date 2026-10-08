// CHIEF Job Agent PWA - Conservative Service Worker
// Version: chief-job-static-v1

const CACHE_VERSION = 'chief-job-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-512x512-maskable.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if ((cacheName.startsWith('chief-static-') || cacheName.startsWith('chief-job-static-')) && cacheName !== CACHE_VERSION) {
          return caches.delete(cacheName);
        }
        return Promise.resolve(false);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = {}; }

  const severity = payload.severity === 'URGENT' ? 'URGENT' : payload.severity === 'ACTION_REQUIRED' ? 'ACTION_REQUIRED' : 'INFO';
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.slice(0, 160) : 'Job Agent';
  const body = typeof payload.body === 'string' ? payload.body.slice(0, 500) : 'New Job Agent activity.';

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: severity === 'URGENT' ? 'job-agent-urgent' : 'job-agent-action',
    renotify: severity === 'URGENT',
    requireInteraction: severity === 'URGENT',
    data: { url: '/#/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL('/#/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        try {
          const current = new URL(client.url);
          if (current.origin === self.location.origin) {
            if ('focus' in client) return client.focus();
          }
        } catch { /* ignore malformed client URL */ }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API remains network-only. Never cache authenticated Job Agent state or mutations.
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) return cachedShell;
          return new Response('CHIEF Job Agent - Offline shell unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') return networkResponse;
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// CHIEF Mobile - Conservative PWA Service Worker
// Version: chief-static-v1

const CACHE_VERSION = 'chief-static-v1';
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

// Installation: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Promptly take over without forcing immediate client reload
      return self.skipWaiting();
    })
  );
});

// Activation: Clean up old Chief static caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Only clean obsolete Chief static caches; do NOT delete unrelated origin caches
          if (cacheName.startsWith('chief-static-') && cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
          return Promise.resolve(false);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch interception: Strict safety rules
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // IMMUTABLE RULE: NEVER intercept or cache API requests
  // Network-only for all /api/ endpoints. No synthetic 200 responses, no mutation caching.
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // IMMUTABLE RULE: All mutation methods (POST, PUT, DELETE, PATCH) pass directly to network
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests: Network-first with offline fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, update shell cache in background
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html shell
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) {
            return cachedShell;
          }
          return new Response('CHIEF Operational Command - Offline Shell Unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Same-origin static asset requests: Cache-First with Network Fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated asset in background for subsequent visits (stale-while-revalidate for hashed bundles)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {
            // Network failure during background refresh is benign
          });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Cross-origin resources (e.g. fonts): Network first
  event.respondWith(fetch(request));
});

// Update communication: Handle explicit update requests safely
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

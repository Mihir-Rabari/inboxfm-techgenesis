const CACHE_NAME = 'inbox-fm-v6';
const STATIC_ASSETS = [
  '/',
  '/login/',
  '/signup/',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Exclude prefetch/preload requests to prevent Chrome preloader / omnibox autocomplete crashes (ERR_FAILED)
  const secPurpose = event.request.headers.get('sec-purpose');
  const purpose = event.request.headers.get('purpose');
  if (secPurpose === 'prefetch' || purpose === 'prefetch') return;

  // Skip cross-origin requests and API requests (always fetch from network)
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin || url.pathname.startsWith('/api/')) return;

  // Skip Next.js RSC (React Server Component) data and prefetch requests to prevent caching JSON/RSC payloads under HTML page URLs
  const acceptHeader = event.request.headers.get('accept') || '';
  const isRsc = event.request.headers.has('rsc') || 
                event.request.headers.has('RSC') || 
                event.request.headers.has('next-router-state-tree') || 
                event.request.headers.has('next-router-prefetch') ||
                acceptHeader.includes('text/x-component') ||
                acceptHeader.includes('application/json') ||
                url.searchParams.has('_rsc') ||
                url.pathname.includes('/_next/data/');
  if (isRsc) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Refresh cache in background (stale-while-revalidate)
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('text/x-component') || contentType.includes('application/json')) {
              return; // Do not cache RSC or JSON payloads
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/x-component') || contentType.includes('application/json')) {
          return response; // Do not cache RSC or JSON payloads
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch((err) => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html') || new Response('Offline fallback', { status: 503, headers: { 'Content-Type': 'text/html' } });
        }
        // Always return a valid response (or fall back to cached copy if exists) to prevent ERR_FAILED browser crashes
        return caches.match(event.request) || new Response('Asset network error', { status: 408 });
      });
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  try {
    const data = event.data?.json() ?? {};
    const title = data.title || 'Inbox FM Notification';
    const options = {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if app is already open
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === urlToOpen) {
          return windowClients[i].focus();
        }
      }
      // If not open, open new window
      return clients.openWindow(urlToOpen);
    })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  // Log notification dismissals for analytics
  if (event.notification.data?.trackingId) {
    fetch('/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingId: event.notification.data.trackingId,
        action: 'dismiss',
      }),
    }).catch(() => {});
  }
});

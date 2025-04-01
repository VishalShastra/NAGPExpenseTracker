// Service Worker for PWA and offline support
const CACHE_NAME = 'expense-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/expenses.js',
  '/js/reports.js',
  '/js/notifications.js',
  '/js/firebase-config.js',
  '/images/logo.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/manifest.json',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js',
  'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event handler for network requests
self.addEventListener('fetch', (event) => {
  // Ignore Firebase requests (let Firebase SDK handle offline persistence)
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('www.googleapis.com') ||
      event.request.url.includes('fcmregistrations')) {
    return;
  }
  
  // Stale-while-revalidate strategy for other requests
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Update cache with new response
            if (networkResponse.ok && event.request.method === 'GET') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            console.log('Fetch failed, returning cached response or fallback', error);
          });
        
        // Return cached response or wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Push notification event handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();
    const options = {
      body: payload.notification.body,
      icon: '/images/icon-192x192.png',
      badge: '/images/badge-72x72.png',
      data: payload.data
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.notification.title, options)
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
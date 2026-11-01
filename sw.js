// ADHD Budget Planner - Service Worker (Offline PWA Engine v3.2.0)
const CACHE_NAME = 'adhd-budget-planner-v3.2.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/harmony-theme.css',
  './css/harmony-layout.css',
  './css/leo-tour.css',
  './js/core-calculator.js',
  './js/state-manager.js',
  './js/leo-help.js',
  './js/leo-tour.js',
  './js/zen-controller.js',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './assets/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});

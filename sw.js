/* NAGIMU Service Worker — offline-first precache */

const CACHE_NAME = 'nagimu-v17';
const PRECACHE = [
  '/',
  '/index.html',
  '/game.html',
  '/css/base.css',
  '/css/credit.css',
  '/css/onboarding.css',
  '/css/game.css',
  '/js/db.js',
  '/js/vendor/idb-keyval.js',
  '/js/zodiac.js',
  '/js/audio.js',
  '/js/audio-ui.js',
  '/js/particles.js',
  '/js/orb.js',
  '/js/game.js',
  '/js/pull-refresh.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

async function precacheAll(cache) {
  await Promise.all(
    PRECACHE.map(async (url) => {
      try {
        await cache.add(url);
      } catch (err) {
        console.warn('[sw] precache failed:', url, err);
      }
    })
  );
}

async function navigationFallback(request) {
  if (request.mode !== 'navigate') return null;
  return (await caches.match('/index.html')) || (await caches.match('/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => precacheAll(cache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response?.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => navigationFallback(event.request));
    })
  );
});
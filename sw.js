/* NAGIMU Service Worker — precache app shell */

const CACHE_NAME = 'nagimu-v16';
const PRECACHE = [
  '/',
  '/index.html',
  '/game.html',
  '/css/base.css',
  '/css/credit.css',
  '/css/onboarding.css',
  '/css/game.css',
  '/js/db.js',
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
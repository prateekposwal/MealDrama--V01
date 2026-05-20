// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Service Worker — Offline-first asset caching
// ─────────────────────────────────────────────────────────────────────────────

// Cache version — bump this on every release to bust old caches
const CACHE_VERSION = 'v2';
const CACHE_NAME = `mealdrama-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // Don't skipWaiting immediately — wait for all tabs to close
  // This prevents JS bundle / SW cache mismatch
});

// Activate — clear old caches (scoped to mealdrama-* prefix)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys
        .filter((k) => k.startsWith('mealdrama-'))
        .filter((k) => k !== CACHE_NAME)
        .map((k) => caches.delete(k))
      )
    )
  );
  // Claim clients only after old caches are cleared
  self.clients.claim();
});

// Notify clients when a new SW is ready
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch — network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests — network-only, NEVER cache (prevents cross-user data leaks)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Static assets — cache-first
  if (request.destination === 'image' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // HTML — network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  );
});

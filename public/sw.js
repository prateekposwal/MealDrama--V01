// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Service Worker — Offline-first asset caching
// ─────────────────────────────────────────────────────────────────────────────

// Cache version — bump this on every release to bust old caches.
// v3 (2026-09-12): v2 could cache/serve text/html responses for .js URLs
// ('text/html' is not a valid JavaScript MIME type → broken SPA on nav).
// The v3 fetch handler below NEVER answers a non-document request with
// index.html, and the version bump PURGES any poisoned v2 entries on activate.
// v4 (2026-09-14): routine release bump — any still-open browser holding v3
// bundles from the earlier 2026-09-14 deploys purges them on next load, so the
// "UI distorted / stale cache" user state self-heals on ONE reload (no purge).
const CACHE_VERSION = 'v4';
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
  // M5: Skip waiting immediately — new SW activates right away
  // This ensures users get the latest assets without closing all tabs
  self.skipWaiting();
});

// Activate — clear old caches (scoped to mealdrama-* prefix)
// v2 → v3: the old cache (possibly containing text/html responses stored under
// .js URLs from earlier deploy/failure windows) is deleted wholesale here.
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

// Fetch — network-first for API, cache-first for static assets.
// HARD RULE (incident class, see server/src/lib/spaFallback.ts): a response
// with Content-Type text/html may ONLY ever be delivered to a document
// (navigation) request. Delivering index.html for a .js request makes the
// browser refuse the module: "'text/html' is not a valid JavaScript MIME
// type". Every non-document branch below is written so that can never happen.
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

  // Documents (navigation) — network-first with cache fallback. This is the
  // ONLY branch that may ever deliver index.html.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const ct = (response.headers.get('content-type') || '').toLowerCase();
          // Cache only genuine HTML documents (never a 404/error body under a
          // navigation URL).
          if (response.ok && ct.includes('text/html')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Scripts/modules (entry bundle, modulepreloads, lazy route chunks) —
  // network-first. Cache ONLY genuine javascript responses, and NEVER fall
  // back to index.html on failure: a cached script is returned only when its
  // own content-type is javascript; otherwise the request fails cleanly
  // (504) instead of poisoning the module graph with text/html.
  if (request.destination === 'script') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const ct = (response.headers.get('content-type') || '').toLowerCase();
          if (response.ok && ct.includes('javascript')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            const ct = (cached?.headers.get('content-type') || '').toLowerCase();
            if (cached && ct.includes('javascript')) return cached;
            return new Response(
              '// MealDrama SW: script unavailable offline',
              { status: 504, headers: { 'Content-Type': 'text/javascript; charset=utf-8' } }
            );
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

  // Everything else (manifest, workers, media, ...) — plain passthrough.
  // NEVER answer a non-document request with index.html.
  event.respondWith(fetch(request));
});

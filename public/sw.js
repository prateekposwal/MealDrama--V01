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
// v7 (2026-09-14): PRECACHES the full chunk graph from dist/sw-assets.json at
// install — lazy route chunks (PlanScreen/TrayScreen) were network-first only,
// so an offline tab-switch to a never-visited route re-fetched its chunk and
// crashed into the error boundary. Offline navigation now works for every
// chunk that shipped in the build.
const CACHE_VERSION = 'v7';
const CACHE_NAME = `mealdrama-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
];

// Install — cache static assets + every built JS chunk.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll is all-or-nothing: a stale sw-assets.json entry would fail the
      // whole install. allSettled keeps the SW healthy when an asset is gone.
      Promise.all(
        [
          cache.addAll(STATIC_ASSETS),
          fetch('/sw-assets.json')
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => {
              const urls = Array.isArray(list) ? list.filter((p) => typeof p === 'string') : [];
              return Promise.allSettled(
                urls.map((p) => cache.add(new Request(p, { cache: 'reload' })))
              );
            })
            .catch(() => []),
        ]
      )
    )
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

  // CROSS-ORIGIN REQUESTS — never intercept. In a Capacitor WebView install
  // the app origin is http://localhost while the API base is the deployed
  // https://…/onrender.com origin; a service-worker fetch() of such a request
  // is CORS-gated and rejects (or mishandles the preflight) even when the
  // server would answer the browser's own cross-origin call — that turned
  // every API call into a 503 {"error":"offline"}. When we return WITHOUT
  // respondWith, the browser issues a normal CORS fetch the server answers
  // directly. Same-origin (the deployed PWA) never reaches this branch.
  if (url.origin !== self.location.origin) {
    return;
  }

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
  // CACHE-FIRST with network fallback. Precache (dist/sw-assets.json at
  // install) guarantees every shipped chunk is present, so lazy-route loads
  // work offline. Network-first here was the "offline tab switch crashes into
  // the error boundary" incident (August 2026): the stub-504 fallback still
  // killed the module graph. Serving the cached copy is safe because every
  // release bumps CACHE_VERSION (activate purges the previous mealdrama-*),
  // so serves keep pace with deploys.
  if (request.destination === 'script') {
    event.respondWith(
      // Match by URL (string request), ignoreVary: the importing module's
      // request carries Referer/Origin/Sec-Fetch-* headers that can make
      // caches.match(request) MISS a freshly-precached entry (Vary echo), even
      // though the identical URL is cached. URL-string matching hits.
      caches.match(request.url, { ignoreVary: true }).then((cached) => {
        const ct = (cached?.headers.get('content-type') || '').toLowerCase();
        if (cached && ct.includes('javascript')) return cached;
        return fetch(request).then((response) => {
          const rct = (response.headers.get('content-type') || '').toLowerCase();
          if (response.ok && rct.includes('javascript')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
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

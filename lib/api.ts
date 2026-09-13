// Bundler-safe token access — api.ts must NEVER `require()`/import the store.
// dcb9d9b tried a lazy `require('../app/store/useStore')` to break the circular
// api ↔ useStore init, but Vite leaves `require` untransformed in the browser
// bundle (`<script type="module">`): getToken() threw ReferenceError, its
// catch returned null, and EVERY authed request silently lost its
// Authorization header ("Authentication pending"/401 on household create).
// Instead the store REGISTERS a live token getter here during its own module
// init (useStore already imports api.ts, so there is no cycle, and the
// bundle never references `require`).
let _tokenGetter: (() => string | null) | null = null;

export function setTokenGetter(getter: (() => string | null) | null): void {
  _tokenGetter = getter;
}

// ─── Pluggable LAN-IP resolver ────────────────────────────────────────────
// Override at runtime (e.g. app startup) to auto-detect the current LAN IP so
// the default base URL stays fresh.  In tests, inject a mock to control the
// output of `defaultApiBase()` without touching localStorage.
let _lanIpResolver: (() => string) | null = null;

export function setLanIpResolver(resolver: (() => string) | null): void {
  _lanIpResolver = resolver;
}

export function getLanIpResolver(): (() => string) | null {
  return _lanIpResolver;
}

// The MealDrama backend.  Hardcoded fallback points at the dev machine's LAN
// IP at time of build.  If a pluggable resolver is set, it is used instead
// (supports runtime IP auto-detection).  Override via localStorage 'md:api_base'
// (e.g. in devtools) when the machine's IP changes.
export const API_BASE_KEY = 'md:api_base';
// One-shot migration stamp. Bump API_BASE_VERSION when the baked default changes
// so already-installed apps re-run the stale-base migration on their next launch.
export const API_BASE_VER_KEY = 'md:api_base_ver';
export const API_BASE_VERSION = 2; // v2: also migrate a stored *.onrender.com base when the app is served from a NON-Render origin

export function defaultApiBase(): string {
  // Build-time override — `VITE_API_URL=https://x.trycloudflare.com/api/v1 npm run build`
  // bakes a public URL into the bundle (used for APK builds; empty/absent in dev).
  const envBase = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (envBase && /^https?:\/\//.test(envBase)) return envBase.replace(/\/+$/, '');
  if (_lanIpResolver) {
    try { return `http://${_lanIpResolver()}:3001/api/v1`; } catch { /* fall through */ }
  }
  // SAME-ORIGIN default — the Express server mounts /api/v1 on the SAME port
  // that serves this SPA (repo-root dist/ via server/src/index.ts). A relative
  // base keeps localhost AND LAN/self-hosted installs pointing at THEIR OWN
  // server — never at a remote one. Deployed builds (Render/Vercel) and APKs
  // bake an absolute VITE_API_URL, which overrides this. (The old
  // 'http://localhost:3001/api/v1' literal broke LAN access: a phone hitting
  // the machine's IP resolved 'localhost' to ITSELF.)
  return '/api/v1';
}

export function getApiBase(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(API_BASE_KEY);
      if (stored) return stored;
      window.localStorage.setItem(API_BASE_KEY, defaultApiBase());
    }
  } catch {
    /* storage unavailable */
  }
  return defaultApiBase();
}

// Mutable — updated by the self-heal path so subsequent requests use the new base.
let _currentBaseUrl = getApiBase();

/** Scheme://host:port of a base URL. The server mounts /health at the ORIGIN. */
export function originOf(base: string): string {
  if (base.startsWith('/')) return ''; // same-origin relative base (the default)
  try { return new URL(base).origin; } catch { return base; }
}

/**
 * Probe the server's REAL health endpoint (origin-level `/health`).
 * The API base ends in `/api/v1` but the server only mounts `/health` at the
 * root — probing `${base}/health` returns 404 (ok=false) and silently defeats
 * the self-heal, which is exactly what shipped in the first fallback attempt.
 */
export async function probeApiHealth(base: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const res = await fetch(`${originOf(base)}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** True when the host looks like a stale dev/tunnel base (private IP, localhost, trycloudflare slug). */
export function isPoisonedApiBase(base: string): boolean {
  let host: string;
  try { host = new URL(base).hostname.toLowerCase(); } catch { return false; }
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (/^(10\.|192\.168\.)/.test(host)) return true;
  const m = /^172\.(\d{1,3})\./.exec(host);
  if (m) { const n = Number(m[1]); if (n >= 16 && n <= 31) return true; }
  return host.endsWith('.trycloudflare.com');
}

/**
 * ONE-SHOT migration (stamped with API_BASE_VERSION): on the first launch of a
 * build whose stamp is absent/older, a stored base that looks like a dead
 * private/tunnel host AND differs from the baked default is replaced with the
 * baked default — but only AFTER probing it, so a working custom value is never
 * clobbered. If the baked default is unreachable at launch, the stored value is
 * kept (and the unconditional request-level heal below still swaps to the baked
 * default the moment any request fails). Returns true when the base migrated.
 */
export async function runApiBaseMigration(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  let migrated = false;
  try {
    const verRaw = window.localStorage.getItem(API_BASE_VER_KEY);
    const ver = verRaw ? Number(verRaw) : 0;
    if (Number.isFinite(ver) && ver >= API_BASE_VERSION) return false;
    const stored = window.localStorage.getItem(API_BASE_KEY);
    const baked = defaultApiBase();
    // v2 rule: a stored *.onrender.com base is a legitimate target on the
    // DEPLOYED app (same host), but a poison on any OTHER origin — the exact
    // 'localhost:3001 fires at mealdrama.onrender.com' trap (a local build
    // baked with VITE_API_URL pointed the local SPA at Render). Served from
    // anywhere but Render, a render-hosted stored base is migrated the same
    // way a stale private/tunnel base is.
    const appHost = ((globalThis.window as Window | undefined)?.location?.hostname ?? '').toLowerCase();
    let storedHost = '';
    try { storedHost = new URL(stored ?? '').hostname.toLowerCase(); } catch { /* not a URL */ }
    const renderHostedFromElsewhere = storedHost.endsWith('.onrender.com') && !appHost.endsWith('.onrender.com');
    if (stored && baked && stored !== baked && !sameApiTarget(stored, baked) && (isPoisonedApiBase(stored) || renderHostedFromElsewhere)) {
      const reachable = await probeApiHealth(baked, 4000);
      if (reachable) {
        window.localStorage.setItem(API_BASE_KEY, baked);
        if (_currentBaseUrl === stored) _currentBaseUrl = baked;
        migrated = true;
      }
    }
    window.localStorage.setItem(API_BASE_VER_KEY, String(API_BASE_VERSION));
  } catch {
    /* storage unavailable — request-level heal still covers */
  }
  return migrated;
}

// ─── Stale-base fallback (pure function — testable without localStorage/network mocks) ──
/** Normalize an API base for target-comparison: a localhost-absolute base IS
 *  the same target as the same-origin default ('/api/v1'). */
export function normalizeApiBase(base: string): string {
  if (base.startsWith('/')) return base;
  try {
    const u = new URL(base);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1') return u.pathname;
  } catch { /* not a URL — return as-is */ }
  return base;
}

/** True when two API bases address the SAME server. */
export function sameApiTarget(a: string, b: string): boolean {
  return normalizeApiBase(a) === normalizeApiBase(b);
}

// Returns a fresh base URL to try when the current base differs from the baked
// default; null when nothing differs (current base IS the default). NOTE:
// request() now heals UNCONDITIONALLY (it probes even when this returns null)
// — this helper remains exported for tests/telemetry.
export function resolveFallbackBaseUrl(currentBase: string): string | null {
  const freshDefault = defaultApiBase();
  if (sameApiTarget(currentBase, freshDefault)) return null; // same target — nothing different to try
  return freshDefault;
}
// ───────────────────────────────────────────────────────────────────────────

// ─── Auth readiness guard ─────────────────────────────────────────────────
let _authReady = false;

export function setAuthReady(ready: boolean): void {
  _authReady = ready;
}

export function isAuthReady(): boolean {
  return _authReady;
}
// ───────────────────────────────────────────────────────────────────────────

// ─── 401 Handling ─────────────────────────────────────────────────────────
let _sessionExpiredFired = false;

/** Signal a session-expiry ONCE; App revalidates and decides the logout. */
export function resetSessionExpirySignal(): void {
  _sessionExpiredFired = false;
}

/** Reset BOTH session-expiry flags after a successful token refresh — the
 *  recovered JWT must carry the NEW Bearer (getToken() reads the live
 *  getter) and a LATER genuine 401 must be able to re-signal App
 *  revalidation (the old _sessionExpiredFired latch would swallow it). */
export function resetApiAuthFlags(): void {
  tokenCleared = false;
  _sessionExpiredFired = false;
}

function signalSessionExpired(): void {
  if (_sessionExpiredFired) return;
  _sessionExpiredFired = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}
// ───────────────────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number;
  signal?: AbortSignal;
}

function getToken(): string | null {
  return _tokenGetter ? _tokenGetter() : null;
}

/** Public token accessor for raw-fetch paths (tts, analytics flush) that
 *  must send the same Authorization header the api object attaches. */
export function getApiToken(): string | null {
  return getToken();
}

let tokenCleared = false;

function isAuthFailure(err: Error): boolean {
  return err.message === 'Auth not ready' || err.message.includes('401') || err.message.includes('Unauthorized');
}

// ─── Retry policy ─────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 4000;

class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
  }
}

function isServerError(err: unknown): err is FetchError {
  return err instanceof FetchError && err.status >= 500 && err.status < 600;
}

function isNetworkError(err: unknown): boolean {
  return err instanceof Error && !(err instanceof FetchError) && (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('network'));
}

/** True when the server is unreachable OR erroring (network, 5xx, gateway).
 *  NOT a confirmed auth rejection — callers must never treat a 503 as a
 *  logged-out session (Λ-honest: backend down ≠ session expired). */
export function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof FetchError) {
    return err.status === 0 || (err.status >= 500 && err.status < 600) || err.status === 408 || err.status === 429;
  }
  return isNetworkError(err);
}

/** True when the server CONFIRMED the session is rejected (401/403). */
export function isConfirmedAuthRejection(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 401 || status === 403) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes('401') || msg.includes('unauthorized') || msg.includes('auth not ready');
}

function exponentialBackoff(attempt: number): number {
  const delay = Math.min(RETRY_BASE_MS * Math.pow(2, attempt), RETRY_MAX_MS);
  const jitter = Math.random() * delay * 0.3;
  return Math.floor(delay + jitter);
}
// ───────────────────────────────────────────────────────────────────────────
const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getAdaptiveTimeout(): number {
  if (typeof navigator === 'undefined') return 15000;
  const conn = (navigator as unknown as Record<string, unknown>).connection as Record<string, unknown> | undefined;
  if (!conn) return 15000;
  const effectiveType = conn.effectiveType as string | undefined;
  switch (effectiveType) {
    case 'slow-2g': return 30000;
    case '2g': return 25000;
    case '3g': return 20000;
    default: return 15000;
  }
}

function buildActionableNetworkError(err: Error, attemptedBase: string, freshDefault: string | null): FetchError {
  const suffix =
    freshDefault && freshDefault !== attemptedBase
      ? ` Also tried the default ${freshDefault}.`
      : '';
  return new FetchError(
    `Cannot reach the MealDrama server (${err.message}). Check that the server is running and that this device can reach: ${attemptedBase}.${suffix}`,
    0,
  );
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = getAdaptiveTimeout(), signal: externalSignal, ...fetchOptions } = options;
  const token = getToken();

  if (!_authReady) {
    throw new Error('Auth not ready');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const idempotencyKey = IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase())
    ? generateIdempotencyKey()
    : undefined;

  let retryCount = 0;

  const doFetch = async (baseUrl: string, signal: AbortSignal): Promise<T> => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...fetchOptions.headers,
      },
      signal,
    });

    if (res.status === 401) {
      // GRACEFUL expiry: a 401 on a routine save/sync must NOT abort the
      // whole request pool or clear the session mid-flow — that made closing
      // a meal card bounce to login whenever a debounced save 401'd. Signal
      // once; App revalidates with getMe() and only logs out when the expiry
      // is CONFIRMED (true stale/revoked session).
      tokenCleared = true;
      signalSessionExpired();
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new FetchError((body as { error?: string }).error ?? `Request failed: ${res.status}`, res.status);
    }

    const body = await res.json() as Record<string, unknown>;
    // Auto-unwrap { success, data } envelope from the server
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data as T;
    }
    return body as T;
  };

  try {
    return await doFetch(_currentBaseUrl, controller.signal);
  } catch (err) {
    if (tokenCleared) {
      throw err;
    }
    if (!(err instanceof Error) || isAuthFailure(err)) {
      throw err;
    }

    // ── Wrap raw network errors into FetchError with actionable message ──
    if (isNetworkError(err)) {
      const attemptedBase = _currentBaseUrl;
      const freshDefault = defaultApiBase();

      // ── UNCONDITIONAL self-heal (runs on ANY network failure) ──
      // Probe the baked default's REAL /health endpoint (origin-level). If it
      // responds, persist it as md:api_base, swap the live base, and retry the
      // failed request ONCE. Not gated on stored !== default: a stale stored
      // value must never permanently shadow a working default, and even a
      // stored === default base may have briefly been down and come back.
      if (freshDefault && (await probeApiHealth(freshDefault))) {
        _currentBaseUrl = freshDefault;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(API_BASE_KEY, freshDefault);
          }
        } catch { /* storage unavailable */ }
        // Retry with a FRESH controller — the original may be aborted/timed out.
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
        try {
          try {
            return await doFetch(_currentBaseUrl, retryController.signal);
          } catch (retryErr) {
            if (retryErr instanceof Error && isNetworkError(retryErr)) {
              throw buildActionableNetworkError(retryErr, _currentBaseUrl, defaultApiBase());
            }
            throw retryErr;
          }
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }

      // Both the attempted base and the baked default are unreachable — throw
      // an actionable error naming BOTH (never a stale literal).
      throw buildActionableNetworkError(err, attemptedBase, freshDefault);
    }

    // Retry on 5xx (all methods) or network errors (non-idempotent methods only).
    // CORRECTED 2026-09-13: the old `return doFetch(...)` inside the
    // catch let a SECOND 5xx rejection propagate straight out — the loop only
    // ever retried ONCE no matter what MAX_RETRIES said. Now the bounded
    // backoff loop actually runs (1 + MAX_RETRIES attempts) and a PERSISTENT
    // 5xx ends with ONE stale-base heal + ONE retry — a 503 can never wedge
    // the app onto a dead remote base (and can never grow into an unbounded
    // re-arm storm: every path terminates with the REAL error).
    let lastErr: unknown = err;
    const willRetry = () =>
      isServerError(lastErr) ||
      (isNetworkError(lastErr) && !IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase()));
    while (retryCount < MAX_RETRIES && willRetry()) {
      retryCount++;
      const delay = exponentialBackoff(retryCount);
      await new Promise(r => setTimeout(r, delay));
      try {
        return await doFetch(_currentBaseUrl, controller.signal);
      } catch (retryErr) {
        lastErr = retryErr;
        // tokenCleared latch: a 401 observed in a retry is terminal (the
        // session expired mid-flight) — let it propagate as-is.
        if (tokenCleared) throw lastErr;
      }
    }
    // PERSISTENT 5xx — the server answered but keeps erroring. The current
    // base may be STALE (e.g. a stored remote base while the same-origin
    // local server is up): probe the baked default and heal ONCE, exactly
    // like the network-error path. A 503 must never wedge the app onto a
    // dead remote base (bounded: ONE probe + ONE retry, then the real error).
    if (isServerError(lastErr)) {
      const freshDefault = defaultApiBase();
      if (freshDefault && (await probeApiHealth(freshDefault))) {
        _currentBaseUrl = freshDefault;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(API_BASE_KEY, freshDefault);
          }
        } catch { /* storage unavailable */ }
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
        try {
          try {
            return await doFetch(_currentBaseUrl, retryController.signal);
          } catch (retryErr) {
            throw retryErr; // the REAL 5xx/network error — never relabeled
          }
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }
    }
    throw lastErr;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
};

export default api;

// Lazy getter — breaks circular module init (api ↔ useStore).
// Top-level `import { useStore }` caused ReferenceError: Cannot access
// '_authReady' before initialization because useStore.ts calls setAuthReady()
// during zustand hydration before api.ts finishes evaluating its `let`.
// Dynamic import() resolves synchronously once modules are registered.
let _useStoreMod: typeof import('../app/store/useStore') | null = null;
function _useStore() {
  if (!_useStoreMod) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _useStoreMod = require('../app/store/useStore') as typeof import('../app/store/useStore');
  }
  return _useStoreMod.useStore;
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
const API_BASE_KEY = 'md:api_base';
function defaultApiBase(): string {
  if (_lanIpResolver) {
    try { return `http://${_lanIpResolver()}:3001/api/v1`; } catch { /* fall through */ }
  }
  return 'http://10.243.22.253:3001/api/v1';
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

// Mutable — updated by the fallback path so subsequent requests use the new base.
let _currentBaseUrl = getApiBase();

// ─── Stale-base fallback (pure function — testable without localStorage/network mocks) ──
// Returns a fresh base URL to try when a network error hits and the stored base
// may be stale.  Returns null when no fallback is warranted (e.g. user set a
// custom base, or the fresh default equals the current base).
export function resolveFallbackBaseUrl(currentBase: string): string | null {
  const freshDefault = defaultApiBase();
  if (currentBase === freshDefault) return null; // same as the current default — nothing to try
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
  try {
    return _useStore().getState().token ?? null;
  } catch {
    return null;
  }
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

  const doFetch = async (baseUrl: string): Promise<T> => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
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
    return await doFetch(_currentBaseUrl);
  } catch (err) {
    if (tokenCleared) {
      throw err;
    }
    if (!(err instanceof Error) || isAuthFailure(err)) {
      throw err;
    }

    // ── Wrap raw network errors into FetchError with actionable message ──
    if (isNetworkError(err)) {
      const fetchErr = new FetchError(
        `Cannot reach the MealDrama server (${err.message}). Check that the server is running and that this device can reach: ${_currentBaseUrl}`,
        0,
      );

      // ── Attempt ONE stale-base fallback before throwing ──
      const fallback = resolveFallbackBaseUrl(_currentBaseUrl);
      if (fallback) {
        try {
          const testRes = await fetch(`${fallback}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          if (testRes.ok) {
            // Fallback succeeded — update the live base and persist
            _currentBaseUrl = fallback;
            try {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(API_BASE_KEY, fallback);
              }
            } catch { /* storage unavailable */ }
            // Retry the original request against the new base
            return doFetch(_currentBaseUrl);
          }
        } catch {
          // Fallback also unreachable — fall through to throw the original actionable error
        }
      }

      throw fetchErr;
    }

    // Retry on 5xx (all methods) or network errors (non-idempotent methods only)
    const shouldRetry = isServerError(err) || (isNetworkError(err) && !IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase()));
    if (!shouldRetry || retryCount >= MAX_RETRIES) {
      throw err;
    }
    retryCount++;
    const delay = exponentialBackoff(retryCount);
    await new Promise(r => setTimeout(r, delay));
    return doFetch(_currentBaseUrl);
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

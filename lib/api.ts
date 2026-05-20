const BASE_URL = import.meta.env.VITE_ENV === 'production' ? import.meta.env.VITE_API_URL : '/api/v1';

const TOKEN_KEY = 'mealdrama-token';

// ─── Auth readiness guard ─────────────────────────────────────────────────
let _authReady = false;

export function setAuthReady(ready: boolean): void {
  _authReady = ready;
}

export function isAuthReady(): boolean {
  return _authReady;
}
// ───────────────────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number;
  signal?: AbortSignal;
}

function getToken(): string | null {
  // M10: Always read from localStorage (primary) — sessionStorage is write-only mirror
  // This prevents stale token returns when one storage is cleared
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage may be unavailable
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function isAuthFailure(err: Error): boolean {
  return err.message === 'Auth not ready' || err.message.includes('401') || err.message.includes('Unauthorized');
}

// ─── Idempotency key set for safe retries ─────────────────────────────────
// Non-GET requests get a unique idempotency header so the server can
// deduplicate accidental duplicate sends (e.g., from retry logic).
const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function generateIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  // M11: 15s default timeout — mobile networks (2G/3G) need more headroom than 10s
  const { timeout = 15000, signal: externalSignal, ...fetchOptions } = options;
  const token = getToken();

  if (!_authReady) {
    throw new Error('Auth not ready');
  }

  // Combine external AbortSignal (for unmount cancellation) with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  // Generate idempotency key for non-GET requests (safe retry)
  const idempotencyKey = IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase())
    ? generateIdempotencyKey()
    : undefined;

  let tokenCleared = false;

  const doFetch = async (): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    if (res.status === 401) {
      clearToken();
      tokenCleared = true;
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
  };

  try {
    return await doFetch();
  } catch (err) {
    // H1: Only retry non-auth, non-mutable-method failures.
    // H2: If token was cleared (401), do NOT retry — the token is gone.
    // GET/HEAD/DELETE are safe to retry (idempotent).
    // POST/PUT/PATCH have idempotency keys so server can deduplicate.
    if (tokenCleared) {
      throw err; // 401 — token cleared, retry would fail again
    }
    if (!(err instanceof Error) || isAuthFailure(err)) {
      throw err;
    }
    const method = (fetchOptions.method ?? 'GET').toUpperCase();
    // Only auto-retry idempotent methods (GET, HEAD, DELETE)
    // POST/PUT/PATCH rely on Idempotency-Key header for server-side dedup
    if (!IDEMPOTENT_METHODS.has(method)) {
      await new Promise(r => setTimeout(r, 500));
      return doFetch();
    }
    throw err;
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

export { getToken, setToken, clearToken };
export default api;

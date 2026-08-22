import { useStore } from '../app/store/useStore';

const BASE_URL = 'http://192.168.29.211:3001/api/v1';

// ─── Auth readiness guard ─────────────────────────────────────────────────
let _authReady = false;

export function setAuthReady(ready: boolean): void {
  _authReady = ready;
}

export function isAuthReady(): boolean {
  return _authReady;
}
// ───────────────────────────────────────────────────────────────────────────

// ─── 401 Abort Controller ─────────────────────────────────────────────────
let _authAbortController: AbortController | null = null;
let tokenCleared = false;

function getAuthAbortController(): AbortController {
  if (!_authAbortController || _authAbortController.signal.aborted) {
    _authAbortController = new AbortController();
  }
  return _authAbortController;
}

function abortAllOn401(): void {
  if (_authAbortController && !_authAbortController.signal.aborted) {
    _authAbortController.abort();
  }
  _authAbortController = null;
}
// ───────────────────────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number;
  signal?: AbortSignal;
}

function getToken(): string | null {
  try {
    return useStore.getState().token ?? null;
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    useStore.getState().setToken(token);
  } catch {
    // store may not be available yet
  }
}

function clearToken(): void {
  try {
    useStore.getState().clearToken();
  } catch {
    // ignore
  }
}

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

  const authController = getAuthAbortController();

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
  const onAuthAbort = () => controller.abort();
  if (!authController.signal.aborted) {
    authController.signal.addEventListener('abort', onAuthAbort, { once: true });
  }

  const idempotencyKey = IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase())
    ? generateIdempotencyKey()
    : undefined;

  let retryCount = 0;

  const doFetch = async (): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
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
      abortAllOn401();
      clearToken();
      tokenCleared = true;
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
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
    return await doFetch();
  } catch (err) {
    if (tokenCleared) {
      throw err;
    }
    if (!(err instanceof Error) || isAuthFailure(err)) {
      throw err;
    }
    // Retry on 5xx (all methods) or network errors (idempotent methods only)
    const shouldRetry = isServerError(err) || (isNetworkError(err) && !IDEMPOTENT_METHODS.has((fetchOptions.method ?? 'GET').toUpperCase()));
    if (!shouldRetry || retryCount >= MAX_RETRIES) {
      throw err;
    }
    retryCount++;
    const delay = exponentialBackoff(retryCount);
    await new Promise(r => setTimeout(r, delay));
    return doFetch();
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

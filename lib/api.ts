import { useStore } from '../store/useStore';

const BASE_URL = import.meta.env.VITE_ENV === 'production' ? import.meta.env.VITE_API_URL : '/api/v1';

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

// ─── Idempotency key for safe retries ───────────────────────────────────
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
      abortAllOn401();
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
    if (tokenCleared) {
      throw err;
    }
    if (!(err instanceof Error) || isAuthFailure(err)) {
      throw err;
    }
    const method = (fetchOptions.method ?? 'GET').toUpperCase();
    if (IDEMPOTENT_METHODS.has(method)) {
      throw err;
    }
    await new Promise(r => setTimeout(r, 500));
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

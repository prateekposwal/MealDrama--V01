const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

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
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
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

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 10000, signal: externalSignal, ...fetchOptions } = options;
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

  const doFetch = async (): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    if (res.status === 401) {
      clearToken();
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
    // Retry once after 500ms for non-auth failures (cookies may not have propagated yet)
    if (!(err instanceof Error) || isAuthFailure(err)) {
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

export { getToken, setToken, clearToken };
export default api;

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Regression: Authorization header must attach when a token exists ───────
// Root cause (diagnosed 2026-09-12): dcb9d9b replaced api.ts's top-level store
// import with a lazy `require('../app/store/useStore')`. Vite leaves `require`
// untransformed in the browser bundle (`<script type="module">`), so getToken()
// threw ReferenceError, its catch returned null, and EVERY authed request
// shipped without an Authorization header — "Authentication pending — please
// try again." / 401 on household create. Fix: the store REGISTERS a live
// getter via setTokenGetter(); api.ts never imports the store nor calls
// `require` (see the pattern comment in lib/api.ts).

const API_SRC = path.join(__dirname, '..', 'lib', 'api.ts');

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api auth header — registered getter (no browser-unsafe require)', () => {
  let originalFetch: typeof globalThis.fetch;
  let lastHeaders: Headers | undefined;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    lastHeaders = undefined;
    globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      lastHeaders = init?.headers ? new Headers(init.headers as HeadersInit) : undefined;
      return jsonResponse({ success: true, data: { ok: true } });
    }) as unknown as typeof fetch;
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
    vi.resetModules();
  });

  it('lib/api.ts source contains NO `require(` (class guard for the 2026-09-02 regression)', () => {
    const src = fs.readFileSync(API_SRC, 'utf8')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)) // strip comment lines
      .join('\n');
    expect(src).not.toMatch(/require\s*\(/);
  });

  it('api.post attaches Bearer token from the registered getter', async () => {
    const { api, setTokenGetter, setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    setTokenGetter(() => 'jwt-token-abc');
    await api.post('/households', { name: 'X' });
    const auth = lastHeaders?.get('Authorization');
    expect(auth).toBe('Bearer jwt-token-abc');
    setTokenGetter(null);
  });

  it('api.post sends NO Authorization header when no getter is registered', async () => {
    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    await api.post('/auth/register', { id: 'u1', name: 'n' });
    expect(lastHeaders?.get('Authorization') ?? undefined).toBeUndefined();
  });

  it('real useStore wires its live token into the api layer (single instance)', async () => {
    // Import the REAL store first (registers the getter at module init), then
    // the api module from the same registry — the header must carry the token
    // that useStore.setState holds.
    const storeMod = await import('../app/store/useStore');
    await import('../lib/api');
    storeMod.useStore.setState({ token: 'store-jwt-xyz' });
    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    await api.post('/households', { name: 'via-store' });
    expect(lastHeaders?.get('Authorization')).toBe('Bearer store-jwt-xyz');
  });
});

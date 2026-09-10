import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveFallbackBaseUrl, setLanIpResolver, getLanIpResolver } from '../lib/api';

// ── resolveFallbackBaseUrl — pure function tests ───────────────────────────
describe('resolveFallbackBaseUrl — stale-base detection', () => {
  const OLD_DEFAULT = 'http://10.243.22.253:3001/api/v1';

  afterEach(() => {
    setLanIpResolver(null);
  });

  it('returns null when the stored base IS the current default (not stale)', () => {
    // No resolver set → defaultApiBase returns the hardcoded value
    expect(resolveFallbackBaseUrl(OLD_DEFAULT)).toBeNull();
  });

  it('returns a fresh base when the stored base differs from the default', () => {
    const staleBase = 'http://192.168.1.100:3001/api/v1';
    const result = resolveFallbackBaseUrl(staleBase);
    expect(result).toBe(OLD_DEFAULT);
    expect(result).not.toBe(staleBase);
  });

  it('returns a resolver-provided default when the stored base is stale', () => {
    setLanIpResolver(() => '10.0.0.5');
    const staleBase = 'http://10.243.22.253:3001/api/v1';
    const result = resolveFallbackBaseUrl(staleBase);
    expect(result).toBe('http://10.0.0.5:3001/api/v1');
    expect(result).not.toBe(staleBase);
  });

  it('returns null when stored base already equals resolver-provided default', () => {
    setLanIpResolver(() => '10.0.0.5');
    const currentBase = 'http://10.0.0.5:3001/api/v1';
    expect(resolveFallbackBaseUrl(currentBase)).toBeNull();
  });

  it('handles resolver throwing gracefully', () => {
    setLanIpResolver(() => { throw new Error('no network'); });
    const staleBase = 'http://192.168.1.100:3001/api/v1';
    // Resolver throws → falls back to hardcoded default → stale base differs → returns it
    expect(resolveFallbackBaseUrl(staleBase)).toBe(OLD_DEFAULT);
  });

  it('getLanIpResolver / setLanIpResolver round-trip', () => {
    expect(getLanIpResolver()).toBeNull();
    const fn = () => '1.2.3.4';
    setLanIpResolver(fn);
    expect(getLanIpResolver()).toBe(fn);
    setLanIpResolver(null);
    expect(getLanIpResolver()).toBeNull();
  });
});

// ── request() level tests — fresh module instance per test (vi.resetModules) ──
describe('request() — network error wrapping and stale-base fallback', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
    vi.resetModules();
  });

  it('network failure produces actionable message containing the base URL', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);

    try {
      await api.get('/households');
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      const msg = (err as Error).message;
      // Must contain the diagnostic base URL
      expect(msg).toContain('http://');
      expect(msg).toContain('3001');
      // Must be human-readable
      expect(msg).toContain('Cannot reach the MealDrama server');
    }
  });

  it('HTTP 500 error keeps the server message (different code path, no network wrap)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);

    try {
      await api.get('/households');
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      // Should be a FetchError with the server's message, NOT the network message
      expect((err as Error).message).toBe('Internal server error');
      expect((err as Error).message).not.toContain('Cannot reach');
    }
  });

  it('fallback triggers when stored base differs from resolver-provided default', async () => {
    // Stale stored base
    localStorage.setItem('md:api_base', 'http://192.168.1.99:3001/api/v1');

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      // Stale base → network error
      if (url.includes('192.168.1.99')) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      // Fallback health check on the fresh base → success
      if (url.includes('/health')) {
        return Promise.resolve({ ok: true, status: 200 });
      }
      // Fresh base request → success
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'hh-new', name: 'Test', members: [] }),
      });
    });

    const { api, setAuthReady, setLanIpResolver: setResolver } = await import('../lib/api');
    setResolver(() => '10.99.88.77');
    setAuthReady(true);

    const result = await api.get<{ id: string }>('/households');
    expect(result.id).toBe('hh-new');
    // 3 calls: stale fetch, fresh-base health check, fresh-base request
    expect(callCount).toBe(3);
    // localStorage should have been updated to the fresh base after the fallback succeeded
    expect(localStorage.getItem('md:api_base')).toBe('http://10.99.88.77:3001/api/v1');
  });

  it('no fallback attempted when stored base already equals the default', async () => {
    // Stored base == hardcoded default, no resolver → nothing fresher to try
    localStorage.setItem('md:api_base', 'http://10.243.22.253:3001/api/v1');

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);

    try {
      await api.get('/households');
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      expect((err as Error).message).toContain('Cannot reach');
      // Only the original fetch call — no fallback, no retry (GET network errors retried,
      // but with no fallback base the wrapped FetchError is thrown immediately)
      expect(callCount).toBe(1);
    }
  });
});

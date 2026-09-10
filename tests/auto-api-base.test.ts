// ─────────────────────────────────────────────────────────────────────────────
// auto-api-base — FULLY AUTOMATIC API-base self-heal
//
// Covers the 4 user scenarios + migration permanence:
//  1. Stale stored base (incl. the https://10.243.22.253 poison) + reachable
//     baked default  → auto-swap, persist, transparent retry succeeds.
//  2. Stored base = reachable LAN → still used (no clobber of working values).
//  3. Baked default ALSO unreachable → actionable error naming both bases.
//  4. .trycloudflare.com / private-IP stored base with different baked default
//     → migrated on first launch (one-shot stamp).
// Mocks are self-contained (dependency-injected fetch); no real network.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const API_BASE_KEY = 'md:api_base';
const API_BASE_VER_KEY = 'md:api_base_ver';
const POISON_BASE = 'https://10.243.22.253:3001/api/v1'; // the exact value from the user's error
const BAKED_DEFAULT = 'http://10.99.88.77:3001/api/v1';  // stands in for the baked onrender default

function okJson(body: Record<string, unknown> = {}) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

describe('request() — unconditional network-error self-heal', () => {
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

  it('(1) stale stored https LAN base + reachable baked default → auto-swap + retry succeeds', async () => {
    localStorage.setItem(API_BASE_KEY, POISON_BASE);
    const calls: string[] = [];
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      calls.push(url);
      if (url.includes('10.243.22.253')) return Promise.reject(new TypeError('Failed to fetch'));
      if (url.includes('/health')) return okJson();
      if (url.includes('10.99.88.77')) return okJson({ id: 'healed-hh' });
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    const { api, setAuthReady, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77'); // stands in for the VITE_API_URL bake
    setAuthReady(true);

    const res = await api.get<{ id: string }>('/households');
    expect(res.id).toBe('healed-hh');
    // Order: failed request on the stale base → origin-level /health probe → retry
    expect(calls[0]).toBe('https://10.243.22.253:3001/api/v1/households');
    expect(calls[1]).toBe('http://10.99.88.77:3001/health'); // NOT /api/v1/health (404!)
    expect(calls[2]).toBe('http://10.99.88.77:3001/api/v1/households');
    expect(localStorage.getItem(API_BASE_KEY)).toBe(BAKED_DEFAULT);
  });

  it('(1b) heal also fires when the stored base EQUALS the default (unconditional)', async () => {
    // Stored == baked default, first fetch fails transiently → default probed
    // again and, once back online, the retry succeeds transparently.
    localStorage.setItem(API_BASE_KEY, BAKED_DEFAULT);
    let failFirst = true;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (failFirst) {
        failFirst = false;
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      if (url.includes('/health')) return okJson();
      return okJson({ id: 'recovered-hh' });
    });

    const { api, setAuthReady, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');
    setAuthReady(true);

    const res = await api.get<{ id: string }>('/households');
    expect(res.id).toBe('recovered-hh');
    expect(localStorage.getItem(API_BASE_KEY)).toBe(BAKED_DEFAULT);
  });

  it('(2) stored base = reachable LAN → still used, never clobbered', async () => {
    const lanBase = 'http://192.168.1.50:3001/api/v1';
    localStorage.setItem(API_BASE_KEY, lanBase);
    let calls = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      calls++;
      if (url.includes('192.168.1.50')) return okJson({ id: 'lan-hh' });
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    const { api, setAuthReady, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');
    setAuthReady(true);

    const res = await api.get<{ id: string }>('/households');
    expect(res.id).toBe('lan-hh');
    expect(calls).toBe(1); // request succeeded — no probe, no heal, no churn
    expect(localStorage.getItem(API_BASE_KEY)).toBe(lanBase);
  });

  it('(3) baked default ALSO unreachable → actionable error naming attempted base AND default', async () => {
    localStorage.setItem(API_BASE_KEY, POISON_BASE);
    globalThis.fetch = vi.fn().mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));

    const { api, setAuthReady, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');
    setAuthReady(true);

    try {
      await api.get('/households');
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain('Cannot reach the MealDrama server');
      expect(msg).toContain(POISON_BASE);           // the base that was attempted
      expect(msg).toContain(BAKED_DEFAULT);         // the default that also failed
    }
    // No heal possible → stored value untouched (never clobbered by a dead probe)
    expect(localStorage.getItem(API_BASE_KEY)).toBe(POISON_BASE);
  });

  it('(3b) failed healed-retry still throws an actionable error (bounded to ONE retry)', async () => {
    localStorage.setItem(API_BASE_KEY, POISON_BASE);
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('10.243.22.253')) return Promise.reject(new TypeError('Failed to fetch'));
      if (url.includes('/health')) return okJson();          // default reachable...
      return Promise.reject(new TypeError('Failed to fetch')); // ...but the retried request still fails
    });

    const { api, setAuthReady, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');
    setAuthReady(true);

    try {
      await api.get('/households');
      expect.fail('Should have thrown');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain('Cannot reach the MealDrama server');
      expect(msg).toContain(BAKED_DEFAULT); // error reflects the HEALED base now in use
    }
  });
});

describe('runApiBaseMigration() — one-shot stale-base migration', () => {
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

  it('(4) private-IP stored base (user exact value) + reachable baked default → migrated', async () => {
    localStorage.setItem(API_BASE_KEY, POISON_BASE);
    globalThis.fetch = vi.fn().mockImplementation((url: string) =>
      url.includes('/health') ? okJson() : Promise.reject(new TypeError('Failed to fetch')),
    );

    const { runApiBaseMigration, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');

    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(true);
    expect(localStorage.getItem(API_BASE_KEY)).toBe(BAKED_DEFAULT);
    expect(localStorage.getItem(API_BASE_VER_KEY)).toBe('1');
  });

  it('(4b) .trycloudflare.com stored base + reachable baked default → migrated', async () => {
    localStorage.setItem(API_BASE_KEY, 'https://adapters-bars-helena-trans.trycloudflare.com/api/v1');
    globalThis.fetch = vi.fn().mockImplementation((url: string) =>
      url.includes('/health') ? okJson() : Promise.reject(new TypeError('Failed to fetch')),
    );

    const { runApiBaseMigration, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');

    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(true);
    expect(localStorage.getItem(API_BASE_KEY)).toBe(BAKED_DEFAULT);
    expect(localStorage.getItem(API_BASE_VER_KEY)).toBe('1');
  });

  it('(5) migration is ONE-SHOT — version stamp prevents re-probing on later launches', async () => {
    localStorage.setItem(API_BASE_KEY, POISON_BASE);
    localStorage.setItem(API_BASE_VER_KEY, '1'); // already migrated by this build
    let probes = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      probes++;
      return okJson();
    });

    const { runApiBaseMigration } = await import('../lib/api');
    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(false);
    expect(probes).toBe(0); // no network activity at all
    expect(localStorage.getItem(API_BASE_KEY)).toBe(POISON_BASE); // untouched
  });

  it('(6) baked default unreachable at launch → stored value kept (probe first, never clobber)', async () => {
    const lanBase = 'http://192.168.1.50:3001/api/v1';
    localStorage.setItem(API_BASE_KEY, lanBase);
    globalThis.fetch = vi.fn().mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));

    const { runApiBaseMigration, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');

    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(false);
    expect(localStorage.getItem(API_BASE_KEY)).toBe(lanBase);     // preserved
    expect(localStorage.getItem(API_BASE_VER_KEY)).toBe('1');     // stamped — no daily reprobing
  });

  it('(7) non-poisoned custom base is never migrated', async () => {
    const custom = 'https://api.my-company.com/api/v1';
    localStorage.setItem(API_BASE_KEY, custom);
    globalThis.fetch = vi.fn().mockImplementation((url: string) => okJson());

    const { runApiBaseMigration, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');

    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(false);
    expect(localStorage.getItem(API_BASE_KEY)).toBe(custom);
    expect(localStorage.getItem(API_BASE_VER_KEY)).toBe('1');
  });

  it('(2b) dev flow: stored LAN equals resolver default → untouched, no probe', async () => {
    const lanDev = 'http://10.99.88.77:3001/api/v1'; // defaultApiBase() == stored (resolver-driven)
    localStorage.setItem(API_BASE_KEY, lanDev);
    let probes = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      probes++;
      return okJson();
    });

    const { runApiBaseMigration, setLanIpResolver } = await import('../lib/api');
    setLanIpResolver(() => '10.99.88.77');

    const migrated = await runApiBaseMigration();
    expect(migrated).toBe(false);
    expect(probes).toBe(0);
    expect(localStorage.getItem(API_BASE_KEY)).toBe(lanDev);
    expect(localStorage.getItem(API_BASE_VER_KEY)).toBe('1');
  });
});

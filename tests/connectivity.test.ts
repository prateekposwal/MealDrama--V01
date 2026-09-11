// ─────────────────────────────────────────────────────────────────────────────
// connectivity.checkConnectivity — probes the RESOLVED API base, not a
// hardcoded LAN IP.
//
// Regression: `checkConnectivity` hardcoded a stale private LAN IP for
// window.location.protocol === 'file:' (every installed Capacitor APK). A phone
// on cellular can never reach that LAN IP, so every probe failed and the app
// believed it was offline even though Render was reachable. The probe now
// mirrors lib/api.ts's self-heal: the currently-effective base (getApiBase())
// AND the baked default (defaultApiBase()), both at their ORIGIN-level /health
// (the server mounts /health at the root; /api/v1/health is 404).
//
// Mocks are self-contained (dependency-injected fetch + stubbed globals); no
// real network. The stale-IP literal is intentionally written ESCAPED here so
// the repo-wide grep for the stale IP stays clean.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';

const API_BASE_KEY = 'md:api_base';
const RENDER_BASE = 'https://mealdrama.onrender.com/api/v1';
const STALE_LAN_BASE = 'http://10.0.0.5:3001/api/v1'; // stands in for the old device-side LAN bake

function okRes() {
  return { ok: true, status: 200, headers: new Headers() };
}

/** Stub the window with a given location (simulates the Capacitor APK or web runtime). */
function stubWindow(location: { protocol: string; hostname?: string }) {
  vi.stubGlobal('window', {
    ...((globalThis as any).window ?? {}),
    location,
  });
}

describe('checkConnectivity — APK path probes the real server', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    // Reset the globals the module reads (setup.ts stubs window; each test may
    // override it) so tests never leak state into each other.
    vi.stubGlobal('navigator', { onLine: true });
    vi.stubGlobal('window', {
      ...((globalThis as any).window ?? {}),
      localStorage: (globalThis as unknown as { localStorage: Storage }).localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      navigator: { onLine: true },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    localStorage.clear();
    vi.resetModules();
  });

  it('(1) file:-protocol probes the getApiBase() origin /health and resolves TRUE on 200', async () => {
    stubWindow({ protocol: 'file:' });
    const fetchSpy = vi.fn(async (_url: string) => okRes());
    vi.stubGlobal('fetch', fetchSpy);
    localStorage.setItem(API_BASE_KEY, RENDER_BASE);

    const { checkConnectivity } = await import('../app/utils/connectivity');
    expect(await checkConnectivity(1000)).toBe(true);

    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    // The probe must hit the SAME origin the app's API traffic uses…
    expect(calls).toContain('https://mealdrama.onrender.com/health');
    // …at the ORIGIN level — /api/v1/health is 404 and was the old silent killer.
    expect(calls.some((u) => u.includes('/api/v1/health'))).toBe(false);
  });

  it('(2) resolves FALSE when every endpoint fails', async () => {
    // A stale stored base + unreachable baked default → genuine offline verdict.
    vi.stubGlobal('fetch', vi.fn(async (_url: string) => {
      throw new TypeError('Failed to fetch');
    }));
    localStorage.setItem(API_BASE_KEY, STALE_LAN_BASE);

    const { checkConnectivity } = await import('../app/utils/connectivity');
    expect(await checkConnectivity(500)).toBe(false);
  });

  it('(3) honors navigator.onLine=false with the early-return (M13) — no fetch', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const fetchSpy = vi.fn(async (_url: string) => okRes());
    vi.stubGlobal('fetch', fetchSpy);
    localStorage.setItem(API_BASE_KEY, RENDER_BASE);

    const { checkConnectivity } = await import('../app/utils/connectivity');
    expect(await checkConnectivity(500)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('(4) probe URLs derive from resolved bases — stale stored base falls back to the baked default', async () => {
    stubWindow({ protocol: 'file:' });
    const fetchSpy = vi.fn(async (_url: string) => okRes());
    vi.stubGlobal('fetch', fetchSpy);
    // Migration hasn't run yet: the stored base is still the stale LAN poison.
    localStorage.setItem(API_BASE_KEY, STALE_LAN_BASE);

    const { checkConnectivity } = await import('../app/utils/connectivity');
    // Stand-in for the baked VITE_API_URL default resolution path (see
    // tests/auto-api-base.test.ts — same injection point).
    const apiLib = await import('../lib/api');
    apiLib.setLanIpResolver(() => '10.99.88.77');

    expect(await checkConnectivity(1000)).toBe(true);

    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    // BOTH the currently-effective base (honest — traffic also uses it) and the
    // baked default (heal target) are probed; Promise.any wins on the reachable one.
    expect(calls).toContain('http://10.0.0.5:3001/health');
    expect(calls).toContain('http://10.99.88.77:3001/health');
    // The dead hardcoded LAN IP must NEVER appear (behavioral lock):
    expect(calls.some((u) => /192[.]168[.]29[.]211/.test(u))).toBe(false);

    // Source-level lock: no private-LAN address is referenced in the module.
    const src = readFileSync(new URL('../app/utils/connectivity.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/192[.]168[.]/); // no private-LAN C-block anywhere in the module
  });

  it('(5) dev/web flow: no stored base, resolver-provided default → probes the dev origin, still TRUE', async () => {
    // Web dev (protocol http:, no VITE_API_URL) — defaultApiBase() is the
    // resolver/localhost dev target; connectivity and API traffic must AGREE.
    stubWindow({ protocol: 'http:', hostname: 'localhost' });
    const fetchSpy = vi.fn(async (_url: string) => okRes());
    vi.stubGlobal('fetch', fetchSpy);

    const { checkConnectivity } = await import('../app/utils/connectivity');
    const apiLib = await import('../lib/api');
    apiLib.setLanIpResolver(() => '10.99.88.77');

    expect(await checkConnectivity(1000)).toBe(true);
    const calls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(calls).toContain('http://10.99.88.77:3001/health');
  });
});

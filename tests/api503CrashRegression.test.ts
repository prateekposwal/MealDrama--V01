// ─────────────────────────────────────────────────────────────────────────────
// #185 CRASH REGRESSION — 503 / backend-unavailable stability (2026-09-13)
//
// User report: localhost:3001 dashboard crashed with React error #185
// ("Maximum update depth exceeded") and NOTHING rendered; DevTools showed
// /api/v1/auth/register → 503 against mealdrama.onrender.com from the LOCAL
// client. Root causes shipped against:
//   (A) The local build had VITE_API_URL baked to Render (stale .env.production
//       production build) → every auth call left the machine. A 503 from the
//       Render free-tier wake + stale-base wedge kept the app hammering the
//       remote base: the register path compounds authApi 3× × api 3× = 9
//       attempts (~25s), and the household feed/kitchen refreshers broadcast
//       family:refresh on completion while App's listener re-armed BOTH — an
//       unguarded fan-out of nested store updates (React 19 #185 risk).
//   (B) getMe() collapsed EVERY failure (network/503 AND confirmed 401) into
//       null → App's RESTORE/401-revalidate clearToken() → a TRANSIENT 503
//       logged the user out and bounced the whole tree re-render storm.
//
// Fixes pinned here:
//   1. defaultApiBase() is SAME-ORIGIN ('/api/v1'); only VITE_API_URL / LAN
//      resolver changes it.
//   2. api.request heals on PERSISTENT 5xx (probe the baked default once,
//      retry once) — a stored remote base can no longer wedge the app.
//   3. getMe() returns null ONLY on a confirmed 401/403; backend-unavailable
//      RE-THROWS, and App never logs out on a 503.
//   4. Household feed/kitchen refresh fan-out is single-flight + debounced
//      (kitchen gained the feed's refreshing guard).
//
// HARNESS HONESTY: this repo's vitest runs environment 'node' (no DOM), so a
// DOM-level #185 cannot be reproduced here. The store/effect graph that drives
// the crash is exercised with the REAL modules + stubbed fetch (dynamic),
// and the render-side guards are pinned with STATIC source assertions — the
// same honest level the diet-chip suite uses for markup contracts.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';

const API_BASE_KEY = 'md:api_base';
const API_BASE_VER_KEY = 'md:api_base_ver';
const REMOTE_BASE = 'https://mealdrama.onrender.com/api/v1'; // the stale baked base under test

const okJson = (body: Record<string, unknown> = {}) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const serverErr = (status: number, msg: string) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error: msg }) });

function readSource(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

// ─── Part B — same-origin default contract ──────────────────────────────────
describe('defaultApiBase — SAME-ORIGIN default (localhost must not fire at Render)', () => {
  afterEach(() => { vi.resetModules(); localStorage.clear(); });

  it('no env and no resolver → the default is "/api/v1" (same origin, never a remote host)', async () => {
    const { defaultApiBase } = await import('../lib/api');
    expect(defaultApiBase()).toBe('/api/v1');
    // the same-origin default is ALSO what a fresh local client stores
    const { getApiBase } = await import('../lib/api');
    expect(getApiBase()).toBe('/api/v1');
    expect(localStorage.getItem(API_BASE_KEY)).toBe('/api/v1');
  });

  it('VITE_API_URL is the ONLY way the base changes (source-pinned) — and the old localhost-absolute literal is the SAME target as same-origin', async () => {
    const apiSrc = readSource('lib/api.ts');
    // the env bake is the only absolute-URL source in the default resolver
    expect(apiSrc).toContain('.env?.VITE_API_URL');
    const { sameApiTarget, defaultApiBase } = await import('../lib/api');
    expect(defaultApiBase()).toBe('/api/v1');
    // the OLD stored 'http://localhost:3001/api/v1' (previous dists) addresses
    // the same server as the same-origin default — fallback logic treats them
    // as equal, so an old stored localhost literal never triggers a heal storm
    expect(sameApiTarget('http://localhost:3001/api/v1', '/api/v1')).toBe(true);
    expect(sameApiTarget('https://mealdrama.onrender.com/api/v1', '/api/v1')).toBe(false);
  });

  it('originOf/relative handling: "/api/v1" → same-origin (""), probe URL "/health"', async () => {
    const originalFetch = globalThis.fetch;
    const { originOf } = await import('../lib/api');
    expect(originOf('/api/v1')).toBe('');
    expect(originOf('https://mealdrama.onrender.com/api/v1')).toBe('https://mealdrama.onrender.com');
    const { probeApiHealth } = await import('../lib/api');
    const urls: string[] = [];
    globalThis.fetch = vi.fn(async (u: string) => { urls.push(String(u)); return { ok: true, status: 200 }; }) as unknown as typeof fetch;
    expect(await probeApiHealth('/api/v1', 2000)).toBe(true);
    expect(urls).toEqual(['/health']); // origin-level — NOT /api/v1/health (404)
    globalThis.fetch = originalFetch; // manual restore — NEVER unstub setup.ts globals
  });
});

// ─── Part A — api.request 503 boundedness + stale-base heal ─────────────────
describe('api.request — 503 register storm is bounded and heals off a stale remote base', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => { originalFetch = globalThis.fetch; localStorage.clear(); });
  afterEach(() => { globalThis.fetch = originalFetch; localStorage.clear(); vi.resetModules(); vi.useRealTimers(); });

  it('permanent 503 → EXACTLY the bounded retries + one probe, then a terminal honest error (no 9×25s storm, no crash)', async () => {
    vi.useFakeTimers();
    let calls: string[] = [];
    globalThis.fetch = vi.fn(async (u: string) => { calls.push(String(u)); return serverErr(503, 'Service Unavailable'); }) as unknown as typeof fetch;

    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const promise = api.post('/auth/register', { id: 'u', name: 't' });
    const outcome = promise.then(() => 'resolved', (e: Error) => e);
    await vi.advanceTimersByTimeAsync(20000);
    const err = await outcome;

    expect(err).toBeInstanceOf(Error);
    expect((err as { status?: number }).status).toBe(503);
    expect((err as Error).message).toContain('Service Unavailable');
    // 1 initial + 3 retries (api backoff) + 1 default probe = 5 calls.
    // authApi's own 3× register loop is NOT involved here — this pins the API
    // layer alone; registerUser's loop on top is bounded by the same terminal
    // error propagating (its 3 attempts each see this one terminal error).
    expect(calls.length).toBe(5);
    expect(calls.filter(u => u.includes('/api/v1/auth/register')).length).toBe(4);
    expect(calls.filter(u => u.endsWith('/health')).length).toBe(1);
    vi.useRealTimers();
  });

  it('stored REMOTE base + persistent 503 + reachable same-origin default → heals + retries ONCE against /api/v1', async () => {
    vi.useFakeTimers();
    localStorage.setItem(API_BASE_KEY, REMOTE_BASE); // the stale render base from the old local build
    const calls: string[] = [];
    globalThis.fetch = vi.fn(async (u: string) => {
      calls.push(String(u));
      const s = String(u);
      if (s.includes('mealdrama.onrender.com')) return serverErr(503, 'Service Unavailable');
      if (s === '/health') return okJson();                                    // same-origin default reachable
      return okJson({ id: 'registered-locally' });                             // healed retry succeeds
    }) as unknown as typeof fetch;

    const { api, setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const promise = api.post<{ id: string }>('/auth/register', { id: 'u', name: 't' });
    const outcome = promise.then(r => r, (e: Error) => e);
    await vi.advanceTimersByTimeAsync(20000);
    const res = await outcome;

    expect((res as { id: string }).id).toBe('registered-locally');
    // The remote was hit exactly the bounded 4× (1 + 3 retries) — a 9×25s
    // "register storm" is structurally impossible now; the next register call
    // goes straight to the healed base.
    expect(calls.filter(u => u.includes('mealdrama.onrender.com')).length).toBe(4);
    expect(calls[calls.length - 1]).toBe('/api/v1/auth/register');
    expect(localStorage.getItem(API_BASE_KEY)).toBe('/api/v1');
    vi.useRealTimers();
  });
});

// ─── Part A — getMe never masquerades a 503 as expiry ───────────────────────
describe('getMe — backend-unavailable ≠ session expired (the logout-on-503 killer)', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => { originalFetch = globalThis.fetch; localStorage.clear(); });
  afterEach(() => { globalThis.fetch = originalFetch; localStorage.clear(); vi.resetModules(); vi.useRealTimers(); });

  it('a confirmed 401 → null (caller logs out — real expiry)', async () => {
    globalThis.fetch = vi.fn(async () => serverErr(401, 'Unauthorized')) as unknown as typeof fetch;
    const { getMe } = await import('../app/utils/authApi');
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    expect(await getMe()).toBeNull();
  });

  it('a 503 → REJECTS (never null → App stays signed in; no #185 re-render storm)', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(async () => serverErr(503, 'Service Unavailable')) as unknown as typeof fetch;
    const { getMe } = await import('../app/utils/authApi');
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const outcome = getMe().then(() => 'resolved', (e: Error) => e);
    await vi.advanceTimersByTimeAsync(20000);
    const err = await outcome;
    expect(err).toBeInstanceOf(Error);
    expect((err as { status?: number }).status).toBe(503);
    expect((err as Error).message).toContain('Service Unavailable');
    vi.useRealTimers();
  });
});

// ─── Part A — store bootstrap under permanent 503: stable terminal state ────
const apiMocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  getMe: vi.fn(),
  dietApi: { getMine: vi.fn(), upsertMine: vi.fn(), listHouseholdDiets: vi.fn() },
  householdApi: { create: vi.fn(), join: vi.fn(), get: vi.fn(), leave: vi.fn(), updateMember: vi.fn(), getMembers: vi.fn(), regenerateCode: vi.fn() },
  householdFeedApi: { getRequests: vi.fn(), getActivity: vi.fn(), getSharedPlan: vi.fn(), postActivity: vi.fn(), postSharedPlan: vi.fn(), patchSharedPlan: vi.fn(), removeSharedPlan: vi.fn() },
}));

vi.mock('../app/utils/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../app/utils/authApi')>();
  return {
    ...actual,                                   // REAL getMe + isConfirmedAuthRejection
    registerUser: apiMocks.registerUser,         // store paths mocked (503 harness)
    logoutUser: apiMocks.logoutUser,
    // getMe stays REAL — the getMe 401/503 tests exercise the shipped contract
  };
});
vi.mock('../app/utils/dietApi', () => ({ dietApi: apiMocks.dietApi }));
vi.mock('../app/utils/householdApi', () => ({ householdApi: apiMocks.householdApi }));
vi.mock('../app/utils/householdFeedApi', () => ({ householdFeedApi: apiMocks.householdFeedApi }));

describe('store login — permanent register 503 → one honest terminal state, no setState churn, manual retry recovers', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.householdFeedApi.getRequests.mockReset();
    apiMocks.householdFeedApi.getActivity.mockReset();
    apiMocks.householdFeedApi.getSharedPlan.mockReset();
  });

  it('register-503 → login settles logged-in-but-unsynced, store mutations STOP (stable, no crash); one manual ensureToken retry recovers when ok', async () => {
    const { useStore } = await import('../app/store/useStore');
    useStore.setState({
      isLoggedIn: false, authReady: false, token: null, user: null, householdId: null, toast: null,
    } as any);
    let mutations = 0;
    const unsub = useStore.subscribe(() => { mutations++; });

    // Permanent 503: registerUser (the ONCE-on-load attempt) fails with the REAL error
    apiMocks.registerUser.mockResolvedValue({ ok: false, error: 'Request failed: 503 — Service Unavailable' });

    await useStore.getState().login('tester');
    // Terminal state: signed in locally with NO token and NO fake success
    expect(useStore.getState().isLoggedIn).toBe(true);
    expect(useStore.getState().token).toBeNull();
    expect(useStore.getState().user?.username).toBe('tester');

    await new Promise(r => setTimeout(r, 30));
    const settled = mutations;
    await new Promise(r => setTimeout(r, 30));
    expect(mutations).toBe(settled); // NO setState-in-effect churn — the store is quiescent
    unsub();

    // ONE manual retry (ensureToken — the household/diet-sync guard) recovers
    apiMocks.registerUser.mockResolvedValue({ ok: true, user: { id: 'u-1' }, token: 'jwt-recovered' });
    const auth = await useStore.getState().ensureToken();
    expect(auth.ok).toBe(true);
    expect(useStore.getState().token).toBe('jwt-recovered');
  });
});

// ─── Part A — static guards (no DOM renderer; pins the shipped source) ──────
describe('#185 render-side guards — static source pins', () => {
  it('App.tsx RESTORE + 401-revalidate never clearToken on a 503 (catch keeps the session)', () => {
    const app = readSource('App.tsx');
    // RESTORE: getMe failure → stay signed in + one honest toast
    expect(app).toContain("Can't reach the server right now — staying signed in");
    // 401-revalidate: clearToken sits ONLY behind a confirmed null (401/403)
    const revalidateRegion = app.slice(app.indexOf('const onUnauthorized'), app.indexOf('const onUnauthorized') + 900);
    expect(revalidateRegion).toContain('serverUser === null');
    expect(revalidateRegion).toContain('Server unreachable — changes saved locally, will retry');
  });

  it('authApi.getMe rethrows backend-unavailable (only confirmed 401/403 → null)', () => {
    const auth = readSource('app/utils/authApi.ts');
    expect(auth).toContain('isConfirmedAuthRejection');
    expect(auth).toContain('throw err; // backend down/erroring → rethrow so callers stay signed in');
  });

  it('household feed/kitchen fan-out is bounded: kitchen gained the refreshing single-flight guard', () => {
    const kitchen = readSource('plan/store/householdKitchenStore.ts');
    expect(kitchen).toContain("if (!householdId || get().refreshing) return;");
    expect(kitchen).toContain('refreshing: false,');
    const app = readSource('App.tsx');
    expect(app).toContain('inFlight');     // single-flight
    expect(app).toContain('}, 1500);');    // 1.5s trailing debounce
  });

  it('api.ts default is same-origin and the 5xx heal is wired (no 503 wedge)', () => {
    const api = readSource('lib/api.ts');
    expect(api).toContain("return '/api/v1';");
    expect(api).toContain('PERSISTENT 5xx');
    expect(api).toContain('API_BASE_VERSION = 2');
  });
});

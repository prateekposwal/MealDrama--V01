// ─────────────────────────────────────────────────────────────────────────────
// MEAL HISTORY (Gap 2 closure) — persisted "consumed" log.
//
// Server proofs (real express app + prisma mocked, repo style):
//   · PUT /api/v1/meal-log → GET round-trips MY log
//   · idempotent per (user, dish, slot, day) — never double-counted
//   · user-scoped: another user's rows are invisible
//   · unauthenticated → 401 ; bad slot/date → 400
//
// Client proofs (real stores + REAL trayRegen surface):
//   · completeSlot (the "meal done" signal) logs the slot's dishes
//   · PERSISTED history drives the regen penalty: an eaten REAL dish drops
//     below peers through buildPersonalizationContext (name-checked)
//   · two users' histories are isolated (cache keyed per user)
//   · empty history → the swap/plan-day proxies still work (honest fallback)
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

// ─── server-side prisma mock (real routes, mocked persistence) ──────────────
const mocks = vi.hoisted(() => ({
  mealLogFind: vi.fn(),
  mealLogCreate: vi.fn(),
  mealLogFindMany: vi.fn(),
  householdFind: vi.fn(),
  householdPlanFindMany: vi.fn(),
  householdPlanDeleteMany: vi.fn(),
  householdPlanCreateMany: vi.fn(),
  tx: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    mealLog: {
      findUnique: mocks.mealLogFind,
      create: mocks.mealLogCreate,
      findMany: mocks.mealLogFindMany,
    },
    household: { findUnique: mocks.householdFind },
    householdPlanItem: {
      findMany: mocks.householdPlanFindMany,
      deleteMany: mocks.householdPlanDeleteMany,
      createMany: mocks.householdPlanCreateMany,
    },
    $transaction: mocks.tx,
  },
}));

// ─── client-side api mock (the browser surface never touches the network) ───
vi.mock('../app/utils/mealLogApi', () => ({
  mealLogApi: {
    put: vi.fn().mockResolvedValue({ log: { id: 'x', dishId: 'd', mealSlot: 'lunch', eatenAt: '2026-09-13', createdAt: '' }, duplicate: false }),
    get: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('../app/utils/householdPlanApi', () => ({
  householdPlanApi: {
    get: vi.fn().mockResolvedValue({ householdId: 'hh', dishes: [] }),
    put: vi.fn().mockResolvedValue({ replaced: 0 }),
  },
}));

import { buildPersonalizationApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const app = buildPersonalizationApp();

// ─── in-memory prisma stores ────────────────────────────────────────────────
const logStore: any[] = [];
let logSeq = 0;
const planStore: any[] = [];
let planSeq = 0;

beforeEach(() => {
  logStore.length = 0;
  planStore.length = 0;
  logSeq = 0;
  planSeq = 0;
  for (const f of Object.values(mocks)) f.mockReset();

  mocks.mealLogFind.mockImplementation(async ({ where }: any) => {
    // prisma compound unique key: { userId_dishId_mealSlot_eatenAt: {...} }
    const w = where.userId_dishId_mealSlot_eatenAt ?? where;
    return logStore.find(r =>
      r.userId === w.userId && r.dishId === w.dishId && r.mealSlot === w.mealSlot &&
      r.eatenAt.toISOString().slice(0, 10) === new Date(w.eatenAt).toISOString().slice(0, 10)) ?? null;
  });
  mocks.mealLogCreate.mockImplementation(async (args: any) => {
    const row = { id: `ml-${++logSeq}`, createdAt: new Date(), ...args.data };
    logStore.push(row);
    return row;
  });
  mocks.mealLogFindMany.mockImplementation(async ({ where, take }: any) =>
    logStore.filter(r => r.userId === where.userId).sort((a, b) => (a.eatenAt < b.eatenAt ? 1 : -1)).slice(0, take ?? 100));

  mocks.householdPlanFindMany.mockImplementation(async ({ where }: any) =>
    planStore.filter(r => r.householdId === where.householdId));
  mocks.householdPlanDeleteMany.mockImplementation(async ({ where }: any) => {
    const before = planStore.length;
    for (let i = planStore.length - 1; i >= 0; i--) {
      if (planStore[i]!.householdId === where.householdId && (!where.authorUserId || planStore[i]!.authorUserId === where.authorUserId)) planStore.splice(i, 1);
    }
    return { count: before - planStore.length };
  });
  mocks.householdPlanCreateMany.mockImplementation(async ({ data }: any) => {
    for (const d of data) planStore.push({ id: `hp-${++planSeq}`, createdAt: new Date(), updatedAt: new Date(), ...d });
    return { count: data.length };
  });
  mocks.tx.mockImplementation(async (ops: any[]) => {
    for (const op of ops) await op;
    return [{}];
  });
});

let server: Server;
let base = '';

beforeAll(async () => {
  await new Promise<void>(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function req(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, body: await res.json() as any };
}

const tokenFor = (userId: string) => generateAccessToken({ userId, email: `${userId}@test.local`, phone: null, name: 'U' });

// ─────────────────────────────────────────────────────────────────────────────
// 1 · SERVER: meal-log route proofs
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT/GET /api/v1/meal-log (server route)', () => {
  it('PUT then GET round-trips MY log (real dish id)', async () => {
    const t = tokenFor('u-eater');
    const put = await req('PUT', '/api/v1/meal-log', { token: t, body: { dishId: 'dal-tadka-central', mealSlot: 'lunch', date: '2026-09-13' } });
    expect(put.status).toBe(201);
    expect(put.body.log).toMatchObject({ dishId: 'dal-tadka-central', mealSlot: 'lunch', eatenAt: '2026-09-13' });
    expect(put.body.duplicate).toBe(false);

    const get = await req('GET', '/api/v1/meal-log', { token: t });
    expect(get.status).toBe(200);
    expect(get.body).toHaveLength(1);
    expect(get.body[0]!.dishId).toBe('dal-tadka-central');
  });

  it('idempotent: same (user, dish, slot, day) PUT twice → one row, duplicate flag', async () => {
    const t = tokenFor('u-idem');
    const b = { dishId: 'idli', mealSlot: 'breakfast', date: '2026-09-13' };
    await req('PUT', '/api/v1/meal-log', { token: t, body: b });
    const again = await req('PUT', '/api/v1/meal-log', { token: t, body: b });
    expect(again.status).toBe(200);
    expect(again.body.duplicate).toBe(true);
    expect(logStore.filter(r => r.userId === 'u-idem')).toHaveLength(1);
  });

  it('user-scoped: another user never sees MY rows', async () => {
    await req('PUT', '/api/v1/meal-log', { token: tokenFor('u-a'), body: { dishId: 'rajma', mealSlot: 'dinner', date: '2026-09-12' } });
    const other = await req('GET', '/api/v1/meal-log', { token: tokenFor('u-b') });
    expect(other.body).toEqual([]);
    const mine = await req('GET', '/api/v1/meal-log', { token: tokenFor('u-a') });
    expect(mine.body).toHaveLength(1);
  });

  it('unauthenticated → 401 (live authMiddleware)', async () => {
    const r = await req('GET', '/api/v1/meal-log');
    expect(r.status).toBe(401);
  });

  it('validation: bad slot → 400; bad date → 400', async () => {
    const t = tokenFor('u-zod');
    expect((await req('PUT', '/api/v1/meal-log', { token: t, body: { dishId: 'idli', mealSlot: 'brunch' } })).status).toBe(400);
    expect((await req('PUT', '/api/v1/meal-log', { token: t, body: { dishId: 'idli', mealSlot: 'lunch', date: '13-09-2026' } })).status).toBe(400);
  });

  it('default date = today when date omitted', async () => {
    const t = tokenFor('u-today');
    await req('PUT', '/api/v1/meal-log', { token: t, body: { dishId: 'poha-mp', mealSlot: 'breakfast' } });
    const today = new Date().toISOString().slice(0, 10);
    expect(logStore[0]!.eatenAt.toISOString().slice(0, 10)).toBe(today);
  });

  it('history-empty GET returns [] (honest empty — never invented rows)', async () => {
    const r = await req('GET', '/api/v1/meal-log', { token: tokenFor('u-never-eaten') });
    expect(r.body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 · CLIENT: completeSlot logs the eaten dishes; cache routing; fallback
// ─────────────────────────────────────────────────────────────────────────────
describe('client meal-history routing (real stores + trayRegen surface)', () => {
  afterEach(() => { vi.resetModules(); });

  const seedStore = async (opts: { userId: string; swaps?: Record<string, Record<string, any>>; planDays?: Record<string, any>; householdId?: string | null }) => {
    const { useStore } = await import('../app/store/useStore');
    const { useTrayStore } = await import('../plan/store/useTrayStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: opts.userId, name: 'Eater', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], healthGoals: ['Balanced'] } as any,
      token: 'jwt-ok',
      deviceId: `dev-${opts.userId}`,
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      pendingDietChange: null,
      dietRegen: null,
      householdId: opts.householdId ?? null,
      swaps: opts.swaps ?? {},
    } as any);
    if (opts.planDays) {
      useTrayStore.setState({ plan: { days: opts.planDays } } as any);
    }
    return { useStore, useTrayStore };
  };

  it('completeSlot logs the slot\'s real dishes (the "meal done" signal)', async () => {
    const { mealLogApi } = await import('../app/utils/mealLogApi');
    const { useTrayStore } = await import('../plan/store/useTrayStore');
    const days = {
      '2026-09-13': {
        lunch: [
          { id: 'x1', meal_id: 'dal-tadka-central', name: 'Dal Tadka' },
          { id: 'x2', meal_id: 'idli', name: 'Idli' },
        ],
      },
    };
    useTrayStore.setState({ plan: { days } } as any);
    useTrayStore.getState().completeSlot('2026-09-13', 'lunch');
    // The put is fire-and-forget — flush microtasks.
    await new Promise(r => setTimeout(r, 20));
    expect(mealLogApi.put).toHaveBeenCalledWith('dal-tadka-central', 'lunch', '2026-09-13');
    expect(mealLogApi.put).toHaveBeenCalledWith('idli', 'lunch', '2026-09-13');
  });

  it('persisted history replaces proxies: an EATEN real dish drops below peers through buildPersonalizationContext', async () => {
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    const { seedMealHistoryForTests } = await import('../app/lib/mealHistory');
    const { fillCandidatesForSlot, personalizationComparator } = await import('../utils/mealPlanRegen');
    const { generateAccessToken } = await import('../server/src/lib/auth');
    void generateAccessToken;

    await seedStore({ userId: 'u-penalty' });
    seedMealHistoryForTests('u-penalty', [{ id: 'dal-tadka-central' }]);

    const ctx = buildPersonalizationContext();
    expect(ctx).not.toBeNull();
    expect(ctx!.recentlyEaten!.some(h => h.id === 'dal-tadka-central')).toBe(true);

    // The eaten dish must rank BELOW an uneaten peer in the same slot pool —
    // the penalty flows through the real context into the fill comparator.
    const cmp = personalizationComparator(ctx, (a, b) => a.name.localeCompare(b.name));
    const pool = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', 'lunch', new Set(), new Set(), 'Balanced', ctx);
    const idxEaten = pool.findIndex(d => d.id === 'dal-tadka-central');
    const idxPeer = pool.findIndex(d => d.id !== 'dal-tadka-central' && (d.category ?? []).includes('lunch'));
    expect(idxEaten).toBeGreaterThan(idxPeer);
    // And direct evidence: the same dish with the eaten-history context scores
    // strictly lower than without it.
    const { personalizationScore } = await import('../utils/mealPersonalization');
    const dal = DISH_LIBRARY.find(d => d.id === 'dal-tadka-central')!;
    expect(personalizationScore(dal, ctx!)).toBeLessThan(personalizationScore(dal, { ...ctx!, recentlyEaten: [] }));
    void cmp;
  });

  it('two users\' histories are isolated in the client cache', async () => {
    const { seedMealHistoryForTests, getCachedMealHistory, refreshMealHistory } = await import('../app/lib/mealHistory');
    seedMealHistoryForTests('u-owner', [{ id: 'idli' }]);
    // Another user reading the cache sees NULL (not owner's rows) —
    // isolation holds even before their own refresh lands.
    expect(getCachedMealHistory('u-other')).toBeNull();
    expect(getCachedMealHistory('u-owner')).toHaveLength(1);
    // A refresh for the other user (mocked api returns []) swaps the cache.
    await refreshMealHistory('u-other');
    expect(getCachedMealHistory('u-owner')).toBeNull();
    expect(getCachedMealHistory('u-other')).toEqual([]);
  });

  it('EMPTY persisted history → the swap/plan-day proxies still drive the context (honest fallback)', async () => {
    const { seedMealHistoryForTests } = await import('../app/lib/mealHistory');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    await seedStore({
      userId: 'u-fallback',
      swaps: { '2026-09-13': { lunch: { dishId: 'poha-mp', name: 'Poha' } } },
    });
    seedMealHistoryForTests('u-fallback', []); // loaded AND empty
    const ctx = buildPersonalizationContext();
    expect(ctx!.recentlyEaten!.some(h => h.id === 'poha-mp' || h.name === 'Poha')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 · HONEST PERSONALIZATION STATE (rule 2) — the "improves as you use the
// app" hint is shown ONLY while the persisted MealLog is loaded AND empty;
// once 1+ meal is logged the state flips (hint replaced by real behavior);
// and an empty log is cached as [] — NEVER backfilled with proxy rows.
// ─────────────────────────────────────────────────────────────────────────────
describe('personalization hint state (rule 2 — no backfill)', () => {
  afterEach(() => { vi.resetModules(); });

  it('empty persisted MealLog (loaded) → the hint is shown', async () => {
    const { seedMealHistoryForTests } = await import('../app/lib/mealHistory');
    const { shouldShowPersonalizationHint } = await import('../components/new/PersonalizationHint');
    seedMealHistoryForTests('u-hint-empty', []); // server CONFIRMED zero rows
    expect(shouldShowPersonalizationHint('u-hint-empty')).toBe(true);
    expect(shouldShowPersonalizationHint('u-hint-empty')).toBe(true); // idempotent
  });

  it('unloaded / unreachable log is NOT "empty" — the hint never claims an unconfirmed state', async () => {
    const { shouldShowPersonalizationHint } = await import('../components/new/PersonalizationHint');
    // No seed at all → cache not loaded → false (nothing claimed either way).
    expect(shouldShowPersonalizationHint('u-hint-unloaded')).toBe(false);
    // No authenticated user → false.
    expect(shouldShowPersonalizationHint(undefined)).toBe(false);
    expect(shouldShowPersonalizationHint(null)).toBe(false);
  });

  it('after 1+ logged meal the hint replaces itself (history exists → hidden)', async () => {
    const { seedMealHistoryForTests } = await import('../app/lib/mealHistory');
    const { shouldShowPersonalizationHint } = await import('../components/new/PersonalizationHint');
    seedMealHistoryForTests('u-hint-full', [{ id: 'idli' }, { id: 'rasam' }]);
    expect(shouldShowPersonalizationHint('u-hint-full')).toBe(false);
    expect(shouldShowPersonalizationHint('u-hint-empty')).toBe(false); // different user's rows never borrowed
  });

  it('an empty server log is cached as [] and never backfilled with proxy rows', async () => {
    const { refreshMealHistory, getMealHistoryCount, seedMealHistoryForTests, hasPersistedMealHistory } = await import('../app/lib/mealHistory');
    // mealLogApi.get is mocked to [] (the server's honest empty log).
    await refreshMealHistory('u-no-backfill');
    expect(getMealHistoryCount('u-no-backfill')).toBe(0);       // confirmed zero
    expect(hasPersistedMealHistory('u-no-backfill')).toBe(false);
    // The swap-proxy surface (runtime history) still works independently —
    // it feeds the personalization context, it never writes MealLog rows.
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    const { useStore } = await import('../app/store/useStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: 'u-no-backfill', name: 'E', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], healthGoals: ['Balanced'] } as any,
      token: 'jwt-ok',
      deviceId: 'dev-no-backfill',
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      pendingDietChange: null,
      dietRegen: null,
      householdId: null,
      swaps: { '2026-09-13': { lunch: { dishId: 'poha-mp', name: 'Poha' } } },
    } as any);
    const ctx = buildPersonalizationContext();
    expect(ctx!.recentlyEaten!.some(h => h.id === 'poha-mp')).toBe(true); // proxy STILL works as runtime history
    // But the bankable history (server rows) remains zero — no backfill happened.
    expect(getMealHistoryCount('u-no-backfill')).toBe(0);
    expect(hasPersistedMealHistory('u-no-backfill')).toBe(false);
    void seedMealHistoryForTests;
  });

  it('PersonalizationHint source: renders THE honest copy and nothing when history exists', async () => {
    const src = await import('node:fs').then(fs => fs.readFileSync(require.resolve('../components/new/PersonalizationHint.tsx'), 'utf8'));
    expect(src).toContain('Personalization will improve as you use the app');
    expect(src).toContain('refreshMealHistory(userId)');
    expect(src).toContain("getMealHistoryCount(userId) === 0"); // driven off the persisted count
  });

  it('the SAME shared component is mounted on Plan AND Profile (rule 2 — Plan/Profile surface)', async () => {
    const fs = await import('node:fs');
    const plan = fs.readFileSync(require.resolve('../screens/PlanScreen.tsx'), 'utf8');
    const profile = fs.readFileSync(require.resolve('../components/new/Profile.tsx'), 'utf8');
    // Both screens import and render the ONE shared component — no surface
    // invents its own copy of the empty-history state.
    expect(plan).toContain("import PersonalizationHint from '../components/new/PersonalizationHint'");
    expect(plan).toContain('<PersonalizationHint />');
    expect(profile).toContain("import PersonalizationHint from './PersonalizationHint'");
    expect(profile).toContain('<PersonalizationHint />');
    // The hint's own source is the single holder of the exact copy.
    const hint = fs.readFileSync(require.resolve('../components/new/PersonalizationHint.tsx'), 'utf8');
    const planCopy = (plan.match(/Personalization will improve as you use the app/) ?? []).length;
    const profileCopy = (profile.match(/Personalization will improve as you use the app/) ?? []).length;
    expect(planCopy).toBe(0);      // copy lives in the component, not the screen
    expect(profileCopy).toBe(0);   // copy lives in the component, not the screen
    expect(hint).toContain('Personalization will improve as you use the app');
  });
});

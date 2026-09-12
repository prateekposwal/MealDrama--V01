// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD PLAN VISIBILITY (Gap 3 closure) — ALL members' current plans.
//
// Server proofs (real express app + prisma mocked):
//   · PUT /api/v1/households/:id/plans persists MY generated plan
//   · GET returns EVERY member's rows WITHOUT any explicit "share" action
//   · replace-all semantics: a new generation replaces my old rows
//   · unauthenticated → 401 ; non-member → 403 ; unknown household → 404
//
// Client proofs (real trayRegen context builder + fill pipeline):
//   · buildPersonalizationContext merges other members' persisted plan dishes
//     into the penalty set — and EXCLUDES the user's own dishes
//   · a co-member's REAL dish drops below peers in the fill ordering
//   · tiny pool → household_overlap_tolerated reason still recorded (Λ2.3)
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

const mocks = vi.hoisted(() => ({
  householdFind: vi.fn(),
  householdPlanFindMany: vi.fn(),
  householdPlanDeleteMany: vi.fn(),
  householdPlanCreateMany: vi.fn(),
  tx: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    household: { findUnique: mocks.householdFind },
    householdPlanItem: {
      findMany: mocks.householdPlanFindMany,
      deleteMany: mocks.householdPlanDeleteMany,
      createMany: mocks.householdPlanCreateMany,
    },
    $transaction: mocks.tx,
  },
}));

vi.mock('../app/utils/householdPlanApi', () => ({
  householdPlanApi: {
    get: vi.fn().mockResolvedValue({ householdId: 'hh', dishes: [] }),
    put: vi.fn().mockResolvedValue({ replaced: 0 }),
  },
}));
vi.mock('../app/utils/mealLogApi', () => ({
  mealLogApi: {
    put: vi.fn().mockResolvedValue({ log: {}, duplicate: false }),
    get: vi.fn().mockResolvedValue([]),
  },
}));

import { buildPersonalizationApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const app = buildPersonalizationApp();
const planStore: any[] = [];
let planSeq = 0;

beforeEach(() => {
  planStore.length = 0;
  planSeq = 0;
  for (const f of Object.values(mocks)) f.mockReset();

  mocks.householdFind.mockImplementation(async ({ where }: any) =>
    where.id === HH_ID
      ? { id: HH_ID, members: [{ userId: 'u-riya' }, { userId: 'u-aman' }] }
      : null);

  mocks.householdPlanFindMany.mockImplementation(async ({ where }: any) =>
    planStore.filter(r => r.householdId === where.householdId).sort((a, b) => (a.authorUserId < b.authorUserId ? -1 : 1)));

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
  mocks.tx.mockImplementation(async (ops: any[]) => { for (const op of ops) await op; return [{}]; });
});

const HH_ID = 'hh-plans-1';
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
// 1 · SERVER route proofs
// ─────────────────────────────────────────────────────────────────────────────
describe('GET/PUT /api/v1/households/:id/plans (server route)', () => {
  it('member A persists her plan with NO share action; member B sees it in the household GET', async () => {
    const put = await req('PUT', `/api/v1/households/${HH_ID}/plans`, {
      token: tokenFor('u-riya'),
      body: { rows: [
        { dishId: 'dal-tadka-central', mealSlot: 'lunch', dayIndex: 0 },
        { dishId: 'idli', mealSlot: 'breakfast', dayIndex: 0 },
      ] },
    });
    expect(put.status).toBe(200);
    expect(put.body.replaced).toBe(2);

    const get = await req('GET', `/api/v1/households/${HH_ID}/plans`, { token: tokenFor('u-aman') });
    expect(get.status).toBe(200);
    expect(get.body.dishes).toHaveLength(2);
    expect(get.body.dishes[0]).toMatchObject({ authorUserId: 'u-riya', dishId: 'dal-tadka-central', mealSlot: 'lunch', dayIndex: 0 });
  });

  it('every member\'s current plan is visible — two members, no shares, both rows present', async () => {
    await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: tokenFor('u-riya'), body: { rows: [{ dishId: 'poha-mp', mealSlot: 'breakfast', dayIndex: 1 }] } });
    await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: tokenFor('u-aman'), body: { rows: [{ dishId: 'rasam', mealSlot: 'dinner', dayIndex: 1 }] } });
    const get = await req('GET', `/api/v1/households/${HH_ID}/plans`, { token: tokenFor('u-riya') });
    expect(get.body.dishes).toHaveLength(2);
    const authors = get.body.dishes.map((d: any) => d.authorUserId).sort();
    expect(authors).toEqual(['u-aman', 'u-riya']);
  });

  it('replace-all: a second generation REPLACES my old rows (the table = latest plan exactly)', async () => {
    const t = tokenFor('u-riya');
    await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: t, body: { rows: [{ dishId: 'idli', mealSlot: 'breakfast', dayIndex: 0 }] } });
    await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: t, body: { rows: [{ dishId: 'udupi-sambar', mealSlot: 'lunch', dayIndex: 2 }, { dishId: 'aloo-paratha', mealSlot: 'breakfast', dayIndex: 2 }] } });
    const mine = planStore.filter(r => r.authorUserId === 'u-riya');
    expect(mine).toHaveLength(2); // old idli row gone
    expect(mine.some(r => r.dishId === 'idli')).toBe(false);
    expect(mine.some(r => r.dishId === 'udupi-sambar')).toBe(true);
  });

  it('unauthenticated → 401 (live authMiddleware)', async () => {
    expect((await req('GET', `/api/v1/households/${HH_ID}/plans`)).status).toBe(401);
    expect((await req('PUT', `/api/v1/households/${HH_ID}/plans`, { body: { rows: [] } })).status).toBe(401);
  });

  it('non-member → 403', async () => {
    const r = await req('GET', `/api/v1/households/${HH_ID}/plans`, { token: tokenFor('u-stranger') });
    expect(r.status).toBe(403);
  });

  it('unknown household → 404', async () => {
    const r = await req('GET', '/api/v1/households/nope/plans', { token: tokenFor('u-riya') });
    expect(r.status).toBe(404);
  });

  it('validation: bad mealSlot or dishId → 400', async () => {
    const t = tokenFor('u-riya');
    expect((await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: t, body: { rows: [{ dishId: 'idli', mealSlot: 'brunch', dayIndex: 0 }] } })).status).toBe(400);
    expect((await req('PUT', `/api/v1/households/${HH_ID}/plans`, { token: t, body: { rows: [{ dishId: '', mealSlot: 'lunch', dayIndex: 0 }] } })).status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 · CLIENT: the context builder + penalty through the fill pipeline
// ─────────────────────────────────────────────────────────────────────────────
describe('client household-plan penalty (trayRegen context + fill)', () => {
  afterEach(() => { vi.resetModules(); });

  const seedStore = async (userId: string) => {
    const { useStore } = await import('../app/store/useStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: userId, name: 'Member', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], healthGoals: ['Balanced'] } as any,
      token: 'jwt-ok',
      deviceId: `dev-${userId}`,
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      pendingDietChange: null,
      dietRegen: null,
      householdId: 'hh-client-1',
      swaps: {},
    } as any);
  };

  it('context includes OTHER members\' persisted plan dishes and EXCLUDES my own', async () => {
    const { seedHouseholdPlansForTests } = await import('../app/lib/householdPlans');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    await seedStore('u-me');
    seedHouseholdPlansForTests('hh-client-1', [
      { authorUserId: 'u-me', dishId: 'idli', mealSlot: 'breakfast', dayIndex: 0 },          // MY dish — must NOT appear
      { authorUserId: 'u-riya', dishId: 'dal-tadka-central', mealSlot: 'lunch', dayIndex: 0 }, // co-member — must appear
      { authorUserId: 'u-aman', dishId: 'udupi-sambar', mealSlot: 'dinner', dayIndex: 0 },     // co-member — must appear
    ]);
    const ctx = buildPersonalizationContext();
    expect(ctx!.householdDishes!.some(h => h.id === 'dal-tadka-central')).toBe(true);
    expect(ctx!.householdDishes!.some(h => h.id === 'udupi-sambar')).toBe(true);
    expect(ctx!.householdDishes!.some(h => h.id === 'idli')).toBe(false);
  });

  it('a co-member\'s REAL dish drops below peers in the fill ordering (no share pressed)', async () => {
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    const { seedHouseholdPlansForTests } = await import('../app/lib/householdPlans');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    const { fillCandidatesForSlot } = await import('../utils/mealPlanRegen');
    const { householdPenalty } = await import('../utils/mealPersonalization');
    await seedStore('u-me');
    // dal-tadka-central is a REAL lunch/dinner dish in the library.
    seedHouseholdPlansForTests('hh-client-1', [
      { authorUserId: 'u-riya', dishId: 'dal-tadka-central', mealSlot: 'lunch', dayIndex: 0 },
    ]);
    const ctx = buildPersonalizationContext();
    const pool = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', 'lunch', new Set(), new Set(), 'Balanced', ctx);
    const idxCoMember = pool.findIndex(d => d.id === 'dal-tadka-central');
    const idxPeer = pool.findIndex(d => d.id !== 'dal-tadka-central' && (d.category ?? []).includes('lunch'));
    expect(idxCoMember).toBeGreaterThan(idxPeer);
    // Direct penalty evidence.
    const dal = DISH_LIBRARY.find(d => d.id === 'dal-tadka-central')!;
    expect(householdPenalty(dal, ctx!.householdDishes)).toBeLessThan(0);
  });

  it('members with NOTHING persisted are simply absent (no penalty, no guess)', async () => {
    const { seedHouseholdPlansForTests } = await import('../app/lib/householdPlans');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    await seedStore('u-me');
    seedHouseholdPlansForTests('hh-client-1', []); // household IS loaded but empty
    const ctx = buildPersonalizationContext();
    expect(ctx!.householdDishes).toEqual([]);
  });

  it('tiny pool → household overlap TOLERATED with the honest reason (Λ2.3), 20/20 intact', async () => {
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    const { seedHouseholdPlansForTests } = await import('../app/lib/householdPlans');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    const { regenerateMealPlanPipeline } = await import('../utils/mealPlanRegen');
    await seedStore('u-me');

    // Build a 24-dish constrained library (6 single-category per slot) with 4
    // of the lunch candidates claimed by a co-member — 2 non-overlap < 5 needed.
    const { fillCandidatesForSlot } = await import('../utils/mealPlanRegen');
    const taken = new Set<string>();
    const pick = (slot: 'breakfast' | 'lunch' | 'snacks' | 'dinner', n: number) => {
      const out: any[] = [];
      for (const d of fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set(), undefined, null)) {
        if (taken.has(d.id)) continue;
        const cats = (d.category ?? []).map((c: string) => c.toLowerCase());
        if (cats.length !== 1 || cats[0] !== slot) continue;
        out.push(d); taken.add(d.id);
        if (out.length >= n) break;
      }
      return out;
    };
    const small = [...pick('breakfast', 6), ...pick('lunch', 6), ...pick('snacks', 6), ...pick('dinner', 6)];
    expect(small.length).toBe(24);
    const claimed = small.filter((d: any) => (d.category ?? []).includes('lunch')).slice(0, 4).map((d: any) => ({ id: d.id }));
    seedHouseholdPlansForTests('hh-client-1', claimed.map((c: any, i: number) => ({ authorUserId: 'u-riya', dishId: c.id!, mealSlot: 'lunch', dayIndex: i })));

    const ctx = buildPersonalizationContext();
    const res = regenerateMealPlanPipeline({ tray: { breakfast: [], lunch: [], snacks: [], dinner: [] }, library: small, diet: 'veg', region: 'north', target: 5, personalization: ctx });
    expect(res.complete).toBe(true);
    expect(res.tray.lunch).toHaveLength(5);
    expect(res.reasons.some(r => r.startsWith('household_overlap_tolerated:lunch'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 · HONEST HOUSEHOLD EMPTY STATE (rule 3) — HouseholdPlanItem rows are the
//    ONLY source of "has a plan". Zero rows = "No plan generated this week" — a
//    member's plan is never fabricated client-side, and a non-existent plan
//    is never used as a duplication constraint. Once rows exist, the member
//    joins the household-diversity set.
// ─────────────────────────────────────────────────────────────────────────────
describe('household plan honest-empty state (rule 3)', () => {
  afterEach(() => { vi.resetModules(); });

  const seedStore = async (userId: string) => {
    const { useStore } = await import('../app/store/useStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: userId, name: 'Member', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], healthGoals: ['Balanced'] } as any,
      token: 'jwt-ok',
      deviceId: `dev-${userId}`,
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      pendingDietChange: null,
      dietRegen: null,
      householdId: 'hh-empty-1',
      swaps: {},
    } as any);
  };

  it('rows are grouped by authoring USER — a member with zero rows is simply absent (no guessed plan)', async () => {
    const { groupHouseholdPlanRowsByAuthor } = await import('../components/household/FamilyPlans');
    const grouped = groupHouseholdPlanRowsByAuthor([
      { authorUserId: 'u-riya', dishId: 'idli', mealSlot: 'breakfast', dayIndex: 0 },
      { authorUserId: 'u-riya', dishId: 'rasam', mealSlot: 'dinner', dayIndex: 0 },
    ]);
    expect(Object.keys(grouped)).toEqual(['u-riya']);
    expect(grouped['u-riya']).toHaveLength(2);
    expect(grouped['u-aman']).toBeUndefined(); // zero rows → absent, never fabricated
  });

  it('a dead dishId in a household row resolves to null — the UI renders a dash, never a plausible meal', async () => {
    const { resolveHouseholdPlanDishName } = await import('../components/household/FamilyPlans');
    expect(resolveHouseholdPlanDishName('idli')).toBe('Idli');
    expect(resolveHouseholdPlanDishName('masala-dosa')).toBeNull(); // dead curated id
    expect(resolveHouseholdPlanDishName(undefined)).toBeNull();
  });

  it('FamilyPlans source: renders the honest empty state keyed off the server rows (no client-side generation)', async () => {
    const src = await import('node:fs').then(fs => fs.readFileSync(require.resolve('../components/household/FamilyPlans.tsx'), 'utf8'));
    expect(src).toContain('householdPlanApi.get(household.id)');          // REAL server rows
    expect(src).toContain('No plan generated this week');                 // THE exact honest-empty copy (rule 3)
    expect(src).not.toMatch(/import.*memberPlan/);                       // no fabricated mirror-plan import
    expect(src).not.toContain('saveLane');                                // no auto-persist of guesses
  });

  it('diversity penalty uses ONLY persisted rows: zero-row members contribute nothing, row members do', async () => {
    const { seedHouseholdPlansForTests } = await import('../app/lib/householdPlans');
    const { buildPersonalizationContext } = await import('../utils/trayRegen');
    await seedStore('u-me');
    // u-riya has a persisted plan; u-aman has NOTHING (never generated).
    seedHouseholdPlansForTests('hh-empty-1', [
      { authorUserId: 'u-riya', dishId: 'udupi-sambar', mealSlot: 'dinner', dayIndex: 0 },
    ]);
    const ctx = buildPersonalizationContext();
    expect(ctx!.householdDishes!.some(h => h.id === 'udupi-sambar')).toBe(true);  // row member included
    // Nothing fabricated for u-aman: no dish id could have come from them.
    const fromAman = ctx!.householdDishes!.filter(h => h.id && h.id.startsWith('aman-'));
    expect(fromAman).toEqual([]);
  });

  it('FamilyPlans no longer auto-generates client-side lanes for every member (the fabrication path is gone)', async () => {
    const src = await import('node:fs').then(fs => fs.readFileSync(require.resolve('../components/household/FamilyPlans.tsx'), 'utf8'));
    expect(src).not.toContain('useHouseholdKitchenStore');
    expect(src).not.toContain('saveLane(hhId');
  });
});

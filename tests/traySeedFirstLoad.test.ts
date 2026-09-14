// ─────────────────────────────────────────────────────────────────────────────
// #185 FIRST-LOAD SEED 400 REGRESSION — the pantry/tray seed chain (2026-09-13)
//
// User report: FIRST landing only — dashboard blank + React error #185 after
//   [App] Seeded pantry with 14 staples …
//   four × POST /tray/slot/2026-09-13/{breakfast,snacks,lunch,dinner}/items
//   → 400 (Bad Request) + "[TrayApi] addSlotItem failed, using fallback".
//   Reload works (the seed does not re-run on a hydrated store).
//
// Root cause (proven file:line in this suite):
//   App.tsx Phase-3 seed → trayStore.addMealToSlot (useTrayStore.ts:207) →
//   debounced mealRepository.addSlotItem({ meal_id, quantity, defaults })
//   (useTrayStore.ts:359) → trayApi.addSlotItem POSTs the SNAKE_CASE meal_id
//   (trayApi.ts addSlotItem) → server TrayItemSchema.parse validates CAMELCASE
//   mealId/customDishId (server/src/routes/tray.ts:11-24,292) → zod strips the
//   unknown meal_id → refine (mealId || customDishId) fails → 400
//   "Invalid payload". THE EXACT MISSING FIELD IS mealId.
//   trayApi.addSlotItem then LIED (fake success fallback, fabricated id) so
//   saveStatus went 'saved' on a failed write and the offline drain reported
//   failed adds as synced — no honest terminal signal for the seed/pantry
//   effects, the #185 setState-in-effect churn.
//
// Fixes pinned here:
//   1. trayApi.addSlotItem translates meal_id → mealId (+ gravy/roti/rice/
//      sides/beverages) at the ONE choke point (seed debounce, MealRepository,
//      offline drain).
//   2. addSlotItem NO longer fake-succeeds: the real 400 propagates; callers
//      mark saveStatus 'error' (terminal) and the offline drain retries ≤3×
//      then drops — bounded, never a silent "synced" lie.
//   3. Offline drain rebuilds slotId from {date, mealType} (was undefined →
//      TypeError → lost adds).
//   4. seedPreflight (app/boot/seedGate.ts) blocks the seed until hydration +
//      user/profile — the SAME hasHydrated() booleans as the f44cc41 gate
//      (App.tsx Phase-3 call site + single-flight/terminal refs source-pinned).
//   5. Server zod 400 names the field ('Invalid payload: …' via zodErrorSummary).
//
// HARNESS HONESTY: vitest runs 'node' (no DOM) — a render-side #185 cannot be
// reproduced here. The loop is pinned with STATIC source assertions + a
// REAL-store mutation-bound simulation (fresh boot → 4-slot seed → 400s →
// mutations settle; no re-arm).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { getISODate } from '../utils/dateUTC';
import type { Meal } from '../types/tray';

const okJson = (body: Record<string, unknown> = {}) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const serverErr = (status: number, msg: string) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error: msg }) });

function readSource(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

const makeMeal = (id: string, name: string, icon = '🍽️'): Meal => ({
  id, name, icon, region: 'central', category: ['lunch'],
});

// ─── Part A — trayApi contract translation + honest failure ────────────────
describe('trayApi.addSlotItem — server contract (mealId, never meal_id)', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => { originalFetch = globalThis.fetch; localStorage.clear(); vi.resetModules(); });
  afterEach(() => { globalThis.fetch = originalFetch; localStorage.clear(); vi.resetModules(); });

  it('POSTs CAMELCASE mealId with quantity + defaults mapped (the reload-outcome contract)', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    globalThis.fetch = vi.fn(async (u: string, init?: RequestInit) => {
      calls.push({ url: String(u), body: JSON.parse(String(init?.body)) });
      return okJson({ id: 'item-1' });
    }) as unknown as typeof fetch;
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const { trayApi } = await import('../app/lib/trayApi');

    const res = await trayApi.addSlotItem('2026-09-13::breakfast', {
      meal_id: 'poha-mp',
      quantity: 2,
      defaults: { name: 'Poha', icon: '🍚', gravy: 'Curry', roti: 'Paratha', rice: 'Plain', sides: ['Peanuts'], beverages: ['Chai'], dessert: [] },
    });

    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('/api/v1/tray/slot/2026-09-13/breakfast/items');
    const b = calls[0]!.body;
    expect(b.mealId).toBe('poha-mp');
    expect(b.meal_id).toBeUndefined(); // snake_case can never reach the server again
    expect(b.quantity).toBe(2);
    expect(b.gravyStyle).toBe('Curry');
    expect(b.rotiType).toBe('Paratha');
    expect(b.sides).toEqual(['Peanuts']);
    expect(b.beverages).toEqual(['Chai']);
  });

  it('a 400 → REJECTS with the real reason (the old fake-success lie is gone)', async () => {
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required')) as unknown as typeof fetch;
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const { trayApi } = await import('../app/lib/trayApi');

    const outcome = trayApi.addSlotItem('2026-09-13::lunch', { meal_id: 'rajma-chawal', quantity: 1 })
      .then(() => 'resolved', (e: Error) => e);
    const err = await outcome;

    expect(err).toBeInstanceOf(Error);
    expect((err as { status?: number }).status).toBe(400);
    expect((err as Error).message).toContain('Invalid payload');
    expect((err as Error).message).toContain('mealId'); // the server names the field
  });
});

// ─── Part B — seedPreflight: seed runs ONLY after hydration + user ─────────
describe('seedPreflight (app/boot/seedGate.ts) — honest hasHydrated booleans', () => {
  it('blocks when either store has not hydrated, or user/region are absent', async () => {
    const { seedPreflight } = await import('../app/boot/seedGate');
    expect(seedPreflight({ useStoreHydrated: false, trayStoreHydrated: true, hasUser: true, hasRegion: true }))
      .toEqual({ ok: false, reason: 'store-not-hydrated' });
    expect(seedPreflight({ useStoreHydrated: true, trayStoreHydrated: false, hasUser: true, hasRegion: true }))
      .toEqual({ ok: false, reason: 'tray-store-not-hydrated' });
    expect(seedPreflight({ useStoreHydrated: true, trayStoreHydrated: true, hasUser: false, hasRegion: true }))
      .toEqual({ ok: false, reason: 'no-user' });
    expect(seedPreflight({ useStoreHydrated: true, trayStoreHydrated: true, hasUser: true, hasRegion: false }))
      .toEqual({ ok: false, reason: 'no-region' });
  });

  it('passes only when both stores hydrated + user + region (the reload preconditions)', async () => {
    const { seedPreflight } = await import('../app/boot/seedGate');
    expect(seedPreflight({ useStoreHydrated: true, trayStoreHydrated: true, hasUser: true, hasRegion: true }))
      .toEqual({ ok: true });
  });
});

describe('#185 render-side guards — static source pins', () => {
  it('Phase-3 seed uses seedPreflight with the EXISTING hasHydrated() booleans + in-flight flag', () => {
    const app = readSource('App.tsx');
    const phase3 = app.slice(app.indexOf('ORDERING GATE (#185'), app.indexOf('First-time onboarding error'));
    expect(phase3).toContain('seedPreflight(');
    expect(phase3).toContain('useStore.persist.hasHydrated()');
    expect(phase3).toContain('useTrayStore.persist.hasHydrated()');
    expect(phase3).toContain('_seedInFlight.current = true');
    expect(phase3).toContain('no tray writes, no addSlotItem POSTs');
  });

  it('seed is single-flight + terminal per mount (refs + finally — never re-armed)', () => {
    const app = readSource('App.tsx');
    expect(app).toContain('const _seedInFlight = useRef(false);');
    expect(app).toContain('const _seedRan = useRef(false);');
    // unique refs — the finally block that terminates the seed chain
    expect(app).toContain('_seedInFlight.current = false;');
    expect(app).toContain('_seedRan.current = true;');
    expect(app).toContain('reload is the recovery path for a failed seed');
  });

  it('trayApi.addSlotItem has NO fake-success fallback and translates meal_id → mealId', () => {
    const tray = readSource('app/lib/trayApi.ts');
    const add = tray.slice(tray.indexOf('async addSlotItem'), tray.indexOf('async updateItem'));
    expect(add).not.toContain('using fallback');
    expect(add).toContain('mealId: payload.meal_id');
    expect(add).toContain('NO fake-success fallback');
  });

  it('offline drain rebuilds slotId from {date, mealType} for queued adds', () => {
    const tray = readSource('app/lib/trayApi.ts');
    const drain = tray.slice(tray.indexOf('case \'add\':'), tray.indexOf('case \'swap\':'));
    expect(drain).toContain("`${p.date}::${p.mealType}`");
  });

  it('server zod 400 names the field via zodErrorSummary in every tray route', () => {
    const srv = readSource('server/src/routes/tray.ts');
    expect(srv).toContain('function zodErrorSummary');
    expect(srv.match(/zodErrorSummary\(error\)/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
  });
});

// ─── Part C — fresh-boot simulation: seed chain 400s are TERMINAL ──────────
describe('fresh-boot seed — 400s surface honestly, mutations settle (no #185 re-arm)', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    vi.resetModules();
    vi.stubGlobal('navigator', { onLine: true });
    vi.useFakeTimers();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  async function bootFresh() {
    const { useStore } = await import('../app/store/useStore');
    const { useTrayStore } = await import('../plan/store/useTrayStore');
    const { buildPlanIndex } = await import('../plan/utils/planIndex');
    // Fresh first-load state: logged-in user WITH region (onboarding completed
    // above), empty tray + empty plan + no saveStatus (the pre-seed world).
    useStore.setState({
      isLoggedIn: true, authReady: true, token: 'tok-fresh',
      user: { id: 'u-fresh', username: 'Fresh', diet: 'veg', region: 'Central India', onboardingComplete: true, pantryStaples: [] } as any,
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      trayBuilt: false, swaps: {}, customDishes: [], householdId: null, toast: null,
    } as any);
    useTrayStore.setState({
      plan: { period: 'week', days: {}, _planIndex: buildPlanIndex({}) },
      guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
      swapHistory: [], saveStatus: {}, templates: [], completions: {}, skipped: {},
    } as any);
    return { useStore, useTrayStore };
  }

  it('4-slot seed vs a 400 server: every add lands saveStatus "error" (terminal) and store mutations settle', async () => {
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required')) as unknown as typeof fetch;
    const { useTrayStore } = await bootFresh();
    const { clearAllDebounceTimers } = await import('../plan/utils/trayDebounce');
    clearAllDebounceTimers();

    let mutations = 0;
    const unsub = useTrayStore.subscribe(() => { mutations++; });

    // The seed chain's core write: one addMealToSlot per planned slot.
    const today = getISODate();
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      useTrayStore.getState().addMealToSlot(today, slot, makeMeal(`${slot}-dish`, `${slot} Dish`));
    }

    // Debounce (1s) + MealRepository retry sleeps (1s, 2s) — everything fired.
    await vi.advanceTimersByTimeAsync(6000);

    const st = useTrayStore.getState();
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const items = st.plan.days[today]?.[slot] ?? [];
      expect(items).toHaveLength(1);
      expect(st.saveStatus[items[0]!.id]).toBe('error'); // terminal, honest — NEVER 'saved'
    }

    // POST attempts are BOUNDED: 4 slots × (1 + 2 retries) = 12 max.
    const addCalls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(c => String(c[0])).filter(u => u.includes('/tray/slot/'));
    expect(addCalls.length).toBe(12);

    // Store quiescence: no further mutations after the settled burst.
    const settled = mutations;
    await vi.advanceTimersByTimeAsync(6000);
    expect(mutations).toBe(settled);
    unsub();
  });

  it('4-slot seed vs a healthy server: exactly 4 add POSTs, camelCase payloads, saveStatus "saved" — the reload outcome', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = vi.fn(async (u: string, init?: RequestInit) => {
      if (String(u).includes('/tray/slot/')) bodies.push(JSON.parse(String(init?.body)));
      return okJson({ id: 'item-ok' });
    }) as unknown as typeof fetch;
    const { useTrayStore } = await bootFresh();
    const { clearAllDebounceTimers } = await import('../plan/utils/trayDebounce');
    clearAllDebounceTimers();

    const today = getISODate();
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      useTrayStore.getState().addMealToSlot(today, slot, makeMeal(`${slot}-dish`, `${slot} Dish`));
    }
    await vi.advanceTimersByTimeAsync(6000);

    expect(bodies).toHaveLength(4); // exactly one POST per slot — no re-armed storm
    for (const b of bodies) {
      expect(b.mealId).toBeTruthy();
      expect(b.meal_id).toBeUndefined();
      expect(b.quantity).toBe(1);
    }
    const st = useTrayStore.getState();
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const items = st.plan.days[today]?.[slot] ?? [];
      expect(st.saveStatus[items[0]!.id]).toBe('saved');
    }
  });
});

// ─── Part D — offline drain: slotId rebuild + bounded retries, then drop ───
describe('offline queue drain — failed adds are bounded, never "synced" lies', () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => { originalFetch = globalThis.fetch; localStorage.clear(); vi.resetModules(); });
  afterEach(() => { globalThis.fetch = originalFetch; localStorage.clear(); vi.resetModules(); });

  it('queued {date, mealType, item} add drains to the CORRECT route; a 400 retries ≤3× then drops', async () => {
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required')) as unknown as typeof fetch;
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const { offlineQueue } = await import('../app/lib/trayApi');

    offlineQueue.clear();
    offlineQueue.add({
      type: 'add',
      payload: { date: '2026-09-13', mealType: 'lunch', item: { meal_id: 'rajma-chawal', quantity: 1 } },
    });
    expect(offlineQueue.get()).toHaveLength(1);

    // Drain 1-3: retryCount increments, entry kept (retryable).
    for (let i = 1; i <= 3; i++) {
      const r = await offlineQueue.drain();
      expect(r.retryable).toBe(1);
      expect(offlineQueue.get()).toHaveLength(1);
      expect(offlineQueue.get()[0]!.retryCount).toBe(i);
    }

    // Drain 4: exhausted → dropped. Bounded — the queue can never grow forever.
    const last = await offlineQueue.drain();
    expect(last.failed).toBe(1);
    expect(offlineQueue.get()).toHaveLength(0);

    // Every attempt hit the real route (the slotId rebuild) — never a TypeError.
    const addCalls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map(c => String(c[0])).filter(u => u.includes('/tray/slot/'));
    expect(addCalls).toHaveLength(4);
    for (const u of addCalls) expect(u).toBe('/api/v1/tray/slot/2026-09-13/lunch/items');
  });
});

// ─── Part E — server POST /items: P2028 interactive-tx structurally GONE ──
// 2026-09-13 log evidence (this report's discriminant):
//   prisma:error Invalid `tx.trayItem.create()` invocation in
//     /Users/prateekposwal/MD-App/server/src/routes/tray.ts:327:41
//   Transaction API error: Transaction already closed: … timeout for this
//     transaction was 5000 ms, however 5408 ms passed … code: 'P2028'
//   POST /slot/2026-09-13/breakfast/items 500 5930ms
// The OLD POST path held SIX awaited round-trips inside an interactive
// $transaction(async tx => …) — on cold Neon compute the first-load seed's 4
// parallel POSTs each blew the 5s interactive budget → P2028 → HTTP 500
// (reload clean: seed skipped, no POSTs). The NEW path must be: traySlot
// UPSERT (idempotent, one round-trip) + count + findFirst + $transaction([…])
// ARRAY form (atomic create+version batch, ONE submit, no interactive timer).
// Constraints/FK unchanged — never weakened; failures still propagate.
// ─────────────────────────────────────────────────────────────────────────────
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { buildTrayApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const trayDb = vi.hoisted(() => {
  const slots: any[] = [];
  const slotByKey = new Map<string, any>();
  const items: any[] = [];
  const interactiveTxCalls: number[] = [];
  let slotSeq = 0;
  let itemSeq = 0;
  let latencyMs = 0;

  const delay = () => (latencyMs ? new Promise(r => setTimeout(r, latencyMs)) : Promise.resolve());

  const prismaMock = {
    reset() {
      slots.length = 0; slotByKey.clear(); items.length = 0;
      interactiveTxCalls.length = 0; slotSeq = 0; itemSeq = 0; latencyMs = 0;
    },
    setLatency(ms: number) { latencyMs = ms; },
    slotCount: () => slots.length,
    itemCount: () => items.length,
    slotVersion: () => slots[0]?.version ?? 0,
    interactiveTxCalls,
    traySlot: {
      upsert: async ({ where, update, create }: any) => {
        await delay();
        const k = `${where.userId_date_slot.userId}|${where.userId_date_slot.date}|${where.userId_date_slot.slot}`;
        const existing = slotByKey.get(k);
        if (existing) return { ...existing, ...update }; // idempotent retry absorption
        const row = { id: `slot-${++slotSeq}`, userId: create.userId, date: create.date, slot: create.slot, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        slots.push(row); slotByKey.set(k, row);
        return row;
      },
      update: async ({ where, data }: any) => {
        await delay();
        const row = slots.find(s => s.id === where.id);
        if (!row) throw new Error('TraySlot not found');
        row.version += (data.version?.increment ?? 0);
        row.updatedAt = new Date().toISOString();
        return { ...row };
      },
      findUnique: async () => null,
      create: async ({ data }: any) => { await delay(); const row = { id: `slot-${++slotSeq}`, ...data, version: 1 }; slots.push(row); return row; },
      deleteMany: async () => 0,
    },
    trayItem: {
      count: async ({ where }: any) => { await delay(); return items.filter(i => i.traySlotId === where.traySlotId).length; },
      findFirst: async ({ where }: any) => {
        await delay();
        const list = items.filter(i => i.traySlotId === where.traySlotId);
        if (!list.length) return null;
        return [...list].sort((a, b) => (b.sortOrder ?? -1) - (a.sortOrder ?? -1))[0];
      },
      create: async ({ data, include }: any) => {
        await delay();
        const row: any = {
          id: `item-${++itemSeq}`, traySlotId: data.traySlotId, mealId: data.mealId ?? null,
          customDishId: data.customDishId ?? null, quantity: data.quantity, gravyStyle: data.gravyStyle,
          rotiType: data.rotiType, riceType: data.riceType, sides: data.sides ?? [], beverages: data.beverages ?? [],
          requestedBy: data.requestedBy ?? null, sortOrder: data.sortOrder,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        if (include?.meal) row.meal = { id: data.mealId, name: 'Poha', icon: '🍚' };
        if (include?.customDish && data.customDishId) row.customDish = { id: data.customDishId, name: 'Custom' };
        items.push(row);
        return row;
      },
      findUnique: async () => null,
      update: async () => null,
      delete: async () => null,
      deleteMany: async () => 0,
    },
    $transaction: async (queriesOrFn: any) => {
      if (Array.isArray(queriesOrFn)) {
        // ARRAY form — Prisma executes the batch in a single submit with NO
        // interactive 5s budget. Executed here sequentially (same semantics).
        const results = [];
        for (const q of queriesOrFn) results.push(await q);
        return results;
      }
      // Interactive form = the P2028 class. ANY call = the fix regressed.
      interactiveTxCalls.push(1);
      throw new Error('interactive $transaction used — P2028 class (fix regressed)');
    },
  };
  return { prismaMock };
});

vi.mock('../server/src/lib/prisma', () => ({ prisma: trayDb.prismaMock }));

const trayApp = buildTrayApp();
let trayServer: Server;
let trayBase = '';

beforeAll(async () => {
  await new Promise<void>(resolve => {
    trayServer = trayApp.listen(0, '127.0.0.1', () => {
      trayBase = `http://127.0.0.1:${(trayServer.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>(resolve => trayServer.close(() => resolve()));
});

const trayToken = (userId: string) =>
  generateAccessToken({ userId, email: `${userId}@test.local`, phone: null, name: 'User' });

async function trayReq(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await fetch(`${trayBase}${path}`, {
    method,
    headers: {
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, body: await res.json() as any };
}

const itemBody = (mealId: string) => ({ mealId, quantity: 1 });

describe('POST /api/v1/tray/slot/:date/:slot/items — P2028 structural pins', () => {
  it('static: the create path has NO interactive $transaction(async; upsert + ARRAY form in place', () => {
    const srv = readSource('server/src/routes/tray.ts');
    const itemsHandler = srv.slice(
      srv.indexOf("router.post('/slot/:date/:slot/items'"),
      srv.indexOf('// Update tray item'),
    );
    expect(itemsHandler.match(/\$transaction\(async/g) ?? []).toHaveLength(0);
    expect(itemsHandler).toContain('traySlot.upsert(');
    expect(itemsHandler).toContain('update: {}'); // idempotent create-if-missing no-op
    expect(itemsHandler).toContain('prisma.$transaction([');
    expect(itemsHandler).toContain('trayItem.create({');
    expect(itemsHandler).toContain('version: { increment: 1 }');
  });

  it('runtime: the interactive $transaction mock is NEVER invoked; array form carries create+version atomically', async () => {
    trayDb.prismaMock.reset();
    const t = trayToken('u-p2028');
    const r = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/breakfast/items', { token: t, body: itemBody('poha-mp') });
    expect(r.status).toBe(200);
    expect(r.body.id).toMatch(/^item-/);
    expect(r.body.meal?.name).toBe('Poha');
    expect(trayDb.prismaMock.interactiveTxCalls).toHaveLength(0); // P2028 class dead
    expect(trayDb.prismaMock.slotCount()).toBe(1);
    expect(trayDb.prismaMock.itemCount()).toBe(1);
    expect(trayDb.prismaMock.slotVersion()).toBe(2); // 1 → 2: bump commits ATOMICALLY with the item
  });

  it('second POST to the SAME slot: upsert absorbs (still ONE slot), sortOrder advances, version bumps', async () => {
    trayDb.prismaMock.reset();
    const t = trayToken('u-p2028b');
    await trayReq('POST', '/api/v1/tray/slot/2026-09-13/lunch/items', { token: t, body: itemBody('rajma-chawal') });
    const r2 = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/lunch/items', { token: t, body: itemBody('dal-makhani') });
    expect(r2.status).toBe(200);
    expect(r2.body.sortOrder).toBe(1);
    expect(trayDb.prismaMock.slotCount()).toBe(1); // idempotent upsert — no duplicate slot
    expect(trayDb.prismaMock.itemCount()).toBe(2);
    expect(trayDb.prismaMock.slotVersion()).toBe(3); // second POST bumps 2 → 3
  });

  it('SLOT_CROWDED gate is PRESERVED: a 6th item 400s and nothing is written', async () => {
    trayDb.prismaMock.reset();
    const t = trayToken('u-crowd');
    await trayReq('POST', '/api/v1/tray/slot/2026-09-13/dinner/items', { token: t, body: itemBody('daal') });
    // Fill to 5 directly in the (mocked) store — the gate reads the count.
    const slotId = 'slot-1';
    const itemsArr = trayDb.prismaMock as unknown as { trayItem: { create: (a: any) => Promise<any> } };
    for (let i = 0; i < 4; i++) {
      await itemsArr.trayItem.create({ data: { traySlotId: slotId, mealId: `filled-${i}`, quantity: 1, sortOrder: i + 1 } });
    }
    const r = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/dinner/items', { token: t, body: itemBody('sixth') });
    expect(r.status).toBe(400);
    expect(r.body.error?.code).toBe('SLOT_CROWDED');
    expect(trayDb.prismaMock.itemCount()).toBe(5); // nothing extra written
    expect(trayDb.prismaMock.slotVersion()).toBe(2); // blocked write: NO bump past the first POST's 2
  });

  it('slow-prisma proof: with ~1.4s/query, one item write completes PAST the old 5s interactive budget — 200, not P2028', async () => {
    trayDb.prismaMock.reset();
    trayDb.prismaMock.setLatency(1400);
    const t = trayToken('u-slow');
    const start = Date.now();
    const r = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/breakfast/items', { token: t, body: itemBody('slow-dish') });
    const elapsed = Date.now() - start;
    // 4 round-trips × 1.4s = 5.6s (the array-form batch is ONE submit) — the
    // OLD interactive tx would have died
    // at 5.0s (P2028, the logged 500). The new non-interactive path simply
    // finishes: each query has its own latency, no cumulative budget.
    expect(r.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(5000);
    expect(elapsed).toBeLessThan(8000);
    expect(trayDb.prismaMock.interactiveTxCalls).toHaveLength(0);
    expect(trayDb.prismaMock.itemCount()).toBe(1);
  }, 15000);
});

// ─── Part F — client first-load seed: addSlotItem POSTs are SERIALIZED ─────
describe('addSlotItem serialization — cold-compute first-load single-flight', () => {
  it('static: addSlotItem wraps the POST in serializeSlotPost (module-level chain)', () => {
    const tray = readSource('app/lib/trayApi.ts');
    const add = tray.slice(tray.indexOf('async addSlotItem'), tray.indexOf('async updateItem'));
    expect(add).toContain('serializeSlotPost(');
    const header = tray.slice(0, tray.indexOf('// ─── Offline Queue'));
    expect(header).toContain('let slotPostChain: Promise<unknown> = Promise.resolve();');
    expect(header).toContain('slotPostChain = run.then(() => undefined, () => undefined)');
  });

  it('two concurrent addSlotItem calls: at most ONE POST in flight; first caller drains first', async () => {
    let active = 0;
    let maxActive = 0;
    const order: string[] = [];
    globalThis.fetch = vi.fn(async (u: string) => {
      active++;
      maxActive = Math.max(maxActive, active);
      order.push(String(u));
      await new Promise(r => setTimeout(r, 20));
      active--;
      return okJson({ id: `item-${order.length}` });
    }) as unknown as typeof fetch;
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const { trayApi } = await import('../app/lib/trayApi');

    await Promise.all([
      trayApi.addSlotItem('2026-09-13::breakfast', { meal_id: 'b-poha', quantity: 1 }),
      trayApi.addSlotItem('2026-09-13::lunch', { meal_id: 'l-rajma', quantity: 1 }),
    ]);
    expect(maxActive).toBe(1);                       // never two slot POSTs in flight
    expect(order[0]).toContain('/breakfast/items');  // deterministic first-caller-first
    expect(order[1]).toContain('/lunch/items');
  });

  it('a failing POST does NOT wedge the chain — the next POST fires and succeeds (nothing swallowed)', async () => {
    let calls = 0;
    globalThis.fetch = vi.fn(async (u: string) => {
      calls++;
      if (calls === 1) return serverErr(400, 'Invalid payload: Either mealId or customDishId is required');
      return okJson({ id: 'item-2' });
    }) as unknown as typeof fetch;
    const { setAuthReady } = await import('../lib/api');
    setAuthReady(true);
    const { trayApi } = await import('../app/lib/trayApi');

    // BOTH fired concurrently — the chain serializes them; the first call's
    // rejection must NOT wedge the queued second call.
    const outcomes = await Promise.all([
      trayApi.addSlotItem('2026-09-13::breakfast', { meal_id: 'b', quantity: 1 })
        .then(v => ({ status: 'ok' as const, v }), (e: Error) => ({ status: 'err' as const, e })),
      trayApi.addSlotItem('2026-09-13::lunch', { meal_id: 'l', quantity: 1 })
        .then(v => ({ status: 'ok' as const, v }), (e: Error) => ({ status: 'err' as const, e })),
    ]);

    expect(outcomes[0]!.status).toBe('err');             // honest propagation of the 400 — NOT faked
    expect((outcomes[0] as { e: Error }).e).toBeInstanceOf(Error);
    expect(outcomes[1]!.status).toBe('ok');              // chain advanced past the failure
    expect((outcomes[1] as { v: { item_id: string } }).v.item_id).toBe('item-2');
    expect(calls).toBe(2);
  });
});

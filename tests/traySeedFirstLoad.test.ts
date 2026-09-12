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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { getISODate } from '../utils/dateUTC';

const okJson = (body: Record<string, unknown> = {}) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

const serverErr = (status: number, msg: string) =>
  Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error: msg }) });

function readSource(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

const makeMeal = (id: string, name: string, icon = '🍽️') => ({
  id, name, icon, region: 'Central India' as const, category: ['lunch'],
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
    });
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
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required'));
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
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required'));
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
    });
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
    globalThis.fetch = vi.fn(async () => serverErr(400, 'Invalid payload: Either mealId or customDishId is required'));
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

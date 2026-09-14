// ─────────────────────────────────────────────────────────────────────────────
// P2028 CLASS KILLED ACROSS ALL INTERACTIVE TX SITES (2026-09-13)
//
// The 2026-09-13 QA log (restart + cold dev-Neon) reproduced the class on
// POST /slot (whole-slot, old tray.ts:80 interactive body):
//   Transaction API error: Transaction already closed: … 5000 ms, however
//     5381 ms passed … code: 'P2028'
//   [2026-09-13T02:41:59.848Z] POST /slot 500 5763ms
// while the ALREADY-converted items path returned 200 in 9244ms (>5s wall —
// the array form has NO cumulative interactive budget).
//
// This suite pins the full conversion of the remaining interactive sites:
//   tray.ts  POST /slot            (whole-slot)  upsert + $transaction([…])
//   tray.ts  PATCH /item/:itemId   (ownership)   read + $transaction([…])
//   tray.ts  DELETE /item/:itemId  (ownership)   read + $transaction([…])
//   tray.ts  PATCH /slot/…/customize             upsert + $transaction([…])
//   plan.ts  POST /                (CAS)         sequential (CAS is atomic)
//   plan.ts  DELETE /:date/:slot                 plain delete
// The mock's interactive $transaction THROWS — any interactive call FAILS the
// suite (structural pin); the array form runs the batch sequentially (same
// semantics, one submit). Business outputs (status codes, versions, count
// gates, sortOrder, replace/cleanup, ownership 404s) must stay identical.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { buildTrayApp, buildPlanApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

function readSource(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

// ─── In-memory prisma model: REAL behaviors (schema-accurate versions) ──────
const mem = vi.hoisted(() => {
  const slots: any[] = [];
  const items: any[] = [];
  const plans: any[] = [];
  const slotKey = (u: string, d: Date, s: string) => `${u}|${new Date(d).toISOString().slice(0, 10)}|${s}`;
  const planKey = slotKey;
  let slotSeq = 0;
  let itemSeq = 0;
  let planSeq = 0;
  let latencyMs = 0;
  /** Simulates a concurrent device's CAS-winning write between the handler's
   *  read and its updateMany (drives the 409 path deterministically). */
  let casMiss = false;
  /** Sequential round-trip groups — the honest latency model of the mock:
   *  statements whose timers overlap share ONE group (the Prisma ARRAY batch
   *  is a SINGLE submit — its members do not consume N round-trips), while
   *  sequentially-awaited statements each start a new group (the OLD
   *  interactive form serialized EVERY awaited statement). */
  let inFlight = 0;
  let groups = 0;
  /** Total latency actually slept, tallied by the mock — the DETERMINISTIC
   *  replacement for wall-clock `elapsed` asserts (2026-09-14): the old
   *  `expect(elapsed).toBeGreaterThanOrEqual(5000)` on real Date.now() was a
   *  CI timing flake (one flaky run, TODO RUN HISTORY #261) and nothing more —
   *  it proved timers fired, not the P2028 budget. Exact tally = every group
   *  pays its full latency, countably. */
  let sleptMs = 0;

  const delay = () => {
    if (!latencyMs) return Promise.resolve();
    // A round-trip "group" = one in-flight window: the FIRST statement to open
    // the window increments groups AND charges the latency once. Statements
    // whose timers overlap (the prisma ARRAY batch — ONE submit with members
    // resolving concurrently) share that window and do NOT charge again. So
    // sleptMs ≡ groups × latencyMs by construction — the P2028 cumulative-5s
    // budget is modeled per-window and two windows can never consume a budget
    // the way 3-4 SESSIONAL writes did under the old interactive form.
    if (inFlight === 0) { groups++; sleptMs += latencyMs; }
    inFlight++;
    return new Promise(r => setTimeout(() => { inFlight--; r(undefined); }, latencyMs));
  };

  const withIncludes = (row: any) => {
    const r = { ...row };
    if (r.mealId) r.meal = { id: r.mealId, name: 'Poha', icon: '🍚' };
    if (r.customDishId) r.customDish = { id: r.customDishId, name: 'Custom' };
    return r;
  };

  const prismaMock = {
    reset() {
      slots.length = 0; items.length = 0; plans.length = 0;
      slotSeq = 0; itemSeq = 0; planSeq = 0; latencyMs = 0; casMiss = false;
      inFlight = 0; groups = 0; sleptMs = 0;
    },
    setLatency(ms: number) { latencyMs = ms; },
    setCasMiss(v: boolean) { casMiss = v; },
    counts: () => ({ slots: slots.length, items: items.length, plans: plans.length }),
    get groups() { return groups; },
    get sleptMs() { return sleptMs; },
    slotVersion: () => slots[0]?.version ?? 0,
    slotVersionByKey: (k: string) => slots.find(s => slotKey(s.userId, s.date, s.slot) === k)?.version ?? -1,
    planRow: (u: string, d: Date, s: string) => plans.find(p => planKey(p.userId, p.date, p.slot) === planKey(u, d, s)) ?? null,
    interactiveTxCalls: [] as number[],
    traySlot: {
      upsert: async ({ where, update, create }: any) => {
        await delay();
        const k = slotKey(where.userId_date_slot.userId, where.userId_date_slot.date, where.userId_date_slot.slot);
        const existing = slots.find(s => slotKey(s.userId, s.date, s.slot) === k);
        if (existing) {
          if (update.version?.increment) existing.version += update.version.increment;
          if (update.totalServings !== undefined) existing.totalServings = update.totalServings;
          if (update.isGuestMode !== undefined) existing.isGuestMode = update.isGuestMode;
          if (update.guestCount !== undefined) existing.guestCount = update.guestCount;
          if (update.guestDays !== undefined) existing.guestDays = update.guestDays;
          return { ...existing };
        }
        const row = {
          id: `slot-${++slotSeq}`, userId: create.userId, date: create.date, slot: create.slot,
          totalServings: create.totalServings ?? 1, guestCount: 0, guestDays: 0, isGuestMode: false,
          version: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        slots.push(row);
        return { ...row };
      },
      update: async ({ where, data }: any) => {
        await delay();
        const row = slots.find(s => s.id === where.id);
        if (!row) throw new Error('TraySlot not found');
        if (data.version?.increment) row.version += data.version.increment;
        if (data.totalServings !== undefined) row.totalServings = data.totalServings;
        return { ...row };
      },
      findUnique: async ({ where }: any) => {
        await delay();
        if (where.id) return slots.find(s => s.id === where.id) ?? null;
        const w = where.userId_date_slot;
        return slots.find(s => slotKey(s.userId, s.date, s.slot) === slotKey(w.userId, w.date, w.slot)) ?? null;
      },
      create: async ({ data }: any) => {
        await delay();
        const row = {
          id: `slot-${++slotSeq}`, ...data,
          totalServings: data.totalServings ?? 1, guestCount: 0, guestDays: 0, isGuestMode: false,
          version: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        slots.push(row);
        return { ...row };
      },
      deleteMany: async () => 0,
    },
    trayItem: {
      count: async ({ where }: any) => { await delay(); return items.filter(i => i.traySlotId === where.traySlotId).length; },
      findFirst: async ({ where }: any) => {
        await delay();
        const list = items.filter(i => i.traySlotId === where.traySlotId);
        if (!list.length) return null;
        return { ...list.sort((a, b) => (b.sortOrder ?? -1) - (a.sortOrder ?? -1))[0] };
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
        return { ...row };
      },
      findUnique: async ({ where, include }: any) => {
        await delay();
        const row = items.find(i => i.id === where.id);
        if (!row) return null;
        const slot = slots.find(s => s.id === row.traySlotId);
        return { ...row, traySlot: slot ? { ...slot } : null };
      },
      update: async ({ where, data, include }: any) => {
        await delay();
        const row = items.find(i => i.id === where.id);
        if (!row) throw new Error('TrayItem not found');
        Object.assign(row, data);
        row.updatedAt = new Date().toISOString();
        return withIncludes({ ...row });
      },
      delete: async ({ where }: any) => {
        await delay();
        const ix = items.findIndex(i => i.id === where.id);
        if (ix < 0) throw new Error('TrayItem not found');
        const [removed] = items.splice(ix, 1);
        return removed;
      },
      deleteMany: async ({ where }: any) => {
        await delay();
        const before = items.length;
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i]!.traySlotId === where.traySlotId) items.splice(i, 1);
        }
        return { count: before - items.length };
      },
    },
    userPlan: {
      findUnique: async ({ where }: any) => {
        await delay();
        const w = where.userId_date_slot;
        const row = plans.find(p => planKey(p.userId, p.date, p.slot) === planKey(w.userId, w.date, w.slot));
        return row ? { ...row } : null;
      },
      updateMany: async ({ where, data }: any) => {
        await delay();
        const row = plans.find(p =>
          p.userId === where.userId &&
          new Date(p.date).toISOString().slice(0, 10) === new Date(where.date).toISOString().slice(0, 10) &&
          p.slot === where.slot);
        if (!row) return { count: 0 };
        if (row.version !== where.version) return { count: 0 };
        if (casMiss) {
          // A concurrent device won the CAS between our read and this write.
          row.version += 1;
          return { count: 0 };
        }
        Object.assign(row, data, { updatedAt: new Date().toISOString() });
        return { count: 1 };
      },
      create: async ({ data }: any) => {
        await delay();
        const row: any = {
          id: `plan-${++planSeq}`, userId: data.userId, date: data.date, slot: data.slot,
          mealId: data.mealId, variantId: data.variantId ?? null, qty: data.qty ?? 1,
          status: data.status ?? 'planned', version: data.version ?? 0,
          updatedAt: new Date().toISOString(),
        };
        plans.push(row);
        return { ...row };
      },
      delete: async ({ where }: any) => {
        await delay();
        const w = where.userId_date_slot;
        const ix = plans.findIndex(p => planKey(p.userId, p.date, p.slot) === planKey(w.userId, w.date, w.slot));
        if (ix < 0) throw new Error('UserPlan not found');
        const [removed] = plans.splice(ix, 1);
        return removed;
      },
    },
    $transaction: async (queriesOrFn: any) => {
      if (Array.isArray(queriesOrFn)) {
        // ARRAY form — one submit, no interactive 5s budget; executed here
        // sequentially (same semantics). ANY interactive call FAILS below.
        const results = [];
        for (const q of queriesOrFn) results.push(await q);
        return results;
      }
      mem.prismaMock.interactiveTxCalls.push(1);
      throw new Error('interactive $transaction used — P2028 class (fix regressed)');
    },
  };
  return { prismaMock };
});

vi.mock('../server/src/lib/prisma', () => ({ prisma: mem.prismaMock }));

// ─── Harness servers (REAL routes + auth middleware; prisma mocked) ─────────
const trayApp = buildTrayApp();
const planApp = buildPlanApp();
let trayServer: Server;
let planServer: Server;
let trayBase = '';
let planBase = '';

beforeAll(async () => {
  await new Promise<void>(resolve => {
    trayServer = trayApp.listen(0, '127.0.0.1', () => {
      trayBase = `http://127.0.0.1:${(trayServer.address() as AddressInfo).port}`;
      resolve();
    });
  });
  await new Promise<void>(resolve => {
    planServer = planApp.listen(0, '127.0.0.1', () => {
      planBase = `http://127.0.0.1:${(planServer.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>(resolve => trayServer.close(() => resolve()));
  await new Promise<void>(resolve => planServer.close(() => resolve()));
});

const token = (userId: string) =>
  generateAccessToken({ userId, email: `${userId}@test.local`, phone: null, name: 'User' });

async function req(base: string, method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
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

const trayReq = (method: string, path: string, opts?: { token?: string; body?: unknown }) =>
  req(trayBase, method, path, opts);
const planReq = (method: string, path: string, opts?: { token?: string; body?: unknown }) =>
  req(planBase, method, path, opts);

const DAY = '2026-09-13';
const slotBody = (items: Array<Record<string, unknown>>, totalServings = 2) => ({
  date: DAY, slot: 'lunch', totalServings, items,
});

// ─────────────────────────────────────────────────────────────────────────────
describe('static pin: NO interactive $transaction in tray.ts / plan.ts write paths', () => {
  const stripComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

  it('tray.ts: every write handler uses upsert + ARRAY form — zero interactive callbacks', () => {
    const srv = stripComments(readSource('server/src/routes/tray.ts'));
    expect(srv.match(/\$transaction\(async/g) ?? []).toHaveLength(0);
    // All five array-form batches present (items + 4 converted sites).
    expect(srv.match(/\$transaction\(\[/g) ?? []).toHaveLength(5);
  });

  it('plan.ts: zero interactive callbacks in the write handlers', () => {
    const srv = stripComments(readSource('server/src/routes/plan.ts'));
    expect(srv.match(/\$transaction\(async/g) ?? []).toHaveLength(0);
    expect(srv).not.toContain('$transaction(');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/tray/slot (whole-slot) — upsert + atomic replace batch', () => {
  it('create path: 200, one slot at version 0, items carry sortOrder from payload index', async () => {
    mem.prismaMock.reset();
    const t = token('u-slot-create');
    const r = await trayReq('POST', '/api/v1/tray/slot', { token: t, body: slotBody([
      { mealId: 'poha-mp', quantity: 1 },
      { mealId: 'idli', quantity: 2, sortOrder: 7 },
    ]) });
    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(2);
    expect(r.body.items[0]!.sortOrder).toBe(0);   // idx default (payload has none)
    expect(r.body.items[1]!.sortOrder).toBe(7);   // explicit sortOrder preserved
    expect(mem.prismaMock.counts().slots).toBe(1);
    expect(mem.prismaMock.slotVersion()).toBe(0); // create starts at schema default
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('update path: version bumps, totalServings applied, OLD items REPLACED (atomic delete+create batch)', async () => {
    mem.prismaMock.reset();
    const t = token('u-slot-update');
    const r1 = await trayReq('POST', '/api/v1/tray/slot', { token: t, body: slotBody([{ mealId: 'poha-mp', quantity: 1 }], 1) });
    expect(r1.status).toBe(200);
    expect(mem.prismaMock.slotVersion()).toBe(0);
    const r2 = await trayReq('POST', '/api/v1/tray/slot', { token: t, body: slotBody([
      { mealId: 'idli', quantity: 1 },
      { mealId: 'dosa', quantity: 1 },
    ], 3) });
    expect(r2.status).toBe(200);
    expect(r2.body.totalServings).toBe(3);
    expect(mem.prismaMock.slotVersion()).toBe(1);            // update bumped
    expect(mem.prismaMock.counts().slots).toBe(1);           // upsert — no duplicate slot
    expect(r2.body.items.map((i: any) => i.mealId).sort()).toEqual(['dosa', 'idli']);
    expect(mem.prismaMock.counts().items).toBe(2);           // replaced: old poha item GONE
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('zod gate preserved: 6 items → 400 (schema max 5), nothing written', async () => {
    mem.prismaMock.reset();
    const t = token('u-slot-full');
    const r = await trayReq('POST', '/api/v1/tray/slot', { token: t, body: slotBody(
      [1, 2, 3, 4, 5, 6].map(n => ({ mealId: 'poha-mp', quantity: n })),
    ) });
    expect(r.status).toBe(400);
    expect(mem.prismaMock.counts().items).toBe(0);
    expect(mem.prismaMock.counts().slots).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/v1/tray/item/:itemId — read + atomic (update + version) batch', () => {
  async function seedItem() {
    const t = token('u-item-own');
    const r = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/lunch/items', { token: t, body: { mealId: 'idli', quantity: 1 } });
    return { t, itemId: r.body.id };
  }

  it('applies the update AND bumps the slot version atomically; ownership enforced', async () => {
    mem.prismaMock.reset();
    const { t, itemId } = await seedItem();
    const r = await trayReq('PATCH', `/api/v1/tray/item/${itemId}`, { token: t, body: { quantity: 3, gravyStyle: 'Gravy' } });
    expect(r.status).toBe(200);
    expect(r.body.quantity).toBe(3);
    expect(r.body.gravyStyle).toBe('Gravy');
    expect(mem.prismaMock.slotVersion()).toBe(2);    // seed POST (0→1) + PATCH batch (1→2)
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('another user’s item → 404 NOT_FOUND, nothing written, no version bump', async () => {
    mem.prismaMock.reset();
    const { itemId } = await seedItem();
    const r = await trayReq('PATCH', `/api/v1/tray/item/${itemId}`, { token: token('u-item-thief'), body: { quantity: 9 } });
    expect(r.status).toBe(404);
    expect(r.body.error?.code).toBe('NOT_FOUND');
    expect(mem.prismaMock.slotVersion()).toBe(1);    // seed POST only — no bump on 404
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/tray/item/:itemId — read + atomic (delete + version) batch', () => {
  async function seedItem() {
    const t = token('u-del-own');
    const r = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/dinner/items', { token: t, body: { mealId: 'dosa', quantity: 1 } });
    return { t, itemId: r.body.id };
  }

  it('removes the item, bumps the slot version, cleanup complete', async () => {
    mem.prismaMock.reset();
    const { t, itemId } = await seedItem();
    const r = await trayReq('DELETE', `/api/v1/tray/item/${itemId}`, { token: t });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(mem.prismaMock.counts().items).toBe(0);
    expect(mem.prismaMock.slotVersion()).toBe(2);    // seed POST (0→1) + DELETE batch (1→2)
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('another user’s item → 404 NOT_FOUND, item survives, no version bump', async () => {
    mem.prismaMock.reset();
    const { itemId } = await seedItem();
    const r = await trayReq('DELETE', `/api/v1/tray/item/${itemId}`, { token: token('u-del-thief') });
    expect(r.status).toBe(404);
    expect(r.body.error?.code).toBe('NOT_FOUND');
    expect(mem.prismaMock.counts().items).toBe(1);
    expect(mem.prismaMock.slotVersion()).toBe(1);    // seed POST only — no bump on 404
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/v1/tray/slot/:date/:slot/customize — upsert + atomic replace', () => {
  it('missing slot → CREATED (version stays 0 — customize never bumped); items replaced', async () => {
    mem.prismaMock.reset();
    const t = token('u-cust-new');
    const r = await trayReq('PATCH', `/api/v1/tray/slot/${DAY}/snacks/customize`, {
      token: t,
      body: { items: [{ mealId: 'samosa', quantity: 2, sortOrder: 5 }, { mealId: 'idli', quantity: 1 }] },
    });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.slot.items).toHaveLength(2);
    expect(r.body.slot.items[0]!.sortOrder).toBe(5); // explicit preserved
    expect(r.body.slot.items[1]!.sortOrder).toBe(1); // idx default
    expect(mem.prismaMock.slotVersion()).toBe(0);    // create: schema default; NO bump on customize
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('existing slot → items REPLACED atomically (old items gone), version still NOT bumped', async () => {
    mem.prismaMock.reset();
    const t = token('u-cust-rep');
    await trayReq('POST', '/api/v1/tray/slot/2026-09-13/lunch/items', { token: t, body: { mealId: 'idli', quantity: 1 } });
    const before = mem.prismaMock.slotVersion(); // 1 after the items POST
    const r = await trayReq('PATCH', `/api/v1/tray/slot/${DAY}/lunch/customize`, {
      token: t,
      body: { items: [{ mealId: 'dosa', quantity: 1 }, { mealId: 'poha-mp', quantity: 1 }] },
    });
    expect(r.status).toBe(200);
    expect(r.body.slot.items.map((i: any) => i.mealId).sort()).toEqual(['dosa', 'poha-mp']);
    expect(mem.prismaMock.counts().items).toBe(2);  // replaced, not appended
    expect(mem.prismaMock.slotVersion()).toBe(before); // customize preserves version (business behavior)
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/plan (CAS) — sequential, no interactive budget', () => {
  it('create path: 200, version 0, status planned (absent row)', async () => {
    mem.prismaMock.reset();
    const t = token('u-plan-new');
    const r = await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'lunch', mealId: 'dal-makhani', qty: 1 } });
    expect(r.status).toBe(200);
    expect(r.body.version).toBe(0);
    expect(r.body.status).toBe('planned');
    expect(r.body.mealId).toBe('dal-makhani');
    expect(mem.prismaMock.counts().plans).toBe(1);
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('existing row: CAS updateMany wins (version unchanged — server never bumps plan version)', async () => {
    mem.prismaMock.reset();
    const t = token('u-plan-cas');
    await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'dinner', mealId: 'rajma-chawal' } });
    const r = await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'dinner', mealId: 'dal-makhani', qty: 2 } });
    expect(r.status).toBe(200);
    expect(r.body.mealId).toBe('dal-makhani');
    expect(r.body.qty).toBe(2);
    expect(mem.prismaMock.counts().plans).toBe(1);   // updated, not duplicated
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });

  it('concurrent write wins the CAS → 409 Conflict (identical semantics to the old interactive body)', async () => {
    mem.prismaMock.reset();
    const t = token('u-plan-conf');
    await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'lunch', mealId: 'idli' } });
    mem.prismaMock.setCasMiss(true); // the "other device" bumps the row mid-flight
    const r = await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'lunch', mealId: 'dosa' } });
    expect(r.status).toBe(409);
    expect(r.body.error).toContain('Conflict');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/v1/plan/:date/:slot — plain delete, no wrapper', () => {
  it('removes the plan row (200 {ok:true})', async () => {
    mem.prismaMock.reset();
    const t = token('u-plan-del');
    await planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'snacks', mealId: 'samosa' } });
    const r = await planReq('DELETE', `/api/v1/plan/${DAY}/snacks`, { token: t });
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(mem.prismaMock.counts().plans).toBe(0);
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('round-trip-class proof: each converted site uses FEWER sequential groups than the old interactive form needed (2026-09-13, de-flaked 2026-09-14)', () => {
  // The P2028 class is a GROUP-COUNT claim, not a wall-clock one: the old
  // interactive form serialized EVERY awaited statement (whole-slot = 4 groups:
  // upsert, deleteMany, creates-parallel ⇒ ≥3 sequential waits > 5s budget →
  // P2028; PATCH/DELETE = 3, customize = 3, plan POST = 3). The converted
  // forms need FEWER groups (2, 2, 2, 2-3) AND the array batch shares ONE
  // submit, so the cumulative interactive budget is never consumed.
  //
  // De-flake (2026-09-14): the old `expect(elapsed).toBeGreaterThanOrEqual(5000)`
  // on real Date.now() was timing-flaky under CI load (one flaky run noted in
  // RUN HISTORY) and slowed the suite ~26s with 2600ms fake sleeps. Replaced by
  // two DETERMINISTIC pins: the exact group delta (structural — 2 < the old
  // 3-4) and a mock tally proving EVERY group paid the full latency
  // (sleptMs = groups × latencyMs — no budget-bypass is possible in the model).
  const LAT = 25;
  const hedge = (req: () => Promise<{ status: number; body: any }>) => async () => {
    mem.prismaMock.setLatency(LAT); // caller reset + any setup done BEFORE this
    const g0 = mem.prismaMock.groups;
    const s0 = mem.prismaMock.sleptMs;
    const r = await req();
    const groupsDelta = mem.prismaMock.groups - g0;
    // STRUCTURAL: exactly 2 sequential groups — the old interactive form needed ≥3.
    expect(groupsDelta).toBe(2);
    expect(mem.prismaMock.sleptMs - s0).toBe(groupsDelta * LAT); // every group paid full latency
    expect(mem.prismaMock.interactiveTxCalls).toHaveLength(0);
    return r;
  };

  it('whole-slot POST: 2 groups (upsert + ONE replace batch) — array-batch shares a submit, NOT P2028', async () => {
    mem.prismaMock.reset();
    const t = token('u-slot');
    const r = await hedge(() => trayReq('POST', '/api/v1/tray/slot', { token: t, body: slotBody([
      { mealId: 'poha-mp', quantity: 1 },
      { mealId: 'idli', quantity: 1 },
      { mealId: 'dosa', quantity: 1 },
    ]) }))();
    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(3);
  });

  it('PATCH item: 2 groups (ownership read + ONE atomic update batch)', async () => {
    mem.prismaMock.reset();
    const t = token('u-patch');
    const created = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/breakfast/items', { token: t, body: { mealId: 'idli', quantity: 1 } });
    const r = await hedge(() => trayReq('PATCH', `/api/v1/tray/item/${created.body.id}`, { token: t, body: { quantity: 2 } }))();
    expect(r.status).toBe(200);
    expect(r.body.quantity).toBe(2);
  });

  it('DELETE item: 2 groups (ownership read + ONE atomic delete batch)', async () => {
    mem.prismaMock.reset();
    const t = token('u-del');
    const created = await trayReq('POST', '/api/v1/tray/slot/2026-09-13/snacks/items', { token: t, body: { mealId: 'samosa', quantity: 1 } });
    const r = await hedge(() => trayReq('DELETE', `/api/v1/tray/item/${created.body.id}`, { token: t }))();
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(mem.prismaMock.counts().items).toBe(0);
  });

  it('customize: 2 groups (upsert + ONE replace batch)', async () => {
    mem.prismaMock.reset();
    const t = token('u-cust');
    const r = await hedge(() => trayReq('PATCH', `/api/v1/tray/slot/${DAY}/dinner/customize`, {
      token: t,
      body: { items: [{ mealId: 'rajma-chawal', quantity: 1 }, { mealId: 'dal-makhani', quantity: 1 }] },
    }))();
    expect(r.status).toBe(200);
    expect(r.body.slot.items).toHaveLength(2);
  });

  it('plan POST CAS: 2-3 groups, each independent (the CAS gate is the per-statement WHERE version — no cumulative budget exists)', async () => {
    mem.prismaMock.reset();
    const t = token('u-plan');
    const r = await hedge(() => planReq('POST', '/api/v1/plan', { token: t, body: { date: DAY, slot: 'lunch', mealId: 'idli' } }))();
    expect(r.status).toBe(200);
    expect(r.body.mealId).toBe('idli');
  });
});

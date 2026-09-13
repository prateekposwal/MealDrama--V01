// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION-HARDENING REGRESSIONS — household shared-plan + authz gates.
//
// Real express app + real authMiddleware + prisma mocked (repo harness style):
//
//   sharedPlan.ts — the family week / meal-ownership surface
//     · PATCH status-only must NOT wipe requestedFor (the "who is this for?"
//       field) — reproduced live 2026-09-13: `requestedFor: p.requestedFor ?? null`
//       nulled it on every accept/complete.
//     · dates are handled as calendar days: a plan for 2026-09-20 stays on
//       2026-09-20 in UTC storage, no ±1-day server-local drift.
//     · non-member → 403 ; unauthenticated → 401.
//     · requestedBy/requestedFor capped at VarChar(64) (matches schema).
//
//   pantry / expenses — membership-gated reads
//     · GET /:householdId/pantry, GET/POST /:householdId/activity,
//       GET /:householdId/meals → 403 for a non-member (were IDOR-open).
//
//   loop-config — authenticated + self-scoped
//     · unauthenticated POST → 401 ; a user can only read/write THEIR row.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

const mocks = vi.hoisted(() => ({
  householdFind: vi.fn(),
  sharedPlanFindMany: vi.fn(),
  sharedPlanFindUnique: vi.fn(),
  sharedPlanCreate: vi.fn(),
  sharedPlanUpdate: vi.fn(),
  sharedPlanUpdateMany: vi.fn(),
  sharedPlanDelete: vi.fn(),
  householdMemberFindMany: vi.fn(),
  householdMemberFindFirst: vi.fn(),
  activityFeedFindMany: vi.fn(),
  activityFeedCreate: vi.fn(),
  expenseFindMany: vi.fn(),
  traySlotFindMany: vi.fn(),
  loopFindUnique: vi.fn(),
  loopUpsert: vi.fn(),
  loopDeleteMany: vi.fn(),
  householdStockFindMany: vi.fn(),
  householdStockUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userProfileCreate: vi.fn(),
  cookShareFindUnique: vi.fn(),
  cookShareUpsert: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    household: { findUnique: mocks.householdFind },
    sharedPlanItem: {
      findMany: mocks.sharedPlanFindMany,
      findUnique: mocks.sharedPlanFindUnique,
      create: mocks.sharedPlanCreate,
      update: mocks.sharedPlanUpdate,
      updateMany: mocks.sharedPlanUpdateMany,
      delete: mocks.sharedPlanDelete,
    },
    householdMember: { findMany: mocks.householdMemberFindMany, findFirst: mocks.householdMemberFindFirst },
    activityFeed: { findMany: mocks.activityFeedFindMany, create: mocks.activityFeedCreate },
    expense: { findMany: mocks.expenseFindMany },
    traySlot: { findMany: mocks.traySlotFindMany },
    loopConfig: {
      findUnique: mocks.loopFindUnique,
      upsert: mocks.loopUpsert,
      deleteMany: mocks.loopDeleteMany,
    },
    householdStock: { findMany: mocks.householdStockFindMany, update: mocks.householdStockUpdate },
    user: {
      findUnique: mocks.userFindUnique,
      findFirst: mocks.userFindFirst,
      create: mocks.userCreate,
      update: mocks.userUpdate,
    },
    userProfile: { create: mocks.userProfileCreate },
    cookShare: { findUnique: mocks.cookShareFindUnique, upsert: mocks.cookShareUpsert },
  },
}));

import { buildSharedPlanApp, buildPantryApp, buildExpensesApp, buildLoopConfigApp, buildAuthApp, buildCookShareApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const HH_ID = 'hh-prod-1';
const MEMBERS = [
  { id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin' },
  { id: 'mem-aman', userId: 'u-aman', name: 'Aman', role: 'member' },
];

const sharedPlanApp = buildSharedPlanApp();
const pantryApp = buildPantryApp();
const expensesApp = buildExpensesApp();
const loopApp = buildLoopConfigApp();
const authApp = buildAuthApp();
const cookShareApp = buildCookShareApp();

const tokenFor = (userId: string) => generateAccessToken({ userId, email: `${userId}@test.local`, phone: null, name: 'U' });

async function listen(app: any): Promise<{ base: string; server: Server }> {
  const server = await new Promise<Server>(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base, server };
}

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

const basePlanItem = () => ({
  id: 'item-1',
  householdId: HH_ID,
  authorUserId: 'u-riya',
  date: new Date('2026-09-20T00:00:00Z'),
  mealType: 'lunch',
  dishId: null,
  dishName: 'Rajma Chawal',
  icon: '🍛',
  requestedBy: 'MEMBER-ABC',
  requestedFor: 'MEMBER-ABC',
  status: 'requested',
  quantity: 2,
  createdAt: new Date('2026-09-13T00:00:00Z'),
  updatedAt: new Date('2026-09-13T00:00:00Z'),
});

// ─── SHARED PLAN ─────────────────────────────────────────────────────────────
describe('sharedPlan.ts — meal-ownership + timezone + authz', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(sharedPlanApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH_ID ? { id: HH_ID, members: MEMBERS } : null);
    mocks.sharedPlanFindUnique.mockImplementation(async ({ where }: any) =>
      where.id === 'item-1' ? basePlanItem() : null);
  });

  it('status-only PATCH preserves requestedFor (regression: it was nulled)', async () => {
    mocks.sharedPlanUpdate.mockImplementation(async ({ data }: any) => ({ ...basePlanItem(), ...data }));
    const r = await req(base, 'PATCH', `/api/v1/households/${HH_ID}/plan/item-1`, {
      token: tokenFor('u-aman'),
      body: { status: 'accepted' },
    });
    expect(r.status).toBe(200);
    const dataArg = mocks.sharedPlanUpdate.mock.calls[0]![0]!.data as Record<string, unknown>;
    expect('requestedFor' in dataArg).toBe(false); // must NOT be sent → not nulled
    expect(r.body.requestedFor).toBe('MEMBER-ABC');
    expect(r.body.status).toBe('accepted');
  });

  it('PATCH that explicit-set requestedFor to null still works (clearing is opt-in)', async () => {
    mocks.sharedPlanUpdate.mockImplementation(async ({ data }: any) => ({ ...basePlanItem(), ...data }));
    const r = await req(base, 'PATCH', `/api/v1/households/${HH_ID}/plan/item-1`, {
      token: tokenFor('u-aman'),
      body: { requestedFor: null },
    });
    expect(r.status).toBe(200);
    expect(r.body.requestedFor).toBeNull();
  });

  it('dates are calendar days — POST 2026-09-20 stores UTC midnight (no -1 day drift)', async () => {
    mocks.sharedPlanCreate.mockImplementation(async ({ data }: any) => ({ id: 'item-new', createdAt: new Date(), updatedAt: new Date(), ...data }));
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/plan`, {
      token: tokenFor('u-riya'),
      body: { date: '2026-09-20', mealType: 'dinner', dishName: 'Dal Tadka' },
    });
    expect(r.status).toBe(201);
    expect(r.body.date).toBe('2026-09-20'); // response returns the SAME calendar day
    const createData = mocks.sharedPlanCreate.mock.calls[0]![0]!.data as any;
    expect(createData.date.toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('non-member → 403 for reads and writes', async () => {
    expect((await req(base, 'GET', `/api/v1/households/${HH_ID}/plan`, { token: tokenFor('u-stranger') })).status).toBe(403);
    expect((await req(base, 'POST', `/api/v1/households/${HH_ID}/plan`, {
      token: tokenFor('u-stranger'),
      body: { date: '2026-09-20', mealType: 'lunch', dishName: 'X' },
    })).status).toBe(403);
  });

  it('unauthenticated → 401', async () => {
    expect((await req(base, 'GET', `/api/v1/households/${HH_ID}/plan`)).status).toBe(401);
  });

  it('requestedBy/requestedFor over 64 chars → 400 (schema VarChar(64))', async () => {
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/plan`, {
      token: tokenFor('u-riya'),
      body: { date: '2026-09-20', mealType: 'lunch', dishName: 'X', requestedBy: 'x'.repeat(65) },
    });
    expect(r.status).toBe(400);
  });

  it('requestedFor = member NAME → resolved to the member id at the write boundary', async () => {
    mocks.sharedPlanCreate.mockImplementation(async ({ data }: any) => ({ id: 'item-n', createdAt: new Date(), updatedAt: new Date(), ...data }));
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/plan`, {
      token: tokenFor('u-riya'),
      body: { date: '2026-09-20', mealType: 'lunch', dishName: 'X', requestedFor: 'Aman' }, // MEMBERS have name 'Aman'
    });
    expect(r.status).toBe(201);
    const createData = mocks.sharedPlanCreate.mock.calls[0]![0]!.data as any;
    expect(createData.requestedFor).toBe('mem-aman');
  });

  it('requestedFor = NOT a member (id or name) → 400 (free strings never enter the table)', async () => {
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/plan`, {
      token: tokenFor('u-riya'),
      body: { date: '2026-09-20', mealType: 'lunch', dishName: 'X', requestedFor: 'The Landlord' },
    });
    expect(r.status).toBe(400);
  });

  it('optimistic lock: PATCH with a stale ifVersion → 409 (CAS, no clobber)', async () => {
    mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 0 });
    mocks.sharedPlanFindUnique.mockResolvedValue({ ...basePlanItem(), version: 2 }); // moved by someone else
    const r = await req(base, 'PATCH', `/api/v1/households/${HH_ID}/plan/item-1`, {
      token: tokenFor('u-aman'),
      body: { status: 'accepted', ifVersion: 1 }, // client saw v1, row is now v2
    });
    expect(r.status).toBe(409);
    expect(mocks.sharedPlanUpdateMany.mock.calls[0]![0]!.where.version).toBe(1);
  });

  it('optimistic lock: matching ifVersion → applies atomically and bumps version', async () => {
    mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 1 });
    mocks.sharedPlanFindUnique.mockResolvedValueOnce({ ...basePlanItem(), version: 1 }).mockResolvedValue({ ...basePlanItem(), status: 'accepted', version: 2 });
    const r = await req(base, 'PATCH', `/api/v1/households/${HH_ID}/plan/item-1`, {
      token: tokenFor('u-aman'),
      body: { status: 'accepted', ifVersion: 1 },
    });
    expect(r.status).toBe(200);
    const call = mocks.sharedPlanUpdateMany.mock.calls[0]![0];
    expect(call.data.version).toEqual({ increment: 1 });
    expect(call.data.status).toBe('accepted');
    expect(r.body.version).toBe(2);
  });
});

// ─── PANTRY ──────────────────────────────────────────────────────────────────
describe('pantry.ts — membership gate', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(pantryApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH_ID ? { id: HH_ID, members: MEMBERS } : null);
    mocks.householdMemberFindMany.mockResolvedValue([]);
    mocks.traySlotFindMany.mockResolvedValue([]);
  });

  it('non-member cannot read another household\'s pantry (IDOR closed)', async () => {
    const r = await req(base, 'GET', `/api/v1/households/${HH_ID}/pantry`, { token: tokenFor('u-stranger') });
    expect(r.status).toBe(403);
  });

  it('member reads pantry fine', async () => {
    const r = await req(base, 'GET', `/api/v1/households/${HH_ID}/pantry`, { token: tokenFor('u-riya') });
    expect(r.status).toBe(200);
  });

  it('unauthenticated → 401', async () => {
    expect((await req(base, 'GET', `/api/v1/households/${HH_ID}/pantry`)).status).toBe(401);
  });
});

// ─── EXPENSES ────────────────────────────────────────────────────────────────
describe('expenses.ts — active /activity + /meals handlers are membership-gated', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(expensesApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdMemberFindFirst.mockImplementation(async ({ where }: any) =>
      where.householdId === HH_ID && where.userId === 'u-riya' ? { id: 'mem-riya', userId: 'u-riya', role: 'admin' } : null);
    mocks.activityFeedFindMany.mockResolvedValue([]);
    mocks.activityFeedCreate.mockResolvedValue({});
    mocks.householdMemberFindMany.mockResolvedValue([{ id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin' }]);
    mocks.expenseFindMany.mockResolvedValue([]);
    mocks.traySlotFindMany.mockResolvedValue([]);
  });

  it('POST /activity from a non-member → 403 (was open forgery)', async () => {
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/activity`, {
      token: tokenFor('u-stranger'),
      body: { memberName: 'Sneak', action: 'swapped', detail: 'forged entry' },
    });
    expect(r.status).toBe(403);
  });

  it('GET /activity from a non-member → 403', async () => {
    const r = await req(base, 'GET', `/api/v1/households/${HH_ID}/activity`, { token: tokenFor('u-stranger') });
    expect(r.status).toBe(403);
  });

  it('GET /meals from a non-member → 403', async () => {
    const r = await req(base, 'GET', `/api/v1/households/${HH_ID}/meals`, { token: tokenFor('u-stranger') });
    expect(r.status).toBe(403);
  });

  it('member reads /meals fine', async () => {
    const r = await req(base, 'GET', `/api/v1/households/${HH_ID}/meals`, { token: tokenFor('u-riya') });
    expect(r.status).toBe(200);
  });
});

// ─── LOOP-CONFIG ─────────────────────────────────────────────────────────────
describe('loopConfig.ts — authenticated + self-scoped + persisted', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(loopApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
  });

  it('unauthenticated POST → 401 (was open)', async () => {
    const r = await req(base, 'POST', `/api/v1/loop-config`, {
      body: { userId: 'u-riya', config: { cycleLength: 14 } },
    });
    expect(r.status).toBe(401);
  });

  it('persists to Prisma (not the in-memory Map)', async () => {
    mocks.loopUpsert.mockResolvedValue({ userId: 'u-riya', cycleLength: 14 });
    const r = await req(base, 'POST', `/api/v1/loop-config`, {
      token: tokenFor('u-riya'),
      body: { userId: 'u-riya', config: { cycleLength: 14, repeatPattern: 'weekly' }, sourceDishIds: ['idli'] },
    });
    expect(r.status).toBe(200);
    const call = mocks.loopUpsert.mock.calls[0]![0];
    expect(call.create.userId).toBe('u-riya');
    expect(call.create.repeatPattern).toBe('weekly');
  });

  it('a user cannot read another user\'s config (scoped to self)', async () => {
    mocks.loopFindUnique.mockResolvedValue({ userId: 'u-riya', cycleLength: 7, startDate: '', skipDays: [], repeatPattern: 'sequential', insertStrategy: 'append', sourceDishIds: [] });
    const r = await req(base, 'GET', '/api/v1/loop-config/u-riya', { token: tokenFor('u-aman') });
    expect(r.status).toBe(200);
    expect(r.body.data).toBeNull(); // never another user's row
  });
});

// ─── AUTH ───────────────────────────────────────────────────────────────────
// Literal bcrypt hashes (portable strings, no bcryptjs dependency at repo root):
const HASH_REAL_SECRET = '$2b$10$4Y4POenyqI3YBybI/OVS6u9IS6HLAPKKKdmLo1Av7zNKSfWG1DGPq'; // 'the-real-secret'
const HASH_GOOD_SECRET = '$2b$10$f5iZjlrTpbHVh5x9yyl8x.cIXYg4EJZah0.VUiHVPTa78qS3eAPR6'; // GOOD_SECRET
const HASH_VICTIM_SECRET = '$2b$10$rNeBzpQUOQWHNtM7JpVh4uMJcEcKwUik/.y3kETKEexFolDka.Oiu'; // 'victim-secret'

describe('auth.ts — device-bound register/login (takeover closed)', () => {
  let base = '';
  let server: Server;
  const GOOD_SECRET = 'device-secret-0123456789';

  beforeAll(async () => {
    ({ base, server } = await listen(authApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
  });

  it('register: a NEW account REQUIRES a deviceSecret (16+ chars)', async () => {
    const r = await req(base, 'POST', '/api/v1/auth/register', { body: { id: 'u-new', name: 'A' } });
    expect(r.status).toBe(400); // no secret → no account
  });

  it('register: creates a guest with the device id, hashes the secret, returns a token', async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ id: 'u-new', name: 'A', email: null, phone: null, deviceSecret: 'x' });
    mocks.userProfileCreate.mockResolvedValue({});
    const r = await req(base, 'POST', '/api/v1/auth/register', { body: { id: 'u-new', name: 'A', deviceSecret: GOOD_SECRET } });
    expect(r.status).toBe(201);
    expect(r.body.data.user.id).toBe('u-new');
    expect(r.body.data.token).toBeTruthy();
    const createData = mocks.userCreate.mock.calls[0]![0]!.data as any;
    expect(createData.id).toBe('u-new');
    expect(createData.deviceSecret.startsWith('$2')).toBe(true); // bcrypt hash, not the raw secret
  });

  it('register: email that belongs to ANOTHER account → 409 (identity cannot be claimed)', async () => {
    mocks.userFindUnique.mockResolvedValue(null); // id is fresh
    mocks.userFindFirst.mockResolvedValue({ id: 'u-existing-gmail' }); // email already taken
    const r = await req(base, 'POST', '/api/v1/auth/register', {
      body: { id: 'u-attacker', name: 'X', email: 'victim@gmail.com', deviceSecret: GOOD_SECRET },
    });
    expect(r.status).toBe(409);
  });

  it('self-heal: register with an existing id + WRONG secret → 401 (no token, no account)', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'u-victim', name: 'V', email: null, phone: null, deviceSecret: HASH_REAL_SECRET });
    const r = await req(base, 'POST', '/api/v1/auth/register', { body: { id: 'u-victim', name: 'V', deviceSecret: 'attacker-guess-0000' } });
    expect(r.status).toBe(401);
  });

  it('self-heal: register with the RIGHT secret → token for the SAME account', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 'u-me', name: 'Riya', email: 'riya@x.com', phone: null, deviceSecret: HASH_GOOD_SECRET });
    const r = await req(base, 'POST', '/api/v1/auth/register', { body: { id: 'u-me', name: 'Riya', deviceSecret: GOOD_SECRET } });
    expect(r.status).toBe(200);
    expect(r.body.data.user.id).toBe('u-me');
    expect(r.body.data.token).toBeTruthy();
  });

  it('login: email WITHOUT the account secret → rejected (the old property-login takeover)', async () => {
    mocks.userFindFirst.mockResolvedValue({ id: 'u-victim', email: 'victim@gmail.com', phone: null, deviceSecret: HASH_VICTIM_SECRET });
    const r = await req(base, 'POST', '/api/v1/auth/login', { body: { email: 'victim@gmail.com' } });
    // A missing proof is refused outright — no token, no ambiguity.
    expect([400, 401]).toContain(r.status);
    expect(r.body.data).toBeUndefined();
  });

  it('login: email + the account secret → token (proof required, not just possession of an email)', async () => {
    mocks.userFindFirst.mockResolvedValue({ id: 'u-victim', email: 'victim@gmail.com', phone: null, deviceSecret: HASH_GOOD_SECRET, profile: null });
    const r = await req(base, 'POST', '/api/v1/auth/login', { body: { email: 'victim@gmail.com', deviceSecret: GOOD_SECRET } });
    expect(r.status).toBe(200);
    expect(r.body.data.token).toBeTruthy();
  });
});

// ─── PANTRY CONSUMPTION LEDGER ──────────────────────────────────────────────
describe('pantry.ts — POST /stock/consume (the ledger decrements)', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(pantryApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH_ID ? { id: HH_ID, members: MEMBERS } : null);
  });

  it('non-member cannot consume (membership gate)', async () => {
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/stock/consume`, {
      token: tokenFor('u-stranger'),
      body: { items: [{ name: 'Onions', unit: 'g', quantity: 100 }] },
    });
    expect(r.status).toBe(403);
  });

  it('member consumes: canonical-name match + same unit → stock decremented, clamped at zero', async () => {
    mocks.householdStockFindMany.mockResolvedValue([
      { id: 's1', name: 'Coriander', unit: 'g', quantity: 200 },
      { id: 's2', name: 'Onions', unit: 'g', quantity: 30 },
    ]);
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/stock/consume`, {
      token: tokenFor('u-riya'),
      body: { items: [
        { name: 'Coriander Leaves', unit: 'g', quantity: 30 }, // canonicalName → 'coriander'
        { name: 'Onions', unit: 'g', quantity: 50 },           // 30 on hand → clamps at 0
      ] },
    });
    expect(r.status).toBe(200);
    expect(r.body.consumed).toBe(60);
    const updates = mocks.householdStockUpdate.mock.calls.map((c: any) => c[0]);
    const byId = Object.fromEntries(updates.map((u: any) => [u.where.id, u.data.quantity]));
    expect(byId['s1']).toBe(170);
    expect(byId['s2']).toBe(0); // never negative
  });

  it('unit mismatch → skipped (no nonsensical subtraction across units)', async () => {
    mocks.householdStockFindMany.mockResolvedValue([{ id: 's1', name: 'Onions', unit: 'g', quantity: 200 }]);
    const r = await req(base, 'POST', `/api/v1/households/${HH_ID}/stock/consume`, {
      token: tokenFor('u-riya'),
      body: { items: [{ name: 'Onions', unit: 'kg', quantity: 1 }] },
    });
    expect(r.status).toBe(200);
    expect(r.body.consumed).toBe(0);
    expect(mocks.householdStockUpdate).not.toHaveBeenCalled();
  });
});

// ─── COOK SHARE (cook as an entity) ─────────────────────────────────────────
describe('cookShare.ts — stable no-login cook link + public page', () => {
  let base = '';
  let server: Server;

  beforeAll(async () => {
    ({ base, server } = await listen(cookShareApp));
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH_ID ? { id: HH_ID, name: 'The Sharma House', members: MEMBERS, sharedPlanItems: [] } : null);
  });

  it('GET cook-share without a token → 401; non-member → 403', async () => {
    expect((await req(base, 'GET', `/api/v1/households/${HH_ID}/cook-share`)).status).toBe(401);
    expect((await req(base, 'GET', `/api/v1/households/${HH_ID}/cook-share`, { token: tokenFor('u-stranger') })).status).toBe(403);
  });

  it('member creates the link → a stable /cook/:token url is returned', async () => {
    mocks.cookShareFindUnique.mockResolvedValue(null);
    mocks.cookShareUpsert.mockResolvedValue({ displayName: 'Rajesh', enabled: true, token: 'tok-abc' });
    const r = await req(base, 'PUT', `/api/v1/households/${HH_ID}/cook-share`, {
      token: tokenFor('u-riya'),
      body: { displayName: 'Rajesh' },
    });
    expect(r.status).toBe(201);
    expect(r.body.share.url).toBe('/cook/tok-abc');
  });

  it('the PUBLIC /cook/:token page renders today\'s plan as HTML, no login needed', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    mocks.cookShareFindUnique.mockResolvedValue({ token: 'tok-page', householdId: HH_ID, displayName: 'Cook', enabled: true });
    mocks.householdFind.mockResolvedValue({
      id: HH_ID,
      name: 'The Sharma House',
      members: MEMBERS,
      sharedPlanItems: [
        { id: 'i1', date: new Date(todayIso), mealType: 'lunch', dishName: 'Rajma Chawal', icon: '🍛', requestedFor: 'mem-riya', status: 'accepted', quantity: 2 },
      ],
    });
    const res = await fetch(`${base}/api/v1/cook/tok-page`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Rajma Chawal');
    expect(html).toContain('Riya'); // member name resolved from id
    expect(html).toContain('×2'); // servings
  });

  it('disabled or unknown cook link → 404 (token is the revocable credential)', async () => {
    mocks.cookShareFindUnique.mockResolvedValue(null);
    const res = await fetch(`${base}/api/v1/cook/nope`);
    expect(res.status).toBe(404);
  });
});
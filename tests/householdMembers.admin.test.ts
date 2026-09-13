// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD MEMBER ADMIN — PATCH transfer + DELETE removal.
//
// PATCH /households/:householdId/members/:memberId { role: 'admin' } TRANSFERS
// adminship atomically: every incumbent admin (incl. the caller) demotes to
// member, the target becomes the sole admin. A household always keeps an
// admin (guards below). DELETE removes a non-admin member with full cleanup
// (member lanes, assumptions, shared-plan pointers nulled). See
// server/src/routes/households.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { buildHouseholdsApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const mocks = vi.hoisted(() => ({
  householdFindUnique: vi.fn(),
  memberUpdate: vi.fn(),
  memberUpdateMany: vi.fn(),
  memberDelete: vi.fn(),
  assumptionDeleteMany: vi.fn(),
  laneDeleteMany: vi.fn(),
  sharedPlanUpdateMany: vi.fn(),
  activityCreate: vi.fn(),
  userProfileUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    household: { findUnique: mocks.householdFindUnique },
    householdMember: {
      update: mocks.memberUpdate,
      updateMany: mocks.memberUpdateMany,
      delete: mocks.memberDelete,
    },
    householdAssumption: { deleteMany: mocks.assumptionDeleteMany },
    memberLane: { deleteMany: mocks.laneDeleteMany },
    sharedPlanItem: { updateMany: mocks.sharedPlanUpdateMany },
    activityFeed: { create: mocks.activityCreate },
    userProfile: { upsert: mocks.userProfileUpsert },
    $transaction: mocks.transaction,
  },
}));


const app = buildHouseholdsApp();

function listen(): Promise<{ base: string; server: Server }> {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () =>
      resolve({ base: `http://127.0.0.1:${(s.address() as AddressInfo).port}`, server: s }),
    );
  });
}

let base = '';
let server: Server;
const adminToken = generateAccessToken({ userId: 'u-riya', phone: null, name: 'Riya', email: 'r@x.com' });
const memberToken = generateAccessToken({ userId: 'u-ankit', phone: null, name: 'Ankit', email: 'a@x.com' });

const HH = {
  id: 'hh-1',
  name: 'Sharma House',
  code: 'ABC123',
  members: [
    { id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin', canEditPlan: true, autoPlanEnabled: true },
    { id: 'mem-ankit', userId: 'u-ankit', name: 'Ankit', role: 'member', canEditPlan: true, autoPlanEnabled: true },
    { id: 'mem-neha', userId: 'u-neha', name: 'Neha', role: 'member', canEditPlan: true, autoPlanEnabled: true },
  ],
};

beforeAll(async () => {
  ({ base, server } = await listen());
  mocks.transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  mocks.memberUpdate.mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data }));
  mocks.memberUpdateMany.mockResolvedValue({ count: 1 });
  mocks.memberDelete.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, name: 'Neha' }));
  mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 0 });
  mocks.assumptionDeleteMany.mockResolvedValue({ count: 0 });
  mocks.laneDeleteMany.mockResolvedValue({ count: 0 });
  mocks.activityCreate.mockImplementation((d: any) => Promise.resolve({ id: 'act-1', ...d.data }));
});

afterAll(() => server.close());

async function api(path: string, opts: { method?: string; token: string; body?: unknown }) {
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.token}`,
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* empty */ }
  return { status: res.status, body };
}

describe('admin transfer — PATCH members/:memberId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    mocks.memberUpdate.mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data }));
    mocks.memberUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('promoting a member TRANSFERS adminship atomically (demote incumbents + promote target)', async () => {
    mocks.householdFindUnique.mockResolvedValue(HH);
    const r = await api(`/api/v1/households/hh-1/members/mem-ankit`, { method: 'PATCH', token: adminToken, body: { role: 'admin' } });

    expect(r.status).toBe(200);
    expect(r.body.role).toBe('admin');
    // Demote: only admins (the caller) are demoted.
    expect(mocks.memberUpdateMany).toHaveBeenCalledWith({
      where: { householdId: 'hh-1', role: 'admin' },
      data: { role: 'member' },
    });
    expect(mocks.memberUpdate).toHaveBeenCalledWith({ where: { id: 'mem-ankit' }, data: expect.objectContaining({ role: 'admin' }) });
    // Both in one transaction — no intermediate adminless state.
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.transaction.mock.calls[0]![0]).toHaveLength(2);
  });

  it('demoting the ONLY admin is rejected (400)', async () => {
    mocks.householdFindUnique.mockResolvedValue({
      ...HH,
      members: [{ id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin', canEditPlan: true, autoPlanEnabled: true }],
    });
    const r = await api(`/api/v1/households/hh-1/members/mem-riya`, { method: 'PATCH', token: adminToken, body: { role: 'member' } });
    expect(r.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('a non-admin cannot promote anyone', async () => {
    mocks.householdFindUnique.mockResolvedValue(HH);
    const r = await api(`/api/v1/households/hh-1/members/mem-neha`, { method: 'PATCH', token: memberToken, body: { role: 'admin' } });
    expect(r.status).toBe(403);
  });
});

describe('member removal — DELETE members/:memberId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
    mocks.memberDelete.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, name: 'Neha' }));
    mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 0 });
    mocks.assumptionDeleteMany.mockResolvedValue({ count: 0 });
    mocks.laneDeleteMany.mockResolvedValue({ count: 0 });
  });

  it('admin removes a member with full cleanup (lanes, assumptions, pointers nulled)', async () => {
    mocks.householdFindUnique.mockResolvedValue(HH);
    const r = await api(`/api/v1/households/hh-1/members/mem-neha`, { method: 'DELETE', token: adminToken });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true, removed: 'Neha' });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.transaction.mock.calls[0]![0]).toHaveLength(6);
    // Cleanup ops called with the right args:
    expect(mocks.assumptionDeleteMany).toHaveBeenCalledWith({ where: { householdId: 'hh-1', memberId: 'mem-neha' } });
    expect(mocks.laneDeleteMany).toHaveBeenCalledWith({ where: { householdId: 'hh-1', memberId: 'mem-neha' } });
    expect(mocks.sharedPlanUpdateMany).toHaveBeenCalledWith({ where: { householdId: 'hh-1', requestedFor: 'mem-neha' }, data: { requestedFor: null } });
    expect(mocks.sharedPlanUpdateMany).toHaveBeenCalledWith({ where: { householdId: 'hh-1', requestedBy: 'mem-neha' }, data: { requestedBy: null } });
    expect(mocks.memberDelete).toHaveBeenCalledWith({ where: { id: 'mem-neha' } });
    expect(mocks.activityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'removed', detail: expect.stringContaining('Neha') }) }));
  });

  it('member cannot remove another member (403 — admins do this)', async () => {
    mocks.householdFindUnique.mockResolvedValue(HH);
    const r = await api(`/api/v1/households/hh-1/members/mem-neha`, { method: 'DELETE', token: memberToken });
    expect(r.status).toBe(403);
  });

  it('cannot remove the last admin (400)', async () => {
    mocks.householdFindUnique.mockResolvedValue({
      ...HH,
      members: [{ id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin', canEditPlan: true, autoPlanEnabled: true }],
    });
    const r = await api(`/api/v1/households/hh-1/members/mem-riya`, { method: 'DELETE', token: adminToken });
    expect(r.status).toBe(400);
  });

  it('cannot remove yourself (400 — admins leave via /leave)', async () => {
    mocks.householdFindUnique.mockResolvedValue(HH);
    const r = await api(`/api/v1/households/hh-1/members/mem-riya`, { method: 'DELETE', token: adminToken });
    expect(r.status).toBe(400);
  });
});
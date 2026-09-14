import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import express from 'express';
import { makeApp, listen } from './server-test-utils';

// Hoisted before the router import (the router pulls `../lib/prisma`).
vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    household: { create: vi.fn(), findUnique: vi.fn() },
    householdMember: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
  },
  connectWithRetry: vi.fn(),
}));

// eslint-disable-next-line import/first
import householdsRouter from '../server/src/routes/households';
// eslint-disable-next-line import/first
import { authMiddleware, generateAccessToken } from '../server/src/lib/auth';
// eslint-disable-next-line import/first
import { prisma } from '../server/src/lib/prisma';

interface MockHouseholdModel { create: Mock; findUnique: Mock; }
interface MockMemberModel { create: Mock; findFirst: Mock; delete: Mock; }

const mHousehold = prisma.household as unknown as MockHouseholdModel;
const mMember = prisma.householdMember as unknown as MockMemberModel;

const token = generateAccessToken({ userId: 'user-1', email: 'kamala@x.dev', phone: null, name: 'Kamala' });

const household = (over: Partial<any> = {}) => ({
  id: 'h-1',
  name: 'Chowder House',
  code: 'ABC123',
  createdAt: new Date(),
  members: [{ id: 'm-1', householdId: 'h-1', name: 'Kamala', role: 'admin', userId: 'user-1' }],
  ...over,
});

let server: ReturnType<express.Express['listen']>;
let base: string;

beforeAll(async () => {
  const run = await listen(
    makeApp([['/api/v1/households', authMiddleware as express.RequestHandler, householdsRouter]]),
  );
  server = run.server;
  base = run.base + '/api/v1/households';
});

afterAll(() => new Promise<void>(r => server.close(() => r())));

beforeEach(() => {
  vi.clearAllMocks();
  mHousehold.create.mockResolvedValue(household());
  mHousehold.findUnique.mockResolvedValue(null);
  mMember.create.mockResolvedValue({ id: 'm-2', householdId: 'h-1', name: 'Member', role: 'member', userId: 'user-1' });
});

async function api(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'GET',
  body: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

describe('POST /households', () => {
  it('creates a household with the requester as admin (201)', async () => {
    const { status, json } = await api('/', 'POST', { name: 'Chowder House' });

    expect(status).toBe(201);
    expect(json.id).toBe('h-1');
    expect(json.adminId).toBe('user-1');
    expect(json.members[0]).toMatchObject({ role: 'admin', userId: 'user-1' });
    expect(mHousehold.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: expect.any(String) }) }),
    );
  });

  it('rejects an empty name (400, zod)', async () => {
    const { status, json } = await api('/', 'POST', { name: '' });
    expect(status).toBe(400);
    expect(json.error).toBe('Invalid payload');
  });

  it('blocks unauthenticated requests (401)', async () => {
    const res = await fetch(base + '/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /households/join', () => {
  it('joins by invite code and adds a member exactly once', async () => {
    const adminOnly = household({ members: [{ id: 'm-1', householdId: 'h-1', name: 'Admin', role: 'admin', userId: 'user-admin' }] });
    const afterJoin = { ...adminOnly, members: [...adminOnly.members, { id: 'm-2', householdId: 'h-1', name: 'Kamala', role: 'member', userId: 'user-1' }] };
    mHousehold.findUnique
      .mockResolvedValueOnce(adminOnly)      // join #1 — code lookup (joiner absent)
      .mockResolvedValueOnce(afterJoin)      // join #1 — re-fetch reflecting the new member
      .mockResolvedValue(afterJoin);         // join #2 — joiner now a member

    const first = await api('/join', 'POST', { code: 'abc123' });
    const second = await api('/join', 'POST', { code: 'abc123' });

    expect(mHousehold.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: 'ABC123' } }),
    );
    expect(mMember.create).toHaveBeenCalledTimes(1); // idempotent join
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it('404s on an unknown invite code', async () => {
    mHousehold.findUnique.mockResolvedValue(null);
    const { status, json } = await api('/join', 'POST', { code: 'ZZZ999' });
    expect(status).toBe(404);
    expect(json.error).toBe('Invalid invite code');
  });
});
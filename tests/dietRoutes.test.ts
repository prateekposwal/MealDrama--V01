import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

/**
 * Diet-preference ROUTE suite — the smallest honest harness that fits repo
 * style (vitest, no new deps): the REAL express app from server/src/index is
 * booted on an ephemeral port and probed with global fetch; ONLY prisma is
 * mocked (module mock), so auth/JWT/validation/error handling are all real.
 * The mock store gives in-memory persistence, so PUT → GET is a real
 * round-trip through the routes.
 */
const mocks = vi.hoisted(() => ({
  dietUpsert: vi.fn(),
  dietFind: vi.fn(),
  householdFind: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    dietPreference: { upsert: mocks.dietUpsert, findUnique: mocks.dietFind },
    household: { findUnique: mocks.householdFind },
  },
}));

import { buildDietApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const app = buildDietApp();

// ─── in-memory prisma store (per-user singleton — unique userId) ────────────
const dietStore = new Map<string, any>();
let rowSeq = 0;

beforeEach(() => {
  dietStore.clear();
  rowSeq = 0;
  mocks.dietUpsert.mockReset();
  mocks.dietFind.mockReset();
  mocks.householdFind.mockReset();

  mocks.dietUpsert.mockImplementation(async ({ where, create, update }: any) => {
    const existing = dietStore.get(where.userId);
    const row = {
      id: existing?.id ?? `d-${++rowSeq}`,
      ...(existing ?? create),
      ...update,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dietStore.set(where.userId, row); // one row per user (unique userId) — no duplicates
    return row;
  });
  mocks.dietFind.mockImplementation(async ({ where }: any) => dietStore.get(where.userId) ?? null);
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

const tokenFor = (userId: string, name = 'User') =>
  generateAccessToken({ userId, email: `${userId}@test.local`, phone: null, name });

describe('GET /api/v1/diet — unauthenticated guard', () => {
  it('returns 401 without a token (live-surface 401)', async () => {
    const r = await req('GET', '/api/v1/diet');
    expect(r.status).toBe(401);
    expect(r.body.error).toBeTruthy();
  });
});

describe('PUT /api/v1/diet → GET /api/v1/diet (persisted round-trip)', () => {
  const full = {
    dietType: 'non-veg',
    region: 'South India',
    allergies: ['Nuts'],
    dislikedItems: ['Bitter gourd'],
    spiceLevel: 'hot',
    healthGoal: 'High Protein',
  };

  it('round-trips: PUT then GET returns EXACTLY what was set (use case 1)', async () => {
    const t = tokenFor('u-roundtrip');
    const put = await req('PUT', '/api/v1/diet', { token: t, body: full });
    expect(put.status).toBe(200);
    expect(put.body.diet).toMatchObject({ ...full, region: 'south' });

    const get = await req('GET', '/api/v1/diet', { token: t });
    expect(get.status).toBe(200);
    expect(get.body.diet).toMatchObject({ ...full, region: 'south' });
    expect(get.body.diet.allergies).toEqual(['Nuts']);
  });

  it('returns { diet: null } before anything was set (honest empty state)', async () => {
    const r = await req('GET', '/api/v1/diet', { token: tokenFor('u-never') });
    expect(r.status).toBe(200);
    expect(r.body.diet).toBeNull();
  });

  it('upserts: a second PUT updates the SAME row — no duplicate (use case 3)', async () => {
    const t = tokenFor('u-upsert');
    await req('PUT', '/api/v1/diet', { token: t, body: { ...full, dietType: 'veg' } });
    await req('PUT', '/api/v1/diet', { token: t, body: { ...full, dietType: 'vegan' } });

    expect(dietStore.size).toBe(1); // unique userId — one row
    const get = await req('GET', '/api/v1/diet', { token: t });
    expect(get.body.diet.dietType).toBe('vegan');
  });

  it('creates a separate row per user (two users, two diets)', async () => {
    await req('PUT', '/api/v1/diet', { token: tokenFor('u-p1'), body: { ...full, dietType: 'veg' } });
    await req('PUT', '/api/v1/diet', { token: tokenFor('u-p2'), body: { ...full, dietType: 'eggitarian' } });
    expect(dietStore.size).toBe(2);
  });
});

describe('PUT /api/v1/diet — zod validation (use case 2)', () => {
  const base = { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' };
  const t = tokenFor('u-zod');

  it.each([
    ['invalid dietType', { ...base, dietType: 'carnivore' }],
    ['invalid spiceLevel', { ...base, spiceLevel: 'extra-hot' }],
    ['allergies as a plain string', { ...base, allergies: 'nuts' }],
    ['allergies with a number inside', { ...base, allergies: [42] }],
    ['invalid region', { ...base, region: 'mars' }],
  ])('rejects: %s → 400', async (_label, body) => {
    const r = await req('PUT', '/api/v1/diet', { token: t, body });
    expect(r.status).toBe(400);
  });

  it('accepts EMPTY allergies (valid "nothing to avoid" state)', async () => {
    const r = await req('PUT', '/api/v1/diet', { token: t, body: { ...base, allergies: [], dislikedItems: [] } });
    expect(r.status).toBe(200);
    expect(r.body.diet.allergies).toEqual([]);
  });
});

describe('GET /api/v1/households/:id/diets — visibility policy (use cases 4,5,6)', () => {
  const admin = { id: 'm-admin', userId: 'u-admin', name: 'Admin', role: 'admin', user: { dietPreference: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'mild', healthGoal: 'Balanced' } } };
  const memberA = { id: 'm-a', userId: 'u-a', name: 'Aisha', role: 'member', user: { dietPreference: { dietType: 'non-veg', region: 'south', allergies: ['Nuts'], dislikedItems: [], spiceLevel: 'hot', healthGoal: 'High Protein' } } };
  const memberB = { id: 'm-b', userId: 'u-b', name: 'Bala', role: 'member', user: { dietPreference: null } };
  const members = [admin, memberA, memberB];
  const HH_ID = 'hh-diets-1';

  beforeEach(() => {
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH_ID ? { id: HH_ID, members } : null,
    );
  });

  it('admin sees ALL 3 members with their REAL diets (Aisha non-veg/south, not a default)', async () => {
    const r = await req('GET', `/api/v1/households/${HH_ID}/diets`, { token: tokenFor('u-admin') });
    expect(r.status).toBe(200);
    const rows = r.body.members;
    expect(rows).toHaveLength(3);
    const aisha = rows.find((m: any) => m.memberId === 'm-a')!;
    expect(aisha.diet.dietType).toBe('non-veg');
    expect(aisha.diet.region).toBe('south');
    expect(aisha.diet.allergies).toEqual(['Nuts']);
    expect(aisha.diet.spiceLevel).toBe('hot');
    expect(aisha.diet.healthGoal).toBe('High Protein');
    // member who never set → null (not 'veg', not 'north')
    const bala = rows.find((m: any) => m.memberId === 'm-b')!;
    expect(bala.diet).toBeNull();
  });

  it('non-admin member sees ONLY their own diet (Aisha does not see Bala/Admin)', async () => {
    const r = await req('GET', `/api/v1/households/${HH_ID}/diets`, { token: tokenFor('u-a') });
    expect(r.status).toBe(200);
    const rows = r.body.members;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.memberId).toBe('m-a');
    expect(rows[0]!.diet!.dietType).toBe('non-veg');
  });

  it('non-member → 403', async () => {
    const r = await req('GET', `/api/v1/households/${HH_ID}/diets`, { token: tokenFor('u-stranger') });
    expect(r.status).toBe(403);
  });

  it('unknown household → 404', async () => {
    const r = await req('GET', '/api/v1/households/nope/diets', { token: tokenFor('u-admin') });
    expect(r.status).toBe(404);
  });

  it('unauthenticated → 401', async () => {
    const r = await req('GET', `/api/v1/households/${HH_ID}/diets`);
    expect(r.status).toBe(401);
  });
});

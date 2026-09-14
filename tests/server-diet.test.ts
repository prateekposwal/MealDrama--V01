import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import express from 'express';
import { makeApp, listen } from './server-test-utils';

// Hoisted before the router imports (they pull `../lib/prisma`).
vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    dietPreference: { findUnique: vi.fn(), upsert: vi.fn() },
    household: { findUnique: vi.fn() },
  },
  connectWithRetry: vi.fn(),
}));

// eslint-disable-next-line import/first
import { dietRouter, householdDietsRouter } from '../server/src/routes/diet';
// eslint-disable-next-line import/first
import { generateAccessToken } from '../server/src/lib/auth';
// eslint-disable-next-line import/first
import { prisma } from '../server/src/lib/prisma';

interface MockDietModel { findUnique: Mock; upsert: Mock; }
interface MockHouseholdModel { findUnique: Mock; }

const mDiet = prisma.dietPreference as unknown as MockDietModel;
const mHousehold = prisma.household as unknown as MockHouseholdModel;

const token = generateAccessToken({ userId: 'user-1', email: 'kamala@x.dev', phone: null, name: 'Kamala' });
const memberToken = generateAccessToken({ userId: 'user-2', email: 'm@x.dev', phone: null, name: 'Member' });

const row = (over: Partial<any> = {}) => ({
  userId: 'user-1',
  dietType: 'veg',
  region: 'north',
  allergies: [],
  dislikedItems: [],
  spiceLevel: 'medium',
  healthGoal: '',
  noveltyPreference: 'balanced',
  cuisineAffinities: [],
  ...over,
});

const household = (over: Partial<any> = {}) => ({
  id: 'h-1',
  members: [
    { id: 'm-1', userId: 'user-1', name: 'Kamala', role: 'admin', user: { dietPreference: row() } },
    { id: 'm-2', userId: 'user-2', name: 'Member', role: 'member', user: { dietPreference: row({ userId: 'user-2', dietType: 'vegan' }) } },
  ],
  ...over,
});

let server: ReturnType<express.Express['listen']>;
let base: string;

beforeAll(async () => {
  const run = await listen(
    makeApp([
      ['/api/v1/diet', dietRouter as express.RequestHandler],
      ['/api/v1/households', householdDietsRouter as express.RequestHandler],
    ]),
  );
  server = run.server;
  base = run.base + '/api/v1';
});

afterAll(() => new Promise<void>(r => server.close(() => r())));

beforeEach(() => {
  vi.clearAllMocks();
  mDiet.findUnique.mockResolvedValue(null);
  mDiet.upsert.mockResolvedValue(row());
  mHousehold.findUnique.mockResolvedValue(null);
});

async function api(
  path: string,
  method: 'GET' | 'PUT' | 'POST',
  body: unknown,
  auth = token,
): Promise<{ status: number; json: any }> {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${auth}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

const VALID = {
  dietType: 'veg',
  region: 'North India',
  spiceLevel: 'medium',
};

describe('PUT /api/v1/diet (diet-changed signal)', () => {
  it('first-ever set: wasUnset=true, dietChanged=false, region normalized', async () => {
    const { status, json } = await api('/diet', 'PUT', VALID);

    expect(status).toBe(200);
    expect(json.wasUnset).toBe(true);
    expect(json.dietChanged).toBe(false);
    expect(json.changed).toEqual({ dietType: false, region: false, allergies: false });
    expect(json.diet.region).toBe('north');
    expect(mDiet.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ region: 'north', userId: 'user-1' }),
      }),
    );
  });

  it('re-setting the SAME values: dietChanged=false (no regenerate prompt)', async () => {
    mDiet.findUnique.mockResolvedValue(row({ dietType: 'veg', region: 'north' }));
    const { json } = await api('/diet', 'PUT', VALID);

    expect(json.wasUnset).toBe(false);
    expect(json.dietChanged).toBe(false);
  });

  it('changing dietType flips dietChanged + the per-field flag', async () => {
    mDiet.findUnique.mockResolvedValue(row({ dietType: 'veg', region: 'north' }));
    mDiet.upsert.mockResolvedValue(row({ dietType: 'vegan', region: 'south' }));

    const { status, json } = await api('/diet', 'PUT', {
      dietType: 'vegan', region: 'South India', spiceLevel: 'medium',
    });

    expect(status).toBe(200);
    expect(json.dietChanged).toBe(true);
    expect(json.changed.dietType).toBe(true);
    expect(json.changed.region).toBe(true);
    expect(json.diet.dietType).toBe('vegan');
  });

  it('rejects out-of-bounds values with 400 (zod bound, no DB write)', async () => {
    mDiet.upsert.mockRejectedValue(new Error('must not be called'));
    const bad = await api('/diet', 'PUT', { ...VALID, dietType: 'carnivore' });
    expect(bad.status).toBe(400);
    expect(mDiet.upsert).not.toHaveBeenCalled();

    const badRegion = await api('/diet', 'PUT', { ...VALID, region: 'Atlantis' });
    expect(badRegion.status).toBe(400);
  });

  it('blocks unauthenticated PUTs (authMiddleware)', async () => {
    const res = await fetch(base + '/diet', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(VALID) });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/diet', () => {
  it('returns { diet: null } honestly when never set', async () => {
    const { status, json } = await api('/diet', 'GET', undefined);
    expect(status).toBe(200);
    expect(json.diet).toBeNull();
  });

  it('serializes a set preference with full defaults', async () => {
    mDiet.findUnique.mockResolvedValue(row({ dietType: 'eggitarian', cuisineAffinities: ['punjabi'] }));
    const { json } = await api('/diet', 'GET', undefined);
    expect(json.diet.dietType).toBe('eggitarian');
    expect(json.diet.cuisineAffinities).toEqual(['punjabi']);
    expect(json.diet.spiceLevel).toBe('medium');
    expect(json.diet.allergies).toEqual([]);
  });
});

describe('GET /api/v1/households/:id/diets (visibility policy)', () => {
  it('admins see every member diet', async () => {
    mHousehold.findUnique.mockResolvedValue(household());
    const { status, json } = await api('/households/h-1/diets', 'GET', undefined);

    expect(status).toBe(200);
    expect(json.members).toHaveLength(2);
    expect(json.members.find((m: any) => m.role === 'admin').diet.dietType).toBe('veg');
    expect(json.members.find((m: any) => m.role === 'member').diet.dietType).toBe('vegan');
  });

  it('non-admin members see ONLY their own diet', async () => {
    mHousehold.findUnique.mockResolvedValue(household());
    const { json } = await api('/households/h-1/diets', 'GET', undefined, memberToken);

    expect(json.members).toHaveLength(1);
    expect(json.members[0].userId).toBe('user-2');
    expect(json.members[0].diet.dietType).toBe('vegan');
  });

  it('non-members get 403', async () => {
    mHousehold.findUnique.mockResolvedValue(household());
    const stranger = generateAccessToken({ userId: 'user-99', email: 's@x.dev', phone: null });
    const res = await api('/households/h-1/diets', 'GET', undefined, stranger);
    expect(res.status).toBe(403);
  });

  it('missing household 404s', async () => {
    const { status, json } = await api('/households/nope/diets', 'GET', undefined);
    expect(status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });
});
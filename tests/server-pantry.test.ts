import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import express from 'express';
import { makeApp, listen } from './server-test-utils';

// Hoisted before the router import (it pulls `../lib/prisma`).
vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    household: { findUnique: vi.fn() },
    householdMember: { findMany: vi.fn() },
    traySlot: { findMany: vi.fn() },
  },
  connectWithRetry: vi.fn(),
}));

// eslint-disable-next-line import/first
import pantryRouter from '../server/src/routes/pantry';
// eslint-disable-next-line import/first
import { generateAccessToken } from '../server/src/lib/auth';
// eslint-disable-next-line import/first
import { resolveMealIngredients } from '../server/src/lib/ingredientResolver';
// eslint-disable-next-line import/first
import { prisma } from '../server/src/lib/prisma';

interface MockHouseholdModel { findUnique: Mock; }
interface MockMemberModel { findMany: Mock; }
interface MockSlotModel { findMany: Mock; }

const mHousehold = prisma.household as unknown as MockHouseholdModel;
const mMember = prisma.householdMember as unknown as MockMemberModel;
const mSlot = prisma.traySlot as unknown as MockSlotModel;

const token = generateAccessToken({ userId: 'user-2', email: 'm@x.dev', phone: null, name: 'Member' });
const ownerToken = generateAccessToken({ userId: 'user-1', email: 'k@x.dev', phone: null, name: 'Owner' });
const strangerToken = generateAccessToken({ userId: 'user-99', email: 's@x.dev', phone: null, name: 'Stranger' });

const household = (extra: { includeUser?: boolean; members?: any[] } = {}) => ({
  id: 'h-1',
  members: [
    { id: 'm-1', userId: 'user-1', name: 'Owner', role: 'admin' },
    { id: 'm-2', userId: 'user-2', name: 'Member', role: 'member' },
    ...(extra.includeUser === false ? [] : []),
    ...(extra.members ?? []),
  ],
});

const ALOO_PARATHA = alooParathaId();

function alooParathaId(): string {
  // Any stable meal_id with a real ingredient footprint in PANTRY_SNAPSHOT.
  return 'aloo-paratha';
}

/** Pick a resolved ingredient we can assert on AFTER buildPantryGroups runs:
 *  produce/grains get unit-converted (pcs→g, cup→g), but spice/pantry units
 *  (tsp/tbsp) survive — assert on one of those. */
function stableIngredient() {
  const ings = resolveMealIngredients(ALOO_PARATHA);
  const stable = ings.find(i => i.unit === 'tsp' || i.unit === 'tbsp') ?? ings[0];
  if (!stable) throw new Error('aloo-paratha resolves no ingredients');
  return stable;
}

let server: ReturnType<express.Express['listen']>;
let base: string;

beforeAll(async () => {
  const run = await listen(
    makeApp([['/api/v1/households', pantryRouter as express.RequestHandler]]),
  );
  server = run.server;
  base = run.base + '/api/v1/households';
});

afterAll(() => new Promise<void>(r => server.close(() => r())));

beforeEach(() => {
  vi.clearAllMocks();
  mHousehold.findUnique.mockResolvedValue(household());
  mMember.findMany.mockResolvedValue([
    { id: 'm-1', userId: 'user-1', name: 'Owner', role: 'admin' },
    { id: 'm-2', userId: 'user-2', name: 'Member', role: 'member' },
  ]);
  mSlot.findMany.mockResolvedValue([]);
});

async function getPantry(householdId: string, auth = token) {
  const res = await fetch(`${base}/${householdId}/pantry`, {
    method: 'GET',
    headers: auth ? { authorization: `Bearer ${auth}` } : {},
  });
  return { status: res.status, json: await res.json() };
}

describe('GET /api/v1/households/:id/pantry (membership + aggregation)', () => {
  it('blocks unauthenticated callers (401)', async () => {
    const { status } = await getPantry('h-1', '');
    expect(status).toBe(401);
  });

  it('404s for an unknown household', async () => {
    mHousehold.findUnique.mockResolvedValue(null);
    const { status, json } = await getPantry('nope');
    expect(status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('403s a non-member (no pantry leakage)', async () => {
    const { status, json } = await getPantry('h-1', strangerToken);
    expect(status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('returns empty ingredients when no member has a userId', async () => {
    mMember.findMany.mockResolvedValue([{ id: 'm-9', userId: null, name: 'Ghost' }]);
    const { status, json } = await getPantry('h-1');

    expect(status).toBe(200);
    expect(json.ingredients).toEqual([]);
    expect(json.members).toEqual([{ id: 'm-9', name: 'Ghost' }]);
  });

  it('aggregates member meals and scales quantity × servings', async () => {
    const ing = stableIngredient();
    const SERVINGS = 2;
    mSlot.findMany.mockResolvedValue([
      {
        id: 's-1',
        userId: 'user-2',
        date: new Date('2026-09-14T00:00:00Z'),
        slot: 'DINNER',
        items: [
          {
            mealId: ALOO_PARATHA,
            quantity: SERVINGS,
            requestedBy: null,
            gravyStyle: null,
            rotiType: null,
            riceType: null,
            sides: [],
            beverages: [],
            meal: { name: 'Aloo Paratha' },
            customDish: null,
          },
        ],
      },
    ]);

    const { status, json } = await getPantry('h-1');
    expect(status).toBe(200);
    expect(json.meals).toBe(1);
    expect(json.members.length).toBe(2);

    const allItems = (json.ingredients as any[]).flatMap((g: any) => g.items as any[]);
    const match = allItems.find((i: any) => i.name === ing.name && i.unit === ing.unit);
    expect(match, `expected "${ing.name}" (${ing.unit}) in aggregated pantry`).toBeDefined();
    expect(match.quantity).toBeCloseTo(ing.quantity * SERVINGS, 5);
  });

  it('resolves category sides into the ingredient list', async () => {
    mSlot.findMany.mockResolvedValue([
      {
        id: 's-1',
        userId: 'user-2',
        date: new Date('2026-09-14T00:00:00Z'),
        slot: 'DINNER',
        items: [
          {
            mealId: ALOO_PARATHA,
            quantity: 1,
            requestedBy: null,
            gravyStyle: null,
            rotiType: 'roti',
            riceType: null,
            sides: ['roti'],
            beverages: [],
            meal: { name: 'Aloo Paratha' },
            customDish: null,
          },
        ],
      },
    ]);

    const { status, json } = await getPantry('h-1');
    expect(status).toBe(200);

    // resolveCategoryIngredients('roti') must have fed the groups.
    const resolved = await import('../server/src/lib/ingredientResolver');
    const rotiIngs = resolved.resolveCategoryIngredients('roti');
    expect(rotiIngs.length).toBeGreaterThan(0);
    const allItems = (json.ingredients as any[]).flatMap((g: any) => g.items as any[]);
    for (const ri of rotiIngs) {
      expect(allItems.some((i: any) => i.name === ri.name), `${ri.name} from 'roti' category`).toBe(true);
    }
  });
});
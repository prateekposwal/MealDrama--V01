// ─────────────────────────────────────────────────────────────────────────────
// PANTRY ROUTE — GET /api/v1/households/:householdId/pantry
//
// The prod 500 bug: the resolver require()d root-only client TS modules that
// are never compiled into server/dist → MODULE_NOT_FOUND on every member read
// in a built server. The resolver now reads the server-owned PANTRY_SNAPSHOT
// via server/src/lib/ingredientResolver (see pantryResolver.parity.test.ts for
// engine parity). This file pins the ROUTE contract: response shape, group
// labels, per-dish × servings, sides/beverages, legacy-id skips, and the
// 401/403 membership gates.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { buildPantryApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';

const mocks = vi.hoisted(() => ({
  householdFindUnique: vi.fn(),
  householdMemberFindMany: vi.fn(),
  traySlotFindMany: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    household: { findUnique: mocks.householdFindUnique },
    householdMember: { findMany: mocks.householdMemberFindMany },
    traySlot: { findMany: mocks.traySlotFindMany },
  },
}));


const app = buildPantryApp();

function listen(): Promise<{ base: string; server: Server }> {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () =>
      resolve({ base: `http://127.0.0.1:${(s.address() as AddressInfo).port}`, server: s }),
    );
  });
}

let base = '';
let server: Server;
const token = generateAccessToken({ userId: 'u-riya', email: 'r@x.com', phone: null, name: 'Riya' });

beforeAll(async () => {
  ({ base, server } = await listen());
});

afterAll(() => server.close());

const HOUSEHOLD = {
  id: 'hh-1',
  name: 'Sharma House',
  code: 'ABC123',
  members: [
    { id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin' },
    { id: 'mem-ankit', userId: 'u-ankit', name: 'Ankit', role: 'member' },
  ],
};

async function api(path: string, opts: { method?: string; token?: string } = {}) {
  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? 'GET',
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
  });
  return { status: res.status, body: (await res.json()) as any };
}

describe('GET /households/:householdId/pantry', () => {
  it('401 without a token', async () => {
    mocks.householdFindUnique.mockResolvedValue(null);
    const r = await api('/api/v1/households/hh-1/pantry');
    expect(r.status).toBe(401);
  });

  it('403 for a non-member', async () => {
    mocks.householdFindUnique.mockResolvedValue({
      ...HOUSEHOLD,
      members: [HOUSEHOLD.members[1]], // only u-ankit — Riya is NOT a member
    });
    const r = await api('/api/v1/households/hh-1/pantry', { token });
    expect(r.status).toBe(403);
  });

  it('200: member read aggregates per-dish × servings + sides into pantry groups', async () => {
    mocks.householdFindUnique.mockResolvedValue(HOUSEHOLD);
    mocks.householdMemberFindMany.mockResolvedValue(HOUSEHOLD.members);
    mocks.traySlotFindMany.mockResolvedValue([
      {
        id: 'slot-1',
        userId: 'u-riya',
        slot: 'lunch',
        date: new Date('2026-09-14T00:00:00Z'),
        items: [
          {
            mealId: 'rajma-chawal',
            quantity: 2,
            requestedBy: 'Riya',
            gravyStyle: null,
            rotiType: null,
            riceType: null,
            sides: ['salad'],
            beverages: ['chaas'],
            meal: { name: 'Rajma Chawal' },
            customDish: null,
          },
        ],
      },
      {
        id: 'slot-2',
        userId: 'u-ankit',
        slot: 'dinner',
        date: new Date('2026-09-14T00:00:00Z'),
        items: [
          {
            // legacy id — NOT in DISH_LIBRARY → the old route skipped it; so do we.
            mealId: 'dal-makhani',
            quantity: 1,
            requestedBy: null,
            gravyStyle: null,
            rotiType: null,
            riceType: null,
            sides: [],
            beverages: [],
            meal: { name: 'Dal Makhani' },
            customDish: null,
          },
        ],
      },
    ]);

    const r = await api('/api/v1/households/hh-1/pantry', { token });
    expect(r.status).toBe(200);
    expect(r.body.meals).toBe(2);
    expect(r.body.members).toEqual([
      { id: 'mem-riya', name: 'Riya' },
      { id: 'mem-ankit', name: 'Ankit' },
    ]);
    const grouped = r.body.ingredients as Array<{ category: string; label: string; emoji: string; items: Array<{ name: string; quantity: number; unit: string; sources: string[] }> }>;
    expect(grouped.length).toBeGreaterThan(0);

    const riceGroup = grouped.find((g) => g.category === 'grains');
    const riceItem = riceGroup?.items.find((i) => i.name.includes('Basmati Rice'));
    expect(riceItem).toBeTruthy();
    // 2× rajma-chawal servings → rice quantity doubles (snapshot card × servings).
    expect(riceItem!.quantity).toBeGreaterThan(0);

    const labItem = grouped.flatMap((g) => g.items).find((i) => i.sources.includes('Riya — Rajma Chawal · chaas'));
    expect(labItem).toBeTruthy();

    // Sources text carries the meal names.
    const dalSourced = grouped.flatMap((g) => g.items).some((i) => i.sources.includes('Dal Makhani'));
    expect(dalSourced).toBe(false); // legacy id contributed NOTHING — same as the old route's skip
    const rajmaSourced = grouped.flatMap((g) => g.items).some((i) => i.sources.includes('Riya — Rajma Chawal'));
    expect(rajmaSourced).toBe(true);
  });

  it('200: empty household returns its members but no meals/ingredients', async () => {
    mocks.householdFindUnique.mockResolvedValue(HOUSEHOLD);
    mocks.householdMemberFindMany.mockResolvedValue([]);
    mocks.traySlotFindMany.mockResolvedValue([]);
    const r = await api('/api/v1/households/hh-1/pantry', { token });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ingredients: [], members: [] });
  });
});
import { describe, it, expect } from 'vitest';
import {
  regionPriority,
  compareRegion,
  REGION_PROXIMITY,
} from '../utils/regionPreference';
import { rankDishes, selectTryThese, dishSlotScore, getRegionKey, dishSortComparator } from '../utils/dishSearch';
import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDish(overrides: { id: string; name: string; region: string } & Partial<Omit<Dish, 'id' | 'name' | 'region'>>): Dish {
  const base = {
    type: 'veg',
    tags: ['user_created'],
    variants: [],
    categories: [],
    category: ['Lunch'],
    slotCategory: [] as any,
    states: [],
    nutrition: [] as any,
    season: [] as any,
  };
  return { ...base, ...overrides } as unknown as Dish;
}

// ─── regionPriority / compareRegion ───────────────────────────────────────────

describe('regionPriority', () => {
  it('exact region match = 0 (front of list)', () => {
    expect(regionPriority('north', 'north')).toBe(0);
  });

  it('nearest regions rank between exact and far regions', () => {
    expect(regionPriority('north', 'west')).toBeLessThan(regionPriority('north', 'south'));
    expect(regionPriority('north', 'west')).toBeGreaterThan(regionPriority('north', 'north'));
  });

  it('all-region dishes sit after exact + neighbors', () => {
    expect(regionPriority('north', 'all')).toBeGreaterThan(regionPriority('north', 'west'));
    expect(regionPriority('north', 'all')).toBeGreaterThan(regionPriority('north', 'north'));
  });

  it('unknown/far-region dishes rank last but are NEVER excluded', () => {
    expect(regionPriority('north', 'north')).toBeLessThan(regionPriority('north', 'south'));
    expect(regionPriority('north', 'south')).toBe(6);
  });
});

describe('compareRegion', () => {
  it('sorts a south dish after a north dish when region is north', () => {
    expect(compareRegion('north', 'north', 'south')).toBeLessThan(0);
    expect(compareRegion('north', 'south', 'north')).toBeGreaterThan(0);
  });

  it('orders nearest-region dishes before southern dishes', () => {
    expect(compareRegion('north', 'west', 'south')).toBeLessThan(0);
  });

  it('orders all-region dishes before far-region dishes when browsing', () => {
    expect(compareRegion('north', 'all', 'south')).toBeLessThan(0);
  });
});

// ─── rankDishes integration ───────────────────────────────────────────────────

describe('rankDishes region-first integration', () => {
  const dishes = [
    makeDish({ id: 'south-dosa', name: 'Dosa', region: 'south' }),
    makeDish({ id: 'north-naan', name: 'Naan', region: 'north' }),
    makeDish({ id: 'west-pav', name: 'Vada Pav', region: 'west' }),
    makeDish({ id: 'multi-sandwich', name: 'Sandwich', region: 'all' }),
  ];
  // Pre-seed the dish graph so the same-slot gate recognizes these as lunch dishes.
  // (ensureIndexes runs inside rankDishes on the given array.)

  it('browse (no query): region match first, then nearest region, then all, then far', () => {
    const result = rankDishes({
      dishes,
      slot: 'lunch',
      diet: 'veg',
      regionKey: 'north',
      query: '',
      showGlobal: true,
    }).map(s => s.dish.id);
    expect(result[0]).toBe('north-naan'); // exact match
    expect(result.indexOf('west-pav')).toBeLessThan(result.indexOf('south-dosa')); // nearest before far
    expect(result).toContain('south-dosa'); // NEVER excluded
    expect(result).toContain('multi-sandwich'); // all-region included
  });

  it('free search: a strong text match from another region still surfaces', () => {
    const result = rankDishes({
      dishes,
      slot: 'lunch',
      diet: 'veg',
      regionKey: 'north',
      query: 'dosa',
      showGlobal: true,
    }).map(s => s.dish.id);
    expect(result).toContain('south-dosa');
    expect(result[0]).toBe('south-dosa');
  });

  it('user freedom: every region is present in results, never filtered out', () => {
    for (const regionKey of ['north', 'south', 'west', 'east']) {
      const result = rankDishes({
        dishes,
        slot: 'lunch',
        diet: 'veg',
        regionKey,
        query: '',
        showGlobal: true,
      });
      const ids = result.map(s => s.dish.id);
      expect(ids).toContain('south-dosa');
      expect(ids).toContain('north-naan');
      expect(ids).toContain('west-pav');
      expect(ids).toContain('multi-sandwich');
    }
  });
});

// ─── REGION_PROXIMITY sanity ─────────────────────────────────────────────────

describe('REGION_PROXIMITY', () => {
  it('maps every region with itself first', () => {
    for (const key of Object.keys(REGION_PROXIMITY) as Array<keyof typeof REGION_PROXIMITY>) {
      const first = REGION_PROXIMITY[key]?.[0];
      expect(first).toBe(key);
    }
  });
});


// ─── selectTryThese / dishSlotScore ──────────────────────────────────────────

describe('dishSlotScore', () => {
  it('maps breakfast/lunch/snacks/dinner to 0-3 and unknown to 4', () => {
    expect(dishSlotScore(makeDish({ id: 'score-b', name: 'B', region: 'north', category: ['breakfast'] }))).toBe(0);
    expect(dishSlotScore(makeDish({ id: 'score-l', name: 'L', region: 'north', category: ['lunch'] }))).toBe(1);
    expect(dishSlotScore(makeDish({ id: 'score-s', name: 'S', region: 'north', category: ['snacks'] }))).toBe(2);
    expect(dishSlotScore(makeDish({ id: 'score-d', name: 'D', region: 'north', category: ['dinner'] }))).toBe(3);
    expect(dishSlotScore(makeDish({ id: 'score-x', name: 'X', region: 'north', category: ['winter-lunch'] }))).toBe(4);
  });

  it('takes the lowest (earliest) score for multi-category dishes', () => {
    expect(dishSlotScore(makeDish({ id: 'score-m', name: 'M', region: 'north', category: ['snacks', 'lunch'] }))).toBe(1);
  });
});

describe('selectTryThese', () => {
  // North + all-region dishes across every slot; mixed diets so the non-veg
  // user rule is exercised honestly (non-veg never restricts).
  const balancedPool = [
    makeDish({ id: 'b-n1', name: 'Aloo Paratha', region: 'north', category: ['breakfast'], type: 'veg' }),
    makeDish({ id: 'b-a1', name: 'Fruit', region: 'all', category: ['breakfast'], type: 'eggitarian' }),
    makeDish({ id: 'l-n1', name: 'Rajma', region: 'north', category: ['lunch'], type: 'veg' }),
    makeDish({ id: 'l-a1', name: 'Sandwich', region: 'all', category: ['lunch'], type: 'non-veg' }),
    makeDish({ id: 's-n1', name: 'Samosa', region: 'north', category: ['snacks'], type: 'veg' }),
    makeDish({ id: 's-a1', name: 'Nachos', region: 'all', category: ['snacks'], type: 'eggitarian' }),
    makeDish({ id: 'd-n1', name: 'Paneer', region: 'north', category: ['dinner'], type: 'non-veg' }),
    makeDish({ id: 'd-a1', name: 'Soup', region: 'all', category: ['dinner'], type: 'veg' }),
  ];

  const opts = { userDiet: 'non-veg', regionKey: 'north' };

  it('returns a slot-balanced mix: 2 per planned slot, 8 total', () => {
    const result = selectTryThese(balancedPool, opts);
    expect(result).toHaveLength(8);
    const perSlot: Record<number, number> = {};
    for (const d of result) {
      const score = dishSlotScore(d);
      perSlot[score] = (perSlot[score] ?? 0) + 1;
    }
    expect(perSlot[0]).toBe(2); // breakfast
    expect(perSlot[1]).toBe(2); // lunch
    expect(perSlot[2]).toBe(2); // snacks
    expect(perSlot[3]).toBe(2); // dinner
  });

  it('never excludes far-region (all-tier) dishes or restricts a non-veg user', () => {
    const ids = selectTryThese(balancedPool, opts).map(d => d.id);
    expect(ids).toContain('b-a1');
    expect(ids).toContain('l-a1');
    expect(ids).toContain('s-a1');
    expect(ids).toContain('d-a1');
    expect(ids).toContain('d-n1'); // non-veg dish stays for a non-veg user
  });

  it('is deterministic: same input → same order', () => {
    const a = selectTryThese(balancedPool, opts).map(d => d.id);
    const b = selectTryThese(balancedPool, opts).map(d => d.id);
    expect(a).toEqual(b);
  });

  it('honors plannedSlots via SLOT_SCORE order and caps the total at 8', () => {
    const result = selectTryThese(balancedPool, {
      userDiet: 'non-veg', regionKey: 'north',
      plannedSlots: ['Snacks', 'Breakfast'], maxPerSlot: 3,
    });
    const ids = result.map(d => d.id);
    expect(ids[0]).toBe('b-n1'); // breakfast (0) precedes snacks (2)
    expect(ids[1]).toBe('s-n1');
    expect(result).toHaveLength(8);
  });

  it('keeps an all-region breakfast dish in the breakfast bucket (slot-first, not region-first)', () => {
    // 9 north dishes + 1 all-region breakfast: a global region-first top-8
    // would drop Fruit, but slot-first bucketing keeps it with Bread.
    const fruitPool = [
      makeDish({ id: 'bread', name: 'Bread', region: 'north', category: ['breakfast'] }),
      makeDish({ id: 'fruit', name: 'Fruit', region: 'all', category: ['breakfast'] }),
      makeDish({ id: 'l1', name: 'Dal', region: 'north', category: ['lunch'] }),
      makeDish({ id: 'l2', name: 'Rajma', region: 'north', category: ['lunch'] }),
      makeDish({ id: 'l3', name: 'Chole', region: 'north', category: ['lunch'] }),
      makeDish({ id: 'l4', name: 'Kadhi', region: 'north', category: ['lunch'] }),
      makeDish({ id: 's1', name: 'Samosa', region: 'north', category: ['snacks'] }),
      makeDish({ id: 's2', name: 'Kachori', region: 'north', category: ['snacks'] }),
      makeDish({ id: 'd1', name: 'Paneer', region: 'north', category: ['dinner'] }),
      makeDish({ id: 'd2', name: 'Roti', region: 'north', category: ['dinner'] }),
    ];
    const ids = selectTryThese(fruitPool, { userDiet: 'non-veg', regionKey: 'north' }).map(d => d.id);
    expect(ids).toContain('fruit');
    expect(ids.indexOf('bread')).toBeLessThan(ids.indexOf('fruit')); // bucket region order intact
  });

  it('excludes already-added ids, backfills to the same count, keeps slot balance, stays deterministic', () => {
    // 4 region-passing dishes per slot (north + all — south/west are outside the
    // strip's region pool) so excluding one per slot still leaves a full 8-dish,
    // slot-balanced strip (proves the backfill, not just a shorter list).
    const pool = [
      makeDish({ id: 'b-n1', name: 'Aloo Paratha', region: 'north', category: ['breakfast'], type: 'veg' }),
      makeDish({ id: 'b-n2', name: 'Chole Bhature', region: 'north', category: ['breakfast'], type: 'veg' }),
      makeDish({ id: 'b-a1', name: 'Fruit', region: 'all', category: ['breakfast'], type: 'eggitarian' }),
      makeDish({ id: 'b-a2', name: 'Cereal', region: 'all', category: ['breakfast'], type: 'veg' }),
      makeDish({ id: 'l-n1', name: 'Rajma', region: 'north', category: ['lunch'], type: 'veg' }),
      makeDish({ id: 'l-n2', name: 'Chole', region: 'north', category: ['lunch'], type: 'veg' }),
      makeDish({ id: 'l-a1', name: 'Sandwich', region: 'all', category: ['lunch'], type: 'non-veg' }),
      makeDish({ id: 'l-a2', name: 'Burger', region: 'all', category: ['lunch'], type: 'non-veg' }),
      makeDish({ id: 's-n1', name: 'Samosa', region: 'north', category: ['snacks'], type: 'veg' }),
      makeDish({ id: 's-n2', name: 'Kachori', region: 'north', category: ['snacks'], type: 'veg' }),
      makeDish({ id: 's-a1', name: 'Nachos', region: 'all', category: ['snacks'], type: 'eggitarian' }),
      makeDish({ id: 's-a2', name: 'Popcorn', region: 'all', category: ['snacks'], type: 'veg' }),
      makeDish({ id: 'd-n1', name: 'Paneer', region: 'north', category: ['dinner'], type: 'non-veg' }),
      makeDish({ id: 'd-n2', name: 'Dal Makhani', region: 'north', category: ['dinner'], type: 'veg' }),
      makeDish({ id: 'd-a1', name: 'Soup', region: 'all', category: ['dinner'], type: 'veg' }),
      makeDish({ id: 'd-a2', name: 'Salad', region: 'all', category: ['dinner'], type: 'veg' }),
    ];
    const added = ['b-n1', 'l-a1', 's-n1', 'd-a1']; // one already added per slot
    const result = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: added });
    const ids = result.map(d => d.id);

    // (a) never returns an excluded id
    for (const ex of added) expect(ids).not.toContain(ex);

    // (b) backfills to the same count (8)
    expect(result).toHaveLength(8);

    // (c) slot balance preserved: 2 per slot
    const perSlot: Record<number, number> = {};
    for (const d of result) {
      const score = dishSlotScore(d);
      perSlot[score] = (perSlot[score] ?? 0) + 1;
    }
    expect(perSlot[0]).toBe(2); // breakfast
    expect(perSlot[1]).toBe(2); // lunch
    expect(perSlot[2]).toBe(2); // snacks
    expect(perSlot[3]).toBe(2); // dinner

    // (d) deterministic — and stable regardless of excludeIds ordering (Set-based)
    const again = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: added }).map(d => d.id);
    expect(ids).toEqual(again);
    const reversed = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: [...added].reverse() }).map(d => d.id);
    expect(ids).toEqual(reversed);
  });

  it('returns [] when every matching dish is already added (honest empty, no crash)', () => {
    const all = balancedPool.map(d => d.id);
    const result = selectTryThese(balancedPool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: all });
    expect(result).toEqual([]);
  });
});


// ─── getRegionKey ─────────────────────────────────────────────────────────────

describe('getRegionKey', () => {
  it("bare 'India'/'INDIA' normalizes to 'all' (unknown region)", () => {
    expect(getRegionKey('India')).toBe('all');
    expect(getRegionKey('INDIA')).toBe('all');
    expect(getRegionKey('india')).toBe('all');
    expect(getRegionKey('All India')).toBe('all');
  });

  it("region-qualified 'X India' normalizes to the region key", () => {
    expect(getRegionKey('North India')).toBe('north');
    expect(getRegionKey('South India')).toBe('south');
    expect(getRegionKey('East India')).toBe('east');
    expect(getRegionKey('West India')).toBe('west');
    expect(getRegionKey('Central India')).toBe('central');
  });

  it('falls back to all for empty/undefined input', () => {
    expect(getRegionKey('')).toBe('all');
    expect(getRegionKey(undefined)).toBe('all');
  });

  it('passes already-normalized keys through untouched', () => {
    expect(getRegionKey('north')).toBe('north');
    expect(getRegionKey('northeast')).toBe('northeast');
  });
});

// ─── selectTryThese exact-region matching ────────────────────────────────────

describe('selectTryThese exact-region matching', () => {
  const pool = [
    makeDish({ id: 'ne-dish', name: 'Doh Khleh', region: 'northeast', category: ['lunch'] }),
    makeDish({ id: 'n-dish', name: 'Rajma', region: 'north', category: ['lunch'] }),
    makeDish({ id: 'all-dish', name: 'Sandwich', region: 'all', category: ['lunch'] }),
    makeDish({ id: 'e-dish', name: 'Mishti', region: 'east', category: ['lunch'] }),
  ];

  it("regionKey 'northeast' does NOT admit a 'north' dish (exact match, not substring)", () => {
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'northeast' }).map(d => d.id);
    expect(ids).not.toContain('n-dish');
    expect(ids).not.toContain('e-dish');
  });

  it("regionKey 'northeast' admits its own region and all-region dishes", () => {
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'northeast' }).map(d => d.id);
    expect(ids).toContain('ne-dish');
    expect(ids).toContain('all-dish');
  });

  it("regionKey 'north' is symmetric: does not admit 'northeast' dishes", () => {
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north' }).map(d => d.id);
    expect(ids).not.toContain('ne-dish');
    expect(ids).toContain('n-dish');
    expect(ids).toContain('all-dish');
  });
});

// ─── dishSortComparator (extracted DishSearchModal compound sort) ────────────

describe('dishSortComparator', () => {
  const pool = [
    makeDish({ id: 'bf-north', name: 'Aloo Paratha', region: 'north', category: ['breakfast'], calories: 400 }),
    makeDish({ id: 'bf-all', name: 'Fruit Bowl', region: 'all', category: ['breakfast'], calories: 120 }),
    makeDish({ id: 'ln-north', name: 'Rajma', region: 'north', category: ['lunch'], calories: 350 }),
    makeDish({ id: 'ln-south-dosa', name: 'Dosa', region: 'south', category: ['lunch'], calories: 200 }),
    makeDish({ id: 'ln-south-idli', name: 'Idli', region: 'south', category: ['lunch'], calories: 620 }),
  ];
  const sortIds = (params: Parameters<typeof dishSortComparator>[0]) =>
    [...pool].sort(dishSortComparator(params)).map(d => d.id);

  it('health match is primary within the same slot tier (low-cal leads)', () => {
    const ids = sortIds({ regionKey: 'south', mealType: 'lunch', healthFilter: 'low-cal' });
    expect(ids).toEqual(['ln-south-dosa', 'ln-south-idli', 'ln-north', 'bf-all', 'bf-north']);
  });

  it('region is the tiebreak when health matches tie (inactive filter)', () => {
    const ids = sortIds({ regionKey: 'north', mealType: 'lunch', healthFilter: 'all' });
    expect(ids).toEqual(['ln-north', 'ln-south-dosa', 'ln-south-idli', 'bf-north', 'bf-all']);
  });

  it("slot priority outranks health across tiers; health+region order within a tier", () => {
    const ids = sortIds({ regionKey: 'north', mealType: 'lunch', healthFilter: 'low-cal' });
    // Cross-tier: Rajma (lunch slot 2, health 0) must beat Fruit Bowl (breakfast
    // slot 0, health 2) — slot wins before health is consulted.
    expect(ids.indexOf('ln-north')).toBeLessThan(ids.indexOf('bf-all'));
    expect(ids.indexOf('ln-south-idli')).toBeLessThan(ids.indexOf('bf-all'));
    // Within the lunch tier: low-cal Dosa leads, then region tiebreak (north
    // Rajma before south Idli). Full deterministic order:
    expect(ids).toEqual(['ln-south-dosa', 'ln-north', 'ln-south-idli', 'bf-all', 'bf-north']);
  });

  it("unknown-region fallback ('all') is deterministic and never crashes", () => {
    const ids = sortIds({ regionKey: 'all', mealType: 'lunch', healthFilter: 'all' });
    expect(ids).toEqual(['ln-south-dosa', 'ln-south-idli', 'ln-north', 'bf-north', 'bf-all']);
    // legacy 'india' key (pre-normalization) also degrades without crashing
    const legacy = sortIds({ regionKey: 'india', mealType: 'lunch', healthFilter: 'all' });
    expect(legacy).toHaveLength(pool.length);
  });

  it('far-region dishes are ordered, never lost', () => {
    const withFilter = sortIds({ regionKey: 'south', mealType: 'lunch', healthFilter: 'low-cal' });
    const withoutFilter = sortIds({ regionKey: 'south', mealType: 'lunch', healthFilter: 'all' });
    for (const ids of [withFilter, withoutFilter]) {
      expect(ids).toHaveLength(pool.length);
      for (const d of pool) expect(ids).toContain(d.id);
    }
  });

  it('is deterministic: identical input yields identical order', () => {
    const a = sortIds({ regionKey: 'south', mealType: 'lunch', healthFilter: 'low-cal' });
    const b = sortIds({ regionKey: 'south', mealType: 'lunch', healthFilter: 'low-cal' });
    expect(a).toEqual(b);
  });
});

// ─── regionPriority / compareRegion 'india'/'all' safety ─────────────────────

describe('regionPriority unknown-region safety', () => {
  it("regionKey 'all': every specific region ties (honest unknown-region fallback)", () => {
    expect(compareRegion('all', 'north', 'south')).toBe(0);
    expect(compareRegion('all', 'west', 'east')).toBe(0);
    expect(regionPriority('all', 'north')).toBe(regionPriority('all', 'south'));
  });

  it("regionKey 'india' (legacy) ties too — no single region wins", () => {
    expect(compareRegion('india', 'north', 'south')).toBe(0);
    expect(regionPriority('india', 'north')).toBe(2);
    expect(regionPriority('india', 'south')).toBe(2);
  });
});

// ─── dishLibrary region-consistency DATA audits ──────────────────────────────

describe('dishLibrary region-consistency data', () => {
  const byId = new Map(DISH_LIBRARY.map(d => [d.id, d]));

  it('jolada-roti is a south dish from Karnataka', () => {
    const d = byId.get('jolada-roti')!;
    expect(d.region).toBe('south');
    expect(d.states).toEqual(['Karnataka']);
  });

  it('panch-phoran-tarka is an east dish (West Bengal/Mizoram/Assam)', () => {
    const d = byId.get('panch-phoran-tarka')!;
    expect(d.region).toBe('east');
    expect(d.states).toEqual(['West Bengal', 'Mizoram', 'Assam']);
  });

  it('amritsari-chole is a north dish (Punjab/Uttar Pradesh)', () => {
    const d = byId.get('amritsari-chole')!;
    expect(d.region).toBe('north');
    expect(d.states).toEqual(['Punjab', 'Uttar Pradesh']);
  });

  it('kadhi-khakra is a west dish (Gujarat/Rajasthan)', () => {
    const d = byId.get('kadhi-khakra')!;
    expect(d.region).toBe('west');
    expect(d.states).toEqual(['Gujarat', 'Rajasthan']);
  });

  it('falooda appears exactly once and is the pan-India (all) representation', () => {
    const faloodas = DISH_LIBRARY.filter(d => d.id === 'falooda');
    expect(faloodas).toHaveLength(1);
    expect(faloodas[0]!.region).toBe('all');
    expect(faloodas[0]!.states).toEqual(['Delhi', 'Mumbai', 'Hyderabad', 'Lucknow']);
  });

  it('Filter-Coffee strip: no non-south dish pairs Filter Coffee anymore', () => {
    const offenders = DISH_LIBRARY.filter(
      d => d.region !== 'south' && (d.defaultPairings?.beverages ?? []).includes('Filter Coffee'),
    );
    expect(offenders.map(d => d.id)).toEqual([]);
  });

  it('south dishes keep Filter Coffee (the strip is region-aware)', () => {
    const south = DISH_LIBRARY.filter(
      d => d.region === 'south' && (d.defaultPairings?.beverages ?? []).includes('Filter Coffee'),
    );
    expect(south.length).toBeGreaterThan(0);
    expect(south.map(d => d.id)).toContain('payasam');
  });

  it('library integrity: 637 dishes (638 pre-merge − 1 falooda dup), unique ids, no broken entries', () => {
    expect(DISH_LIBRARY).toHaveLength(637);
    const seen = new Set<string>();
    for (const d of DISH_LIBRARY) {
      expect(seen.has(d.id)).toBe(false);
      seen.add(d.id);
      expect(d.id && d.name && d.region && d.states.length > 0 && d.category.length > 0 && d.type).toBeTruthy();
    }
  });

  it('the stripped sweets now pair Masala Chai', () => {
    const ids = ['shrikhand', 'basundi', 'doodhpak', 'mishti-doi', 'sandesh', 'east-fruit-payesh', 'chak-hao-kheer', 'barfi', 'custard'];
    for (const id of ids) {
      const d = byId.get(id);
      expect(d, id).toBeDefined();
      expect((d!.defaultPairings?.beverages ?? []).includes('Filter Coffee'), id).toBe(false);
    }
    expect(byId.get('barfi')!.defaultPairings?.beverages).toEqual(['Masala Chai']);
    expect(byId.get('custard')!.defaultPairings?.beverages).toEqual(['Masala Chai']);
  });
});

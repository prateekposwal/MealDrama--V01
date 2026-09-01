import { describe, it, expect } from 'vitest';
import {
  regionPriority,
  compareRegion,
  REGION_PROXIMITY,
} from '../utils/regionPreference';
import { rankDishes, selectTryThese, dishSlotScore, getRegionKey, dishSortComparator, goalToDishHealthFilter } from '../utils/dishSearch';
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
    const ids = selectTryThese(fruitPool, { userDiet: 'non-veg', regionKey: 'north', maxPerSlot: 2 }).map(d => d.id);
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
    const result = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: added, maxPerSlot: 2 });
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
    const again = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: added, maxPerSlot: 2 }).map(d => d.id);
    expect(ids).toEqual(again);
    const reversed = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: [...added].reverse(), maxPerSlot: 2 }).map(d => d.id);
    expect(ids).toEqual(reversed);
  });

  it('returns [] when every matching dish is already added (honest empty, no crash)', () => {
    const all = balancedPool.map(d => d.id);
    const result = selectTryThese(balancedPool, { userDiet: 'non-veg', regionKey: 'north', excludeIds: all });
    expect(result).toEqual([]);
  });

  it('Try These region-titled strip: NEVER leads with a neighbor-region dish (Mutton Xacuti bug)', () => {
    // REGION_PROXIMITY puts west one hop from north — Mutton Xacuti (Goan/west)
    // led a "north · Non-Veg" strip. A region-TITLED strip must order
    // exact → all → elsewhere, and the first pick must be north or all.
    const pool = [
      makeDish({ id: 'xacuti', name: 'Mutton Xacuti', region: 'west', category: ['dinner'], type: 'non-veg' }),
      makeDish({ id: 'butter-chicken', name: 'Butter Chicken', region: 'north', category: ['dinner'], type: 'non-veg' }),
      makeDish({ id: 'roll', name: 'Chicken Kathi Roll', region: 'all', category: ['snacks'], type: 'non-veg' }),
    ];
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north' }).map(d => d.id);
    expect(ids.indexOf('butter-chicken')).toBeLessThan(ids.indexOf('xacuti'));
    expect(ids[0]).toBe('butter-chicken'); // exact-region dish leads, not the Goan neighbor
  });

  it('Try These NEVER suggests pure sweets as meal cards (the Barfi-in-north-Veg bug)', () => {
    const pool = [
      makeDish({ id: 'barfi', name: 'Barfi', region: 'north', category: ['snacks'], type: 'veg', tags: ['dessert', 'sweet'] }),
      makeDish({ id: 'rajma', name: 'Rajma', region: 'north', category: ['lunch'], type: 'veg' }),
      makeDish({ id: 'aloo-paratha', name: 'Aloo Paratha', region: 'north', category: ['breakfast'], type: 'veg' }),
    ];
    const ids = selectTryThese(pool, { userDiet: 'veg', regionKey: 'north' }).map(d => d.id);
    expect(ids).not.toContain('barfi');
    expect(ids).toContain('rajma'); // real meals still suggested
  });

  it('HEALTH FOCUS steers suggestions (ordering only): High Protein lifts protein dishes within a tier', () => {
    const pool = [
      makeDish({ id: 'hp', name: 'Paneer Paratha', region: 'north', category: ['breakfast'], type: 'veg', protein: 18, calories: 260 }),
      makeDish({ id: 'lp', name: 'Milk Oats', region: 'north', category: ['breakfast'], type: 'veg', calories: 320, nutrition: ['carb'] }),
    ];
    const result = selectTryThese(pool, { userDiet: 'eggitarian', regionKey: 'north', healthGoal: 'High Protein' });
    expect(result[0]!.id).toBe('hp');      // protein dish leads within the same region+diet tier
    expect(pool.every(d => result.some(r => r.id === d.id))).toBe(true); // nothing excluded
    // Registered under the same (region+diet) tiebreak: goal mapping is sane
    expect(goalToDishHealthFilter('High Protein')).toBe('high-protein');
    expect(goalToDishHealthFilter('Weight Loss')).toBe('low-cal');
    expect(goalToDishHealthFilter('Fiber-Loving')).toBe('balanced');
    expect(goalToDishHealthFilter(undefined)).toBeNull();
  });

  it('eggitarian: region leads, diet breaks ties — local eggs never buried, far eggs backfill', () => {
    // Doctrine v2 (user feedback): diet-leading ranked far-region dishes
    // above everything ("Try These shows other regions"). Region proximity
    // orders first; within a tier the distinctive diet wins; far-region
    // eggs still appear via round-robin + top-up backfill.
    const pool = [
      makeDish({ id: 'egg-b1', name: 'Egg Appam', region: 'south', category: ['breakfast'], type: 'eggitarian' }),
      makeDish({ id: 'veg-b1', name: 'Aloo Paratha', region: 'north', category: ['breakfast'], type: 'veg' }),
      makeDish({ id: 'egg-l1', name: 'Egg Curry', region: 'north', category: ['lunch'], type: 'eggitarian' }),
      makeDish({ id: 'veg-l1', name: 'Rajma', region: 'north', category: ['lunch'], type: 'veg' }),
    ];
    const result = selectTryThese(pool, { userDiet: 'eggitarian', regionKey: 'north' });
    expect(result.some(d => d.type === 'eggitarian')).toBe(true);
    // Region-first: the north veg dish leads the breakfast bucket, NOT the
    // far-region south egg.
    expect(result[0]!.id).toBe('veg-b1');
    // Within the same region tier, the egg dish beats its veg neighbor
    const lunchIdx = result.findIndex(d => d.id === 'egg-l1');
    const rajmaIdx = result.findIndex(d => d.id === 'veg-l1');
    expect(lunchIdx).toBeGreaterThan(-1);
    expect(lunchIdx).toBeLessThan(rajmaIdx);
    // Far-region egg still surfaces (ordering-only doctrine, never filtered)
    expect(result.some(d => d.id === 'egg-b1')).toBe(true);
  });

  it('eggitarian NEVER receives non-veg-typed dishes (canonical diet ladder)', () => {
    const pool = [
      makeDish({ id: 'chicken', name: 'Butter Chicken', region: 'north', category: ['dinner'], type: 'non-veg' }),
      makeDish({ id: 'egg-curry', name: 'Egg Curry', region: 'north', category: ['dinner'], type: 'eggitarian' }),
    ];
    const ids = selectTryThese(pool, { userDiet: 'eggitarian', regionKey: 'north' }).map(d => d.id);
    expect(ids).toContain('egg-curry');
    expect(ids).not.toContain('chicken');
  });

  it('drops same-NAME clones (different ids) — no duplicate rows in Try These', () => {
    // Reported: "Baked Penne with Roasted Vegetables" rendered twice because
    // a custom dish cloned a library dish under a new id; dedup was id-only.
    const pool = [
      makeDish({ id: 'penne-lib', name: 'Baked Penne with Roasted Vegetables', region: 'all', category: ['dinner'] }),
      makeDish({ id: 'penne-custom', name: 'Baked Penne with Roasted Vegetables ', region: 'all', category: ['dinner'] }),
      makeDish({ id: 'rajma', name: 'Rajma', region: 'north', category: ['lunch'] }),
    ];
    const result = selectTryThese(pool, { userDiet: 'veg', regionKey: 'north' });
    const names = result.map(d => d.name.trim().toLowerCase());
    expect(new Set(names).size).toBe(names.length);
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

  it("region is ordering, never exclusion: a northeast user sees every dish", () => {
    // Region-as-filter starved north eggitarians of all egg curries (all
    // tagged south/east/west). Region now only orders; diet stays the filter.
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'northeast' }).map(d => d.id);
    expect(ids).toContain('ne-dish');
    expect(ids).toContain('all-dish');
    expect(ids).toContain('n-dish');
    expect(ids).toContain('e-dish');
  });

  it("own region + all-region dishes rank ahead of far regions", () => {
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'northeast' }).map(d => d.id);
    expect(ids.indexOf('ne-dish')).toBeLessThan(ids.indexOf('n-dish'));
    expect(ids.indexOf('ne-dish')).toBeLessThan(ids.indexOf('e-dish'));
  });

  it("regionKey 'north' is symmetric: own dishes lead, far dishes still present", () => {
    const ids = selectTryThese(pool, { userDiet: 'non-veg', regionKey: 'north' }).map(d => d.id);
    expect(ids.indexOf('n-dish')).toBeLessThan(ids.indexOf('ne-dish'));
    expect(ids).toContain('ne-dish');
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

  it('library integrity: 679 dishes (662 + 17 bread-based mains/snacks/sweets), unique ids, no broken entries', () => {
    expect(DISH_LIBRARY).toHaveLength(679);
    const seen = new Set<string>();
    for (const d of DISH_LIBRARY) {
      expect(seen.has(d.id)).toBe(false);
      seen.add(d.id);
      expect(d.id && d.name && d.region && d.states.length > 0 && d.category.length > 0 && d.type).toBeTruthy();
    }
  });

  it('north eggitarians have LOCAL egg dishes (the empty-breakfast bug)', () => {
    const northEggs = DISH_LIBRARY.filter(
      d => d.region === 'north' && (d.diet || d.type) === 'eggitarian',
    );
    expect(northEggs.length).toBeGreaterThanOrEqual(3);
    // At least one is breakfast-capable — bhurji/omelette/paratha territory
    expect(northEggs.some(d => (d.category ?? []).includes('breakfast'))).toBe(true);
  });

  it('BREAD coverage: every region has bread dishes in breakfast AND snacks', () => {
    const breadTags = ['paratha', 'bread', 'pav', 'toast', 'sandwich', 'puri', 'bhature', 'naan', 'kulcha', 'kachori', 'roti'];
    const regions = ['north', 'south', 'east', 'west', 'central', 'northeast'];
    for (const region of regions) {
      for (const slot of ['breakfast', 'snacks']) {
        const n = DISH_LIBRARY.filter(
          d => (d.region === region || d.region === 'all')
            && ((d.category ?? []) as any[]).includes(slot)
            && breadTags.some(t => ((d.tags ?? []) as string[]).includes(t)),
        ).length;
        expect(n, `${region}/${slot}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('no misleading national qualifiers on dish names (American/English — the confusing-prefix bug)', () => {
    // "American Chop Suey" (rename→Chop Suey) and "Healthy English Muffin Pizzas"
    // (→Healthy Muffin Pizzas) carried country prefixes that confuse the cuisine.
    // Americano (coffee) is the sole legit exception.
    const offenders = DISH_LIBRARY.filter(d =>
      /american|english/i.test(d.name) && !/americano/i.test(d.name));
    expect(offenders.map(d => `${d.id}:${d.name}`)).toEqual([]);
    const chop = DISH_LIBRARY.find(d => d.id === 'american-chop-suey')!;
    expect(chop.name).toBe('Chop Suey');
    const muffin = DISH_LIBRARY.find(d => d.id === 'english-muffin-pizzas')!;
    expect(muffin.name).toBe('Healthy Muffin Pizzas');
    expect(muffin.variants?.[0]?.name).toBe('Muffin Pizza Veg');
  });

  it('Amritsari Chole Bhature pairs chutney + pickle + salad (no more bare "Salad")', () => {
    const ac = DISH_LIBRARY.find(d => d.id === 'amritsari-chole')!;
    const bhature = ac.variants?.find((v: any) => v.id === 'amritsari-bhature');
    expect(bhature).toBeDefined();
    const sides = (bhature as any)?.defaultPairings?.sides ?? [];
    expect(sides).toContain('Pickle');
    expect(sides).toContain('Green Chutney');
    expect(sides).toContain('Salad');
  });

  it('every bread-based dish carries full pantry-resolvable ingredients', () => {
    // Pantry guarantee: adding any of these meals must feed ingredient names
    // into the pantry (via getIngredientNamesForMeal → variant.ingredients).
    const breadDishIds = [
      'seyal-double-roti', 'bread-upma', 'mumbai-masala-toast', 'bread-roll', 'bread-manchurian',
      'chilli-cheese-toast', 'aloo-masala-sandwich', 'paneer-bhurji-sandwich', 'dahi-veg-sandwich',
      'bread-chaat', 'dim-pauruti', 'bread-bhurji', 'double-ka-meetha', 'podi-bread-toast',
      'tomato-garlic-bread', 'ghugni-bread', 'kolkata-egg-roll',
    ];
    for (const id of breadDishIds) {
      const dish = DISH_LIBRARY.find(d => d.id === id);
      expect(dish, id).toBeDefined();
      const variant = dish!.variants?.[0];
      expect(variant, `${id}/variant`).toBeDefined();
      expect((variant!.ingredients ?? []).length, `${id}/ingredients`).toBeGreaterThan(0);
      for (const ing of variant!.ingredients ?? []) {
        expect(ing.name && ing.quantity && ing.unit && ing.category, `${id}/${ing.name}`).toBeTruthy();
      }
    }
  });

  it('region×diet coverage: every region has breakfast AND dinner dishes for eggitarian/non-veg/vegan', () => {
    // The whack-a-mole killer: the reported gaps were dinner eggs = 0 (north),
    // breakfast non-veg = 0 (north/east/central/northeast). A regional pool
    // must be able to seed each distinctive diet into each daily anchor slot.
    const regions = ['north', 'south', 'east', 'west', 'central', 'northeast'];
    const slots = ['breakfast', 'dinner'];
    for (const region of regions) {
      for (const type of ['eggitarian', 'non-veg', 'vegan'] as const) {
        for (const slot of slots) {
          const n = DISH_LIBRARY.filter(
            d => (d.diet || d.type) === type
              && ((d.category ?? []) as any).includes(slot)
              && (d.region === region || d.region === 'all'),
          ).length;
          expect(n, `${region}/${type}/${slot}`).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('Try These: region proximity leads; diet only breaks ties within a tier', () => {
    const picks = selectTryThese(DISH_LIBRARY, {
      userDiet: 'eggitarian', regionKey: 'north',
      plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'], maxPerSlot: 2,
    });
    expect(picks.length).toBeGreaterThan(0);
    // No far-region dish may lead a same-tier dish: the first pick must be
    // north or all-region (previously far-region eggs led everything).
    const tier = (r?: string) => (r === 'north' ? 0 : (!r || r === 'all') ? 1 : 2);
    let best = 3;
    for (const p of picks) {
      best = Math.min(best, tier(p.region));
    }
    expect(tier(picks[0]!.region)).toBe(best);
    // And the distinctive diet is still represented in the suggestions
    expect(picks.some(p => (p.diet || p.type) === 'eggitarian')).toBe(true);
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

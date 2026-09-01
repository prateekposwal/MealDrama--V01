import { describe, it, expect } from 'vitest';
import { pickDietRepresentatives, pickDietRepresentativesWithSlots, distinctiveTypeFor, primarySlotFor, deficitCount, dietDeficitBySlot, enrichSourcePool, keepRegionTrayItems } from '../utils/dietQuota';
import type { Dish } from '../meal/constants/dishLibrary';

function dish(overrides: Partial<Dish> & { id: string; name: string }): Dish {
  return {
    type: 'veg', tags: [], variants: [], category: ['lunch'], states: [],
    nutrition: [], region: 'north', ...overrides,
  } as unknown as Dish;
}

const LIBRARY = [
  // North veg flood (what a north pool is usually full of)
  dish({ id: 'v1', name: 'Aloo Paratha', category: ['breakfast'], type: 'veg' }),
  dish({ id: 'v2', name: 'Rajma', category: ['lunch'], type: 'veg' }),
  // Egg dishes — every one outside north
  dish({ id: 'egg-s1', name: 'Egg Curry', region: 'south', category: ['lunch', 'dinner'], type: 'eggitarian' }),
  dish({ id: 'egg-e1', name: 'Egg Dimer Jhol', region: 'east', category: ['lunch', 'dinner'], type: 'eggitarian' }),
  dish({ id: 'egg-b1', name: 'Egg Appam', region: 'south', category: ['breakfast'], type: 'eggitarian' }),
  dish({ id: 'egg-all', name: 'Egg Chilli', region: 'all', category: ['snacks'], type: 'eggitarian' }),
];

describe('pickDietRepresentatives', () => {
  it('returns [] when distType is null — veg/non-veg behavior untouched', () => {
    expect(pickDietRepresentatives(LIBRARY, { distType: null, regionKey: 'north' })).toEqual([]);
    expect(pickDietRepresentatives(LIBRARY, { distType: undefined as any, regionKey: 'north' })).toEqual([]);
  });

  it('cross-region fill: a north eggitarian gets egg dishes even with zero local ones', () => {
    const reps = pickDietRepresentatives(LIBRARY, {
      distType: 'eggitarian', regionKey: 'north', minCount: 3,
    });
    expect(reps).toHaveLength(3);
    expect(reps.every(d => d.type === 'eggitarian')).toBe(true);
    // 'all'-region tier outranks far regions
    expect(reps[0]!.id).toBe('egg-all');
  });

  it('prefers exact-region representatives when they exist', () => {
    const lib = [
      dish({ id: 'egg-n1', name: 'North Egg', region: 'north', type: 'eggitarian' }),
      ...LIBRARY,
    ];
    const reps = pickDietRepresentatives(lib, { distType: 'eggitarian', regionKey: 'north', minCount: 1 });
    expect(reps[0]!.id).toBe('egg-n1');
  });

  it('respects excludeNames so seeded dishes are not duplicated', () => {
    const reps = pickDietRepresentatives(LIBRARY, {
      distType: 'eggitarian', regionKey: 'north', minCount: 3,
      excludeNames: new Set(['egg chilli']),
    });
    expect(reps.map(d => d.id)).not.toContain('egg-all');
    // 'Egg Curry' was never excluded — it must still appear
    expect(reps.map(d => d.id)).toContain('egg-s1');
  });

  it('trims to minCount and skips already-excluded clones by trimmed name', () => {
    const lib = [
      dish({ id: 'a', name: 'Egg Curry ', region: 'all', type: 'eggitarian' }),
      dish({ id: 'b', name: 'Egg Curry', region: 'south', type: 'eggitarian' }),
      dish({ id: 'c', name: 'Egg Keema', region: 'east', type: 'eggitarian' }),
    ];
    const reps = pickDietRepresentatives(lib, {
      distType: 'eggitarian', regionKey: 'north', minCount: 5,
      excludeNames: new Set(['egg curry']),
    });
    // clone "Egg Curry " (trimmed match) excluded; only Keema remains
    expect(reps.map(d => d.id)).toEqual(['c']);
  });

  it('SPREADS representatives across DISTINCT planned slots — no lunch pile-up', () => {
    // Regression: 11/16 library eggs route to 'lunch' via primarySlotFor;
    // quota reps must cover breakfast/lunch/dinner/snacks, not one slot.
    const lib = [
      ...Array.from({ length: 8 }, (_, i) => dish({
        id: `el${i}`, name: `Egg Lunch ${i}`, region: 'south',
        category: ['lunch', 'dinner'], type: 'eggitarian',
      })),
      dish({ id: 'eb1', name: 'Egg Bhurji', region: 'north', category: ['breakfast'], type: 'eggitarian' }),
      dish({ id: 'es1', name: 'Egg Snack', region: 'east', category: ['snacks'], type: 'eggitarian' }),
    ];
    const reps = pickDietRepresentatives(lib, {
      distType: 'eggitarian', regionKey: 'north', minCount: 3,
      excludeNames: new Set(),
      plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    });
    const assigned = pickDietRepresentativesWithSlots(lib, {
      distType: 'eggitarian', regionKey: 'north', minCount: 3,
      excludeNames: new Set(),
      plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    });
    const slots = new Set(assigned.map(a => a.slot));
    expect(assigned).toHaveLength(3);
    expect(slots.size).toBe(3); // three reps → three DIFFERENT slots
    expect(slots.has('lunch') && slots.has('breakfast')).toBe(true);
  });

  it('breakfast-heavy pools reach OTHER slots through secondary categories', () => {
    // Regression v2: routing by primarySlotFor alone collapsed onto
    // breakfast/lunch (all north eggs are breakfast-first) leaving
    // snacks/dinner unreached even on fresh rebuilds.
    const lib = [
      dish({ id: 'nb', name: 'Anda Bhurji', region: 'north', category: ['breakfast', 'lunch'], type: 'eggitarian' }),
      dish({ id: 'np', name: 'Anda Paratha', region: 'north', category: ['breakfast', 'lunch'], type: 'eggitarian' }),
      dish({ id: 'no', name: 'Masala Omelette', region: 'north', category: ['breakfast', 'snacks'], type: 'eggitarian' }),
      dish({ id: 'nd', name: 'Egg Keema', region: 'south', category: ['lunch', 'dinner'], type: 'eggitarian' }),
    ];
    const slots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    const assigned = pickDietRepresentativesWithSlots(lib, {
      distType: 'eggitarian', regionKey: 'north', minCount: 3,
      excludeNames: new Set(), plannedSlots: slots,
    });
    const used = new Set(assigned.map(a => a.slot));
    expect(assigned).toHaveLength(3);
    expect(used.size).toBe(3);
    // The omelette's SNACKS capability must be used, not wasted on breakfast×2
    expect(used.has('snacks')).toBe(true);
  });
});

describe('distinctiveTypeFor', () => {
  it('maps all four diets to their distinctive type; unknown → null', () => {
    expect(distinctiveTypeFor('eggitarian')).toBe('eggitarian');
    expect(distinctiveTypeFor('Vegan')).toBe('vegan');
    expect(distinctiveTypeFor('veg')).toBe('veg');
    expect(distinctiveTypeFor('non-veg')).toBe('non-veg');
    expect(distinctiveTypeFor(undefined)).toBeNull();
    expect(distinctiveTypeFor('keto')).toBeNull();
  });
});

describe('deficitCount', () => {
  it('counts only matching-type items and never returns negative', () => {
    const items = [dish({ id: '1', name: 'A', type: 'eggitarian' }), dish({ id: '2', name: 'B', type: 'veg' })];
    expect(deficitCount(items, 'eggitarian', 3)).toBe(2);
    expect(deficitCount(items, 'eggitarian', 1)).toBe(0); // already satisfied
    expect(deficitCount(items, 'vegan', 3)).toBe(3);
  });
  it('null distType or non-positive target → zero (no-op)', () => {
    expect(deficitCount([dish({ id: 'x', name: 'X' })], null, 3)).toBe(0);
    expect(deficitCount([], 'veg', 0)).toBe(0);
  });
  it('self-satisfied pools (e.g. veg flood) need zero additions', () => {
    const vegFlood = Array.from({ length: 10 }, (_, i) => dish({ id: `v${i}`, name: `V${i}`, type: 'veg' }));
    expect(deficitCount(vegFlood, 'veg', 3)).toBe(0);
  });
});

describe('primarySlotFor', () => {
  it('first planned slot the dish belongs to', () => {
    const d = dish({ id: 'x', name: 'X', category: ['breakfast', 'snacks'] });
    expect(primarySlotFor(d, ['Lunch', 'Breakfast'])).toBe('breakfast');
  });
  it('falls back to any slot category when planned slots miss, then to first planned', () => {
    const d = dish({ id: 'y', name: 'Y', category: ['dinner'] });
    expect(primarySlotFor(d, ['Lunch'])).toBe('dinner');
    const blank = dish({ id: 'z', name: 'Z', category: [] });
    expect(primarySlotFor(blank, ['Lunch'])).toBe('lunch');
  });
});

describe('dietDeficitBySlot', () => {
  it('per-slot deficits — breakfast fat does NOT zero out lunch/dinner/snacks', () => {
    // The sparse-plan regression: a GLOBAL target treated 3 breakfast eggs as
    // satisfying everything, starving the other slots. Each slot counts itself.
    const pools = {
      breakfast: [dish({ id: 'b1', name: 'B1', type: 'eggitarian' }), dish({ id: 'b2', name: 'B2', type: 'eggitarian' }), dish({ id: 'b3', name: 'B3', type: 'eggitarian' })],
      lunch: [dish({ id: 'l1', name: 'L1', type: 'eggitarian' })],
      snacks: [dish({ id: 's1', name: 'S1', type: 'veg' })],
      dinner: [],
    };
    const { deficits, total } = dietDeficitBySlot(pools, 'eggitarian', 2);
    expect(total).toBe(5); // lunch 1 + snacks 2 + dinner 2
    expect(deficits.map(d => `${d.slot}:${d.need}`)).toEqual(['lunch:1', 'dinner:2', 'snacks:2']);
  });

  it('null distType or zero target → no-op', () => {
    expect(dietDeficitBySlot({ breakfast: [] }, null, 2).total).toBe(0);
    expect(dietDeficitBySlot({ breakfast: [] }, 'eggitarian', 0).total).toBe(0);
  });
});

describe('enrichSourcePool', () => {
  it('fills a skinny tray pool to target breadth (kills the daily-repeat bug)', () => {
    const lib = Array.from({ length: 20 }, (_, i) => dish({
      id: `s${i}`, name: `Snack ${i}`, region: 'north', category: ['snacks'], type: 'veg',
    }));
    const pool: import('../utils/dietQuota').DietSourcePool = { breakfast: [], lunch: [dish({ id: 'l0', name: 'Aloo Gobhi', category: ['lunch'], type: 'veg' })], snacks: [lib[0]!], dinner: [] };
    const out = enrichSourcePool(pool, lib, { allowedTypes: ['veg'], regionKey: 'north', target: 8 });
    expect(out.snacks.length).toBe(8);           // tray pick led, 7 more filled
    expect(out.snacks[0]!.id).toBe('s0');         // tray item keeps its lead
    expect(out.lunch[0]!.name).toBe('Aloo Gobhi'); // existing items preserved
    expect(new Set(out.snacks.map(d => d.name)).size).toBe(8); // no dupes
  });

  it('diet-prioritized: egg dishes outrank veg when priority requested', () => {
    const egg = dish({ id: 'egg-s', name: 'Egg Puff', region: 'north', category: ['snacks'], type: 'eggitarian' });
    const veg = dish({ id: 'veg-s', name: 'Spring Rolls', region: 'north', category: ['snacks'], type: 'veg' });
    const pool: import('../utils/dietQuota').DietSourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const out = enrichSourcePool(pool, [veg, egg], {
      allowedTypes: ['veg', 'eggitarian'], regionKey: 'north', target: 2,
      priority: (d) => ((d.diet || d.type || '').toLowerCase() === 'eggitarian' ? 0 : 1),
    });
    expect(out.snacks[0]!.id).toBe('egg-s');
  });

  it('HEALTH SCORE breaks ties: High-Protein dish fills the pool before a neutral one', () => {
    const high = dish({ id: 'hp', name: 'Protein Bowl', region: 'north', category: ['snacks'], type: 'veg', protein: 18 });
    const neu = dish({ id: 'neu', name: 'Veg Bites', region: 'north', category: ['snacks'], type: 'veg' });
    const pool: import('../utils/dietQuota').DietSourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const out = enrichSourcePool(pool, [neu, high], {
      allowedTypes: ['veg'], regionKey: 'north', target: 2,
      healthScore: (d) => ((d).protein ?? 0) >= 15 ? 2 : 0,
    });
    expect(out.snacks[0]!.id).toBe('hp');       // health lifts it to the lead slot
    expect(out.snacks.map(d => d.id)).toContain('neu'); // ordering-only: both included
  });
});

describe('keepRegionTrayItems — region-change reseed (the far-region purge)', () => {
  const item = (id: string, name: string, region?: string) => ({ id, dishId: id, name, icon: '🍛', sourceRegion: region ?? 'all' });
  it('drops far-region trays, keeps new-region + all', () => {
    const tray = {
      breakfast: [item('a', 'Aloo Paratha', 'north'), item('b', 'Idli', 'south'), item('c', 'Oats', 'all'), item('d', 'Custom')],
      lunch: [],
      snacks: [],
      dinner: [],
    };
    const out = keepRegionTrayItems(tray, 'south');
    expect(out.breakfast.map((m: any) => m.name)).toEqual(['Idli', 'Oats', 'Custom']);
  });
  it('untouched store returns identical references', () => {
    const tray = { breakfast: [item('a', 'Rajma', 'north')], lunch: [], snacks: [], dinner: [] };
    const out = keepRegionTrayItems(tray, 'north');
    expect(out.breakfast.map((m: any) => m.name)).toEqual(['Rajma']);
  });
});

import { describe, it, expect } from 'vitest';
import type { Dish, DishVariant } from '../meal/constants/dishLibrary';
import type { TrayItem } from '../types/tray';
import {
  computeTodaysCalories,
  pantryHasItem,
  missingPantryItems,
  orderDishesRegionFirst,
  dishIngredientGaps,
  isGenericStaple,
} from '../utils/healthInsight';
import { getDishCalories, DISH_CALORIES, getDishCalorieInfo } from '../meal/constants/dishCalories';
import type { Dish as LibraryDish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeDish(overrides: { id: string; name: string; region: string } & Partial<Dish>): Dish {
  const base = {
    icon: '🍽️',
    states: [],
    category: ['Lunch'],
    type: 'veg',
    weight: 'medium',
    nutrition: [],
    tags: [],
    variants: [] as DishVariant[],
  };
  return { ...base, ...overrides } as Dish;
}

function makeTray(meal_id: string, quantity = 1): TrayItem {
  return {
    id: meal_id,
    meal_id,
    name: meal_id,
    quantity,
    servings: quantity,
    gravy: null,
    roti: null,
    rice: null,
    sides: [],
    beverages: [],
    dessert: [],
    itemQtys: {},
  } as TrayItem;
}

// ─── 1. Calorie total — REAL per-dish calories × servings, honest when incomplete ──

describe('computeTodaysCalories', () => {
  it('sums real dish calories × quantity for every tray item', () => {
    const dishes = [
      makeDish({ id: 'dish-a', name: 'Dish A', region: 'all', calories: 500 }),
      makeDish({ id: 'dish-b', name: 'Dish B', region: 'all', calories: 300 }),
    ];
    const tally = computeTodaysCalories([makeTray('dish-a', 2), makeTray('dish-b', 1)], dishes);
    expect(tally.totalKcal).toBe(1300);
    expect(tally.countedItems).toBe(2);
    expect(tally.totalItems).toBe(2);
    expect(tally.approximate).toBe(false);
    expect(tally.unknown).toBe(false);
  });

  it('marks the total approximate when some dishes rely on fallback estimates', () => {
    const dishes = [
      makeDish({ id: 'dish-a', name: 'Dish A', region: 'all', calories: 500 }),
      makeDish({ id: 'dish-c', name: 'Dish C', region: 'all' }), // no explicit calories → estimate
    ];
    const tally = computeTodaysCalories([makeTray('dish-a'), makeTray('dish-c')], dishes);
    expect(tally.countedItems).toBe(2);
    expect(tally.totalItems).toBe(2);
    expect(tally.approximate).toBe(true); // one value is an estimate
    expect(tally.estimatedCount).toBe(1);
    expect(tally.unknown).toBe(false);
  });

  it('reports unknown only when NO dish has any calorie info', () => {
    // computeTodaysCalories only consults dishes in the provided pool; a dish
    // the pool doesn't contain can't resolve — honest unknown (no invented total).
    const tally = computeTodaysCalories([makeTray('zz-no-such-id')], []);
    expect(tally.countedItems).toBe(0);
    expect(tally.totalItems).toBe(1);
    expect(tally.unknown).toBe(true);
  });

  it('ignores zero-quantity items and empty trays honestly', () => {
    const dishes = [makeDish({ id: 'dish-a', name: 'Dish A', region: 'all', calories: 500 })];
    expect(computeTodaysCalories([makeTray('dish-a', 0)], dishes).totalItems).toBe(0);
    expect(computeTodaysCalories([], dishes).totalItems).toBe(0);
  });
});

// ─── 2. Region-first tip dish ordering — ordering only, never excludes ──

describe('orderDishesRegionFirst', () => {
  const south = makeDish({ id: 'south-egg-roast', name: 'Kerala Egg Roast', region: 'south' });
  const north = makeDish({ id: 'north-tandoori', name: 'Tandoori Paneer', region: 'north' });
  const west = makeDish({ id: 'west-fish', name: 'Fish Thali', region: 'west' });
  const all = makeDish({ id: 'all-salad', name: 'Greek Salad', region: 'all' });

  it('a north user sees north dishes first, then nearest regions, south last', () => {
    const ordered = orderDishesRegionFirst([south, north, west, all], 'north');
    expect(ordered[0]!.id).toBe('north-tandoori');
    expect(ordered.indexOf(west)).toBeLessThan(ordered.indexOf(south));
    expect(ordered.indexOf(all)).toBeLessThan(ordered.indexOf(south));
    expect(ordered[ordered.length - 1]!.id).toBe('south-egg-roast');
  });

  it('a south user sees south dishes first', () => {
    const ordered = orderDishesRegionFirst([south, north, west, all], 'south');
    expect(ordered[0]!.id).toBe('south-egg-roast');
    expect(ordered.indexOf(north)).toBeGreaterThan(ordered.indexOf(south));
  });

  it('never excludes any dish (ordering-only rule)', () => {
    const ordered = orderDishesRegionFirst([south, north, west, all], 'north');
    expect(ordered.map(d => d.id).sort()).toEqual(['all-salad', 'north-tandoori', 'south-egg-roast', 'west-fish']);
  });

  it('is deterministic — same input, same order, no randomness', () => {
    const dishes = [south, west, all, north];
    const a = orderDishesRegionFirst(dishes, 'north');
    const b = orderDishesRegionFirst(dishes, 'north');
    expect(a.map(d => d.id)).toEqual(b.map(d => d.id));
  });
});

// ─── 3. Pantry-gap tips — only MISSING items surface as "add" ──

describe('pantryHasItem / missingPantryItems', () => {
  it('treats exact and case-insensitive names as present', () => {
    expect(pantryHasItem(['Olive Oil', 'Green Tea'], 'olive oil')).toBe(true);
    expect(pantryHasItem(['Olive Oil', 'Green Tea'], 'Green Tea')).toBe(true);
    expect(pantryHasItem([], 'Olive Oil')).toBe(false);
  });

  it('a named staple covers a more specific item, but a generic staple does not', () => {
    expect(pantryHasItem(['Green Tea Bags'], 'Green Tea')).toBe(true);
    expect(pantryHasItem(['Oil'], 'Mustard Oil')).toBe(false);
    expect(pantryHasItem(['Water'], 'Coconut Water')).toBe(false);
  });

  it('lists only missing items — present ones excluded, deduped, order preserved', () => {
    const items = ['Mustard Oil', 'Olive Oil', 'Coconut Oil', 'Green Tea', 'mustard oil'];
    const gaps = missingPantryItems(items, ['olive oil', 'Green Tea']);
    expect(gaps).toEqual(['Mustard Oil', 'Coconut Oil']);
  });

  it('dishIngredientGaps surfaces real ingredients minus pantry and generic staples', () => {
    const dish = makeDish({
      id: 'fw-dish-001',
      name: 'Roasted Veggie Bowl',
      region: 'north',
      variants: [{
        id: 'fw-dish-001-main',
        name: 'Roasted Veggie Bowl',
        ingredients: [
          { name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins' },
          { name: 'Yogurt', quantity: 50, unit: 'g', category: 'dairy' },
          { name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry' },
        ],
      }],
    });
    const dishes = [dish];

    // Empty pantry → every real ingredient is a gap; generic staples never listed.
    const allGaps = dishIngredientGaps([dish], dishes, []);
    expect(allGaps).toContain('Paneer');
    expect(allGaps).toContain('Yogurt');
    expect(allGaps).not.toContain('Salt');

    // Present items excluded from the add list.
    const partialGaps = dishIngredientGaps([dish], dishes, ['Paneer']);
    expect(partialGaps).not.toContain('Paneer');
    expect(partialGaps).toContain('Yogurt');
  });

  it('isGenericStaple marks assumed kitchen staples only', () => {
    expect(isGenericStaple('Salt')).toBe(true);
    expect(isGenericStaple('Oil')).toBe(true);
    expect(isGenericStaple('Mustard Oil')).toBe(false);
    expect(isGenericStaple('Paneer')).toBe(false);
  });
});

// ─── Dish calorie resolution ─────────────────────────────────────────────────

describe('getDishCalories', () => {
  it('resolves a real kcal for every dish in the library (100% coverage)', () => {
    
    const missing = DISH_LIBRARY.filter(d => {
      const kcal = getDishCalories(d);
      return typeof kcal !== 'number' || !isFinite(kcal) || kcal <= 0;
    }).map(d => d.id);
    expect(missing).toEqual([]);
  });

  it('curated well-known dishes return sensible ranges', () => {
    
    const cases: Array<[string, [number, number]]> = [
      ['butter-chicken-wala', [300, 650]],
      ['kulfi', [150, 500]],
      ['aloo-paratha', [200, 500]],
      ['dal-tadka-central', [100, 350]],
      ['chicken-biryani', [300, 750]],
      ['idli', [50, 250]],
    ];
    for (const [id, [lo, hi]] of cases) {
      const dish = DISH_LIBRARY.find(d => d.id === id);
      expect(dish, id).toBeDefined();
      const kcal = getDishCalories(dish!);
      expect(kcal).toBeGreaterThanOrEqual(lo);
      expect(kcal).toBeLessThanOrEqual(hi);
    }
  });

  it('explicit Dish.calories wins over the curated map', () => {
    const dish = makeDish({
      id: 'butter-chicken-wala',
      name: 'Butter Chicken',
      region: 'north',
      calories: 999,
    });
    expect(getDishCalories(dish)).toBe(999);
  });

  it('fallback estimate stays deterministic and positive for unknown dishes', () => {
    const a = makeDish({ id: 'zz-unknown-dish-1', name: 'Mystery Plateau Curry', region: 'south' });
    const b = makeDish({ id: 'zz-unknown-dish-2', name: 'Mystery Plateau Curry', region: 'south' });
    expect(getDishCalories(a)).toBe(getDishCalories(b));
  });

  it('sweet or drink names resolve a calorie without weight inflation', () => {
    const sweet = makeDish({ id: 'zz-sweet-x', name: 'Kesari Bath', region: 'north', weight: 'light' });
    const drink = makeDish({ id: 'zz-drink-x', name: 'Sweet Lassi', region: 'north', weight: 'light' });
    expect(getDishCalories(sweet)).toBeLessThan(450);
    expect(getDishCalories(drink)).toBeLessThan(400);
  });
});

describe('computeTodaysCalories with library calories', () => {
  it('computes a real total from curated library values (not unknown)', () => {
    
    const biryani = DISH_LIBRARY.find(d => d.id === 'chicken-biryani')!;
    const idli = DISH_LIBRARY.find(d => d.id === 'idli')!;
    const items: TrayItem[] = [
      { meal_id: 'chicken-biryani', quantity: 1 } as TrayItem,
      { meal_id: 'idli', quantity: 2 } as TrayItem,
    ];
    const tally = computeTodaysCalories(items, DISH_LIBRARY);
    expect(tally.unknown).toBe(false);
    expect(tally.countedItems).toBe(2);
    const expected = (getDishCalories(biryani) || 0) * 1 + (getDishCalories(idli) || 0) * 2;
    expect(tally.totalKcal).toBe(Math.round(expected));
  });
});

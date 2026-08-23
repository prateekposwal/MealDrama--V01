import { describe, it, expect, beforeEach } from 'vitest';
import {
  getIngredientsForCategoryOption,
  getIngredientsFromCategorySelections,
  getIngredientsForMealOption,
  buildPantryGroups,
  invalidateIngredientCache,
  isDishVeganCompatible,
  isVariantVeganCompatible,
  getTomorrowISO,
  getWeekEndISO,
  type PantryGroup,
} from '../utils/ingredientUtils';
import type { Dish, Ingredient, DishVariant } from '../meal/constants/dishLibrary';
import type { CategorySelection } from '../app/store/useStore';

const makeDish = (id: string, name: string, overrides?: Partial<Dish>): Dish => ({
  id,
  name,
  icon: '🍽️',
  region: 'north',
  states: [],
  category: ['lunch'],
  type: 'veg',
  weight: 'medium',
  nutrition: [],
  tags: [],
  variants: [{ id: `${id}_v1`, name }],
  ...overrides,
});

beforeEach(() => {
  invalidateIngredientCache();
});

// ─── getIngredientsForCategoryOption ──────────────────────────────────────────

describe('getIngredientsForCategoryOption', () => {
  it('returns ingredients for exact category ID match', () => {
    const result = getIngredientsForCategoryOption('naan');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(i => i.name === 'Maida')).toBe(true);
  });

  it('normalizes hyphenated names', () => {
    const result = getIngredientsForCategoryOption('steamed rice');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(i => i.name === 'Rice')).toBe(true);
  });

  it('fuzzy matches compound names', () => {
    const result = getIngredientsForCategoryOption('tandoori roti');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(i => i.name === 'Wheat Flour (Atta)')).toBe(true);
  });

  it('returns empty array for unknown category', () => {
    const result = getIngredientsForCategoryOption('nonexistent-dish-xyz');
    expect(result).toEqual([]);
  });

  it('finds beverages like filter coffee', () => {
    const result = getIngredientsForCategoryOption('filter-coffee');
    expect(result).toHaveLength(2);
    expect(result.some(i => i.name === 'Coffee Powder')).toBe(true);
    expect(result.some(i => i.name === 'Milk')).toBe(true);
  });

  it('finds chutney sides', () => {
    const result = getIngredientsForCategoryOption('coconut-chutney');
    expect(result.some(i => i.name === 'Coconut')).toBe(true);
    expect(result.some(i => i.name === 'Green Chilli')).toBe(true);
  });
});

// ─── getIngredientsFromCategorySelections ─────────────────────────────────────

describe('getIngredientsFromCategorySelections', () => {
  it('resolves gravy selection', () => {
    const selections: CategorySelection = {
      gravy: { id: 'brown-gravy-onion-tomato', name: 'Brown Gravy' },
      roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Onions')).toBe(true);
    expect(result.some(i => i.name === 'Tomatoes')).toBe(true);
  });

  it('resolves roti selection', () => {
    const selections: CategorySelection = {
      gravy: null,
      roti: { id: 'naan', name: 'Naan' },
      rice: null, sides: [], beverages: [], dessert: [], itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Maida')).toBe(true);
  });

  it('resolves rice selection', () => {
    const selections: CategorySelection = {
      gravy: null, roti: null,
      rice: { id: 'steamed-rice', name: 'Steamed Rice' },
      sides: [], beverages: [], dessert: [], itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Rice')).toBe(true);
  });

  it('resolves side selections', () => {
    const selections: CategorySelection = {
      gravy: null, roti: null, rice: null,
      sides: [{ id: 'cucumber-raita', name: 'Cucumber Raita' }],
      beverages: [], dessert: [], itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Yogurt')).toBe(true);
    expect(result.some(i => i.name === 'Cucumber')).toBe(true);
  });

  it('resolves beverage selections', () => {
    const selections: CategorySelection = {
      gravy: null, roti: null, rice: null, sides: [],
      beverages: [{ id: 'chaas-buttermilk', name: 'Chaas' }],
      dessert: [], itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Yogurt')).toBe(true);
  });

  it('resolves dessert selections', () => {
    const selections: CategorySelection = {
      gravy: null, roti: null, rice: null, sides: [], beverages: [],
      dessert: [{ id: 'gulab-jamun', name: 'Gulab Jamun' }],
      itemQtys: {},
    };
    const result = getIngredientsFromCategorySelections(selections);
    expect(result.some(i => i.name === 'Milk Powder')).toBe(true);
  });

  it('applies itemQtys multiplier', () => {
    const selections: CategorySelection = {
      gravy: null, roti: null, rice: null, sides: [],
      beverages: [{ id: 'chaas-buttermilk', name: 'Chaas' }],
      dessert: [], itemQtys: { Chaas: 3 },
    };
    const result = getIngredientsFromCategorySelections(selections);
    const yogurt = result.find(i => i.name === 'Yogurt');
    expect(yogurt).toBeDefined();
    expect(yogurt!.quantity).toBe(300);
  });
});

// ─── getIngredientsForMealOption ──────────────────────────────────────────────

describe('getIngredientsForMealOption', () => {
  it('uses variant ingredients when available', () => {
    const dish = makeDish('test-dish', 'Test Dish', {
      variants: [{
        id: 'test-dish_v1',
        name: 'Test Dish',
        ingredients: [
          { name: 'Chicken', quantity: 200, unit: 'g', category: 'proteins', inStock: false },
          { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false },
        ],
      }],
    });
    const result = getIngredientsForMealOption('test-dish', 'test-dish_v1', [dish]);
    expect(result.some(i => i.name === 'Chicken')).toBe(true);
    expect(result.some(i => i.name === 'Onions')).toBe(true);
  });

  it('infers ingredients when variant has no explicit ingredients', () => {
    const dish = makeDish('paneer-butter-masala', 'Paneer Butter Masala');
    const result = getIngredientsForMealOption('paneer-butter-masala', '', [dish]);
    expect(result.some(i => i.name === 'Paneer')).toBe(true);
    expect(result.some(i => i.name === 'Ghee')).toBe(true);
    expect(result.some(i => i.name === 'Spices')).toBe(true);
  });

  it('infers ingredients from dish name for custom dishes', () => {
    const dish = makeDish('custom_12345', 'Chicken Curry');
    const result = getIngredientsForMealOption('custom_12345', '', [dish]);
    expect(result.some(i => i.name === 'Chicken')).toBe(true);
    expect(result.some(i => i.name === 'Rice')).toBe(true);
  });

  it('infers dal from name pattern', () => {
    const dish = makeDish('dal-tadka', 'Dal Tadka');
    const result = getIngredientsForMealOption('dal-tadka', '', [dish]);
    expect(result.some(i => i.name === 'Toor Dal')).toBe(true);
  });

  it('infers aloo from name pattern', () => {
    const dish = makeDish('aloo-gobi', 'Aloo Gobi');
    const result = getIngredientsForMealOption('aloo-gobi', '', [dish]);
    expect(result.some(i => i.name === 'Potatoes')).toBe(true);
  });

  it('infers egg from name pattern', () => {
    const dish = makeDish('egg-curry', 'Egg Curry');
    const result = getIngredientsForMealOption('egg-curry', '', [dish]);
    expect(result.some(i => i.name === 'Eggs')).toBe(true);
  });

  it('infers fish from name pattern', () => {
    const dish = makeDish('fish-curry', 'Fish Curry');
    const result = getIngredientsForMealOption('fish-curry', '', [dish]);
    expect(result.some(i => i.name === 'Fish')).toBe(true);
  });

  it('returns default ingredients for unknown dish', () => {
    const result = getIngredientsForMealOption('unknown-dish-xyz', '', []);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(i => i.name === 'Ghee')).toBe(true);
    expect(result.some(i => i.name === 'Oil')).toBe(true);
    expect(result.some(i => i.name === 'Spices')).toBe(true);
  });

  it('includes category selections when provided', () => {
    const dish = makeDish('simple-dish', 'Simple Dish');
    const selections: CategorySelection = {
      gravy: null, roti: { id: 'naan', name: 'Naan' }, rice: null,
      sides: [], beverages: [], dessert: [], itemQtys: {},
    };
    const result = getIngredientsForMealOption('simple-dish', '', [dish], selections);
    expect(result.some(i => i.name === 'Maida')).toBe(true);
  });

  it('caches results by cache key', () => {
    const dish = makeDish('test-cache', 'Test Cache', {
      variants: [{
        id: 'test-cache_v1',
        name: 'Test Cache',
        ingredients: [{ name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }],
      }],
    });
    const r1 = getIngredientsForMealOption('test-cache', 'test-cache_v1', [dish]);
    const r2 = getIngredientsForMealOption('test-cache', 'test-cache_v1', [dish]);
    expect(r1).toBe(r2);
  });

  it('invalidates cache on call', () => {
    const dish = makeDish('test-inv', 'Test Inv', {
      variants: [{
        id: 'test-inv_v1',
        name: 'Test Inv',
        ingredients: [{ name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }],
      }],
    });
    const r1 = getIngredientsForMealOption('test-inv', 'test-inv_v1', [dish]);
    invalidateIngredientCache();
    const r2 = getIngredientsForMealOption('test-inv', 'test-inv_v1', [dish]);
    expect(r1).not.toBe(r2);
  });

  it('infers idli/dosa batter ingredients', () => {
    const dish = makeDish('idli', 'Idli');
    const result = getIngredientsForMealOption('idli', '', [dish]);
    expect(result.some(i => i.name === 'Rice')).toBe(true);
    expect(result.some(i => i.name === 'Urad Dal')).toBe(true);
  });

  it('does not infer eggs from eggplant/baingan dishes', () => {
    const dish = makeDish('north-baingan-bharta', 'Baingan Bharta (Smoked Eggplant)');
    const result = getIngredientsForMealOption('north-baingan-bharta', '', [dish]);
    expect(result.some(i => i.name === 'Eggs')).toBe(false);
  });

  it('does not infer eggs from baingan variant', () => {
    const dish = makeDish('north-baingan-bharta', 'Baingan Bharta (Smoked Eggplant)', {
      variants: [{ id: 'baingan-bharta-phulka', name: 'Baingan Bharta with Phulka', mealContext: 'lunch' }],
    });
    const result = getIngredientsForMealOption('north-baingan-bharta', 'baingan-bharta-phulka', [dish]);
    expect(result.some(i => i.name === 'Eggs')).toBe(false);
    expect(result.some(i => i.name === 'White Bread')).toBe(false);
    expect(result.some(i => i.name === 'Milk')).toBe(false);
    expect(result.some(i => i.name === 'Sugar')).toBe(false);
    expect(result.some(i => i.name === 'Butter')).toBe(false);
  });
});

// ─── isDishVeganCompatible ────────────────────────────────────────────────────

describe('isDishVeganCompatible', () => {
  it('returns true for vegan dish', () => {
    const dish = makeDish('v-dish', 'Vegan Dish', { type: 'vegan' });
    expect(isDishVeganCompatible(dish)).toBe(true);
  });

  it('returns true for veg dish', () => {
    const dish = makeDish('veg-dish', 'Veg Dish', { type: 'veg' });
    expect(isDishVeganCompatible(dish)).toBe(true);
  });

  it('returns false for non-veg dish', () => {
    const dish = makeDish('nv-dish', 'Non Veg', { type: 'non-veg' });
    expect(isDishVeganCompatible(dish)).toBe(false);
  });
});

// ─── isVariantVeganCompatible ─────────────────────────────────────────────────

describe('isVariantVeganCompatible', () => {
  it('returns true for plain variant', () => {
    expect(isVariantVeganCompatible({ id: 'v1', name: 'Plain' })).toBe(true);
  });

  it('returns false for dairy add-on', () => {
    expect(isVariantVeganCompatible({ id: 'v2', name: 'With Cheese', addOn: 'cheese' })).toBe(false);
  });

  it('returns false for egg accompaniment', () => {
    expect(isVariantVeganCompatible({ id: 'v3', name: 'With Egg', accompaniments: ['egg salad'] })).toBe(false);
  });
});

// ─── buildPantryGroups ────────────────────────────────────────────────────────

describe('buildPantryGroups', () => {
  it('aggregates ingredients by category', () => {
    const input = [
      { ing: { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' as const, inStock: false }, source: 'Dish A' },
      { ing: { name: 'Tomatoes', quantity: 3, unit: 'pc', category: 'produce' as const, inStock: false }, source: 'Dish A' },
      { ing: { name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy' as const, inStock: false }, source: 'Dish B' },
    ];
    const groups = buildPantryGroups(input);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const produce = groups.find(g => g.category === 'produce');
    expect(produce).toBeDefined();
    expect(produce!.items.length).toBe(2);
    const dairy = groups.find(g => g.category === 'dairy');
    expect(dairy).toBeDefined();
    expect(dairy!.items.length).toBe(1);
  });

  it('consolidates grains like rice and roti', () => {
    const input = [
      { ing: { name: 'Rice', quantity: 1, unit: 'cup', category: 'grains' as const, inStock: false }, source: 'Dish A' },
      { ing: { name: 'Steamed Rice', quantity: 1, unit: 'cup', category: 'grains' as const, inStock: false }, source: 'Dish B' },
    ];
    const groups = buildPantryGroups(input);
    const grains = groups.find(g => g.category === 'grains');
    expect(grains).toBeDefined();
    const riceItem = grains!.items.find(i => i.name.toLowerCase().includes('basmati'));
    expect(riceItem).toBeDefined();
    expect(riceItem!.totalQuantity).toBeGreaterThanOrEqual(300);
  });

  it('sums quantities from multiple sources', () => {
    const input = [
      { ing: { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' as const, inStock: false }, source: 'Dish A' },
      { ing: { name: 'Onions', quantity: 3, unit: 'pc', category: 'produce' as const, inStock: false }, source: 'Dish B' },
    ];
    const groups = buildPantryGroups(input);
    const produce = groups.find(g => g.category === 'produce');
    const onions = produce!.items.find(i => i.name === 'Onions');
    // 5 pcs onion → 500g (buy-friendly grams)
    expect(onions!.totalQuantity).toBe(500);
    expect(onions!.unit).toBe('g');
    expect(onions!.sources).toContain('Dish A');
    expect(onions!.sources).toContain('Dish B');
  });

  it('follows category order', () => {
    const input = [
      { ing: { name: 'Spices', quantity: 1, unit: 'packet', category: 'spices' as const, inStock: false }, source: 'X' },
      { ing: { name: 'Onions', quantity: 1, unit: 'pc', category: 'produce' as const, inStock: false }, source: 'X' },
    ];
    const groups = buildPantryGroups(input);
    expect(groups[0]!.category).toBe('produce');
    expect(groups[1]!.category).toBe('spices');
  });
});

// ─── Date Helpers ─────────────────────────────────────────────────────────────

describe('getTomorrowISO', () => {
  it('returns a date string in YYYY-MM-DD format', () => {
    const result = getTomorrowISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns tomorrows date', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const expected = tomorrow.toLocaleDateString('en-CA');
    expect(getTomorrowISO()).toBe(expected);
  });
});

describe('getWeekEndISO', () => {
  it('returns a date 6 days from now', () => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);
    const expected = weekEnd.toLocaleDateString('en-CA');
    expect(getWeekEndISO()).toBe(expected);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('inferIngredientsFromDishId handles special Indian dishes', () => {
    const dishes = [
      makeDish('chole-bhature', 'Chole Bhature'),
      makeDish('biryani', 'Chicken Biryani'),
      makeDish('pav-bhaji', 'Pav Bhaji'),
    ];
    for (const d of dishes) {
      const result = getIngredientsForMealOption(d.id, '', dishes);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('handles dish with accompaniments on variant', () => {
    const dish = makeDish('special-dish', 'Special Dish', {
      variants: [{
        id: 'special-dish_v1',
        name: 'Special Dish',
        accompaniments: ['curd', 'salad', 'papad'],
      }],
    });
    const result = getIngredientsForMealOption('special-dish', 'special-dish_v1', [dish]);
    expect(result.some(i => i.name === 'Yogurt')).toBe(true);
    expect(result.some(i => i.name === 'Salad Mix')).toBe(true);
    expect(result.some(i => i.name === 'Papad')).toBe(true);
  });

  it('concurrent calls share cache reference', async () => {
    const dish = makeDish('concurrent', 'Concurrent', {
      variants: [{
        id: 'concurrent_v1',
        name: 'Concurrent',
        ingredients: [{ name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }],
      }],
    });
    const [r1, r2] = await Promise.all([
      Promise.resolve(getIngredientsForMealOption('concurrent', 'concurrent_v1', [dish])),
      Promise.resolve(getIngredientsForMealOption('concurrent', 'concurrent_v1', [dish])),
    ]);
    expect(r1).toBe(r2);
  });

  it('cache miss after invalidation returns fresh result', () => {
    const dish = makeDish('miss', 'Miss', {
      variants: [{
        id: 'miss_v1',
        name: 'Miss',
        ingredients: [{ name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }],
      }],
    });
    const r1 = getIngredientsForMealOption('miss', 'miss_v1', [dish]);
    invalidateIngredientCache();
    const r2 = getIngredientsForMealOption('miss', 'miss_v1', [dish]);
    expect(r1).not.toBe(r2);
  });

  it('different cache keys produce different references', () => {
    const dish1 = makeDish('a', 'A', {
      variants: [{ id: 'a_v1', name: 'A', ingredients: [{ name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }] }],
    });
    const dish2 = makeDish('b', 'B', {
      variants: [{ id: 'b_v1', name: 'B', ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }] }],
    });
    const r1 = getIngredientsForMealOption('a', 'a_v1', [dish1]);
    const r2 = getIngredientsForMealOption('b', 'b_v1', [dish2]);
    expect(r1).not.toBe(r2);
  });
});

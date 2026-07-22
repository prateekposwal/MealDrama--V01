/**
 * Tests for ingredientUtils.ts — ingredient resolution, inference engine, pantry grouping.
 *
 * Run: npx vitest run tests/utils/ingredientUtils.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getIngredientsForCategoryOption,
  getIngredientsFromCategorySelections,
  buildPantryGroups,
  getTomorrowISO,
  getWeekEndISO,
  invalidateIngredientCache,
} from '../../utils/ingredientUtils';

// ─── getIngredientsForCategoryOption ───────────────────────────────────────
describe('getIngredientsForCategoryOption', () => {
  it('resolves conocnut-chutney to Coconut + Green Chilli', () => {
    const ings = getIngredientsForCategoryOption('coconut-chutney');
    expect(ings.length).toBeGreaterThanOrEqual(2);
    expect(ings.some(i => i.name === 'Coconut')).toBe(true);
    expect(ings.some(i => i.name.includes('Chilli'))).toBe(true);
  });

  it('resolves sambar to Toor Dal + Tomatoes', () => {
    const ings = getIngredientsForCategoryOption('sambar');
    expect(ings.length).toBeGreaterThanOrEqual(2);
    expect(ings.some(i => i.name === 'Toor Dal')).toBe(true);
  });

  it('returns empty array for unknown item', () => {
    const ings = getIngredientsForCategoryOption('nonexistent-dish-xyz');
    expect(ings).toEqual([]);
  });

  it('normalizes spaces to hyphens for matching', () => {
    const ings = getIngredientsForCategoryOption('coconut chutney');
    expect(ings.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── getIngredientsFromCategorySelections ────────────────────────────────────
describe('getIngredientsFromCategorySelections', () => {
  it('resolves gravy + roti + sides to ingredients', () => {
    const ings = getIngredientsFromCategorySelections({
      gravy: { id: 'brown-gravy-onion-tomato', name: 'Brown Gravy' },
      roti: { id: 'phulka', name: 'Phulka' },
      rice: null,
      sides: [{ id: 'salad', name: 'Side Salad' }],
      beverages: [],
      dessert: [],
      itemQtys: {},
    });
    expect(ings.length).toBeGreaterThanOrEqual(3);
    expect(ings.some(i => i.name === 'Onions')).toBe(true);
    expect(ings.some(i => i.name === 'Tomatoes')).toBe(true);
  });

  it('returns empty array for null selections', () => {
    const ings = getIngredientsFromCategorySelections({
      gravy: null, roti: null, rice: null,
      sides: [], beverages: [], dessert: [], itemQtys: {},
    });
    expect(ings).toEqual([]);
  });
});

// ─── buildPantryGroups ──────────────────────────────────────────────────────
describe('buildPantryGroups', () => {
  it('groups ingredients by category', () => {
    const groups = buildPantryGroups([
      { ing: { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' }, source: 'Rajma Chawal' },
      { ing: { name: 'Tomatoes', quantity: 3, unit: 'pc', category: 'produce' }, source: 'Rajma Chawal' },
      { ing: { name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy' }, source: 'Dal Makhani' },
      { ing: { name: 'Wheat Flour', quantity: 1, unit: 'cup', category: 'grains' }, source: 'Roti' },
    ]);

    expect(groups.length).toBeGreaterThanOrEqual(3);

    const produce = groups.find(g => g.category === 'produce');
    expect(produce).toBeDefined();
    expect(produce!.items.length).toBe(2);

    const dairy = groups.find(g => g.category === 'dairy');
    expect(dairy).toBeDefined();
    expect(dairy!.items[0].name).toBe('Yogurt');
  });

  it('aggregates duplicate ingredients from multiple sources', () => {
    const groups = buildPantryGroups([
      { ing: { name: 'Onions', quantity: 1, unit: 'pc', category: 'produce' }, source: 'Rajma Chawal' },
      { ing: { name: 'Onions', quantity: 2, unit: 'pc', category: 'produce' }, source: 'Dal Tadka' },
    ]);

    const produce = groups.find(g => g.category === 'produce');
    expect(produce).toBeDefined();
    expect(produce!.items[0].totalQuantity).toBe(3);
    expect(produce!.items[0].sources).toContain('Rajma Chawal');
    expect(produce!.items[0].sources).toContain('Dal Tadka');
  });

  it('converts cups to grams for grains', () => {
    const groups = buildPantryGroups([
      { ing: { name: 'Basmati Rice', quantity: 1, unit: 'cup', category: 'grains' }, source: 'Biryani' },
    ]);
    const grains = groups.find(g => g.category === 'grains');
    expect(grains).toBeDefined();
    expect(grains!.items[0].unit).toBe('g');
    expect(grains!.items[0].totalQuantity).toBe(185);
  });

  it('handles empty input', () => {
    const groups = buildPantryGroups([]);
    expect(groups).toEqual([]);
  });
});

// ─── Cache invalidation ─────────────────────────────────────────────────────
describe('invalidateIngredientCache', () => {
  it('runs without throwing', () => {
    expect(() => invalidateIngredientCache()).not.toThrow();
  });
});

// ─── Date helpers ──────────────────────────────────────────────────────────
describe('getTomorrowISO / getWeekEndISO', () => {
  it('returns valid ISO date strings', () => {
    const tomorrow = getTomorrowISO();
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns week end after tomorrow', () => {
    const tomorrow = getTomorrowISO();
    const weekEnd = getWeekEndISO();
    expect(weekEnd >= tomorrow).toBe(true);
  });
});

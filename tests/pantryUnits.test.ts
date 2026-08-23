import { describe, it, expect } from 'vitest';
import { buildPantryGroups, toBuyGrams, canonicalName } from '../utils/ingredientUtils';
import { computeForecast, type InventoryEntry, type ForecastWorkspace } from '../utils/pantryForecast';
import type { Ingredient } from '../meal/constants/dishLibrary';

const src = (ing: Ingredient) => ({ ing, source: 'Test Dish' });

describe('buildPantryGroups — buy-friendly unit normalization', () => {
  it('Coriander Leaves 0.5 cup → 15 g (1 cup ≈ 30 g)', () => {
    const groups = buildPantryGroups([src({ name: 'Coriander Leaves', quantity: 0.5, unit: 'cup', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('coriander'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(15);
  });

  it('Coriander Leaves 1 pc → 30 g', () => {
    const groups = buildPantryGroups([src({ name: 'Coriander Leaves', quantity: 1, unit: 'pc', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('coriander'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(30);
  });

  it('Ginger 1 pc → 10 g', () => {
    const groups = buildPantryGroups([src({ name: 'Ginger', quantity: 1, unit: 'pc', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('ginger'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(10);
  });

  it('Onion 5.5 pc → 550 g (1 onion ≈ 100 g)', () => {
    const groups = buildPantryGroups([src({ name: 'Onion', quantity: 5.5, unit: 'pc', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('onion'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(550);
  });

  it('Potato 2.5 pc → 300 g (1 potato ≈ 120 g)', () => {
    const groups = buildPantryGroups([src({ name: 'Potato', quantity: 2.5, unit: 'pcs', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('potato'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(300);
  });

  it('Tomato 6 pc → 480 g (1 tomato ≈ 80 g)', () => {
    const groups = buildPantryGroups([src({ name: 'Tomato', quantity: 6, unit: 'pc', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('tomato'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(480);
  });

  it('already-grams produce passes through unchanged', () => {
    const groups = buildPantryGroups([src({ name: 'Ginger', quantity: 5, unit: 'g', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('ginger'))!;
    expect(item.unit).toBe('g');
    expect(item.totalQuantity).toBe(5);
  });

  it('bulk >1kg converts to kg', () => {
    const groups = buildPantryGroups([src({ name: 'Potato', quantity: 12, unit: 'pc', category: 'produce' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase().includes('potato'))!;
    expect(item.unit).toBe('kg');
    expect(item.totalQuantity).toBe(1.4);
  });

  it('dairy stays in ml/liter (not forced to grams)', () => {
    const groups = buildPantryGroups([src({ name: 'Milk', quantity: 1, unit: 'liter', category: 'dairy' })]);
    const item = groups.flatMap(g => g.items).find(i => i.name.toLowerCase() === 'milk')!;
    expect(item.unit).toBe('liter');
  });
});

describe('buy-vs-forecast bridge — pack to surplus', () => {
  const ws = (lib: Record<string, Ingredient[]>): ForecastWorkspace => ({
    dishes: [],
    horizonDates: ['2026-08-23', '2026-08-24'],
    getDayItems: (date) =>
      date === '2026-08-23' ? Object.keys(lib).map(mealId => ({ mealId, quantity: 1 })) : [],
  });

  it('canonicalName reconciles buy-name "Coriander" with library "Coriander Leaves"', () => {
    expect(canonicalName('Coriander')).toBe(canonicalName('Coriander Leaves'));
    expect(canonicalName('Potato')).toBe(canonicalName('Potatoes'));
    expect(canonicalName('Onion')).toBe(canonicalName('Onion'));
  });

  it('buy 200 g coriander vs forecast 0.5 cup (≈15 g) → surplus ~185 g', () => {
    const lib = { 'chutney': [ { name: 'Coriander Leaves', quantity: 0.5, unit: 'cup', category: 'produce' } as Ingredient ] };
    const entry: InventoryEntry = { name: 'Coriander', quantity: 200, unit: 'g', addedAt: '2026-08-22' };
    const perDay = computeForecast(entry, ws(lib), (id) => lib[id] ?? []);
    const forecast = perDay.reduce((s, d) => s + d.qty, 0);
    expect(forecast).toBe(15);
    expect(200 - forecast).toBe(185);
  });

  it('buy 300 g potato vs forecast 2.5 pc (≈300 g) → no surplus (enough)', () => {
    const lib = { 'curry': [ { name: 'Potato', quantity: 2.5, unit: 'pcs', category: 'produce' } as Ingredient ] };
    const entry: InventoryEntry = { name: 'Potato', quantity: 300, unit: 'g', addedAt: '2026-08-22' };
    const perDay = computeForecast(entry, ws(lib), (id) => lib[id] ?? []);
    const forecast = perDay.reduce((s, d) => s + d.qty, 0);
    expect(forecast).toBe(300);
    expect(300 - forecast).toBe(0);
  });

  it('toBuyGrams leaves already-grams items untouched and converts pc/cup', () => {
    expect(toBuyGrams({ name: 'Ginger', quantity: 5, unit: 'g', category: 'produce' }).unit).toBe('g');
    const conv = toBuyGrams({ name: 'Tomato', quantity: 6, unit: 'pc', category: 'produce' });
    expect(conv.unit).toBe('g');
    expect(conv.quantity).toBe(480);
  });
});
import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { categoryForName } from '../utils/pantryForecast';
import { buildPantryGroups } from '../utils/ingredientUtils';

const PLANT_MILKS = ['Coconut Milk', 'Almond Milk', 'Oat Milk'];

function allIngredientRows(): Array<{ dish: string; variant: string; ing: { name: string; category: string } }> {
  const rows: Array<{ dish: string; variant: string; ing: { name: string; category: string } }> = [];
  for (const d of DISH_LIBRARY) {
    for (const v of d.variants ?? []) {
      for (const ing of v.ingredients ?? []) {
        rows.push({ dish: d.id, variant: v.id, ing: { name: ing.name, category: ing.category } });
      }
    }
  }
  return rows;
}

describe('F4 — plant milks are pantry, never dairy', () => {
  it('every plant-milk ingredient row in DISH_LIBRARY is category pantry (not dairy)', () => {
    const rows = allIngredientRows().filter(r => PLANT_MILKS.some(pm => r.ing.name === pm));
    expect(rows.length).toBeGreaterThan(10);
    for (const r of rows) {
      expect(r.ing.category, `${r.dish}::${r.variant} ${r.ing.name}`).toBe('pantry');
    }
  });

  it('categoryForName classifies plant milks as pantry (ahead of the dairy "milk" keyword)', () => {
    expect(categoryForName('Coconut Milk')).toBe('pantry');
    expect(categoryForName('Almond Milk')).toBe('pantry');
    expect(categoryForName('Oat Milk')).toBe('pantry');
    expect(categoryForName('coconut milk')).toBe('pantry');
    expect(categoryForName('Full Cream Milk')).toBe('dairy');
    expect(categoryForName('Whole Milk')).toBe('dairy');
  });

  it('buildPantryGroups buckets coconut milk under the Pantry group', () => {
    const groups = buildPantryGroups([{ ing: { name: 'Coconut Milk', quantity: 1, unit: 'cup', category: 'pantry' }, source: 'test' }]);
    const pantry = groups.find(g => g.category === 'pantry');
    expect(pantry?.items.some(i => i.name === 'Coconut Milk')).toBe(true);
    const dairy = groups.find(g => g.category === 'dairy');
    expect(!dairy || !dairy.items.some(i => i.name === 'Coconut Milk')).toBe(true);
  });
});
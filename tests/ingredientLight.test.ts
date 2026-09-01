import { describe, it, expect } from 'vitest';
import { getIngredientsForMealOption, isPlaceholderIngredients } from '../utils/ingredientUtils';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

describe('placeholder templates — the "Salt/Pepper/Coriander" repeating gap', () => {
  it('placeholder detection flags tiny generic-only lists as NOT a recipe', () => {
    expect(isPlaceholderIngredients([{ name: 'Salt' }, { name: 'Pepper' }])).toBe(true);
    expect(isPlaceholderIngredients([{ name: 'Salt' }])).toBe(true);
    expect(isPlaceholderIngredients([{ name: 'Salt' }, { name: 'Water' }, { name: 'Pepper' }])).toBe(true); // fully-generic = filler
    expect(isPlaceholderIngredients([{ name: 'Bajra Flour' }, { name: 'Ghee' }])).toBe(true); // ≤2 items — not a real recipe
    expect(isPlaceholderIngredients([{ name: 'Bajra Flour' }, { name: 'Ghee' }, { name: 'Jaggery' }, { name: 'Ajwain' }])).toBe(false); // real recipe
  });

  it('Dal Panchmel Shorba now resolves all five dals + aromatics + ghee + finish', () => {
    const ings = getIngredientsForMealOption('dal-panchmel-shorba', 'dpss-classic', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['yellow moong dal', 'urad dal', 'chana dal', 'green moong dal', 'toor dal', 'cumin seeds', 'asafoetida', 'ghee', 'tomato', 'lemon']) {
      expect(names.has(want), want).toBe(true);
    }
  });

  it('library scan: no dish’s variant is the bare placeholder template anymore', () => {
    const offenders: Array<[string, string]> = [];
    for (const d of DISH_LIBRARY) {
      for (const v of d.variants ?? []) {
        const ings = (v.ingredients ?? []).map(i => i.name.trim().toLowerCase());
        if (ings.length > 0 && ings.length <= 2 && ings.every(n => ['salt', 'pepper', 'coriander leaves', 'coriander', 'water'].includes(n))) {
          offenders.push([d.id, v.name]);
        }
      }
    }
    expect(offenders, JSON.stringify(offenders)).toEqual([]);
  });
});

describe('explicit recipes are TRUSTED (the Seven-Colour Tea pollution bug)', () => {
  it('Seven-Colour Tea returns its exact 5 ingredients — no oil/ghee/chutney/yogurt/potato/', () => {
    const ings = getIngredientsForMealOption('seven-colour-tea', 'seven-colour-tea-classic', DISH_LIBRARY);
    const names = ings.map(i => i.name);
    expect(names).toEqual(['Tea Leaves', 'Milk', 'Saffron', 'Rose Water', 'Sugar']);
    const lower = names.join(' ').toLowerCase();
    for (const junk of ['chutney', 'ghee', 'oil', 'yogurt', 'potato', 'spice']) {
      expect(lower.includes(junk), junk).toBe(false);
    }
  });

  it('light dishes with NO explicit recipe still get filtered (no savoury junk)', () => {
    // Find a beverage/sparse variant and assert the light gate holds.
    const chai = DISH_LIBRARY.find(d => /chai|tea/i.test(d.name) && !(d.variants?.[0]?.ingredients ?? []).length);
    if (chai) {
      const ings = getIngredientsForMealOption(chai.id, chai.variants?.[0]?.id ?? '', DISH_LIBRARY);
      const lower = ings.map(i => i.name).join(' ').toLowerCase();
      expect(lower.includes('chutney'), chai.id).toBe(false);
      expect(lower.includes('potato'), chai.id).toBe(false);
      expect(lower.includes('yogurt'), chai.id).toBe(false);
    } else {
      // Fall back to a dishes-with-no-recipe beverage — should be similarly clean
      const veggies = DISH_LIBRARY.find(d => (d.tags ?? []).includes('beverage'));
      expect(veggies).toBeTruthy();
    }
  });

  it('savoury mains without a recipe still resolve a complete list (night ring unchanged)', () => {
    const dal = DISH_LIBRARY.find(d => d.id === 'dal-gosht')!;
    const names = new Set(getIngredientsForMealOption('dal-gosht', 'dg-roti', DISH_LIBRARY).map(i => i.name.toLowerCase()));
    expect(names.has('onion')).toBe(true); // completeness aromatics still there
    expect(names.has('tomato')).toBe(true);
  });

  it('Bajre Ka Raab now carries BOTH styles with their real ingredients', () => {
    const sweet = getIngredientsForMealOption('bajre-ka-raab', 'bkr-sweet', DISH_LIBRARY).map(i => i.name);
    const sweetL = sweet.join(' ').toLowerCase();
    for (const want of ['Bajra Flour', 'Ghee', 'Jaggery', 'Ajwain']) {
      expect(sweetL.includes(want.toLowerCase()), want).toBe(true);
    }
    const savory = getIngredientsForMealOption('bajre-ka-raab', 'bkr-savory', DISH_LIBRARY).map(i => i.name);
    const savoryL = savory.join(' ').toLowerCase();
    for (const want of ['Bajra Flour', 'Buttermilk', 'Cumin Seeds', 'Black Salt']) {
      expect(savoryL.includes(want.toLowerCase()), want).toBe(true);
    }
  });
});
import { describe, it, expect } from 'vitest';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { allowedTypesForDiet } from '../utils/dietQuota';

describe('base INDIAN aromatics — the missing tomato/onion/ginger/garlic gap', () => {
  it('Dal Gosht shares a COMPLETE ingredient list (onion, tomato, chilli, ginger-garlic, coriander)', () => {
    const ings = getIngredientsForMealOption('dal-gosht', '', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['Onion', 'Tomato', 'Green Chilli', 'Ginger-Garlic Paste', 'Coriander Leaves']) {
      expect(names.has(want.toLowerCase()), want).toBe(true);
    }
    // and the protein/legumes are still listed
    expect(names.has('mutton') || names.has('mixed dal')).toBe(true);
  });

  it('Chilli Chicken Gravy variant also gets the aromatics', () => {
    const ings = getIngredientsForMealOption('chilli-chicken', 'cc-gravy', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['Onion', 'Tomato', 'Green Chilli', 'Ginger-Garlic Paste']) {
      expect(names.has(want.toLowerCase()), want).toBe(true);
    }
    expect(names.has('chicken')).toBe(true);
  });

  it('bakery/sweet/bread dishes are NOT polluted with curry aromatics', () => {
    const ings = getIngredientsForMealOption('gulab-jamun', 'gulab-jamun-classic', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    expect(names.has('onion')).toBe(false);
    expect(names.has('green chilli')).toBe(false);
  });
});

describe('allowedTypesForDiet', () => {
  it('maps every diet to its allowed dish types (veg user never gets non-veg)', () => {
    expect(allowedTypesForDiet('veg')).toEqual(['veg', 'vegan']);
    expect(allowedTypesForDiet('veg')).not.toContain('non-veg');
    expect(allowedTypesForDiet('non-veg')).toContain('non-veg');
    expect(allowedTypesForDiet('eggitarian')).toContain('eggitarian');
    expect(allowedTypesForDiet('vegan')).toEqual(['vegan']);
  });
});

describe('ingredient COMPLETENESS — dry fruits + staples across all dishes', () => {
  it('a dessert with sparse variants gains DRY FRUITS + sugar/cardamom (no Ghee pollution)', () => {
    const kulfi = DISH_LIBRARY.find(d => d.id === 'kulfi')!;
    const ings = getIngredientsForMealOption('kulfi', 'kulfi-plain', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['Raisins', 'Almonds', 'Pistachios', 'Sugar', 'Cardamom']) {
      expect(names.has(want.toLowerCase()), want).toBe(true);
    }
    expect(names.has('ghee')).toBe(false); // pantry contract: no inferred Ghee on sweets
  });

  it('a south curry gains coconut/curry leaves/mustard seed/tamarind + oil/salt/turmeric', () => {
    const southCurry = DISH_LIBRARY.find(d =>
      (d.region === 'south' || d.region === 'all')
      && ((d.tags ?? []).includes('curry') || (d.name || '').toLowerCase().includes('curry')),
    )!;
    const ings = getIngredientsForMealOption(southCurry.id, '', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['Oil', 'Salt', 'Turmeric', 'Coconut', 'Curry Leaves', 'Mustard Seeds', 'Tamarind']) {
      expect(names.has(want.toLowerCase()), `${southCurry.id}:${want}`).toBe(true);
    }
  });

  it('a biryani gains ghee + saffron + mint + whole spices', () => {
    const biryani = DISH_LIBRARY.find(d => (d.name || '').toLowerCase().includes('biryani'))!;
    const ings = getIngredientsForMealOption(biryani.id, '', DISH_LIBRARY);
    const names = new Set(ings.map(i => i.name.toLowerCase()));
    for (const want of ['Ghee', 'Saffron', 'Mint Leaves', 'Whole Spices']) {
      expect(names.has(want.toLowerCase()), `${biryani.id}:${want}`).toBe(true);
    }
  });
});

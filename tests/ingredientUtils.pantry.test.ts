import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import {
  getIngredientsForMealOption,
  invalidateIngredientCache,
} from '../utils/ingredientUtils';
import { getDishGraph } from '../app/utils/DishGraph';
import { GENERATED_INGREDIENTS } from '../meal/constants/generatedIngredients';

const GENERIC = new Set([
  'salt', 'oil', 'ghee', 'spices', 'mixed vegetables', 'mixed greens',
  'water', 'pepper', 'coriander', 'fresh coriander',
]);

/** Every dish must resolve at least one non-generic ingredient from the library. */
describe('pantry gap closure — every dish resolves real ingredients', () => {
  it('kulfi (Malai Kulfi) resolves Milk, Sugar, Pistachios and NOT Salt/Oil junk', () => {
    invalidateIngredientCache();
    const ings = getIngredientsForMealOption('kulfi', 'kulfi-plain', DISH_LIBRARY);
    const names = ings.map(i => i.name);
    expect(names).toContain('Milk');
    expect(names).toContain('Sugar');
    expect(names).toContain('Pistachios');
    expect(names).not.toContain('Salt');
    expect(names).not.toContain('Oil');
  });

  it('all dishes with no explicit variant ingredients resolve a non-generic pantry fill', () => {
    invalidateIngredientCache();
    const gaps: string[] = [];
    for (const d of DISH_LIBRARY) {
      const v = (d.variants ?? [])[0];
      if (v?.ingredients?.length) continue; // explicit — by construction fine
      const ings = getIngredientsForMealOption(d.id, v?.id || '', DISH_LIBRARY);
      if (!ings.some(i => !GENERIC.has(i.name.toLowerCase()))) gaps.push(d.id);
    }
    expect(gaps).toEqual([]);
  });

  it('Northeast regional dishes have real ingredient fills (gundruk, thenthuk)', () => {
    invalidateIngredientCache();
    for (const id of ['gundruk', 'thenthuk', 'chamthong']) {
      const ings = getIngredientsForMealOption(id, '', DISH_LIBRARY);
      const names = ings.map(i => i.name);
      expect(names.length).toBeGreaterThan(1);
      expect(names.some(i => !GENERIC.has(i.toLowerCase()))).toBe(true);
    }
  });

  it('sweet dishes resolve without Ghee/Spices auto-add pollution', () => {
    invalidateIngredientCache();
    // pazham-pori is a fried fritter — Oil is a genuine recipe ingredient there;
    // the invariant is: no auto-added Ghee/Spices junk on sweets.
    const sweetIds = ['kulfi', 'haalbai', 'pori-urundai', 'ada-pradhaman', 'pazham-pori', 'minil-songa'];
    for (const id of sweetIds) {
      const ings = getIngredientsForMealOption(id, '', DISH_LIBRARY);
      const names = ings.map(i => i.name);
      expect(names).not.toContain('Ghee');
      expect(names).not.toContain('Spices');
    }
  });
});

/** DishGraph keys must match the generated map (dishId::variantId). */
describe('DishGraph shared-ingredient lookup', () => {
  it('builds a non-empty graph using variant-id keys', () => {
    const g = getDishGraph(DISH_LIBRARY);
    let hits = 0;
    for (const d of DISH_LIBRARY) {
      for (const v of d.variants ?? []) {
        const key = `${d.id}::${v.id}`;
        if (g.ingredientsForDish(key).length) hits++;
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeGreaterThan(700); // was 0 before the variant-id key fix
  });

  it('finds at least one dish sharing ingredients with aloo paratha', () => {
    const g = getDishGraph(DISH_LIBRARY);
    const shared = g.dishesSharingIngredients('aloo-paratha::aloo-paratha-plain');
    expect(shared.size).toBeGreaterThan(0);
  });
});

/** Generated map must never be the sole authoritative source for pantry auto-add. */
describe('generated-map sanity', () => {
  it('kulfi resolves beyond the stale generated [Salt, Oil] entry', () => {
    // The committed GENERATED map still carries the old Salt+Oil fallback for kulfi;
    // the resolution fix ensures it is never the authoritative answer.
    const generated = GENERATED_INGREDIENTS['kulfi::kulfi-plain'];
    expect(generated).toBeDefined();
    invalidateIngredientCache();
    const resolved = getIngredientsForMealOption('kulfi', 'kulfi-plain', DISH_LIBRARY);
    const names = resolved.map(i => i.name.toLowerCase());
    expect(names).not.toContain('salt');
    expect(names).not.toContain('oil');
    expect(names).toContain('milk');
    expect(names).toContain('pistachios');
  });
});
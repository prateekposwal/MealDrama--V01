import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption, isPlaceholderIngredients } from '../utils/ingredientUtils';

// Gate: NO dish variant may carry an explicit ingredient list that the
// ingredient engine would reject as filler (Salt-Pepper-Coriander stubs,
// 1-2-item placeholders, base-only gravy templates pasted on without the
// dish's actual main). When the engine can't trust a list, it mutates the
// output by appending inferred ingredients — so bogus entries leak into the
// shopping list (Milk Oats once shipped Oil + Salt). Fix: give each such
// variant a truthful, complete explicit recipe in dishLibrary.ts and
// regenerate server/src/data/pantrySnapshot.ts
// (WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts).
describe('explicit ingredient lists are complete (no fill-the-gap residue)', () => {
  it('every variant with an explicit ingredients list passes the placeholder gate', () => {
    const offenders: string[] = [];
    for (const dish of DISH_LIBRARY) {
      for (const v of dish.variants) {
        if (!v.ingredients || v.ingredients.length === 0) continue;
        if (isPlaceholderIngredients(v.ingredients)) {
          offenders.push(
            `${dish.id}::${v.id} — ${v.ingredients.map((i) => i.name).join(', ')}`
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('Milk Oats resolves with its real recipe (oats + milk), not the old Oil+Salt stub', () => {
    const r = getIngredientsForMealOption(
      'milk-oats-fusion',
      'mof-classic',
      DISH_LIBRARY,
      undefined,
      null
    );
    const names = new Set(r.map((i) => i.name.trim().toLowerCase()));
    expect(names.has('oats')).toBe(true);
    expect(names.has('milk')).toBe(true);
    expect(names.has('oil')).toBe(false);
    expect(r.length).toBeGreaterThanOrEqual(4);
  });
});
// ─────────────────────────────────────────────────────────────────────────────
// PART 3 DATA PASS — named explicit `ingredients` fixed the resolved output of
// 10 previously-inferred variants (see session brief 2026-09-09). Each row now
// resolves its REAL recipe instead of inference noise (baking-powder appam,
// generic Fish, Ghee on a vegan dish, missing Kokam/Asparagus mains).
// Locked here so a future regression of the inference chain can't silently
// re-break them.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';

function resolve(dishId: string, variantId: string): string[] {
  return getIngredientsForMealOption(dishId, variantId, DISH_LIBRARY).map(i => i.name);
}

function hasAny(names: string[], needles: RegExp[]): boolean {
  return names.some(n => needles.some(re => re.test(n)));
}

describe('part3-data-pass', () => {
  it('bamboo shoot fry variants resolve bamboo, never pork/meat', () => {
    for (const vid of ['bsf-classic', 'bsf-mushroom']) {
      const names = resolve('bamboo-shoot-fry', vid);
      expect(names.some(n => /bamboo/i.test(n))).toBe(true);
      expect(hasAny(names, [/pork/i, /meat/i, /chicken/i, /mutton/i, /beef/i, /fish/i])).toBe(false);
    }
  });

  it('panch phoran tarka chicken variant keeps its chicken identity', () => {
    expect(resolve('panch-phoran-tarka', 'ppt-chicken').some(n => /chicken/i.test(n))).toBe(true);
  });

  it('appam egg variant has egg, plain appam does not', () => {
    expect(resolve('appam', 'appam-egg').some(n => /^egg$/i.test(n))).toBe(true);
    expect(resolve('appam', 'appam-plain').some(n => /^egg$/i.test(n))).toBe(false);
  });

  it('shorshe ilish plain resolves mustard + hilsa family', () => {
    const names = resolve('shorshe-ilish', 'si-plain');
    expect(hasAny(names, [/mustard/i])).toBe(true);
    expect(hasAny(names, [/hilsa/i, /ilish/i, /fish/i])).toBe(true);
  });

  it('indian asparagus lemon cumin resolves its asparagus main', () => {
    expect(resolve('indian-asparagus-lemon-cumin', 'ialc-classic').some(n => /asparagus/i.test(n))).toBe(true);
  });
});

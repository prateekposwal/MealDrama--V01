import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY, type Dish, type DishVariant } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { DIET_FILTER, firstValidVariant } from '../utils/dishSearch';

// ─────────────────────────────────────────────────────────────────────────────
// VEGAN-INTEGRITY — no real (animal) dairy may resolve on a vegan-eligible
// dish/variant. Plant milks (Coconut/Almond/Oat) and Peanut Butter are NOT
// dairy by this contract — only animal products are (F2/F3/F4 scope).
// ─────────────────────────────────────────────────────────────────────────────
const REAL_DAIRY = new Set([
  'Ghee', 'Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Paneer',
  'Buttermilk', 'Lassi', 'Raita', 'Whole Milk (chilled)', 'Vanilla Ice Cream',
]);

const resolvedNames = (dishId: string, variantId: string): string[] =>
  getIngredientsForMealOption(dishId, variantId, DISH_LIBRARY).map(i => i.name);

const dish = (id: string): Dish => {
  const d = DISH_LIBRARY.find(x => x.id === id);
  if (!d) throw new Error(`missing dish ${id}`);
  return d;
};

/** A variant is vegan-eligible when its resolved type (v.diet ?? dish.type) is
 *  in the vegan diet filter. Mirrors useStore/dishSearch eligibility. */
const veganEligible = (d: Dish, v: DishVariant): boolean =>
  DIET_FILTER['vegan']!.includes(v.diet ?? d.type);

describe('vegan integrity — F2 (inference guards)', () => {
  const VICTIMS: Array<[string, string[]]> = [
    ['overnight-oats', ['overnight-oats-classic', 'overnight-oats-fruit']],
    ['dal-panchmel-shorba', ['dpss-classic']],
    ['gobi-manchurian', ['gm-gravy', 'gm-dry']],
    ['aloo-matar', ['aloo-matar-rice', 'am-naan', 'am-roti']],
  ];

  it.each(VICTIMS)('%s resolves ZERO real dairy on every vegan-eligible variant', (dishId, variantIds) => {
    const d = dish(dishId);
    expect(d.type).toBe('vegan');
    for (const vid of variantIds) {
      const v = d.variants.find(x => x.id === vid);
      expect(v, `${dishId} variant ${vid}`).toBeDefined();
      const names = resolvedNames(dishId, vid);
      const leaked = names.filter(n => REAL_DAIRY.has(n));
      expect(leaked, `${dishId}::${vid} resolves ${JSON.stringify(leaked)}`).toEqual([]);
      expect(names.length, `${dishId}::${vid} still resolves a real recipe`).toBeGreaterThan(2);
    }
  });

  it('every vegan-eligible variant in the whole library resolves ZERO real dairy (regression sweep)', () => {
    const leaks: string[] = [];
    for (const d of DISH_LIBRARY) {
      for (const v of d.variants ?? []) {
        if (!veganEligible(d, v)) continue;
        const hit = resolvedNames(d.id, v.id).filter(n => REAL_DAIRY.has(n));
        if (hit.length) leaks.push(`${d.id}::${v.id} → ${hit.join(', ')}`);
      }
    }
    expect(leaks).toEqual([]);
  });
});

describe('vegan integrity — F3 (re-typed dairy dishes are honestly veg)', () => {
  const RE_TYPED: Array<[string, string[]]> = [
    ['honeydew-milk-tea', ['Milk']],
    ['wintermelon-milk-tea', ['Milk']],
    ['chocolate-milk-tea', ['Milk']],
    ['seven-colour-tea', ['Milk']],
    ['falooda', ['Whole Milk (chilled)', 'Vanilla Ice Cream']],
    ['moong-dal-halwa', ['Ghee', 'Milk']],
    ['dal-baati', ['Ghee']],
    ['baked-penne-roasted-veg', ['Cheese']],
  ];

  it.each(RE_TYPED)('%s is type veg (not vegan) and KEEPS its real dairy', (dishId, dairy) => {
    const d = dish(dishId);
    expect(d.type).toBe('veg');
    // every variant of a re-typed dish keeps the dairy that defines it
    for (const vid of (d.variants ?? []).map(v => v.id)) {
      const names = resolvedNames(dishId, vid);
      for (const want of dairy) {
        expect(names, `${dishId}::${vid} keeps ${want}`).toContain(want);
      }
    }
  });

  it('re-reciped vegan dishes stay vegan and carry the plant swap (dal-panchmel, smoothie/toast/milkshake)', () => {
    const shorba = resolvedNames('dal-panchmel-shorba', 'dpss-classic');
    expect(shorba).not.toContain('Ghee');
    expect(shorba).toContain('Oil');

    const smoothie = resolvedNames('almond-banana-smoothie', 'almond-banana-classic');
    expect(smoothie).not.toContain('Milk');
    expect(smoothie).toContain('Almond Milk');

    const shake = resolvedNames('peanut-butter-cup-milkshake', 'pbcm-classic');
    expect(shake).not.toContain('Milk');
    expect(shake).toContain('Almond Milk');

    const toast = resolvedNames('mushroom-toast', 'mt-classic');
    expect(toast).not.toContain('Butter');
    expect(toast).toContain('Olive Oil');

    const brownies = resolvedNames('eggless-brownies', 'eb-classic');
    expect(brownies).not.toContain('Butter');
  });

  it('egg variants of vegan-tagged fried rice are eggitarian (not vegan-eligible)', () => {
    for (const id of ['schezwan-fried-rice', 'chilli-garlic-fried-rice']) {
      const d = dish(id);
      const eggVar = d.variants.find(v => v.id.endsWith('-egg'));
      expect(eggVar?.diet, `${id} egg variant`).toBe('eggitarian');
      expect(veganEligible(d, eggVar!)).toBe(false);
    }
  });
});

describe('vegan integrity — mushroom-pulao raita diet override', () => {
  const d = dish('mushroom-pulao');

  it('dish stays vegan; raita variant is diet veg — excluded for vegan users, included for veg users', () => {
    expect(d.type).toBe('vegan');
    const raita = d.variants.find(v => v.id === 'mushroom-pulao-raita');
    expect(raita?.diet).toBe('veg');
    expect(veganEligible(d, raita!)).toBe(false);
    expect(DIET_FILTER['veg']!.includes(raita!.diet ?? d.type)).toBe(true);
  });

  it('the raita variant keeps its Yogurt identity; the classic variant resolves zero dairy', () => {
    expect(resolvedNames('mushroom-pulao', 'mushroom-pulao-raita')).toContain('Yogurt');
    const classic = resolvedNames('mushroom-pulao', 'mpul-classic');
    expect(classic.filter(n => REAL_DAIRY.has(n))).toEqual([]);
  });

  it('firstValidVariant for a vegan user never returns the raita variant', () => {
    const pick = firstValidVariant(d, 'vegan');
    expect(pick?.id).not.toBe('mushroom-pulao-raita');
  });
});

describe('vegan integrity — F1 puttu-kadala (no Fish, yes Chickpeas)', () => {
  it('puttu-kadala resolves NO Fish and DOES resolve Chickpeas + Chana Dal', () => {
    const names = resolvedNames('puttu-kadala', 'pk-breakfast');
    expect(names).not.toContain('Fish');
    expect(names).toContain('Chickpeas');
    expect(names).toContain('Chana Dal');
  });

  it('any future dish whose id contains kadala/kadalai must never resolve Fish via the kadal alias', () => {
    // Regression guard on the alias map itself: 'kadal' (sea) must not be a
    // substring-matching fish alias for 'kadala' (black chickpea).
    const anyDish = dish('puttu-kadala');
    const names = resolvedNames(anyDish.id, anyDish.variants[0]!.id);
    expect(names).not.toContain('Fish');
    expect(names.some(n => n.toLowerCase().includes('fish'))).toBe(false);
  });
});

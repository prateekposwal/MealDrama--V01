import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { Dish } from '../meal/constants/dishLibrary';
import { getDishVariants, firstValidVariant } from '../utils/dishSearch';
import { recipeIngredients } from '../utils/buyByDish';
import { getMealResolution } from '../app/store/useStore';

const dish = (id: string): Dish => DISH_LIBRARY.find(d => d.id === id)!;
const ids = (vs: { id: string }[]) => vs.map(v => v.id);

describe('getDishVariants — variant-level diet eligibility', () => {
  it('veg user is never offered the chicken variant of panch-phoran-tarka', () => {
    const variants = getDishVariants(dish('panch-phoran-tarka'), 'lunch', 'veg');
    expect(ids(variants)).toContain('ppt-veg');
    expect(ids(variants)).not.toContain('ppt-chicken');
  });

  it('non-veg user still sees the chicken variant', () => {
    const variants = getDishVariants(dish('panch-phoran-tarka'), 'lunch', 'non-veg');
    expect(ids(variants)).toContain('ppt-chicken');
  });

  it('egg variants: excluded for veg + vegan, included for eggitarian', () => {
    for (const [did, eggVariant] of [['appam', 'appam-egg'], ['parotta-kurma', 'pk-egg']] as const) {
      expect(ids(getDishVariants(dish(did), 'breakfast', 'veg'))).not.toContain(eggVariant);
      expect(ids(getDishVariants(dish(did), 'breakfast', 'vegan'))).not.toContain(eggVariant);
      expect(ids(getDishVariants(dish(did), 'breakfast', 'eggitarian'))).toContain(eggVariant);
    }
  });

  it('plain variants always survive for veg users', () => {
    expect(ids(getDishVariants(dish('appam'), 'breakfast', 'veg'))).toContain('appam-plain');
    expect(ids(getDishVariants(dish('parotta-kurma'), 'breakfast', 'veg'))).toContain('pk-classic');
    expect(ids(getDishVariants(dish('panch-phoran-tarka'), 'lunch', 'veg'))).toContain('ppt-veg');
  });

  it('no diet → unchanged legacy variant list', () => {
    expect(ids(getDishVariants(dish('appam'), 'breakfast'))).toEqual(['appam-plain', 'appam-egg']);
    expect(ids(getDishVariants(dish('panch-phoran-tarka'), 'lunch'))).toEqual(['ppt-veg', 'ppt-chicken']);
  });
});

describe('firstValidVariant — first diet-eligible variant', () => {
  it('veg diet skips flagged chicken/egg variants for auto-assign', () => {
    expect(firstValidVariant(dish('appam'), 'veg')!.id).toBe('appam-plain');
    expect(firstValidVariant(dish('parotta-kurma'), 'veg')!.id).toBe('pk-classic');
    expect(firstValidVariant(dish('panch-phoran-tarka'), 'veg')!.id).toBe('ppt-veg');
  });

  it('eggitarian/non-veg still resolve to the first eligible variant', () => {
    expect(firstValidVariant(dish('appam'), 'eggitarian')!.id).toBe('appam-plain');
    expect(firstValidVariant(dish('panch-phoran-tarka'), 'non-veg')!.id).toBe('ppt-veg');
  });

  it('no diet → first variant; none eligible → undefined', () => {
    expect(firstValidVariant(dish('appam'))!.id).toBe('appam-plain');
    const onlyEgg = { ...dish('appam'), variants: dish('appam').variants.filter(v => v.id === 'appam-egg') } as Dish;
    expect(firstValidVariant(onlyEgg, 'vegan')).toBeUndefined();
  });
});

describe('trait path — getMealResolution auto-assign respects diet', () => {
  const tray = {
    breakfast: [{ id: 'm1', dishId: 'appam', name: 'Appam' }],
    lunch: [], dinner: [], snacks: [],
  };

  it('veg user resolves appam breakfast to the plain variant', () => {
    const res = getMealResolution(tray, {}, '2030-06-06', 'breakfast', DISH_LIBRARY, undefined, 'veg');
    expect(res.meal?.variant).toBe('Appam');
  });

  it('eggitarian user resolves appam breakfast to the egg variant', () => {
    const res = getMealResolution(tray, {}, '2030-06-06', 'breakfast', DISH_LIBRARY, undefined, 'eggitarian');
    expect(res.meal?.variant).toBe('Appam with Egg');
  });
});

describe('recipeIngredients — flagged egg variants stay out of veg/vegan lists', () => {
  it('appam for veg → no egg ingredient', () => {
    const names = recipeIngredients(dish('appam'), DISH_LIBRARY, 'veg').map(i => i.name.toLowerCase());
    expect(names.some(n => n.includes('egg'))).toBe(false);
  });

  it('parotta-kurma: veg → no egg, eggitarian → egg present', () => {
    const veg = recipeIngredients(dish('parotta-kurma'), DISH_LIBRARY, 'veg').map(i => i.name.toLowerCase());
    expect(veg.some(n => n.includes('egg'))).toBe(false);
    const withEgg = recipeIngredients(dish('parotta-kurma'), DISH_LIBRARY, 'eggitarian').map(i => i.name.toLowerCase());
    expect(withEgg.some(n => n.includes('egg'))).toBe(true);
  });
});

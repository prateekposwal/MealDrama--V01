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

describe('trait path — classic-pancakes default is EGG-FREE (the "Pancakes with Egg on veg" regression)', () => {
  const tray = {
    breakfast: [{ id: 'm9', dishId: 'classic-pancakes', name: 'Pancakes' }],
    lunch: [], dinner: [], snacks: [],
  };

  it('the eggless recipe is the default variant, and a veg user resolves it', () => {
    expect(dish('classic-pancakes').variants[0]!.id).toBe('cp-eggless');
    const res = getMealResolution(tray, {}, '2040-06-06', 'breakfast', DISH_LIBRARY, undefined, 'veg');
    expect(res.meal?.variant).toBe('Pancakes Eggless');
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

// ─── Whole-library class guard — the "Pancakes with Egg on a veg profile"
// ─── recurring leak. Every egg/meat-bearing variant on a veg/vegan-typed dish
// ─── MUST carry the diet tag that excludes it from veg/vegan users, and NO
// ─── veg/vegan dish may place an animal-bearing variant first (variants[0] is
// ─── the default when a caller passes no variant).
describe('whole-library variant-diet cohesion — no egg/meat leaks onto veg profiles', () => {
  const EGG = ['Egg', 'Eggs', 'Egg White', 'Egg Yolk'];
  const MEAT = ['Chicken', 'Mutton', 'Pork', 'Fish', 'Prawns', 'Prawn', 'Crab', 'Minced Meat', 'Goose', 'Beef', 'Squid', 'Basa'];
  const hasEggToken = (hay: string) => /\b(?:egg|anda|dim)\b/i.test(hay);
  const hasMeatToken = (hay: string) => /\b(?:chicken|mutton|pork|fish|prawn|goose|beef|crab)\b/i.test(hay);

  it('every egg variant on veg/vegan dishes is tagged eggitarian (never masquerades as veg)', () => {
    const bad: string[] = [];
    for (const d of DISH_LIBRARY) {
      const t = (d.type || '').toLowerCase();
      if (t !== 'veg' && t !== 'vegan') continue;
      for (const v of d.variants ?? []) {
        const hasEgg = (v.ingredients ?? []).some(i => EGG.includes(i.name))
          || hasEggToken(`${v.id} ${v.name ?? ''}`);
        if (hasEgg && v.diet !== 'eggitarian') bad.push(`${d.id}::${v.id} egg needs diet:'eggitarian' (has diet ${v.diet ?? 'none'})`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('every meat variant on veg/vegan dishes is tagged non-veg', () => {
    const bad: string[] = [];
    for (const d of DISH_LIBRARY) {
      const t = (d.type || '').toLowerCase();
      if (t !== 'veg' && t !== 'vegan') continue;
      for (const v of d.variants ?? []) {
        const hasMeat = (v.ingredients ?? []).some(i => MEAT.includes(i.name))
          || hasMeatToken(`${v.id} ${v.name ?? ''}`);
        if (hasMeat && v.diet !== 'non-veg') bad.push(`${d.id}::${v.id} meat needs diet:'non-veg' (has diet ${v.diet ?? 'none'})`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('no veg/vegan dish default (variants[0]) is an egg or meat recipe', () => {
    const bad: string[] = [];
    for (const d of DISH_LIBRARY) {
      const t = (d.type || '').toLowerCase();
      if (t !== 'veg' && t !== 'vegan') continue;
      const v0 = d.variants?.[0];
      if (!v0) continue;
      const animal = (v0.ingredients ?? []).some(i => EGG.includes(i.name) || MEAT.includes(i.name))
        || hasEggToken(`${v0.id} ${v0.name ?? ''}`)
        || hasMeatToken(`${v0.id} ${v0.name ?? ''}`);
      if (animal && v0.diet !== 'eggitarian' && v0.diet !== 'non-veg') {
        bad.push(`${d.id}::${v0.id} is the animal-bearing default variant`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

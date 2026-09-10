import { describe, it, expect, beforeEach } from 'vitest';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { deriveIngredientsForDay } from '../utils/ingredientUtils';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import { getMealResolution } from '../app/store/useStore';
import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { healPLANDietGaps } from '../utils/dietHeal';
import { getISODate } from '../utils/dateUTC';

const dish = (id: string): Dish => DISH_LIBRARY.find(d => d.id === id)!;
const nameOf = (i: any) => (i?.ing?.name ?? i?.name ?? '').toLowerCase();
const hasEgg = (ings: any[]) => ings.some(i => [
  'egg', 'eggs', 'egg salad',
].some(k => nameOf(i).includes(k)));
const hasChicken = (ings: any[]) => ings.some(i => nameOf(i).includes('chicken') || nameOf(i).includes('prawn'));

function resetState() {
  useStore.setState({ user: null as any, trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] } as any });
  useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: {} } } as any);
}

describe('#3 e2e — getIngredientsForMealOption diet gate', () => {
  it('appam::appam-egg: veg diet → no egg; eggitarian → egg present; no diet → egg present', () => {
    const veg = hasEgg(getIngredientsForMealOption('appam', 'appam-egg', DISH_LIBRARY, undefined, 'veg'));
    expect(veg).toBe(false);

    const withEgg = hasEgg(getIngredientsForMealOption('appam', 'appam-egg', DISH_LIBRARY, undefined, 'eggitarian'));
    expect(withEgg).toBe(true);

    const noDiet = hasEgg(getIngredientsForMealOption('appam', 'appam-egg', DISH_LIBRARY));
    expect(noDiet).toBe(true);
  });

  it('panch-phoran-tarka::ppt-chicken: veg diet → no chicken; non-veg → chicken present', () => {
    const veg = hasChicken(getIngredientsForMealOption('panch-phoran-tarka', 'ppt-chicken', DISH_LIBRARY, undefined, 'veg'));
    expect(veg).toBe(false);

    const nonVeg = hasChicken(getIngredientsForMealOption('panch-phoran-tarka', 'ppt-chicken', DISH_LIBRARY, undefined, 'non-veg'));
    expect(nonVeg).toBe(true);
  });

  it('parotta-kurma::pk-egg: vegan diet → no egg', () => {
    const vegan = hasEgg(getIngredientsForMealOption('parotta-kurma', 'pk-egg', DISH_LIBRARY, undefined, 'vegan'));
    expect(vegan).toBe(false);
  });
});

describe('#3 e2e — deriveIngredientsForDay diet threading', () => {
  const tray = {
    breakfast: [{ id: 'm1', dishId: 'appam', name: 'Appam', variantId: 'appam-egg' }],
    lunch: [], dinner: [], snacks: [],
  };

  it('day containing appam-egg: veg diet excludes egg; eggitarian includes it', () => {
    const vegDay = deriveIngredientsForDay('2030-06-06', 'Breakfast', tray, {}, DISH_LIBRARY, 'veg');
    expect(hasEgg(vegDay)).toBe(false);

    const withEggDay = deriveIngredientsForDay('2030-06-06', 'Breakfast', tray, {}, DISH_LIBRARY, 'eggitarian');
    expect(hasEgg(withEggDay)).toBe(true);
  });

  it('no diet passed → legacy behavior unchanged (egg present)', () => {
    const day = deriveIngredientsForDay('2030-06-06', 'Breakfast', tray, {}, DISH_LIBRARY);
    expect(hasEgg(day)).toBe(true);
  });

  it('cache keys do not collide across diets', () => {
    const a = getIngredientsForMealOption('appam', 'appam-egg', DISH_LIBRARY, undefined, 'veg').map(i => i.name).join(',');
    const b = getIngredientsForMealOption('appam', 'appam-egg', DISH_LIBRARY, undefined, 'eggitarian').map(i => i.name).join(',');
    expect(a).not.toBe(b);
  });
});

describe('#3 e2e — healPLANDietGaps variant-aware keep', () => {
  beforeEach(() => resetState());

  it('plan card appam::appam-egg is dropped for a veg user, kept for eggitarian', async () => {
    const today = getISODate(new Date());
    const card = (variantId: string) => ({
      dishId: 'appam', name: 'Appam', variantId, mealContext: 'Breakfast',
    });

    useStore.setState({ user: { diet: 'veg', region: 'South India' } as any });
    useTrayStore.setState({
      plan: { ...useTrayStore.getState().plan, days: { [today]: { breakfast: [card('appam-egg')] } } },
    } as any);
    await healPLANDietGaps(true);
    let kept = (useTrayStore.getState().plan.days as any)?.[today]?.breakfast ?? [];
    expect(kept.some((m: any) => m.variantId === 'appam-egg')).toBe(false);

    useStore.setState({ user: { diet: 'eggitarian', region: 'South India' } as any });
    useTrayStore.setState({
      plan: { ...useTrayStore.getState().plan, days: { [today]: { breakfast: [card('appam-egg')] } } },
    } as any);
    await healPLANDietGaps(true);
    kept = (useTrayStore.getState().plan.days as any)?.[today]?.breakfast ?? [];
    expect(kept.some((m: any) => m.variantId === 'appam-egg')).toBe(true);
  });

  it('plain variant survives healing for a veg user', async () => {
    const today = getISODate(new Date());
    useStore.setState({ user: { diet: 'veg', region: 'South India' } as any });
    useTrayStore.setState({
      plan: { ...useTrayStore.getState().plan, days: { [today]: { breakfast: [{ dishId: 'appam', name: 'Appam', variantId: 'appam-plain' }] } } },
    } as any);
    await healPLANDietGaps(true);
    const kept = (useTrayStore.getState().plan.days as any)?.[today]?.breakfast ?? [];
    expect(kept.some((m: any) => m.variantId === 'appam-plain')).toBe(true);
  });
});

describe('#3 e2e — getMealResolution diet sanity (no variantId regression)', () => {
  const tray = {
    breakfast: [{ id: 'm1', dishId: 'appam', name: 'Appam', variantId: 'appam-egg' }],
    lunch: [], dinner: [], snacks: [],
  };

  it('veg user resolves appam breakfast to the plain variant name', () => {
    const res = getMealResolution(tray, {}, '2030-06-06', 'breakfast', DISH_LIBRARY, undefined, 'veg');
    expect(res.meal?.variant).toBe('Appam');
  });
});
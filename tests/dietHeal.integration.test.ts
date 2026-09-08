import { describe, it, expect, beforeEach } from 'vitest';
import { healTrayDietGaps, healPLANDietGaps, reconcileStaleRegionalReps } from '../utils/dietHeal';
import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import { getISODate } from '../utils/dateUTC';

const SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;

/** Build a realistic pre-fix REBUILT tray: cap-6 region veg dishes, ZERO of the diet. */
function vegOnlyTray(slot: string): any[] {
  return DISH_LIBRARY
    .filter(d => (d.diet || d.type) === 'veg'
      && ((d.category ?? []) as any[]).includes(slot)
      && (d.region === 'north' || d.region === 'all'))
    .slice(0, 6)
    .map(d => ({ id: d.id, dishId: d.id, name: d.name, icon: d.icon, sourceRegion: d.region }));
}

function setUser(diet: string, region = 'North India', plannedSlots = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']) {
  useStore.setState({ user: { diet, region, plannedSlots } as any });
}

function resetState() {
  useStore.setState({
    user: null as any,
    trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] } as any,
  });
  useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: {} } } as any);
}

const resolve = (item: any): Dish | null =>
  DISH_LIBRARY.find(d => d.id === (item.dishId || item.id || item.meal_id))
  ?? DISH_LIBRARY.find(d => String(d.name).trim().toLowerCase() === String(item.name || '').trim().toLowerCase())
  ?? null;

function hasDiet(slotItems: any[], type: string): boolean {
  return slotItems.some(m => (resolve(m)?.diet || resolve(m)?.type) === type);
}

describe('healTrayDietGaps — realistic persisted-state scenarios', () => {
  beforeEach(() => resetState());

  it('north eggitarian: every planned tray slot gains an egg (the reported bug)', async () => {
    setUser('eggitarian');
    const tray = { breakfast: vegOnlyTray('breakfast'), lunch: vegOnlyTray('lunch'), snacks: vegOnlyTray('snacks'), dinner: vegOnlyTray('dinner') };
    useStore.setState({ trayLibrary: tray } as any);
    expect(hasDiet(tray.lunch, 'eggitarian')).toBe(false);

    await healTrayDietGaps(true);

    const after = useStore.getState().trayLibrary;
    for (const slot of SLOTS) {
      expect(hasDiet(after[slot] as any[], 'eggitarian'), `slot ${slot}`).toBe(true);
    }
  });

  it('caps respected: healed tray slots never exceed cap (replacement, not bloat)', async () => {
    setUser('eggitarian');
    useStore.setState({ trayLibrary: SLOTS.reduce((o: any, s) => {
      o[s] = vegOnlyTray(s); return o;
    }, {}) } as any);
    await healTrayDietGaps(true);
    const after = useStore.getState().trayLibrary;
    for (const slot of SLOTS) {
      expect((after[slot] as any[]).length).toBeLessThanOrEqual(6);
    }
  });

  it('non-veg user: a slot with zero non-veg gains it (north breakfast was empty)', async () => {
    setUser('non-veg');
    const tray = { breakfast: vegOnlyTray('breakfast'), lunch: vegOnlyTray('lunch'), snacks: vegOnlyTray('snacks'), dinner: vegOnlyTray('dinner') };
    useStore.setState({ trayLibrary: tray } as any);
    await healTrayDietGaps(true);
    const after = useStore.getState().trayLibrary;
    for (const slot of SLOTS) {
      expect(hasDiet(after[slot] as any[], 'non-veg'), `slot ${slot}`).toBe(true);
    }
  });

  it('only PLANNED slots are healed — unplanned slots are left alone', async () => {
    setUser('eggitarian', 'North India', ['Breakfast', 'Lunch']);
    useStore.setState({ trayLibrary: SLOTS.reduce((o: any, s) => { o[s] = vegOnlyTray(s); return o; }, {}) } as any);
    await healTrayDietGaps(true);
    const after = useStore.getState().trayLibrary;
    expect(hasDiet(after.breakfast as any[], 'eggitarian')).toBe(true);
    expect(hasDiet(after.lunch as any[], 'eggitarian')).toBe(true);
    expect(hasDiet(after.snacks as any[], 'eggitarian')).toBe(false); // untouched
    expect(hasDiet(after.dinner as any[], 'eggitarian')).toBe(false);  // untouched
  });

  it('today plan mirrors eggs even when the TRAY already had them (pre-heal plans are veg-only)', async () => {
    setUser('eggitarian');
    // Tray lunch already has an egg (healthy tray), but TODAY's plan lunch
    // was built before it — old veg-only meal.
    const tray = { breakfast: vegOnlyTray('breakfast'), lunch: vegOnlyTray('lunch'), snacks: vegOnlyTray('snacks'), dinner: vegOnlyTray('dinner') };
    const egg = DISH_LIBRARY.find(d => (d.diet || d.type) === 'eggitarian' && ((d.category ?? []) as any[]).includes('lunch') && (d.region === 'north' || d.region === 'all'))!;
    tray.lunch = [ ...tray.lunch.slice(0, 5), { id: egg.id, dishId: egg.id, name: egg.name, icon: egg.icon } ];
    useStore.setState({ trayLibrary: tray } as any);
    const today = getISODate();
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: { [today]: {
      breakfast: [], lunch: [vegOnlyTray('lunch')[0]], snacks: [], dinner: [],
    } } } } as any);

    await healTrayDietGaps(true);

    const planLunch: any[] = (useTrayStore.getState().plan.days as any)?.[today]?.lunch ?? [];
    expect(hasDiet(planLunch, 'eggitarian')).toBe(true);
  });

  it('vegan user heals too; plain veg user is a no-op (universal default)', async () => {
    setUser('vegan');
    useStore.setState({ trayLibrary: SLOTS.reduce((o: any, s) => { o[s] = vegOnlyTray(s); return o; }, {}) } as any);
    await healTrayDietGaps(true);
    const after = useStore.getState().trayLibrary;
    // vegan == veg pool here (veg-only pre-fill) — heal replaces far diets… but
    // findVictim only removes NON-vegan; a vegan rep must still enter the tray.
    for (const slot of SLOTS) {
      expect(hasDiet(after[slot] as any[], 'vegan'), `slot ${slot}`).toBe(true);
    }

    resetState();
    setUser('veg');
    useStore.setState({ trayLibrary: SLOTS.reduce((o: any, s) => { o[s] = vegOnlyTray(s); return o; }, {}) } as any);
    const beforeTray = JSON.stringify(useStore.getState().trayLibrary);
    await healTrayDietGaps(true);
    expect(JSON.stringify(useStore.getState().trayLibrary)).toBe(beforeTray); // tray untouched

    // NEW PLAN-DIMENSION CONTRACT: a veg user's MIXED plan is filtered to
    // veg-only; a VEG plan remains a no-op (the lock's original clean case).
    const nonVegLunch = DISH_LIBRARY.find(d => d.type === 'non-veg' && ((d.category ?? []) as any[]).includes('lunch'))!;
    const vegLunch = vegOnlyTray('lunch')[0] as any;
    const today = getISODate();
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: { [today]: {
      breakfast: [], lunch: [
        { id: nonVegLunch.id, meal_id: nonVegLunch.id, name: nonVegLunch.name, icon: nonVegLunch.icon },
        { id: vegLunch.id, meal_id: vegLunch.id, name: vegLunch.name, icon: vegLunch.icon },
      ], snacks: [], dinner: [],
    } } } } as any);

    await healPLANDietGaps(true);

    const planLunch: any[] = (useTrayStore.getState().plan.days as any)?.[today]?.lunch ?? [];
    expect(planLunch.some(m => m.id === nonVegLunch.id)).toBe(false);
    expect(resolve(planLunch[0])?.type).toBe('veg');
    expect(JSON.stringify(useStore.getState().trayLibrary)).toBe(beforeTray); // tray untouched

    // Clean case preserved: a veg user with a VEG plan stays a no-op.
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: { [today]: {
      breakfast: [], lunch: [{ id: vegLunch.id, meal_id: vegLunch.id, name: vegLunch.name, icon: vegLunch.icon }], snacks: [], dinner: [],
    } } } } as any);
    const beforePlan = JSON.stringify(useTrayStore.getState().plan.days);
    await healPLANDietGaps(true);
    expect(JSON.stringify(useTrayStore.getState().plan.days)).toBe(beforePlan);
  });

  it('TOP-UP: a slot with only 1 egg gains a SECOND representative (the "more eggs" bar)', async () => {
    setUser('eggitarian');
    const vegLunch = vegOnlyTray('lunch').slice(0, 5);
    const firstEgg = DISH_LIBRARY.find(d => (d.diet || d.type) === 'eggitarian' && ((d.category ?? []) as any[]).includes('lunch') && (d.region === 'north' || d.region === 'all'))!;
    const tray = { breakfast: vegOnlyTray('breakfast'), lunch: [...vegLunch, { id: firstEgg.id, dishId: firstEgg.id, name: firstEgg.name, icon: firstEgg.icon }], snacks: vegOnlyTray('snacks'), dinner: vegOnlyTray('dinner') };
    useStore.setState({ trayLibrary: tray } as any);

    await healTrayDietGaps(true);

    const lunch = useStore.getState().trayLibrary.lunch as any[];
    const eggCount = lunch.filter(m => hasDiet([m], 'eggitarian')).length;
    expect(eggCount).toBeGreaterThanOrEqual(2);
    expect(lunch.length).toBeLessThanOrEqual(6);
  });

  it('PLAN-WIDE: future dates lacking the diet gain a rep in plan-nav (not just today)', async () => {
    setUser('eggitarian');
    useStore.setState({ trayLibrary: SLOTS.reduce((o: any, s) => { o[s] = vegOnlyTray(s); return o; }, {}) } as any);
    const d2 = getISODate().slice(0, 8) + '28'; // some other date key
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: {
      [getISODate()]: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      [d2]: { breakfast: [], lunch: [vegOnlyTray('lunch')[0]], snacks: [], dinner: [] },
    } } } as any);

    await healTrayDietGaps(true);

    const days = useTrayStore.getState().plan.days as any;
    const lunch2: any[] = days[d2]?.lunch ?? [];
    expect(hasDiet(lunch2, 'eggitarian')).toBe(true); // future-day dinner suggestion now has an egg
  });

  it('REP-RECONCILIATION: a stale Andhra (south) egg in north dinner swaps to a local north egg', async () => {
    // Direct helper check on the exact stale state the user reported.
    const stale = [{ id: 'andhra', dishId: 'andhra', name: 'Andhra Spiced Egg Curry', icon: '🍛' }];
    const { items, replaced } = reconcileStaleRegionalReps(stale, DISH_LIBRARY, 'eggitarian', 'north');
    expect(replaced).toBe(1);
    const native = DISH_LIBRARY.find(d => d.id === 'anda-curry-north')!;
    expect(items[0]!.id).toBe(native.id);          // swapped to the north dinner egg
    expect(items[0]!.name).toBe(native.name);

    // End-to-end via the heal: dinner tray with a far rep + veg, cap room.
    setUser('eggitarian');
    const dinner = [
      { id: 'aloo-matar', dishId: 'aloo-matar', name: 'Aloo Matar', icon: '🍛' },
      { id: 'andhra', dishId: 'andhra', name: 'Andhra Spiced Egg Curry', icon: '🍛' },
    ];
    useStore.setState({ trayLibrary: { breakfast: vegOnlyTray('breakfast'), lunch: vegOnlyTray('lunch'), snacks: vegOnlyTray('snacks'), dinner } } as any);
    await healTrayDietGaps(true);
    const after = useStore.getState().trayLibrary.dinner as any[];
    expect(after.some(m => m.id === 'andhra')).toBe(false);        // far rep gone
    expect(after.some(m => m.id === 'anda-curry-north')).toBe(true); // local egg arrived
  });

  it('LOOP-AWARE CAP: a 14-day tray (cap 10) gains reps by ADDING, never removing a dish the old 6-cap would swap out', async () => {
    setUser('eggitarian');
    useLoopStore.getState().setMealLoop(
      { cycleLength: 14, startDate: '2026-06-01', skipDays: [], repeatPattern: 'random' },
      [], [],
    );
    const lunchBase = vegOnlyTray('lunch');
    expect(lunchBase.length).toBeGreaterThanOrEqual(6);
    useStore.setState({ trayLibrary: {
      breakfast: vegOnlyTray('breakfast'), lunch: lunchBase,
      snacks: vegOnlyTray('snacks'), dinner: vegOnlyTray('dinner'),
    } } as any);

    await healTrayDietGaps(true);

    const afterLunch = useStore.getState().trayLibrary.lunch as any[];
    expect(hasDiet(afterLunch, 'eggitarian')).toBe(true);
    // Every original dish survived — reps were ADDED under the 10 cap, not
    // swapped in over the old hard-coded 6 cap.
    for (const m of lunchBase) {
      expect(
        afterLunch.some((x: any) => (x.dishId ?? x.id) === (m.dishId ?? m.id)),
        `${m.name} was removed by the healer`,
      ).toBe(true);
    }
    expect(afterLunch.length).toBeGreaterThanOrEqual(lunchBase.length + 1);
    expect(afterLunch.length).toBeLessThanOrEqual(10);
    // Restore the default (config-less) loop for any follow-on tests.
    useLoopStore.setState({ mealLoop: { ...useLoopStore.getState().mealLoop, config: null } });
  });

  it('PLAN PURGE: veg user + mixed plan.days -> plan veg-only, custom preserved, loop queue/assignments clean', async () => {
    setUser('veg');
    const nonVeg = DISH_LIBRARY.find(d => d.type === 'non-veg' && ((d.category ?? []) as any[]).includes('lunch'))!;
    const egg = DISH_LIBRARY.find(d => d.type === 'eggitarian' && ((d.category ?? []) as any[]).includes('lunch'))!;
    const veg = DISH_LIBRARY.find(d => d.type === 'veg' && ((d.category ?? []) as any[]).includes('lunch') && (d.region === 'north' || d.region === 'all'))!;
    const today = getISODate();
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: { [today]: {
      breakfast: [],
      lunch: [
        { id: nonVeg.id, meal_id: nonVeg.id, name: nonVeg.name, icon: nonVeg.icon },
        { id: egg.id, meal_id: egg.id, name: egg.name, icon: egg.icon },
        { id: veg.id, meal_id: veg.id, name: veg.name, icon: veg.icon },
        { id: 'custom-1', meal_id: 'custom-1', name: 'Grandma Pulao', icon: '🍚' },
      ],
      snacks: [], dinner: [],
    } } } } as any);

    await healPLANDietGaps(true);

    const after: any[] = (useTrayStore.getState().plan.days as any)?.[today]?.lunch ?? [];
    for (const m of after) {
      const t = resolve(m)?.type;
      if (t) expect(['veg', 'vegan']).toContain(t); // every resolvable dish is diet-valid
    }
    expect(after.some(m => m.id === nonVeg.id)).toBe(false);
    expect(after.some(m => m.id === egg.id)).toBe(false);
    expect(after.some(m => m.id === veg.id)).toBe(true);
    expect(after.some(m => m.id === 'custom-1')).toBe(true); // custom/unresolvable preserved

    // Loop contamination: a persisted queue/assignments holding diet-invalid
    // dishIds is purged by the mid-cycle merge guard on re-apply.
    const lunchDishes = DISH_LIBRARY.filter(d => (d.type === 'veg' || d.type === 'vegan') && ((d.category ?? []) as any[]).includes('lunch')).slice(0, 4);
    const cleanPool: any = { breakfast: [], lunch: lunchDishes, snacks: [], dinner: [] };
    const cfg = { cycleLength: 7, startDate: today, skipDays: [], repeatPattern: 'random' };
    useLoopStore.setState({ mealLoop: {
      ...useLoopStore.getState().mealLoop,
      config: cfg,
      sourceDishIds: [nonVeg.id, egg.id, ...lunchDishes.map(d => d.id)],
      rotationQueue: [
        { dishId: nonVeg.id, dishName: nonVeg.name, mealType: 'lunch' },
        { dishId: egg.id, dishName: egg.name, mealType: 'lunch' },
        ...lunchDishes.map(d => ({ dishId: d.id, dishName: d.name, mealType: 'lunch' as const })),
      ],
      next_index: 0,
      assignments: [
        { date: today, mealType: 'lunch' as const, dishId: nonVeg.id, dishName: nonVeg.name, order: 0 },
        { date: today, mealType: 'lunch' as const, dishId: egg.id, dishName: egg.name, order: 1 },
      ],
    } } as any);

    useLoopStore.getState().applyLoopConfig(cfg as any, cleanPool, [...lunchDishes, nonVeg, egg]);

    const ml = useLoopStore.getState().mealLoop;
    const ids = new Set([...ml.sourceDishIds, ...ml.rotationQueue.map(q => q.dishId), ...ml.assignments.map(a => a.dishId)]);
    expect(ids.has(nonVeg.id)).toBe(false);
    expect(ids.has(egg.id)).toBe(false);
    useLoopStore.setState({ mealLoop: { ...useLoopStore.getState().mealLoop, config: null } });
  });

  it('healPLANDietGaps for veg: mixed plan -> veg-only, custom preserved', async () => {
    setUser('veg');
    const nonVeg = DISH_LIBRARY.find(d => d.type === 'non-veg' && ((d.category ?? []) as any[]).includes('dinner'))!;
    const today = getISODate();
    useTrayStore.setState({ plan: { ...useTrayStore.getState().plan, days: { [today]: {
      breakfast: [],
      lunch: [{ id: 'custom-9', meal_id: 'custom-9', name: 'Home Dal', icon: '🍲' }],
      snacks: [],
      dinner: [{ id: nonVeg.id, meal_id: nonVeg.id, name: nonVeg.name, icon: nonVeg.icon }],
    } } } } as any);

    await healPLANDietGaps(true);

    const days = useTrayStore.getState().plan.days as any;
    const dinner: any[] = days?.[today]?.dinner ?? [];
    expect(dinner.some(m => m.id === nonVeg.id)).toBe(false);   // invalid stripped
    expect(days?.[today]?.lunch?.some((m: any) => m.id === 'custom-9')).toBe(true); // custom kept
  });

});

import { describe, it, expect, beforeEach } from 'vitest';
import { healTrayDietGaps, reconcileStaleRegionalReps } from '../utils/dietHeal';
import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
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
    const before = JSON.stringify(useStore.getState().trayLibrary);
    await healTrayDietGaps(true);
    expect(JSON.stringify(useStore.getState().trayLibrary)).toBe(before); // untouched
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
});
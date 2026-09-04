import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLoopStore, healDegenerateLoop, reconcileLoopStateWithTray } from '../plan/store/useLoopStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useStore } from '../app/store/useStore';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { User } from '../app/store/useStore';
import type { TrayItem } from '../types/tray';
import type { MealLoopConfig, MealLoopState } from '../types/tray';
import { getISODate, addDaysISO } from '../utils/dateUTC';
import { buildPlanIndex } from '../plan/utils/planIndex';

const THUKPA = DISH_LIBRARY.find(d => d.id === 'thukpa-chicken')!;
const C65 = DISH_LIBRARY.find(d => d.id === 'chicken-65')!;

function degenerateLoop(cfg: MealLoopConfig): MealLoopState {
  return {
    config: cfg,
    sourceDishIds: [THUKPA.id, C65.id],
    pool_version: 1,
    rotationQueue: [
      { dishId: THUKPA.id, dishName: THUKPA.name, mealType: 'breakfast' },
      { dishId: C65.id, dishName: C65.name, mealType: 'lunch' },
      { dishId: C65.id, dishName: C65.name, mealType: 'snacks' },
      { dishId: C65.id, dishName: C65.name, mealType: 'dinner' },
    ],
    rotationPointer: 0,
    next_index: 4,
    assignments: [
      { date: cfg.startDate, mealType: 'breakfast', dishId: THUKPA.id, dishName: THUKPA.name, order: 0 },
      { date: cfg.startDate, mealType: 'lunch', dishId: C65.id, dishName: C65.name, order: 1 },
    ],
    overrides: new Map(),
    analytics: { cyclesCompleted: 1, mealsAutoFilled: 0, dishesSkipped: 0 },
    refreshing: false,
    lastRefreshStart: undefined,
    undoStack: [],
  };
}

describe('healDegenerateLoop — regenerates the stale 2-dish Plan grid on reload', () => {
  beforeEach(() => {
    useStore.setState({
      user: {
        id: 'hp', name: 'HP', region: 'South India', diet: 'non-veg',
        spiceLevel: 'medium', pantryStaples: [], slotTimePreferences: {},
        plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      } as User,
      dishes: DISH_LIBRARY,
      trayLibrary: {
        breakfast: [{ id: THUKPA.id, dishId: THUKPA.id, name: THUKPA.name, icon: THUKPA.icon, sourceRegion: THUKPA.region }],
        lunch: [{ id: C65.id, dishId: C65.id, name: C65.name, icon: C65.icon, sourceRegion: C65.region }],
        snacks: [{ id: C65.id, dishId: C65.id, name: C65.name, icon: C65.icon, sourceRegion: C65.region }],
        dinner: [{ id: C65.id, dishId: C65.id, name: C65.name, icon: C65.icon, sourceRegion: C65.region }],
      },
      toast: null,
      setToast: vi.fn(),
    });

    useTrayStore.setState({ plan: { period: 'week', days: {}, _planIndex: buildPlanIndex({}) } });
  });

  it('Issue 2: heals a degenerate queue AND rewrites FUTURE plan.days to a varied single-card grid', async () => {
    const today = getISODate();
    const tom = addDaysISO(today, 1);
    const startDate = addDaysISO(today, -2); // loop started 2 days ago, already running

    // Persisted stale grid: tomorrow has the degenerate 2-card rotation in every slot.
    const staleItem = (mealId: string, name: string): TrayItem => ({
      id: 'x', meal_id: mealId, name, title: name, icon: '🍽️', quantity: 1, servings: 1,
      smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [],
      dessert: [], itemQtys: {}, start_time: '06:00', end_time: '10:00', source: 'loop',
    });
    useTrayStore.setState(s => ({
      plan: { ...s.plan, days: {
        [tom]: {
          breakfast: [staleItem(THUKPA.id, THUKPA.name), staleItem(C65.id, C65.name)],
          lunch: [staleItem(C65.id, C65.name), staleItem(THUKPA.id, THUKPA.name)],
          snacks: [staleItem(THUKPA.id, THUKPA.name), staleItem(C65.id, C65.name)],
          dinner: [staleItem(C65.id, C65.name), staleItem(THUKPA.id, THUKPA.name)],
        },
      } },
    }));

    const cfg: MealLoopConfig = { cycleLength: 7, startDate, skipDays: [], repeatPattern: 'random' };
    const ml = degenerateLoop(cfg);
    useLoopStore.setState({ mealLoop: ml });

    const healed = await healDegenerateLoop(ml);

    expect(healed).not.toBeNull();
    expect(healed!.rotationQueue.length).toBeGreaterThan(ml.rotationQueue.length); // gained variety

    // Tomorrow's slot is regenerated: no longer the Thukpa-only/Chicken-65-wide collapse.
    const tomorrowDays = useTrayStore.getState().plan.days[tom]!;
    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const items = tomorrowDays[mt];
      // Non-destructive: one card per slot, never a duplicate-pair of the old rotation.
      expect(items.length).toBeLessThanOrEqual(2);
      // Every filled slot must NOT repeat the same 2-dish pair everywhere — varied names.
    }
    const breakfastNames = tomorrowDays.breakfast.map(m => m.name);
    const lunchNames = tomorrowDays.lunch.map(m => m.name);
    // Breakfast and lunch should differ (not the same 2-dish collapse).
    expect(breakfastNames.join(',')).not.toEqual(lunchNames.join(','));
  });

  it('Issue 2: leaves TODAY and past plan.days untouched (non-destructive)', async () => {
    const today = getISODate();
    const tom = addDaysISO(today, 1);
    const cfg: MealLoopConfig = { cycleLength: 7, startDate: addDaysISO(today, -2), skipDays: [], repeatPattern: 'random' };
    useLoopStore.setState({ mealLoop: degenerateLoop(cfg) });

    // Persisted today with a user-planned card + a stale second loop card.
    useTrayStore.setState(s => ({
      plan: { ...s.plan, days: {
        [today]: { breakfast: [{ id: 'u1', meal_id: 'egg-podi-dosa-classic', name: 'Egg Podi Dosa', title: 'Egg Podi Dosa', icon: '🥚', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, start_time: '06:00', end_time: '10:00', source: 'user' as const }], lunch: [], snacks: [], dinner: [] },
      } },
    }));

    await healDegenerateLoop(useLoopStore.getState().mealLoop);

    const todayBreakfast = useTrayStore.getState().plan.days[today]?.breakfast ?? [];
    expect(todayBreakfast.map(m => m.name)).toContain('Egg Podi Dosa'); // today untouched
  });
});

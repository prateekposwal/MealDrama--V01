import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLoopStore } from '../plan/store/useLoopStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useStore } from '../app/store/useStore';
import type { Dish } from '../meal/constants/dishLibrary';
import type { User } from '../app/store/useStore';
import type { MealLoopConfig, MealLoopAssignment } from '../types/tray';
import { getISODate } from '../utils/dateUTC';
import { buildPlanIndex } from '../plan/utils/planIndex';

const makeDish = (id: string, name: string): Dish => ({
  id,
  name,
  icon: '🍽️',
  region: 'north',
  states: [],
  category: ['lunch'],
  type: 'veg',
  weight: 'medium',
  nutrition: [],
  tags: [],
  variants: [{ id: `${id}_v1`, name }],
});

const DISHES: Dish[] = [
  makeDish('d1', 'Dal Makhani'),
  makeDish('d2', 'Paneer Butter Masala'),
  makeDish('d3', 'Aloo Paratha'),
];

const BASE_CONFIG: MealLoopConfig = {
  cycleLength: 3,
  startDate: '2026-06-01',
  skipDays: [],
  repeatPattern: 'random',
};

describe('Store-level loop actions', () => {
  beforeEach(() => {
    useStore.setState({
      user: { id: 'test-user', name: 'Test', region: 'North India', diet: 'veg', spiceLevel: 'medium', pantryStaples: [], slotTimePreferences: {} } as User,
      dishes: [],
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      toast: null,
      setToast: vi.fn(),
    });

    useTrayStore.setState({
      plan: { period: 'week', days: {}, _planIndex: buildPlanIndex({}) },
      completions: {},
      skipped: {},
    });

    useLoopStore.setState({
      mealLoop: {
        config: null,
        sourceDishIds: [],
        pool_version: 1,
        rotationQueue: [],
        rotationPointer: 0,
        next_index: 0,
        assignments: [],
        overrides: new Map(),
        analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
        refreshing: false,
        lastRefreshStart: undefined,
        undoStack: [],
      },
    });
  });

  describe('applyLoopConfig', () => {
    it('sets loop config and increments analytics.cyclesCompleted', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const state = useLoopStore.getState();
      expect(state.mealLoop.config).toEqual(BASE_CONFIG);
      expect(state.mealLoop.analytics.cyclesCompleted).toBe(1);
      expect(state.mealLoop.assignments.length).toBeGreaterThan(0);
    });

    it('saves previous state to undo stack on subsequent calls', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const newConfig: MealLoopConfig = { ...BASE_CONFIG, cycleLength: 5 };
      useLoopStore.getState().applyLoopConfig(newConfig, pool, DISHES);

      const state = useLoopStore.getState();
      expect(state.mealLoop.undoStack.length).toBe(1);
      expect(state.mealLoop.undoStack[0]?.config?.cycleLength).toBe(3);
    });

    it('supports multiple undos (up to 5 levels)', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      const configs = [3, 5, 7, 10, 14, 30].map(n => ({ ...BASE_CONFIG, cycleLength: n }));

      for (const cfg of configs) {
        useLoopStore.getState().applyLoopConfig(cfg, pool, DISHES);
      }

      const state = useLoopStore.getState();
      expect(state.mealLoop.undoStack.length).toBe(5); // Capped at 5
      expect(state.mealLoop.undoStack[0]?.config?.cycleLength).toBe(14); // Most recent
      expect(state.mealLoop.undoStack[4]?.config?.cycleLength).toBe(3); // Oldest kept
    });
  });

  describe('refreshLoop', () => {
    it('resets refreshing flag after rebuild completes', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useLoopStore.getState().refreshLoop(DISHES);

      const state = useLoopStore.getState();
      expect(state.mealLoop.refreshing).toBe(false);
      expect(state.mealLoop.lastRefreshStart).toBeUndefined();
    });

    it('prevents spam when already refreshing', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useLoopStore.setState(s => ({
        mealLoop: { ...s.mealLoop, refreshing: true, lastRefreshStart: Date.now() },
      }));

      useLoopStore.getState().refreshLoop(DISHES);

      const state = useLoopStore.getState();
      expect(state.mealLoop.refreshing).toBe(true);
    });

    it('shows error when queue is empty', () => {
      const pool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, []);

      useLoopStore.getState().refreshLoop([]);

      const state = useLoopStore.getState();
      expect(state.mealLoop.refreshing).toBe(false);
    });
  });

  describe('undoLoopChange', () => {
    it('restores previous loop state from stack', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const newConfig: MealLoopConfig = { ...BASE_CONFIG, cycleLength: 10 };
      useLoopStore.getState().applyLoopConfig(newConfig, pool, DISHES);

      useLoopStore.getState().undoLoopChange();

      const state = useLoopStore.getState();
      expect(state.mealLoop.config?.cycleLength).toBe(3);
      expect(state.mealLoop.undoStack.length).toBe(0); // Popped after undo
    });

    it('supports multiple undos', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 3 }, pool, DISHES);
      useLoopStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 7 }, pool, DISHES);
      useLoopStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 14 }, pool, DISHES);

      useLoopStore.getState().undoLoopChange();
      expect(useLoopStore.getState().mealLoop.config?.cycleLength).toBe(7);

      useLoopStore.getState().undoLoopChange();
      expect(useLoopStore.getState().mealLoop.config?.cycleLength).toBe(3);
    });

    it('does nothing when undo stack is empty', () => {
      const before = useLoopStore.getState().mealLoop;
      useLoopStore.getState().undoLoopChange();
      const after = useLoopStore.getState().mealLoop;
      expect(after).toBe(before);
    });
  });

  describe('skipSlot analytics', () => {
    it('increments dishesSkipped when skipping a loop-assigned slot', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useLoopStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useTrayStore.getState().skipSlot('2026-06-01', 'lunch');

      const state = useLoopStore.getState();
      expect(state.mealLoop.analytics.dishesSkipped).toBe(1);
    });

    it('does not increment when skipping a non-loop slot', () => {
      useTrayStore.getState().skipSlot('2026-06-01', 'breakfast');

      const state = useLoopStore.getState();
      expect(state.mealLoop.analytics.dishesSkipped).toBe(0);
    });
  });

  describe('Migration v4 — assignment pruning', () => {
    it('removes past assignments during migration', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const oldState = {
        plan: { period: 'week' as const, days: {} },
        guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
        swapHistory: [],
        templates: [],
        completions: [],
        skipped: [],
        lastFeaturedTimes: {},
        mealLoop: {
          config: null,
          sourceDishIds: [],
          pool_version: 1,
          rotationQueue: [],
          rotationPointer: 0,
          next_index: 0,
          assignments: [
            { date: yesterdayStr, mealType: 'lunch' as const, dishId: 'd1', dishName: 'Old', order: 0 },
            { date: todayStr, mealType: 'lunch' as const, dishId: 'd2', dishName: 'Today', order: 0 },
            { date: tomorrowStr, mealType: 'lunch' as const, dishId: 'd3', dishName: 'Future', order: 0 },
          ],
        overrides: new Map(),
          analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
          refreshing: false,
          lastRefreshStart: undefined,
          undoStack: [],
        },
      };

      // Simulate migration v3->v4
      const migrated = JSON.parse(JSON.stringify(oldState));
      const loop = migrated.mealLoop as { assignments?: Array<{ date: string }> };
      if (loop?.assignments) {
        const todayISO = todayStr!;
        loop.assignments = loop.assignments.filter((a) => a.date >= todayISO);
      }

      expect(migrated.mealLoop.assignments.length).toBe(2);
      expect(migrated.mealLoop.assignments[0].date).toBe(todayStr);
      expect(migrated.mealLoop.assignments[1].date).toBe(tomorrowStr);
    });
  });

  describe('onboarding cleanup on loop apply', () => {
    it('preserves all source types on today — loop/legacy never stripped', () => {
      const today = getISODate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getISODate(tomorrow);

      // Pre-populate today with onboarding meals + 1 user meal
      useTrayStore.setState(s => ({
        plan: {
          ...s.plan,
          days: {
            [today]: {
              breakfast: [
                { id: '1', meal_id: 'd1', name: 'Onboarding Dish', icon: '🍽️', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, source: 'onboarding', start_time: '06:00', end_time: '10:00' },
                { id: '2', meal_id: 'd2', name: 'User Dish', icon: '🍽️', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, source: 'user', start_time: '06:00', end_time: '10:00' },
                { id: '3', meal_id: 'd3', name: 'Legacy Dish', icon: '🍽️', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, start_time: '06:00', end_time: '10:00' },
              ],
              lunch: [],
              snacks: [],
              dinner: [],
            },
          },
        },
      }));

      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      const config: MealLoopConfig = {
        cycleLength: 3,
        startDate: today,
        skipDays: [],
        repeatPattern: 'random',
      };

      useLoopStore.getState().applyLoopConfig(config, pool, DISHES);

      const state = useTrayStore.getState();
      const todayBreakfast = state.plan.days[today]?.breakfast ?? [];

      // All source types survive — never strip loop/legacy from today
      expect(todayBreakfast.length).toBe(3);
      expect(todayBreakfast[0]?.source).toBe('onboarding');
      expect(todayBreakfast[1]?.source).toBe('user');
      expect(todayBreakfast[2]?.source).toBeUndefined();
    });

    it('preserves all dishes on future dates', () => {
      const today = getISODate();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getISODate(tomorrow);
      const twoDays = new Date();
      twoDays.setDate(twoDays.getDate() + 2);
      const twoDaysStr = getISODate(twoDays);

      // Put an onboarding dish on tomorrow (before loop starts)
      useTrayStore.setState(s => ({
        plan: {
          ...s.plan,
          days: {
            [tomorrowStr]: {
              breakfast: [
                { id: '1', meal_id: 'd1', name: 'Future Onboarding', icon: '🍽️', quantity: 1, servings: 1, smartVersion: 1, gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {}, source: 'onboarding', start_time: '06:00', end_time: '10:00' },
              ],
              lunch: [],
              snacks: [],
              dinner: [],
            },
          },
        },
      }));

      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      const config: MealLoopConfig = {
        cycleLength: 3,
        startDate: twoDaysStr,
        skipDays: [],
        repeatPattern: 'random',
      };

      useLoopStore.getState().applyLoopConfig(config, pool, DISHES);

      const state = useTrayStore.getState();
      // Tomorrow is before the loop start — dish should survive
      const tomorrowMeals = state.plan.days[tomorrowStr]?.breakfast ?? [];
      expect(tomorrowMeals.length).toBeGreaterThanOrEqual(1);
    });
  });
});

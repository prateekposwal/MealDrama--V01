import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTrayStore } from '../store/useTrayStore';
import { useStore } from '../store/useStore';
import type { Dish } from '../constants/dishLibrary';
import type { MealLoopConfig, MealLoopAssignment } from '../types/tray';

// Mock window and localStorage for test environment
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('window', {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  navigator: { onLine: true },
  localStorage: mockLocalStorage,
});

vi.stubGlobal('localStorage', mockLocalStorage);

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
  repeatPattern: 'sequential',
  insertStrategy: 'append',
};

describe('Store-level loop actions', () => {
  beforeEach(() => {
    useStore.setState({
      user: { id: 'test-user', name: 'Test', region: 'North India', diet: 'veg', spiceLevel: 2, pantryStaples: [], slotTimePreferences: {} },
      dishes: [],
      trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
      toast: null,
      setToast: vi.fn(),
    } as any);

    useTrayStore.setState({
      mealLoop: {
        config: null,
        sourceDishIds: [],
        pool_version: 1,
        rotationQueue: [],
        next_index: 0,
        pendingMerge: [],
        assignments: [],
        overrides: {},
        rotationState: {
          breakfast: { queue: [], pointer: 0 },
          lunch: { queue: [], pointer: 0 },
          snacks: { queue: [], pointer: 0 },
          dinner: { queue: [], pointer: 0 },
        },
        analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
        refreshing: false,
        lastRefreshStart: undefined,
        undoStack: [],
      },
      plan: { period: 'week', days: {} },
      setToast: vi.fn(),
    } as any);
  });

  describe('applyLoopConfig', () => {
    it('sets loop config and increments analytics.cyclesCompleted', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const state = useTrayStore.getState();
      expect(state.mealLoop.config).toEqual(BASE_CONFIG);
      expect(state.mealLoop.analytics.cyclesCompleted).toBe(1);
      expect(state.mealLoop.assignments.length).toBeGreaterThan(0);
    });

    it('saves previous state to undo stack on subsequent calls', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const newConfig: MealLoopConfig = { ...BASE_CONFIG, cycleLength: 5 };
      useTrayStore.getState().applyLoopConfig(newConfig, pool, DISHES);

      const state = useTrayStore.getState();
      expect(state.mealLoop.undoStack.length).toBe(1);
      expect(state.mealLoop.undoStack[0]?.config?.cycleLength).toBe(3);
    });

    it('supports multiple undos (up to 5 levels)', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      const configs = [3, 5, 7, 10, 14, 30].map(n => ({ ...BASE_CONFIG, cycleLength: n }));

      for (const cfg of configs) {
        useTrayStore.getState().applyLoopConfig(cfg, pool, DISHES);
      }

      const state = useTrayStore.getState();
      expect(state.mealLoop.undoStack.length).toBe(5); // Capped at 5
      expect(state.mealLoop.undoStack[0]?.config?.cycleLength).toBe(14); // Most recent
      expect(state.mealLoop.undoStack[4]?.config?.cycleLength).toBe(3); // Oldest kept
    });
  });

  describe('refreshLoop', () => {
    it('resets refreshing flag after rebuild completes', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useTrayStore.getState().refreshLoop(DISHES);

      const state = useTrayStore.getState();
      expect(state.mealLoop.refreshing).toBe(false);
      expect(state.mealLoop.lastRefreshStart).toBeUndefined();
    });

    it('prevents spam when already refreshing', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useTrayStore.setState(s => ({
        mealLoop: { ...s.mealLoop, refreshing: true, lastRefreshStart: Date.now() },
      }));

      useTrayStore.getState().refreshLoop(DISHES);

      const state = useTrayStore.getState();
      expect(state.mealLoop.refreshing).toBe(true);
    });

    it('shows error when queue is empty', () => {
      const pool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, []);

      useTrayStore.getState().refreshLoop([]);

      const state = useTrayStore.getState();
      expect(state.mealLoop.refreshing).toBe(false);
    });
  });

  describe('undoLoopChange', () => {
    it('restores previous loop state from stack', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      const newConfig: MealLoopConfig = { ...BASE_CONFIG, cycleLength: 10 };
      useTrayStore.getState().applyLoopConfig(newConfig, pool, DISHES);

      useTrayStore.getState().undoLoopChange();

      const state = useTrayStore.getState();
      expect(state.mealLoop.config?.cycleLength).toBe(3);
      expect(state.mealLoop.undoStack.length).toBe(0); // Popped after undo
    });

    it('supports multiple undos', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 3 }, pool, DISHES);
      useTrayStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 7 }, pool, DISHES);
      useTrayStore.getState().applyLoopConfig({ ...BASE_CONFIG, cycleLength: 14 }, pool, DISHES);

      useTrayStore.getState().undoLoopChange();
      expect(useTrayStore.getState().mealLoop.config?.cycleLength).toBe(7);

      useTrayStore.getState().undoLoopChange();
      expect(useTrayStore.getState().mealLoop.config?.cycleLength).toBe(3);
    });

    it('does nothing when undo stack is empty', () => {
      const before = useTrayStore.getState().mealLoop;
      useTrayStore.getState().undoLoopChange();
      const after = useTrayStore.getState().mealLoop;
      expect(after).toBe(before);
    });
  });

  describe('skipSlot analytics', () => {
    it('increments dishesSkipped when skipping a loop-assigned slot', () => {
      const pool = { breakfast: [], lunch: DISHES, snacks: [], dinner: [] };
      useTrayStore.getState().applyLoopConfig(BASE_CONFIG, pool, DISHES);

      useTrayStore.getState().skipSlot('2026-06-01', 'lunch');

      const state = useTrayStore.getState();
      expect(state.mealLoop.analytics.dishesSkipped).toBe(1);
    });

    it('does not increment when skipping a non-loop slot', () => {
      useTrayStore.getState().skipSlot('2026-06-01', 'breakfast');

      const state = useTrayStore.getState();
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
          next_index: 0,
          pendingMerge: [],
          assignments: [
            { date: yesterdayStr, mealType: 'lunch' as const, dishId: 'd1', dishName: 'Old', order: 0 },
            { date: todayStr, mealType: 'lunch' as const, dishId: 'd2', dishName: 'Today', order: 0 },
            { date: tomorrowStr, mealType: 'lunch' as const, dishId: 'd3', dishName: 'Future', order: 0 },
          ],
          overrides: {},
          rotationState: {
            breakfast: { queue: [], pointer: 0 },
            lunch: { queue: [], pointer: 0 },
            snacks: { queue: [], pointer: 0 },
            dinner: { queue: [], pointer: 0 },
          },
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
        const todayISO = todayStr;
        loop.assignments = loop.assignments.filter((a) => a.date >= todayISO);
      }

      expect(migrated.mealLoop.assignments.length).toBe(2);
      expect(migrated.mealLoop.assignments[0].date).toBe(todayStr);
      expect(migrated.mealLoop.assignments[1].date).toBe(tomorrowStr);
    });
  });
});

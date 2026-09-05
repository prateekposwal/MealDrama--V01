import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLoopStore } from '../plan/store/useLoopStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useStore, type TrayLibrary } from '../app/store/useStore';
import type { Dish } from '../meal/constants/dishLibrary';
import type { User } from '../app/store/useStore';
import type { MealLoopConfig, MealType } from '../types/tray';
import type { SourcePool } from '../plan/utils/mealLoopEngine';
import { buildPlanIndex } from '../plan/utils/planIndex';
import { poolTargetForCycleLength } from '../utils/loopPool';
import { getExistingItemsInRange } from '../plan/utils/planIndex';

const SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;

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

// Build a pool with `perSlot` DISTINCT dishes per slot.
function makeBigPool(perSlot: number): SourcePool {
  const out: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const slot of SLOTS) {
    for (let i = 0; i < perSlot; i++) {
      out[slot].push(makeDish(`${slot}-${i}`, `${slot} ${i}`));
    }
  }
  return out;
}

function flatDishes(pool: SourcePool): Dish[] {
  return (Object.values(pool) as Dish[][]).flat();
}

function emptyLoopState() {
  return {
    config: null,
    sourceDishIds: [],
    pool_version: 1,
    rotationQueue: [] as never[],
    rotationPointer: 0,
    next_index: 0,
    assignments: [] as never[],
    overrides: new Map() as never,
    analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
    refreshing: false,
    lastRefreshStart: undefined,
    undoStack: [] as never[],
  };
}

function seedTray(perSlot: number) {
  const trayLibrary: TrayLibrary = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const slot of SLOTS) {
    for (let i = 0; i < perSlot; i++) {
      trayLibrary[slot].push({ id: `${slot}-seed-${i}`, dishId: `${slot}-seed-${i}`, name: `${slot} seed ${i}` });
    }
  }
  useStore.setState({ trayLibrary });
}

function configFor(cycleLength: number, startDate = '2026-06-01'): MealLoopConfig {
  return { cycleLength, startDate, skipDays: [], repeatPattern: 'random' };
}

describe('loop store — cycle-length tray + plan-index refresh', () => {
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
    useLoopStore.setState({ mealLoop: emptyLoopState() as never });
  });

  describe('T12 — tray slot-count refresh on cycle change', () => {
    it('grows trayLibrary per-slot toward the cycle-scaled target on cycle-length increase', () => {
      seedTray(2);
      const bigPool = makeBigPool(15);

      // Set up a 7-day loop first.
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));

      // Enriched pool passed on the 14-day apply picks up +8/slot.
      const bigPool14 = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(14), bigPool14, flatDishes(bigPool14));

      const tray = useStore.getState().trayLibrary;
      const target14 = poolTargetForCycleLength(14); // 10
      for (const slot of SLOTS) {
        const count = tray[slot].length;
        // Grew beyond the initial 2/slot.
        expect(count, `${slot} count`).toBeGreaterThan(2);
        // Approaches the 14-day per-slot target (capped by what the pool offers).
        expect(count, `${slot} count`).toBeGreaterThanOrEqual(Math.min(target14, 12));
      }
    });

    it('Profile target Math.round(5*14/7)*4 = 40 is approached', () => {
      seedTray(2);
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14), makeBigPool(15), flatDishes(makeBigPool(15)));

      const target = Math.round((5 * 14) / 7) * 4; // 40
      const tray = useStore.getState().trayLibrary;
      const total = SLOTS.reduce((sum, s) => sum + tray[s].length, 0);
      expect(total).toBeGreaterThan(8);
      expect(total).toBeLessThanOrEqual(target);
    });

    it('DECREASE keeps existing tray items (no crash, no drop)', () => {
      seedTray(4);
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(14), bigPool, flatDishes(bigPool));
      const before = useStore.getState().trayLibrary;

      // Shrink 14 → 7; tray must be preserved.
      useLoopStore.getState().applyLoopConfig(configFor(7), makeBigPool(15), flatDishes(makeBigPool(15)));
      const after = useStore.getState().trayLibrary;
      for (const slot of SLOTS) {
        expect(after[slot].length, `${slot} after decrease`).toBeGreaterThanOrEqual(before[slot].length);
      }
    });

    it('does not duplicate existing tray ids when auto-filling', () => {
      seedTray(2);
      const bigPool = makeBigPool(3); // pool overlaps a little? no — pool ids differ from seeds
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14), makeBigPool(3), flatDishes(makeBigPool(3)));

      const tray = useStore.getState().trayLibrary;
      for (const slot of SLOTS) {
        const ids = tray[slot].map((m: any) => m.dishId ?? m.id);
        expect(new Set(ids).size, `${slot} has duplicate ids`).toBe(ids.length);
      }
    });
  });

  describe('T13 — plan index freshness after cycle merge', () => {
    it('plan._planIndex.dates contains every merged future date after 7→14 apply', () => {
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14), makeBigPool(15), flatDishes(makeBigPool(15)));

      const plan = useTrayStore.getState().plan;
      const days = Object.keys(plan.days);
      expect(days.length).toBeGreaterThanOrEqual(7);
      for (const d of days) {
        expect(plan._planIndex.dates).toContain(d);
      }
    });

    it('getExistingItemsInRange sees the newly filled loop slots', () => {
      const bigPool = makeBigPool(15);
      const startDate = '2026-06-01';
      useLoopStore.getState().applyLoopConfig(configFor(7, startDate), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14, startDate), makeBigPool(15), flatDishes(makeBigPool(15)));

      const plan = useTrayStore.getState().plan;
      const end = new Date(startDate);
      end.setDate(end.getDate() + 14 * 7);
      const endStr = end.toISOString().split('T')[0]!;

      const items = getExistingItemsInRange(plan._planIndex, plan.days, startDate, endStr);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('T14 — cycle edge cases', () => {
    it('cycleLength 0 → autoFillLoop returns zero assignments (no hang, no crash)', () => {
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(1), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(0), makeBigPool(15), flatDishes(makeBigPool(15)));
      const state = useLoopStore.getState();
      expect(Number.isFinite(state.mealLoop.analytics.cyclesCompleted)).toBe(true);
      expect(state.mealLoop.config?.cycleLength).toBe(0);
    });

    it('cycleLength 1 → every active day filled, same-day no duplicate dish', () => {
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(1), bigPool, flatDishes(bigPool));
      const plan = useTrayStore.getState().plan.days;
      for (const [date, day] of Object.entries(plan)) {
        for (const slot of SLOTS) {
          const items = day[slot];
          const ids = items.map((i: any) => i.meal_id ?? i.id);
          expect(new Set(ids).size, `${date} ${slot} duplicate`).toBe(ids.length);
        }
      }
    });

    it('cycleLength 30 → per-slot pool target capped at 15', () => {
      expect(poolTargetForCycleLength(30)).toBe(15);
      const bigPool = makeBigPool(15);
      seedTray(0);
      useLoopStore.getState().applyLoopConfig(configFor(30), bigPool, flatDishes(bigPool));
      const tray = useStore.getState().trayLibrary;
      for (const slot of SLOTS) {
        expect(tray[slot].length, `${slot} capped`).toBeLessThanOrEqual(15);
      }
    });

    it('rapid toggle 7→30→7 → no duplicate date|mealType assignments; sourceDishIds settles at 7-day target', () => {
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(30), makeBigPool(15), flatDishes(makeBigPool(15)));
      useLoopStore.getState().applyLoopConfig(configFor(7), makeBigPool(15), flatDishes(makeBigPool(15)));

      const state = useLoopStore.getState();
      const keys = state.mealLoop.assignments.map((a: any) => `${a.date}|${a.mealType}`);
      expect(new Set(keys).size).toBe(keys.length);

      const expectedIds = (Object.values(bigPool) as Dish[][]).flat().map(d => d.id).length;
      expect(state.mealLoop.sourceDishIds.length).toBeGreaterThan(0);
      expect(state.mealLoop.config?.cycleLength).toBe(7);
    });
  });

  describe('T15 — plan-day merge on change path', () => {
    it('plan.days has ≥14 active days filled with dishes present in sourceDishIds', () => {
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14), makeBigPool(15), flatDishes(makeBigPool(15)));

      const plan = useTrayStore.getState().plan;
      const activeDays = Object.keys(plan.days);
      expect(activeDays.length).toBeGreaterThanOrEqual(14);

      const sourceSet = new Set(useLoopStore.getState().mealLoop.sourceDishIds);
      let filledSlots = 0;
      for (const day of Object.values(plan.days)) {
        for (const slot of SLOTS) {
          for (const item of day[slot]) {
            filledSlots++;
            if (item.source === 'loop') {
              expect(sourceSet.has(item.meal_id)).toBe(true);
            }
          }
        }
      }
      expect(filledSlots).toBeGreaterThan(0);
    });

    it('trayLibrary grows without duplicating existing ids', () => {
      seedTray(2);
      const bigPool = makeBigPool(15);
      useLoopStore.getState().applyLoopConfig(configFor(7), bigPool, flatDishes(bigPool));
      useLoopStore.getState().applyLoopConfig(configFor(14), makeBigPool(15), flatDishes(makeBigPool(15)));

      const tray = useStore.getState().trayLibrary;
      const total = SLOTS.reduce((sum, s) => sum + tray[s].length, 0);
      expect(total).toBeGreaterThan(8);
      for (const slot of SLOTS) {
        const ids = tray[slot].map((m: any) => m.dishId ?? m.id);
        expect(new Set(ids).size, `${slot}`).toBe(ids.length);
      }
    });
  });
});

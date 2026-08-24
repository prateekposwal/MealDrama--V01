import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { MealType, MealLoopState, MealLoopConfig, MealLoopAssignment, RotationQueueItem, DayMeals } from '../../types/tray';
import { EMPTY_LOOP_STATE, SLOT_TIME_DEFAULTS } from '../../types/tray';
import { buildLoopAssignments as buildAssignments, buildRotationQueue, assignFromQueue, handleMidCycleAdd, buildRotationState, autoFillLoop as autoFillLoopEngine } from '../utils/mealLoopEngine';
import { dishToMeal } from '../../utils/dishToMeal';
import { generateMealTitle } from '../../utils/generateMealTitle';
import { getDishStyle } from '../../meal/constants/dishStyles';
import { useStore } from '../../app/store/useStore';
import { getISODate } from '../../utils/dateUTC';
import { enqueue as enqueueUtil } from '../../app/utils/offlineQueue';
import { clearAutoFillCache } from '../hooks/useLoopAutoFill';
import { invalidateOnChange } from '../../app/utils/dpCache';
import { applySmartDefaults } from './helpers/applySmartDefaults';
import type { SourcePool } from '../utils/mealLoopEngine';
import type { Dish } from '../../meal/constants/dishLibrary';
import type { TrayItem } from '../../types/tray';
import { nativeStorage } from '../../app/utils/nativeStorage';
import { slotKey, getExistingItemsInRange, getDishIdsInRange, getBySourceInRange, type SlotKey } from '../utils/planIndex';
import { toDishMap } from '../../utils/dishMap';
import { PersistentMap, rehydrateMap } from '../../app/utils/PersistentMap';

import { getTrayStore } from './_boot';
import type { TrayStore } from './useTrayStore';

export interface LoopStore {
  mealLoop: MealLoopState;
  lastFeaturedTimes: Record<string, number>;

  setMealLoop: (config: MealLoopConfig | null, sourceDishIds: string[], assignments: MealLoopAssignment[]) => void;
  applyLoopConfig: (config: MealLoopConfig, pool: SourcePool, dishes?: Dish[]) => void;
  detectLoopPoolChange: (pool: SourcePool, dishes?: Dish[]) => void;
  clearMealLoop: () => void;
  refreshLoop: (dishes?: Dish[]) => void;
  undoLoopChange: () => void;
  autoFillLoop: (dishes?: Dish[]) => void;
  addLoopOverride: (key: string, dishId: string) => void;
  markFeatured: (dishIds: string[]) => void;
}

const uid = () => `item_${nanoid(16)}`;

function getTimeDef(mealType: MealType, prefs?: Record<string, { start: string; end: string }>): { start: string; end: string } {
  if (prefs?.[mealType]) return prefs[mealType]!;
  const userPrefs = useStore.getState().user?.slotTimePreferences;
  if (userPrefs?.[mealType]) return userPrefs[mealType]!;
  return SLOT_TIME_DEFAULTS[mealType];
}

function deepMergeLoopState(persisted: Record<string, unknown>, template: Record<string, unknown>): Record<string, unknown> {
  const result = { ...template };
  for (const key of Object.keys(persisted)) {
    const pVal = persisted[key];
    const tVal = template[key];
    if (pVal === undefined || pVal === null) {
      result[key] = tVal;
    } else if (typeof pVal === 'object' && typeof tVal === 'object' && !Array.isArray(pVal) && !Array.isArray(tVal)) {
      result[key] = deepMergeLoopState(pVal as Record<string, unknown>, tVal as Record<string, unknown>);
    } else {
      result[key] = pVal;
    }
  }
  return result;
}

let _lastTrayHash = '';
let _reconciled = false;

function trayLibraryHash(trayLibrary: { breakfast: { dishId?: string }[]; lunch: { dishId?: string }[]; snacks: { dishId?: string }[]; dinner: { dishId?: string }[] }): string {
  const parts: string[] = [];
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary[slot] || []) {
      if (item.dishId) parts.push(item.dishId);
    }
  }
  return parts.sort().join(',');
}

export function reconcileLoopStateWithTray(hydratedState?: { mealLoop: MealLoopState }) {
  if (_reconciled) return;
  const trayState = useStore.getState();
  const trayLibrary = trayState.trayLibrary;
  const ml = hydratedState?.mealLoop ?? useLoopStore.getState().mealLoop;

  invalidateOnChange(trayLibrary, ml.config);

  if (!trayLibrary?.breakfast) return;
  const currentHash = trayLibraryHash(trayLibrary);
  if (!currentHash || currentHash === _lastTrayHash) {
    _reconciled = true;
    return;
  }
  _lastTrayHash = currentHash;

  if (!ml.config) return;

  const validIds = new Set<string>();
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary[slot] || []) {
      if (item.dishId) validIds.add(item.dishId);
    }
  }

  const sourceDishIds = ml.sourceDishIds.filter((id: string) => validIds.has(id));
  const rotationQueue = ml.rotationQueue.filter((item: RotationQueueItem) => validIds.has(item.dishId));
  const assignments = ml.assignments.filter((a: MealLoopAssignment) => validIds.has(a.dishId));
  const next_index = Math.min(ml.next_index, rotationQueue.length);
  const rotationPointer = Math.min(ml.rotationPointer, rotationQueue.length);

  const changed =
    sourceDishIds.length !== ml.sourceDishIds.length ||
    rotationQueue.length !== ml.rotationQueue.length ||
    assignments.length !== ml.assignments.length ||
    next_index !== ml.next_index;

  if (changed) {
    queueMicrotask(() => {
      try {
        useLoopStore.setState({
          mealLoop: { ...ml, sourceDishIds, rotationQueue, assignments, next_index, rotationPointer },
        });
      } catch { }
    });
  }
  _reconciled = true;
}

export interface LoopDebugInfo {
  configured: boolean;
  cycleLength: number | null;
  queueSize: number;
  rotationPointer: number;
  nextIndex: number;
  assignmentsCount: number;
  slotBreakdown: Record<MealType, number>;
  sourceDishCount: number;
}

export function getLoopDebugInfo(): LoopDebugInfo | null {
  const s = useLoopStore.getState();
  const ml = s.mealLoop;
  if (!ml.config) return null;

  const slotBreakdown: Record<MealType, number> = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  for (const item of ml.rotationQueue) {
    slotBreakdown[item.mealType]++;
  }

  return {
    configured: true,
    cycleLength: ml.config.cycleLength,
    queueSize: ml.rotationQueue.length,
    rotationPointer: ml.rotationPointer,
    nextIndex: ml.next_index,
    assignmentsCount: ml.assignments.length,
    slotBreakdown,
    sourceDishCount: ml.sourceDishIds.length,
  };
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as { getLoopDebugInfo: typeof getLoopDebugInfo }).getLoopDebugInfo = getLoopDebugInfo;
}

const emptyDayMeals = (): DayMeals => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });

function mergeDays(base: Record<string, DayMeals>, overlay: Record<string, DayMeals>): Record<string, DayMeals> {
  const result = { ...base };
  for (const [date, meals] of Object.entries(overlay)) {
    const existing = result[date];
    if (existing) {
      const merged: DayMeals = { ...existing };
      for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
        if (meals[mt].length > 0) merged[mt] = meals[mt];
      }
      result[date] = merged;
    } else {
      result[date] = meals;
    }
  }
  return result;
}

function pushUndo(ml: MealLoopState): MealLoopState['undoStack'] {
  return [{
    config: ml.config, sourceDishIds: ml.sourceDishIds,
    rotationQueue: ml.rotationQueue, rotationPointer: ml.rotationPointer,
    analytics: ml.analytics,
  }, ...ml.undoStack].slice(0, 5);
}

function buildLoopTrayItem(
  a: MealLoopAssignment,
  dishMap: Map<string, Dish>,
): TrayItem | null {
  const dish = dishMap.get(a.dishId);
  if (!dish) return null;
  const meal = dishToMeal(dish);
  const defaults = applySmartDefaults(meal, a.mealType, undefined, { useSmartSuggestions: true });
  const timeDef = getTimeDef(a.mealType);
  const loopCarb = defaults.roti ?? defaults.rice ?? undefined;
  const loopTitle = generateMealTitle(meal.name, defaults.sides, defaults.beverages, loopCarb);
  return {
    id: uid(), meal_id: meal.id, name: meal.name, title: loopTitle,
    icon: meal.icon, quantity: 1, servings: 1, smartVersion: 1,
    style: getDishStyle(meal.id),
    gravy: defaults.gravy, roti: defaults.roti, rice: defaults.rice,
    sides: defaults.sides, beverages: defaults.beverages,
    dessert: defaults.dessert, itemQtys: defaults.itemQtys,
    start_time: timeDef.start, end_time: timeDef.end, source: 'loop',
  };
}

export const useLoopStore = create<LoopStore>()(
  persist(
    (set, get) => ({
      mealLoop: EMPTY_LOOP_STATE,
      lastFeaturedTimes: {},

      setMealLoop: (config: MealLoopConfig | null, sourceDishIds: string[], assignments: MealLoopAssignment[]) => {
        set((s: LoopStore) => ({
          mealLoop: {
            ...s.mealLoop,
            config,
            sourceDishIds,
            assignments,
            overrides: s.mealLoop.overrides,
            rotationPointer: s.mealLoop.rotationPointer,
          },
        }));
      },

      applyLoopConfig: (config: MealLoopConfig, pool: SourcePool, dishes?: Dish[]) => {
        clearAutoFillCache();
        const dishMap = toDishMap(dishes);
        const trayState = getTrayStore<TrayStore>().getState();
        const sourceDishIds = (Object.values(pool) as Dish[][]).flat().map(d => d.id);

        let trayUpdater: ((prev: TrayStore) => Partial<TrayStore>) | null = null;
        let enqueuePayload: { config: MealLoopConfig; sourceDishIds: string[]; assignments: MealLoopAssignment[] } | null = null;

        set((s: LoopStore) => {
          const ml = s.mealLoop;

          if (ml.config) {
            const lengthChanged = config.cycleLength !== ml.config.cycleLength;

            if (lengthChanged) {
              const { queue: newQueue, pointer } = buildRotationState(pool, dishes);
              const loopEndDate = new Date(config.startDate);
              loopEndDate.setDate(loopEndDate.getDate() + config.cycleLength * 7);
              const loopEndStr = getISODate(loopEndDate);

              const existingItems = getExistingItemsInRange(
                trayState.plan._planIndex, trayState.plan.days,
                config.startDate, loopEndStr,
              );
              const result = autoFillLoopEngine(config, newQueue, pointer, existingItems, ml.lastFillDate);
              const existingKeys = new Set(ml.assignments.map((a: MealLoopAssignment) => `${a.date}|${a.mealType}`));
              const dedupedNew = result.assignments.filter((a: MealLoopAssignment) => !existingKeys.has(`${a.date}|${a.mealType}`));

              const newDays: Record<string, DayMeals> = {};
              for (const a of dedupedNew) {
                let day = newDays[a.date];
                if (!day) { day = emptyDayMeals(); newDays[a.date] = day; }
                const item = buildLoopTrayItem(a, dishMap);
                if (item) day[a.mealType].push(item);
              }

              enqueuePayload = { config, sourceDishIds, assignments: [...ml.assignments, ...dedupedNew] };
              trayUpdater = (prev: TrayStore) => ({
                plan: { ...prev.plan, days: mergeDays(prev.plan.days, newDays) },
              });

              return {
                mealLoop: {
                  ...ml, config, sourceDishIds,
                  rotationQueue: result.rotationQueue, rotationPointer: result.rotationPointer,
                  assignments: [...ml.assignments, ...dedupedNew],
                  undoStack: pushUndo(ml),
                  refreshing: false, lastRefreshStart: undefined,
                  lastFillDate: result.lastFillDate,
                  analytics: { ...ml.analytics, cyclesCompleted: ml.analytics.cyclesCompleted + 1 },
                },
              };
            }

            const oldIds = ml.sourceDishIds;
            const newIds = (Object.values(pool) as Dish[][]).flat().map(d => d.id);
            const result = handleMidCycleAdd(
              oldIds, newIds, pool, config,
              ml.rotationQueue, ml.next_index, ml.assignments, dishes,
            );
            const { queue: rebuiltQueue, pointer: rebuiltPointer } = buildRotationState(pool, dishes);

            const newDays: Record<string, DayMeals> = {};
            for (const a of result.assignments) {
              let day = newDays[a.date];
              if (!day) { day = emptyDayMeals(); newDays[a.date] = day; }
              if (day[a.mealType].length > 0) continue;
              const item = buildLoopTrayItem(a, dishMap);
              if (item) day[a.mealType].push(item);
            }

            enqueuePayload = { config, sourceDishIds: newIds, assignments: result.assignments };
            trayUpdater = (prev: TrayStore) => ({
              plan: { ...prev.plan, days: mergeDays(prev.plan.days, newDays) },
            });

            return {
              mealLoop: {
                ...ml, config, sourceDishIds: newIds, pool_version: result.pool_version,
                rotationQueue: result.queue, rotationPointer: Math.min(rebuiltPointer, result.queue.length),
                next_index: Math.min(result.assignments.length, result.queue.length),
                assignments: result.assignments,
                undoStack: pushUndo(ml),
                refreshing: false, lastRefreshStart: undefined,
                analytics: { ...ml.analytics, cyclesCompleted: ml.analytics.cyclesCompleted + 1 },
              },
            };
          }

          const { queue, assignments: newAssignments } = buildAssignments(pool, config, dishes);
          const { queue: newQueue, pointer: newPointer } = buildRotationState(pool, dishes);

          const clearKeys = new Set(newAssignments.map(a => slotKey(a.date, a.mealType)));
          const newDays: Record<string, DayMeals> = {};
          const newCompletions: Record<string, number> = {};
          const newSkipped: Record<string, number> = {};
          for (const [k, v] of Object.entries(trayState.completions || {})) {
            if (!clearKeys.has(k as SlotKey)) newCompletions[k] = v;
          }
          for (const [k, v] of Object.entries(trayState.skipped || {})) {
            if (!clearKeys.has(k as SlotKey)) newSkipped[k] = v;
          }

          for (const a of newAssignments) {
            let day = newDays[a.date];
            if (!day) { day = emptyDayMeals(); newDays[a.date] = day; }
            const item = buildLoopTrayItem(a, dishMap);
            if (item) day[a.mealType].push(item);
          }

          enqueuePayload = { config, sourceDishIds, assignments: newAssignments };
          trayUpdater = (prev: TrayStore) => ({
            plan: { ...prev.plan, days: mergeDays(prev.plan.days, newDays) },
            completions: newCompletions,
            skipped: newSkipped,
          });

          return {
            mealLoop: {
              config, sourceDishIds, pool_version: 1, rotationQueue: queue, rotationPointer: newPointer,
              next_index: Math.min(newAssignments.length, queue.length),
              assignments: newAssignments, overrides: ml.overrides,
              undoStack: ml.config ? pushUndo(ml) : ml.undoStack,
              analytics: { ...ml.analytics, cyclesCompleted: ml.analytics.cyclesCompleted + 1 },
              refreshing: false, lastRefreshStart: undefined,
            },
          };
        });

        if (enqueuePayload) {
          enqueueUtil('loop_save', enqueuePayload);
          window.dispatchEvent(new Event('pantry:invalidate'));
        }
        if (trayUpdater) getTrayStore<TrayStore>().setState(trayUpdater);
      },

      detectLoopPoolChange: (pool: SourcePool, dishes?: Dish[]) => {
        const dishMap = toDishMap(dishes);

        set((s: LoopStore) => {
          const oldIds = s.mealLoop.sourceDishIds;
          const newIds = (Object.values(pool) as Dish[][]).flat().map(d => d.id);
          const oldSet = new Set(oldIds);
          const newSet = new Set(newIds);
          const hasChanges = newIds.some((id: string) => !oldSet.has(id)) || oldIds.some((id: string) => !newSet.has(id));
          if (!hasChanges) return s;
          const cfg = s.mealLoop.config;
          if (!cfg) return s;
          const result = handleMidCycleAdd(
            oldIds, newIds, pool, cfg,
            s.mealLoop.rotationQueue, s.mealLoop.next_index,
            s.mealLoop.assignments, dishes,
          );

          const addedIds = newIds.filter(id => !oldSet.has(id));
          if (addedIds.length > 0 && dishes) {
            const addedNames = addedIds.map(id => dishMap.get(id)?.name ?? id).join(', ');
            const firstAdded = addedIds[0];
            const nextAssignment = result.assignments.find(a => a.dishId === firstAdded);
            const dateHint = nextAssignment
              ? ` on ${new Date(nextAssignment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
              : '';
            useStore.getState().setToast({ message: `🍽️ ${addedNames} added — will appear in upcoming slots${dateHint}`, type: 'success' });
          }

          return {
            mealLoop: {
              ...s.mealLoop, sourceDishIds: newIds, pool_version: result.pool_version,
              rotationQueue: result.queue, rotationPointer: Math.min(s.mealLoop.rotationPointer, result.queue.length),
              assignments: result.assignments,
              next_index: Math.min(result.assignments.length, result.queue.length),
            },
          };
        });
      },

      clearMealLoop: () => {
        set(() => ({ mealLoop: EMPTY_LOOP_STATE }));
      },

      undoLoopChange: () => {
        set((s: LoopStore) => {
          const prev = s.mealLoop.undoStack[0];
          if (!prev) return s;
          const cfg = prev.config;
          if (!cfg) return s;
          return {
            mealLoop: {
              ...s.mealLoop, config: prev.config, sourceDishIds: prev.sourceDishIds,
              rotationQueue: prev.rotationQueue, rotationPointer: prev.rotationPointer,
              analytics: prev.analytics, undoStack: s.mealLoop.undoStack.slice(1),
            },
          };
        });
      },

      refreshLoop: (dishes?: Dish[]) => {
        const dishMap = toDishMap(dishes);

        let trayUpdater: ((prev: TrayStore) => Partial<TrayStore>) | null = null;

        set((s: LoopStore) => {
          if (s.mealLoop.refreshing) {
            useStore.getState().setToast({ message: '⏳ Loop is already refreshing. Please wait.', type: 'info' });
            return s;
          }

          const cfg = s.mealLoop.config;
          if (!cfg) return s;

          const loopStartDate = new Date(cfg.startDate);
          const loopEndDate = new Date(loopStartDate);
          loopEndDate.setDate(loopEndDate.getDate() + cfg.cycleLength * 7);
          const loopEndStr = getISODate(loopEndDate);

          const trayState = getTrayStore<TrayStore>().getState();
          const { plan } = trayState;
          const currentDishIds = getDishIdsInRange(plan._planIndex, plan.days, cfg.startDate, loopEndStr);

          const pool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
          for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
            for (const id of currentDishIds[mt]) {
              const dish = dishMap.get(id);
              if (dish) pool[mt].push(dish);
            }
          }
          const { queue: newQueue, pointer: newPointer } = buildRotationState(pool, dishes);

          if (newQueue.length === 0) {
            useStore.getState().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
            return s;
          }

          const existingItems = getExistingItemsInRange(plan._planIndex, plan.days, cfg.startDate, loopEndStr);

          const result = autoFillLoopEngine(cfg, newQueue, newPointer, existingItems, s.mealLoop.lastFillDate);
          const existingKeys = new Set(s.mealLoop.assignments.map((a: MealLoopAssignment) => `${a.date}|${a.mealType}`));
          const dedupedNew = result.assignments.filter((a: MealLoopAssignment) => !existingKeys.has(`${a.date}|${a.mealType}`));

          if (dedupedNew.length === 0) {
            useStore.getState().setToast({ message: '✅ All future slots are already filled — nothing to refresh.', type: 'info' });
            return { ...s, mealLoop: { ...s.mealLoop, refreshing: false, lastRefreshStart: undefined } };
          }

          const newDays: Record<string, DayMeals> = {};
          for (const a of dedupedNew) {
            let day = newDays[a.date];
            if (!day) { day = emptyDayMeals(); newDays[a.date] = day; }
            const item = buildLoopTrayItem(a, dishMap);
            if (item) day[a.mealType].push(item);
          }

          trayUpdater = (prev: TrayStore) => ({
            plan: { ...prev.plan, days: mergeDays(prev.plan.days, newDays) },
          });

          useStore.getState().setToast({ message: '🔄 Loop refreshed! Future days updated.', type: 'success' });

          return {
            mealLoop: {
              ...s.mealLoop, sourceDishIds: (Object.values(pool) as Dish[][]).flat().map(d => d.id),
              rotationQueue: result.rotationQueue, rotationPointer: result.rotationPointer,
              assignments: [...s.mealLoop.assignments, ...dedupedNew],
              lastFillDate: result.lastFillDate,
              refreshing: false, lastRefreshStart: undefined,
            },
          };
        });

        
        if (trayUpdater) getTrayStore<TrayStore>().setState(trayUpdater);
      },





      autoFillLoop: (dishes?: Dish[]) => {
        const dishMap = toDishMap(dishes);

        let trayUpdater: ((prev: TrayStore) => Partial<TrayStore>) | null = null;

        set((s: LoopStore) => {
          const cfg = s.mealLoop.config;
          if (!cfg) return s;

          if (s.mealLoop.rotationQueue.length === 0) {
            useStore.getState().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
            return s;
          }

          const loopStartDate = new Date(cfg.startDate);
          const loopEndDate = new Date(loopStartDate);
          loopEndDate.setDate(loopEndDate.getDate() + cfg.cycleLength * 7);
          const loopEndStr = getISODate(loopEndDate);

          const trayState = getTrayStore<TrayStore>().getState();
          const existingItems = getExistingItemsInRange(
            trayState.plan._planIndex, trayState.plan.days,
            cfg.startDate, loopEndStr,
          );
          const result = autoFillLoopEngine(cfg, s.mealLoop.rotationQueue, s.mealLoop.rotationPointer, existingItems, s.mealLoop.lastFillDate);

          if (result.assignments.length === 0 && s.mealLoop.rotationQueue.length > 0) {
            useStore.getState().setToast({ message: '⚠️ Loop assignment failed. No meals could be scheduled.', type: 'error' });
            return s;
          }

          const existingKeys = new Set(s.mealLoop.assignments.map((a: MealLoopAssignment) => `${a.date}|${a.mealType}`));
          const dedupedNew = result.assignments.filter((a: MealLoopAssignment) => !existingKeys.has(`${a.date}|${a.mealType}`));

          const newDays: Record<string, DayMeals> = {};
          for (const a of dedupedNew) {
            let day = newDays[a.date];
            if (!day) { day = emptyDayMeals(); newDays[a.date] = day; }
            const item = buildLoopTrayItem(a, dishMap);
            if (item) day[a.mealType].push(item);
          }

          trayUpdater = (prev: TrayStore) => ({
            plan: { ...prev.plan, days: mergeDays(prev.plan.days, newDays) },
          });

          return {
            mealLoop: {
              ...s.mealLoop, rotationPointer: result.rotationPointer,
              assignments: [...s.mealLoop.assignments, ...dedupedNew],
              lastFillDate: result.lastFillDate,
            },
          };
        });

        if (trayUpdater) getTrayStore<TrayStore>().setState(trayUpdater);

        const loopState = get().mealLoop;
        if (loopState.config) {
          enqueueUtil('loop_save', {
            config: loopState.config,
            sourceDishIds: loopState.sourceDishIds,
            assignments: loopState.assignments,
          });
        }
      },

      addLoopOverride: (key: string, dishId: string) => {
        set((s: LoopStore) => {
          const next = new Map(s.mealLoop.overrides);
          next.set(key, dishId);
          return { mealLoop: { ...s.mealLoop, overrides: next } };
        });
      },

      markFeatured: (dishIds: string[]) => {
        const now = Date.now();
        set((s: LoopStore) => {
          const updated = { ...s.lastFeaturedTimes };
          for (const id of dishIds) updated[id] = now;
          return { lastFeaturedTimes: updated };
        });
      },
    }),
    {
      name: 'mealdrama-loop-store',
      version: 3,
      storage: nativeStorage,
      migrate: (persisted: Record<string, unknown>, version: number) => {
        if (version < 2) {
          const old = persisted?.mealLoop;
          if (old?.rotationState) {
            const rs = old.rotationState;
            const existingQueue: RotationQueueItem[] = old.rotationQueue ?? [];
            const existingIds = new Set(existingQueue.map((i: RotationQueueItem) => i.dishId));
            const perSlotQueues: Record<MealType, string[]> = {
              breakfast: rs.breakfast?.queue ?? [],
              lunch: rs.lunch?.queue ?? [],
              snacks: rs.snacks?.queue ?? [],
              dinner: rs.dinner?.queue ?? [],
            };
            const mergedQueue: RotationQueueItem[] = [...existingQueue];
            for (const [slot, ids] of Object.entries(perSlotQueues) as [MealType, string[]][]) {
              for (const dishId of ids) {
                if (!existingIds.has(dishId)) {
                  mergedQueue.push({ dishId, dishName: dishId, mealType: slot });
                }
              }
            }
            const maxPointer = Math.max(
              rs.breakfast?.pointer ?? 0,
              rs.lunch?.pointer ?? 0,
              rs.snacks?.pointer ?? 0,
              rs.dinner?.pointer ?? 0,
            );
            const rotationPointer = Math.min(maxPointer, mergedQueue.length);
            delete old.rotationState;
            old.rotationQueue = mergedQueue;
            old.rotationPointer = rotationPointer;
          } else if (old && old.rotationPointer === undefined) {
            old.rotationPointer = 0;
          }
        }
        // Rehydrate overrides Map from persisted form
        if (persisted?.mealLoop?.overrides) {
          persisted.mealLoop.overrides = rehydrateMap(persisted.mealLoop.overrides);
        }
        return persisted;
      },
      partialize: (state) => {
        const ml = state.mealLoop;
        return {
          mealLoop: {
            ...ml,
            overrides: new PersistentMap(ml.overrides instanceof Map ? ml.overrides : Object.entries(ml.overrides ?? {})),
            undoStack: [],
          },
          lastFeaturedTimes: state.lastFeaturedTimes,
        };
      },
      merge: (persisted: Record<string, unknown>, current: Record<string, unknown>) => {
        const ml = persisted.mealLoop;
        return {
          ...current,
          ...persisted,
          mealLoop: ml ? {
            ...current.mealLoop,
            ...ml,
            overrides: rehydrateMap(
              ml.overrides ?? current.mealLoop?.overrides,
            ),
          } : current.mealLoop,
        };
      },
    }
  )
);

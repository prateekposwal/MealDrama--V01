import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { MealType, MealLoopState, MealLoopConfig, MealLoopAssignment, RotationQueueItem, DayMeals } from '../../types/tray';
import type { MealOption } from '../../app/store/useStore';
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
import { slotKey, extendPlanIndex, getExistingItemsInRange, getDishIdsInRange, getBySourceInRange, type SlotKey } from '../utils/planIndex';
import { toDishMap } from '../../utils/dishMap';
import { PersistentMap, rehydrateMap } from '../../app/utils/PersistentMap';

import { getTrayStore } from './_boot';
import type { TrayStore } from './useTrayStore';
import { buildEnrichedLoopPool, poolTargetForCycleLength } from '../../utils/loopPool';

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
let _healed = false;

function trayLibraryHash(trayLibrary: { breakfast: { dishId?: string }[]; lunch: { dishId?: string }[]; snacks: { dishId?: string }[]; dinner: { dishId?: string }[] }): string {
  const parts: string[] = [];
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary[slot] || []) {
      if (item.dishId) parts.push(item.dishId);
    }
  }
  return parts.sort().join(',');
}


/**
 * PART B — Heal a DEGENERATE persisted loop on rehydration.
 * useLoopStore PERSISTS mealLoop (rotation queue + assignments + sourceDishIds),
 * so a 2-dish 2-dish loop created by a raw (un-enriched) Apply path survives a
 * reload unchanged. This ONE-TIME, idempotent heal rebuilds the rotation via the
 * ENRICHED short path when the persisted queue is dramatically below the
 * cycle-scaled target — turning the stuck "Thukpa + Seekh Kebab" rotation into a
 * proper varied rotation. Guarded by module-level `_healed`: runs once, never on
 * every render, never churns a healthy loop.
 */
export async function healDegenerateLoop(ml: MealLoopState): Promise<MealLoopState | null> {
  if (_healed) return null;
  const cfg = ml?.config;
  if (!cfg) return null; // nothing configured -> nothing to heal; DON'T arm the guard
  _healed = true;        // arm the once-guard only when we evaluate a real configured loop
  const queue = ml.rotationQueue || [];
  if (queue.length === 0) return null;

  const target = poolTargetForCycleLength(cfg.cycleLength);
  const slotCounts: Record<MealType, number> = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  for (const q of queue) slotCounts[q.mealType] = (slotCounts[q.mealType] || 0) + 1;
  const anySlotSmall = (Object.values(slotCounts) as number[]).some(c => c < 3);
  const totalSmall = queue.length < target;
  // Healthy loop -> leave it untouched (never churn variety the user already has).
  if (!anySlotSmall && !totalSmall) return null;

  // Build the ENRICHED pool from the tray's own dishes (kept as the lead) plus
  // diet/region-appropriate library dishes up to the cycle-scaled target.
  let library: Dish[] = [];
  try { library = (await import('../../meal/constants/dishLibrary')).DISH_LIBRARY; } catch { library = []; }
  if (!library.length) return null;

  const trayState = useStore.getState();
  const trayLibrary = trayState.trayLibrary;
  const sourcePool: SourcePool = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary?.[mt] || []) {
      const dish = library.find(d => d.id === item.dishId);
      if (dish && !sourcePool[mt].find(d => d.id === dish.id)) sourcePool[mt].push(dish);
    }
  }

  const enriched = buildEnrichedLoopPool({
    sourcePool,
    library,
    diet: trayState.user?.diet,
    region: trayState.user?.region,
    cycleLength: cfg.cycleLength,
    healthGoal: trayState.user?.healthGoals?.[0],
  });
  const { queue: newQueue, pointer: newPointer } = buildRotationState(enriched, library);
  // Only heal when the rebuild actually gains variety; otherwise keep as-is.
  if (newQueue.length <= queue.length) return null;

  // PART B (issue 2): a DEGENERATE loop ALSO persists its already-written
  // plan.days/assignments, so healing only the rotation QUEUE leaves the Plan
  // grid showing the stale "Thukpa + Chicken 65" 2-dish rotation forever.
  // Regenerate the current cycle's assignments from the healed queue AND
  // refill only FUTURE days (beyond today) so the user's next reload shows a
  // VARIED grid. Today's already-interacted slots are left untouched
  // (non-destructive); only the loop's own future plan slots are rewritten.
  const dishMap = toDishMap(library);
  let newAssignments: MealLoopAssignment[] = ml.assignments;
  try {
    newAssignments = assignFromQueue(newQueue, cfg, 0, []);
  } catch {
    newAssignments = ml.assignments; // fall back to persisted on any engine error
  }

  const today = getISODate();
  const futureDays: Record<string, DayMeals> = {};
  for (const a of newAssignments) {
    if (a.date <= today) continue; // never touch today/past slots
    let day = futureDays[a.date];
    if (!day) { day = emptyDayMeals(); futureDays[a.date] = day; }
    // One loop card per slot — overwrite the stale multi-card rotation.
    if (day[a.mealType].length === 0) {
      const item = buildLoopTrayItem(a, dishMap);
      if (item) day[a.mealType].push(item);
    }
  }

  if (Object.keys(futureDays).length > 0) {
    const tray = getTrayStore<TrayStore>();
    if (tray) {
      const cur = tray.getState();
      tray.setState({ plan: { ...cur.plan, days: mergeDays(cur.plan.days, futureDays) } });
      try { tray.getState().rebuildPlanIndex(); } catch { /* index rebuild is best-effort */ }
    }
  }

  return {
    ...ml,
    sourceDishIds: (Object.values(enriched) as Dish[][]).flat().map(d => d.id),
    rotationQueue: newQueue,
    rotationPointer: newPointer,
    assignments: newAssignments,
    next_index: Math.min(ml.next_index, newQueue.length),
    pool_version: ml.pool_version + 1,
  };
}

export function reconcileLoopStateWithTray(hydratedState?: { mealLoop: MealLoopState }) {
  if (_reconciled) return;
  // PART B — before the tray-sync honesty pass, heal a degenerate persisted loop.
  const healTarget = hydratedState?.mealLoop ?? useLoopStore.getState().mealLoop;
  if (healTarget) {
    healDegenerateLoop(healTarget).then((healed) => {
      if (healed) useLoopStore.setState({ mealLoop: healed });
    });
  }

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
  persist<LoopStore, [], [], Pick<LoopStore, 'mealLoop' | 'lastFeaturedTimes'>>(
    (set, get): LoopStore => ({
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
        let trayLibraryUpdater: ((prev: ReturnType<typeof useStore.getState>) => Partial<ReturnType<typeof useStore.getState>>) | null = null;
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
                plan: {
                  ...prev.plan,
                  days: mergeDays(prev.plan.days, newDays),
                  _planIndex: extendPlanIndex(prev.plan._planIndex, newDays),
                },
              });

              // Auto-fill the tray from the enriched pool up to the cycle-scaled
              // per-slot target. Only fill on cycle-length INCREASE (a longer
              // rotation needs more dishes); never displace manual picks and
              // never duplicate existing tray ids.
              const lengthGrew = config.cycleLength > ml.config.cycleLength;
              if (lengthGrew) {
                const targetPerSlot = poolTargetForCycleLength(config.cycleLength);
                const currentTray = useStore.getState().trayLibrary;
                const newTrayEntries: Partial<Record<MealType, MealOption[]>> = {};
                for (const slot of ['breakfast', 'lunch', 'dinner', 'snacks'] as const) {
                  const trayItems = currentTray[slot] ?? [];
                  const existingSet = new Set(trayItems.map(item => item.dishId ?? item.id));
                  const poolDishes = (pool[slot] ?? []).filter((d: Dish) => !existingSet.has(d.id));
                  const toAdd = poolDishes.slice(0, Math.max(0, targetPerSlot - trayItems.length));
                  if (toAdd.length > 0) {
                    newTrayEntries[slot] = toAdd.map((d: Dish) => ({
                      id: d.id, dishId: d.id, name: d.name,
                      icon: d.icon,
                      sourceRegion: d.region,
                    }));
                  }
                }
                if (Object.keys(newTrayEntries).length > 0) {
                  trayLibraryUpdater = (prevTray) => {
                    const merged = { ...prevTray.trayLibrary };
                    for (const slot of ['breakfast', 'lunch', 'dinner', 'snacks'] as const) {
                      merged[slot] = [...(merged[slot] ?? []), ...(newTrayEntries[slot] ?? [])];
                    }
                    return { trayLibrary: merged };
                  };
                }
              }

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
              plan: {
                ...prev.plan,
                days: mergeDays(prev.plan.days, newDays),
                _planIndex: extendPlanIndex(prev.plan._planIndex, newDays),
              },
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
            plan: {
              ...prev.plan,
              days: mergeDays(prev.plan.days, newDays),
              _planIndex: extendPlanIndex(prev.plan._planIndex, newDays),
            },
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
        if (trayLibraryUpdater) useStore.setState(trayLibraryUpdater);
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
            plan: {
              ...prev.plan,
              days: mergeDays(prev.plan.days, newDays),
              _planIndex: extendPlanIndex(prev.plan._planIndex, newDays),
            },
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
            plan: {
              ...prev.plan,
              days: mergeDays(prev.plan.days, newDays),
              _planIndex: extendPlanIndex(prev.plan._planIndex, newDays),
            },
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
      migrate: (persistedIn: unknown, version: number) => {
        const persisted = (persistedIn as Record<string, any> | null) ?? {};
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
        return persisted as Pick<LoopStore, 'mealLoop' | 'lastFeaturedTimes'>;
      },
      partialize: (state) => {
        const ml = state.mealLoop;
        return {
          mealLoop: {
            ...ml,
            overrides: rehydrateMap(ml.overrides),
            undoStack: [],
          },
          lastFeaturedTimes: state.lastFeaturedTimes,
        };
      },
      merge: (persistedIn: unknown, currentIn: unknown) => {
        const persisted = (persistedIn as Record<string, any> | null) ?? {};
        const current = (currentIn as Record<string, any> | null) ?? {};
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
        } as LoopStore;
      },
      // PART B — heal a degenerate (2-dish) persisted loop exactly ONCE after
      // reload, so the stale "Thukpa + Seekh Kebab" rotation no longer survives
      // rehydration. reconcileLoopStateWithTray is idempotent (module _reconciled
      // + _healed guards): it never runs per-render and never churns a healthy loop.
      onRehydrateStorage: () => () => {
        // Defer past store-creation so `useLoopStore` is defined before we read it
        // (zustand hydrate runs synchronously inside create(); TDZ otherwise throws).
        queueMicrotask(() => {
          try {
            reconcileLoopStateWithTray();
          } catch (e) {
            console.warn('[useLoopStore] heal-on-rehydrate skipped:', e);
          }
        });
      },
    }
  )
);

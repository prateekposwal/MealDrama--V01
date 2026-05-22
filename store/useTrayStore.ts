// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray Store — Single Source of Truth
// Shared by Dashboard, Plan, and MealTray screens
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { trayApi, offlineQueue } from '../lib/trayApi';
import { applySmartDefaults } from './helpers/applySmartDefaults';
import { EMPTY_LOOP_STATE, SLOT_TIME_DEFAULTS, getSlotDefaultTimes } from '../types/tray';
import type { Meal, MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, SavedTemplate, MealLoopState, MealLoopConfig, MealLoopAssignment } from '../types/tray';
import { buildLoopAssignments as buildAssignments, handleMidCycleAdd, buildRotationState, buildRotationStateWithMerge, autoFillLoop as autoFillLoopEngine } from '../utils/mealLoopEngine';
import { dishToMeal } from '../utils/dishToMeal';
import { generateMealTitle } from '../utils/generateMealTitle';
import { getDishStyle } from '../constants/dishStyles';
import type { SourcePool } from '../utils/mealLoopEngine';
import type { Dish } from '../constants/dishLibrary';
import { useStore } from './useStore';
import { getISODate, addDaysISO, daysBetweenISO } from '../utils/dateUTC';
import { onConnectivityChange } from '../utils/connectivity';
import { nativeStorage } from '../utils/nativeStorage';

// ─── FIX 6: Deep merge utility for migration — fills missing keys from template
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

export type { MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, Meal, MealLoopState, MealLoopConfig, MealLoopAssignment };

// ─── Re-export helper for screens to use directly when needed ────────────────
export { applySmartDefaults };

/** Resolve effective slot defaults — prefers caller-provided prefs, then user prefs, then SLOT_TIME_DEFAULTS */
function getTimeDef(mealType: MealType, prefs?: Record<string, { start: string; end: string }>): { start: string; end: string } {
  if (prefs?.[mealType]) return prefs[mealType]!;
  const userPrefs = useStore.getState().user?.slotTimePreferences;
  if (userPrefs?.[mealType]) return userPrefs[mealType]!;
  return SLOT_TIME_DEFAULTS[mealType];
}

export interface TrayStore {
  // State
  plan: {
    period: 'week' | 'biweek' | 'month';
    days: Record<string, DayMeals>;
  };
  guestMode: GuestMode;
  swapHistory: SwapRecord[];
  saveStatus: Record<string, SaveStatus>;
  templates: SavedTemplate[];
  completions: Record<string, number>;
  skipped: Record<string, number>;
  lastFeaturedTimes: Record<string, number>;
  mealLoop: MealLoopState;

  // Actions
  setPeriod: (period: 'week' | 'biweek' | 'month') => void;
  saveTemplate: (name: string, slotConfigs: Record<string, { start: string; end: string; templateId: string }>, period: 'week' | 'biweek' | 'month', isDraft?: boolean) => string;
  loadTemplate: (id: string) => { slotConfigs: Record<string, { start: string; end: string; templateId: string }>; period: 'week' | 'biweek' | 'month' } | null;
  deleteTemplate: (id: string) => void;

  /**
   * Add a meal to a slot. Calls applySmartDefaults(meal, slotType) internally
   * to initialize gravy/roti/rice/sides/beverages from meal metadata.
   * Optimistic update → debounce PATCH → offline queue fallback.
   */
  addMealToSlot: (date: string, mealType: MealType, meal: Meal, overrides?: Partial<TrayItem>) => void;

  /**
   * Swap meal inline. Preserves quantity/servings. Calls applySmartDefaults
   * with the NEW meal to reset chips. Debounce PATCH → offline queue.
   */
  swapMealInSlot: (date: string, mealType: MealType, itemId: string, newMeal: Meal) => void;

  /** Inline edit (gravy/roti/rice/sides/beverages/quantity). Debounced 1000ms. */
  updateItemInline: (date: string, mealType: MealType, itemId: string, updates: Partial<TrayItem>) => void;

  /** H12: Batch update multiple items in one store transaction — avoids N+1 store updates */
  batchUpdateItems: (date: string, mealType: MealType, itemUpdates: Array<{ itemId: string; updates: Partial<TrayItem> }>) => void;

  /** Remove meal from slot */
  removeMealFromSlot: (date: string, mealType: MealType, itemId: string) => void;

  /** Set guest mode for date range */
  setGuestMode: (guestMode: Partial<GuestMode>) => void;

  /** Undo last swap */
  undoSwap: () => void;

  /** Get meals for a specific date and meal type */
  getMeals: (date: string, mealType: MealType) => TrayItem[];

  /** Get all meals for a date */
  getDayMeals: (date: string) => DayMeals;

  /** Fill all days in the period by cycling today's meals */
  fillPlan: (period: 'week' | 'biweek' | 'month') => void;

  /** Sync offline queue to API */
  syncOfflineQueue: () => Promise<{ synced: number; failed: number }>;

  /** Clear save status for an item */
  clearSaveStatus: (itemId: string) => void;

  /** Mark a slot as completed (user action) */
  completeSlot: (date: string, mealType: MealType) => void;

  /** Undo completion of a slot */
  undoCompleteSlot: (date: string, mealType: MealType) => void;

  /** Mark a slot as skipped (user action) */
  skipSlot: (date: string, mealType: MealType) => void;

  /** Undo skipping of a slot */
  undoSkipSlot: (date: string, mealType: MealType) => void;

  /** Configure meal loop with source pool + assignments */
  setMealLoop: (config: MealLoopConfig, sourceDishIds: string[], assignments: MealLoopAssignment[]) => void;

  /** Apply loop config from scratch — builds queue + assignments */
  applyLoopConfig: (config: MealLoopConfig, pool: SourcePool, dishes?: Dish[]) => void;

  /** Detect new dishes added to pool mid-cycle — rebuilds queue + reassigns */
  detectLoopPoolChange: (pool: SourcePool, dishes?: Dish[]) => void;

  /** Clear/reset the meal loop */
  clearMealLoop: () => void;

  /** Force rebuild loop assignments from current queue/state */
  refreshLoop: (dishes?: Dish[]) => void;

  /** Undo last loop config change */
  undoLoopChange: () => void;

  /** Non-destructive gap-fill: fills empty slots with loop dishes */
  autoFillLoop: (dishes?: Dish[]) => void;

  /** Add a user override for a specific date+slot (cancels loop assignment) */
  addLoopOverride: (key: string, dishId: string) => void;

  /** Mark dishes as currently featured (rotation anti-repetition) */
  markFeatured: (dishIds: string[]) => void;

  /**
   * Post-hydration fill: scans all tray items and for any item missing
   * gravy/roti/rice/sides/beverages/dessert, runs applySmartDefaults
   * to populate them. Requires the dishes array to convert Dish → Meal.
   */
  hydrateMissingDefaults: (dishes: Dish[]) => void;
}

// ─── Debounce Registry ───────────────────────────────────────────────────────

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Clear all pending debounce timers — called on logout/HMR to prevent leaks */
export function clearAllDebounceTimers(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
}

/** H2: Get current timer count for debugging */
export function getDebounceTimerCount(): number {
  return debounceTimers.size;
}

// FIX 8: Debounce registry for loop pool changes — prevents 5x rebuild spam
let _loopChangeDebounce: ReturnType<typeof setTimeout> | null = null;
let _pendingPoolChange: { pool: SourcePool; dishes?: Dish[] } | null = null;

/**
 * Debounced loop pool change detector.
 * Batches rapid tray edits into a single queue rebuild (500ms window).
 */
export function scheduleLoopPoolChange(pool: SourcePool, dishes?: Dish[]) {
  if (_loopChangeDebounce) clearTimeout(_loopChangeDebounce);
  _pendingPoolChange = { pool, dishes };
  _loopChangeDebounce = setTimeout(() => {
    if (_pendingPoolChange) {
      useTrayStore.getState().detectLoopPoolChange(_pendingPoolChange.pool, _pendingPoolChange.dishes);
      _pendingPoolChange = null;
    }
  }, 500);
}

// FIX 9: Debug visibility — call from console: getLoopDebugInfo()
export interface LoopDebugInfo {
  configured: boolean;
  cycleLength: number | null;
  queueSize: number;
  nextIndex: number;
  pendingMergeCount: number;
  assignmentsCount: number;
  rotationState: {
    breakfast: { queue: number; pointer: number };
    lunch: { queue: number; pointer: number };
    snacks: { queue: number; pointer: number };
    dinner: { queue: number; pointer: number };
  };
  sourceDishCount: number;
}

export function getLoopDebugInfo(): LoopDebugInfo | null {
  const s = useTrayStore.getState();
  const ml = s.mealLoop;
  if (!ml.config) return null;

  return {
    configured: true,
    cycleLength: ml.config.cycleLength,
    queueSize: ml.rotationQueue.length,
    nextIndex: ml.next_index,
    pendingMergeCount: ml.pendingMerge.length,
    assignmentsCount: ml.assignments.length,
    rotationState: {
      breakfast: { queue: ml.rotationState.breakfast.queue.length, pointer: ml.rotationState.breakfast.pointer },
      lunch: { queue: ml.rotationState.lunch.queue.length, pointer: ml.rotationState.lunch.pointer },
      snacks: { queue: ml.rotationState.snacks.queue.length, pointer: ml.rotationState.snacks.pointer },
      dinner: { queue: ml.rotationState.dinner.queue.length, pointer: ml.rotationState.dinner.pointer },
    },
    sourceDishCount: ml.sourceDishIds.length,
  };
}

// H2: Clear pending timers on tab close — offline queue will retry on next load
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => clearAllDebounceTimers());

  // FIX 5: Expose debug info to browser console — only in development
  if (import.meta.env.DEV) {
    (window as any).getLoopDebugInfo = getLoopDebugInfo;
  }
}

/**
 * Debounce save wrapper (1000ms default).
 * Prevents API spam during rapid inline edits.
 * Each itemId gets its own timer — concurrent edits don't cancel each other.
 * H1: Caller can pass onError callback to handle failures — no more silent console.error.
 */
function debounceSave(key: string, fn: () => Promise<void>, delay = 1000, onError?: (err: unknown) => void) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }
  debounceTimers.set(key, setTimeout(async () => {
    try {
      await fn();
    } catch (err) {
      if (onError) onError(err);
      else console.error('[TrayStore] Save failed:', err);
    } finally {
      debounceTimers.delete(key);
    }
  }, delay));
}

// ─── Factory ─────────────────────────────────────────────────────────────────

const emptyDayMeals = (): DayMeals => ({
  breakfast: [],
  lunch: [],
  snacks: [],
  dinner: [],
});

// M2: nanoid(16) — collision risk drops to ~1% at 1.8B items (vs 85M for 10 chars)
const uid = () => `item_${nanoid(16)}`;

export const useTrayStore = create<TrayStore>()(
  persist(
    (set, get) => ({
      plan: { period: 'week', days: {} },
      guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
      swapHistory: [],
      saveStatus: {},
      templates: [],
      completions: {},
      skipped: {},
      lastFeaturedTimes: {},
      mealLoop: EMPTY_LOOP_STATE,

      setPeriod: (period) => set((s) => ({ plan: { ...s.plan, period } })),

      // ─── Template Save ──────────────────────────────────────────────────
      saveTemplate: (name, slotConfigs, period, isDraft = false) => {
        const now = new Date().toISOString();
        const existing = get().templates.filter(t => t.name === name);
        const version = existing.length > 0 ? Math.max(...existing.map(t => t.version)) + 1 : 1;
        const template: SavedTemplate = {
          id: nanoid(12),
          name,
          version,
          slotConfigs,
          period,
          isDraft,
          createdAt: existing.length === 0 ? now : existing[0]!.createdAt,
          updatedAt: now,
        };
        set((s) => ({ templates: [...s.templates, template] }));
        return template.id;
      },

      loadTemplate: (id) => {
        const template = get().templates.find(t => t.id === id);
        if (!template) return null;
        return { slotConfigs: template.slotConfigs, period: template.period };
      },

      deleteTemplate: (id) => {
        set((s) => ({ templates: s.templates.filter(t => t.id !== id) }));
      },

      // ─── Add Meal ───────────────────────────────────────────────────────
      /**
       * Add meal to slot with smart defaults.
       * 1. Calls applySmartDefaults(meal, mealType) for initial chip state
       * 2. Spreads defaults into new TrayItem
       * 3. Applies any overrides (quantity, servings, etc.)
       * 4. Optimistic update → debounce PATCH → offline queue
       */
       addMealToSlot: (date, mealType, meal, overrides) => {
         // Call helper to get defaults from meal metadata + slot context
         const defaults = applySmartDefaults(meal, mealType, undefined, { useSmartSuggestions: true });

         // Auto-add ONLY culturally relevant accompaniments (emoji items) to pantry staples
         // Skip meal components like roti, rice, standard beverages/desserts
         const EMOJI_ACCOMPANIMENTS = /[\u{1F300}-\u{1F9FF}]/u;
         const pantryAccompaniments = defaults.sides.filter(s => EMOJI_ACCOMPANIMENTS.test(s));
         if (pantryAccompaniments.length > 0) {
           useStore.getState().addToPantry(pantryAccompaniments);
         }

         const timeDef = getTimeDef(mealType);
        const embeddedCarb = defaults.roti ?? defaults.rice ?? undefined;
        const autoTitle = overrides?.title ?? generateMealTitle(meal.name, defaults.sides, defaults.beverages, embeddedCarb);
        const newItem: TrayItem = {
          id: uid(),
          meal_id: meal.id,
          name: meal.name,
          title: autoTitle,
          icon: meal.icon,
          quantity: overrides?.quantity ?? 1,
          servings: overrides?.servings ?? 1,
          smartVersion: 1,
          // Smart defaults from helper
          gravy: defaults.gravy,
          roti: defaults.roti,
          rice: defaults.rice,
          sides: defaults.sides,
          beverages: defaults.beverages,
          dessert: defaults.dessert,
          itemQtys: defaults.itemQtys,
          // Resolve style from dish metadata (meal.id)
          style: getDishStyle(meal.id),
          // Preserve variant/style from overrides if caller enriched the Meal with dish metadata
          variant: overrides?.variant,
          variantId: overrides?.variantId,
          addon: overrides?.addon,
          // Default time window for this slot type
          start_time: overrides?.start_time || timeDef.start,
          end_time: overrides?.end_time || timeDef.end,
          // Mark as user-added so autoFillLoop won't overwrite it
          source: 'user',
        };

        // Optimistic update (with dedup: same meal_id → increment quantity + merge sides)
        set((s) => {
          const day = s.plan.days[date] || emptyDayMeals();
          const existing = day[mealType].find(m => m.meal_id === newItem.meal_id);
          if (existing) {
            return {
              plan: {
                ...s.plan,
                days: { ...s.plan.days, [date]: { ...day, [mealType]: day[mealType].map(m =>
                  m.id === existing.id ? {
                    ...m,
                    quantity: (m.quantity || 1) + (newItem.quantity || 1),
                    sides: [...new Set([...(m.sides || []), ...(newItem.sides || [])])],
                    variant: newItem.variant || m.variant,
                    variantId: newItem.variantId || m.variantId,
                    addon: newItem.addon || m.addon,
                  } : m
                ) } },
              },
              saveStatus: s.saveStatus,
            };
          }
          return {
            plan: {
              ...s.plan,
              days: { ...s.plan.days, [date]: { ...day, [mealType]: [...day[mealType], newItem] } },
            },
            saveStatus: { ...s.saveStatus, [newItem.id]: 'saving' },
          };
        });

        // Queue for offline
        offlineQueue.add({
          type: 'add',
          payload: {
            date,
            mealType,
            item: {
              meal_id: newItem.meal_id,
              name: newItem.name,
              icon: newItem.icon,
              quantity: newItem.quantity,
              servings: newItem.servings,
              gravy: newItem.gravy,
              roti: newItem.roti,
              rice: newItem.rice,
              sides: newItem.sides,
              beverages: newItem.beverages,
              dessert: newItem.dessert,
            },
          },
        });

        // Debounce PATCH
        debounceSave(`add_${newItem.id}`, async () => {
          if (!navigator.onLine) return;
          try {
            await trayApi.addSlotItem(`${date}::${mealType}`, {
              meal_id: newItem.meal_id,
              quantity: newItem.quantity,
              defaults: {
                name: newItem.name,
                icon: newItem.icon,
                gravy: newItem.gravy,
                roti: newItem.roti,
                rice: newItem.rice,
                sides: newItem.sides,
                beverages: newItem.beverages,
                dessert: newItem.dessert,
              },
            });
            set((s) => ({ saveStatus: { ...s.saveStatus, [newItem.id]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [newItem.id]: 'error' } }));
          }
        });

        // Sync to tray library so Profile summary is accurate
        // Guard: only sync if useStore has hydrated (user exists)
        const storeState = useStore.getState();
        if (storeState.user) {
          storeState.addToTray(mealType, {
            id: meal.id,
            dishId: meal.id,
            name: meal.name,
            icon: meal.icon,
            sourceRegion: meal.region,
          });
        }

        window.dispatchEvent(new Event('pantry:invalidate'));
      },

      // ─── Swap Meal (Inline) ─────────────────────────────────────────────
      /**
       * Swap meal inline with smart defaults reset.
       * 1. Preserves quantity/servings from existing item
       * 2. Calls applySmartDefaults(newMeal, mealType) for NEW defaults
       * 3. Replaces meal_id/name/icon + resets chips
       * 4. Debounce PATCH → offline queue → revert on error
       */
       swapMealInSlot: (date, mealType, itemId, newMeal) => {
        let oldMealId = '';
        let oldName = '';
        let oldIcon: string | undefined;
        let oldQuantity = 1;
        let oldServings = 1;
        let oldGravy: string | null | undefined;
        let oldRoti: string | null | undefined;
        let oldRice: string | null | undefined;
        let oldSides: string[] = [];
        let oldBeverages: string[] = [];
        let oldDessert: string[] | undefined;
        let oldVariant: string | undefined;
        let oldVariantId: string | undefined;
        let oldAddon: string | undefined;
        let oldStyle: string | undefined;
        let oldItemQtys: Record<string, number> | undefined;
        let oldStartTime: string | undefined;
        let oldEndTime: string | undefined;

        set((s) => {
          const day = s.plan.days[date];
          if (!day) return s;
          const items = day[mealType];
          const target = items.find(i => i.id === itemId);
          if (!target) return s;
          oldMealId = target.meal_id;
          oldName = target.name;
          oldIcon = target.icon;
          oldQuantity = target.quantity;
          oldServings = target.servings;
          oldGravy = target.gravy;
          oldRoti = target.roti;
          oldRice = target.rice;
          oldSides = target.sides || [];
          oldBeverages = target.beverages || [];
          oldDessert = target.dessert;
          oldVariant = target.variant;
          oldVariantId = target.variantId;
          oldAddon = target.addon;
          oldStyle = target.style;
          oldItemQtys = target.itemQtys;
          oldStartTime = target.start_time;
          oldEndTime = target.end_time;

          // Call helper with NEW meal + slot context for fresh defaults
          const defaults = applySmartDefaults(newMeal, mealType, undefined, { useSmartSuggestions: true });
          const timeDef = getTimeDef(mealType);
          const swapCarb = defaults.roti ?? defaults.rice ?? undefined;
          const swapTitle = generateMealTitle(newMeal.name, defaults.sides, defaults.beverages, swapCarb);

          const updatedItems = items.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  meal_id: newMeal.id,
                  name: newMeal.name,
                  title: swapTitle,
                  icon: newMeal.icon,
                  smartVersion: 1,
                  style: getDishStyle(newMeal.id),
                  // Reset chips to NEW meal's smart defaults
                  gravy: defaults.gravy,
                  roti: defaults.roti,
                  rice: defaults.rice,
                  sides: defaults.sides,
                  beverages: defaults.beverages,
                  dessert: defaults.dessert,
                  itemQtys: defaults.itemQtys,
                  // Preserve custom time window, fall back to slot default
                  start_time: item.start_time || timeDef.start,
                  end_time: item.end_time || timeDef.end,
                }
              : item
          );

          return {
            plan: { ...s.plan, days: { ...s.plan.days, [date]: { ...day, [mealType]: updatedItems } } },
            saveStatus: { ...s.saveStatus, [itemId]: 'saving' },
            swapHistory: [
              {
                id: `swap_${nanoid(12)}`,
                date,
                mealType,
                itemId,
                oldMealId,
                newMealId: newMeal.id,
                timestamp: Date.now(),
                // C1: Store full old item state for complete undo
                oldItemState: {
                  meal_id: oldMealId,
                  name: oldName,
                  icon: oldIcon,
                  quantity: oldQuantity,
                  servings: oldServings,
                  gravy: oldGravy,
                  roti: oldRoti,
                  rice: oldRice,
                  sides: oldSides,
                  beverages: oldBeverages,
                  dessert: oldDessert,
                  variant: oldVariant,
                  variantId: oldVariantId,
                  addon: oldAddon,
                  style: oldStyle,
                  itemQtys: oldItemQtys,
                  start_time: oldStartTime,
                  end_time: oldEndTime,
                },
              },
              ...s.swapHistory.slice(0, 9),
            ],
          };
        });

        // FIX 1: Sync swap to loop queue — replace oldDishId with newDishId
        set((s) => {
          const ml = s.mealLoop;
          if (!ml.config) return s;

          const updatedQueue = ml.rotationQueue.map(item =>
            item.dishId === oldMealId ? { ...item, dishId: newMeal.id } : item
          );
          const updatedAssignments = ml.assignments.map(a =>
            a.dishId === oldMealId ? { ...a, dishId: newMeal.id, dishName: newMeal.name } : a
          );
          const updatedSourceIds = ml.sourceDishIds.map(id =>
            id === oldMealId ? newMeal.id : id
          );

          return {
            mealLoop: {
              ...ml,
              rotationQueue: updatedQueue,
              assignments: updatedAssignments,
              sourceDishIds: updatedSourceIds,
            },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // Queue with defaults for replay
        offlineQueue.add({
          type: 'swap',
          payload: { date, mealType, itemId, newMealId: newMeal.id, oldMealId },
        });

        // Debounce PATCH — sends new defaults server-side
        debounceSave(`swap_${itemId}`, async () => {
          if (!navigator.onLine) return;
          try {
            // Re-read defaults from state for PATCH payload
            const state = get();
            const day = state.plan.days[date];
            const items = day?.[mealType];
            const target = items?.find(i => i.id === itemId);

            await trayApi.updateItem(itemId, {
              meal_id: newMeal.id,
              name: newMeal.name,
              gravy: target?.gravy ?? undefined,
              roti: target?.roti ?? undefined,
              rice: target?.rice ?? undefined,
              sides: target?.sides,
              beverages: target?.beverages,
              dessert: target?.dessert,
              quantity: oldQuantity,
            });
            set((s) => ({ saveStatus: { ...s.saveStatus, [itemId]: 'saved' } }));
          } catch {
            // Revert on error — restore ALL old values, not just meal_id/name/icon
            set((s) => {
              const day = s.plan.days[date];
              if (!day) return s;
              const items = day[mealType];
              const updatedItems = items.map(item =>
                item.id === itemId ? {
                  ...item,
                  meal_id: oldMealId,
                  name: oldName,
                  icon: oldIcon,
                  quantity: oldQuantity,
                  servings: oldServings,
                  gravy: oldGravy,
                  roti: oldRoti,
                  rice: oldRice,
                  sides: oldSides,
                  beverages: oldBeverages,
                  dessert: oldDessert,
                  variant: oldVariant,
                  variantId: oldVariantId,
                  addon: oldAddon,
                  style: oldStyle,
                  itemQtys: oldItemQtys,
                  start_time: oldStartTime,
                  end_time: oldEndTime,
                } : item
              );
              return {
                plan: { ...s.plan, days: { ...s.plan.days, [date]: { ...day, [mealType]: updatedItems } } },
                saveStatus: { ...s.saveStatus, [itemId]: 'error' },
              };
            });
          }
        });
      },

      // ─── Inline Update (Debounced 1000ms) ───────────────────────────────
      updateItemInline: (date, mealType, itemId, updates) => {
        set((s) => {
          const day = s.plan.days[date];
          if (!day) return s;
          const items = day[mealType];
          const updatedItems = items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          );
          return {
            plan: { ...s.plan, days: { ...s.plan.days, [date]: { ...day, [mealType]: updatedItems } } },
            saveStatus: { ...s.saveStatus, [itemId]: 'saving' },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // Queue
        offlineQueue.add({ type: 'update', payload: { date, mealType, itemId, updates } });

        // Debounce PATCH (1000ms)
        debounceSave(`update_${itemId}`, async () => {
          if (!navigator.onLine) return;
          try {
            await trayApi.updateItem(itemId, {
              quantity: updates.quantity,
              gravy: updates.gravy ?? undefined,
              roti: updates.roti ?? undefined,
              rice: updates.rice ?? undefined,
              sides: updates.sides,
              beverages: updates.beverages,
              dessert: updates.dessert,
              servings: updates.servings,
            });
            set((s) => ({ saveStatus: { ...s.saveStatus, [itemId]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [itemId]: 'error' } }));
          }
        });
      },

      // ─── Batch Update (H12: single store transaction for N items) ───────
      batchUpdateItems: (date, mealType, itemUpdates) => {
        if (itemUpdates.length === 0) return;

        // Single store update for all items
        set((s) => {
          const day = s.plan.days[date];
          if (!day) return s;
          const items = day[mealType];
          const updateMap = new Map(itemUpdates.map(u => [u.itemId, u.updates]));
          const updatedItems = items.map(item => {
            const updates = updateMap.get(item.id);
            return updates ? { ...item, ...updates } : item;
          });
          const newStatus = { ...s.saveStatus };
          for (const u of itemUpdates) {
            newStatus[u.itemId] = 'saving';
          }
          return {
            plan: { ...s.plan, days: { ...s.plan.days, [date]: { ...day, [mealType]: updatedItems } } },
            saveStatus: newStatus,
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // Queue all updates
        for (const u of itemUpdates) {
          offlineQueue.add({ type: 'update', payload: { date, mealType, itemId: u.itemId, updates: u.updates } });
        }

        // Single debounce save for the entire batch
        debounceSave(`batch_update_${date}_${mealType}`, async () => {
          if (!navigator.onLine) return;
          try {
            // Update each item via API
            await Promise.all(itemUpdates.map(u =>
              trayApi.updateItem(u.itemId, {
                quantity: u.updates.quantity,
                gravy: u.updates.gravy ?? undefined,
                roti: u.updates.roti ?? undefined,
                rice: u.updates.rice ?? undefined,
                sides: u.updates.sides,
                beverages: u.updates.beverages,
                dessert: u.updates.dessert,
                servings: u.updates.servings,
              })
            ));
            set((s) => {
              const newStatus = { ...s.saveStatus };
              for (const u of itemUpdates) {
                newStatus[u.itemId] = 'saved';
              }
              return { saveStatus: newStatus };
            });
          } catch {
            set((s) => {
              const newStatus = { ...s.saveStatus };
              for (const u of itemUpdates) {
                newStatus[u.itemId] = 'error';
              }
              return { saveStatus: newStatus };
            });
          }
        });
      },

      // ─── Remove Meal ────────────────────────────────────────────────────
      removeMealFromSlot: (date, mealType, itemId) => {
        set((s) => {
          const day = s.plan.days[date];
          if (!day) return s;
          const items = day[mealType];
          const removedItem = items.find(i => i.id === itemId);
          const removedDishId = removedItem?.meal_id;

          // FIX 2: Clean up pendingMerge and rotationQueue if dish was deleted
          const cleanPending = removedDishId
            ? s.mealLoop.pendingMerge.filter(item => item.dishId !== removedDishId)
            : s.mealLoop.pendingMerge;
          const cleanQueue = removedDishId
            ? s.mealLoop.rotationQueue.filter(item => item.dishId !== removedDishId)
            : s.mealLoop.rotationQueue;

          // FIX 1: Adjust pointers to prevent drift on deletion
          const adjustPointer = (queue: string[], pointer: number) => {
            if (!removedDishId) return pointer;
            const idx = queue.indexOf(removedDishId);
            // If deleted item was before pointer, shift pointer back
            return idx !== -1 && idx < pointer ? Math.max(0, pointer - 1) : pointer;
          };

          const cleanQueueSlot = (q: string[]) => q.filter(id => id !== removedDishId);

          const newRotationState = removedDishId ? {
            breakfast: {
              queue: cleanQueueSlot(s.mealLoop.rotationState.breakfast.queue),
              pointer: adjustPointer(s.mealLoop.rotationState.breakfast.queue, s.mealLoop.rotationState.breakfast.pointer),
            },
            lunch: {
              queue: cleanQueueSlot(s.mealLoop.rotationState.lunch.queue),
              pointer: adjustPointer(s.mealLoop.rotationState.lunch.queue, s.mealLoop.rotationState.lunch.pointer),
            },
            snacks: {
              queue: cleanQueueSlot(s.mealLoop.rotationState.snacks.queue),
              pointer: adjustPointer(s.mealLoop.rotationState.snacks.queue, s.mealLoop.rotationState.snacks.pointer),
            },
            dinner: {
              queue: cleanQueueSlot(s.mealLoop.rotationState.dinner.queue),
              pointer: adjustPointer(s.mealLoop.rotationState.dinner.queue, s.mealLoop.rotationState.dinner.pointer),
            },
          } : s.mealLoop.rotationState;

          // Adjust next_index for flat rotationQueue
          const deletedFlatIndex = removedDishId ? s.mealLoop.rotationQueue.findIndex(i => i.dishId === removedDishId) : -1;
          const newNextIndex = deletedFlatIndex !== -1 && deletedFlatIndex < s.mealLoop.next_index
            ? Math.max(0, s.mealLoop.next_index - 1)
            : s.mealLoop.next_index;

          // FIX 1 (partial): Clean stale assignments from future plan days
          const cleanedDays = { ...s.plan.days };
          if (removedDishId) {
            for (const [d, dayMeals] of Object.entries(cleanedDays)) {
              if (d <= date) continue; // Only clean future dates
              const newDay = { ...dayMeals };
              for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                newDay[mt] = newDay[mt].filter(item => item.meal_id !== removedDishId);
              }
              cleanedDays[d] = newDay;
            }
          }

          return {
            plan: { ...s.plan, days: { ...cleanedDays, [date]: { ...day, [mealType]: items.filter(i => i.id !== itemId) } } },
            saveStatus: { ...s.saveStatus, [itemId]: 'saving' },
            mealLoop: {
              ...s.mealLoop,
              pendingMerge: cleanPending,
              rotationQueue: cleanQueue,
              next_index: newNextIndex,
              rotationState: newRotationState,
            },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // C4: Queue for offline retry — ensures delete is retried if immediate fails
        offlineQueue.add({ type: 'remove', payload: { date, mealType, itemId } });

        // Immediate DELETE (no debounce)
        if (navigator.onLine) {
          trayApi.removeItem(itemId)
            .then(() => set((s) => ({ saveStatus: { ...s.saveStatus, [itemId]: 'saved' } })))
            .catch(() => {
              // DELETE failed — offline queue will retry on next drain
              set((s) => ({ saveStatus: { ...s.saveStatus, [itemId]: 'error' } }));
            });
        }
      },

      // ─── Guest Mode ─────────────────────────────────────────────────────
      setGuestMode: (guestMode) => {
        set((s) => ({ guestMode: { ...s.guestMode, ...guestMode } }));
        if (guestMode.startDate && guestMode.endDate && guestMode.extraServings) {
          trayApi.setGuestMode({
            start: guestMode.startDate,
            end: guestMode.endDate,
            extra_servings: guestMode.extraServings,
          }).catch(console.error);
        }
      },

      // ─── Undo Last Swap ─────────────────────────────────────────────────
      undoSwap: () => {
        set((s) => {
          const lastSwap = s.swapHistory[0];
          if (!lastSwap) return s;
          const day = s.plan.days[lastSwap.date];
          if (!day) return s;
          const items = day[lastSwap.mealType];
          const target = items.find(i => i.id === lastSwap.itemId);
          if (!target) return s;

          // C1: Restore full old item state if available, fallback to just meal_id
          const oldState = lastSwap.oldItemState;
          const updatedItems = items.map(item =>
            item.id === lastSwap.itemId
              ? oldState
                ? { ...item, ...oldState }
                : { ...item, meal_id: lastSwap.oldMealId }
              : item
          );

          return {
            plan: { ...s.plan, days: { ...s.plan.days, [lastSwap.date]: { ...day, [lastSwap.mealType]: updatedItems } } },
            swapHistory: s.swapHistory.slice(1),
          };
        });
      },

      // ─── Getters ────────────────────────────────────────────────────────
      getMeals: (date, mealType) => {
        return get().plan.days[date]?.[mealType] || [];
      },

      getDayMeals: (date) => {
        return get().plan.days[date] || emptyDayMeals();
      },

      /** Fill all days in the period with rotation (5-day gap) + anti-repetition (30-day preference) */
      fillPlan: (period: 'week' | 'biweek' | 'month') => {
        // H8: Use IST (Asia/Kolkata) for all date computation — consistent for Indian users
        const today = getISODate();
        const todayDay = get().plan.days[today];
        if (!todayDay) return;

        const dayCount = period === 'week' ? 7 : period === 'biweek' ? 14 : 30;
        const types: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
        const days: Record<string, DayMeals> = {};

        // Build last-served index from existing plan days
        const lastServed = new Map<string, string>();
        const existingDays = get().plan.days;
        for (const [dateStr, dayMeals] of Object.entries(existingDays)) {
          for (const mt of types) {
            for (const item of dayMeals[mt]) {
              const existing = lastServed.get(item.meal_id);
              if (!existing || dateStr > existing) {
                lastServed.set(item.meal_id, dateStr);
              }
            }
          }
        }

        for (let i = 1; i <= dayCount; i++) {
          const iso = addDaysISO(today, i);
          if (iso === today) continue;

          const day: DayMeals = emptyDayMeals();
          for (const mt of types) {
            const meals = todayDay[mt];
            if (meals.length === 0) continue;

            const itemsPerDay = meals.length;

            // Score candidates: prefer dishes not served in last 5 days (rotation gap),
            // then prioritize by longest-neglected (anti-repetition).
            const scored = meals.map(meal => {
              const lastDate = lastServed.get(meal.meal_id);
              const gap = lastDate ? daysBetweenISO(lastDate, iso) : 999;
              return { meal, gap };
            });

            // Use candidates with gap >= 5 (rotation gap); fall back to all if not enough
            const eligible = scored.filter(s => s.gap >= 5);
            const pool = eligible.length >= itemsPerDay ? eligible : scored;

            // Sort pool: most-neglected first (smallest gap = most recent, so sort desc)
            pool.sort((a, b) => b.gap - a.gap);

            const selected = pool.slice(0, itemsPerDay);
            for (let j = 0; j < selected.length; j++) {
              day[mt].push({
                ...selected[j]!.meal,
                // C3: Use uid() (nanoid-based) to prevent ID collisions
                id: uid(),
              });
              lastServed.set(selected[j]!.meal.meal_id, iso);
            }
          }
          days[iso] = day;
        }

        set((s) => ({
          plan: { ...s.plan, days: { ...s.plan.days, ...days } },
        }));
      },

      // ─── Sync Offline Queue ─────────────────────────────────────────────
      syncOfflineQueue: async () => {
        set({ saveStatus: {} });
        const result = await offlineQueue.drain();
        return result;
      },

      clearSaveStatus: (itemId) => {
        set((s) => {
          const newStatus = { ...s.saveStatus };
          delete newStatus[itemId];
          return { saveStatus: newStatus };
        });
      },

      // ─── Complete / Undo Slot ─────────────────────────────────────────
      completeSlot: (date, mealType) => {
        const key = `${date}::${mealType}`;
        set((s) => ({
          completions: { ...s.completions, [key]: Date.now() },
          saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'saving' },
        }));
        debounceSave(`complete_${key}`, async () => {
          if (!navigator.onLine) return;
          try {
            await trayApi.completeSlot(date, mealType);
            set((s) => ({ saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'error' } }));
          }
        });
      },

      undoCompleteSlot: (date, mealType) => {
        const key = `${date}::${mealType}`;
        set((s) => {
          const next = { ...s.completions };
          delete next[key];
          const status = { ...s.saveStatus };
          delete status[`complete:${key}`];
          return { completions: next, saveStatus: status };
        });
      },

      // ─── Skip / Undo Skip ──────────────────────────────────────────────
      skipSlot: (date, mealType) => {
        const key = `${date}::${mealType}`;
        set((s) => {
          // FIX 3: Track skipped dishes in analytics
          const loopAssignment = s.mealLoop.assignments.find(a => a.date === date && a.mealType === mealType);
          const newAnalytics = loopAssignment
            ? { ...s.mealLoop.analytics, dishesSkipped: s.mealLoop.analytics.dishesSkipped + 1 }
            : s.mealLoop.analytics;

          return {
            skipped: { ...s.skipped, [key]: Date.now() },
            saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'saving' },
            mealLoop: { ...s.mealLoop, analytics: newAnalytics },
          };
        });
        debounceSave(`skip_${key}`, async () => {
          if (!navigator.onLine) return;
          try {
            await trayApi.skipSlot(date, mealType);
            set((s) => ({ saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'error' } }));
          }
        });
      },

      undoSkipSlot: (date, mealType) => {
        const key = `${date}::${mealType}`;
        set((s) => {
          const next = { ...s.skipped };
          delete next[key];
          const status = { ...s.saveStatus };
          delete status[`skip:${key}`];
          return { skipped: next, saveStatus: status };
        });
      },

      // ─── Meal Loop ──────────────────────────────────────────────────────
      setMealLoop: (config, sourceDishIds, assignments) => {
        set((s) => ({
          mealLoop: {
            ...s.mealLoop,
            config,
            sourceDishIds,
            assignments,
            overrides: s.mealLoop.overrides,
            rotationState: s.mealLoop.rotationState,
          },
        }));
      },

      applyLoopConfig: (config, pool, dishes) => {
        const { queue, assignments: loopAssignments } = buildAssignments(pool, config, dishes);
        const rotationState = buildRotationState(pool, dishes);

        // Build plan days from loop assignments
        const newDays: Record<string, DayMeals> = {};
        for (const a of loopAssignments) {
          const date = a.date;
          const mealType = a.mealType;
          if (!newDays[date]) {
            newDays[date] = emptyDayMeals();
          }
          if (dishes) {
            const dish = dishes.find(d => d.id === a.dishId);
            if (dish) {
              const meal = dishToMeal(dish);
              const defaults = applySmartDefaults(meal, mealType, undefined, { useSmartSuggestions: true });
              const timeDef = getTimeDef(mealType);
              const loopCarb = defaults.roti ?? defaults.rice ?? undefined;
              const loopTitle = generateMealTitle(meal.name, defaults.sides, defaults.beverages, loopCarb);
              newDays[date][mealType].push({
                id: uid(),
                meal_id: meal.id,
                name: meal.name,
                title: loopTitle,
                icon: meal.icon,
                quantity: 1,
                servings: 1,
                smartVersion: 1,
                style: getDishStyle(meal.id),
                gravy: defaults.gravy,
                roti: defaults.roti,
                rice: defaults.rice,
                sides: defaults.sides,
                beverages: defaults.beverages,
                dessert: defaults.dessert,
                itemQtys: defaults.itemQtys,
                start_time: timeDef.start,
                end_time: timeDef.end,
                source: 'loop',
              });
            }
          }
        }

        set((s) => {
          // Remove stale loop dates from plan before merging new ones
          // FIX 4: Never overwrite user-source meals — only clean loop-source or empty slots
          const oldLoopDates = new Set(s.mealLoop.assignments.map(a => a.date));
          const cleanedDays: Record<string, DayMeals> = {};

          for (const [date, dayMeals] of Object.entries(s.plan.days)) {
            const newDay: DayMeals = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            let hasAnyItems = false;

            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
              const keptItems = dayMeals[mt].filter(item => {
                // Keep user-source meals always
                if (item.source === 'user') return true;
                // Keep suggestion-source meals
                if (item.source === 'suggestion') return true;
                // Remove loop-source meals only if they're from old loop dates being replaced
                if (item.source === 'loop' && oldLoopDates.has(date)) return false;
                // Keep everything else (undefined source = legacy, treat as user)
                return true;
              });
              newDay[mt] = keptItems;
              if (keptItems.length > 0) hasAnyItems = true;
            }

            // Only keep the day if it has items or is in newDays
            if (hasAnyItems || newDays[date]) {
              cleanedDays[date] = newDay;
            }
          }

          return {
            mealLoop: {
              config,
              sourceDishIds: Object.values(pool).flat().map((d: Dish) => d.id),
              pool_version: 1,
              rotationQueue: queue,
              next_index: Math.min(loopAssignments.length, queue.length),
              pendingMerge: [],
              assignments: loopAssignments,
              overrides: s.mealLoop.overrides,
              rotationState,
              // FIX 3: Push current state to undo stack (max 5 levels)
              // FIX 6: Lightweight undo — don't store assignments, regenerate on undo
              undoStack: s.mealLoop.config
                ? [{
                    config: s.mealLoop.config,
                    sourceDishIds: s.mealLoop.sourceDishIds,
                    rotationQueue: s.mealLoop.rotationQueue,
                    rotationState: s.mealLoop.rotationState,
                    analytics: s.mealLoop.analytics,
                  }, ...s.mealLoop.undoStack].slice(0, 5)
                : s.mealLoop.undoStack,
              // FIX 9: Update analytics
              analytics: {
                ...s.mealLoop.analytics,
                cyclesCompleted: s.mealLoop.analytics.cyclesCompleted + 1,
                mealsAutoFilled: s.mealLoop.analytics.mealsAutoFilled + loopAssignments.length,
              },
              // Preserve rate limit flags
              refreshing: s.mealLoop.refreshing,
              lastRefreshStart: s.mealLoop.lastRefreshStart,
            },
            plan: {
              ...s.plan,
              days: { ...cleanedDays, ...newDays },
            },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // FIX 10: Queue loop changes for offline sync
        const sourceDishIds = Object.values(pool).flat().map((d: Dish) => d.id);
        offlineQueue.add({
          type: 'loop_save',
          payload: { config, sourceDishIds, assignments: loopAssignments },
        });
      },

      detectLoopPoolChange: (pool, dishes) => {
        set((s) => {
          const oldIds = s.mealLoop.sourceDishIds;
          const newIds = Object.values(pool).flat().map((d: Dish) => d.id);
          const oldSet = new Set(oldIds);
          const newSet = new Set(newIds);
          // Symmetric change detection: react to both additions AND removals
          const hasChanges =
            newIds.some(id => !oldSet.has(id)) ||
            oldIds.some(id => !newSet.has(id));
          if (!hasChanges) return s;
          const cfg = s.mealLoop.config;
          if (!cfg) return s;
          const result = handleMidCycleAdd(
            oldIds, newIds, pool, cfg,
            s.mealLoop.rotationQueue, s.mealLoop.next_index,
            s.mealLoop.assignments, dishes,
          );

          // FIX 1: Toast — tell user what happened with new dishes + when they'll appear
          const addedIds = newIds.filter(id => !oldSet.has(id));
          if (addedIds.length > 0 && dishes) {
            const addedNames = addedIds.map(id => dishes.find(d => d.id === id)?.name ?? id).join(', ');
            const strategyLabels: Record<string, string> = {
              append: 'end of line',
              'smart-shuffle': 'soon',
              immediate: 'next up',
              'next-cycle': 'next cycle',
            };
            const where = strategyLabels[cfg.insertStrategy] ?? 'soon';

            // Find the next assignment date for the first added dish
            const firstAdded = addedIds[0];
            const nextAssignment = result.assignments.find(a => a.dishId === firstAdded);
            const dateHint = nextAssignment
              ? ` on ${new Date(nextAssignment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
              : '';

            get().setToast({ message: `🍽️ ${addedNames} added — will appear ${where}${dateHint}`, type: 'success' });
          }

          // FIX 3: Clamp rotationState pointers to new queue lengths (prevent drift)
          const buildPerSlotQueues = (queue: typeof s.mealLoop.rotationQueue) => {
            const perSlot: Record<MealType, string[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            for (const item of queue) {
              const dish = dishes?.find(d => d.id === item.dishId);
              if (dish) {
                const meal = dishToMeal(dish);
                const mt = meal.slot as MealType;
                if (perSlot[mt]) perSlot[mt].push(item.dishId);
              }
            }
            return perSlot;
          };

          const newPerSlot = buildPerSlotQueues(result.queue);
          const clampedRotationState = {
            breakfast: { queue: newPerSlot.breakfast, pointer: Math.min(s.mealLoop.rotationState.breakfast.pointer, newPerSlot.breakfast.length) },
            lunch: { queue: newPerSlot.lunch, pointer: Math.min(s.mealLoop.rotationState.lunch.pointer, newPerSlot.lunch.length) },
            snacks: { queue: newPerSlot.snacks, pointer: Math.min(s.mealLoop.rotationState.snacks.pointer, newPerSlot.snacks.length) },
            dinner: { queue: newPerSlot.dinner, pointer: Math.min(s.mealLoop.rotationState.dinner.pointer, newPerSlot.dinner.length) },
          };

          return {
            mealLoop: {
              ...s.mealLoop,
              sourceDishIds: newIds,
              pool_version: result.pool_version,
              rotationQueue: result.queue,
              pendingMerge: result.pendingMerge,
              assignments: result.assignments,
              next_index: Math.min(result.assignments.length, result.queue.length),
              rotationState: clampedRotationState,
            },
          };
        });
      },

      clearMealLoop: () => {
        set(() => ({ mealLoop: EMPTY_LOOP_STATE }));
      },

      // FIX 3: Undo loop config change — restores from undo stack
      undoLoopChange: () => {
        // FIX 3: Haptic feedback for critical mobile action
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }

        set((s) => {
          const prev = s.mealLoop.undoStack[0];
          if (!prev) return s;

          // FIX 6: Regenerate assignments from restored config + rotationState
          const cfg = prev.config;
          if (!cfg) {
            get().setToast({ message: '↩️ Loop settings restored.', type: 'info' });
            return {
              mealLoop: {
                ...s.mealLoop,
                config: null,
                sourceDishIds: prev.sourceDishIds,
                rotationQueue: prev.rotationQueue,
                assignments: [],
                rotationState: prev.rotationState,
                analytics: prev.analytics,
                undoStack: s.mealLoop.undoStack.slice(1),
              },
            };
          }

          const loopEndDate = new Date(cfg.startDate);
          loopEndDate.setDate(loopEndDate.getDate() + cfg.cycleLength * 7);
          const loopEndStr = getISODate(loopEndDate);

          // Collect existing non-loop items in the loop window
          const existingItems: Array<{ date: string; mealType: MealType; source?: string }> = [];
          for (const [date, day] of Object.entries(s.plan.days)) {
            if (date < cfg.startDate || date > loopEndStr) continue;
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
              for (const item of day[mt]) {
                existingItems.push({ date, mealType: mt, source: item.source });
              }
            }
          }

          const result = autoFillLoopEngine(cfg, prev.rotationState, existingItems);

          // FIX 5: Handle regeneration failure — fallback to previous assignments
          if (result.assignments.length === 0 && s.mealLoop.assignments.length > 0) {
            get().setToast({ message: '⚠️ Could not regenerate loop assignments. Keeping current state.', type: 'error' });
            return s;
          }

          get().setToast({ message: '↩️ Loop settings restored to previous version.', type: 'info' });

          return {
            mealLoop: {
              ...s.mealLoop,
              config: prev.config,
              sourceDishIds: prev.sourceDishIds,
              rotationQueue: prev.rotationQueue,
              assignments: result.assignments,
              rotationState: result.rotationState,
              analytics: prev.analytics,
              undoStack: s.mealLoop.undoStack.slice(1),
            },
          };
        });
      },

      refreshLoop: (dishes) => {
        // FIX 3: Haptic feedback for critical mobile action
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }

        set((s) => {
          // FIX 4: Rate limit — prevent spam during rebuild
          if (s.mealLoop.refreshing) {
            get().setToast({ message: '⏳ Loop is already refreshing. Please wait.', type: 'info' });
            return s;
          }

          const cfg = s.mealLoop.config;
          if (!cfg) return s;

          // FIX 2: Process pendingMerge — items added mid-cycle are merged into rotation queue on refresh
          let mergedRotationState = s.mealLoop.rotationState;
          if (s.mealLoop.pendingMerge.length > 0) {
            const mergedResult = buildRotationStateWithMerge(s.mealLoop.rotationState, s.mealLoop.pendingMerge);
            mergedRotationState = mergedResult;
          }

          // FIX 10: Detect empty rotationState queues and bail gracefully
          const totalQueueSize =
            mergedRotationState.breakfast.queue.length +
            mergedRotationState.lunch.queue.length +
            mergedRotationState.snacks.queue.length +
            mergedRotationState.dinner.queue.length;
          if (totalQueueSize === 0) {
            get().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
            return s;
          }

          // Mark as refreshing
          s.mealLoop.refreshing = true;
          s.mealLoop.lastRefreshStart = Date.now();

          // Rebuild assignments from current rotationState
          // FIX 4: Only scan dates within the loop's cycle window, not all 365 plan days
          const loopStartDate = new Date(cfg.startDate);
          const loopEndDate = new Date(loopStartDate);
          loopEndDate.setDate(loopEndDate.getDate() + cfg.cycleLength * 7);
          const loopEndStr = getISODate(loopEndDate);

          const existingItems: Array<{ date: string; mealType: MealType; source?: string }> = [];
          for (const [date, day] of Object.entries(s.plan.days)) {
            if (date < cfg.startDate || date > loopEndStr) continue;
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
              for (const item of day[mt]) {
                existingItems.push({ date, mealType: mt, source: item.source });
              }
            }
          }

          const result = autoFillLoopEngine(cfg, mergedRotationState, existingItems);

          // FIX 13: Surface errors if assignment fails silently
          if (result.assignments.length === 0 && totalQueueSize > 0) {
            get().setToast({ message: '⚠️ Loop assignment failed. No meals could be scheduled.', type: 'error' });
            return s;
          }

          // FIX 8: Deduplicate assignments — prevent bloat from repeated refreshes
          const existingKeys = new Set(s.mealLoop.assignments.map(a => `${a.date}|${a.mealType}`));
          const dedupedNew = result.assignments.filter(a => !existingKeys.has(`${a.date}|${a.mealType}`));

          const newDays: Record<string, DayMeals> = {};
          for (const a of dedupedNew) {
            const date = a.date;
            const mealType = a.mealType;
            if (!newDays[date]) {
              newDays[date] = emptyDayMeals();
            }
            if (dishes) {
              const dish = dishes.find(d => d.id === a.dishId);
              if (dish) {
                const meal = dishToMeal(dish);
                const defaults = applySmartDefaults(meal, mealType, undefined, { useSmartSuggestions: true });
                const timeDef = getTimeDef(mealType);
                const loopCarb = defaults.roti ?? defaults.rice ?? undefined;
                const loopTitle = generateMealTitle(meal.name, defaults.sides, defaults.beverages, loopCarb);
                newDays[date][mealType].push({
                  id: uid(),
                  meal_id: meal.id,
                  name: meal.name,
                  title: loopTitle,
                  icon: meal.icon,
                  quantity: 1,
                  servings: 1,
                  smartVersion: 1,
                  style: getDishStyle(meal.id),
                  gravy: defaults.gravy,
                  roti: defaults.roti,
                  rice: defaults.rice,
                  sides: defaults.sides,
                  beverages: defaults.beverages,
                  dessert: defaults.dessert,
                  itemQtys: defaults.itemQtys,
                  start_time: timeDef.start,
                  end_time: timeDef.end,
                  source: 'loop',
                });
              }
            }
          }

          get().setToast({ message: '🔄 Loop refreshed! Future days updated.', type: 'success' });

          return {
            mealLoop: {
              ...s.mealLoop,
              rotationState: result.rotationState,
              assignments: [...s.mealLoop.assignments, ...dedupedNew],
              pendingMerge: [], // FIX 2: Clear after processing
              refreshing: false, // Reset rate limit flag
              lastRefreshStart: undefined, // Clear loading state
            },
            plan: {
              ...s.plan,
              days: { ...s.plan.days, ...newDays },
            },
          };
        });
      },

      autoFillLoop: (dishes) => {
        set((s) => {
          const cfg = s.mealLoop.config;
          if (!cfg) return s;

          // FIX 2: Process pendingMerge — items added mid-cycle are merged into rotation queue
          let mergedRotationState = s.mealLoop.rotationState;
          if (s.mealLoop.pendingMerge.length > 0) {
            mergedRotationState = buildRotationStateWithMerge(s.mealLoop.rotationState, s.mealLoop.pendingMerge);
          }

          // FIX 10: Detect empty rotationState queues and bail gracefully
          const totalQueueSize =
            mergedRotationState.breakfast.queue.length +
            mergedRotationState.lunch.queue.length +
            mergedRotationState.snacks.queue.length +
            mergedRotationState.dinner.queue.length;
          if (totalQueueSize === 0) {
            get().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
            return s;
          }

          // FIX 4: Only scan dates within the loop's cycle window, not all 365 plan days
          const loopStartDate = new Date(cfg.startDate);
          const loopEndDate = new Date(loopStartDate);
          loopEndDate.setDate(loopEndDate.getDate() + cfg.cycleLength * 7);
          const loopEndStr = getISODate(loopEndDate);

          const existingItems: Array<{ date: string; mealType: MealType; source?: string }> = [];
          for (const [date, day] of Object.entries(s.plan.days)) {
            if (date < cfg.startDate || date > loopEndStr) continue;
            for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
              for (const item of day[mt]) {
                existingItems.push({ date, mealType: mt, source: item.source });
              }
            }
          }

          const result = autoFillLoopEngine(cfg, mergedRotationState, existingItems);

          // FIX 13: Surface errors if assignment fails silently
          if (result.assignments.length === 0 && totalQueueSize > 0) {
            get().setToast({ message: '⚠️ Loop assignment failed. No meals could be scheduled.', type: 'error' });
            return s;
          }

          // FIX 8: Deduplicate assignments — prevent bloat from repeated auto-fills
          const existingKeys = new Set(s.mealLoop.assignments.map(a => `${a.date}|${a.mealType}`));
          const dedupedNew = result.assignments.filter(a => !existingKeys.has(`${a.date}|${a.mealType}`));

          const newDays: Record<string, DayMeals> = {};
          for (const a of dedupedNew) {
            const date = a.date;
            const mealType = a.mealType;
            if (!newDays[date]) {
              newDays[date] = emptyDayMeals();
            }
            if (dishes) {
              const dish = dishes.find(d => d.id === a.dishId);
              if (dish) {
                const meal = dishToMeal(dish);
                const defaults = applySmartDefaults(meal, mealType, undefined, { useSmartSuggestions: true });
                const timeDef = getTimeDef(mealType);
                const loopCarb = defaults.roti ?? defaults.rice ?? undefined;
                const loopTitle = generateMealTitle(meal.name, defaults.sides, defaults.beverages, loopCarb);
                newDays[date][mealType].push({
                  id: uid(),
                  meal_id: meal.id,
                  name: meal.name,
                  title: loopTitle,
                  icon: meal.icon,
                  quantity: 1,
                  servings: 1,
                  smartVersion: 1,
                  style: getDishStyle(meal.id),
                  gravy: defaults.gravy,
                  roti: defaults.roti,
                  rice: defaults.rice,
                  sides: defaults.sides,
                  beverages: defaults.beverages,
                  dessert: defaults.dessert,
                  itemQtys: defaults.itemQtys,
                  start_time: timeDef.start,
                  end_time: timeDef.end,
                  source: 'loop',
                });
              }
            }
          }

          return {
            mealLoop: {
              ...s.mealLoop,
              rotationState: result.rotationState,
              assignments: [...s.mealLoop.assignments, ...dedupedNew],
              pendingMerge: [], // FIX 2: Clear after processing
            },
            plan: {
              ...s.plan,
              days: { ...s.plan.days, ...newDays },
            },
          };
        });
      },

      addLoopOverride: (key, dishId) => {
        set((s) => ({
          mealLoop: {
            ...s.mealLoop,
            overrides: { ...s.mealLoop.overrides, [key]: dishId },
          },
        }));
      },

      markFeatured: (dishIds) => {
        const now = Date.now();
        set((s) => {
          const updated = { ...s.lastFeaturedTimes };
          for (const id of dishIds) {
            updated[id] = now;
          }
          return { lastFeaturedTimes: updated };
        });
      },

      hydrateMissingDefaults: (dishes) => {
        if (!dishes || dishes.length === 0) return;
        const mealTypes: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

        set((s) => {
          const days: Record<string, DayMeals> = {};
          let hasChanges = false;

          for (const [date, day] of Object.entries(s.plan.days)) {
            const newDay: DayMeals = { ...day };

            for (const mt of mealTypes) {
              const items = day[mt];
              if (!items || items.length === 0) continue;

              let dayChanged = false;
              const newItems = items.map((item) => {
                if (
                  item.gravy || item.roti || item.rice ||
                  (item.sides?.length ?? 0) > 0 ||
                  (item.beverages?.length ?? 0) > 0 ||
                  (item.dessert?.length ?? 0) > 0
                ) {
                  return item;
                }

                const dish = dishes.find((d) => d.id === item.meal_id);
                if (!dish) return item;

                const meal = dishToMeal(dish);
                const defaults = applySmartDefaults(meal, mt, undefined, { useSmartSuggestions: true });
                dayChanged = true;

                return {
                  ...item,
                  smartVersion: 1,
                  gravy: defaults.gravy,
                  roti: defaults.roti,
                  rice: defaults.rice,
                  sides: defaults.sides,
                  beverages: defaults.beverages,
                  dessert: defaults.dessert,
                  itemQtys: { ...(item.itemQtys ?? {}), ...defaults.itemQtys },
                };
              });

              newDay[mt] = dayChanged ? newItems : items;
              if (dayChanged) hasChanges = true;
            }

            days[date] = newDay;
          }

          return hasChanges ? { plan: { ...s.plan, days } } : s;
        });
      },
    }),
    {
      name: 'mealdrama-tray-store',
      version: 4,
      storage: nativeStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[TrayStore] Hydration failed:', error);
        } else if (state) {
          console.log('[TrayStore] Hydrated: plan.days=', Object.keys(state.plan.days).length, 'mealLoop.config=', !!state.mealLoop.config);
        }
      },
      migrate: (persistedState: unknown, fromVersion: number) => {
        console.log('[TrayStore] Migrating from version', fromVersion);
        const state = persistedState as Record<string, unknown>;

        // Safety check: ensure state is an object
        if (!state || typeof state !== 'object') {
          console.warn('[TrayStore] Invalid persisted state, resetting');
          return persistedState;
        }

        if (fromVersion < 1) {
          state.plan = { period: 'week', days: {} };
          state.guestMode = { active: false, startDate: '', endDate: '', extraServings: 0 };
          const oldLoop = state.mealLoop as Record<string, unknown> | undefined;
          const preservedConfig = oldLoop?.config ?? null;
          state.mealLoop = { ...EMPTY_LOOP_STATE, config: preservedConfig };
        }
        if (fromVersion < 2) {
          const loop = state.mealLoop as Record<string, unknown> | undefined;
          if (loop && !loop.rotationState) {
            loop.rotationState = EMPTY_LOOP_STATE.rotationState;
          }
        }
        if (fromVersion < 3) {
          const loop = state.mealLoop as Record<string, unknown> | undefined;
          if (!loop) {
            state.mealLoop = EMPTY_LOOP_STATE;
          } else {
            state.mealLoop = deepMergeLoopState(loop, EMPTY_LOOP_STATE);
          }
        }
        if (fromVersion < 4) {
          const loop = state.mealLoop as { assignments?: Array<{ date: string }> } | undefined;
          if (loop?.assignments && Array.isArray(loop.assignments)) {
            const today = getISODate(new Date());
            loop.assignments = loop.assignments.filter((a) => a.date >= today);
          }
        }

        console.log('[TrayStore] Migration complete, plan.days keys:', Object.keys((state.plan as any)?.days || {}).length);
        return persistedState as typeof EMPTY_LOOP_STATE extends undefined ? unknown : typeof persistedState;
      },
      partialize: (state) => {
        try {
          const today = getISODate(new Date());
          const prunedAssignments = state.mealLoop.assignments.filter((a) => a.date >= today);

          const pruneRecord = (record: Record<string, number> | undefined, maxAgeDays = 90) => {
            if (!record || typeof record !== 'object') return {};
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - maxAgeDays);
            const cutoffStr = cutoff.toISOString().split('T')[0];
            const pruned: Record<string, number> = {};
            for (const [date, value] of Object.entries(record)) {
              if (date >= cutoffStr) pruned[date] = value;
            }
            return pruned;
          };

          const result = {
            plan: state.plan,
            guestMode: state.guestMode,
            swapHistory: Array.isArray(state.swapHistory) ? state.swapHistory.slice(0, 10) : [],
            templates: Array.isArray(state.templates) ? state.templates : [],
            completions: pruneRecord(state.completions),
            skipped: pruneRecord(state.skipped),
            lastFeaturedTimes: state.lastFeaturedTimes,
            mealLoop: {
              ...state.mealLoop,
              assignments: prunedAssignments,
              undoStack: [],
            },
          };

          console.log('[TrayStore] partialize success, plan.days:', Object.keys(state.plan.days).length);
          return result;
        } catch (err) {
          console.error('[TrayStore] partialize FAILED — returning full state to prevent data loss:', err);
          // Return full state without pruning to prevent data loss
          return {
            plan: state.plan,
            guestMode: state.guestMode,
            swapHistory: state.swapHistory,
            templates: state.templates,
            completions: state.completions,
            skipped: state.skipped,
            lastFeaturedTimes: state.lastFeaturedTimes,
            mealLoop: {
              ...state.mealLoop,
              undoStack: [],
            },
          };
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[TrayStore] Hydration failed:', error);
        } else if (state) {
          console.log('[TrayStore] Hydrated successfully, plan.days:', Object.keys(state.plan.days).length, 'mealLoop.config:', !!state.mealLoop.config);
        }
      },
    }
  )
);

// ─── Connectivity Subscription ───────────────────────────────────────────────
// C2: Single online listener lives in connectivity.ts — stores subscribe via onConnectivityChange()

let _trayUnsubscribeConnectivity: (() => void) | null = null;
let _logoutHandler: (() => void) | null = null;
if (typeof window !== 'undefined') {
  _trayUnsubscribeConnectivity = onConnectivityChange((state) => {
    if (state === 'online') {
      setTimeout(() => useTrayStore.getState().syncOfflineQueue(), 500);
    }
  });

  // Listen for logout to clear debounce timers and prevent stale saves
  _logoutHandler = () => clearAllDebounceTimers();
  window.addEventListener('store:logout', _logoutHandler);

  // HMR cleanup: clear timers and unsubscribe on module reload
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (_trayUnsubscribeConnectivity) _trayUnsubscribeConnectivity();
      if (_logoutHandler) window.removeEventListener('store:logout', _logoutHandler);
      clearAllDebounceTimers();
    });
  }
}

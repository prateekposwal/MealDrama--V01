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
import { buildLoopAssignments as buildAssignments, handleMidCycleAdd } from '../utils/mealLoopEngine';
import { dishToMeal } from '../utils/dishToMeal';
import { generateMealTitle } from '../utils/generateMealTitle';
import { getDishStyle } from '../constants/dishStyles';
import type { SourcePool } from '../utils/mealLoopEngine';
import type { Dish } from '../constants/dishLibrary';
import { useStore } from './useStore';

export type { MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, Meal, MealLoopState, MealLoopConfig, MealLoopAssignment };

// ─── Re-export helper for screens to use directly when needed ────────────────
export { applySmartDefaults };

/** Resolve effective slot defaults — checks user slotTimePreferences, then SLOT_TIME_DEFAULTS */
function getTimeDef(mealType: MealType): { start: string; end: string } {
  const prefs = useStore.getState().user?.slotTimePreferences;
  if (prefs?.[mealType]) return { start: prefs[mealType]!.start, end: prefs[mealType]!.end };
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

/**
 * Debounce save wrapper (1000ms default).
 * Prevents API spam during rapid inline edits.
 * Each itemId gets its own timer — concurrent edits don't cancel each other.
 */
function debounceSave(key: string, fn: () => Promise<void>, delay = 1000) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }
  debounceTimers.set(key, setTimeout(async () => {
    try {
      await fn();
    } catch (err) {
      console.error('[TrayStore] Save failed:', err);
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

// Use nanoid for collision-resistant IDs — no counter overflow issues on HMR
const uid = () => `item_${nanoid(10)}`;

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
        let oldGravy: string | undefined;
        let oldRoti: string | undefined;
        let oldRice: string | undefined;
        let oldSides: string[] = [];
        let oldBeverages: string[] = [];
        let oldDessert: string[] | undefined;
        let oldVariant: string | undefined;
        let oldVariantId: string | undefined;
        let oldAddon: string | undefined;
        let oldStyle: string | undefined;

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
              { id: `swap_${Date.now()}`, date, mealType, itemId, oldMealId, newMealId: newMeal.id, timestamp: Date.now() },
              ...s.swapHistory.slice(0, 9),
            ],
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
          return {
            plan: { ...s.plan, days: { ...s.plan.days, [date]: { ...day, [mealType]: items.filter(i => i.id !== itemId) } } },
            saveStatus: { ...s.saveStatus, [itemId]: 'saved' },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        offlineQueue.add({ type: 'remove', payload: { date, mealType, itemId } });

        // Immediate DELETE (no debounce)
        if (navigator.onLine) {
          trayApi.removeItem(itemId).catch(console.error);
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

          const updatedItems = items.map(item =>
            item.id === lastSwap.itemId ? { ...item, meal_id: lastSwap.oldMealId } : item
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
        // H8: Use UTC-based date computation to avoid timezone-dependent off-by-one errors
        const now = new Date();
        const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
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

        function daysBetween(a: string, b: string): number {
          // UTC-based day difference — no timezone ambiguity
          const [ay, am, ad] = a.split('-').map(Number);
          const [by, bm, bd] = b.split('-').map(Number);
          const da = Date.UTC(ay!, am! - 1, ad!);
          const db = Date.UTC(by!, bm! - 1, bd!);
          return Math.floor((db - da) / 86400000);
        }

        for (let i = 0; i < dayCount; i++) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() + i);
          const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
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
              const gap = lastDate ? daysBetween(lastDate, iso) : 999;
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
                id: `${selected[j]!.meal.id}-${iso}-${j}`,
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
        set((s) => ({
          skipped: { ...s.skipped, [key]: Date.now() },
          saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'saving' },
        }));
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
          },
        }));
      },

      applyLoopConfig: (config, pool, dishes) => {
        const { queue, assignments: loopAssignments } = buildAssignments(pool, config, dishes);

        // Build plan days from loop assignments
        const newDays: Record<string, DayMeals> = {};
        for (const a of loopAssignments) {
          if (!newDays[a.date]) {
            newDays[a.date] = emptyDayMeals();
          }
          if (dishes) {
            const dish = dishes.find(d => d.id === a.dishId);
            if (dish) {
              const meal = dishToMeal(dish);
              const defaults = applySmartDefaults(meal, a.mealType, undefined, { useSmartSuggestions: true });
              const timeDef = getTimeDef(a.mealType);
              const loopCarb = defaults.roti ?? defaults.rice ?? undefined;
              const loopTitle = generateMealTitle(meal.name, defaults.sides, defaults.beverages, loopCarb);
              newDays[a.date][a.mealType].push({
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
              });
            }
          }
        }

        set((s) => {
          // Remove stale loop dates from plan before merging new ones
          const oldLoopDates = new Set(s.mealLoop.assignments.map(a => a.date));
          const cleanedDays = { ...s.plan.days };
          for (const date of oldLoopDates) {
            if (!newDays[date]) {
              delete cleanedDays[date];
            }
          }

          return {
            mealLoop: {
              config,
              sourceDishIds: Object.values(pool).flat().map((d: Dish) => d.id),
              pool_version: 1,
              rotationQueue: queue,
              next_index: loopAssignments.length,
              pendingMerge: [],
              assignments: loopAssignments,
              overrides: s.mealLoop.overrides,
            },
            plan: {
              ...s.plan,
              days: { ...cleanedDays, ...newDays },
            },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));
      },

      detectLoopPoolChange: (pool, dishes) => {
        set((s) => {
          const oldIds = s.mealLoop.sourceDishIds;
          const newIds = Object.values(pool).flat().map((d: Dish) => d.id);
          const oldSet = new Set(oldIds);
          const hasNew = newIds.some(id => !oldSet.has(id));
          if (!hasNew) return s;
          const cfg = s.mealLoop.config;
          if (!cfg) return s;
          const result = handleMidCycleAdd(
            oldIds, newIds, pool, cfg,
            s.mealLoop.rotationQueue, s.mealLoop.next_index,
            s.mealLoop.assignments, dishes,
          );
          return {
            mealLoop: {
              ...s.mealLoop,
              sourceDishIds: newIds,
              pool_version: result.pool_version,
              rotationQueue: result.queue,
              pendingMerge: result.pendingMerge,
              assignments: result.assignments,
              next_index: result.assignments.length,
            },
          };
        });
      },

      clearMealLoop: () => {
        set(() => ({ mealLoop: EMPTY_LOOP_STATE }));
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
      version: 1,
      migrate: (persistedState: unknown, fromVersion: number) => {
        if (fromVersion < 1) {
          // v0 → v1: clear stale plan data on APK upgrade — forces fresh tray setup
          const state = persistedState as Record<string, unknown>;
          state.plan = { period: 'week', days: {} };
          state.guestMode = { active: false, startDate: '', endDate: '', extraServings: 0 };
          state.mealLoop = EMPTY_LOOP_STATE;
        }
        return persistedState as typeof EMPTY_LOOP_STATE extends undefined ? unknown : typeof persistedState;
      },
      partialize: (state) => ({
        plan: state.plan,
        guestMode: state.guestMode,
        swapHistory: state.swapHistory.slice(0, 10),
        templates: state.templates,
        completions: state.completions,
        skipped: state.skipped,
        lastFeaturedTimes: state.lastFeaturedTimes,
        mealLoop: state.mealLoop,
      }),
    }
  )
);

// ─── Online Event Listener ───────────────────────────────────────────────────
// Uses dynamic getState() reference to survive HMR store recreation

let _trayOnlineHandler: (() => void) | null = null;
let _logoutHandler: (() => void) | null = null;
if (typeof window !== 'undefined') {
  _trayOnlineHandler = () => {
    setTimeout(() => useTrayStore.getState().syncOfflineQueue(), 500);
  };
  window.addEventListener('online', _trayOnlineHandler);

  // Listen for logout to clear debounce timers and prevent stale saves
  _logoutHandler = () => clearAllDebounceTimers();
  window.addEventListener('store:logout', _logoutHandler);

  // HMR cleanup: clear timers and re-wire listener on module reload
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (_trayOnlineHandler) window.removeEventListener('online', _trayOnlineHandler);
      if (_logoutHandler) window.removeEventListener('store:logout', _logoutHandler);
      clearAllDebounceTimers();
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray Store — Single Source of Truth
// Shared by Dashboard, Plan, and MealTray screens
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { trayApi, offlineQueue as trayOfflineQueue } from '../../app/lib/trayApi';
import { applySmartDefaults } from './helpers/applySmartDefaults';
import { SLOT_TIME_DEFAULTS, getSlotDefaultTimes } from '../../types/tray';
import type { Meal, MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, SavedTemplate } from '../../types/tray';
import { dishToMeal } from '../../utils/dishToMeal';
import { generateMealTitle } from '../../utils/generateMealTitle';
import { getDishStyle } from '../../meal/constants/dishStyles';
import { getIngredientsForMealOption } from '../../utils/ingredientUtils';
import { GENERATED_INGREDIENTS } from '../../meal/constants/generatedIngredients';
import { useStore } from '../../app/store/useStore';
import { getISODate, addDaysISO, daysBetweenISO } from '../../utils/dateUTC';
import { onConnectivityChange } from '../../app/utils/connectivity';
import { nativeStorage } from '../../app/utils/nativeStorage';
import { useLoopStore } from './useLoopStore';
import { mealRepository } from '../../app/lib/MealRepository';
import type { PlanIndex } from '../utils/planIndex';
import { slotKey, buildPlanIndex, updatePlanIndexOnAdd, updatePlanIndexOnRemove, extendPlanIndex } from '../utils/planIndex';
import { updateSlot, getTimeDef, emptyDayMeals, uid, getIngredientNamesForMeal } from '../utils/trayUtils';
import { clearAllDebounceTimers, getDebounceTimerCount, debounceSave } from '../utils/trayDebounce';

export type { MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, Meal };

// ─── Re-export helpers for screens to use directly when needed ────────────────
export { applySmartDefaults };

// updateSlot, getTimeDef, emptyDayMeals, uid, getIngredientNamesForMeal — plan/utils/trayUtils.ts

export interface TrayStore {
  plan: {
    period: 'week' | 'biweek' | 'month';
    days: Record<string, DayMeals>;
    _planIndex: PlanIndex;
  };
  guestMode: GuestMode;
  swapHistory: SwapRecord[];
  saveStatus: Record<string, SaveStatus>;
  templates: SavedTemplate[];
  completions: Record<string, number>;
  skipped: Record<string, number>;

  setPeriod: (period: 'week' | 'biweek' | 'month') => void;
  saveTemplate: (name: string, slotConfigs: Record<string, { start: string; end: string; templateId: string }>, period: 'week' | 'biweek' | 'month', isDraft?: boolean) => string;
  loadTemplate: (id: string) => { slotConfigs: Record<string, { start: string; end: string; templateId: string }>; period: 'week' | 'biweek' | 'month' } | null;
  deleteTemplate: (id: string) => void;

  addMealToSlot: (date: string, mealType: MealType, meal: Meal, overrides?: Partial<TrayItem>) => void;
  swapMealInSlot: (date: string, mealType: MealType, itemId: string, newMeal: Meal) => void;
  updateItemInline: (date: string, mealType: MealType, itemId: string, updates: Partial<TrayItem>) => void;
  batchUpdateItems: (date: string, mealType: MealType, itemUpdates: Array<{ itemId: string; updates: Partial<TrayItem> }>) => void;
  removeMealFromSlot: (date: string, mealType: MealType, itemId: string) => void;
  setGuestMode: (guestMode: Partial<GuestMode>) => void;
  undoSwap: () => void;
  getMeals: (date: string, mealType: MealType) => TrayItem[];
  getDayMeals: (date: string) => DayMeals;
  fillPlan: (period: 'week' | 'biweek' | 'month') => void;
  syncOfflineQueue: () => Promise<{ synced: number; failed: number }>;
  clearSaveStatus: (itemId: string) => void;
  completeSlot: (date: string, mealType: MealType) => void;
  undoCompleteSlot: (date: string, mealType: MealType) => void;
  skipSlot: (date: string, mealType: MealType) => void;
  undoSkipSlot: (date: string, mealType: MealType) => void;
  rebuildPlanIndex: () => void;
}

// ─── Today seeding + legacy cleanup ───────────────────────────────────────────

let _lastSeedDate: string | null = null;
let _legacyCleanupDone = false;

function cleanupLegacyTodayDump() {
  if (_legacyCleanupDone) return;
  _legacyCleanupDone = true;
  const _today = getISODate();
  const trayStore = useTrayStore.getState();
  const todayMeals = trayStore.plan.days[_today];
  if (!todayMeals) return;
  let needsCleanup = false;
  const cleaned: DayMeals = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    const items = todayMeals[slot];
    if (items.length > 2) { needsCleanup = true; cleaned[slot] = [items[0]!]; }
    else { cleaned[slot] = [...items]; }
  }
  if (needsCleanup) {
    useTrayStore.setState((s: any) => ({
      plan: { ...s.plan, days: { ...s.plan.days, [_today]: cleaned } },
    }));
  }
}

export function seedTodayFromTray() {
  const _today = getISODate();
  if (_lastSeedDate === _today) return;
  const trayState = useStore.getState();
  const trayLibrary = trayState.trayLibrary;
  if (!trayLibrary?.breakfast) return;
  const loopState = useLoopStore.getState();
  const loopMl = loopState.mealLoop;
  const mlh = loopMl.config !== null || loopMl.assignments.length > 0 || loopMl.sourceDishIds.length > 0;
  if (!mlh && loopMl.config === null && loopMl.assignments.length === 0) {
    queueMicrotask(() => {
      const rl = useLoopStore.getState().mealLoop;
      if (rl.config || rl.assignments.length > 0) seedTodayFromTray();
    });
    return;
  }
  cleanupLegacyTodayDump();
  const todayLoopAssignments = loopMl.assignments.filter((a: any) => a.date === _today);
  const loopAssignedSlots = new Set(todayLoopAssignments.map((a: any) => a.mealType));
  const trayStore = useTrayStore.getState();
  const newDays: Record<string, any> = {};
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    const items = trayLibrary[slot] || [];
    if (items.length === 0 || loopAssignedSlots.has(slot)) continue;
    if ((trayStore.plan.days[_today]?.[slot]?.length ?? 0) > 0) continue;
    const td = getTimeDef(slot);
    newDays[_today] = newDays[_today] || emptyDayMeals();
    const item = items[0]!;
    newDays[_today][slot].push({
      id: uid(), meal_id: item.dishId || item.id, name: item.name, title: item.name,
      icon: item.icon, quantity: 1, servings: 1, smartVersion: 1,
      gravy: null, roti: null, rice: null, sides: [], beverages: [], dessert: [], itemQtys: {},
      start_time: td.start, end_time: td.end, source: 'user',
    });
  }
  if (Object.keys(newDays).length > 0) {
    useTrayStore.setState((s: any) => ({
      plan: { ...s.plan, days: { ...s.plan.days, ...newDays } },
    }));
  }
  _lastSeedDate = _today;
}

export const useTrayStore = create<TrayStore>()(
  persist(
    (set, get) => ({
      plan: { period: 'week', days: {}, _planIndex: { occupied: {}, bySource: {}, version: 0, dates: [] } },
      guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
      swapHistory: [],
      saveStatus: {},
      templates: [],
      completions: {},
      skipped: {},

      setPeriod: (period) => set((s) => ({ plan: { ...s.plan, period } })),

      rebuildPlanIndex: () => {
        set((s) => ({
          plan: { ...s.plan, _planIndex: buildPlanIndex(s.plan.days) },
        }));
      },

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

         // Auto-add ALL culturally relevant accompaniments to pantry staples
         // Includes: emoji items, beverage sides, South Indian essentials, biryani sides, street food chutneys, soup accompaniments
         const EMOJI_ACCOMPANIMENTS = /[\u{1F300}-\u{1F9FF}]/u;
         const PANTRY_SIDES = [
           // Beverage sides
           'Biscuits', 'Cookies', 'Roasted Peanuts', 'Namkeen', 'Mathri',
           // South Indian essentials
           'Sambar', 'Rasam', 'Coconut Chutney', 'Curry Leaves Chutney',
           // Curd & Dairy
           'Curd', 'Dahi', 'Butter', 'Ghee',
           // Biryani accompaniments
           'Cucumber Raita', 'Boondi Raita', 'Masala Raita', 'Mirchi Ka Salan', 'Bagara Baingan',
           // Chaat/street food
           'Tamarind Chutney', 'Imli Chutney', 'Mint Chutney', 'Green Chutney', 'Sev', 'Murukku', 'Boondi',
           // Soup accompaniments
           'Papad', 'Rice',
           // Pickles & Salads
           'Kachumber Salad', 'Mango Pickle', 'Lime Pickle',
           'Fryums', 'Onion Rings', 'Lemon Wedge', 'Green Chili',
         ];
         const pantryAccompaniments = defaults.sides.filter(s =>
           EMOJI_ACCOMPANIMENTS.test(s) || PANTRY_SIDES.includes(s)
         );
          if (pantryAccompaniments.length > 0) {
            useStore.getState().addToPantry(pantryAccompaniments);
          }

          // Auto-add dish ingredient names to pantry
          const mealIngredients = getIngredientNamesForMeal(meal.id, overrides?.variantId);
          if (mealIngredients.length > 0) {
            useStore.getState().addToPantry(mealIngredients);
          }

          const timeDef = getTimeDef(mealType);
         const embeddedCarb = defaults.roti ?? defaults.rice ?? undefined;
         const autoTitle = overrides?.title ?? generateMealTitle(meal.name, defaults.sides, defaults.beverages, embeddedCarb);
         const newItem: TrayItem = {
           id: uid(),
           meal_id: meal.id,
           name: meal.name,
           title: autoTitle,
           titleOwnership: overrides?.title ? 'custom' : 'auto',
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
          source: overrides?.source || 'user',
        };

        // Optimistic update (with dedup: same meal_id OR same name → update chips, keep quantity)
        set((s) => {
          const day = s.plan.days[date] || emptyDayMeals();
          const existing = day[mealType].find(m => m.meal_id === newItem.meal_id || m.name.toLowerCase() === newItem.name.toLowerCase());
          if (existing) {
            return {
              plan: {
                ...s.plan,
                days: { ...s.plan.days, [date]: { ...day, [mealType]: day[mealType].map(m =>
                  m.id === existing.id ? {
                    ...m,
                    sides: [...new Set([...(m.sides || []), ...(newItem.sides || [])])],
                    beverages: [...new Set([...(m.beverages || []), ...(newItem.beverages || [])])],
                    dessert: [...new Set([...(m.dessert || []), ...(newItem.dessert || [])])],
                    roti: newItem.roti ?? m.roti,
                    rice: newItem.rice ?? m.rice,
                    gravy: newItem.gravy ?? m.gravy,
                    variant: newItem.variant || m.variant,
                    variantId: newItem.variantId || m.variantId,
                    addon: newItem.addon || m.addon,
                  } : m
                ) } },
              },
              saveStatus: s.saveStatus,
            };
          }
          const newDays = { ...s.plan.days, [date]: { ...day, [mealType]: [newItem, ...day[mealType]] } };
          return {
            plan: {
              ...s.plan,
              days: newDays,
              _planIndex: updatePlanIndexOnAdd(s.plan._planIndex, date, mealType, newItem),
            },
            saveStatus: { ...s.saveStatus, [newItem.id]: 'saving' },
          };
        });

        // Queue for offline
        trayOfflineQueue.add({
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
              start_time: newItem.start_time,
              end_time: newItem.end_time,
              variant: newItem.variant,
              variantId: newItem.variantId,
              addon: newItem.addon,
              style: newItem.style,
              itemQtys: newItem.itemQtys,
              smartVersion: newItem.smartVersion,
              source: newItem.source,
            },
          },
        });

        // Debounce PATCH
        debounceSave(`add_${newItem.id}`, async () => {
          if (!navigator.onLine) return;
          try {
            await mealRepository.addSlotItem(slotKey(date, mealType), {
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
            swapHistory: (() => {
              const MAX_SWAP_HISTORY = 10;
              const newEntry = {
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
              };
              const next = [newEntry, ...s.swapHistory];
              if (next.length > MAX_SWAP_HISTORY) next.length = MAX_SWAP_HISTORY;
              return next;
            })(),
          };
        });

        // Auto-add new meal ingredient names to pantry
        const swappedIngredients = getIngredientNamesForMeal(newMeal.id);
        if (swappedIngredients.length > 0) {
          useStore.getState().addToPantry(swappedIngredients);
        }

        // FIX 1: Sync swap to loop queue — replace oldDishId with newDishId
        const loopState = useLoopStore.getState();
        if (loopState.mealLoop.config) {
          const ml = loopState.mealLoop;
          const updatedQueue = ml.rotationQueue.map(item =>
            item.dishId === oldMealId ? { ...item, dishId: newMeal.id } : item
          );
          const updatedAssignments = ml.assignments.map(a =>
            a.dishId === oldMealId ? { ...a, dishId: newMeal.id, dishName: newMeal.name } : a
          );
          const updatedSourceIds = ml.sourceDishIds.map(id =>
            id === oldMealId ? newMeal.id : id
          );

          useLoopStore.setState({
            mealLoop: { ...ml, rotationQueue: updatedQueue, assignments: updatedAssignments, sourceDishIds: updatedSourceIds },
          });
        }

        trayOfflineQueue.add({
          type: 'swap',
          payload: {
            date, mealType, itemId, newMealId: newMeal.id, oldMealId,
            gravy: defaults.gravy,
            roti: defaults.roti,
            rice: defaults.rice,
            sides: defaults.sides,
            beverages: defaults.beverages,
            dessert: defaults.dessert,
            itemQtys: defaults.itemQtys,
            title: swapTitle,
            style: getDishStyle(newMeal.id),
          },
        });
        window.dispatchEvent(new Event('pantry:invalidate'));

        // Debounce PATCH — sends new defaults server-side
        debounceSave(`swap_${itemId}`, async () => {
          if (!navigator.onLine) return;
          try {
            // Re-read defaults from state for PATCH payload
            const state = get();
            const day = state.plan.days[date];
            const items = day?.[mealType];
            const target = items?.find(i => i.id === itemId);

            await mealRepository.updateItem(itemId, {
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
        trayOfflineQueue.add({ type: 'update', payload: { date, mealType, itemId, updates } });

        // Debounce PATCH (1000ms)
        debounceSave(`update_${itemId}`, async () => {
          if (!navigator.onLine) return;
          try {
            await mealRepository.updateItem(itemId, {
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
          trayOfflineQueue.add({ type: 'update', payload: { date, mealType, itemId: u.itemId, updates: u.updates } });
        }

        // Single debounce save for the entire batch
        debounceSave(`batch_update_${date}_${mealType}`, async () => {
          if (!navigator.onLine) return;
          try {
            // Update each item via API
            await Promise.all(itemUpdates.map(u =>
              mealRepository.updateItem(u.itemId, {
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

          const cleanedDays = { ...s.plan.days };
          if (removedDishId) {
            for (const [d, dayMeals] of Object.entries(cleanedDays)) {
              if (d <= date) continue;
              const newDay = { ...dayMeals };
              for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                newDay[mt] = newDay[mt].filter(item =>
                  item.meal_id !== removedDishId
                    ? item.source === 'user' || item.source === 'suggestion'
                    : true
                );
              }
              cleanedDays[d] = newDay;
            }
          }

          const newDays = { ...cleanedDays, [date]: { ...day, [mealType]: items.filter(i => i.id !== itemId) } };
          return {
            plan: { ...s.plan, days: newDays, _planIndex: buildPlanIndex(newDays) },
            saveStatus: { ...s.saveStatus, [itemId]: 'saving' },
          };
        });

        // Clean up loop store
        const removedItem = get().plan.days[date]?.[mealType].find(i => i.id === itemId);
        const removedDishId = removedItem?.meal_id;
        if (removedDishId) {
          const loopState = useLoopStore.getState();
          const ml = loopState.mealLoop;
          const cleanQueue = ml.rotationQueue.filter(item => item.dishId !== removedDishId);
          const deletedFlatIndex = ml.rotationQueue.findIndex(i => i.dishId === removedDishId);
          const newNextIndex = deletedFlatIndex !== -1 && deletedFlatIndex < ml.next_index
            ? Math.max(0, ml.next_index - 1) : ml.next_index;
          const newRotationPointer = deletedFlatIndex !== -1 && deletedFlatIndex < ml.rotationPointer
            ? Math.max(0, ml.rotationPointer - 1) : ml.rotationPointer;

          useLoopStore.setState({
            mealLoop: {
              ...ml,
              rotationQueue: cleanQueue,
              sourceDishIds: ml.sourceDishIds.filter(id => id !== removedDishId),
              assignments: ml.assignments.filter(a => a.dishId !== removedDishId),
              next_index: newNextIndex,
              rotationPointer: newRotationPointer,
            },
          });
        }

        window.dispatchEvent(new Event('pantry:invalidate'));

        // C4: Queue for offline retry — ensures delete is retried if immediate fails
        trayOfflineQueue.add({ type: 'remove', payload: { date, mealType, itemId } });

        // Immediate DELETE (no debounce)
        if (navigator.onLine) {
          mealRepository.removeItem(itemId)
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
          mealRepository.setGuestMode({
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
            swapHistory: s.swapHistory.length <= 1 ? [] : s.swapHistory.slice(1),
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

        set((s) => {
          const mergedDays = { ...s.plan.days, ...days };
          return {
            plan: { ...s.plan, days: mergedDays, _planIndex: extendPlanIndex(s.plan._planIndex, days) },
          };
        });
      },

      // ─── Sync Offline Queue ─────────────────────────────────────────────
      syncOfflineQueue: async () => {
        set({ saveStatus: {} });
        const result = await trayOfflineQueue.drain();
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
        const key = slotKey(date, mealType);
        set((s) => ({
          completions: { ...s.completions, [key]: Date.now() },
          saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'saving' },
        }));
        debounceSave(`complete_${key}`, async () => {
          if (!navigator.onLine) return;
          try {
            await mealRepository.completeSlot(date, mealType);
            set((s) => ({ saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [`complete:${key}`]: 'error' } }));
          }
        });
      },

      undoCompleteSlot: (date, mealType) => {
        const key = slotKey(date, mealType);
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
        const key = slotKey(date, mealType);
        set((s) => {
          // Track skipped dishes in loop analytics via useLoopStore
          const loopState = useLoopStore.getState();
          const loopAssignment = loopState.mealLoop.assignments.find(a => a.date === date && a.mealType === mealType);
          if (loopAssignment) {
            useLoopStore.setState({
              mealLoop: {
                ...loopState.mealLoop,
                analytics: { ...loopState.mealLoop.analytics, dishesSkipped: loopState.mealLoop.analytics.dishesSkipped + 1 },
              },
            });
          }

          return {
            skipped: { ...s.skipped, [key]: Date.now() },
            saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'saving' },
          };
        });
        debounceSave(`skip_${key}`, async () => {
          if (!navigator.onLine) return;
          try {
            await mealRepository.skipSlot(date, mealType);
            set((s) => ({ saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'saved' } }));
          } catch {
            set((s) => ({ saveStatus: { ...s.saveStatus, [`skip:${key}`]: 'error' } }));
          }
        });
      },

      undoSkipSlot: (date, mealType) => {
        const key = slotKey(date, mealType);
        // Cancel any pending skip debounce to prevent re-sync from API
        if (debounceTimers.has(`skip_${key}`)) {
          clearTimeout(debounceTimers.get(`skip_${key}`));
          debounceTimers.delete(`skip_${key}`);
        }
        set((s) => {
          const next = { ...s.skipped };
          delete next[key];
          const status = { ...s.saveStatus };
          delete status[`skip:${key}`];
          return { skipped: next, saveStatus: status };
        });
        // Sync unskip to server
        if (navigator.onLine) {
          mealRepository.unskipSlot(date, mealType).catch(() => {});
        }
      },

    }),
    {
      name: 'mealdrama-tray-store',
      // ⛔ FREEZE: Do NOT bump this version unless you are adding/removing persisted fields.
      // Bumping triggers migrate() which can clear plan.days and force users through onboarding again.
      version: 7,
      storage: nativeStorage,
      migrate: (persistedState: unknown, fromVersion: number) => {
        let state = persistedState as any;
        // Safely restore date strings to Date objects if needed
        if (state.plan) {
          for (const key of Object.keys(state.plan.days || {})) {
            // no-op, just ensure dates exist
          }
        }
        return state as TrayStore;
      },
      partialize: (state) => {
        try {
          const pruneRecord = (record: Record<string, number> | undefined, maxAgeDays = 90) => {
            if (!record || typeof record !== 'object') return {};
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - maxAgeDays);
            const cutoffStr = cutoff.toISOString().split('T')[0]!;
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
          };

          console.log('[TrayStore] partialize success, plan.days:', Object.keys(state.plan.days).length);
          return result;
        } catch (err) {
          console.error('[TrayStore] partialize FAILED — returning full state to prevent data loss:', err);
          return {
            plan: state.plan,
            guestMode: state.guestMode,
            swapHistory: state.swapHistory,
            templates: state.templates,
            completions: state.completions,
            skipped: state.skipped,
          };
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[TrayStore] Hydration error:', error);
          return;
        }
        if (!state) return;

        console.log('[TrayStore] Hydrated successfully, plan.days:', Object.keys(state.plan.days).length);

        // Rebuild plan index after hydration
        state.plan._planIndex = buildPlanIndex(state.plan.days);

        // Seed today from tray library
        if (typeof window !== 'undefined') {
          queueMicrotask(() => seedTodayFromTray());
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

  // Listen for logout: clear debounce timers AND reset tray state (plan.days, etc.)
  // to prevent User A's data from leaking to User B on logout/relogin without full reload.
  _logoutHandler = () => {
    clearAllDebounceTimers();
    useTrayStore.setState({
      plan: { period: 'week', days: {}, _planIndex: { occupied: {}, bySource: {}, version: 0 } },
      swapHistory: [],
      completions: {},
      skipped: {},
      guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
      templates: [],
    });
  };
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

// Register with sister store to break circular dependency
import { injectTrayStore } from './_boot';
injectTrayStore(useTrayStore);

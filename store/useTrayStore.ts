// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray Store — Single Source of Truth
// Shared by Dashboard, Plan, and MealTray screens
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { trayApi, offlineQueue as trayOfflineQueue } from '../lib/trayApi';
import { enqueue as enqueueUtil } from '../utils/offlineQueue';
import { applySmartDefaults } from './helpers/applySmartDefaults';
import { EMPTY_LOOP_STATE, SLOT_TIME_DEFAULTS, getSlotDefaultTimes } from '../types/tray';
import type { Meal, MealType, TrayItem, DayMeals, GuestMode, SwapRecord, OfflineAction, SaveStatus, SavedTemplate, MealLoopState, MealLoopConfig, MealLoopAssignment, RotationQueueItem } from '../types/tray';
import { buildLoopAssignments as buildAssignments, buildRotationQueue, assignFromQueue, handleMidCycleAdd, buildRotationState, autoFillLoop as autoFillLoopEngine, isSkippedDay } from '../utils/mealLoopEngine';
import { dishToMeal } from '../utils/dishToMeal';
import { generateMealTitle } from '../utils/generateMealTitle';
import { getDishStyle } from '../constants/dishStyles';
import type { SourcePool } from '../utils/mealLoopEngine';
import type { Dish } from '../constants/dishLibrary';
import { useStore, type TrayLibrary } from './useStore';
import { getISODate, addDaysISO, daysBetweenISO } from '../utils/dateUTC';
import { onConnectivityChange } from '../utils/connectivity';
import { nativeStorage } from '../utils/nativeStorage';
import { clearAutoFillCache } from '../hooks/useLoopAutoFill';
import { invalidateOnChange } from '../utils/dpCache';

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
  setMealLoop: (config: MealLoopConfig | null, sourceDishIds: string[], assignments: MealLoopAssignment[]) => void;

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



// Guard: only reconcile once per cold start (idempotent even if called twice by strict mode)
let _reconciled = false;

// Post-hydration reconciliation — scrubs stale dish IDs from all 4 loop arrays
function trayLibraryHash(trayLibrary: TrayLibrary): string {
  const parts: string[] = [];
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary[slot] || []) {
      if (item.dishId) parts.push(item.dishId);
    }
  }
  return parts.sort().join(',');
}

let _lastTrayHash = '';

export function reconcileLoopStateWithTray(hydratedState?: TrayStore) {
  if (_reconciled) return;
  const trayState = useStore.getState();
  const trayLibrary = trayState.trayLibrary;
  invalidateOnChange(trayLibrary, hydratedState?.mealLoop?.config ?? useTrayStore.getState().mealLoop.config);
  // Guard: cross-store shape safety — if useStore hasn't hydrated or trayLibrary is wrong shape, skip
  if (!trayLibrary?.breakfast) return;
  const currentHash = trayLibraryHash(trayLibrary);
  if (!currentHash || currentHash === _lastTrayHash) {
    _reconciled = true;
    return;
  }
  _lastTrayHash = currentHash;

  // Use hydrated state if available (avoids TDZ during store initialization)
  const ml = (hydratedState ?? useTrayStore.getState()).mealLoop;
  if (!ml.config) return;

  const validIds = new Set<string>();
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const item of trayLibrary[slot] || []) {
      if (item.dishId) validIds.add(item.dishId);
    }
  }

  const sourceDishIds = ml.sourceDishIds.filter(id => validIds.has(id));
  const rotationQueue = ml.rotationQueue.filter(item => validIds.has(item.dishId));
  const assignments = ml.assignments.filter(a => validIds.has(a.dishId));
  const next_index = Math.min(ml.next_index, rotationQueue.length);

  const buildPerSlot = (queue: typeof ml.rotationQueue) => {
    const r: Record<string, string[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    for (const item of queue) r[item.mealType]?.push(item.dishId);
    return r;
  };
  const q = buildPerSlot(rotationQueue);
  const clampPointer = (ptr: number, len: number) => len === 0 ? 0 : Math.min(ptr, len - 1);
  const rotationState = {
    breakfast: { queue: q.breakfast ?? [], pointer: clampPointer(ml.rotationState.breakfast.pointer, (q.breakfast ?? []).length) },
    lunch: { queue: q.lunch ?? [], pointer: clampPointer(ml.rotationState.lunch.pointer, (q.lunch ?? []).length) },
    snacks: { queue: q.snacks ?? [], pointer: clampPointer(ml.rotationState.snacks.pointer, (q.snacks ?? []).length) },
    dinner: { queue: q.dinner ?? [], pointer: clampPointer(ml.rotationState.dinner.pointer, (q.dinner ?? []).length) },
  };

  const changed =
    sourceDishIds.length !== ml.sourceDishIds.length ||
    rotationQueue.length !== ml.rotationQueue.length ||
    assignments.length !== ml.assignments.length ||
    next_index !== ml.next_index;

  if (changed) {
    console.log('[TrayStore] Reconciling loop state — removed stale dishes:', {
      sourceDishIds: `${ml.sourceDishIds.length}→${sourceDishIds.length}`,
      rotationQueue: `${ml.rotationQueue.length}→${rotationQueue.length}`,
      assignments: `${ml.assignments.length}→${assignments.length}`,
    });
    // Defer setState to avoid TDZ during store initialization
    queueMicrotask(() => {
      try {
        useTrayStore.setState({
          mealLoop: { ...ml, sourceDishIds, rotationQueue, assignments, next_index, rotationState },
        });
      } catch { /* store not yet available */ }
    });
  }
  _reconciled = true;
}

/**
 * One-time seed: copies FIRST trayLibrary item per slot to plan.days[today] if empty.
 * Called after hydration to ensure today's slots have a starter dish.
 */
// FIX: Date-aware seed flag — resets at midnight
let _lastSeedDate: string | null = null;

// Legacy cleanup: runs once per session to clean historical tray dumps
let _legacyCleanupDone = false;

/**
 * One-time cleanup: if any slot on today has > 2 dishes (legacy dump),
 * strip to the first item only. Preserves intentional user adds (1-2 dishes).
 */
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
    if (items.length > 2) {
      needsCleanup = true;
      // Keep only the first item (assumed to be the intentional one)
      cleaned[slot] = [items[0]!];
    } else {
      cleaned[slot] = [...items];
    }
  }

  if (needsCleanup) {
    useTrayStore.setState((s) => ({
      plan: { ...s.plan, days: { ...s.plan.days, [_today]: cleaned } },
    }));
    console.log('[TrayStore] Cleaned legacy today dump (>2 dishes per slot → 1)');
  }
}

export function seedTodayFromTray() {
  const _today = getISODate();

  // Date-aware flag: allow re-seed if date changed
  if (_lastSeedDate === _today) return;

  const trayState = useStore.getState();
  const trayLibrary = trayState.trayLibrary;
  if (!trayLibrary?.breakfast) return;

  const trayStore = useTrayStore.getState();

  // FIX 6: Wait for mealLoop to hydrate before seeding to avoid race
  // If mealLoop hasn't hydrated yet, defer seeding
  const mealLoopHydrated = trayStore.mealLoop.config !== null || trayStore.mealLoop.assignments.length > 0 || trayStore.mealLoop.sourceDishIds.length > 0;
  if (!mealLoopHydrated && trayStore.mealLoop.config === null && trayStore.mealLoop.assignments.length === 0) {
    // mealLoop may still be hydrating; defer seed
    queueMicrotask(() => {
      const retryState = useTrayStore.getState();
      if (retryState.mealLoop.config || retryState.mealLoop.assignments.length > 0) {
        seedTodayFromTray();
      }
    });
    return;
  }

  // Run legacy cleanup before seeding
  cleanupLegacyTodayDump();

  // Check for loop assignments on today before seeding
  // Don't seed slots that already have loop assignments
  const todayLoopAssignments = trayStore.mealLoop.assignments.filter(a => a.date === _today);
  const loopAssignedSlots = new Set(todayLoopAssignments.map(a => a.mealType));

  const newDays: Record<string, DayMeals> = {};
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    const items = trayLibrary[slot] || [];
    if (items.length === 0) continue;
    // Skip slots that already have loop assignments
    if (loopAssignedSlots.has(slot)) continue;
    // Skip slots that already have items (user-added or seeded)
    const existingItems = trayStore.plan.days[_today]?.[slot] || [];
    if (existingItems.length > 0) continue;

    const timeDef = getTimeDef(slot);
    newDays[_today] = newDays[_today] || emptyDayMeals();
    // Seed only the FIRST item as a starter
    const item = items[0]!;
    newDays[_today][slot].push({
      id: uid(),
      meal_id: item.dishId || item.id,
      name: item.name,
      title: item.name,
      icon: item.icon,
      quantity: 1,
      servings: 1,
      smartVersion: 1,
      gravy: null,
      roti: null,
      rice: null,
      sides: [],
      beverages: [],
      dessert: [],
      itemQtys: {},
      start_time: timeDef.start,
      end_time: timeDef.end,
      source: 'user',
    });
  }

  if (Object.keys(newDays).length > 0) {
    useTrayStore.setState((s) => ({
      plan: { ...s.plan, days: { ...s.plan.days, ...newDays } },
    }));
    console.log('[TrayStore] Seeded today from tray library (1 per slot)');
  }
  _lastSeedDate = _today;
}

// FIX 9: Debug visibility — call from console: getLoopDebugInfo()
export interface LoopDebugInfo {
  configured: boolean;
  cycleLength: number | null;
  queueSize: number;
  nextIndex: number;
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

        // Optimistic update (with dedup: same meal_id OR same name → increment quantity + merge sides)
        set((s) => {
          const day = s.plan.days[date] || emptyDayMeals();
          // FIX: Check both meal_id AND name (case-insensitive) to catch cross-source duplicates
          const existing = day[mealType].find(m => m.meal_id === newItem.meal_id || m.name.toLowerCase() === newItem.name.toLowerCase());
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

          // Queue with defaults for replay
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

          return {
            mealLoop: {
              ...ml,
              rotationQueue: updatedQueue,
              assignments: updatedAssignments,
              sourceDishIds: updatedSourceIds,
            },
          };
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
        trayOfflineQueue.add({ type: 'update', payload: { date, mealType, itemId, updates } });

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
          trayOfflineQueue.add({ type: 'update', payload: { date, mealType, itemId: u.itemId, updates: u.updates } });
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

          // Clean up rotationQueue if dish was deleted
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

          // Fix #2: Only clean loop-source items from future dates — never cascade user/suggestion deletions
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

          return {
            plan: { ...s.plan, days: { ...cleanedDays, [date]: { ...day, [mealType]: items.filter(i => i.id !== itemId) } } },
            saveStatus: { ...s.saveStatus, [itemId]: 'saving' },
            mealLoop: {
              ...s.mealLoop,
              rotationQueue: cleanQueue,
              sourceDishIds: removedDishId
                ? s.mealLoop.sourceDishIds.filter(id => id !== removedDishId)
                : s.mealLoop.sourceDishIds,
              assignments: removedDishId
                ? s.mealLoop.assignments.filter(a => a.dishId !== removedDishId)
                : s.mealLoop.assignments,
              next_index: newNextIndex,
              rotationState: newRotationState,
            },
          };
        });

        window.dispatchEvent(new Event('pantry:invalidate'));

        // C4: Queue for offline retry — ensures delete is retried if immediate fails
        trayOfflineQueue.add({ type: 'remove', payload: { date, mealType, itemId } });

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
          trayApi.unskipSlot(date, mealType).catch(() => {});
        }
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
        // Clear auto-fill cache so useLoopAutoFill retries all slots
        clearAutoFillCache();

        set((s) => {
          let queue: RotationQueueItem[];
          let loopAssignments: MealLoopAssignment[];
          let hasNewDishes = false;

          // Compute new cycle date range BEFORE calling assignFromQueue
          const cycleStart = new Date(config.startDate);
          const newCycleDates = new Set<string>();
          let activeDays = 0;
          let day = 0;
          while (activeDays < config.cycleLength && day < 365) {
            const d = new Date(cycleStart);
            d.setDate(d.getDate() + day);
            const ds = getISODate(d);
            day++;
            if (isSkippedDay(ds, config.skipDays)) continue;
            newCycleDates.add(ds);
            activeDays++;
          }

          // Filter existing assignments to only dates within the new cycle window
          // This prevents old assignments outside the new cycle from blocking new ones
          const existingInCycle = s.mealLoop.assignments.filter(a => newCycleDates.has(a.date));

          // Read all mealLoop state from live `s` inside set() to avoid races
          // with removeMealFromSlot or other concurrent mutations.
          if (s.mealLoop.config) {
            const oldIds = s.mealLoop.sourceDishIds;
            const newIds = Object.values(pool).flat().map((d: Dish) => d.id);
            hasNewDishes = newIds.some(id => !oldIds.includes(id));
            if (hasNewDishes) {
              const result = handleMidCycleAdd(
                oldIds, newIds, pool, config,
                s.mealLoop.rotationQueue, s.mealLoop.next_index,
                existingInCycle, dishes,
              );
              queue = result.queue;
              loopAssignments = result.assignments;
            } else {
              queue = buildRotationQueue(pool, dishes);
              const gapFill = assignFromQueue(queue, config, s.mealLoop.next_index, existingInCycle);
              loopAssignments = [...existingInCycle, ...gapFill];
            }
          } else {
            const full = buildAssignments(pool, config, dishes);
            queue = full.queue;
            loopAssignments = full.assignments;
          }

          const rotationState = buildRotationState(pool, dishes);

          const _today = getISODate(new Date());
          const nonTodayAssignments = loopAssignments.filter(a => a.date === _today ? false : true);

          // Incremental cleanup: remove loop-source items from dates
          // that are OUTSIDE the new cycle window OR are newly skipped
          const oldLoopDates = new Set(s.mealLoop.assignments.map(a => a.date));
          const datesToClear = [...oldLoopDates].filter(d => !newCycleDates.has(d));
          const datesToClearSet = new Set(datesToClear);

          // Also clear assignments on dates that are now in skipDays (newly skipped)
          const oldSkipDays = s.mealLoop.config?.skipDays || [];
          const newSkipDays = config.skipDays || [];
          const newlySkipped = newSkipDays.filter(d => !oldSkipDays.includes(d));
          if (newlySkipped.length > 0) {
            // Find dates within the old cycle that match newly skipped days
            for (const a of s.mealLoop.assignments) {
              const dow = new Date(a.date).getDay();
              if (newlySkipped.includes(dow)) {
                datesToClearSet.add(a.date);
              }
            }
          }

          const newDays: Record<string, DayMeals> = {};
          for (const a of nonTodayAssignments) {
            const date = a.date;
            const mealType = a.mealType;
            // FIX: Always populate newDays from assignments — don't skip existing loop items
            // The merge step below will deduplicate and replace stale loop items
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

          // Remove stale loop dates from plan before merging new ones
          // Only clear loop-source items from dates OUTSIDE the new cycle
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
                // Remove loop-source meals only if from dates outside new cycle
                if (item.source === 'loop' && datesToClearSet.has(date)) return false;
                // Remove legacy undefined-source meals on dates outside new cycle
                if (datesToClearSet.has(date)) return false;
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

          // Tray-seeded fallback: if a loop-managed slot is empty after cleanup,
          // seed from trayLibrary to prevent suggestion fallback
          const trayLibrary = useStore.getState().trayLibrary;
          if (trayLibrary) {
            for (const a of nonTodayAssignments) {
              const date = a.date;
              const mealType = a.mealType;
              const existingItems = (cleanedDays[date]?.[mealType] || s.plan.days[date]?.[mealType] || []);
              if (existingItems.length === 0 && trayLibrary[mealType]?.length > 0) {
                const trayItem = trayLibrary[mealType][0];
                if (trayItem) {
                  if (!cleanedDays[date]) cleanedDays[date] = emptyDayMeals();
                  const timeDef = getTimeDef(mealType);
                  cleanedDays[date][mealType].push({
                    id: uid(),
                    meal_id: trayItem.dishId || trayItem.id,
                    name: trayItem.name,
                    title: trayItem.name,
                    icon: trayItem.icon,
                    quantity: 1,
                    servings: 1,
                    smartVersion: 1,
                    gravy: null,
                    roti: null,
                    rice: null,
                    sides: [],
                    beverages: [],
                    dessert: [],
                    itemQtys: {},
                    start_time: timeDef.start,
                    end_time: timeDef.end,
                    source: 'loop',
                  });
                }
              }
            }
          }

          // Queue loop changes for offline sync
          enqueueUtil('loop_save', {
            config,
            sourceDishIds: Object.values(pool).flat().map((d: Dish) => d.id),
            assignments: nonTodayAssignments,
          });
          window.dispatchEvent(new Event('pantry:invalidate'));

          // FIX 1: Compute correct next_index based on new cycle length
          // Use per-slot pointers from rotationState to track position accurately
          const newNextIndex = Math.min(nonTodayAssignments.length, queue.length);

          return {
            mealLoop: {
              config,
              sourceDishIds: Object.values(pool).flat().map((d: Dish) => d.id),
              pool_version: 1,
              rotationQueue: queue,
              next_index: newNextIndex,
              assignments: nonTodayAssignments,
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
                    // FIX 3: Store plan.days snapshot for restore on undo
                    planDaysSnapshot: JSON.parse(JSON.stringify(s.plan.days)),
                  }, ...s.mealLoop.undoStack].slice(0, 5)
                : s.mealLoop.undoStack,
              // Only increment cyclesCompleted when the pointer actually wraps around
              // A cycle = when next_index reaches queue.length (all dishes assigned once)
              analytics: {
                ...s.mealLoop.analytics,
                cyclesCompleted: (() => {
                  if (!hasNewDishes) return s.mealLoop.analytics.cyclesCompleted;
                  const oldPtr = s.mealLoop.next_index;
                  const newPtr = newNextIndex;
                  const queueLen = queue.length;
                  if (queueLen === 0) return s.mealLoop.analytics.cyclesCompleted;
                  if (newPtr < oldPtr) return s.mealLoop.analytics.cyclesCompleted + 1;
                  return s.mealLoop.analytics.cyclesCompleted;
                })(),
                mealsAutoFilled: s.mealLoop.analytics.mealsAutoFilled + (() => {
                  if (!hasNewDishes) return 0;
                  const keys = new Set<string>();
                  for (const [d, dm] of Object.entries(s.plan.days)) {
                    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                      for (const item of dm[mt]) keys.add(`${d}|${item.meal_id}`);
                    }
                  }
                  return nonTodayAssignments.filter(a => !keys.has(`${a.date}|${a.dishId}`)).length;
                })(),
              },
              // Preserve rate limit flags
              refreshing: s.mealLoop.refreshing,
              lastRefreshStart: s.mealLoop.lastRefreshStart,
            },
            plan: {
              ...s.plan,
              days: (() => {
                const merged: Record<string, DayMeals> = {};
                const allDates = new Set([...Object.keys(cleanedDays), ...Object.keys(newDays)]);
                for (const date of allDates) {
                  const clean = cleanedDays[date];
                  const next = newDays[date];
                  if (!clean) { merged[date] = next ?? emptyDayMeals(); continue; }
                  if (!next) { merged[date] = clean; continue; }
                  const day: DayMeals = { breakfast: [], lunch: [], snacks: [], dinner: [] };
                  for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
                    // FIX: Strip loop items from cleanedDays — newDays loop items take precedence
                    const nonLoopItems = clean[mt].filter(m => m.source !== 'loop');
                    // Preserve custom titles from existing loop items
                    const customTitleMap = new Map<string, { title: string; ownership: 'custom' }>();
                    for (const m of clean[mt]) {
                      if (m.source === 'loop' && m.titleOwnership === 'custom' && m.title) {
                        customTitleMap.set(m.meal_id, { title: m.title, ownership: 'custom' });
                      }
                    }
                    // Apply custom titles to new loop items
                    const loopItemsWithCustomTitles = next[mt].map(item => {
                      const custom = customTitleMap.get(item.meal_id);
                      return custom ? { ...item, title: custom.title, titleOwnership: custom.ownership } : item;
                    });
                    // Keep user/suggestion items, replace loop items with new assignments
                    day[mt] = [...nonLoopItems, ...loopItemsWithCustomTitles];
                  }
                  merged[date] = day;
                }
                return merged;
              })(),
            },
          };
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

          // FIX 1: Toast — tell user what happened with new dishes
          const addedIds = newIds.filter(id => !oldSet.has(id));
          if (addedIds.length > 0 && dishes) {
            const addedNames = addedIds.map(id => dishes.find(d => d.id === id)?.name ?? id).join(', ');

            // Find the next assignment date for the first added dish
            const firstAdded = addedIds[0];
            const nextAssignment = result.assignments.find(a => a.dishId === firstAdded);
            const dateHint = nextAssignment
              ? ` on ${new Date(nextAssignment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
              : '';

            useStore.getState().setToast({ message: `🍽️ ${addedNames} added — will appear in upcoming slots${dateHint}`, type: 'success' });
          }

          // FIX 3: Clamp rotationState pointers to new queue lengths (prevent drift)
          const buildPerSlotQueues = (queue: typeof s.mealLoop.rotationQueue) => {
            const perSlot: Record<MealType, string[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            for (const item of queue) {
              perSlot[item.mealType].push(item.dishId);
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
            useStore.getState().setToast({ message: '↩️ Loop settings restored.', type: 'info' });
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
            useStore.getState().setToast({ message: '⚠️ Could not regenerate loop assignments. Keeping current state.', type: 'error' });
            return s;
          }

          useStore.getState().setToast({ message: '↩️ Loop settings restored to previous version.', type: 'info' });

          // FIX 3: Restore plan.days from snapshot if available
          const restoredPlanDays = prev.planDaysSnapshot
            ? { ...s.plan.days, ...prev.planDaysSnapshot }
            : s.plan.days;

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
            plan: {
              ...s.plan,
              days: restoredPlanDays,
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
            useStore.getState().setToast({ message: '⏳ Loop is already refreshing. Please wait.', type: 'info' });
            return s;
          }

          const cfg = s.mealLoop.config;
          if (!cfg) return s;

          // FIX 10: Detect empty rotationState queues and bail gracefully
          const totalQueueSize =
            s.mealLoop.rotationState.breakfast.queue.length +
            s.mealLoop.rotationState.lunch.queue.length +
            s.mealLoop.rotationState.snacks.queue.length +
            s.mealLoop.rotationState.dinner.queue.length;
          if (totalQueueSize === 0) {
            useStore.getState().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
            return s;
          }

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

          const result = autoFillLoopEngine(cfg, s.mealLoop.rotationState, existingItems);

          // FIX 13: Surface errors if assignment fails silently
          if (result.assignments.length === 0 && totalQueueSize > 0) {
            useStore.getState().setToast({ message: '⚠️ Loop assignment failed. No meals could be scheduled.', type: 'error' });
            return {
              ...s,
              mealLoop: {
                ...s.mealLoop,
                refreshing: false,
                lastRefreshStart: undefined,
              },
            };
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

          useStore.getState().setToast({ message: '🔄 Loop refreshed! Future days updated.', type: 'success' });

          return {
            mealLoop: {
              ...s.mealLoop,
              rotationState: result.rotationState,
              assignments: [...s.mealLoop.assignments, ...dedupedNew],
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

          // FIX 10: Detect empty rotationState queues and bail gracefully
          const totalQueueSize =
            s.mealLoop.rotationState.breakfast.queue.length +
            s.mealLoop.rotationState.lunch.queue.length +
            s.mealLoop.rotationState.snacks.queue.length +
            s.mealLoop.rotationState.dinner.queue.length;
          if (totalQueueSize === 0) {
            useStore.getState().setToast({ message: '⚠️ Loop queue is empty. Add dishes to Tray first, then configure loop.', type: 'error' });
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

          const result = autoFillLoopEngine(cfg, s.mealLoop.rotationState, existingItems);

          // FIX 13: Surface errors if assignment fails silently
          if (result.assignments.length === 0 && totalQueueSize > 0) {
            useStore.getState().setToast({ message: '⚠️ Loop assignment failed. No meals could be scheduled.', type: 'error' });
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
            },
            plan: {
              ...s.plan,
              days: { ...s.plan.days, ...newDays },
            },
          };
        });

        // Queue loop_save for offline sync — matches applyLoopConfig pattern
        const loopState = get().mealLoop;
        if (loopState.config) {
          enqueueUtil('loop_save', {
            config: loopState.config,
            sourceDishIds: loopState.sourceDishIds,
            assignments: loopState.assignments,
          });
        }
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

    }),
    {
      name: 'mealdrama-tray-store',
      // ⛔ FREEZE: Do NOT bump this version unless you are adding/removing persisted fields.
      // Bumping triggers migrate() which can clear plan.days and force users through onboarding again.
      version: 7,
      storage: nativeStorage,
      migrate: (persistedState: unknown, fromVersion: number) => {
        console.log('[TrayStore] Migrating from version', fromVersion);
        const state = persistedState as Record<string, unknown>;

        // Safety check: ensure state is an object
        if (!state || typeof state !== 'object') {
          console.warn('[TrayStore] Invalid persisted state, resetting');
          return persistedState;
        }

        // APK downgrade guard: if persisted state is newer than code, skip migration
        if (fromVersion > 7) {
          console.warn('[TrayStore] Persisted state (v' + fromVersion + ') is newer than code — ignoring migration to prevent crash');
          return persistedState;
        }

        // Preserve plan.days through any migration — prevents accidental wipe from version bumps
        const savedPlan = state.plan as Record<string, unknown> | undefined;

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
            state.mealLoop = deepMergeLoopState(loop as Record<string, unknown>, EMPTY_LOOP_STATE as Record<string, unknown>);
          }
        }
        if (fromVersion < 4) {
          const loop = state.mealLoop as { assignments?: Array<{ date: string }> } | undefined;
          if (loop?.assignments && Array.isArray(loop.assignments)) {
            const today = getISODate(new Date());
            loop.assignments = loop.assignments.filter((a) => a.date >= today);
          }
        }
        if (fromVersion < 5) {
          // v5 migration — insertStrategy normalization removed (field no longer exists)
        }

        if (fromVersion < 6) {
          // v5→v6: No-op — actual reconciliation runs post-hydration in App.tsx
          console.log('[TrayStore] v6 migration: no-op (reconciliation runs post-hydration)');
        }
        if (fromVersion < 7) {
          // v6→v7: Strip dead pendingMerge field
          const ml = (persistedState as Record<string, unknown>).mealLoop as Record<string, unknown> | undefined;
          if (ml) delete ml.pendingMerge;
        }

        // Restore plan if a migration accidentally dropped it
        if (savedPlan && (!state.plan || (typeof state.plan === 'object' && !(state.plan as Record<string, unknown>).days))) {
          state.plan = savedPlan;
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
          console.error('[TrayStore] Hydration failed, clearing corrupted storage:', error);
          try { localStorage.removeItem('mealdrama-tray-store'); } catch {}
        } else if (state) {
          console.log('[TrayStore] Hydrated successfully, plan.days:', Object.keys(state.plan.days).length, 'mealLoop.config:', !!state.mealLoop.config);
          // FIX: Deduplicate and cap all slots to prevent tray library pollution
          const cleanedDays: Record<string, DayMeals> = {};
          let needsCleanup = false;
          for (const [date, dayMeals] of Object.entries(state.plan.days)) {
            const cleaned: DayMeals = { breakfast: [], lunch: [], snacks: [], dinner: [] };
            for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
              const items = dayMeals[slot] || [];
              if (items.length === 0) continue;
              // Deduplicate by meal_id (keep first occurrence)
              const seen = new Set<string>();
              const deduped: typeof items = [];
              for (const item of items) {
                const key = item.meal_id || item.id;
                if (!seen.has(key)) {
                  seen.add(key);
                  deduped.push(item);
                }
              }
              // Cap to 2 items max
              if (deduped.length > 2) {
                needsCleanup = true;
                cleaned[slot] = deduped.slice(0, 2);
              } else if (deduped.length !== items.length) {
                needsCleanup = true;
                cleaned[slot] = deduped;
              } else {
                cleaned[slot] = deduped;
              }
            }
            cleanedDays[date] = cleaned;
          }
          if (needsCleanup) {
            queueMicrotask(() => {
              useTrayStore.setState((s) => ({
                plan: { ...s.plan, days: { ...s.plan.days, ...cleanedDays } },
              }));
              console.log('[TrayStore] Cleaned legacy slot pollution (deduped + capped at 2)');
            });
          }
          // Delay reconciliation until both stores are hydrated
          if (useStore.persist.hasHydrated()) {
            reconcileLoopStateWithTray(state);
          } else {
            // Subscribe to useStore hydration and reconcile once
            const unsub = useStore.persist.onFinishHydration(() => {
              reconcileLoopStateWithTray(state);
              unsub();
            });
          }
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

  // Listen for logout: clear debounce timers AND reset tray state (plan.days, mealLoop, etc.)
  // to prevent User A's data from leaking to User B on logout/relogin without full reload.
  _logoutHandler = () => {
    clearAllDebounceTimers();
    useTrayStore.setState({
      plan: { period: 'week', days: {} },
      mealLoop: { ...EMPTY_LOOP_STATE },
      swapHistory: [],
      completions: {},
      skipped: {},
      guestMode: { active: false, startDate: '', endDate: '', extraServings: 0 },
      templates: [],
      lastFeaturedTimes: {},
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

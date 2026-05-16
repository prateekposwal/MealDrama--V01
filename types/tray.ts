// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray Types — Exact interfaces for smart defaults engine
// ─────────────────────────────────────────────────────────────────────────────

/** Meal slot type — drives slot-aware carb defaults */
export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

/** Meal metadata from DB/API — zero hardcoded fallbacks */
export interface Meal {
  id: string;
  name: string;
  icon?: string;
  /** Region for North/South/East/West carb prioritization */
  region: 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast';
  /** Whether this dish is vegan */
  isVegan?: boolean;
  /** Base gravy style (e.g., 'curry', 'dry', 'tadka') */
  baseGravy?: string;
  /** All available gravy options */
  gravyOptions?: string[];
  /** Bread options — empty for rice-only dishes */
  rotiOptions?: string[];
  /** Rice options — empty for bread-only dishes */
  riceOptions?: string[];
  /** Side/accompaniment options */
  sideOptions?: string[];
  /** Beverage options */
  beverageOptions?: string[];
  /** Suggested pairings from DB — drives default selections */
  suggestedPairings?: {
    sides?: string[];
    beverages?: string[];
  };
  /** Tags for light_carb detection in snacks slot */
  tags?: string[];
  /** Meal categories for slot-aware inference */
  category?: string[];
}

/** Result of applySmartDefaults — chip state initialized from meal + slot */
export interface TrayItemDefaults {
  /** Single-select: resolved gravy */
  gravy: string | null;
  /** Single-select: resolved roti (null if skipped) */
  roti: string | null;
  /** Single-select: resolved rice (null if skipped) */
  rice: string | null;
  /** Multi-select: 2 sides max */
  sides: string[];
  /** Multi-select: 1-2 beverages */
  beverages: string[];
  /** Multi-select: dessert */
  dessert: string[];
  /** Per-item default quantities (item name → qty) */
  itemQtys: Record<string, number>;
}

/** Full tray item stored in Zustand state */
export interface TrayItem {
  id: string;
  meal_id: string;
  name: string;
  icon?: string;
  /** Auto-generated title e.g. "Rajma Chawal + Raita, Pickle + Chaas" */
  title?: string;
  /** Style group selected during dish selection (Gravy, Dry, Fry, etc.) */
  style?: string;
  /** Customization preference log for ML training */
  customizations?: Array<{
    category: string;
    suggested: string[];
    chosen: string[];
    source?: string;
    timestamp: number;
  }>;
  /** Smart suggestions version: 0 = legacy hardcoded, 1 = smart inference */
  smartVersion?: number;
  /** Preserved across swaps */
  quantity: number;
  /** Servings count */
  servings: number;
  /** Selected chips from defaults */
  gravy: string | null;
  roti: string | null;
  rice: string | null;
  sides: string[];
  beverages: string[];
  /** Multi-select: dessert */
  dessert: string[];
  /** Per-item quantities (item name → qty, e.g. "Roti" → 4, "Chaas" → 2) */
  itemQtys: Record<string, number>;
  /** Variant type name for multi-variant dishes (e.g. "Chicken", "Veg") */
  variant?: string;
  /** Variant ID for multi-variant dishes */
  variantId?: string;
  /** Optional addon */
  addon?: string;
  /** Timestamp of last swap */
  swapTimestamp?: number;
  /** Custom time window for this meal slot (HH:MM format) */
  start_time?: string;
  end_time?: string;
}

/** Day's meal structure */
export interface DayMeals {
  breakfast: TrayItem[];
  lunch: TrayItem[];
  snacks: TrayItem[];
  dinner: TrayItem[];
}

/** Offline action types */
export interface OfflineAction {
  id: string;
  type: 'add' | 'swap' | 'update' | 'remove';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

/** Save status for UI indicator */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Swap record for undo */
export interface SwapRecord {
  id: string;
  date: string;
  mealType: MealType;
  itemId: string;
  oldMealId: string;
  newMealId: string;
  timestamp: number;
}

/** Guest mode state */
export interface GuestMode {
  active: boolean;
  startDate: string;
  endDate: string;
  extraServings: number;
  guestCount?: number;
  guestNames?: string[];
}

/** Saved slot configuration template with versioning */
export interface SavedTemplate {
  id: string;
  name: string;
  version: number;
  slotConfigs: Record<string, { start: string; end: string; templateId: string }>;
  period: 'week' | 'biweek' | 'month';
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Meal Loop (Post-Tray Auto-Rotation) ────────────────────────────────────

export type RepeatPattern = 'sequential' | 'random';

export type InsertStrategy = 'append' | 'smart-shuffle' | 'immediate' | 'next-cycle';

export interface MealLoopConfig {
  cycleLength: number;
  startDate: string;
  skipDays: number[];
  repeatPattern: RepeatPattern;
  insertStrategy: InsertStrategy;
}

export interface RotationQueueItem {
  dishId: string;
  dishName: string;
  mealType: MealType;
  style?: string;
  deprecated?: boolean;
}

export interface MealLoopAssignment {
  date: string;
  mealType: MealType;
  dishId: string;
  dishName: string;
  order: number;
  deprecated?: boolean;
}

export interface MealLoopState {
  config: MealLoopConfig | null;
  sourceDishIds: string[];
  pool_version: number;
  rotationQueue: RotationQueueItem[];
  next_index: number;
  pendingMerge: RotationQueueItem[];
  assignments: MealLoopAssignment[];
  overrides: Record<string, string>;
}

export const EMPTY_LOOP_STATE: MealLoopState = {
  config: null,
  sourceDishIds: [],
  pool_version: 1,
  rotationQueue: [],
  next_index: 0,
  pendingMerge: [],
  assignments: [],
  overrides: {},
};

/**
 * Compute adjusted serving count for a meal on a given date.
 * Returns base servings and guest-adjusted total.
 */
export function computeEffectiveServings(
  quantity: number,
  date: string,
  guestMode: GuestMode,
): { base: number; extra: number; total: number } {
  if (!guestMode.active) return { base: quantity, extra: 0, total: quantity };
  const inRange = date >= guestMode.startDate && date <= guestMode.endDate;
  if (!inRange) return { base: quantity, extra: 0, total: quantity };
  return {
    base: quantity,
    extra: guestMode.extraServings,
    total: quantity + guestMode.extraServings,
  };
}

/** Default time windows per meal slot (HH:MM format) */
export const SLOT_TIME_DEFAULTS: Record<MealType, { start: string; end: string }> = {
  breakfast: { start: '06:00', end: '10:00' },
  lunch: { start: '11:00', end: '15:00' },
  snacks: { start: '15:00', end: '18:00' },
  dinner: { start: '19:00', end: '23:00' },
};

/** Per-user overrides for slot time windows — stored in profile */
export type SlotTimePreferences = Record<MealType, { start: string; end: string }>;

/** Resolve defaults for a slot: check user preferences first, then SLOT_TIME_DEFAULTS */
export function getSlotDefaultTimes(
  mealType: MealType,
  preferences?: SlotTimePreferences | null,
): { start: string; end: string } {
  return preferences?.[mealType] || SLOT_TIME_DEFAULTS[mealType];
}

/** Live meal status based on current time vs. slot time window */
export type LiveStatus = 'upcoming' | 'cooking' | 'history';

/**
 * Resolve live status for a meal slot.
 * Compares current time against the slot's time window.
 * Returns 'upcoming' before start, 'cooking' during the window, 'history' after end.
 */
export function getMealStatus(
  start: string | undefined | null,
  end: string | undefined | null,
  now?: Date,
): LiveStatus {
  const currentTime = now || new Date();
  const startHour = timeToHours(start);
  const endHour = timeToHours(end);
  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  if (currentHour < startHour) return 'upcoming';
  if (currentHour >= startHour && currentHour < endHour) return 'cooking';
  return 'history';
}

/** Convert "HH:MM" to fractional hours for comparison (e.g. "09:30" → 9.5) */
export function timeToHours(t: string | undefined | null): number {
  if (!t) return 0;
  const parts = t.split(':');
  const h = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10);
  if (isNaN(h)) return 0;
  return h + (isNaN(m) ? 0 : m / 60);
}

/**
 * Resolve effective start/end hours for a slot.
 * Reads from the first meal item's start_time/end_time, falls back to
 * user preferences, then SLOT_TIME_DEFAULTS.
 * Returns fractional hours for comparison.
 */
export function resolveSlotTimes(
  items: TrayItem[],
  mealType: MealType,
  preferences?: SlotTimePreferences | null,
): { startHour: number; endHour: number; start: string; end: string } {
  const first = items[0];
  const d = getSlotDefaultTimes(mealType, preferences);
  const start = first?.start_time || d.start;
  const end = first?.end_time || d.end;
  return { startHour: timeToHours(start), endHour: timeToHours(end), start, end };
}

// ─── Slot-Level Aggregation ───────────────────────────────────────────────────

export interface AggregatedCategory {
  name: string;
  totalQty: number;
  unit: string;
}

/**
 * Aggregate all items across dishes in a slot.
 * Deduplicates by name and merges quantities.
 * Returns flat arrays per category with no duplicates.
 */
export function aggregateSlotItems(items: TrayItem[]): {
  gravy: AggregatedCategory[];
  roti: AggregatedCategory[];
  rice: AggregatedCategory[];
  sides: AggregatedCategory[];
  beverages: AggregatedCategory[];
  dessert: AggregatedCategory[];
} {
  const acc = {
    gravy: new Map<string, number>(),
    roti: new Map<string, number>(),
    rice: new Map<string, number>(),
    sides: new Map<string, number>(),
    beverages: new Map<string, number>(),
    dessert: new Map<string, number>(),
  };

  for (const item of items) {
    if (item.gravy) {
      acc.gravy.set(item.gravy, (acc.gravy.get(item.gravy) ?? 0) + (item.itemQtys?.[item.gravy] ?? 1));
    }
    if (item.roti) {
      acc.roti.set(item.roti, (acc.roti.get(item.roti) ?? 0) + (item.itemQtys?.[item.roti] ?? 1));
    }
    if (item.rice) {
      acc.rice.set(item.rice, (acc.rice.get(item.rice) ?? 0) + (item.itemQtys?.[item.rice] ?? 1));
    }
    for (const s of item.sides ?? []) {
      acc.sides.set(s, (acc.sides.get(s) ?? 0) + (item.itemQtys?.[s] ?? 1));
    }
    for (const b of item.beverages ?? []) {
      acc.beverages.set(b, (acc.beverages.get(b) ?? 0) + (item.itemQtys?.[b] ?? 1));
    }
    for (const d of item.dessert ?? []) {
      acc.dessert.set(d, (acc.dessert.get(d) ?? 0) + (item.itemQtys?.[d] ?? 1));
    }
  }

  const mapTo = (m: Map<string, number>, unit: string): AggregatedCategory[] =>
    Array.from(m.entries()).map(([name, totalQty]) => ({ name, totalQty, unit }));

  return {
    gravy: mapTo(acc.gravy, 'servings'),
    roti: mapTo(acc.roti, 'pcs'),
    rice: mapTo(acc.rice, 'bowls'),
    sides: mapTo(acc.sides, 'servings'),
    beverages: mapTo(acc.beverages, 'glasses'),
    dessert: mapTo(acc.dessert, 'pcs'),
  };
}

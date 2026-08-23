// ─────────────────────────────────────────────────────────────────────────────
// Pantry forecast/surplus/reuse engine (P0).
// Pure, deterministic, honest about approximation ("~"):
//  - INPUTS: inventory entries + plan-days delivery (function returning the
//    day's TrayItems) + todayISO (injected, never Date.now).
//  - OUTPUT: per-entry status (surplus/enough/short/unused), forecastTotal,
//    per-day breakdown, surplus, up to 3 reuse suggestions ranked by
//    expiry-then-day, invariants (never over-consume, never negative).
// Unit normalization uses a cup=150ml anchor (the user's stated chai measure);
// pack side is exact, use side is approximate.
// ─────────────────────────────────────────────────────────────────────────────

import type { Ingredient, IngredientCategory } from '../meal/constants/dishLibrary';
import type { Dish } from '../meal/constants/dishLibrary';
import { toBuyGrams, canonicalName } from './ingredientUtils';

export type InventoryStorage = 'fridge' | 'freezer' | 'pantry';

export interface InventoryEntry {
  name: string;
  quantity: number;
  unit: string;
  addedAt: string;
  expiry?: string;
  category?: IngredientCategory;
  storage?: InventoryStorage;
}

export interface PerDayDish {
  date: string;
  dishName: string;
  qty: number;
  unit: string;
}

export interface ReuseSuggestion {
  name: string;
  day: string;
  qty: number;
  unit: string;
}

export type ForecastStatus = 'surplus' | 'enough' | 'short' | 'unused';

export interface ForecastResult {
  entry: InventoryEntry;
  status: ForecastStatus;
  forecastTotal: number;
  unit: string;
  perDay: PerDayDish[];
  surplus: number;
  reuseSuggestions: ReuseSuggestion[];
  expired: boolean;
}

export interface ForecastWorkspace {
  /** Callback per date returning that day's tray items (from the plan store). */
  getDayItems: (date: string) => Array<{ mealId: string; quantity: number }>;
  /** Dishes pool for ingredient resolution (library or store dishes). */
  dishes: Dish[];
  /** Horizon dates (already expanded: tomorrow, +1, +2). */
  horizonDates: string[];
  /** Injection point for library-fallback suggestions (unused for now). */
  dishGraph?: { dishesWithIngredient: (name: string) => string[] };
  /** base: entriesKeep; not used externally; kept for extension. */
  guestFactor?: number;
}

/** Unit → conversion to the entry's native unit scale (approximate). */
export const UNIT_CONVERSIONS: Record<string, number> = {
  ml: 1,
  l: 1000,
  liter: 1000,
  litre: 1000,
  cup: 150, // anchor: user's "1 cup = 150ml"
  cups: 150,
  tbsp: 15,
  tsp: 5,
  g: 1,
  kg: 1000,
  pc: 1,
  packet: 1,
  pinch: 0.5,
  slice: 1,
  slices: 1,
  scoop: 30,
  scoops: 30,
};

/**
 * Sum per-day forecast quantities for an entry's canonical ingredient across
 * the horizon, scaled to the entry's native unit. Returns [] when the entry is
 * not consumed at all. Uses the provided ingredient resolver.
 */
export function computeForecast(
  entry: InventoryEntry,
  workspace: ForecastWorkspace,
  resolver: (dishId: string, dishes: Dish[]) => Ingredient[],
): PerDayDish[] {
  const target = canonicalName(entry.name);
  const entryToUnit = UNIT_CONVERSIONS[entry.unit.toLowerCase()] ?? 1;
  const perDay: PerDayDish[] = [];

  for (const date of workspace.horizonDates) {
    const items = workspace.getDayItems(date);
    let dayQty = 0;
    const names: string[] = [];
    for (const item of items) {
      const ings = resolver(item.mealId, workspace.dishes);
      for (const raw of ings) {
        // Normalize produce/herb units to buy-friendly grams so a user's pack
        // ("Coriander 200 g") reconciles with the forecast row ("coriander").
        const ing = toBuyGrams(raw);
        if (canonicalName(ing.name) !== target) continue;
        const ingUnit = UNIT_CONVERSIONS[ing.unit.toLowerCase()] ?? 1;
        const inEntryUnits = (ing.quantity * ingUnit) / entryToUnit;
        const scaled = inEntryUnits * Math.max(1, item.quantity || 1);
        dayQty += scaled;
        names.push(ing.name);
      }
    }
    if (dayQty > 0) {
      perDay.push({
        date,
        dishName: names[0] || entry.name,
        qty: Math.round(dayQty * 10) / 10,
        unit: entry.unit,
      });
    }
  }
  return perDay;
}

export type ForecastStatusOutcome = {
  status: ForecastStatus;
  forecastTotal: number;
  surplus: number;
};

/** Surplus = max(0, on-hand − forecast). Never negative; 'short' when under. */
export function forecastSurplus(
  entry: InventoryEntry,
  perDay: PerDayDish[],
): ForecastStatusOutcome {
  const forecastTotal = perDay.reduce((s, d) => s + d.qty, 0);
  const onHand = entry.quantity;
  const diff = onHand - forecastTotal;
  if (forecastTotal === 0) return { status: 'unused', forecastTotal, surplus: 0 };
  if (diff > 0) return { status: 'surplus', forecastTotal, surplus: Math.round(diff * 10) / 10 };
  if (diff === 0) return { status: 'enough', forecastTotal, surplus: 0 };
  return { status: 'short', forecastTotal, surplus: 0 };
}

/** Expired flag helper (date injected; false when no expiry). */
export function isExpired(entry: InventoryEntry, todayISO: string): boolean {
  if (!entry.expiry) return false;
  return entry.expiry < todayISO;
}

/**
 * Recommend up to 3 reuse dishes for the surplus.
 * Sources: plan-derived dishes first (from the consumption pass), then a
 * library fallback via the optional DishGraph. Ranked expiry-ascending then
 * day-ascending; never exceeds surplus (running deduction). Deterministic.
 */
export function suggestReuse(
  entry: InventoryEntry,
  surplus: number,
  perDay: PerDayDish[],
  libraryCandidates: string[],
  todayISO: string,
): ReuseSuggestion[] {
  if (surplus <= 0) return [];

  const suggestions: ReuseSuggestion[] = [];
  let remaining = surplus;

  const fromPlan = perDay
    .filter(d => d.qty > 0)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const d of fromPlan) {
    if (remaining <= 0) break;
    const qty = Math.min(d.qty, remaining);
    if (qty <= 0) continue;
    remaining = Math.round((remaining - qty) * 10) / 10;
    suggestions.push({ name: d.dishName, day: d.date, qty, unit: entry.unit });
  }

  for (const cand of libraryCandidates) {
    if (remaining <= 0) break;
    if (suggestions.some(s => s.name === cand)) continue;
    suggestions.push({ name: cand, day: '', qty: Math.round(remaining * 10) / 10, unit: entry.unit });
    remaining -= suggestions[suggestions.length - 1]!.qty;
  }

  return suggestions.slice(0, 3);
}

/** Full P0 pipeline for one entry — deterministic, date injected. */
export function forecastForEntry(
  entry: InventoryEntry,
  workspace: ForecastWorkspace,
  opts: {
    todayISO: string;
    libraryCandidates?: string[];
    resolver?: (dishId: string, dishes: Dish[]) => Ingredient[];
  },
): ForecastResult {
  const resolver = opts.resolver ?? ((_dishId, _dishes) => []);
  const perDay = computeForecast(entry, workspace, resolver);
  const { status, forecastTotal, surplus } = forecastSurplus(entry, perDay);
  const expired = isExpired(entry, opts.todayISO);
  const reuseSuggestions =
    status === 'surplus'
      ? suggestReuse(entry, surplus, perDay, opts.libraryCandidates ?? [], opts.todayISO)
      : [];

  return {
    entry,
    status,
    forecastTotal,
    unit: entry.unit,
    perDay,
    surplus,
    reuseSuggestions,
    expired,
  };
}

/** Small keyword table → ingredient category (P2): feeds expiry + storage defaults. */
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  dairy: ['milk', 'curd', 'yogurt', 'yoghurt', 'dahi', 'paneer', 'ghee', 'butter', 'cheese', 'cream', 'khoya', 'lassi'],
  proteins: ['chicken', 'fish', 'meat', 'mutton', 'egg', 'prawn', 'shrimp', 'tofu', 'lentil', 'dal', 'rajma', 'chole', 'keema', 'pork', 'lamb'],
  grains: ['rice', 'flour', 'atta', 'maida', 'sooji', 'rava', 'oats', 'wheat', 'pasta', 'noodle', 'quinoa', 'barley', 'corn', 'couscous'],
  breads: ['bread', 'roti', 'chapati', 'naan', 'pav', 'bun', 'baguette', 'tortilla', 'paratha', 'kulcha'],
  spices: ['spice', 'masala', 'salt', 'pepper', 'turmeric', 'haldi', 'jeera', 'cumin', 'dhania', 'garam masala', 'chilli powder', 'cardamom', 'elaichi', 'cinnamon', 'clove', 'laung', 'hing', 'asafoetida', 'mustard', 'rai', 'methi', 'fenugreek', 'tamarind', 'paprika', 'bay', 'seasoning', 'sugar'],
  produce: ['fruit', 'veg', 'onion', 'tomato', 'potato', 'apple', 'banana', 'mango', 'carrot', 'coriander', 'mint', 'lemon', 'lime', 'ginger', 'garlic', 'cucumber', 'spinach', 'pumpkin', 'okra', 'peas', 'cabbage', 'cauliflower', 'chilli', 'beans', 'ladyfinger', 'broccoli', 'mushroom', 'zucchini', 'squash', 'beetroot', 'radish', 'green'],
  snacks: ['biscuit', 'chip', 'cookie', 'namkeen', 'snack'],
  pantry: ['oil', 'honey', 'jam', 'sauce', 'ketchup', 'mayo', 'pickle', 'chutney', 'vinegar', 'coconut', 'cashew', 'almond', 'raisin', 'vanilla', 'baking', 'soda', 'stock', 'syrup', 'peanut', 'chocolate', 'dry fruit', 'kaju', 'badam'],
};

/**
 * Best-effort category for an ingredient name (case-insensitive substring
 * match over the small table above). Defaults to 'pantry'. Deterministic.
 */
export function categoryForName(name: string): IngredientCategory {
  const lower = (name || '').toLowerCase().trim();
  for (const category of Object.keys(CATEGORY_KEYWORDS) as IngredientCategory[]) {
    if (CATEGORY_KEYWORDS[category].some(k => lower.includes(k))) return category;
  }
  return 'pantry';
}

/** Default storage by category: perishables go to the fridge, dry goods to the pantry. */
export function defaultStorageFor(category?: IngredientCategory): InventoryStorage {
  return category === 'dairy' || category === 'proteins' || category === 'produce' || category === 'breads'
    ? 'fridge'
    : 'pantry';
}

/** Shelf-life defaults per ingredient category (days). Honest approximations. */
export const SHELF_LIFE_DAYS: Record<string, number> = {
  dairy: 3,
  produce: 4,
  breads: 3,
  proteins: 2,
  pantry: 365,
  grains: 365,
  spices: 365,
  snacks: 180,
};

/** Compute a suggested expiry from a category (date injected). */
export function defaultExpiry(addedAtISO: string, category?: string, storage?: InventoryStorage): string {
  const days = SHELF_LIFE_DAYS[category ?? 'pantry'] ?? 365;
  let effective = days;
  if (storage === 'freezer' && (category === 'dairy' || category === 'breads' || category === 'proteins')) {
    effective = days * 10;
  }
  // Pure UTC date math (no local-timezone skew): round-tripping through the
  // ISO slice keeps the result stable regardless of the machine's TZ.
  const d = new Date(addedAtISO.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + effective);
  return d.toISOString().slice(0, 10);
}
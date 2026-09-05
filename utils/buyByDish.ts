// ─────────────────────────────────────────────────────────────────────────────
// BUY-BY-DISH — the pantry grouped the way a cook thinks (recipe-first).
// For each planned dish (yours + family), its ingredients are shown as
// ✓ have / ✗ buy (with the exact deficit), with a "mark all bought" per dish.
// A CART view re-aggregates every ✗ once (no double-buy). Leftover-Radar flags
// it when a NEEDED ingredient is already in stock AND near expiry ("use first").
// Pure + reactive at the caller.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import type { AggregatedIngredient } from './shareMessages';
import { buyListFor, StockMap } from './buyList';
import { getIngredientsForMealOption, isPlaceholderIngredients, ensureNameMains } from './ingredientUtils';
import { aggregateIngredients } from './shareMessages';

/** Generic placeholders that are pipeline NOISE, never a recipe need. */
const NOISE_NAMES = new Set(['spice', 'spices', 'spice mix', 'spice packet', 'mixed spices', 'masala packet']);

/** The dish's REAL ingredients: explicit variant ingredients when present;
 *  otherwise the inference output minus generic noise. This kills the
 *  "auto-selected Ghee/Oil/Spice" filler on dishes that already come with
 *  a recipe. When a dish offers MULTIPLE variants (egg vs eggless banana
 *  bread), the one matching the user's diet is chosen — veg/vegan → eggless,
 *  eggitarian/non-veg → the egg variant (the "4 users, one bread" gap). */
export function recipeIngredients(
  dish: Dish,
  library: Dish[] = [dish],
  diet?: string | null,
): AggregatedIngredient[] {
  const variants = (dish.variants ?? []).filter(v => (v.ingredients ?? []).length > 0)
    ?? dish.variants ?? [];
  const eggless = variants.find(v => /without egg|eggless|vegan|without butter|no brown sugar|no sugar/i.test(v.name));
  const withEgg = variants.find(v => (v.ingredients ?? []).some(i => /^egg|egg\b|eggs\b/i.test(i.name)));
  const wantEggs = diet !== null && diet !== undefined && /eggitarian|non-veg/i.test(diet);
  const chosen = wantEggs ? (withEgg ?? eggless ?? variants[0]) : (eggless ?? variants[0]);
  const explicit = chosen?.ingredients ?? [];
  // A stub/wrong-recipe explicit list (placeholder gate) is NOT a recipe —
  // fall through to the inference engine so the dish's main is never lost.
  // A real but incomplete list keeps its items BUT gets the name-implied
  // main appended (stir-fry base on Chicken Manchurian → +Chicken).
  if (explicit.length > 0 && !isPlaceholderIngredients(explicit)) {
    return aggregateIngredients(ensureNameMains(explicit, dish.id, chosen?.name ?? dish.name, dish.type));
  }
  const inferred = getIngredientsForMealOption(dish.id, dish.variants?.[0]?.id ?? '', library.length ? library : undefined as any);
  return aggregateIngredients(inferred.filter(i => !NOISE_NAMES.has(i.name.toLowerCase())));
}

export interface BuyItem extends AggregatedIngredient {
  /** missing = buy · staple = on hand (catalog) · stock = logged quantity */
  status: 'missing' | 'staple' | 'stock';
  deficit?: number;
}

export interface BuyDishGroup {
  key: string;        // dishId (stable card id)
  dishId: string | null;
  dishName: string;
  icon: string;
  members: number;    // how many family members planned it (×2 = batch)
  items: BuyItem[];
  hasMissing: boolean;
}

export interface BuyCartLine extends AggregatedIngredient { }

export interface BuySummary { dishes: number; itemsToBuy: number; }

export interface RadarUse { name: string; daysLeft: number; }

/** Build dish-grouped buy cards from resolved plan entries + stock. */
export function dishBuyGroups(
  planEntries: Array<{ dish: Dish; members: number }>,
  ingredientsOf: (dish: Dish) => AggregatedIngredient[],
  stock: StockMap,
  staples: string[],
): BuyDishGroup[] {
  const stapleNames = new Set(staples.map(s => s.trim().toLowerCase()));
  return planEntries.map(({ dish, members }) => {
    const needed = ingredientsOf(dish).filter(i => !NOISE_NAMES.has(i.name.toLowerCase()));
    const items: BuyItem[] = needed.map(ing => {
      const key = ing.name.toLowerCase();
      const st = stock.get(key);
      const inStock = !!st && (st.quantity ?? 0) > 0;
      const inStaples = stapleNames.has(key) && !inStock;
      const deficit = st?.quantity !== undefined && ing.quantity !== undefined && st.unit && ing.unit && st.unit.toLowerCase() === ing.unit.toLowerCase()
        ? Math.max(0, Math.round((ing.quantity - st.quantity) * 100) / 100)
        : null;
      // In stock but SHORT of the recipe → still to buy (deficit), not ✓.
      const covered = inStock && (deficit === null || deficit <= 0);
      const status: BuyItem['status'] = covered
        ? 'stock'
        : (!inStock && inStaples && deficit === null ? 'staple' : 'missing');
      return {
        ...ing,
        status,
        quantity: status === 'missing' && deficit !== null && deficit > 0 ? deficit : ing.quantity,
        deficit: deficit !== null && deficit > 0 ? deficit : undefined,
      };
    });
    return {
      key: dish.id,
      dishId: dish.id,
      dishName: dish.name,
      icon: dish.icon,
      members,
      items,
      hasMissing: items.some(i => i.status === 'missing'),
    };
  }).filter(g => g.items.length > 0);
}

/** Consolidated CART view — every ✗ once, summed (buy-once). */
export function buyCart(groups: BuyDishGroup[]): BuyCartLine[] {
  const map = new Map<string, BuyCartLine>();
  for (const g of groups) {
    for (const item of g.items) {
      if (item.status !== 'missing' || !item.quantity) continue;
      const key = `${item.name.toLowerCase()}|${(item.unit ?? '').toLowerCase()}`;
      const ex = map.get(key);
      if (ex) {
        ex.quantity = Math.round(((ex.quantity ?? 0) + (item.quantity ?? 0)) * 100) / 100;
      } else {
        map.set(key, { ...item });
      }
    }
  }
  return [...map.values()];
}

export function buySummary(groups: BuyDishGroup[]): BuySummary {
  return {
    dishes: groups.filter(g => g.hasMissing).length,
    itemsToBuy: groups.reduce((n, g) => n + g.items.filter(i => i.status === 'missing').length, 0),
  };
}

/** Radar: a NEEDED item already in stock and near expiry → use before buying. */
export function radarUses(groups: BuyDishGroup[], expiring: Array<{ name: string; daysLeft: number }>): RadarUse[] {
  const needed = new Set<string>();
  for (const g of groups) for (const i of g.items) needed.add(i.name.toLowerCase());
  return expiring
    .filter(e => needed.has(e.name.toLowerCase()))
    .map(e => ({ name: e.name, daysLeft: e.daysLeft }));
}

/** Pure "bought this dish" effect — every missing item now counts as stock. */
export function markDishBought(groups: BuyDishGroup[], key: string): BuyDishGroup[] {
  return groups.map(g => g.key !== key ? g : {
    ...g,
    items: g.items.map(i => (i.status !== 'missing' ? i : { ...i, status: 'stock' as const })),
    hasMissing: false,
  });
}

/**
 * User corrections to the "what do you actually have" assumption:
 *   • manualHave  — a ✗ item the user claims they own → becomes 🟡 (not bought).
 *   • notHave     — a 🟡 staple (assumed on hand) the user says they DON'T own
 *                   → becomes ✗ (moves into "to buy").
 * Disjoint by construction; a name can't be in both.
 */
export function applyAssumptions(
  groups: BuyDishGroup[],
  manualHave: Set<string> = new Set(),
  notHave: Set<string> = new Set(),
): BuyDishGroup[] {
  const mh = new Set([...manualHave].map(s => s.toLowerCase()));
  const nh = new Set([...notHave].map(s => s.toLowerCase()));
  return groups.map(g => ({
    ...g,
    items: g.items.map(i => {
      const key = i.name.toLowerCase();
      if (mh.has(key) && i.status === 'missing') return { ...i, status: 'staple' as const };
      if (nh.has(key) && i.status === 'staple') return { ...i, status: 'missing' as const };
      return i;
    }),
    hasMissing: g.items.some(i => {
      const key = i.name.toLowerCase();
      if (i.status === 'missing') return !mh.has(key);
      if (i.status === 'staple') return nh.has(key);
      return false;
    }),
  }));
}

// ─── Batch-buy helpers (category view + "buy everything") ────────────────────
export const BUY_CATEGORY_META: Record<string, { icon: string; label: string }> = {
  produce: { icon: '🥦', label: 'FRESH' },
  dairy: { icon: '🥛', label: 'DAIRY' },
  grains: { icon: '🌾', label: 'STAPLES' },
  spices: { icon: '🌶️', label: 'SPICES' },
  pantry: { icon: '🫙', label: 'PANTRY' },
  breads: { icon: '🍞', label: 'BREADS' },
  proteins: { icon: '🍗', label: 'PROTEINS' },
  snacks: { icon: '🍿', label: 'SNACKS' },
};

export type BuyCategoryGroup = { category: string; items: BuyItem[] };

/** Aisle view: re-group every dish's items by ingredient category. */
export function categoryGroups(groups: BuyDishGroup[]): BuyCategoryGroup[] {
  const map = new Map<string, BuyItem[]>();
  for (const g of groups) {
    for (const i of g.items) {
      const cat = i.category ?? 'pantry';
      const arr = map.get(cat) ?? [];
      arr.push(i);
      map.set(cat, arr);
    }
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

export interface BuyRunItem { name: string; quantity?: number; unit?: string }

/** Everything still to buy — one flat list for "Buy all missing". */
export function allMissingItems(groups: BuyDishGroup[], manualHave: Set<string> = new Set()): BuyRunItem[] {
  const out: BuyRunItem[] = [];
  for (const g of groups) {
    for (const i of g.items) {
      if (i.status !== 'missing' || manualHave.has(i.name.toLowerCase())) continue;
      out.push({ name: i.name, quantity: i.quantity, unit: i.unit });
    }
  }
  return out;
}

// ─── Assumption persistence (survives app restart) ────────────────────────────
export function serializeAssumptions(manualHave: Set<string>, notHave: Set<string>): string {
  return JSON.stringify({
    mh: [...manualHave].map(s => s.toLowerCase()).sort(),
    nh: [...notHave].map(s => s.toLowerCase()).sort(),
  });
}

export function parseAssumptions(json: string | null): { manualHave: Set<string>; notHave: Set<string> } {
  const empty = { manualHave: new Set<string>(), notHave: new Set<string>() };
  if (!json) return empty;
  try {
    const o = JSON.parse(json) as { mh?: string[]; nh?: string[] };
    return { manualHave: new Set(o.mh ?? []), notHave: new Set(o.nh ?? []) };
  } catch {
    return empty;
  }
}
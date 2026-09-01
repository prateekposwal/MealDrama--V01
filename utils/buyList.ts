// ─────────────────────────────────────────────────────────────────────────────
// BUY-LIST — "buy before the cook starts". Every ingredient the plan is based
// on must be in the pantry. Engine:
//   • planIngredients — all ingredients for a date (your plan + family week),
//                        aggregated ONCE (dedupe by name+unit, qty summed).
//   • buyListFor      — needs-buying = needed minus what's already in stock
//                        (staples names + inventory entries; unit-aware when
//                        comparable, else presence-only).
//   • purchasedEnough — did the user buy everything needed? (the completion
//                        check for the notification).
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { SharedPlanItem } from '../app/utils/householdFeedApi';
import { getIngredientsForMealOption } from './ingredientUtils';
import { aggregateIngredients, AggregatedIngredient } from './shareMessages';

export type StockMap = Map<string, { quantity?: number; unit?: string }>;

/** Ingredients for a set of dishes (by id) — deduped per dish then merged. */
export function planIngredients(
  dishIds: string[],
  library: Dish[] = DISH_LIBRARY,
): AggregatedIngredient[] {
  const all: AggregatedIngredient[] = [];
  const seen = new Set<string>();
  for (const id of dishIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const dish = library.find(d => d.id === id);
    if (!dish) continue;
    all.push(...getIngredientsForMealOption(dish.id, dish.variants?.[0]?.id ?? '', library));
  }
  return aggregateIngredients(all);
}

/** Dish ids in YOUR plan for a date (single cards per slot). */
export type DayMeals = Record<string, Array<{ meal_id?: string; dishId?: string; name?: string }>>;

export function planDishIds(day: DayMeals | undefined): string[] {
  const ids: string[] = [];
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner']) {
    for (const m of day?.[slot] ?? []) {
      if (m.meal_id || m.dishId) ids.push((m.meal_id ?? m.dishId)!);
    }
  }
  return ids;
}

/** Dish ids in the household family week for a date (+ status filter). */
export function familyDishIds(
  items: SharedPlanItem[],
  date: string,
  statuses: string[] = ['planned', 'requested', 'accepted'],
): string[] {
  return items
    .filter(i => i.date === date && statuses.includes(i.status))
    .map(i => i.dishId)
    .filter((id): id is string => !!id);
}

const DEFAULT_UNIT_RATIOS: Record<string, number> = {
  pc: 1, pcs: 1, piece: 1, pieces: 1,
  tbsp: 1, tsp: 1, g: 1, cup: 1, cups: 1,
};

/** Buy list: needed minus available. Quantity-deficit when units are
 *  comparable; otherwise presence-only (in stock ⇒ bought). */
export function buyListFor(
  needed: AggregatedIngredient[],
  stock: StockMap,
  explicitHave: string[],
): AggregatedIngredient[] {
  const haveNames = new Set(explicitHave.map(s => s.trim().toLowerCase()));
  const missing: AggregatedIngredient[] = [];
  for (const ing of needed) {
    const key = ing.name.toLowerCase();
    const st = stock.get(key);
    const available = st !== undefined || haveNames.has(key);
    if (!available) {
      missing.push({ ...ing });
      continue;
    }
    // Unit-comparable deficit (same unit family) → buy the shortfall only.
    if (st?.quantity !== undefined && ing.quantity !== undefined && st.unit && ing.unit) {
      const ratio = DEFAULT_UNIT_RATIOS[ing.unit.toLowerCase()] ?? DEFAULT_UNIT_RATIOS[st.unit.toLowerCase()];
      const sameUnit = ing.unit.toLowerCase() === st.unit.toLowerCase();
      if (sameUnit || ratio) {
        const haveQ = sameUnit ? st.quantity : st.quantity * (DEFAULT_UNIT_RATIOS[st.unit.toLowerCase()] ?? 1);
        const needQ = sameUnit ? ing.quantity : ing.quantity * (DEFAULT_UNIT_RATIOS[ing.unit.toLowerCase()] ?? 1);
        const deficit = Math.round((needQ - haveQ) * 100) / 100;
        if (deficit > 0) missing.push({ ...ing, quantity: deficit });
      }
    }
  }
  return missing;
}

/** True when every planned ingredient is covered by stock (or no plan meals). */
export function purchasedEnough(
  needed: AggregatedIngredient[],
  stock: StockMap,
  explicitHave: string[],
): boolean {
  return buyListFor(needed, stock, explicitHave).length === 0;
}
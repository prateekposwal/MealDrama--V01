// ─────────────────────────────────────────────────────────────────────────────
// Health-insight helpers for the Dashboard "Today's nutrition" popup.
// Pure, deterministic, honest about data gaps:
//  - calories are summed from REAL per-dish `calories` values (× servings);
//    when some dishes lack calorie data the total is marked approximate.
//  - pantry-gap checks follow the app's normalized presence convention —
//    only MISSING items are surfaced as "add to pantry".
//  - tip dishes are ordered region-first (exact → nearest → all → rest),
//    ordering-only, never excluding any dish.
// ─────────────────────────────────────────────────────────────────────────────

import type { Dish } from '../meal/constants/dishLibrary';
import type { TrayItem } from '../types/tray';
import { compareRegion } from './regionPreference';
import { getIngredientsForMealOption } from './ingredientUtils';
import { getDishCalorieInfo } from '../meal/constants/dishCalories';

export interface CalorieTally {
  /** Sum of today's per-dish calories (× servings) where calorie data exists. */
  totalKcal: number;
  /** Number of today's tray items whose dish had a real calorie value. */
  countedItems: number;
  /** Number of today's tray items whose dish relied on a fallback estimate. */
  estimatedCount: number;
  /** Number of today's tray items (quantity > 0). */
  totalItems: number;
  /** True when some—but not all—dishes had calorie data (mark total approx). */
  approximate: boolean;
  /** True when meals exist but NO dish has calorie data — honest "no data". */
  unknown: boolean;
}

/** Sum today's REAL dish calories, × servings. Never invents a value. */
export function computeTodaysCalories(trayItems: TrayItem[], dishes: Dish[]): CalorieTally {
  const items = (trayItems || []).filter(i => (i.quantity ?? 1) > 0); // explicit 0 servings = not consumed
  let totalKcal = 0;
  let countedItems = 0;
  let estimatedItems = 0;
  for (const item of items) {
    const dish = (dishes || []).find(d => d.id === item.meal_id);
    const info = dish ? getDishCalorieInfo(dish) : undefined;
    if (info && info.kcal > 0) {
      totalKcal += info.kcal * Math.max(1, item.quantity || 1);
      countedItems += 1;
      if (info.estimated) estimatedItems += 1;
    }
  }
  return {
    totalKcal: Math.round(totalKcal),
    countedItems,
    totalItems: items.length,
    // Approximate when some dishes are unresolved OR any rely on fallback estimates.
    approximate: countedItems > 0 && (countedItems < items.length || estimatedItems > 0),
    unknown: items.length > 0 && countedItems === 0,
    estimatedCount: estimatedItems,
  };
}

/**
 * Normalized pantry-presence check. Matches the app's pantry convention
 * (trimmed, case-insensitive) and treats a pantry staple as covering an item
 * when the staple explicitly names it (e.g. "Green Tea Bags" ⊃ "Green Tea") —
 * but never the reverse, so "Oil" does not masquerade as "Mustard Oil".
 */
export function pantryHasItem(pantryStaples: string[], item: string): boolean {
  const normalize = (s: string) => (s || '').trim().toLowerCase();
  const target = normalize(item);
  if (!target) return false;
  return (pantryStaples || []).some(s => {
    const staple = normalize(s);
    return staple === target || staple.includes(target);
  });
}

/** Items NOT already in the pantry — order preserved, deduped, first occurrence wins. */
export function missingPantryItems(items: string[], pantryStaples: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items || []) {
    const key = (item || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (!pantryHasItem(pantryStaples, item)) out.push(item);
  }
  return out;
}

/** Region-first ordering: exact → nearest → all → rest. Deterministic. NEVER excludes. */
export function orderDishesRegionFirst(dishes: Dish[], regionKey: string): Dish[] {
  return [...dishes].sort((a, b) =>
    compareRegion(regionKey, a.region, b.region) || a.name.localeCompare(b.name),
  );
}

/** Staples assumed present in any kitchen — never surfaced as tip "add" gaps. */
const GENERIC_STAPLES = new Set([
  'salt', 'oil', 'ghee', 'spices', 'water', 'pepper', 'sugar', 'tea', 'coffee', 'turmeric', 'chilli',
]);

export function isGenericStaple(name: string): boolean {
  return GENERIC_STAPLES.has((name || '').trim().toLowerCase());
}

/** Ingredients the suggested tip dishes need, minus what the user already has. */
export function dishIngredientGaps(
  matchedDishes: Dish[],
  dishes: Dish[],
  pantryStaples: string[],
): string[] {
  const ingredientNames: string[] = [];
  for (const dish of matchedDishes || []) {
    const variantId = dish.variants?.[0]?.id ?? '';
    for (const ing of getIngredientsForMealOption(dish.id, variantId, dishes)) {
      if (!isGenericStaple(ing.name)) ingredientNames.push(ing.name);
    }
  }
  return missingPantryItems(ingredientNames, pantryStaples);
}

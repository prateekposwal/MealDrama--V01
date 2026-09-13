// ─────────────────────────────────────────────────────────────────────────────
// DIET COMPATIBILITY — the pure diet/vegan guard, extracted so BOTH the meal
// pipeline (utils/mealPlanRegen) and the recommendation gates
// (utils/recommendation) share ONE implementation (no parallel copy).
//
// Data facts (unchanged from the original location):
//   · dish.type is the canonical diet axis; dish.diet is the legacy field
//     ('egg' → eggitarian).
//   · 3 vegan-typed dishes carry REAL animal dairy ingredient names and 2
//     carry Eggs — the vegan guard checks exact ingredient/side names so a
//     mislabeled "vegan" dish is excluded honestly.
//   · Exact animal names only (substring matching would false-block plant
//     milks — the vegan-integrity F2/F3 contract).
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import { allowedTypesForDiet } from './dietQuota';

/** Canonical dish diet type. `type` is canonical; legacy `diet` ('egg' →
 *  eggitarian) is the fallback. Custom/unresolvable → ''. */
export function dishDietType(dish: Dish): string {
  const t = (dish.type || '').toLowerCase().trim();
  if (t) return t;
  const d = (dish.diet || '').toLowerCase().trim();
  return d === 'egg' ? 'eggitarian' : d;
}

/** EXACT animal-derived ingredient/side names — the only honest name-level
 *  guard. Never substring-matches (plant milks are not dairy). */
export const ANIMAL_INGREDIENT_NAMES: ReadonlySet<string> = new Set([
  'Ghee', 'Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Paneer',
  'Buttermilk', 'Lassi', 'Raita', 'Curd',
  'Whole Milk (chilled)', 'Vanilla Ice Cream',
  'Egg', 'Eggs', 'Egg White', 'Egg Yolk',
]);

/** True when any variant ingredient or default side carries an exact
 *  animal-derived name (dairy or egg). */
export function dishHasAnimalDerivedIngredients(dish: Dish): boolean {
  const names: string[] = [];
  for (const v of dish.variants ?? []) {
    for (const i of v.ingredients ?? []) names.push(i.name);
  }
  for (const s of dish.defaultPairings?.sides ?? []) names.push(s);
  return names.some(n => ANIMAL_INGREDIENT_NAMES.has(n));
}

/** Diet compatibility of ONE dish — validates the FINAL dish, not just the
 *  first selection: type gate + the vegan animal-ingredient guard. */
export function isMealDietCompatible(dish: Dish, diet?: string | null): boolean {
  const allowed = new Set(allowedTypesForDiet(diet));
  if (!allowed.has(dishDietType(dish))) return false;
  if ((diet ?? '').toLowerCase().trim() === 'vegan' && dishHasAnimalDerivedIngredients(dish)) return false;
  return true;
}

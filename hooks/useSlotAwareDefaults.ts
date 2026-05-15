// ─────────────────────────────────────────────────────────────────────────────
// useSlotAwareDefaults — Thin React hook that memoizes defaults per meal/slot.
// Returns smart defaults for a given Dish + MealType combination.
// Components use this to pre-populate chip state on mount.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { applySmartDefaults } from '../store/helpers/applySmartDefaults';
import type { Meal, MealType, TrayItemDefaults } from '../types/tray';
import type { Dish } from '../constants/dishLibrary';

/** Convert Dish (library) to Meal (defaults engine) */
function dishToMeal(dish: Dish): Meal {
  return {
    id: dish.id,
    name: dish.name,
    icon: dish.icon,
    region: dish.region,
    isVegan: dish.type === 'vegan',
    baseGravy: dish.gravyType ? String(dish.gravyType) : undefined,
    gravyOptions: dish.gravyType ? [String(dish.gravyType)] : undefined,
    rotiOptions: dish.rotiOptions,
    riceOptions: dish.riceOptions,
    sideOptions: dish.sideOptions,
    beverageOptions: dish.beverageOptions,
    suggestedPairings: {
      sides: dish.sideOptions?.slice(0, 2),
      beverages: dish.beverageOptions?.slice(0, 2),
    },
    tags: dish.tags,
  };
}

/**
 * Hook that memoizes smart defaults for a meal + slot combination.
 * Re-computes only when dish or slotType changes.
 *
 * @param dish - Dish from library or backend
 * @param slotType - Meal slot (breakfast/lunch/snacks/dinner)
 * @returns TrayItemDefaults with resolved chip selections
 */
export function useSlotAwareDefaults(
  dish: Dish | undefined,
  slotType: MealType
): TrayItemDefaults | null {
  return useMemo(() => {
    if (!dish) return null;
    const meal = dishToMeal(dish);
    return applySmartDefaults(meal, slotType);
  }, [dish?.id, slotType]);
}

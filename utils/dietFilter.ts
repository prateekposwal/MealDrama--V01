// ─────────────────────────────────────────────────────────────────────────────
// Diet Filter — Single source of truth for diet-based filtering
// Used by SwapCustomizeModal, SmartSuggestionChips, and suggestion engines
// ─────────────────────────────────────────────────────────────────────────────

export type DietType = 'veg' | 'non-veg' | 'eggitarian' | 'vegan' | 'all';
export type DishDietType = 'veg' | 'non-veg' | 'eggitarian' | 'vegan';

/**
 * Returns the list of dish diet types that are allowed for a given user diet.
 * - veg: only veg dishes
 * - non-veg: all dishes (veg, non-veg, eggitarian, vegan)
 * - eggitarian: veg, eggitarian, non-veg (eggs are OK, but no meat/fish)
 * - vegan: only vegan and veg dishes
 * - all: all dishes
 */
export function getAllowedDishTypes(userDiet: DietType): DishDietType[] {
  switch (userDiet) {
    case 'veg':
      return ['veg', 'vegan'];
    case 'non-veg':
      return ['veg', 'non-veg', 'eggitarian', 'vegan'];
    case 'eggitarian':
      return ['veg', 'eggitarian', 'non-veg'];
    case 'vegan':
      return ['veg', 'vegan'];
    case 'all':
    default:
      return ['veg', 'non-veg', 'eggitarian', 'vegan'];
  }
}

/**
 * Check if a dish type is allowed for a given user diet.
 */
export function isDishAllowedForDiet(dishType: DishDietType, userDiet: DietType): boolean {
  return getAllowedDishTypes(userDiet).includes(dishType);
}

/**
 * Legacy compatibility: returns array of allowed types (for DIET_FILTER pattern).
 */
export function getDietFilterArray(userDiet: string): string[] {
  return getAllowedDishTypes(userDiet as DietType);
}

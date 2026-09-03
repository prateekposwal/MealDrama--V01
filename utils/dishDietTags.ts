// ─────────────────────────────────────────────────────────────────────────────
// Diet tags for dish library dishes — enables diet-aware filtering and UI display.
// ─────────────────────────────────────────────────────────────────────────────

import type { Dish } from '../meal/constants/dishLibrary';

// Meat/poultry keywords used to identify non-veg dishes by name
const MEAT_KEYWORDS = [
  'chicken', 'mutton', 'beef', 'pork', 'fish', 'prawn', 'seafood', 'meat', 'bird',
];

// Egg keywords
const EGG_KEYWORDS = ['egg', 'eggs'];

/**
 * Infer diet classification from a dish name.
 * Returns one of: 'veg', 'eggitarian', 'non-veg', or null if unknown.
 */
export function inferDietFromName(dishName: string): string | null {
  const lower = (dishName || '').toLowerCase().trim();

  // Check for egg-related dishes (but not eggplant/brinjal)
  const isEggPlant = lower.includes('eggplant') || lower.includes('brinjal') || lower.includes('baingan');
  const hasEggKeyword = EGG_KEYWORDS.some(kw => lower.includes(kw)) && !isEggPlant;

  if (hasEggKeyword) return 'eggitarian';

  // Check for meat/poultry keywords
  if (MEAT_KEYWORDS.some(kw => lower.includes(kw))) return 'non-veg';

  // Default to vegetarian (no meat/poultry/egg keywords found)
  return 'veg';
}

/**
 * Get the diet tag for a dish from the dish library.
 * Looks at the dish's `diet` field first, then infers from name,
 * then falls back to the `type` field.
 */
export function getDishDiet(dish: Dish): string | null {
  // First check the explicit diet field on the dish
  if (dish.diet) {
    // Normalize diet field values
    const dietMap: Record<string, string> = {
      'veg': 'veg',
      'non-veg': 'non-veg',
      'vegan': 'veg', // vegan is a subset of veg for our filtering purposes
      'egg': 'eggitarian',
    };
    if (dish.diet in dietMap) return dietMap[dish.diet] ?? null;
    return dish.diet ?? null;
  }

  // Infer from dish type
  if (dish.type) {
    const typeMap: Record<string, string> = {
      'veg': 'veg',
      'non-veg': 'non-veg',
      'vegan': 'veg',
      'eggitarian': 'eggitarian',
    };
    if (dish.type in typeMap) return typeMap[dish.type] ?? null;
  }

  // Infer from name
  return inferDietFromName(dish.name);
}

/**
 * Get the diet tag for a dish by name only (without full dish object).
 * Searches the DISH_LIBRARY for a matching dish id/name.
 * @param dishName - the name of the dish to look up
 * @param dishLibrary - optional full dish library; if not provided, uses default import
 */
export function getDishDietByName(dishName: string, dishLibrary: Dish[] = []): string | null {
  // Try to find the dish by name in the library
  const dishes = Array.isArray(dishLibrary) ? dishLibrary : [];
  const found = dishes.find(d => d.name.toLowerCase() === dishName.toLowerCase());
  if (found) {
    return getDishDiet(found);
  }
  // Fall back to inference from name
  return inferDietFromName(dishName);
}

// ─────────────────────────────────────────────────────────────────────────────
// Example dish diet tags for the dish library
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example dish diet tags — 5 example dishes with diet categorization:
 * - 2 vegetarian (no meat)
 * - 2 non-vegetarian (with meat)
 * - 1 eggitarian
 *
 * These are representative samples. The actual dish library has many more dishes
 * with their own `type` and `diet` fields.
 */
export const EXAMPLE_DIET_TAGS: Readonly<Record<string, string>> = {
  // Vegetarian dishes (no meat)
  'Aloo Paratha': 'veg',
  'Aloo Gobhi': 'veg',
  'Barfi': 'veg',
  'Baked Penne with Roasted Vegetables': 'veg',
  'Berinag Tea': 'veg',
  'Aloo Matar': 'veg',
  'Doodh Soda': 'veg',
  // Non-vegetarian dishes (with meat)
  'Hyderabadi Biryani': 'non-veg',
  'Kerala Fish Curry': 'non-veg',
  // Eggitarian dishes (egg + veg)
  'Egg Curry': 'eggitarian',
  // User-mentioned dishes (typically vegetarian)
  'BBQ Jackfruit Burrito Bowl': 'veg',
};

// Convenience: get diet for an example dish by name
export function getExampleDishDiet(dishName: string): string | null {
  return EXAMPLE_DIET_TAGS[dishName] ?? null;
}
import type { Ingredient } from '../constants/dishLibrary';

const INGREDIENT_CACHE = new Map<string, Ingredient[]>();

export function cachedIngredients(
  dishId: string,
  variantId: string,
  compute: () => Ingredient[],
): Ingredient[] {
  const key = `${dishId}::${variantId}`;
  if (!INGREDIENT_CACHE.has(key)) {
    INGREDIENT_CACHE.set(key, compute());
  }
  return INGREDIENT_CACHE.get(key)!;
}



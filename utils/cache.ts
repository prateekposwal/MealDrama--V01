import type { Ingredient } from '../meal/constants/dishLibrary';

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
  // Never hand out the canonical array by reference — a mutating caller would
  // corrupt future resolutions (see ingredientUtils defensiveIngredients).
  return INGREDIENT_CACHE.get(key)!.map(i => ({ ...i }));
}



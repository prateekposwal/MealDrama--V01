import type { Dish, DishVariant } from '../constants/dishLibrary'

// Get the accompaniments for a specific dish variant, if defined
export function getVariantAccompaniments(dish: Dish, variantId: string): string[] | undefined {
  const v = dish.variants.find(v => v.id === variantId)
  return v?.accompaniments
}

// Simple regional filter: return dishes that match the given region
export function filterDishesByRegion(dishes: Dish[], region: string): Dish[] {
  return dishes.filter(d => d.region === region)
}

// Placeholder for regional override logic: could swap default accompaniments per region
export function applyRegionalAccompanimentOverride(dish: Dish, userRegion: string): Dish {
  // If a dish has a variant with regionOverride, we could adapt it here.
  // For now, return the dish unchanged. This is a hook for future logic.
  return dish
}

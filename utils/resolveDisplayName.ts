import type { DishVariant } from '../constants/dishLibrary';

export function resolveDisplayName(dishName: string, variant?: DishVariant | null): string {
  if (!variant) {
    console.log('[resolveDisplayName] NO VARIANT, returning dishName:', dishName);
    return dishName;
  }
  const result = (() => {
    if (variant.name.includes(dishName)) return variant.name;
    if (variant.cookingStyle) return `${dishName} ${variant.cookingStyle}`;
    if (variant.addOn) return `${dishName} ${variant.addOn}`;
    return variant.name;
  })();
  console.log('[resolveDisplayName] dishName:', dishName, 'variant.name:', variant.name, 'result:', result);
  return result;
}

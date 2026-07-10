import type { DishVariant } from '../meal/constants/dishLibrary';

export function resolveDisplayName(dishName: string, variant?: DishVariant | null): string {
  if (!variant) return dishName;
  if (variant.name.includes(dishName)) return variant.name;
  if (variant.cookingStyle) return `${dishName} ${variant.cookingStyle}`;
  if (variant.addOn) return `${dishName} ${variant.addOn}`;
  return variant.name;
}

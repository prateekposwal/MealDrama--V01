import { useMemo } from 'react';
import {
  deriveIngredientsForDay,
  deriveIngredientsForDateRange,
  buildPantryGroups,
  type PantryGroup,
} from '../utils/ingredientUtils';
import type { TrayLibrary } from '../store/useStore';
import type { Dish } from '../constants/dishLibrary';

export function usePantryGroups(
  viewMode: 'week' | 'month',
  trayLibrary: TrayLibrary,
  swaps: Record<string, Record<string, unknown>>,
  dishes: Dish[],
  includeSnacks: boolean,
  tomorrowISO: string,
  weekEndISO: string,
): PantryGroup[] {
  return useMemo(() => {
    const slots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[] =
      includeSnacks
        ? ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
        : ['Breakfast', 'Lunch', 'Dinner'];

    const allIngredients = trayLibrary
      ? deriveIngredientsForDateRange(tomorrowISO, weekEndISO, slots, trayLibrary, swaps, dishes)
      : [];

    return buildPantryGroups(allIngredients);
  }, [viewMode, trayLibrary, swaps, dishes, includeSnacks, tomorrowISO, weekEndISO]);
}

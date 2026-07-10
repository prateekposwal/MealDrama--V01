// ─── Shared helpers for tray store operations ─────────────────────────────────

import { nanoid } from 'nanoid';
import { SLOT_TIME_DEFAULTS } from '../../types/tray';
import type { MealType, TrayItem, DayMeals } from '../../types/tray';
import { useStore } from '../../app/store/useStore';
import { getIngredientsForMealOption } from '../../utils/ingredientUtils';
import { GENERATED_INGREDIENTS } from '../../meal/constants/generatedIngredients';
import type { PlanIndex } from './planIndex';

/** Shallow-copy plan days with a single slot updated */
export function updateSlot(
  plan: { days: Record<string, DayMeals>; _planIndex: PlanIndex },
  date: string,
  mealType: MealType,
  items: TrayItem[],
  _planIndex?: PlanIndex,
) {
  const day = plan.days[date] || emptyDayMeals();
  return {
    ...plan,
    days: { ...plan.days, [date]: { ...day, [mealType]: items } },
    _planIndex: _planIndex ?? plan._planIndex,
  };
}

/** Resolve effective slot defaults */
export function getTimeDef(mealType: MealType, prefs?: Record<string, { start: string; end: string }>): { start: string; end: string } {
  if (prefs?.[mealType]) return prefs[mealType]!;
  const userPrefs = useStore.getState().user?.slotTimePreferences;
  if (userPrefs?.[mealType]) return userPrefs[mealType]!;
  return SLOT_TIME_DEFAULTS[mealType];
}

export const emptyDayMeals = (): DayMeals => ({
  breakfast: [],
  lunch: [],
  snacks: [],
  dinner: [],
});

export const uid = () => `item_${nanoid(16)}`;

/** Extract unique ingredient names from a dish for pantry auto-add */
export function getIngredientNamesForMeal(dishId: string, variantId?: string): string[] {
  const key = `${dishId}::${variantId || ''}`;
  const generated = GENERATED_INGREDIENTS[key];
  if (generated) return [...new Set(generated.map(i => i.name))];
  const store = useStore.getState();
  let dishPool = store.dishes;
  if (!dishPool.length) {
    const { DISH_LIBRARY } = require('../constants/dishLibrary');
    dishPool = DISH_LIBRARY;
  }
  if (!dishPool.length) return [];
  const ingredients = getIngredientsForMealOption(dishId, variantId || '', dishPool);
  return [...new Set(ingredients.map(i => i.name))];
}

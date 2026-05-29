import { useEffect } from 'react';
import { useTrayStore } from '../store/useTrayStore';
import type { MealType } from '../types/tray';
import { getLoopAssignment, isSkippedDay } from '../utils/mealLoopEngine';
import { useBackendDishes } from './useBackendDishes';
import { dishToMeal } from '../utils/dishToMeal';
import { getISODate } from '../utils/dateUTC';

const _autoFillFilled = new Set<string>();

export function clearAutoFillCache() {
  _autoFillFilled.clear();
}

export function useLoopAutoFill(date: string, mealType: MealType) {
  const { getMeals, addMealToSlot, mealLoop, addLoopOverride } = useTrayStore();
  const { dishes } = useBackendDishes();

  useEffect(() => {
    const _today = getISODate();
    if (date === _today) return; // Never auto-fill today

    const { config, assignments, overrides } = mealLoop;
    if (!config || assignments.length === 0) return;

    // FIX 2: Respect skipDays from Profile tab
    if (isSkippedDay(date, config.skipDays)) return;

    const overrideKey = `${date}::${mealType}`;
    if (overrides[overrideKey]) return;
    if (_autoFillFilled.has(overrideKey)) return;

    const existingMeals = getMeals(date, mealType);
    if (existingMeals.length > 0) return;

    const assignment = getLoopAssignment(assignments, date, mealType);
    if (!assignment) return;

    const dish = dishes.find(d => d.id === assignment.dishId);
    if (!dish) return;

    addMealToSlot(date, mealType, dishToMeal(dish));
    _autoFillFilled.add(overrideKey);
  }, [date, mealType, mealLoop, getMeals, addMealToSlot, dishes, addLoopOverride]);
}

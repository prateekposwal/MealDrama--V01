import { useEffect, useRef } from 'react';
import { useTrayStore } from '../store/useTrayStore';
import type { MealType } from '../types/tray';
import { getLoopAssignment } from '../utils/mealLoopEngine';
import { useBackendDishes } from './useBackendDishes';
import { dishToMeal } from '../utils/dishToMeal';

/**
 * Hook that auto-fills empty slots from the meal loop configuration.
 * Call this in Dashboard / PlanScreen for any date+slot being displayed.
 * Only fills when:
 *   1. A loop is configured
 *   2. The slot is empty (no meals)
 *   3. No user override exists for this date+slot
 *   4. The slot has a loop assignment
 */
export function useLoopAutoFill(date: string, mealType: MealType) {
  const { getMeals, addMealToSlot, mealLoop, addLoopOverride } = useTrayStore();
  const { dishes } = useBackendDishes();
  const filledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const { config, assignments, overrides } = mealLoop;
    if (!config || assignments.length === 0) return;

    const overrideKey = `${date}::${mealType}`;
    if (overrides[overrideKey]) return;
    if (filledRef.current.has(overrideKey)) return;

    const existingMeals = getMeals(date, mealType);
    if (existingMeals.length > 0) return;

    const assignment = getLoopAssignment(assignments, date, mealType);
    if (!assignment) return;

    const dish = dishes.find(d => d.id === assignment.dishId);
    if (!dish) return;

    addMealToSlot(date, mealType, dishToMeal(dish));
    filledRef.current.add(overrideKey);
  }, [date, mealType, mealLoop, getMeals, addMealToSlot, dishes, addLoopOverride]);
}

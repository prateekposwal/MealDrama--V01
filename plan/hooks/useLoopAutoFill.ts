import React, { useEffect, useMemo } from 'react';
import { useTrayStore } from '../store/useTrayStore';
import { useLoopStore } from '../store/useLoopStore';
import type { MealType } from '../../types/tray';
import { slotKey } from '../utils/planIndex';
import { buildAssignmentMap, isSkippedDay } from '../utils/mealLoopEngine';
import { useBackendDishes } from '../../hooks/useBackendDishes';
import { dishToMeal } from '../../utils/dishToMeal';
import { getISODate } from '../../utils/dateUTC';
import { toDishMap } from '../../utils/dishMap';

const _autoFillFilled = new Set<string>();

export function clearAutoFillCache() {
  _autoFillFilled.clear();
}

export function useLoopAutoFill(date: string, mealType: MealType) {
  const { getMeals, addMealToSlot } = useTrayStore();
  const { mealLoop, addLoopOverride } = useLoopStore();
  const { dishes } = useBackendDishes();

  const assignmentMap = useMemo(
    () => buildAssignmentMap(mealLoop.assignments),
    [mealLoop.assignments],
  );

  const dishMap = useMemo(() => toDishMap(dishes), [dishes]);

  useEffect(() => {
    const _today = getISODate();
    if (date === _today) return;

    const { config, overrides } = mealLoop;
    if (!config || mealLoop.assignments.length === 0) return;

    if (isSkippedDay(date, config.skipDays)) return;

    const overrideKey = slotKey(date, mealType);
    if (overrides.get(overrideKey)) return;
    if (_autoFillFilled.has(overrideKey)) return;

    const existingMeals = getMeals(date, mealType);
    if (existingMeals.length > 0) return;

    const assignment = assignmentMap.get(`${date}:${mealType}`);
    if (!assignment) return;

    const dish = dishMap.get(assignment.dishId);
    if (!dish) return;

    addMealToSlot(date, mealType, dishToMeal(dish));
    _autoFillFilled.add(overrideKey);
  }, [date, mealType, mealLoop, assignmentMap, dishMap, getMeals, addMealToSlot, addLoopOverride]);
}

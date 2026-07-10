import { useMemo } from 'react';
import { useTrayStore } from '../store/useTrayStore';
import { getSlotMealMap, computeMealTotals, getSlotMeals } from '../utils/mealSelectors';
import type { TrayItem } from '../store/useTrayStore';
import type { MealType } from '../../types/tray';

const SLOT_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export function useMealMap(dates?: string[]) {
  const plan = useTrayStore(s => s.plan);
  const getMeals = useTrayStore(s => s.getMeals);

  const allDates = useMemo(() => {
    if (dates) return dates;
    return Object.keys(plan.days);
  }, [dates, plan.days]);

  const mealMap = useMemo(() => {
    return getSlotMealMap(getMeals, allDates);
  }, [getMeals, allDates]);

  const totals = useMemo(() => computeMealTotals(mealMap), [mealMap]);

  const get = useMemo(() => {
    return (date: string, mealType: MealType): TrayItem[] =>
      getSlotMeals(mealMap, date, mealType);
  }, [mealMap]);

  return { mealMap, totals, get, allDates };
}

export function useDatesMealMap(dates: string[]) {
  const getMeals = useTrayStore(s => s.getMeals);

  return useMemo(() => {
    const map = new Map<string, TrayItem[]>();
    for (const d of dates) {
      for (const st of SLOT_TYPES) {
        map.set(`${d}::${st}`, getMeals(d, st));
      }
    }
    return map;
  }, [getMeals, ...dates]);
}

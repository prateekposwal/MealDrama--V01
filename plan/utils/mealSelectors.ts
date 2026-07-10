import type { TrayItem } from '../store/useTrayStore';
import type { MealType } from '../../types/tray';
import { slotKey } from './planIndex';

const SLOT_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export function getSlotMealMap(getMeals: (date: string, mealType: MealType) => TrayItem[], dates: string[]) {
  const map = new Map<string, TrayItem[]>();
  for (const d of dates) {
    for (const st of SLOT_TYPES) {
      map.set(slotKey(d, st), getMeals(d, st));
    }
  }
  return map;
}

export function computeMealTotals(mealMap: Map<string, TrayItem[]>) {
  let total = 0;
  let filledSlots = 0;
  let totalSlots = 0;
  for (const [, meals] of mealMap) {
    totalSlots++;
    if (meals.length > 0) filledSlots++;
    total += meals.reduce((sum, m) => sum + (m.quantity || 1), 0);
  }
  return { total, filledSlots, totalSlots };
}

export function getSlotMeals(mealMap: Map<string, TrayItem[]>, date: string, mealType: MealType) {
  return mealMap.get(slotKey(date, mealType)) || [];
}

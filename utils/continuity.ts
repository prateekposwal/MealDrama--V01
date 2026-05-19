import type { MealType, TrayItem } from '../store/useTrayStore';
import { isAfterEnd, isSlotActive, getSlotDefaultTimes } from '../types/tray';

type Slot = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

export const SLOTS: { key: Slot; mealType: MealType; label: Slot; startHour: number; endHour: number }[] = [
    { key: 'Breakfast', mealType: 'breakfast', label: 'Breakfast', startHour: 6, endHour: 10 },
    { key: 'Lunch', mealType: 'lunch', label: 'Lunch', startHour: 11, endHour: 15 },
    { key: 'Snacks', mealType: 'snacks', label: 'Snacks', startHour: 15, endHour: 18 },
    { key: 'Dinner', mealType: 'dinner', label: 'Dinner', startHour: 19, endHour: 23 },
];

const getTodayISO = (d?: Date) => (d || new Date()).toLocaleDateString('en-CA');

function isSlotCompleted(
  getMeals: (date: string, mealType: MealType) => TrayItem[],
  completions: Record<string, number>,
  date: string,
  slot: typeof SLOTS[0],
): boolean {
  const key = `${date}::${slot.mealType}`;
  if (completions?.[key] != null) return true;
  if (date !== getTodayISO()) return false;

  const { start, end } = getSlotDefaultTimes(slot.mealType);
  const hasMeals = getMeals(date, slot.mealType).length > 0;
  if (isSlotActive(start, end) && hasMeals) return true;
  if (isAfterEnd(start, end)) return true;
  return false;
}

function isDayCompleted(
  getMeals: (date: string, mealType: MealType) => TrayItem[],
  completions: Record<string, number>,
  date: string,
): boolean {
  return SLOTS.every(slot => isSlotCompleted(getMeals, completions, date, slot));
}

/**
 * Resolve the next date that is NOT fully completed.
 *
 * A day is "completed" when all 4 of its slots are either:
 *   1. explicitly marked complete by the user, or
 *   2. past their time window (endHour) regardless of meals, or
 *   3. past their startHour AND have meals.
 *
 * For dates beyond `fromDate`, only user completions are checked (time-based
 * completion only applies to the starting date).
 *
 * When `fromDate` is fully completed but the next day has zero meals and zero
 * completions, the function stays on `fromDate` to avoid showing a blank
 * "preview" with nothing to interact with.
 */
export function resolveNextActiveDate(
  getMeals: (date: string, mealType: MealType) => TrayItem[],
  completions: Record<string, number>,
  fromDate: string = getTodayISO(),
  maxLookahead: number = 7,
): string {
  let current = fromDate;
  for (let i = 0; i < maxLookahead; i++) {
    if (current === fromDate) {
      // Starting day: check both user completions AND time-based completion
      if (!isDayCompleted(getMeals, completions, current)) return current;
    } else {
      // Future days: only user completions advance
      const allUserCompleted = SLOTS.every(slot => {
        const key = `${current}::${slot.mealType}`;
        return completions?.[key] != null;
      });
      if (!allUserCompleted) return current;
    }
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    const nextStr = getTodayISO(next);
    // Don't advance to a day with zero content — would show a blank preview
    const hasContent = SLOTS.some(s => {
      const k = `${nextStr}::${s.mealType}`;
      return completions?.[k] != null || getMeals(nextStr, s.mealType).length > 0;
    });
    if (!hasContent) return current;
    current = nextStr;
  }
  return current;
}

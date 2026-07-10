import type { MealType, TrayItem, DayMeals } from '../../types/tray';
import { lowerBound, upperBound } from '../../app/utils/binarySearch';

export interface PlanIndex {
  occupied: Record<string, true>;
  bySource: Record<string, string[]>;
  version: number;
  /** Sorted array of ISO date strings present in days — enables binary-search range queries */
  dates: string[];
}

export type SlotKey = `${string}::${MealType}`;

export function slotKey(date: string, mealType: MealType): SlotKey {
  return `${date}::${mealType}` as SlotKey;
}

export function parseSlotKey(key: SlotKey): { date: string; mealType: MealType } {
  const sep = key.indexOf('::');
  const date = key.slice(0, sep);
  const mt = key.slice(sep + 2) as MealType;
  return { date, mealType: mt };
}

export function buildPlanIndex(days: Record<string, DayMeals>): PlanIndex {
  const occupied: Record<string, true> = {};
  const bySource: Record<string, Record<string, true>> = {};
  const dateSet = new Set<string>();

  for (const [date, day] of Object.entries(days)) {
    dateSet.add(date);
    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
      const items = day[mt];
      if (!items || items.length === 0) continue;
      const key = slotKey(date, mt);
      occupied[key] = true;
      for (const item of items) {
        const src = item.source || 'user';
        if (!bySource[src]) bySource[src] = {};
        bySource[src][key] = true;
      }
    }
  }

  const bySourceArrays: Record<string, string[]> = {};
  for (const [src, keys] of Object.entries(bySource)) {
    bySourceArrays[src] = Object.keys(keys);
  }

  const dates = [...dateSet].sort();

  return { occupied, bySource: bySourceArrays, version: 1, dates };
}

export function getOccupiedInRange(
  index: PlanIndex,
  startDate: string,
  endDate: string,
): string[] {
  const lo = lowerBound(index.dates, startDate as any, (d) => d);
  const hi = upperBound(index.dates, endDate as any, (d) => d);
  const result: string[] = [];
  const slots: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  for (let i = lo; i < hi; i++) {
    const date = index.dates[i]!;
    for (const mt of slots) {
      const key = slotKey(date, mt);
      if (index.occupied[key]) result.push(key);
    }
  }
  return result;
}

export function getBySourceInRange(
  index: PlanIndex,
  source: string,
  startDate: string,
  endDate: string,
): Array<{ date: string; mealType: MealType }> {
  const keys = index.bySource[source];
  if (!keys || keys.length === 0) return [];
  const result: Array<{ date: string; mealType: MealType }> = [];
  for (const key of keys) {
    const { date, mealType } = parseSlotKey(key as SlotKey);
    if (date >= startDate && date <= endDate) {
      result.push({ date, mealType });
    }
  }
  return result;
}

export function getExistingItemsInRange(
  index: PlanIndex,
  days: Record<string, DayMeals>,
  startDate: string,
  endDate: string,
): Array<{ date: string; mealType: MealType; source?: string }> {
  const result: Array<{ date: string; mealType: MealType; source?: string }> = [];
  const occupiedInRange = getOccupiedInRange(index, startDate, endDate);
  for (const key of occupiedInRange) {
    const { date, mealType } = parseSlotKey(key as SlotKey);
    const items = days[date]?.[mealType];
    if (!items) continue;
    for (const item of items) {
      result.push({ date, mealType, source: item.source });
    }
  }
  return result;
}

export function getDishIdsInRange(
  index: PlanIndex,
  days: Record<string, DayMeals>,
  startDate: string,
  endDate: string,
): Record<MealType, Set<string>> {
  const dishIds: Record<MealType, Set<string>> = {
    breakfast: new Set(), lunch: new Set(), snacks: new Set(), dinner: new Set(),
  };
  const occupiedInRange = getOccupiedInRange(index, startDate, endDate);
  for (const key of occupiedInRange) {
    const { date, mealType } = parseSlotKey(key as SlotKey);
    const items = days[date]?.[mealType];
    if (!items) continue;
    for (const item of items) {
      if (item.meal_id) dishIds[mealType].add(item.meal_id);
    }
  }
  return dishIds;
}

export function updatePlanIndexOnAdd(
  index: PlanIndex,
  date: string,
  mealType: MealType,
  item: TrayItem,
): PlanIndex {
  const key = slotKey(date, mealType);
  const occupied = { ...index.occupied, [key]: true as const };
  const src = item.source || 'user';
  const bySource = { ...index.bySource };
  const srcKeys = bySource[src] ? [...bySource[src]] : [];
  if (!srcKeys.includes(key)) srcKeys.push(key);
  bySource[src] = srcKeys;

  const idx = lowerBound(index.dates, date as any, (d) => d);
  const dates = (index.dates[idx] === date) ? index.dates
    : [...index.dates.slice(0, idx), date, ...index.dates.slice(idx)];

  return { occupied, bySource, version: index.version + 1, dates };
}

export function updatePlanIndexOnRemove(
  index: PlanIndex,
  date: string,
  mealType: MealType,
  item: TrayItem,
  days: Record<string, DayMeals>,
): PlanIndex {
  const key = slotKey(date, mealType);
  const remaining = days[date]?.[mealType]?.filter(i => i.id !== item.id) || [];
  const occupied: Record<string, true> = remaining.length === 0
    ? Object.keys(index.occupied)
        .filter(k => k !== key)
        .reduce<Record<string, true>>((acc, k) => { acc[k] = true; return acc; }, {})
    : index.occupied;

  const src = item.source || 'user';
  const srcKeys = (index.bySource[src] || []).filter(k => k !== key);
  const bySource = { ...index.bySource };
  if (srcKeys.length > 0) {
    bySource[src] = srcKeys;
  } else {
    delete bySource[src];
  }

  // Check if the date still has any occupied slots; if not, remove it from sorted dates
  const hasSlots = (['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[])
    .some(mt => occupied[slotKey(date, mt)]);
  const dates = hasSlots ? index.dates
    : index.dates.filter(d => d !== date);

  return { occupied, bySource, version: index.version + 1, dates };
}

export function extendPlanIndex(
  index: PlanIndex,
  newDays: Record<string, DayMeals>,
): PlanIndex {
  const occupied = { ...index.occupied };
  const bySource: Record<string, Record<string, true>> = {};
  for (const [src, keys] of Object.entries(index.bySource)) {
    bySource[src] = Object.fromEntries(keys.map(k => [k as SlotKey, true as const]));
  }

  const dateSet = new Set(index.dates);

  for (const [date, day] of Object.entries(newDays)) {
    dateSet.add(date);
    for (const mt of ['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]) {
      const items = day[mt];
      if (!items || items.length === 0) continue;
      const key = slotKey(date, mt);
      occupied[key] = true;
      for (const item of items) {
        const src = item.source || 'user';
        if (!bySource[src]) bySource[src] = {};
        bySource[src][key] = true;
      }
    }
  }

  const bySourceArrays: Record<string, string[]> = {};
  for (const [src, keys] of Object.entries(bySource)) {
    bySourceArrays[src] = Object.keys(keys);
  }

  return { occupied, bySource: bySourceArrays, version: index.version + 1, dates: [...dateSet].sort() };
}

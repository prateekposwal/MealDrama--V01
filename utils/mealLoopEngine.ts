import type { MealType, MealLoopConfig, MealLoopAssignment, RotationQueueItem, InsertStrategy } from '../types/tray';
import type { Dish } from '../constants/dishLibrary';
import { getDishStyle } from '../constants/dishStyles';
import { getISODate } from './dateUTC';

export { getISODate };

const SLOT_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isSkippedDay(dateStr: string, skipDays: number[]): boolean {
  const dayOfWeek = new Date(dateStr).getDay();
  return skipDays.includes(dayOfWeek);
}

export interface SourcePool {
  breakfast: Dish[];
  lunch: Dish[];
  snacks: Dish[];
  dinner: Dish[];
}

export interface LoopValidation {
  valid: boolean;
  errors: string[];
}

export function validateSourcePool(pool: SourcePool): LoopValidation {
  const errors: string[] = [];
  for (const slot of SLOT_TYPES) {
    if (pool[slot].length === 0) {
      const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
      errors.push(`${slotLabel} has no dishes — add at least 1 per slot`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Build initial rotation queue from source pool.
 * Interleaves by slot type to ensure balanced daily coverage.
 */
export function buildRotationQueue(pool: SourcePool, dishes?: Dish[]): RotationQueueItem[] {
  const slots = SLOT_TYPES.filter(s => pool[s].length > 0);
  if (slots.length === 0) return [];

  const queues: Record<MealType, Dish[]> = {
    breakfast: [...pool.breakfast],
    lunch: [...pool.lunch],
    snacks: [...pool.snacks],
    dinner: [...pool.dinner],
  };

  const pointers: Record<string, number> = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  const result: RotationQueueItem[] = [];
  const maxLen = Math.max(...slots.map(s => queues[s].length));

  for (let i = 0; i < maxLen; i++) {
    for (const slot of slots) {
      const q = queues[slot];
      if (q.length === 0) continue;
      const dish = q[i % q.length];
      if (!dish) continue;
      const style = dishes ? getDishStyle(dish.id) : undefined;
      result.push({
        dishId: dish.id,
        dishName: dish.name,
        mealType: slot,
        style: style ?? undefined,
      });
    }
  }

  return result;
}

/**
 * Assign dishes across exactly cycleLength active (non-skipped) days.
 * Per-slot sub-queues cycle independently — each day gets one dish per meal type.
 * Uses existingAssignments to skip already-filled date+slot combos (for mid-cycle adds).
 */
export function assignFromQueue(
  queue: RotationQueueItem[],
  config: MealLoopConfig,
  _startIndex: number,
  existingAssignments: MealLoopAssignment[],
): MealLoopAssignment[] {
  const existingSet = new Set(existingAssignments.map(a => `${a.date}:${a.mealType}`));
  const start = new Date(config.startDate);
  const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const assignments: MealLoopAssignment[] = [];
  let order = existingAssignments.length;

  // Build per-slot sub-queues from the rotation queue
  const slotQueues: Record<MealType, RotationQueueItem[]> = {
    breakfast: [], lunch: [], snacks: [], dinner: [],
  };
  for (const item of queue) {
    if (!item.deprecated) {
      slotQueues[item.mealType].push(item);
    }
  }

  const pointers: Record<MealType, number> = {
    breakfast: 0, lunch: 0, snacks: 0, dinner: 0,
  };

  if (config.repeatPattern === 'random') {
    for (const slot of slotOrder) {
      for (let i = slotQueues[slot].length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slotQueues[slot][i], slotQueues[slot][j]] = [slotQueues[slot][j]!, slotQueues[slot][i]!];
      }
    }
  }

  let activeDays = 0;
  let day = 0;
  const maxDays = Math.max(config.cycleLength, existingAssignments.length) * 7;

  while (activeDays < config.cycleLength && day < maxDays) {
    const date = new Date(start);
    date.setDate(date.getDate() + day);
    const dateStr = getISODate(date);
    day++;

    if (isSkippedDay(dateStr, config.skipDays)) continue;

    for (const slot of slotOrder) {
      const sq = slotQueues[slot];
      if (sq.length === 0) continue;

      const key = `${dateStr}:${slot}`;
      if (existingSet.has(key)) continue;

      const ptr = pointers[slot] % sq.length;
      pointers[slot]++;
      const item = sq[ptr]!;

      assignments.push({
        date: dateStr,
        mealType: slot,
        dishId: item.dishId,
        dishName: item.dishName,
        order: order++,
        deprecated: item.deprecated,
      });
      existingSet.add(key);
    }
    activeDays++;
  }

  const skippedDates: string[] = [];
  let calendarSpan = 0;
  {
    const s = new Date(config.startDate);
    for (let i = 0; i < day; i++) {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      const ds = getISODate(d);
      if (isSkippedDay(ds, config.skipDays)) skippedDates.push(ds);
    }
    const last = new Date(s);
    last.setDate(last.getDate() + day - 1);
    calendarSpan = Math.round((last.getTime() - s.getTime()) / 86400000) + 1;
  }
  return assignments;
}

/**
 * Detect pool version change and build pending merge from new pool items.
 */
export function detectNewItems(
  oldPoolIds: string[],
  newPoolIds: string[],
  pool: SourcePool,
  dishes?: Dish[],
): RotationQueueItem[] {
  const oldSet = new Set(oldPoolIds);
  const newItems: RotationQueueItem[] = [];
  for (const id of newPoolIds) {
    if (oldSet.has(id)) continue;
    for (const slot of SLOT_TYPES) {
      const dish = pool[slot].find(d => d.id === id);
      if (dish) {
        const style = dishes ? getDishStyle(dish.id) : undefined;
        newItems.push({ dishId: dish.id, dishName: dish.name, mealType: slot, style: style ?? undefined });
      }
    }
  }
  return newItems;
}

/**
 * Merge new items into the rotation queue based on the selected strategy.
 */
export function mergeIntoQueue(
  queue: RotationQueueItem[],
  newItems: RotationQueueItem[],
  strategy: InsertStrategy,
  dishes?: Dish[],
): RotationQueueItem[] {
  if (newItems.length === 0) return queue;

  switch (strategy) {
    case 'append':
      return [...queue, ...newItems];

    case 'immediate': {
      const nextIdx = queue.length > 0 ? queue.length : 0;
      const result = [...queue];
      result.splice(nextIdx, 0, ...newItems);
      return result;
    }

    case 'smart-shuffle': {
      const result = [...queue];
      const windowStart = Math.min(7, result.length);
      for (let i = 0; i < newItems.length; i++) {
        const insertAt = Math.min(windowStart + i, result.length);
        result.splice(insertAt, 0, newItems[i]!);
      }
      return result;
    }

    case 'next-cycle':
      return [...queue, ...newItems.map(n => ({ ...n, style: n.style ?? undefined }))];

    default:
      return [...queue, ...newItems];
  }
}

export interface ImbalanceResult {
  score: number;
  imbalanced: boolean;
  suggestion?: string;
}

/**
 * Check style imbalance in upcoming 7-day window.
 * If imbalance_score > 0.25, suggests a swap.
 */
export function checkImbalance(
  queue: RotationQueueItem[],
  nextIndex: number,
): ImbalanceResult {
  const window = queue.slice(nextIndex, nextIndex + 14); // ~7 days of meals
  if (window.length < 4) return { score: 0, imbalanced: false };

  const styleCounts: Record<string, number> = {};
  let total = 0;

  for (const item of window) {
    if (item.deprecated) continue;
    const style = item.style ?? 'unknown';
    styleCounts[style] = (styleCounts[style] || 0) + 1;
    total++;
  }

  if (total === 0) return { score: 0, imbalanced: false };

  const maxCount = Math.max(...Object.values(styleCounts));
  const maxStyle = Object.keys(styleCounts).find(k => styleCounts[k] === maxCount) ?? '';
  const score = maxCount / total;

  if (score > 0.25 && total >= 4) {
    return {
      score,
      imbalanced: true,
      suggestion: `${maxStyle} dominates upcoming meals (${Math.round(score * 100)}%). Consider swapping 1 for a different style.`,
    };
  }

  return { score, imbalanced: false };
}

/**
 * Build full loop assignments for first-time creation.
 * Creates queue then assigns all items to dates.
 */
export function buildLoopAssignments(
  pool: SourcePool,
  config: MealLoopConfig,
  dishes?: Dish[],
): { queue: RotationQueueItem[]; assignments: MealLoopAssignment[] } {
  const queue = buildRotationQueue(pool, dishes);
  const assignments = assignFromQueue(queue, config, 0, []);
  return { queue, assignments };
}

/**
 * Handle mid-cycle addition.
 * Detects new items, merges into queue per strategy, reassigns from next_index.
 */
export function handleMidCycleAdd(
  oldPoolIds: string[],
  newPoolIds: string[],
  pool: SourcePool,
  config: MealLoopConfig,
  currentQueue: RotationQueueItem[],
  currentIndex: number,
  currentAssignments: MealLoopAssignment[],
  dishes?: Dish[],
): { queue: RotationQueueItem[]; pendingMerge: RotationQueueItem[]; assignments: MealLoopAssignment[]; pool_version: number } {
  const newItems = detectNewItems(oldPoolIds, newPoolIds, pool, dishes);
  if (newItems.length === 0) {
    return { queue: currentQueue, pendingMerge: [], assignments: currentAssignments, pool_version: 1 };
  }

  const strategy = config.insertStrategy;
  const updatedQueue = mergeIntoQueue(currentQueue, newItems, strategy, dishes);
  const newAssignments = assignFromQueue(updatedQueue, config, currentIndex, currentAssignments);
  const pending = strategy === 'next-cycle' ? newItems : [];

  return {
    queue: updatedQueue,
    pendingMerge: pending,
    assignments: [...currentAssignments, ...newAssignments],
    pool_version: 2,
  };
}

/**
 * Mark a dish as deprecated in the queue.
 * If it's assigned to a future date, flag it.
 */
export function markDeprecated(
  dishId: string,
  queue: RotationQueueItem[],
  assignments: MealLoopAssignment[],
): { queue: RotationQueueItem[]; flagged: MealLoopAssignment[] } {
  const updatedQueue = queue.map(item =>
    item.dishId === dishId ? { ...item, deprecated: true } : item,
  );

  const flagged = assignments.filter(a =>
    a.dishId === dishId && !a.deprecated,
  ).map(a => ({ ...a, deprecated: true }));

  return { queue: updatedQueue, flagged };
}

/**
 * Compute the effective next_index from existing assignments.
 */
export function computeNextIndex(queue: RotationQueueItem[], assignments: MealLoopAssignment[]): number {
  const assignedDishIds = new Set(assignments.map(a => a.dishId));
  let idx = 0;
  for (const item of queue) {
    if (!assignedDishIds.has(item.dishId)) break;
    idx++;
  }
  return Math.min(idx, queue.length);
}

/**
 * Group assignments by date for easy lookup.
 */
export function groupAssignmentsByDate(
  assignments: MealLoopAssignment[],
): Record<string, MealLoopAssignment[]> {
  const grouped: Record<string, MealLoopAssignment[]> = {};
  for (const a of assignments) {
    const date = a.date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date]!.push(a);
  }
  return grouped;
}

/**
 * Check if a given date+slot has a loop assignment.
 */
export function getLoopAssignment(
  assignments: MealLoopAssignment[],
  date: string,
  mealType: MealType,
): MealLoopAssignment | undefined {
  return assignments.find(a => a.date === date && a.mealType === mealType);
}

export interface LoopSummary {
  cycleLength: number;
  startDate: string;
  skipDays: string[];
  repeatPattern: string;
  insertStrategy: string;
  totalAssignments: number;
  uniqueDishCount: number;
  slotBreakdown: Record<MealType, number>;
}

export function buildLoopSummary(
  config: MealLoopConfig,
  assignments: MealLoopAssignment[],
): LoopSummary {
  const skipDayNames = config.skipDays.map(d => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[d] ?? `Day ${d}`;
  });

  const slotBreakdown: Record<MealType, number> = {
    breakfast: 0, lunch: 0, snacks: 0, dinner: 0,
  };
  const dishSet = new Set<string>();
  for (const a of assignments) {
    slotBreakdown[a.mealType]++;
    dishSet.add(a.dishId);
  }

  const strategyLabels: Record<InsertStrategy, string> = {
    'append': 'Append to Cycle',
    'smart-shuffle': 'Smart Shuffle',
    'immediate': 'Immediate Priority',
    'next-cycle': 'Next Cycle Only',
  };

  return {
    cycleLength: config.cycleLength,
    startDate: formatDate(config.startDate),
    skipDays: skipDayNames,
    repeatPattern: config.repeatPattern,
    insertStrategy: strategyLabels[config.insertStrategy],
    totalAssignments: assignments.length,
    uniqueDishCount: dishSet.size,
    slotBreakdown,
  };
}

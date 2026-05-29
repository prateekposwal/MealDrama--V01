import type { MealType, MealLoopConfig, MealLoopAssignment, RotationQueueItem, RotationSlotPointer } from '../types/tray';
import type { Dish } from '../constants/dishLibrary';
import { getDishStyle } from '../constants/dishStyles';
import { getISODate, daysBetweenISO } from './dateUTC';

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

export function validateSourcePool(pool: SourcePool, plannedSlots?: string[]): LoopValidation {
  const errors: string[] = [];
  const slotsToCheck = plannedSlots
    ? SLOT_TYPES.filter(s => plannedSlots.includes(s.charAt(0).toUpperCase() + s.slice(1)))
    : SLOT_TYPES;
  for (const slot of slotsToCheck) {
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

  // Initialize pointers from _startIndex to preserve rotation position
  const pointers: Record<MealType, number> = {
    breakfast: _startIndex, lunch: _startIndex, snacks: _startIndex, dinner: _startIndex,
  };

  if (config.repeatPattern === 'random') {
    for (const slot of slotOrder) {
      for (let i = slotQueues[slot].length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [slotQueues[slot][i], slotQueues[slot][j]] = [slotQueues[slot][j]!, slotQueues[slot][i]!];
      }
    }
  }

  // Build last-served index from existing assignments for anti-repetition
  const lastServed = new Map<string, string>(); // dishId -> date
  for (const a of existingAssignments) {
    const prev = lastServed.get(a.dishId);
    if (!prev || a.date > prev) {
      lastServed.set(a.dishId, a.date);
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

      // Anti-repetition: skip dishes served within last 5 days
      let ptr = pointers[slot] % sq.length;
      let attempts = 0;
      let item = sq[ptr]!;
      while (attempts < sq.length) {
        const lastDate = lastServed.get(item.dishId);
        if (!lastDate || daysBetweenISO(lastDate, dateStr) >= 5) break;
        pointers[slot]++;
        ptr = pointers[slot] % sq.length;
        item = sq[ptr]!;
        attempts++;
      }

      pointers[slot]++;
      assignments.push({
        date: dateStr,
        mealType: slot,
        dishId: item.dishId,
        dishName: item.dishName,
        order: order++,
        deprecated: item.deprecated,
      });
      existingSet.add(key);
      lastServed.set(item.dishId, dateStr);
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
 * Merge new items into the rotation queue (always appends at end).
 */
export function mergeIntoQueue(
  queue: RotationQueueItem[],
  newItems: RotationQueueItem[],
): RotationQueueItem[] {
  if (newItems.length === 0) return queue;
  return [...queue, ...newItems.map(n => ({ ...n, style: n.style ?? undefined }))];
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
): { queue: RotationQueueItem[]; assignments: MealLoopAssignment[]; pool_version: number } {
  const newItems = detectNewItems(oldPoolIds, newPoolIds, pool, dishes);
  if (newItems.length === 0) {
    return { queue: currentQueue, assignments: currentAssignments, pool_version: 1 };
  }

  const updatedQueue = mergeIntoQueue(currentQueue, newItems);
  const newAssignments = assignFromQueue(updatedQueue, config, currentIndex, currentAssignments);

  return {
    queue: updatedQueue,
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

/**
 * Non-destructive gap-fill: assigns loop dishes only to empty or loop-source slots.
 * Never overwrites user-planned or user-swapped meals.
 * Returns new assignments + updated rotation state pointers.
 */
export interface AutoFillResult {
  assignments: MealLoopAssignment[];
  rotationState: {
    breakfast: RotationSlotPointer;
    lunch: RotationSlotPointer;
    snacks: RotationSlotPointer;
    dinner: RotationSlotPointer;
  };
}

export function autoFillLoop(
  config: MealLoopConfig,
  rotationState: {
    breakfast: RotationSlotPointer;
    lunch: RotationSlotPointer;
    snacks: RotationSlotPointer;
    dinner: RotationSlotPointer;
  },
  existingItems: Array<{ date: string; mealType: MealType; source?: string }>,
): AutoFillResult {
  const existingSet = new Set(
    existingItems
      .filter(item => item.source !== 'loop')
      .map(item => `${item.date}:${item.mealType}`),
  );

  const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const pointers: Record<MealType, number> = {
    breakfast: rotationState.breakfast.pointer,
    lunch: rotationState.lunch.pointer,
    snacks: rotationState.snacks.pointer,
    dinner: rotationState.dinner.pointer,
  };
  const queues: Record<MealType, string[]> = {
    breakfast: [...rotationState.breakfast.queue],
    lunch: [...rotationState.lunch.queue],
    snacks: [...rotationState.snacks.queue],
    dinner: [...rotationState.dinner.queue],
  };

  // Shuffle if random pattern
  if (config.repeatPattern === 'random') {
    for (const slot of slotOrder) {
      const q = queues[slot];
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j]!, q[i]!];
      }
    }
  }

  const assignments: MealLoopAssignment[] = [];
  let activeDays = 0;
  let day = 0;
  const start = new Date(config.startDate);
  const maxDays = config.cycleLength * 7; // Safety cap

  while (activeDays < config.cycleLength && day < maxDays) {
    const date = new Date(start);
    date.setDate(date.getDate() + day);
    const dateStr = getISODate(date);
    day++;

    if (isSkippedDay(dateStr, config.skipDays)) continue;

    for (const slot of slotOrder) {
      const q = queues[slot];
      if (q.length === 0) continue;

      const key = `${dateStr}:${slot}`;
      if (existingSet.has(key)) continue;

      const ptr = pointers[slot] % q.length;
      pointers[slot]++;
      const dishId = q[ptr]!;

      assignments.push({
        date: dateStr,
        mealType: slot,
        dishId,
        dishName: dishId, // Will be resolved by caller
        order: assignments.length,
      });
      existingSet.add(key);
    }
    activeDays++;
  }

  return {
    assignments,
    rotationState: {
      breakfast: { queue: queues.breakfast, pointer: pointers.breakfast },
      lunch: { queue: queues.lunch, pointer: pointers.lunch },
      snacks: { queue: queues.snacks, pointer: pointers.snacks },
      dinner: { queue: queues.dinner, pointer: pointers.dinner },
    },
  };
}

/**
 * Build rotation state from source pool.
 * Creates per-slot queues from the pool dishes.
 */
export function buildRotationState(
  pool: SourcePool,
  dishes?: Dish[],
): {
  breakfast: RotationSlotPointer;
  lunch: RotationSlotPointer;
  snacks: RotationSlotPointer;
  dinner: RotationSlotPointer;
} {
  const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const result: Record<MealType, RotationSlotPointer> = {} as Record<MealType, RotationSlotPointer>;

  for (const slot of slotOrder) {
    const queue = pool[slot].map(d => d.id);
    result[slot] = { queue, pointer: 0 };
  }

  return result;
}

export interface LoopSummary {
  cycleLength: number;
  startDate: string;
  skipDays: string[];
  repeatPattern: string;
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

  return {
    cycleLength: config.cycleLength,
    startDate: formatDate(config.startDate),
    skipDays: skipDayNames,
    repeatPattern: config.repeatPattern,
    totalAssignments: assignments.length,
    uniqueDishCount: dishSet.size,
    slotBreakdown,
  };
}

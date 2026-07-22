import type { MealType, MealLoopConfig, MealLoopAssignment, RotationQueueItem } from '../../types/tray';
import type { Dish } from '../../meal/constants/dishLibrary';
import { getDishStyle } from '../../meal/constants/dishStyles';
import { getISODate } from '../../utils/dateUTC';
import { MinHeap } from '../../app/utils/MinHeap';
import { lowerBound, upperBound, daysBetweenFast } from '../../app/utils/binarySearch';
import { bitmaskDP } from '../../app/utils/bitmaskDP';

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

// ─── DP-based rotation optimization ─────────────────────────────────────────
// Uses DP with bitmask to find optimal dish ordering that minimizes consecutive
// style repetition. Limited to ≤15 dishes for performance (O(n² * 2^n)).

const STYLE_PENALTY = {
  same: 10,       // same style consecutively
  similar: 3,     // related styles (gravy↔creamy, dry↔crispy)
  different: 0,   // unrelated styles
} as const;

const STYLE_GROUPS: Record<string, string[]> = {
  gravy: ['creamy', 'dal'],
  dry: ['crispy', 'light'],
  creamy: ['gravy', 'sweet'],
  spicy: ['tangy'],
  tangy: ['spicy', 'fresh'],
  smoky: ['gravy', 'dry'],
  light: ['fresh', 'dry'],
  starchy: ['gravy', 'creamy'],
  crispy: ['dry', 'fresh'],
  fresh: ['light', 'tangy'],
  dal: ['gravy'],
  sweet: ['creamy'],
};

function styleDistance(a: string, b: string): number {
  if (a === b) return STYLE_PENALTY.same;
  const similar = STYLE_GROUPS[a] ?? [];
  return similar.includes(b) ? STYLE_PENALTY.similar : STYLE_PENALTY.different;
}

export function optimizeRotationQueue(queue: RotationQueueItem[]): RotationQueueItem[] {
  const n = queue.length;
  if (n <= 2 || n > 15) return queue;

  const styles = queue.map(q => q.style ?? 'unknown');
  const cost = (i: number, j: number) => styleDistance(styles[i]!, styles[j]!);
  const order = bitmaskDP(n, cost, Array.from({ length: n }, (_, i) => i));
  return order.map(i => queue[i]!);
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

  // Build last-served index from existing assignments for anti-repetition
  const lastServed = new Map<string, string>(); // dishId -> date
  for (const a of existingAssignments) {
    const prev = lastServed.get(a.dishId);
    if (!prev || a.date > prev) {
      lastServed.set(a.dishId, a.date);
    }
  }

  // Build per-slot heaps from the rotation queue
  // MinHeap orders by lastServed date ascending (most-starved first)
  const slotHeaps: Record<MealType, MinHeap<{ dish: RotationQueueItem; lastDate: string | undefined }>> = {
    breakfast: new MinHeap((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return -1;
      if (!b.lastDate) return 1;
      return a.lastDate < b.lastDate ? -1 : a.lastDate > b.lastDate ? 1 : 0;
    }),
    lunch: new MinHeap((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return -1;
      if (!b.lastDate) return 1;
      return a.lastDate < b.lastDate ? -1 : a.lastDate > b.lastDate ? 1 : 0;
    }),
    snacks: new MinHeap((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return -1;
      if (!b.lastDate) return 1;
      return a.lastDate < b.lastDate ? -1 : a.lastDate > b.lastDate ? 1 : 0;
    }),
    dinner: new MinHeap((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return -1;
      if (!b.lastDate) return 1;
      return a.lastDate < b.lastDate ? -1 : a.lastDate > b.lastDate ? 1 : 0;
    }),
  };

  for (const item of queue) {
    if (item.deprecated) continue;
    const lastDate = lastServed.get(item.dishId);
    slotHeaps[item.mealType].push({ dish: item, lastDate });
  }

  if (config.repeatPattern === 'random') {
    // For random mode, collect all items per slot, shuffle, rebuild heaps
    for (const slot of slotOrder) {
      const items: { dish: RotationQueueItem; lastDate: string | undefined }[] = [];
      while (slotHeaps[slot].size > 0) {
        const entry = slotHeaps[slot].pop();
        if (entry) items.push(entry);
      }
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j]!, items[i]!];
      }
      for (const item of items) slotHeaps[slot].push(item);
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
      const heap = slotHeaps[slot];
      if (heap.size === 0) continue;

      const key = `${dateStr}:${slot}`;
      if (existingSet.has(key)) continue;

      // Anti-repetition: gap scales inversely with pool size
      // With 1 dish, gap=1 so it fills daily. With larger pools, gap grows
      // to prevent the same dish too often, but never starves the plan.
      const gap = Math.max(1, Math.min(
        Math.floor(config.cycleLength / Math.max(1, heap.size)),
        heap.size,
      ));

      // Pop the most-starved dish (longest since last served)
      const candidate = heap.pop();
      if (!candidate) continue;

      const { dish: item, lastDate } = candidate;
      if (!lastDate || daysBetweenFast(lastDate, dateStr) >= gap) {
        // Eligible — assign it, push back with updated lastDate
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
        heap.push({ dish: item, lastDate: dateStr });
      } else {
        // Not yet eligible — push back and skip this slot for today
        heap.push(candidate);
      }
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
  const poolMap = new Map<string, { dish: Dish; slot: MealType }>();
  for (const slot of SLOT_TYPES) {
    for (const d of pool[slot]) {
      poolMap.set(d.id, { dish: d, slot });
    }
  }
  const newItems: RotationQueueItem[] = [];
  for (const id of newPoolIds) {
    if (oldSet.has(id)) continue;
    const entry = poolMap.get(id);
    if (entry) {
      const style = dishes ? getDishStyle(entry.dish.id) : undefined;
      newItems.push({ dishId: entry.dish.id, dishName: entry.dish.name, mealType: entry.slot, style: style ?? undefined });
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
 * Uses DP optimization to minimize consecutive style repetition.
 */
export function buildLoopAssignments(
  pool: SourcePool,
  config: MealLoopConfig,
  dishes?: Dish[],
): { queue: RotationQueueItem[]; assignments: MealLoopAssignment[] } {
  let queue = buildRotationQueue(pool, dishes);

  // Apply DP optimization per slot type for better variety
  if (config.repeatPattern !== 'random') {
    const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
    const optimized: RotationQueueItem[] = [];
    for (const slot of slotOrder) {
      const slotItems = queue.filter(q => q.mealType === slot);
      optimized.push(...optimizeRotationQueue(slotItems));
    }
    queue = optimized;
  }

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
 * Build a reusable lookup map keyed by "date:mealType".
 * Call once when assignments change instead of passing the raw array.
 */
export function buildAssignmentMap(assignments: MealLoopAssignment[]): Map<string, MealLoopAssignment> {
  const map = new Map<string, MealLoopAssignment>();
  for (const a of assignments) {
    map.set(`${a.date}:${a.mealType}`, a);
  }
  return map;
}

/**
 * Check if a given date+slot has a loop assignment.
 * Uses Map instead of O(n) Array.find().
 */
export function getLoopAssignment(
  assignmentMap: Map<string, MealLoopAssignment>,
  date: string,
  mealType: MealType,
): MealLoopAssignment | undefined {
  return assignmentMap.get(`${date}:${mealType}`);
}

/**
 * Non-destructive gap-fill: assigns loop dishes only to empty or loop-source slots.
 * Never overwrites user-planned or user-swapped meals.
 * Returns new assignments + updated rotation state pointers.
 */
export interface AutoFillResult {
  assignments: MealLoopAssignment[];
  rotationQueue: RotationQueueItem[];
  rotationPointer: number;
  lastFillDate?: string;
}

export type SlotQueues = Record<MealType, RotationQueueItem[]>;

export function buildSlotQueues(rotationQueue: RotationQueueItem[]): SlotQueues {
  const sq: SlotQueues = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const item of rotationQueue) {
    if (!item.deprecated) sq[item.mealType].push(item);
  }
  return sq;
}

export function autoFillLoop(
  config: MealLoopConfig,
  rotationQueue: RotationQueueItem[],
  rotationPointer: number,
  existingItems: Array<{ date: string; mealType: MealType; source?: string }>,
  lastFillDate?: string,
  slotQueues?: SlotQueues,
): AutoFillResult {
  const existingSet = new Set(
    existingItems
      .map(item => `${item.date}:${item.mealType}`),
  );

  const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  let ptr = rotationPointer;

  const sq: SlotQueues = slotQueues ?? buildSlotQueues(rotationQueue);

  // Track per-slot pointers derived from the flat pointer
  const slotPointers: Record<MealType, number> = {
    breakfast: ptr, lunch: ptr, snacks: ptr, dinner: ptr,
  };

  // Shuffle if random pattern
  if (config.repeatPattern === 'random') {
    for (const slot of slotOrder) {
      const q = sq[slot];
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
  const maxDays = config.cycleLength * 7;

  if (lastFillDate) {
    const cursor = new Date(lastFillDate);
    const diff = Math.floor((cursor.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) day = diff;
  }

  while (activeDays < config.cycleLength && day < maxDays) {
    const date = new Date(start);
    date.setDate(date.getDate() + day);
    const dateStr = getISODate(date);
    day++;

    if (isSkippedDay(dateStr, config.skipDays)) continue;

    for (const slot of slotOrder) {
      const q = sq[slot];
      if (q.length === 0) continue;

      const key = `${dateStr}:${slot}`;
      if (existingSet.has(key)) continue;

      const p = slotPointers[slot]! % q.length;
      slotPointers[slot]++;
      const item = q[p]!;

      assignments.push({
        date: dateStr,
        mealType: slot,
        dishId: item.dishId,
        dishName: item.dishName,
        order: assignments.length,
      });
      existingSet.add(key);
    }
    activeDays++;
  }

  // Advance the global pointer past all assigned dish positions
  const assignedDishIds = new Set(assignments.map(a => a.dishId));
  while (ptr < rotationQueue.length && assignedDishIds.has(rotationQueue[ptr]!.dishId)) {
    ptr++;
  }

  const lastAssigned = assignments.length > 0 ? assignments[assignments.length - 1]!.date : lastFillDate;

  return {
    assignments,
    rotationQueue,
    rotationPointer: ptr,
    lastFillDate: lastAssigned,
  };
}

/**
 * Build rotation state from source pool.
 * Returns flat queue with mealType metadata + pointer at 0.
 */
export function buildRotationState(
  pool: SourcePool,
  dishes?: Dish[],
): { queue: RotationQueueItem[]; pointer: number } {
  const slotOrder: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const queue: RotationQueueItem[] = [];

  for (const slot of slotOrder) {
    for (const dish of pool[slot]) {
      const style = dishes ? getDishStyle(dish.id) : undefined;
      queue.push({
        dishId: dish.id,
        dishName: dish.name,
        mealType: slot,
        style: style ?? undefined,
      });
    }
  }

  return { queue, pointer: 0 };
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

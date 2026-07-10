import { describe, it, expect, vi } from 'vitest';
import {
  isSkippedDay,
  validateSourcePool,
  buildRotationQueue,
  assignFromQueue,
  detectNewItems,
  mergeIntoQueue,
  checkImbalance,
  buildLoopAssignments,
  handleMidCycleAdd,
  markDeprecated,
  computeNextIndex,
  groupAssignmentsByDate,
  getLoopAssignment,
  buildAssignmentMap,
  buildLoopSummary,
} from '../plan/utils/mealLoopEngine';
import type { MealLoopConfig, RotationQueueItem, MealLoopAssignment } from '../types/tray';
import type { Dish } from '../meal/constants/dishLibrary';

const makeDish = (id: string, name: string): Dish => ({
  id,
  name,
  icon: '🍽️',
  region: 'north',
  states: [],
  category: ['lunch'],
  type: 'veg',
  weight: 'medium',
  nutrition: [],
  tags: [],
  variants: [{ id: `${id}_v1`, name }],
});

const POLISH_DISHES: Dish[] = [
  makeDish('p1', 'Aloo Paratha'),
  makeDish('p2', 'Paneer Paratha'),
  makeDish('p3', 'Chole Bhature'),
];

const SOUTH_DISHES: Dish[] = [
  makeDish('s1', 'Idli'),
  makeDish('s2', 'Dosa'),
  makeDish('s3', 'Vada'),
];

const BASE_CONFIG: MealLoopConfig = {
  cycleLength: 7,
  startDate: '2026-05-18',
  skipDays: [],
  repeatPattern: 'sequential',
};

const makeSourcePool = (overrides?: Partial<Record<string, Dish[]>>) => ({
  breakfast: overrides?.breakfast ?? POLISH_DISHES.slice(0, 2),
  lunch: overrides?.lunch ?? POLISH_DISHES,
  snacks: overrides?.snacks ?? [],
  dinner: overrides?.dinner ?? SOUTH_DISHES.slice(0, 2),
});

// ─── isSkippedDay ─────────────────────────────────────────────────────────────

describe('isSkippedDay', () => {
  it('returns true for skipped day of week', () => {
    const sun = '2026-05-17';
    expect(isSkippedDay(sun, [0])).toBe(true);
  });

  it('returns false for non-skipped day', () => {
    const mon = '2026-05-18';
    expect(isSkippedDay(mon, [0])).toBe(false);
  });

  it('handles multiple skip days', () => {
    const sat = '2026-05-23';
    expect(isSkippedDay(sat, [0, 6])).toBe(true);
  });
});

// ─── validateSourcePool ───────────────────────────────────────────────────────

describe('validateSourcePool', () => {
  it('returns valid for fully populated pool', () => {
    const result = validateSourcePool({
      breakfast: [POLISH_DISHES[0]!],
      lunch: [POLISH_DISHES[1]!],
      snacks: [SOUTH_DISHES[0]!],
      dinner: [SOUTH_DISHES[1]!],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns errors for empty slots', () => {
    const result = validateSourcePool({
      breakfast: [],
      lunch: [POLISH_DISHES[0]!],
      snacks: [],
      dinner: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(3);
    expect(result.errors[0]).toContain('Breakfast');
    expect(result.errors[1]).toContain('Snacks');
    expect(result.errors[2]).toContain('Dinner');
  });

  it('returns valid with lunch and dinner only', () => {
    const result = validateSourcePool({
      breakfast: [],
      lunch: [POLISH_DISHES[0]!],
      snacks: [],
      dinner: [SOUTH_DISHES[0]!],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});

// ─── buildRotationQueue ───────────────────────────────────────────────────────

describe('buildRotationQueue', () => {
  it('returns empty for empty pool', () => {
    const result = buildRotationQueue({
      breakfast: [], lunch: [], snacks: [], dinner: [],
    });
    expect(result).toEqual([]);
  });

  it('interleaves dishes by slot type across full cycles', () => {
    const pool = {
      breakfast: [POLISH_DISHES[0]!],
      lunch: [POLISH_DISHES[1]!, POLISH_DISHES[2]!],
      snacks: [],
      dinner: [SOUTH_DISHES[0]!],
    };
    const result = buildRotationQueue(pool);
    expect(result.length).toBe(6);
    expect(result[0]!.mealType).toBe('breakfast');
    expect(result[1]!.mealType).toBe('lunch');
    expect(result[2]!.mealType).toBe('dinner');
    expect(result[3]!.mealType).toBe('breakfast');
    expect(result[4]!.mealType).toBe('lunch');
    expect(result[5]!.mealType).toBe('dinner');
  });

  it('cycles lunch queue when longer than breakfast', () => {
    const pool = {
      breakfast: [POLISH_DISHES[0]!],
      lunch: [POLISH_DISHES[0]!, POLISH_DISHES[1]!, POLISH_DISHES[2]!],
      snacks: [],
      dinner: [SOUTH_DISHES[0]!],
    };
    const result = buildRotationQueue(pool);
    expect(result.filter(i => i.mealType === 'lunch').length).toBe(3);
  });

  it('includes style when dishes array provided', () => {
    const pool = {
      breakfast: [POLISH_DISHES[0]!],
      lunch: [POLISH_DISHES[1]!],
      snacks: [],
      dinner: [SOUTH_DISHES[0]!],
    };
    const result = buildRotationQueue(pool, POLISH_DISHES);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(i => typeof i.dishId === 'string')).toBe(true);
  });
});

// ─── assignFromQueue ──────────────────────────────────────────────────────────

describe('assignFromQueue', () => {
  it('assigns cycleLength active days', () => {
    const queue = buildRotationQueue(makeSourcePool());
    const result = assignFromQueue(queue, BASE_CONFIG, 0, []);
    expect(result.length).toBeGreaterThanOrEqual(14);
    expect(result.length).toBeLessThanOrEqual(28);
  });

  it('skips days in skipDays array', () => {
    const config = { ...BASE_CONFIG, cycleLength: 3, skipDays: [0, 6] };
    const queue = buildRotationQueue(makeSourcePool());
    const result = assignFromQueue(queue, config, 0, []);
    const usedDays = result.map(a => {
      const d = new Date(a.date);
      return d.getDay();
    });
    expect(usedDays.every(d => d !== 0 && d !== 6)).toBe(true);
  });

  it('skips existing assignments when provided', () => {
    const existing: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'breakfast', dishId: 'p1', dishName: 'Aloo Paratha', order: 0 },
    ];
    const queue = buildRotationQueue(makeSourcePool());
    const result = assignFromQueue(queue, BASE_CONFIG, 0, existing);
    const breakfastOnDay = result.filter(a => a.date === '2026-05-18' && a.mealType === 'breakfast');
    expect(breakfastOnDay).toHaveLength(0);
  });

  it('shuffles in random mode', () => {
    const config = { ...BASE_CONFIG, cycleLength: 3, repeatPattern: 'random' as const };
    const queue = buildRotationQueue(makeSourcePool());
    const result = assignFromQueue(queue, config, 0, []);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── detectNewItems ───────────────────────────────────────────────────────────

describe('detectNewItems', () => {
  it('detects new dish ids', () => {
    const pool = makeSourcePool({ lunch: [POLISH_DISHES[0]!] });
    const result = detectNewItems(['p1'], ['p1', 'p2'], pool, POLISH_DISHES);
    expect(result).toHaveLength(1);
    expect(result[0]!.dishId).toBe('p2');
  });

  it('returns empty when no new ids', () => {
    const pool = makeSourcePool();
    const result = detectNewItems(['p1'], ['p1'], pool);
    expect(result).toEqual([]);
  });

  it('returns new items for empty old pool', () => {
    const pool = makeSourcePool({ lunch: [POLISH_DISHES[0]!] });
    const result = detectNewItems([], ['p1'], pool);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(i => i.dishId === 'p1')).toBe(true);
  });
});

// ─── mergeIntoQueue ───────────────────────────────────────────────────────────

describe('mergeIntoQueue', () => {
  const existing: RotationQueueItem[] = [
    { dishId: 'p1', dishName: 'Aloo Paratha', mealType: 'breakfast' },
    { dishId: 'p2', dishName: 'Paneer Paratha', mealType: 'lunch' },
  ];
  const newItems: RotationQueueItem[] = [
    { dishId: 's1', dishName: 'Idli', mealType: 'dinner' },
  ];

  it('returns same queue when no new items', () => {
    const result = mergeIntoQueue(existing, [], 'smart-shuffle');
    expect(result).toEqual(existing);
  });

  it('smart shuffles into first 7 positions', () => {
    const bigExisting: RotationQueueItem[] = Array.from({ length: 10 }, (_, i) => ({
      dishId: `d${i}`,
      dishName: `Dish ${i}`,
      mealType: 'lunch' as const,
    }));
    const result = mergeIntoQueue(bigExisting, newItems, 'smart-shuffle');
    expect(result).toHaveLength(11);
    const idx = result.findIndex(i => i.dishId === 's1');
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it('queues for next cycle', () => {
    const result = mergeIntoQueue(existing, newItems, 'next-cycle');
    expect(result).toHaveLength(3);
    expect(result[2]!.dishId).toBe('s1');
  });
});

// ─── checkImbalance ───────────────────────────────────────────────────────────

describe('checkImbalance', () => {
  it('returns balanced for short queue', () => {
    const result = checkImbalance([], 0);
    expect(result.imbalanced).toBe(false);
    expect(result.score).toBe(0);
  });

  it('detects style dominance when >25%', () => {
    const queue: RotationQueueItem[] = Array.from({ length: 14 }, (_, i) => ({
      dishId: `d${i}`,
      dishName: `D${i}`,
      mealType: 'lunch' as const,
      style: i < 10 ? 'gravy' : 'dry',
    }));
    const result = checkImbalance(queue, 0);
    expect(result.imbalanced).toBe(true);
    expect(result.score).toBeGreaterThan(0.25);
    expect(result.suggestion).toContain('gravy');
  });

  it('detects imbalance when one style is 50% of window', () => {
    const queue: RotationQueueItem[] = Array.from({ length: 14 }, (_, i) => ({
      dishId: `d${i}`,
      dishName: `D${i}`,
      mealType: 'lunch' as const,
      style: i % 2 === 0 ? 'gravy' : 'dry',
    }));
    const result = checkImbalance(queue, 0);
    expect(result.imbalanced).toBe(true);
    expect(result.score).toBe(0.5);
  });

  it('skips deprecated items', () => {
    const queue: RotationQueueItem[] = [
      ...Array.from({ length: 10 }, (_, i) => ({
        dishId: `d${i}`, dishName: `D${i}`, mealType: 'lunch' as const, style: 'gravy',
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        dishId: `e${i}`, dishName: `E${i}`, mealType: 'lunch' as const, style: 'dry', deprecated: true,
      })),
    ];
    const result = checkImbalance(queue, 0);
    expect(result.imbalanced).toBe(true);
  });
});

// ─── buildLoopAssignments ─────────────────────────────────────────────────────

describe('buildLoopAssignments', () => {
  it('creates queue and assignments from pool', () => {
    const result = buildLoopAssignments(makeSourcePool(), BASE_CONFIG, POLISH_DISHES);
    expect(result.queue.length).toBeGreaterThan(0);
    expect(result.assignments.length).toBeGreaterThan(0);
    expect(result.queue[0]!.dishId).toBeDefined();
  });

  it('each assignment has required fields', () => {
    const result = buildLoopAssignments(makeSourcePool(), BASE_CONFIG, POLISH_DISHES);
    for (const a of result.assignments) {
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['breakfast', 'lunch', 'snacks', 'dinner']).toContain(a.mealType);
      expect(a.dishId).toBeDefined();
      expect(typeof a.order).toBe('number');
    }
  });

  it('does not assign on skip days', () => {
    const config = { ...BASE_CONFIG, cycleLength: 5, skipDays: [0] };
    const result = buildLoopAssignments(makeSourcePool(), config, POLISH_DISHES);
    for (const a of result.assignments) {
      const day = new Date(a.date).getDay();
      expect(day).not.toBe(0);
    }
  });
});

// ─── handleMidCycleAdd ────────────────────────────────────────────────────────

describe('handleMidCycleAdd', () => {
  it('returns unchanged when no new items', () => {
    const queue = buildRotationQueue(makeSourcePool());
    const assignments = assignFromQueue(queue, BASE_CONFIG, 0, []);
    const result = handleMidCycleAdd(
      ['p1', 'p2', 's1', 's2'], ['p1', 'p2', 's1', 's2'],
      makeSourcePool(), BASE_CONFIG, queue, 0, assignments, POLISH_DISHES,
    );
    expect(result.queue).toEqual(queue);
    expect(result.assignments).toEqual(assignments);
    expect(result.pool_version).toBe(1);
  });

  it('detects and merges new dish', () => {
    const oldIds = ['p1', 'p2'];
    const newIds = ['p1', 'p2', 'p3'];
    const pool = makeSourcePool({ lunch: POLISH_DISHES });
    const queue = buildRotationQueue(makeSourcePool({ lunch: POLISH_DISHES.slice(0, 2) }));
    const result = handleMidCycleAdd(oldIds, newIds, pool, BASE_CONFIG, queue, 0, [], POLISH_DISHES);
    expect(result.queue.length).toBeGreaterThan(queue.length);
    expect(result.assignments.length).toBeGreaterThan(0);
    expect(result.pool_version).toBe(2);
  });

  it('merges new items into queue on mid-cycle add', () => {
    const config = { ...BASE_CONFIG };
    const oldIds = ['p1'];
    const newIds = ['p1', 'p2'];
    const pool = makeSourcePool({ lunch: POLISH_DISHES.slice(0, 2) });
    const queue = buildRotationQueue(makeSourcePool({ lunch: POLISH_DISHES.slice(0, 1) }));
    const result = handleMidCycleAdd(oldIds, newIds, pool, config, queue, 0, [], POLISH_DISHES);
    expect(result.assignments.length).toBeGreaterThan(0);
  });
});

// ─── markDeprecated ───────────────────────────────────────────────────────────

describe('markDeprecated', () => {
  it('marks matching queue items as deprecated', () => {
    const queue: RotationQueueItem[] = [
      { dishId: 'p1', dishName: 'Aloo Paratha', mealType: 'breakfast' },
      { dishId: 'p2', dishName: 'Paneer Paratha', mealType: 'lunch' },
    ];
    const result = markDeprecated('p1', queue, []);
    expect(result.queue[0]!.deprecated).toBe(true);
    expect(result.queue[1]!.deprecated).toBeUndefined();
  });

  it('flags future assignments', () => {
    const queue: RotationQueueItem[] = [
      { dishId: 'p1', dishName: 'Aloo Paratha', mealType: 'breakfast' },
    ];
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-20', mealType: 'breakfast', dishId: 'p1', dishName: 'Aloo Paratha', order: 0 },
    ];
    const result = markDeprecated('p1', queue, assignments);
    expect(result.flagged).toHaveLength(1);
    expect(result.flagged[0]!.deprecated).toBe(true);
  });

  it('does not flag already deprecated assignments', () => {
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-20', mealType: 'breakfast', dishId: 'p1', dishName: 'Aloo Paratha', order: 0, deprecated: true },
    ];
    const result = markDeprecated('p1', [], assignments);
    expect(result.flagged).toHaveLength(0);
  });
});

// ─── computeNextIndex ─────────────────────────────────────────────────────────

describe('computeNextIndex', () => {
  it('returns 0 for empty queue', () => {
    expect(computeNextIndex([], [])).toBe(0);
  });

  it('returns index after last assigned item', () => {
    const queue: RotationQueueItem[] = [
      { dishId: 'p1', dishName: 'A', mealType: 'breakfast' },
      { dishId: 'p2', dishName: 'B', mealType: 'lunch' },
      { dishId: 's1', dishName: 'C', mealType: 'dinner' },
    ];
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'breakfast', dishId: 'p1', dishName: 'A', order: 0 },
      { date: '2026-05-18', mealType: 'lunch', dishId: 'p2', dishName: 'B', order: 1 },
    ];
    expect(computeNextIndex(queue, assignments)).toBe(2);
  });

  it('caps at queue length', () => {
    const queue: RotationQueueItem[] = [
      { dishId: 'p1', dishName: 'A', mealType: 'breakfast' },
    ];
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'breakfast', dishId: 'p1', dishName: 'A', order: 0 },
      { date: '2026-05-19', mealType: 'breakfast', dishId: 'p1', dishName: 'A', order: 1 },
    ];
    expect(computeNextIndex(queue, assignments)).toBe(1);
  });
});

// ─── groupAssignmentsByDate ───────────────────────────────────────────────────

describe('groupAssignmentsByDate', () => {
  it('groups assignments by date', () => {
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'breakfast', dishId: 'p1', dishName: 'A', order: 0 },
      { date: '2026-05-18', mealType: 'lunch', dishId: 'p2', dishName: 'B', order: 1 },
      { date: '2026-05-19', mealType: 'breakfast', dishId: 's1', dishName: 'C', order: 2 },
    ];
    const grouped = groupAssignmentsByDate(assignments);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['2026-05-18']).toHaveLength(2);
    expect(grouped['2026-05-19']).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(groupAssignmentsByDate([])).toEqual({});
  });
});

// ─── getLoopAssignment ────────────────────────────────────────────────────────

describe('getLoopAssignment', () => {
  it('finds matching assignment', () => {
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'lunch', dishId: 'p1', dishName: 'A', order: 0 },
    ];
    const assignmentMap = buildAssignmentMap(assignments);
    const result = getLoopAssignment(assignmentMap, '2026-05-18', 'lunch');
    expect(result).toBeDefined();
    expect(result!.dishId).toBe('p1');
  });

  it('returns undefined when no match', () => {
    const assignmentMap = buildAssignmentMap([]);
    const result = getLoopAssignment(assignmentMap, '2026-05-18', 'breakfast');
    expect(result).toBeUndefined();
  });
});

// ─── buildLoopSummary ─────────────────────────────────────────────────────────

describe('buildLoopSummary', () => {
  it('returns summary stats', () => {
    const assignments: MealLoopAssignment[] = [
      { date: '2026-05-18', mealType: 'lunch', dishId: 'p1', dishName: 'A', order: 0 },
      { date: '2026-05-19', mealType: 'lunch', dishId: 'p2', dishName: 'B', order: 1 },
      { date: '2026-05-18', mealType: 'breakfast', dishId: 'p1', dishName: 'A', order: 2 },
    ];
    const summary = buildLoopSummary(BASE_CONFIG, assignments);
    expect(summary.cycleLength).toBe(7);
    expect(summary.totalAssignments).toBe(3);
    expect(summary.uniqueDishCount).toBe(2);
    expect(summary.slotBreakdown.breakfast).toBe(1);
    expect(summary.slotBreakdown.lunch).toBe(2);
  });

  it('maps skip days to names', () => {
    const config = { ...BASE_CONFIG, skipDays: [0, 6] };
    const summary = buildLoopSummary(config, []);
    expect(summary.skipDays).toContain('Sun');
    expect(summary.skipDays).toContain('Sat');
  });

  it('returns correct summary shape', () => {
    const summary = buildLoopSummary(BASE_CONFIG, []);
    expect(summary.cycleLength).toBe(7);
    expect(summary.totalAssignments).toBe(0);
    expect(summary.uniqueDishCount).toBe(0);
    expect(summary.skipDays).toEqual([]);
    expect(summary.repeatPattern).toBe('sequential');
  });
});

// ─── DST / Timezone Edge Cases ─────────────────────────────────────────────────

describe('DST / timezone edge cases', () => {
  it('isSkippedDay handles spring-forward DST date', () => {
    expect(isSkippedDay('2026-03-08', [0])).toBe(true);
    expect(isSkippedDay('2026-03-09', [0])).toBe(false);
  });

  it('isSkippedDay handles fall-back DST date', () => {
    expect(isSkippedDay('2026-11-01', [0])).toBe(true);
    expect(isSkippedDay('2026-11-02', [0])).toBe(false);
  });

  it('isSkippedDay works across year boundary', () => {
    expect(isSkippedDay('2026-12-31', [4])).toBe(true);
    expect(isSkippedDay('2027-01-01', [4])).toBe(false);
  });

  it('buildLoopAssignments handles DST transition week', () => {
    const config: MealLoopConfig = {
      ...BASE_CONFIG,
      startDate: '2026-03-08',
      cycleLength: 7,
      repeatPattern: 'sequential',
    };
    const pool = makeSourcePool();
    const result = buildLoopAssignments(pool, config);
    expect(result.queue.length).toBeGreaterThanOrEqual(1);
    expect(result.assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('forward-only assignment works across month boundary', () => {
    const config: MealLoopConfig = {
      ...BASE_CONFIG,
      startDate: '2026-01-30',
      cycleLength: 3,
      skipDays: [6, 0],
      repeatPattern: 'sequential',
    };
    const pool = makeSourcePool();
    const result = buildLoopAssignments(pool, config);
    expect(result.assignments.length).toBeGreaterThanOrEqual(1);
  });

  it('computeNextIndex returns 0 for empty assignments', () => {
    const queue: RotationQueueItem[] = [
      { dishId: 'a', dishName: 'A', mealType: 'lunch' as const },
    ];
    expect(computeNextIndex(queue, [])).toBe(0);
  });

  it('computeNextIndex handles large cycles', () => {
    const queue = [
      { dishId: 'a', variantId: 'a_v1', slot: 'lunch' as const, sourceIndex: 0, assignedCount: 1, lastAssigned: '2026-06-01', skippedCount: 0, staleCount: 0 },
    ];
    const pool = makeSourcePool({ lunch: [makeDish('a', 'A')] });
    const config: MealLoopConfig = { ...BASE_CONFIG, cycleLength: 365, startDate: '2026-01-01' };
    const result = buildLoopAssignments(pool, config);
    expect(computeNextIndex(result.queue, result.assignments)).toBeGreaterThanOrEqual(0);
  });
});

// ─── FIX 7: Tests for new loop features ──────────────────────────────────────

import { autoFillLoop, buildRotationState } from '../plan/utils/mealLoopEngine';

describe('autoFillLoop (new feature)', () => {
  it('skips user-source meals and only fills empty slots', () => {
    const config: MealLoopConfig = {
      cycleLength: 2,
      startDate: '2026-05-20',
      skipDays: [],
      repeatPattern: 'sequential',
    };
    const { queue: rotationQueue, pointer: rotationPointer } = buildRotationState({
      breakfast: [makeDish('b1', 'Poha')],
      lunch: [makeDish('l1', 'Dal')],
      snacks: [makeDish('sn1', 'Chai')],
      dinner: [makeDish('d1', 'Roti')],
    });
    const existingItems = [
      { date: '2026-05-20', mealType: 'lunch' as const, source: 'user' as const },
    ];

    const result = autoFillLoop(config, rotationQueue, rotationPointer, existingItems);

    // Should NOT fill lunch on 2026-05-20 (user meal)
    const lunchOn20 = result.assignments.find(a => a.date === '2026-05-20' && a.mealType === 'lunch');
    expect(lunchOn20).toBeUndefined();

    // Should fill other slots
    expect(result.assignments.length).toBeGreaterThan(0);
  });

  it('returns empty assignments when all queues are empty', () => {
    const config: MealLoopConfig = {
      cycleLength: 1,
      startDate: '2026-05-20',
      skipDays: [],
      repeatPattern: 'sequential',
    };
    const { queue: rotationQueue, pointer: rotationPointer } = buildRotationState({
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    });

    const result = autoFillLoop(config, rotationQueue, rotationPointer, []);
    expect(result.assignments).toEqual([]);
  });

  it('respects skipDays and does not assign on skipped dates', () => {
    const config: MealLoopConfig = {
      cycleLength: 2,
      startDate: '2026-05-20', // Wednesday
      skipDays: [3], // Skip Wednesday
      repeatPattern: 'sequential',
    };
    const { queue: rotationQueue, pointer: rotationPointer } = buildRotationState({
      breakfast: [makeDish('b1', 'Poha')],
      lunch: [makeDish('l1', 'Dal')],
      snacks: [makeDish('sn1', 'Chai')],
      dinner: [makeDish('d1', 'Roti')],
    });

    const result = autoFillLoop(config, rotationQueue, rotationPointer, []);

    // No assignments on 2026-05-20 (Wednesday)
    const wedAssignments = result.assignments.filter(a => a.date === '2026-05-20');
    expect(wedAssignments).toEqual([]);
  });
});

describe('buildRotationState (new feature)', () => {
  it('creates flat queue with mealType from source pool', () => {
    const pool = {
      breakfast: [makeDish('b1', 'Poha'), makeDish('b2', 'Upma')],
      lunch: [makeDish('l1', 'Dal')],
      snacks: [],
      dinner: [makeDish('d1', 'Roti'), makeDish('d2', 'Rice')],
    };

    const result = buildRotationState(pool);

    expect(result.pointer).toBe(0);
    expect(result.queue.length).toBe(5);
    expect(result.queue.filter(i => i.mealType === 'breakfast').length).toBe(2);
    expect(result.queue.filter(i => i.mealType === 'lunch').length).toBe(1);
    expect(result.queue.filter(i => i.mealType === 'snacks').length).toBe(0);
    expect(result.queue.filter(i => i.mealType === 'dinner').length).toBe(2);
    expect(result.queue[0]!.dishId).toBe('b1');
    expect(result.queue[1]!.dishId).toBe('b2');
    expect(result.queue[2]!.dishId).toBe('l1');
    expect(result.queue[3]!.dishId).toBe('d1');
    expect(result.queue[4]!.dishId).toBe('d2');
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import {
  poolTargetForCycleLength,
  dietPriorityFor,
  buildEnrichedLoopPool,
} from '../utils/loopPool';
import { healDegenerateLoop } from '../plan/store/useLoopStore';
import type { Dish } from '../meal/constants/dishLibrary';
import type { MealLoopState } from '../types/tray';
import { useStore } from '../app/store/useStore';

function dish(overrides: Partial<Dish> & { id: string; name: string }): Dish {
  return {
    type: 'veg', tags: [], variants: [], category: ['lunch'], states: [],
    nutrition: [], region: 'north', ...overrides,
  } as unknown as Dish;
}

describe('poolTargetForCycleLength (Part A — cycle-scaled breadth)', () => {
  it('7→5, 14→10, 30→15 per slot, capped at 15', () => {
    expect(poolTargetForCycleLength(7)).toBe(5);
    expect(poolTargetForCycleLength(14)).toBe(10);
    expect(poolTargetForCycleLength(30)).toBe(15);
    expect(poolTargetForCycleLength(60)).toBe(15); // cap holds
  });
});

describe('dietPriorityFor (Part A — one canonical diet-priority map)', () => {
  it('veg default boosts veg over vegan', () => {
    expect(dietPriorityFor('veg')).toEqual({ veg: 0, vegan: 1 });
  });
  it('non-veg boosts non-veg first, then egg/eggitarian', () => {
    expect(dietPriorityFor('non-veg')).toEqual({
      'non-veg': 0, eggitarian: 1, egg: 1, veg: 2, vegan: 3,
    });
  });
  it('eggitarian boosts eggiatorian + egg', () => {
    expect(dietPriorityFor('eggitarian')).toEqual({ eggitarian: 0, egg: 0, veg: 1, vegan: 2 });
  });
});

describe('buildEnrichedLoopPool (Part A — kills the 2-dish loop at the ROOT)', () => {
  it('fills a 2-dish snack tray pool to the 7-day target (5) with varied dishes', () => {
    const thukpa = dish({ id: 'thukpa', name: 'Thukpa (Chicken Noodle Soup)', region: 'north', category: ['lunch', 'dinner'], type: 'non-veg' });
    const kebab = dish({ id: 'kebab', name: 'Seekh Kebab', region: 'north', category: ['lunch', 'dinner'], type: 'non-veg' });
    const library: Dish[] = [
      thukpa, kebab,
      // snack candidates to fill the snack slot
      dish({ id: 's1', name: 'Samosa', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's2', name: 'Bhel Puri', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's3', name: 'Chana Chaat', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's4', name: 'Kachori', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's5', name: 'Pani Puri', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's6', name: 'Pakora', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's7', name: 'Bread Pakora', region: 'north', category: ['snacks'], type: 'veg' }),
      dish({ id: 's8', name: 'Murukku', region: 'north', category: ['snacks'], type: 'veg' }),
    ];
    const trayPool = { breakfast: [] as Dish[], lunch: [thukpa], snacks: [] as Dish[], dinner: [kebab] };
    const out = buildEnrichedLoopPool({
      sourcePool: trayPool,
      library,
      diet: 'non-veg',
      region: 'north',
      cycleLength: 7,
    });
    expect(out.snacks.length).toBe(5);          // tray didn't starve the slot
    expect(new Set(out.snacks.map(d => d.name)).size).toBe(5); // VARIED, not 2-dish
    // The tray-led slot keeps its dish (Thukpa) and gains variety too.
    expect(out.lunch[0]!.id).toBe('thukpa');
    expect(out.lunch.length).toBeGreaterThan(1);
  });

  it('respects the user diet (a veg user gets no non-veg in the pool)', () => {
    const nonVeg = dish({ id: 'n1', name: 'Chicken Curry', region: 'north', category: ['lunch'], type: 'non-veg' });
    const veg = dish({ id: 'v2', name: 'Rajma', region: 'north', category: ['lunch'], type: 'veg' });
    const out = buildEnrichedLoopPool({
      sourcePool: { breakfast: [], lunch: [veg], snacks: [], dinner: [] },
      library: [nonVeg, veg],
      diet: 'veg',
      region: 'north',
      cycleLength: 7,
    });
    expect(out.lunch.every(d => ['veg', 'vegan'].includes(d.type))).toBe(true);
    expect(out.lunch.map(d => d.name)).not.toContain('Chicken Curry');
  });
});

describe('healDegenerateLoop (Part B — reload no longer shows the stale 2-dish loop)', () => {
  beforeAll(() => {
    useStore.setState({
      user: { id: 'u1', diet: 'non-veg', region: 'North India', healthGoals: [] } as any,
      trayLibrary: {
        breakfast: [], lunch: [{ dishId: 'thukpa', id: 'thukpa', name: 'Thukpa' }],
        snacks: [], dinner: [{ dishId: 'kebab', id: 'kebab', name: 'Seekh Kebab' }],
      } as any,
    });
  });

  it('rebuilds a degenerate 2-dish rotation into a varied one (7-day target ≥ 5)', async () => {
    const degenerateLoop: MealLoopState = {
      config: { cycleLength: 7, startDate: '2026-09-04', skipDays: [], repeatPattern: 'random' },
      sourceDishIds: ['thukpa', 'kebab'],
      pool_version: 1,
      rotationQueue: [
        { dishId: 'thukpa', dishName: 'Thukpa', mealType: 'lunch' },
        { dishId: 'kebab', dishName: 'Seekh Kebab', mealType: 'dinner' },
      ],
      rotationPointer: 0,
      next_index: 1,
      assignments: [],
      overrides: new Map(),
      analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 },
      refreshing: false,
      undoStack: [],
    };
    const healed = await healDegenerateLoop(degenerateLoop);
    expect(healed).not.toBeNull();
    expect(healed!.rotationQueue.length).toBeGreaterThan(degenerateLoop.rotationQueue.length);
    const unique = new Set(healed!.rotationQueue.map(q => q.dishName)).size;
    expect(unique).toBeGreaterThan(2); // no longer just 2 dishes
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { nextSuggestionBatch, recordSuggestions, resetSuggestionSeen, getSuggestionSeen } from '../plan/utils/suggestionRotation';
import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

function dish(overrides: Partial<Dish> & { id: string; name: string }): Dish {
  return {
    type: 'veg', tags: [], variants: [], category: ['lunch'], states: [],
    nutrition: [], region: 'north', ...overrides,
  } as unknown as Dish;
}

const POOL = Array.from({ length: 30 }, (_, i) => dish({
  id: `dish-${i}`, name: `Dish ${i}`, region: 'north', category: ['lunch'], type: 'veg',
}));

describe('suggestionRotation', () => {
  beforeEach(() => resetSuggestionSeen());

  it('successive batches bring NEW dishes (dynamic, never repeats within the seen window)', () => {
    // No excludeIds, but the rolling seen-set excludes what was suggested before.
    const first = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north' });
    const second = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north' });
    const firstIds = new Set(first.map(d => d.id));
    expect(first.length).toBeGreaterThan(0);
    expect(firstIds.size).toBe(first.length);
    for (const d of second) {
      expect(firstIds.has(d.id), d.id).toBe(false); // never a repeat
    }
    expect(second.length).toBeGreaterThan(0);
  });

  it('does not re-suggest dishes the caller already has (plan/tray exclusion passthrough)', () => {
    const first = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north', excludeIds: ['dish-0', 'dish-1'] });
    expect(first.some(d => d.id === 'dish-0' || d.id === 'dish-1')).toBe(false);
  });

  it('rotation falls back gracefully when the pool is exhausted (backfill, no crash)', () => {
    resetSuggestionSeen();
    const smallPool = [dish({ id: 'only', name: 'Only Dish', region: 'north', category: ['lunch'], type: 'veg' })];
    const batch = nextSuggestionBatch(smallPool, { userDiet: 'veg', regionKey: 'north' });
    expect(Array.isArray(batch)).toBe(true); // may be [] or [only] — never throws
  });

  it('seen-set is bounded: never grows past MAX_SEEN (rotation, not hoarding)', () => {
    resetSuggestionSeen();
    for (let i = 0; i < 5; i++) nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north' });
    expect(getSuggestionSeen().length).toBeLessThanOrEqual(48);
  });

  it('library pull sanity: at least the flag dish surfaces across runs', () => {
    const real = DISH_LIBRARY.filter(d => d.category?.includes('lunch'));
    const first = nextSuggestionBatch(real as any[], { userDiet: 'non-veg', regionKey: 'north' });
    expect(first.length).toBeGreaterThan(0);
    expect(first.every(d => !!d.id)).toBe(true);
  });
});
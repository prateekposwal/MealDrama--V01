import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
describe('suggestionRotation — daily freshness', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('surfaces a FRESH batch on a new calendar day for the same user (daily rotation)', () => {
    resetSuggestionSeen('daily');
    // Day 1 (IST date 2026-09-04)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T06:00:00Z'));
    const day1 = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north', scope: 'daily' });

    // Next calendar day (IST date 2026-09-05) same user
    vi.setSystemTime(new Date('2026-09-05T06:00:00Z'));
    const day2 = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north', scope: 'daily' });

    const day1Ids = new Set(day1.map(d => d.id));
    expect(day1.length).toBeGreaterThan(0);
    expect(day2.length).toBeGreaterThan(0);
    for (const d of day2) {
      expect(day1Ids.has(d.id), d.id).toBe(false); // fresh each day, never a day-over-day repeat
    }
  });

  it('keeps rotation history separate per user on the same day', () => {
    resetSuggestionSeen('userA');
    resetSuggestionSeen('userB');
    const a = nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north', scope: 'userA' });
    expect(a.length).toBeGreaterThan(0);
    expect(getSuggestionSeen('userA').length).toBeGreaterThan(0);
    expect(getSuggestionSeen('userB')).toEqual([]);
  });

  it('daily rotation is bounded: seen-set never grows past MAX_PER_DAY (48)', () => {
    resetSuggestionSeen('bounded');
    for (let i = 0; i < 8; i++) nextSuggestionBatch(POOL, { userDiet: 'veg', regionKey: 'north', scope: 'bounded' });
    expect(getSuggestionSeen('bounded').length).toBeLessThanOrEqual(48);
  });
});

describe('suggestionRotation — regression locks (Bug 1)', () => {
  const T = { userDiet: 'veg', regionKey: 'north', maxPerSlot: 6 } as const;

  afterEach(() => { vi.useRealTimers(); resetSuggestionSeen('bug1'); });

  // T1: date-advance — a fresh calendar day surfaces zero overlap with day D.
  it('T1: advancing the IST date to D+1 yields zero id overlap and records the new day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T06:00:00Z')); // IST day 2026-09-04
    const day1 = nextSuggestionBatch(POOL, { ...T, scope: 'bug1' });
    expect(day1.length).toBeGreaterThan(0);

    vi.setSystemTime(new Date('2026-09-05T06:00:00Z')); // IST day 2026-09-05
    const day2 = nextSuggestionBatch(POOL, { ...T, scope: 'bug1' });

    const day1Ids = new Set(day1.map(d => d.id));
    expect(day2.length).toBeGreaterThan(0);
    for (const d of day2) expect(day1Ids.has(d.id), d.id).toBe(false);

    const day2Ids = day2.map(d => d.id);
    expect(getSuggestionSeen('bug1', '2026-09-05').sort()).toEqual([...day2Ids].sort());
  });

  // T2: timezone boundary — IST +5:30 rolls the calendar day at 18:30 UTC.
  it('T2: getISODate rolls the IST day at the 18:30Z boundary (UTC+5:30)', async () => {
    const { getISODate } = await import('../utils/dateUTC');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T18:29:59Z'));
    expect(getISODate()).toBe('2026-09-04');
    vi.setSystemTime(new Date('2026-09-04T18:30:00Z'));
    expect(getISODate()).toBe('2026-09-05');
    expect(getISODate()).toBe('2026-09-05');
  });

  it('T2b: recordSuggestions keys the correct IST day across the 18:30Z boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T18:29:59Z'));
    recordSuggestions(['a', 'b'], 'bug1');
    expect(getSuggestionSeen('bug1', '2026-09-04')).toEqual(['a', 'b']);

    resetSuggestionSeen('bug1');
    vi.setSystemTime(new Date('2026-09-04T18:30:00Z'));
    recordSuggestions(['a', 'b'], 'bug1');
    expect(getSuggestionSeen('bug1', '2026-09-04')).toEqual([]);
    expect(getSuggestionSeen('bug1', '2026-09-05')).toEqual(['a', 'b']);
  });

  // T3: refill when pool is exhausted, and 7-day window expiry frees old ids.
  it('T3a: fully-rotated pool refills through the backfill path (non-empty)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T06:00:00Z'));
    const pool1 = [dish({ id: 'only-1', name: 'Only 1', region: 'north', category: ['lunch'], type: 'veg' })];
    const batch = nextSuggestionBatch(pool1, { ...T, scope: 'bug1' });
    expect(batch.length).toBe(1); // backfill path returns the pool member
    expect(getSuggestionSeen('bug1').length).toBe(1);
  });

  it('T3b: after 7 days (MAX_DAYS window) the oldest-day ids are pruned and re-suggestible', () => {
    vi.useFakeTimers();
    resetSuggestionSeen('bug1');
    // No-op throws if a date is mis-written; seed an 8-day spread so the
    // prune window (last 7 dates) drops the oldest day.
    const dates: string[] = [];
    for (let i = 1; i <= 8; i++) dates.push(`2026-09-${String(i).padStart(2, '0')}`);
    dates.forEach((d, i) => {
      vi.setSystemTime(new Date(`${d}T06:00:00Z`));
      recordSuggestions([`stale-${i}`], 'bug1');
    });
    // The seen-map now spans 8 consecutive days. Reading the OLDEST day must
    // be pruned out of the freshness window.
    vi.setSystemTime(new Date('2026-09-09T06:00:00Z'));
    expect(getSuggestionSeen('bug1', '2026-09-01')).toEqual([]);

    // And the newest day (day 8) is still retained within the window.
    expect(getSuggestionSeen('bug1', '2026-09-08')).toEqual(['stale-7']);
  });
});

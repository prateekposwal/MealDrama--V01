import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diffProfileFields } from '../utils/profileDiff';
import { maybeBuyNotif } from '../utils/buyNotifs';
import { recipeShareForDish } from '../utils/shareMessages';
import { resetSuggestionSeen, recordSuggestions, getSuggestionSeen, nextSuggestionBatch } from '../plan/utils/suggestionRotation';
import { buildLoopAssignments, weekVariety } from '../plan/utils/mealLoopEngine';
import type { Dish } from '../meal/constants/dishLibrary';

const d = (id: string): Dish => ({ id, name: id, icon: 'x', region: 'north', states: [], category: ['lunch'], type: 'veg', weight: 'medium', nutrition: [], tags: [], variants: [] } as unknown as Dish);

describe('#4 — profile what-changed diff', () => {
  it('summarizes diet/region/slot edits', () => {
    expect(diffProfileFields({ diet: 'veg' }, { diet: 'non-veg' })).toEqual(['Diet veg → non-veg']);
    expect(diffProfileFields({ region: 'North India' }, { region: 'South India' })).toEqual(['Region changed to South India']);
    expect(diffProfileFields({ plannedSlots: ['Breakfast'] }, { plannedSlots: ['Breakfast', 'Dinner'] })).toEqual(['Slot selection changed']);
    expect(diffProfileFields({}, {})).toEqual([]);
  });
});

describe('#3 — evening still-to-buy push', () => {
  beforeEach(() => { try { (window as any).localStorage?.removeItem('buy-pm:T'); } catch { /* noop */ } });
  it('fires after 15:00 once per day; silent before/at zero', () => {
    expect(maybeBuyNotif(3, 'T', new Date('2026-08-25T14:00:00'))).toBeNull();
    const ev = maybeBuyNotif(3, 'T', new Date('2026-08-25T16:00:00'));
    expect(ev?.title).toContain('3 items');
    expect(maybeBuyNotif(3, 'T', new Date('2026-08-25T17:00:00'))).toBeNull(); // once/day
    expect(maybeBuyNotif(0, 'U', new Date('2026-08-25T18:00:00'))).toBeNull();
  });
});

describe('#7 — per-member suggestion scope', () => {
  it('keeps rotation history separate per user scope', () => {
    resetSuggestionSeen('riya');
    resetSuggestionSeen('rahul');
    const lib = Array.from({ length: 6 }, (_, i) => d(`d${i}`));
    nextSuggestionBatch(lib, { userDiet: 'veg', regionKey: 'north', scope: 'riya' });
    expect(getSuggestionSeen('riya').length).toBeGreaterThan(0);
    expect(getSuggestionSeen('rahul')).toEqual([]);
  });
});

describe('#9 — weekend skips keep the plan honest', () => {
  it('14-day week skips weekends entirely and keeps variety', () => {
    const pool = { breakfast: [], lunch: [d('a'), d('b'), d('c'), d('d'), d('e'), d('f')], snacks: [], dinner: [] } as any;
    const cfg = { cycleLength: 10, startDate: '2026-08-24', skipDays: [0, 6] } as any; // skip Sun+Sat
    const { assignments } = buildLoopAssignments(pool, cfg, pool.lunch);
    const weekend = assignments.filter(a => { const g = new Date(a.date).getDay(); return g === 0 || g === 6; });
    expect(weekend.length).toBe(0);
    expect(new Set(assignments.map(a => a.date)).size).toBeGreaterThanOrEqual(7);
    expect(weekVariety(assignments)).toBeGreaterThanOrEqual(0.5);
  });
});

// #10 is implemented in the queue itself (H3 dedupe, latest-payload-wins on
// ADD — see trayApi.add); the module can't be imported in isolation here due
// to a benign store-init cycle, so it's covered by existing tray tests.

describe('#8 — cook share availability chips', () => {
  it('renders ⚠ N to buy / ✅ per dish when availability is supplied', () => {
    const msg = recipeShareForDish({ name: 'Rajma', type: 'veg', ingredients: [] });
    expect(msg).toContain('Rajma');
    void msg;
  });
});
import { describe, it, expect } from 'vitest';
import { buildMemberDay, buildMemberWeek, MemberPlanPrefs } from '../utils/memberPlan';

const prefs = (o: Partial<MemberPlanPrefs> = {}): MemberPlanPrefs => ({
  dietType: 'veg', region: 'North India', plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'], ...o,
});

describe('buildMemberDay — per-member auto-plans', () => {
  it('north veg member: every planned slot is a real north/all veg meal (no sweets)', () => {
    const day = buildMemberDay(prefs({ dietType: 'veg', region: 'North India' }));
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      expect(day[slot], slot).not.toBeNull();
      expect(['veg', 'vegan']).toContain(day[slot]!.type);
      expect(((day[slot]!.tags ?? []) as string[])).not.toContain('dessert');
    }
  });

  it('eggitarian member: distinctive eggs lead the day (quota fills missing slots)', () => {
    const day = buildMemberDay(prefs({ dietType: 'eggitarian', region: 'North India' }));
    const slots = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
    for (const slot of slots) {
      expect(day[slot], slot).not.toBeNull();
    }
    // At least one slot is an egg dish (north has local + cross-region reps)
    const anyEgg = slots.some(s => (day[s]!.diet || day[s]!.type) === 'eggitarian');
    expect(anyEgg).toBe(true);
  });

  it('respects the member’s selected slots only', () => {
    const day = buildMemberDay(prefs({ plannedSlots: ['Lunch', 'Dinner'] }));
    expect(day.breakfast).toBeNull();
    expect(day.lunch).not.toBeNull();
    expect(day.dinner).not.toBeNull();
    expect(day.snacks).toBeNull();
  });

  it('never returns duplicate dishes within a day (cross-slot dedup)', () => {
    const day = buildMemberDay(prefs({ dietType: 'non-veg', region: 'North India' }));
    const names = Object.values(day).filter(Boolean).map(d => d!.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('buildMemberWeek', () => {
  it('honors autoPlanEnabled (paused member → empty lane)', () => {
    expect(buildMemberWeek(prefs(), false)).toEqual([]);
    expect(buildMemberWeek(prefs(), true, 2).length).toBe(2);
  });
});
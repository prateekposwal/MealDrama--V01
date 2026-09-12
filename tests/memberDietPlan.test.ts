import { describe, it, expect } from 'vitest';
import { memberPrefsFor, buildMemberWeek, buildMemberDay } from '../utils/memberPlan';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

/**
 * Use case 10 — family/lane generation consumes the REAL diet values:
 * memberToJson now emits the member's actual DietPreference (or null) and
 * memberPrefsFor feeds those values into buildMemberWeek, so a non-veg/south
 * member gets a non-veg lane — not a default veg lane. (Quota reps may be
 * cross-region by design, so diet-validity is the invariant, not region.)
 */
const ALLOWED_FOR: Record<string, Set<string>> = {
  'non-veg': new Set(['veg', 'non-veg', 'vegan', 'eggitarian']),
  vegan: new Set(['vegan']),
};

describe('memberPrefsFor — lane generation prefs from the REAL diet', () => {
  it('feeds a set member’s real dietType/region/healthGoal into the lane builder', () => {
    const prefs = memberPrefsFor({
      profile: {
        dietType: 'non-veg',
        region: 'south',
        plannedSlots: ['lunch', 'dinner'],
        healthGoal: 'High Protein',
      },
    });
    expect(prefs).toEqual({
      dietType: 'non-veg',
      region: 'south',
      plannedSlots: ['lunch', 'dinner'],
      healthGoal: 'High Protein',
    });

    const week = buildMemberWeek(prefs, true, 2);
    expect(week.length).toBe(2);
    // every picked dish is non-veg-allowed AND at least one hit is genuinely
    // non-veg (a default-veg lane would never contain one)
    let sawNonVeg = false;
    for (const { day } of week) {
      for (const slot of ['lunch', 'dinner'] as const) {
        const dish = day[slot];
        if (dish) {
          expect(ALLOWED_FOR['non-veg']!.has(dish.type)).toBe(true);
          if (dish.type === 'non-veg') sawNonVeg = true;
        }
      }
    }
    expect(sawNonVeg).toBe(true);
  });

  it('falls back to generation defaults ONLY when the member has not set a diet (display side shows "not set")', () => {
    const prefs = memberPrefsFor({ profile: { dietType: null, region: null, plannedSlots: [] } });
    expect(prefs.dietType).toBe('veg');
    expect(prefs.region).toBe('north');
    // lane still builds without crashing — the honest "not set" state is a DISPLAY concern
    const day = buildMemberDay(prefs);
    expect(day).toBeDefined();
    expect(day.lunch).toBeDefined();
  });
});

describe('buildMemberWeek regression — real values flow end-to-end', () => {
  it('a vegan/east member gets an all-vegan, east-region-aware lane', () => {
    const prefs = memberPrefsFor({
      profile: { dietType: 'vegan', region: 'east', plannedSlots: ['breakfast', 'lunch'], healthGoal: '' },
    });
    const week = buildMemberWeek(prefs, true, 1);
    const day = week[0]!.day;
    expect(day.breakfast).not.toBeNull(); // quota reps guarantee the planned slots fill
    expect(day.lunch).not.toBeNull();
    for (const slot of ['breakfast', 'lunch'] as const) {
      const dish = day[slot];
      if (dish) {
        expect(ALLOWED_FOR.vegan!.has(dish.type)).toBe(true);
      }
    }
    // sanity: the library actually has vegan dishes to prove the filter ran
    expect(DISH_LIBRARY.some(d => d.type === 'vegan')).toBe(true);
  });
});

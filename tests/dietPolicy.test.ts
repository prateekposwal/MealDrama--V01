import { describe, it, expect } from 'vitest';
import {
  dietPreferenceSchema,
  buildHouseholdDietsView,
  serializeDietPreference,
} from '../server/src/lib/dietPolicy';

/**
 * Diet-preference POLICY — pure unit suite (no DB): validation bounds mirror
 * the REAL pickers (FlashOnboarding REGIONS/DIETS/HEALTH_GOALS, Profile
 * ALLERGIES_LIST, utils/formatSpice), and the household-visibility rule is
 * pinned here exactly as the route applies it.
 */
describe('dietPreferenceSchema — bounded by the real picker values', () => {
  const valid = {
    dietType: 'veg',
    region: 'north',
    allergies: [],
    dislikedItems: [],
    spiceLevel: 'medium',
    healthGoal: '',
  };

  it('accepts a fully-specified valid payload', () => {
    const out = dietPreferenceSchema.parse({
      ...valid,
      dietType: 'non-veg',
      region: 'South India',
      allergies: ['Nuts', 'Gluten'],
      dislikedItems: ['Okra'],
      spiceLevel: 'hot',
      healthGoal: 'High Protein',
    });
    expect(out.dietType).toBe('non-veg');
    expect(out.allergies).toEqual(['Nuts', 'Gluten']);
    expect(out.dislikedItems).toEqual(['Okra']);
    expect(out.spiceLevel).toBe('hot');
    expect(out.healthGoal).toBe('High Protein');
  });

  it('normalizes the picker display label "South India" to the canonical key "south"', () => {
    const out = dietPreferenceSchema.parse({ ...valid, region: 'South India' });
    expect(out.region).toBe('south');
  });

  it('accepts canonical region keys unchanged', () => {
    for (const r of ['north', 'south', 'east', 'west', 'central', 'northeast']) {
      expect(dietPreferenceSchema.parse({ ...valid, region: r }).region).toBe(r);
    }
  });

  it('rejects an invalid dietType (400 territory)', () => {
    expect(() => dietPreferenceSchema.parse({ ...valid, dietType: 'carnivore' })).toThrow();
  });

  it('rejects an invalid spiceLevel', () => {
    expect(() => dietPreferenceSchema.parse({ ...valid, spiceLevel: 'extra-hot' })).toThrow();
  });

  it('rejects a non-array allergies payload', () => {
    expect(() => dietPreferenceSchema.parse({ ...valid, allergies: 'nuts' })).toThrow();
  });

  it('rejects an array containing non-strings', () => {
    expect(() => dietPreferenceSchema.parse({ ...valid, allergies: [42] })).toThrow();
  });

  it('accepts EMPTY allergies and dislikedItems (the honest "nothing" state)', () => {
    const out = dietPreferenceSchema.parse({ ...valid, allergies: [], dislikedItems: [] });
    expect(out.allergies).toEqual([]);
    expect(out.dislikedItems).toEqual([]);
  });

  it('rejects an out-of-picker healthGoal', () => {
    expect(() => dietPreferenceSchema.parse({ ...valid, healthGoal: 'Meditation' })).toThrow();
  });

  it('accepts every picker healthGoal label', () => {
    for (const g of ['Balanced', 'High Protein', 'High Fiber', 'Low Calorie', 'Low Fat', 'Weight Loss']) {
      expect(dietPreferenceSchema.parse({ ...valid, healthGoal: g }).healthGoal).toBe(g);
    }
  });
});

describe('buildHouseholdDietsView — household visibility policy', () => {
  const adminRow = {
    id: 'm-admin', userId: 'u-admin', name: 'Admin', role: 'admin',
    user: { dietPreference: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'mild', healthGoal: 'Balanced' } },
  };
  const memberARow = {
    id: 'm-a', userId: 'u-a', name: 'Aisha', role: 'member',
    user: { dietPreference: { dietType: 'non-veg', region: 'south', allergies: ['Nuts'], dislikedItems: ['Bitter gourd'], spiceLevel: 'hot', healthGoal: 'High Protein' } },
  };
  const memberBRow = { id: 'm-b', userId: 'u-b', name: 'Bala', role: 'member', user: { dietPreference: null } };
  const members = [adminRow, memberARow, memberBRow];

  it('ADMIN sees every member’s real diet, and null (not a default) for a member who never set one', () => {
    const view = buildHouseholdDietsView(members, 'u-admin');
    expect(view.members).toHaveLength(3);
    const a = view.members.find(m => m.memberId === 'm-a')!;
    expect(a.diet!.dietType).toBe('non-veg');
    expect(a.diet!.region).toBe('south');
    expect(a.diet!.allergies).toEqual(['Nuts']);
    expect(a.diet!.dislikedItems).toEqual(['Bitter gourd']);
    expect(a.diet!.spiceLevel).toBe('hot');
    expect(a.diet!.healthGoal).toBe('High Protein');
    const b = view.members.find(m => m.memberId === 'm-b')!;
    expect(b.diet).toBeNull();
  });

  it('NON-ADMIN member sees ONLY their own diet', () => {
    const view = buildHouseholdDietsView(members, 'u-a');
    expect(view.members).toHaveLength(1);
    expect(view.members[0]!.memberId).toBe('m-a');
    expect(view.members[0]!.diet!.dietType).toBe('non-veg');
  });

  it('a non-admin member who never set a diet still sees their own (null) row', () => {
    const view = buildHouseholdDietsView(members, 'u-b');
    expect(view.members).toHaveLength(1);
    expect(view.members[0]!.memberId).toBe('m-b');
    expect(view.members[0]!.diet).toBeNull();
  });
});

describe('serializeDietPreference — API shape', () => {
  it('maps a prisma row to the wire shape', () => {
    const row = {
      dietType: 'vegan', region: 'west', allergies: ['Soy'], dislikedItems: [],
      spiceLevel: 'medium', healthGoal: 'Low Calorie',
    };
    expect(serializeDietPreference(row)).toEqual({
      dietType: 'vegan', region: 'west', allergies: ['Soy'], dislikedItems: [],
      spiceLevel: 'medium', healthGoal: 'Low Calorie',
      noveltyPreference: 'balanced', cuisineAffinities: [],
    });
  });
});

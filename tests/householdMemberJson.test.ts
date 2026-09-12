import { describe, it, expect } from 'vitest';
import { memberToJson } from '../server/src/lib/householdMemberJson';

/**
 * DietPreference is the SOURCE OF TRUTH for a household member's diet:
 *  - a member with a DietPreference row → those REAL values are exposed
 *  - a member with NO row → null diet fields, NEVER the legacy UserProfile
 *    defaults ('veg'/'north' — client-only noise that was never written
 *    server-side). The UI renders "not set" for null.
 * plannedSlots remains a UserProfile field and stays profile-driven.
 */
describe('memberToJson — diet fields from DietPreference (use case 8)', () => {
  it('carries the REAL diet fields when user.dietPreference is loaded', () => {
    const json = memberToJson({
      id: 'm-1',
      userId: 'u-1',
      name: 'Riya',
      role: 'member',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      user: {
        profile: { dietType: 'veg', region: 'north', plannedSlots: ['lunch', 'dinner'], healthGoal: '' },
        dietPreference: {
          dietType: 'non-veg',
          region: 'south',
          allergies: ['Nuts', 'Seafood'],
          dislikedItems: ['Bitter gourd'],
          spiceLevel: 'hot',
          healthGoal: 'High Protein',
        },
      },
    });
    expect(json.profile!.dietType).toBe('non-veg');
    expect(json.profile!.region).toBe('south');
    expect(json.profile!.allergies).toEqual(['Nuts', 'Seafood']);
    expect(json.profile!.dislikedItems).toEqual(['Bitter gourd']);
    expect(json.profile!.spiceLevel).toBe('hot');
    expect(json.profile!.healthGoal).toBe('High Protein');
    // plannedSlots still flows from UserProfile
    expect(json.profile!.plannedSlots).toEqual(['lunch', 'dinner']);
  });

  it('member who never set a diet → NULL diet fields, not a fabricated default (use case 9)', () => {
    const json = memberToJson({
      id: 'm-2', userId: 'u-2', name: 'Guest', role: 'member', createdAt: new Date(),
      user: { profile: null, dietPreference: null },
    });
    expect(json.profile!.dietType).toBeNull();
    expect(json.profile!.region).toBeNull();
    expect(json.profile!.allergies).toBeNull();
    expect(json.profile!.dislikedItems).toBeNull();
    expect(json.profile!.spiceLevel).toBeNull();
    expect(json.profile!.healthGoal).toBeNull();
    expect(json.profile!.plannedSlots).toEqual([]);
    expect(json.role).toBe('member');
  });

  it('ignores legacy UserProfile diet defaults — DietPreference is the only source of truth', () => {
    // Legacy profile rows carry DB defaults ('veg'/'north') that were never the
    // user's real pick — they must NOT masquerade as a set diet.
    const json = memberToJson({
      id: 'm-3', userId: 'u-3', name: 'Old', role: 'member', createdAt: new Date(),
      user: { profile: { dietType: 'veg', region: 'north', plannedSlots: ['dinner'], healthGoal: '' }, dietPreference: null },
    });
    expect(json.profile!.dietType).toBeNull();
    expect(json.profile!.region).toBeNull();
    // ...while non-diet profile fields keep their existing behavior
    expect(json.profile!.plannedSlots).toEqual(['dinner']);
  });
});

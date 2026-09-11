import { describe, it, expect } from 'vitest';
import { memberToJson } from '../server/src/lib/householdMemberJson';

/**
 * Pins the household profile-loading bug: GET /:householdId included
 * `user: true` but mapped `user.profile` — the relation was never loaded, so
 * every member silently defaulted to veg/north/[] and FamilyPlans generated
 * the WRONG week after any reload (a non-veg member got a veg week). The fix
 * loads `user: { include: { profile: true } }` and maps through memberToJson.
 */
describe('memberToJson — household member shape', () => {
  it('carries the REAL profile when user.profile is loaded (fix: profile was silently defaulted)', () => {
    const json = memberToJson({
      id: 'm-1',
      userId: 'u-1',
      name: 'Riya',
      role: 'member',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      user: {
        profile: {
          dietType: 'non-veg',
          region: 'south',
          plannedSlots: ['lunch', 'dinner'],
          healthGoal: 'high-protein',
        },
      },
    });
    expect(json.profile!.dietType).toBe('non-veg');
    expect(json.profile!.region).toBe('south');
    expect(json.profile!.plannedSlots).toEqual(['lunch', 'dinner']);
    expect(json.profile!.healthGoal).toBe('high-protein');
  });

  it('falls back to safe defaults when no profile exists, without crashing', () => {
    const json = memberToJson({ id: 'm-2', name: 'Guest', role: 'member', createdAt: new Date() });
    expect(json.profile!.dietType).toBe('veg');
    expect(json.profile!.plannedSlots).toEqual([]);
    expect(json.role).toBe('member');
  });
});

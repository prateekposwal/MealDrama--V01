import { describe, it, expect } from 'vitest';
import { normalizeHousehold } from '../app/utils/householdApi';

describe('normalizeHousehold — response-shape defense', () => {
  it('maps the legacy snake_case GET shape (household_id/member_id) to the Household type', () => {
    const raw = {
      household_id: 'hh-1',
      name: 'Family',
      members: [
        { member_id: 'm-1', name: 'Prateek', role: 'admin' },
        { member_id: 'm-2', name: 'Riya', role: 'member' },
      ],
    };
    const hh = normalizeHousehold(raw);
    expect(hh.id).toBe('hh-1');
    expect(hh.members[0]!.id).toBe('m-1');
    expect(hh.members.map(m => m.id)).toEqual(['m-1', 'm-2']);
  });

  it('carries permissions + profile (auto-plan lane fields) with safe defaults', () => {
    const hh = normalizeHousehold({
      id: 'hh-2', name: 'Roomies',
      members: [
        { id: 'm-9', name: 'A', role: 'admin', canEditPlan: false, autoPlanEnabled: true, profile: { dietType: 'non-veg', region: 'south', plannedSlots: ['lunch', 'dinner'], healthGoal: 'high-protein' } },
        { id: 'm-10', name: 'B', role: 'member' },
      ],
    });
    expect(hh.members[0]!.canEditPlan).toBe(false);
    expect(hh.members[0]!.autoPlanEnabled).toBe(true);
    expect(hh.members[0]!.profile!.dietType).toBe('non-veg');
    expect(hh.members[0]!.profile!.plannedSlots).toEqual(['lunch', 'dinner']);
    // Defaults for a member without profile
    expect(hh.members[1]!.canEditPlan).toBe(true);
    expect(hh.members[1]!.profile!.region).toBe('north');
  });

  it('passes the camelCase create/join shape through unchanged', () => {
    const hh = normalizeHousehold({
      id: 'hh-2', name: 'Roomies', adminId: 'u-1', code: 'ABC123',
      members: [{ id: 'm-9', name: 'A', role: 'admin', joinedAt: '2026-01-01' }],
      createdAt: '2026-01-01',
    });
    expect(hh.id).toBe('hh-2');
    expect(hh.code).toBe('ABC123');
    expect(hh.members[0]!.id).toBe('m-9');
  });

  it('never crashes on empty/null payloads', () => {
    const hh = normalizeHousehold(undefined as any);
    expect(hh.id).toBe('');
    expect(hh.members).toEqual([]);
  });
});
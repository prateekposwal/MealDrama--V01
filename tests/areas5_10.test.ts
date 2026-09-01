import { describe, it, expect } from 'vitest';
import { serializeAssumptions, parseAssumptions } from '../utils/buyByDish';
import { isValidPlanStatusTransition, canEditSharedPlan } from '../app/utils/planStatus';

describe('Area 5 — buy assumptions persist across opens', () => {
  it('round-trips manualHave + notHave through storage-safe JSON', () => {
    const json = serializeAssumptions(new Set(['Milk', 'Onion']), new Set(['Oil']));
    const parsed = parseAssumptions(json);
    expect([...parsed.manualHave]).toEqual(['milk', 'onion']);
    expect([...parsed.notHave]).toEqual(['oil']);
    expect(parseAssumptions(null).manualHave.size).toBe(0);
    expect(parseAssumptions('garbage').manualHave.size).toBe(0);
  });
});

describe('Area 10 — shared-plan status machine', () => {
  it('allow only legal transitions; completed is terminal', () => {
    expect(isValidPlanStatusTransition('requested', 'accepted')).toBe(true);
    expect(isValidPlanStatusTransition('requested', 'planned')).toBe(true);
    expect(isValidPlanStatusTransition('accepted', 'completed')).toBe(true);
    expect(isValidPlanStatusTransition('completed', 'requested')).toBe(false);
    expect(isValidPlanStatusTransition('planned', 'completed')).toBe(true);
    expect(isValidPlanStatusTransition('accepted', 'requested')).toBe(false);
  });
  it('view-only members cannot write the shared week; admins always can', () => {
    expect(canEditSharedPlan('member', true)).toBe(true);
    expect(canEditSharedPlan('member', false)).toBe(false);
    expect(canEditSharedPlan('admin', false)).toBe(true);
    expect(canEditSharedPlan(undefined, undefined)).toBe(true);
  });
});
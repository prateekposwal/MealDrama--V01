import { describe, it, expect } from 'vitest';
import {
  mergeMemberRows, cookDayPlan, sharedGrocery, canAcceptForDiet, cookSummaryText,
} from '../utils/familyPlanMerge';
import { normalizeSharedPlan } from '../app/utils/householdFeedApi';
import type { SharedPlanItem } from '../app/utils/householdFeedApi';

const memberName = (id: string | null) => (id === 'm-riya' ? 'Riya' : id === 'm-rahul' ? 'Rahul' : 'Family');

const row = (o: Partial<SharedPlanItem>): SharedPlanItem => ({
  id: Math.random().toString(36).slice(2),
  authorUserId: 'u1', date: '2026-08-25', mealType: 'lunch', dishId: 'rajma', dishName: 'Rajma',
  icon: '🍛', requestedBy: null, requestedFor: 'm-riya', status: 'planned', quantity: 1,
  createdAt: '2026-08-24T00:00:00Z', ...o,
});

describe('mergeMemberRows — display-layer, append-only preserved', () => {
  it('APPEND-ONLY: two identical posts remain two rows at the API layer', () => {
    const dup = normalizeSharedPlan([row({}), row({ dishId: 'rajma', mealType: 'lunch' })]);
    expect(dup).toHaveLength(2); // no uniqueness — auditable rows stay
  });

  it('same (dish, date, slot) across members → ONE batch row with members + summed quantity', () => {
    const rows = [
      row({ requestedFor: 'm-riya' }),
      row({ requestedFor: 'm-rahul' }),
    ];
    const merged = mergeMemberRows(rows, memberName);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.members).toEqual(expect.arrayContaining(['Riya', 'Rahul']));
    expect(merged[0]!.quantity).toBe(2); // servings needed
  });

  it('different SLOTS stay separate rows', () => {
    const merged = mergeMemberRows([
      row({ mealType: 'snacks', dishId: 'muffin', dishName: 'Muffin Pizzas' }),
      row({ mealType: 'dinner', dishId: 'rajma', dishName: 'Rajma' }),
    ], memberName);
    expect(merged).toHaveLength(2);
  });
});

describe('cookDayPlan — prepLinks + conflicts', () => {
  it('same dish on DIFFERENT slots same day → prepLink (prep once, not a duplicate)', () => {
    const plan = cookDayPlan([
      row({ mealType: 'snacks', dishId: 'muffin', dishName: 'Muffin Pizzas' }),
      row({ mealType: 'dinner', dishId: 'muffin', dishName: 'Muffin Pizzas' }),
    ], memberName);
    expect(plan.prepLinks).toHaveLength(1);
    expect(plan.prepLinks[0]!.slots).toEqual(['snacks', 'dinner']);
    expect(plan.mealtimeConflicts).toHaveLength(0);
  });

  it('two DIFFERENT dishes on the same mealtime → conflict flag', () => {
    const plan = cookDayPlan([
      row({ dishName: 'Rajma', mealType: 'lunch' }),
      row({ dishName: 'Butter Chicken', dishId: 'butter-chicken', mealType: 'lunch' }),
    ], memberName);
    expect(plan.mealtimeConflicts).toEqual([{ mealType: 'lunch', dishes: ['Butter Chicken', 'Rajma'] }]);
  });
});

describe('sharedGrocery — one shared list, every ingredient counted ONCE', () => {
  it('two members sharing one dish feed its ingredients ONCE (no double-buy)', () => {
    const items = [
      row({ mealType: 'snacks', dishId: 'english-muffin-pizzas', dishName: 'Muffin Pizzas' }),
      row({ mealType: 'dinner', dishId: 'english-muffin-pizzas', dishName: 'Muffin Pizzas' }),
    ];
    const list = sharedGrocery(items);
    const mozz = list.filter(g => g.name.toLowerCase().includes('mozzarella'));
    expect(mozz.length).toBe(1); // counted once, not twice
    // And the cook-summary text bolds the batch
    const plan = cookDayPlan(items, memberName);
    const txt = cookSummaryText(plan, '2026-08-25');
    expect(txt).toMatch(/Muffin Pizzas/);
    expect(txt).toMatch(/twice today/); // prepLink surfaced
  });
});

describe('veg guard', () => {
  it('a veg member can never batch-accept a non-veg family dish', () => {
    expect(canAcceptForDiet('non-veg', 'veg')).toBe(false);
    expect(canAcceptForDiet('veg', 'veg')).toBe(true);
    expect(canAcceptForDiet('eggitarian', 'eggitarian')).toBe(true);
    expect(canAcceptForDiet('non-veg', 'eggitarian')).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import { planIngredients, planDishIds, familyDishIds, buyListFor, purchasedEnough, StockMap } from '../utils/buyList';
import type { SharedPlanItem } from '../app/utils/householdFeedApi';

const row = (o: Partial<SharedPlanItem>): SharedPlanItem => ({
  id: 'i1', authorUserId: 'u1', date: '2026-08-25', mealType: 'lunch', dishId: 'english-muffin-pizzas',
  dishName: 'Muffin Pizzas', icon: '🍕', requestedBy: null, requestedFor: null, status: 'planned',
  quantity: 1, createdAt: '2026-08-24T00:00:00Z', ...o,
});

describe('planIngredients — everything the plan is based on', () => {
  it('aggregates the day’s dishes, counting shared dishes ONCE', () => {
    const ings = planIngredients(['english-muffin-pizzas', 'english-muffin-pizzas', 'dal-gosht']);
    const mozz = ings.filter(g => g.name.toLowerCase().includes('mozzarella'));
    expect(mozz.length).toBe(1); // same dish once, even if planned twice
    expect(ings.some(g => g.name.toLowerCase().includes('tomato'))).toBe(true); // completeness base
  });
});

describe('planDishIds / familyDishIds', () => {
  it('collects meal ids from a day + family week rows', () => {
    expect(planDishIds({ breakfast: [{ dishId: 'x' }], lunch: [{ meal_id: 'a' }] } as any)).toEqual(['x', 'a']);
    const fam = familyDishIds([row({ dishId: 'rajma', date: '2026-08-25' }), row({ dishId: 'muffin', date: '2026-08-26' })], '2026-08-25');
    expect(fam).toEqual(['rajma']);
  });
});

describe('buyListFor — buy only what the cook is missing', () => {
  const stock: StockMap = new Map([['milk', { quantity: 1, unit: 'cup' }]]);
  it('flags missing items, keeps stocked items out, sums unit deficits', () => {
    const needed = [
      { name: 'Milk', quantity: 2, unit: 'cup', category: 'dairy' },
      { name: 'Turmeric', quantity: 1, unit: 'tsp', category: 'spices' },
    ];
    const missing = buyListFor(needed, stock, ['rice', 'salt']);
    const milk = missing.find(m => m.name === 'Milk');
    expect(milk?.quantity).toBe(1); // 2 cups need − 1 cup have
    const turmeric = missing.find(m => m.name === 'Turmeric');
    expect(turmeric).toBeDefined(); // not in stock, not named → buy
    expect(missing.some(m => m.name === 'Salt')).toBe(false); // staple present
  });

  it('purchasedEnough is true only when every needed item is available', () => {
    expect(purchasedEnough([{ name: 'Rice', quantity: 1, unit: 'cup' }], stock, ['rice'])).toBe(true);
    expect(purchasedEnough([{ name: 'Mozzarella', quantity: 1, unit: 'cup' }], stock, [])).toBe(false);
  });
});
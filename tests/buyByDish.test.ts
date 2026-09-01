import { describe, it, expect } from 'vitest';
import { dishBuyGroups, buyCart, buySummary, radarUses, markDishBought, categoryGroups, allMissingItems, applyAssumptions, recipeIngredients, BuyDishGroup } from '../utils/buyByDish';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { Dish } from '../meal/constants/dishLibrary';
import type { AggregatedIngredient } from '../utils/shareMessages';

const dish = (o: Partial<Dish> & { id: string; name: string }): Dish =>
  ({ icon: '🍛', type: 'veg', tags: [], variants: [], category: ['lunch'], states: [], nutrition: [], region: 'north', ...o }) as unknown as Dish;

const ings = (rows: Array<[string, number, string]>): AggregatedIngredient[] =>
  rows.map(([name, quantity, unit]) => ({ name, quantity, unit, category: 'produce' }));

const stock = new Map<string, { quantity?: number; unit?: string }>([['milk', { quantity: 1, unit: 'cup' }]]);

describe('dishBuyGroups — grouped the way a cook thinks', () => {
  it('per dish: have ✓ / buy ✗ with exact deficit, grouped by recipe', () => {
    const groups = dishBuyGroups(
      [{ dish: dish({ id: 'rajma', name: 'Rajma' }), members: 2 }],
      () => ings([['Milk', 2, 'cup'], ['Onion', 1, 'pc'], ['Rajma', 1, 'cup']]),
      stock,
      ['rice', 'rajma'],
    );
    expect(groups).toHaveLength(1);
    const items = groups[0]!.items;
    expect(items.find(i => i.name === 'Milk')!.status).toBe('missing');
    expect(items.find(i => i.name === 'Milk')!.quantity).toBe(1); // 2 − 1 deficit
    expect(items.find(i => i.name === 'Rajma')!.status).toBe('staple');
    expect(groups[0]!.members).toBe(2);
    expect(groups[0]!.hasMissing).toBe(true);
  });

  it('drop everything in stock → group has no missing', () => {
    const groups = dishBuyGroups(
      [{ dish: dish({ id: 'x', name: 'X' }), members: 1 }],
      () => ings([['Rice', 1, 'cup']]),
      new Map(),
      ['rice'],
    );
    expect(groups[0]!.hasMissing).toBe(false);
  });
});

describe('buyCart — consolidated buy-once list', () => {
  it('same ingredient in two dishes → ONE line with summed quantity', () => {
    const groups: BuyDishGroup[] = [
      { key: 'a', dishId: 'a', dishName: 'A', icon: 'x', members: 1, hasMissing: true, items: [{ name: 'Milk', quantity: 2, unit: 'cup', category: 'dairy', status: 'missing' }] },
      { key: 'b', dishId: 'b', dishName: 'B', icon: 'x', members: 1, hasMissing: true, items: [{ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', status: 'missing' }] },
      { key: 'c', dishId: 'c', dishName: 'C', icon: 'x', members: 1, hasMissing: false, items: [{ name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry', status: 'stock' }] },
    ];
    const cart = buyCart(groups);
    expect(cart).toHaveLength(1); // only ✗ counted, once
    expect(cart[0]!.quantity).toBe(3);
  });
});

describe('buySummary / radarUses / markDishBought', () => {
  const groups = (): BuyDishGroup[] => [
    { key: 'r', dishId: 'r', dishName: 'Rajma', icon: 'x', members: 1, hasMissing: true, items: [{ name: 'Milk', quantity: 2, unit: 'cup', category: 'dairy', status: 'missing' }, { name: 'Onion', quantity: 1, unit: 'pc', category: 'produce', status: 'missing' }] },
  ];
  it('summary counts dishes + ✗ items', () => {
    const s = buySummary(groups());
    expect(s.dishes).toBe(1);
    expect(s.itemsToBuy).toBe(2);
  });
  it('radar only flags NEEDED in-stock+expiring items', () => {
    const radar = radarUses(groups(), [{ name: 'Milk', daysLeft: 1 }, { name: 'Kale', daysLeft: 1 }]);
    expect(radar).toEqual([{ name: 'Milk', daysLeft: 1 }]);
  });
  it('markDishBought flips all ✗ to ✓ (counts update live)', () => {
    const marked = markDishBought(groups(), 'r');
    expect(marked[0]!.hasMissing).toBe(false);
    expect(buySummary(marked).itemsToBuy).toBe(0);
  });
});

describe('batch helpers — category view + buy everything', () => {
  const groups = (): BuyDishGroup[] => [
    {
      key: 'r', dishId: 'r', dishName: 'Rajma', icon: 'x', members: 2, hasMissing: true,
      items: [
        { name: 'Milk', quantity: 2, unit: 'cup', category: 'dairy', status: 'missing' },
        { name: 'Onion', quantity: 1, unit: 'pc', category: 'produce', status: 'missing' },
        { name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry', status: 'stock' },
      ],
    },
  ];
  it('categoryGroups regroups dish items by aisle', () => {
    const cats = categoryGroups(groups());
    const dairy = cats.find(c => c.category === 'dairy')!;
    expect(dairy.items.map(i => i.name)).toEqual(['Milk']);
    const produce = cats.find(c => c.category === 'produce')!;
    expect(produce.items.map(i => i.name)).toEqual(['Onion']);
  });
  it('allMissingItems flattens every ✗ once; manualHave excludes marked items', () => {
    expect(allMissingItems(groups()).length).toBe(2);
    const manual = new Set(['onion']);
    const out = allMissingItems(groups(), manual);
    expect(out.map(i => i.name)).toEqual(['Milk']);
  });
});

describe('recipeIngredients — diet-aware variants (the banana-bread · 4-users gap)', () => {
  const bb = (withEgg: boolean): Dish => dish({
    id: 'bb', name: 'Banana Bread',
    variants: [
      { id: 'bb-egg', name: 'Banana Bread with Eggs', mealContext: 'breakfast', ingredients: [
        { name: 'All-Purpose Flour', quantity: 2, unit: 'cups', category: 'grains' },
        { name: 'Eggs', quantity: 2, unit: 'pcs', category: 'dairy' },
        { name: 'Mashed Banana', quantity: 1, unit: 'cups', category: 'produce' },
        { name: 'Sugar', quantity: 0.75, unit: 'cup', category: 'pantry' },
      ] },
      { id: 'bb-eggless', name: 'Banana Bread without Eggs', mealContext: 'breakfast', ingredients: [
        { name: 'All-Purpose Flour', quantity: 2, unit: 'cups', category: 'grains' },
        { name: 'Mashed Banana', quantity: 1.5, unit: 'cups', category: 'produce' },
        { name: 'Baking Soda', quantity: 1, unit: 'tsp', category: 'pantry' },
      ] },
    ],
  });

  it('veg/vegan user gets the EGGLESS variant; eggitarian/non-veg gets the egg variant', () => {
    const names = (diet?: string) => recipeIngredients(bb(true), [bb(true)], diet).map(i => i.name.toLowerCase());
    const hasEgg = (ns: string[]) => ns.some(n => n.includes('egg'));
    expect(hasEgg(names('veg'))).toBe(false);
    expect(hasEgg(names('vegan'))).toBe(false);
    expect(hasEgg(names('eggitarian'))).toBe(true);
    expect(hasEgg(names('non-veg'))).toBe(true);
    expect(hasEgg(names(undefined))).toBe(false); // default = eggless (safest)
  });

  it('real Banana Bread (no brown sugar) now lists sugar, banana & baking soda — and Eggs only for egg users', () => {
    const dish = DISH_LIBRARY.find(d => d.id === 'banana-bread-no-brown-sugar')!;
    const eggless = recipeIngredients(dish, DISH_LIBRARY, 'veg').map(i => i.name.toLowerCase());
    expect(eggless).toContain('mashed banana');
    expect(eggless).toContain('baking soda');
    expect(eggless.some(n => n.includes('egg'))).toBe(false);
    const withEgg = recipeIngredients(dish, DISH_LIBRARY, 'non-veg').map(i => i.name.toLowerCase());
    expect(withEgg.some(n => n.includes('egg'))).toBe(true);
  });
});

describe('applyAssumptions — the legend is clickable', () => {
  it('tapping a 🟡 staple moves it INTO to-buy (user says they DON’T have it)', () => {
    const g: BuyDishGroup[] = [{
      key: 'r', dishId: 'r', dishName: 'Rajma', icon: 'x', members: 1, hasMissing: true,
      items: [
        { name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', status: 'staple' },
        { name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', status: 'missing' },
      ],
    }];
    const applied = applyAssumptions(g, new Set(), new Set(['oil']));
    expect(applied[0]!.items[0]!.status).toBe('missing');
    expect(applied[0]!.hasMissing).toBe(true);
    expect(buySummary(applied).itemsToBuy).toBe(2); // oil + milk now both to buy
  });

  it('tapping a ✗ moves it OUT of to-buy (user claims they have it)', () => {
    const g: BuyDishGroup[] = [{
      key: 'r', dishId: 'r', dishName: 'Rajma', icon: 'x', members: 1, hasMissing: true,
      items: [
        { name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', status: 'missing' },
        { name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', status: 'staple' },
      ],
    }];
    const applied = applyAssumptions(g, new Set(['milk']), new Set());
    expect(applied[0]!.items[0]!.status).toBe('staple');
    expect(buySummary(applied).itemsToBuy).toBe(0);
  });

  it('a name in both sets resolves deterministically (notHave applies last)', () => {
    const g: BuyDishGroup[] = [{
      key: 'r', dishId: 'r', dishName: 'Rajma', icon: 'x', members: 1, hasMissing: true,
      items: [{ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', status: 'staple' }],
    }];
    // UI never allows both; if it ever happens, notHave (buy it) wins — unambiguous.
    const applied = applyAssumptions(g, new Set(['oil']), new Set(['oil']));
    expect(applied[0]!.items[0]!.status).toBe('missing');
  });
});
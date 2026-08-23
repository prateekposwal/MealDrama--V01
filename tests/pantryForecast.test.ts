import { describe, it, expect } from 'vitest';
import type { Dish, Ingredient } from '../meal/constants/dishLibrary';
import { canonicalName } from '../utils/ingredientUtils';
import {
  computeForecast,
  forecastSurplus,
  forecastForEntry,
  suggestReuse,
  defaultExpiry,
  isExpired,
  categoryForName,
  defaultStorageFor,
  UNIT_CONVERSIONS,
  type InventoryEntry,
  type ForecastWorkspace,
} from '../utils/pantryForecast';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TODAY = '2026-08-22';
const TOMORROW = '2026-08-23';
const DAY2 = '2026-08-24';
const DAY3 = '2026-08-25';

const ing = (name: string, quantity: number, unit: string): Ingredient => ({
  name, quantity, unit, category: 'pantry',
});

// Resolver: dish id → its ingredient list (simulated library).
const LIB: Record<string, Ingredient[]> = {
  'masala-chai': [ing('Milk', 150, 'ml')],
  'kheer': [ing('Milk', 300, 'ml')],
  'gajar-halwa': [ing('Milk', 200, 'ml')],
  'clericot': [ing('Coconut Milk', 250, 'ml')], // milk variant must NOT merge
};

function workspace(plan: Record<string, Array<{ mealId: string; quantity: number }>>): ForecastWorkspace {
  return {
    getDayItems: (date) => plan[date] ?? [],
    dishes: [],
    horizonDates: [TOMORROW, DAY2, DAY3],
  };
}

function makeEntry(overrides?: Partial<InventoryEntry>): InventoryEntry {
  return { name: 'Milk', quantity: 1000, unit: 'ml', addedAt: TODAY, ...overrides };
}

// ─── F1-F3: surplus math ─────────────────────────────────────────────────────

describe('forecastSurplus / forecastForEntry — F1-F3', () => {
  const chaiPlan = workspace({ [TOMORROW]: [{ mealId: 'masala-chai', quantity: 1 }] });

  it('F1: 150ml forecast vs 1000ml pack → surplus 850', () => {
    const entry = makeEntry({ quantity: 1000 });
    const r = forecastForEntry(entry, chaiPlan, {
      todayISO: TODAY,
      resolver: (id) => LIB[id] ?? [],
    });
    expect(r.status).toBe('surplus');
    expect(r.surplus).toBe(850);
    expect(r.forecastTotal).toBe(150);
  });

  it('F2: 150ml forecast vs 500ml pack → surplus 350', () => {
    const entry = makeEntry({ quantity: 500 });
    const r = forecastForEntry(entry, chaiPlan, {
      todayISO: TODAY,
      resolver: (id) => LIB[id] ?? [],
    });
    expect(r.surplus).toBe(350);
    expect(r.status).toBe('surplus');
  });

  it('F3: exact match → enough, surplus 0, no suggestions', () => {
    const chaiExactPlan = workspace({ [TOMORROW]: [{ mealId: 'masala-chai', quantity: 1 }] });
    const entry = makeEntry({ quantity: 150 });
    const r = forecastForEntry(entry, chaiExactPlan, {
      todayISO: TODAY,
      resolver: (id) => LIB[id] ?? [],
    });
    expect(r.status).toBe('enough');
    expect(r.surplus).toBe(0);
    expect(r.reuseSuggestions).toEqual([]);
  });
});

// ─── F4: aggregation across dishes/days ──────────────────────────────────────

describe('computeForecast — F4 aggregation', () => {
  it('F4: chai(150)+kheer(300)+gajar-halwa(200) over days → 650 forecast', () => {
    const plan = workspace({
      [TOMORROW]: [{ mealId: 'masala-chai', quantity: 1 }],
      [DAY2]: [{ mealId: 'kheer', quantity: 1 }],
      [DAY3]: [{ mealId: 'gajar-halwa', quantity: 1 }],
    });
    const perDay = computeForecast(makeEntry(), plan, (id) => LIB[id] ?? []);
    const total = perDay.reduce((s, d) => s + d.qty, 0);
    expect(total).toBe(650);
    expect(perDay.length).toBe(3);
  });
});

// ─── F5: dairy aliasing ──────────────────────────────────────────────────────

describe('canonicalName — F5 aliasing', () => {
  it('F5: Curd/Dahi/Yogurt merge into one canonical row', () => {
    expect(canonicalName('Curd')).toBe('yogurt');
    expect(canonicalName('Dahi')).toBe('yogurt');
    expect(canonicalName('Yogurt')).toBe('yogurt');
  });

  it('milk variants are NOT merged (Milk vs Coconut Milk vs Whole Milk)', () => {
    expect(canonicalName('Coconut Milk')).not.toBe(canonicalName('Milk'));
    expect(canonicalName('Whole Milk')).not.toBe(canonicalName('Milk'));
  });
});

// ─── F6: unit normalization ──────────────────────────────────────────────────

describe('computeForecast — F6 units', () => {
  it('F6: 1 cup(150 anchor) + 500ml under a ml-target → 650 (not 501 cup)', () => {
    const plan = workspace({
      [TOMORROW]: [{ mealId: 'chai-cup', quantity: 1 }],
      [DAY2]: [{ mealId: 'chai-ml', quantity: 1 }],
    });
    const lib: Record<string, Ingredient[]> = {
      'chai-cup': [ing('Milk', 1, 'cup')],
      'chai-ml': [ing('Milk', 500, 'ml')],
    };
    const perDay = computeForecast(makeEntry(), plan, (id) => lib[id] ?? []);
    const total = perDay.reduce((s, d) => s + d.qty, 0);
    expect(total).toBe(650);
  });

  it('UNIT_CONVERSIONS anchors cup=150', () => {
    expect(UNIT_CONVERSIONS.cup).toBe(150);
    expect(UNIT_CONVERSIONS.liter).toBe(1000);
  });
});

// ─── I1-I3: invariants ───────────────────────────────────────────────────────

describe('suggestReuse — I1/I3', () => {
  it('I1: suggestion totals never exceed surplus', () => {
    const r = suggestReuse(
      makeEntry(),
      850,
      [
        { date: TOMORROW, dishName: 'Kheer', qty: 300, unit: 'ml' },
        { date: DAY2, dishName: 'Dahi', qty: 200, unit: 'ml' },
        { date: DAY3, dishName: 'Paneer', qty: 400, unit: 'ml' },
      ],
      [],
      TODAY,
    );
    const total = r.reduce((s, x) => s + x.qty, 0);
    expect(total).toBeLessThanOrEqual(850);
  });

  it('I1b: surplus exactly 100 with a 300ml dish → only 100 suggested', () => {
    const r = suggestReuse(makeEntry(), 100, [{ date: TOMORROW, dishName: 'Kheer', qty: 300, unit: 'ml' }], [], TODAY);
    expect(r[0]!.qty).toBe(100);
    expect(r.reduce((s, x) => s + x.qty, 0)).toBe(100);
  });

  it('I3: deterministic — same inputs produce identical suggestions', () => {
    const a = suggestReuse(makeEntry(), 500, [{ date: TOMORROW, dishName: 'Kheer', qty: 300, unit: 'ml' }], ['Rasmalai', 'Milk Soup'], TODAY);
    const b = suggestReuse(makeEntry(), 500, [{ date: TOMORROW, dishName: 'Kheer', qty: 300, unit: 'ml' }], ['Rasmalai', 'Milk Soup'], TODAY);
    expect(a).toEqual(b);
  });
});

describe('forecastSurplus — I2 never negative', () => {
  it('I2: short status still yields surplus 0 (not negative)', () => {
    const perDay = [{ date: TOMORROW, dishName: 'Kheer', qty: 1200, unit: 'ml' }];
    const r = forecastSurplus(makeEntry({ quantity: 1000 }), perDay);
    expect(r.status).toBe('short');
    expect(r.surplus).toBe(0);
  });
});

// ─── I4: library fallback ────────────────────────────────────────────────────

describe('suggestReuse — I4 library fallback', () => {
  it('I4: candidates from the library are appended (capped 3) and never exceed surplus', () => {
    const r = suggestReuse(makeEntry(), 250, [], ['Kheer', 'Rasmalai', 'Badam Milk', 'Coconut Rice Pudding'], TODAY);
    expect(r.length).toBeLessThanOrEqual(3);
    const consumed = r.reduce((s, x) => s + x.qty, 0);
    expect(consumed).toBeLessThanOrEqual(250);
  });
});

// ─── Expiry / shelf-life defaults (S-props seed) ─────────────────────────────

describe('expiry helpers', () => {
  it('defaultExpiry: dairy → 3 days, pantry → 365', () => {
    expect(defaultExpiry(TODAY, 'dairy')).toBe('2026-08-25');
    expect(defaultExpiry(TODAY, 'pantry')).toBe('2027-08-22');
  });

  it('freezer storage extends dairy shelf life (3 days x10 → 30 days)', () => {
    expect(defaultExpiry(TODAY, 'dairy', 'freezer')).toBe('2026-09-21');
  });

  it('isExpired flags an expired entry', () => {
    const entry = makeEntry({ expiry: '2026-08-21' });
    expect(isExpired(entry, TODAY)).toBe(true);
    const live = makeEntry({ expiry: '2026-08-24' });
    expect(isExpired(live, TODAY)).toBe(false);
  });

  it('no expiry → never expired', () => {
    expect(isExpired(makeEntry(), TODAY)).toBe(false);
  });
});
// ─── P2 safe partials: category auto-classification + storage defaults ───────

describe('categoryForName / defaultStorageFor — P2 safe partials', () => {
  it('classifies common ingredients by keyword', () => {
    expect(categoryForName('Milk')).toBe('dairy');
    expect(categoryForName('Chicken')).toBe('proteins');
    expect(categoryForName('Atta')).toBe('grains');
    expect(categoryForName('Onion')).toBe('produce');
    expect(categoryForName('Jeera')).toBe('spices');
    expect(categoryForName('Vinegar')).toBe('pantry');
  });

  it('dairy takes precedence for paneer (milk-derived shelf life)', () => {
    expect(categoryForName('Paneer')).toBe('dairy');
  });

  it('falls back to pantry for unknown names', () => {
    expect(categoryForName('Zzz Unknown')).toBe('pantry');
  });

  it('storage default: fridge for perishables, pantry otherwise', () => {
    expect(defaultStorageFor('dairy')).toBe('fridge');
    expect(defaultStorageFor('proteins')).toBe('fridge');
    expect(defaultStorageFor('produce')).toBe('fridge');
    expect(defaultStorageFor('breads')).toBe('fridge');
    expect(defaultStorageFor('grains')).toBe('pantry');
    expect(defaultStorageFor('spices')).toBe('pantry');
    expect(defaultStorageFor(undefined)).toBe('pantry');
  });
});

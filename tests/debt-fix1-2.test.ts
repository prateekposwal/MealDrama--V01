// Regression: debt fix #1 (Egg category: dairy -> proteins) + #2 (12 class-b
// backlog variants gain explicit ingredient lists).
//   (a) NO resolved 'Egg' ingredient may carry category 'dairy' — Egg is a protein.
//   (b) Each of the 12 previously class-b (≤5-item / ≤3-non-generic) variants now
//       resolves WITH its base ingredient present.
import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { auditPriorityBacklog, auditRawVariants } from '../tools/auditDishRecipes';

function resolvedNames(dishId: string, variantId: string): string[] {
  return getIngredientsForMealOption(dishId, variantId, DISH_LIBRARY).map(i => i.name);
}

// (a) — Egg category fix
describe('debt fix #1 — Egg ingredients are proteins, never dairy', () => {
  it('every resolved Egg ingredient in the library has category proteins (not dairy)', () => {
    const offenders: string[] = [];
    for (const d of DISH_LIBRARY) {
      for (const v of d.variants ?? []) {
        const resolved = getIngredientsForMealOption(d.id, v.id, DISH_LIBRARY);
        for (const ing of resolved) {
          if (ing.name.toLowerCase() !== 'egg') continue;
          if (ing.category !== 'proteins') {
            offenders.push(`${d.id}::${v.id} → Egg category=${ing.category}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('still resolves 28 Egg ingredients across the library (22 flipped + 6 already correct)', () => {
    let eggs = 0;
    for (const d of DISH_LIBRARY) {
      for (const v of d.variants ?? []) {
        eggs += getIngredientsForMealOption(d.id, v.id, DISH_LIBRARY)
          .filter(i => i.name.toLowerCase() === 'egg').length;
      }
    }
    expect(eggs).toBe(28);
  });
});

// (b) — 12 class-b backlog rows
describe('debt fix #2 — the 12 class-b variants resolve with their base ingredient', () => {
  const CASES: Array<{ dish: string; variant: string; base: string[] }> = [
    { dish: 'dhokla', variant: 'dhokla-khaman', base: ['gram flour'] },
    { dish: 'dhokla', variant: 'dhokla-nylon', base: ['gram flour'] },
    { dish: 'khandvi', variant: 'khandvi-classic', base: ['gram flour'] },
    { dish: 'litti-chokha', variant: 'litti-chokha-bowl', base: ['wheat flour', 'sattu'] },
    { dish: 'litti-chokha', variant: 'litti-chokha-lite', base: ['wheat flour', 'sattu'] },
    { dish: 'litti-chokha', variant: 'litti-chokha-thali', base: ['wheat flour', 'sattu'] },
    { dish: 'idiyappam', variant: 'idi-sweet', base: ['rice flour'] },
    { dish: 'kothimbir-vadi', variant: 'kv-classic', base: ['coriander', 'gram flour'] },
    { dish: 'kothimbir-vadi', variant: 'kv-fried', base: ['coriander', 'gram flour'] },
    { dish: 'pumaloi', variant: 'pumaloi-classic', base: ['rice'] },
    { dish: 'tatte-idli', variant: 'ti-classic', base: ['idli rice'] },
    { dish: 'salmon-paturi', variant: 'salmon-paturi-rice', base: ['salmon'] },
  ];

  it.each(CASES)('$dish::$variant resolves with $base', ({ dish, variant, base }) => {
    const names = resolvedNames(dish, variant).map(n => n.toLowerCase());
    for (const frag of base) {
      expect(names.some(n => n.includes(frag))).toBe(true);
    }
    expect(names.length).toBeGreaterThan(2); // a real recipe, not a 1-item placeholder
  });

  it('salmon-paturi resolves Salmon specifically (not a generic/implied Chicken)', () => {
    const names = resolvedNames('salmon-paturi', 'salmon-paturi-rice');
    expect(names).toContain('Salmon');
    expect(names.some(n => /chicken/i.test(n))).toBe(false);
  });

  it('pumaloi resolves sticky rice (Meghalaya steamed rice cake), preserving vegan diet', () => {
    const names = resolvedNames('pumaloi', 'pumaloi-classic');
    expect(names.some(n => /sticky rice|rice/i.test(n))).toBe(true);
    const dish = DISH_LIBRARY.find(d => d.id === 'pumaloi');
    expect(dish?.diet).toBe('vegan');
  });

  it('litti-chokha Lite uses smaller portions than the Bowl (halved wheat flour)', () => {
    const qty = (dishId: string, variantId: string, name: string) =>
      getIngredientsForMealOption(dishId, variantId, DISH_LIBRARY)
        .find(i => i.name === name)?.quantity ?? 0;
    const bowlWheat = qty('litti-chokha', 'litti-chokha-bowl', 'Wheat Flour');
    const liteWheat = qty('litti-chokha', 'litti-chokha-lite', 'Wheat Flour');
    expect(bowlWheat).toBe(1);
    expect(liteWheat).toBeLessThan(bowlWheat);
  });
});

// (c) — the backlog itself is gone
describe('debt fix #2 — audit state', () => {
  it('auditPriorityBacklog is EMPTY', () => {
    expect(auditPriorityBacklog()).toEqual([]);
  });
  it('RAW dropped by exactly 12 from the 405 baseline', () => {
    expect(auditRawVariants()).toHaveLength(393);
  });
});

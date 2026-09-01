import { describe, it, expect } from 'vitest';
import { auditResolved, auditRawVariants } from '../tools/auditDishRecipes';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

describe('dish recipe audit — the whack-a-mole killer', () => {
  it('EVERY variant resolves a real recipe for the user (the Beetroot/Dal Panchmel class is closed)', () => {
    const gaps = auditResolved();
    expect(gaps, `resolved gaps:\n${gaps.map(g => `  ${g.id} (${g.variant}) → ${g.has.join(', ')}`).join('\n')}`).toEqual([]);
  });

  it('recently-fixed dishes stay complete (Beetroot Feta + Dal Panchmel)', async () => {
    const beet = getIngredientsForMealOption('beetroot-feta-salad', 'bfs-classic', DISH_LIBRARY).map(i => i.name.toLowerCase());
    for (const want of ['beetroot', 'feta cheese', 'olive oil', 'lemon juice']) {
      expect(beet.some(n => n.includes(want)), want).toBe(true);
    }
    const shorba = getIngredientsForMealOption('dal-panchmel-shorba', 'dpss-classic', DISH_LIBRARY).map(i => i.name.toLowerCase());
    expect(shorba.some(n => n.includes('toor dal'))).toBe(true);
    expect(shorba.some(n => n.includes('asafoetida'))).toBe(true);
  });

  it('audit is honest: huge RAW data gap but user-facing gap is what we track', () => {
    // RAW counts stored (incomplete) lists — data debt we chip away at;
    // RESOLVED is the product metric and must stay 0.
    const raw = auditRawVariants();
    expect(raw.length).toBeGreaterThan(0);
  });
});
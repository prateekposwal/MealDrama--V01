import { describe, it, expect } from 'vitest';
import { aggregateIngredients, recipeShareForDish } from '../utils/shareMessages';
import type { RecipeShareInput } from '../utils/shareMessages';

describe('aggregateIngredients — the WhatsApp duplication bug', () => {
  it('merges duplicate + alias rows and sums quantities (the Aloo Masala Sandwich case)', () => {
    const input: RecipeShareInput['ingredients'] = [
      { name: 'Bread', quantity: 2, unit: 'slices', category: 'breads' },
      { name: 'Potato', quantity: 2, unit: 'pcs', category: 'produce' },
      { name: 'Onion', quantity: 0.5, unit: 'pcs', category: 'produce' },
      { name: 'Green Chillies', quantity: 1, unit: 'pcs', category: 'produce' },
      { name: 'Potatoes', quantity: 0.5, unit: 'pc', category: 'produce' },
      { name: 'Potatoes', quantity: 0.5, unit: 'pc', category: 'produce' },
      { name: 'Mint Chutney', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { name: 'Ghee', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { name: 'Ghee', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
      { name: 'Butter', quantity: 1, unit: 'tbsp', category: 'dairy' },
      { name: 'Spices', quantity: 1, unit: 'packet', category: 'spices' },
      { name: 'Spices', quantity: 1, unit: 'packet', category: 'spices' },
    ];
    const out = aggregateIngredients(input);
    // Potatoes(×2) + Potato all merge under one normalized name + unit
    const potato = out.find(i => i.name === 'Potato');
    expect(potato?.quantity).toBe(3); // 2pc(pcs→pc) + 0.5pc + 0.5pc
    expect(potato?.unit).toBe('pc');
    // Duplicates collapse to single lines with summed qty
    const ghee = out.find(i => i.name === 'Ghee');
    expect(ghee?.quantity).toBe(4);
    const oil = out.find(i => i.name === 'Oil');
    expect(oil?.quantity).toBe(4);
    const spices = out.find(i => i.name === 'Spice');
    expect(spices?.quantity).toBe(2);
    // No duplicate lines remain (unique by name|unit)
    const keys = new Set(out.map(i => `${i.name}|${i.unit ?? ''}`));
    expect(keys.size).toBe(out.length);
  });

  it('renders a recipe with the aggregated, non-duplicated ingredient list', () => {
    const msg = recipeShareForDish({
      name: 'Aloo Masala Sandwich', icon: '🥪', region: 'north', type: 'veg',
      ingredients: [
        { name: 'Oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
        { name: 'Oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
      ],
      pairings: { sides: ['Green Chutney'], beverages: ['Masala Chai'] },
    });
    expect(msg.split('\n').filter(l => l.includes('Oil — 2tbsp')).length).toBe(1);
    expect(msg.match(/Oil/g)?.length).toBe(1);
  });
});
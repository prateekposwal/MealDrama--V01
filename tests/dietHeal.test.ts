import { describe, it, expect } from 'vitest';
import { findVictim } from '../utils/dietHeal';
import type { Dish } from '../meal/constants/dishLibrary';

function dish(overrides: Partial<Dish> & { id: string; name: string }): Dish {
  return {
    type: 'veg', tags: [], variants: [], category: ['lunch'], states: [],
    nutrition: [], region: 'north', ...overrides,
  } as unknown as Dish;
}

const LIBRARY = [
  dish({ id: 'egg-1', name: 'Egg Curry', type: 'eggitarian' }),
  dish({ id: 'veg-1', name: 'Rajma', type: 'veg' }),
  dish({ id: 'nv-1', name: 'Butter Chicken', type: 'non-veg' }),
];

describe('findVictim', () => {
  it('returns the LAST resolvable diet-mismatched item in a full slot', () => {
    const items = [
      { id: 'veg-1', name: 'Rajma' },
      { id: 'nv-1', name: 'Butter Chicken' },
    ];
    const hit = findVictim(items, LIBRARY, 'eggitarian');
    expect(hit).not.toBeNull();
    expect(hit!.victim.id).toBe('nv-1'); // last mismatch picked
  });

  it('protects custom/unresolvable dishes (user-added) from removal', () => {
    const items = [
      { id: 'custom-1', name: 'Grandma Special' },   // not in library
      { id: 'veg-1', name: 'Rajma' },                // resolvable mismatch
    ];
    const hit = findVictim(items, LIBRARY, 'eggitarian');
    expect(hit!.victim.id).toBe('veg-1'); // custom survived
  });

  it('returns null when every resolvable item already matches the diet', () => {
    const items = [
      { id: 'egg-1', name: 'Egg Curry' },
      { id: 'custom-1', name: 'Mystery Dish' },
    ];
    expect(findVictim(items, LIBRARY, 'eggitarian')).toBeNull();
  });

  it('prefers removing far diets before close ones (veg over egg when healing vegan)', () => {
    const items = [
      { id: 'egg-1', name: 'Egg Curry' },
      { id: 'veg-1', name: 'Rajma' },
    ];
    const hit = findVictim(items, LIBRARY, 'vegan')!;
    expect(hit.victim.id).toBe('veg-1'); // last mismatch by index is veg-1
  });
});
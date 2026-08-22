import { describe, it, expect, beforeEach } from 'vitest';
import { findSuggestion } from '../components/health/PlateCompletionBanner';
import { resetSessionShownForTest } from '../components/health/PlateCompletionBanner';
import type { Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';

function makeDish(overrides: { id: string; name: string; region: string; diet?: string } & Partial<Dish>): Dish {
  return {
    icon: '🍽️',
    states: [],
    category: ['dinner'],
    type: overrides.diet ?? 'non-veg',
    weight: 'medium',
    nutrition: [],
    tags: [],
    variants: [],
    ...overrides,
  } as unknown as Dish;
}

// A north-region protein pool: north chicken first, a random far-south chicken last.
const NORTH_CHICKEN = makeDish({ id: 'north-chicken-tikka', name: 'Chicken Tikka', region: 'north', tags: ['high-protein'] });
const NORTH_KEBAB = makeDish({ id: 'north-galouti', name: 'Galouti Kebab', region: 'north', tags: ['high-protein'] });
const CENTRAL_CHICKEN = makeDish({ id: 'central-chicken', name: 'Chicken Korma', region: 'central', tags: ['high-protein'] });
const SOUTH_CHICKEN = makeDish({ id: 'south-nadan', name: 'Nadan Kozhi Varuthathu (Chicken)', region: 'south', tags: ['high-protein', 'kerala'] });

beforeEach(() => resetSessionShownForTest());

describe('findSuggestion region-first (protein role)', () => {
  it('picks a NORTH dish for a north user, not the south fry', () => {
    for (let i = 0; i < 20; i++) {
      const dish = findSuggestion('protein', 'dinner', [SOUTH_CHICKEN, NORTH_CHICKEN, NORTH_KEBAB, CENTRAL_CHICKEN], 'north', 'non-veg');
      // Region-first: with north candidates present, the south dish should never win.
      expect(dish?.id).not.toBe('south-nadan');
    }
  });

  it('picks a SOUTH dish for a south user', () => {
    for (let i = 0; i < 20; i++) {
      const dish = findSuggestion('protein', 'dinner', [SOUTH_CHICKEN, NORTH_CHICKEN, NORTH_KEBAB, CENTRAL_CHICKEN], 'south', 'non-veg');
      expect(dish?.id).toBe('south-nadan');
    }
  });

  it('normalizes raw region labels like "North India"', () => {
    const dish = findSuggestion('protein', 'dinner', [SOUTH_CHICKEN, NORTH_CHICKEN], 'North India', 'non-veg');
    expect(dish?.id).toBe('north-chicken-tikka');
  });

  it('never excludes a dish — when only the south candidate matches the goal, it is returned', () => {
    const onlySouth = [SOUTH_CHICKEN];
    const dish = findSuggestion('protein', 'dinner', onlySouth, 'north', 'non-veg');
    expect(dish?.id).toBe('south-nadan'); // still returned (never hidden); just ordered lowest
  });

  it('prefers nearest region over far region when no exact match exists', () => {
    const noNorth = [SOUTH_CHICKEN, CENTRAL_CHICKEN];
    const dish = findSuggestion('protein', 'dinner', noNorth, 'north', 'non-veg');
    // Central is nearer to north than south per REGION_PROXIMITY.
    expect(dish?.id).toBe('central-chicken');
  });
});
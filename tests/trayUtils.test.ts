import { describe, it, expect } from 'vitest';
import { getIngredientNamesForMeal } from '../plan/utils/trayUtils';
import { useStore } from '../app/store/useStore';

describe('getIngredientNamesForMeal — cold-start fallback', () => {
  it('resolves ingredients when store.dishes is empty (no throw, real library)', () => {
    // Regression: the old lazy `require('../constants/dishLibrary')` pointed at
    // a NONEXISTENT path — addMealToSlot on a cold start (dishes not yet
    // hydated) threw "Cannot find module". The fallback must resolve via the
    // real library.
    const prev = useStore.getState().dishes;
    useStore.setState({ dishes: [] } as any);
    try {
      const names = getIngredientNamesForMeal('anda-bhurji', 'anda-bhurji-classic');
      expect(names).toContain('Egg');
      expect(names.length).toBeGreaterThan(0);
    } finally {
      useStore.setState({ dishes: prev } as any);
    }
  });

  it('still prefers hydrated store dishes when present', () => {
    useStore.setState({
      dishes: [{ id: 'custom-x', variants: [{ id: 'v1', name: 'V', ingredients: [{ name: 'Secret Sauce', quantity: 1, unit: 'cup' }] }] }] as any,
    });
    try {
      const names = getIngredientNamesForMeal('custom-x', 'v1');
      expect(names).toEqual(['Secret Sauce']);
    } finally {
      useStore.setState({ dishes: [] } as any);
    }
  });
});
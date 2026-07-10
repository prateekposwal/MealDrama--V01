import { useMemo } from 'react';
import type { Dish } from '../constants/dishLibrary';
import type { TrayItem } from '../../plan/store/useTrayStore';
import {
  findRuleForDish,
  computePairingForDish,
  computePairingForSlot,
  computePairingFromTrayItem,
} from '../utils/pairingEngine';
import type { PairingResult } from '../utils/pairingEngine';

export function useDishPairing(dish: Dish | null): PairingResult {
  return useMemo(() => {
    if (!dish) return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
    return computePairingForDish(dish);
  }, [dish]);
}

export function useDishRule(dish: Dish | null) {
  return useMemo(() => {
    if (!dish) return null;
    return findRuleForDish(dish);
  }, [dish]);
}

export function useSlotPairing(dishes: Dish[], existingItems: string[] = []): PairingResult {
  return useMemo(() => {
    return computePairingForSlot(dishes, existingItems);
  }, [dishes, existingItems]);
}

export function useTrayItemPairing(item: TrayItem | null): PairingResult {
  return useMemo(() => {
    if (!item) return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
    return computePairingFromTrayItem(item);
  }, [item]);
}

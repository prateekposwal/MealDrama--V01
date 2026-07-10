import type { PairingRule } from './pairing-rules';
import { PAIRING_RULES } from './pairing-rules';
import type { TrayItem } from '../../plan/store/useTrayStore';
import type { Dish } from '../constants/dishLibrary';
import { getDishStyle } from '../constants/dishStyles';

export interface PairingResult {
  sides: string[];
  condiments: string[];
  beverage: string | null;
  dessert: string | null;
  source: 'dish' | 'style' | 'region' | 'fallback';
}

export interface ScoredPairing {
  item: string;
  category: 'side' | 'condiment' | 'beverage' | 'dessert';
  score: number;
  source: string;
}

export function findRuleForDish(dish: Dish): PairingRule | null {
  const byId = PAIRING_RULES.find(r => r.dishId === dish.id);
  if (byId) return byId;

  const byName = PAIRING_RULES.find(r =>
    r.dishName && dish.name.toLowerCase().includes(r.dishName.toLowerCase())
  );
  if (byName) return byName;

  const style = getDishStyle(dish.id);
  if (style) {
    const byStyle = PAIRING_RULES.find(r => r.styles?.includes(style));
    if (byStyle) return byStyle;
  }

  const byRegion = PAIRING_RULES.find(r => r.regions?.includes(dish.region));
  if (byRegion) return byRegion;

  return null;
}

export function computePairingForDish(dish: Dish): PairingResult {
  const rule = findRuleForDish(dish);

  if (!rule) {
    return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
  }

  const source = rule.dishId ? 'dish' : rule.dishName ? 'dish' : rule.styles ? 'style' : 'region';

  return {
    sides: (rule.sides ?? []).slice(0, 2),
    condiments: (rule.condiments ?? []).slice(0, 1),
    beverage: rule.beverage ?? null,
    dessert: rule.dessert ?? null,
    source,
  };
}

export function computePairingForSlot(
  dishes: Dish[],
  existingItems: string[] = [],
): PairingResult {
  if (dishes.length === 0) {
    return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
  }

  if (dishes.length === 1) {
    return computePairingForDish(dishes[0]!);
  }

  const sideScores = new Map<string, number>();
  const condimentScores = new Map<string, number>();
  const beverageScores = new Map<string, number>();
  const dessertScores = new Map<string, number>();
  const itemSources = new Map<string, string[]>();

  const existingSet = new Set(existingItems.map(i => i.toLowerCase()));

  for (const dish of dishes) {
    const pairing = computePairingForDish(dish);
    const source = pairing.source;

    for (const side of pairing.sides) {
      if (existingSet.has(side.toLowerCase())) continue;
      const prev = sideScores.get(side) ?? 0;
      sideScores.set(side, prev + 1);
      if (!itemSources.has(side)) itemSources.set(side, []);
      itemSources.get(side)!.push(source);
    }

    for (const cond of pairing.condiments) {
      if (existingSet.has(cond.toLowerCase())) continue;
      const prev = condimentScores.get(cond) ?? 0;
      condimentScores.set(cond, prev + 1);
    }

    if (pairing.beverage && !existingSet.has(pairing.beverage.toLowerCase())) {
      const prev = beverageScores.get(pairing.beverage) ?? 0;
      beverageScores.set(pairing.beverage, prev + 1);
    }

    if (pairing.dessert && !existingSet.has(pairing.dessert.toLowerCase())) {
      const prev = dessertScores.get(pairing.dessert) ?? 0;
      dessertScores.set(pairing.dessert, prev + 1);
    }
  }

  const sortByScore = (map: Map<string, number>): string[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(e => e[0]);

  return {
    sides: sortByScore(sideScores).slice(0, 2),
    condiments: sortByScore(condimentScores).slice(0, 1),
    beverage: sortByScore(beverageScores)[0] ?? null,
    dessert: sortByScore(dessertScores)[0] ?? null,
    source: 'dish',
  };
}

export function computePairingFromTrayItem(item: TrayItem): PairingResult {
  const sides = (item.sides ?? []).filter(Boolean);
  const condiments: string[] = [];
  const beverage = (item.beverages ?? [])[0] ?? null;
  const dessert = (item.dessert ?? [])[0] ?? null;

  if (item.roti) sides.unshift(item.roti);
  if (item.rice) sides.unshift(item.rice);

  return {
    sides: sides.slice(0, 2),
    condiments,
    beverage,
    dessert,
    source: 'dish',
  };
}

export function mergeTrayPairings(items: TrayItem[]): PairingResult {
  if (items.length === 0) {
    return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
  }

  if (items.length === 1) {
    return computePairingFromTrayItem(items[0]!);
  }

  const allSides = new Set<string>();
  const allCondiments = new Set<string>();
  const beverageCounts = new Map<string, number>();
  const dessertCounts = new Map<string, number>();

  for (const item of items) {
    const p = computePairingFromTrayItem(item);
    p.sides.forEach(s => allSides.add(s));
    p.condiments.forEach(c => allCondiments.add(c));
    if (p.beverage) {
      beverageCounts.set(p.beverage, (beverageCounts.get(p.beverage) ?? 0) + 1);
    }
    if (p.dessert) {
      dessertCounts.set(p.dessert, (dessertCounts.get(p.dessert) ?? 0) + 1);
    }
  }

  const topBeverage = [...beverageCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topDessert = [...dessertCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    sides: [...allSides].slice(0, 2),
    condiments: [...allCondiments].slice(0, 1),
    beverage: topBeverage,
    dessert: topDessert,
    source: 'dish',
  };
}

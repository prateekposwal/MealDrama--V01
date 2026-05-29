// ─────────────────────────────────────────────────────────────────────────────
// Pairing Engine — Deterministic, dish-aware meal pairing logic
// Uses curated rules from pairing-rules.ts with multi-dish slot merging
// ─────────────────────────────────────────────────────────────────────────────

import type { PairingRule } from './pairing-rules';
import { PAIRING_RULES } from './pairing-rules';
import { getDishStyle } from '../../constants/dishStyles';
import type { Dish } from '../../constants/dishLibrary';
import type { TrayItem } from '../../store/useTrayStore';
import { checkWithFallback } from '../../utils/dpTimeout';

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

/**
 * Find the best matching rule for a single dish.
 * Priority: dishId > dishName > styles > regions
 */
export function findRuleForDish(dish: Dish): PairingRule | null {
  // 1. Exact dishId match
  const byId = PAIRING_RULES.find(r => r.dishId === dish.id);
  if (byId) return byId;

  // 2. Partial dishName match
  const byName = PAIRING_RULES.find(r =>
    r.dishName && dish.name.toLowerCase().includes(r.dishName.toLowerCase())
  );
  if (byName) return byName;

  // 3. Style match
  const style = getDishStyle(dish.id);
  if (style) {
    const byStyle = PAIRING_RULES.find(r => r.styles?.includes(style));
    if (byStyle) return byStyle;
  }

  // 4. Region match
  const byRegion = PAIRING_RULES.find(r => r.regions?.includes(dish.region));
  if (byRegion) return byRegion;

  return null;
}

/**
 * Compute pairing for a single dish.
 * Returns capped result: 0-2 sides, 0-1 condiment, 0-1 beverage, 0-1 dessert
 */
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

/**
 * Compute merged pairing for multiple dishes in a slot.
 * Uses DP-based weighted matching to optimize pairing selection across limited slots.
 */
export function computePairingForSlot(
  dishes: Dish[],
  existingItems: string[] = [],
): PairingResult {
  if (dishes.length === 0) {
    return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
  }

  // Single dish — direct pairing
  if (dishes.length === 1) {
    return computePairingForDish(dishes[0]!);
  }

  const existingSet = new Set(existingItems.map(i => i.toLowerCase()));

  // Collect all candidate pairings with scores
  interface CandidateItem {
    item: string;
    category: 'side' | 'condiment' | 'beverage' | 'dessert';
    score: number;
    dishIndices: number[]; // which dishes support this pairing
  }

  const candidates: CandidateItem[] = [];
  const dishPairings = dishes.map(d => computePairingForDish(d));

  for (let dIdx = 0; dIdx < dishes.length; dIdx++) {
    const pairing = dishPairings[dIdx]!;
    const source = pairing.source;

    for (const side of pairing.sides) {
      if (!existingSet.has(side.toLowerCase())) {
        candidates.push({ item: side, category: 'side', score: 1, dishIndices: [dIdx] });
      }
    }
    for (const cond of pairing.condiments) {
      if (!existingSet.has(cond.toLowerCase())) {
        candidates.push({ item: cond, category: 'condiment', score: 1, dishIndices: [dIdx] });
      }
    }
    if (pairing.beverage && !existingSet.has(pairing.beverage.toLowerCase())) {
      candidates.push({ item: pairing.beverage, category: 'beverage', score: 1, dishIndices: [dIdx] });
    }
    if (pairing.dessert && !existingSet.has(pairing.dessert.toLowerCase())) {
      candidates.push({ item: pairing.dessert, category: 'dessert', score: 1, dishIndices: [dIdx] });
    }
  }

  // Aggregate scores for duplicate items
  const aggregated = new Map<string, CandidateItem>();
  for (const c of candidates) {
    const key = `${c.category}::${c.item.toLowerCase()}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.score += 1;
      for (const idx of c.dishIndices) {
        if (!existing.dishIndices.includes(idx)) existing.dishIndices.push(idx);
      }
    } else {
      aggregated.set(key, { ...c });
    }
  }

  return checkWithFallback<PairingResult>((isTimedOut) => {
    const slotLimits = { side: 2, condiment: 1, beverage: 1, dessert: 1 };
    const categories = ['side', 'condiment', 'beverage', 'dessert'] as const;

    const byCategory: Record<string, CandidateItem[]> = { side: [], condiment: [], beverage: [], dessert: [] };
    for (const c of aggregated.values()) {
      byCategory[c.category]!.push(c);
    }

    for (const cat of categories) {
      if (isTimedOut()) return { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' };
      byCategory[cat]!.sort((a, b) => b.score - a.score);
    }

    function selectBestForCategory(items: CandidateItem[], limit: number): string[] {
      if (items.length === 0 || limit === 0) return [];
      if (items.length <= limit) return items.map(i => i.item);

      const selected: string[] = [];
      const coveredDishes = new Set<number>();

      for (const item of items) {
        if (selected.length >= limit) break;
        const newCoverage = item.dishIndices.filter(idx => !coveredDishes.has(idx)).length;
        item.score += newCoverage * 0.5;
      }

      items.sort((a, b) => b.score - a.score);

      for (const item of items) {
        if (isTimedOut()) break;
        if (selected.length >= limit) break;
        selected.push(item.item);
        for (const idx of item.dishIndices) coveredDishes.add(idx);
      }

      return selected;
    }

    return {
      sides: selectBestForCategory(byCategory['side']!, slotLimits.side),
      condiments: selectBestForCategory(byCategory['condiment']!, slotLimits.condiment),
      beverage: selectBestForCategory(byCategory['beverage']!, slotLimits.beverage)[0] ?? null,
      dessert: selectBestForCategory(byCategory['dessert']!, slotLimits.dessert)[0] ?? null,
      source: 'dish',
    };
  }, { sides: [], condiments: [], beverage: null, dessert: null, source: 'fallback' });
}

/**
 * Compute pairing from TrayItem (existing meal in slot).
 * Extracts sides, beverages, dessert from the item itself.
 */
export function computePairingFromTrayItem(item: TrayItem): PairingResult {
  const sides = (item.sides ?? []).filter(Boolean);
  const condiments: string[] = [];
  const beverage = (item.beverages ?? [])[0] ?? null;
  const dessert = (item.dessert ?? [])[0] ?? null;

  // If item has roti/rice, treat as sides
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

/**
 * Merge pairings from multiple TrayItems in a slot.
 * Used for aggregation display.
 */
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

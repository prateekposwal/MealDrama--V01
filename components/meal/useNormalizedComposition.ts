import { useMemo } from 'react';
import type { TrayItem } from '../../plan/store/useTrayStore';

export interface NormalizedCategory {
  name: string;
  totalQty: number;
  unit: string;
}

export interface NormalizedComposition {
  gravy: NormalizedCategory[];
  roti: NormalizedCategory[];
  rice: NormalizedCategory[];
  sides: NormalizedCategory[];
  beverages: NormalizedCategory[];
  dessert: NormalizedCategory[];
}

function mapKey(name: string, category: string): string {
  return `${name.trim().toLowerCase()}_${category}`;
}

/** Pure function — computes composition from meals array. No hooks. */
export function computeNormalizedComposition(meals: TrayItem[]): NormalizedComposition {
  const seen = new Map<string, { name: string; totalQty: number; category: string }>();

  for (const item of meals) {
    const collect = (name: string | null | undefined, category: string) => {
      if (!name) return;
      const key = mapKey(name, category);
      const qty = item.itemQtys?.[name] ?? 1;
      const existing = seen.get(key);
      if (existing) {
        existing.totalQty += qty;
      } else {
        seen.set(key, { name, totalQty: qty, category });
      }
    };

    collect(item.gravy, 'gravy');
    collect(item.roti, 'roti');
    collect(item.rice, 'rice');

    for (const s of item.sides ?? []) collect(s, 'sides');
    for (const b of item.beverages ?? []) collect(b, 'beverages');
    for (const d of item.dessert ?? []) collect(d, 'dessert');
  }

  const entries = Array.from(seen.values());
  const rotiNames = new Set(entries.filter(e => e.category === 'roti').map(e => e.name.toLowerCase()));
  const riceNames = new Set(entries.filter(e => e.category === 'rice').map(e => e.name.toLowerCase()));

  return {
    gravy: entries.filter(e => e.category === 'gravy').map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'servings' })),
    roti: entries.filter(e => e.category === 'roti').map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'pcs' })),
    rice: entries.filter(e => e.category === 'rice').map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'bowls' })),
    sides: entries.filter(e => e.category === 'sides' && !rotiNames.has(e.name.toLowerCase()) && !riceNames.has(e.name.toLowerCase())).map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'servings' })),
    beverages: entries.filter(e => e.category === 'beverages').map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'glasses' })),
    dessert: entries.filter(e => e.category === 'dessert').map(e => ({ name: e.name, totalQty: e.totalQty, unit: 'pcs' })),
  };
}

/** Hook wrapper — uses useMemo for performance. Drop-in replacement. */
export function useNormalizedComposition(meals: TrayItem[]): NormalizedComposition {
  return useMemo(() => computeNormalizedComposition(meals), [meals]);
}

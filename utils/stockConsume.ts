/**
 * LEDGER CONSUMPTION — the moment a family meal is marked DONE, its
 * ingredients draw down the household pantry (previously the ledger only ever
 * GREW: purchases added stock, nothing consumed it).
 *
 * The completed shared-plan row → dish ingredients (same resolver the buy
 * list uses) × servings → normalized to buy-friendly units (toBuyGrams) → the
 * /stock/consume endpoint (which clamps at zero and skips unit mismatches).
 *
 * Fire-and-forget and best-effort, like every other household sync: the meal
 * is DONE regardless of pantry bookkeeping, and the next poll reconciles.
 */

import api from '../lib/api';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption, toBuyGrams, canonicalName } from './ingredientUtils';

export interface ConsumableSharedItem {
  dishId?: string | null;
  dishName: string;
  quantity?: number;
}

export async function consumeSharedItemStock(householdId: string, item: ConsumableSharedItem): Promise<void> {
  if (!householdId || !item) return;

  let ings =
    (item.dishId && getIngredientsForMealOption(item.dishId, '', DISH_LIBRARY)) || [];
  if (ings.length === 0 && item.dishName) {
    const byName = DISH_LIBRARY.find(d => d.name === item.dishName);
    if (byName) ings = getIngredientsForMealOption(byName.id, '', DISH_LIBRARY);
  }
  if (ings.length === 0) return;

  const servings = Math.max(1, item.quantity || 1);
  const merged = new Map<string, { name: string; unit: string; quantity: number }>();
  for (const ing of ings) {
    const buy = toBuyGrams({ name: ing.name, quantity: ing.quantity * servings, unit: ing.unit, category: ing.category });
    const key = canonicalName(buy.name);
    const cur = merged.get(key);
    if (cur) {
      cur.quantity += buy.quantity;
      if (buy.unit && buy.unit !== cur.unit) cur.unit = cur.unit; // keep first unit; server skips mismatches
    } else {
      merged.set(key, { name: buy.name, unit: buy.unit, quantity: buy.quantity });
    }
  }

  const items = [...merged.values()];
  try {
    await api.post(`/households/${householdId}/stock/consume`, { items });
  } catch (err) {
    console.warn('[StockConsume] best-effort consume skipped:', err);
  }
}
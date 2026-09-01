// ─────────────────────────────────────────────────────────────────────────────
// FAMILY PLAN MERGE — display-layer cook intelligence over the append-only
// SharedPlanItem table (rows stay auditable; UNIQUENESS never added).
//   • mergeMemberRows   — identical (dish, date, slot) across members → ONE
//                         batch row with member list + summed servings.
//   • cookDayPlan       — batches + "same dish twice today" prepLinks +
//                         real co-kitchen conflicts (2 dishes, same mealtime).
//   • sharedGrocery     — family grocery list: every ingredient counted ONCE
//                         across all members' meals (same-dish rows feed the
//                         same ingredients, so no double-buy).
//   • canAcceptForDiet  — veg guard: a veg member can never batch-accept a
//                         non-veg family dish.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { SharedPlanItem } from '../app/utils/householdFeedApi';
import { aggregateIngredients, AggregatedIngredient } from './shareMessages';
import { getIngredientsForMealOption } from './ingredientUtils';
import { allowedTypesForDiet } from './dietQuota';

export interface CookBatch {
  key: string;            // dishId :: date :: mealType (stable merge key)
  dishId: string | null;
  dishName: string;
  icon: string;
  date: string;
  mealType: string;
  members: string[];
  quantity: number;       // servings needed (sum across members)
  itemIds: string[];
  status: string;
}

const SLOT_ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];

/** Merge identical (dishId, date, mealType) rows across members → batch rows. */
export function mergeMemberRows(items: SharedPlanItem[], memberNameOf: (id: string | null) => string): CookBatch[] {
  const map = new Map<string, CookBatch>();
  for (const item of items) {
    const key = `${item.dishId ?? 'custom'}::${item.date}::${item.mealType}`;
    const existing = map.get(key);
    if (existing) {
      const who = memberNameOf(item.requestedFor ?? item.requestedBy);
      if (!existing.members.includes(who)) existing.members.push(who);
      existing.quantity += Math.max(1, item.quantity ?? 1);
      existing.itemIds.push(item.id);
      if (item.status === 'completed') existing.status = 'completed';
    } else {
      map.set(key, {
        key,
        dishId: item.dishId,
        dishName: item.dishName,
        icon: item.icon,
        date: item.date,
        mealType: item.mealType,
        members: [memberNameOf(item.requestedFor ?? item.requestedBy)],
        quantity: Math.max(1, item.quantity ?? 1),
        itemIds: [item.id],
        status: item.status,
      });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.date.localeCompare(b.date) ||
    SLOT_ORDER.indexOf(a.mealType) - SLOT_ORDER.indexOf(b.mealType) ||
    a.dishName.localeCompare(b.dishName));
}

export interface CookDayPlan {
  batches: CookBatch[];
  /** Same dish appearing in ≥2 DIFFERENT slots the same day → prep once. */
  prepLinks: Array<{ dishId: string | null; dishName: string; slots: string[] }>;
  /** A mealtime with ≥2 DIFFERENT dishes → real co-kitchen conflict. */
  mealtimeConflicts: Array<{ mealType: string; dishes: string[] }>;
}

export function cookDayPlan(items: SharedPlanItem[], memberNameOf: (id: string | null) => string): CookDayPlan {
  const batches = mergeMemberRows(items, memberNameOf);

  // Prep links: the same dish on different slots of the same day.
  const byDish = new Map<string, { dishId: string | null; dishName: string; slots: Set<string> }>();
  for (const item of items) {
    const k = item.dishId ?? item.dishName;
    const entry = byDish.get(k) ?? { dishId: item.dishId, dishName: item.dishName, slots: new Set<string>() };
    entry.slots.add(item.mealType);
    byDish.set(k, entry);
  }
  const prepLinks = [...byDish.values()]
    .filter(e => e.slots.size > 1)
    .map(e => ({ dishId: e.dishId, dishName: e.dishName, slots: [...e.slots].sort((a, b) => SLOT_ORDER.indexOf(a) - SLOT_ORDER.indexOf(b)) }));

  // Mealtime conflicts: two different dishes on the SAME slot.
  const bySlot = new Map<string, Set<string>>();
  for (const b of batches) {
    const set = bySlot.get(b.mealType) ?? new Set<string>();
    set.add(b.dishName);
    bySlot.set(b.mealType, set);
  }
  const mealtimeConflicts = [...bySlot.entries()]
    .filter(([, dishes]) => dishes.size > 1)
    .map(([mealType, dishes]) => ({ mealType, dishes: [...dishes] }));

  return { batches, prepLinks, mealtimeConflicts };
}

/** Family grocery list — every ingredient counted once across members' meals. */
export function sharedGrocery(
  items: SharedPlanItem[],
  library: Dish[] = DISH_LIBRARY,
): AggregatedIngredient[] {
  const all: AggregatedIngredient[] = [];
  const already = new Set<string>(`${items.map(i => i.id).join('|')}`);
  // Dedupe by dish so one dish's ingredients feed the list once even when 2
  // members share the same dish — then that's its true "×N servings" demand.
  void already;
  const seenDish = new Set<string>();
  for (const item of items) {
    const key = `${item.dishId ?? item.dishName}`;
    if (seenDish.has(key)) continue;
    seenDish.add(key);
    if (!item.dishId) continue;
    const dish = library.find(d => d.id === item.dishId);
    if (!dish) continue;
    all.push(...getIngredientsForMealOption(dish.id, dish.variants?.[0]?.id ?? '', library));
  }
  return aggregateIngredients(all);
}

/** Veg guard: can this member accept/batch this dish given their diet? */
export function canAcceptForDiet(dishType: string | undefined, diet?: string | null): boolean {
  return allowedTypesForDiet(diet).includes(dishType || '');
}

/** Compact "cook this" text for WhatsApp / share copy. */
export function cookSummaryText(
  plan: CookDayPlan,
  date: string,
  missingByDish: Record<string, number> = {},
): string {
  const lines: string[] = [`👨‍🍳 Cook ${date}`, ''];
  for (const b of plan.batches) {
    const missing = missingByDish[b.dishId ?? ''] ?? 0;
    const label = b.members.length > 1 ? `×${b.quantity} (${b.members.join(', ')})` : `(${b.members[0] ?? 'Family'})`;
    lines.push(`  ${b.icon} ${b.dishName} ${label}${missing > 0 ? ` ⚠️ ${missing} to buy` : ' ✅'}`);
  }
  for (const p of plan.prepLinks) lines.push(`  🔁 ${p.dishName} twice today (${p.slots.join(' + ')}) — prep once.`);
  for (const c of plan.mealtimeConflicts) lines.push(`  ⚠️ ${c.mealType}: ${c.dishes.join(' & ')} — two dishes same time!`);
  lines.push('', 'Sent from MealDrama');
  return lines.join('\n');
}
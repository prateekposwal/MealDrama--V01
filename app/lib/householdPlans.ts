// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD-PLANS SOURCE (Gap 3) — every member's persisted current plan,
// cached for the personalization context.
//
// Contract:
//   · buildPersonalizationContext merges the cached household-plan rows with
//     the shared-plan rows (the explicit-share surface from before). Members
//     with NOTHING persisted are simply absent — never guessed.
//   · The caller excludes the user's OWN rows (own dishes are never
//     penalized).
//   · Per-household cache key — different households never mix.
//   · pushCurrentTrayAsHouseholdPlan persists the CURRENT tray on every
//     regeneration (replace-all semantics server-side).
//   · seedHouseholdPlansForTests exists ONLY for tests.
// ─────────────────────────────────────────────────────────────────────────────
import { householdPlanApi, type HouseholdPlanRow } from '../utils/householdPlanApi';
import type { TrayLibrary } from '../store/useStore';

interface HouseholdPlansCache {
  householdId: string | null;
  rows: HouseholdPlanRow[] | null;
  loaded: boolean;
}

let cache: HouseholdPlansCache = { householdId: null, rows: null, loaded: false };

/** The other members' persisted plan rows for `householdId`, or null when
 *  not loaded / a different household's cache. */
export function getCachedHouseholdPlans(householdId: string): HouseholdPlanRow[] | null {
  if (!cache.loaded || cache.householdId !== householdId) return null;
  return cache.rows;
}

/** Fetch + cache ALL members' current plan rows (fire-and-forget). */
export async function refreshHouseholdPlans(householdId: string): Promise<void> {
  if (!householdId) return;
  try {
    const res = await householdPlanApi.get(householdId);
    cache = { householdId, rows: res.dishes, loaded: true };
  } catch {
    // offline/unauthenticated → cache stays stale; the caller keeps the
    // shared-plan surface (an unreachable plans table is never assumed empty)
  }
}

/** Persist the current tray as MY household-visible plan (replace-all).
 *  Best-effort — generation is never blocked on the network. */
export async function pushCurrentTrayAsHouseholdPlan(
  householdId: string,
  userId: string,
  tray: TrayLibrary,
): Promise<number> {
  if (!householdId || !userId) return 0;
  const rows: Array<{ dishId: string; mealSlot: string; dayIndex: number }> = [];
  for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
    for (const [idx, m] of (tray[slot] ?? []).entries()) {
      const dishId = m.dishId || m.id;
      // The tray library holds this slot's meals in plan order — so the
      // position IS the day index of the current week. Writing 0 for every
      // dish collapsed the family plan onto a single day; the real index
      // keeps per-day rows so the household/cook views show a real week.
      if (dishId) rows.push({ dishId, mealSlot: slot, dayIndex: idx });
    }
  }
  if (rows.length === 0) return 0;
  try {
    const res = await householdPlanApi.put(householdId, rows);
    await refreshHouseholdPlans(householdId);
    return res.replaced;
  } catch {
    return 0; // best-effort
  }
}

/** Test-only seeding (honest — never called from production paths). */
export function seedHouseholdPlansForTests(householdId: string, rows: HouseholdPlanRow[] | null): void {
  cache = { householdId, rows, loaded: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL HISTORY SOURCE (Gap 2) — the persisted "consumed" log, cached for the
// personalization context.
//
// Contract:
//   · buildPersonalizationContext reads getCachedMealHistory(userId) — the
//     persisted log REPLACES the swap/served-day proxies once it has rows.
//   · refreshMealHistory(userId) is fire-and-forget — regeneration never
//     blocks on the network. Until the first fetch lands (or while the log is
//     genuinely empty), the caller falls back to the old proxies (the honest
//     "history empty" state — never invented rows).
//   · Per-user isolation: the cache is keyed by the userId it was fetched for.
//     A different user reading the cache gets null (and triggers their own
//     refresh) — two users' histories are never mixed, client or server.
//   · seedMealHistoryForTests exists ONLY for tests (explicit — no hidden
//     wiring, no fabrication in production paths).
// ─────────────────────────────────────────────────────────────────────────────
import { mealLogApi, type MealLogRow } from '../utils/mealLogApi';
import type { HistoryItem } from '../../utils/mealPersonalization';

interface MealHistoryCache {
  userId: string | null;
  rows: HistoryItem[] | null;
  loaded: boolean;
}

let cache: MealHistoryCache = { userId: null, rows: null, loaded: false };

/** The persisted history for `userId`, or null when not loaded / another
 *  user's cache (isolation) — the caller then uses its fallback proxies. */
export function getCachedMealHistory(userId: string): HistoryItem[] | null {
  if (!cache.loaded || cache.userId !== userId) return null;
  return cache.rows;
}

/** True when the persisted log for `userId` is loaded AND non-empty — the
 *  ONLY condition under which the persisted history replaces the proxies. */
export function hasPersistedMealHistory(userId: string): boolean {
  const rows = getCachedMealHistory(userId);
  return rows !== null && rows.length > 0;
}

/** True when `userId`'s log has been CONFIRMED loaded from the server
 *  (rows present or honestly empty). An unreachable/unloaded log is NOT
 *  "loaded" — a UI must never claim an unconfirmed empty state. */
export function isMealHistoryLoaded(userId: string): boolean {
  return cache.loaded && cache.userId === userId;
}

/** The persisted log's row count for `userId` (0 = honestly empty, only when
 *  loaded). Returns null while unloaded — the caller must not treat that as
 *  zero history. */
export function getMealHistoryCount(userId: string): number | null {
  if (!isMealHistoryLoaded(userId)) return null;
  return cache.rows?.length ?? 0;
}

/** Fetch + cache MY history (fire-and-forget from context building). */
export async function refreshMealHistory(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const rows = await mealLogApi.get(80);
    cache = { userId, rows: rows.map((r: MealLogRow) => ({ id: r.dishId })), loaded: true };
  } catch {
    // offline/unauthenticated → cache stays as-is; the caller's fallback
    // proxies remain in effect (an unreachable log is never assumed empty)
  }
}

/** Invalidate the cache (e.g. right after logging a meal) so the next
 *  context build refetches the fresh history. */
export function invalidateMealHistory(): void {
  cache = { userId: null, rows: null, loaded: false };
}

/** Log the dishes of a completed meal slot (the REAL "meal done" signal).
 *  Best-effort — offline failures never break the completion flow. */
export async function logMealEaten(dishIds: string[], mealSlot: string, date?: string): Promise<void> {
  for (const dishId of dishIds) {
    if (!dishId) continue;
    try {
      await mealLogApi.put(dishId, mealSlot, date);
    } catch {
      // best-effort; the local completion is unaffected
    }
  }
  invalidateMealHistory();
}

/** Test-only seeding (honest — never called from production paths). */
export function seedMealHistoryForTests(userId: string, rows: HistoryItem[] | null): void {
  cache = { userId, rows, loaded: true };
}

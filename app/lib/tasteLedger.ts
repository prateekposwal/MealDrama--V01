// ─────────────────────────────────────────────────────────────────────────────
// TASTE LEDGER SOURCE — the persisted learning record, cached for the
// recommendation context (mirror of mealHistory's cache discipline).
//
// Contract:
//   · buildPersonalizationContext reads getCachedTasteLedger(userId) and
//     feeds the pure LedgerSignals into the scorer + gates.
//   · refreshTasteLedger(userId) is fire-and-forget — recommendation never
//     blocks on the network. While unloaded, the scorer runs WITHOUT the
//     ledger term (honest "no learning yet" — never invented events).
//   · Per-user isolation: the cache is keyed by the userId it was fetched for.
//     A different user reading the cache gets null — two users' ledgers are
//     never mixed, client or server.
//   · recordTasteEvent is the ONE writer the UI surfaces call (like/dislike/
//     swap/added) — fire-and-forget PUT + local cache update.
//   · seedTasteLedgerForTests exists ONLY for tests (explicit).
// ─────────────────────────────────────────────────────────────────────────────
import { tasteLedgerApi, type TasteLedgerRow } from '../utils/tasteLedgerApi';
import type { TasteAction, TasteLedgerEvent } from '../../utils/tasteLedger';
import { toLedgerEvent } from '../../utils/tasteLedger';

interface TasteLedgerCache {
  userId: string | null;
  events: TasteLedgerEvent[] | null;
  loaded: boolean;
}

let cache: TasteLedgerCache = { userId: null, events: null, loaded: false };

/** The persisted ledger for `userId`, or null when not loaded / another
 *  user's cache (isolation). */
export function getCachedTasteLedger(userId: string): TasteLedgerEvent[] | null {
  if (!cache.loaded || cache.userId !== userId) return null;
  return cache.events;
}

/** True when `userId`'s ledger has been CONFIRMED loaded (rows or honest
 *  empty). Unreachable/unloaded is NOT "loaded". */
export function isTasteLedgerLoaded(userId: string): boolean {
  return cache.loaded && cache.userId === userId;
}

/** The event count for `userId` (0 = honestly empty, only when loaded). */
export function getTasteLedgerCount(userId: string): number | null {
  if (!isTasteLedgerLoaded(userId)) return null;
  return cache.events?.length ?? 0;
}

/** Fetch + cache MY ledger (fire-and-forget from context building). */
export async function refreshTasteLedger(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const rows = await tasteLedgerApi.get(200);
    const events: TasteLedgerEvent[] = [];
    for (const r of rows) {
      const ev = toLedgerEvent({ ...r, userId });
      if (ev) events.push(ev);
    }
    cache = { userId, events, loaded: true };
  } catch {
    // offline/unauthenticated → cache stays as-is; the caller's scorer runs
    // without the ledger term (an unreachable ledger is never assumed empty)
  }
}

/** Invalidate the cache — call after recording, so the next context build
 *  refetches the fresh ledger. */
export function invalidateTasteLedger(): void {
  cache = { userId: null, events: null, loaded: false };
}

/** The ONE writer the feedback surfaces call. Record, update the local cache
 *  (so the NEXT recommendation sees the event immediately), then refetch in
 *  the background. Best-effort — offline failures never break the UI. */
export async function recordTasteEvent(
  userId: string,
  dishId: string,
  action: TasteAction,
  replacedWithId?: string,
): Promise<void> {
  if (!userId || !dishId) return;
  // Local optimistic append (bounded, newest-first).
  const ev: TasteLedgerEvent = {
    userId,
    dishId,
    action,
    replacedWithId,
    at: new Date().toISOString(),
  };
  const current = cache.userId === userId ? (cache.events ?? []) : [];
  cache = { userId, events: [ev, ...current].slice(0, 500), loaded: true };
  try {
    const res = await tasteLedgerApi.put(dishId, action, replacedWithId);
    if (res.duplicate) {
      // Keep the local append; the server already had this event today.
      return;
    }
    void refreshTasteLedger(userId);
  } catch {
    // offline — the local event still feeds the next recommendation
  }
}

/** Test-only seeding (honest — never called from production paths). */
export function seedTasteLedgerForTests(userId: string, events: TasteLedgerEvent[] | null): void {
  cache = { userId, events, loaded: true };
}

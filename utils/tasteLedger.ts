// ─────────────────────────────────────────────────────────────────────────────
// TASTE LEDGER — the persisted learning record AND its pure, deterministic
// read model. ONE store, ONE shape, every consumer.
//
// One event = one user action on one dish:
//   like       ❤️  → boost this dish and dishes like it (same cuisine/ingredients)
//   dislike    👎  → penalize this dish and its near relatives
//   replacedTo 🔄  → the user swapped dish A for dish B (store A → replacedWithId B)
//                    → prefer B's cuisine/ingredient family
//   added      🆕  → the user explicitly added a dish (affinity extension)
//
// The scorer NEVER reads raw events directly — it reads `LedgerSignals`, a
// pure function of the event list. That keeps scoring deterministic and
// per-user isolated (signals are built from MY events only).
//
// The client cache (app/lib/tasteLedger.ts) and the server route
// (server/src/routes/tasteLedger.ts) both speak THIS event shape.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import { dishCuisineKeys, dishIngredientNames, dishVariantIngredientNames } from './dishTaste';
import { AROMATICS_BASELINE } from './variety';

export type TasteAction = 'like' | 'dislike' | 'replacedTo' | 'added';
export const TASTE_ACTIONS: readonly TasteAction[] = ['like', 'dislike', 'replacedTo', 'added'] as const;

export interface TasteLedgerEvent {
  userId: string;
  dishId: string;
  action: TasteAction;
  /** For replacedTo: the dish the user replaced TO. */
  replacedWithId?: string;
  /** ISO timestamp. */
  at: string;
}

const _norm = (s: string): string => (s ?? '').toLowerCase().trim();

/** Bound the event list fed to the scorer (newest-first input expected). */
export const LEDGER_WINDOW = 400;

/** Per-user ledger read model. Built purely from the event list. */
export interface LedgerSignals {
  /** dishIds the user liked/added (exact boost). */
  likedDishIds: Set<string>;
  /** dishIds the user disliked (exact penalty). */
  dislikedDishIds: Set<string>;
  /** dishIds the user replaced AWAY from (mild penalty — context rot). */
  replacedAwayDishIds: Set<string>;
  /** dishIds the user replaced TO (exact boost — chosen on purpose). */
  replacedToDishIds: Set<string>;
  /** cuisine key → net like weight (likes − dislikes), clamped. */
  cuisineWeights: Map<string, number>;
  /** normalized ingredient token → net like weight. */
  ingredientWeights: Map<string, number>;
}

export function emptyLedgerSignals(): LedgerSignals {
  return {
    likedDishIds: new Set(), dislikedDishIds: new Set(),
    replacedAwayDishIds: new Set(), replacedToDishIds: new Set(),
    cuisineWeights: new Map(), ingredientWeights: new Map(),
  };
}

/** Signals from events alone (exact dish-id sets; no rich features). */
export function ledgerSignals(events: readonly TasteLedgerEvent[] | null | undefined): LedgerSignals {
  return buildLedgerSignals(events, new Map<string, Dish>());
}

/** Build signals, optionally resolving richer dish features via `dishIndex`
 *  (cuisine/ingredient weights are only computed for dishes we can resolve). */
export function buildLedgerSignals(
  events: readonly TasteLedgerEvent[] | null | undefined,
  dishIndex: ReadonlyMap<string, Dish>,
): LedgerSignals {
  const s = emptyLedgerSignals();
  if (!events?.length) return s;
  const w = (v: number) => Math.max(-4, Math.min(4, v));
  for (const e of events) {
    if (!e?.dishId) continue;
    const src = dishIndex.get(e.dishId) ?? null;
    if (e.action === 'like' || e.action === 'added') {
      s.likedDishIds.add(e.dishId);
      if (src) applyDishWeights(s, src, 1.0);
    } else if (e.action === 'dislike') {
      s.dislikedDishIds.add(e.dishId);
      if (src) applyDishWeights(s, src, -1.0);
    } else if (e.action === 'replacedTo') {
      // The dish the user moved AWAY from is marked (mild penalty) but never
      // gets positive affinity — and the TARGET dish gets the boost.
      s.replacedAwayDishIds.add(e.dishId);
      if (e.replacedWithId) {
        s.replacedToDishIds.add(e.replacedWithId);
        const to = dishIndex.get(e.replacedWithId);
        if (to) applyDishWeights(s, to, 1.0);
      }
    }
  }
  // clamp maps
  for (const [k, v] of s.cuisineWeights) s.cuisineWeights.set(k, w(v));
  for (const [k, v] of s.ingredientWeights) s.ingredientWeights.set(k, w(v));
  return s;
}

function applyDishWeights(s: LedgerSignals, d: Dish, weight: number): void {
  for (const c of dishCuisineKeys(d)) {
    s.cuisineWeights.set(c, (s.cuisineWeights.get(c) ?? 0) + weight);
  }
  // DISTINCTIVE ingredients only — shared curry-baseline aromatics (salt,
  // oil, onion…) must never create false affinity between different recipes.
  for (const n of dishVariantIngredientNames(d)) {
    const tok = _norm(n);
    if (!tok || AROMATICS_BASELINE.has(tok)) continue;
    s.ingredientWeights.set(tok, (s.ingredientWeights.get(tok) ?? 0) + 0.35 * weight);
  }
}

const ANIMAL_NEEDLE = /chicken|mutton|lamb|pork|beef|fish|prawn|egg|paneer|gelatin/i;

/** Deterministic ledger score for one dish, from `signals` only. Higher =
 *  better fit for THIS user's learned taste. Bounded so it can never override
 *  the hard gates — it only re-orders dishes that already passed. */
export function ledgerScore(d: Dish, signals?: LedgerSignals | null): number {
  if (!signals) return 0;
  let score = 0;
  if (signals.likedDishIds.has(d.id)) score += 2.0;
  if (signals.dislikedDishIds.has(d.id)) score -= 3.0;
  if (signals.replacedToDishIds.has(d.id)) score += 1.6;
  if (signals.replacedAwayDishIds.has(d.id)) score -= 0.8;

  for (const c of dishCuisineKeys(d)) {
    const w = signals.cuisineWeights.get(c) ?? 0;
    score += 0.6 * w;
  }
  // Ingredient-affinity: sum the (small) ingredient weights, bounded.
  let ing = 0;
  for (const n of dishIngredientNames(d)) {
    ing += signals.ingredientWeights.get(_norm(n)) ?? 0;
  }
  score += Math.max(-1.5, Math.min(1.5, ing));
  return Math.max(-6, Math.min(6, score));
}

/** Normalize an API row → the canonical event (defensive). */
export function toLedgerEvent(row: Partial<TasteLedgerEvent> & { dishId?: string }): TasteLedgerEvent | null {
  if (!row?.dishId) return null;
  const action = (TASTE_ACTIONS as readonly string[]).includes(row.action ?? '')
    ? (row.action as TasteAction)
    : null;
  if (!action) return null;
  return {
    userId: row.userId ?? '',
    dishId: row.dishId,
    action,
    replacedWithId: row.replacedWithId,
    at: row.at ?? new Date(0).toISOString(),
  };
}

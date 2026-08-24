// ─────────────────────────────────────────────────────────────────────────────
// Suggestion ROTATION — plan-nav suggestion cards must feel DYNAMIC and keep
// bringing NEW dishes. Previously "Try These" excluded only the single target
// day's meals, so the same cards reappeared every open ("always bring new").
//
// `nextSuggestionBatch` — asks selectTryThese for a fresh batch, then records
// that batch as "already suggested". The NEXT call therefore surfaces a NEW
// set (region/diet/health/backfill patterns unchanged). The seen-set is
// bounded: when it fills, the oldest half is dropped so the pool never dries
// out forever.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../../meal/constants/dishLibrary';
import { selectTryThese } from '../../utils/dishSearch';

const STORAGE_KEY = 'md_suggestion_seen_v1';
/** How many recent suggestions we remember at once. */
const MAX_SEEN = 48;
/** When full, drop the OLDEST half so freshly-rotated dishes re-enter. */
const PRUNE_TO = 24;

let _seen: string[] | null = null;

function loadSeen(): string[] {
  if (_seen) return _seen;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    _seen = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    _seen = [];
  }
  return _seen;
}

function saveSeen(ids: string[]): void {
  _seen = ids;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable (private mode / tests) — in-memory only */
  }
}

/**
 * Record dish ids that were just suggested. Bounded LRU-ish: once we've
 * remembered MAX_SEEN, the oldest PRUNE_TO drop out and become suggestible
 * again (rotation, not permanent exclusion).
 */
export function recordSuggestions(ids: string[]): void {
  if (ids.length === 0) return;
  const seen = loadSeen();
  const next = [...new Set([...seen, ...ids])];
  const trimmed = next.length > MAX_SEEN ? next.slice(next.length - PRUNE_TO) : next;
  saveSeen(trimmed);
}

/** Forget everything (exposed for tests / user "reshuffle" affordances). */
export function resetSuggestionSeen(): void {
  saveSeen([]);
}

/**
 * Next batch of suggestions: excludes the caller's ids PLUS the rolling
 * seen-set, returns the fresh batch, and records it so the next call brings
 * new dishes. Falls back gracefully — if the seen-set would starve the pool,
 * selectTryThese returns whatever remains and the prune re-opens the loop.
 */
export function nextSuggestionBatch(
  dishes: Dish[],
  opts: { userDiet?: string; regionKey: string; plannedSlots?: string[]; maxPerSlot?: number; excludeIds?: string[]; healthGoal?: string },
): Dish[] {
  const seen = loadSeen();
  const exclude = new Set([...(opts.excludeIds ?? []), ...seen]);
  const batch = selectTryThese(dishes, { ...opts, excludeIds: [...exclude] });
  recordSuggestions(batch.map(d => d.id));
  return batch;
}

/** Ids inside the rolling seen-set (for tests / UI hints). */
export function getSuggestionSeen(): string[] {
  return [...loadSeen()];
}
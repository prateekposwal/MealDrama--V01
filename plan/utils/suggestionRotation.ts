// ─────────────────────────────────────────────────────────────────────────────
// Suggestion ROTATION — plan-nav suggestion cards must feel DYNAMIC and keep
// bringing NEW dishes. Previously "Try These" excluded only the single target
// day's meals, so the same cards reappeared every open ("always bring new").
//
// DAILY FRESHNESS (this version): the seen-set is keyed by calendar day and
// user scope. Each calendar day records which dish ids were suggested, and a
// rolling 7-day freshness window EXCLUDES recently-shown ids from the current
// day's batch, so a client is shown a fresh rotation day over day instead of
// the same suggestions repeating. The history is bounded (last N days, and a
// per-day cap) and refills from the eligible pool when the pool runs low.
//
// `nextSuggestionBatch` — asks selectTryThese for a fresh batch, then records
// that batch under today's date as "already suggested". The NEXT call therefore
// surfaces a NEW set (region/diet/health/backfill patterns unchanged), and the
// next DAY surfaces a batch that avoids the last N days' dishes.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../../meal/constants/dishLibrary';
import { selectTryThese } from '../../utils/dishSearch';
import { getISODate } from '../../utils/dateUTC';

const STORAGE_PREFIX = 'md_suggestion_seen_';
/** Keep the last N calendar days of seen-sets so dishes rotate fresh daily. */
const MAX_DAYS = 7;
/** Max dish ids remembered per calendar day at once (rotation, not hoarding). */
const MAX_PER_DAY = 48;
/** When a day's set fills, drop the OLDEST half so dishes re-enter that day. */
const PRUNE_TO = 24;

/** scope → { ISO date → dish ids suggested that day }. */
type DayMap = Record<string, string[]>;

let _seen = new Map<string, DayMap>(); // scope → cache

function storageKey(scope?: string | null): string {
  return `${STORAGE_PREFIX}${scope || 'default'}`;
}

/** Calendar day key (IST) — the single source of truth for "today". */
function todayKey(): string {
  return getISODate(new Date());
}

function loadSeenMap(scope?: string | null): DayMap {
  const key = storageKey(scope);
  const cached = _seen.get(key);
  if (cached) return cached;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    let map: DayMap = {};
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        // Migrate the legacy plain-array format ({ id[] }) → today's key.
        map = { [todayKey()]: data };
      } else if (data && typeof data === 'object') {
        map = { ...data } as DayMap;
      }
    }
    _seen.set(key, map);
    return map;
  } catch {
    return {};
  }
}

function saveSeenMap(scope: string | null | undefined, map: DayMap): void {
  _seen.set(storageKey(scope), map);
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey(scope), JSON.stringify(map));
  } catch {
    /* storage unavailable (private mode / tests) — in-memory only */
  }
}

/** Drop days older than the freshness window so the map stays bounded. */
function pruneSeenMap(map: DayMap): DayMap {
  const dates = Object.keys(map).sort(); // ascending YYYY-MM-DD
  const newest = dates.slice(Math.max(0, dates.length - MAX_DAYS));
  const next: DayMap = {};
  for (const d of newest) { const ids = map[d]; if (ids) next[d] = ids; }
  return next;
}

/**
 * Record dish ids that were just suggested, keyed under today's calendar day.
 * Per-day LRU-ish: once a single day remembers MAX_PER_DAY, the oldest
 * PRUNE_TO drop out and become suggestible again within the freshness window.
 */
export function recordSuggestions(ids: string[], scope?: string | null): void {
  if (!ids || ids.length === 0) return;
  const map = pruneSeenMap(loadSeenMap(scope));
  const day = todayKey();
  const prev = map[day] ?? [];
  const next = [...new Set([...prev, ...ids])];
  const trimmed = next.length > MAX_PER_DAY ? next.slice(next.length - PRUNE_TO) : next;
  map[day] = trimmed;
  saveSeenMap(scope, map);
}

/** Forget everything for a scope (exposed for tests / user "reshuffle"). */
export function resetSuggestionSeen(scope?: string | null): void {
  saveSeenMap(scope, {});
}

/**
 * Next batch of suggestions, DAILY-fresh:
 *  - Excludes the caller's ids (already-in-plan/tray) PLUS every id shown in
 *    the last MAX_DAYS calendar days (including today, so the day stays
 *    dynamic AND the next day surfaces a fresh rotation).
 *  - Refills from the eligible pool when the recent-window exclusion would
 *    starve the batch: retry relaxing ONLY the recent-days exclusion (still
 *    respecting the caller's excludes) so a small/fully-rotated library shows
 *    something instead of nothing.
 *  - Records the returned batch under today's date so the next day rotates on.
 */
export function nextSuggestionBatch(
  dishes: Dish[],
  opts: { userDiet?: string; regionKey: string; plannedSlots?: string[]; maxPerSlot?: number; excludeIds?: string[]; healthGoal?: string; scope?: string | null },
): Dish[] {
  const map = pruneSeenMap(loadSeenMap(opts.scope));
  const recentlyShown = new Set<string>();
  for (const ids of Object.values(map)) for (const id of ids) recentlyShown.add(id);

  const callerExclude = opts.excludeIds ?? [];
  let batch = selectTryThese(dishes, { ...opts, excludeIds: [...new Set([...callerExclude, ...recentlyShown])] });

  // Refill: if the recent-window exclusion emptied the batch, relax ONLY the
  // recent-days set (still honoring the caller's added/tray exclusions).
  if (batch.length === 0) {
    batch = selectTryThese(dishes, { ...opts, excludeIds: [...callerExclude] });
  }

  recordSuggestions(batch.map(d => d.id), opts.scope);
  return batch;
}

/** Ids suggested on `date` (default: today) within the seen-set (for tests / UI). */
export function getSuggestionSeen(scope?: string | null, date?: string): string[] {
  const map = pruneSeenMap(loadSeenMap(scope));
  return [...(map[date ?? todayKey()] ?? [])];
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion Utilities — Shared conversion functions for API → app types
// ─────────────────────────────────────────────────────────────────────────────

import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../app/lib/trayApi';
import { DISH_LIBRARY, type Dish, type Region } from '../meal/constants/dishLibrary';
import { getRegionKey } from './dishSearch';
import { compareRegion } from './regionPreference';
import { filterDishesByDiet } from './healthInsight';

// ─────────────────────────────────────────────────────────────────────────────
// Diet inference from dish name (mirrors filterDishesByDiet logic)
 // ─────────────────────────────────────────────────────────────────────────────

/** Infer diet category from a dish name. */
function inferDietFromName(name: string): string | null {
  const lower = (name || '').toLowerCase();
  if (!lower) return null;
  // non-veg: contains meat/poultry/seafood keywords
  if (/chicken|mutton|beef|lamb|fish|meat|prawn|seafood/.test(lower)) return 'non-veg';
  // eggitarian: contains egg keyword
  if (/egg/.test(lower)) return 'eggitarian';
  // veg: default (no meat keywords)
  return 'veg';
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical region helpers
 // ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_REGION_KEYS = new Set(['north', 'south', 'west', 'east', 'central', 'northeast', 'all']);
const REGION_KEYWORDS: Array<[RegExp, string]> = [
  [/south/i, 'south'],
  [/north\s*east/i, 'northeast'],
  [/east/i, 'east'],
  [/west/i, 'west'],
  [/central/i, 'central'],
  [/north/i, 'north'],
];

/** Translate a free-form region string (incl. bridge dialect forms) to a canonical key. */
function toCanonicalRegion(raw?: string): string | undefined {
  const s = (raw ?? '').trim();
  if (!s) return undefined;
  const viaKey = getRegionKey(s); // 'North India'→'north' · 'All India'→'all' · 'India'→'all'
  if (CANONICAL_REGION_KEYS.has(viaKey)) return viaKey;
  for (const [re, key] of REGION_KEYWORDS) {
    if (re.test(s)) return key;
  }
  return undefined; // untranslatable dialect → region-agnostic tie, never last-forever
}

/** Resolve the authoritative region for an AI item: the local library dish (by id,
 *  then by name with the same boundary rules as suggestionToMeal) first, else the
 *  AI-provided region string. Unknown/absent → undefined (region-agnostic).
 */
function resolveSuggestionRegion(item: SuggestionLike, library?: readonly Dish[]): string | undefined {
  const byId = library?.find(d => d.id === item.id);
  if (byId?.region) return byId.region;
  if (library && item.name) {
    const lower = item.name.toLowerCase();
    const byName = library.find(d => d.name.toLowerCase() === lower)
      || library.find(d => d.name.toLowerCase().startsWith(lower) && (d.name.length === lower.length || d.name[lower.length] === ' ' || d.name[lower.length] === '('))
      || library.find(d => lower.startsWith(d.name.toLowerCase()) && (lower.length === d.name.length || lower[d.name.length] === ' ' || lower[d.name.length] === '('));
    if (byName?.region) return byName.region;
  }
  return toCanonicalRegion(item.region);
}

/** Minimal shape an AI suggestion item needs for region ordering. */
export interface SuggestionLike {
  id: string;
  name: string;
  region?: string;
}

// ─── AI-curated suggestion region ordering ────────────────────────────────────
// The external AI bridge returns suggestions WITHOUT respecting the user region
// (dialect mismatch + reorder-not-exclude). Every other surface is already
// region-correct; this orders AI-curated items region-first CLIENT-SIDE.
// Ordering ONLY — never excludes: the user can still add anything; region is a
// decisive ordering preference, not a filter. diet filtering is applied first
// when provided, then region ordering.

// ─────────────────────────────────────────────────────────────────────────────
// Region-first ordering for AI-curated suggestion items — optionally filter by diet
// first, then exact region → nearest neighbors → all/region-agnostic → rest.
// Deterministic (region, then name, then id) and NEVER drops an item.

export function orderSuggestionsRegionFirst<T extends SuggestionLike>(
  items: T[],
  regionKey: string,
  library?: readonly Dish[],
  diet?: string,
): T[] {
  // Defensive: a wrong-arg-order call used to pass userDiet as `items` (a
  // string) → "items.filter is not a function". Never trust the array.
  const list = Array.isArray(items) ? items : [];
  // Step 1: optional diet filtering
  const filtered = diet
    ? list.filter((item) => {
        const dishDiet = inferDietFromName(item.name);
        if (diet === 'non-veg') return true; // include all
        if (diet === 'eggitarian') return true; // include all
        if (diet === 'veg') return dishDiet !== 'non-veg'; // exclude non-veg
        return true;
      })
    : list;
  // Guard the label too — a misplaced array can arrive in `regionKey` slot.
  let key = 'all';
  if (typeof regionKey === 'string') {
    try { key = getRegionKey(regionKey); } catch { key = 'all'; }
  }
  const resolved = filtered.map(item => ({
    item,
    region: resolveSuggestionRegion(item, library) ?? 'all',
  }));
  return resolved
    .sort((a, b) =>
      compareRegion(key, a.region, b.region)
      || a.item.name.localeCompare(b.item.name)
      || String(a.item.id).localeCompare(String(b.item.id)),
    )
    .map(entry => entry.item);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion-to-meal conversion
// ─────────────────────────────────────────────────────────────────────────────

/** Convert SuggestionMeal (API response) to Meal (defaults engine input).
 * Resolves to a real dish ID from DISH_LIBRARY so that "Build Your Plate"
 * and future lookups can find the dish by meal_id.
 * Normalizes region string to Region type.
 */
export function suggestionToMeal(s: SuggestionMeal): Meal {
  const match = DISH_LIBRARY.find(d => d.name.toLowerCase() === s.name.toLowerCase())
    || DISH_LIBRARY.find(d => d.name.toLowerCase().startsWith(s.name.toLowerCase()) && (d.name.length === s.name.length || d.name[s.name.length] === ' ' || d.name[s.name.length] === '('))
    || DISH_LIBRARY.find(d => s.name.toLowerCase().startsWith(d.name.toLowerCase()) && (s.name.length === d.name.length || s.name[d.name.length] === ' ' || s.name[d.name.length] === '('));
  return {
    id: match?.id ?? s.id,
    name: s.name,
    icon: match?.icon ?? s.icon,
    region: normalizeRegion(s.region) as 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast',
    baseGravy: s.defaultGravy,
    rotiOptions: s.defaultRoti ? [s.defaultRoti] : undefined,
    riceOptions: s.defaultRice ? [s.defaultRice] : undefined,
    suggestedPairings: {
      sides: s.defaultSides,
      beverages: s.defaultBeverages,
    },
  };
}

/** Normalize region string to Region type. */
export function normalizeRegion(region: string): Region {
  const lower = region.toLowerCase();
  if (lower.includes('south')) return 'south';
  if (lower.includes('east')) return 'east';
  if (lower.includes('west')) return 'west';
  if (lower.includes('central')) return 'central';
  if (lower.includes('north east') || lower.includes('northeast')) return 'northeast';
  return 'north';
}

// ─── AI-curated suggestion region ordering ────────────────────────────────────
// The external AI bridge returns suggestions WITHOUT respecting the user region
// (dialect mismatch + reorder-not-exclude). Every other surface is already
// region-correct; this orders AI-curated items region-first CLIENT-SIDE.
// Ordering ONLY — never excludes: the user can still add anything; region is a
// decisive ordering preference, not a filter. diet filtering is applied first
// when provided, then region ordering.

// ─────────────────────────────────────────────────────────────────────────────
// Region-first ordering for AI-curated suggestion items — optionally filter by diet
// first, then exact region → nearest neighbors → all/region-agnostic → rest.
// Deterministic (region, then name, then id) and NEVER drops an item.
// Pass the local dish library so AI items can be matched back (by id, then name)
// to the canonical dish regions every other surface uses.
// Unknown/absent regions resolve to the region-agnostic 'all' tier
// instead of being dumped last forever.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// End of AI-curated suggestion region ordering
 // ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Translate a free-form region string (incl. bridge dialect forms) to a canonical key.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// End of suggestion utilities
 // ─────────────────────────────────────────────────────────────────────────────
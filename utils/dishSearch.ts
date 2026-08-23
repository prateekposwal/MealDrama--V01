import type { Dish } from '../meal/constants/dishLibrary';
import { scoreDish } from './nutritionScore';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from './healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from './healthSortFilter';
import { checkWithFallback } from './dpTimeout';
import { toDishMap } from './dishMap';
import { Trie } from '../app/utils/Trie';
import { LRUCache } from '../app/utils/LRUCache';
import { BloomFilter } from '../app/utils/BloomFilter';
import { getDishGraph } from '../app/utils/DishGraph';
import { compareRegion } from './regionPreference';
import { getPreferenceBoost } from './dishPreferences';




// ── Fuzzy search — Levenshtein distance for typo tolerance ──
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  const matrix: number[] = [];
  for (let i = 0; i <= bn; i++) matrix[i] = i;
  for (let i = 1; i <= an; i++) {
    let prev = i;
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        matrix[j] + 1,     // deletion
        prev + 1,           // insertion
        matrix[j - 1] + cost, // substitution
      );
      matrix[j - 1] = prev;
      prev = val;
    }
    matrix[bn] = prev;
  }
  return matrix[bn];
}

function fuzzyMatch(query: string, target: string): boolean {
  if (target.includes(query)) return true;
  if (query.length < 3) return false;
  // For 3-4 char queries, allow 1 edit; for 5+, allow 2
  const maxDist = query.length <= 4 ? 1 : 2;
  return levenshtein(query.toLowerCase(), target.toLowerCase()) <= maxDist;
}
const DIET_FILTER: Record<string, string[]> = {
  veg: ['veg', 'vegan'],
  'non-veg': ['veg', 'non-veg', 'eggitarian'],
  eggitarian: ['veg', 'eggitarian', 'non-veg'],
  vegan: ['vegan'],
};

const _categoryIndexMap = new WeakMap<Dish[], Map<string, Set<string>>>();
let _trie: Trie | null = null;
let _trieDishes: Dish[] | null = null;
let _bloom: BloomFilter | null = null;
let _bloomDishes: Dish[] | null = null;

function ensureIndexes(dishes: Dish[]) {
  if (!_categoryIndexMap.has(dishes)) {
    const idx = new Map<string, Set<string>>();
    for (const d of dishes) {
      for (const c of d.category) {
        const key = c.toLowerCase();
        let ids = idx.get(key);
        if (!ids) { ids = new Set(); idx.set(key, ids); }
        ids.add(d.id);
      }
    }
    _categoryIndexMap.set(dishes, idx);
  }
  if (_trieDishes !== dishes) {
    _trie = new Trie();
    for (const d of dishes) {
      _trie.insert(d.name, d.id);
      if (d.variants) {
        for (const v of d.variants) {
          _trie.insert(v.name, d.id);
        }
      }
    }
    _trieDishes = dishes;
  }
  if (_bloomDishes !== dishes) {
    _bloom = new BloomFilter(dishes.length + 100);
    for (const d of dishes) {
      _bloom.add(d.id);
    }
    _bloomDishes = dishes;
  }
}

export interface ScoredDish {
  dish: Dish;
  score: number;
  healthScore: number;
}

// ─── Slot diversity profiles ────────────────────────────────────────────────
const DISH_WEIGHT: Record<string, number> = {
  light: -1,    // negative = already have enough, boost opposites
  heavy: 1,
  protein: 1,
  carb: 1,
  veg: 1,
  fried: -1,
  healthy: 1,
  indulgent: -1,
};

function getDishProfile(dish: Dish): string[] {
  const profile: string[] = [];
  if (dish.tags) {
    for (const tag of dish.tags) {
      if (tag in DISH_WEIGHT) profile.push(tag);
    }
  }
  if (profile.length === 0) profile.push('light');
  return profile;
}

function diversityBonus(candidate: Dish, existingDishes: Dish[]): number {
  if (existingDishes.length === 0) return 0;

  const existingProfiles = existingDishes.flatMap(getDishProfile);
  const candidateProfiles = getDishProfile(candidate);

  let bonus = 0;
  for (const cp of candidateProfiles) {
    const weight = DISH_WEIGHT[cp] ?? 0;
    const existingCount = existingProfiles.filter(p => p === cp).length;
    // Boost dishes that complement existing selection
    if (weight > 0 && existingCount === 0) bonus += 3;
    if (weight < 0 && existingCount >= 2) bonus += 5;
    if (weight > 0 && existingCount >= 2) bonus -= 2; // avoid over-representation
  }
  return bonus;
}

// DP-based top-N diversity optimization
// Uses DP to select top-N results that maximize both relevance and variety
const diversityCache = new LRUCache<string, ScoredDish[]>({ maxSize: 100 });

function optimizeTopNDiversity(scored: ScoredDish[], existingDishes: Dish[], topN: number): ScoredDish[] {
  if (topN <= 0 || scored.length === 0) return scored;

  const scoredKey = scored.slice(0, 30).map(s => `${s.dish.id}:${s.score}:${s.healthScore}`).join(',');
  const existingKey = existingDishes.map(d => d.id).join(',');
  const cacheKey = `${scoredKey}::${existingKey}::${topN}`;

  const cached = diversityCache.get(cacheKey);
  if (cached) return cached;

  const finalResult = checkWithFallback<ScoredDish[]>((isTimedOut) => {
    const limit = Math.min(scored.length, 30);
    const candidates = scored.slice(0, limit);

    const dp: number[][] = [];
    const selected: number[] = []; // bitmask per dp[i][j]: (j << 5) | i

    function idx(i: number, j: number) { return j * (limit + 1) + i; }

    for (let i = 0; i <= limit; i++) {
      dp[i] = new Array(topN + 1).fill(-Infinity);
    }
    dp[0]![0] = 0;
    selected[idx(0, 0)] = 0;

    for (let i = 0; i < limit; i++) {
      if (isTimedOut()) return scored;
      const candidate = candidates[i]!;
      const relevanceScore = candidate.score + candidate.healthScore * 0.5;

      for (let j = 0; j <= topN; j++) {
        const currentVal = dp[i]![j]!;
        if (currentVal === -Infinity) continue;

        const nextVal = dp[i + 1]![j]!;
        if (currentVal > nextVal) {
          dp[i + 1]![j] = currentVal;
          selected[idx(i + 1, j)] = selected[idx(i, j)]!;
        }

        if (j < topN) {
          const mask = selected[idx(i, j)];
          let existing: Dish[] = [];
          if (mask) {
            let m = mask;
            let idx2 = 0;
            while (m) {
              if (m & 1) existing.push(candidates[idx2]!.dish);
              m >>>= 1;
              idx2++;
            }
          }

          const divBonus = diversityBonus(candidate.dish, existing);
          const candidateScore = currentVal + relevanceScore + divBonus;
          const nextDp = dp[i + 1]![j + 1]!;
          if (candidateScore > nextDp) {
            dp[i + 1]![j + 1] = candidateScore;
            selected[idx(i + 1, j + 1)] = (selected[idx(i, j)] ?? 0) | (1 << i);
          }
        }
      }
    }

    const result: ScoredDish[] = [];
    let mask = selected[idx(limit, topN)] ?? 0;
    let idx2 = 0;
    while (mask) {
      if (mask & 1) result.push(candidates[idx2]!);
      mask >>>= 1;
      idx2++;
    }

    const selectedIds = new Set(result.map(r => r.dish.id));
    const remaining = scored.filter(s => !selectedIds.has(s.dish.id));
    return [...result, ...remaining];
  }, scored);

  diversityCache.set(cacheKey, finalResult);
  return finalResult;
}

/**
 * Shared dish search/filter engine used by both QuickAddModal and SwapCustomizeModal.
 * Filters by slot, diet, search query, health preset; scores by region/popularity; sorts by health or score.
 * No debounce — caller should debounce the `query` parameter externally.
 */
export function rankDishes(params: {
  dishes: Dish[];
  slot: string;
  diet?: string;
  regionKey: string;
  query: string;
  showGlobal: boolean;
  healthPreset?: HealthFilterPreset | null;
  healthSort?: HealthSortKey | null;
  selectedDishIds?: string[];
  customDishes?: Dish[];
  allDishes?: Dish[]; // Full dish library for diversity calculation
  excludeIds?: string[]; // IDs to exclude (already in current slot)
}): ScoredDish[] {
  const {
    dishes, slot, diet, regionKey, query, showGlobal,
    healthPreset, healthSort, selectedDishIds, customDishes, allDishes,
    excludeIds,
  } = params;

  const q = query.toLowerCase();
  const category = slot.toLowerCase();
  const isVegan = diet?.toLowerCase() === 'vegan';
  const allowedTypes = DIET_FILTER[diet?.toLowerCase() || 'veg'] || ['veg'];
  const excludeSet = excludeIds ? new Set(excludeIds) : new Set<string>();
  const selectedSet = selectedDishIds
    ? new Set([...selectedDishIds, ...excludeSet])
    : excludeSet;
  const dishPool = customDishes?.length ? [...dishes, ...customDishes] : dishes;

  ensureIndexes(dishes);

  const categoryIndex = _categoryIndexMap.get(dishes) ?? new Map();

  // Pre-compute trie matches for query prefix
  const trieMatchIds = q && _trie ? _trie.search(q) : null;

  const filtered = dishPool.filter(d => {
    if (selectedSet.has(d.id)) return false;
    const isCustom = d.tags?.includes('user_created');
    if (!isCustom && !categoryIndex.get(category)?.has(d.id)) {
      if (!q) return false;
      // Dish doesn't match slot category but has a query match — score penalty will push it down
    }
    if (isVegan && d.type !== 'veg' && d.type !== 'vegan') return false;
    if (!isVegan && !allowedTypes.includes(d.type)) return false;
    if (q) {
      if (trieMatchIds?.has(d.id)) return true;
      const matchTags = d.tags.some(t => t.toLowerCase().includes(q));
      const matchVariant = d.variants.some(v => v.name.toLowerCase().includes(q));
      if (!matchTags && !matchVariant) {
        const dName = d.name.toLowerCase();
        if (!dName.includes(q)) {
          // Fuzzy fallback: typo-tolerant matching
          if (!fuzzyMatch(q, dName)) return false;
        }
      }
    }
    return true;
  });

  const healthFiltered = healthPreset
    ? filterDishesByHealth(filtered, getFilterPreset(healthPreset))
    : filtered;

  const scored: ScoredDish[] = healthFiltered.map(d => {
    let score = 0;
    if (new RegExp('\\b' + regionKey + '\\b').test(d.region.toLowerCase())) score += 10;
    if (d.tags.includes('popular') || d.tags.includes('hero')) score += 5;
    if (d.states.some(s => s.toLowerCase().includes(regionKey))) score += 3;
    score += getPreferenceBoost(d.id, d.tags);
    // Category mismatch penalty: if dish doesn't belong to this meal slot, penalize heavily
    // so slot-appropriate dishes rank higher even when searching
    if (q && !categoryIndex.get(category)?.has(d.id) && !d.tags?.includes('user_created')) {
      score -= 50;
    }
    // Beverage/side penalty: dishes tagged as 'beverage' should not rank high for lunch/dinner
    if (q && (category === 'lunch' || category === 'dinner') && d.tags?.includes('beverage')) {
      score -= 30;
    }
    return { dish: d, score, healthScore: scoreDish(d) };
  });

  // ─── Region relevance filter ─────────────────────────────────────────
  // Region is an ORDERING heuristic, never an exclusion. Every dish remains
  // selectable/searchable (user always free to add anything). The upstream
  // `filtered` stage already enforced query/slot relevance; region merely
  // orders. So keep the whole pool: with a query, a strong match from ANY
  // region must surface; when browsing, the comparator below places
  // exact → nearest → all-region → far-region.
  const regionRegex = new RegExp('\\b' + regionKey + '\\b');
  const relevantScored = scored;

  // Apply diversity optimization if we have existing selections
  const existingDishes = allDishes?.filter(d => selectedSet.has(d.id)) ?? [];
  let finalScored = relevantScored;
  if (existingDishes.length > 0 && !healthSort && !q) {
    finalScored = optimizeTopNDiversity(relevantScored, existingDishes, 10);
  } else if (healthSort) {
    const sortedByHealth = sortDishesByHealth(relevantScored.map(s => s.dish), healthSort);
    const rankMap = new Map(sortedByHealth.map((d, i) => [d.id, i]));
    relevantScored.sort((a, b) => (rankMap.get(a.dish.id) ?? 0) - (rankMap.get(b.dish.id) ?? 0));
    finalScored = relevantScored;
  } else {
    relevantScored.sort((a, b) => b.score - a.score);
    finalScored = relevantScored;
  }

  // ─── Stable ordering: region first (browse) — search query stays score-dominant ──
  // Region priority is an ordering heuristic ONLY. It never filters dishes out:
  // users are always free to search and add any dish from any region. When a free-text
  // query `q` is present, text relevance governs (score), and region is a tie-break —
  // a strong match from another region still surfaces. When browsing (no `q`), the
  // selected region + nearest regions lead, then diet, then score.
  const userDiet = diet?.toLowerCase() || 'veg';
  const dietRank = (d: Dish): number => {
    const dt = d.diet || d.type || '';
    if (!dt) return 3;
    if (dt === userDiet) return 0;
    if (userDiet === 'non-veg' && (dt === 'eggitarian' || dt === 'non-veg')) return 1;
    if (userDiet === 'veg' && (dt === 'veg' || dt === 'vegan')) return 1;
    if (userDiet === 'eggitarian' && (dt === 'eggitarian' || dt === 'veg')) return 1;
    return 2;
  };
  finalScored.sort((a, b) => {
    if (q) {
      // Free search: score (relevance) governs, region breaks ties.
      if (b.score !== a.score) return b.score - a.score;
    } else {
      // Browse: region first (exact → nearest → all → rest), then diet, then score.
      const rc = compareRegion(regionKey, a.dish.region, b.dish.region);
      if (rc !== 0) return rc;
    }

    const aDiet = dietRank(a.dish);
    const bDiet = dietRank(b.dish);
    if (aDiet !== bDiet) return aDiet - bDiet;

    const aIsRegion = regionRegex.test(a.dish.region.toLowerCase());
    const bIsRegion = regionRegex.test(b.dish.region.toLowerCase());
    const aIsAll = a.dish.region === 'all';
    const bIsAll = b.dish.region === 'all';

    // Same tier → sort by score descending
    if (aIsRegion === bIsRegion && aIsAll === bIsAll) return b.score - a.score;

    // Region-matched dishes first (highest relevance)
    if (aIsRegion && !bIsRegion) return -1;
    if (!aIsRegion && bIsRegion) return 1;

    // `showGlobal = true` puts all-region dishes before other
    if (aIsAll && !bIsAll) return showGlobal ? -1 : 1;
    if (!aIsAll && bIsAll) return showGlobal ? 1 : -1;

    return b.score - a.score;
  });

  return finalScored;
}

const SLOT_CONTEXT: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

/** Extract region key from user region string */
import type { NormalizedRegion } from '../types/identity';

export function getRegionKey(region?: string): NormalizedRegion {
  // Bare 'India'/'INDIA' -> 'all' (unknown region); 'North India' -> 'north'.
  // `.replace(' india', '')` previously left bare 'India' untouched, collapsing
  // the key to 'india' and hiding every region-specific dish.
  const normalized = (region ?? '').toLowerCase().trim().replace(/india$/i, '').trim();
  return (normalized || 'all') as NormalizedRegion;
}


// ─── DishSearchModal compound comparator ─────────────────────────────────────

/** Health filter labels shared with the DishSearchModal chips. */
export const DISH_HEALTH_FILTERS = ['all', 'low-cal', 'high-protein', 'low-carb', 'balanced'] as const;
export type DishHealthFilter = (typeof DISH_HEALTH_FILTERS)[number];

/** Score how well a dish matches a health filter (0=none, 1=partial, 2=match). */
export function dishHealthMatchScore(d: Dish, filter: DishHealthFilter): number {
  if (filter === 'all') return 1;
  const cals = d.calories;
  const prot = d.protein;
  const nut = d.nutrition || [];
  const hasCals = cals !== undefined && cals !== null;
  const hasProt = prot !== undefined && prot !== null;
  switch (filter) {
    case 'low-cal':
      if (hasCals && cals <= 250) return 2;
      if (hasCals) return 0;
      return 1;
    case 'high-protein':
      if (hasProt && prot >= 15) return 2;
      if (nut.includes('protein')) return 1;
      return 0;
    case 'low-carb':
      if (hasCals && cals <= 350 && hasProt && prot >= 10) return 2;
      if (nut.includes('protein') && !nut.includes('carb')) return 1;
      return 0;
    case 'balanced':
      if (hasCals && cals >= 200 && cals <= 500 && hasProt && prot >= 8) return 2;
      if (nut.includes('protein') && nut.includes('carb')) return 1;
      return nut.length > 0 ? 1 : 0;
    default: return 1;
  }
}

/** Slot priority: a dish whose category matches the mealType leads. */
export function dishSlotPriority(d: Dish, mealType?: string): number {
  if (!mealType) return 0;
  const slot = mealType.toLowerCase();
  const cats = (d.category || []).map((c: string) => c.toLowerCase());
  if (cats.includes(slot)) return 2;
  if (slot === 'snacks' && cats.includes('snacks')) return 2;
  if (cats.includes('dinner') || cats.includes('lunch')) return 1;
  return 0;
}

/**
 * Deterministic compound comparator for the dish search modal:
 * (slotPriority desc) -> (healthMatch desc when a filter is active) ->
 * (compareRegion tiebreak) -> name. Ordering ONLY — it never filters, so
 * far-region dishes always stay in the list. `regionKey` should already be
 * normalized (see getRegionKey).
 */
export function dishSortComparator(params: {
  regionKey: string;
  mealType?: string;
  healthFilter?: DishHealthFilter;
}): (a: Dish, b: Dish) => number {
  const { regionKey, mealType, healthFilter } = params;
  const rc = compareRegion.bind(null, regionKey);
  const hf = healthFilter ?? 'all';
  const healthActive = hf !== 'all';
  return (a, b) => {
    const sp = dishSlotPriority(b, mealType) - dishSlotPriority(a, mealType);
    if (sp !== 0) return sp;
    if (healthActive) {
      const hm = dishHealthMatchScore(b, hf) - dishHealthMatchScore(a, hf);
      if (hm !== 0) return hm;
    }
    const r = rc(a.region, b.region);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  };
}

/** Get relevant variants for a dish filtered by meal slot */
export function getDishVariants(dish: Dish, slot: string, diet?: string) {
  const category = slot.toLowerCase();
  const isVegan = diet?.toLowerCase() === 'vegan';
  return dish.variants.filter(v => {
    if (!v.mealContext) return true;
    if (isVegan) return false;
    return v.mealContext.includes(category) || !v.mealContext;
  }).slice(0, 6);
}

// ─── Slot-balanced "Try these" sampler ───────────────────────────────────────

const SLOT_SCORE: Record<string, number> = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };
const SLOT_NAMES = ['breakfast', 'lunch', 'snacks', 'dinner'];

/** Primary slot score — lowest-scoring category wins, unknown categories = 4. */
export function dishSlotScore(d: Dish): number {
  return Math.min(...(d.category || []).map(c => SLOT_SCORE[c.toLowerCase()] ?? 4));
}

/**
 * Slot-balanced "Try these" sampler. Buckets dishes by primary slot, sorts each
 * bucket region-first then by name, and round-robins across the user's planned
 * slots (maxPerSlot each, capped at 8; top-up from the full pool). Region and
 * diet rules mirror the Dashboard fallback — ordering-only, never excludes.
 * `excludeIds` (dishes already added to the target day) are the ONLY excluded
 * dishes — anything else is never filtered out. Excluded ids are removed from
 * the pool before bucketing, so the round-robin + top-up backfill keeps the
 * count and slot balance.
 */
export function selectTryThese(
  dishes: Dish[],
  opts: { userDiet?: string; regionKey: string; plannedSlots?: string[]; maxPerSlot?: number; excludeIds?: string[] },
): Dish[] {
  const { userDiet, regionKey, plannedSlots, maxPerSlot = 5, excludeIds } = opts;
  const cap = 8;
  const ud = (userDiet || '').toLowerCase();

  const passesRegion = (d: Dish): boolean =>
    !d.region || d.region === 'all' || d.region === regionKey;
  const passesDiet = (d: Dish): boolean => {
    const dt = (d.diet || d.type || '').toLowerCase();
    if (!dt) return true;
    if (ud === 'veg') return dt === 'veg' || dt === 'vegan';
    if (ud === 'eggitarian') return dt === 'eggitarian' || dt === 'veg' || dt === 'vegan' || dt === 'egg';
    if (ud === 'non-veg') return true;
    return true;
  };

  // excludeIds = dishes already added to the strip's target day — the ONLY
  // exclusion. Region/diet stay ordering-AND-filter rules for everything else:
  // users are always free to add any dish, but a dish already added today
  // should not be suggested again (the reported bug). The sampler below
  // backfills from the remaining pool, so slot balance is preserved.
  const excludeSet = new Set(excludeIds ?? []);
  const pool = dishes.filter(d => !excludeSet.has(d.id) && passesRegion(d) && passesDiet(d));
  const byRegionThenName = (a: Dish, b: Dish) =>
    compareRegion(regionKey, a.region, b.region) || a.name.localeCompare(b.name);

  const slots = [...new Set(
    (plannedSlots ?? ['Breakfast', 'Lunch', 'Snacks', 'Dinner']).map(s => s.toLowerCase()),
  )].filter(s => SLOT_SCORE[s] !== undefined)
    .sort((a, b) => (SLOT_SCORE[a] ?? 9) - (SLOT_SCORE[b] ?? 9));

  const buckets: Record<string, Dish[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  const other: Dish[] = [];
  for (const d of pool) {
    const score = dishSlotScore(d);
    const slot = score <= 3 ? SLOT_NAMES[score] : undefined;
    if (slot) buckets[slot]!.push(d);
    else other.push(d);
  }
  for (const slot in buckets) buckets[slot]!.sort(byRegionThenName);
  other.sort(byRegionThenName);
  const fullPool = [...pool].sort(byRegionThenName);

  const selected: Dish[] = [];
  const seen = new Set<string>();
  const perSlot: Record<string, number> = {};
  let progressed = true;
  while (selected.length < cap && progressed) {
    progressed = false;
    for (const slot of slots) {
      if (selected.length >= cap) break;
      if ((perSlot[slot] ?? 0) >= maxPerSlot) continue;
      const dish = buckets[slot]!.find(d => !seen.has(d.id));
      if (!dish) continue;
      seen.add(dish.id);
      perSlot[slot] = (perSlot[slot] ?? 0) + 1;
      selected.push(dish);
      progressed = true;
    }
  }
  for (const d of fullPool) {
    if (selected.length >= cap) break;
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    selected.push(d);
  }
  return selected;
}

/** DIET_FILTER map exposed for modal compatibility */
export { DIET_FILTER };

/** Graph traversal for dish↔ingredient relationships — built lazily via ensureIndexes */
export { getDishGraph };

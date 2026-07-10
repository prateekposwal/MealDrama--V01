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

const DIET_FILTER: Record<string, string[]> = {
  veg: ['veg', 'vegan'],
  'non-veg': ['veg', 'non-veg', 'eggitarian'],
  eggitarian: ['veg', 'eggitarian', 'non-veg'],
  vegan: ['veg', 'vegan'],
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
          selected[idx(i + 1, j)] = selected[idx(i, j)];
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
}): ScoredDish[] {
  const {
    dishes, slot, diet, regionKey, query, showGlobal,
    healthPreset, healthSort, selectedDishIds, customDishes, allDishes,
  } = params;

  const q = query.toLowerCase();
  const category = slot.toLowerCase();
  const isVegan = diet?.toLowerCase() === 'vegan';
  const allowedTypes = DIET_FILTER[diet?.toLowerCase() || 'veg'] || ['veg'];
  const selectedSet = selectedDishIds ? new Set(selectedDishIds) : new Set<string>();
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
    }
    if (isVegan && d.type !== 'veg' && d.type !== 'vegan') return false;
    if (!isVegan && !allowedTypes.includes(d.type)) return false;
    if (q) {
      if (trieMatchIds?.has(d.id)) return true;
      const matchTags = d.tags.some(t => t.toLowerCase().includes(q));
      const matchVariant = d.variants.some(v => v.name.toLowerCase().includes(q));
      if (!matchTags && !matchVariant) {
        const dName = d.name.toLowerCase();
        if (!dName.includes(q)) return false;
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
    return { dish: d, score, healthScore: scoreDish(d) };
  });

  // Apply diversity optimization if we have existing selections
  const existingDishes = allDishes?.filter(d => selectedSet.has(d.id)) ?? [];
  let finalScored = scored;
  if (existingDishes.length > 0 && !healthSort && !q) {
    finalScored = optimizeTopNDiversity(scored, existingDishes, 10);
  } else if (healthSort) {
    const sortedByHealth = sortDishesByHealth(scored.map(s => s.dish), healthSort);
    const rankMap = new Map(sortedByHealth.map((d, i) => [d.id, i]));
    scored.sort((a, b) => (rankMap.get(a.dish.id) ?? 0) - (rankMap.get(b.dish.id) ?? 0));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const regionRegex = new RegExp('\\b' + regionKey + '\\b');
  const regional = finalScored.filter(s => regionRegex.test(s.dish.region.toLowerCase()));
  const global_ = finalScored.filter(s => !regionRegex.test(s.dish.region.toLowerCase()));
  return showGlobal ? [...global_, ...regional] : [...regional, ...global_];
}

const SLOT_CONTEXT: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

/** Extract region key from user region string */
export function getRegionKey(region?: string): string {
  return (region ?? '').toLowerCase().replace(' india', '');
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

/** DIET_FILTER map exposed for modal compatibility */
export { DIET_FILTER };

/** Graph traversal for dish↔ingredient relationships — built lazily via ensureIndexes */
export { getDishGraph };

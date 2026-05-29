import type { Dish } from '../constants/dishLibrary';
import { scoreDish } from './nutritionScore';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from './healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from './healthSortFilter';

const DIET_FILTER: Record<string, string[]> = {
  veg: ['veg', 'vegan'],
  'non-veg': ['veg', 'non-veg', 'eggitarian'],
  eggitarian: ['veg', 'eggitarian', 'non-veg'],
  vegan: ['veg', 'vegan'],
};

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
const diversityCache = new Map<string, ScoredDish[]>();
const MAX_DIVERSITY_CACHE = 100;

function optimizeTopNDiversity(scored: ScoredDish[], existingDishes: Dish[], topN: number): ScoredDish[] {
  if (topN <= 0 || scored.length === 0) return scored;

  // Cache key: scored dish IDs + scores + existing dish IDs + topN
  const scoredKey = scored.slice(0, 30).map(s => `${s.dish.id}:${s.score}:${s.healthScore}`).join(',');
  const existingKey = existingDishes.map(d => d.id).join(',');
  const cacheKey = `${scoredKey}::${existingKey}::${topN}`;

  const cached = diversityCache.get(cacheKey);
  if (cached) return cached;

  const limit = Math.min(scored.length, 30); // Cap for DP performance
  const candidates = scored.slice(0, limit);

  // dp[i][j] = max diversity score using j items from first i candidates
  // We track both relevance score and diversity bonus
  const dp: number[][] = [];
  const selected: number[][] = [];

  for (let i = 0; i <= limit; i++) {
    dp[i] = new Array(topN + 1).fill(-Infinity);
    selected[i] = new Array(topN + 1).fill(-1);
  }
  dp[0]![0] = 0;

  for (let i = 0; i < limit; i++) {
    const candidate = candidates[i]!;
    const relevanceScore = candidate.score + candidate.healthScore * 0.5;

    for (let j = 0; j <= topN; j++) {
      // Option 1: skip this candidate
      const currentVal = dp[i]![j];
      const nextVal = dp[i + 1]![j];
      if (currentVal !== undefined && (nextVal === undefined || currentVal > nextVal)) {
        dp[i + 1]![j] = currentVal;
        selected[i + 1]![j] = selected[i]![j] ?? -1;
      }

      // Option 2: include this candidate (if we have room)
      if (j < topN) {
        const existing: Dish[] = [];
        // Reconstruct which items were selected so far
        let prevIdx = selected[i]![j] ?? -1;
        let prevJ = j;
        for (let k = i - 1; k >= 0 && prevIdx >= 0; k--) {
          const selIdx = selected[k + 1]![prevJ];
          if (selIdx !== undefined && selIdx >= 0) {
            existing.push(candidates[selIdx]!.dish);
            prevIdx = selIdx;
          }
        }

        const divBonus = diversityBonus(candidate.dish, existing);
        const currentDpVal = dp[i]![j] ?? 0;
        const nextDpIdx = dp[i + 1]![j + 1];
        if (currentDpVal + relevanceScore + divBonus > (nextDpIdx ?? -Infinity)) {
          dp[i + 1]![j + 1] = currentDpVal + relevanceScore + divBonus;
          selected[i + 1]![j + 1] = i;
        }
      }
    }
  }

  // Reconstruct best selection
  const result: ScoredDish[] = [];
  let currJ = topN;
  for (let i = limit; i > 0 && currJ > 0; i--) {
    const selIdx = selected[i]![currJ];
    if (selIdx !== undefined && selIdx >= 0) {
      result.unshift(candidates[selIdx]!);
      currJ--;
    }
  }

  // Append remaining items that weren't selected
  const selectedIds = new Set(result.map(r => r.dish.id));
  const remaining = scored.filter(s => !selectedIds.has(s.dish.id));
  const finalResult = [...result, ...remaining];

  // Cache with LRU pruning
  if (diversityCache.size >= MAX_DIVERSITY_CACHE) {
    const firstKey = diversityCache.keys().next().value;
    if (firstKey) diversityCache.delete(firstKey);
  }
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

  const filtered = dishPool.filter(d => {
    if (selectedSet.has(d.id)) return false;
    const isCustom = d.tags?.includes('user_created');
    if (!isCustom && !d.category.some(c => c.includes(category))) {
      if (!q) return false;
    }
    if (isVegan && d.type !== 'veg' && d.type !== 'vegan') return false;
    if (!isVegan && !allowedTypes.includes(d.type)) return false;
    if (q) {
      const matchName = d.name.toLowerCase().includes(q);
      const matchTags = d.tags.some(t => t.toLowerCase().includes(q));
      const matchVariant = d.variants.some(v => v.name.toLowerCase().includes(q));
      if (!matchName && !matchTags && !matchVariant) return false;
    }
    return true;
  });

  const healthFiltered = healthPreset
    ? filterDishesByHealth(filtered, getFilterPreset(healthPreset))
    : filtered;

  const scored: ScoredDish[] = healthFiltered.map(d => {
    let score = 0;
    if (d.region.toLowerCase().includes(regionKey)) score += 10;
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
    const sortedIds = sortDishesByHealth(scored.map(s => s.dish), healthSort).map(d => d.id);
    scored.sort((a, b) => sortedIds.indexOf(a.dish.id) - sortedIds.indexOf(b.dish.id));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const regional = finalScored.filter(s => s.dish.region.toLowerCase().includes(regionKey));
  const global_ = finalScored.filter(s => !s.dish.region.toLowerCase().includes(regionKey));
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

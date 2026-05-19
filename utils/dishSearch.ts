import type { Dish } from '../constants/dishLibrary';
import { scoreDish } from './nutritionScore';
import { filterDishesByHealth, sortDishesByHealth, getFilterPreset } from './healthSortFilter';
import type { HealthSortKey, HealthFilterPreset } from './healthSortFilter';

const DIET_FILTER: Record<string, string[]> = {
  veg: ['veg'],
  'non-veg': ['veg', 'non-veg', 'eggitarian'],
  eggitarian: ['veg', 'eggitarian', 'non-veg'],
  vegan: ['veg', 'vegan'],
};

export interface ScoredDish {
  dish: Dish;
  score: number;
  healthScore: number;
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
}): ScoredDish[] {
  const {
    dishes, slot, diet, regionKey, query, showGlobal,
    healthPreset, healthSort, selectedDishIds, customDishes,
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

  if (healthSort) {
    const sortedIds = sortDishesByHealth(scored.map(s => s.dish), healthSort).map(d => d.id);
    scored.sort((a, b) => sortedIds.indexOf(a.dish.id) - sortedIds.indexOf(b.dish.id));
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const regional = scored.filter(s => s.dish.region.toLowerCase().includes(regionKey));
  const global_ = scored.filter(s => !s.dish.region.toLowerCase().includes(regionKey));
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

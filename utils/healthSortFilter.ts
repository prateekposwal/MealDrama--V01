import type { Dish } from '../meal/constants/dishLibrary';
import { DISH_HEALTH_MAP } from '../app/constants/healthGuidelines';
import { scoreDish } from './nutritionScore';

export type HealthSortKey = 'health-score' | 'protein' | 'fiber' | 'low-fat' | 'low-calorie';

export interface HealthFilter {
  minScore?: number;
  maxScore?: number;
  categories?: string[];
  tags?: string[];
  isWholeGrain?: boolean;
  isLeanProtein?: boolean;
  isHealthyFat?: boolean;
  isHighFiber?: boolean;
  isLowSodium?: boolean;
}

export function sortDishesByHealth(dishes: Dish[], key: HealthSortKey): Dish[] {
  const scored = dishes.map(d => ({ dish: d, score: getSortScore(d, key) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.dish);
}

function getSortScore(dish: Dish, key: HealthSortKey): number {
  const meta = DISH_HEALTH_MAP[dish.id];
  if (!meta) return key === 'health-score' ? 0 : -999;

  switch (key) {
    case 'health-score':
      return scoreDish(dish);
    case 'protein':
      return meta.tags.includes('high-protein') ? 10 : meta.tags.includes('moderate-protein') ? 5 : 0;
    case 'fiber':
      return meta.tags.includes('high-fiber') ? 10 : meta.tags.includes('fiber') ? 7 : 0;
    case 'low-fat':
      return meta.tags.includes('high-fat') ? -10 : meta.tags.includes('low-fat') ? 5 : 0;
    case 'low-calorie':
      return meta.tags.includes('low-calorie') ? 10 : 0;
  }
}

export function filterDishesByHealth(dishes: Dish[], filter: HealthFilter): Dish[] {
  return dishes.filter(d => {
    const meta = DISH_HEALTH_MAP[d.id];
    if (!meta && filter.minScore !== undefined) return false;

    if (filter.minScore !== undefined) {
      const score = meta ? scoreDish(d) : 0;
      if (score < filter.minScore) return false;
    }

    if (filter.maxScore !== undefined) {
      const score = meta ? scoreDish(d) : 0;
      if (score > filter.maxScore) return false;
    }

    if (filter.categories && meta) {
      const hasAll = filter.categories.every(c => meta.healthCategories.includes(c));
      if (!hasAll) return false;
    }

    if (filter.tags && meta) {
      const hasAll = filter.tags.every(t => meta.tags.includes(t));
      if (!hasAll) return false;
    }

    if (filter.isWholeGrain && meta && !meta.healthCategories.includes('whole-grain')) return false;
    if (filter.isLeanProtein && meta && !meta.healthCategories.includes('lean-protein')) return false;
    if (filter.isHealthyFat && meta && !meta.healthCategories.includes('healthy-fat')) return false;
    if (filter.isHighFiber && meta && !meta.tags.includes('high-fiber') && !meta.tags.includes('fiber')) return false;

    return true;
  });
}


export type HealthFilterPreset = 'healthy' | 'high-protein' | 'high-fiber' | 'low-fat' | 'low-calorie';

export function getFilterPreset(preset: HealthFilterPreset): HealthFilter {
  switch (preset) {
    case 'healthy':
      return { minScore: 5 };
    case 'high-protein':
      return { tags: ['high-protein'] };
    case 'high-fiber':
      return { tags: ['high-fiber', 'fiber'] };
    case 'low-fat':
      return { tags: ['low-fat'] };
    case 'low-calorie':
      return { tags: ['low-calorie'] };
  }
}

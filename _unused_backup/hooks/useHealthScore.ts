import { useMemo } from 'react';
import type { Dish } from '../constants/dishLibrary';
import { DISH_HEALTH_MAP } from '../constants/healthGuidelines';
import {
  scoreDish,
  scoreDishByCategories,
  scorePlateBalance,
  getHealthLabel,
  getHealthIcon,
  getScoreColor,
  getScoreEmoji,
  type MealsForScoring,
} from '../utils/nutritionScore';
import {
  suggestHealthierSwaps,
  suggestAdditionsForBalance,
  getDietaryProfileSuggestions,
  type SwapSuggestion,
  type HealthSuggestion,
} from '../utils/healthSuggestions';
import {
  filterDishesByHealth,
  sortDishesByHealth,
  getFilterPreset,
  type HealthFilter,
  type HealthSortKey,
  type HealthFilterPreset,
} from '../utils/healthSortFilter';

export function useHealthScore(dish: Dish | undefined) {
  return useMemo(() => {
    if (!dish) return { score: 0, label: 'Fair', color: '', bg: '', icon: '⚠️' };
    const score = scoreDish(dish);
    const meta = DISH_HEALTH_MAP[dish.id];
    return {
      score,
      ...getHealthLabel(score),
      icon: getHealthIcon(score),
      categories: meta?.healthCategories ?? [],
      tags: meta?.tags ?? [],
    };
  }, [dish?.id]);
}

export function usePlateBalance(meals: MealsForScoring[]) {
  return useMemo(() => scorePlateBalance(meals), [meals]);
}

export function useHealthSwaps(
  currentDishId: string | undefined,
  allDishes: Dish[],
  dietType: string,
) {
  return useMemo(() => {
    if (!currentDishId) return [];
    return suggestHealthierSwaps(currentDishId, allDishes, dietType);
  }, [currentDishId, allDishes, dietType]);
}

export function useBalanceSuggestions(
  dishes: { healthCategories: string[]; tags: string[] }[],
) {
  return useMemo(() => {
    const allCategories = dishes.flatMap(d => d.healthCategories);
    const allTags = dishes.flatMap(d => d.tags);
    return suggestAdditionsForBalance(allCategories, allTags, []);
  }, [dishes]);
}

export function useDietarySuggestions(dietType: string) {
  return useMemo(() => getDietaryProfileSuggestions(dietType), [dietType]);
}

export function useHealthFilter(dishes: Dish[]) {
  return {
    filterDishesByHealth: (filter: HealthFilter) => filterDishesByHealth(dishes, filter),
    sortDishesByHealth: (sort: HealthSortKey) => sortDishesByHealth(dishes, sort),
    getFilterPreset,
  };
}

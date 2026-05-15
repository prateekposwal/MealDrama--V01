import type { Dish } from '../constants/dishLibrary';
import { DISH_HEALTH_MAP } from '../constants/healthGuidelines';
import { scoreDish, scoreDishByCategories } from './nutritionScore';

export interface SwapSuggestion {
  currentDishId: string;
  currentName: string;
  suggestedDishId: string;
  suggestedName: string;
  reason: string;
  healthGain: number;
}

export interface HealthSuggestion {
  type: 'swap' | 'add' | 'remove' | 'modify';
  message: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  action?: SwapSuggestion;
}

export function suggestHealthierSwaps(
  currentDishId: string,
  allDishes: Dish[],
  dietType: string,
): SwapSuggestion[] {
  const meta = DISH_HEALTH_MAP[currentDishId];
  if (!meta) return [];
  const currentScore = scoreDishByCategories(meta.healthCategories, meta.tags);

  if (currentScore >= 5) return [];

  const problematicCategories = meta.healthCategories.filter(
    c => c === 'fried' || c === 'red-meat' || c === 'processed-meat' || c === 'dessert' || c === 'refined-grain'
  );

  if (problematicCategories.length === 0) return [];

  const suggestions: SwapSuggestion[] = [];

  for (const dish of allDishes) {
    if (dish.id === currentDishId) continue;
    if (dietType === 'veg' && dish.type === 'non-veg') continue;
    if (dietType === 'vegan' && (dish.type === 'non-veg' || dish.type === 'eggitarian')) continue;

    const candidateMeta = DISH_HEALTH_MAP[dish.id];
    if (!candidateMeta) continue;

    const score = scoreDishByCategories(candidateMeta.healthCategories, candidateMeta.tags);

    if (score > currentScore + 3) {
      const swapReasons: string[] = [];
      if (problematicCategories.includes('fried') && candidateMeta.healthCategories.includes('whole-grain')) {
        swapReasons.push('Switch from fried to whole grain');
      }
      if (problematicCategories.includes('red-meat') && candidateMeta.healthCategories.includes('lean-protein')) {
        swapReasons.push('Replace red meat with lean protein');
      }
      if (problematicCategories.includes('refined-grain') && candidateMeta.healthCategories.includes('whole-grain')) {
        swapReasons.push('Upgrade to whole grains');
      }
      if (problematicCategories.includes('dessert') && candidateMeta.healthCategories.includes('veg-fruit')) {
        swapReasons.push('Choose fruit over dessert');
      }

      if (swapReasons.length > 0) {
        suggestions.push({
          currentDishId,
          currentName: '',
          suggestedDishId: dish.id,
          suggestedName: dish.name,
          reason: swapReasons[0],
          healthGain: score - currentScore,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.healthGain - a.healthGain).slice(0, 3);
}

export function suggestAdditionsForBalance(
  currentCategories: string[],
  currentTags: string[],
  allDishes: Dish[],
): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];

  const hasVegFruit = currentCategories.some(c => c === 'veg-fruit' || c === 'legume');
  const hasWholeGrain = currentCategories.some(c => c === 'whole-grain');
  const hasProtein = currentCategories.some(
    c => c === 'lean-protein' || c === 'legume' || c === 'red-meat'
  );
  const hasHealthyFat = currentCategories.some(c => c === 'healthy-fat');

  if (!hasVegFruit) {
    suggestions.push({
      type: 'add',
      message: 'Add a vegetable side or salad',
      reason: 'Half your plate should be vegetables and fruits',
      priority: 'high',
    });
  }

  if (!hasWholeGrain) {
    suggestions.push({
      type: 'modify',
      message: 'Choose whole grain options (brown rice, whole wheat roti)',
      reason: 'Whole grains provide steady energy and more nutrients',
      priority: 'high',
    });
  }

  if (!hasProtein) {
    suggestions.push({
      type: 'add',
      message: 'Add a protein source (dal, paneer, chicken, legumes)',
      reason: 'Protein keeps you full and supports muscle health',
      priority: 'high',
    });
  }

  if (!hasHealthyFat) {
    suggestions.push({
      type: 'modify',
      message: 'Include healthy fats (ghee, nuts, seeds) in moderation',
      reason: 'Healthy fats support nutrient absorption and heart health',
      priority: 'medium',
    });
  }

  return suggestions;
}

export function getDietaryProfileSuggestions(dietType: string): HealthSuggestion[] {
  const suggestions: HealthSuggestion[] = [];

  if (dietType === 'veg' || dietType === 'vegan') {
    suggestions.push({
      type: 'modify',
      message: 'Ensure adequate vitamin B12 through fortified foods or supplements',
      reason: 'B12 is naturally found only in animal products',
      priority: 'high',
    });
    suggestions.push({
      type: 'modify',
      message: 'Pair iron-rich foods (spinach, legumes) with vitamin C (lemon, amla)',
      reason: 'Vitamin C boosts iron absorption from plant sources',
      priority: 'medium',
    });
  }

  if (dietType === 'non-veg') {
    suggestions.push({
      type: 'modify',
      message: 'Limit red meat to occasional servings, choose poultry and fish more often',
      reason: 'Red meat is linked to higher heart disease risk',
      priority: 'medium',
    });
  }

  return suggestions;
}

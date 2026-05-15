import type { Dish, DishVariant } from '../constants/dishLibrary';
import type { NutritionInfo, PlateBalanceScore, HealthCategory } from '../types/nutrition';
import { DISH_HEALTH_MAP } from '../constants/healthGuidelines';

const HEALTH_CATEGORY_SCORES: Record<string, number> = {
  'whole-grain': 10,
  'lean-protein': 8,
  legume: 8,
  'veg-fruit': 8,
  'healthy-fat': 6,
  'healthy-beverage': 5,
  dairy: 2,
  'starchy-veg': 0,
  'refined-grain': -5,
  'red-meat': -3,
  'unhealthy-fat': -8,
  'sugary-beverage': -8,
  fried: -6,
  dessert: -5,
  'processed-meat': -10,
};

export function scoreDish(dish: Dish): number {
  const meta = DISH_HEALTH_MAP[dish.id];
  if (!meta) return 0;

  let score = 0;
  for (const cat of meta.healthCategories) {
    score += HEALTH_CATEGORY_SCORES[cat] ?? 0;
  }

  const tagBonuses: Record<string, number> = {
    healthy: 3,
    'high-protein': 2,
    fiber: 2,
    'high-fiber': 2,
    'low-calorie': 2,
    'low-fat': 1,
    probiotic: 1,
    antioxidant: 1,
    vitamins: 1,
    iron: 1,
    calcium: 1,
    'vitamin-c': 1,
    'vitamin-d': 1,
  };

  const tagPenalties: Record<string, number> = {
    indulgent: -3,
    'high-sugar': -5,
    'high-fat': -3,
    'high-calorie': -3,
    'high-sodium': -3,
    'low-nutrient': -5,
    'low-fiber': -2,
  };

  for (const tag of meta.tags) {
    score += tagBonuses[tag] ?? 0;
    score += tagPenalties[tag] ?? 0;
  }

  return Math.max(-20, Math.min(20, score));
}

export function scoreDishByCategories(healthCategories: string[], tags: string[]): number {
  let score = 0;
  for (const cat of healthCategories) {
    score += HEALTH_CATEGORY_SCORES[cat] ?? 0;
  }

  const tagBonuses: Record<string, number> = {
    healthy: 3, 'high-protein': 2, fiber: 2, 'high-fiber': 2,
    'low-calorie': 2, 'low-fat': 1, probiotic: 1, antioxidant: 1,
    vitamins: 1, iron: 1, calcium: 1, 'vitamin-c': 1, 'vitamin-d': 1,
  };
  const tagPenalties: Record<string, number> = {
    indulgent: -3, 'high-sugar': -5, 'high-fat': -3, 'high-calorie': -3,
    'high-sodium': -3, 'low-nutrient': -5, 'low-fiber': -2,
  };

  for (const tag of tags) {
    score += tagBonuses[tag] ?? 0;
    score += tagPenalties[tag] ?? 0;
  }
  return Math.max(-20, Math.min(20, score));
}

export function getHealthLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 10) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  if (score >= 5) return { label: 'Good', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  if (score >= 0) return { label: 'Fair', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  if (score >= -5) return { label: 'Poor', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  return { label: 'Limit', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
}

export function getHealthIcon(score: number): string {
  if (score >= 10) return '🌟';
  if (score >= 5) return '✅';
  if (score >= 0) return '⚠️';
  if (score >= -5) return '⚠️';
  return '❌';
}

export interface MealsForScoring {
  name: string;
  healthCategories: string[];
  tags: string[];
  quantity?: number;
}

export function scorePlateBalance(meals: MealsForScoring[]): PlateBalanceScore {
  const allCategories = meals.flatMap(m => m.healthCategories);
  const allTags = meals.flatMap(m => m.tags);

  let vegFruitScore = 0;
  let wholeGrainScore = 0;
  let proteinScore = 0;
  let healthyFatScore = 0;
  let sugaryScore = 0;
  let redMeatScore = 0;

  for (const cat of allCategories) {
    if (cat === 'veg-fruit' || cat === 'legume') vegFruitScore += 2;
    if (cat === 'whole-grain') wholeGrainScore += 3;
    if (cat === 'lean-protein' || cat === 'legume') proteinScore += 2;
    if (cat === 'healthy-fat') healthyFatScore += 2;
    if (cat === 'sugary-beverage' || cat === 'dessert') sugaryScore -= 3;
    if (cat === 'red-meat') redMeatScore -= 2;
    if (cat === 'fried') { vegFruitScore -= 1; wholeGrainScore -= 1; }
    if (cat === 'refined-grain') wholeGrainScore -= 1;
  }

  vegFruitScore = Math.max(0, Math.min(10, vegFruitScore));
  wholeGrainScore = Math.max(0, Math.min(10, wholeGrainScore));
  proteinScore = Math.max(0, Math.min(10, proteinScore));
  healthyFatScore = Math.max(0, Math.min(10, healthyFatScore));
  sugaryScore = Math.max(-5, Math.min(0, sugaryScore));
  redMeatScore = Math.max(-5, Math.min(0, redMeatScore));

  const breakdown: string[] = [];
  const suggestions: string[] = [];

  if (vegFruitScore >= 6) breakdown.push('✅ Good vegetable & fruit variety');
  else if (vegFruitScore >= 3) breakdown.push('⚠️ Add more vegetables & fruits');
  else breakdown.push('❌ Half your plate should be vegetables & fruits');
  if (vegFruitScore < 6) suggestions.push('Add a vegetable side or salad to increase produce');

  if (wholeGrainScore >= 6) breakdown.push('✅ Good whole grain choice');
  else if (wholeGrainScore >= 3) breakdown.push('⚠️ Try swapping refined grains for whole grains');
  else breakdown.push('❌ Choose whole grains over refined grains');
  if (wholeGrainScore < 6) suggestions.push('Swap white rice for brown rice or choose whole wheat roti');

  if (proteinScore >= 6) breakdown.push('✅ Good protein source');
  else if (proteinScore >= 3) breakdown.push('⚠️ Include a healthy protein source');
  else breakdown.push('❌ Add lean protein — dal, paneer, chicken, fish, or legumes');
  if (proteinScore < 6) suggestions.push('Add a protein-rich dish like dal, paneer, or legumes');

  if (healthyFatScore < 4) suggestions.push('Use healthy oils like mustard, olive, or sunflower');
  if (sugaryScore < 0) {
    breakdown.push('⚠️ Consider reducing sugary items');
    suggestions.push('Replace sugary drinks with water, chaas, or unsweetened tea');
  }
  if (redMeatScore < 0) {
    breakdown.push('⚠️ Limit red meat consumption');
    suggestions.push('Swap red meat for poultry, fish, or plant proteins');
  }

  const total = vegFruitScore + wholeGrainScore + proteinScore + healthyFatScore + sugaryScore + redMeatScore;
  const max = 50;

  return {
    total: Math.max(0, total),
    max,
    categories: {
      vegFruit: vegFruitScore,
      wholeGrain: wholeGrainScore,
      protein: proteinScore,
      healthyFat: healthyFatScore,
      limitSugary: sugaryScore,
      limitRedMeat: redMeatScore,
    },
    breakdown,
    suggestions,
  };
}

export function getScoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return 'bg-green-500';
  if (pct >= 0.6) return 'bg-emerald-400';
  if (pct >= 0.4) return 'bg-amber-400';
  if (pct >= 0.2) return 'bg-orange-400';
  return 'bg-red-400';
}

export function getScoreEmoji(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return '🌟';
  if (pct >= 0.6) return '👍';
  if (pct >= 0.4) return '😐';
  if (pct >= 0.2) return '😬';
  return '😟';
}

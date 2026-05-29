import type { Dish, DishVariant } from '../constants/dishLibrary';
import type { NutritionInfo, PlateBalanceScore, HealthCategory } from '../types/nutrition';
import { DISH_HEALTH_MAP } from '../constants/healthGuidelines';
import { checkWithFallback } from './dpTimeout';
import { recordMetricAndReturn, recordMetric } from './dpTelemetry';
import { DpCache } from './dpCache';

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

const scoreCache = new Map<string, number>();

export function scoreDish(dish: Dish): number {
  const cached = scoreCache.get(dish.id);
  if (cached !== undefined) return cached;

  const meta = DISH_HEALTH_MAP[dish.id];
  if (!meta) { scoreCache.set(dish.id, 0); return 0; }

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

  score = Math.max(-20, Math.min(20, score));
  scoreCache.set(dish.id, score);
  return score;
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
  if (score >= 15) return { label: 'Light & Balanced', color: 'text-emerald-600', bg: 'bg-emerald-50/70 border-emerald-200' };
  if (score >= 8) return { label: 'Balanced', color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-200' };
  if (score >= -10) return { label: 'Filling', color: 'text-amber-600', bg: 'bg-amber-50/70 border-amber-200' };
  return { label: 'Rich Meal', color: 'text-orange-600', bg: 'bg-orange-50/70 border-orange-200' };
}

export function getHealthIcon(score: number): string {
  if (score >= 15) return '☀️';
  if (score >= 8) return '👍';
  if (score >= -10) return '🍚';
  return '🧈';
}

export interface MealsForScoring {
  name: string;
  healthCategories: string[];
  tags: string[];
  quantity?: number;
  mealType?: string;
  // Component roles for completeness scoring
  hasCarbBase?: boolean;     // roti, rice, bread
  hasProteinCore?: boolean;  // dal, paneer, meat, egg, legume-based curry
  hasFiberSide?: boolean;    // salad, raita, veg side, chutney
  hasHydration?: boolean;    // beverage, water, chaas, lassi
  hasDessert?: boolean;      // sweet, dessert, mithai
}

// ─── Completeness Layer ─────────────────────────────────────────────────────
// Maps dish metadata to 4 plate roles. Additive bonus, max +4.
// Cultural exception: one-pot meals skip role checks.

const ONE_POT_TAGS = ['one-pot', 'complete-meal', 'thali', 'combo'];
const ONE_POT_NAMES = ['khichdi', 'biryani', 'pulao', 'idli', 'dosa', 'thali', 'paratha', 'poha', 'upma', 'dal khichdi'];

function isCompleteMeal(meal: MealsForScoring): boolean {
  if (meal.tags?.some(t => ONE_POT_TAGS.includes(t))) return true;
  const nameLower = meal.name.toLowerCase();
  return ONE_POT_NAMES.some(n => nameLower.includes(n));
}

function isOnePotCombo(meals: MealsForScoring[]): boolean {
  return meals.some(isCompleteMeal);
}

export function tallyCompleteness(meals: MealsForScoring[]): { rolesFilled: number; maxRoles: number; missing: string[] } {
  const roles = { carb: false, protein: false, fiber: false, hydration: false, dessert: false };
  const missing: string[] = [];

  for (const meal of meals) {
    if (meal.hasCarbBase) roles.carb = true;
    if (meal.hasProteinCore) roles.protein = true;
    if (meal.hasFiberSide) roles.fiber = true;
    if (meal.hasHydration) roles.hydration = true;
    if (meal.hasDessert) roles.dessert = true;
  }

  if (!roles.carb) missing.push('carb base (roti/rice)');
  if (!roles.protein) missing.push('protein (dal/paneer/meat)');
  if (!roles.fiber) missing.push('fiber side (salad/veg)');
  if (!roles.hydration) missing.push('hydration (beverage)');
  if (!roles.dessert) missing.push('dessert (sweet)');

  const rolesFilled = [roles.carb, roles.protein, roles.fiber, roles.hydration, roles.dessert].filter(Boolean).length;
  return { rolesFilled, maxRoles: 5, missing };
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

  // ─── Completeness Bonus Layer ───────────────────────────────────────
  const isOnePot = meals.some(isCompleteMeal);
  const { rolesFilled, maxRoles, missing } = isOnePot
    ? { rolesFilled: 5, maxRoles: 5, missing: [] as string[] }
    : tallyCompleteness(meals);

  const completenessBonus = rolesFilled; // +1 per role, max +5
  const completenessPct = rolesFilled / maxRoles;

  if (isOnePot) {
    breakdown.push('✅ Complete one-pot meal — all roles covered');
  } else if (rolesFilled === maxRoles) {
    breakdown.push('✅ Perfectly balanced plate — all 5 roles present');
  } else if (rolesFilled >= 3) {
    breakdown.push(`⚠️ Plate ${rolesFilled}/${maxRoles} complete — add ${missing[0]}`);
    suggestions.push(`Complete your plate with: ${missing.join(', ')}`);
  } else if (meals.length > 0) {
    breakdown.push(`❌ Incomplete plate — only ${rolesFilled}/${maxRoles} roles`);
    suggestions.push(`Add missing components: ${missing.join(', ')}`);
  }

  // Scale completeness as 0-12.5 bonus added to total (5 roles × 2.5)
  const completenessScore = completenessBonus * 2.5; // max +12.5

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

  const baseTotal = vegFruitScore + wholeGrainScore + proteinScore + healthyFatScore + sugaryScore + redMeatScore;
  const total = Math.max(0, baseTotal + completenessScore);
  const max = 62.5; // 50 base + 12.5 completeness

  return {
    total,
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

// ─── DP-based plate balance optimization ────────────────────────────────────
// Uses knapsack DP to find optimal dish combination that maximizes plate balance
// score within calorie constraints.

export interface PlateOptimizationCandidate {
  id: string;
  name: string;
  healthCategories: string[];
  tags: string[];
  estimatedCalories: number;
  // Component roles for completeness scoring
  hasCarbBase?: boolean;
  hasProteinCore?: boolean;
  hasFiberSide?: boolean;
  hasHydration?: boolean;
  hasDessert?: boolean;
}

export interface PlateOptimizationResult {
  selected: PlateOptimizationCandidate[];
  totalScore: number;
  totalCalories: number;
  balanceScore: PlateBalanceScore;
  paretoFrontier?: ParetoSolution[];
}

export interface ParetoSolution {
  selected: PlateOptimizationCandidate[];
  nutritionScore: number;
  completenessRoles: number;
  totalCalories: number;
  itemCount: number;
}

const plateOptCache = new DpCache<PlateOptimizationResult>(100);

export function optimizePlateBalance(
  candidates: PlateOptimizationCandidate[],
  maxCalories: number,
  minItems: number,
  maxItems: number,
): PlateOptimizationResult {
  const startTime = performance.now();
  const key = `${candidates.map(c => c.id).join(',')}::${maxCalories}::${minItems}::${maxItems}`;
  const cached = plateOptCache.get(key);
  if (cached) {
    return recordMetricAndReturn('optimizePlateBalance', startTime, true, plateOptCache.size, false, candidates.length, cached, r => r.selected.length);
  }

  const result = checkWithFallback<PlateOptimizationResult>((isTimedOut) => {
    const n = candidates.length;
    if (n === 0) {
      return { selected: [], totalScore: 0, totalCalories: 0, balanceScore: scorePlateBalance([]) };
    }

    const maxN = Math.min(n, 20);
    const limited = candidates.slice(0, maxN);

    const dp: Map<number, { score: number; items: number[] }>[] = [];
    dp.push(new Map([[0, { score: 0, items: [] }]]));

    for (let i = 0; i < maxN; i++) {
      if (isTimedOut()) break;

      const item = limited[i]!;
      const prev = dp[i]!;
      const curr = new Map(prev);

      for (const [cal, state] of prev) {
        const newCal = cal + item.estimatedCalories;
        if (newCal > maxCalories) continue;

        const itemScore = scoreDishByCategories(item.healthCategories, item.tags);

        const existingItems = state.items.map(idx => limited[idx]!);
        const existingMeals: MealsForScoring[] = existingItems.map(e => ({
          name: e.name, healthCategories: e.healthCategories, tags: e.tags,
          hasCarbBase: e.hasCarbBase, hasProteinCore: e.hasProteinCore,
          hasFiberSide: e.hasFiberSide, hasHydration: e.hasHydration, hasDessert: e.hasDessert,
        }));
        const newMeal: MealsForScoring = {
          name: item.name, healthCategories: item.healthCategories, tags: item.tags,
          hasCarbBase: item.hasCarbBase, hasProteinCore: item.hasProteinCore,
          hasFiberSide: item.hasFiberSide, hasHydration: item.hasHydration, hasDessert: item.hasDessert,
        };
        const combined = [...existingMeals, newMeal];
        const completeness = isOnePotCombo(combined) ? 4 : tallyCompleteness(combined).rolesFilled;
        const completenessBonus = completeness * 0.5;

        const newScore = state.score + itemScore + completenessBonus;
        const existing = curr.get(newCal);
        if (!existing || newScore > existing.score) {
          curr.set(newCal, { score: newScore, items: [...state.items, i] });
        }
      }

      dp.push(curr);
    }

    const final = dp[dp.length - 1]!;

    // Build non-dominated Pareto frontier
    const allSolutions: Array<{ nutritionScore: number; completenessRoles: number; totalCalories: number; itemCount: number; items: number[] }> = [];

    for (const [cal, state] of final) {
      if (state.items.length < minItems || state.items.length > maxItems) continue;
      const items = state.items.map(i => limited[i]!);
      const meals: MealsForScoring[] = items.map(c => ({
        name: c.name, healthCategories: c.healthCategories, tags: c.tags,
        hasCarbBase: c.hasCarbBase, hasProteinCore: c.hasProteinCore,
        hasFiberSide: c.hasFiberSide, hasHydration: c.hasHydration, hasDessert: c.hasDessert,
      }));
      const roles = isOnePotCombo(meals) ? 5 : tallyCompleteness(meals).rolesFilled;
      allSolutions.push({
        nutritionScore: state.score,
        completenessRoles: roles,
        totalCalories: cal,
        itemCount: state.items.length,
        items: state.items,
      });
    }

    // Non-dominated sorting
    const pareto: typeof allSolutions = [];
    for (const sol of allSolutions) {
      let dominated = false;
      for (const other of allSolutions) {
        if (sol === other) continue;
        const otherBetter =
          (other.nutritionScore >= sol.nutritionScore ? 1 : 0) +
          (other.completenessRoles >= sol.completenessRoles ? 1 : 0) +
          (Math.abs(other.totalCalories - maxCalories) <= Math.abs(sol.totalCalories - maxCalories) ? 1 : 0);
        const solBetter =
          (sol.nutritionScore >= other.nutritionScore ? 1 : 0) +
          (sol.completenessRoles >= other.completenessRoles ? 1 : 0) +
          (Math.abs(sol.totalCalories - maxCalories) <= Math.abs(other.totalCalories - maxCalories) ? 1 : 0);
        if (otherBetter > solBetter) { dominated = true; break; }
      }
      if (!dominated) pareto.push(sol);
    }

    // Find best valid solution
    let bestScore = -Infinity;
    let bestItems: number[] = [];
    let bestCal = 0;

    for (const [cal, state] of final) {
      if (state.items.length < minItems || state.items.length > maxItems) continue;
      if (state.score > bestScore) {
        bestScore = state.score;
        bestItems = state.items;
        bestCal = cal;
      }
    }

    if (bestItems.length === 0 && limited.length > 0) {
      let bestSingleIdx = 0;
      let bestSingleScore = -Infinity;
      for (let i = 0; i < limited.length; i++) {
        const s = scoreDishByCategories(limited[i]!.healthCategories, limited[i]!.tags);
        if (s > bestSingleScore && limited[i]!.estimatedCalories <= maxCalories) {
          bestSingleScore = s; bestSingleIdx = i;
        }
      }
      bestItems = [bestSingleIdx];
      bestCal = limited[bestSingleIdx]!.estimatedCalories;
      bestScore = bestSingleScore;
    }

    const selected = bestItems.map(i => limited[i]!);
    const totalCalories = selected.reduce((sum, c) => sum + c.estimatedCalories, 0);
    const balanceScore = scorePlateBalance(selected.map(c => ({
      name: c.name, healthCategories: c.healthCategories, tags: c.tags,
      hasCarbBase: c.hasCarbBase, hasProteinCore: c.hasProteinCore,
      hasFiberSide: c.hasFiberSide, hasHydration: c.hasHydration, hasDessert: c.hasDessert,
    })));

    const paretoFrontier: ParetoSolution[] = pareto.slice(0, 8).map(p => ({
      selected: p.items.map(i => limited[i]!),
      nutritionScore: p.nutritionScore,
      completenessRoles: p.completenessRoles,
      totalCalories: p.totalCalories,
      itemCount: p.itemCount,
    }));

    return { selected, totalScore: bestScore, totalCalories, balanceScore, paretoFrontier };
  }, {
    selected: [],
    totalScore: 0,
    totalCalories: 0,
    balanceScore: scorePlateBalance([]),
  });

  plateOptCache.set(key, result);
  return recordMetricAndReturn('optimizePlateBalance', startTime, false, plateOptCache.size, false, candidates.length, result, r => r.selected.length);
}

export function clearPlateOptCache() {
  plateOptCache.clear();
}

export function getPlateOptCacheSize(): number {
  return plateOptCache.size;
}

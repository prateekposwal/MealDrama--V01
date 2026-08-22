import type { Dish } from '../meal/constants/dishLibrary';
import type { PlateBalanceScore, HealthCategory } from '../types/nutrition';
import { DISH_HEALTH_MAP } from '../app/constants/healthGuidelines';

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

const NUTRITION_SCORES: Record<string, number> = {
  protein: 3, fiber: 3, 'vitamin-c': 1, 'vitamin-d': 1,
  iron: 1, calcium: 1, probiotic: 1, antioxidant: 1,
  electrolytes: 0, cooling: 0,
  carb: -1, fat: -2,
};

function scoreFromNutrition(nutrition: string[]): number {
  let score = 0;
  for (const n of nutrition) {
    score += NUTRITION_SCORES[n.toLowerCase()] ?? 0;
  }
  return Math.max(-5, Math.min(10, score));
}

export function scoreDish(dish: Dish): number {
  const cached = scoreCache.get(dish.id);
  if (cached !== undefined) return cached;

  const meta = DISH_HEALTH_MAP[dish.id];
  if (!meta) {
    const fallback = dish.nutrition?.length
      ? scoreFromNutrition(dish.nutrition)
      : 0;
    scoreCache.set(dish.id, fallback);
    return fallback;
  }

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

export interface ComponentItem {
  name: string;
  healthCategories: string[];
  tags: string[];
  type: 'roti' | 'rice' | 'side' | 'beverage' | 'gravy' | 'dessert';
  qty?: number;
}

export interface MealsForScoring {
  name: string;
  healthCategories: string[];
  tags: string[];
  quantity?: number;
  mealType?: string;
  // Individual component items for carb/side/beverage quality scoring
  components?: ComponentItem[];
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
  wholeGrainScore = Math.max(1, Math.min(10, wholeGrainScore));
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

  if (wholeGrainScore >= 6) breakdown.push('✅ Good whole grain choice');
  else if (wholeGrainScore >= 3) breakdown.push('⚠️ Try swapping refined grains for whole grains');
  else breakdown.push('❌ Choose whole grains over refined grains');

  if (proteinScore >= 6) breakdown.push('✅ Good protein source');
  else if (proteinScore >= 3) breakdown.push('⚠️ Include a healthy protein source');
  else breakdown.push('❌ Add lean protein — dal, paneer, chicken, fish, or legumes');

  const dayOfWeek = new Date().getDay();
  const VEG_TIPS = [
    'Add a vegetable side or salad to increase produce',
    'Include seasonal fruits for natural sweetness and fiber',
    'Add a fresh salad or vegetable curry with your meal',
    'Include sprouts or a fruit bowl for extra nutrients',
    'Add green vegetables like palak, broccoli, or bhindi',
    'Start your meal with a salad or vegetable soup',
    'Add grated carrot, beetroot, or cucumber to your plate',
  ];
  const GRAIN_TIPS = [
    'Swap white rice for brown rice or choose whole wheat roti',
    'Replace refined flour with whole wheat or millet roti',
    'Choose brown rice, quinoa, or whole wheat bread',
    'Try multigrain roti or millet-based dishes',
    'Swap white bread for whole wheat or multi-grain',
    'Choose whole wheat pasta or brown rice over refined',
    'Add millets like jowar, bajra, or ragi to your meals',
  ];
  const PROTEIN_TIPS = [
    'Add a protein-rich dish like dal, paneer, or legumes',
    'Include soya chunks, tofu, or chicken for protein',
    'Add chole, rajma, or lentils for plant-based protein',
    'Include eggs, fish, or paneer for lean protein',
    'Add sprouts, chickpeas, or black beans to your meal',
    'Include moong dal, masoor dal, or mixed dal',
    'Try protein-rich dishes like tandoori paneer or grilled fish',
  ];
  const FAT_TIPS = [
    'Use healthy oils like mustard, olive, or sunflower',
    'Add dry fruits like almonds and walnuts for healthy fats',
    'Include seeds like flax, chia, or pumpkin seeds',
    'Add sprouts or avocado for a healthy fat boost',
    'Include yogurt, curd, or buttermilk for healthy fats',
    'Add nuts and seeds like walnuts and sunflower seeds',
    'Cook with ghee, coconut oil, or mustard oil',
  ];
  const DRINK_TIPS = [
    'Replace sugary drinks with water, chaas, or unsweetened tea',
    'Cut back on sugary drinks — try green tea or lemon water',
    'Swap sodas for coconut water or buttermilk',
    'Choose unsweetened beverages like herbal tea or chaas',
    'Replace packaged juices with fresh lime water or coconut water',
    'Cut sugary drinks — try jeera water or green tea instead',
    'Stay hydrated with water, chaas, or lemon water',
  ];

  if (vegFruitScore < 6) suggestions.push(VEG_TIPS[dayOfWeek % VEG_TIPS.length]);
  if (wholeGrainScore < 6) suggestions.push(GRAIN_TIPS[dayOfWeek % GRAIN_TIPS.length]);
  if (proteinScore < 6) suggestions.push(PROTEIN_TIPS[dayOfWeek % PROTEIN_TIPS.length]);
  if (healthyFatScore < 4) suggestions.push(FAT_TIPS[dayOfWeek % FAT_TIPS.length]);
  if (sugaryScore < 0) {
    breakdown.push('⚠️ Consider reducing sugary items');
    suggestions.push(DRINK_TIPS[dayOfWeek % DRINK_TIPS.length]);
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



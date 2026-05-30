export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  fat?: number;
  saturatedFat?: number;
  sugar?: number;
  sodium?: number;
  iron?: number;
  calcium?: number;
  vitaminC?: number;
  vitaminA?: number;
  vitaminD?: number;
  vitaminB12?: number;
  omega3?: number;
}

export type HealthCategory =
  | 'whole-grain'
  | 'refined-grain'
  | 'lean-protein'
  | 'red-meat'
  | 'processed-meat'
  | 'healthy-fat'
  | 'unhealthy-fat'
  | 'veg-fruit'
  | 'starchy-veg'
  | 'legume'
  | 'dairy'
  | 'sugary-beverage'
  | 'healthy-beverage'
  | 'fried'
  | 'dessert';

export type DietType = 'veg' | 'non-veg' | 'eggitarian' | 'vegan';

export type HealthGoal =
  | 'balanced'
  | 'high-protein'
  | 'low-carb'
  | 'high-fiber'
  | 'low-fat'
  | 'low-sodium'
  | 'low-sugar'
  | 'weight-loss'
  | 'heart-healthy'
  | 'diabetes-friendly';

export interface PlateBalanceScore {
  total: number;
  max: number;
  categories: {
    vegFruit: number;
    wholeGrain: number;
    protein: number;
    healthyFat: number;
    limitSugary: number;
    limitRedMeat: number;
  };
  breakdown: string[];
  suggestions: string[];
}

export interface HealthProfile {
  dietType: DietType;
  healthGoals: HealthGoal[];
  allergies: string[];
  dislikedItems: string[];
  calorieTarget?: number;
  proteinTarget?: number;
  fiberTarget?: number;
  sodiumLimit?: number;
  sugarLimit?: number;
}

export interface HealthMeta {
  primaryCategory: HealthCategory;
  secondaryCategories: HealthCategory[];
  nutrition: NutritionInfo;
  isWholeGrain: boolean;
  isLeanProtein: boolean;
  isHealthyFat: boolean;
  isHighFiber: boolean;
  isLowSodium: boolean;
  healthScore: number;
  tags: string[];
}

export function getCategoryLabel(cat: HealthCategory): string {
  const labels: Record<HealthCategory, string> = {
    'whole-grain': 'Whole Grain',
    'refined-grain': 'Refined Grain',
    'lean-protein': 'Lean Protein',
    'red-meat': 'Red Meat',
    'processed-meat': 'Processed Meat',
    'healthy-fat': 'Healthy Fat',
    'unhealthy-fat': 'Unhealthy Fat',
    'veg-fruit': 'Vegetable or Fruit',
    'starchy-veg': 'Starchy Vegetable',
    legume: 'Legume',
    dairy: 'Dairy',
    'sugary-beverage': 'Sugary Beverage',
    'healthy-beverage': 'Healthy Beverage',
    fried: 'Fried Food',
    dessert: 'Dessert',
  };
  return labels[cat];
}

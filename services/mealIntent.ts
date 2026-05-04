import { MealSearchIntent, MealSlot, DietType } from '../types';

/**
 * Intent Parser Service
 * Converts natural language queries into structured meal search intents
 */
export const parseMealQuery = (query: string): MealSearchIntent => {
  const lowerQ = query.toLowerCase();

  let intent: MealSearchIntent['intent'] = 'general';
  const constraints: MealSearchIntent['constraints'] = {};

  // Intent Recognition
  if (
    lowerQ.includes('protein') ||
    lowerQ.includes('fit') ||
    lowerQ.includes('muscle') ||
    lowerQ.includes('strong')
  ) {
    intent = 'protein';
    constraints.minProtein = 25;
  } else if (
    lowerQ.includes('light') ||
    lowerQ.includes('low cal') ||
    lowerQ.includes('diet')
  ) {
    intent = 'light';
    constraints.maxCalories = 500;
  } else if (
    lowerQ.includes('quick') ||
    lowerQ.includes('fast') ||
    lowerQ.includes('rapid') ||
    lowerQ.includes('5 min') ||
    lowerQ.includes('10 min') ||
    lowerQ.includes('15 min')
  ) {
    intent = 'quick';
    constraints.maxPrepTime = 15;
  } else if (
    lowerQ.includes('comfort') ||
    lowerQ.includes('cozy') ||
    lowerQ.includes('home') ||
    lowerQ.includes('homemade')
  ) {
    intent = 'comfort';
  } else if (
    lowerQ.includes('health') ||
    lowerQ.includes('healthy') ||
    lowerQ.includes('fit') ||
    lowerQ.includes('fresh')
  ) {
    intent = 'healthy';
  } else if (lowerQ.includes('+') || lowerQ.includes('with')) {
    intent = 'combo';
  } else if (lowerQ.includes('substitute') || lowerQ.includes('instead')) {
    intent = 'substitution';
  }

  // Meal Slot Detection
  if (lowerQ.includes('breakfast')) {
    constraints.slot = MealSlot.Breakfast;
  } else if (lowerQ.includes('lunch')) {
    constraints.slot = MealSlot.Lunch;
  } else if (lowerQ.includes('dinner')) {
    constraints.slot = MealSlot.Dinner;
  } else if (lowerQ.includes('snack')) {
    constraints.slot = MealSlot.Snacks;
  }

  // Extract Calorie Limit
  const calorieMatch = query.match(/under\s+(\d+)\s*cal|(\d+)\s*cal|max\s+(\d+)/i);
  if (calorieMatch) {
    const calories = parseInt(calorieMatch[1]! || calorieMatch[2]! || calorieMatch[3]!);
    constraints.maxCalories = calories;
  }

  // Extract Prep Time Limit
  const timeMatch = query.match(
    /(\d+)\s*min|quick|fast|rapid|instantly|immediately|30\s*seconds/i
  );
  if (timeMatch) {
    if (timeMatch[1]) {
      constraints.maxPrepTime = parseInt(timeMatch[1]);
    } else if (lowerQ.includes('30 seconds') || lowerQ.includes('instant')) {
      constraints.maxPrepTime = 1;
    } else if (lowerQ.includes('quick') || lowerQ.includes('fast')) {
      constraints.maxPrepTime = 15;
    }
  }

  // Diet Type Detection
  if (lowerQ.includes('veg') && !lowerQ.includes('non-veg')) {
    constraints.diet = DietType.Veg;
  } else if (lowerQ.includes('non-veg') || lowerQ.includes('meat')) {
    constraints.diet = DietType.NonVeg;
  } else if (lowerQ.includes('egg') || lowerQ.includes('eggitarian')) {
    constraints.diet = DietType.Eggitarian;
  } else if (lowerQ.includes('vegan')) {
    constraints.diet = DietType.Vegan;
  }

  // Extract Ingredients/Tags
  const ingredients: string[] = [];
  const ingredientKeywords: Record<string, string> = {
    dal: 'dal',
    'daal': 'dal',
    'lentil': 'dal',
    'roti': 'roti',
    'bread': 'bread',
    'rice': 'rice',
    'paneer': 'paneer',
    'cheese': 'paneer',
    'chicken': 'chicken',
    'fish': 'fish',
    'egg': 'egg',
    'beans': 'beans',
    'rajma': 'rajma',
    'chole': 'chole',
    'potato': 'potato',
    'aloo': 'potato',
    'spinach': 'spinach',
    'palak': 'spinach',
    'tomato': 'tomato',
    'tamatar': 'tomato',
    'mushroom': 'mushroom',
  };

  Object.entries(ingredientKeywords).forEach(([keyword, tag]) => {
    if (lowerQ.includes(keyword)) {
      ingredients.push(tag);
    }
  });

  if (ingredients.length > 0) {
    constraints.ingredients = ingredients;
  }

  // Must-Avoid Items
  const mustAvoid: string[] = [];
  const avoidKeywords: Record<string, string> = {
    'no nuts': 'nuts',
    'nut-free': 'nuts',
    'without nuts': 'nuts',
    'no dairy': 'dairy',
    'dairy-free': 'dairy',
    'without dairy': 'dairy',
    'no egg': 'egg',
    'egg-free': 'egg',
    'no meat': 'meat',
    'vegetarian': 'meat',
    'no fish': 'fish',
    'no oil': 'oil',
    'oil-free': 'oil',
  };

  Object.entries(avoidKeywords).forEach(([keyword, tag]) => {
    if (lowerQ.includes(keyword)) {
      mustAvoid.push(tag);
    }
  });

  if (mustAvoid.length > 0) {
    constraints.mustAvoid = mustAvoid;
  }

  return {
    rawQuery: query,
    intent,
    constraints,
    slot: constraints.slot,
  };
};

/**
 * Score meals based on parsed intent
 */
export const scoreMeal = (
  meal: any,
  intent: MealSearchIntent,
  userPreference?: any
): { score: number; reasons: string[] } => {
  let score = 10;
  const reasons: string[] = [];

  // Intent Matching
  if (intent.intent === 'protein') {
    const proteinSources = [
      'paneer',
      'chicken',
      'egg',
      'fish',
      'tofu',
      'dal',
      'rajma',
      'beans',
    ];
    const hasProtein = (meal.keyIngredients || []).some((ing: string) =>
      proteinSources.some(p => ing.toLowerCase().includes(p))
    );
    if (hasProtein) {
      score += 30;
      reasons.push('High protein source');
    }
  }

  if (intent.intent === 'light' && meal.calories) {
    if (meal.calories < (intent.constraints.maxCalories || 600)) {
      score += 25;
      reasons.push(`Light meal at ${meal.calories} cal`);
    }
  }

  if (intent.intent === 'quick' && meal.prepTime) {
    if (meal.prepTime <= (intent.constraints.maxPrepTime || 15)) {
      score += 35;
      reasons.push(`Ready in just ${meal.prepTime} mins`);
    }
  }

  if (intent.intent === 'comfort') {
    const comfortKeywords = [
      'home',
      'dal',
      'rice',
      'curry',
      'sabzi',
      'traditional',
      'classic',
    ];
    const isComfort = comfortKeywords.some(
      kw =>
        meal.name.toLowerCase().includes(kw) ||
        (meal.keyIngredients || []).some((ing: string) =>
          ing.toLowerCase().includes(kw)
        )
    );
    if (isComfort) {
      score += 20;
      reasons.push('Classic comfort food');
    }
  }

  if (intent.intent === 'healthy') {
    const healthyKeywords = ['salad', 'vegetable', 'fresh', 'light', 'steamed'];
    const isHealthy = healthyKeywords.some(
      kw =>
        meal.name.toLowerCase().includes(kw) ||
        (meal.keyIngredients || []).some((ing: string) =>
          ing.toLowerCase().includes(kw)
        )
    );
    if (isHealthy) {
      score += 20;
      reasons.push('Nutritious & fresh');
    }
  }

  // Slot Matching
  if (
    intent.constraints.slot &&
    meal.slots &&
    meal.slots.includes(intent.constraints.slot)
  ) {
    score += 20;
    reasons.push(`Perfect for ${intent.constraints.slot}`);
  }

  // Ingredient Matching
  if (intent.constraints.ingredients && intent.constraints.ingredients.length > 0) {
    const matches = (meal.keyIngredients || []).filter((ing: string) =>
      intent.constraints.ingredients?.some(
        i => ing.toLowerCase().includes(i) || i.includes(ing.toLowerCase())
      )
    ).length;
    score += matches * 15;
    if (matches > 0) {
      reasons.push(
        `Contains ${matches} ingredient${matches > 1 ? 's' : ''} you want`
      );
    }
  }

  // Constraint Violations (negative scoring)
  if (intent.constraints.maxCalories && meal.calories) {
    if (meal.calories > intent.constraints.maxCalories) {
      score -= 20;
      reasons.push(`⚠️ Exceeds calorie target (${meal.calories} cal)`);
    }
  }

  if (intent.constraints.maxPrepTime && meal.prepTime) {
    if (meal.prepTime > intent.constraints.maxPrepTime) {
      score -= 15;
      reasons.push(`⚠️ Takes ${meal.prepTime} mins (need faster)`);
    }
  }

  if (intent.constraints.mustAvoid && intent.constraints.mustAvoid.length > 0) {
    const hasAvoided = (meal.keyIngredients || []).some((ing: string) =>
      intent.constraints.mustAvoid?.some(avoid =>
        ing.toLowerCase().includes(avoid)
      )
    );
    if (hasAvoided) {
      score -= 50;
      reasons.push('⚠️ Contains item to avoid');
    }
  }

  // User Preference Matching
  if (userPreference?.region && meal.region === userPreference.region) {
    score += 10;
    reasons.push('Your preferred cuisine');
  }

  if (userPreference?.dietType && meal.diet === userPreference.dietType) {
    score += 15;
    reasons.push('Matches your diet');
  }

  return { score: Math.max(0, score), reasons: reasons.slice(0, 3) };
};

/**
 * Generate combo meal suggestions (e.g., "Dal + Roti combo")
 */
export const generateComboSuggestions = (
  meals: any[],
  intent: MealSearchIntent
): any[] => {
  if (intent.intent !== 'combo') {
    return meals;
  }

  const combos: any[] = [];

  // Example: Look for Dal + Roti combos
  const dals = meals.filter(m =>
    (m.keyIngredients || []).some((ing: string) =>
      ing.toLowerCase().includes('dal')
    )
  );
  const breads = meals.filter(
    m =>
      m.keyIngredients?.includes('Roti') ||
      m.keyIngredients?.includes('Bread')
  );

  dals.forEach(dal => {
    breads.forEach(bread => {
      combos.push({
        name: `${dal.name} + ${bread.name}`,
        id: `combo-${dal.id}-${bread.id}`,
        meals: [dal, bread],
        totalCalories: (dal.calories || 0) + (bread.calories || 0),
        totalPrepTime: Math.max(dal.prepTime || 0, bread.prepTime || 0),
        image: dal.image,
      });
    });
  });

  return combos;
};

// ============================================================================
// MEALGRAPH DECISION ENGINE - PRODUCTION ALGORITHM
// Household Food Operating System Core Scoring & Recommendation Engine
// ============================================================================

/**
 * MEALGRAPH OVERVIEW
 * 
 * The MealGraph is a sophisticated recommendation engine that scores dishes
 * for a household based on 7 weighted factors:
 * 
 * 1. Taste Alignment (40%) - Match with member taste profiles
 * 2. Health Goal Alignment (25%) - Nutrition & health constraints
 * 3. Persona Preference (15%) - Household persona & working professional needs
 * 4. Seasonality (10%) - Seasonal availability & cost optimization
 * 5. Repetition Avoidance (5%) - Variety tracking
 * 6. Cook Capacity (3%) - Cook availability & skill level
 * 7. Ingredient Availability (2%) - Current pantry inventory
 */

// ============================================================================
// FACTOR 1: TASTE ALIGNMENT SCORING
// ============================================================================

interface TasteProfile {
  spice_level: number; // 1-5
  oil_preference: 'light' | 'medium' | 'rich';
  sweet_tolerance: 'low' | 'medium' | 'high';
  food_behavior: 'comfort' | 'experimental' | 'mix';
  allergies: string[];
  intolerances: string[];
}

interface DishTasteAttributes {
  spice_level: number;
  oil_usage: 'light' | 'medium' | 'rich';
  sweet_elements: 'low' | 'medium' | 'high';
  cuisine_type: string;
  tags: string[]; // ["traditional", "modern", "fusion"]
}

/**
 * calculateTasteScore(profile: TasteProfile, dish: Dish): number
 * 
 * Calculates how well a dish matches the member's taste preferences.
 * Returns score between 0 and 1.
 * 
 * Algorithm:
 * 1. Base score: Compare spice level (primary factor)
 *    - If dish.spice == profile.spice: 1.0
 *    - If within ±1: 0.8
 *    - If within ±2: 0.6
 *    - If 3+ diff: 0.3
 * 
 * 2. Oil adjustment: -0.15 if major mismatch (light profile, rich dish)
 * 
 * 3. Sweet adjustment: -0.1 if mismatch
 * 
 * 4. Food behavior: Apply multiplier
 *    - comfort food + "comfort" tag: ×1.1
 *    - experimental + "modern" tag: ×1.1
 * 
 * 5. Safety check: If any allergen matched → score = 0
 */

function calculateTasteScore(
  profile: TasteProfile,
  dish: DishTasteAttributes,
  history_rating?: number
): number {
  let score = 0.5; // Base
  
  // Spice level matching (40% of taste weight)
  const spiceDiff = Math.abs(profile.spice_level - dish.spice_level);
  if (spiceDiff === 0) score += 0.3;
  else if (spiceDiff === 1) score += 0.24;
  else if (spiceDiff === 2) score += 0.12;
  else score += 0.02;
  
  // Oil adjustment (20% of taste weight)
  const oilWeights = { light: 1, medium: 0.7, rich: 0.3 };
  if (profile.oil_preference === dish.oil_usage) score += 0.15;
  else score += oilWeights[profile.oil_preference] * 0.1;
  
  // Sweet tolerance (15% of taste weight)
  if (profile.sweet_tolerance === 'low' && dish.sweet_elements === 'high') score -= 0.08;
  else if (profile.sweet_tolerance === 'high' && dish.sweet_elements === 'low') score -= 0.03;
  else score += 0.1;
  
  // Food behavior bonus (15% of taste weight)
  if (profile.food_behavior === 'comfort' && dish.tags.includes('traditional')) score += 0.1;
  if (profile.food_behavior === 'experimental' && dish.tags.includes('modern')) score += 0.08;
  if (profile.food_behavior === 'mix') score += 0.06;
  
  // History boost: Previous high rating increases score
  if (history_rating) score += (history_rating / 5) * 0.15;
  
  // Safety: Block allergenic dishes
  for (const allergen of profile.allergies) {
    if (dish.tags.includes(allergen)) return 0;
  }
  
  return Math.min(score, 1.0);
}

// ============================================================================
// FACTOR 2: HEALTH GOAL ALIGNMENT
// ============================================================================

interface HealthGoal {
  primary: 'weight_loss' | 'high_protein' | 'diabetic_management' | 'low_sodium' | 'general_wellness';
  medical_conditions: string[]; // ["diabetes", "hypertension"]
}

interface DishNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
}

/**
 * calculateHealthScore(goal: HealthGoal, nutrition: DishNutrition): number
 * 
 * Algorithm:
 * 1. Primary goal matching:
 *    - weight_loss: prefer <300 cal, high protein, high fiber
 *    - high_protein: prefer >15g protein per serving
 *    - diabetic: prefer low sugar, low glycemic index
 *    - low_sodium: prefer <500mg sodium
 * 
 * 2. Medical condition matching:
 *    - diabetes: avoid sugar >5g
 *    - hypertension: avoid sodium >600mg
 *    - kidney_disease: avoid protein >20g
 * 
 * 3. Score calculation with weighted penalties
 */

function calculateHealthScore(goal: HealthGoal, nutrition: DishNutrition): number {
  let score = 0.6;
  
  // Primary goal matching
  switch (goal.primary) {
    case 'weight_loss':
      if (nutrition.calories < 300) score += 0.25;
      else if (nutrition.calories < 400) score += 0.15;
      else if (nutrition.calories < 500) score += 0.05;
      else score -= 0.2;
      
      if (nutrition.protein > 12) score += 0.1;
      if (nutrition.fiber > 5) score += 0.05;
      break;
      
    case 'high_protein':
      if (nutrition.protein > 20) score += 0.3;
      else if (nutrition.protein > 15) score += 0.2;
      else if (nutrition.protein > 10) score += 0.1;
      else score -= 0.1;
      break;
      
    case 'diabetic_management':
      if (nutrition.sugar < 3) score += 0.2;
      if (nutrition.carbs < 40) score += 0.1;
      if (nutrition.fiber > 6) score += 0.15;
      else score -= 0.1;
      break;
      
    case 'low_sodium':
      if (nutrition.sodium < 300) score += 0.25;
      else if (nutrition.sodium < 500) score += 0.1;
      else if (nutrition.sodium < 700) score -= 0.05;
      else score -= 0.2;
      break;
  }
  
  // Medical condition penalties
  for (const condition of goal.medical_conditions) {
    switch (condition) {
      case 'diabetes':
        if (nutrition.sugar > 5) score -= 0.2;
        break;
      case 'hypertension':
        if (nutrition.sodium > 600) score -= 0.25;
        break;
      case 'kidney_disease':
        if (nutrition.protein > 20) score -= 0.15;
        break;
    }
  }
  
  return Math.max(0, Math.min(score, 1.0));
}

// ============================================================================
// FACTOR 3: PERSONA PREFERENCE SCORING
// ============================================================================

interface HouseholdPersona {
  personas: string[]; // ["working_professional", "homemaker", "student"]
  household_type: 'single' | 'couple' | 'family_with_kids' | 'senior_home';
  meal_preferences: {
    breakfast_style: 'light' | 'heavy' | 'eggs' | 'beverages';
    lunch_style: 'thali' | 'single_dish' | 'light';
    prefer_quick_meals: boolean;
  };
}

interface DishPersonaAttributes {
  ideal_for: string[]; // ["working_professional", "kids", "seniors"]
  complexity: 'simple' | 'moderate' | 'complex';
  prep_time: number; // minutes
  can_meal_prep: boolean;
}

/**
 * calculatePersonaScore(persona: HouseholdPersona, dish: DishPersonaAttributes): number
 * 
 * Algorithm:
 * 1. Persona match:
 *    - If dish.ideal_for includes household persona: +0.3
 *    - If multiple personas match: +0.1 per match
 * 
 * 2. Household type bonus:
 *    - single + quick_meal: +0.2
 *    - family_with_kids + can_meal_prep: +0.15
 *    - senior_home + simple: +0.2
 * 
 * 3. Time constraint adjustment:
 *    - If prefer_quick && prep_time < 20: +0.15
 *    - If prefer_quick && prep_time > 45: -0.2
 */

function calculatePersonaScore(
  persona: HouseholdPersona,
  dish: DishPersonaAttributes
): number {
  let score = 0.5;
  
  // Persona matching
  for (const p of persona.personas) {
    if (dish.ideal_for.includes(p)) score += 0.2;
  }
  
  // Household type bonus
  switch (persona.household_type) {
    case 'single':
      if (persona.meal_preferences.prefer_quick_meals && dish.prep_time < 20)
        score += 0.2;
      break;
    case 'family_with_kids':
      if (dish.ideal_for.includes('kids')) score += 0.15;
      break;
    case 'senior_home':
      if (dish.complexity === 'simple') score += 0.2;
      break;
  }
  
  // Time constraint
  if (persona.meal_preferences.prefer_quick_meals) {
    if (dish.prep_time < 20) score += 0.1;
    else if (dish.prep_time > 45) score -= 0.15;
  }
  
  return Math.max(0, Math.min(score, 1.0));
}

// ============================================================================
// FACTOR 4: SEASONALITY SCORING
// ============================================================================

interface SeasonalContext {
  current_season: 'spring' | 'summer' | 'monsoon' | 'winter';
  current_month: number;
  region: string;
}

interface DishSeasonalInfo {
  is_seasonal: boolean;
  optimal_seasons: string[];
  optimal_months: number[];
  typical_price_in_season: number;
  typical_price_off_season: number;
}

/**
 * calculateSeasonalityScore(context: SeasonalContext, dish: DishSeasonalInfo): number
 * 
 * Algorithm:
 * 1. Seasonal availability:
 *    - If in optimal season: +0.4
 *    - If in sub-optimal season: -0.15
 * 
 * 2. Cost optimization:
 *    - In season ≈ 30-50% cheaper
 *    - Prefer seasonal dishes when available
 * 
 * 3. Ingredient freshness bonus: +0.1
 */

function calculateSeasonalityScore(
  context: SeasonalContext,
  dish: DishSeasonalInfo
): number {
  let score = 0.5;
  
  if (!dish.is_seasonal) return score; // Non-seasonal gets base score
  
  // Check if in optimal season
  if (dish.optimal_months.includes(context.current_month)) {
    score += 0.4; // Strong bonus for in-season
  } else {
    // Check nearby months
    const monthDiff = Math.min(
      ...(dish.optimal_months.map(m => Math.abs(m - context.current_month)))
    );
    if (monthDiff <= 1) score += 0.2;
    else score -= 0.15; // Off-season penalty
  }
  
  // Freshness bonus for seasonal produce
  score += 0.1;
  
  return Math.max(0, Math.min(score, 1.0));
}

// ============================================================================
// FACTOR 5: REPETITION AVOIDANCE (Variety Tracking)
// ============================================================================

interface RepetitionHistory {
  days_since_last_served: number;
  times_served_last_30_days: number;
  times_served_last_90_days: number;
  average_rating_last_served: number;
}

/**
 * calculateRepetitionPenalty(history: RepetitionHistory, slot: string): number
 * 
 * Algorithm:
 * 1. Time-based decay:
 *    - Served today: -0.5
 *    - Served this week: -0.3 to -0.1
 *    - Served in 2 weeks: -0.05
 *    - Served 3+ weeks ago: 0 (no penalty)
 * 
 * 2. Frequency check:
 *    - Served 3+ times in 30 days: -0.2
 *    - Served 2 times in 30 days: -0.1
 *    - Served once: 0
 * 
 * 3. Same slot specialty:
 *    - Lunch dal served this week: -0.15
 */

function calculateRepetitionPenalty(
  history: RepetitionHistory,
  meal_slot: string
): number {
  let penalty = 0;
  
  // Time-based decay
  if (history.days_since_last_served === 0) {
    penalty -= 0.5; // Served today
  } else if (history.days_since_last_served <= 7) {
    penalty -= (0.3 - (history.days_since_last_served / 7) * 0.2);
  } else if (history.days_since_last_served <= 14) {
    penalty -= 0.05;
  }
  // 3+ weeks: no penalty
  
  // Frequency check (30-day window)
  if (history.times_served_last_30_days >= 3) {
    penalty -= 0.2;
  } else if (history.times_served_last_30_days === 2) {
    penalty -= 0.1;
  }
  
  return penalty;
}

// ============================================================================
// FACTOR 6: COOK CAPACITY SCORING
// ============================================================================

interface CookCapacity {
  available_today: boolean;
  max_dishes_today: number;
  current_dishes_count: number;
  specialization: string[];
  skill_match: number; // 0-1
  estimated_cook_time: number;
}

/**
 * calculateCookCapacityScore(capacity: CookCapacity): number
 * 
 * Algorithm:
 * 1. Availability check:
 *    - Cook unavailable today: -0.3
 *    - Cook at capacity: -0.2
 * 
 * 2. Specialization match:
 *    - Specializes in dish type: +0.15
 *    - Similar to specialization: +0.08
 * 
 * 3. Time feasibility:
 *    - Estimated time < available window: 0
 *    - Estimated time > available window: -0.1 to -0.3
 */

function calculateCookCapacityScore(capacity: CookCapacity): number {
  let score = 0.5;
  
  // Availability check
  if (!capacity.available_today) return 0; // Can't prepare
  
  // Capacity check
  if (capacity.current_dishes_count >= capacity.max_dishes_today) {
    score -= 0.2; // Limited but possible
  } else {
    const utilization = capacity.current_dishes_count / capacity.max_dishes_today;
    if (utilization > 0.8) score -= 0.1;
  }
  
  // Specialization
  score += capacity.skill_match * 0.15;
  
  return Math.max(0, Math.min(score, 1.0));
}

// ============================================================================
// FACTOR 7: INGREDIENT AVAILABILITY
// ============================================================================

interface IngredientAvailability {
  available_in_pantry: number; // percentage 0-100
  days_to_purchase: number;
  estimated_cost: number;
}

/**
 * calculateIngredientAvailabilityScore(availability: IngredientAvailability): number
 * 
 * Algorithm:
 * 1. Pantry availability:
 *    - All ingredients available: +0.1
 *    - 75%+ available: +0.05
 *    - <75% available: -0.05
 * 
 * 2. Purchase requirement:
 *    - Need to purchase but time available: 0
 *    - Emergency purchase needed: -0.1
 */

function calculateIngredientAvailabilityScore(
  availability: IngredientAvailability
): number {
  let score = 0.5;
  
  // Pantry availability
  if (availability.available_in_pantry === 100) {
    score += 0.1;
  } else if (availability.available_in_pantry >= 75) {
    score += 0.05;
  } else {
    score -= 0.05;
  }
  
  // Purchase feasibility
  if (availability.days_to_purchase > 0 && availability.days_to_purchase <= 2) {
    score += 0.05;
  } else if (availability.days_to_purchase === 0) {
    score -= 0.1; // Emergency purchase
  }
  
  return Math.max(0, Math.min(score, 1.0));
}

// ============================================================================
// FINAL MEALGRAPH SCORING ALGORITHM
// ============================================================================

interface MealGraphContext {
  household_id: string;
  for_date: Date;
  meal_slot: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
}

/**
 * calculateFinalMealScore(
 *   context: MealGraphContext,
 *   dish: DishWithAllAttributes,
 *   weights: ScoreWeights
 * ): number
 * 
 * FINAL FORMULA:
 * 
 * final_score = 
 *   (taste_score × 0.40) +
 *   (health_score × 0.25) +
 *   (persona_score × 0.15) +
 *   (seasonality_score × 0.10) +
 *   (max(0, 1 + repetition_penalty) × 0.05) +
 *   (cook_capacity_score × 0.03) +
 *   (ingredient_availability_score × 0.02)
 * 
 * Where:
 * - All component scores: 0.0 to 1.0
 * - Weights sum to: 1.0
 * - Final score range: 0.0 to 1.0
 * - Scores < 0.3: Not recommended
 * - Scores 0.3-0.6: Acceptable alternatives
 * - Scores 0.6-0.8: Good matches
 * - Scores 0.8+: Excellent matches
 */

function calculateFinalMealScore(
  taste_score: number,
  health_score: number,
  persona_score: number,
  seasonality_score: number,
  repetition_penalty: number,
  cook_capacity_score: number,
  ingredient_score: number
): number {
  const final = 
    (taste_score * 0.40) +
    (health_score * 0.25) +
    (persona_score * 0.15) +
    (seasonality_score * 0.10) +
    (Math.max(0, 1 + repetition_penalty) * 0.05) +
    (cook_capacity_score * 0.03) +
    (ingredient_score * 0.02);
  
  return Math.max(0, Math.min(final, 1.0));
}

// ============================================================================
// MEAL PLAN GENERATION: CONSTRAINT SOLVING
// ============================================================================

/**
 * MEAL PLAN GENERATION ALGORITHM
 * 
 * For a 7-day weekly plan:
 * 
 * INPUT:
 * - Household preferences and constraints
 * - 28 meals to schedule (4 slots × 7 days)
 * - 500+ potential dishes in library
 * - Cook schedule and capacity
 * - Pantry inventory
 * - Meal history (last 90 days)
 * 
 * OUTPUT:
 * - Optimized 7-day meal plan
 * - Confidence score (0-1)
 * - Alternative suggestions for each meal
 * - Shopping list required
 * - Execution timeline
 * 
 * ALGORITHM:
 * 
 * 1. PRE-FILTERING:
 *    a) Remove all dishes blocked by:
 *       - Allergies
 *       - Diet type (veg/non-veg)
 *       - Medical conditions
 *       - Too recent rejections
 *    
 *    b) Score remaining dishes for each slot
 *       - Use MealGraph for each candidate
 *       - Track scores in cache
 *    
 *    c) Sort by score descending
 * 
 * 2. DAILY SCHEDULING (for each day 1-7):
 *    
 *    For Breakfast:
 *    - Pick top dish from scored list (score > 0.6)
 *    - Add to plan
 *    - Mark used
 *    - Register in repetition tracker
 *    
 *    For Lunch (Thali Logic):
 *    - Pick dal: highest score in [selected_dals]
 *    - Pick sabzi: top complement to selected dal
 *    - Pick carb: based on preferences
 *    - Combine scores using: min(dal, sabzi, carb) × 0.95
 *    - Add salad, raita if configured
 *    
 *    For Snacks:
 *    - Pick quick option (< 20 min prep)
 *    - Rotate types: chai_biscuit, namkeen, fruit
 *    
 *    For Dinner:
 *    - If Monday-Saturday: full meal or light
 *    - If Sunday: special/weekend preparation
 *    - Consider cook off-day
 * 
 * 3. CONSTRAINT CHECKING:
 *    a) Repetition: No same dish within [X days]
 *    b) Cook capacity: Total meals/day respects cook limit
 *    c) Ingredients: Check pantry coverage
 *    d) Health goals: Maintain ratio (e.g., 40% high-protein)
 *    e) Variety: Mix of regions, styles
 * 
 * 4. OPTIMIZATION:
 *    a) If constraint violated:
 *       - Swap with next best option
 *       - Recursively replan
 *       - Flag as "adjusted"
 *    
 *    b) Minimize shopping cost:
 *       - Prefer dishes using already-purchased ingredients
 *       - Group similar ingredient requirements
 * 
 * 5. CONFIDENCE SCORING:
 *    - Average MealGraph scores across all 28 meals
 *    - Factor in constraint violations
 *    - Factor in historical plan success rate
 *    - Final: 0.85+ = excellent, 0.7+ = good, < 0.5 = weak
 * 
 * 6. ALTERNATIVES GENERATION:
 *    - For each meal, keep top 3-5 alternatives
 *    - Enable in-plan substitution
 *    - Allow cook/household to override
 */

// ============================================================================
// RECOMMENDATION RANKING
// ============================================================================

/**
 * generateRecommendations(
 *   household_id: string,
 *   for_date: Date,
 *   meal_slot: string,
 *   top_n: number = 5
 * ): RecommendationList
 * 
 * Returns top N dishes ranked by MealGraph score with explanations
 * 
 * RANKING LOGIC:
 * 1. Calculate final score for each eligible dish
 * 2. Sort descending by score
 * 3. Apply soft constraint: Don't show > 3 same regions in top 5
 * 4. Apply soft constraint: Max 2 non-veg in top 5
 * 5. For each recommendation, explain top 2-3 factors
 * 6. Include confidence level
 */

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
 * Example 1: Calculate score for Toor Dal Tadka & Bhindi for North Indian household
 * 
 * const taste_score = 0.92    // Matches spice level 4, traditional comfort food
 * const health_score = 0.78   // High protein goal, good protein content
 * const persona_score = 0.85  // Family persona, thali-style preference
 * const seasonality = 0.88    // Monsoon, bhindi in season, cheaper
 * const repetition = -0.08    // Served 8 days ago (penalty -0.08)
 * const cook_capacity = 0.90  // Cook specializes in north indian
 * const ingredients = 0.95    // All in pantry except dal (1 day to purchase)
 * 
 * final_score = (0.92×0.40) + (0.78×0.25) + (0.85×0.15) + (0.88×0.10) +
 *               (0.92×0.05) + (0.90×0.03) + (0.95×0.02)
 *             = 0.368 + 0.195 + 0.128 + 0.088 + 0.046 + 0.027 + 0.019
 *             = 0.871 (Excellent match)
 * 
 * Explanation:
 * - "Excellent match for your taste preferences (0.92 taste alignment)"
 * - "Aligns with high-protein goal (12g protein)"
 * - "Seasonal in monsoon (bhindi fresh & affordable)"
 * - "Cook specializes in north indian thali"
 * 
 * ---
 * 
 * Example 2: Meal Plan Generation
 * 
 * Plan Period: Jan 20-26, 2025
 * Generated For: Sharma Family (4 members)
 * Confidence: 0.91
 * 
 * Monday (Jan 20):
 *   - Breakfast: Paratha & Curd (0.85)
 *   - Lunch: Toor Dal Tadka + Bhindi Dry + Phulka (0.87)
 *   - Snacks: Chai & Biscuit (0.80)
 *   - Dinner: Chicken Biryani (0.89) [Friday meat tradition observed]
 *   
 * Tuesday (Jan 21):
 *   - Breakfast: Idli & Sambhar (0.79) [Regional variety]
 *   - Lunch: Moong Dal Light + Lauki Gravy + Bajra (0.84)
 *   - Snacks: Fruit (0.75)
 *   - Dinner: Khichdi (0.81) [Tuesday light preference]
 *   
 * ... and so on
 * 
 * Plan Statistics:
 * - Total proteins scheduled: 15 (high-protein goal: 40% coverage achieved)
 * - Seasonal meals: 18/28 (64%)
 * - Regional variety: 4/6 regions represented
 * - Estimated cook time: 285 minutes (average 40 min/day)
 * - Shopping needed: 12 items (estimated cost: ₹1,200)
 */

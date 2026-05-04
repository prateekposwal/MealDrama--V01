export enum DietType {
  Veg = 'Veg',
  NonVeg = 'Non-Veg',
  Eggitarian = 'Eggitarian',
  Vegan = 'Vegan'
}

export enum SpiceLevel {
  None = 'No Spice',
  Mild = 'Mild',
  Medium = 'Medium',
  High = 'Spicy'
}

export enum MealSlot {
  Breakfast = 'Breakfast',
  Lunch = 'Lunch',
  Dinner = 'Dinner',
  Snacks = 'Snacks'
}

// ===== NEW: User Preferences & Behavior Tracking =====

export interface UserPreference {
  userId: string;
  // Basic Context
  language?: 'en' | 'hi' | 'mr' | 'ta';
  dietType: DietType;
  allergies: string[];
  region?: 'North Indian' | 'South Indian' | 'Maharashtrian' | 'Gujarati' | 'Bengali' | 'Rajasthani' | 'Goan' | 'Kashmiri' | 'Kerala' | 'Punjabi' | 'Mughlai' | 'Indian Chinese';
  dailyRoutine?: ('office' | 'gym' | 'work-from-home' | 'late-night' | 'student' | 'retired')[];
  healthGoal?: 'weight-loss' | 'muscle-gain' | 'maintain' | 'energy';
  healthGoals?: ('weight-loss' | 'muscle-gain' | 'maintenance' | 'blood-sugar-control')[];
  budgetSensitivity?: 'low' | 'medium' | 'high';
  
  // Meal Behavior
  breakfastType?: 'light' | 'heavy' | 'skip';
  breakfastTime?: string; // HH:MM format
  lunchPreference?: 'home-style' | 'quick' | 'high-protein' | 'light';
  lunchTime?: string;
  dinnerTiming?: 'early' | 'late' | 'flexible' | 'normal';
  dinnerTime?: string;
  snackFrequency?: 'low' | 'medium' | 'high';
  
  // Food Preferences
  breadPreference?: ('roti' | 'rice' | 'bread' | 'naan' | 'paratha')[];
  dalTypes?: string[]; // moong, chana, rajma, etc.
  proteins?: ('eggs' | 'paneer' | 'chicken' | 'fish' | 'mutton' | 'tofu')[];
  beverages?: string[]; // tea, coffee, juices, milks
  favoriteDishs?: string[];
  dislikedDishes?: string[];
  pantryStaples?: string[]; // Basic pantry items like rice, dal, oil, salt, spices
  
  // Seasonal & Behavioral
  seasonalPreference?: 'adapt' | 'strict';
  repetitionTolerance?: number; // 0-7 (days before suggesting same meal)
  spiceLevel?: 'none' | 'mild' | 'medium' | 'high';
  spiceTolerance?: SpiceLevel;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MealBehaviorLog {
  id: string;
  userId: string;
  mealId: string;
  mealSlot: MealSlot;
  date: string; // YYYY-MM-DD
  consumed: boolean;
  rating?: number; // 0-5
  feedback?: string;
  isRepeat?: boolean;
  preparedAt?: Date;
  createdAt: Date;
}

// ===== NEW: MealGraph - Recommendation Engine =====

export interface MealNode {
  id: string;
  name: string;
  nativeName?: string;
  prepTime: number; // minutes
  calories: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  diet: DietType;
  spice: SpiceLevel;
  ingredients: Ingredient[];
  sides?: string[]; // roti, rice, etc.
  beverage?: string;
  dessert?: string;
  season?: string[]; // spring, summer, monsoon, winter
  region?: string;
  healthScore: number; // 0-100
  cost: number; // relative cost in currency
  image?: string;
  tags: string[]; // high-protein, quick, comfort-food, etc.
}

export interface MealGraph {
  userId: string;
  nodes: MealNode[];
  edges: MealEdge[]; // Connections: what goes well together
  lastUpdated: Date;
}

export interface MealEdge {
  fromMealId: string;
  toMealId: string;
  compatibility: number; // 0-1 score
  reason: string; // 'similar_prep_time', 'complements_proteins', etc.
}

export interface MealRecommendation {
  mealId: string;
  slot: MealSlot;
  score: number; // 0-100
  reasons: string[]; // ["High protein", "User rated 4.5 before", "In season", etc.]
  variants: MealVariant[];
  alternatives: string[]; // Other meal IDs if this can't be made
}

export interface MealVariant {
  id: string;
  name: string;
  changes: string[]; // ["Change roti to rice", "Add egg", etc.]
  adjustedCalories?: number;
}

// ===== Meal Variants & Customization =====
export interface BreadVariant {
  id: 'plain-roti' | 'multigrain-roti' | 'butter-roti' | 'naan' | 'paratha' | 'rice';
  name: string;
  caloriesDelta: number; // relative to base
}

export interface ProteinVariant {
  id: 'paneer' | 'tofu' | 'eggs' | 'chicken' | 'fish' | 'moong-dal' | 'chana-dal' | 'rajma';
  name: string;
  proteinGrams: number;
  caloriesDelta: number;
  available?: boolean; // based on pantry
}

export interface SeasonalFood {
  name: string;
  season: 'spring' | 'summer' | 'monsoon' | 'winter' | 'year-round';
  region: string;
  healthBenefit: string;
  dishes: string[]; // Meals this ingredient is used in
}

// ===== Intent-Based Search =====
export interface MealSearchIntent {
  rawQuery: string;
  intent: 'protein' | 'light' | 'quick' | 'comfort' | 'healthy' | 'combo' | 'substitution' | 'general';
  constraints: {
    maxPrepTime?: number;
    maxCalories?: number;
    minProtein?: number;
    diet?: DietType;
    ingredients?: string[];
    mustAvoid?: string[];
    slot?: MealSlot;
  };
  slot?: MealSlot;
}

// ===== Notifications =====
export interface MealNotification {
  id: string;
  userId: string;
  type: 'timing' | 'running-late' | 'substitution' | 'out-of-stock' | 'suggestion';
  title: string;
  message: string;
  slot: MealSlot;
  actionItems?: {
    label: string;
    action: 'switch-meal' | 'confirm' | 'dismiss';
  }[];
  createdAt: Date;
  read: boolean;
}

// ===== Progressive Onboarding =====
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'single-select' | 'multi-select' | 'time-input' | 'text-input' | 'confirmation' | 'info-screen' | 'welcome';
  options?: Array<{ id: string; label: string; icon?: string; desc?: string }>;
  required: boolean;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  preferences: Partial<UserPreference>;
  startedAt: Date;
  completedAt?: Date;
}

export interface MealSearchQuery {
  query: string;
  slot?: MealSlot;
  maxPrepTime?: number;
  maxCalories?: number;
  diet?: DietType;
  tags?: string[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  allergies?: string[];
  role?: 'admin' | 'cook' | 'member';
}

export interface Ingredient {
  name: string;
  quantity: string;
  category: 'Vegetables' | 'Dairy' | 'Grains' | 'Spices' | 'Protein' | 'Other';
  inStock: boolean;
  substitute?: string;
  image?: string;
}

export interface MemberAssignment {
  userId: string;
  dishName?: string; // Specific dish if different from main meal
  isOverride?: boolean;
  isFasting?: boolean;
  notes?: string;
}

export interface Side {
  name: string;
  type: 'Bread' | 'Rice' | 'Other';
}

export interface Meal {
  id: string;
  name: string;
  nativeName?: string; // e.g., Hindi name
  slot: MealSlot;
  time: string; // Display time e.g., "8:00 AM"
  prepTime: string; // Start cooking time e.g., "7:30 AM"
  members: User[]; // Legacy support
  memberAssignments?: MemberAssignment[]; // New: support for different meals per member
  diet: DietType;
  spice: SpiceLevel;
  notes?: string;
  image?: string;
  ingredients: Ingredient[];
  sides?: Side[]; // e.g., Roti, Naan
  beverage?: string; // e.g., Lassi, Chaas
  dessert?: string; // e.g., Gulab Jamun, Halwa
  isOverride?: boolean; // If true, this is a State A ad-hoc change
  status: 'pending' | 'cooking' | 'done' | 'cancelled';
  rating?: number; // 0-5 stars
  calories?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface DayPlan {
  date: string; // ISO string YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  meals: Meal[];
}

export interface InventoryItem extends Ingredient {
  usedIn: string[]; // Meal IDs
}
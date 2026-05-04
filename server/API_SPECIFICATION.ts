// ============================================================================
// MEALDRAMA REST API SPECIFICATION
// Production-Ready Endpoints for Household Food Operating System
// ============================================================================

// BASE URL: https://api.mealdrama.com/v1

// ============================================================================
// PHASE 1: HOUSEHOLD ONBOARDING
// ============================================================================

/**
 * @endpoint POST /api/v1/households/register
 * @description Create household and initialize onboarding
 * @auth Required
 * @request {
 *   "household_name": "Sharma Family",
 *   "location_region": "north_india",
 *   "household_size": 4
 * }
 * @response {
 *   "household_id": "uuid",
 *   "status": "onboarding_started",
 *   "next_step": "member_setup",
 *   "onboarding_progress": 1
 * }
 * @errors [
 *   { "code": 400, "message": "Invalid region" },
 *   { "code": 409, "message": "Household already exists" }
 * ]
 */

/**
 * @endpoint POST /api/v1/households/{householdId}/members
 * @description Add household members with personas
 * @auth Required
 * @request {
 *   "members": [
 *     {
 *       "name": "Raj Sharma",
 *       "role": "owner",
 *       "persona": "working_professional",
 *       "age_group": "adult",
 *       "diet_type": "non_veg"
 *     },
 *     {
 *       "name": "Priya Sharma",
 *       "role": "member",
 *       "persona": "homemaker",
 *       "age_group": "adult",
 *       "diet_type": "veg"
 *     }
 *   ]
 * }
 * @response {
 *   "household_id": "uuid",
 *   "members_added": 2,
 *   "next_step": "health_goals",
 *   "onboarding_progress": 2
 * }
 */

/**
 * @endpoint POST /api/v1/household-members/{memberId}/health-profile
 * @description Set health goals and dietary restrictions
 * @auth Required
 * @request {
 *   "health_goal": "high_protein",
 *   "allergies": ["peanut", "seafood"],
 *   "intolerances": ["lactose"],
 *   "medical_conditions": ["diabetes"],
 *   "spice_level": 4,
 *   "oil_preference": "medium",
 *   "sweet_tolerance": "low",
 *   "food_behavior": "comfort"
 * }
 * @response {
 *   "member_id": "uuid",
 *   "profile_updated": true,
 *   "next_step": "meal_slots_config"
 * }
 */

/**
 * @endpoint POST /api/v1/households/{householdId}/meal-slot-config
 * @description Configure breakfast, lunch, snacks, dinner slots
 * @auth Required
 * @request {
 *   "breakfast": {
 *     "enabled": true,
 *     "type": "light",
 *     "prep_time_limit": 30
 *   },
 *   "lunch": {
 *     "enabled": true,
 *     "style": "thali",
 *     "dal_style": "tadka",
 *     "sabzi_style": "gravy",
 *     "add_salad": true,
 *     "add_raita": true
 *   },
 *   "snacks": {
 *     "enabled": true,
 *     "type": "chai_biscuit"
 *   },
 *   "dinner": {
 *     "enabled": true,
 *     "style": "full_thali",
 *     "non_veg_days": ["friday", "sunday"]
 *   }
 * }
 * @response {
 *   "household_id": "uuid",
 *   "configuration_saved": true,
 *   "next_step": "cook_assignment",
 *   "onboarding_progress": 3
 * }
 */

/**
 * @endpoint POST /api/v1/households/{householdId}/cook/add
 * @description Add cook to household
 * @auth Required
 * @request {
 *   "name": "Ram",
 *   "phone": "+91-9876543210",
 *   "cuisine_specialization": ["north_indian", "punjabi"],
 *   "years_experience": 10,
 *   "cooking_speed": "fast",
 *   "max_dishes_per_day": 5,
 *   "schedule": {
 *     "monday": { "start": "08:00", "end": "14:00" },
 *     "tuesday": { "start": "08:00", "end": "14:00" },
 *     "wednesday": { "off_day": true },
 *     ...
 *   }
 * }
 * @response {
 *   "cook_id": "uuid",
 *   "household_id": "uuid",
 *   "assigned": true,
 *   "onboarding_progress": 4
 * }
 */

/**
 * @endpoint GET /api/v1/households/{householdId}/onboarding-status
 * @description Check onboarding completion status
 * @auth Required
 * @response {
 *   "household_id": "uuid",
 *   "onboarding_complete": true,
 *   "progress": 100,
 *   "completed_steps": [
 *     "household_created",
 *     "members_added",
 *     "health_profiles_set",
 *     "meal_slots_configured",
 *     "cook_assigned"
 *   ],
 *   "ready_for_planning": true
 * }
 */

// ============================================================================
// PHASE 2: MEAL SLOT CONFIGURATION & VARIANT SELECTION
// ============================================================================

/**
 * @endpoint GET /api/v1/dal/variants
 * @description Get all dal variants for selection
 * @query {
 *   "style": "tadka", // optional filter
 *   "region": "north_india" // optional
 * }
 * @response {
 *   "dals": [
 *     {
 *       "dal_type": "toor",
 *       "style": "tadka",
 *       "prep_time": 5,
 *       "cook_time": 20,
 *       "protein_grams": 8,
 *       "calories": 120,
 *       "recipe": "...",
 *       "typical_ingredients": ["dal", "onion", "turmeric"]
 *     },
 *     ...
 *   ],
 *   "total": 24
 * }
 */

/**
 * @endpoint GET /api/v1/sabzi/variants
 * @description Get sabzi (vegetable) variants by season/region
 * @query {
 *   "style": "gravy",
 *   "region": "north_india",
 *   "season": "monsoon"
 * }
 * @response {
 *   "sabzi_options": [
 *     {
 *       "sabzi_type": "bhindi",
 *       "style": "dry",
 *       "prep_time": 5,
 *       "cook_time": 15,
 *       "calories": 45,
 *       "recipe": "..."
 *     },
 *     ...
 *   ],
 *   "seasonal_availability": {
 *     "monsoon": ["bhindi", "okra", "ridge_gourd"],
 *     "summer": ["tomato", "cucumber", "bottle_gourd"]
 *   }
 * }
 */

/**
 * @endpoint GET /api/v1/carbs/variants
 * @description Get carb options (rotis, rice) by region
 * @query {
 *   "region": "north_india"
 * }
 * @response {
 *   "carbs": [
 *     {
 *       "carb_type": "phulka",
 *       "prep_time": 3,
 *       "cook_time": 8,
 *       "calories": 80,
 *       "carbs_grams": 15
 *     },
 *     {
 *       "carb_type": "paratha",
 *       "prep_time": 10,
 *       "cook_time": 10,
 *       "calories": 150,
 *       "carbs_grams": 25
 *     },
 *     ...
 *   ]
 * }
 */

/**
 * @endpoint POST /api/v1/households/{householdId}/slot-preferences
 * @description Save lunch component preferences (dal, sabzi, carb)
 * @auth Required
 * @request {
 *   "lunch_dal_options": ["toor_tadka", "moong_light"],
 *   "lunch_sabzi_options": ["bhindi_dry", "gobi_gravy", "aloo_stir_fry"],
 *   "lunch_carb_options": ["phulka", "bajra"],
 *   "exclude_combinations": [
 *     { "dal": "toor_tadka", "sabzi": "bhindi_dry" }
 *   ]
 * }
 * @response {
 *   "household_id": "uuid",
 *   "preferences_saved": true,
 *   "generated_combinations": 24
 * }
 */

// ============================================================================
// PHASE 3: SEARCH & DISCOVERY
// ============================================================================

/**
 * @endpoint GET /api/v1/meals/search
 * @description Search meals with advanced intent extraction
 * @query {
 *   "query": "quick dal with paratha",
 *   "household_id": "uuid",
 *   "meal_slot": "lunch",
 *   "filters": {
 *     "max_prep_time": 45,
 *     "health_goal": "high_protein",
 *     "season": "monsoon",
 *     "calories_range": [100, 400]
 *   }
 * }
 * @response {
 *   "search_intent": {
 *     "meal_type": "dal_based",
 *     "time_constraint": "quick",
 *     "carb_preference": "paratha",
 *     "health_constraint": "high_protein"
 *   },
 *   "results": [
 *     {
 *       "dish_id": "uuid",
 *       "name": "Moong Dal Light with Bajra Paratha",
 *       "confidence_score": 0.95,
 *       "matches": ["high_protein", "quick", "seasonal"],
 *       "prep_time": 25,
 *       "calories": 280,
 *       "ingredients": ["dal", "paratha", "salad"],
 *       "rating": 4.5
 *     },
 *     ...
 *   ],
 *   "total_results": 12,
 *   "search_quality": "high"
 * }
 */

/**
 * @endpoint GET /api/v1/meals/recommendations
 * @description Get MealGraph-scored recommendations
 * @query {
 *   "household_id": "uuid",
 *   "for_date": "2025-01-15",
 *   "meal_slot": "lunch",
 *   "top_n": 5
 * }
 * @response {
 *   "recommendations": [
 *     {
 *       "dish_id": "uuid",
 *       "rank": 1,
 *       "score": 0.89,
 *       "scoring_breakdown": {
 *         "taste_alignment": 0.95,
 *         "health_goal_match": 0.85,
 *         "persona_preference": 0.88,
 *         "recency_penalty": -0.05,
 *         "seasonal_bonus": 0.05
 *       },
 *       "last_served": "2025-01-05",
 *       "days_since_served": 10,
 *       "times_served_month": 2,
 *       "family_rating": 4.2
 *     },
 *     ...
 *   ],
 *   "generation_timestamp": "2025-01-14T22:00:00Z",
 *   "based_on_factors": [
 *     "taste_profile",
 *     "health_goals",
 *     "persona",
 *     "seasonality",
 *     "repetition_avoidance"
 *   ]
 * }
 */

/**
 * @endpoint GET /api/v1/meals/{dishId}/details
 * @description Get complete dish details with variants
 * @auth Required
 * @response {
 *   "dish_id": "uuid",
 *   "name": "Toor Dal Tadka with Bhindi & Phulka",
 *   "native_name": "अरहर की दाल",
 *   "cuisine_region": "north_india",
 *   "description": "...",
 *   "components": {
 *     "dal": { "type": "toor", "style": "tadka" },
 *     "sabzi": { "type": "bhindi", "style": "dry" },
 *     "carb": { "type": "phulka" }
 *   },
 *   "nutrition": {
 *     "calories": 280,
 *     "protein": 10,
 *     "carbs": 42,
 *     "fat": 8
 *   },
 *   "timing": {
 *     "prep_time": 10,
 *     "cook_time": 25,
 *     "total_time": 35
 *   },
 *   "ingredients": [...],
 *   "recipe_steps": [...],
 *   "family_history": {
 *     "times_prepared": 15,
 *     "average_rating": 4.3,
 *     "last_prepared": "2025-01-10",
 *     "member_ratings": { "member_id": 5, ... }
 *   }
 * }
 */

// ============================================================================
// PHASE 4: MEAL PLANNING & MEALGRAPH ENGINE
// ============================================================================

/**
 * @endpoint POST /api/v1/meal-plans/generate
 * @description Generate weekly/monthly meal plan using MealGraph
 * @auth Required
 * @request {
 *   "household_id": "uuid",
 *   "plan_type": "weekly",
 *   "start_date": "2025-01-20",
 *   "end_date": "2025-01-26",
 *   "constraints": {
 *     "enforce_diet_types": true,
 *     "avoid_repetition_days": 7,
 *     "respect_cook_schedule": true,
 *     "include_seasonal": true,
 *     "health_goals_weight": 0.3,
 *     "taste_preference_weight": 0.4,
 *     "variety_weight": 0.3
 *   }
 * }
 * @response {
 *   "meal_plan_id": "uuid",
 *   "household_id": "uuid",
 *   "status": "generated",
 *   "plan_type": "weekly",
 *   "period": { "start_date": "2025-01-20", "end_date": "2025-01-26" },
 *   "confidence_score": 0.92,
 *   "reasoning": [
 *     "Generated based on taste profile preference (spice_level: 4)",
 *     "Seasonal vegetables: bhindi, okra selected for monsoon",
 *     "High-protein meals on Mon, Wed, Fri as per health goals",
 *     "Avoided repetition: toor dal not served since 7 days ago",
 *     "Cook schedule respected: no 5+ dishes on Wednesday"
 *   ],
 *   "total_estimated_cook_time": 285,
 *   "daily_breakdown": [
 *     {
 *       "date": "2025-01-20",
 *       "day": "Monday",
 *       "breakfast": { "dish_id": "...", "name": "..." },
 *       "lunch": {
 *         "dal": { "type": "toor", "style": "tadka" },
 *         "sabzi": { "type": "bhindi", "style": "dry" },
 *         "carb": { "type": "phulka" },
 *         "salad": true,
 *         "raita": true
 *       },
 *       "snacks": { "dish_id": "...", "name": "..." },
 *       "dinner": { "dish_id": "...", "name": "..." },
 *       "estimated_cook_time": 40
 *     },
 *     ...
 *   ]
 * }
 */

/**
 * @endpoint POST /api/v1/meal-plans/{planId}/approve
 * @description Approve meal plan before execution
 * @auth Required (Cook)
 * @request {
 *   "cook_id": "uuid",
 *   "notes": "Can prepare on time",
 *   "adjustments": [
 *     {
 *       "date": "2025-01-22",
 *       "slot": "lunch",
 *       "reason": "Ingredient unavailable",
 *       "suggested_alternative_id": "uuid"
 *     }
 *   ]
 * }
 * @response {
 *   "meal_plan_id": "uuid",
 *   "approved": true,
 *   "approved_by_cook": "uuid",
 *   "status": "active",
 *   "adjustments_made": 1,
 *   "ready_for_execution": true
 * }
 */

/**
 * @endpoint POST /api/v1/meal-plans/{planId}/substitute
 * @description Replace meal in plan with alternative
 * @auth Required
 * @request {
 *   "date": "2025-01-22",
 *   "meal_slot": "lunch",
 *   "dal_component": "moong_light", // optional
 *   "sabzi_component": "aloo_gravy", // optional
 *   "reason": "cook_unavailable"
 * }
 * @response {
 *   "meal_plan_id": "uuid",
 *   "date": "2025-01-22",
 *   "slot": "lunch",
 *   "previous_meal": { ... },
 *   "new_meal": { ... },
 *   "substitution_saved": true
 * }
 */

/**
 * @endpoint GET /api/v1/meal-plans/active
 * @description Get current active meal plan
 * @query {
 *   "household_id": "uuid"
 * }
 * @response {
 *   "meal_plan_id": "uuid",
 *   "status": "active",
 *   "current_week": {
 *     "start_date": "2025-01-20",
 *     "end_date": "2025-01-26",
 *     "days": [
 *       {
 *         "date": "2025-01-20",
 *         "breakfast": { ... },
 *         "lunch": { ... },
 *         "snacks": { ... },
 *         "dinner": { ... }
 *       },
 *       ...
 *     ]
 *   }
 * }
 */

// ============================================================================
// PHASE 5: EXECUTION & COOK INTERFACE
// ============================================================================

/**
 * @endpoint GET /api/v1/cook/{cookId}/tasks
 * @description Get cook's task list for specific date
 * @query {
 *   "date": "2025-01-20",
 *   "household_id": "uuid"
 * }
 * @response {
 *   "cook_id": "uuid",
 *   "date": "2025-01-20",
 *   "tasks": [
 *     {
 *       "task_id": "uuid",
 *       "meal_slot": "breakfast",
 *       "dish_name": "Paratha & Curd",
 *       "prep_time": 5,
 *       "cook_time": 15,
 *       "ingredients_needed": ["flour", "curd", "salt"],
 *       "status": "pending",
 *       "priority": "normal"
 *     },
 *     {
 *       "task_id": "uuid",
 *       "meal_slot": "lunch",
 *       "components": {
 *         "dal": "Toor Dal Tadka",
 *         "sabzi": "Bhindi Dry",
 *         "carb": "Phulka"
 *       },
 *       "total_time": 40,
 *       "ingredients_needed": [...],
 *       "status": "pending"
 *     },
 *     ...
 *   ],
 *   "total_time_estimated": 120,
 *   "day_overview": "4 meals, moderate complexity"
 * }
 */

/**
 * @endpoint POST /api/v1/meal-history/record
 * @description Record completion and feedback for served meal
 * @auth Required (Cook or App)
 * @request {
 *   "household_id": "uuid",
 *   "meal_plan_date": "2025-01-20",
 *   "meal_slot": "lunch",
 *   "dish_id": "uuid",
 *   "prepared_by_cook": "uuid",
 *   "actual_cook_time": 40,
 *   "member_ratings": {
 *     "member_1_uuid": 5,
 *     "member_2_uuid": 4,
 *     "member_3_uuid": 5
 *   },
 *   "feedback_notes": "Great taste, quickly prepared",
 *   "ingredients_used": [
 *     { "name": "dal", "qty": 1, "unit": "cup" },
 *     { "name": "onion", "qty": 2, "unit": "medium" }
 *   ]
 * }
 * @response {
 *   "meal_id": "uuid",
 *   "recorded_successfully": true,
 *   "average_family_rating": 4.7,
 *   "feedback_saved": true,
 *   "pantry_updated": true
 * }
 */

/**
 * @endpoint POST /api/v1/meal-history/{mealId}/reject
 * @description Record meal rejection with reason
 * @auth Required
 * @request {
 *   "rejection_reason": "disliked",
 *   "member_feedback": "Too spicy",
 *   "cook_notes": "Member requested less spice next time"
 * }
 * @response {
 *   "meal_id": "uuid",
 *   "rejection_recorded": true,
 *   "cooldown_period": 14,
 *   "next_suggest_after": "2025-02-03",
 *   "next_plan_generation_will_avoid": true
 * }
 */

/**
 * @endpoint GET /api/v1/cook/{cookId}/brief
 * @description Get detailed brief for cook before meal prep
 * @query {
 *   "date": "2025-01-20",
 *   "household_id": "uuid"
 * }
 * @response {
 *   "date_briefing": "2025-01-20",
 *   "day_name": "Monday",
 *   "household_info": {
 *     "household_size": 4,
 *     "members_present": 4
 *   },
 *   "meals": [
 *     {
 *       "slot": "breakfast",
 *       "dish": "Paratha & Curd",
 *       "timing": { "prep": 5, "cook": 15, "serve_by": "08:00" },
 *       "ingredients": [
 *         { "name": "flour", "qty": 2, "unit": "cup", "in_pantry": true },
 *         { "name": "curd", "qty": 1, "unit": "cup", "in_pantry": false }
 *       ],
 *       "special_notes": "Priya takes breakfast early at 7:30 AM"
 *     },
 *     {
 *       "slot": "lunch",
 *       "components": {
 *         "dal": {
 *           "name": "Toor Dal Tadka",
 *           "prep": 5,
 *           "cook": 20,
 *           "ingredients": [...]
 *         },
 *         "sabzi": {
 *           "name": "Bhindi Dry",
 *           "prep": 5,
 *           "cook": 15,
 *           "ingredients": [...]
 *         },
 *         "carb": {
 *           "name": "Phulka",
 *           "prep": 3,
 *           "cook": 8,
 *           "ingredients": [...]
 *         }
 *       },
 *       "salad": { "ingredients": [...] },
 *       "raita": { "ingredients": [...] },
 *       "allergies_to_avoid": {
 *         "peanut": "member 2",
 *         "seafood": "member 3"
 *       },
 *       "health_notes": {
 *         "member_1": "high_protein preferred",
 *         "member_3": "low_salt"
 *       },
 *       "serve_time": "13:00"
 *     },
 *     ...
 *   ],
 *   "total_estimated_time": 120,
 *   "optimization_notes": "Prep dal while sabzi cooks"
 * }
 */

// ============================================================================
// PANTRY & SHOPPING MANAGEMENT
// ============================================================================

/**
 * @endpoint GET /api/v1/households/{householdId}/pantry
 * @description Get current pantry inventory
 * @query {
 *   "filter": "available", // all, available, expired, expiring_soon
 *   "sort_by": "expiry_date"
 * }
 * @response {
 *   "pantry_items": [
 *     {
 *       "item_id": "uuid",
 *       "ingredient": "dal",
 *       "quantity": 2,
 *       "unit": "kg",
 *       "purchase_date": "2025-01-05",
 *       "expiry_date": "2025-06-05",
 *       "is_available": true,
 *       "last_used": "2025-01-18",
 *       "usage_frequency": "daily"
 *     },
 *     ...
 *   ],
 *   "total_items": 45,
 *   "expiring_soon": 3,
 *   "expired": 0
 * }
 */

/**
 * @endpoint POST /api/v1/meal-plans/{planId}/shopping-list
 * @description Generate shopping list for meal plan
 * @auth Required
 * @response {
 *   "shopping_list_id": "uuid",
 *   "meal_plan_id": "uuid",
 *   "period": "2025-01-20 to 2025-01-26",
 *   "items": [
 *     {
 *       "ingredient": "toor dal",
 *       "quantity_needed": 2,
 *       "unit": "kg",
 *       "in_pantry": 0.5,
 *       "to_purchase": 1.5,
 *       "estimated_cost": 120,
 *       "priority": "high",
 *       "expiry_recommendation": "2025-06-20"
 *     },
 *     ...
 *   ],
 *   "total_estimated_cost": 1250,
 *   "generated_at": "2025-01-14T22:00:00Z"
 * }
 */

/**
 * @endpoint POST /api/v1/pantry/update
 * @description Update pantry after shopping or usage
 * @auth Required
 * @request {
 *   "household_id": "uuid",
 *   "operations": [
 *     {
 *       "operation": "add",
 *       "ingredient": "toor dal",
 *       "quantity": 2,
 *       "unit": "kg",
 *       "purchase_date": "2025-01-18",
 *       "expiry_date": "2025-06-18"
 *     },
 *     {
 *       "operation": "use",
 *       "ingredient": "onion",
 *       "quantity": 1,
 *       "unit": "kg"
 *     }
 *   ]
 * }
 * @response {
 *   "updates_applied": 2,
 *   "pantry_updated": true,
 *   "current_inventory": [...]
 * }
 */

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * @endpoint GET /api/v1/households/{householdId}/analytics
 * @description Get household meal planning analytics
 * @query {
 *   "period": "month", // week, month, quarter
 *   "from_date": "2025-01-01",
 *   "to_date": "2025-01-31"
 * }
 * @response {
 *   "period_summary": {
 *     "total_plans_generated": 4,
 *     "meals_planned": 96,
 *     "meals_completed": 92,
 *     "completion_rate": 0.958,
 *     "average_family_satisfaction": 4.3
 *   },
 *   "dish_statistics": {
 *     "most_prepared": [
 *       { "dish": "Toor Dal Tadka", "times": 8, "avg_rating": 4.5 }
 *     ],
 *     "most_rejected": [
 *       { "dish": "Bitter Gourd Gravy", "times": 2, "reason": "taste" }
 *     ]
 *   },
 *   "cook_efficiency": {
 *     "cook_name": "Ram",
 *     "meals_prepared": 92,
 *     "average_cook_time": 35,
 *     "on_time_percentage": 0.95,
 *     "efficiency_score": 0.92
 *   },
 *   "health_goals_alignment": {
 *     "high_protein_meals": 18,
 *     "seasonal_meals": 45,
 *     "target_alignment": 0.88
 *   }
 * }
 */

/**
 * @endpoint GET /api/v1/households/{householdId}/meal-preferences-learned
 * @description Get AI-learned preferences and suggestions
 * @response {
 *   "household_id": "uuid",
 *   "learned_preferences": {
 *     "favorite_dishes": ["Toor Dal Tadka", "Chicken Biryani"],
 *     "favorite_combinations": [
 *       { "dal": "toor", "sabzi": "bhindi", "score": 0.92 }
 *     ],
 *     "disliked_ingredients": ["bitter_gourd", "mushroom"],
 *     "optimal_spice_level": 3.8,
 *     "preferred_cooking_style": "traditional_tadka"
 *   },
 *   "recommendations": [
 *     "Try Moong Dal with Okra - similar taste profile to your favorites",
 *     "Chicken dish hasn't appeared in 15 days - add to next plan?"
 *   ],
 *   "confidence_score": 0.85
 * }
 */

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/*
 * Standard Error Response Format:
 * {
 *   "error": {
 *     "code": "MEAL_PLAN_NOT_FOUND",
 *     "message": "Meal plan not found",
 *     "details": "Meal plan ID xyz does not exist for household",
 *     "http_status": 404,
 *     "timestamp": "2025-01-14T22:00:00Z"
 *   }
 * }
 *
 * Common Status Codes:
 * - 200: Success
 * - 201: Created
 * - 400: Bad Request (validation error)
 * - 401: Unauthorized (missing/invalid auth)
 * - 403: Forbidden (permission denied)
 * - 404: Not Found
 * - 409: Conflict (duplicate, constraint violation)
 * - 422: Unprocessable Entity (validation error)
 * - 500: Internal Server Error
 * - 503: Service Unavailable
 */

// ============================================================================
// AUTHENTICATION & RATE LIMITING
// ============================================================================

/*
 * Authentication:
 * - Use Bearer tokens (JWT)
 * - Include in Authorization header: "Authorization: Bearer {token}"
 * - Token expiry: 24 hours for access, 30 days for refresh
 *
 * Rate Limiting:
 * - 100 requests/minute for authenticated users
 * - 10 requests/minute for unauthenticated
 * - Includes headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 *
 * Pagination:
 * - Use "page" and "per_page" query parameters
 * - Default per_page: 20, Max: 100
 */

-- ============================================================================
-- MEALDRAMA DATABASE SCHEMA
-- A Household Food Operating System
-- ============================================================================

-- ============================================================================
-- PHASE 1: USER & HOUSEHOLD IDENTITY GRAPH
-- ============================================================================

CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location_region ENUM('north_india', 'south_india', 'east_india', 'west_india', 'state_specific') NOT NULL,
    household_size INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_region (location_region)
);

CREATE TABLE household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('owner', 'member', 'dependent') NOT NULL,
    persona ENUM('single', 'couple', 'family_with_kids', 'senior_home', 'fitness', 'working_professional') NOT NULL,
    age_group ENUM('child', 'teen', 'adult', 'senior') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household (household_id)
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL UNIQUE,
    
    -- PHASE 1: Identity Setup
    diet_type ENUM('veg', 'non_veg', 'eggetarian', 'jain', 'vegan', 'mixed_household') NOT NULL,
    health_goal ENUM('weight_loss', 'high_protein', 'diabetic_management', 'low_sodium', 'general_wellness') DEFAULT 'general_wellness',
    
    -- Taste Profile (Ranking Weights)
    spice_level INT CHECK (spice_level >= 1 AND spice_level <= 5) DEFAULT 3,
    oil_preference ENUM('light', 'medium', 'rich') DEFAULT 'medium',
    sweet_tolerance ENUM('low', 'medium', 'high') DEFAULT 'medium',
    food_behavior ENUM('comfort', 'experimental', 'mix') DEFAULT 'mix',
    
    -- Health Constraints
    allergies JSON DEFAULT '[]', -- ["peanut", "dairy", "gluten"]
    intolerances JSON DEFAULT '[]',
    medical_conditions JSON DEFAULT '[]', -- ["diabetes", "hypertension"]
    
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES household_members(id) ON DELETE CASCADE,
    INDEX idx_member (member_id),
    INDEX idx_diet (diet_type)
);

-- ============================================================================
-- PHASE 2: COOK ASSIGNMENT & AVAILABILITY
-- ============================================================================

CREATE TABLE cooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Skills & Experience
    cuisine_specialization JSON DEFAULT '[]', -- ["north_indian", "south_indian"]
    years_experience INT DEFAULT 0,
    cooking_speed ENUM('slow', 'medium', 'fast') DEFAULT 'medium',
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    max_dishes_per_day INT DEFAULT 4,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household (household_id),
    INDEX idx_available (is_available)
);

CREATE TABLE cook_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cook_id UUID NOT NULL,
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    is_off_day BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cook_day (cook_id, day_of_week),
    INDEX idx_cook (cook_id)
);

-- ============================================================================
-- PHASE 2: MEAL SLOT CONFIGURATION
-- ============================================================================

CREATE TABLE meal_slot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    
    -- Slot Availability
    has_breakfast BOOLEAN DEFAULT TRUE,
    has_lunch BOOLEAN DEFAULT TRUE,
    has_snacks BOOLEAN DEFAULT TRUE,
    has_dinner BOOLEAN DEFAULT TRUE,
    
    -- Breakfast Preferences
    breakfast_type ENUM('light', 'heavy', 'eggs', 'beverages') DEFAULT 'light',
    breakfast_regional_dishes JSON DEFAULT '[]',
    breakfast_prep_time_limit INT DEFAULT 30, -- minutes
    
    -- Lunch Configuration (Thali Engine)
    lunch_style ENUM('thali', 'single_dish', 'light', 'mixed') DEFAULT 'thali',
    lunch_dal_types JSON DEFAULT '["toor", "moong"]',
    lunch_dal_style ENUM('tadka', 'makhani', 'dhaba', 'light', 'sambhar') DEFAULT 'tadka',
    lunch_sabzi_types JSON DEFAULT '[]',
    lunch_sabzi_style ENUM('dry', 'gravy', 'stir_fry', 'steamed') DEFAULT 'gravy',
    lunch_roti_preference JSON DEFAULT '["phulka"]',
    lunch_rice_preference JSON DEFAULT '["plain"]',
    lunch_add_salad BOOLEAN DEFAULT TRUE,
    lunch_add_raita BOOLEAN DEFAULT TRUE,
    lunch_add_beverage BOOLEAN DEFAULT FALSE,
    
    -- Snacks Configuration
    snacks_type ENUM('chai_biscuit', 'namkeen', 'fruit', 'light_quick', 'mixed') DEFAULT 'chai_biscuit',
    snacks_include_kids BOOLEAN DEFAULT FALSE,
    snacks_prep_time_limit INT DEFAULT 10,
    
    -- Dinner Configuration
    dinner_style ENUM('light', 'same_as_lunch', 'full_thali', 'khichdi', 'special_weekend') DEFAULT 'full_thali',
    dinner_meal_modes JSON DEFAULT '["light", "full_thali"]',
    dinner_non_veg_days JSON DEFAULT '[]', -- ["friday", "sunday"]
    dinner_khichdi_days JSON DEFAULT '[]', -- ["wednesday", "sunday"]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    UNIQUE KEY unique_household (household_id)
);

-- ============================================================================
-- PHASE 3: DISH & COMPONENT LIBRARY
-- ============================================================================

CREATE TABLE dish_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    native_name VARCHAR(255),
    description TEXT,
    cuisine_region ENUM('north_india', 'south_india', 'east_india', 'west_india') NOT NULL,
    
    -- Classification
    category ENUM('breakfast', 'lunch', 'snacks', 'dinner', 'universal') NOT NULL,
    dish_type ENUM('dal', 'sabzi', 'carb', 'protein', 'beverage', 'snack', 'complete_meal', 'thali_component') NOT NULL,
    
    -- Diet Compatibility
    suitable_for JSON DEFAULT '[]', -- ["veg", "non_veg", "jain"]
    blocked_for JSON DEFAULT '[]', -- ["jain"] if contains onion/garlic
    
    -- Nutrition
    calories_per_serving INT,
    protein_grams DECIMAL(5, 2),
    carbs_grams DECIMAL(5, 2),
    fat_grams DECIMAL(5, 2),
    fiber_grams DECIMAL(5, 2),
    
    -- Execution
    prep_time_minutes INT NOT NULL,
    cook_time_minutes INT NOT NULL,
    total_time_minutes INT GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    required_equipment JSON DEFAULT '[]', -- ["stove", "oven"]
    
    -- Metadata
    tags JSON DEFAULT '[]', -- ["quick", "no_onion", "high_protein"]
    ingredients JSON NOT NULL, -- [{"name": "onion", "qty": 2, "unit": "medium"}]
    image_url TEXT,
    
    is_seasonal BOOLEAN DEFAULT FALSE,
    seasonal_months JSON, -- [3, 4, 5] = March, April, May
    
    popularity_score DECIMAL(3, 2) DEFAULT 3.0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_region (cuisine_region),
    INDEX idx_category (category),
    INDEX idx_diet (suitable_for),
    INDEX idx_prep_time (total_time_minutes),
    FULLTEXT INDEX ft_name (name, native_name)
);

CREATE TABLE dal_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dal_type ENUM('toor', 'moong', 'masoor', 'chana', 'rajma', 'chole', 'urad', 'arhar') NOT NULL,
    style ENUM('tadka', 'makhani', 'dhaba', 'light', 'sambhar') NOT NULL,
    
    prep_time_minutes INT,
    cook_time_minutes INT,
    protein_grams DECIMAL(5, 2),
    calories INT,
    
    recipe TEXT,
    typical_ingredients JSON,
    
    UNIQUE KEY unique_dal_style (dal_type, style),
    INDEX idx_dal (dal_type)
);

CREATE TABLE sabzi_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sabzi_type ENUM('aloo', 'bhindi', 'gobi', 'baingan', 'pyaaz', 'tamatar', 'palak', 'mixed') NOT NULL,
    style ENUM('dry', 'gravy', 'stir_fry', 'steamed') NOT NULL,
    
    prep_time_minutes INT,
    cook_time_minutes INT,
    calories INT,
    
    recipe TEXT,
    typical_ingredients JSON,
    
    UNIQUE KEY unique_sabzi_style (sabzi_type, style),
    INDEX idx_sabzi (sabzi_type)
);

CREATE TABLE carb_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carb_type ENUM('phulka', 'bajra', 'jowar', 'naan', 'paratha', 'plain_rice', 'jeera_rice', 'pulao', 'biryani') NOT NULL,
    
    prep_time_minutes INT,
    cook_time_minutes INT,
    calories INT,
    carbs_grams DECIMAL(5, 2),
    
    recipe TEXT,
    typical_ingredients JSON,
    
    UNIQUE KEY unique_carb (carb_type),
    INDEX idx_carb (carb_type)
);

CREATE TABLE pantry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    
    ingredient_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2),
    unit ENUM('kg', 'g', 'liter', 'ml', 'piece', 'cup', 'tbsp', 'tsp') NOT NULL,
    
    purchase_date DATE,
    expiry_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    
    last_used_date DATE,
    usage_frequency ENUM('daily', 'weekly', 'monthly', 'rarely') DEFAULT 'weekly',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household (household_id),
    INDEX idx_available (is_available),
    INDEX idx_expiry (expiry_date)
);

-- ============================================================================
-- PHASE 4: MEAL HISTORY & REPETITION TRACKING
-- ============================================================================

CREATE TABLE meal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    dish_id UUID NOT NULL,
    
    served_date DATE NOT NULL,
    meal_slot ENUM('breakfast', 'lunch', 'snacks', 'dinner') NOT NULL,
    
    -- Feedback
    member_ratings JSON DEFAULT '{}', -- {"member_id": 5, "member_id2": 3}
    average_rating DECIMAL(3, 2),
    feedback_notes TEXT,
    
    -- Execution
    was_prepared BOOLEAN DEFAULT TRUE,
    prepared_by_cook_id UUID,
    actual_cook_time_minutes INT,
    
    -- Ingredients Used (for pantry tracking)
    ingredients_used JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dish_library(id),
    FOREIGN KEY (prepared_by_cook_id) REFERENCES cooks(id),
    INDEX idx_household (household_id),
    INDEX idx_date (served_date),
    INDEX idx_dish (dish_id),
    INDEX idx_slot (meal_slot)
);

CREATE TABLE dish_rejection_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    dish_id UUID NOT NULL,
    
    rejection_reason ENUM('disliked', 'allergic_reaction', 'not_available', 'cook_unavailable', 'time_constraint', 'other') NOT NULL,
    rejection_count INT DEFAULT 1,
    last_rejected_date DATE,
    
    cooldown_until_date DATE, -- Don't suggest until this date
    permanent_block BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dish_library(id),
    UNIQUE KEY unique_household_dish (household_id, dish_id),
    INDEX idx_cooldown (cooldown_until_date)
);

-- ============================================================================
-- PHASE 4: MEAL PLANNING & EXECUTION
-- ============================================================================

CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    
    -- Plan Period
    plan_type ENUM('weekly', 'biweekly', 'monthly') DEFAULT 'weekly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Status
    status ENUM('draft', 'active', 'completed', 'archived') DEFAULT 'draft',
    is_approved_by_cook BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    
    -- Metadata
    confidence_score DECIMAL(3, 2), -- 0.0-1.0
    reasoning_tags JSON DEFAULT '[]', -- ["seasonal", "high_protein", "repetition_avoided"]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household (household_id),
    INDEX idx_period (start_date, end_date),
    INDEX idx_status (status)
);

CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL,
    plan_date DATE NOT NULL,
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
    
    -- Breakfast
    breakfast_dish_id UUID,
    breakfast_status ENUM('pending', 'in_progress', 'completed', 'skipped', 'substitute') DEFAULT 'pending',
    breakfast_notes TEXT,
    
    -- Lunch (Thali Components)
    lunch_dal_id UUID,
    lunch_sabzi_id UUID,
    lunch_carb_id UUID,
    lunch_salad_included BOOLEAN,
    lunch_raita_included BOOLEAN,
    lunch_status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
    lunch_notes TEXT,
    
    -- Snacks
    snacks_dish_id UUID,
    snacks_status ENUM('pending', 'in_progress', 'completed', 'skipped', 'substitute') DEFAULT 'pending',
    snacks_notes TEXT,
    
    -- Dinner
    dinner_dish_id UUID,
    dinner_status ENUM('pending', 'in_progress', 'completed', 'skipped', 'substitute') DEFAULT 'pending',
    dinner_notes TEXT,
    
    -- Execution
    assigned_cook_id UUID,
    estimated_total_cook_time INT, -- minutes
    actual_total_cook_time INT,
    
    -- Adaptation
    is_adapted BOOLEAN DEFAULT FALSE,
    adaptation_reason TEXT, -- "cook unavailable", "ingredients unavailable"
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (breakfast_dish_id) REFERENCES dish_library(id),
    FOREIGN KEY (lunch_dal_id) REFERENCES dal_variants(id),
    FOREIGN KEY (lunch_sabzi_id) REFERENCES sabzi_variants(id),
    FOREIGN KEY (lunch_carb_id) REFERENCES carb_variants(id),
    FOREIGN KEY (snacks_dish_id) REFERENCES dish_library(id),
    FOREIGN KEY (dinner_dish_id) REFERENCES dish_library(id),
    FOREIGN KEY (assigned_cook_id) REFERENCES cooks(id),
    UNIQUE KEY unique_meal_plan_date (meal_plan_id, plan_date),
    INDEX idx_meal_plan (meal_plan_id),
    INDEX idx_date (plan_date),
    INDEX idx_cook (assigned_cook_id),
    INDEX idx_status_breakfast (breakfast_status),
    INDEX idx_status_lunch (lunch_status),
    INDEX idx_status_dinner (dinner_status)
);

-- ============================================================================
-- PHASE 5: SHOPPING & INGREDIENT PLANNING
-- ============================================================================

CREATE TABLE ingredient_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL,
    
    ingredient_name VARCHAR(255) NOT NULL,
    required_quantity DECIMAL(10, 2),
    unit ENUM('kg', 'g', 'liter', 'ml', 'piece', 'cup', 'tbsp', 'tsp') NOT NULL,
    
    -- Availability
    in_pantry BOOLEAN DEFAULT FALSE,
    pantry_quantity DECIMAL(10, 2),
    purchase_needed DECIMAL(10, 2),
    
    -- Status
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_date DATE,
    purchased_from TEXT, -- "store name" or "farmer"
    price_paid DECIMAL(10, 2),
    
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    INDEX idx_meal_plan (meal_plan_id),
    INDEX idx_purchased (is_purchased)
);

-- ============================================================================
-- PHASE 5: NOTIFICATIONS & ALERTS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    member_id UUID,
    cook_id UUID,
    
    notification_type ENUM(
        'meal_reminder',
        'cook_unavailable',
        'ingredient_unavailable',
        'substitute_suggested',
        'plan_ready',
        'feedback_requested',
        'pantry_low'
    ) NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_data JSON, -- {"meal_plan_id": "...", "suggested_dish_id": "..."}
    
    status ENUM('pending', 'sent', 'read', 'acted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household (household_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- ============================================================================
-- PHASE 5: PREFERENCE LEARNING & ANALYTICS
-- ============================================================================

CREATE TABLE dish_scores_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    dish_id UUID NOT NULL,
    
    -- Scoring Components
    base_score DECIMAL(5, 2),
    taste_weight DECIMAL(5, 2),
    health_weight DECIMAL(5, 2),
    persona_weight DECIMAL(5, 2),
    history_weight DECIMAL(5, 2),
    repetition_penalty DECIMAL(5, 2),
    
    -- Final Score
    final_score DECIMAL(5, 2),
    
    -- Context
    scored_for_date DATE,
    meal_slot ENUM('breakfast', 'lunch', 'snacks', 'dinner'),
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dish_library(id),
    INDEX idx_household_date (household_id, scored_for_date),
    INDEX idx_final_score (final_score DESC)
);

CREATE TABLE usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL,
    
    total_meals_planned INT DEFAULT 0,
    total_meals_completed INT DEFAULT 0,
    average_plan_confidence DECIMAL(3, 2),
    
    most_cooked_dish_id UUID,
    most_rejected_dish_id UUID,
    cook_efficiency_score DECIMAL(3, 2),
    
    last_plan_generated_at TIMESTAMP,
    total_plans_generated INT DEFAULT 0,
    
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    UNIQUE KEY unique_household (household_id)
);

-- ============================================================================
-- INDEXES & KEYS FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_households_active ON households(is_active);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed, member_id);
CREATE INDEX idx_daily_plans_status ON daily_plans(breakfast_status, lunch_status, dinner_status);
CREATE INDEX idx_meal_history_recent ON meal_history(household_id, served_date DESC);
CREATE INDEX idx_pantry_available ON pantry(household_id, is_available, expiry_date);

-- ============================================================================
-- MEALDRAMA VARIANTS SEED DATA
-- Tray Builder 2.0 — Gravy, Roti, Rice, Sides, Beverages
-- ============================================================================

INSERT INTO "MealVariant" (id, "mealId", name, "cookingStyle", "baseStyle", "addOn", "accompaniments", "mealContext", "regionOverride") VALUES
-- Gravy Variants (cookingStyle)
('gravy-default', 'north-rajma-chawal', 'Default', 'Default', 'Default', NULL, '{}', 'lunch,dinner', NULL),
('gravy-tadka', 'north-rajma-chawal', 'Tadka', 'Tadka', 'Gravy', NULL, '{"jeera", "garlic", "red-chili"}', 'lunch,dinner', NULL),
('gravy-dry', 'north-rajma-chawal', 'Dry', 'Dry', 'Dry', NULL, '{}', 'lunch,dinner', NULL),
('gravy-curry', 'north-rajma-chawal', 'Curry', 'Curry', 'Gravy', NULL, '{"tomato", "onion"}', 'lunch,dinner', NULL),
('gravy-fried', 'north-rajma-chawal', 'Fried', 'Fried', 'Crispy', NULL, '{}', 'lunch,dinner', NULL),

-- Roti Variants (baseStyle)
('roti-phulka', 'north-rajma-chawal', 'Phulka', NULL, 'Phulka', NULL, '{}', 'lunch,dinner', NULL),
('roti-roti', 'north-rajma-chawal', 'Roti', NULL, 'Roti', NULL, '{}', 'lunch,dinner', NULL),
('roti-naan', 'north-rajma-chawal', 'Naan', NULL, 'Naan', NULL, '{}', 'lunch,dinner', NULL),
('roti-tandoori-naan', 'north-rajma-chawal', 'Tandoori Naan', NULL, 'Tandoori Naan', NULL, '{}', 'lunch,dinner', NULL),
('roti-missi-roti', 'north-rajma-chawal', 'Missi Roti', NULL, 'Missi Roti', NULL, '{"besan", "spices"}', 'lunch,dinner', NULL),

-- Rice Variants (addOn)
('rice-plain', 'north-rajma-chawal', 'Plain Rice', NULL, NULL, 'Plain Rice', '{}', 'lunch,dinner', NULL),
('rice-jeera', 'north-rajma-chawal', 'Jeera Rice', NULL, NULL, 'Jeera Rice', '{"jeera", "ghee"}', 'lunch,dinner', NULL),
('rice-tomato', 'north-rajma-chawal', 'Tomato Rice', NULL, NULL, 'Tomato Rice', '{"tomato", "mustard-seeds"}', 'lunch,dinner', NULL),
('rice-pulao', 'north-rajma-chawal', 'Pulao', NULL, NULL, 'Pulao', '{"mixed-veg", "ghee", "spices"}', 'lunch,dinner', NULL);

-- ============================================================================
-- VARIANT OPTIONS TABLE (for frontend chip selectors)
-- These are stored as reference data for UI components
-- ============================================================================

-- Create variant options table if not exists
CREATE TABLE IF NOT EXISTS "VariantOption" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL, -- gravy, roti, rice, sides, beverages
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VariantOption_category_idx" ON "VariantOption"("category");
CREATE UNIQUE INDEX IF NOT EXISTS "VariantOption_category_name_key" ON "VariantOption"("category", "name");

-- Gravy Options
INSERT INTO "VariantOption" (id, category, name, description, icon, sortOrder) VALUES
('vo-gravy-default', 'gravy', 'Default', 'Standard preparation', '🍲', 0),
('vo-gravy-tadka', 'gravy', 'Tadka', 'Tempered with spices', '🌶️', 1),
('vo-gravy-dry', 'gravy', 'Dry', 'Less gravy, more texture', '🥘', 2),
('vo-gravy-curry', 'gravy', 'Curry', 'Rich gravy style', '🍛', 3),
('vo-gravy-fried', 'gravy', 'Fried', 'Crispy fried style', '🍳', 4);

-- Roti Options
INSERT INTO "VariantOption" (id, category, name, description, icon, sortOrder) VALUES
('vo-roti-phulka', 'roti', 'Phulka', 'Light, puffed roti', '🫓', 0),
('vo-roti-roti', 'roti', 'Roti', 'Standard wheat roti', '🫓', 1),
('vo-roti-naan', 'roti', 'Naan', 'Soft leavened bread', '🍞', 2),
('vo-roti-tandoori-naan', 'roti', 'Tandoori Naan', 'Tandoor-baked naan', '🔥', 3),
('vo-roti-missi-roti', 'roti', 'Missi Roti', 'Gram flour mixed roti', '🌾', 4);

-- Rice Options
INSERT INTO "VariantOption" (id, category, name, description, icon, sortOrder) VALUES
('vo-rice-plain', 'rice', 'Plain', 'Simple steamed rice', '🍚', 0),
('vo-rice-jeera', 'rice', 'Jeera', 'Cumin tempered rice', '🌿', 1),
('vo-rice-tomato', 'rice', 'Tomato', 'Tomato flavored rice', '🍅', 2),
('vo-rice-pulao', 'rice', 'Pulao', 'Spiced vegetable rice', '🍛', 3);

-- Sides Options
INSERT INTO "VariantOption" (id, category, name, description, icon, sortOrder) VALUES
('vo-sides-salad', 'sides', 'Salad', 'Fresh cucumber, onion, tomato', '🥗', 0),
('vo-sides-roasted-peanuts', 'sides', 'Roasted Peanuts', 'Crunchy roasted peanuts', '🥜', 1),
('vo-sides-fruit', 'sides', 'Fruit', 'Seasonal fruit', '🍎', 2),
('vo-sides-jalebi', 'sides', 'Jalebi', 'Sweet crispy jalebi', '🍯', 3),
('vo-sides-samosa', 'sides', 'Samosa', 'Crispy samosa', '🥟', 4),
('vo-sides-gulab-jamun', 'sides', 'Gulab Jamun', 'Sweet gulab jamun', '🍩', 5);

-- Beverage Options
INSERT INTO "VariantOption" (id, category, name, description, icon, sortOrder) VALUES
('vo-bev-chaas', 'beverages', 'Chaas', 'Spiced buttermilk', '🥛', 0),
('vo-bev-nimbu-pani', 'beverages', 'Nimbu Pani', 'Lemon water', '🍋', 1),
('vo-bev-coffee', 'beverages', 'Coffee', 'Filter coffee', '☕', 2),
('vo-bev-tea', 'beverages', 'Tea', 'Masala chai', '🍵', 3),
('vo-bev-lassi', 'beverages', 'Lassi', 'Sweet/salty yogurt drink', '🥤', 4);

// ─────────────────────────────────────────────────────────────────────────────
// MACRO ESTIMATOR — deterministic per-dish nutrition model (Gap 1 closure).
//
// The Dish schema declares `calories?`/`protein?` but the REAL library
// (DISH_LIBRARY, 679 dishes — measured, no fabrication) has ZERO rows
// populating either field. This estimator DERIVES numeric macros from the
// populated signals that DO exist: ingredient rows (523 dishes, 6042 rows,
// categorized pantry×1882 / produce×1879 / spices×1128 / dairy×378 /
// grains×374 / proteins×303 / breads×86 / snacks×12), weight tier (light×306
// / medium×314 / heavy×59), dish type (veg×335 / non-veg×128 / vegan×187 /
// eggitarian×29), nutrition[] labels (protein×333 / carb×217 / fiber×205 /
// fat×50 …) and tags.
//
// OUTPUT CONTRACT: every dish maps to { calories, protein, fiber, fat,
// estimated: true, servingGrams }. `estimated` is ALWAYS true — the UI/report
// can never pass these off as lab-measured values.
//
// THE MODEL (all constants cited in-module — the estimator never guesses):
//
// 1 · SERVING BASIS — cooked serving grams by weight tier (portion-size
//     assumption, stated honestly):
//       light  → 200g · medium → 300g · heavy → 400g
// 2 · SLOT PORTION — breakfast portions run 5% lighter, snacks 10% lighter
//     than the lunch/dinner main (slot factor: breakfast 0.95, snacks 0.90,
//     lunch/dinner 1.00).
// 3 · PER-100g COOKED DENSITIES by ingredient category — standard nutrition
//     references (USDA FoodData Central typical values for the cooked staples
//     the category spans; blended where the category covers several foods):
//       grains   116 kcal · 2.7g protein · 0.4g fiber · 0.3g fat  (cooked basmati/atta)
//       proteins 120 kcal · 17g protein · 3.0g fiber · 3.5g fat    (dal + chicken + paneer cooked blend)
//       dairy     61 kcal · 3.5g protein · 0.0g fiber · 3.3g fat   (whole-milk yogurt/curd)
//       produce   40 kcal · 2.0g protein · 2.0g fiber · 0.3g fat   (cooked mixed vegetables)
//       breads   210 kcal · 7.0g protein · 1.5g fiber · 2.5g fat   (tandoori flatbread)
//       pantry    60 kcal · 1.0g protein · 0.3g fiber · 4.0g fat   (oil + condiment blend)
//       spices    25 kcal · 1.0g protein · 1.0g fiber · 0.5g fat   (masala blend)
//       snacks   110 kcal · 4.0g protein · 1.0g fiber · 5.0g fat   (namkeen/fried base)
// 4 · PLATE FRACTIONS — the share of the cooked serving each PRESENT category
//     occupies; fractions are NORMALIZED across the present set SO THEY SUM TO
//     1.00. An implicit OTHER fraction (0.50) is always present — the aqueous
//     gravy/water mass that dilutes the cooked solids in a prepared dish
//     (density 10 kcal · 0.5g protein · 0.2g fiber · 0.1g fat per 100g —
//     documented water/gravy reference). Without it single-category dishes
//     (a dal bowl) would be treated as 100% protein-dense solids, which
//     overstates reality by ~2×:
//       grains 0.40 · proteins 0.25 · produce 0.20 · dairy 0.10 · breads 0.25
//       pantry 0.10 · spices 0.05 · snacks 0.20 · OTHER (gravies/water) 0.50
// 5 · COMPOUNDING RULE — macros = servingGrams × slotFactor ×
//     Σ_present(share_c × density_c), then the documented dish-level
//     adjustments below. Deterministic pure function of the dish object.
// 6 · ADJUSTMENTS (each cited, applied only when its evidence exists):
//     · cooking oil   +2.0g fat/100g (+18 kcal/100g) on every cooked dish —
//       the documented assumption that a prepared Indian dish carries cooking
//       oil; steamed/boiled/raw/salad-tagged dishes use +0.5g/100g instead.
//     · rich dairy     dairy present AND ingredient names include
//       Paneer/Butter/Cream/Ghee/Malai/Cashew OR tags include
//       creamy/rich/buttery/ghee → that dish's dairy density becomes
//       190 kcal · 8g protein · 16g fat per 100g (full-fat
//       paneer/cream/butter blend instead of the yogurt base).
//     · fried/deep-fried tag → +6.0g fat/100g (+54 kcal/100g) — frying-oil
//       pickup on the cooked surface.
//     · eggitarian type → the proteins category uses the WHOLE-EGG reference
//       (155 kcal · 13g protein · 11g fat per 100g) instead of the
//       dal/chicken blend — eggs are the signature protein of these dishes.
//     · egg-tagged eggitarian dishes are EGG-FORWARD: the proteins share
//       rises 0.25 → 0.50 (the egg IS the plate — an egg roast is not a
//       dal-side dish). Documented simplification of the quantity-free
//       plate-fraction model.
//     · roast tag        → +3.0g fat/100g (+27 kcal/100g) — pan-roasted-in-oil
//       pickup (distinct from the oven 'roasted' light tag).
//     · fat / healthy-fats nutrition label (fallback path) → the lipid-heavy
//       snacks base stands in for cooking oils/gravies.
//     · non-veg type    → protein ×1.15 (lean animal protein denser than the
//       veg blend) with its energy added at 4 kcal/g protein.
//     · vegan type      → fat ×0.8 (no dairy/butter/ghee in the blend) with
//       its energy removed at 9 kcal/g fat.
//     · sweet (nutrition label or dessert tags) → kcal ×1.15 (added sugar),
//       fat ×0.9.
// 7 · NO-INGREDIENT FALLBACK (153 dishes carry no ingredient rows — measured):
//     the present category set is derived from nutrition[] labels + tags
//     (protein → proteins · fiber+d(<dal|rajma|chole|beans|sprouts>) → proteins
//     · fiber → produce · carb/energy → grains · dairy → dairy · sweet → pantry
//     · bread tags → breads), then compounded identically. A dish with NO
//     signal at all defaults to produce-only (the conservative neutral guess)
//     — recorded in the module, never silent.
// 8 · CLAMP — calories clamped to [60, 1600] kcal, protein/fiber/fat ≥ 0
//     (an extreme all-pantry dish cannot report a negative or absurd total).
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish, IngredientCategory } from '../meal/constants/dishLibrary';

export interface DishMacros {
  calories: number;
  protein: number;
  fiber: number;
  fat: number;
  /** Always true — these are derived estimates, never lab measurements. */
  estimated: true;
  /** The cooked serving grams this estimate is scaled to. */
  servingGrams: number;
}

export const SERVING_GRAMS: Record<'light' | 'medium' | 'heavy', number> = {
  light: 200,
  medium: 300,
  heavy: 400,
};

export const SLOT_PORTION: Record<string, number> = {
  breakfast: 0.95,
  snacks: 0.9,
};

/** Per-100g cooked density by ingredient category (documented in the header). */
export const CATEGORY_DENSITY: Record<IngredientCategory, { kcal: number; protein: number; fiber: number; fat: number }> = {
  grains:   { kcal: 116, protein: 2.7, fiber: 0.4, fat: 0.3 },
  proteins: { kcal: 120, protein: 17.0, fiber: 3.0, fat: 3.5 },
  dairy:    { kcal: 61,  protein: 3.5, fiber: 0.0, fat: 3.3 },
  produce:  { kcal: 40,  protein: 2.0, fiber: 2.0, fat: 0.3 },
  breads:   { kcal: 210, protein: 7.0, fiber: 1.5, fat: 2.5 },
  pantry:   { kcal: 60,  protein: 1.0, fiber: 0.3, fat: 4.0 },
  spices:   { kcal: 25,  protein: 1.0, fiber: 1.0, fat: 0.5 },
  snacks:   { kcal: 110, protein: 4.0, fiber: 1.0, fat: 5.0 },
};

/** The full-fat dairy blend used when the dish carries rich-dairy evidence. */
export const RICH_DAIRY_DENSITY = { kcal: 190, protein: 8.0, fiber: 0.0, fat: 16.0 };

/** Plate fractions — normalized across the PRESENT categories (sum to 1). */
export const CATEGORY_SHARE: Record<IngredientCategory, number> = {
  grains: 0.4,
  proteins: 0.25,
  produce: 0.2,
  dairy: 0.1,
  breads: 0.25,
  pantry: 0.1,
  spices: 0.05,
  snacks: 0.2,
};

/** The implicit aqueous-gravy/water plate fraction — always present when the
 *  compounded density is computed (see header rule 4). */
export const OTHER_SHARE = 0.5;
export const OTHER_DENSITY = { kcal: 10, protein: 0.5, fiber: 0.2, fat: 0.1 };
/** Rich-gravy reference: a rich-dairy dish cooks into a tomato-cream-butter
 *  REDUCTION, not watery gravy — this OTHER density replaces the aqueous one
 *  for those dishes (documented), and its pantry density becomes the
 *  cashew-cream blend (see RICH_PANTRY_DENSITY). */
export const RICH_OTHER_DENSITY = { kcal: 80, protein: 1.0, fiber: 0.2, fat: 7.0 };
export const RICH_PANTRY_DENSITY = { kcal: 160, protein: 3.0, fiber: 0.3, fat: 14.0 };

export const COOKING_OIL_G_PER_100G = 2.0;
export const LEAN_OIL_G_PER_100G = 0.5;
export const FRIED_OIL_G_PER_100G = 6.0;
/** Pan-roasted-in-oil pickup (kerala egg roast etc. — not oven 'roasted'). */
export const ROAST_OIL_G_PER_100G = 3.0;
/** Whole-egg reference for eggitarian dishes (egg + cooking-oil blend). */
export const EGG_PROTEIN_DENSITY = { kcal: 155, protein: 13.0, fiber: 0.0, fat: 11.0 };
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_PROTEIN = 4;

const RICH_INGREDIENT_NAMES = new Set([
  'Paneer', 'Butter', 'Cream', 'Ghee', 'Malai', 'Cashew', 'Cashews', 'Fresh Cream', 'Heavy Cream',
]);
const RICH_TAGS = new Set(['creamy', 'rich', 'buttery', 'ghee']);
const FRIED_TAGS = new Set(['fried', 'deep-fried']);
const LIGHT_TAGS = new Set(['steamed', 'boiled', 'raw', 'salad', 'grilled']);
const SWEET_TAGS = new Set(['sweet', 'dessert', 'chocolate', 'halwa', 'kheer', 'laddoo', 'jalebi', 'gulab', 'rasgulla', 'malpua', 'barfi', 'ladoo', 'ice-cream', 'cake', 'cookie', 'brownie', 'muffin']);
const BREAD_TAGS = new Set(['paratha', 'naan', 'roti', 'poori', 'puri', 'thepla', 'bhatura', 'parotta', 'bread', 'flatbread', 'tandoori-roti']);
const DAL_TAGS = new Set(['dal', 'lentil', 'rajma', 'chole', 'chickpea', 'beans', 'sprouts', 'kidney-bean', 'toor', 'moong', 'urad', 'masoor']);

const norm = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase();

/** The ingredient categories actually present in ANY variant of the dish
 *  (real populated rows — the primary macro signal). */
export function dishIngredientCategories(d: Dish): Set<IngredientCategory> {
  const present = new Set<IngredientCategory>();
  for (const v of d.variants ?? []) {
    for (const i of v.ingredients ?? []) {
      if (i.category) present.add(i.category as IngredientCategory);
    }
  }
  return present;
}

/** True when the dish carries rich-dairy evidence (full-fat dairy names or
 *  creamy/rich tags) — switches the dairy density to the rich blend. */
export function hasRichDairyEvidence(d: Dish, present: Set<IngredientCategory>): boolean {
  if (!present.has('dairy')) return false;
  const tags = (d.tags ?? []).map(norm);
  if (tags.some(t => RICH_TAGS.has(t))) return true;
  for (const v of d.variants ?? []) {
    for (const i of v.ingredients ?? []) {
      if (i.category === 'dairy' && RICH_INGREDIENT_NAMES.has(i.name.trim())) return true;
    }
  }
  return false;
}

/** Derive the present category set from nutrition labels + tags — the honest
 *  fallback for the 153 dishes with NO ingredient rows. */
export function categoriesFromLabels(d: Dish): Set<IngredientCategory> {
  const present = new Set<IngredientCategory>();
  const nut = new Set((d.nutrition ?? []).map(norm));
  const tags = new Set((d.tags ?? []).map(norm));
  const hasAnyTag = (set: Set<string>) => tags.size > 0 && [...tags].some(t => set.has(t));

  if (nut.has('protein') || tags.has('high-protein')) present.add('proteins');
  if (nut.has('fiber')) {
    if (hasAnyTag(DAL_TAGS)) present.add('proteins');
    else present.add('produce');
  }
  if (nut.has('carb') || nut.has('carbs') || nut.has('energy')) present.add('grains');
  if (nut.has('fat') || nut.has('healthy-fats')) present.add('snacks'); // lipid-heavy base (oils/gravies)
  if (nut.has('dairy') || hasAnyTag(new Set(['paneer', 'curd', 'yogurt', 'raita', 'buttermilk', 'lassi']))) present.add('dairy');
  if (nut.has('sweet') || nut.has('sugar') || hasAnyTag(SWEET_TAGS)) present.add('pantry');
  if (hasAnyTag(BREAD_TAGS)) present.add('breads');
  if (hasAnyTag(new Set(['snack', 'namkeen', 'fry', 'fritter', 'pakora', 'samosa', 'vada', 'kachori']))) present.add('snacks');
  if (hasAnyTag(DAL_TAGS)) present.add('proteins');
  if (hasAnyTag(new Set(['vegetable', 'veggie', 'leafy', 'greens', 'sabzi', 'salad', 'stir-fry']))) present.add('produce');
  // No signal at all → the conservative neutral guess (documented).
  if (present.size === 0) present.add('produce');
  return present;
}

/** The dish's present category set — ingredients first, labels/tags fallback. */
export function macroCategories(d: Dish): Set<IngredientCategory> {
  const fromIngredients = dishIngredientCategories(d);
  if (fromIngredients.size > 0) return fromIngredients;
  return categoriesFromLabels(d);
}

/** Effective serving grams = SERVING_GRAMS[weight] × slot portion factor. */
export function effectiveServingGrams(d: Dish): number {
  const w = (d.weight ?? 'medium').toLowerCase();
  const base = SERVING_GRAMS[w as keyof typeof SERVING_GRAMS] ?? SERVING_GRAMS.medium;
  const cats = (d.category ?? []).map(norm);
  const slotFactor = cats.some(c => c === 'snacks') ? (SLOT_PORTION.snacks ?? 1)
    : cats.some(c => c === 'breakfast') ? (SLOT_PORTION.breakfast ?? 1)
    : 1;
  return Math.round(base * slotFactor);
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * THE deterministic macro estimator. Pure function of the Dish object —
 * same dish in → byte-identical macros out; never random, never stateful.
 * Every output carries `estimated: true`.
 */
export function estimateDishMacros(d: Dish): DishMacros {
  const present = macroCategories(d);
  const servings = effectiveServingGrams(d);
  const tags = new Set((d.tags ?? []).map(norm));

  // Normalized plate fractions over the PRESENT categories + the implicit
  // OTHER (aqueous gravy/water) fraction — always sum to 1.
  const isEggitarian = norm(d.type) === 'eggitarian'; // hoisted — used earlier
  const isEggForward = isEggitarian && tags.has('egg');
  const proteinsShare = isEggForward ? 0.5 : (CATEGORY_SHARE.proteins ?? 0.25);
  const presentShares = [...present].map(c => (c === 'proteins' ? proteinsShare : (CATEGORY_SHARE[c] ?? 0)));
  const shareSum = presentShares.reduce((s, x) => s + x, 0) + OTHER_SHARE;
  const shareOf = (c: IngredientCategory): number =>
    ((c === 'proteins' ? proteinsShare : (CATEGORY_SHARE[c] ?? 0)) / shareSum);
  const otherShare = OTHER_SHARE / shareSum;

  const richDairy = hasRichDairyEvidence(d, present);
  const density = (c: IngredientCategory) => {
    if (richDairy && c === 'dairy') return RICH_DAIRY_DENSITY;
    if (isEggitarian && c === 'proteins') return EGG_PROTEIN_DENSITY; // whole-egg reference
    return CATEGORY_DENSITY[c] ?? CATEGORY_DENSITY.produce;
  };

  // Density per 100g of the cooked serving (compounding rule, step 5).
  // Rich-dairy dishes cook into a rich gravy reduction (documented) — their
  // OTHER (aqueous) density and their pantry density switch to the rich refs.
  const otherRef = richDairy ? RICH_OTHER_DENSITY : OTHER_DENSITY;
  const pantryRef = richDairy ? RICH_PANTRY_DENSITY : CATEGORY_DENSITY.pantry;
  let kcal = otherShare * otherRef.kcal;
  let protein = otherShare * otherRef.protein;
  let fiber = otherShare * otherRef.fiber;
  let fat = otherShare * otherRef.fat;
  for (const c of present) {
    const share = shareOf(c);
    const ref = c === 'pantry' ? pantryRef : density(c);
    kcal += share * ref.kcal;
    protein += share * ref.protein;
    fiber += share * ref.fiber;
    fat += share * ref.fat;
  }

  // Cooking-oil assumption (documented) — steamed/boiled/raw/salad carry less.
  const oilPer100 = [...tags].some(t => LIGHT_TAGS.has(t)) ? LEAN_OIL_G_PER_100G : COOKING_OIL_G_PER_100G;
  fat += oilPer100;
  kcal += oilPer100 * KCAL_PER_G_FAT;

  // Fried pickup (documented).
  if ([...tags].some(t => FRIED_TAGS.has(t))) {
    fat += FRIED_OIL_G_PER_100G;
    kcal += FRIED_OIL_G_PER_100G * KCAL_PER_G_FAT;
  }

  // Pan-roast pickup (documented — 'roast' ≠ oven 'roasted').
  if (tags.has('roast')) {
    fat += ROAST_OIL_G_PER_100G;
    kcal += ROAST_OIL_G_PER_100G * KCAL_PER_G_FAT;
  }

  // Dish-type adjustments (documented).
  const type = norm(d.type);
  if (type === 'non-veg') {
    protein *= 1.15;
    kcal += (protein * servings / 100 * 0.15) * KCAL_PER_G_PROTEIN; // energy of the extra protein
  } else if (type === 'vegan') {
    fat *= 0.8;
    kcal -= (fat * servings / 100 * 0.2) * KCAL_PER_G_FAT; // energy removed with the missing dairy fat
  }

  // Sweet energy (documented) — added sugar on top of the cooked base.
  const isSweet = (d.nutrition ?? []).map(norm).some(n => n === 'sweet' || n === 'sugar')
    || [...tags].some(t => SWEET_TAGS.has(t));
  if (isSweet) {
    kcal *= 1.15;
    fat *= 0.9;
  }

  const scale = servings / 100;
  let calories = Math.round(kcal * scale);
  protein = round1(Math.max(0, protein * scale));
  fiber = round1(Math.max(0, fiber * scale));
  fat = round1(Math.max(0, fat * scale));
  calories = Math.max(60, Math.min(1600, calories));

  return { calories, protein, fiber, fat, estimated: true, servingGrams: servings };
}

/** True when the dish shows REAL macro evidence (ingredient rows or
 *  nutrition labels) — i.e. the estimate is grounded, not the default guess. */
export function hasMacroEvidence(d: Dish): boolean {
  return dishIngredientCategories(d).size > 0 || (d.nutrition ?? []).length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISH TASTE — the REAL, measurable taste facts of one DISH_LIBRARY dish.
//
// DATA FACTS (measured on the 679-dish library; honest, no fabrication):
//   · There is NO numeric spice field. Spice is carried by the `tags` array
//     ('spicy' on 68 dishes, 'mild' on 3, 'hot' on 1) PLUS the ingredient
//     evidence (Green Chilli / Red Chili Powder / Chili). This module is the
//     ONE place that reads both.
//   · Cuisine is carried by REAL tags drawn from a fixed regional vocabulary
//     (punjabi, south-indian, chettinad, andhra, kerala, bengali, gujarati,
//     maharashtrian, tamil, hyderabadi, goan, rajasthani, tandoori, udupi,
//     coorg, awadhi, kashmiri, sindhi, mughlai) + `states`.
//   · Ingredients exist on many (not all) variants. Allergy/dislike matching
//     therefore checks name + tags + variant ingredients — the honest maximum
//     the data supports, documented here so a gap is a KNOWN gap.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish, DishVariant } from '../meal/constants/dishLibrary';
import type { SpiceLevel } from './tasteProfile';

const _norm = (s: string): string => (s ?? '').toLowerCase().trim();

/** The REAL regional/cuisine vocabulary carried by DISH_LIBRARY tags. */
export const CUISINE_KEYS: readonly string[] = [
  'punjabi', 'south-indian', 'chettinad', 'andhra', 'kerala', 'bengali',
  'gujarati', 'maharashtrian', 'tamil', 'hyderabadi', 'goan', 'rajasthani',
  'tandoori', 'udupi', 'coorg', 'awadhi', 'kashmiri', 'sindhi', 'mughlai',
  'north-indian', 'south-indian',
] as const;

const CUISINE_SET = new Set(CUISINE_KEYS);

export function dishTags(d: Dish): string[] {
  return (d.tags ?? []).map(_norm);
}

/** The canonical cuisine keys a dish genuinely carries (tags ∩ vocabulary). */
export function dishCuisineKeys(d: Dish): string[] {
  const out = new Set<string>();
  for (const t of dishTags(d)) {
    if (CUISINE_SET.has(t)) out.add(t === 'north-indian' ? 'north-indian' : t);
  }
  // The dish's `region` is a coarse fallback cuisine family (north/south/…).
  if (d.region && d.region !== 'all') out.add(_norm(d.region));
  return [...out];
}

/** Every ingredient name across a dish's variants + its default sides
 *  (used for ALLERGY / DISLIKE matching — a peanut-laden side is a real
 *  exposure even though it is not a recipe ingredient). */
export function dishIngredientNames(d: Dish): string[] {
  return [...dishVariantIngredientNames(d), ...(d.defaultPairings?.sides ?? [])];
}

/** VARIANT-LEVEL ingredient names ONLY — the dish's actual recipe content.
 *  Default sides (Roti / Rice / Salad, shared by nearly every north curry)
 *  are NOT recipe evidence and never used for similarity / affinity. */
export function dishVariantIngredientNames(d: Dish): string[] {
  const names: string[] = [];
  for (const v of d.variants ?? []) {
    for (const i of (v as DishVariant).ingredients ?? []) names.push(i.name);
  }
  return names;
}

/** Ingredient CATEGORY counts (proteins/dairy/spices/…). */
export function dishIngredientCategories(d: Dish): Set<string> {
  const cats = new Set<string>();
  for (const v of d.variants ?? []) {
    for (const i of (v as DishVariant).ingredients ?? []) cats.add(_norm(i.category));
  }
  return cats;
}

const CHILI_INGREDIENT = /chilli|chili|chile|mirch|gunpowder/i;

/** The dish's measured spice level — tag evidence first (the honest surface),
 *  then real chili ingredient evidence, else medium. */
export function dishSpiceLevel(d: Dish): SpiceLevel {
  const tags = dishTags(d);
  if (tags.includes('spicy') || tags.includes('hot') || tags.includes('fiery')) return 'hot';
  if (tags.includes('mild')) return 'mild';
  for (const n of dishIngredientNames(d)) {
    if (CHILI_INGREDIENT.test(n)) return 'hot';
  }
  return 'medium';
}

export function dishIsSpicy(d: Dish): boolean {
  return dishSpiceLevel(d) === 'hot';
}

// ─── Allergy expansion ───────────────────────────────────────────────────────
// A user types a high-level allergen ('peanuts', 'dairy', 'gluten'); the
// library names ingredients precisely ('Peanut Butter', 'Ghee', 'Wheat Flour').
// This map bridges the two — it is the ONLY place that knowledge lives.
export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  peanut: ['peanut', 'groundnut', 'moongphali'],
  peanuts: ['peanut', 'groundnut', 'moongphali'],
  nuts: ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'nut'],
  treenuts: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut'],
  dairy: ['milk', 'butter', 'ghee', 'cream', 'paneer', 'yogurt', 'yoghurt', 'curd', 'cheese', 'buttermilk', 'lassi', 'raita', 'malai', 'khoya', 'milkmaid'],
  milk: ['milk', 'butter', 'ghee', 'cream', 'paneer', 'yogurt', 'curd', 'cheese', 'buttermilk', 'khoya', 'malai'],
  lactose: ['milk', 'butter', 'ghee', 'cream', 'paneer', 'yogurt', 'curd', 'cheese', 'buttermilk'],
  gluten: ['wheat', 'flour', 'atta', 'maida', 'suji', 'semolina', 'barley', 'bread', 'roti', 'naan', 'puri', 'paratha', 'kulcha', 'bhature', 'sooji', 'rava', 'dalia', 'oats'],
  wheat: ['wheat', 'flour', 'atta', 'maida', 'suji', 'semolina', 'bread', 'roti', 'naan', 'puri', 'paratha', 'kulcha', 'bhature', 'rava'],
  egg: ['egg', 'eggs', 'omelette', 'omelet', 'anda'],
  eggs: ['egg', 'eggs', 'omelette', 'omelet', 'anda'],
  soy: ['soy', 'soya', 'tofu', 'edamame'],
  soybean: ['soy', 'soya', 'tofu', 'edamame'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'mussel', 'clam', 'squid'],
  fish: ['fish', 'salmon', 'tuna', 'pomfret', 'rohu', 'hik'],
  sesame: ['sesame', 'til', 'tahini'],
  mustard: ['mustard', 'rai', 'sarson'],
  corn: ['corn', 'makka', 'maize', 'bhutta'],
};

/** Expand ONE user allergen into library-facing keyword needles. */
export function allergenNeedles(allergen: string): string[] {
  const key = _norm(allergen).replace(/[ _-]/g, '');
  const direct = ALLERGEN_KEYWORDS[key];
  if (direct) return direct;
  // Fall back to the raw token itself (a user may type a real ingredient name).
  const raw = _norm(allergen);
  return raw ? [raw] : [];
}

/** The allergen (as the user typed it) this dish contains, or null.
 *  Checks name, tags and ingredient names — the honest maximum. */
export function dishAllergenMatch(d: Dish, allergies: readonly string[]): string | null {
  if (!allergies?.length) return null;
  const hay = [
    _norm(d.name),
    ...dishTags(d),
    ...dishIngredientNames(d).map(_norm),
  ];
  for (const allergy of allergies) {
    const needles = allergenNeedles(allergy);
    if (!needles.length) continue;
    for (const n of needles) {
      // Word-ish containment: the needle must appear as a token/substring.
      if (hay.some(h => h.includes(n))) return allergy;
    }
  }
  return null;
}

/** The disliked item this dish matches (name-level or ingredient-level), or
 *  null. Mirrors mealPersonalization.preferenceScore's dislike semantics but
 *  returns the matched item (for the gate reason + the reasons UI). */
export function dishDislikeMatch(d: Dish, disliked: readonly string[]): string | null {
  if (!disliked?.length) return null;
  const dName = _norm(d.name);
  const ings = new Set(dishIngredientNames(d).map(_norm));
  for (const item of disliked) {
    const it = _norm(item);
    if (!it) continue;
    if (dName === it || dName.includes(it) || it.includes(dName)) return item;
    if (ings.has(it) || [...ings].some(n => n.includes(it) || it.includes(n))) return item;
  }
  return null;
}

/** 0..1 how "mainstream/familiar" a dish reads — the base for novelty scoring.
 *  Familiar = common staples (rice/roti/dal/idli/paratha) and lighter weights;
 *  novel = distinctive regional tags + heavy/rich cooking. Pure. */
export function dishFamiliarity(d: Dish): number {
  const tags = new Set(dishTags(d));
  const common = ['rice', 'roti', 'dal', 'idli', 'dosa', 'paratha', 'curry', 'bread', 'pulao', 'salad', 'chutney'];
  let score = 0;
  for (const c of common) if ([...tags].some(t => t.includes(c))) score += 0.12;
  if (d.weight === 'light') score += 0.1;
  if (d.weight === 'heavy') score -= 0.1;
  const distinctive = ['chettinad', 'andhra', 'kerala', 'coorg', 'hyderabadi', 'goan', 'kashmiri', 'awadhi', 'tandoori', 'mughlai'];
  if (distinctive.some(t => tags.has(t))) score -= 0.15;
  if (tags.has('spicy') || tags.has('traditional')) score -= 0.05;
  return Math.max(0, Math.min(1, 0.5 + score));
}

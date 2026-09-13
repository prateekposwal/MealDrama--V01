// ─────────────────────────────────────────────────────────────────────────────
// VARIETY — the measurable "this is a genuinely different dish" contract.
//
// The rule (spec D): same nutrition → different dish → different cuisine/
// ingredient → appropriate novelty. Two near-duplicate recipes must NOT both
// land in one plan unless the pool forces it (and then the reason is RECORDED).
//
// Three pure measures, all derived from REAL dish data:
//   · nutritionNeighborhood  — the per-100g macro vector (utils/macroEstimator,
//                              the SAME estimator the focus scorer uses)
//   · nutritionSimilarity    — cosine/relative distance between two vectors
//   · cuisineIngredientSimilarity — Jaccard over cuisine keys + ingredient tokens
//   · isNearDuplicate        — the gate-6 predicate (both axes near-identical)
//   · noveltyBudget          — the familiarity/novelty mix per preference
//
// Never random. No Math.random. Deterministic for the same dish pair.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import type { NoveltyPreference } from './tasteProfile';
import { estimateDishMacros } from './macroEstimator';
import { dishCuisineKeys, dishVariantIngredientNames, dishFamiliarity } from './dishTaste';

const _norm = (s: string): string => (s ?? '').toLowerCase().trim();

/** Per-100g macro vector [kcal, protein, fiber, fat] — the nutrition neighborhood. */
export function nutritionNeighborhood(d: Dish): [number, number, number, number] {
  const m = estimateDishMacros(d);
  const g = m.servingGrams > 0 ? m.servingGrams : 100;
  const k = 100 / g;
  return [m.calories * k, m.protein * k, m.fiber * k, m.fat * k];
}

/** 0..1 similarity of two nutrition vectors (1 = identical neighborhood).
 *  Uses a normalized L1 distance with a per-axis reference scale so a 5 kcal
 *  difference never reads as "different" while a fried-vs-steamed gap does. */
export function nutritionSimilarity(a: Dish, b: Dish): number {
  const va = nutritionNeighborhood(a);
  const vb = nutritionNeighborhood(b);
  const scale = [220, 18, 6, 18]; // kcal/100g, g protein, g fiber, g fat reference
  let dist = 0;
  for (let i = 0; i < 4; i++) dist += Math.abs(va[i]! - vb[i]!) / scale[i]!;
  return Math.max(0, 1 - dist / 4);
}

/** The curry-baseline ingredient set — aromatics shared by nearly EVERY
 *  Indian curry (onion/tomato/oil/salt/spices). These are NOT a near-dup
 *  signal: Amritsari Chole and Kadai Mushroom both carry them yet are
 *  genuinely different recipes. The similarity below counts only DISTINCTIVE
 *  ingredients (proteins + signature produce). */
export const AROMATICS_BASELINE: ReadonlySet<string> = new Set(
  ['salt', 'oil', 'water', 'turmeric', 'coriander', 'coriander leaves', 'cumin seeds',
   'ginger', 'garlic', 'ginger garlic paste', 'onion', 'tomato', 'red chilli powder',
   'red chili powder', 'green chilli', 'green chili', 'chilli', 'mustard seeds',
   'curry leaves', 'coriander powder', 'cumin powder', 'garam masala', 'black pepper',
   'asafoetida', 'hing', 'bay leaf', 'cardamom', 'cloves', 'cinnamon', 'sugar',
   'jaggery', 'lemon juice', 'lime', 'oil (for cooking)', 'mustard oil', 'ghee (optional)']
    .map(s => s.toLowerCase()),
);

/** Jaccard over cuisine keys AND DISTINCTIVE ingredient tokens (a
 *  recipe-near-dup signal). Distinctive ingredients are weighted ×2.3 vs
 *  cuisine (a dish family is defined by WHAT you cook, not its origin name). */
export function cuisineIngredientSimilarity(a: Dish, b: Dish): number {
  const ca = new Set(dishCuisineKeys(a).map(_norm));
  const cb = new Set(dishCuisineKeys(b).map(_norm));
  const distinctive = (n: string): boolean => !AROMATICS_BASELINE.has(n);
  // VARIANT ingredients only — default sides are universal accompaniments and
  // must never make two different curries look like the same recipe.
  const ingA = new Set(dishVariantIngredientNames(a).map(_norm).filter(n => n && distinctive(n)));
  const ingB = new Set(dishVariantIngredientNames(b).map(_norm).filter(n => n && distinctive(n)));
  const jaccard = (x: Set<string>, y: Set<string>): number => {
    if (x.size === 0 || y.size === 0) return 0;
    let inter = 0;
    for (const v of x) if (y.has(v)) inter++;
    return inter / (x.size + y.size - inter);
  };
  return 0.7 * jaccard(ingA, ingB) + 0.3 * jaccard(ca, cb);
}

/** Near-duplicate thresholds (documented, pinned by tests). The 0.6
 *  cuisine/ingredient floor requires BOTH shared distinctive ingredients and
 *  a shared cuisine family — a same-recipe pair (Chole vs Amritsari Chole)
 *  clears it; two different curries sharing only the aromatics baseline do
 *  not. */
export const NEAR_DUP_NUTRITION = 0.92;
export const NEAR_DUP_CUISINE_ING = 0.6;

/** Gate-6 predicate: two dishes are near-duplicates when BOTH the nutrition
 *  neighborhood AND the cuisine/ingredient profile are near-identical. */
export function isNearDuplicate(a: Dish, b: Dish): boolean {
  if (a.id === b.id) return true;
  return nutritionSimilarity(a, b) >= NEAR_DUP_NUTRITION
    && cuisineIngredientSimilarity(a, b) >= NEAR_DUP_CUISINE_ING;
}

/** The novelty budget (0 familiar .. 1 adventurous) per preference — the weight
 *  the scorer puts on "novel" vs "familiar" for this user. NEVER random. */
export function noveltyBudget(pref: NoveltyPreference): number {
  switch (pref) {
    case 'familiar': return 0.15;
    case 'adventurous': return 0.85;
    default: return 0.5;
  }
}

/** How novel a dish is FOR THIS USER: low familiarity (dishFamiliarity) and
 *  no overlap with the user's cuisine affinities reads as novel. 0..1. */
export function dishNoveltyForUser(d: Dish, cuisineAffinities: readonly string[] = []): number {
  const base = 1 - dishFamiliarity(d);
  const aff = new Set(cuisineAffinities.map(_norm));
  const overlaps = dishCuisineKeys(d).some(c => aff.has(_norm(c)));
  return Math.max(0, Math.min(1, overlaps ? base * 0.35 : base));
}

/** The variety/novelty score for one dish under a preference + affinities.
 *  familiar → reward familiarity; adventurous → reward novelty; balanced →
 *  mild both. Bounded to ±1.2 so it re-orders without dominating gates. */
export function noveltyScore(
  d: Dish,
  pref: NoveltyPreference,
  cuisineAffinities: readonly string[] = [],
): number {
  const budget = noveltyBudget(pref);
  const novelty = dishNoveltyForUser(d, cuisineAffinities);
  const familiarity = 1 - novelty;
  // Amplitude 2.6 → the novelty axis spans ±0.91, enough to measurably
  // re-rank the top band between an adventurous and a familiar user while
  // staying below the focus spread (≳8) and hard penalties (2–3).
  return 2.6 * (budget * novelty + (1 - budget) * familiarity) - 1.3;
}

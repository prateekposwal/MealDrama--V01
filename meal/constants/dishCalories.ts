// ─────────────────────────────────────────────────────────────────────────────
// Dish calorie lookups — per-serving (kcal) reference for the Health Insight
// popup. Values are ESTIMATES from standard nutrition references for the dish
// and its typical serving, NOT lab measurements. The curated map holds ONLY
// live dish ids (every key resolves in DISH_LIBRARY — guarded by
// scripts/validateDataIntegrity.mjs + tests/dataIntegrity.test.ts). They let the "Today's
// calories" total compute for the whole library while staying honest: any dish
// without a curated entry gets a deterministic estimate from its weight/type/
// category, and dishes that still can't be judged return undefined (the UI
// then shows the approximate/unknown states it already handles).
// ─────────────────────────────────────────────────────────────────────────────

import type { Dish } from './dishLibrary';

/** Curated per-serving kcal for common/named dishes (base dish id → kcal). */
export const DISH_CALORIES: Record<string, number> = {
  'butter-chicken-wala': 480,
  'kulfi': 320,
  'aloo-paratha': 350,
  'chicken-biryani': 550,
  'mutton-biryani': 600,
  'paneer-butter-masala': 460,
  'tandoori-chicken': 340,
  'chana-masala': 240,
  'idli': 120,
  'dosa': 350,
  'samosa': 260,
  'kachori': 280,
  'pav-bhaji': 450,
  'vada-pav': 350,
  'uttapam': 300,
  'chicken-tikka': 300,
  'andhra-chicken-curry': 420,
  'kerala-fish-curry': 320,
  'chettinad-egg-masala': 300,
  'hyderabadi-biryani': 560,
  'kadai-paneer': 420,
  'lemon-rice': 260,
  'curd-rice': 230,
  'tamarind-rice': 280,
  'pongal': 300,
  'rasam': 100,
  'gulab-jamun': 150,
  'rasgulla': 160,
  'barfi': 180,
  'ladoo': 160,
  'sheer-khurma': 320,
  'gobi-manchurian': 380,
  'chow-mein': 400,
  'manchow-soup': 140,
  'dhokla': 180,
  'khandvi': 150,
  'methi-thepla': 200,
  'fafda-jalebi': 500,
  'undhiyu': 300,
  'chingri-malai': 340,
};

/** Deterministic estimate when a dish has no curated entry (never random). */
export function getDishCalories(dish: Dish): number | undefined {
  return getDishCalorieInfo(dish)?.kcal;
}

/** True when the value came from the curated map or an explicit field (safer than the weight fallback). */
export function isDishCalorieCurated(dish: Dish): boolean {
  if (typeof dish.calories === 'number' && isFinite(dish.calories) && dish.calories > 0) return true;
  return DISH_CALORIES[dish.id] !== undefined;
}

/** Value + provenance for the calorie tally (helps mark estimate-based totals approximate). */
export function getDishCalorieInfo(dish: Dish): { kcal: number; estimated: boolean } | undefined {
  if (typeof dish.calories === 'number' && isFinite(dish.calories) && dish.calories > 0) {
    return { kcal: dish.calories, estimated: false }; // explicit wins
  }
  const curated = DISH_CALORIES[dish.id];
  if (curated) return { kcal: curated, estimated: true }; // reference estimate, not a lab measurement

  // Category/weight/type-based estimate as an honest default.
  const cats = (dish.category || []).map(c => c.toLowerCase());
  const isSweet = (dish.nutrition || []).includes('sweet') || /sweet|halwa|kheer|payasam|barfi|ladoo|jalebi|gulab|rasgulla|malpua|cake|cookie|brownie|muffin/i.test(dish.name);
  const isDrink = /lassi|chai|sharbat|juice|smoothie|buttermilk|shake|soup|water|chaas|milk$|coffee|tea/i.test(dish.name) || cats.some(c => /beverage|drink/.test(c));
  const isBread = /paratha|naan|roti|poori|bhatura|thepla|tandoori-roti|puri|parotta|bread/i.test(dish.name) || cats.some(c => /bread/.test(c));

  const weight = dish.weight || 'medium';
  const baseWeight: Record<string, number> = { light: 200, medium: 350, heavy: 520 };
  let est = baseWeight[weight] ?? 350;

  if (isDrink) est = /soup|water|chaas|lassi/i.test(dish.name) ? 110 : 220;
  else if (isSweet) est = weight === 'heavy' ? 420 : 300;
  else if (isBread) est = weight === 'heavy' ? 420 : 300;
  else if (cats.some(c => /snacks|starter|appetizer/.test(c))) est = Math.round(est * 0.7);
  else if (cats.some(c => /breakfast/.test(c))) est = Math.round(est * 0.85);

  if (dish.type === 'non-veg' && !isDrink && !isSweet) est = Math.round(est * 1.15);
  if (dish.region === 'northeast' && !isDrink && !isSweet) est = Math.round(est * 1.1);

  return { kcal: Math.max(60, Math.round(est)), estimated: true };
}
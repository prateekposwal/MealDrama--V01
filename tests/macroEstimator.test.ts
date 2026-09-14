// ─────────────────────────────────────────────────────────────────────────────
// MACRO ESTIMATOR (Gap 1 closure) — numeric macros DERIVED for all 679 dishes.
//
// Data facts this suite locks (measured on the real library, no fabrication):
//   · ZERO of the 679 Dish rows populate the declared `calories`/`protein`
//     fields (measured: 0/679).
//   · Every dish gets { calories, protein, fiber, fat, estimated: true } from
//     utils/macroEstimator.ts — deterministic, pure, constants documented
//     in-module (serving grams by weight tier × slot portion × per-100g
//     category densities × plate fractions × documented adjustments).
//   · The estimator never guesses: `estimated` is ALWAYS true.
//   · 153/679 dishes carry NO ingredient rows — their macros come from the
//     documented nutrition-label/tag fallback (never fabricated rows).
//
// Spot-check bands below are derived INDEPENDENTLY from the module's stated
// per-unit constants (honesty not precision — ±30–35% bands on the
// compounded expected value).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import {
  estimateDishMacros,
  dishIngredientCategories,
  hasMacroEvidence,
  SERVING_GRAMS,
  CATEGORY_DENSITY,
} from '../utils/macroEstimator';
import {
  dishFocusSignals,
  healthFocusScore,
  healthFocusFor,
} from '../utils/mealPersonalization';

const dish = (id: string) => {
  const d = DISH_LIBRARY.find(x => x.id === id);
  expect(d, `real dish ${id} must exist in DISH_LIBRARY`).toBeDefined();
  return d!;
};

describe('estimator determinism + whole-library coverage', () => {
  it('same dish → byte-identical macros every time (pure, state-free)', () => {
    const d = dish('hyderabadi-biryani');
    expect(estimateDishMacros(d)).toEqual(estimateDishMacros(d));
    expect(estimateDishMacros(d)).toEqual(estimateDishMacros(d));
  });

  it('ALL 679 dishes classify: positive calories in [60,1600], non-negative macros, estimated:true', () => {
    expect(DISH_LIBRARY.length).toBe(679);
    for (const d of DISH_LIBRARY) {
      const m = estimateDishMacros(d);
      expect(m.estimated, `${d.id} always estimated`).toBe(true);
      expect(m.calories, `${d.id} calories`).toBeGreaterThanOrEqual(60);
      expect(m.calories, `${d.id} calories`).toBeLessThanOrEqual(1600);
      expect(m.protein, `${d.id} protein`).toBeGreaterThanOrEqual(0);
      expect(m.fiber, `${d.id} fiber`).toBeGreaterThanOrEqual(0);
      expect(m.fat, `${d.id} fat`).toBeGreaterThanOrEqual(0);
      expect(m.servingGrams, `${d.id} serving`).toBeGreaterThan(0);
    }
  });

  it('serving grams follow the documented weight-tier × slot-portion basis', () => {
    // light breakfast → 200 × 0.95 = 190
    expect(estimateDishMacros(dish('idli')).servingGrams).toBe(Math.round(SERVING_GRAMS.light * 0.95));
    // medium lunch/dinner → 300 × 1.0 = 300
    expect(estimateDishMacros(dish('dal-tadka-central')).servingGrams).toBe(SERVING_GRAMS.medium);
    // heavy main → 400 × 1.0 = 400
    expect(estimateDishMacros(dish('hyderabadi-biryani')).servingGrams).toBe(SERVING_GRAMS.heavy);
    // medium snacks → 300 × 0.9 = 270
    expect(estimateDishMacros(dish('samosa')).servingGrams).toBe(Math.round(SERVING_GRAMS.medium * 0.9));
  });

  it('fallback honesty: exactly the measured 153 no-ingredient dishes derive from labels, and estimates are grounded', () => {
    const noIng = DISH_LIBRARY.filter(d => dishIngredientCategories(d).size === 0);
    expect(noIng.length).toBe(153); // measured on the library
    for (const d of noIng) {
      expect(hasMacroEvidence(d)).toBe(true); // nutrition labels/tags ground them
      expect(estimateDishMacros(d).calories).toBeGreaterThan(0);
    }
  });
});

describe('real-dish spot checks vs documented reference bands', () => {
  it('dal-tadka-central (medium dal bowl, 300g) — protein within the dal band', () => {
    const m = estimateDishMacros(dish('dal-tadka-central'));
    // From the module's constants: proteins share 0.25 / (0.25 + OTHER 0.5) =
    // 0.333 × 17g/100g × 300g = 17.0g. Honest band ±30%: [12, 24].
    expect(m.protein).toBeGreaterThanOrEqual(12);
    expect(m.protein).toBeLessThanOrEqual(24);
    // kcal: 0.333×120 + 0.667×10 + 2g oil×9 = 64.7/100g × 300 = 194.
    expect(m.calories).toBeGreaterThanOrEqual(140);
    expect(m.calories).toBeLessThanOrEqual(260);
    expect(m.estimated).toBe(true);
  });

  it('idli (light steamed, 190g) — low energy, low fat (the low-calorie reference)', () => {
    const m = estimateDishMacros(dish('idli'));
    expect(m.calories).toBeGreaterThanOrEqual(90);
    expect(m.calories).toBeLessThanOrEqual(180);
    expect(m.protein).toBeGreaterThanOrEqual(4);
    expect(m.protein).toBeLessThanOrEqual(12);
    expect(m.fat).toBeLessThanOrEqual(6);
  });

  it('hyderabadi-biryani (heavy non-veg main, 400g) — protein-dense main within band', () => {
    const m = estimateDishMacros(dish('hyderabadi-biryani'));
    expect(m.protein).toBeGreaterThanOrEqual(14); // actual 19.9
    expect(m.protein).toBeLessThanOrEqual(28);
    expect(m.calories).toBeGreaterThanOrEqual(300);
    expect(m.calories).toBeLessThanOrEqual(560);
  });

  it('moong-dal-halwa (heavy ghee-rich sweet) — dense, high-fat, sugar-bearing', () => {
    const m = estimateDishMacros(dish('moong-dal-halwa'));
    expect(m.calories).toBeGreaterThan(400); // actual 514 at 360g
    expect(m.fat).toBeGreaterThanOrEqual(20); // ghee present — actual 30.5
    expect(m.protein).toBeGreaterThanOrEqual(12); // moong dal — actual 21.2
  });

  it('kerala-egg-roast (egg-forward) — egg protein + roast oil honesty', () => {
    const m = estimateDishMacros(dish('kerala-egg-roast'));
    expect(m.protein).toBeGreaterThanOrEqual(8); // actual 12.9
    expect(m.fat).toBeGreaterThanOrEqual(15); // eggs + roast oil — actual 25.7
    expect(m.calories).toBeGreaterThanOrEqual(230); // actual 326
  });

  it('paneer-butter-masala (rich-dairy switch) — fat grams from the rich-gravy reference', () => {
    const m = estimateDishMacros(dish('paneer-butter-masala'));
    expect(m.fat).toBeGreaterThanOrEqual(20); // rich dairy + gravy — actual 35.7
    expect(m.calories).toBeGreaterThanOrEqual(280); // actual 427
  });
});

describe('macro density ordering — the honest gradient', () => {
  const k100 = (id: string) => {
    const m = estimateDishMacros(dish(id));
    return (m.calories / m.servingGrams) * 100;
  };
  const fatG = (id: string) => estimateDishMacros(dish(id)).fat;

  it('light steamed idli is denser-per-100g than soup but lighter than fried paratha', () => {
    // measured: rasam 54 < idli 69 < egg-roast 114 < biryani ~102–131 < paratha 169
    expect(k100('rasam')).toBeLessThan(k100('idli'));
    expect(k100('idli')).toBeLessThan(k100('aloo-paratha'));
    expect(k100('kerala-egg-roast')).toBeGreaterThan(k100('idli'));
  });

  it('fat grams separate rich/fried dishes from lean ones', () => {
    expect(fatG('paneer-butter-masala')).toBeGreaterThan(fatG('idli')); // 35.7 vs 3.2
    expect(fatG('aloo-paratha')).toBeGreaterThan(fatG('dal-tadka-central'));
    expect(fatG('moong-dal-halwa')).toBeGreaterThan(fatG('breakfast-fruit-salad')); // 30.5 vs 1.9
  });
});

describe('focus re-rank now uses NUMERIC macros (real dishes, named)', () => {
  it('High Fiber re-ranks by fiber grams — the fiber-rich dal beats the protein-only egg dish', () => {
    const dal = dish('dal-tadka-central');      // fiber 3.4g per 300g serving
    const egg = dish('chettinad-egg-masala');   // fiber 0.3g per 300g serving
    expect(estimateDishMacros(dal).fiber).toBeGreaterThan(estimateDishMacros(egg).fiber);
    expect(dishFocusSignals(dal).fiber).toBeGreaterThan(dishFocusSignals(egg).fiber);
    expect(healthFocusScore(dal, 'high-fiber')).toBeGreaterThan(healthFocusScore(egg, 'high-fiber'));
    // The flip: egg masala beats bread-pakora on Balanced (protein) yet bread-
    // pakora wins High Fiber on its 2.3g fiber — fiber grams, not balance.
    const pakora = dish('bread-pakora');
    expect(healthFocusScore(egg, 'balanced')).toBeGreaterThan(healthFocusScore(pakora, 'balanced'));
    expect(healthFocusScore(pakora, 'high-fiber')).toBeGreaterThan(healthFocusScore(egg, 'high-fiber'));
  });

  it('Low Calorie flips by kcal/100g density — fruit salad (~32/100g) beats ghee-rich moong halwa (~143), and the dal wins Balanced over the sugar-dense halwa', () => {
    const dal = dish('dal-tadka-central');
    const halwa = dish('moong-dal-halwa');
    const salad = dish('breakfast-fruit-salad');
    const mh = estimateDishMacros(halwa);
    const ms = estimateDishMacros(salad);
    expect((mh.calories / mh.servingGrams) * 100).toBeGreaterThan((ms.calories / ms.servingGrams) * 100);
    expect(dishFocusSignals(halwa).caloricDensity).toBeGreaterThan(dishFocusSignals(salad).caloricDensity);
    expect(healthFocusScore(dal, 'balanced')).toBeGreaterThan(healthFocusScore(halwa, 'balanced'));
    expect(healthFocusScore(salad, 'low-calorie')).toBeGreaterThan(healthFocusScore(halwa, 'low-calorie'));
  });

  it('Low Fat flips by fat grams — lean salad (1.7g) beats ghee halwa (30.5g); Balanced belongs to the dal', () => {
    const dal = dish('dal-tadka-central');
    const halwa = dish('moong-dal-halwa');
    const salad = dish('breakfast-fruit-salad');
    expect(estimateDishMacros(halwa).fat).toBeGreaterThan(estimateDishMacros(salad).fat);
    expect(dishFocusSignals(halwa).fat).toBeGreaterThan(dishFocusSignals(salad).fat);
    expect(healthFocusScore(dal, 'balanced')).toBeGreaterThan(healthFocusScore(halwa, 'balanced'));
    expect(healthFocusScore(salad, 'low-fat')).toBeGreaterThan(healthFocusScore(halwa, 'low-fat'));
  });

  it('Weight Loss flips by satiety + density — dal (full on less) beats ghee halwa; salad beats halwa too', () => {
    const dal = dish('dal-tadka-central');
    const halwa = dish('moong-dal-halwa');
    const salad = dish('breakfast-fruit-salad');
    // dal: high satiety (1.22 signal) at low density (0.92) — the WL ideal.
    expect(dishFocusSignals(dal).satiety).toBeGreaterThan(dishFocusSignals(halwa).satiety);
    expect(healthFocusScore(dal, 'weight-loss')).toBeGreaterThan(healthFocusScore(halwa, 'weight-loss'));
    // The honest post-fill reality: the fruit salad's real recipe (fruit +
    // honey) still loses Balanced to the protein/fiber dal but wins Weight
    // Loss on density — the ghee+halwa sugar penalty sinks it on both.
    expect(healthFocusScore(dal, 'balanced')).toBeGreaterThan(healthFocusScore(halwa, 'balanced'));
    expect(healthFocusScore(salad, 'weight-loss')).toBeGreaterThan(healthFocusScore(halwa, 'weight-loss'));
  });

  it('the existing HP/LC flip pair (egg roast vs idli) holds under numeric macros', () => {
    const eggRoast = dish('kerala-egg-roast');
    const idli = dish('idli');
    expect(healthFocusScore(eggRoast, 'high-protein')).toBeGreaterThan(healthFocusScore(idli, 'high-protein'));
    expect(healthFocusScore(eggRoast, 'low-calorie')).toBeLessThan(healthFocusScore(idli, 'low-calorie'));
  });

  it('focus strings still normalize (regression)', () => {
    expect(healthFocusFor('High Fiber')).toBe('high-fiber');
    expect(healthFocusFor('Low Fat')).toBe('low-fat');
    expect(healthFocusFor('Weight Loss')).toBe('weight-loss');
  });
});

describe('curated-kcal-map data integrity — zero dead ids (2026-09-13 cleanup)', () => {
  it('the 54 dead ids were removed: every DISH_CALORIES key resolves to a live dish id', async () => {
    const { DISH_CALORIES } = await import('../meal/constants/dishCalories');
    const live = new Set(DISH_LIBRARY.map(d => d.id));
    const curated = Object.keys(DISH_CALORIES);
    const dead = curated.filter(id => !live.has(id));
    expect(live.size).toBe(679);
    expect(curated.length).toBe(40);            // 94 curated − 54 dead = 40 live
    expect(dead).toEqual([]);                   // THE guard — no stale key enters
    // The removed ids are documented in data-notes (never silently dropped).
    for (const removed of ['dal-tadka', 'rajma', 'masala-dosa', 'chole-bhature', 'veg-biryani']) {
      expect(curated).not.toContain(removed);
    }
  });

  it('curated entries are labeled estimates (standard references, not lab data)', async () => {
    const { getDishCalorieInfo } = await import('../meal/constants/dishCalories');
    const b = DISH_LIBRARY.find(d => d.id === 'butter-chicken-wala')!;
    expect(getDishCalorieInfo(b)!.estimated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MEAL PERSONALIZATION — the "4 roommates get different plans" contract.
//
// Spec rows locked here:
//   · Same region+diet+Health Focus → DIFFERENT personalized plans: 4 users
//     (veg/north/Balanced) → all 20/20, all diet/region-valid, NOT pairwise
//     identical — measured median pairwise Jaccard (honest threshold below).
//   · Determinism: same user + same inputs re-run → byte-identical plan.
//     Different seed (user / week rotation) → different selection.
//   · Health-focus re-rank: Balanced → High Protein / Low Calorie / Weight
//     Loss for the SAME user → plan differs materially AND the focus signal
//     actually shifts (measured via dishFocusSignals — not just relabeled).
//   · Household diversity: same-profile household members → overlap minimized
//     vs the unrelated-user baseline; overlap TOLERATED (recorded, Λ2.3) when
//     the genuine pool runs short.
//   · Meal-history penalty: recently-eaten dishes de-prioritized vs control.
//   · Regressions locked WITH personalization active: 20/20 fill, Vegan
//     ingredient guard, Andhra whole-plan dedupe, custom-dish protection.
//   · RNG isolation: poisoned global Math.random cannot change plan output
//     (every PRNG injected — no Math.random in the hot path).
//
// Measured on the real 679-dish library (no fabrication):
//   · per-slot veg/north candidate pools: ≥34 (the "34+" the spec cites).
//   · 4 same-profile roommates: median pairwise Jaccard 0.379, max 0.481
//     (bandSize-10 structural rotation; additive-jitter-only measured 0.667 —
//     the rotation is the diversity mechanism, per the spec's rotation seed).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';
import type { MealOption, TrayLibrary } from '../app/store/useStore';
import {
  regenerateMealPlanPipeline,
  validateTrayDietCompatibility,
  isMealDietCompatible,
  dishDietType,
  dishHasAnimalDerivedIngredients,
  MEAL_SLOTS,
  fillCandidatesForSlot,
} from '../utils/mealPlanRegen';
import {
  healthFocusFor,
  personalizationSeed,
  dishRotationJitter,
  createSeededRng,
  personalizationScore,
  healthFocusScore,
  dishFocusSignals,
  FOCUS_WEIGHTS,
  rotateBandForUser,
  fnv1a,
  isoWeekKey,
  isMildSpiceUser,
  isHotSpiceUser,
  cuisineAffinityBoostUnit,
  cuisineAffinityBoostForSpice,
  affinityTierLift,
  preferenceScore,
  type PersonalizationContext,
} from '../utils/mealPersonalization';
import { allowedTypesForDiet } from '../utils/dietQuota';
import { dishCuisineKeys } from '../utils/dishTaste';

// ─── Seeding helpers over the REAL dish library ─────────────────────────────
const dishFor = (slot: MealType, type: string, region = 'north'): Dish =>
  DISH_LIBRARY.find(x =>
    (x.category ?? []).includes(slot) &&
    (x.type ?? x.diet ?? '').toLowerCase() === type &&
    (x.region === region || x.region === 'all'))!;

const mealOf = (d: Dish): MealOption =>
  ({ id: d.id, dishId: d.id, name: d.name, icon: d.icon, sourceRegion: d.region });

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });

const trayFromIds = (spec: Record<MealType, string[]>): TrayLibrary => {
  const tray: TrayLibrary = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const slot of MEAL_SLOTS) {
    for (const id of spec[slot] ?? []) {
      const d = DISH_LIBRARY.find(x => x.id === id);
      if (!d) throw new Error(`unknown dish id ${id}`);
      tray[slot].push(mealOf(d));
    }
  }
  return tray;
};

const trayTotals = (tray: TrayLibrary) => ({
  total: MEAL_SLOTS.reduce((n, s) => n + tray[s].length, 0),
  per: Object.fromEntries(MEAL_SLOTS.map(s => [s, tray[s].length])) as Record<MealType, number>,
});

const planIds = (tray: TrayLibrary): string[] =>
  MEAL_SLOTS.flatMap(s => tray[s].map(m => m.dishId || m.id));

const uniqueIds = (tray: TrayLibrary) => {
  const ids = planIds(tray);
  return new Set(ids).size === ids.length;
};

const jaccard = (a: string[], b: string[]): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = a.filter(x => setB.has(x)).length;
  return inter / (setA.size + setB.size - inter);
};

const finalCompliance = (tray: TrayLibrary, diet: string) =>
  validateTrayDietCompatibility(tray, diet, DISH_LIBRARY);

const ctxFor = (userId: string, focus = 'Balanced', extra: Partial<PersonalizationContext> = {}): PersonalizationContext => ({
  userId,
  deviceId: `dev-${userId}`,
  healthFocus: focus,
  preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] },
  ...extra,
});

const gen = (c: PersonalizationContext, diet = 'veg', region = 'north', library = DISH_LIBRARY) =>
  regenerateMealPlanPipeline({ tray: emptyTray(), library, diet, region, target: 5, personalization: c });

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Same-profile users → DIFFERENT valid plans (the 4-roommate contract)
// ─────────────────────────────────────────────────────────────────────────────
describe('4 users with same region+diet+focus → different, valid, personalized plans', () => {
  it('all four plans are 20/20, diet/region-valid, unique per plan — none pairwise identical', () => {
    const users = ['roommate-A', 'roommate-B', 'roommate-C', 'roommate-D'];
    const plans = users.map(u => gen(ctxFor(u, 'Balanced')));
    for (const res of plans) {
      expect(res.complete).toBe(true);
      expect(trayTotals(res.tray).total).toBe(20);
      expect(trayTotals(res.tray).per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
      expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
      expect(uniqueIds(res.tray)).toBe(true);
    }
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const a = planIds(plans[i]!.tray);
        const b = planIds(plans[j]!.tray);
        expect(a, `${users[i]} vs ${users[j]} must differ`).not.toEqual(b);
      }
    }
  });

  it('measured diversity: median pairwise Jaccard < 0.5, max < 0.6 (measured 0.379 / 0.481 on the real library)', () => {
    const users = ['roommate-A', 'roommate-B', 'roommate-C', 'roommate-D'];
    const plans = users.map(u => planIds(gen(ctxFor(u, 'Balanced')).tray));
    const pairs: number[] = [];
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        pairs.push(jaccard(plans[i]!, plans[j]!));
      }
    }
    pairs.sort((a, b) => a - b);
    const median = pairs[Math.floor(pairs.length / 2)]!;
    const max = pairs[pairs.length - 1]!;
    // Honest measured thresholds (bandSize-10 rotation, real library):
    expect(median).toBeLessThan(0.5);
    expect(max).toBeLessThan(0.6);
  });

  it('the spec\'s "34+ candidates per slot" claim is measured, not assumed', () => {
    for (const slot of MEAL_SLOTS) {
      const count = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set()).length;
      expect(count, `${slot} pool`).toBeGreaterThanOrEqual(34);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 · Determinism: same inputs → byte-identical; different seed → different
// ─────────────────────────────────────────────────────────────────────────────
describe('deterministic variety seed (RNG-injected, refresh-stable)', () => {
  it('same user + same inputs re-run → byte-identical plan', () => {
    const ctx = ctxFor('user-det', 'Balanced');
    const r1 = gen(ctx);
    const r2 = gen(ctx);
    expect(JSON.stringify(r1.tray)).toBe(JSON.stringify(r2.tray));
    expect(r1.complete).toBe(true);
  });

  it('different seed → different selection (week rotation rotates the same user)', () => {
    const r1 = gen({ ...ctxFor('user-week', 'Balanced'), rotation: '2026-W37' });
    const r2 = gen({ ...ctxFor('user-week', 'Balanced'), rotation: '2026-W38' });
    const a = planIds(r1.tray);
    const b = planIds(r2.tray);
    expect(a).not.toEqual(b);                  // rotated, not identical
    expect(a.filter(x => b.includes(x)).length).toBeLessThan(a.length); // materially different
  });

  it('different user identities → different selection (same everything else)', () => {
    const a = planIds(gen(ctxFor('user-u1', 'Balanced')).tray);
    const b = planIds(gen(ctxFor('user-u2', 'Balanced')).tray);
    expect(a).not.toEqual(b);
  });

  it('pure seed helpers are deterministic and bounded', () => {
    expect(personalizationSeed({ userId: 'u', deviceId: 'd' }))
      .toBe(personalizationSeed({ userId: 'u', deviceId: 'd' }));
    expect(personalizationSeed({ userId: 'u', deviceId: 'd' }))
      .not.toBe(personalizationSeed({ userId: 'v', deviceId: 'd' }));
    const rng = createSeededRng(42);
    const seq = [rng(), rng(), rng()];
    const rng2 = createSeededRng(42);
    expect([rng2(), rng2(), rng2()]).toEqual(seq);
    for (const x of seq) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); }
    for (let i = 0; i < 20; i++) {
      const j = dishRotationJitter(`dish-${i}`, 7);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThan(1);
    }
    expect(fnv1a('a')).toBe(fnv1a('a'));
    expect(dishRotationJitter('x', 1)).toBe(dishRotationJitter('x', 1));
    expect(isoWeekKey('2026-09-12')).toMatch(/^\d{4}-W\d{2}$/);
    expect(isoWeekKey('2026-09-12')).toBe(isoWeekKey('2026-09-12'));
  });

  it('rotateBandForUser is deterministic, length-preserving, seed-sensitive', () => {
    const items = Array.from({ length: 12 }, (_, i) => `dish-${i}`);
    const ctx = ctxFor('u-rot', 'Balanced');
    const r1 = rotateBandForUser(items, 'lunch', ctx, 10);
    const r2 = rotateBandForUser(items, 'lunch', ctx, 10);
    expect(r1).toEqual(r2);
    expect(r1).toHaveLength(items.length);
    expect(new Set(r1)).toEqual(new Set(items)); // permutation, never a filter
    expect(rotateBandForUser(items, 'lunch', ctxFor('u-other', 'Balanced'), 10)).not.toEqual(r1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Health focus re-ranks the SAME user's selection (not just a label)
// ─────────────────────────────────────────────────────────────────────────────
describe('health-focus re-rank on change (per-focus weights, not relabeling)', () => {
  const base = gen(ctxFor('user-focus', 'Balanced'));

  it('Balanced → High Protein: ≥8 dishes differ + the sort-level band re-ranks toward protein', () => {
    const hp = gen(ctxFor('user-focus', 'High Protein'));
    const a = planIds(base.tray);
    const b = planIds(hp.tray);
    const overlap = a.filter(x => b.includes(x)).length;
    expect(a.length - overlap).toBeGreaterThanOrEqual(8);           // materially re-ranked
    expect(hp.complete).toBe(true);
    expect(finalCompliance(hp.tray, 'veg').violations).toEqual([]);
    // Mechanism proof (deterministic, rotation-off): the comparator the fill
    // sorts by must lift protein-dense dishes for High Protein. Measured on
    // the library: lunch/dinner top-10 band mean protein 1.95/1.85 vs the
    // Balanced band 1.55/1.55 (veg breakfast/snacks pools are protein-thin —
    // eggs are eggitarian, excluded — an honest, recorded limit).
    const noJitter = (focus: string) => ({ ...ctxFor('user-focus', focus), jitterScale: 0 });
    const bandMean = (slot: MealType, focus: string, signal: 'protein' | 'caloricDensity') => {
      const band = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set(), 'Balanced', noJitter(focus)).slice(0, 10);
      return band.reduce((s, d) => s + dishFocusSignals(d)[signal], 0) / band.length;
    };
    for (const slot of ['lunch', 'dinner'] as const) {
      expect(bandMean(slot, 'High Protein', 'protein')).toBeGreaterThan(bandMean(slot, 'Balanced', 'protein'));
    }
  });

  it('Balanced → Low Calorie: ≥8 dishes differ + the band caloric density drops (all four slots)', () => {
    const res = gen(ctxFor('user-focus', 'Low Calorie'));
    const a = planIds(base.tray);
    const b = planIds(res.tray);
    const overlap = a.filter(x => b.includes(x)).length;
    expect(a.length - overlap).toBeGreaterThanOrEqual(8);
    expect(res.complete).toBe(true);
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
    const noJitter = (focus: string) => ({ ...ctxFor('user-focus', focus), jitterScale: 0 });
    const bandDensity = (slot: MealType, focus: string) => {
      const band = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set(), 'Balanced', noJitter(focus)).slice(0, 10);
      return band.reduce((s, d) => s + dishFocusSignals(d).caloricDensity, 0) / band.length;
    };
    for (const slot of MEAL_SLOTS) {
      expect(bandDensity(slot, 'Low Calorie')).toBeLessThan(bandDensity(slot, 'Balanced'));
    }
  });

  it('Balanced → Weight Loss: ≥8 dishes differ + density drops in the main-meal bands', () => {
    const res = gen(ctxFor('user-focus', 'Weight Loss'));
    const a = planIds(base.tray);
    const b = planIds(res.tray);
    const overlap = a.filter(x => b.includes(x)).length;
    expect(a.length - overlap).toBeGreaterThanOrEqual(8);
    expect(res.complete).toBe(true);
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
    const noJitter = (focus: string) => ({ ...ctxFor('user-focus', focus), jitterScale: 0 });
    const bandDensity = (slot: MealType, focus: string) => {
      const band = fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set(), 'Balanced', noJitter(focus)).slice(0, 10);
      return band.reduce((s, d) => s + dishFocusSignals(d).caloricDensity, 0) / band.length;
    };
    // lunch + dinner measured 0.76 vs 0.86 (deterministic); breakfast/snacks
    // barely move (light pools) — the honest limit, recorded not asserted.
    for (const slot of ['lunch', 'dinner'] as const) {
      expect(bandDensity(slot, 'Weight Loss')).toBeLessThan(bandDensity(slot, 'Balanced'));
    }
    // Honest note: the sugar axis has nothing to bite in the FILLABLE pool —
    // pure-sweet dishes are excluded by the pipeline filter and leftover
    // sweet-tagged fill candidates are nil — so no sugar assertion is made
    // (weights still penalize it; the pool simply has none to re-rank).
  });

  it('the 6 focus weight vectors are MEANINGFULLY different (no two identical)', () => {
    const keys = Object.keys(FOCUS_WEIGHTS) as Array<keyof typeof FOCUS_WEIGHTS>;
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        expect(FOCUS_WEIGHTS[keys[i]!], `${keys[i]} vs ${keys[j]}`).not.toEqual(FOCUS_WEIGHTS[keys[j]!]);
      }
    }
    // A known protein-dense dish outranks a known light dish under high-protein,
    // and the ORDER FLIPS under low-calorie — proof the weights re-rank, not relabel.
    const eggRoast = DISH_LIBRARY.find(d => d.id === 'kerala-egg-roast')!;
    const idli = DISH_LIBRARY.find(d => d.id === 'idli')!;
    expect(healthFocusScore(eggRoast, 'high-protein')).toBeGreaterThan(healthFocusScore(idli, 'high-protein'));
    expect(healthFocusScore(eggRoast, 'low-calorie')).toBeLessThan(healthFocusScore(idli, 'low-calorie'));
  });

  it('legacy/server focus strings normalize to the canonical focus', () => {
    expect(healthFocusFor('Balanced')).toBe('balanced');
    expect(healthFocusFor('High Protein')).toBe('high-protein');
    expect(healthFocusFor('high_protein')).toBe('high-protein');
    expect(healthFocusFor('Low Calorie')).toBe('low-calorie');
    expect(healthFocusFor('low_calorie')).toBe('low-calorie');
    expect(healthFocusFor('Low Fat')).toBe('low-fat');
    expect(healthFocusFor('Weight Loss')).toBe('weight-loss');
    expect(healthFocusFor('weight_loss')).toBe('weight-loss');
    expect(healthFocusFor('High Fiber')).toBe('high-fiber');
    expect(healthFocusFor('')).toBeNull();
    expect(healthFocusFor(null)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Household diversity + honest pool-exhaustion tolerance
// ─────────────────────────────────────────────────────────────────────────────
describe('household diversity rule (same region+diet+focus in ONE household)', () => {
  it('household-overlap user shares FEWER dishes with the baseline plan than an unrelated same-profile user', () => {
    const baseline = ctxFor('hh-baseline', 'Balanced');
    const base = planIds(gen(baseline).tray);

    // Unrelated-user baseline: median overlap of 4 same-profile strangers.
    const strangers = ['s1', 's2', 's3', 's4'].map(u => planIds(gen(ctxFor(u, 'Balanced')).tray));
    const unrelatedOverlaps: number[] = [];
    for (const s of strangers) unrelatedOverlaps.push(s.filter(x => base.includes(x)).length);
    unrelatedOverlaps.sort((a, b) => a - b);
    const unrelatedMedian = unrelatedOverlaps[1]!;

    // The household user must avoid the baseline member's dishes.
    const hh = gen(ctxFor('hh-member', 'Balanced', { householdDishes: base.map(id => ({ id })) }));
    const hhOverlap = planIds(hh.tray).filter(x => base.includes(x)).length;
    expect(hh.complete).toBe(true);
    expect(hhOverlap).toBeLessThan(unrelatedMedian);
  });

  it('small pool → overlap tolerated (Λ2.3): plan still 20/20, reason recorded — never a silent partial', () => {
    // A constrained library: 6 dishes per slot whose category list is EXACTLY
    // [slot] (24 total — single-category dishes keep the pipeline's own
    // per-slot filters disjoint; a dual [breakfast,snacks] dish would leak
    // into both slots and starve one). The household has claimed 4 of the 6
    // lunch candidates → only 2 non-overlap rows < the 5 needed → the
    // household penalty MUST relax and the reason MUST be recorded.
    const pick = (slot: MealType, n: number, taken: Set<string>) => {
      const out: Dish[] = [];
      for (const d of fillCandidatesForSlot(DISH_LIBRARY, 'veg', 'north', slot, new Set(), new Set(), undefined, null)) {
        if (taken.has(d.id)) continue;
        const cats = (d.category ?? []).map(c => c.toLowerCase());
        if (cats.length !== 1 || cats[0] !== slot) continue; // single-category only
        out.push(d);
        taken.add(d.id);
        if (out.length >= n) break;
      }
      return out;
    };
    const taken = new Set<string>();
    const small: Dish[] = [
      ...pick('breakfast', 6, taken), ...pick('lunch', 6, taken),
      ...pick('snacks', 6, taken), ...pick('dinner', 6, taken),
    ];
    expect(small.length).toBe(24);
    const householdDishes = small.filter(d => (d.category ?? []).includes('lunch')).slice(0, 4).map(d => ({ id: d.id }));
    expect(householdDishes.length).toBe(4);
    const res = gen(
      { ...ctxFor('hh-small', 'Balanced'), householdDishes },
      'veg',
      'north',
      small,
    );
    expect(res.complete).toBe(true);                                   // 20/20 never sacrificed
    expect(trayTotals(res.tray).total).toBe(20);
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
    expect(res.reasons.some(r => r.startsWith('household_overlap_tolerated:lunch'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Meal-history penalty (recently-eaten de-prioritized)
// ─────────────────────────────────────────────────────────────────────────────
describe('meal-history penalty (swap/plan-day proxy, honestly wired)', () => {
  it('unit: a recently-eaten dish scores strictly lower than the same dish with no history', () => {
    const d = DISH_LIBRARY[0]!;
    const noHistory = personalizationScore(d, ctxFor('u-hist-unit', 'Balanced'));
    const withHistory = personalizationScore(d, ctxFor('u-hist-unit', 'Balanced', {
      recentlyEaten: [{ id: d.id, name: d.name }],
    }));
    expect(withHistory).toBeLessThan(noHistory);
  });

  it('pipeline: a user whose history is the baseline plan gets a MORE different plan than an unrelated user', () => {
    const base = ctxFor('hist-base', 'Balanced');
    const baseIds = planIds(gen(base).tray);

    const strangers = ['hs1', 'hs2'].map(u => planIds(gen(ctxFor(u, 'Balanced')).tray));
    const unrelatedOverlap = Math.max(
      ...strangers.map(s => s.filter(x => baseIds.includes(x)).length),
    );

    const historyUser = gen(ctxFor('hist-user', 'Balanced', {
      recentlyEaten: baseIds.map(id => ({ id })),
    }));
    const historyOverlap = planIds(historyUser.tray).filter(x => baseIds.includes(x)).length;
    expect(historyUser.complete).toBe(true);
    expect(historyOverlap).toBeLessThan(unrelatedOverlap);   // eaten dishes de-prioritized
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Regressions locked WITH personalization active
// ─────────────────────────────────────────────────────────────────────────────
describe('regressions stay green under personalization (20/20, vegan, dedupe, custom)', () => {
  const P = ctxFor('u-regress', 'Balanced');

  it('20/20 fill: the live "12/20" tray still becomes 20/20', () => {
    const seed: TrayLibrary = {
      breakfast: [dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id].map(id => mealOf(DISH_LIBRARY.find(d => d.id === id)!)),
      lunch: [mealOf(dishFor('lunch', 'veg'))],
      snacks: [dishFor('snacks', 'vegan').id, dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id].map(id => mealOf(DISH_LIBRARY.find(d => d.id === id)!)),
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id, dishFor('dinner', 'veg').id].map(id => mealOf(DISH_LIBRARY.find(d => d.id === id)!)),
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5, personalization: P });
    expect(trayTotals(res.tray).total).toBe(20);
    expect(trayTotals(res.tray).per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    expect(res.complete).toBe(true);
    expect(uniqueIds(res.tray)).toBe(true);
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
  });

  it('Vegan ingredient guard: mislabeled "vegan" dishes never render (personalization can\'t outrank the guard)', () => {
    const seed = trayFromIds({
      breakfast: ['bela-pana', dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id],
      lunch: ['mushroom-toast', 'hakka-noodles', dishFor('lunch', 'veg').id],
      snacks: ['mushroom-pulao', 'chow-mein', dishFor('snacks', 'vegan').id],
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id],
    });
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'vegan', region: 'north', target: 5, personalization: { ...P, healthFocus: 'High Fiber' } });
    expect(res.complete).toBe(true);
    expect(finalCompliance(res.tray, 'vegan').violations).toEqual([]);
    const finalIds = new Set(planIds(res.tray));
    for (const bad of ['bela-pana', 'mushroom-toast', 'mushroom-pulao', 'hakka-noodles', 'chow-mein']) {
      expect(finalIds.has(bad)).toBe(false);
    }
  });

  it('Andhra whole-plan dedupe: cross-slot repeats replaced with VALID personalized substitutions', () => {
    const andhra = DISH_LIBRARY.find(d => d.id === 'andhra-spiced-egg-curry')!;
    const seed: TrayLibrary = {
      breakfast: [mealOf(andhra)],
      lunch: [mealOf(dishFor('lunch', 'veg')), mealOf(andhra)],
      snacks: [mealOf(dishFor('snacks', 'veg')), mealOf(andhra)],
      dinner: [mealOf(dishFor('dinner', 'veg')), mealOf(andhra)],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'eggitarian', region: 'south', target: 5, personalization: { ...P, healthFocus: 'High Protein' } });
    expect(res.deduped).toBeGreaterThanOrEqual(3);
    const ids = planIds(res.tray);
    expect(ids.filter(id => id === 'andhra-spiced-egg-curry')).toHaveLength(1);
    expect(uniqueIds(res.tray)).toBe(true);
    for (const sub of res.substitutions) {
      const d = res.tray[sub.slot].find(m => m.name === sub.addedName);
      expect(d, `substitution ${sub.addedName} present in ${sub.slot}`).toBeDefined();
      expect(isMealDietCompatible(DISH_LIBRARY.find(x => x.id === d!.dishId)!, 'eggitarian')).toBe(true);
      expect((DISH_LIBRARY.find(x => x.id === d!.dishId)!.category ?? []).includes(sub.slot)).toBe(true);
    }
    expect(finalCompliance(res.tray, 'eggitarian').violations).toEqual([]);
  });

  it('custom-dish protection: user-added dishes survive personalization', () => {
    const seed: TrayLibrary = {
      breakfast: [{ id: 'custom-x', dishId: 'custom-x', name: 'Grandma Pasta' }],
      lunch: [], snacks: [], dinner: [],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5, personalization: P });
    expect(res.tray.breakfast.some(m => m.id === 'custom-x')).toBe(true);
    expect(res.customKept).toBeGreaterThanOrEqual(1);
    expect(res.complete).toBe(true);
  });

  it('static wiring: rebuildTrayForDiet (the changeDiet surface) passes the LIVE personalization context', () => {
    const src = readFileSync(resolve(__dirname, '../utils/trayRegen.ts'), 'utf8');
    expect(src).toContain('personalization: buildPersonalizationContext()');
    // The ctx builder reads the REAL preference/history/household surfaces.
    expect(src).toContain('healthGoals?.[0]');
    expect(src).toContain('spiceLevel');
    expect(src).toContain('preferredRegions');
    expect(src).toContain('dislikedItems');
    expect(src).toContain('store.swaps');
    expect(src).toContain('sharedPlan');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7 · RNG isolation — poisoned global Math.random cannot change plan output
// ─────────────────────────────────────────────────────────────────────────────
describe('RNG isolation (all PRNG injected; Math.random never consulted)', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('poisoned global Math.random → identical plan output', () => {
    const ctx = ctxFor('u-rng', 'Weight Loss');
    const clean = gen(ctx);
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789); // poison every call
    const poisoned = gen(ctx);
    spy.mockRestore();
    expect(JSON.stringify(poisoned.tray)).toBe(JSON.stringify(clean.tray));
    expect(poisoned.complete).toBe(true);
  });

  it('no seed helper consults Math.random (pure hashes + injected RNG only)', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const seed = personalizationSeed({ userId: 'a', deviceId: 'b', rotation: '2026-W37' });
    const j = dishRotationJitter('any-dish', seed);
    const rotated = rotateBandForUser([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'snacks', ctxFor('u', 'Balanced'), 10);
    spy.mockRestore();
    expect(j).toBeGreaterThanOrEqual(0);
    expect(j).toBeLessThan(1);
    expect(rotated.length).toBe(11);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8 · Rebuild surface: rebuildTrayForDiet produces different plans for two
//     same-profile stores that differ ONLY in health focus (the profile path)
// ─────────────────────────────────────────────────────────────────────────────
describe('change-surface behavior: two profiles differing only in focus → different rebuilt plans', () => {
  const apiMocks = vi.hoisted(() => ({
    registerUser: vi.fn(), logoutUser: vi.fn(), getMe: vi.fn(),
    dietGetMine: vi.fn(), dietList: vi.fn(),
    householdApi: { create: vi.fn(), join: vi.fn(), get: vi.fn(), leave: vi.fn(), updateMember: vi.fn(), getMembers: vi.fn(), regenerateCode: vi.fn() },
  }));
  vi.mock('../app/utils/authApi', () => ({ registerUser: apiMocks.registerUser, logoutUser: apiMocks.logoutUser, getMe: apiMocks.getMe }));
  vi.mock('../app/utils/dietApi', () => ({ dietApi: { getMine: apiMocks.dietGetMine, upsertMine: vi.fn(), listHouseholdDiets: apiMocks.dietList } }));
  vi.mock('../app/utils/householdApi', () => ({ householdApi: apiMocks.householdApi }));

  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });

  const seedProfile = async (focus: string) => {
    const { useStore } = await import('../app/store/useStore');
    const { useLoopStore } = await import('../plan/store/useLoopStore');
    const { useHouseholdKitchenStore } = await import('../plan/store/householdKitchenStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: 'u-prof', name: 'Profile', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], healthGoals: [focus] } as any,
      token: 'jwt-ok',
      deviceId: 'device-prof',
      trayLibrary: emptyTray(),
      pendingDietChange: null,
      dietRegen: null,
      householdId: null,
    } as any);
    useLoopStore.setState({ mealLoop: { config: null, sourceDishIds: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, assignments: [], overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } } as any);
    useHouseholdKitchenStore.setState({ households: {}, lanes: [] } as any);
  };

  it('same profile except healthGoals → rebuilt trays differ materially (focus re-rank through the change surface)', async () => {
    const { useStore } = await import('../app/store/useStore');

    await seedProfile('Balanced');
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    const r1 = await rebuildTrayForDiet();
    expect(r1.complete).toBe(true);
    const trayA = planIds(useStore.getState().trayLibrary);           // the rebuilt plan (20/20)

    await seedProfile('High Protein');                                // resetModules → fresh store
    const { rebuildTrayForDiet: rebuild2 } = await import('../utils/trayRegen');
    const r2 = await rebuild2();
    expect(r2.complete).toBe(true);
    const trayB = planIds(useStore.getState().trayLibrary);

    // Both profiles are IDENTICAL except healthGoals → the ONLY thing that
    // can differ is the focus re-rank flowing through the change surface.
    expect(trayA).not.toEqual(trayB);
    const overlap = trayA.filter(x => trayB.includes(x)).length;
    expect(trayA.length - overlap).toBeGreaterThanOrEqual(5);         // materially different fills
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9 · Cuisine-affinity weight tuning for MILD users (2026-09-13)
//
// Goal-2 contract: a mild/low-spice user's explicit cuisine affinity must
// genuinely shape the plan. BEFORE this change a north-region user's south
// affinity had ZERO effect (same userId with/without affinity → identical
// 20/20 — the region tier was compared before the personalization comparator,
// and the tier-0 pool ≥34/slot always filled first). The measured baseline of
// the QA pair (South+mild vs simple-home, same North+Veg+Balanced) was
// 10/20 shared (Jaccard 0.333) — pure jitter. AFTER the tuning (affinity
// tier-lift + doubled boost for mild users) the same pair measures 3-6/20
// shared (Jaccard 0.08-0.18, Dice 0.15-0.30) across the deterministic ID
// pairs tested — inside the stated band "≤ ~6/20 (Jaccard ≤ ~0.23)".
//   south-mild:       mild spice + 'south-indian' affinity
//   simple-home:      mild spice, familiar-only, no affinities
//   punjabi-spicy:    HOT spice + 'punjabi' affinity (NOT mild — untouched)
//   allergic-novelty: medium + peanuts/dairy allergies + adventurous (untouched)
// PRESERVED (locked below + by the suites above): diet gate (20/20 compliance),
// allergy/dislike exclusion, health-focus weights, household/history penalties
// (existing suites), variety/near-dup gate (dedupe), seeded-PRNG determinism,
// and byte-identical plans for NON-mild users (the strongly-flavored pair
// overlaps are asserted EXACTLY — they cannot move).
// ─────────────────────────────────────────────────────────────────────────────
describe('goal-2: mild users get a REAL cuisine-affinity signal (South+mild vs simple-home separates)', () => {
  type TP = NonNullable<PersonalizationContext['tasteProfile']>;
  const tp = (p: Partial<TP>): TP => ({ spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [], ...p });
  const rmCtx = (userId: string, p: Partial<PersonalizationContext>): PersonalizationContext => ({
    userId, deviceId: `dev-${userId}`, healthFocus: 'Balanced',
    preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] },
    ...p,
  });

  const ROOMMATES: Array<[string, PersonalizationContext]> = [
    ['south-mild', rmCtx('rm-south-mild', {
      preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], dislikedItems: [], cuisineAffinities: ['south-indian'] },
      tasteProfile: tp({ spiceLevel: 'mild', cuisineAffinities: ['south-indian'] }),
    })],
    ['simple-home', rmCtx('rm-simple-home', {
      preferences: { spiceLevel: 'mild', preferredRegions: ['North India'], dislikedItems: [] },
      tasteProfile: tp({ spiceLevel: 'mild', noveltyPreference: 'familiar' }),
    })],
    ['punjabi-spicy', rmCtx('rm-punjabi-spicy', {
      preferences: { spiceLevel: 'hot', preferredRegions: ['North India'], dislikedItems: [], cuisineAffinities: ['punjabi'] },
      tasteProfile: tp({ spiceLevel: 'hot', cuisineAffinities: ['punjabi'] }),
    })],
    ['allergic-novelty', rmCtx('rm-allergic-novelty', {
      preferences: { spiceLevel: 'medium', preferredRegions: ['North India'], dislikedItems: [] },
      tasteProfile: tp({ allergies: ['peanuts', 'dairy'], noveltyPreference: 'adventurous' }),
    })],
  ];

  const plans = new Map<string, string[]>();
  const trays = new Map<string, ReturnType<typeof gen>>();
  for (const [k, c] of ROOMMATES) {
    const r = gen(c);
    trays.set(k, r);
    plans.set(k, planIds(r.tray));
  }

  it('all four roommate plans stay 20/20, diet/region-valid, unique (the gates never yield to the affinity)', () => {
    for (const [k, r] of trays) {
      expect(r.complete, k).toBe(true);
      expect(trayTotals(r.tray).total, k).toBe(20);
      expect(finalCompliance(r.tray, 'veg').violations, k).toEqual([]);
      expect(uniqueIds(r.tray), k).toBe(true);
    }
  });

  it('THE MILD-PAIR: South+mild × simple-home drops from 10-11/20 shared to ≤ 6/20 (Jaccard ≤ 0.23, Dice ≤ 0.30)', () => {
    const a = plans.get('south-mild')!;
    const b = plans.get('simple-home')!;
    const shared = a.filter(x => b.includes(x)).length;
    // Honest band: target ≤ 6/20 (Jaccard ≤ ~0.23); measured on the real
    // library with deterministic IDs: rm-* pair = 3/20, qa-exact pair = 6/20
    // (both inside the band — asserted ≤ 6 here).
    expect(shared).toBeLessThanOrEqual(6);
    expect(shared).toBeLessThan(10); // hard regression floor: the OLD 10-11/20 baseline can never return
    expect(jaccard(a, b)).toBeLessThanOrEqual(0.23);
    const dice = (2 * shared) / (a.length + b.length);
    expect(dice).toBeLessThanOrEqual(0.30);
    // The south-mild plan must actually LOOK south: ≥ 6 of 20 dishes carry a
    // south-family cuisine key (the affinity reached the plan — the old
    // equivalent was 0: the affinity did nothing).
    const southKeys = ['south-indian', 'andhra', 'kerala', 'chettinad', 'tamil', 'udupi', 'coorg', 'hyderabadi', 'goan', 'south'];
    const southCount = a.filter(id => {
      const d = DISH_LIBRARY.find(x => x.id === id)!;
      const tags = new Set((d.tags ?? []).map(t => t.toLowerCase()));
      const region = (d.region ?? '').toLowerCase();
      return southKeys.some(k => region.includes(k) || tags.has(k));
    }).length;
    expect(southCount).toBeGreaterThanOrEqual(6);
  });

  it('the strongly-flavored profiles hold MEASURED pairwise overlaps (re-pinned 2026-09-14 after the hot-affinity + novelty-gradation + Punjabi-coverage tuning)', () => {
    // The 2026-09-14 tuning deliberately changed ranking for spicy/hot and
    // adventurous users again: (a) hot users now carry the STRONGEST cuisine
    // affinity (+2.0/key — out-scales the +0.9/hot-dish global term so "loves
    // Punjabi" beats "loves spicy anything"), (b) the novelty lift is graded —
    // the 0.5–0.6 band opens the full −2 AND far-region novel dishes keep a
    // distance-aware edge, and (c) the library's genuine Punjabi classics
    // (Dal Makhani, Paneer Bhurji, Kadai Mushroom, Baingan Bharta, Methi Malai
    // Matar, Rajma Chawal…) now carry the 'punjabi' cuisine tag so a Punjabi
    // lover's plan actually READS Punjabi (measured 9/20 vs the previous 2/20 —
    // the 3-dish tag surface was the binding constraint, not the weight).
    // That re-pinned the measured overlaps 8/6/3 → 8/2/3 (measured on the
    // real library, rm-* fixture ids). Determinism per profile is UNCHANGED;
    // these exact values guard future drift.
    const sh = plans.get('simple-home')!;
    const pj = plans.get('punjabi-spicy')!;
    const al = plans.get('allergic-novelty')!;
    const shared = (x: string[], y: string[]) => x.filter(v => y.includes(v)).length;
    expect(shared(sh, pj)).toBe(8); // measured 2026-09-14 (hot amplification + Punjabi coverage: plan now 9/20 Punjabi)
    expect(shared(sh, al)).toBe(2); // measured 2026-09-14 (was 6 — graded novelty widens the adventurous/novelty gap)
    expect(shared(pj, al)).toBe(3); // measured 2026-09-14
    // And the "loves Punjabi" contract is real at the PLAN level now: ≥ 6 of 20
    // dishes carry a punjabi cuisine key (measured 9) — the old 3-dish tag
    // surface would silently drop this back toward 2 if reverted.
    const pjPlan = pj.filter(id => dishCuisineKeys(DISH_LIBRARY.find(x => x.id === id)!).includes('punjabi')).length;
    expect(pjPlan).toBeGreaterThanOrEqual(6);
  });

  it('determinism holds for the new tuned paths: same inputs → byte-identical plans (seeded PRNG untouched)', () => {
    const c = ROOMMATES[0]![1];
    const r1 = gen(c);
    const r2 = gen(c);
    expect(JSON.stringify(r1.tray)).toBe(JSON.stringify(r2.tray));
  });

  it('RNG isolation holds for the tuned paths: poisoned Math.random → identical plan', () => {
    const c = ROOMMATES[0]![1];
    const clean = gen(c);
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    const poisoned = gen(c);
    spy.mockRestore();
    expect(JSON.stringify(poisoned.tray)).toBe(JSON.stringify(clean.tray));
  });
});

describe('goal-2 unit surface: mild amplification + tier lift, non-mild byte-identical', () => {
  const tp = (p: Partial<NonNullable<PersonalizationContext['tasteProfile']>>): NonNullable<PersonalizationContext['tasteProfile']> =>
    ({ spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [], ...p });

  it('isMildSpiceUser: mild/low on EITHER surface is mild; medium/hot/absent are not', () => {
    expect(isMildSpiceUser({ spiceLevel: 'mild' })).toBe(true);
    expect(isMildSpiceUser({ spiceLevel: 'low' })).toBe(true);
    expect(isMildSpiceUser({ spiceLevel: 'medium' })).toBe(false);
    expect(isMildSpiceUser({ spiceLevel: 'hot' })).toBe(false);
    expect(isMildSpiceUser({})).toBe(false);
    expect(isMildSpiceUser(null, tp({ spiceLevel: 'mild' }))).toBe(true);
    expect(isMildSpiceUser({ spiceLevel: 'hot' }, tp({ spiceLevel: 'mild' }))).toBe(true);
    expect(isMildSpiceUser(undefined, tp({ spiceLevel: 'hot' }))).toBe(false);
  });

  it('cuisineAffinityBoostUnit: mild = 1.6/key cap 3.0; every non-mild user keeps the legacy 0.8/key cap 2.0', () => {
    expect(cuisineAffinityBoostUnit(true)).toEqual({ perKey: 1.6, cap: 3.0 });
    expect(cuisineAffinityBoostUnit(false)).toEqual({ perKey: 0.8, cap: 2.0 });
  });

  it('cuisineAffinityBoostForSpice: mild 1.6, hot STRONGEST 2.0, medium keeps the legacy 0.8 (2026-09-14)', () => {
    // Mild: affinity is the ONLY taste expression (spicy penalised) → 1.6.
    expect(cuisineAffinityBoostForSpice({ spiceLevel: 'mild' })).toEqual({ perKey: 1.6, cap: 3.0 });
    expect(cuisineAffinityBoostForSpice({ spiceLevel: 'low' })).toEqual({ perKey: 1.6, cap: 3.0 });
    // Hot: the +0.9/hot-dish global term must be OUT-SCALED so "loves Punjabi"
    // beats "loves spicy anything" → the strongest per-key (2.0 > 1.5 = the max
    // single jitter). Measured legacy-0.8 left a hot Punjabi lover at 2/20 and
    // gap 2.75 < the 3.0 jitter span; amplified is gap 3.95, always ranked ahead.
    expect(cuisineAffinityBoostForSpice({ spiceLevel: 'hot' })).toEqual({ perKey: 2.0, cap: 3.0 });
    expect(cuisineAffinityBoostForSpice({ spiceLevel: 'spicy' })).toEqual({ perKey: 2.0, cap: 3.0 });
    // Medium / absent: no global spice term → EXACT legacy values (byte-identical).
    expect(cuisineAffinityBoostForSpice({ spiceLevel: 'medium' })).toEqual({ perKey: 0.8, cap: 2.0 });
    expect(cuisineAffinityBoostForSpice({})).toEqual({ perKey: 0.8, cap: 2.0 });
    expect(cuisineAffinityBoostForSpice(undefined, tp({ spiceLevel: 'hot' }))).toEqual({ perKey: 2.0, cap: 3.0 });
  });

  it('isHotSpiceUser: hot/high/spicy on EITHER surface; medium/mild/absent are not', () => {
    expect(isHotSpiceUser({ spiceLevel: 'hot' })).toBe(true);
    expect(isHotSpiceUser({ spiceLevel: 'high' })).toBe(true);
    expect(isHotSpiceUser({ spiceLevel: 'spicy' })).toBe(true);
    expect(isHotSpiceUser({ spiceLevel: 'medium' })).toBe(false);
    expect(isHotSpiceUser({ spiceLevel: 'mild' })).toBe(false);
    expect(isHotSpiceUser({})).toBe(false);
    expect(isHotSpiceUser(undefined, tp({ spiceLevel: 'hot' }))).toBe(true);
    expect(isHotSpiceUser({ spiceLevel: 'medium' }, tp({ spiceLevel: 'hot' }))).toBe(true);
    expect(isHotSpiceUser({ spiceLevel: 'mild' }, tp({ spiceLevel: 'hot' }))).toBe(true);
  });

  it('affinityTierLift: -3 only for a mild user whose affinity matches a dish; 0 for everyone else', () => {
    const rasam = DISH_LIBRARY.find(d => d.id === 'rasam')!; // keys: tamil/south-indian/south
    const alooParatha = DISH_LIBRARY.find(d => d.id === 'aloo-paratha')!; // north, no south key
    // Mild + matched → -3 (the affinity lifts the dish ahead of the home tier).
    expect(affinityTierLift(rasam, { spiceLevel: 'mild', cuisineAffinities: ['south-indian'] })).toBe(-3);
    // Mild but dish NOT matched → 0 (byte-identical tier).
    expect(affinityTierLift(alooParatha, { spiceLevel: 'mild', cuisineAffinities: ['south-indian'] })).toBe(0);
    // Non-mild (hot / medium / absent) → 0 even for a matching dish.
    expect(affinityTierLift(rasam, { spiceLevel: 'hot', cuisineAffinities: ['south-indian'] })).toBe(0);
    expect(affinityTierLift(rasam, { spiceLevel: 'medium', cuisineAffinities: ['south-indian'] })).toBe(0);
    expect(affinityTierLift(rasam, undefined)).toBe(0);
    // Mild but NO affinities → 0.
    expect(affinityTierLift(rasam, { spiceLevel: 'mild' })).toBe(0);
    // Taste-profile surface drives the lift too.
    expect(affinityTierLift(rasam, undefined, tp({ spiceLevel: 'mild', cuisineAffinities: ['south-indian'] }))).toBe(-3);
    expect(affinityTierLift(rasam, undefined, tp({ spiceLevel: 'medium', cuisineAffinities: ['south-indian'] }))).toBe(0);
  });

  it('preferenceScore: mild boost amplified 1.6, hot STRONGEST 2.0 (2026-09-14), medium is the EXACT legacy 0.8', () => {
    const rasam = DISH_LIBRARY.find(d => d.id === 'rasam')!;
    const mild = personalizationScore(rasam, { userId: 'u-b', preferences: { spiceLevel: 'mild', cuisineAffinities: ['south-indian'] }, jitterScale: 0 });
    const medium = personalizationScore(rasam, { userId: 'u-b', preferences: { spiceLevel: 'medium', cuisineAffinities: ['south-indian'] }, jitterScale: 0 });
    const mediumAff = preferenceScore(rasam, { spiceLevel: 'medium', cuisineAffinities: ['south-indian'] });
    const hotAff = preferenceScore(rasam, { spiceLevel: 'hot', cuisineAffinities: ['south-indian'] });
    const hotNoAff = preferenceScore(rasam, { spiceLevel: 'hot' });
    const mildScore = preferenceScore(rasam, { spiceLevel: 'mild', cuisineAffinities: ['south-indian'] });
    expect(mildScore - preferenceScore(rasam, { spiceLevel: 'mild', cuisineAffinities: [] }))
      .toBeCloseTo(1.6); // one matched key × amplified unit
    expect(mild).toBeGreaterThan(medium); // the tuned path lifts explicitly
    // Medium: the legacy +0.8 boost is byte-identical (no global spice term,
    // so no amplification is needed).
    expect(mediumAff - preferenceScore(rasam, { spiceLevel: 'medium' })).toBeCloseTo(0.8);
    // Hot: AMPLIFIED to +2.0/key — the +0.9/hot-dish term rewards every hot
    // dish, so the loved-cuisine marker must out-scale it (2026-09-14). The
    // hot boost is now strictly GREATER than medium's, making the loved
    // cuisine the deciding signal for a hot palate.
    expect(hotAff - hotNoAff).toBeCloseTo(2.0);
    expect(hotAff).toBeGreaterThan(mediumAff);
  });
});

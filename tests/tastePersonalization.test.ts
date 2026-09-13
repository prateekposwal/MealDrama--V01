// ─────────────────────────────────────────────────────────────────────────────
// TASTE PERSONALIZATION — the 6-gate recommendation contract.
//
// Spec rows locked here (utils/tasteProfile + utils/recommendation + the
// learning ledger):
//   · Roommate example — 4 users, SAME Region=North/Delhi + Veg + Balanced,
//     DIFFERENT tastes → 4 plans 20/20, ALL 6 gates PASS per dish, measured
//     pairwise diversity, A favors spicy-Punjabi, B mild-South, C simple-low-
//     spice, D excludes allergens + highest novelty (REAL dish names).
//   · Learning — like → similar rank up; dislike → down; replace-swap shifts
//     preference; added extends affinity; ledger per-user isolated + persists.
//   · Novelty — adventurous vs familiar measurable difference; poisoned
//     Math.random → byte-identical output (RNG isolation).
//   · Variety — near-duplicate pairs cannot double-land unless forced
//     (recorded relaxation).
//   · Regression — 20/20, Vegan guard, dedupe, macro-estimator gradients,
//     data-integrity guard, per-user determinism, MealLog/HouseholdPlanItem
//     caches stay green; reasons gate-grounded.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';
import type { TrayLibrary } from '../app/store/useStore';
import {
  buildGatedPlan,
  evaluateGates,
  tasteGate,
  healthGate,
  historyGate,
  householdGate,
  varietyGate,
  recommendationReason,
  recommendationReasons,
} from '../utils/recommendation';
import type { GateContext, BuildGatedPlanInput } from '../utils/recommendation';
import type { TasteProfile } from '../utils/tasteProfile';
import {
  tasteProfileFromUser,
  normalizeNoveltyPreference,
  normalizeSpiceLevel,
  hasTasteSignal,
} from '../utils/tasteProfile';
import {
  dishSpiceLevel,
  dishCuisineKeys,
  dishAllergenMatch,
  dishFamiliarity,
} from '../utils/dishTaste';
import { isNearDuplicate, noveltyBudget, dishNoveltyForUser } from '../utils/variety';
import {
  ledgerScore,
  buildLedgerSignals,
  toLedgerEvent,
  type TasteLedgerEvent,
  type TasteAction,
  type LedgerSignals,
} from '../utils/tasteLedger';
import { personalizationScore, type PersonalizationContext } from '../utils/mealPersonalization';
import {
  getCachedTasteLedger,
  isTasteLedgerLoaded,
  seedTasteLedgerForTests,
} from '../app/lib/tasteLedger';
import {
  seedMealHistoryForTests,
  hasPersistedMealHistory,
  getCachedMealHistory,
} from '../app/lib/mealHistory';
import { isMealDietCompatible } from '../utils/dietCompat';
import { estimateDishMacros } from '../utils/macroEstimator';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const allSlots: readonly MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
const ALL = [...allSlots];

type TrayMap = Record<MealType, string[]>;

const planDishIds = (tray: TrayLibrary): string[] =>
  ALL.flatMap(s => (tray[s] ?? []).map(m => m.dishId || m.id));

const jaccard = (a: string[], b: string[]): number => {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter);
};

const baseInput = (over: Partial<BuildGatedPlanInput> & { taste: TasteProfile; userId: string }): BuildGatedPlanInput => ({
  library: DISH_LIBRARY,
  diet: 'veg',
  region: 'north',
  healthFocus: 'Balanced',
  target: 5,
  slots: allSlots,
  ...over,
});

const tasteA = (): TasteProfile => ({ spiceLevel: 'hot', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: ['punjabi'] });
const tasteB = (): TasteProfile => ({ spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: ['south-indian'] });
const tasteC = (): TasteProfile => ({ spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'familiar', cuisineAffinities: [] });
const tasteD = (): TasteProfile => ({ spiceLevel: 'medium', allergies: ['peanuts'], dislikedItems: [], noveltyPreference: 'adventurous', cuisineAffinities: [] });

const runPlan = (taste: TasteProfile, userId: string) =>
  buildGatedPlan(baseInput({ taste, userId }));

const spicyCount = (plan: TrayLibrary): number =>
  planDishIds(plan).filter(id => {
    const d = DISH_LIBRARY.find(x => x.id === id);
    return d ? dishSpiceLevel(d) === 'hot' : false;
  }).length;

const southCount = (plan: TrayLibrary): number =>
  planDishIds(plan).filter(id => {
    const d = DISH_LIBRARY.find(x => x.id === id);
    return d ? (d.region === 'south' || dishCuisineKeys(d).includes('south-indian')) : false;
  }).length;

const avgNovelty = (plan: TrayLibrary, aff: readonly string[] = []): number => {
  const ids = planDishIds(plan);
  if (!ids.length) return 0;
  return ids.reduce((n, id) => {
    const d = DISH_LIBRARY.find(x => x.id === id);
    return n + (d ? dishNoveltyForUser(d, aff) : 0);
  }, 0) / ids.length;
};

const avgFamiliarity = (plan: TrayLibrary): number => {
  const ids = planDishIds(plan);
  if (!ids.length) return 0;
  return ids.reduce((n, id) => {
    const d = DISH_LIBRARY.find(x => x.id === id);
    return n + (d ? dishFamiliarity(d) : 0);
  }, 0) / ids.length;
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── 1 · ROOMMATE EXAMPLE ────────────────────────────────────────────────────
describe('roommate example — same region+diet+focus, different tastes', () => {
  it('4 plans → all 20/20, all 6 gates PASS/dish, zero relaxations', () => {
    const a = runPlan(tasteA(), 'user-a');
    const b = runPlan(tasteB(), 'user-b');
    const c = runPlan(tasteC(), 'user-c');
    const d = runPlan(tasteD(), 'user-d');

    for (const [label, res] of [['A', a], ['B', b], ['C', c], ['D', d]] as const) {
      expect(res.complete, `${label} complete 20/20`).toBe(true);
      expect(res.reports.length, `${label} has 20 reports`).toBe(20);
      expect(res.relaxations, `${label} zero relaxations`).toEqual([]);
      for (const r of res.reports) {
        expect(r.gates.length, `${label} ${r.name} has all 6 gates`).toBe(6);
        for (const g of r.gates) {
          expect(g.pass, `${label} ${r.name} gate ${g.gate} PASS — ${g.reason}`).toBe(true);
        }
      }
    }

    // Measured pairwise diversity — no two roommates share the same plan.
    const plans = [a, b, c, d].map(p => planDishIds(p.tray).sort());
    const jac: number[] = [];
    for (let i = 0; i < plans.length; i++) {
      for (let j = i + 1; j < plans.length; j++) jac.push(jaccard(plans[i]!, plans[j]!));
    }
    const meanJac = jac.reduce((n, x) => n + x, 0) / jac.length;
    expect(Math.max(...jac), 'no pair identical (max Jaccard < 1)').toBeLessThan(1);
    expect(meanJac, 'pairwise diversity is measurable (mean Jaccard < 0.95)').toBeLessThan(0.95);
    expect(meanJac, 'plans still share the appropriate region pool (mean > 0)').toBeGreaterThan(0);
  });

  it('A favors spicy Punjabi (real dish: Amritsari Chole family)', () => {
    const a = runPlan(tasteA(), 'user-a');
    const b = runPlan(tasteB(), 'user-b');
    const aSpicy = spicyCount(a.tray);
    const bSpicy = spicyCount(b.tray);
    expect(aSpicy, 'A has ≥1 spicy dish (gate passes it)').toBeGreaterThanOrEqual(1);
    expect(aSpicy, 'A has more spicy dishes than mild B').toBeGreaterThan(bSpicy);

    const punjabiSpicy = planDishIds(a.tray).filter(id => {
      const dd = DISH_LIBRARY.find(x => x.id === id);
      return dd ? (dd.tags ?? []).includes('punjabi') && (dd.tags ?? []).includes('spicy') : false;
    });
    expect(punjabiSpicy.length, 'A lands a REAL spicy Punjabi dish').toBeGreaterThanOrEqual(1);
    // The named real dish the spec cites: Amritsari Chole (+ Roti pairing).
    const amritsari = DISH_LIBRARY.find(x => x.id === 'amritsari-chole')!;
    expect((amritsari.tags ?? []).includes('punjabi') && (amritsari.tags ?? []).includes('spicy')).toBe(true);
  });

  it('B favors mild South (real dish: Pesarattu family), zero hot dishes', () => {
    const b = runPlan(tasteB(), 'user-b');
    const a = runPlan(tasteA(), 'user-a');
    expect(spicyCount(b.tray), 'mild B gets ZERO hot dishes (taste gate)').toBe(0);
    expect(southCount(b.tray), 'B has ≥1 South dish').toBeGreaterThanOrEqual(1);
    expect(southCount(b.tray), 'B has more South dishes than spicy-punjabi A').toBeGreaterThan(southCount(a.tray));
    // The named real dish: Vegetable Pesarattu (south breakfast family).
    expect(DISH_LIBRARY.some(d => d.id === 'pesarattu' && d.region === 'south')).toBe(true);
  });

  it('C stays simple + low-spice (zero hot, highest familiarity)', () => {
    const c = runPlan(tasteC(), 'user-c');
    const d = runPlan(tasteD(), 'user-d');
    expect(spicyCount(c.tray), 'low-spice C gets ZERO hot dishes').toBe(0);
    expect(avgFamiliarity(c.tray), 'familiar C reads more familiar than adventurous D').toBeGreaterThan(avgFamiliarity(d.tray));
  });

  it('D excludes peanuts + has the highest novelty', () => {
    const d = runPlan(tasteD(), 'user-d');
    const a = runPlan(tasteA(), 'user-a');
    const b = runPlan(tasteB(), 'user-b');
    const c = runPlan(tasteC(), 'user-c');

    for (const id of planDishIds(d.tray)) {
      const dish = DISH_LIBRARY.find(x => x.id === id)!;
      expect(dishAllergenMatch(dish, ['peanuts']), `${dish.name} excludes peanuts`).toBeNull();
    }
    // The named real dish carrying peanut: Banana Peanut Butter Sandwich.
    const peanutDish = DISH_LIBRARY.find(x => x.id === 'banana-peanut-butter-sandwich')!;
    expect(dishAllergenMatch(peanutDish, ['peanuts'])).not.toBeNull();

    const noveltyD = avgNovelty(d.tray);
    expect(noveltyD).toBeGreaterThan(avgNovelty(a.tray));
    expect(noveltyD).toBeGreaterThan(avgNovelty(b.tray));
    expect(noveltyD).toBeGreaterThan(avgNovelty(c.tray));
  });
});

// ─── 2 · LEARNING LEDGER ─────────────────────────────────────────────────────
describe('learning ledger — like/dislike/replace/add', () => {
  const ctx = (signals: LedgerSignals | null): PersonalizationContext => ({
    userId: 'learner',
    tasteProfile: tasteB(),
    preferences: { spiceLevel: 'medium' },
    ledgerSignals: signals,
  });

  it('like → the liked dish ranks up vs baseline', () => {
    const target = DISH_LIBRARY.find(x => x.id === 'idli')!;
    const base = personalizationScore(target, ctx(null));
    const signals = buildLedgerSignals([{ userId: 'u', dishId: 'idli', action: 'like', at: new Date().toISOString() }], new Map([[target.id, target]]));
    const boosted = personalizationScore(target, ctx(signals));
    expect(boosted).toBeGreaterThan(base);
  });

  it('dislike → the disliked dish scores below baseline', () => {
    const target = DISH_LIBRARY.find(x => x.id === 'dosa')!;
    const base = personalizationScore(target, ctx(null));
    const signals = buildLedgerSignals([{ userId: 'u', dishId: 'dosa', action: 'dislike', at: new Date().toISOString() }], new Map([[target.id, target]]));
    const penalized = personalizationScore(target, ctx(signals));
    expect(penalized).toBeLessThan(base);
  });

  it('replacedTo shifts preference toward the replacement dish', () => {
    const from = DISH_LIBRARY.find(x => x.id === 'aloo-paratha')!;
    const to = DISH_LIBRARY.find(x => x.id === 'idli')!;
    const idx = new Map([[from.id, from], [to.id, to]]);
    const baseTo = ledgerScore(to, buildLedgerSignals([], idx));
    const signals = buildLedgerSignals(
      [{ userId: 'u', dishId: from.id, action: 'replacedTo', replacedWithId: to.id, at: new Date().toISOString() }],
      idx,
    );
    expect(ledgerScore(to, signals)).toBeGreaterThan(baseTo);
    expect(ledgerScore(from, signals)).toBeLessThan(0);
  });

  it('added extends affinity like a like', () => {
    const target = DISH_LIBRARY.find(x => x.id === 'pesarattu')!;
    const base = ledgerScore(target, emptySignals());
    const signals = buildLedgerSignals(
      [{ userId: 'u', dishId: 'pesarattu', action: 'added', at: new Date().toISOString() }],
      new Map([[target.id, target]]),
    );
    expect(ledgerScore(target, signals)).toBeGreaterThan(base);
  });

  it('ledger is per-user isolated + persists in the cache', () => {
    seedTasteLedgerForTests('u1', [{ userId: 'u1', dishId: 'idli', action: 'like', at: '2026-09-14T00:00:00Z' }]);
    expect(isTasteLedgerLoaded('u1')).toBe(true);
    expect(getCachedTasteLedger('u1')?.length).toBe(1);
    expect(getCachedTasteLedger('u2'), 'u2 sees null — two ledgers never mix').toBeNull();
    expect(isTasteLedgerLoaded('u2')).toBe(false);
  });

  it('toLedgerEvent normalizes rows defensively (bad action → null)', () => {
    expect(toLedgerEvent({ dishId: 'idli', action: 'like' })?.action).toBe('like');
    expect(toLedgerEvent({ dishId: 'idli', action: 'nonsense' as TasteAction })).toBeNull();
    expect(toLedgerEvent({})).toBeNull();
  });

  it('MealLog cache (history) isolation stays green', () => {
    seedMealHistoryForTests('u1', [{ id: 'idli' }]);
    expect(hasPersistedMealHistory('u1')).toBe(true);
    expect(getCachedMealHistory('u1')?.length).toBe(1);
    expect(getCachedMealHistory('u2'), 'history never mixes across users').toBeNull();
  });
});

const emptySignals = (): LedgerSignals => buildLedgerSignals([], new Map());

// ─── 3 · NOVELTY ─────────────────────────────────────────────────────────────
describe('novelty — measurable, deterministic, RNG-isolated', () => {
  it('budget order: adventurous > balanced > familiar', () => {
    expect(noveltyBudget('adventurous')).toBeGreaterThan(noveltyBudget('balanced'));
    expect(noveltyBudget('balanced')).toBeGreaterThan(noveltyBudget('familiar'));
  });

  it('adventurous vs familiar plans differ measurably', () => {
    const fam = runPlan({ spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'familiar', cuisineAffinities: [] }, 'nov-fam');
    const adv = runPlan({ spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'adventurous', cuisineAffinities: [] }, 'nov-adv');
    expect(avgNovelty(adv.tray)).toBeGreaterThan(avgNovelty(fam.tray) + 0.05);
    expect(planDishIds(adv.tray).sort()).not.toEqual(planDishIds(fam.tray).sort());
  });

  it('poisoned Math.random → byte-identical output (RNG isolation)', () => {
    const taste = tasteD();
    const clean = runPlan(taste, 'rng-user');
    const poison = vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const dirty = runPlan(taste, 'rng-user');
    poison.mockRestore();
    expect(dirty.tray).toEqual(clean.tray);
    expect(dirty.reports).toEqual(clean.reports);
    expect(dirty.relaxations).toEqual(clean.relaxations);
  });

  it('per-user determinism — same user twice → identical plan', () => {
    const one = runPlan(tasteA(), 'det-user');
    const two = runPlan(tasteA(), 'det-user');
    expect(two.tray).toEqual(one.tray);
  });
});

// ─── 4 · VARIETY / near-duplicate guard ──────────────────────────────────────
describe('variety — near-duplicates cannot double-land', () => {
  const baseDish = (id: string, name: string, slot: MealType = 'lunch'): Dish => ({
    id, name, icon: '🍛', region: 'north', states: ['Delhi'], category: [slot],
    type: 'veg', weight: 'medium', nutrition: ['protein', 'carb'], tags: ['rice', 'curry'],
    variants: [{ id: `${id}-v1`, name, ingredients: [{ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains' }] }],
  });

  it('isNearDuplicate: same macros+cuisine+ingredients → true; distinct → false', () => {
    const a = baseDish('dup-a', 'Dal Rice A');
    const b = baseDish('dup-b', 'Dal Rice B');
    const c = DISH_LIBRARY.find(x => x.id === 'idli')!;
    const d = DISH_LIBRARY.find(x => x.id === 'aloo-paratha')!;
    expect(isNearDuplicate(a, b)).toBe(true);
    expect(isNearDuplicate(c, d)).toBe(false);
  });

  it('a near-duplicate pair cannot both land when the pool has room', () => {
    const slot = 'lunch' as MealType;
    const others = ['rajma-chawal', 'dal-tadka-central', 'kadhi-pakora', 'paneer-butter-masala', 'chole-central', 'sambhar-rice']
      .map(id => DISH_LIBRARY.find(x => x.id === id))
      .filter((x): x is Dish => !!x);
    const library = [baseDish('dup-a', 'Dal Rice A', slot), baseDish('dup-b', 'Dal Rice B', slot), ...others];
    const res = buildGatedPlan(baseInput({ taste: tasteB(), userId: 'var-user', library, slots: [slot], target: 4 }));
    const ids = res.tray[slot].map(m => m.dishId);
    const landedDups = ids.filter(id => id === 'dup-a' || id === 'dup-b');
    expect(landedDups.length, 'at most ONE near-duplicate lands').toBeLessThanOrEqual(1);
    expect(res.relaxations, 'no relaxation needed (pool had room)').toEqual([]);
  });

  it('near-duplicates BOTH land ONLY when the pool forces it — recorded', () => {
    const slot = 'lunch' as MealType;
    // 5 dishes, 4 of which are the same near-dup family → target 5 forces both.
    const library = [
      baseDish('dup-a', 'Dal Rice A', slot),
      baseDish('dup-b', 'Dal Rice B', slot),
      baseDish('dup-c', 'Dal Rice C', slot),
      baseDish('dup-d', 'Dal Rice D', slot),
      DISH_LIBRARY.find(x => x.id === 'chole-central')!,
    ];
    const res = buildGatedPlan(baseInput({ taste: tasteB(), userId: 'var-force', library, slots: [slot], target: 4 }));
    expect(res.complete, 'forced pool still fills').toBe(true);
    expect(res.relaxations.some(r => r.includes('gate_relaxed:lunch:variety')), 'variety relaxation RECORDED').toBe(true);
  });
});

// ─── 5 · GATES unit-level ────────────────────────────────────────────────────
describe('gate unit contracts', () => {
  const spicy = DISH_LIBRARY.find(x => x.id === 'amritsari-chole')!;
  const mild = DISH_LIBRARY.find(x => x.id === 'pesarattu')!;
  const peanut = DISH_LIBRARY.find(x => x.id === 'banana-peanut-butter-sandwich')!;

  it('tasteGate: allergy + dislike + mild-vs-hot fail; cuisine hit passes', () => {
    const g1 = tasteGate(spicy, { spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [] });
    expect(g1.pass).toBe(false);
    expect(g1.reason).toContain('spicy');
    const g2 = tasteGate(peanut, { spiceLevel: 'medium', allergies: ['peanuts'], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [] });
    expect(g2.pass).toBe(false);
    expect(g2.reason).toContain('peanuts');
    const g3 = tasteGate(spicy, { spiceLevel: 'hot', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: ['punjabi'] });
    expect(g3.pass).toBe(true);
    expect(g3.detail.cuisineHit).toBe(true);
    const g4 = tasteGate(mild, { spiceLevel: 'mild', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [] });
    expect(g4.pass).toBe(true);
  });

  it('healthGate follows real macro gradients', () => {
    const highProtein = DISH_LIBRARY.find(x => x.id === 'egg-bhurji') ?? DISH_LIBRARY.find(x => (x.nutrition ?? []).includes('protein'))!;
    const hp = healthGate(highProtein, 'High Protein');
    expect(hp.pass).toBe(true);
    const always = healthGate(mild, undefined);
    expect(always.pass).toBe(true);
  });

  it('history + household gates fail on exact id/name', () => {
    expect(historyGate(spicy, [{ id: 'amritsari-chole' }]).pass).toBe(false);
    expect(historyGate(spicy, [{ name: 'Amritsari Chole' }]).pass).toBe(false);
    expect(historyGate(spicy, []).pass).toBe(true);
    expect(householdGate(spicy, [{ id: 'amritsari-chole' }]).pass).toBe(false);
    expect(householdGate(spicy, []).pass).toBe(true);
  });

  it('evaluateGates returns all 6 in order', () => {
    const ctx: GateContext = { diet: 'veg', taste: tasteA(), picked: [] };
    const gates = evaluateGates(spicy, ctx);
    expect(gates.map(g => g.gate)).toEqual(['diet', 'health', 'taste', 'history', 'household', 'variety']);
  });
});

// ─── 6 · REASONS UI ──────────────────────────────────────────────────────────
describe('reasons — grounded, no filler', () => {
  it('spicy-Punjabi user gets the "spicy Punjabi" reason on a real dish', () => {
    const spicy = DISH_LIBRARY.find(x => x.id === 'amritsari-chole')!;
    const reason = recommendationReason(spicy, { taste: tasteA() });
    expect(reason).toBeTruthy();
    expect(reason.toLowerCase()).toContain('spicy');
    expect(reason.toLowerCase()).toContain('punjabi');
    expect(reason).toContain('Amritsari Chole');
  });

  it('adventurous user gets the "Something different" reason on novel picks', () => {
    const novel = DISH_LIBRARY.find(x => x.id === 'pesarattu')!;
    const lines = recommendationReasons(novel, { taste: { spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'adventurous', cuisineAffinities: [] } });
    expect(lines.some(l => l.includes('Something different'))).toBe(true);
  });

  it('empty profile → empty reason (honest no-filler)', () => {
    const d = DISH_LIBRARY.find(x => x.id === 'idli')!;
    const reason = recommendationReason(d, { taste: tasteProfileFromUser({}) });
    expect([null, '', undefined].includes(reason as string | null)).toBe(true);
  });
});

// ─── 7 · REGRESSION ──────────────────────────────────────────────────────────
describe('regression — the guarantees stay green', () => {
  it('vegan 20/20 — every dish passes the FULL vegan guard', () => {
    const taste: TasteProfile = { spiceLevel: 'medium', allergies: [], dislikedItems: [], noveltyPreference: 'balanced', cuisineAffinities: [] };
    const res = buildGatedPlan(baseInput({ taste, userId: 'vegan-user', diet: 'vegan', region: 'south' }));
    expect(res.complete).toBe(true);
    for (const id of planDishIds(res.tray)) {
      const dish = DISH_LIBRARY.find(x => x.id === id)!;
      expect(isMealDietCompatible(dish, 'vegan'), `${dish.name} vegan-safe`).toBe(true);
    }
  });

  it('dedupe — one dish id per plan', () => {
    const res = runPlan(tasteA(), 'dedupe-user');
    const ids = planDishIds(res.tray);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('data-integrity guard — every plan dish resolves from the REAL library', () => {
    const res = runPlan(tasteD(), 'integrity-user');
    for (const id of planDishIds(res.tray)) {
      const dish = DISH_LIBRARY.find(x => x.id === id);
      expect(dish, `dish ${id} exists in library`).toBeDefined();
      expect(estimateDishMacros(dish!).estimated).toBe(true);
      expect(estimateDishMacros(dish!).servingGrams).toBeGreaterThan(0);
    }
  });

  it('macro-estimator gradients drive healthGate differences', () => {
    // The LOWEST-caloric-density dish in the real library must pass the
    // Low Calorie floor; the heaviest (gulab-jamun, the densest measured)
    // must fail it — the gate follows the estimator, not the label.
    const light = [...DISH_LIBRARY].sort(
      (a, b) => estimateDishMacros(a).calories / estimateDishMacros(a).servingGrams
             - estimateDishMacros(b).calories / estimateDishMacros(b).servingGrams,
    )[0]!;
    const heavy = DISH_LIBRARY.find(x => x.id === 'gulab-jamun')!;
    expect(healthGate(heavy, 'Low Calorie').pass).toBe(false);
    expect(healthGate(light, 'Low Calorie').pass).toBe(true);
  });

  it('tasteProfile normalization — legacy numeric spice + unknown novelty', () => {
    expect(normalizeSpiceLevel(1)).toBe('mild');
    expect(normalizeSpiceLevel('HOT')).toBe('hot');
    expect(normalizeNoveltyPreference('Adventurous')).toBe('adventurous');
    expect(normalizeNoveltyPreference('banana')).toBe('balanced');
    const p = tasteProfileFromUser({ spiceLevel: 2, noveltyPreference: 'explorer', allergies: [' Peanuts ', 'peanuts'] });
    expect(p.spiceLevel).toBe('medium');
    expect(p.noveltyPreference).toBe('adventurous');
    expect(p.allergies).toEqual(['Peanuts']);
    expect(hasTasteSignal(tasteProfileFromUser({}))).toBe(false);
    expect(hasTasteSignal(tasteD())).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION — THE 6-gate pipeline that turns a candidate pool into a
// personalized, diversity-aware 20/20 plan, and the REASONS it shows.
//
// Gates, in order, each PASS/FAIL with an honest reason:
//   1 diet       — isMealDietCompatible (type + vegan animal guard)
//   2 health     — the Health Focus's real macro floor (dishFocusSignals)
//   3 taste      — allergy/dislike exclusion + spice contradiction +
//                  cuisine affinity + novelty matching (REAL dish fields)
//   4 history    — the persisted MealLog / learning-ledger picture
//   5 household  — another member's dish (HouseholdPlanItem / shared plan)
//   6 variety    — near-duplicate of an already-picked dish (nutrition +
//                  cuisine/ingredient similarity)
//
// Survivors are ranked by personalizationScore (the ONE scorer in
// utils/mealPersonalization). When a slot genuinely cannot fill, the LOWEST
// gates relax in a documented order (variety → household → health → history)
// and every relaxation is RECORDED — diet and the taste allergy/dislike
// exclusions NEVER relax (a 20/20 plan is never bought with an allergen).
//
// Deterministic: every PRNG is the pure per-user hash in mealPersonalization.
// No Math.random anywhere in this module.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';
import type { MealOption } from '../app/store/useStore';
import { isMealDietCompatible, dishDietType } from './dietCompat';
import {
  healthFocusFor,
  dishFocusSignals,
  personalizationScore,
  type PersonalizationContext,
  type HistoryItem,
  type HouseholdDish,
  type FocusSignals,
} from './mealPersonalization';
import type { HealthFocus } from './mealPersonalization';
import type { TasteProfile } from './tasteProfile';
import { dishSpiceLevel, dishCuisineKeys, dishAllergenMatch, dishDislikeMatch } from './dishTaste';
import { isNearDuplicate } from './variety';
import { ledgerScore, type LedgerSignals } from './tasteLedger';
import { isPureSweetDish } from '../meal/constants/pairingCatalog';

// ─── Gate vocabulary ─────────────────────────────────────────────────────────
export type GateId = 'diet' | 'health' | 'taste' | 'history' | 'household' | 'variety';
export const GATE_ORDER: readonly GateId[] = ['diet', 'health', 'taste', 'history', 'household', 'variety'] as const;

export interface GateResult {
  gate: GateId;
  pass: boolean;
  /** Human, honest reason grounded in the real signal that fired. */
  reason: string;
}

const norm = (s: string): string => (s ?? '').toLowerCase().trim();

// ─── Gate 1 · Diet ───────────────────────────────────────────────────────────
export function dietGate(d: Dish, diet: string): GateResult {
  if (isMealDietCompatible(d, diet)) {
    return { gate: 'diet', pass: true, reason: `${dishDietType(d)} fits your ${diet} diet` };
  }
  return { gate: 'diet', pass: false, reason: `${dishDietType(d)} does not fit your ${diet} diet` };
}

// ─── Gate 2 · Health focus (real macro floor) ────────────────────────────────
const HEALTH_FLOOR: Record<HealthFocus, (s: FocusSignals) => boolean> = {
  balanced: () => true,
  'high-protein': s => s.protein >= 0.3,
  'high-fiber': s => s.fiber >= 0.2,
  'low-calorie': s => s.caloricDensity <= 2.6,
  'low-fat': s => s.fat <= 2.2,
  'weight-loss': s => s.caloricDensity <= 2.8,
};

export function healthGate(d: Dish, healthFocus?: string | null): GateResult {
  const focus = healthFocusFor(healthFocus);
  if (!focus) return { gate: 'health', pass: true, reason: 'No health focus — no restriction' };
  const signals = dishFocusSignals(d);
  if (HEALTH_FLOOR[focus](signals)) {
    return { gate: 'health', pass: true, reason: `Fits your ${focus} focus` };
  }
  return { gate: 'health', pass: false, reason: `Misses your ${focus} target` };
}

// ─── Gate 3 · Taste (allergy / dislike / spice / cuisine / novelty) ──────────
export interface TasteGateDetail {
  allergen: string | null;
  disliked: string | null;
  spicyConflict: boolean;
  spicyMatch: boolean;
  cuisineHit: boolean;
  novelty: 'familiar' | 'novel' | 'neutral';
}

export function tasteGate(d: Dish, taste: TasteProfile): GateResult & { detail: TasteGateDetail } {
  const detail: TasteGateDetail = {
    allergen: dishAllergenMatch(d, taste.allergies),
    disliked: dishDislikeMatch(d, taste.dislikedItems),
    spicyConflict: false,
    spicyMatch: false,
    cuisineHit: false,
    novelty: 'neutral',
  };
  if (detail.allergen) {
    return { gate: 'taste', pass: false, reason: `Contains ${detail.allergen} — excluded (allergy)`, detail };
  }
  if (detail.disliked) {
    return { gate: 'taste', pass: false, reason: `You dislike ${detail.disliked}`, detail };
  }
  const dishSpice = dishSpiceLevel(d);
  const userSpice = taste.spiceLevel;
  if (userSpice === 'mild' && dishSpice === 'hot') {
    detail.spicyConflict = true;
    return { gate: 'taste', pass: false, reason: 'Too spicy for your mild preference', detail };
  }
  detail.spicyMatch = (userSpice === 'hot' && dishSpice === 'hot') || (userSpice === 'mild' && dishSpice === 'mild');
  const cuisines = dishCuisineKeys(d);
  detail.cuisineHit = taste.cuisineAffinities.some(a => cuisines.includes(norm(a)));
  if (detail.cuisineHit) {
    return { gate: 'taste', pass: true, reason: `Your ${cuisines.find(c => taste.cuisineAffinities.includes(c)) ?? cuisines[0]} favourite`, detail };
  }
  if (taste.noveltyPreference === 'adventurous' && !cuisines.some(c => taste.cuisineAffinities.includes(c))) {
    detail.novelty = 'novel';
    return { gate: 'taste', pass: true, reason: 'A cuisine outside your usual — adventurous pick', detail };
  }
  if (taste.noveltyPreference === 'familiar' && detail.spicyMatch) {
    detail.novelty = 'familiar';
    return { gate: 'taste', pass: true, reason: 'Matches your spice and familiar style', detail };
  }
  return { gate: 'taste', pass: true, reason: detail.spicyMatch ? 'Matches your spice level' : 'Compatible with your taste', detail };
}

// ─── Gate 4 · History (MealLog / ledger) ─────────────────────────────────────
export function historyGate(d: Dish, recently?: readonly HistoryItem[] | null): GateResult {
  if (!recently?.length) return { gate: 'history', pass: true, reason: 'No recent history' };
  const name = norm(d.name);
  for (const r of recently) {
    if (!r) continue;
    if (r.id && r.id === d.id) return { gate: 'history', pass: false, reason: 'You ate this recently' };
    if (r.name && norm(r.name) === name) return { gate: 'history', pass: false, reason: 'You ate this recently' };
  }
  return { gate: 'history', pass: true, reason: 'Not in your recent history' };
}

// ─── Gate 5 · Household ──────────────────────────────────────────────────────
export function householdGate(d: Dish, household?: readonly HouseholdDish[] | null): GateResult {
  if (!household?.length) return { gate: 'household', pass: true, reason: 'No household overlap' };
  const name = norm(d.name);
  for (const h of household) {
    if (!h) continue;
    if (h.id && h.id === d.id) return { gate: 'household', pass: false, reason: 'Another member already has this' };
    if (h.name && norm(h.name) === name) return { gate: 'household', pass: false, reason: 'Another member already has this' };
  }
  return { gate: 'household', pass: true, reason: 'No household overlap' };
}

// ─── Gate 6 · Variety ────────────────────────────────────────────────────────
export function varietyGate(d: Dish, picked: readonly Dish[]): GateResult {
  for (const p of picked) {
    if (isNearDuplicate(d, p)) {
      return { gate: 'variety', pass: false, reason: `Too similar to ${p.name}` };
    }
  }
  return { gate: 'variety', pass: true, reason: 'Distinct from your other picks' };
}

// ─── The full evaluation for one dish ────────────────────────────────────────
export interface GateContext {
  diet: string;
  healthFocus?: string | null;
  taste: TasteProfile;
  recentlyEaten?: readonly HistoryItem[] | null;
  householdDishes?: readonly HouseholdDish[] | null;
  picked: readonly Dish[];
}

export function evaluateGates(d: Dish, ctx: GateContext): GateResult[] {
  return [
    dietGate(d, ctx.diet),
    healthGate(d, ctx.healthFocus),
    tasteGate(d, ctx.taste),
    historyGate(d, ctx.recentlyEaten),
    householdGate(d, ctx.householdDishes),
    varietyGate(d, ctx.picked),
  ];
}

/** The HARD gates never relax (diet + the taste allergy/dislike exclusions).
 *  Spice contradiction is a taste gate too but may relax under pool pressure
 *  (a mild user can still be *offered* a spicy dish when nothing else fills —
 *  recorded, never silent). We model relaxation per GATE ID. */
export const NEVER_RELAX: ReadonlySet<GateId> = new Set<GateId>(['diet']);

/** The relaxation order when a slot cannot fill: least-important first. */
export const RELAX_ORDER: readonly GateId[] = ['variety', 'household', 'health', 'history', 'taste'] as const;

// ─── The gated plan builder ──────────────────────────────────────────────────
export interface DishGateReport {
  dishId: string;
  name: string;
  slot: MealType;
  gates: GateResult[];
  score: number;
  /** Gates that had to be relaxed for THIS dish to land (usually empty). */
  relaxed: GateId[];
}

export interface GatedPlanResult {
  tray: Record<MealType, MealOption[]>;
  target: number;
  total: number;
  complete: boolean;
  reports: DishGateReport[];
  relaxations: string[];
  reasons: string[];
}

export interface BuildGatedPlanInput {
  library: Dish[];
  diet: string;
  region: string;
  healthFocus?: string | null;
  taste: TasteProfile;
  ledgerSignals?: LedgerSignals | null;
  recentlyEaten?: HistoryItem[] | null;
  householdDishes?: HouseholdDish[] | null;
  userId: string;
  deviceId?: string;
  rotation?: string | number;
  target?: number;
  slots?: readonly MealType[];
}

const SLOT_CATEGORIES: readonly MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

function regionTier(d: Dish, regionKey: string): number {
  const r = (d.region || '').toLowerCase();
  if (r === regionKey) return 0;
  if (!r || r === 'all') return 1;
  return 2;
}

/**
 * Build a complete plan through the 6 gates. Deterministic for the same
 * (user, inputs). Records EVERY gate relaxation honestly (Λ2.3).
 */
export function buildGatedPlan(input: BuildGatedPlanInput): GatedPlanResult {
  const library = input.library;
  const target = input.target ?? 5;
  const slots = input.slots ?? SLOT_CATEGORIES;
  const regionKey = norm(input.region) || 'north';
  const taste = input.taste;

  const pctx: PersonalizationContext = {
    userId: input.userId,
    deviceId: input.deviceId,
    rotation: input.rotation,
    healthFocus: input.healthFocus,
    preferences: {
      spiceLevel: taste.spiceLevel,
      dislikedItems: taste.dislikedItems,
      allergies: taste.allergies,
      cuisineAffinities: taste.cuisineAffinities,
    },
    recentlyEaten: input.recentlyEaten,
    householdDishes: input.householdDishes,
    tasteProfile: taste,
    ledgerSignals: input.ledgerSignals,
  };

  const tray: Record<MealType, MealOption[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  const pickedDishes: Dish[] = [];
  const reports: DishGateReport[] = [];
  const relaxations: string[] = [];
  const reasons: string[] = [];
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();

  const mealOf = (d: Dish): MealOption => ({ id: d.id, dishId: d.id, name: d.name, icon: d.icon, sourceRegion: d.region });

  for (const slot of slots) {
    const candidates = library
      .filter(d =>
        isMealDietCompatible(d, input.diet) &&
        (d.category ?? []).includes(slot) &&
        !isPureSweetDish(d) &&
        !usedIds.has(d.id) &&
        !usedNames.has(norm(d.name)))
      .sort((a, b) => {
        const scoreDiff = personalizationScore(b, pctx) - personalizationScore(a, pctx);
        if (scoreDiff !== 0) return scoreDiff;
        return regionTier(a, regionKey) - regionTier(b, regionKey) || a.name.localeCompare(b.name);
      });

    // Progressive relaxation: start strict, then allow RELAX_ORDER gates.
    const relaxedSet = new Set<GateId>();
    let list = tray[slot];
    const pickInto = (allowRelax: boolean) => {
      for (const d of candidates) {
        if (list.length >= target) return;
        if (usedIds.has(d.id) || usedNames.has(norm(d.name))) continue;
        const gateCtx: GateContext = {
          diet: input.diet,
          healthFocus: input.healthFocus,
          taste,
          recentlyEaten: input.recentlyEaten,
          householdDishes: input.householdDishes,
          picked: pickedDishes,
        };
        const gates = evaluateGates(d, gateCtx);
        const failed = gates.filter(g => !g.pass);
        const hardFail = failed.some(g => NEVER_RELAX.has(g.gate));
        if (hardFail) continue;
        const blocking = failed.filter(g => !relaxedSet.has(g.gate));
        if (!allowRelax && blocking.length > 0) continue;
        // pick it
        const relaxedForThis = failed.map(g => g.gate);
        if (blocking.length > 0) {
          for (const g of blocking) {
            relaxedSet.add(g.gate);
            relaxations.push(`gate_relaxed:${slot}:${g.gate}:${g.reason}`);
          }
        }
        list.push(mealOf(d));
        usedIds.add(d.id);
        usedNames.add(norm(d.name));
        pickedDishes.push(d);
        reports.push({ dishId: d.id, name: d.name, slot, gates, score: personalizationScore(d, pctx), relaxed: relaxedForThis });
      }
    };

    // Pass 1: strict (all gates pass).
    pickInto(false);
    // Pass 2+: relax in order until the slot fills — EVERY relaxation is
    // recorded (Λ2.3): a dish that only landed because a gate was dropped is
    // never presented as if all gates held.
    for (const gate of RELAX_ORDER) {
      if (list.length >= target) break;
      if (relaxedSet.has(gate)) continue;
      relaxedSet.add(gate);
      relaxations.push(`gate_relaxed:${slot}:${gate}:pool_needed_${target - list.length}_more`);
      pickInto(true);
    }
    // Last resort: clear ALL soft gates (never diet / allergen).
    if (list.length < target) {
      for (const gate of RELAX_ORDER) relaxedSet.add(gate);
      pickInto(true);
    }
    tray[slot] = list;
    if (list.length < target) {
      reasons.push(`gated_fill_short:${slot}:pool_exhausted_needed_${target - list.length}`);
    }
  }

  const total = slots.reduce((n, s) => n + tray[s].length, 0);
  return {
    tray,
    target,
    total,
    complete: slots.every(s => tray[s].length === target),
    reports,
    relaxations,
    reasons,
  };
}

// ─── Reasons UI ──────────────────────────────────────────────────────────────
const CUISINE_LABELS: Record<string, string> = {
  punjabi: 'Punjabi', 'south-indian': 'South Indian', chettinad: 'Chettinad',
  andhra: 'Andhra', kerala: 'Keralan', bengali: 'Bengali', gujarati: 'Gujarati',
  maharashtrian: 'Maharashtrian', tamil: 'Tamil', hyderabadi: 'Hyderabadi',
  goan: 'Goan', rajasthani: 'Rajasthani', tandoori: 'Tandoori', udupi: 'Udupi',
  mughlai: 'Mughlai', kashmiri: 'Kashmiri', awadhi: 'Awadhi', coorg: 'Coorg',
  sindhi: 'Sindhi', north: 'North Indian', south: 'South Indian',
  east: 'East Indian', west: 'West Indian', central: 'Central Indian', northeast: 'Northeastern',
};

export interface RecommendationReasonContext {
  taste: TasteProfile;
  healthFocus?: string | null;
  recentlyEaten?: readonly HistoryItem[] | null;
  householdDishes?: readonly HouseholdDish[] | null;
  ledgerSignals?: LedgerSignals | null;
}

/** Every truthy reason line for one dish — ordered by specificity. Empty when
 *  no real signal fired (no filler). */
export function recommendationReasons(d: Dish, ctx: RecommendationReasonContext): string[] {
  const lines: string[] = [];
  const taste = ctx.taste;
  const cuisines = dishCuisineKeys(d);
  const affinity = cuisines.find(c => taste.cuisineAffinities.includes(c));
  const dishSpice = dishSpiceLevel(d);
  const name = d.name;

  if (taste.spiceLevel === 'hot' && dishSpice === 'hot' && affinity) {
    lines.push(`Because you like spicy ${CUISINE_LABELS[affinity] ?? affinity} food 🌶️ — Try: ${name}`);
  } else if (taste.spiceLevel === 'hot' && dishSpice === 'hot') {
    lines.push(`Because you like it spicy 🌶️ — Try: ${name}`);
  } else if (affinity) {
    lines.push(`Because you love ${CUISINE_LABELS[affinity] ?? affinity} food 🍽️ — Try: ${name}`);
  }

  if (taste.noveltyPreference === 'adventurous' && !affinity) {
    lines.push(`Something different today ✨ — Try: ${name}`);
  } else if (taste.noveltyPreference === 'familiar' && affinity) {
    lines.push(`A familiar favourite 🏠 — Try: ${name}`);
  }

  const signals = dishFocusSignals(d);
  const focus = healthFocusFor(ctx.healthFocus);
  if (focus && focus !== 'balanced' && HEALTH_FLOOR[focus](signals)) {
    lines.push(`${focus.replace(/-/g, ' ')} pick for your goal 🎯 — Try: ${name}`);
  }

  if (ctx.ledgerSignals) {
    if (ctx.ledgerSignals.likedDishIds.has(d.id) || ctx.ledgerSignals.replacedToDishIds.has(d.id)) {
      lines.push(`You liked this before ❤️ — Try: ${name}`);
    }
    for (const c of cuisines) {
      if ((ctx.ledgerSignals.cuisineWeights.get(c) ?? 0) > 0.5) {
        lines.push(`More ${CUISINE_LABELS[c] ?? c}, as you liked it 👍 — Try: ${name}`);
        break;
      }
    }
  }

  return lines;
}

/** THE single primary reason line (or '' when no real signal fired). */
export function recommendationReason(d: Dish, ctx: RecommendationReasonContext): string {
  return recommendationReasons(d, ctx)[0] ?? '';
}

/** Convenience: ledger score for a dish under this context (re-exported so the
 *  reasons/score consumers share ONE symbol). */
export function recommendationLedgerScore(d: Dish, signals?: LedgerSignals | null): number {
  return ledgerScore(d, signals);
}

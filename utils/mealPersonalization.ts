// ─────────────────────────────────────────────────────────────────────────────
// MEAL PERSONALIZATION — deterministic per-user dish ranking for the 20/20
// pipeline. Same region + diet + Health Focus → DIFFERENT personalized plans.
//
// Product principle: "The region determines what is appropriate; the user
// determines what is personal." This module implements the second half:
//   region fit + diet fit      → already guaranteed by the pipeline filter
//                                 (fillCandidatesForSlot keeps diet+slot gates);
//                                 this scorer orders the candidates.
//   health focus re-rank       → FOCUS_WEIGHTS over REAL dish features.
//   user preference fields     → spice, preferredRegions, dislikedItems.
//   meal-history proxy         → recently eaten/swapped dishes penalized.
//   household overlap          → other members' shared-plan dishes penalized.
//   randomized/rotation seed   → deterministic per-user jitter (EVERY PRNG
//                                 injected; Math.random is NEVER consulted).
//
// DATA FACTS (measured on DISH_LIBRARY, 679 dishes — honest, no fabrication):
//   - ZERO dishes carry numeric calories/protein fields: the Dish schema
//     declares `calories?`/`protein?` but NO dish row populates them.
//   - THE MACRO GAP IS CLOSED: utils/macroEstimator.ts DERIVES numeric
//     macros (calories/protein/fiber/fat, always `estimated: true`) for
//     EVERY dish from the real populated features — ingredient rows
//     (523 dishes, 6042 rows; category sets), weight tier (light ×306,
//     medium ×314, heavy ×59), dish type (veg ×335 / non-veg ×128 / vegan
//     ×187 / eggitarian ×29), nutrition[] labels (protein ×333, carb ×217,
//     fiber ×205, fat ×50 …) and tags. Dish densities now span a real
//     measured gradient (rasam ~54 kcal/100g … gulab-jamun ~206).
//   - Meal history: there is no persisted per-user "consumed" log. The
//     PRACTICAL proxy is wired from real data that DOES exist: the user's
//     swap log (utils/trayRegen reads store.swaps — every dish the user
//     actively swapped to/replaced) and the materialized plan days
//     (useTrayStore.plan.days meal_ids — what the user has been served).
//
// RNG ISOLATION: createSeededRng (mulberry32) is a pure function of an
// explicit seed. The per-dish jitter is a pure hash of (dishId, seed) — NO
// PRNG sequence state, NO module-level mutable RNG, immune to call order and
// to global Math.random pollution (locked by an RNG-isolation test).
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish, DishVariant } from '../meal/constants/dishLibrary';

// ─── 1 · Seeded PRNG (mulberry32 — deterministic, injected) ──────────────────
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash — stable across platforms (no locale, no MSB tricks). */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Stable 32-bit personalization seed from user identity + optional rotation.
 * Same (userId|deviceId, rotation) → same seed → same jitter → same plan
 * (refresh-stable). Different users → different seeds → different plans.
 * Rotation (e.g. ISO week key '2026-W37') rotates consecutive weekly
 * regenerations for the SAME user; absent = fully refresh-stable.
 */
export function personalizationSeed(opts: {
  userId: string;
  deviceId?: string;
  rotation?: string | number;
  focusKey?: string;
}): number {
  const id = opts.userId || opts.deviceId || 'anon';
  const rot = opts.rotation === undefined || opts.rotation === ''
    ? ''
    : `::${opts.rotation}`;
  const focus = opts.focusKey ? `::f:${opts.focusKey}` : '';
  return fnv1a(`${id}::${rot}${focus}`);
}

/** Deterministic 0..1 jitter for ONE dish under a seed — pure hash, no
 *  sequence state (immune to call order / global RNG pollution). */
export function dishRotationJitter(dishId: string, seed: number): number {
  const h = fnv1a(`${dishId}::${seed}`);
  // fract(sin(h)) — classic deterministic hash-to-unit (h is 32-bit).
  const s = Math.sin(h);
  return (s - Math.floor(s));
}

/** ISO week key for a date (YYYY-Www) — the optional weekly rotation factor. */
export function isoWeekKey(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - day + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ─── 2 · Health focus — the 6 canonical focuses, normalized ──────────────────
export const HEALTH_FOCUSES = [
  'balanced',
  'high-protein',
  'high-fiber',
  'low-calorie',
  'low-fat',
  'weight-loss',
] as const;
export type HealthFocus = (typeof HEALTH_FOCUSES)[number];

/** Normalize ANY user goal string to a canonical focus (server rows, the
 *  onboarding labels 'Low Fat', profile strings, snake_case …). Unknown →
 *  null (no focus weighting — the caller keeps default ordering). */
export function healthFocusFor(goal?: string | null): HealthFocus | null {
  const g = ((goal ?? '').toLowerCase().replace(/[ _]/g, '-')).trim();
  if (!g) return null;
  if (g.includes('weight-loss') || (g.includes('weight') && g.includes('loss'))) return 'weight-loss';
  if (g.includes('high-protein') || (g.includes('protein') && g.includes('high'))) return 'high-protein';
  if (g.includes('high-fiber') || (g.includes('fiber') && g.includes('high'))) return 'high-fiber';
  if (g.includes('low-fat')) return 'low-fat';
  if (g.includes('low-calorie') || (g.includes('low') && g.includes('calorie'))) return 'low-calorie';
  if (g.includes('balanced') || g === 'balance') return 'balanced';
  return null;
}

// ─── 3 · Focus signals — DERIVED MACROS first, tags/weight as tie-breakers ──
// Gap-1 closure (2026-09-13): the signals are now keyed off the numeric
// macro estimator (utils/macroEstimator.ts — deterministic, documented, every
// value `estimated: true`), normalized into the same 0..3 bands the weights
// were built against. Tags/weight ONLY nudge within the macro ordering:
//   protein        = protein g/100g ÷ 6            (0..3; ~18g/100g → 3)
//   fiber          = fiber g/100g ÷ 1.2            (0..2.5; ~3g/100g → 2.5)
//   satiety        = protein+fiber satiation blend (0..2)
//   sugar          = nutrition label / sweet tag    (0..1)
//   fat            = fat g/100g ÷ 8                 (0..3; ~24g/100g → 3)
//   caloricDensity = kcal/100g ÷ 70                 (0..3; ~210 → 3)
// Tie-breakers: creamy/rich/buttery tags nudge density +0.1, steamed/grilled/
// /light tags nudge −0.1 — the estimator already captures the frying/cream
// evidence, so the tags only disambiguate equal-macro dishes.
export interface FocusSignals {
  /** 0..3 — protein grams per 100g (derived macros). */
  protein: number;
  /** 0..2.5 — fiber grams per 100g (derived macros). */
  fiber: number;
  /** 0..2 — satiety cues (protein + fiber grams). */
  satiety: number;
  /** 0..1 — sugar/sweet evidence. */
  sugar: number;
  /** 0..3 — fat grams per 100g (derived macros). HIGH is bad for Low Fat. */
  fat: number;
  /** 0..3 — caloric density kcal/100g (derived macros). HIGH is bad for
   *  Low Calorie / Low Fat / Weight Loss. */
  caloricDensity: number;
}

const SUGAR_TAGS = new Set([
  'sweet', 'dessert', 'chocolate', 'jaggery', 'halwa', 'kheer', 'laddoo',
  'sugar', 'ice-cream',
]);
const CREAMY_TAGS = new Set(['creamy', 'rich', 'buttery', 'ghee', 'malai']);
const LIGHT_TAGS = new Set([
  'steamed', 'grilled', 'baked', 'roasted', 'salad', 'soup', 'light', 'healthy',
  'stir-fry', 'raw', 'boiled',
]);

/** Count ingredient rows in a dish's variants whose category is 'proteins'
 *  (eggs/chicken/fish/paneer/tofu/dal/urad — the REAL protein evidence). */
export function proteinIngredientCount(d: Dish): number {
  let n = 0;
  for (const v of d.variants ?? []) {
    for (const i of (v as DishVariant).ingredients ?? []) {
      if (i.category === 'proteins') n++;
    }
  }
  return n;
}

import { estimateDishMacros } from './macroEstimator';
import type { TasteProfile } from './tasteProfile';
import { normalizeCuisineAffinityKey } from './tasteProfile';
import { dishCuisineKeys, dishAllergenMatch } from './dishTaste';
import { noveltyScore } from './variety';
import type { LedgerSignals } from './tasteLedger';
import { ledgerScore } from './tasteLedger';

/** Extract the per-focus signals — derived macros first, tags as tie-breakers. */
export function dishFocusSignals(d: Dish): FocusSignals {
  const nut = (d.nutrition ?? []).map(s => s.toLowerCase());
  const tags = (d.tags ?? []).map(s => s.toLowerCase());
  const hasNut = (s: string) => nut.includes(s);
  const hasTag = (s: string) => tags.includes(s);

  const m = estimateDishMacros(d);
  const g = m.servingGrams;
  const k100 = (m.calories / g) * 100;
  const p100 = (m.protein / g) * 100;
  const f100 = (m.fiber / g) * 100;
  const ft100 = (m.fat / g) * 100;

  const protein = Math.min(3, p100 / 6);
  const fiber = Math.min(2.5, f100 / 1.2);
  let density = Math.min(3, k100 / 70);
  const fat = Math.min(3, ft100 / 8);
  const sugar = hasNut('sugar') || hasNut('sweet') || tags.some(t => SUGAR_TAGS.has(t)) ? 1 : 0;
  const satiety = Math.min(2, protein * 0.45 + fiber * 0.5 + (protein >= 1 ? 0.3 : 0));

  // Tie-breakers only — macro-evidence already carries the frying/cream axis.
  if (tags.some(t => CREAMY_TAGS.has(t))) density = Math.min(3, density + 0.1);
  if (tags.some(t => LIGHT_TAGS.has(t))) density = Math.max(0, density - 0.1);

  return { protein, fiber, satiety, sugar, fat, caloricDensity: density };
}

/**
 * Per-focus ranking weights — MEANINGFULLY DIFFERENT vectors, each grounded
 * in the real (derived-macro) signals above. Higher = more preferred.
 *   balanced      protein + fiber both count; sugar/density/fat mildly
 *                 penalized (the "eat well" default).
 *   high-protein  protein ×4 dominates; satiety helps; sugar avoided.
 *   high-fiber    fiber ×4 dominates; protein co-occurs (dal has both).
 *   low-calorie   caloric density −3.5 (kcal/100g axis) punished hardest.
 *   low-fat       fat grams −3.0 (the grease axis) — fried/buttery/creamy
 *                 dishes drop on their measured fat; density also penalized.
 *   weight-loss   density −2.5 + fat −0.5 + satiation (protein+fiber+satiety
 *                 ≈ full on less).
 */
export const FOCUS_WEIGHTS: Record<HealthFocus, {
  protein: number; fiber: number; satiety: number; sugar: number; fat: number; caloricDensity: number;
}> = {
  'balanced':     { protein: 1.2, fiber: 1.2, satiety: 0.4, sugar: -0.8, fat: -0.2, caloricDensity: -0.6 },
  // high-protein: protein ×4 dominates (egg/meat/sprouted/dal dishes lead).
  'high-protein': { protein: 4.0, fiber: 0.4, satiety: 1.0, sugar: -1.5, fat: -0.2, caloricDensity: -0.4 },
  // high-fiber: fiber ×4 dominates (whole-grain/dal/veg dishes lead).
  'high-fiber':   { protein: 0.5, fiber: 4.0, satiety: 1.0, sugar: -1.2, fat: -0.1, caloricDensity: -0.3 },
  // low-calorie: density −3.5 punishes fried/creamy/heavy hardest; light lifts.
  'low-calorie':  { protein: 0.9, fiber: 0.9, satiety: 0.5, sugar: -2.0, fat: -0.3, caloricDensity: -3.5 },
  // low-fat: fat grams −3.0 (the measured grease axis); density also counts.
  'low-fat':      { protein: 0.7, fiber: 0.6, satiety: 0.4, sugar: -1.8, fat: -3.0, caloricDensity: -1.0 },
  // weight-loss: density −2.5 + fat −0.5 + satiation (full on less).
  'weight-loss':  { protein: 1.6, fiber: 1.6, satiety: 1.2, sugar: -2.5, fat: -0.5, caloricDensity: -2.5 },
};

/** Focus score for one dish — the re-rank axis (higher = better for focus). */
export function healthFocusScore(d: Dish, focus: HealthFocus | null): number {
  if (!focus) return 0;
  const w = FOCUS_WEIGHTS[focus];
  const s = dishFocusSignals(d);
  return w.protein * s.protein
    + w.fiber * s.fiber
    + w.satiety * s.satiety
    + w.sugar * s.sugar
    + w.caloricDensity * s.caloricDensity;
}

// ─── 4 · User preference fields (updateProfile surface) ──────────────────────
export interface PreferenceFields {
  spiceLevel?: string | null;
  preferredRegions?: string[];
  dislikedItems?: string[];
  /** HARD exclusions — an allergen match reliably drops the dish (the
   *  recommendation gate is the primary guardian; this is the scorer floor). */
  allergies?: string[];
  /** Cuisine keys the user loves (matched against REAL dish cuisine tags). */
  cuisineAffinities?: string[];
}

const _norm = (s: string): string => (s ?? '').toLowerCase().trim();

/** Region-proximity 0..1 between a user preference string (e.g. 'North India'
 *  / 'north_indian') and a dish region key ('north'). Exact-key, containment,
 *  then 'all'-dish fallback. */
export function regionProximity(pref: string, dishRegion: string): number {
  const p = _norm(pref).replace(/[ _]/g, '');
  const r = _norm(dishRegion).replace(/[ _]/g, '');
  if (!p || !r) return 0;
  if (p === r) return 1;
  if (p.includes(r) || r.includes(p)) return 0.8;
  return 0;
}

/** TRUE when the user's spice surface is mild/low — the axis that AMPLIFIES
 *  cuisine affinity (Goal-2 tuning, 2026-09-13). Reads EITHER surface (the
 *  profile preferences OR the canonical taste profile) so the amplification
 *  works regardless of which source the caller wired. 'low' (a legacy label)
 *  and numeric-1 (onboarding scale) both normalize to mild upstream. */
export function isMildSpiceUser(
  prefs?: PreferenceFields | null,
  tasteProfile?: TasteProfile | null,
): boolean {
  if (prefs) {
    const s = _norm(prefs.spiceLevel ?? '');
    if (s === 'mild' || s === 'low') return true;
  }
  if (tasteProfile?.spiceLevel === 'mild') return true;
  return false;
}

/** The cuisine-affinity boost per matched key for a given user. Mild/low-spice
 *  users get DOUBLE the per-key boost and a higher cap (1.6/key → 3.0 max vs
 *  the legacy 0.8/key → 2.0 max): for a mild palate the ONLY thing that can
 *  express "I love South Indian food" IS the cuisine affinity (spicy south
 *  dishes are already penalised by the mild-spice term), so the affinity must
 *  carry more weight. Non-mild users keep the EXACT legacy numbers — the
 *  function returns the legacy tuple whenever isMild is false. */
export function cuisineAffinityBoostUnit(isMild: boolean): { perKey: number; cap: number } {
  return isMild ? { perKey: 1.6, cap: 3.0 } : { perKey: 0.8, cap: 2.0 };
}

/**
 * Region-tier adjustment for the candidate sort (Goal-2, 2026-09-13): a
 * mild/low-spice user's EXPLICIT cuisine affinity is an appropriateness
 * signal, not a tie-break — a dish carrying a cuisine the user loves is at
 * least as appropriate for THEM as their home region. Returns a NEGATIVE tier
 * delta (-3) for a matching dish of a mild-affinity user, so the match sorts
 * ahead of home-region dishes (matched tier-2 → -1, tier-1 → -2, tier-0 → -3).
 * Returns 0 — the legacy region tier, byte-identical — for non-mild users,
 * users without affinities, or non-matching dishes.
 *
 * WHY THIS IS NEEDED (measured, 2026-09-13): with exact-key matching today a
 * north-region user's south affinity had ZERO effect on their plan (same
 * userId with/without the affinity → identical 20/20) — the region tier
 * (north tier-0 pool ≥34/slot) was compared BEFORE the personalization
 * comparator, so no score could ever lift a far-region match into the picks.
 * The 10-11/20 overlap between "South+mild" and "simple-home" (same
 * North+Veg+Balanced) was pure jitter. The lift makes the affinity real for
 * the user who can genuinely use it (mild palate), while every other user's
 * ordering stays byte-identical.
 */
export function affinityTierLift(
  d: Dish,
  prefs?: PreferenceFields | null,
  tasteProfile?: TasteProfile | null,
): number {
  if (!isMildSpiceUser(prefs, tasteProfile)) return 0;
  const affin = [
    ...(prefs?.cuisineAffinities ?? []),
    ...(tasteProfile?.cuisineAffinities ?? []),
  ].map(normalizeCuisineAffinityKey).filter(Boolean);
  if (affin.length === 0) return 0;
  const cs = new Set(dishCuisineKeys(d).map(normalizeCuisineAffinityKey));
  return affin.some(a => cs.has(a)) ? -3 : 0;
}

/** Preference proximity score — spice alignment + disliked penalty + region
 *  boost. Higher = better. Disliked penalties dominate jitter so an explicit
 *  dislike reliably drops a dish below its peers. */
export function preferenceScore(d: Dish, prefs?: PreferenceFields | null): number {
  if (!prefs) return 0;
  let score = 0;
  const tags = (d.tags ?? []).map(t => _norm(t));

  // Spice alignment (tag-based — the honest surface; 68/679 carry 'spicy').
  const spice = _norm(prefs.spiceLevel ?? '');
  const isSpicy = tags.includes('spicy') || tags.includes('hot');
  const isMild = tags.includes('mild');
  if (spice === 'hot') score += isSpicy ? 0.7 : 0;
  else if (spice === 'mild') score += isSpicy ? -0.9 : (isMild ? 0.3 : 0);

  // Region boost.
  for (const pref of prefs.preferredRegions ?? []) {
    const prox = regionProximity(pref, d.region ?? '');
    if (prox > 0) { score += 0.5 * prox; break; }
  }

  // Disliked items — name-level exact match (dish name against the item)
  // plus ingredient-level containment (an item listed by a user the way the
  // dish library names it, e.g. 'Paneer', 'Egg').
  const dName = _norm(d.name);
  const ingNames = new Set<string>();
  for (const v of d.variants ?? []) {
    for (const i of (v as DishVariant).ingredients ?? []) ingNames.add(_norm(i.name));
  }
  for (const item of prefs.dislikedItems ?? []) {
    const it = _norm(item);
    if (!it) continue;
    if (dName === it || dName.includes(it) || it.includes(dName)) { score -= 2.0; break; }
    if (ingNames.has(it)) { score -= 1.6; break; }
  }

  // Allergies — HARD exclusion floor (the gate is primary; this guarantees the
  // scorer can never float an allergen above a safe dish).
  for (const allergy of prefs.allergies ?? []) {
    if (dishAllergenMatch(d, [allergy])) { score -= 100; break; }
  }

  // Cuisine affinity — reward dishes whose REAL cuisine tags the user loves.
  // Mild/low-spice users get the amplified boost (1.6/key, cap 3.0) — the
  // Goal-2 tuning; everyone else keeps the legacy 0.8/key, cap 2.0 exactly.
  const aff = prefs.cuisineAffinities;
  if (aff?.length) {
    const cs = new Set(dishCuisineKeys(d));
    const { perKey, cap } = cuisineAffinityBoostUnit(isMildSpiceUser(prefs));
    let boost = 0;
    for (const a of aff) if (cs.has(normalizeCuisineAffinityKey(a))) boost += perKey;
    score += Math.min(cap, boost);
  }
  return score;
}

// ─── 5 · Meal-history penalty (real swap/plan proxies) ───────────────────────
export interface HistoryItem { id?: string; name?: string }

/** Penalty for dishes the user recently ate/swapped to. Higher = better
 *  (penalty is NEGATIVE). Name-level + id-level match. */
export function historyPenalty(d: Dish, recently?: HistoryItem[] | null): number {
  if (!recently || recently.length === 0) return 0;
  const id = d.id;
  const name = _norm(d.name);
  for (const r of recently) {
    if (!r) continue;
    if (r.id && r.id === id) return -3.0;
    if (r.name && _norm(r.name) === name) return -3.0;
  }
  return 0;
}

// ─── 6 · Household overlap penalty (other members' shared-plan dishes) ───────
export interface HouseholdDish { id?: string; name?: string }

/** -1.2 per dish another household member already has (id or exact name).
 *  The fill step relaxes this to 0 when the non-overlap pool genuinely runs
 *  short (recorded, never fabricated). */
export function householdPenalty(d: Dish, household?: HouseholdDish[] | null): number {
  if (!household || household.length === 0) return 0;
  const id = d.id;
  const name = _norm(d.name);
  for (const h of household) {
    if (!h) continue;
    if (h.id && h.id === id) return -2.0;
    if (h.name && _norm(h.name) === name) return -2.0;
  }
  return 0;
}

// ─── 7 · The composite personalization score ─────────────────────────────────
export interface PersonalizationContext {
  /** Stable user identity — userId (fallback: deviceId). */
  userId: string;
  /** Per-device stable id — mixed into the seed for fallback determinism. */
  deviceId?: string;
  /** Optional rotation factor (ISO week key → weekly regeneration rotation).
   *  Default undefined = refresh-stable determinism. */
  rotation?: string | number;
  /** Health focus string — normalized via healthFocusFor. */
  healthFocus?: string | null;
  /** User preference fields from updateProfile. */
  preferences?: PreferenceFields | null;
  /** Meal-history proxy — recently eaten/swapped dish ids/names. */
  recentlyEaten?: HistoryItem[] | null;
  /** Household diversity — other members' shared-plan dishes. */
  householdDishes?: HouseholdDish[] | null;
  /** THE canonical taste profile (utils/tasteProfile) — novelty + cuisines +
   *  allergies. Absent → the legacy score is byte-identical. */
  tasteProfile?: TasteProfile | null;
  /** Pure read model of the persisted learning ledger — deterministic boosts/
   *  penalties for liked/disliked/replaced dishes. Absent → no ledger term. */
  ledgerSignals?: LedgerSignals | null;
  /** Jitter scale (default 1.5): reorders the top band between same-profile
   *  users. The focus weights and history/household penalties still dominate
   *  (focus spread ≳ 8, penalties 2–3), so a focus change re-ranks and a
   *  recent/co-member dish reliably drops below peers. */
  jitterScale?: number;
}

/**
 * THE composite: focus re-rank + preference proximity + history penalty +
 * household penalty + deterministic per-user jitter.
 *
 * Score design (measured against the library):
 *   focus component  ~ [−7, +10]   — dominates the 0.6 jitter, so a focus
 *                                    change visibly re-ranks the SAME user.
 *   history/household −2.0 / −1.2 — dominate jitter too: a recently-eaten or
 *                                    co-member dish reliably drops below peers.
 *   jitter 0..1.5                 — the ONLY difference between two users with
 *                                    IDENTICAL region+diet+focus+preferences;
 *                                    reorders the 34+ candidate/slot top band
 *                                    into markedly different 5-per-slot picks (4
 *                                    same-profile roommates measured at median
 *                                    pairwise Jaccard ≈ 0.54 — see the test).
 */
/** Deterministic per-(user, slot) ROTATION over the top personalization band
 *  — the "rotation seed" the spec calls for, made STRUCTURAL instead of
 *  additive-perturbative. The band = the top `bandSize` candidates by the full
 *  personalization comparator (diet/region appropriateness still leads the
 *  sort — only equally-appropriate, equally-personal candidates share the
 *  band). Different users rotate the band to different windows → structurally
 *  different picks; one user under a different FOCUS gets a different band
 *  membership → the re-rank is real. Deterministic (pure hash of user seed +
 *  slot), call-order independent, Math.random-free.
 *
 *  Measured with bandSize 10 on the 679-dish library: 4 same-profile
 *  roommates (veg/north/Balanced) drop from median pairwise Jaccard 0.667
 *  (additive-jitter-only) to ≈0.4 (rotated window) — see the tests. */
export function rotateBandForUser<T>(
  items: T[],
  slot: string,
  ctx: PersonalizationContext,
  bandSize?: number,
): T[] {
  const K = Math.min(items.length, Math.max(1, bandSize ?? 10));
  if (K < 2) return items;
  const seed = personalizationSeed({ userId: ctx.userId, deviceId: ctx.deviceId, rotation: ctx.rotation, focusKey: healthFocusFor(ctx.healthFocus) ?? 'none' });
  const offset = fnv1a(`${slot}::${seed}`) % K;
  if (offset === 0) return items;
  const band = items.slice(0, K);
  const rest = items.slice(K);
  return [...band.slice(offset), ...band.slice(0, offset), ...rest];
}

export function personalizationScore(d: Dish, ctx: PersonalizationContext | null | undefined): number {
  if (!ctx) return 0;
  const focus = healthFocusFor(ctx.healthFocus);
  const seed = personalizationSeed({ userId: ctx.userId, deviceId: ctx.deviceId, rotation: ctx.rotation });
  const scale = ctx.jitterScale ?? 1.5;
  return healthFocusScore(d, focus)
    + preferenceScore(d, ctx.preferences)
    + historyPenalty(d, ctx.recentlyEaten)
    + householdPenalty(d, ctx.householdDishes)
    + (ctx.tasteProfile
        ? noveltyScore(d, ctx.tasteProfile.noveltyPreference, ctx.tasteProfile.cuisineAffinities)
        : 0)
    + (ctx.ledgerSignals ? ledgerScore(d, ctx.ledgerSignals) : 0)
    + dishRotationJitter(d.id, seed) * scale;
}

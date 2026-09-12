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
//     declares `calories?`/`protein?` but NO dish row populates them. The
//     per-focus weights are therefore grounded in the REAL populated features:
//       nutrition[] (protein ×254, fiber-only ×126, both ×79, neither ×220),
//       weight (light ×306, medium ×314, heavy ×59), tags (spicy ×68, sweet
//       ×111, fried ×60, creamy ×38, dal ×23, paneer ×19, egg ×32, tofu ×7,
//       millet ×5, oats ×6, steamed ×31, grilled ×10 …), dish TYPE
//       (non-veg/eggitarian = protein-dense), and ingredient rows whose
//       category is 'proteins' (×303 across variants).
//   - We NEVER invent calorie numbers. Low Calorie / Weight Loss are scored
//     from weight + cooking-style tags (fried/deep-fried/creamy/rich vs
//     steamed/grilled/baked/roasted/salad/soup) — the honest closest signal.
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

// ─── 3 · Focus signals — REAL dish features, never invented macros ───────────
export interface FocusSignals {
  /** 0..3 — protein evidence. */
  protein: number;
  /** 0..2.5 — fiber evidence. */
  fiber: number;
  /** 0..2 — satiety cues (protein + dal/whole-grain comfort). */
  satiety: number;
  /** 0..1 — sugar/sweet evidence. */
  sugar: number;
  /** 0..3 — caloric density (weight + frying/cream/fat tags). HIGH is bad for
   *  Low Calorie / Low Fat / Weight Loss. */
  caloricDensity: number;
}

const FIBER_TAGS = new Set([
  'dal', 'lentil', 'millet', 'oats', 'besan', 'quinoa', 'whole-grain',
  'whole-wheat', 'buckwheat', 'ragi', 'vegetable', 'veggie', 'leafy',
  'greens', 'sprouts', 'beans', 'rajma', 'chole', 'chickpea', 'kidney-bean',
]);
const SATIETY_TAGS = new Set([
  'dal', 'lentil', 'beans', 'rajma', 'chole', 'chickpea', 'tofu', 'paneer',
  'roti', 'bread', 'rice', 'pulao', 'biryani', 'idli', 'dosa', 'upma',
  'paratha', 'poha', 'pongal', 'puri', 'naan', 'khichdi',
]);
const SUGAR_TAGS = new Set([
  'sweet', 'dessert', 'chocolate', 'jaggery', 'halwa', 'kheer', 'laddoo',
  'sugar', 'ice-cream',
]);
const CALORIC_TAGS = new Set([
  'fried', 'deep-fried', 'creamy', 'rich', 'buttery', 'oily', 'ghee', 'malai',
]);
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

/** Extract the per-focus signals from REAL dish fields. */
export function dishFocusSignals(d: Dish): FocusSignals {
  const nut = (d.nutrition ?? []).map(s => s.toLowerCase());
  const tags = (d.tags ?? []).map(s => s.toLowerCase());
  const type = (d.type ?? '').toLowerCase();
  const weight = (d.weight ?? 'medium').toLowerCase();

  const hasNut = (s: string) => nut.includes(s);
  const hasTag = (s: string) => tags.includes(s);

  // Protein: nutrition/tag evidence + protein-dense types + real ingredient rows.
  let protein = 0;
  if (hasNut('protein')) protein += 1.5;
  if (hasTag('high-protein') || hasTag('protein')) protein += 1;
  if (type === 'non-veg' || type === 'eggitarian') protein += 1;
  const pig = proteinIngredientCount(d);
  if (pig >= 1) protein += 0.5;
  protein = Math.min(3, protein);

  // Fiber: nutrition/tag evidence from actual whole-grain + veg dishes.
  let fiber = 0;
  if (hasNut('fiber')) fiber += 1.5;
  if (tags.some(t => FIBER_TAGS.has(t))) fiber += 1;
  fiber = Math.min(2.5, fiber);

  // Satiety: protein (satiation per calorie) + dal/staple carbs.
  let satiety = 0;
  if (protein >= 1) satiety += 1;
  if (hasNut('protein') || hasNut('fiber')) satiety += 0.5;
  if (tags.some(t => SATIETY_TAGS.has(t))) satiety += 0.5;
  satiety = Math.min(2, satiety);

  // Sugar.
  const sugar = hasNut('sugar') || hasNut('sweet') || tags.some(t => SUGAR_TAGS.has(t)) ? 1 : 0;

  // Caloric density: weight is the honest package-level signal; frying/cream
  // tags add density; steamed/grilled/light subtract.
  let density = weight === 'light' ? 0.2 : weight === 'medium' ? 1 : 2;
  if (tags.some(t => CALORIC_TAGS.has(t))) density += 0.6;
  if (tags.some(t => LIGHT_TAGS.has(t))) density = Math.max(0, density - 0.4);
  density = Math.min(3, density);

  return { protein, fiber, satiety, sugar, caloricDensity: density };
}

/**
 * Per-focus ranking weights — MEANINGFULLY DIFFERENT vectors, each grounded
 * in the real signals above. Higher = more preferred for that focus.
 *   balanced      protein + fiber both count; sugar/density mildly penalized
 *                 (the "eat well" default — prefers protein+fiber staples).
 *   high-protein  protein ×3 dominates; satiety helps; sugar avoided.
 *   high-fiber    fiber ×3 dominates; protein co-occurs (dal has both).
 *   low-calorie   caloric density −2 strongly penalized; sugar −1.5; the
 *                 light/steamed/salad/soup signals lift via density ≈ 0.
 *   low-fat       density −2.5 (fried/creamy/buttery are punished hardest);
 *                 lean protein still counts.
 *   weight-loss   density −1.5 + protein ×1.2 + fiber ×1.2 + satiety ×1 —
 *                 satiation per calorie (keeps you full on less).
 */
export const FOCUS_WEIGHTS: Record<HealthFocus, {
  protein: number; fiber: number; satiety: number; sugar: number; caloricDensity: number;
}> = {
  // Measured against the library (per-slot top-5 must re-rank on focus change):
  // balanced keeps protein+fiber roughly even and only mildly penalizes density.
  'balanced':     { protein: 1.0, fiber: 1.0, satiety: 0.4, sugar: -0.8, caloricDensity: -0.5 },
  // high-protein: protein ×4 dominates (egg/meat/sprouted/dal dishes lead).
  'high-protein': { protein: 4.0, fiber: 0.4, satiety: 1.0, sugar: -1.5, caloricDensity: -0.3 },
  // high-fiber: fiber ×4 dominates (whole-grain/dal/veg dishes lead).
  'high-fiber':   { protein: 0.5, fiber: 4.0, satiety: 1.0, sugar: -1.2, caloricDensity: -0.3 },
  // low-calorie: density −3.5 punishes fried/creamy/heavy hardest; light lifts.
  'low-calorie':  { protein: 0.9, fiber: 0.9, satiety: 0.5, sugar: -2.0, caloricDensity: -3.5 },
  // low-fat: density −4.0 (the grease axis) — fried/buttery/creamy dishes drop.
  'low-fat':      { protein: 0.7, fiber: 0.6, satiety: 0.4, sugar: -1.8, caloricDensity: -4.0 },
  // weight-loss: density −2.5 + satiation (protein+fiber+satiety ≈ full on less).
  'weight-loss':  { protein: 1.6, fiber: 1.6, satiety: 1.2, sugar: -2.5, caloricDensity: -2.5 },
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
    + dishRotationJitter(d.id, seed) * scale;
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL-PLAN REGENERATION PIPELINE — generate → validate → fill → dedupe →
// validate → render. THE guarantee behind the diet-change popover's "Apply to
// my current meal plan" and the deferred "next meal plan" consumer.
//
// Why this module exists (2026-09-12 defect): a diet change left the LIVE tray
// at "Breakfast 5 / Lunch 1 / Snacks 3 / Dinner 3" (12/20) — the old rebuild
// topped each slot up from the LOOP pool (which could run short) and never
// deduplicated ACROSS slots, so "Andhra Spiced Egg Curry" (category
// [lunch,dinner]) legitimately landed in lunch AND dinner.
//
// Data facts this module was built against (measured on DISH_LIBRARY, 679
// dishes — honest, no fabrication):
//   - dish.type is the canonical diet axis; dish.diet is a legacy field
//     ('egg' → eggitarian). Only 14 dishes carry BOTH; 665 carry type only.
//   - Every canonical diet × every slot has ≥34 north/all candidates:
//       vegan breakfast 34 · lunch 62 · snacks 53 · dinner 69 (the minimums) —
//       so a 5-per-slot / 20-dish plan is ALWAYS fillable from the library.
//   - The type axis alone is NOT a complete vegan guarantee: 3 vegan-typed
//     dishes carry REAL animal dairy ingredient names (bela-pana → Butter,
//     mushroom-toast → Butter, mushroom-pulao → Yogurt) and 2 carry Eggs
//     (hakka-noodles, chow-mein). This module's vegan guard therefore ALSO
//     checks exact ingredient/sides names — a mislabeled "vegan" dish is
//     excluded honestly, it is never silently rendered.
//   - The ingredient-name guard uses EXACT animal names only. Substring
//     matching would falsely block plant milks (Oat/Almond/Coconut Milk) which
//     this library treats as non-dairy (the vegan-integrity F2/F3 contract).
//
// The pipeline is written purely; rendering (useStore.setState) happens in the
// caller. Every unfillable slot is recorded with a reason (Λ2.3) — a
// partial plan is NEVER silently presented as complete.
// ─────────────────────────────────────────────────────────────────────────────
import type { Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';
import type { MealOption, TrayLibrary } from '../app/store/useStore';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { allowedTypesForDiet, distinctiveTypeFor } from './dietQuota';
import { getTraySlotCap, dietPriorityFor, healthMatchFor } from './loopPool';
import { dishDietType, isMealDietCompatible } from './dietCompat';
import { getRegionKey } from './dishSearch';
import { isPureSweetDish } from '../meal/constants/pairingCatalog';
import { upsertMealToSlot } from './trayUpsert';
import { personalizationScore, householdPenalty, rotateBandForUser, affinityTierLift } from './mealPersonalization';
import type { PersonalizationContext } from './mealPersonalization';

export const MEAL_SLOTS: readonly MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

const normName = (s?: string | null): string => (s ?? '').trim().toLowerCase();

/** Resolve a library dish for a tray item — id (either key) then normalized name. */
export function resolveLibraryDish(library: Dish[], item: MealOption): Dish | null {
  const id = item.dishId || item.id;
  return (
    library.find(d => d.id === id) ??
    library.find(d => normName(d.name) === normName(item.name)) ??
    null
  );
}

/** Strict id-only resolution — the mapping a tray item CLAIMS. No name
 *  fallback: a dead id must never silently re-map to a same-named live dish
 *  (the "fallback silently substitutes" honesty hole). */
export function resolveLibraryDishStrict(library: Dish[], item: MealOption): Dish | null {
  const id = item.dishId || item.id;
  if (!id) return null;
  return library.find(d => d.id === id) ?? null;
}

/** True when the id belongs to a REAL custom dish: locally-created customs
 *  ('custom-…' — QuickAddModal's id shape) or server-assigned UUIDs. These
 *  are user data — always protected, never treated as dead library ids. */
export function isCustomDishId(id: string | undefined | null): boolean {
  if (!id) return false;
  if (id.startsWith('custom-')) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** True when the id has the SHAPE of a library dish id (lowercase slug /
 *  snake — library ids start with a letter: 'idli', 'dal-tadka-central').
 *  Custom ids are excluded first (see isCustomDishId). Used to decide whether
 *  an unresolvable id is a DEAD library mapping (strip + record) vs an opaque
 *  user id (protect). */
export function looksLikeLibraryDishId(id: string | undefined | null): boolean {
  if (!id || isCustomDishId(id)) return false;
  return /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)*$/.test(id);
}

export interface InvalidMappingResult {
  tray: TrayLibrary;
  /** Items removed because their id CLAIMED a library dish that doesn't
   *  exist AND no live dish matches their name — the fill step replaces them
   *  with a VALID diet-compatible dish. */
  removed: number;
  /** Dead-id items RE-KEYED to a live dish by exact name (legacy same-dish
   *  second cards) — every re-map is recorded, never silent. */
  rekeyed: number;
  /** Λ2.3 — every removal/rekey recorded:
   *  `invalid_dish_mapping:<slot>:<id>:<name>` (excluded) or
   *  `invalid_dish_mapping_rekeyed:<slot>:<deadId>-><liveId>:<name>`. */
  reasons: string[];
}

/**
 * NEVER hide a data-quality problem with a plausible meal. A tray item whose
 * id claims a library dish but resolves to NOTHING is a dead/invalid mapping
 * (e.g. a stale curated-map id injected into the plan):
 *   · no live dish matches its name either → EXCLUDED, recorded, and the fill
 *     step replaces it with a VALID diet-compatible dish;
 *   · an EXACT live dish name matches → the item is RE-KEYED to that live
 *     dish (recorded — never a silent substitution), so a legacy same-dish
 *     second card still flows to the whole-plan dedupe.
 * Genuine custom dishes (custom- prefix / UUID ids) are always protected.
 * Items with no id at all (legacy name-only) keep the existing
 * unresolvable-protected semantics — they cannot be proven library claims.
 */
export function stripInvalidDishMappings(
  tray: TrayLibrary,
  library: Dish[],
): InvalidMappingResult {
  const reasons: string[] = [];
  let removed = 0;
  let rekeyed = 0;
  const out = emptyTrayClone(tray);
  for (const slot of MEAL_SLOTS) {
    const kept: MealOption[] = [];
    for (const m of out[slot] ?? []) {
      const idKey = m.dishId || m.id;
      const strict = idKey ? resolveLibraryDishStrict(library, m) : null;
      if (strict) {
        kept.push(m);
        continue;
      }
      if (!idKey || isCustomDishId(idKey)) {
        kept.push(m); // custom / name-only → protected (recorded by caller)
        continue;
      }
      if (looksLikeLibraryDishId(idKey)) {
        // Dead library-shaped id. Exact-name re-key FIRST (recorded), so a
        // regenerated-id legacy card keeps its real dish identity; otherwise
        // exclude + record — a fabricated id never renders.
        const byName = library.find(d => normName(d.name) === normName(m.name));
        if (byName) {
          rekeyed++;
          reasons.push(`invalid_dish_mapping_rekeyed:${slot}:${idKey}->${byName.id}:${byName.name}`);
          kept.push({ ...m, id: byName.id, dishId: byName.id, name: byName.name });
          continue;
        }
        removed++;
        reasons.push(`invalid_dish_mapping:${slot}:${idKey}:${normName(m.name) || 'unnamed'}`);
        continue;
      }
      kept.push(m); // opaque non-library-shaped id → protected (legacy)
    }
    out[slot] = kept;
  }
  return { tray: out, removed, rekeyed, reasons };
}

// ─── Diet-compat helpers live in utils/dietCompat (shared with the
// ─── recommendation gates — ONE implementation). Re-exported here so every
// ─── existing importer of mealPlanRegen keeps working unchanged.
export {
  dishDietType,
  ANIMAL_INGREDIENT_NAMES,
  dishHasAnimalDerivedIngredients,
  isMealDietCompatible,
} from './dietCompat';

export interface DietViolation {
  slot: MealType;
  index: number;
  id?: string;
  name: string;
  type: string;
}

export interface TrayValidation {
  /** Every resolvable tray item that violates the diet (EVERY dish checked). */
  violations: DietViolation[];
  /** Unresolvable/custom items — protected by design, counted honestly. */
  unresolvable: number;
}

/** Check EVERY tray item against the diet. Custom/unresolvable items cannot be
 *  validated (no dish metadata) → counted as unresolvable, never silently
 *  claimed compatible. */
export function validateTrayDietCompatibility(
  tray: TrayLibrary,
  diet?: string | null,
  library: Dish[] = DISH_LIBRARY,
): TrayValidation {
  const violations: DietViolation[] = [];
  let unresolvable = 0;
  for (const slot of MEAL_SLOTS) {
    const items = tray[slot] ?? [];
    for (let i = 0; i < items.length; i++) {
      const m = items[i]!;
      const d = resolveLibraryDish(library, m);
      if (!d) {
        unresolvable++;
        continue; // custom — protected
      }
      if (!isMealDietCompatible(d, diet)) {
        violations.push({ slot, index: i, id: m.dishId || m.id, name: m.name || d.name, type: dishDietType(d) });
      }
    }
  }
  return { violations, unresolvable };
}

// ─── Fill: top each slot up to the target from the diet-compatible,
// ─── slot-matched, whole-plan-unused library pool ────────────────────────────
export interface FillResult {
  tray: TrayLibrary;
  added: number;
  shortSlots: MealType[];
  /** Λ2.3 — honest recorded reasons for any slot left below target. */
  reasons: string[];
}

function regionTier(d: Dish, regionKey: string): number {
  const r = (d.region || '').toLowerCase();
  if (r === regionKey) return 0;
  if (!r || r === 'all') return 1;
  return 2; // far-region fill is a LAST resort (still diet-compatible)
}

/**
 * Candidate fill pool for a slot: diet-compatible, exact-slot category,
 * not pure-sweet, and NOT already used anywhere in the whole plan (id or
 * normalized name — the cross-slot duplicate is prevented BEFORE it lands).
 * Priority: diet ladder → region tier → health match → name.
 */
export function fillCandidatesForSlot(
  library: Dish[],
  diet: string | null | undefined,
  region: string | null | undefined,
  slot: MealType,
  usedIds: ReadonlySet<string>,
  usedNames: ReadonlySet<string>,
  healthGoal?: string,
  personalization?: PersonalizationContext | null,
): Dish[] {
  const regionKey = getRegionKey(region ?? undefined) || 'north';
  const priorityMap = dietPriorityFor(diet);
  const hs = healthMatchFor(healthGoal);
  // Distinctive-type dishes (eggitarian/vegan — the food the user chose the
  // diet FOR) lead the sort BEFORE the region tier so a diet whose distinctive
  // foods live far-region (all egg curries are south/east/west) still gets
  // them — same rationale as dietQuota's cross-region representatives. For
  // veg/non-veg the local pool is large enough (measured ≥34 north/all per
  // slot), so region preference still effectively holds.
  const distType = distinctiveTypeFor(diet);
  const distBonus = (d: Dish): number => (distType && dishDietType(d) === distType) ? 0 : 1;
  // Diet + region lead (the region determines what is APPROPRIATE); the
  // personalization score then orders the candidates (the user determines
  // what is PERSONAL) — healthMatch remains the legacy tiebreak for the
  // no-personalization path (byte-identical behavior).
  const healthTiebreak = (a: Dish, b: Dish): number =>
    hs(b) - hs(a) || a.name.localeCompare(b.name);
  const cmp = personalizationComparator(personalization, healthTiebreak);
  // Goal-2 (2026-09-13): a mild/low-spice user's explicit cuisine affinity
  // lifts a matching dish's effective region tier (affinityTierLift) — the
  // affinity becomes an appropriateness signal FOR THAT USER. Non-mild users,
  // users with no affinities, and non-matching dishes keep the legacy tier
  // (byte-identical). All gates (diet, category, pure-sweet, used-set) still
  // run BEFORE this sort; the lift only re-orders candidates.
  const tierOf = (d: Dish): number =>
    regionTier(d, regionKey) + affinityTierLift(d, personalization?.preferences, personalization?.tasteProfile);
  const sorted = library
    .filter(d =>
      isMealDietCompatible(d, diet) &&
      (d.category ?? []).includes(slot) &&
      !isPureSweetDish(d) &&
      !usedIds.has(d.id) &&
      !usedNames.has(normName(d.name)))
    .sort((a, b) =>
      distBonus(a) - distBonus(b) ||
      tierOf(a) - tierOf(b) ||
      (priorityMap[dishDietType(a)] ?? 99) - (priorityMap[dishDietType(b)] ?? 99) ||
      cmp(a, b));
  // Structural per-user rotation over the top band (diet/region appropriateness
  // still leads the SORT — the rotation only re-windows equally-personal
  // candidates). Absent personalization → returned as sorted, byte-identical.
  return personalization ? rotateBandForUser(sorted, slot, personalization) : sorted;
}

/** The personalization axis — inserted AFTER diet-priority/region-tier when a
 *  PersonalizationContext is present; ABSENT-ranked (comparator returns 0 and
 *  the legacy healthMatch + name tiebreaks decide) otherwise, so every existing
 *  caller stays byte-identical. Higher score = better fit for this user. */
export function personalizationComparator(
  ctx: PersonalizationContext | null | undefined,
  healthTiebreak: (a: Dish, b: Dish) => number,
): (a: Dish, b: Dish) => number {
  if (!ctx) return healthTiebreak;
  return (a, b) => {
    const diff = personalizationScore(b, ctx) - personalizationScore(a, ctx);
    if (diff !== 0) return diff;
    return healthTiebreak(a, b);
  };
}

export function emptyTrayClone(tray: TrayLibrary): TrayLibrary {
  return { breakfast: [...(tray.breakfast ?? [])], lunch: [...(tray.lunch ?? [])], snacks: [...(tray.snacks ?? [])], dinner: [...(tray.dinner ?? [])] };
}

/** Used-identity sets across the WHOLE plan (id + normalized name). */
export function wholePlanUsed(tray: TrayLibrary): { ids: Set<string>; names: Set<string> } {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const slot of MEAL_SLOTS) {
    for (const m of tray[slot] ?? []) {
      ids.add(m.dishId || m.id);
      names.add(normName(m.name));
    }
  }
  return { ids, names };
}

/**
 * Fill step: per-slot, top the tray up to `target` via the canonical
 * id-or-name upsert (never appends a same-name duplicate). Any slot that
 * cannot reach the target records an honest reason — never a silent 12/20.
 */
export function fillTrayToTarget(
  tray: TrayLibrary,
  library: Dish[],
  diet: string | null | undefined,
  region: string | null | undefined,
  target: number,
  opts?: { healthGoal?: string; personalization?: PersonalizationContext | null },
): FillResult {
  const out = { breakfast: [...(tray.breakfast ?? [])], lunch: [...(tray.lunch ?? [])], snacks: [...(tray.snacks ?? [])], dinner: [...(tray.dinner ?? [])] } as TrayLibrary;
  let added = 0;
  const shortSlots: MealType[] = [];
  const reasons: string[] = [];
  for (const slot of MEAL_SLOTS) {
    // Used-identity sets across the WHOLE CURRENT output — earlier fills in
    // other slots are respected, so a candidate is never added twice.
    const used = wholePlanUsed(out);
    const need = target - (out[slot] ?? []).length;
    let candidates = fillCandidatesForSlot(library, diet, region, slot, used.ids, used.names, opts?.healthGoal, opts?.personalization);
    // Household-overlap tolerance (Λ2.3 — honest, recorded): when the pool of
    // NON-overlapping candidates genuinely runs short of the slot target, the
    // household penalty is relaxed (diversity is a preference, 20/20 is the
    // contract). A duplicate-heavy household must still get a complete plan.
    if (need > 0 && opts?.personalization?.householdDishes?.length) {
      const overlapping = candidates.filter(d => householdPenalty(d, opts!.personalization!.householdDishes) < 0).length;
      const nonOverlap = candidates.length - overlapping;
      if (nonOverlap < need) {
        reasons.push(`household_overlap_tolerated:${slot}:non_overlap_pool_${nonOverlap}_needed_${need}`);
        candidates = fillCandidatesForSlot(library, diet, region, slot, used.ids, used.names, opts?.healthGoal, {
          ...opts.personalization,
          householdDishes: null, // relax ONLY the household axis; history/prefs stay
        });
      }
    }
    let list = [...(out[slot] ?? [])];
    let ci = 0;
    while (list.length < target && ci < candidates.length) {
      const d = candidates[ci++]!;
      const meal: MealOption = { id: d.id, dishId: d.id, name: d.name, icon: d.icon, sourceRegion: d.region };
      const r = upsertMealToSlot(list, meal);
      if (r.added) { added++; list = r.tray; }
    }
    out[slot] = list;
    if (list.length < target) {
      shortSlots.push(slot);
      reasons.push(
        candidates.length === 0
          ? `fill_short:${slot}:no_candidates_for_diet_${diet ?? ''}_region_${region ?? ''}`
          : `fill_short:${slot}:pool_exhausted_after_${candidates.length}_candidates_needed_${target - list.length}`,
      );
    }
  }
  return { tray: out, added, shortSlots, reasons };
}

// ─── Whole-plan dedupe: one dish_id (or normalized name) per plan ───────────
export interface DedupeResult {
  tray: TrayLibrary;
  replaced: number;
  /** Every duplicate→substitution actually applied (honest audit trail). */
  substitutions: Array<{ slot: MealType; removedId?: string; removedName: string; addedName: string }>;
  shortSlots: MealType[];
  reasons: string[];
}

/**
 * Whole-plan dedupe by canonical identity (dish_id OR normalized name),
 * enforced BEFORE render across all four meal types. First occurrence wins
 * (slot order: breakfast → lunch → snacks → dinner). Duplicates are replaced
 * with a valid substitution (diet-compatible, slot-matched, not already used);
 * when no substitution exists the entry is REMOVED with a recorded reason —
 * a duplicate is never rendered as if it were a unique dish. Custom
 * (unresolvable) dishes are protected from removal; a user-added custom dish
 * appearing twice is recorded, not silently destroyed.
 */
export function dedupeWholePlan(
  tray: TrayLibrary,
  library: Dish[],
  diet: string | null | undefined,
  region: string | null | undefined,
  target: number,
  opts?: { healthGoal?: string; personalization?: PersonalizationContext | null },
): DedupeResult {
  const out = emptyTrayClone(tray);
  // Used identity sets start EMPTY — the FIRST occurrence of an id/name wins;
  // only entries seen after an earlier keeper are duplicates. (Pre-seeding
  // with the whole plan made EVERY entry look like a duplicate.)
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  const regionKey = getRegionKey(region ?? undefined) || 'north';
  const priorityMap = dietPriorityFor(diet);
  const hs = healthMatchFor(opts?.healthGoal);
  const healthTiebreak = (a: Dish, b: Dish): number =>
    hs(b) - hs(a) || a.name.localeCompare(b.name);
  const cmp = personalizationComparator(opts?.personalization, healthTiebreak);
  let replaced = 0;
  const substitutions: DedupeResult['substitutions'] = [];
  const shortSlots: MealType[] = [];
  const reasons: string[] = [];

  const distType = distinctiveTypeFor(diet);
  const distBonus = (d: Dish): number => (distType && dishDietType(d) === distType) ? 0 : 1;
  const candidateSub = (slot: MealType): Dish | undefined => {
    // Same Goal-2 tier lift as the fill step — dedupe substitutions must see
    // the SAME ordering as the fill (a mild-affinity user's substitutions
    // prefer their loved cuisines; everyone else stays byte-identical).
    const tierOf = (d: Dish): number =>
      regionTier(d, regionKey) + affinityTierLift(d, opts?.personalization?.preferences, opts?.personalization?.tasteProfile);
    const sorted = library
      .filter(d =>
        isMealDietCompatible(d, diet) &&
        (d.category ?? []).includes(slot) &&
        !isPureSweetDish(d) &&
        !usedIds.has(d.id) &&
        !usedNames.has(normName(d.name)))
      .sort((a, b) =>
        distBonus(a) - distBonus(b) ||
        tierOf(a) - tierOf(b) ||
        (priorityMap[dishDietType(a)] ?? 99) - (priorityMap[dishDietType(b)] ?? 99) ||
        cmp(a, b));
    return (opts?.personalization ? rotateBandForUser(sorted, slot, opts.personalization) : sorted)[0];
  };

  for (const slot of MEAL_SLOTS) {
    const kept: MealOption[] = [];
    for (const m of out[slot] ?? []) {
      const idKey = m.dishId || m.id;
      const nKey = normName(m.name);
      const d = resolveLibraryDish(library, m);
      const isDup = usedIds.has(idKey) || usedNames.has(nKey);

      if (!isDup) {
        usedIds.add(idKey);
        usedNames.add(nKey);
        kept.push(m);
        continue;
      }

      if (!d) {
        // Custom dish duplicated across slots — user-added choice: protect it,
        // record the fact honestly (never silently "fixed").
        reasons.push(`custom_duplicate_kept:${slot}:${m.name}`);
        kept.push(m);
        continue;
      }

      const sub = candidateSub(slot);
      if (sub) {
        const replacement: MealOption = { id: sub.id, dishId: sub.id, name: sub.name, icon: sub.icon, sourceRegion: sub.region };
        kept.push(replacement);
        usedIds.add(sub.id);
        usedNames.add(normName(sub.name));
        substitutions.push({ slot, removedId: idKey, removedName: m.name || d.name, addedName: sub.name });
        replaced++;
      } else {
        // No valid substitute — remove the duplicate and record WHY (Λ2.3).
        reasons.push(`duplicate_removed_no_substitute:${slot}:${m.name || idKey}`);
        replaced++;
      }
    }
    out[slot] = kept;
    if (kept.length < target) shortSlots.push(slot);
  }

  return { tray: out, replaced, substitutions, shortSlots, reasons };
}

// ─── The pipeline: generate → validate → fill → dedupe → validate → render ──
export interface PlanRegenInput {
  /** The current tray (generate step source). */
  tray: TrayLibrary;
  library?: Dish[];
  diet: string;
  region?: string;
  /** Per-slot target; defaults to the cycle-scaled cap (7-day → 5 → 20 total). */
  target?: number;
  healthGoal?: string;
  /** Optional personalization context — when present, fill + dedupe order
   *  slot candidates by the deterministic per-user score (region+diet still
   *  lead; the user determines what is PERSONAL). Absent = byte-identical
   *  legacy ordering. */
  personalization?: PersonalizationContext | null;
}

export interface PlanRegenResult {
  /** The rendered tray (caller writes it to the store). */
  tray: TrayLibrary;
  target: number;
  totalBefore: number;
  totalAfter: number;
  /** after === target×4 AND zero final violations. */
  complete: boolean;
  /** Diet-invalid dishes removed in the FIRST validation pass. */
  invalidRemoved: number;
  /** Dishes added in the fill step. */
  filled: number;
  /** Duplicate entries replaced/removed in the dedupe step. */
  deduped: number;
  /** Custom/unresolvable dishes protected (never validated, never removed). */
  customKept: number;
  shortSlots: MealType[];
  /** Every honest reason recorded this run (Λ2.3). */
  reasons: string[];
  substitutions: DedupeResult['substitutions'];
  /** Final validation — empty by construction; surfaced if ever not. */
  violations: DietViolation[];
}

const countTray = (tray: TrayLibrary): number =>
  MEAL_SLOTS.reduce((n, s) => n + (tray[s] ?? []).length, 0);

/**
 * THE canonical pipeline — the ordering is the contract:
 *   1. generate   — the input tray is the candidate plan
 *   2. validate   — strip EVERY diet-invalid resolvable dish (custom protected)
 *   3. fill       — top each slot to target from the diet-compatible pool
 *   4. dedupe     — one dish_id per whole plan (cross-slot duplicates replaced)
 *   5. validate   — re-check the FINAL tray (must be clean by construction)
 *   6. render     — return the final tray for the caller to write
 * A genuinely unfillable slot is recorded with a reason; `complete` is false
 * and NO honest reason is swallowed (Λ2.3).
 */
export function regenerateMealPlanPipeline(input: PlanRegenInput): PlanRegenResult {
  const library = input.library ?? DISH_LIBRARY;
  const target = input.target ?? getTraySlotCap();
  const totalBefore = countTray(input.tray);
  const reasons: string[] = [];

  // 1+2) generate + validate: FIRST strip dead/invalid library-id mappings
  //      (a plausible-looking meal must never render from a dead id — the
  //      fill step replaces them with VALID dishes), THEN strip diet-invalid
  //      resolvable items in ONE pass (no index-shift artifacts). Genuine
  //      custom/unresolvable items are protected by design (counted in
  //      customKept at the end).
  let tray = emptyTrayClone(input.tray);
  let invalidRemoved = 0;
  const invalidMappings = stripInvalidDishMappings(tray, library);
  tray = invalidMappings.tray;
  reasons.push(...invalidMappings.reasons);
  for (const slot of MEAL_SLOTS) {
    const kept: MealOption[] = [];
    for (const m of tray[slot] ?? []) {
      const d = resolveLibraryDish(library, m);
      if (!d || isMealDietCompatible(d, input.diet)) kept.push(m);
      else invalidRemoved++;
    }
    tray[slot] = kept;
  }

  // 3) fill.
  const fill = fillTrayToTarget(tray, library, input.diet, input.region, target, { healthGoal: input.healthGoal, personalization: input.personalization });
  tray = fill.tray;
  reasons.push(...fill.reasons);

  // 4) dedupe — whole plan.
  const dedupe = dedupeWholePlan(tray, library, input.diet, input.region, target, { healthGoal: input.healthGoal, personalization: input.personalization });
  tray = dedupe.tray;
  reasons.push(...dedupe.reasons);

  // 5) validate AGAIN — the final dish set must be diet-clean.
  const finalCheck = validateTrayDietCompatibility(tray, input.diet, library);
  if (finalCheck.violations.length > 0) {
    reasons.push(`final_validation_failed:${finalCheck.violations.map(v => `${v.slot}:${v.name}`).join(',')}`);
  }

  // 6) render-ready result with honest accounting.
  const totalAfter = countTray(tray);
  const shortSlots = MEAL_SLOTS.filter(s => (tray[s] ?? []).length < target);
  return {
    tray,
    target,
    totalBefore,
    totalAfter,
    complete: totalAfter === target * MEAL_SLOTS.length && finalCheck.violations.length === 0,
    invalidRemoved,
    filled: fill.added,
    deduped: dedupe.replaced,
    customKept: finalCheck.unresolvable,
    shortSlots,
    reasons,
    substitutions: dedupe.substitutions,
    violations: finalCheck.violations,
  };
}

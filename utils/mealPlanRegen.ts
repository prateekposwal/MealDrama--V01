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
import { getRegionKey } from './dishSearch';
import { isPureSweetDish } from '../meal/constants/pairingCatalog';
import { upsertMealToSlot } from './trayUpsert';
import { personalizationScore, householdPenalty, rotateBandForUser } from './mealPersonalization';
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

/**
 * Canonical dish diet type. `type` is the canonical axis; the legacy `diet`
 * field ('egg' → eggitarian) is the fallback. Custom/unresolvable → ''.
 */
export function dishDietType(dish: Dish): string {
  const t = (dish.type || '').toLowerCase().trim();
  if (t) return t;
  const d = (dish.diet || '').toLowerCase().trim();
  return d === 'egg' ? 'eggitarian' : d;
}

/**
 * EXACT animal-derived ingredient/side names — the only honest name-level
 * guard. Never substring-matches (plant milks are not dairy). Mirror of the
 * vegan-integrity F2/F3 contract set, plus Curd/Egg variants the spec lists
 * (paneer, curd, buttermilk, ghee, eggs…).
 */
export const ANIMAL_INGREDIENT_NAMES: ReadonlySet<string> = new Set([
  'Ghee', 'Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Paneer',
  'Buttermilk', 'Lassi', 'Raita', 'Curd',
  'Whole Milk (chilled)', 'Vanilla Ice Cream',
  'Egg', 'Eggs', 'Egg White', 'Egg Yolk',
]);

/** True when any variant ingredient or default side carries an exact
 *  animal-derived name (dairy or egg). */
export function dishHasAnimalDerivedIngredients(dish: Dish): boolean {
  const names: string[] = [];
  for (const v of dish.variants ?? []) {
    for (const i of v.ingredients ?? []) names.push(i.name);
  }
  for (const s of dish.defaultPairings?.sides ?? []) names.push(s);
  return names.some(n => ANIMAL_INGREDIENT_NAMES.has(n));
}

/**
 * Diet compatibility of ONE dish — validates the FINAL dish, not just the
 * first selection:
 *   - type gate: allowedTypesForDiet(diet) on the canonical type
 *   - vegan extra gate: a vegan-typed dish carrying REAL dairy/egg ingredient
 *     names is excluded (the 5 mislabeled dishes never reach a vegan plan).
 */
export function isMealDietCompatible(dish: Dish, diet?: string | null): boolean {
  const allowed = new Set(allowedTypesForDiet(diet));
  if (!allowed.has(dishDietType(dish))) return false;
  if ((diet ?? '').toLowerCase().trim() === 'vegan' && dishHasAnimalDerivedIngredients(dish)) return false;
  return true;
}

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
  const sorted = library
    .filter(d =>
      isMealDietCompatible(d, diet) &&
      (d.category ?? []).includes(slot) &&
      !isPureSweetDish(d) &&
      !usedIds.has(d.id) &&
      !usedNames.has(normName(d.name)))
    .sort((a, b) =>
      distBonus(a) - distBonus(b) ||
      regionTier(a, regionKey) - regionTier(b, regionKey) ||
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
    const sorted = library
      .filter(d =>
        isMealDietCompatible(d, diet) &&
        (d.category ?? []).includes(slot) &&
        !isPureSweetDish(d) &&
        !usedIds.has(d.id) &&
        !usedNames.has(normName(d.name)))
      .sort((a, b) =>
        distBonus(a) - distBonus(b) ||
        regionTier(a, regionKey) - regionTier(b, regionKey) ||
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

  // 1+2) generate + validate: strip diet-invalid resolvable items in ONE
  //      pass, id/name based (no index-shift artifacts). Custom/unresolvable
  //      items are protected by design (counted in customKept at the end).
  let tray = emptyTrayClone(input.tray);
  let invalidRemoved = 0;
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

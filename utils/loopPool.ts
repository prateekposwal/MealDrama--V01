// ─────────────────────────────────────────────────────────────────────────────
// loopPool.ts — ONE canonical builder for the enriched rotation pool.
//
// The 2-dish-loop bug recurred because THREE applyLoopConfig call sites built
// their pool from the RAW tray sourcePool (un-enriched), so a tray holding only
// Thukpa + Seekh Kebab filled every slot with just those two dishes — and
// useLoopStore's persist middleware saved that degenerate mealLoop, so reload
// rehydrated it unchanged.
//
// This module centralizes the enrichment that App.tsx's two correct paths used
// (auto-seed + manual onApply) so every Apply path — App, PlanScreen, Profile —
// builds a CYCLE-SCALED, diet/region-limited rotation pool from ONE source of
// truth (Λ3.1 pattern-first: fix the recurring site, not one instance).
//
// API:
//   poolTargetForCycleLength(cycleLength) -> 5/10/15 per slot (7/14/30-day)
//   healthMatchFor(goal)                  -> health-match scorer for a goal
//   dietPriorityFor(diet)                 -> diet -> priority map (veg/egg/non-veg/vegan)
//   buildEnrichedLoopPool({...})          -> SourcePool enriched to the target
// ─────────────────────────────────────────────────────────────────────────────

import type { Dish } from '../meal/constants/dishLibrary';
import { isPureSweetDish } from '../meal/constants/pairingCatalog';
import { allowedTypesForDiet, enrichSourcePool } from './dietQuota';
import { getRegionKey, goalToDishHealthFilter, dishHealthMatchScore } from './dishSearch';
import type { SourcePool } from '../plan/utils/mealLoopEngine';

/**
 * Rotation-pool breadth per slot scales with the loop's cycle length so
 * longer rotations don't repeat dishes. Mapping: 7 days → 5 per slot,
 * 14 days → 10 per slot, 30 days → 15 per slot (capped at 15 so very long
 * loops don't demand an unbounded pool; linear 5×days/7 below the cap).
 */
export const poolTargetForCycleLength = (cycleLength: number) =>
  Math.min(15, Math.round(5 * cycleLength / 7));

/** Health-match scorer from a user goal string ("High Protein" → lifts protein dishes). */
export const healthMatchFor = (goal?: string) => {
  const f = goalToDishHealthFilter(goal);
  return (d: Dish) => (f && f !== 'all' ? dishHealthMatchScore(d, f) : 0);
};

/**
 * Diet → material priority map (lower = preferred) so the pool pushes the
 * user's actual diet first, then acceptable neighbours. Shared by every Apply
 * path so vegan/eggitarian/non-veg/veg branches stay in one place.
 */
export function dietPriorityFor(diet?: string | null): Record<string, number> {
  const dietKey = (diet || 'veg').toLowerCase();
  const priority: Record<string, number> = {};
  if (dietKey === 'eggitarian') {
    priority['eggitarian'] = 0; priority['egg'] = 0;
    priority['veg'] = 1; priority['vegan'] = 2;
  } else if (dietKey === 'non-veg') {
    priority['non-veg'] = 0; priority['eggitarian'] = 1;
    priority['egg'] = 1; priority['veg'] = 2; priority['vegan'] = 3;
  } else if (dietKey === 'vegan') {
    priority['vegan'] = 0; priority['veg'] = 1;
  } else {
    priority['veg'] = 0; priority['vegan'] = 1;
  }
  return priority;
}

export interface BuildEnrichedLoopPoolArgs {
  /** Tray-grown pool (the user's picks keep the lead in each slot). */
  sourcePool: SourcePool;
  /** Full dish library to fill the remaining slots from. */
  library: Dish[];
  /** User diet (veg/eggitarian/non-veg/vegan). */
  diet?: string | null;
  /** User region string (normalized via getRegionKey). */
  region?: string | null;
  /** Loop cycle length in days — scales the per-slot target. */
  cycleLength: number;
  /** User health goal (ordering tiebreak only). */
  healthGoal?: string;
}

/**
 * Build the ENRICHED rotation pool for a loop config.
 * - Wraps enrichSourcePool from dietQuota with the diet/region/cycle-scale
 *   bindings every Apply path needs.
 * - Excludes pure-sweet (dessert-only) dishes from being auto-filled as meals.
 * - Tray picks keep the lead; remaining slots fill from diet-allowed,
 *   region-appropriate library dishes up to the cycle-scaled target.
 */
export function buildEnrichedLoopPool({
  sourcePool, library, diet, region, cycleLength, healthGoal,
}: BuildEnrichedLoopPoolArgs): SourcePool {
  const priorityMap = dietPriorityFor(diet);
  return enrichSourcePool(sourcePool, library.filter(d => !isPureSweetDish(d)), {
    allowedTypes: allowedTypesForDiet(diet),
    regionKey: getRegionKey(region ?? undefined) || 'north',
    target: poolTargetForCycleLength(cycleLength),
    priority: (d) => (priorityMap[(d.diet || d.type || '').toLowerCase()] ?? 99),
    healthScore: healthMatchFor(healthGoal),
  }) as SourcePool;
}

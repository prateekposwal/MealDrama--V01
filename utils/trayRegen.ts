// ─────────────────────────────────────────────────────────────────────────────
// TRAY REGENERATION on diet change — ONE canonical client-side rebuild.
//
// The complaint "I changed diet in Profile and the tray didn't change" had
// three real causes (diagnosed 2026-09-12):
//   1. The old inline picker rebuild ran ONLY when a loop config existed
//      (`if (current.config && current.sourceDishIds)`) — no config → NO
//      rebuild, yet the success toast still claimed "meal plan rebuilt".
//   2. Even when it ran, the trayLibrary (the "Your Tray" pool) was never
//      diet-cleaned: healTrayDietGaps only ADDS representatives (and skips
//      veg entirely — HEALABLE excludes 'veg'), so a non-veg→veg user kept
//      their old dishes and got holes, not new dishes.
//   3. Three divergent pool builders existed; this module uses the CANONICAL
//      buildEnrichedLoopPool (loopPool.ts, pattern-first) that every Apply
//      path shares.
//
// Hardened 2026-09-12 (the "second meal card" + "wrong mix" report):
//   - R2  Top-up now uses the canonical id-or-name upsert (utils/trayUpsert) —
//        a regenerated dish with a NEW id but the SAME name REPLACES the old
//        entry instead of appending a duplicate meal card.
//   - R5  Single-flight: concurrent "Bring new dishes now" taps + the
//        app-start/cycle-end deferred consumer coalesce onto ONE rebuild.
//   - R3  `customKept` surfaces how many custom/unresolvable dishes the diet
//        pass deliberately protected (never a silent mix) — callers show it.
//   - R4  `shortSlots` surfaces slots that could not reach the target for this
//        diet+region (e.g. vegan in a food-desert region) — callers show the
//        fallback instead of a bare half-empty tray.
//
// Callers:
//   - "Bring new dishes now" (DietChangePromptModal) → rebuildTrayForDiet()
//   - deferred regen consumer (store consumeDeferredDietRegen / App start) →
//     rebuildTrayForDiet()
// Pure pieces (removeDietInvalidFromTray) exported for vitest.
// ─────────────────────────────────────────────────────────────────────────────
import { useStore } from '../app/store/useStore';
import { useLoopStore } from '../plan/store/useLoopStore';
import { useHouseholdKitchenStore } from '../plan/store/householdKitchenStore';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import type { Dish } from '../meal/constants/dishLibrary';
import type { MealType } from '../types/tray';
import type { TrayLibrary, MealOption } from '../app/store/useStore';
import { buildEnrichedLoopPool, poolTargetForCycleLength } from './loopPool';
import { allowedTypesForDiet } from './dietQuota';
import { healTrayDietGaps, healPLANDietGaps } from './dietHeal';
import { regenerateMealPlanPipeline } from './mealPlanRegen';
import { getISODate } from './dateUTC';
import { useTrayStore } from '../plan/store/useTrayStore';
import { useHouseholdFeedStore } from '../plan/store/householdFeedStore';
import {
  getCachedMealHistory,
  hasPersistedMealHistory,
  refreshMealHistory,
} from '../app/lib/mealHistory';
import {
  getCachedHouseholdPlans,
  refreshHouseholdPlans,
  pushCurrentTrayAsHouseholdPlan,
} from '../app/lib/householdPlans';
import type { PersonalizationContext, HistoryItem, HouseholdDish } from './mealPersonalization';

/** Build the per-user PersonalizationContext for THIS rebuild from the live
 *  store — the ONE surface that feeds region+diet+focus+preferences+history+
 *  household into the pipeline's fill/dedupe ranking.
 *
 *  Meal history (Gap 2 — persisted first): the server-side MealLog (the REAL
 *  "consumed" rows written by the complete-slot flow) REPLACES the old
 *  proxies once it has rows. The swap log + materialized plan days are used
 *  ONLY while the persisted history is empty or still loading — an honest
 *  empty, never invented rows.
 *
 *  Household surface (Gap 3 — ALL members): the persisted HouseholdPlanItem
 *  table (upserted on EVERY member's tray/plan generation) is merged with the
 *  shared-plan table (the explicit-share surface). Rows authored by ME are
 *  excluded (own dishes never penalized). Members with nothing persisted are
 *  simply absent (recorded, not guessed).
 *
 *  Rotation: intentionally OFF by default — same user + same inputs → SAME
 *  plan (refresh-stable). `isoWeekKey`/`rotation` are exported for callers
 *  who opt into weekly regeneration rotation.
 */
export function buildPersonalizationContext(): PersonalizationContext | null {
  const store = useStore.getState();
  const user = store.user;
  if (!user?.id && !store.deviceId) return null;
  const myUserId = user?.id ?? '';

  // 1) Meal history — PERSISTED MealLog first (Gap 2). Fire-and-forget
  //    refresh never blocks regeneration; the proxies below remain in effect
  //    while the log is empty or still loading (Λ-honest empty).
  if (myUserId) void refreshMealHistory(myUserId);
  const persisted = getCachedMealHistory(myUserId);
  const recently: HistoryItem[] = [];
  if (hasPersistedMealHistory(myUserId) && persisted) {
    recently.push(...persisted); // REAL consumed rows — no proxies
  } else {
    // Fallback proxies — ONLY while the persisted history is empty/unloaded.
    // 1a) Swap log (dates → slots → MealOption).
    for (const day of Object.values(store.swaps ?? {})) {
      for (const m of Object.values(day ?? {})) {
        if (m && (m.dishId || m.name)) recently.push({ id: m.dishId, name: m.name });
      }
    }
    // 1b) Materialized plan days (served meals).
    try {
      const planDays = useTrayStore.getState().plan.days ?? {};
      for (const day of Object.values(planDays)) {
        for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
          for (const item of (day as unknown as Record<string, Array<{ meal_id?: string; name?: string }>>)?.[slot] ?? []) {
            if (item.meal_id || item.name) recently.push({ id: item.meal_id, name: item.name });
          }
        }
      }
    } catch {
      // plan store not materialized yet — the swap log alone is the proxy
    }
  }

  // 2) Household — ALL members' persisted current plans (Gap 3) merged with
  //    the explicit shared-plan surface; MY rows excluded from both.
  const hhId = store.householdId ?? '';
  if (hhId) void refreshHouseholdPlans(hhId);
  const household: HouseholdDish[] = [];
  const seen = new Set<string>();
  const pushDish = (id?: string, name?: string) => {
    if (!id && !name) return;
    const key = id ? `id:${id}` : `name:${name}`;
    if (seen.has(key)) return;
    seen.add(key);
    household.push({ id: id ?? undefined, name });
  };
  for (const sp of useHouseholdFeedStore.getState().sharedPlan ?? []) {
    if (sp.authorUserId && sp.authorUserId === myUserId) continue;
    pushDish(sp.dishId ?? undefined, sp.dishName);
  }
  const planRows = hhId ? getCachedHouseholdPlans(hhId) : null;
  for (const row of planRows ?? []) {
    if (row.authorUserId === myUserId) continue; // own dishes never penalized
    pushDish(row.dishId);
  }

  return {
    userId: myUserId || store.deviceId,
    deviceId: store.deviceId,
    healthFocus: user?.healthGoals?.[0],
    preferences: {
      spiceLevel: user?.spiceLevel,
      preferredRegions: user?.preferredRegions,
      dislikedItems: user?.dislikedItems,
    },
    recentlyEaten: recently.slice(0, 80),
    householdDishes: household.slice(0, 80),
  };
}

const SLOTS: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

/** Library dish for a tray item (dishId / id / name orders). Custom or
 *  unresolvable items return null — those are NEVER touched by the diet pass. */
export function resolveTrayDish(library: Dish[], item: MealOption): Dish | null {
  const norm = (s: string) => (s || '').trim().toLowerCase();
  return library.find(d => d.id === (item.dishId || item.id))
    ?? library.find(d => norm(d.name) === norm(item.name || ''))
    ?? null;
}

/** Pure: strip resolvable DIET-INVALID tray items (e.g. a non-veg dish in a
 *  veg user's tray). Custom/unresolvable items are protected. Returns the new
 *  tray + how many were removed. */
export function removeDietInvalidFromTray(
  library: Dish[],
  tray: TrayLibrary,
  diet: string | null | undefined,
): { tray: TrayLibrary; removed: number } {
  const allowed = new Set(allowedTypesForDiet(diet));
  let removed = 0;
  const next: TrayLibrary = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  for (const slot of SLOTS) {
    const items = tray[slot] ?? [];
    next[slot] = items.filter(m => {
      const d = resolveTrayDish(library, m);
      if (!d) return true; // custom/unresolvable — protect
      const t = (d.diet || d.type || '').toLowerCase();
      if (t && allowed.has(t)) return true;
      removed++;
      return false;
    });
  }
  return { tray: next, removed };
}

export interface TrayRegenResult {
  /** A loop config existed → assignments were rebuilt via applyLoopConfig. */
  applied: boolean;
  invalidRemoved: number;
  trayAdded: number;
  /** R2 — a same-name regenerated dish REPLACED an existing entry (no dup cards). */
  trayReplaced: number;
  /** R3 — custom/unresolvable dishes the diet pass protected (never removed). */
  customKept: number;
  /** R4 — slots that could not reach the cycle target for this diet+region. */
  shortSlots: MealType[];
  laneCleared: boolean;
  /** Pipeline: whole-plan duplicates replaced/removed (cross-slot repeats). */
  deduped: number;
  /** Pipeline: true when the final tray holds target×4 dishes with zero
   *  diet violations — the 20/20 contract (4 slots × 5 on a 7-day loop). */
  complete: boolean;
  /** Pipeline: per-slot target applied (getTraySlotCap / pool-target). */
  target: number;
  /** Pipeline: Λ2.3 — every honest reason recorded this run (unfillable
   *  slots, no-substitute removals, custom duplicates kept). */
  reasons: string[];
  /** Pipeline: every duplicate→substitution applied (audit trail). */
  substitutions: Array<{ slot: MealType; removedId?: string; removedName: string; addedName: string }>;
}

/** R5 — single-flight token: concurrent rebuild triggers coalesce onto ONE run. */
let _inflight: Promise<TrayRegenResult> | null = null;

/** Canonical rebuild: clean the tray of diet-invalid dishes, rebuild the
 *  enriched rotation pool for the CURRENT diet/region, re-apply the loop
 *  (when a config exists), top the tray up to the cycle-scaled target with the
 *  canonical id-or-name upsert, run the diet heals, and clear the member's
 *  household lane so Family Plans regenerates for them alone. */
export function rebuildTrayForDiet(): Promise<TrayRegenResult> {
  if (_inflight) return _inflight;
  const run = (async (): Promise<TrayRegenResult> => {
    const store = useStore.getState();
    const user = store.user;
    const diet = user?.diet ?? 'veg';
    const region = user?.region ?? 'north';
    const library: Dish[] = DISH_LIBRARY;

    const loop = useLoopStore.getState().mealLoop;
    const config = loop.config;
    const cycleLength = config?.cycleLength ?? 7;
    const target = poolTargetForCycleLength(cycleLength);

    // 1) Diet-clean the tray (custom dishes protected).
    const { tray: clean, removed } = removeDietInvalidFromTray(library, store.trayLibrary, diet);

    // 2) Build the canonical enriched pool from the clean tray.
    const sourcePool: Record<MealType, Dish[]> = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    const seen: Record<MealType, Set<string>> = { breakfast: new Set(), lunch: new Set(), snacks: new Set(), dinner: new Set() };
    for (const slot of SLOTS) {
      for (const m of clean[slot] ?? []) {
        const d = resolveTrayDish(library, m);
        if (d && !seen[slot].has(d.id)) {
          seen[slot].add(d.id);
          sourcePool[slot].push(d);
        }
      }
    }
    const pool = buildEnrichedLoopPool({
      sourcePool,
      library,
      diet,
      region,
      cycleLength,
      healthGoal: user?.healthGoals?.[0],
    });

    // 3) Re-apply the loop when one exists (same config, fresh start date).
    let applied = false;
    if (config && loop.sourceDishIds) {
      const today = getISODate();
      useLoopStore.getState().applyLoopConfig(
        { ...config, startDate: today },
        pool,
        library,
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loop_updated', { detail: { config } }));
      }
      applied = true;
    }

    // 4) THE 20/20 PIPELINE on the diet-cleaned tray:
    //    generate → validate → fill → dedupe → validate → render.
    //    Replaces the old loop-pool top-up that left "Breakfast 5 / Lunch 1 /
    //    Snacks 3 / Dinner 3" (12/20): the pipeline fills EVERY slot to the
    //    cycle target from the diet-compatible library pool (whole-plan
    //    dedupe-aware — a candidate already used in another slot is never
    //    added), deduplicates the WHOLE plan by dish_id (cross-slot
    //    "Andhra Spiced Egg Curry" repeats die here), and re-validates the
    //    FINAL dish set. Any slot that genuinely cannot reach the target is
    //    surfaced in shortSlots + reasons (Λ2.3 — never a silent partial).
    const pipe = regenerateMealPlanPipeline({
      tray: clean,
      library,
      diet,
      region,
      target,
      healthGoal: user?.healthGoals?.[0],
      personalization: buildPersonalizationContext(),
    });
    const merged: TrayLibrary = pipe.tray;
    const trayAdded = pipe.filled;
    const trayReplaced = pipe.deduped;
    const customKept = pipe.customKept;
    const shortSlots = pipe.shortSlots;
    const trayMutated =
      removed > 0 ||
      applied ||
      pipe.filled > 0 ||
      pipe.deduped > 0 ||
      pipe.invalidRemoved > 0 ||
      JSON.stringify(pipe.tray) !== JSON.stringify(store.trayLibrary);
    if (trayMutated) {
      useStore.setState({ trayLibrary: merged });
    }

    // 5) Diet heals (tray reps + plan-day diet-invalid strip) — both force=true
    //    so a deliberate diet change re-runs within this session.
    try {
      await healTrayDietGaps(true);
      await healPLANDietGaps(true);
    } catch (e) {
      console.warn('[trayRegen] diet heals skipped:', e);
    }

    // 6) Persist MY current tray as the household-visible plan (Gap 3) +
    //    targeted household lane clear: only MY lane, so Family Plans rebuilds
    //    for the changed member (never the whole household).
    let laneCleared = false;
    const hhId = useStore.getState().householdId;
    const userId = useStore.getState().user?.id;
    if (hhId && userId) {
      try {
        // The server table holds EXACTLY what was last generated — replace-all.
        void pushCurrentTrayAsHouseholdPlan(hhId, userId, merged);
      } catch {
        // best-effort — the next generation re-persists
      }
      try {
        await useHouseholdKitchenStore.getState().regenLane(hhId, userId);
        laneCleared = true;
        void useStore.getState().refreshHousehold();
      } catch {
        // best-effort — the lane regenerates on next FamilyPlans build anyway
      }
    }

    return {
      applied,
      invalidRemoved: removed + pipe.invalidRemoved,
      trayAdded,
      trayReplaced,
      deduped: pipe.deduped,
      customKept,
      shortSlots,
      laneCleared,
      complete: pipe.complete,
      target: pipe.target,
      reasons: pipe.reasons,
      substitutions: pipe.substitutions,
    };
  })();
  _inflight = run;
  run.finally(() => {
    if (_inflight === run) _inflight = null;
  }).catch(() => { /* caller handles */ });
  return run;
}
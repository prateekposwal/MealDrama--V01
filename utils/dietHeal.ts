// ─────────────────────────────────────────────────────────────────────────────
// Diet-representation HEAL — rebuild-time quota fixes never reach EXISTING
// installs: a hydrated tray keeps its pre-fix, representative-free slots
// forever ("YOUR TRAY still has no eggs"). Once per app load (or forced by a
// diet change):
//   1. TRAY top-up — every planned slot whose tray holds FEWER than
//      REP_TARGET distinctive-diet dishes receives representatives.
//   2. PLAN-WIDE presence — every date's planned slot that LACKS the diet
//      gets one representative mirrored in (the plan-nav suggestions were
//      egg-free wherever a previous purge/re-build only touched today).
// Full slots: the item whose diet is FARTHEST from the user's distinctive
// type is REPLACED (custom/unresolvable dishes are never removed).
// ─────────────────────────────────────────────────────────────────────────────
import { useStore } from '../app/store/useStore';
import { useTrayStore } from '../plan/store/useTrayStore';
import { getRegionKey } from './dishSearch';
import { pickDietRepresentativesWithSlots, distinctiveTypeFor } from './dietQuota';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getISODate } from './dateUTC';

const SLOTS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const TRAY_SLOT_CAP = 6;
const PLAN_SLOT_CAP = 6;
/** Distinctive diets worth healing. 'veg' is the universal default. */
const HEALABLE = new Set(['eggitarian', 'vegan', 'non-veg']);
/** Tray representatives per planned slot (the "more eggs" bar). */
const REP_TARGET = 2;
let _lastHealSig = '';

const normName = (s: string): string => (s || '').trim().toLowerCase();

/** Library dish for a tray/plan item (id / meal_id / name orders). */
function resolveDish(library: any[], item: { dishId?: string; id?: string; meal_id?: string; name?: string }): any | null {
  return library.find(d => d.id === (item.dishId || item.id || item.meal_id))
    ?? library.find(d => normName(d.name) === normName(item.name || ''))
    ?? null;
}

function isDistType(dish: any | null, distType: string): boolean {
  return !!dish && ((dish.diet || dish.type || '') + '').toLowerCase() === distType;
}

function distCount(items: any[], library: any[], distType: string): number {
  return items.filter(m => isDistType(resolveDish(library, m), distType)).length;
}

/**
 * Pick the tray/plan item to replace inside a full-but-representation-less
 * slot: the last resolvable, diet-mismatched item. Resolvable = maps to a
 * library dish (auto-seeded). Unresolvable = user's custom dish — never
 * removed. Exported for tests.
 */
export function findVictim(
  items: any[],
  library: any[],
  distType: string,
): { victim: any; index: number } | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const d = resolveDish(library, items[i]);
    if (!d) continue; // custom/unresolvable — protect
    if (!isDistType(d, distType)) return { victim: items[i], index: i };
  }
  return null;
}

async function ensureDietViaStore(repList: Array<{ dish: any; slot: string }>): Promise<boolean> {
  const todayStr = getISODate();
  const trayStore = useTrayStore.getState();
  let added = 0;
  let replaced = 0;
  for (const { dish, slot } of repList) {
    let current = (useStore.getState().trayLibrary as any)[slot] || [];
    if (current.length >= TRAY_SLOT_CAP) {
      const hit = findVictim(current, DISH_LIBRARY, superiorTypeOf(dish));
      if (!hit) continue;
      useStore.getState().removeFromTray(slot, hit.victim.id ?? hit.victim.dishId);
      replaced++;
    }
    current = (useStore.getState().trayLibrary as any)[slot] || [];
    if (current.some((m: any) => (m.id ?? m.dishId) === dish.id)) continue;
    useStore.getState().addToTray(slot, {
      id: dish.id, dishId: dish.id, name: dish.name,
      icon: dish.icon, sourceRegion: dish.region,
    });
    added++;
    // Mirror into today's plan when that slot lacks representation too.
    const dayMeals: any[] = (useTrayStore.getState().plan.days as any)?.[todayStr]?.[slot] ?? [];
    if (!dayMeals.some(m => isDistType(resolveDish(DISH_LIBRARY, m), superiorTypeOf(dish)))) {
      trayStore.addMealToSlot(todayStr, slot as any, {
        id: dish.id, name: dish.name, icon: dish.icon, region: dish.region,
      } as any, dish.variants?.[0] ? { variantId: dish.variants[0].id, variant: dish.variants[0].name } : undefined);
    }
  }
  console.log(`[dietHeal] +${added} tray reps (${replaced} swapped into full slots)`);
  return added > 0;
}

function superiorTypeOf(dish: any): string {
  return ((dish.diet || dish.type || '') + '').toLowerCase();
}

/**
 * REP-REGION RECONCILIATION: cross-region representatives were injected long
 * before the library gained same-region dishes (Andhra Spiced Egg Curry sat in
 * a north user's dinner because no north dinner egg existed). Now that local
 * diets exist, swap a far-region rep for a same-region one when available.
 * Returns a NEW items list (never mutates the input) + how many were swapped.
 */
export function reconcileStaleRegionalReps(
  items: any[],
  library: any[],
  distType: string,
  regionKey: string,
): { items: any[]; replaced: number } {
  const rk = regionKey.toLowerCase();
  const result = [...items];
  let replaced = 0;
  for (let i = 0; i < result.length; i++) {
    const m = result[i]!;
    const d = resolveDish(library, m);
    if (!d || !isDistType(d, distType)) continue; // not a diet rep
    const r = (d.region || '').toLowerCase();
    if (r === rk || r === 'all') continue; // local (or generic) — keep
    // Far-region rep: swap for a local diet dish when one exists and isn't already here.
    const others = result.filter((_, idx) => idx !== i);
    const usedNames = new Set(others.map(o => normName(o.name)));
    const local = library.find(x =>
      superiorTypeOf(x) === distType &&
      (x.region || '').toLowerCase() === rk &&
      !usedNames.has(normName(x.name)));
    if (!local) continue;
    result[i] = { ...m, id: local.id, dishId: local.id, name: local.name, icon: local.icon, sourceRegion: local.region };
    replaced++;
  }
  return { items: result, replaced };
}

/**
 * Inject distinctive-diet representatives: tray top-up per planned slot
 * (to REP_TARGET) + plan-wide presence across every date. `force=true`
 * re-runs within the same app session (after a deliberate diet change).
 */
export async function healTrayDietGaps(force = false): Promise<void> {
  try {
    const user = useStore.getState().user as any;
    const distType = distinctiveTypeFor(user?.diet);
    if (!distType || !HEALABLE.has(distType)) return;
    const regionKey = getRegionKey(user?.region) || 'north';
    const sig = `${distType}:${user?.region}:${getISODate()}`;
    if (!force && sig === _lastHealSig) return;
    _lastHealSig = sig;
    const planned: string[] = (user?.plannedSlots?.length
      ? user.plannedSlots
      : ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
    ).map((s: string) => s.toLowerCase());

    const store = useStore.getState();
    const tray = store.trayLibrary;
    if (!tray?.breakfast) return;

    const allNames = new Set<string>();
    for (const slot of SLOTS) for (const m of tray[slot] || []) allNames.add(normName(m.name));

    // 0) REP-REGION RECONCILIATION: swap stale cross-region reps (Andhra egg
    //    in a north dinner) for same-region diet dishes now available.
    for (const slot of planned) {
      const current = (tray as any)[slot] || [];
      const { items, replaced } = reconcileStaleRegionalReps(current, DISH_LIBRARY, distType, regionKey);
      if (replaced > 0) {
        useStore.setState((s: any) => ({
          trayLibrary: { ...s.trayLibrary, [slot]: items },
        }));
        console.log(`[dietHeal] ${distType}/${slot}: ${replaced} far-region rep(s) → same-region`);
      }
    }

    // 1) TRAY top-up: planned slots with fewer than REP_TARGET reps.
    const missing = planned.filter(slot => distCount((tray as any)[slot] || [], DISH_LIBRARY, distType) < REP_TARGET);
    if (missing.length > 0) {
      const reps = pickDietRepresentativesWithSlots(DISH_LIBRARY, {
        distType,
        regionKey,
        minCount: Math.min(missing.length * REP_TARGET, 8),
        excludeNames: allNames,
        plannedSlots: missing,
      });
      const repList = reps
        .filter(x => x.slot && missing.includes(x.slot))
        .map(x => ({ dish: x.dish as any, slot: x.slot as string }));
      await ensureDietViaStore(repList);
    }

    // 2) PLAN-WIDE presence: every date's planned slot lacking the diet.
    // NOTE: this pass APPENDS a meal card to an already-filled slot. It is the
    // "auto-added second card on reload" regression. It must run ONLY on an
    // EXPLICIT re-match (force=true: Profile "Re-match diet", diet change).
    // On a passive reload (force=false) the app restores exact persisted state
    // and must NOT append cards the user did not ask for.
    const days = force ? useTrayStore.getState().plan.days as Record<string, any> | undefined : undefined;
    if (days) {
      for (const date of Object.keys(days)) {
        for (const slot of planned) {
          const meals: any[] = days[date]?.[slot] ?? [];
          if (distCount(meals, DISH_LIBRARY, distType) > 0) continue;
          // One fresh representative for THIS date+slot, excluding whatever
          // already sits elsewhere so we don't repeat a name across days.
          const usedHere = new Set<string>();
          for (const m of meals) usedHere.add(normName(m.name));
          for (const kv of Object.entries(tray)) for (const m of (kv[1] as any[]) || []) usedHere.add(normName(m.name));
          const pick = pickDietRepresentativesWithSlots(DISH_LIBRARY, {
            distType,
            regionKey,
            minCount: 1,
            excludeNames: usedHere,
            plannedSlots: [slot],
          })[0];
          if (!pick?.dish || !pick.slot) continue;
          if (meals.length >= PLAN_SLOT_CAP) {
            const hit = findVictim(meals, DISH_LIBRARY, distType);
            if (!hit) continue;
            useTrayStore.setState((s: any) => {
              const day = { ...s.plan.days[date], [slot]: (s.plan.days[date]?.[slot] ?? []).filter((_: any, i: number) => i !== hit.index) };
              return { plan: { ...s.plan, days: { ...s.plan.days, [date]: day } } };
            });
          }
          const d = pick.dish;
          const v = d.variants?.[0];
          useTrayStore.getState().addMealToSlot(date, slot as any, {
            id: d.id, name: d.name, icon: d.icon, region: d.region,
          } as any, v ? { variantId: v.id, variant: v.name } : undefined);
        }
      }
    }
  } catch (e) {
    console.warn('[dietHeal] skipped:', e);
  }
}
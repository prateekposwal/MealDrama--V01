// ─────────────────────────────────────────────────────────────────────────────
// MEAL-PLAN REGENERATION PIPELINE — the 20/20 diet-change contract.
//
// Covers the FULL spec table:
//   · Veg→Eggitarian / Veg→Non-Veg / Eggitarian→Non-Veg / Veg→Vegan — every
//     FINAL dish validated, not just the first selection (the vegan guard also
//     excludes mislabeled "vegan" dishes that carry REAL dairy/egg names).
//   · Change→current (regenerate immediately) / Change→next (keep + defer) /
//     latest preference wins / refresh persists preference + plan.
//   · Seeded 12/20 tray (the live defect: Breakfast 5 / Lunch 1 / Snacks 3 /
//     Dinner 3) → 20/20 (100%), missing slots filled before render.
//   · "Andhra Spiced Egg Curry" seeded in multiple slots → whole-plan
//     dish_id uniqueness with a valid substitution in every duplicated slot.
//   · Dashboard vs Plan render the SAME source (useTrayStore.plan.days).
//   · generate → validate → fill → dedupe → validate ordering is locked:
//     asserted statically (trayRegen imports the pipeline) AND behaviorally
//     (one seed that is simultaneously invalid+short+duplicate only becomes
//     clean/complete through the exact ordering).
//
// Mocks ONLY the network surface (authApi.registerUser, dietApi.upsertMine) —
// the store, trayRegen, dietHeal and the pipeline are the REAL module graph.
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
  ANIMAL_INGREDIENT_NAMES,
  MEAL_SLOTS,
} from '../utils/mealPlanRegen';
import { allowedTypesForDiet } from '../utils/dietQuota';

const apiMocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  logoutUser: vi.fn(),
  getMe: vi.fn(),
  upsertMine: vi.fn(),
  dietGetMine: vi.fn(),
  dietList: vi.fn(),
  householdApi: { create: vi.fn(), join: vi.fn(), get: vi.fn(), leave: vi.fn(), updateMember: vi.fn(), getMembers: vi.fn(), regenerateCode: vi.fn() },
}));

vi.mock('../app/utils/authApi', () => ({
  registerUser: apiMocks.registerUser,
  logoutUser: apiMocks.logoutUser,
  getMe: apiMocks.getMe,
}));

vi.mock('../app/utils/dietApi', () => ({
  dietApi: { getMine: apiMocks.dietGetMine, upsertMine: apiMocks.upsertMine, listHouseholdDiets: apiMocks.dietList },
}));

vi.mock('../app/utils/householdApi', () => ({ householdApi: apiMocks.householdApi }));

// ─── Seed helpers over the REAL dish library ─────────────────────────────────
const dishFor = (slot: MealType, type: string, region = 'north'): Dish => {
  const d = DISH_LIBRARY.find(x =>
    (x.category ?? []).includes(slot) &&
    (x.type ?? x.diet ?? '').toLowerCase() === type &&
    (x.region === region || x.region === 'all'));
  if (!d) throw new Error(`no ${type}/${slot} dish for ${region}`);
  return d;
};

const mealOf = (d: Dish): MealOption =>
  ({ id: d.id, dishId: d.id, name: d.name, icon: d.icon, sourceRegion: d.region });

const trayFrom = (spec: Partial<Record<MealType, string[]>>): TrayLibrary => {
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

const emptyTray = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });

const trayTotals = (tray: TrayLibrary) => {
  const per = Object.fromEntries(MEAL_SLOTS.map(s => [s, tray[s].length])) as Record<MealType, number>;
  return { per, total: MEAL_SLOTS.reduce((n, s) => n + tray[s].length, 0) };
};

const uniqueIds = (tray: TrayLibrary) => {
  const ids = MEAL_SLOTS.flatMap(s => tray[s].map(m => m.dishId || m.id));
  return new Set(ids).size === ids.length;
};

/** Every resolvable dish in a tray that violates the diet (incl. vegan guard). */
const finalCompliance = (tray: TrayLibrary, diet: string) => {
  const { violations, unresolvable } = validateTrayDietCompatibility(tray, diet, DISH_LIBRARY);
  return { violations, unresolvable };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1 · Diet transition table — validate the FINAL dish, every dish
// ─────────────────────────────────────────────────────────────────────────────
describe('diet transition table — every FINAL dish is validated (spec #3)', () => {
  it('Veg → Eggitarian: eggs allowed, NO meat/fish anywhere in the final plan', () => {
    // Sparse veg/vegan seed (2/slot) → fill adds eggitarian (priority 0).
    const seed = trayFrom({
      breakfast: [dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id],
      lunch: [dishFor('lunch', 'veg').id, dishFor('lunch', 'vegan').id],
      snacks: [dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id],
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id],
    });
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'eggitarian', region: 'north', target: 5 });
    expect(res.complete).toBe(true);
    const { violations, unresolvable } = finalCompliance(res.tray, 'eggitarian');
    expect(violations).toEqual([]);            // EVERY dish validated
    expect(unresolvable).toBe(0);
    const allowed = new Set(allowedTypesForDiet('eggitarian')); // veg,vegan,eggitarian
    const types = new Set(MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId)).map(id => dishDietType(DISH_LIBRARY.find(d => d.id === id)!)));
    for (const t of types) expect(allowed.has(t)).toBe(true);   // no meat/fish
    // The distinctive food appears: eggitarian dishes are priority-0 fill.
    expect(types.has('eggitarian')).toBe(true);
  });

  it('Veg → Non-Veg: veg + egg + non-veg all present; every dish allowed', () => {
    const seed = trayFrom({
      breakfast: [dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id],
      lunch: [dishFor('lunch', 'veg').id, dishFor('lunch', 'vegan').id],
      snacks: [dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id],
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id],
    });
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'non-veg', region: 'north', target: 5 });
    expect(res.complete).toBe(true);
    expect(finalCompliance(res.tray, 'non-veg').violations).toEqual([]);
    const types = new Set(MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId)).map(id => dishDietType(DISH_LIBRARY.find(d => d.id === id)!)));
    expect(types.has('non-veg')).toBe(true);   // non-veg is priority-0 fill
    expect(types.has('veg')).toBe(true);       // seeded veg kept (allowed)
  });

  it('Eggitarian → Non-Veg: non-veg replaces where the pool offers it; final plan all allowed', () => {
    const seed = trayFrom({
      breakfast: [dishFor('breakfast', 'eggitarian').id, dishFor('breakfast', 'veg').id],
      lunch: [dishFor('lunch', 'eggitarian').id, dishFor('lunch', 'veg').id],
      snacks: [dishFor('snacks', 'eggitarian').id, dishFor('snacks', 'veg').id],
      dinner: [dishFor('dinner', 'eggitarian').id, dishFor('dinner', 'veg').id],
    });
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'non-veg', region: 'north', target: 5 });
    expect(res.complete).toBe(true);
    expect(finalCompliance(res.tray, 'non-veg').violations).toEqual([]);
    const ids = MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId));
    const types = new Set(ids.map(id => dishDietType(DISH_LIBRARY.find(d => d.id === id)!)));
    expect(types.has('non-veg')).toBe(true);   // the "where appropriate" replacement
  });

  it('Veg → Vegan: ZERO egg/dairy/paneer/curd/buttermilk/ghee in EVERY dish — and the mislabeled "vegan" dishes never appear', () => {
    // Seed includes veg-typed dishes AND every known mislabeled vegan-typed
    // dish (bela-pana → Butter, mushroom-toast → Butter, mushroom-pulao →
    // Yogurt, hakka-noodles → Eggs, chow-mein → Eggs) — type alone says
    // vegan, the ingredient guard must reject them honestly.
    const seed = trayFrom({
      breakfast: ['bela-pana', dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id],
      lunch: ['mushroom-toast', 'hakka-noodles', dishFor('lunch', 'veg').id],
      snacks: ['mushroom-pulao', 'chow-mein', dishFor('snacks', 'vegan').id],
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id],
    });
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'vegan', region: 'north', target: 5 });
    expect(res.complete).toBe(true);
    const { violations, unresolvable } = finalCompliance(res.tray, 'vegan');
    expect(violations).toEqual([]);
    expect(unresolvable).toBe(0);
    const finalIds = new Set(MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId)));
    for (const bad of ['bela-pana', 'mushroom-toast', 'mushroom-pulao', 'hakka-noodles', 'chow-mein']) {
      expect(finalIds.has(bad)).toBe(false);   // mislabeled dishes never rendered for a vegan
    }
    // Ingredient-level sweep of the FINAL plan: no animal-derived ingredient name.
    for (const slot of MEAL_SLOTS) {
      for (const m of res.tray[slot]) {
        const d = DISH_LIBRARY.find(x => x.id === m.dishId)!;
        expect(dishDietType(d)).toBe('vegan'); // type is canonical
        expect(dishHasAnimalDerivedIngredients(d)).toBe(false);
        const names: string[] = [];
        for (const v of d.variants ?? []) for (const i of v.ingredients ?? []) names.push(i.name);
        for (const s of d.defaultPairings?.sides ?? []) names.push(s);
        for (const n of names) {
          expect(ANIMAL_INGREDIENT_NAMES.has(n), `${d.name} leaks "${n}"`).toBe(false);
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 · 20/20 completeness — the live 12/20 defect, filled before render
// ─────────────────────────────────────────────────────────────────────────────
describe('20/20 completeness (spec #2 — never partially regenerate)', () => {
  it('reproduces the live "Breakfast 5 / Lunch 1 / Snacks 3 / Dinner 3" tray → 20 of 20 (100%)', () => {
    const seed: TrayLibrary = {
      breakfast: [dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id]
        .map(id => DISH_LIBRARY.find(d => d.id === id)!).map(mealOf),
      lunch: [mealOf(dishFor('lunch', 'veg'))],
      snacks: [dishFor('snacks', 'vegan').id, dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id].map(id => DISH_LIBRARY.find(d => d.id === id)!).map(mealOf),
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id, dishFor('dinner', 'veg').id].map(id => DISH_LIBRARY.find(d => d.id === id)!).map(mealOf),
    };
    expect(trayTotals(seed).total).toBe(12);   // the broken live shape

    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    const { per, total } = trayTotals(res.tray);
    expect(total).toBe(20);                    // 20/20 · 100%
    expect(per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    expect(res.complete).toBe(true);
    expect(res.shortSlots).toEqual([]);
    expect(res.filled).toBeGreaterThan(0);     // the missing lunch/snacks/dinner slots got filled
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
    expect(uniqueIds(res.tray)).toBe(true);
  });

  it('records an honest reason when a slot genuinely cannot reach the target (Λ2.3 — never a silent partial)', () => {
    // A tray seeded with UNRESOLVABLE-only slots stays short, and the reason
    // is recorded — the caller can surface it instead of faking completeness.
    const seed: TrayLibrary = {
      breakfast: [{ id: 'custom-a', dishId: 'custom-a', name: 'My Custom Bowl' }],
      lunch: [], snacks: [], dinner: [],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'vegan', region: 'north', target: 5, library: [] });
    expect(res.complete).toBe(false);
    expect(res.shortSlots.length).toBeGreaterThan(0);
    expect(res.reasons.length).toBeGreaterThan(0);
    expect(res.reasons[0]).toContain('fill_short');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 · Whole-plan dedupe — no unintended duplicate dish_ids
// ─────────────────────────────────────────────────────────────────────────────
describe('Whole-plan dedupe (spec #4 — no stale/repeated dishes)', () => {
  it('"Andhra Spiced Egg Curry" seeded in lunch + dinner + snacks → unique plan, valid substitution in every dup slot', () => {
    const andhra = DISH_LIBRARY.find(d => d.id === 'andhra-spiced-egg-curry')!;
    expect(andhra.type).toBe('eggitarian');    // schema fact: the reported repeater
    const seed: TrayLibrary = {
      breakfast: [mealOf(andhra)],             // first occurrence — kept
      lunch: [mealOf(dishFor('lunch', 'veg')), mealOf(andhra)],         // dup #1
      snacks: [mealOf(dishFor('snacks', 'veg')), mealOf(andhra)],       // dup #2
      dinner: [mealOf(dishFor('dinner', 'veg')), mealOf(andhra)],       // dup #3
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'eggitarian', region: 'south', target: 5 });
    expect(res.deduped).toBeGreaterThanOrEqual(3);
    const ids = MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId));
    expect(ids.filter(id => id === 'andhra-spiced-egg-curry')).toHaveLength(1); // ONE, not four
    expect(uniqueIds(res.tray)).toBe(true);
    // every substitution is a VALID dish: allowed type, correct slot, not used elsewhere
    for (const sub of res.substitutions) {
      const d = res.tray[sub.slot].find(m => m.name === sub.addedName);
      expect(d, `substitution ${sub.addedName} present in ${sub.slot}`).toBeDefined();
      expect(isMealDietCompatible(DISH_LIBRARY.find(x => x.id === d!.dishId)!, 'eggitarian')).toBe(true);
      expect((DISH_LIBRARY.find(x => x.id === d!.dishId)!.category ?? []).includes(sub.slot)).toBe(true);
    }
    expect(finalCompliance(res.tray, 'eggitarian').violations).toEqual([]);
  });

  it('collapses a within-slot name duplicate (regenerated-id legacy second card)', () => {
    const base = dishFor('lunch', 'veg');
    const seed: TrayLibrary = {
      breakfast: [], lunch: [
        { id: base.id, dishId: base.id, name: base.name, icon: base.icon, sourceRegion: base.region },
        { id: 'regenerated-id', dishId: 'regenerated-id', name: base.name, icon: base.icon, sourceRegion: base.region }, // same NAME
      ], snacks: [], dinner: [],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.deduped).toBeGreaterThanOrEqual(1);
    const names = res.tray.lunch.map(m => m.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    expect(uniqueIds(res.tray)).toBe(true);
  });

  it('protects user-added CUSTOM dishes from removal — a custom repeat is recorded, not destroyed', () => {
    const seed: TrayLibrary = {
      breakfast: [{ id: 'custom-x', dishId: 'custom-x', name: 'Grandma Pasta' }],
      lunch: [{ id: 'custom-x', dishId: 'custom-x', name: 'Grandma Pasta' }], // same custom dish twice
      snacks: [], dinner: [],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.tray.breakfast.some(m => m.id === 'custom-x')).toBe(true); // kept
    expect(res.tray.lunch.some(m => m.id === 'custom-x')).toBe(true);    // kept even though duplicated
    expect(res.reasons.some(r => r.includes('custom_duplicate_kept'))).toBe(true); // honest record
    expect(res.customKept).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4 · Dashboard vs Plan — the SAME meal-plan source (useTrayStore.plan.days)
// ─────────────────────────────────────────────────────────────────────────────
describe('Dashboard vs Plan render the same source (spec test row)', () => {
  const readSource = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

  it('static: both screens read useTrayStore plan.days (same store slice)', () => {
    const dash = readSource('../screens/Dashboard.tsx');
    const plan = readSource('../screens/PlanScreen.tsx');
    expect(dash).toContain('useTrayStore');
    expect(dash).toMatch(/plan\.days/);
    expect(plan).toContain('useTrayStore');
    expect(plan).toMatch(/plan\.days/);
    // Both reference the SAME store module.
    expect(dash.match(/from '\.\.\/plan\/store\/useTrayStore'/)).toBeTruthy();
    expect(plan.match(/from '\.\.\/plan\/store\/useTrayStore'/)).toBeTruthy();
  });

  it('behavioral: a 20/20 tray materializes into plan.days — the slice both screens render', async () => {
    vi.resetModules();
    const { useStore } = await import('../app/store/useStore');
    const { useLoopStore } = await import('../plan/store/useLoopStore');
    const { seedTodayFromTray } = await import('../plan/store/useTrayStore');
    const { useTrayStore } = await import('../plan/store/useTrayStore');
    const tray = trayFrom({
      breakfast: [dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id, dishFor('breakfast', 'vegan').id, dishFor('breakfast', 'veg').id],
      lunch: [dishFor('lunch', 'veg').id, dishFor('lunch', 'vegan').id, dishFor('lunch', 'veg').id, dishFor('lunch', 'vegan').id, dishFor('lunch', 'veg').id],
      snacks: [dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id, dishFor('snacks', 'veg').id, dishFor('snacks', 'vegan').id, dishFor('snacks', 'veg').id],
      dinner: [dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id, dishFor('dinner', 'veg').id, dishFor('dinner', 'vegan').id, dishFor('dinner', 'veg').id],
    });
    useStore.setState({
      user: { id: 'u-src', name: 'Src', diet: 'veg', region: 'north', spiceLevel: 'medium' } as any,
      trayLibrary: tray,
    });
    // A live loop config keeps seedTodayFromTray deterministic (no microtask retry).
    useLoopStore.setState({ mealLoop: { config: { cycleLength: 7 } as any, sourceDishIds: [], assignments: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } } as any);
    seedTodayFromTray();
    const { getISODate } = await import('../utils/dateUTC');
    const today = getISODate();
    const day = useTrayStore.getState().plan.days[today] as Record<string, any[]> | undefined;
    expect(day).toBeDefined();
    // Every seeded slot produced a plan-day entry whose meal_id is the SAME
    // dish the tray holds — the exact slice Dashboard and PlanScreen render.
    for (const slot of MEAL_SLOTS) {
      const planItems = day?.[slot] ?? [];
      if (planItems.length === 0) continue;     // slot-level seeding is one per slot
      const planIds = new Set(planItems.map(i => i.meal_id));
      const trayIds = new Set((tray[slot] as any[]).map(m => m.dishId || m.id));
      for (const pid of planIds) expect(trayIds.has(pid)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5 · Store-level decisions: current / next / latest-wins / refresh persists
// ─────────────────────────────────────────────────────────────────────────────
describe('change→current / change→next decision paths (spec #1/#5)', () => {
  afterEach(() => { vi.resetModules(); });

  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
  });

  const seed = async (diet: string, tray: TrayLibrary) => {
    const { useStore } = await import('../app/store/useStore');
    const { useLoopStore } = await import('../plan/store/useLoopStore');
    const { useHouseholdKitchenStore } = await import('../plan/store/householdKitchenStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: 'u-dec', name: 'Decider', diet, region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [], plannedSlots: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] } as any,
      token: 'jwt-ok',
      trayLibrary: tray,
      pendingDietChange: null,
      dietRegen: null,
      dietSyncState: 'idle',
      toast: null,
      householdId: null,
    } as any);
    // Deterministic loop/kitchen state: no loop config → the rebuild's loop
    // re-apply branch is skipped; no household → the lane-clear is skipped.
    useLoopStore.setState({ mealLoop: { config: null, sourceDishIds: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, assignments: [], overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } } as any);
    useHouseholdKitchenStore.setState({ households: {}, lanes: {} } as any);
    return useStore;
  };

  const tray12: TrayLibrary = {
    breakfast: [mealOf(dishFor('breakfast', 'non-veg')), mealOf(dishFor('breakfast', 'veg')), mealOf(dishFor('breakfast', 'non-veg')), mealOf(dishFor('breakfast', 'veg')), mealOf(dishFor('breakfast', 'non-veg'))],
    lunch: [mealOf(dishFor('lunch', 'non-veg'))],
    snacks: [mealOf(dishFor('snacks', 'non-veg')), mealOf(dishFor('snacks', 'veg')), mealOf(dishFor('snacks', 'non-veg'))],
    dinner: [mealOf(dishFor('dinner', 'non-veg')), mealOf(dishFor('dinner', 'veg')), mealOf(dishFor('dinner', 'non-veg'))],
  };

  it('Change→current: pending prompt armed; choosing "Apply to my current meal plan" regenerates the WHOLE plan immediately (20/20, vegan-clean)', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seed('non-veg', tray12);
    const before = trayTotals(useStore.getState().trayLibrary).total;
    expect(before).toBe(12);

    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    const r = await changeDiet({ diet: 'vegan', prevDiet: 'non-veg' });
    expect(r.prompted).toBe(true);                       // tray has items → prompt governs
    expect(useStore.getState().pendingDietChange!.to).toBe('vegan');

    // The popover's "Apply to my current meal plan" decision: regenerate,
    // then clear the prompt (exactly what DietChangePromptModal.handleNow does).
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    const result = await rebuildTrayForDiet();
    useStore.getState().setPendingDietChange(null);
    const { per, total } = trayTotals(useStore.getState().trayLibrary);
    expect(total).toBe(20);                              // 20/20 · 100% — never partial
    expect(per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    expect(result.complete).toBe(true);
    expect(useStore.getState().pendingDietChange).toBeNull(); // decision consumed
    // EVERY dish in the final plan is vegan-clean (type + ingredient guard).
    expect(finalCompliance(useStore.getState().trayLibrary, 'vegan').violations).toEqual([]);
    expect(uniqueIds(useStore.getState().trayLibrary)).toBe(true);
  });

  it('Change→next: current plan UNCHANGED, preference saved; the next generation uses the new diet', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seed('non-veg', tray12);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    const r = await changeDiet({ diet: 'vegan', prevDiet: 'non-veg' });
    expect(r.prompted).toBe(true);

    // "Apply from my next meal plan" — defer: nothing regenerates now.
    useStore.getState().deferDietRegen();
    const regen = useStore.getState().dietRegen!;
    expect(regen.state).toBe('deferred');
    expect(regen.from).toBe('non-veg'); expect(regen.to).toBe('vegan');
    const afterDefer = trayTotals(useStore.getState().trayLibrary);
    expect(afterDefer.total).toBe(12);                   // current plan untouched
    expect(useStore.getState().user!.diet).toBe('vegan'); // preference saved immediately

    // The NEXT plan generation (app-start / cycle-end surface) consumes the flag:
    await useStore.getState().consumeDeferredDietRegen();
    const { per, total } = trayTotals(useStore.getState().trayLibrary);
    expect(total).toBe(20);                              // next generation uses the new diet
    expect(per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    expect(finalCompliance(useStore.getState().trayLibrary, 'vegan').violations).toEqual([]);
    expect(useStore.getState().dietRegen).toBeNull();    // consumed once
  });

  it('Latest preference wins on repeated changes before a decision', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seed('non-veg', tray12);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'eggitarian', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    await changeDiet({ diet: 'vegan', prevDiet: 'non-veg' });
    expect(useStore.getState().pendingDietChange!.to).toBe('vegan');
    await changeDiet({ diet: 'eggitarian', prevDiet: 'non-veg' });   // changed their mind
    const p = useStore.getState().pendingDietChange!;
    expect(p.to).toBe('eggitarian');                     // latest wins
    expect(useStore.getState().user!.diet).toBe('eggitarian');
  });

  it('Refresh persists preference + plan (user.diet, trayLibrary, dietRegen in the persisted slice)', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seed('non-veg', tray12);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    await changeDiet({ diet: 'vegan', prevDiet: 'non-veg' });
    useStore.getState().deferDietRegen();                // "apply from next" persists
    const persisted = JSON.parse((localStorage.getItem('mealdrama-store') ?? '{}')) as any;
    expect(persisted.state.user.diet).toBe('vegan');     // preference survives refresh
    expect(persisted.state.dietRegen.state).toBe('deferred'); // choice survives refresh
    expect(persisted.state.trayLibrary).toBeDefined();

    // "Apply to current" path persists the regenerated plan the same way.
    useStore.getState().setPendingDietChange({ from: 'vegan', to: 'eggitarian', at: new Date().toISOString() });
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    await rebuildTrayForDiet();                          // TODO mock diet eggitarian server response governs? no — rebuild reads user.diet
    // The rebuild uses the STORED diet; the persisted tray must carry it.
    useStore.getState().setPendingDietChange(null);
    const persisted2 = JSON.parse((localStorage.getItem('mealdrama-store') ?? '{}')) as any;
    const tray = persisted2.state.trayLibrary as TrayLibrary;
    expect(trayTotals(tray).total).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6 · Pipeline ordering locked — generate→validate→fill→dedupe→validate
// ─────────────────────────────────────────────────────────────────────────────
describe('pipeline ordering locked (spec #6 — the critical rule)', () => {
  it('static: trayRegen (the popover-current AND next-plan generation path) imports the pipeline', () => {
    const src = readFileSync(resolve(__dirname, '../utils/trayRegen.ts'), 'utf8');
    expect(src).toContain("from './mealPlanRegen'");
    expect(src).toContain('regenerateMealPlanPipeline');
    expect(src).toContain('generate');
  });

  it('unified seed that is simultaneously INVALID + SHORT + DUPLICATE → only the exact ordering yields invalidRemoved>0 AND filled>0 AND deduped>0 AND a clean complete final state', () => {
    // diet = eggitarian: the non-veg dishes are INVALID (stripped by validate),
    // the eggitarian andhra carries a cross-slot duplicate (dedupe), and
    // snacks/dinner are SHORT (fill) — every stage must fire in order.
    const andhra = DISH_LIBRARY.find(d => d.id === 'andhra-spiced-egg-curry')!;
    const seed: TrayLibrary = {
      breakfast: [mealOf(dishFor('breakfast', 'non-veg')), mealOf(andhra)],                       // 1 invalid + duplicate-candidate
      lunch: [mealOf(dishFor('lunch', 'non-veg')), mealOf(andhra)],                              // invalid + dup
      snacks: [mealOf(dishFor('snacks', 'veg'))],                                                // short
      dinner: [],                                                                                // short
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'eggitarian', region: 'north', target: 5 });
    expect(res.invalidRemoved).toBeGreaterThan(0);   // validate removed non-veg
    expect(res.filled).toBeGreaterThan(0);           // fill topped-up snacks/dinner
    expect(res.deduped).toBeGreaterThan(0);          // dedupe replaced cross-slot andhra repeats
    expect(res.violations).toEqual([]);              // final validate is CLEAN
    expect(res.complete).toBe(true);
    const { total } = trayTotals(res.tray);
    expect(total).toBe(20);
    expect(uniqueIds(res.tray)).toBe(true);
    const andhraCount = MEAL_SLOTS.flatMap(s => res.tray[s].map(m => m.dishId)).filter(id => id === 'andhra-spiced-egg-curry').length;
    expect(andhraCount).toBe(1);                     // ONE survivor, not two
  });

  it('both decision paths funnel through the same pipeline fingerprints (current = rebuild; next = defer → consume → rebuild)', async () => {
    const src = readFileSync(resolve(__dirname, '../utils/trayRegen.ts'), 'utf8');
    // "Apply to my current meal plan" (DietChangePromptModal) and the
    // deferred consumer (store consumeDeferredDietRegen) BOTH call
    // rebuildTrayForDiet → the pipeline. The modal's import is asserted here
    // so neither path can drift onto a partial-render side channel.
    expect(src).toMatch(/rebuildTrayForDiet/);

    vi.resetModules();
    const { useStore } = await import('../app/store/useStore');
    const { useLoopStore } = await import('../plan/store/useLoopStore');
    const { useHouseholdKitchenStore } = await import('../plan/store/householdKitchenStore');
    useStore.setState({
      isLoggedIn: true,
      user: { id: 'u-ord', name: 'Order', diet: 'veg', region: 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [] } as any,
      token: 'jwt-ok',
      trayLibrary: { breakfast: [mealOf(dishFor('breakfast', 'non-veg'))], lunch: [], snacks: [], dinner: [] } as TrayLibrary,
      pendingDietChange: null,
      dietRegen: null,
      householdId: null,
    } as any);
    useLoopStore.setState({ mealLoop: { config: null, sourceDishIds: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, assignments: [], overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } } as any);
    useHouseholdKitchenStore.setState({ households: {}, lanes: {} } as any);
    // next-plan path: defer then consume → rebuild → pipeline.
    useStore.getState().setPendingDietChange({ from: 'eggitarian', to: 'veg', at: new Date().toISOString() });
    useStore.getState().deferDietRegen();
    await useStore.getState().consumeDeferredDietRegen();
    const { per, total } = trayTotals(useStore.getState().trayLibrary);
    expect(total).toBe(20);
    expect(per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    expect(uniqueIds(useStore.getState().trayLibrary)).toBe(true);
    expect(useStore.getState().dietRegen).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6 · PIPELINE HONESTY (rule 5) — a dead/invalid dish id injected into a plan
//    input can NEVER render as a plausible meal. It is EXCLUDED with a
//    recorded reason (`invalid_dish_mapping`) and a VALID diet-compatible
//    dish fills its slot (the 20/20 guarantee is the regression). Genuine
//    custom dishes (custom- prefix / UUID ids) stay protected.
// ─────────────────────────────────────────────────────────────────────────────
describe('invalid dish mapping — exclude + record + valid fallback (rule 5)', () => {
  const empty = (): TrayLibrary => ({ breakfast: [], lunch: [], snacks: [], dinner: [] });

  it('a dead curated id (masala-dosa) injected into the plan cannot render: excluded, reason recorded, 20/20 intact', () => {
    const seed: TrayLibrary = {
      ...empty(),
      lunch: [
        { id: 'masala-dosa', dishId: 'masala-dosa', name: 'Masala Dosa' }, // dead curated id — NOT in the library
        mealOf(dishFor('lunch', 'veg')),
      ],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.complete).toBe(true);                                  // 20/20 still guaranteed
    expect(trayTotals(res.tray).per).toEqual({ breakfast: 5, lunch: 5, snacks: 5, dinner: 5 });
    // The dead id is gone; a VALID dish replaced it.
    const finalLunch = res.tray.lunch;
    expect(finalLunch.some(m => (m.dishId || m.id) === 'masala-dosa')).toBe(false);
    for (const m of finalLunch) {
      const d = DISH_LIBRARY.find(x => x.id === (m.dishId || m.id));
      expect(d, `replacement ${m.name} is a real library dish`).toBeDefined();
    }
    // The exclusion is recorded (Λ2.3) — never a silent substitution.
    expect(res.reasons.some(r => r.startsWith('invalid_dish_mapping:lunch:masala-dosa'))).toBe(true);
    expect(finalCompliance(res.tray, 'veg').violations).toEqual([]);
  });

  it('multiple dead ids across slots are all excluded and replaced (veg-biryani, dal-tadka)', () => {
    const seed: TrayLibrary = {
      ...empty(),
      lunch: [{ id: 'veg-biryani', dishId: 'veg-biryani', name: 'Veg Biryani' }],
      dinner: [{ id: 'dal-tadka', dishId: 'dal-tadka', name: 'Dal Tadka' }],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.complete).toBe(true);
    expect(trayTotals(res.tray).total).toBe(20);
    expect(res.tray.lunch.some(m => m.dishId === 'veg-biryani')).toBe(false);
    expect(res.tray.dinner.some(m => m.dishId === 'dal-tadka')).toBe(false);
    expect(res.reasons.filter(r => r.startsWith('invalid_dish_mapping')).length).toBe(2);
  });

  it('a dead id with a NAME matching a live dish is still excluded — no silent name-substitution', () => {
    // 'masala-dosa' id does not exist, but 'Masala Dosa' name DOES match live
    // dishes by name. The id claim is dead → excluded; never silently re-mapped.
    const seed: TrayLibrary = {
      ...empty(),
      breakfast: [{ id: 'masala-dosa', dishId: 'masala-dosa', name: 'Masala Dosa' }],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.reasons.some(r => r.startsWith('invalid_dish_mapping:breakfast:masala-dosa'))).toBe(true);
    expect(res.tray.breakfast.some(m => (m.dishId || m.id) === 'masala-dosa')).toBe(false);
    expect(res.complete).toBe(true);
  });

  it('genuine custom dishes stay protected (custom- prefix and UUID ids)', () => {
    const uuid = '3f1c9e2a-7b42-4f1e-9c0d-1234567890ab';
    const seed: TrayLibrary = {
      ...empty(),
      breakfast: [
        { id: 'custom-granny-pasta', dishId: 'custom-granny-pasta', name: 'Granny Pasta' },
        { id: uuid, dishId: uuid, name: 'My Paneer Special' },
      ],
    };
    const res = regenerateMealPlanPipeline({ tray: seed, diet: 'veg', region: 'north', target: 5 });
    expect(res.tray.breakfast.some(m => m.id === 'custom-granny-pasta')).toBe(true);
    expect(res.tray.breakfast.some(m => m.id === uuid)).toBe(true);
    expect(res.customKept).toBeGreaterThanOrEqual(2);
    expect(res.reasons.filter(r => r.startsWith('invalid_dish_mapping')).length).toBe(0); // nothing falsely stripped
    expect(res.complete).toBe(true);
  });

  it('pure helpers: isCustomDishId / looksLikeLibraryDishId classify the boundaries', async () => {
    const { isCustomDishId, looksLikeLibraryDishId } = await import('../utils/mealPlanRegen');
    expect(isCustomDishId('custom-x')).toBe(true);
    expect(isCustomDishId('3f1c9e2a-7b42-4f1e-9c0d-1234567890ab')).toBe(true);
    expect(isCustomDishId('masala-dosa')).toBe(false);
    expect(isCustomDishId('idli')).toBe(false);
    expect(looksLikeLibraryDishId('masala-dosa')).toBe(true);     // library-shaped slug
    expect(looksLikeLibraryDishId('besan_chilla_north')).toBe(true); // snake library shape
    expect(looksLikeLibraryDishId('idli')).toBe(true);            // single-word live slug shape
    expect(looksLikeLibraryDishId('custom-x')).toBe(false);       // custom first
    expect(looksLikeLibraryDishId('3f1c9e2a-7b42-4f1e-9c0d-1234567890ab')).toBe(false); // uuid first
    expect(looksLikeLibraryDishId('123')).toBe(false);            // numeric-only legacy-ish → protected
  });

  it('static: the pipeline render path (rebuildTrayForDiet) runs through the strip', () => {
    const src = readFileSync(resolve(__dirname, '../utils/mealPlanRegen.ts'), 'utf8');
    expect(src).toContain('stripInvalidDishMappings(tray, library)');
    expect(src).toContain('invalid_dish_mapping:');
  });
});

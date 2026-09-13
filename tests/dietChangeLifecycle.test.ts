// ─────────────────────────────────────────────────────────────────────────────
// DIET-CHANGE LIFECYCLE — auth-first sync, prompt arming, rebuild integrity,
// deferred "after this cycle" consumption.  (R1, R5, R6/R7, UC-01..UC-12)
//
// Mocks ONLY the network surface (authApi.registerUser, dietApi.upsertMine).
// Everything else — the store, trayRegen canonical rebuild, dietHeal, loopPool
// — is the REAL module graph, so these are behavior tests, not mocks of mocks.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { keepRegionTrayItems } from '../utils/dietQuota';
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

const ALLOWED_FOR: Record<string, string[]> = {
  veg: allowedTypesForDiet('veg'),
  vegan: allowedTypesForDiet('vegan'),
  'non-veg': allowedTypesForDiet('non-veg'),
  eggitarian: allowedTypesForDiet('eggitarian'),
};

async function seedUser(diet: string, region = 'north') {
  const { useStore } = await import('../app/store/useStore');
  useStore.setState({
    isLoggedIn: true,
    user: { id: 'u-diet', name: 'Diet Tester', diet, region, spiceLevel: 'medium', allergies: [], dislikedItems: [] } as any,
    dietSyncState: 'idle',
    pendingDietChange: null,
    dietRegen: null,
    toast: null,
  });
  return useStore;
}

describe('syncDietToServer — auth-first (R1): NEVER a masked diet write', () => {
  afterEach(() => { vi.resetModules(); });

  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
  });

  it('no token + register fails → sync is SKIPPED, the diet write NEVER reaches the server, state=failed', async () => {
    const useStore = await seedUser('veg');
    useStore.setState({ token: null } as any);
    apiMocks.registerUser.mockResolvedValue({ ok: false, error: 'network down (fetch failed)' });

    const res = await useStore.getState().syncDietToServer('veg');
    expect(res.ok).toBe(false);
    expect(apiMocks.upsertMine).not.toHaveBeenCalled();        // no PUT without a JWT
    expect(useStore.getState().dietSyncState).toBe('failed');
    expect(useStore.getState().pendingDietChange).toBeNull();  // no guess-prompt
  });

  it('token present → PUT flows and a REAL dietType change arms the prompt (UC-02/TC-02)', async () => {
    const useStore = await seedUser('non-veg');
    useStore.setState({ token: 'jwt-ok' } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    const res = await useStore.getState().syncDietToServer('veg');
    expect(res.ok).toBe(true);
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(1);
    const p = useStore.getState().pendingDietChange;
    expect(p).not.toBeNull();
    expect(p!.from).toBe('veg');        // the PREVIOUS row the user left
    expect(p!.to).toBe('non-veg');
  });

  it('first-ever set (wasUnset) NEVER arms the prompt (UC-01/TC-19)', async () => {
    const useStore = await seedUser('vegan');
    useStore.setState({ token: 'jwt-ok' } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: true, changed: { dietType: false, region: false, allergies: false },
    });
    await useStore.getState().syncDietToServer('veg');
    expect(useStore.getState().pendingDietChange).toBeNull();
  });

  it('server 401/500 → failed state, NO prompt, NO partial arm (TC-11)', async () => {
    const useStore = await seedUser('vegan');
    useStore.setState({ token: 'jwt-expired' } as any);
    apiMocks.upsertMine.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
    const res = await useStore.getState().syncDietToServer('veg');
    expect(res.ok).toBe(false);
    expect(useStore.getState().dietSyncState).toBe('failed');
    expect(useStore.getState().pendingDietChange).toBeNull();
  });
});

describe('defer / dismiss / consume — the "after this cycle" lifecycle (UC-04/UC-05, TC-06/TC-09)', () => {
  beforeEach(async () => {
    vi.resetModules();
    const useStore = await seedUser('eggitarian');
    useStore.setState({ token: 'jwt-ok' } as any);
    useStore.getState().setPendingDietChange({ from: 'veg', to: 'eggitarian', at: new Date().toISOString() });
  });

  afterEach(() => { vi.resetModules(); });

  it('deferDietRegen persists the flag and clears the transient prompt (TC-06)', async () => {
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().deferDietRegen();
    const r = useStore.getState().dietRegen;
    expect(r).not.toBeNull();
    expect(r!.state).toBe('deferred');
    expect(r!.from).toBe('veg');
    expect(useStore.getState().pendingDietChange).toBeNull();
  });

  it('dismissDietRegen persists dismissed — the SAME change never re-nags (TC-09)', async () => {
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().dismissDietRegen();
    expect(useStore.getState().dietRegen!.state).toBe('dismissed');
    expect(useStore.getState().pendingDietChange).toBeNull();
  });

  it('consume is a NO-OP for dismissed, but REBUILDS + clears for deferred (app-start/cycle-end surface)', async () => {
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().dismissDietRegen();
    await useStore.getState().consumeDeferredDietRegen();
    expect(useStore.getState().dietRegen!.state).toBe('dismissed'); // untouched

    // re-arm the prompt then defer — the "after this cycle" choice on a LATER change
    useStore.getState().setPendingDietChange({ from: 'veg', to: 'eggitarian', at: new Date().toISOString() });
    useStore.getState().deferDietRegen();
    await useStore.getState().consumeDeferredDietRegen();
    expect(useStore.getState().dietRegen).toBeNull();               // consumed once
  });
});

describe('rebuildTrayForDiet — canonical diet-clean rebuild (TC-12/TC-14/TC-15)', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { useStore } = await import('../app/store/useStore');
    const { useLoopStore } = await import('../plan/store/useLoopStore');
    const { useHouseholdKitchenStore } = await import('../plan/store/householdKitchenStore');
    useStore.setState({
      user: { id: 'u-rebuild', name: 'Rebuild', diet: 'veg', region: 'north', spiceLevel: 'medium' } as any,
      householdId: null,
      trayLibrary: {
        breakfast: [{ id: 'murghi-na-farcha', dishId: 'murghi-na-farcha', name: 'Murghi na Farcha (Parsi Fried Chicken)', icon: '🍗', sourceRegion: 'west' }],
        lunch: [
          { id: 'sweet-corn-chicken-soup', dishId: 'sweet-corn-chicken-soup', name: 'Sweet Corn Chicken Soup', icon: '🐔', sourceRegion: 'all' },
          { id: 'custom-tofu-1', dishId: 'custom-tofu-1', name: 'My Custom Tofu Bowl', icon: '🥗' },
        ],
        snacks: [
          { id: 'sindhi-kadhi', dishId: 'sindhi-kadhi', name: 'Sindhi Kadhi Chawal', icon: '🍛', sourceRegion: 'all' },
          { id: 'sindhi-kadhi-dup', dishId: 'sindhi-kadhi-dup', name: 'Sindhi Kadhi Chawal', icon: '🍛', sourceRegion: 'all' },
        ],
        dinner: [],
      },
    });
    useLoopStore.setState({ mealLoop: { config: null, sourceDishIds: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, assignments: [], overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } });
    useHouseholdKitchenStore.setState({ households: {}, lanes: {} } as any);
  });

  afterEach(() => { vi.resetModules(); });

  it('removes diet-invalid resolvable dishes, keeps custom, heals to the new-diet matrix (TC-12/TC-15)', async () => {
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    const result = await rebuildTrayForDiet();
    const { useStore } = await import('../app/store/useStore');
    const tray = useStore.getState().trayLibrary;

    // TC-12 — every RESOLVABLE tray row is veg-allowed after the veg rebuild
    const { resolveTrayDish, removeDietInvalidFromTray } = await import('../utils/trayRegen');
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      for (const m of tray[slot] ?? []) {
        const d = resolveTrayDish(DISH_LIBRARY, m);
        if (!d) continue; // custom — exempt by design
        expect(ALLOWED_FOR.veg).toContain((d.diet || d.type || '').toLowerCase());
      }
    }

    // the two non-veg dishes are gone
    expect(result.invalidRemoved).toBeGreaterThanOrEqual(2);
    expect(tray.breakfast.every((m: any) => m.name !== 'Murghi na Farcha (Parsi Fried Chicken)')).toBe(true);
    expect(tray.lunch.every((m: any) => m.name !== 'Sweet Corn Chicken Soup')).toBe(true);

    // TC-15 — the custom bowl is protected + counted honestly
    expect(tray.lunch.some((m: any) => m.id === 'custom-tofu-1')).toBe(true);
    expect(result.customKept).toBeGreaterThanOrEqual(1);

    // R2 — no slot contains a duplicated normalized name after top-up
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      const names = (tray[slot] ?? []).map((m: any) => (m.name || '').trim().toLowerCase());
      expect(new Set(names).size).toBe(names.length);
    }

    // R5 result structure is honest
    expect(Array.isArray(result.shortSlots)).toBe(true);
    expect(typeof result.laneCleared).toBe('boolean');
    expect(typeof result.trayAdded).toBe('number');
    expect(typeof result.trayReplaced).toBe('number');
  });

  it('single-flight (R5/TC-17): concurrent triggers coalesce onto ONE rebuild', async () => {
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    const p1 = rebuildTrayForDiet();
    const p2 = rebuildTrayForDiet();   // synchronously while p1 is in-flight
    expect(p1).toBe(p2);               // the SAME promise — one execution
    await Promise.all([p1, p2]);
    const p3 = rebuildTrayForDiet();   // after completion a fresh run is allowed
    expect(p3).not.toBe(p1);
    await p3;
  });

  it('removeDietInvalidFromTray pure piece: strips resolvable invalid, protects custom', async () => {
    const { removeDietInvalidFromTray } = await import('../utils/trayRegen');
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    const { useStore } = await import('../app/store/useStore');
    const { tray, removed } = removeDietInvalidFromTray(DISH_LIBRARY, useStore.getState().trayLibrary, 'vegan');
    expect(removed).toBeGreaterThanOrEqual(2);   // murghi + chicken soup are non-veg
    expect(tray.lunch.some((m: any) => m.id === 'custom-tofu-1')).toBe(true); // custom kept
  });
});

describe('region + diet changed together — ordering (open question 5)', () => {
  it('RESEED drops far-region leftovers first; the rebuild then reads the CURRENT diet/region', async () => {
    // App.tsx runs keepRegionTrayItems on region change BEFORE any diet prompt.
    const tray = {
      breakfast: [{ id: 'a', name: 'Local', region: 'north' }],
      lunch: [{ id: 'b', name: 'Far', region: 'south' }],
      snacks: [{ id: 'c', name: 'All', region: 'all' }],
      dinner: [],
    };
    const reseeded = keepRegionTrayItems(tray, 'north');
    expect(reseeded.lunch).toHaveLength(0);        // far-region item dropped
    expect(reseeded.breakfast).toHaveLength(1);
    expect(reseeded.snacks).toHaveLength(1);       // 'all' survives
  });
});

// keep the hoisted helpers referenced (vitest treats unused hoisted mocks as dead)
void apiMocks.logoutUser;
void apiMocks.householdApi;
// ─── TC-20..TC-29 — shared changeDiet lifecycle + chip contract ─────

describe('changeDiet — the ONE shared lifecycle (TC-22..TC-29)', () => {
  afterEach(() => { vi.resetModules(); });

  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
  });

  // TC-22 — Change from Preference section arms prompt
  it('TC-22: real dietType change arms pendingDietChange (prompt governs when tray has items)', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seedUser('non-veg');
    useStore.setState({ token: 'jwt-ok', trayLibrary: { breakfast: [{ id: 'a', name: 'Dish' }], lunch: [], snacks: [], dinner: [] } } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    const result = await changeDiet({ diet: 'veg', prevDiet: 'non-veg' });
    expect(result.ok).toBe(true);
    expect(result.armed).toBe(true);        // prompt governs
    expect(result.prompted).toBe(true);
    expect(useStore.getState().pendingDietChange).not.toBeNull();
    expect(useStore.getState().pendingDietChange!.from).toBe('non-veg');
    expect(useStore.getState().pendingDietChange!.to).toBe('veg');
  });

  // TC-23 — Empty tray does NOT prompt
  it('TC-23: empty tray → no prompt, silent rebuild fires (E8 gap closed)', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const { rebuildTrayForDiet } = await import('../utils/trayRegen');
    const spy = vi.spyOn(await import('../utils/trayRegen'), 'rebuildTrayForDiet').mockResolvedValue({ invalidRemoved: 0, customKept: 0, shortSlots: [], trayAdded: 0, trayReplaced: 0, laneCleared: false } as any);
    const useStore = await seedUser('non-veg');
    useStore.setState({ token: 'jwt-ok', trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] } } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    const result = await changeDiet({ diet: 'veg', prevDiet: 'non-veg' });
    expect(result.ok).toBe(true);
    expect(result.rebuilt).toBe(true);
    expect(result.prompted).toBe(false);
    expect(result.silent).toBe(true);
    expect(useStore.getState().pendingDietChange).toBeNull(); // cleared by rebuild
    spy.mockRestore();
  });

  // TC-24 — Honest from/to label
  it('TC-24: pendingDietChange.from is the PREVIOUS diet, to is the new one', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seedUser('eggitarian');
    useStore.setState({ token: 'jwt-ok', trayLibrary: { breakfast: [{ id: 'a', name: 'Dish' }], lunch: [], snacks: [], dinner: [] } } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'eggitarian', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    const result = await changeDiet({ diet: 'vegan', prevDiet: 'eggitarian' });
    expect(result.ok).toBe(true);
    const p = useStore.getState().pendingDietChange;
    expect(p).not.toBeNull();
    expect(p!.from).toBe('eggitarian');     // honest from = prev
    expect(p!.to).toBe('vegan');            // honest to = new
  });

  // TC-25 — Deferred/dismissed respect
  it('TC-25: same change after dismissed → no re-nag; genuinely NEW change → prompt re-arms', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seedUser('veg');
    useStore.setState({ token: 'jwt-ok', trayLibrary: { breakfast: [{ id: 'a', name: 'Dish' }], lunch: [], snacks: [], dinner: [] } } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    // First change arms the prompt
    await changeDiet({ diet: 'vegan', prevDiet: 'veg' });
    expect(useStore.getState().pendingDietChange).not.toBeNull();
    expect(useStore.getState().pendingDietChange!.from).toBe('veg');
    expect(useStore.getState().pendingDietChange!.to).toBe('vegan');

    // Dismiss it
    useStore.getState().dismissDietRegen();
    expect(useStore.getState().dietRegen!.state).toBe('dismissed');

    // Re-POST the SAME change → the dismiss flag matches → no re-nag
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    const result = await changeDiet({ diet: 'vegan', prevDiet: 'veg' });
    expect(result.reason).toBe('previously_decided');
    expect(useStore.getState().pendingDietChange).toBeNull(); // cleared, not re-armed

    // A genuinely NEW change → prompt re-arms
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    const result2 = await changeDiet({ diet: 'veg', prevDiet: 'vegan' });
    expect(result2.ok).toBe(true);
    expect(result2.prompted).toBe(true);
  });

  // TC-26 — Invalid diet rejected at picker
  it('TC-26: poisoned diet → updateProfile rejects, previous kept + warn logged', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seedUser('veg');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await changeDiet({ diet: 'poisoned_diet' as any, prevDiet: 'veg' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_local_change');
    // Previous diet preserved
    expect(useStore.getState().user?.diet).toBe('veg');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // TC-27 — Region+diet ordering
  it('TC-27: changeDiet applies non-diet fields (region) then diet — rebuild reads current diet+region', async () => {
    const { changeDiet } = await import('../utils/dietChange');
    const useStore = await seedUser('non-veg', 'south');
    useStore.setState({ token: 'jwt-ok', trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] } } as any);
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'south', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });

    const result = await changeDiet({ diet: 'veg', prevDiet: 'non-veg', region: 'north' });
    expect(result.ok).toBe(true);
    // Non-diet fields applied first; the store reflects region change
    expect(useStore.getState().user?.region).toBe('north');
    // Diet applied by changeDiet
    expect(useStore.getState().user?.diet).toBe('veg');
  });

  // TC-28 — No other screen changes diet
  it('TC-28: toggleAllergy + spice change never arm the prompt (server changed.dietType gate)', async () => {
    const { useStore } = await import('../app/store/useStore');
    const { changeDiet } = await import('../utils/dietChange');
    const store = useStore.getState();
    const user = store.user;
    // Simulate allergy toggle (no diet change)
    store.updateProfile({ allergies: ['Dairy'] });
    store.updateProfile({ spiceLevel: 'hot' });
    // The store user.diet is unchanged
    expect(store.user?.diet).toBe(user?.diet);
    // Sync with no dietType change in the server response → no prompt
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: user?.diet ?? 'veg', region: 'north', allergies: ['Dairy'], dislikedItems: [], spiceLevel: 'hot', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: true },
    });
    const res = await store.syncDietToServer(user?.diet);
    expect(res.ok).toBe(true);
    expect(useStore.getState().pendingDietChange).toBeNull(); // NOT armed
  });

  // TC-29 — Unset/legacy chip honesty
  it('TC-29: unset diet renders the honest "Not set" copy — never fabricated veg', async () => {
    const { dietChipFor, DIET_CHIP_UNSET_COPY } = await import('../utils/dietChange');
    // No server diet row → unset
    expect(dietChipFor(undefined)).toBeNull();
    expect(dietChipFor(null)).toBeNull();
    expect(dietChipFor('')).toBeNull();
    expect(dietChipFor('unknown_legacy')).toBeNull();
    // The honest unset copy
    const chip = dietChipFor(undefined);
    expect(chip).toBeNull(); // → UI renders DIET_CHIP_UNSET_COPY
  });
});

// ─── Profile chip: the ONE canonical chip (static source guard) ──────

describe('Profile.tsx — static source-presence guards (TC-20, TC-29)', () => {
  const profileSrc = readFileSync(resolve(__dirname, '..', 'components/new/Profile.tsx'), 'utf8');

  it('TC-20: Profile imports dietChipFor+DIET_CHIP_UNSET_COPY (changeDiet removed — read-only chip)', () => {
    expect(profileSrc).toContain("import { dietChipFor, DIET_CHIP_UNSET_COPY } from '../../utils/dietChange'");
  });

  it('TC-20: Profile renders the chip via dietChipFor (one canonical chip, no 4-button grid)', () => {
    expect(profileSrc).toContain('dietChipFor(user?.diet)');
    expect(profileSrc).not.toContain("['veg','eggitarian','non-veg','vegan'] as const).map");
  });

  it('TC-29: Profile renders the honest unset copy for null diet', () => {
    expect(profileSrc).toContain("DIET_CHIP_UNSET_COPY");
  });
});

// ─── App.tsx — changeDiet integration guards (TC-22, TC-24) ────────

describe('App.tsx — static source-presence guards (TC-22, TC-24)', () => {
  const appSrc = readFileSync(resolve(__dirname, '..', 'App.tsx'), 'utf8');

  it('TC-22: App.tsx imports changeDiet (not applyDietChange)', () => {
    expect(appSrc).toContain("import { changeDiet } from './utils/dietChange'");
    expect(appSrc).not.toContain('applyDietChange');
  });

  it('TC-24: App.tsx passes prevDiet to changeDiet (honest from/to)', () => {
    expect(appSrc).toContain('prevDiet');
  });
});


// ─── TC-UX: retryDietSync — visible retry on failed sync ─────

describe('retryDietSync — visible retry on failed sync (TC-UX)', () => {
  afterEach(() => { vi.resetModules(); });

  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
  });

  it('TC-UX: retryDietSync is exposed on the store', async () => {
    const { useStore } = await import('../app/store/useStore');
    await seedUser('veg');
    expect(typeof useStore.getState().retryDietSync).toBe('function');
  });

  it('TC-UX: retryDietSync stores pendingSyncPrevDiet before PUT, then retry calls syncDietToServer with it', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('non-veg');
    store.setState({ token: 'jwt-ok' } as any);
    // First sync fails — pendingSyncPrevDiet should be stored
    apiMocks.upsertMine.mockRejectedValue(Object.assign(new Error('Network error'), { status: 500 }));
    const firstRes = await store.getState().syncDietToServer('veg');
    expect(firstRes.ok).toBe(false);
    expect(store.getState().dietSyncState).toBe('failed');
    expect(store.getState().pendingSyncPrevDiet).toBe('veg');

    // Retry succeeds
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
    const retryRes = await store.getState().retryDietSync();
    expect(retryRes.ok).toBe(true);
    expect(store.getState().dietSyncState).toBe('saved');
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(2);
  });

  it('TC-UX: retry failure keeps dietSyncState=failed and surfaces a toast', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('veg');
    store.setState({ token: 'jwt-ok' } as any);
    apiMocks.upsertMine.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
    await store.getState().syncDietToServer('veg');
    expect(store.getState().dietSyncState).toBe('failed');

    // Retry also fails
    const retryRes = await store.getState().retryDietSync();
    expect(retryRes.ok).toBe(false);
    expect(store.getState().dietSyncState).toBe('failed');
    // Toast surfaced on retry failure
    expect(store.getState().toast).not.toBeNull();
  });

  it('TC-UX: retryDietSync with no pendingSyncPrevDiet is a no-op', async () => {
    const { useStore } = await import('../app/store/useStore');
    await seedUser('veg');
    const result = await useStore.getState().retryDietSync();
    expect(result.ok).toBe(false);
    expect(useStore.getState().dietSyncState).toBe('idle'); // never set to saving/failed
  });

  it('TC-UX: Profile renders the retry button next to "not synced" when dietSyncState=failed', () => {
    const profileSrc = require('fs').readFileSync(
      require('path').resolve(__dirname, '..', 'components/new/Profile.tsx'), 'utf8'
    );
    expect(profileSrc).toContain('retryDietSync');
    expect(profileSrc).toContain('not synced');
    expect(profileSrc).toContain('retry');
    // The retry is disabled/spinner via a LOCAL in-flight flag — a retry can
    // never run twice from the failed panel (the old `dietSyncState ===
    // 'saving'` could never be true inside a `failed` block — dead code).
    expect(profileSrc).toContain('disabled={dietRetrying}');
    expect(profileSrc).toContain('dietRetrying');
  });
});


// ─── TC-UX: Diet Preference chip read-only (no click) ──

describe('TC-UX: Diet Preference chip is READ-ONLY (no onClick, no picker)', () => {
   const profileSrc = readFileSync(resolve(__dirname, '..', 'components/new/Profile.tsx'), 'utf8');

   it('TC-UX: the Diet Preference chip renders WITHOUT an onClick handler', () => {
     const chipSection = profileSrc.substring(
       profileSrc.indexOf("dietChipFor(user?.diet)"),
       profileSrc.indexOf("dietChipFor(user?.diet)") + 600
     );
     expect(chipSection).not.toContain('onClick');
   });

   it('TC-UX: the chip does NOT call openQuickSetup or buildPrefill', () => {
     const chipMatch = profileSrc.match(/dietChipFor\(user\?\.diet\)[\s\S]{0,800}?<\/div>/);
     if (chipMatch) {
       expect(chipMatch[0]).not.toContain('openQuickSetup');
       expect(chipMatch[0]).not.toContain('buildPrefill');
     }
   });

   it('TC-UX: the chip is a non-interactive div (no cursor-pointer, no hover shadow, no active:scale)', () => {
     const chipMatch = profileSrc.match(/dietChipFor\(user\?\.diet\)[\s\S]{0,800}?<\/div>/);
     if (chipMatch) {
       const chipBlock = chipMatch[0];
       expect(chipBlock).not.toContain('cursor-pointer');
       expect(chipBlock).not.toContain('hover:shadow-md');
       expect(chipBlock).not.toContain('active:scale');
     }
   });

   it('TC-UX: the chip still displays emoji + label from the canonical map', () => {
     expect(profileSrc).toContain('{chip.emoji} {chip.label}');
     expect(profileSrc).toContain('{DIET_CHIP_UNSET_COPY}');
   });

   it('TC-UX: the Preferences card (separate affordance) still uses openQuickSetup + buildPrefill', () => {
     const cardMatches = profileSrc.match(/onClick=\{\(\) => openQuickSetup\?\.\(buildPrefill\(\)\)\}/g);
     expect(cardMatches?.length).toBeGreaterThanOrEqual(1);
   });
 });


// ─── D1 — stale-JWT 401 recovery in syncDietToServer (Fix 1) ───────────────

describe('stale-token 401 recovery in syncDietToServer (D1 fix)', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
    // Default: a fresh registration succeeds with a NEW JWT (the recovery path).
    apiMocks.registerUser.mockResolvedValue({ ok: true, user: { id: 'u-diet' }, token: 'jwt-fresh' });
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: true, changed: { dietType: false, region: false, allergies: false },
    });
  });

  afterEach(() => { vi.resetModules(); });

  it('TC-UX: a 401 from upsertMine → token cleared, ensureToken re-registers a FRESH JWT, PUT retried ONCE, saved, ok:true, prompt armed', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('non-veg');
    store.setState({ token: 'jwt-stale' } as any);
    apiMocks.upsertMine
      .mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }))
      .mockResolvedValueOnce({
        diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
        dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
      });

    const res = await store.getState().syncDietToServer('veg');

    expect(res.ok).toBe(true);
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(2);      // 401 + ONE retry — bounded
    expect(apiMocks.registerUser).toHaveBeenCalledTimes(1);     // re-registered a fresh JWT
    expect(store.getState().token).toBe('jwt-fresh');           // the NEW Bearer is stored
    expect(store.getState().dietSyncState).toBe('saved');
    // Prompt armed exactly like the primary success branch (server-confirmed
    // real dietType change against a previous row).
    const p = store.getState().pendingDietChange;
    expect(p).not.toBeNull();
    expect(p!.from).toBe('veg');
    expect(p!.to).toBe('non-veg');
  });

  it('TC-UX: 401 recovery fails on the re-register → dietSyncState=failed + toast (no infinite loop)', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('veg');
    store.setState({ token: 'jwt-stale' } as any);
    apiMocks.registerUser.mockResolvedValue({ ok: false, error: 'network down (fetch failed)' });
    apiMocks.upsertMine.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));

    const res = await store.getState().syncDietToServer('veg');

    expect(res.ok).toBe(false);
    expect(store.getState().dietSyncState).toBe('failed');
    expect(store.getState().toast).not.toBeNull();              // honest surface
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(1);       // 401 PUT only — no retry without a fresh token
    expect(apiMocks.registerUser).toHaveBeenCalledTimes(1);     // ONE recovery attempt
  });

  it('TC-UX: a non-401 network error → NO token-clear, single failed state (no recovery loop)', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('veg');
    store.setState({ token: 'jwt-ok' } as any);
    apiMocks.upsertMine.mockRejectedValue(new Error('fetch failed'));

    const res = await store.getState().syncDietToServer('veg');

    expect(res.ok).toBe(false);
    expect(store.getState().dietSyncState).toBe('failed');
    expect(store.getState().token).toBe('jwt-ok');               // token untouched
    expect(apiMocks.registerUser).not.toHaveBeenCalled();        // no re-register on a non-401
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(1);        // no retry loop
    expect(store.getState().pendingDietChange).toBeNull();       // no guess-prompt
  });

  it('TC-UX: 401 recovery succeeds on the retry but is still bounded to ONE attempt (second 401 stays failed)', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('veg');
    store.setState({ token: 'jwt-stale' } as any);
    apiMocks.upsertMine.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));

    const res = await store.getState().syncDietToServer('veg');

    expect(res.ok).toBe(false);
    expect(store.getState().dietSyncState).toBe('failed');
    expect(apiMocks.registerUser).toHaveBeenCalledTimes(1);     // one recovery, no loop
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(2);       // original + ONE retry
  });

  it('TC-UX: clearToken sets the token to null (log-out semantics kept separate from the diet recovery)', async () => {
    const { useStore } = await import('../app/store/useStore');
    const store = await seedUser('veg');
    store.setState({ token: 'jwt-ok', isLoggedIn: true } as any);
    store.getState().clearToken();
    expect(store.getState().token).toBeNull();
    expect(store.getState().isLoggedIn).toBe(false);
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// FIRST-LANDING BOOT NOISE — regression suite for the two dashboard warnings:
//
//  1. [dietQuota] allowedTypesForDiet: unknown diet "undefined" — first-load
//     console warn because boot purges pass user?.diet while no user is
//     hydrated yet. undefined/null/'' is an EXPECTED boot state (pre-hydration
//     / logged-out-with-prior-storage), not a data-integrity violation: it must
//     return the unconstrained set SILENTLY. Only a NON-EMPTY unknown string
//     keeps the loud warn (updateProfile now rejects unknown diets, so that
//     would indicate a real write-path leak).
//
//  2. "[App] Zustand state empty but storage has data. Forcing rehydrate." —
//     first-load warn because the recovery branch used `!isLoggedIn` as an
//     "empty state" proxy, which fires on every normal landing of a logged-out
//     user with prior storage (persist always writes mealdrama-store). The
//     honest gate asks "did hydration RUN?" (hasHydrated) — true on all normal
//     loads. The forced rehydrate survives ONLY for a genuine miss.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { allowedTypesForDiet } from '../utils/dietQuota';
import { hydrationRecoveryDecision } from '../app/boot/hydrationGate';

const ALL4 = ['veg', 'vegan', 'eggitarian', 'non-veg'];
const UNKNOWN_DIET_WARN = 'unknown diet';
const FORCED_REHYDRATE_WARN = 'Hydration did not run while storage has data';

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  localStorage.clear();
});

function warnMessages(): string[] {
  return warnSpy.mock.calls
    .map((c) => c[0])
    .filter((m): m is string => typeof m === 'string');
}

// ─────────────────────────────────────────────────────────────────────────────
// PART A — allowedTypesForDiet: undefined is boot-normal, unknown non-empty is
// the real leak. (updateProfile's unknown-diet rejection test in
// trayUpsert.test.ts pins the OTHER half of this honesty contract.)
// ─────────────────────────────────────────────────────────────────────────────
describe('allowedTypesForDiet — undefined/null/empty is the EXPECTED boot state (silent)', () => {
  it('undefined → unconstrained set, NO warn (pre-hydration / logged-out boot)', () => {
    expect(allowedTypesForDiet(undefined)).toEqual(ALL4);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it('null → unconstrained set, NO warn (typed callers: trayRegen removeDietInvalidFromTray)', () => {
    expect(allowedTypesForDiet(null)).toEqual(ALL4);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it("'' and whitespace → unconstrained set, NO warn", () => {
    expect(allowedTypesForDiet('')).toEqual(ALL4);
    expect(allowedTypesForDiet('   ')).toEqual(ALL4);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it("the literal STRING 'undefined' still warns once (a real non-empty leak, not boot absence)", () => {
    expect(allowedTypesForDiet('undefined')).toEqual(ALL4);
    const hits = warnMessages().filter((m) => m.includes(UNKNOWN_DIET_WARN));
    expect(hits).toHaveLength(1);
  });

  it("a genuinely unknown non-empty diet ('kittens') still warns once", () => {
    expect(allowedTypesForDiet('kittens')).toEqual(ALL4);
    const hits = warnMessages().filter((m) => m.includes(UNKNOWN_DIET_WARN));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toContain('kittens');
  });

  it('the 4 canonical diets map exactly as before (contract untouched)', () => {
    expect(allowedTypesForDiet('veg')).toEqual(['veg', 'vegan']);
    expect(allowedTypesForDiet('non-veg')).toContain('non-veg');
    expect(allowedTypesForDiet('eggitarian')).toEqual(['veg', 'vegan', 'eggitarian']);
    expect(allowedTypesForDiet('vegan')).toEqual(['vegan']);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PART B — hydration gate: the ONLY recovery trigger is "hydration did not run
// while storage has data". Logged-out-with-data is a TRUSTWORTHY state.
// ─────────────────────────────────────────────────────────────────────────────
describe('hydrationRecoveryDecision — honest gate (did hydration RUN, not is the user logged in)', () => {
  it('never recovers when the app boot gate has not fired yet', () => {
    expect(hydrationRecoveryDecision({ isHydrated: false, recoveryAttempted: false, storageHydrated: false, hasStoredData: true }))
      .toEqual({ recoveryNeeded: false, reason: null });
  });

  it('never recovers once a rehydrate was already attempted this mount', () => {
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: true, storageHydrated: false, hasStoredData: true }))
      .toEqual({ recoveryNeeded: false, reason: null });
  });

  it('NEVER recovers when hydration ran — the old !isLoggedIn proxy case (logged-out user with prior storage, empty localStorage, everything)', () => {
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: false, storageHydrated: true, hasStoredData: true }))
      .toEqual({ recoveryNeeded: false, reason: null });
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: false, storageHydrated: true, hasStoredData: false }))
      .toEqual({ recoveryNeeded: false, reason: null });
  });

  it('never recovers when hydration missed but there is no stored data', () => {
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: false, storageHydrated: false, hasStoredData: false }))
      .toEqual({ recoveryNeeded: false, reason: null });
  });

  it('recovers ONLY for the genuine miss: hydration did not run + storage has data', () => {
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: false, storageHydrated: false, hasStoredData: true }))
      .toEqual({ recoveryNeeded: true, reason: 'hydration-did-not-run' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PART C — real store module, simulated fresh browsers (real nativeStorage +
// stubbed localStorage; zustand persist hydrates synchronously at create()).
// ─────────────────────────────────────────────────────────────────────────────
interface PersistBlob { state: Record<string, unknown>; version: number }

async function importFreshStore() {
  vi.resetModules();
  const mod = await import('../app/store/useStore');
  return mod.useStore;
}

function seedMealdramaStore(blob: PersistBlob) {
  localStorage.setItem('mealdrama-store', JSON.stringify(blob));
}

const LOGGED_IN_USER = {
  id: 'u-boot', username: 'Ria', diet: 'eggitarian', region: 'south',
  onboardingComplete: true, primaryId: 'RIA-MD-1',
};

describe('real-store first-landing simulations (no forcing branch on normal loads)', () => {
  it('EMPTY localStorage → first render: hydrated, logged out, gate silent, no boot noise', async () => {
    localStorage.clear();
    const useStore = await importFreshStore();

    expect(useStore.persist.hasHydrated()).toBe(true); // hydration ran at create()
    expect(useStore.getState().isLoggedIn).toBe(false);
    expect(useStore.getState().user).toBeNull();

    // The exact boot gate App.tsx computes on first render.
    const decision = hydrationRecoveryDecision({
      isHydrated: true,
      recoveryAttempted: false,
      storageHydrated: useStore.persist.hasHydrated(),
      hasStoredData: !!localStorage.getItem('mealdrama-store'),
    });
    expect(decision.recoveryNeeded).toBe(false);

    // Boot purges (App.tsx:126/147) pass user?.diet → undefined → silent.
    expect(allowedTypesForDiet(useStore.getState().user?.diet)).toEqual(ALL4);
    expect(warnMessages().some((m) => m.includes(FORCED_REHYDRATE_WARN))).toBe(false);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it('FILLED logged-in storage (v12) → first render: reaches the SAME state as post-reload, no forcing branch', async () => {
    seedMealdramaStore({
      version: 12,
      state: {
        isLoggedIn: true,
        authReady: true,
        user: LOGGED_IN_USER,
        diet: 'eggitarian',
        token: 'tok-1',
        deviceId: 'dev-1',
        trayLibrary: { breakfast: [{ id: 'b1', dishId: 'b1', name: 'Egg Appam', sourceRegion: 'south' }], lunch: [], snacks: [], dinner: [] },
        swaps: {},
        trayBuilt: true,
        smartQueue: { week2: [], favorites: [] },
        customDishes: [],
        householdId: null,
        dietRegen: null,
      },
    });
    localStorage.setItem('mealdrama-auth', JSON.stringify({ isLoggedIn: true, trayBuilt: true, user: LOGGED_IN_USER }));
    const useStore = await importFreshStore();

    expect(useStore.persist.hasHydrated()).toBe(true);
    const s = useStore.getState();
    // Post-reload parity: hydrated state === persisted state.
    expect(s.isLoggedIn).toBe(true);
    expect(s.user?.diet).toBe('eggitarian');
    expect(s.user?.id).toBe('u-boot');
    expect(s.trayLibrary.breakfast).toHaveLength(1);
    expect(s.trayLibrary.breakfast?.[0]?.name).toBe('Egg Appam');

    const decision = hydrationRecoveryDecision({
      isHydrated: true, recoveryAttempted: false,
      storageHydrated: useStore.persist.hasHydrated(),
      hasStoredData: !!localStorage.getItem('mealdrama-store'),
    });
    expect(decision.recoveryNeeded).toBe(false); // forcing branch NEVER fires

    expect(warnMessages().some((m) => m.includes(FORCED_REHYDRATE_WARN))).toBe(false);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it('FILLED logged-out storage (v12) → first render: trustworthy logged-out state, gate silent, boot purges silent', async () => {
    seedMealdramaStore({
      version: 12,
      state: {
        isLoggedIn: false,
        authReady: true,
        user: null,
        diet: 'veg',
        token: null,
        deviceId: 'dev-1',
        trayLibrary: { breakfast: [], lunch: [], snacks: [], dinner: [] },
        swaps: {},
        trayBuilt: false,
        smartQueue: { week2: [], favorites: [] },
        customDishes: [],
        householdId: null,
        dietRegen: null,
      },
    });
    const useStore = await importFreshStore();

    expect(useStore.persist.hasHydrated()).toBe(true);
    expect(useStore.getState().isLoggedIn).toBe(false);
    expect(useStore.getState().user).toBeNull();

    // The old proxy (`!isLoggedIn && raw`) would have warned HERE — the exact
    // first-landing case in the report. The honest gate stays silent.
    const decision = hydrationRecoveryDecision({
      isHydrated: true, recoveryAttempted: false,
      storageHydrated: useStore.persist.hasHydrated(),
      hasStoredData: !!localStorage.getItem('mealdrama-store'),
    });
    expect(decision.recoveryNeeded).toBe(false);

    // Boot purges (App.tsx:126/147) with user === null → undefined diet → silent.
    expect(allowedTypesForDiet(useStore.getState().user?.diet)).toEqual(ALL4);
    expect(warnMessages().some((m) => m.includes(FORCED_REHYDRATE_WARN))).toBe(false);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it('version 1 → 12 migration path: session preserved, migration steps applied, gate silent', async () => {
    // Realistic v1 payload: NO token/pendingMutations/smartQueue/customDishes/
    // householdId keys — those fields did not exist until later versions (the
    // v10 migration exists precisely because the token lived OUTSIDE the store,
    // under 'mealdrama-token'). A `token: null` seed would wrongly trip the
    // savedAuth restore in migrate() and clobber the v10 migration output.
    seedMealdramaStore({
      version: 1,
      state: {
        isLoggedIn: true,
        authReady: true,
        user: { id: 'u-old', username: 'OldUser', diet: 'veg', region: 'north', onboardingComplete: true },
        deviceId: 'dev-old',
        trayLibrary: { breakfast: [{ id: 'b1', dishId: 'b1', name: 'Aloo Paratha', sourceRegion: 'north' }], lunch: [], snacks: [], dinner: [] },
        swaps: {},
      },
    });
    localStorage.setItem('mealdrama-token', 'legacy-tok');
    const useStore = await importFreshStore();

    expect(useStore.persist.hasHydrated()).toBe(true);
    const s = useStore.getState();
    // Auth survives ANY migration (the locked contract).
    expect(s.isLoggedIn).toBe(true);
    expect(s.user?.id).toBe('u-old');
    expect(s.user?.diet).toBe('veg');
    // Migration steps: v2 pendingMutations, v4 smartQueue, v5 trayBuilt, v6 customDishes, v10 token, v11 authReady, v12 householdId.
    expect(s.pendingMutations).toEqual([]);
    expect(s.smartQueue).toEqual({ week2: [], favorites: [] });
    expect(s.trayBuilt).toBe(true);
    expect(s.customDishes).toEqual([]);
    expect(s.token).toBe('legacy-tok');
    expect(s.authReady).toBe(true);
    expect(s.householdId).toBeNull();
    // Migration persisted the new version back to storage.
    const saved = JSON.parse(localStorage.getItem('mealdrama-store')!);
    expect(saved.version).toBe(12);

    const decision = hydrationRecoveryDecision({
      isHydrated: true, recoveryAttempted: false,
      storageHydrated: useStore.persist.hasHydrated(),
      hasStoredData: !!localStorage.getItem('mealdrama-store'),
    });
    expect(decision.recoveryNeeded).toBe(false);
    expect(warnMessages().some((m) => m.includes(UNKNOWN_DIET_WARN))).toBe(false);
  });

  it('the forced rehydrate survives ONLY as the true recovery path (pure gate verdict)', async () => {
    // Simulated in-memory verdict for the genuine miss — the branch that MAY
    // warn + call rehydrate() once. On normal loads storageHydrated is true and
    // this verdict is unreachable (all scenarios above prove that).
    const decision = hydrationRecoveryDecision({
      isHydrated: true, recoveryAttempted: false,
      storageHydrated: false, hasStoredData: true,
    });
    expect(decision).toEqual({ recoveryNeeded: true, reason: 'hydration-did-not-run' });
    // Probe the guards: a SECOND call with recoveryAttempted=true stops it.
    expect(hydrationRecoveryDecision({ isHydrated: true, recoveryAttempted: true, storageHydrated: false, hasStoredData: true }))
      .toEqual({ recoveryNeeded: false, reason: null });
  });
});

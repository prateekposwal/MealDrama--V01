// ─────────────────────────────────────────────────────────────────────────────
// DIET CHIP + SHARED LIFECYCLE — Profile chip contract (TC-20/TC-29), picker
// exclusivity (TC-21/TC-28), and the ONE canonical change lifecycle
// utils/dietChange.changeDiet (TC-22..TC-27).
//
// The Profile 4-button diet grid is DELETED. The chip is the only diet
// affordance on Profile; the ONLY diet selector in the app is FlashOnboarding
// step 2 (opened in edit mode); the ONLY diet-write lifecycle is
// changeDiet (called from App.tsx QuickSetup edit-path onComplete).
//
// HARNESS HONESTY: this repo's vitest runs environment 'node' (vitest.config.ts
// — no jsdom/happy-dom; @testing-library/react is installed but there is no
// DOM renderer). Component-RENDER assertions therefore cannot be executed
// here. The TCs that are UI-markup by nature (exactly-one-chip render,
// picker-exclusivity, FamilyDiets read-only) are covered at the closest
// honest levels:
//   * pure helper level  — dietChipFor/dietLabel/trayHasItems contracts
//   * store/helper level — the arming/silent-rebuild/dismiss semantics with
//     the REAL store + REAL trayRegen (mocked network surface only)
//   * STATIC source-presence guards — the shipped component TEXT is asserted
//     directly (no 4-button grid, one chip, unset copy, no write path in
//     FamilyDiets). These are static guards, NOT DOM renders — they pin the
//     exact markup the user receives.
// Never a fabricated green: a TC that needs a DOM renderer is listed in the
// summary with the honest level it was instead pinned at.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { allowedTypesForDiet, keepRegionTrayItems, CANONICAL_DIETS } from '../utils/dietQuota';

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

// ─── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();

function realChangeMock(dietType: string): void {
  apiMocks.upsertMine.mockResolvedValue({
    diet: { dietType, region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
    dietChanged: true, wasUnset: false,
    changed: { dietType: true, region: false, allergies: false },
  });
}

async function seedUser(opts: {
  diet: string;
  region?: string;
  tray?: Record<string, Array<{ id: string; name?: string; dishId?: string; icon?: string; sourceRegion?: string; region?: string }>>;
  token?: string | null;
  dietRegen?: { state: 'deferred' | 'dismissed'; at: string; from: string; to: string } | null;
  pendingDietChange?: { from: string; to: string; at: string } | null;
}) {
  const { useStore } = await import('../app/store/useStore');
  useStore.setState({
    isLoggedIn: true,
    user: { id: 'u-chip', name: 'Chip Tester', diet: opts.diet, region: opts.region ?? 'north', spiceLevel: 'medium', allergies: [], dislikedItems: [] } as any,
    token: opts.token === undefined ? 'jwt-ok' : opts.token,
    dietSyncState: 'idle',
    pendingDietChange: opts.pendingDietChange ?? null,
    dietRegen: opts.dietRegen ?? null,
    toast: null,
    trayLibrary: {
      breakfast: opts.tray?.breakfast ?? [],
      lunch: opts.tray?.lunch ?? [],
      snacks: opts.tray?.snacks ?? [],
      dinner: opts.tray?.dinner ?? [],
    },
    householdId: null,
  } as any);
  const { useLoopStore } = await import('../plan/store/useLoopStore');
  useLoopStore.setState({ mealLoop: { config: null, sourceDishIds: [], pool_version: 1, rotationQueue: [], rotationPointer: 0, next_index: 0, assignments: [], overrides: new Map(), analytics: { cyclesCompleted: 0, mealsAutoFilled: 0, dishesSkipped: 0 }, refreshing: false, undoStack: [] } });
  const { useHouseholdKitchenStore } = await import('../plan/store/householdKitchenStore');
  useHouseholdKitchenStore.setState({ households: {}, lanes: {} } as any);
  return useStore;
}

async function loadDietChange() {
  return (await import('../utils/dietChange')) as typeof import('../utils/dietChange');
}

async function spyRebuild() {
  const trayRegen = await import('../utils/trayRegen');
  return vi.spyOn(trayRegen, 'rebuildTrayForDiet');
}

const projectRoot = resolve(__dirname, '..');
const readSource = (rel: string): string => readFileSync(resolve(projectRoot, rel), 'utf8');

// ─── TC-20 / TC-29 — chip contract (pure + static guards) ───────────────────

describe('chip contract — pure (TC-20, TC-29): ONE canonical value/emoji/label, honest unset', () => {
  it('TC-20: every canonical diet resolves to its canonical value + emoji + label from the ONE map', async () => {
    const { dietChipFor, DIET_EMOJI, DIET_LABEL } = await loadDietChange();
    // the chip map is keyed by the SAME canonical set as the picker/guard
    expect(Object.keys(DIET_EMOJI).sort()).toEqual([...CANONICAL_DIETS].sort());
    expect(Object.keys(DIET_LABEL).sort()).toEqual([...CANONICAL_DIETS].sort());
    for (const d of CANONICAL_DIETS) {
      const chip = dietChipFor(d);
      expect(chip).not.toBeNull();
      expect(chip!.canonical).toBe(d);                 // value === canonical user.diet
      expect(chip!.emoji).toBe(DIET_EMOJI[d]);         // emoji from the canonical map
      expect(chip!.label).toBe(DIET_LABEL[d]);         // label from the canonical map
    }
  });

  it('TC-20/TC-29: unset/empty/unknown values NEVER fabricate a highlight — null (honest "Not set" render)', async () => {
    const { dietChipFor } = await loadDietChange();
    for (const bad of [undefined, null, '', '   ', 'jain', 'keto', 'between-meat', 'VEGGIE']) {
      expect(dietChipFor(bad), `dietChipFor(${JSON.stringify(bad)}) must be null`).toBeNull();
    }
    // the honest copy the chip renders instead of any invented diet
    const { DIET_CHIP_UNSET_COPY } = await loadDietChange();
    expect(DIET_CHIP_UNSET_COPY).toBe('Not set — choose diet');
  });

  it('TC-29: a legacy value lowercased + trimmed resolves; a fabricated value never does', async () => {
    const { dietChipFor } = await loadDietChange();
    expect(dietChipFor('  Non-Veg ' )!.canonical).toBe('non-veg'); // stored display-ish legacy → canonical
    expect(dietChipFor('vegan')!.label).toBe('Vegan');
  });

  it('TC-20: the trayHasItems predicate is the exact branch signal the helper uses', async () => {
    const { trayHasItems } = await loadDietChange();
    expect(trayHasItems({ breakfast: [], lunch: [], snacks: [], dinner: [] })).toBe(false);
    expect(trayHasItems({ breakfast: [{ id: 'x', dishId: 'x', name: 'X' }], lunch: [], snacks: [], dinner: [] })).toBe(true);
    expect(trayHasItems({ breakfast: [], lunch: [{ id: 'y', dishId: 'y', name: 'Y' }], snacks: [], dinner: [] })).toBe(true);
  });
});

describe('chip + picker exclusivity — STATIC source guards (TC-20/TC-21/TC-28)', () => {
  // No DOM renderer exists in this repo (vitest environment: 'node'), so the
  // markup-level TCs are pinned by asserting the SHIPPED component text. This
  // is a static guard, not a DOM render — stated honestly per the harness note.

  it('TC-20: Profile ships EXACTLY one diet chip — the 4-button grid markup is GONE', () => {
    const src = readSource('components/new/Profile.tsx');
    expect(src).not.toContain("['veg', 'eggitarian', 'non-veg', 'vegan']");      // no 4-diet grid map
    expect(src).toContain('dietChipFor(user?.diet)');                            // the ONE chip value source
    const chipCount = (src.match(/dietChipFor\(user\?\.diet\)/g) || []).length;
    expect(chipCount).toBe(1);                                                   // exactly one chip
  });

  it('TC-29: Profile renders the honest unset copy — never defaults the chip to veg', () => {
    const src = readSource('components/new/Profile.tsx');
    expect(src).toContain('{DIET_CHIP_UNSET_COPY}');                             // unset render path wired
    // the literal copy exists in its ONE source (utils/dietChange.ts) — never
    // duplicated inside the component (pattern-first: one canonical string)
    const helperSrc = readSource('utils/dietChange.ts');
    expect(helperSrc).toContain("DIET_CHIP_UNSET_COPY = 'Not set — choose diet'");
  });

  it('TC-21: the ONLY diet picker (FlashOnboarding step 2) offers exactly the 4 canonical diets and never writes', () => {
    const src = readSource('components/new/FlashOnboarding.tsx');
    for (const d of ['Veg', 'Eggitarian', 'Non-Veg', 'Vegan']) {
      expect(src).toContain(`label: '${d}'`);                                    // picker shows all 4 canonical
    }
    // it is a COLLECTOR — the write happens back in App.tsx onComplete
    expect(src).not.toContain('updateProfile');
    expect(src).not.toContain('syncDietToServer');
  });

  it('TC-21/TC-28: no other component can trigger a diet write — only Profile touches syncDietToServer (allergy/spice-only paths)', () => {
    const { readdirSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) out.push(...walk(p));
        else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) out.push(p);
      }
      return out;
    };
    const callers = walk(resolve(projectRoot, 'components'))
      .map(p => ({ rel: p.replace(projectRoot + '/', ''), src: readFileSync(p, 'utf8') }))
      .filter(({ src }) => src.includes('syncDietToServer('))
      .map(({ rel }) => rel);
    expect(callers).toEqual(['components/new/Profile.tsx']);
  });

  it('TC-28: FamilyDiets is read-only — no write path, no dietDialog/select markup', () => {
    const src = readSource('components/household/FamilyDiets.tsx');
    expect(src).not.toContain('updateProfile');
    expect(src).not.toContain('syncDietToServer');
    expect(src).not.toContain('upsertMine');
    expect(src).not.toContain('dietDialog');
    expect(src).not.toContain('<select');
    expect(src).toContain('listHouseholdDiets');    // the read-only fetch it legitimately uses
  });

  it('TC-24 (App parity): QuickSetup edit-path captures prev BEFORE updateProfile, closes the wizard FIRST, and runs changeDiet in the background (D2)', () => {
    const src = readSource('App.tsx');
    const prevCapture = "const prevDiet = (user?.diet ?? '').toLowerCase();";
    const helper = 'changeDiet({';
    const iPrev = src.indexOf(prevCapture);
    const iHelp = src.indexOf(helper);
    expect(iPrev).toBeGreaterThan(-1);             // prev captured…
    expect(iHelp).toBeGreaterThan(-1);             // …and the helper is called
    // The capture and the helper call must be in the SAME region (the QuickSetup
    // EDIT-path onComplete), and the prevDiet capture must sit BEFORE the
    // changeDiet call — i.e. prev is captured from the PRE-edit user,
    // passed to the POST-write helper. D2: the wizard closes BEFORE the
    // network — "Start Planning" never blocks on the server round-trip, so
    // the region between the capture and the call must NOT await the helper.
    const region = src.slice(iPrev, iHelp + helper.length);
    expect(region).toContain('setAuthReady(true)');
    expect(region).toContain('closeQuickSetup()');
    expect(region).not.toContain('await');        // D2 — no network block before close
    expect(region).toContain('void changeDiet({');
    expect(region.indexOf('changeDiet({')).toBeGreaterThan(-1);
  });

  it('D2 (App parity): the FIRST-TIME onboarding path STILL awaits changeDiet (auto-seed reads the persisted profile)', () => {
    const src = readSource('App.tsx');
    // First-time path anchor: setTrayBuilt(true) precedes the awaited call;
    // the auto-seed tray block below reads useStore.getState() — it must see
    // the persisted profile, so this path must NOT be backgrounded.
    const iSeed = src.indexOf('setTrayBuilt(true);');
    expect(iSeed).toBeGreaterThan(-1);
    const firstTime = src.slice(iSeed, iSeed + 700);
    expect(firstTime).toContain('await changeDiet({');
    // Exactly two call sites: void (edit path) + await (first-time path).
    expect(src.match(/changeDiet\(\{/g)?.length ?? 0).toBe(2);
  });
});

// ─── TC-22 / TC-24 — prompt arming through the shared helper ────────────────

describe('shared lifecycle — prompt arming (TC-22, TC-24): real change, server row exists', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-22: Preference/QuickSetup path (the ONE helper now) arms the prompt on a server-confirmed real change', async () => {
    await seedUser({ diet: 'non-veg', tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] } });
    realChangeMock('non-veg');                       // server row exists → dietChanged true
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();

    const res = await changeDiet({ diet: 'non-veg', prevDiet: 'veg' });        // prev = the old row the user left
    expect(res.ok).toBe(true);
    expect(res.armed).toBe(true);
    expect(res.reason).toBe('prompt_governs');
    expect(apiMocks.upsertMine).toHaveBeenCalledTimes(1);
    expect(apiMocks.upsertMine).toHaveBeenCalledWith(
      expect.objectContaining({ dietType: 'non-veg' }),
    );
    const { useStore } = await import('../app/store/useStore');
    expect(useStore.getState().pendingDietChange).not.toBeNull();    // armed for DietChangePromptModal
    expect(rebuild).not.toHaveBeenCalled();                          // prompt governs — nothing more
    expect(useStore.getState().toast).toBeNull();                    // no toast on the governed branch
  });

  it('TC-24: pendingDietChange.from = the REAL old value ≠ new (the bug the inline grid hid)', async () => {
    await seedUser({ diet: 'non-veg', tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] } });
    realChangeMock('non-veg');
    const { changeDiet } = await loadDietChange();

    await changeDiet({ diet: 'non-veg', prevDiet: 'veg' });                    // App passes the captured prev — NOT the new diet
    const { useStore } = await import('../app/store/useStore');
    const p = useStore.getState().pendingDietChange!;
    expect(p.from).toBe('veg');                      // the row the user LEFT
    expect(p.to).toBe('non-veg');
    expect(p.from).not.toBe(p.to);                   // honest "changed from A to B"
  });

  it('TC-24 contrast: without the prev capture the prompt would lie ("is now X") — App passes prev, so this never ships', async () => {
    await seedUser({ diet: 'non-veg', tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] } });
    realChangeMock('non-veg');
    const { changeDiet } = await loadDietChange();
    await changeDiet({ diet: 'non-veg', prevDiet: '' });                         // no prev (the OLD App.tsx call)
    const { useStore } = await import('../app/store/useStore');
    const p = useStore.getState().pendingDietChange!;
    expect(p.from).toBe('non-veg');                  // falls back to the NEW diet …
    expect(p.from).toBe(p.to);                       // … → modal says "is now X", not "changed from A to B"
  });
});

// ─── TC-23 — empty-tray silent rebuild ─────────────────────────────────────

describe('shared lifecycle — empty tray (TC-23): silent single rebuild, no prompt, success toast', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-23: QuickSetup completion with EMPTY tray → pending clears, rebuild runs ONCE, success toast (locks E8)', async () => {
    await seedUser({ diet: 'veg', tray: {} });       // empty tray
    realChangeMock('non-veg');
    const { changeDiet, DIET_LABEL } = await loadDietChange();
    const rebuild = await spyRebuild();
    // the caller ALREADY wrote the new diet through the canonical write path
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().updateProfile({ diet: 'non-veg' as any });

    const res = await changeDiet({ diet: 'non-veg', prevDiet: 'veg' });
    expect(res.ok).toBe(true);
    expect(res.rebuilt).toBe(true);
    expect(res.reason).toBe('silent_rebuild');
    expect(rebuild).toHaveBeenCalledTimes(1);        // single-flight, exactly one execution
    expect(useStore.getState().pendingDietChange).toBeNull();   // no prompt — final state
    expect(useStore.getState().toast?.message).toBe(`Diet changed to ${DIET_LABEL['non-veg']} — meals updated`);
    // the REAL rebuild ran — the tray is no longer empty
    expect(Object.values(useStore.getState().trayLibrary).some(a => a.length > 0)).toBe(true);
  });

  it('TC-23 guard (Λ6.5): a diet that did NOT change locally never gets a fabricated "Diet changed" toast or rebuild', async () => {
    await seedUser({ diet: 'non-veg', tray: {} });   // same diet, empty tray (region-only QuickSetup edit)
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'non-veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();

    const res = await changeDiet({ diet: 'non-veg', prevDiet: 'non-veg' });    // prev === current
    expect(res.reason).toBe('no_local_change');
    expect(rebuild).not.toHaveBeenCalled();
    const { useStore } = await import('../app/store/useStore');
    expect(useStore.getState().toast).toBeNull();
  });
});

// ─── TC-25 — deferred/dismissed flags through the new path ─────────────────

describe('shared lifecycle — deferred/dismissed (TC-25): same change never re-nags, new change re-arms', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-25: same change AFTER dismissed → no prompt, no rebuild, no toast — the earlier decision stands', async () => {
    await seedUser({
      diet: 'non-veg',
      tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] },
      dietRegen: { state: 'dismissed', at: NOW, from: 'veg', to: 'non-veg' },
    });
    realChangeMock('non-veg');
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();

    const res = await changeDiet({ diet: 'non-veg', prevDiet: 'veg' });        // the SAME change again
    expect(res.reason).toBe('previously_decided');
    expect(res.rebuilt).toBe(false);
    const { useStore } = await import('../app/store/useStore');
    expect(useStore.getState().pendingDietChange).toBeNull();   // no re-nag
    expect(useStore.getState().toast).toBeNull();
    expect(useStore.getState().dietRegen!.state).toBe('dismissed'); // flag intact
    expect(rebuild).not.toHaveBeenCalled();
  });

  it('TC-25: a GENUINELY new change re-arms even after a previous dismiss', async () => {
    await seedUser({
      diet: 'eggitarian',
      tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] },
      dietRegen: { state: 'dismissed', at: NOW, from: 'veg', to: 'non-veg' },
    });
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'eggitarian', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: false, allergies: false },
    });
    const { changeDiet } = await loadDietChange();

    const res = await changeDiet({ diet: 'eggitarian', prevDiet: 'non-veg' });    // veg→non-veg was dismissed; THIS is non-veg→eggitarian
    expect(res.armed).toBe(true);
    const { useStore } = await import('../app/store/useStore');
    const p = useStore.getState().pendingDietChange!;
    expect(p.from).toBe('non-veg');
    expect(p.to).toBe('eggitarian');
  });

  it('TC-25: same change AFTER deferred → suppressed; the deferred flag is consumed exactly once', async () => {
    await seedUser({
      diet: 'non-veg',
      tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] },
      dietRegen: { state: 'deferred', at: NOW, from: 'veg', to: 'non-veg' },
    });
    realChangeMock('non-veg');
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();
    const res = await changeDiet({ diet: 'non-veg', prevDiet: 'veg' });        // same change again — no double prompt
    expect(res.reason).toBe('previously_decided');

    // the deferred consumer rebuilds exactly once and clears the flag
    const { useStore } = await import('../app/store/useStore');
    await useStore.getState().consumeDeferredDietRegen();
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(useStore.getState().dietRegen).toBeNull();
    // a second consume is a no-op — consumed once
    await useStore.getState().consumeDeferredDietRegen();
    expect(rebuild).toHaveBeenCalledTimes(1);
  });
});

// ─── TC-26 — invalid diet through the write path ───────────────────────────

describe('shared lifecycle — invalid diet (TC-26): rejected at the updateProfile guard', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-26: an unknown diet through the chip/helper path is rejected, previous kept, warn logged', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await seedUser({ diet: 'veg', tray: {} });
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
    const { useStore } = await import('../app/store/useStore');

    // the ONLY write path (updateProfile) rejects the invalid diet…
    useStore.getState().updateProfile({ diet: 'between-meat' as any });
    expect(useStore.getState().user!.diet).toBe('veg');          // previous kept
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rejected unknown diet'));

    // …so the helper sees prev === current — no rebuild, no prompt, no toast
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();
    const res = await changeDiet({ diet: 'veg', prevDiet: 'veg' });
    expect(res.reason).toBe('no_local_change');
    expect(rebuild).not.toHaveBeenCalled();
    expect(useStore.getState().pendingDietChange).toBeNull();
    expect(useStore.getState().toast).toBeNull();
    warn.mockRestore();
  });
});

// ─── TC-27 — region + diet simultaneous change ordering ────────────────────

describe('region + diet changed together (TC-27): reseed drops far leftovers FIRST, rebuild reads CURRENT diet+region', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-27a: the App region reseed drops far-region leftovers before any diet prompt', async () => {
    const tray = {
      breakfast: [{ id: 'a', name: 'Local', region: 'north' }],
      lunch: [{ id: 'b', name: 'Far South', region: 'south' }],
      snacks: [{ id: 'c', name: 'All', region: 'all' }],
      dinner: [],
    };
    const reseeded = keepRegionTrayItems(tray, 'north');
    expect(reseeded.lunch).toHaveLength(0);          // far-region item dropped
    expect(reseeded.breakfast).toHaveLength(1);
    expect(reseeded.snacks).toHaveLength(1);         // 'all' survives
  });

  it('TC-27b: FULL ordering — region+diet edited together: reseed first, then shared lifecycle with honest from/to', async () => {
    await seedUser({
      diet: 'veg',
      region: 'north',
      tray: {
        breakfast: [{ id: 'paratha', dishId: 'aloo-paratha', name: 'Aloo Paratha', icon: '🫓', sourceRegion: 'north' }],
        lunch: [{ id: 'fish-curry', dishId: 'fish-curry', name: 'Fish Curry', icon: '🐟', sourceRegion: 'south' }],
        snacks: [{ id: 'bhel', dishId: 'bhel-puri', name: 'Bhel Puri', icon: '🥗', sourceRegion: 'all' }],
        dinner: [],
      },
    });
    const { useStore } = await import('../app/store/useStore');

    // App.tsx QuickSetup onComplete: updateProfile FIRST (region+diet together)…
    useStore.getState().updateProfile({ region: 'south', diet: 'vegan' as any });

    // …then the REGION-CHANGE RESEED effect (App.tsx:466-480) drops far leftovers…
    const reseeded = keepRegionTrayItems(useStore.getState().trayLibrary as any, 'south');
    useStore.setState({ trayLibrary: reseeded as any });
    expect(useStore.getState().trayLibrary.lunch.some((m: any) => m.name === 'Fish Curry')).toBe(true);  // south kept
    expect(useStore.getState().trayLibrary.breakfast.some((m: any) => m.name === 'Aloo Paratha')).toBe(false); // north dropped

    // …then the shared lifecycle syncs with the REAL prev diet + region
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'vegan', region: 'south', allergies: [], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: true, region: true, allergies: false },
    });
    const { changeDiet } = await loadDietChange();
    const res = await changeDiet({ diet: 'vegan', prevDiet: 'veg' });
    expect(res.armed).toBe(true);
    const p = useStore.getState().pendingDietChange!;
    expect(p.from).toBe('veg');                      // honest from/to across the combined edit
    expect(p.to).toBe('vegan');
    // the sync payload carried the CURRENT region (post-reseed), not a stale one
    expect(apiMocks.upsertMine).toHaveBeenCalledWith(expect.objectContaining({ region: 'south', dietType: 'vegan' }));
  });

  it('TC-27c: an empty tray after the combined edit → silent rebuild reads the CURRENT diet (vegan) + region', async () => {
    await seedUser({ diet: 'veg', region: 'north', tray: {} });
    realChangeMock('vegan');
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().updateProfile({ region: 'north', diet: 'vegan' as any });  // diet only, region stable
    const { changeDiet } = await loadDietChange();
    const rebuild = await spyRebuild();

    const res = await changeDiet({ diet: 'vegan', prevDiet: 'veg' });
    expect(res.rebuilt).toBe(true);
    expect(rebuild).toHaveBeenCalledTimes(1);

    // every RESOLVABLE tray item after the rebuild is vegan-allowed (the rebuild
    // read user.diet = vegan, not the stale 'veg')
    const { resolveTrayDish } = await import('../utils/trayRegen');
    const { DISH_LIBRARY } = await import('../meal/constants/dishLibrary');
    const allowed = new Set(allowedTypesForDiet('vegan'));
    let resolvable = 0;
    for (const slot of ['breakfast', 'lunch', 'snacks', 'dinner'] as const) {
      for (const m of useStore.getState().trayLibrary[slot] ?? []) {
        const d = resolveTrayDish(DISH_LIBRARY, m);
        if (!d) continue;
        resolvable++;
        expect(allowed.has((d.diet || d.type || '').toLowerCase())).toBe(true);
      }
    }
    expect(resolvable).toBeGreaterThan(0);           // the rebuild actually filled the tray
    expect(Object.values(useStore.getState().trayLibrary).some(a => a.length > 0)).toBe(true);
  });
});

// ─── TC-28 — allergies/spice sync never arms the prompt ────────────────────

describe('other profile edits (TC-28): allergies + spice sync but NEVER arm the prompt — server gates on changed.dietType', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(() => { vi.resetModules(); });
  beforeEach(() => {
    apiMocks.registerUser.mockReset();
    apiMocks.upsertMine.mockReset();
  });

  it('TC-28: an allergy change (dietType unchanged) syncs the row but never arms pendingDietChange', async () => {
    await seedUser({ diet: 'veg', tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] } });
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: ['Dairy'], dislikedItems: [], spiceLevel: 'medium', healthGoal: '' },
      dietChanged: true, wasUnset: false, changed: { dietType: false, region: false, allergies: true },
    });
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().updateProfile({ allergies: ['Dairy'] });
    const res = await useStore.getState().syncDietToServer();   // the Profile allergy-toggle path
    expect(res.ok).toBe(true);
    expect(res.changed.allergies).toBe(true);
    expect(useStore.getState().pendingDietChange).toBeNull();   // dietType did not change → no prompt
  });

  it('TC-28: a spice-only sync (nothing dish-affecting) never arms the prompt either', async () => {
    await seedUser({ diet: 'veg', tray: { lunch: [{ id: 'a', name: 'Aloo', sourceRegion: 'north' }] } });
    apiMocks.upsertMine.mockResolvedValue({
      diet: { dietType: 'veg', region: 'north', allergies: [], dislikedItems: [], spiceLevel: 'hot', healthGoal: '' },
      dietChanged: false, wasUnset: false, changed: { dietType: false, region: false, allergies: false },
    });
    const { useStore } = await import('../app/store/useStore');
    useStore.getState().updateProfile({ spiceLevel: 'hot' as any });
    const res = await useStore.getState().syncDietToServer();   // the Profile spice-pill path
    expect(res.ok).toBe(true);
    expect(useStore.getState().pendingDietChange).toBeNull();
  });
});

// keep the hoisted helpers referenced (vitest treats unused hoisted mocks as dead)
void apiMocks.logoutUser;
void apiMocks.householdApi;
void apiMocks.dietGetMine;
void apiMocks.getMe;

// ─── TC-UX: initialStep deep-link for quick diet change ────────────────

describe('TC-UX: FlashOnboarding initialStep prop — diet-only deep-link', () => {
  it('TC-UX-1: default initialStep is 0 (Region) when not specified', () => {
    const src = readSource('components/new/FlashOnboarding.tsx');
    expect(src).toContain('useState(initialStep ?? 0)');
  });

  it('TC-UX-2: Profile buildPrefill includes initialStep: 1 (skip to Diet)', () => {
    const src = readSource('components/new/Profile.tsx');
    expect(src).toContain('initialStep: 1');
  });

  it('TC-UX-3: App.tsx passes initialStep from prefill to FlashOnboarding', () => {
    const src = readSource('App.tsx');
    expect(src).toContain('initialStep={initialStep}');
    expect(src).toContain('const initialStep = ');
  });

  it('TC-UX-4: FlashOnboardingProps interface includes initialStep?: number', () => {
    const src = readSource('components/new/FlashOnboarding.tsx');
    expect(src).toContain('initialStep?: number');
  });

  it('TC-UX-5: initialStep is destructured from props in FlashOnboarding', () => {
    const src = readSource('components/new/FlashOnboarding.tsx');
    expect(src).toContain('({ onComplete, isEditMode, initialStep, prefill })');
  });
});

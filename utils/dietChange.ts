// ─────────────────────────────────────────────────────────────────────────────
// DIET CHANGE — ONE shared lifecycle for every diet write + the ONE chip
// render contract on Profile.
//
// WHY this module exists (pattern-first, Λ6.5):
//   1. The old Profile grid inlined ANOTHER copy of the change lifecycle
//      (updateProfile → syncDietToServer(prevDiet) → trayHasItems branch),
//      so the QuickSetup edit path and the Profile grid behaved DIFFERENTLY:
//      QuickSetup NEVER passed prevDietType (the prompt said "is now X"
//      instead of "changed from A to B") and NEVER got the empty-tray
//      silent rebuild branch. One canonical helper = one behavior.
//   2. The chip contract: Profile renders EXACTLY ONE diet chip whose
//      value/emoji/label come from the canonical map (CANONICAL_DIETS). An
//      unset/legacy user.diet renders the honest "Not set" copy — never a
//      fabricated 'veg' highlight (E15).
//
// Contract of changeDiet({diet, prevDiet, ...extras}):
//   1. updateProfile applies non-diet extras first, then diet — the single
//      canonical write path that validates+lowercases (store.updateProfile).
//   2. syncDietToServer(prevDiet) runs ALWAYS (ensureToken-first; retries
//      until synced; arms pendingDietChange ONLY on a server-confirmed real
//      dietType change: dietChanged && !wasUnset && changed.dietType).
//   3. trayHasItems === true  → prompt governs (nothing more; sync armed it).
//      A previously decided SAME change (deferred/dismissed flag matching
//      from/to) never re-nags (TC-25).
//   4. trayHasItems === false → silent single-flight rebuildTrayForDiet() +
//      success toast, NO prompt.
//   5. Honest guard (Λ6.5): when the diet did NOT change locally (prev ===
//      current — e.g. a region-only QuickSetup edit), the empty-tray branch
//      does NOT run: a "Diet changed to X" toast would be a fabrication.
// ─────────────────────────────────────────────────────────────────────────────
import { useStore } from '../app/store/useStore';
import type { TrayLibrary } from '../app/store/useStore';
import { CANONICAL_DIETS, isCanonicalDiet } from './dietQuota';
import type { CanonicalDiet } from './dietQuota';

// ─── Chip render contract (Profile Diet Preference section) ─────────────────
/** Emoji per canonical diet — the ONE map the Profile chip renders from. */
export const DIET_EMOJI: Record<CanonicalDiet, string> = {
  veg: '🥬',
  eggitarian: '🥚',
  'non-veg': '🍗',
  vegan: '🌱',
};

/** Display label per canonical diet — shown AFTER the emoji on the chip. */
export const DIET_LABEL: Record<CanonicalDiet, string> = {
  veg: 'Veg',
  eggitarian: 'Eggitarian',
  'non-veg': 'Non-Veg',
  vegan: 'Vegan',
};

/** Honest unset copy — never a fabricated 'veg' highlight (E15). */
export const DIET_CHIP_UNSET_COPY = 'Not set — choose diet';

export interface DietChip {
  /** The canonical value (=== user.diet for a real stored diet). */
  canonical: CanonicalDiet;
  emoji: string;
  label: string;
}

/**
 * The chip's value contract. For a STORED canonical diet this is the real
 * value + emoji + label from the canonical map. For unset/empty/unknown
 * (legacy) values it returns null → the UI renders the honest unset copy.
 * NEVER fabricates 'veg' as the selected highlight.
 */
export function dietChipFor(diet?: string | null): DietChip | null {
  const d = (diet ?? '').toLowerCase().trim();
  if (!d || !isCanonicalDiet(d)) return null;
  return { canonical: d, emoji: DIET_EMOJI[d], label: DIET_LABEL[d] };
}

/** Display label for a toast/report — canonical label when known, else the raw value. */
export function dietLabel(diet?: string | null): string {
  const chip = dietChipFor(diet);
  return chip ? chip.label : (diet ?? '').trim() || '';
}

/** True when ANY tray slot holds at least one meal (the prompt-governs branch). */
export function trayHasItems(tray: TrayLibrary): boolean {
  return Object.values(tray).some(arr => arr.length > 0);
}

// ─── Shared change lifecycle ────────────────────────────────────────────────
export interface ChangeDietResult {
  ok: boolean;
  /** Server confirmed the PUT (diet row exists / was upserted). */
  synced: boolean;
  /** syncDietToServer armed pendingDietChange for a REAL server-confirmed change. */
  armed: boolean;
  trayHasItems: boolean;
  /** Empty-tray silent rebuild executed (single-flight trayRegen). */
  rebuilt: boolean;
  /** Whether the prompt is now governing (pendingDietChange is set). */
  prompted: boolean;
  /** Whether the silent-rebuild toast was fired (no prompt). */
  silent: boolean;
  reason:
    | 'no_user'
    | 'no_local_change'
    | 'sync_failed'
    | 'previously_decided'
    | 'prompt_governs'
    | 'silent_rebuild';
}

/**
 * The ONE shared diet-change lifecycle.
 *
 * Applies non-diet profile fields first, then the diet (which validates+
 * lowercases via updateProfile), then syncs to the server with the
 * PREVIOUS diet type, then governs the prompt-or-rebuild outcome.
 *
 * @param diet — the new canonical diet (already lowercased by the caller
 *               or validated by updateProfile).
 * @param prevDiet — the diet type BEFORE this change (passed by caller;
 *                   used for syncDietToServer prevDietType and the
 *                   pendingDietChange.from honesty).
 * @param extras — optional non-diet fields applied first (region,
 *                 spiceLevel, healthGoals, plannedSlots, cookContact,
 *                 onboardingComplete).
 */
export async function changeDiet(
  params: {
    diet: string;
    prevDiet?: string;
    region?: string;
    spiceLevel?: 'mild' | 'medium' | 'hot';
    healthGoals?: string[];
    plannedSlots?: string[];
    cookContact?: string;
    onboardingComplete?: boolean;
    /** Taste personalization — the ONE canonical shape (utils/tasteProfile). */
    allergies?: string[];
    noveltyPreference?: string;
    cuisineAffinities?: string[];
  }
): Promise<ChangeDietResult> {
  const store = useStore.getState();
  const user = store.user;
  if (!user) {
    return { ok: false, synced: false, armed: false, trayHasItems: false, rebuilt: false, prompted: false, silent: false, reason: 'no_user' };
  }

  const newDiet = (params.diet ?? '').toLowerCase().trim();
  const prev = (params.prevDiet ?? '').toLowerCase().trim();
  const current = (user.diet ?? '').toLowerCase().trim();
  const changed = prev !== newDiet;

  // Validate the new diet is canonical before applying (Λ6.5 — no guesses).
  // updateProfile also validates, but we fail early here so a poisoned diet
  // never reaches the write path.
  if (newDiet && !isCanonicalDiet(newDiet)) {
    console.warn(`[changeDiet] rejected unknown diet "${params.diet}" — keeping previous "${user.diet ?? 'veg'}"`);
    return { ok: false, synced: false, armed: false, trayHasItems: false, rebuilt: false, prompted: false, silent: false, reason: 'no_local_change' };
  }

  // Apply non-diet extras first, then the diet.
  // updateProfile is the ONE canonical write path — it validates+lowercases.
  const nonDietFields: Record<string, unknown> = {};
  if (params.region !== undefined) nonDietFields.region = params.region;
  if (params.spiceLevel !== undefined) nonDietFields.spiceLevel = params.spiceLevel;
  if (params.healthGoals !== undefined) nonDietFields.healthGoals = params.healthGoals;
  if (params.plannedSlots !== undefined) nonDietFields.plannedSlots = params.plannedSlots;
  if (params.cookContact !== undefined) nonDietFields.cookContact = params.cookContact;
  if (params.onboardingComplete !== undefined) nonDietFields.onboardingComplete = params.onboardingComplete;
  if (params.allergies !== undefined) nonDietFields.allergies = params.allergies;
  if (params.noveltyPreference !== undefined) nonDietFields.noveltyPreference = params.noveltyPreference;
  if (params.cuisineAffinities !== undefined) nonDietFields.cuisineAffinities = params.cuisineAffinities;

  // Apply non-diet fields first (they don't affect the diet lifecycle).
  if (Object.keys(nonDietFields).length > 0) {
    store.updateProfile(nonDietFields as any);
  }

  // Apply the diet — updateProfile validates+lowercases.
  store.updateProfile({ diet: newDiet as CanonicalDiet });

  // ALWAYS attempt the server upsert with the PREVIOUS diet type.
  // ensureToken-first; arms pendingDietChange ONLY on server-confirmed real
  // dietType change (dietChanged && !wasUnset && changed.dietType).
  const res = await store.syncDietToServer(prev || undefined);
  if (!res.ok) {
    return { ok: false, synced: false, armed: false, trayHasItems: trayHasItems(store.trayLibrary), rebuilt: false, prompted: false, silent: false, reason: 'sync_failed' };
  }

  // Re-read FRESH state after the await — zustand set() replaces the state
  // object, so the pre-sync snapshot cannot see pendingDietChange/dietRegen
  // that syncDietToServer just armed/persisted.
  const fresh = useStore.getState();
  const hasItems = trayHasItems(fresh.trayLibrary);
  const pending = fresh.pendingDietChange;
  const regen = fresh.dietRegen;

  // TC-25 — a change the user ALREADY decided (deferred OR dismissed, same
  // from/to) never re-nags: clear the freshly-armed prompt and stop. Their
  // earlier choice ("after this cycle" / "I'll manage the tray myself") stands.
  if (pending && regen && regen.from === pending.from && regen.to === pending.to) {
    store.setPendingDietChange(null);
    return { ok: true, synced: true, armed: false, trayHasItems: hasItems, rebuilt: false, prompted: false, silent: false, reason: 'previously_decided' };
  }

  // No REAL dietType change confirmed by the server (wasUnset or no dietType change).
  // Don't arm the prompt — we can't truthfully claim a change vs the last synced row.
  if (!res.dietChanged || !res.changed.dietType) {
    return { ok: true, synced: true, armed: false, trayHasItems: hasItems, rebuilt: false, prompted: false, silent: false, reason: 'no_local_change' };
  }

  if (hasItems) {
    // Prompt governs — sync already armed it.
    return { ok: true, synced: true, armed: !!pending, trayHasItems: true, rebuilt: false, prompted: !!pending, silent: false, reason: 'prompt_governs' };
  }

  // EMPTY tray → silent rebuild. Honest guard: only when the diet actually
  // changed — otherwise the "Diet changed to X" toast is a fabrication (Λ6.5).
  if (!changed) {
    return { ok: true, synced: true, armed: false, trayHasItems: false, rebuilt: false, prompted: false, silent: false, reason: 'no_local_change' };
  }

  try {
    const { rebuildTrayForDiet } = await import('./trayRegen');
    await rebuildTrayForDiet();
    fresh.setPendingDietChange(null);
    fresh.setToast({ message: `Diet changed to ${dietLabel(newDiet)} — meals updated`, type: 'success' });
    return { ok: true, synced: true, armed: false, trayHasItems: false, rebuilt: true, prompted: false, silent: true, reason: 'silent_rebuild' };
  } catch (err) {
    console.warn('[changeDiet] silent rebuild failed (prompt kept when armed):', err);
    return { ok: false, synced: true, armed: !!pending, trayHasItems: false, rebuilt: false, prompted: !!pending, silent: false, reason: 'silent_rebuild' };
  }
}

// Keep the canonical constant referenced for importers that need the picker
// set (tests + any future picker consolidation read ONE source).
export { CANONICAL_DIETS };

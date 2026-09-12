// ─────────────────────────────────────────────────────────────────────────────
// SEED PREFLIGHT — the #185 first-load seed 400 gate (2026-09-13)
//
// The onboarding seed chain (App.tsx Phase 3) writes 4 slots into the plan +
// tray and fires a debounced addSlotItem POST per slot. On a FIRST landing it
// ran through that chain while hydration/user availability were not yet
// guaranteed, the POST payload was built from an incomplete profile, the server
// 400'd ("Invalid payload"), and the fake-success fallback re-armed the
// seed/pantry effects — the React #185 churn.
//
// This gate answers ONE question before ANY seed write: are the preconditions
// the chain trusts actually true? It uses the SAME honest booleans the
// f44cc41 boot gate established — `useStore.persist.hasHydrated()` and
// `useTrayStore.persist.hasHydrated()` — NOT a parallel gate, NOT a login
// proxy. `hasUser`/`hasRegion` pin the profile the seed reads (preferences +
// user.pantryStaples writes) to a real, present object.
//
// Contract: a blocked seed must log honestly and make NO tray/plan/pantry
// writes and NO network calls. First-load then reaches the same outcome as a
// reload (seed skipped because the store already holds the result).
// ─────────────────────────────────────────────────────────────────────────────
export interface SeedPreflightInput {
  /** useStore.persist.hasHydrated() — did the main store hydration RUN? */
  useStoreHydrated: boolean;
  /** useTrayStore.persist.hasHydrated() — did the tray store hydration RUN? */
  trayStoreHydrated: boolean;
  /** A store user/profile object is present (the seed writes user.pantryStaples). */
  hasUser: boolean;
  /** A region is available (from the completed onboarding form or the store). */
  hasRegion: boolean;
}

export type SeedPreflightResult =
  | { ok: true }
  | { ok: false; reason: 'store-not-hydrated' | 'tray-store-not-hydrated' | 'no-user' | 'no-region' };

export function seedPreflight(input: SeedPreflightInput): SeedPreflightResult {
  if (!input.useStoreHydrated) return { ok: false, reason: 'store-not-hydrated' };
  if (!input.trayStoreHydrated) return { ok: false, reason: 'tray-store-not-hydrated' };
  if (!input.hasUser) return { ok: false, reason: 'no-user' };
  if (!input.hasRegion) return { ok: false, reason: 'no-region' };
  return { ok: true };
}

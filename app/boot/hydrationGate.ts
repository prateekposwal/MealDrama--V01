// ─────────────────────────────────────────────────────────────────────────────
// App boot hydration gate — ONE decision table for the "storage has data but
// state looks empty" recovery branch (App.tsx).
//
// WHY A GATE: the old recovery branch used `!isLoggedIn` as a proxy for "state
// is empty". That proxy is false-positive on EVERY normal landing of a
// logged-out user with prior storage — the persist middleware always writes
// mealdrama-store after any session, so localStorage `raw` exists even when
// the state is CORRECTLY logged-out. The branch then warned and re-ran
// rehydrate() — a no-op refund of the hydration that already completed
// synchronously at store creation (zustand persist + sync storage runs the
// whole chain — merge AND hasHydrated=true — inline at create()).
//
// The honest question is "did hydration RUN?" — not "is the user logged in?".
// By the time App's hydration effect sets isHydrated, hasHydrated() is true
// on every normal load (checkBoth waits for it). The recovery path is
// therefore reachable ONLY when hydration genuinely did not run (migrate
// threw, storage threw mid-chain, an async edge) — log then, once per mount.
// ─────────────────────────────────────────────────────────────────────────────
export interface HydrationGateInput {
  /** App's own boot gate: set after both persisted stores report hydrated (or by the 3s safety belt). */
  isHydrated: boolean;
  /** Once-per-mount rehydrate guard (the App ref). */
  recoveryAttempted: boolean;
  /** useStore.persist.hasHydrated() — did the persist chain actually complete? */
  storageHydrated: boolean;
  /** mealdrama-store raw blob present in localStorage? */
  hasStoredData: boolean;
}

export type HydrationGateDecision =
  | { recoveryNeeded: false; reason: null }
  | { recoveryNeeded: true; reason: 'hydration-did-not-run' };

export function hydrationRecoveryDecision(input: HydrationGateInput): HydrationGateDecision {
  if (!input.isHydrated || input.recoveryAttempted) return { recoveryNeeded: false, reason: null };
  // Hydration ran → the state is TRUSTWORTHY. A logged-out user with prior
  // storage is a real state, not an empty-state anomaly — never "recover".
  if (input.storageHydrated) return { recoveryNeeded: false, reason: null };
  // Hydration genuinely did not run AND storage has data → one honest recovery.
  if (!input.hasStoredData) return { recoveryNeeded: false, reason: null };
  return { recoveryNeeded: true, reason: 'hydration-did-not-run' };
}

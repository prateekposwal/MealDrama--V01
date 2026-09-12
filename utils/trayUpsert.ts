// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL TRAY UPSERT — ONE id-or-name dedupe rule for every tray write path.
//
// The "second meal card" defect had FOUR divergent dedupe rules:
//   addToTray (id+name), moveToTrayFromQueue (id only), rebuildTrayForDiet
//   top-up (id only, APPEND), dietHeal addMealToSlot (id-or-name in the plan).
// A regenerated dish with a NEW id but the SAME normalized name sailed past the
// id-only paths and produced duplicate cards. This helper is the single rule:
// match by id OR normalized name; REPLACE an existing match (never append a
// name already in the slot); identical content is a no-op (same array back so
// callers can cheaply detect "nothing changed").
// ─────────────────────────────────────────────────────────────────────────────
import type { TrayLibrary, MealOption } from '../app/store/useStore';

export const SLOT_KEYS: ReadonlyArray<keyof TrayLibrary> = ['breakfast', 'lunch', 'snacks', 'dinner'];

export function normName(s?: string | null): string {
  return (s ?? '').trim().toLowerCase();
}

export interface UpsertResult {
  tray: MealOption[];
  added: boolean;
  replaced: boolean;
}

/** True when a same-id OR same-normalized-name entry already sits in the slot. */
export function trayHasMeal(tray: ReadonlyArray<MealOption>, meal: MealOption): boolean {
  const n = normName(meal.name);
  return tray.some(m => m.id === meal.id || normName(m.name) === n);
}

/**
 * Canonical tray write. Returns:
 *  - added=true   → the meal was appended (no id/name match existed)
 *  - replaced=true → an existing ENTRY (same id OR same name) was updated with
 *                    the incoming meal's fields — never a second card
 *  - neither      → identical content already present; the SAME array is
 *                    returned (no-op, so callers skip state writes / toasts)
 */
export function upsertMealToSlot(tray: ReadonlyArray<MealOption>, meal: MealOption): UpsertResult {
  const n = normName(meal.name);
  const idx = tray.findIndex(m => m.id === meal.id || normName(m.name) === n);
  if (idx === -1) return { tray: [...tray, meal], added: true, replaced: false };
  const existing = tray[idx]!;
  if (
    existing.id === meal.id &&
    existing.name === meal.name &&
    (existing.icon ?? '') === (meal.icon ?? '') &&
    (existing.sourceRegion ?? '') === (meal.sourceRegion ?? '')
  ) {
    return { tray: tray as MealOption[], added: false, replaced: false };
  }
  const next = tray.slice();
  next[idx] = { ...existing, ...meal };
  return { tray: next, added: false, replaced: true };
}
// ─────────────────────────────────────────────────────────────────────────────
// PantryStore — Persisted kitchen inventory state
// Saves which ingredients the user has checked off so state survives navigation.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nativeStorage } from '../../app/utils/nativeStorage';

export interface CheckedIngredient {
  name: string;
  checked: boolean;
}

interface PantryState {
  checkedItems: Record<string, boolean>; // ingredient name → checked
  /** IST day the checked map was last auto-reset by U11. Empty = never reset. */
  lastResetDay: string;
  /** Days since last auto-reset (computed). Empty string = never reset yet. */
  daysSinceLastReset: string;
  cookNotes: string;
  lastViewMode: 'meals' | 'household';
  setChecked: (name: string, checked: boolean) => void;
  setCookNotes: (notes: string) => void;
  setLastViewMode: (mode: 'meals' | 'household') => void;
  clearChecked: () => void;
  /** U11: day-scoped auto-reset of stale kitchen checks — see impl comment. */
  resetChecksForDay: (todayISO: string) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      checkedItems: {},
      lastResetDay: '',
      daysSinceLastReset: '',
      cookNotes: '',
      lastViewMode: 'meals',

      setChecked: (name, checked) =>
        set((s) => ({
          checkedItems: { ...s.checkedItems, [name]: checked },
        })),

      setCookNotes: (notes) => set({ cookNotes: notes }),

      setLastViewMode: (mode) => set({ lastViewMode: mode }),

      clearChecked: () => set({ checkedItems: {} }),

      // U11 day-scoped auto-reset. The persisted map is a flat
      // Record<name, boolean> — auto (meal-derived) vs user-set checks are NOT
      // recoverable from data alone. Safe rule: wipe ALL of the previous IST
      // day's checks exactly once per day (stamped by lastResetDay); checks
      // made today survive navigation and re-mounts until the IST day rolls
      // over. Uses the same primitive as clearChecked — that path is the
      // canonical reset, this is its day-scoped guard.
      resetChecksForDay: (todayISO) => {
        const s = get();
        if (!todayISO) return;
        if (s.lastResetDay === todayISO) return;
        set({ checkedItems: {} });
        set({ lastResetDay: todayISO });
      },

      // U11: computed — days since last auto-reset, for UI display.
      // Returns "X days ago" or "just reset" or "never reset".
      // This is a method accessible via usePantryStore.getState().getDaysSinceLastReset
      getDaysSinceLastReset: () => {
        const state = get();
        if (!state.lastResetDay) return 'never reset';
        const today = new Date().toISOString().split('T')[0]!;
        const resetDate = new Date(state.lastResetDay);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 0) return 'just reset';
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
      },
    }),
    {
      name: 'mealdrama-pantry',
      storage: nativeStorage,
    }
  )
);
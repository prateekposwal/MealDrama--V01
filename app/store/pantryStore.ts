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
  cookNotes: string;
  lastViewMode: 'meals' | 'household';
  setChecked: (name: string, checked: boolean) => void;
  setCookNotes: (notes: string) => void;
  setLastViewMode: (mode: 'meals' | 'household') => void;
  clearChecked: () => void;

}

export const usePantryStore = create<PantryState>()(
  persist(
    (set) => ({
      checkedItems: {},
      cookNotes: '',
      lastViewMode: 'meals',

      setChecked: (name, checked) =>
        set((s) => ({
          checkedItems: { ...s.checkedItems, [name]: checked },
        })),

      setCookNotes: (notes) => set({ cookNotes: notes }),

      setLastViewMode: (mode) => set({ lastViewMode: mode }),

      clearChecked: () => set({ checkedItems: {} }),
    }),
    {
      name: 'mealdrama-pantry',
      storage: nativeStorage,
    }
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// InventoryStore — Detailed kitchen inventory with quantities, units, expiry
// Persists alongside useStore (same nativeStorage namespace: mealdrama-store)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nativeStorage } from '../utils/nativeStorage';
import type { InventoryEntry } from '../../utils/pantryForecast';
import { getISODate, addDaysISO } from '../../utils/dateUTC';

export interface InventoryItem {
  id: string;                  // unique per (name + unit + expiry)
  name: string;
  quantity: number;            // amount owned
  unit: string;                // g, ml, pc, cup, etc.
  category: string;            // produce, dairy, grains, etc.
  storage?: 'fridge' | 'freezer' | 'pantry';
  expiry?: string;             // ISO date
  addedAt: string;             // when user added it
  source: 'auto' | 'manual';   // auto from meal planning vs manual add
  sources: string[];           // which meals/dishes contributed to this entry
}

interface InventoryState {
  items: InventoryItem[];
  /** Add a new inventory entry (merges if same name+unit+storage already exists) */
  addItem: (item: Omit<InventoryItem, 'id'> & Partial<Pick<InventoryItem, 'addedAt' | 'sources'>>) => void;
  /** Remove an inventory item */
  removeItem: (id: string) => void;
  /** Update quantity of existing item */
  updateQuantity: (id: string, delta: number) => void;
  /** Find items expiring within N days */
  expiringWithin: (days: number) => InventoryItem[];
  /** Find items that are short for upcoming meals */
  shortForMeals: (horizonDays: number) => InventoryItem[];
  /** Get total quantity by category */
  totalByCategory: (category: string) => number;
  /** Clear all inventory */
  clearAll: () => void;
}

const STORAGE_KEY = 'mealdrama-inventory';

// Helper: generate stable id from name + unit + expiry
function generateId(name: string, unit: string, expiry?: string): string {
  const base = `${name.toLowerCase()}-${unit.toLowerCase()}-${expiry || 'never'}`;
  return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Helper: check if two entries should be merged
function shouldMerge(a: InventoryItem, b: InventoryItem): boolean {
  return (
    a.name.toLowerCase() === b.name.toLowerCase() &&
    a.unit === b.unit &&
    a.storage === b.storage &&
    (!a.expiry && !b.expiry || a.expiry === b.expiry)
  );
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => {
        const newItem: InventoryItem = {
          id: generateId(item.name, item.unit, item.expiry),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category ?? 'pantry',
          storage: item.storage,
          expiry: item.expiry,
          addedAt: item.addedAt || new Date().toISOString(),
          source: item.source ?? 'manual',
          sources: item.sources ?? [],
        };
        // Check if an identical entry already exists (findIndex callback gets the ITEM)
        const existingIdx = state.items.findIndex(it => shouldMerge(it, newItem));

        if (existingIdx >= 0) {
          // Merge: add quantities, union sources
          const existing = state.items[existingIdx]!;
          const newQty = Math.max(0, existing.quantity + item.quantity);
          const newSources = [...new Set([...existing.sources, ...(item.sources || [])])];

          // If both have expiry, keep the earlier one
          let newExpiry: string | undefined;
          if (existing.expiry && item.expiry) {
            newExpiry = new Date(existing.expiry) < new Date(item.expiry) ? existing.expiry : item.expiry;
          } else if (existing.expiry) {
            newExpiry = existing.expiry;
          } else if (item.expiry) {
            newExpiry = item.expiry;
          }

          return {
            items: state.items.map((it, idx) =>
              idx === existingIdx
                ? { ...it, quantity: newQty, sources: newSources, expiry: newExpiry }
                : it
            ),
          };
        }

        // No existing entry — add new (newItem already built above)
        return { items: [...state.items, newItem] };
      }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      updateQuantity: (id, delta) =>
        set((state) => {
          const idx = state.items.findIndex((item) => item.id === id);
          if (idx < 0) return state;
          const newQty = Math.max(0, state.items[idx]!.quantity + delta);
          if (newQty === 0) {
            // Remove if quantity reaches 0
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item, i) =>
              i === idx ? { ...item, quantity: newQty } : item
            ),
          };
        }),

      expiringWithin: (days) => {
        const today = new Date();
        const cutoff = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return get().items.filter(
          (item) => item.expiry && new Date(item.expiry) <= cutoff && new Date(item.expiry) > today
        );
      },

      shortForMeals: (horizonDays) => {
        const today = getISODate(new Date());
        const horizonDates = [1, 2, 3].map(n => addDaysISO(today, n - 1));
        const meals = horizonDates.map(date => ({
          mealId: 'placeholder', // we'll compute per meal separately
          quantity: 1,
        }));
        // Simple: return items without expiry that could be short, or items expiring after horizon
        return get().items.filter(
          (item) => !item.expiry || (item.expiry && new Date(item.expiry) > new Date(Date.now() + horizonDays * 86400000))
        );
      },

      totalByCategory: (category) =>
        get().items
          .filter((item) => item.category.toLowerCase() === category.toLowerCase())
          .reduce((sum, item) => sum + item.quantity, 0),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: nativeStorage,
      // PARTIAL: only persist items, not helper methods
      partialize: (state) => ({ items: state.items }),
    }
  )
)
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TraySlotItem, Category, MealCardData } from '../types/meal';

let _nextId = 0;
const uid = () => `item_${Date.now()}_${++_nextId}`;

export interface MealStore {
  slots: Record<string, TraySlotItem[]>;
  addItem: (slotKey: string, meal: MealCardData) => void;
  swapCategory: (slotKey: string, itemId: string, category: Category, optionId: string) => void;
  removeItem: (slotKey: string, itemId: string) => void;
  updateQuantity: (slotKey: string, itemId: string, delta: number) => void;
  clearSlot: (slotKey: string) => void;
  getSlotItems: (slotKey: string) => TraySlotItem[];
}

export const useMealStore = create<MealStore>()(
  immer((set, get) => ({
    slots: {},

    addItem: (slotKey, meal) => {
      set((state) => {
        if (!state.slots[slotKey]) {
          state.slots[slotKey] = [];
        }
        const item: TraySlotItem = {
          id: uid(),
          mealId: meal.id,
          name: meal.name,
          icon: meal.icon,
          quantity: 1,
          categories: {
            gravy: meal.categories.gravy ? { ...meal.categories.gravy } : null,
            roti: meal.categories.roti ? { ...meal.categories.roti } : null,
            rice: meal.categories.rice ? { ...meal.categories.rice } : null,
            sides: [...meal.categories.sides],
            beverages: [...meal.categories.beverages],
          },
          availableOptions: {
            gravy: [...meal.availableOptions.gravy],
            roti: [...meal.availableOptions.roti],
            rice: [...meal.availableOptions.rice],
            sides: [...meal.availableOptions.sides],
            beverages: [...meal.availableOptions.beverages],
          },
        };
        state.slots[slotKey].push(item);
      });
    },

    swapCategory: (slotKey, itemId, category, optionId) => {
      set((state) => {
        const items = state.slots[slotKey];
        if (!items) return;
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        const options = item.availableOptions[category];
        const option = options.find((o) => o.id === optionId);
        if (!option) return;

        if (category === 'sides' || category === 'beverages') {
          const arr = item.categories[category];
          const exists = arr.find((o) => o.id === optionId);
          if (exists) {
            const idx = arr.indexOf(exists);
            arr.splice(idx, 1);
          } else {
            arr.push({ ...option });
          }
        } else {
          item.categories[category] = { ...option };
        }
      });
    },

    removeItem: (slotKey, itemId) => {
      set((state) => {
        const items = state.slots[slotKey];
        if (!items) return;
        const idx = items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          items.splice(idx, 1);
        }
      });
    },

    updateQuantity: (slotKey, itemId, delta) => {
      set((state) => {
        const items = state.slots[slotKey];
        if (!items) return;
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        item.quantity = Math.max(1, item.quantity + delta);
      });
    },

    clearSlot: (slotKey) => {
      set((state) => {
        delete state.slots[slotKey];
      });
    },

    getSlotItems: (slotKey) => {
      return get().slots[slotKey] || [];
    },
  }))
);

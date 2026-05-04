import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Dish } from '../constants/dishLibrary';
import api from '../lib/api';

export type MutationKind = 'plan' | 'complete';

export interface PendingMutation {
  id: string;
  kind: MutationKind;
  payload: Record<string, unknown>;
  addedAt: number;
  retryCount: number;
}

const MAX_RETRIES = 3;

let _drainTimer: ReturnType<typeof setTimeout> | null = null;
let _isRetrying = false;

function _scheduleDrain() {
  if (typeof window === 'undefined') return;
  if (_drainTimer) clearTimeout(_drainTimer);
  _drainTimer = setTimeout(() => {
    _drainTimer = null;
    // online listener will call drainPendingMutations
  }, 2000);
}

// Wire online event once — calls drainPendingMutations when connectivity is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => useStore.getState().drainPendingMutations(), 500);
  });
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  region?: string;
  diet?: 'veg' | 'non-veg' | 'eggitarian' | 'vegan';
  spiceLevel?: 'mild' | 'medium' | 'hot';
  onboardingComplete?: boolean;
  cookContact?: string;
  cookControl?: string;
  allergies?: string[];
  dislikedItems?: string[];
  goal?: string;
  plannedSlots?: string[];
  slotTiming?: Record<string, string>;
  cookingRole?: string;
  systemId?: string;
}

export interface MealOption {
  id: string;
  dishId: string;
  name: string;
  icon?: string;
  variant?: string;
  variantId?: string;
  quantity?: number;
  countBased?: boolean;
  mealContext?: string;
  addOn?: string;
  sourceRegion?: string;
  prepMinutes?: number;
  smartRecommended?: boolean;
}

export interface MealResolution {
  meal?: MealOption;
  fromTray?: boolean;
  isSwapped?: boolean;
  quantity?: number;
  duplicateWarning?: { type: 'same-day-block' | 'week-soft-warning'; message: string };
}

export interface SwapNotification {
  id: string;
  date: string;
  slot: string;
  oldMeal: string;
  newMeal: string;
  timestamp: number;
  message?: string;
}

export interface TrayEditSession {
  originTab?: 'home' | 'plan' | 'pantry' | 'profile';
  returnTab?: 'pantry' | 'home' | 'plan' | 'profile';
  slot?: string;
  returnToOnboarding?: boolean;
}

export interface TrayLibrary {
  breakfast: MealOption[];
  lunch: MealOption[];
  dinner: MealOption[];
  snacks: MealOption[];
}

export interface UserProfile {
  userId: string;
  dietType: string;
  region: string;
  allergies: string[];
  dislikedItems: string[];
  spiceLevel: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface PantryItem extends Ingredient {
  id: string;
  checked: boolean;
  auto: boolean;
  mealName?: string;
  mealDate?: string;
}

export interface CompletedSlot {
  id?: string;
  userId: string;
  date: string;
  slot: string;
  status: 'cooked' | 'missed' | 'skipped';
}

export const getISODate = (date: Date): string => date.toLocaleDateString('en-CA');

const _MEAL_RESOLUTION_CACHE = new Map<string, MealResolution>();

export function getMealResolution(
  trayLibrary: TrayLibrary,
  swaps: Record<string, Record<string, MealOption>>,
  isoDate: string,
  slot: string,
  dishes: Dish[],
): MealResolution {
  const cacheKey = `${isoDate}::${slot}::${Object.keys(swaps).length}`;
  if (_MEAL_RESOLUTION_CACHE.has(cacheKey)) {
    return _MEAL_RESOLUTION_CACHE.get(cacheKey)!;
  }

  const result = _computeMealResolution(trayLibrary, swaps, isoDate, slot, dishes);
  _MEAL_RESOLUTION_CACHE.set(cacheKey, result);
  return result;
}

export function invalidateMealResolutionCache(): void {
  _MEAL_RESOLUTION_CACHE.clear();
}

function _computeMealResolution(
  trayLibrary: TrayLibrary,
  swaps: Record<string, Record<string, MealOption>>,
  isoDate: string,
  slot: string,
  dishes: Dish[],
): MealResolution {
  const slotKey = isoDate;
  const daySwaps = swaps[slotKey] || {};
  const swappedMeal = daySwaps[slot];

  if (swappedMeal) {
    const { name, addOn } = resolveSmartVariantName(swappedMeal, slot, dishes);
    return {
      meal: { ...swappedMeal, variant: name, addOn: addOn || swappedMeal.addOn },
      isSwapped: true,
    };
  }

  const cycleDay = Math.floor(
    (new Date(isoDate).getTime() - new Date(new Date().setHours(0, 0, 0, 0)).getTime()) /
    (1000 * 60 * 60 * 24)
  ) % 7;

  const slotIndex = ['breakfast', 'lunch', 'snacks', 'dinner'].indexOf(slot.toLowerCase());
  const tray = trayLibrary[slot.toLowerCase() as keyof TrayLibrary] || [];

  if (tray.length === 0) return {};

  const dishIndex = (cycleDay + slotIndex) % tray.length;
  const meal = tray[dishIndex];
  if (!meal) return {};
  const { name, addOn } = resolveSmartVariantName(meal, slot, dishes);

  return {
    meal: { ...meal, variant: name, addOn: addOn || meal.addOn },
    fromTray: true,
  };
}


export const isEarlyMorning = (): boolean => {
  const hour = new Date().getHours();
  return hour < 8;
};

export const isSlotMissed = (date: string, slot: string): boolean => {
  const slotTimes: Record<string, number> = { Breakfast: 8, Lunch: 13, Snacks: 16, Dinner: 20 };
  const slotHour = slotTimes[slot] || 12;

  const today = getISODate(new Date());
  if (date < today) return true;
  if (date > today) return false;

  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour >= slotHour) return true;

  return false;
};

export const isSlotLocked = (date: string, slot: string, mealStatus?: string): boolean => {
  if (mealStatus === 'cooked' || mealStatus === 'served') return true;
  
  const today = getISODate(new Date());
  
  if (date < today) return true;
  if (date > today) return false;
  
  const slotTimes: Record<string, number> = { Breakfast: 8, Lunch: 13, Snacks: 16, Dinner: 20 };
  const slotHour = (slotTimes[slot] || 12) + 1;
  
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour >= slotHour) return true;
  
  return false;
};

const resolveSmartVariantName = (meal: MealOption, slot: string, dishes: Dish[]) => {
  if (!meal?.dishId) return { name: meal?.variant || meal?.name || '', addOn: meal?.addOn };
  const dish = dishes.find(d => d.id === meal.dishId);
  const variants = dish?.variants || [];
  if (!variants.length) return { name: meal.variant, addOn: meal.addOn };

  const slotContext = slot.toLowerCase();
  const preferredForJadoh = slot === 'Lunch'
    ? ['Rice', 'Thali']
    : slot === 'Dinner'
    ? ['Rice', 'Bowl']
    : [];

  let match = preferredForJadoh.length
    ? variants.find(v => preferredForJadoh.some(p => v.name.toLowerCase().includes(p.toLowerCase())))
    : null;
  if (!match) match = variants.find(v => v.mealContext?.toLowerCase() === slotContext);
  if (!match) match = variants[0];

  return { name: match?.name || meal.variant, addOn: match?.addOn };
};

interface StoreState {
  isLoggedIn: boolean;
  user: User | null;
  trayLibrary: TrayLibrary;
  swaps: Record<string, Record<string, MealOption>>;
  notifications: SwapNotification[];
  trayEditSession: TrayEditSession | null;
  dishes: Dish[];
  toast: { message: string; type: 'error' | 'success' | 'info' } | null;
  setToast: (toast: { message: string; type: 'error' | 'success' | 'info' } | null) => void;
  setLoggedIn: (value: boolean) => void;
  updateProfile: (updates: Partial<User>) => void;
  setUser: (user: User) => void;
  logout: () => void;
  addToTray: (slot: string, meal: MealOption) => void;
  removeFromTray: (slot: string, mealId: string) => void;
  replaceTrayLibrary: (newTray: TrayLibrary) => void;
  setSwap: (date: string, slot: string, meal: MealOption, silent?: boolean) => void;
  clearSwap: (date: string, slot: string) => void;
  updateMealQuantity: (date: string, slot: string, delta: number) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  startTrayEdit: (session: TrayEditSession) => void;
  endTrayEdit: () => void;
  setDishes: (dishes: Dish[]) => void;
  syncPlanToDB: (date: string, slot: string, meal: MealOption) => Promise<{ ok: boolean; reason?: string }>;
  syncCompleteToDB: (date: string, slot: string, status: 'cooked' | 'missed' | 'skipped') => Promise<{ ok: boolean; reason?: string }>;
  pendingMutations: PendingMutation[];
  deadLetterMutations: PendingMutation[];
  addPendingMutation: (kind: MutationKind, payload: Record<string, unknown>) => void;
  removePendingMutation: (id: string) => void;
  moveToDeadLetter: (mutation: PendingMutation) => void;
  clearDeadLetters: () => void;
  drainPendingMutations: () => Promise<void>;
  // Onboarding / Quick Setup flow
  quickSetupOpen: boolean;
  quickSetupPrefill?: Partial<User>;
  openQuickSetup: (prefill?: Partial<User>) => void;
  closeQuickSetup: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      trayLibrary: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      swaps: {},
      notifications: [],
      trayEditSession: null,
      dishes: [],
      toast: null,
      pendingMutations: [],
      deadLetterMutations: [],

      setToast: (toast) => set({ toast }),

      setLoggedIn: (value: boolean) => set({ isLoggedIn: value }),

      updateProfile: (updates: Partial<User>) =>
        set((state) => ({
          // Always merge updates into an existing user object or create a new one
          user: {
            ...(state.user ?? {}),
            ...updates,
          } as User,
        })),

      setUser: (user: User) => set({ user, isLoggedIn: true }),

      logout: () =>
        set({
          isLoggedIn: false,
          user: null,
          trayLibrary: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          swaps: {},
          notifications: [],
          trayEditSession: null,
        }),

      addToTray: (slot: string, meal: MealOption) =>
        set((state) => {
          const key = slot.toLowerCase() as keyof TrayLibrary;
          const tray = state.trayLibrary[key] || [];
          if (tray.find(m => m.id === meal.id)) return state;
          return {
            trayLibrary: {
              ...state.trayLibrary,
              [key]: [...tray, meal],
            },
          };
        }),

      removeFromTray: (slot: string, mealId: string) =>
        set((state) => {
          const key = slot.toLowerCase() as keyof TrayLibrary;
          return {
            trayLibrary: {
              ...state.trayLibrary,
              [key]: (state.trayLibrary[key] || []).filter(m => m.id !== mealId),
            },
          };
        }),

      replaceTrayLibrary: (newTray: TrayLibrary) =>
        set({ trayLibrary: newTray }),

      setSwap: (date: string, slot: string, meal: MealOption, silent = false) =>
        set((state) => {
          const newSwaps = {
            ...state.swaps,
            [date]: {
              ...state.swaps[date],
              [slot]: meal,
            },
          };

          if (silent) {
            return { swaps: newSwaps };
          }

          const notification: SwapNotification = {
            id: `${date}-${slot}-${Date.now()}`,
            date,
            slot,
            oldMeal: state.swaps[date]?.[slot]?.name || 'default',
            newMeal: meal.name,
            timestamp: Date.now(),
          };

          return {
            swaps: newSwaps,
            notifications: [notification, ...state.notifications].slice(0, 10),
          };
        }),

      clearSwap: (date: string, slot: string) =>
        set((state) => {
          const newSwaps = { ...state.swaps };
          if (newSwaps[date]) {
            const { [slot]: _, ...rest } = newSwaps[date];
            if (Object.keys(rest).length === 0) {
              delete newSwaps[date];
            } else {
              newSwaps[date] = rest;
            }
          }
          return { swaps: newSwaps };
        }),

      updateMealQuantity: (date: string, slot: string, delta: number) =>
        set((state) => {
          const isoDate = date;
          const daySwaps = state.swaps[isoDate];
          if (!daySwaps) return state;

          const current = daySwaps[slot];
          if (!current) return state;

          const newQty = Math.max(1, (current.quantity || 1) + delta);

          const updatedDay = { ...daySwaps, [slot]: { ...current, quantity: newQty } };
          const updatedSwaps = { ...state.swaps, [isoDate]: updatedDay };

          return { swaps: updatedSwaps };
        }),

      clearNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        })),

      clearAllNotifications: () => set({ notifications: [] }),

      startTrayEdit: (session: TrayEditSession) =>
        set({ trayEditSession: session }),

      endTrayEdit: () => set({ trayEditSession: null }),

      setDishes: (dishes: Dish[]) => set({ dishes }),
      // onboarding / quick setup
      quickSetupOpen: false,
      quickSetupPrefill: undefined,
      openQuickSetup: (prefill?: Partial<User>) => set({ quickSetupOpen: true, quickSetupPrefill: prefill }),
      closeQuickSetup: () => set({ quickSetupOpen: false, quickSetupPrefill: undefined }),

      syncPlanToDB: async (date: string, slot: string, meal: MealOption) => {
        const userId = get().user?.id;
        if (!userId) {
          get().setToast({ message: "You're not logged in — tap Profile to fix that.", type: 'error' });
          return { ok: false, reason: 'Not logged in' };
        }
        const payload = {
          userId,
          date,
          slot: slot.toLowerCase(),
          mealId: meal.dishId,
          variantId: meal.variantId,
          qty: meal.quantity || 1,
        };
        try {
          await api.post('/plan', payload);
          return { ok: true };
        } catch (err: any) {
          if (err?.message?.includes('409') || err?.message?.includes('Conflict')) {
            get().setToast({ message: 'Plan changed elsewhere. Refreshing.', type: 'info' });
            return { ok: false, reason: 'conflict' };
          }
          console.error('[Store] Plan sync failed:', err);
          get().addPendingMutation('plan', payload);
          get().setToast({ message: 'Internet broke. Saved locally — will retry.', type: 'error' });
          return { ok: false, reason: err?.message ?? 'Sync failed' };
        }
      },

      syncCompleteToDB: async (date: string, slot: string, status: 'cooked' | 'missed' | 'skipped') => {
        const userId = get().user?.id;
        if (!userId) {
          get().setToast({ message: "You're not logged in — tap Profile to fix that.", type: 'error' });
          return { ok: false, reason: 'Not logged in' };
        }
        const payload = { userId, date, slot: slot.toLowerCase(), status };
        try {
          await api.post('/complete', payload);
          return { ok: true };
        } catch (err: any) {
          console.error('[Store] Complete sync failed:', err);
          get().addPendingMutation('complete', payload);
          get().setToast({ message: 'Internet broke. Saved locally — will retry.', type: 'error' });
          return { ok: false, reason: err?.message ?? 'Sync failed' };
        }
      },

      addPendingMutation: (kind, payload) => {
        set((state) => ({
          pendingMutations: [
            ...state.pendingMutations,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, payload, addedAt: Date.now(), retryCount: 0 },
          ],
        }));
        if (typeof window !== 'undefined' && !_drainTimer) {
          _scheduleDrain();
        }
      },

      removePendingMutation: (id) => {
        set((state) => ({
          pendingMutations: state.pendingMutations.filter((m) => m.id !== id),
        }));
      },

      moveToDeadLetter: (mutation) => {
        set((state) => ({
          pendingMutations: state.pendingMutations.filter((m) => m.id !== mutation.id),
          deadLetterMutations: [...state.deadLetterMutations, mutation],
        }));
        const { setToast } = get();
        setToast({ message: `Failed after ${MAX_RETRIES} retries. "${(mutation.payload as any)?.mealId ?? mutation.kind}" not saved.`, type: 'error' });
      },

      clearDeadLetters: () => set({ deadLetterMutations: [] }),

      drainPendingMutations: async () => {
        const state = get();
        const { pendingMutations, removePendingMutation, moveToDeadLetter } = state;
        if (pendingMutations.length === 0) return;
        if (_isRetrying) return;
        _isRetrying = true;
        for (const mutation of pendingMutations) {
          try {
            const endpoint = mutation.kind === 'plan' ? '/plan' : '/complete';
            await api.post(endpoint, mutation.payload);
            removePendingMutation(mutation.id);
          } catch (err: any) {
            const msg = err?.message ?? '';
            if (msg.includes('401') || msg.includes('Unauthorized')) {
              removePendingMutation(mutation.id);
              state.logout();
              state.setToast({ message: 'Session expired. Log in again.', type: 'error' });
              break;
            }
            if (msg.includes('409') || msg.includes('Conflict')) {
              removePendingMutation(mutation.id);
              break;
            }
            const nextCount = mutation.retryCount + 1;
            if (nextCount >= MAX_RETRIES) {
              moveToDeadLetter({ ...mutation, retryCount: nextCount });
            } else {
              set((s) => ({
                pendingMutations: s.pendingMutations.map((m) =>
                  m.id === mutation.id ? { ...m, retryCount: nextCount } : m
                ),
              }));
            }
          }
        }
        _isRetrying = false;
      },
    }),
    {
      name: 'mealdrama-store',
      version: 3,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const state = persistedState as Record<string, unknown>;
        if (fromVersion < 1) {
          // v0 → v1: backfill slot/date on swap entries
          const swaps = state.swaps as Record<string, Record<string, unknown>> | undefined;
          if (swaps) {
            for (const date of Object.keys(swaps)) {
              const daySwaps = swaps[date];
              if (!daySwaps) continue;
              for (const slot of Object.keys(daySwaps)) {
                const entry = daySwaps[slot];
                if (entry && typeof entry === 'object') {
                  const e = entry as Record<string, unknown>;
                  if (!('slot' in e)) e.slot = slot;
                  if (!('date' in e)) e.date = date;
                }
              }
            }
          }
        }
        if (fromVersion < 2) {
          state.pendingMutations = [];
        }
        if (fromVersion < 3) {
          state.deadLetterMutations = [];
          // Backfill retryCount on any existing pending mutations
          const mutations = state.pendingMutations as Array<Record<string, unknown>> | undefined;
          if (mutations) {
            for (const m of mutations) {
              if (!('retryCount' in m)) m.retryCount = 0;
            }
          }
        }
        return persistedState as Parameters<typeof persist>[0] extends (s: infer S) => unknown ? S : never;
      },
    }
  )
);

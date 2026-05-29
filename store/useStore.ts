import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nativeStorage } from '../utils/nativeStorage';
import { loadAuth, saveAuth, clearAuth } from '../utils/authStorage';
import api, { setAuthReady } from '../lib/api';
import { RequestTracker, requestDedupCache } from '../utils/asyncGuard';
import { onConnectivityChange } from '../utils/connectivity';


const MAX_RETRIES = 3;

// C2: Single online listener lives in connectivity.ts — stores subscribe via onConnectivityChange()
// H1: Use window singleton for module-level state — survives HMR module recreation
interface DrainState {
  timer: ReturnType<typeof setTimeout> | null;
  isRetrying: boolean;
  tracker: RequestTracker;
}

function _getDrainState(): DrainState {
  if (typeof window === 'undefined') {
    return { timer: null, isRetrying: false, tracker: new RequestTracker() };
  }
  const w = window as unknown as Record<string, unknown>;
  if (!w.__mdDrainState) {
    w.__mdDrainState = {
      timer: null,
      isRetrying: false,
      tracker: new RequestTracker(),
    };
  }
  return w.__mdDrainState as DrainState;
}

function _scheduleDrain() {
  const ds = _getDrainState();
  if (typeof window === 'undefined') return;
  if (ds.timer) clearTimeout(ds.timer);
  ds.timer = setTimeout(() => {
    ds.timer = null;
  }, 2000);
}

// Subscribe to connectivity changes — drain when online
let _unsubscribeConnectivity: (() => void) | null = null;
if (typeof window !== 'undefined') {
  _unsubscribeConnectivity = onConnectivityChange((state) => {
    if (state === 'online') {
      setTimeout(() => useStore.getState().drainPendingMutations(), 500);
    }
  });

  // HMR cleanup
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (_unsubscribeConnectivity) _unsubscribeConnectivity();
      const ds = _getDrainState();
      if (ds.timer) clearTimeout(ds.timer);
      ds.timer = null;
      ds.isRetrying = false;
      ds.tracker = new RequestTracker();
    });
  }
}

export interface User {
  id: string;
  username?: string;
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
  pantryStaples?: string[];
  slotTiming?: Record<string, string>;
  cookingRole?: string;
  systemId?: string;
  /** Immutable primary identity generated at signup (e.g. PRATEEK-MD-20260518-183522-0042) */
  primaryId?: string;
  healthGoals?: string[];
  allergyMode?: boolean;
  calorieTarget?: number;
  proteinTarget?: number;
  fiberTarget?: number;
  sodiumLimit?: number;
  sugarLimit?: number;
  /** Per-slot time overrides (start/end in HH:MM) — overrides SLOT_TIME_DEFAULTS */
  slotTimePreferences?: Record<string, { start: string; end: string }>;
  /** User-uploaded profile picture (base64 data URL) */
  avatarUrl?: string;
}

export interface CategorySelection {
  gravy?: { id: string; name: string } | null;
  roti?: { id: string; name: string } | null;
  rice?: { id: string; name: string } | null;
  sides?: { id: string; name: string }[];
  beverages?: { id: string; name: string }[];
  dessert?: { id: string; name: string }[];
  /** Per-item quantities (item name → qty), applied as multiplier to ingredient amounts */
  itemQtys?: Record<string, number>;
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
  categorySelections?: CategorySelection;
}

export interface MealResolution {
  meal?: MealOption;
  fromTray?: boolean;
  isSwapped?: boolean;
  quantity?: number;
  duplicateWarning?: { type: 'same-day-block' | 'week-soft-warning'; message: string };
}

export interface TrayLibrary {
    breakfast: MealOption[];
    lunch: MealOption[];
    dinner: MealOption[];
    snacks: MealOption[];
}


import { getISODate, daysBetweenISO } from '../utils/dateUTC';
export { getISODate };

const _MEAL_RESOLUTION_CACHE = new Map<string, MealResolution>();
const _MEAL_CACHE_MAX = 100;

export function getMealResolution(
  trayLibrary: TrayLibrary,
  swaps: Record<string, Record<string, MealOption>>,
  isoDate: string,
  slot: string,
  dishes: Dish[],
  userId?: string,
): MealResolution {
  // M5: Cache key scoped to specific date/slot swaps, not global swap count
  const daySwaps = swaps[isoDate]?.[slot];
  const swapFingerprint = daySwaps ? `${(daySwaps as unknown as Record<string, unknown>).id ?? (daySwaps as unknown as Record<string, unknown>).meal_id ?? 'none'}` : 'none';
  const cacheKey = `${userId ?? 'anon'}::${isoDate}::${slot}::${swapFingerprint}`;
  if (_MEAL_RESOLUTION_CACHE.has(cacheKey)) {
    const val = _MEAL_RESOLUTION_CACHE.get(cacheKey)!;
    // LRU: re-insert to move to end
    _MEAL_RESOLUTION_CACHE.delete(cacheKey);
    _MEAL_RESOLUTION_CACHE.set(cacheKey, val);
    return val;
  }

  const result = _computeMealResolution(trayLibrary, swaps, isoDate, slot, dishes);
  _MEAL_RESOLUTION_CACHE.set(cacheKey, result);
  if (_MEAL_RESOLUTION_CACHE.size > _MEAL_CACHE_MAX) {
    const firstKey = _MEAL_RESOLUTION_CACHE.keys().next().value;
    if (firstKey != null) _MEAL_RESOLUTION_CACHE.delete(firstKey);
  }
  return result;
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

  // C6: Use IST-based date computation — app is India-only (Asia/Kolkata)
  // getISODate() returns today's date in IST regardless of device timezone
  const todayISO = getISODate();
  const cycleDay = Math.max(0, daysBetweenISO(todayISO, isoDate));

  const tray = trayLibrary[slot.toLowerCase() as keyof TrayLibrary] || [];

  if (tray.length === 0) return {};

  const dishIndex = cycleDay % tray.length;
  const meal = tray[dishIndex];
  if (!meal) return {};
  const { name, addOn } = resolveSmartVariantName(meal, slot, dishes);

  // Duplicate warning: check if same dishId appears in another slot today
  const allSlots = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
  let duplicateWarning: MealResolution['duplicateWarning'] = undefined;
  for (const otherSlot of allSlots) {
    if (otherSlot === slot.toLowerCase()) continue;
    const otherTray = trayLibrary[otherSlot] || [];
    const otherMeal = otherTray[dishIndex % otherTray.length];
    if (otherMeal?.dishId === meal?.dishId) {
      duplicateWarning = {
        type: 'same-day-block',
        message: `${meal.name} also appears in ${otherSlot.charAt(0).toUpperCase() + otherSlot.slice(1)}`,
      };
      break;
    }
  }

  return {
    meal: { ...meal, variant: name, addOn: addOn || meal.addOn },
    fromTray: true,
    duplicateWarning,
  };
}


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

// Device identity — generated ONCE per install, persisted via Zustand
function generateDeviceId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Load auth state synchronously from dedicated storage
const initialAuth = loadAuth();

// FIX: Validate and clear corrupted storage BEFORE Zustand hydrates
// Prevents infinite hydration loops caused by malformed JSON
function clearCorruptedStorage(key: string): void {
  try {
    const raw = localStorage.getItem(key);
    console.log(`[Store] Checking ${key}: ${raw ? raw.substring(0, 50) + '...' : 'null'}`);
    if (!raw) return;
    if (typeof raw !== 'string' || !raw.startsWith('{')) {
      console.warn(`[Store] Clearing corrupted ${key} (invalid format: "${raw.substring(0, 30)}")`);
      localStorage.removeItem(key);
      return;
    }
    // Validate it's actually valid JSON
    JSON.parse(raw);
  } catch (e) {
    console.warn(`[Store] Clearing corrupted ${key} (JSON parse failed)`, e);
    try { localStorage.removeItem(key); } catch {}
  }
}

console.log('[Store] Running pre-hydration storage cleanup...');
clearCorruptedStorage('mealdrama-store');
clearCorruptedStorage('mealdrama-tray-store');
console.log('[Store] Pre-hydration storage cleanup complete');

// Load trayLibrary synchronously from persisted storage
function loadInitialTrayLibrary(): TrayLibrary {
  try {
    const raw = localStorage.getItem('mealdrama-store');
    if (raw && typeof raw === 'string' && raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.trayLibrary && typeof parsed.state.trayLibrary === 'object') {
        return parsed.state.trayLibrary;
      }
    }
  } catch (err) {
    console.warn('[Store] loadInitialTrayLibrary failed, clearing corrupted storage:', err);
    try { localStorage.removeItem('mealdrama-store'); } catch {}
  }
  return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

const initialTrayLibrary = loadInitialTrayLibrary();

interface StoreState {
  isLoggedIn: boolean;
  authReady: boolean;
  user: User | null;
  token: string | null;
  deviceId: string;
  setToken: (token: string) => void;
  clearToken: () => void;
  trayLibrary: TrayLibrary;
  swaps: Record<string, Record<string, MealOption>>;
  notifications: SwapNotification[];
  trayEditSession: TrayEditSession | null;
  dishes: Dish[];
  toast: { message: string; type: 'error' | 'success' | 'info'; action?: { label: string; onClick: () => void } } | null;
  setToast: (toast: { message: string; type: 'error' | 'success' | 'info'; action?: { label: string; onClick: () => void } } | null) => void;
  login: (userId: string, primaryId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  setUser: (user: User) => void;
  addToPantry: (items: string[]) => void;
  logout: () => void;
  addToTray: (slot: string, meal: MealOption) => void;
  removeFromTray: (slot: string, mealId: string) => void;
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
  retryDeadLetters: () => Promise<void>;
  drainPendingMutations: () => Promise<void>;
  // Onboarding / Quick Setup flow
  quickSetupOpen: boolean;
  quickSetupPrefill?: Partial<User>;
  openQuickSetup: (prefill?: Partial<User>) => void;
  closeQuickSetup: () => void;
  // Smart Queue (Week 2 / Favorites)
  smartQueue: SmartQueue;
  addToQueue: (meal: MealOption, queue: 'week2' | 'favorites') => void;
  removeFromQueue: (mealId: string, queue: 'week2' | 'favorites') => void;
  restoreFromQueue: (mealId: string, queue: 'week2' | 'favorites') => { meal: MealOption | null };
  moveToTrayFromQueue: (meal: MealOption) => void;
  // Routing flags
  trayBuilt: boolean;
  setTrayBuilt: (value: boolean) => void;
  // Custom user-created dishes
  customDishes: Dish[];
  addCustomDish: (dish: Dish) => void;
  updateCustomDish: (id: string, updates: Partial<Dish>) => void;
  removeCustomDish: (id: string) => void;
  // Roommate sharing
  roommateLink: RoommateLink | null;
  roommateSuggestions: RoommateSuggestion[];
  generateRoommateLink: () => Promise<void>;
  revokeRoommateLink: () => Promise<void>;
  fetchRoommateSuggestions: () => Promise<void>;
  approveSuggestion: (id: string) => Promise<void>;
  rejectSuggestion: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isLoggedIn: initialAuth.isLoggedIn,
      authReady: initialAuth.isLoggedIn,
      token: null,
      deviceId: generateDeviceId(),
      user: initialAuth.user as User | null,
      trayLibrary: { breakfast: [], lunch: [], dinner: [], snacks: [] },
      swaps: {},
      notifications: [],
      trayEditSession: null,
      dishes: [],
      toast: null,
      pendingMutations: [],
      deadLetterMutations: [],
      smartQueue: { week2: [], favorites: [] },
      trayBuilt: initialAuth.trayBuilt,
      customDishes: [],
      roommateLink: null,
      roommateSuggestions: [],

      setToast: (toast) => set({ toast }),

      // FIX: Atomic login function that sets both isLoggedIn and user in one operation
      // This prevents race conditions where updateProfile reads stale isLoggedIn=false
      login: (username: string) => {
        console.log('[Store] login called, username:', username);
        // Generate a stable internal ID for this user session
        const userId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newUser = {
          id: userId,
          username: username,
          primaryId: userId.slice(0, 8),
          systemId: userId.slice(0, 8),
        } as User;
        
        set((state) => ({
          ...state,
          isLoggedIn: true,
          authReady: true,
          user: newUser,
        }));
        
        // FIX: Immediately persist auth state to dedicated storage
        saveAuth({ isLoggedIn: true, trayBuilt: false, user: newUser });
        console.log('[Store] login complete, userId:', userId);
      },

      updateProfile: (updates: Partial<User>) => {
        console.log('[Store] updateProfile called, updates:', Object.keys(updates));
        set((state) => {
          const newUser = {
            ...(state.user ?? {}),
            ...updates,
          } as User;
          // FIX: Spread entire state to preserve ALL fields (isLoggedIn, trayLibrary, etc.)
          return {
            ...state,
            user: newUser,
          };
        });
        // FIX: Sync user profile to dedicated auth storage to prevent onboarding loop
        const currentUser = get().user;
        if (currentUser) {
          saveAuth({ isLoggedIn: true, trayBuilt: get().trayBuilt, user: currentUser });
        }
      },

      setUser: (user: User) => set({ user, isLoggedIn: true }),

      setToken: (token: string) => set({ token }),

      clearToken: () => set({ token: null, isLoggedIn: false }),

      addToPantry: (items: string[]) => set((state) => {
        const existingStaples = state.user?.pantryStaples ?? [];
        const existing = new Set(existingStaples);
        let changed = false;
        for (const item of items) {
          const normalized = item.trim();
          if (normalized && !existing.has(normalized)) {
            existing.add(normalized);
            changed = true;
          }
        }
        if (!changed) return state;
        const updatedUser = { ...(state.user ?? {}), pantryStaples: [...existing] };
        return { user: updatedUser };
      }),

      logout: () => {
        // Clear cross-store mutable state to prevent stale data leaking to next user
        const ds = _getDrainState();
        if (ds.timer) clearTimeout(ds.timer);
        ds.timer = null;
        ds.isRetrying = false;
        ds.tracker.cancelAll();
        requestDedupCache.clear();
        // M1: Clear meal resolution cache on logout — prevents User A's data leaking to User B
        _MEAL_RESOLUTION_CACHE.clear();
        // Notify TrayStore to clear its debounce timers (avoids circular import)
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('store:logout'));
        
        // FIX: Clear dedicated auth storage
        clearAuth();
        
        set({
          isLoggedIn: false,
          authReady: true,
          token: null,
          user: null,
          swaps: {},
          notifications: [],
          trayEditSession: null,
          pendingMutations: [],
          deadLetterMutations: [],
          smartQueue: { week2: [], favorites: [] },
      trayLibrary: initialTrayLibrary,
      trayBuilt: false,
          customDishes: [],
          roommateLink: null,
          roommateSuggestions: [],
        });
      },

      addToTray: (slot: string, meal: MealOption) =>
        set((state) => {
          const key = slot.toLowerCase() as keyof TrayLibrary;
          const tray = state.trayLibrary[key] || [];
          const existing = tray.find(m => m.id === meal.id);
          if (existing) {
            if (existing.name === meal.name && existing.icon === meal.icon) return state;
            const updated = tray.map(m => m.id === meal.id ? { ...m, name: meal.name, icon: meal.icon, sourceRegion: meal.sourceRegion ?? m.sourceRegion } : m);
            _MEAL_RESOLUTION_CACHE.clear();
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('pantry:invalidate'));
            return { trayLibrary: { ...state.trayLibrary, [key]: updated } };
          }
          _MEAL_RESOLUTION_CACHE.clear();
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('pantry:invalidate'));
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
          _MEAL_RESOLUTION_CACHE.clear();
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('pantry:invalidate'));
          return {
            trayLibrary: {
              ...state.trayLibrary,
              [key]: (state.trayLibrary[key] || []).filter(m => m.id !== mealId),
            },
          };
        }),

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
            // M8: Add random suffix to prevent ID collision on rapid swaps within same ms
            id: `${date}-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
        const dedupKey = `plan_${date}_${slot}_${meal.dishId}`;
        try {
          await requestDedupCache.get(dedupKey, 3000, () => api.post('/plan', payload));
          return { ok: true };
        } catch (err: any) {
          if (err?.message?.includes('409') || err?.message?.includes('Conflict')) {
            get().setToast({ message: 'Plan changed elsewhere. Refreshing.', type: 'info' });
            return { ok: false, reason: 'conflict' };
          }
          console.error('[Store] Plan sync failed:', err);
          get().addPendingMutation('plan', payload);
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          get().setToast({
            message: isOffline ? 'Internet broke. Saved locally — will retry.' : 'Server error. Saved locally — will retry.',
            type: 'error',
          });
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
        const dedupKey = `complete_${date}_${slot}_${status}`;
        try {
          await requestDedupCache.get(dedupKey, 3000, () => api.post('/complete', payload));
          return { ok: true };
        } catch (err: any) {
          console.error('[Store] Complete sync failed:', err);
          get().addPendingMutation('complete', payload);
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          get().setToast({
            message: isOffline ? 'Internet broke. Saved locally — will retry.' : 'Server error. Saved locally — will retry.',
            type: 'error',
          });
          return { ok: false, reason: err?.message ?? 'Sync failed' };
        }
      },

      addPendingMutation: (kind, payload) => {
        // H3: Dedup key includes all identifying fields:
        // - 'plan': date + slot + mealId
        // - 'complete': date + slot + status (cooked/missed/skipped)
        const dedupKey = kind === 'plan'
          ? `${payload.date ?? ''}::${payload.slot ?? ''}::${payload.mealId ?? ''}`
          : `${payload.date ?? ''}::${payload.slot ?? ''}::${payload.status ?? ''}`;
        set((state) => {
          const existingIdx = state.pendingMutations.findIndex(m =>
            m.kind === kind && `${(m.payload as any).date ?? ''}::${(m.payload as any).slot ?? ''}::${kind === 'plan' ? (m.payload as any).mealId ?? '' : (m.payload as any).status ?? ''}` === dedupKey
          );

          let next: PendingMutation[];
          if (existingIdx >= 0) {
            next = state.pendingMutations.map((m, i) =>
              i === existingIdx ? { ...m, payload, addedAt: Date.now() } : m
            );
          } else {
            next = [
              ...state.pendingMutations,
              { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind, payload, addedAt: Date.now(), retryCount: 0 },
            ];
          }
          return { pendingMutations: next };
        });
        if (typeof window !== 'undefined' && !_getDrainState().timer) {
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

      // M4: Retry dead letter mutations — preserves retryCount to prevent infinite retry loops
      retryDeadLetters: async () => {
        const state = get();
        const { deadLetterMutations, addPendingMutation } = state;
        if (deadLetterMutations.length === 0) return;

        // Move back to pending WITHOUT resetting retryCount — server will verify
        for (const mutation of deadLetterMutations) {
          addPendingMutation(mutation.kind, { ...mutation.payload });
        }
        set({ deadLetterMutations: [] });
        get().setToast({ message: `Retrying ${deadLetterMutations.length} failed operation(s)…`, type: 'info' });

        // Trigger immediate drain
        if (typeof window !== 'undefined' && !_getDrainState().timer) {
          _scheduleDrain();
        }
        // Force drain now if online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          await get().drainPendingMutations();
        }
      },

      drainPendingMutations: async () => {
        const state = get();
        const { pendingMutations, removePendingMutation, moveToDeadLetter } = state;
        if (pendingMutations.length === 0) return;
        if (_getDrainState().isRetrying) return;
        _getDrainState().isRetrying = true;
        const requestId = _getDrainState().tracker.start();
        // C2: Snapshot mutation IDs to iterate — logout() clears the array mid-drain
        const mutationIds = pendingMutations.map(m => m.id);
        for (const id of mutationIds) {
          if (!_getDrainState().tracker.isCurrent(requestId)) break;
          // Re-read mutation from current state (may have been removed by concurrent operations)
          const current = get().pendingMutations.find(m => m.id === id);
          if (!current) continue;
          try {
            const endpoint = current.kind === 'plan' ? '/plan' : '/complete';
            await api.post(endpoint, current.payload);
            removePendingMutation(id);
          } catch (err: any) {
            const msg = err?.message ?? '';
            if (msg.includes('401') || msg.includes('Unauthorized')) {
              // C2: Logout clears ALL pendingMutations — break immediately, don't mutate mid-iteration
              state.logout();
              state.setToast({ message: 'Session expired. Log in again.', type: 'error' });
              break;
            }
            if (msg.includes('409') || msg.includes('Conflict')) {
              removePendingMutation(id);
              break;
            }
            const nextCount = current.retryCount + 1;
            if (nextCount >= MAX_RETRIES) {
              moveToDeadLetter({ ...current, retryCount: nextCount });
            } else {
              set((s) => ({
                pendingMutations: s.pendingMutations.map((m) =>
                  m.id === id ? { ...m, retryCount: nextCount } : m
                ),
              }));
            }
          }
        }
        _getDrainState().isRetrying = false;
      },

      // Smart Queue actions
      addToQueue: (meal: MealOption, queue: 'week2' | 'favorites') =>
        set((state) => {
          const currentQueue = state.smartQueue[queue];
          if (currentQueue.find(m => m.id === meal.id)) return state;
          return {
            smartQueue: {
              ...state.smartQueue,
              [queue]: [...currentQueue, meal],
            },
          };
        }),

      removeFromQueue: (mealId: string, queue: 'week2' | 'favorites') =>
        set((state) => ({
          smartQueue: {
            ...state.smartQueue,
            [queue]: state.smartQueue[queue].filter(m => m.id !== mealId),
          },
        })),

      restoreFromQueue: (mealId: string, queue: 'week2' | 'favorites') => {
        const state = get();
        const meal = state.smartQueue[queue].find(m => m.id === mealId) || null;
        return { meal };
      },

      moveToTrayFromQueue: (meal: MealOption) =>
        set((state) => {
          const slotKey = (meal.mealContext || 'lunch').toLowerCase() as keyof TrayLibrary;
          const tray = state.trayLibrary[slotKey] || [];
          if (tray.find(m => m.id === meal.id)) return state;
          return {
            trayLibrary: {
              ...state.trayLibrary,
              [slotKey]: [...tray, meal],
            },
            smartQueue: {
              week2: state.smartQueue.week2.filter(m => m.id !== meal.id),
              favorites: state.smartQueue.favorites.filter(m => m.id !== meal.id),
            },
          };
        }),

      setTrayBuilt: (value: boolean) => {
        set({ trayBuilt: value });
        saveAuth({ isLoggedIn: get().isLoggedIn, trayBuilt: value, user: get().user });
      },

      addCustomDish: (dish) => set((s) => ({
        customDishes: [...s.customDishes.filter(d => d.id !== dish.id), dish],
      })),
      updateCustomDish: (id, updates) => set((s) => ({
        customDishes: s.customDishes.map(d => d.id === id ? { ...d, ...updates } : d),
      })),
      removeCustomDish: (id) => set((s) => ({
        customDishes: s.customDishes.filter(d => d.id !== id),
      })),

      // ─── Roommate Actions ──────────────────────────────────────────────────
      generateRoommateLink: async () => {
        try {
          const res = await api.post<RoommateLink>('/roommates/link/generate');
          set({ roommateLink: { ...res, linkId: res.linkId || res.id, isActive: true } });
          get().setToast({ message: 'Magic link generated! Share it with your roommates.', type: 'success' });
        } catch {
          get().setToast({ message: 'Failed to generate link. Try again.', type: 'error' });
        }
      },

      revokeRoommateLink: async () => {
        const link = get().roommateLink;
        if (!link) return;
        try {
          await api.delete(`/roommates/link/${link.linkId || link.id}`);
          set({ roommateLink: null });
          get().setToast({ message: 'Link revoked.', type: 'success' });
        } catch {
          get().setToast({ message: 'Failed to revoke link.', type: 'error' });
        }
      },

      fetchRoommateSuggestions: async () => {
        try {
          const res = await api.get<RoommateSuggestion[]>('/roommates/suggestions');
          set({ roommateSuggestions: res });
        } catch {
          console.warn('[Store] Failed to fetch roommate suggestions');
        }
      },

      approveSuggestion: async (id) => {
        try {
          await api.patch(`/roommates/suggestion/${id}`, { status: 'approved' });
          get().fetchRoommateSuggestions();
          window.dispatchEvent(new Event('pantry:invalidate'));
        } catch {
          get().setToast({ message: 'Failed to approve suggestion.', type: 'error' });
        }
      },

      rejectSuggestion: async (id) => {
        try {
          await api.patch(`/roommates/suggestion/${id}`, { status: 'rejected' });
          get().fetchRoommateSuggestions();
        } catch {
          get().setToast({ message: 'Failed to reject suggestion.', type: 'error' });
        }
      },
    }),
    {
      name: 'mealdrama-store',
      // ⛔ FREEZE: Do NOT bump this version unless you are adding/removing persisted fields.
      // Bumping triggers migrate() which can drop auth state and force users through onboarding again.
      version: 11,
      storage: nativeStorage,
      // FIX: Explicit partialize to ensure ALL critical fields are saved
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        authReady: state.authReady,
        user: state.user,
        token: state.token,
        deviceId: state.deviceId,
        trayLibrary: state.trayLibrary,
        // dishes NOT persisted — always loaded fresh from DISH_LIBRARY module
        swaps: state.swaps,
        trayBuilt: state.trayBuilt,
        smartQueue: state.smartQueue,
        customDishes: state.customDishes,
        roommateLink: state.roommateLink,
        roommateSuggestions: state.roommateSuggestions,
        // Don't persist: toast, notifications, pendingMutations, deadLetterMutations, trayEditSession
      }),
      migrate: (persistedState: unknown, fromVersion: number) => {
        console.log('[Store] Migrating from version', fromVersion);
        const state = persistedState as Record<string, unknown>;

        if (!state || typeof state !== 'object') {
          console.warn('[Store] Invalid persisted state, resetting');
          return persistedState;
        }

        // APK downgrade guard: if persisted state is newer than code, skip migration
        if (fromVersion > 10) {
          console.warn('[Store] Persisted state (v' + fromVersion + ') is newer than code — ignoring migration to prevent crash');
          return persistedState;
        }

        // Preserve critical auth/session fields through ANY migration
        const savedAuth = {
          isLoggedIn: state.isLoggedIn,
          authReady: state.authReady,
          user: state.user,
          deviceId: state.deviceId,
          token: state.token,
        };

        if (fromVersion < 1) {
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
          const mutations = state.pendingMutations as Array<Record<string, unknown>> | undefined;
          if (mutations) {
            for (const m of mutations) {
              if (!('retryCount' in m)) m.retryCount = 0;
            }
          }
        }
        if (fromVersion < 4) {
          state.smartQueue = { week2: [], favorites: [] };
        }
        if (fromVersion < 5) {
          const trayLib = state.trayLibrary as Record<string, unknown[]> | undefined;
          const hasItems = trayLib ? Object.values(trayLib).some(arr => arr && arr.length > 0) : false;
          state.trayBuilt = hasItems;
        }
        if (fromVersion < 6) {
          state.customDishes = [];
        }
        if (fromVersion < 7) {
          // v6 already set customDishes — v7 was a duplicate, kept for version continuity
        }
        if (fromVersion < 8) {
          // v7 → v8: DO NOT reset auth state — preserve user session across reloads
          // Only reset on explicit logout, not during migration
          console.log('[Store] v8 migration: preserving auth state');
        }
        if (fromVersion < 9) {
          // v8 → v9: dishes no longer persisted — load fresh from DISH_LIBRARY
          const { DISH_LIBRARY } = require('../constants/dishLibrary');
          state.dishes = Array.isArray(DISH_LIBRARY) ? DISH_LIBRARY : [];
          console.log('[Store] v9 migration: loaded dishes from DISH_LIBRARY, count=', state.dishes.length);
        }
        if (fromVersion < 10) {
          // v9 → v10: migrate JWT token from localStorage to Zustand store
          try {
            const stored = localStorage.getItem('mealdrama-token');
            if (stored) {
              state.token = stored;
              console.log('[Store] v10 migration: migrated token from localStorage');
            }
          } catch {
            // localStorage unavailable, ignore
          }
        }
        if (fromVersion < 11) {
          // v10 → v11: initialize authReady to true (hydration complete)
          state.authReady = true;
          console.log('[Store] v11 migration: initialized authReady=true');
        }

        // Restore critical auth/session fields that must survive any migration
        // Prevents accidental logout/onboarding-reset from version bumps
        if (savedAuth.isLoggedIn !== undefined) state.isLoggedIn = savedAuth.isLoggedIn;
        if (savedAuth.authReady !== undefined) state.authReady = savedAuth.authReady;
        if (savedAuth.user !== undefined) {
          state.user = savedAuth.user;
        } else if (state.user) {
          // Ensure onboardingComplete is explicitly preserved
          const u = state.user as Record<string, unknown> | null;
          if (u && u.onboardingComplete === undefined) u.onboardingComplete = true;
        }
        if (savedAuth.deviceId !== undefined) state.deviceId = savedAuth.deviceId;
        if (savedAuth.token !== undefined) state.token = savedAuth.token;

        console.log('[Store] Migration complete, isLoggedIn:', state.isLoggedIn, 'trayLibrary items:', Object.values((state.trayLibrary as any) || {}).reduce((sum: number, arr: any[]) => sum + (arr?.length || 0), 0));
        return persistedState as Parameters<typeof persist>[0] extends (s: infer S) => unknown ? S : never;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[Store] Hydration failed, clearing corrupted storage:', error);
          try { localStorage.removeItem('mealdrama-store'); } catch {}
        } else if (state) {
          // FIX: Ensure deviceId always exists after hydration
          if (!state.deviceId) {
            state.deviceId = generateDeviceId();
          }
          // FIX: authReady is true once hydration is complete, regardless of login status
          // This allows the LoginScreen to render for non-logged-in users
          state.authReady = true;
          
          // FIX: Sync hydrated state to dedicated auth storage to prevent onboarding loop
          if (state.isLoggedIn && state.user) {
            saveAuth({ isLoggedIn: true, trayBuilt: state.trayBuilt, user: state.user });
          }
          
          const trayLib = state.trayLibrary || {};
          const trayTotal = Object.values(trayLib).reduce((sum: number, arr: any[]) => sum + (arr?.length || 0), 0);
          console.log('[Store] Hydrated: isLoggedIn=', state.isLoggedIn, 'authReady=', state.authReady, 'user.id=', state.user?.id, 'trayLibrary=', trayTotal, 'dishes=', state.dishes?.length);
          setAuthReady(true);
        }
      },
    }
  )
);

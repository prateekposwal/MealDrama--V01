// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray API Layer — Mock implementation matching real Cloud Run contracts
// ─────────────────────────────────────────────────────────────────────────────

import api from './api';

// ─── Types matching API Contracts ───────────────────────────────────────────

export interface SuggestionMeal {
  id: string;
  name: string;
  icon: string;
  region: string;
  type: string;
  prepMinutes: number;
  defaultGravy?: string;
  defaultRoti?: string;
  defaultRice?: string;
  defaultSides: string[];
  defaultBeverages: string[];
}

export interface SuggestionResponse {
  suggestions: SuggestionMeal[];
  source: 'api' | 'cache';
}

export interface AddSlotPayload {
  meal_id: string;
  quantity: number;
  defaults?: Record<string, unknown>;
}

export interface AddSlotResponse {
  item_id: string;
  success: boolean;
}

export interface UpdateItemPayload {
  meal_id?: string;
  name?: string;
  quantity?: number;
  gravy?: string;
  roti?: string;
  rice?: string;
  sides?: string[];
  beverages?: string[];
  servings?: number;
}

export interface CustomizeSlotPayload {
  items: Array<{
    mealId?: string;
    customDishId?: string;
    quantity: number;
    gravyStyle?: string;
    rotiType?: string;
    riceType?: string;
    sides: string[];
    beverages: string[];
    sortOrder?: number;
  }>;
  isOverride?: boolean;
}

export interface CustomizeSlotResponse {
  success: boolean;
  slot: any;
}

export interface GuestModePayload {
  start: string;
  end: string;
  extra_servings: number;
}

export interface GuestModeResponse {
  applied_days: number;
  success: boolean;
}

// ─── Offline Queue ──────────────────────────────────────────────────────────

const OFFLINE_QUEUE_KEY = 'mealdrama_offline_v2';

export interface QueuedAction {
  id: string;
  type: 'add' | 'swap' | 'update' | 'remove';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export const offlineQueue = {
  _drainAbort: null as AbortController | null,

  get(): QueuedAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) {
    const queue = this.get();
    const newAction: QueuedAction = {
      ...action,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return newAction;
  },

  remove(id: string) {
    const queue = this.get().filter(a => a.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  abortDrain() {
    this._drainAbort?.abort();
    this._drainAbort = null;
  },

  async drain(signal?: AbortSignal): Promise<{ synced: number; failed: number }> {
    this._drainAbort = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => this._drainAbort!.abort());
    }
    const queue = this.get();
    if (queue.length === 0 || !navigator.onLine) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const action of queue) {
      if (this._drainAbort.signal.aborted) break;
      if (!navigator.onLine) {
        this._drainAbort = null;
        return { synced, failed };
      }
      try {
        switch (action.type) {
          case 'add':
            await trayApi.addSlotItem(action.payload.slotId as string, action.payload.item as AddSlotPayload);
            break;
          case 'swap':
          case 'update':
            await trayApi.updateItem(action.payload.itemId as string, action.payload as UpdateItemPayload);
            break;
          case 'remove':
            await trayApi.removeItem(action.payload.itemId as string);
            break;
        }
        this.remove(action.id);
        synced++;
      } catch {
        if (action.retryCount >= 3) {
          this.remove(action.id);
          failed++;
        } else {
          const updated = this.get().map(a =>
            a.id === action.id ? { ...a, retryCount: a.retryCount + 1 } : a
          );
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
          failed++;
        }
      }
    }

    this._drainAbort = null;
    return { synced, failed };
  },
};

// ─── Simulated Network ──────────────────────────────────────────────────────

const simulateDelay = (ms = 300, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms + Math.random() * 200);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(new DOMException('Aborted', 'AbortError'));
  });
});
const simulateFailure = () => typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production' && Math.random() < 0.03;

// ─── API Implementation ─────────────────────────────────────────────────────

export const trayApi = {
  /**
   * PATCH /tray/slot/:date/:slot/customize
   * Apply swap & customize changes to a slot.
   * Sets is_override flag so rotation engine skips this slot.
   */
  async customizeSlot(slotId: string, payload: CustomizeSlotPayload, signal?: AbortSignal): Promise<CustomizeSlotResponse> {
    await simulateDelay(300, signal);
    if (simulateFailure()) throw new Error('Network error');

    return { success: true, slot: { id: slotId, items: payload.items } };
  },
  /**
   * GET /meals?meal_type=lunch&diet=veg&region=north&pantry=rice,onion
   * Returns 3 context-aware suggestions from DB.
   */
   async getSuggestions(params: {
    mealType: string;
    diet: string;
    region: string;
    pantry?: string[];
    signal?: AbortSignal;
  }): Promise<SuggestionResponse> {
    await simulateDelay(400, params.signal);
    // No random failure — suggestions must be reliable

    const regionKey = params.region.toLowerCase();
    const userDiet = params.diet.toLowerCase();

    // All dishes organized by meal type, region, and diet
    const allDefaults: Record<string, SuggestionMeal[]> = {
      breakfast: [
        { id: 'aloo-paratha', name: 'Aloo Paratha', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 20, defaultRoti: 'Paratha', defaultBeverages: ['Chai'], defaultSides: ['Curd'] },
        { id: 'idli', name: 'Idli', icon: '⚪', region: 'South India', type: 'veg', prepMinutes: 15, defaultSides: ['Sambhar', 'Coconut Chutney'], defaultBeverages: ['Filter Coffee'] },
        { id: 'poha', name: 'Poha', icon: '🍚', region: 'West India', type: 'veg', prepMinutes: 10, defaultSides: ['Peanuts'], defaultBeverages: ['Chai'] },
        { id: 'besan_chilla_north', name: 'Besan Chilla', icon: '🥞', region: 'North India', type: 'veg', prepMinutes: 12, defaultSides: ['Green Chutney'], defaultBeverages: [] },
        { id: 'suji_chilla_north', name: 'Suji Chilla', icon: '🥞', region: 'North India', type: 'veg', prepMinutes: 10, defaultSides: ['Green Chutney'], defaultBeverages: [] },
        { id: 'avocado-sandwich', name: 'Avocado Sandwich', icon: '🥑', region: 'West India', type: 'veg', prepMinutes: 8, defaultSides: [], defaultBeverages: [] },
        { id: 'egg-bhurji', name: 'Egg Bhurji', icon: '🥚', region: 'North India', type: 'eggitarian', prepMinutes: 10, defaultRoti: 'Phulka', defaultSides: ['Toast'], defaultBeverages: ['Chai'] },
        { id: 'masala-dosa', name: 'Masala Dosa', icon: '🥞', region: 'South India', type: 'veg', prepMinutes: 20, defaultSides: ['Sambhar', 'Coconut Chutney'], defaultBeverages: ['Filter Coffee'] },
      ],
      lunch: [
        { id: 'rajma-chawal', name: 'Rajma Chawal', icon: '🍛', region: 'North India', type: 'veg', prepMinutes: 25, defaultRice: 'Plain', defaultSides: ['Salad', 'Pickle'], defaultBeverages: ['Chaas'] },
        { id: 'sambar-rice', name: 'Sambar Rice', icon: '🍚', region: 'South India', type: 'veg', prepMinutes: 20, defaultRice: 'Plain', defaultSides: ['Papad'], defaultBeverages: ['Chaas'] },
        { id: 'dal-tadka', name: 'Dal Tadka', icon: '🥘', region: 'North India', type: 'veg', prepMinutes: 18, defaultRice: 'Jeera', defaultRoti: 'Phulka', defaultSides: ['Salad'], defaultBeverages: ['Chaas'] },
        { id: 'chicken-curry', name: 'Chicken Curry', icon: '🍗', region: 'North India', type: 'non-veg', prepMinutes: 30, defaultRice: 'Plain', defaultRoti: 'Naan', defaultSides: ['Salad'], defaultBeverages: ['Chaas'] },
        { id: 'fish-curry', name: 'Fish Curry', icon: '🐟', region: 'East India', type: 'non-veg', prepMinutes: 25, defaultRice: 'Plain', defaultSides: ['Salad'], defaultBeverages: [] },
        { id: 'veg-biryani', name: 'Veg Biryani', icon: '🍚', region: 'South India', type: 'veg', prepMinutes: 35, defaultSides: ['Raita'], defaultBeverages: ['Chaas'] },
        { id: 'kadhi-chawal', name: 'Kadhi Chawal', icon: '🥣', region: 'North India', type: 'veg', prepMinutes: 20, defaultRice: 'Plain', defaultSides: ['Pickle'], defaultBeverages: [] },
      ],
      snacks: [
        { id: 'samosa', name: 'Samosa', icon: '🥟', region: 'North India', type: 'veg', prepMinutes: 25, defaultSides: ['Green Chutney'], defaultBeverages: ['Chai'] },
        { id: 'masala-tea', name: 'Masala Chai', icon: '🍵', region: 'North India', type: 'veg', prepMinutes: 5, defaultSides: [], defaultBeverages: [] },
        { id: 'bhel-puri', name: 'Bhel Puri', icon: '🥗', region: 'West India', type: 'veg', prepMinutes: 10, defaultSides: [], defaultBeverages: [] },
        { id: 'moong_dal_chilla_south', name: 'Moong Dal Chilla', icon: '🥞', region: 'South India', type: 'veg', prepMinutes: 12, defaultSides: ['Coconut Chutney'], defaultBeverages: [] },
        { id: 'avocado-sandwich', name: 'Avocado Sandwich', icon: '🥑', region: 'West India', type: 'veg', prepMinutes: 8, defaultSides: [], defaultBeverages: [] },
        { id: 'egg-roll', name: 'Egg Roll', icon: '🌯', region: 'East India', type: 'eggitarian', prepMinutes: 10, defaultSides: ['Onion'], defaultBeverages: ['Chai'] },
        { id: 'paneer-tikka', name: 'Paneer Tikka', icon: '🧀', region: 'North India', type: 'veg', prepMinutes: 20, defaultSides: ['Green Chutney'], defaultBeverages: [] },
      ],
      dinner: [
        { id: 'paneer-butter', name: 'Paneer Butter Masala', icon: '🧀', region: 'North India', type: 'veg', prepMinutes: 22, defaultGravy: 'Curry', defaultRoti: 'Naan', defaultSides: ['Raita'], defaultBeverages: ['Lassi'] },
        { id: 'dal-makhani', name: 'Dal Makhani', icon: '🥘', region: 'North India', type: 'veg', prepMinutes: 30, defaultRoti: 'Tandoori Naan', defaultSides: ['Salad'], defaultBeverages: ['Lassi'] },
        { id: 'roti-sabzi', name: 'Roti Sabzi', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 15, defaultRoti: 'Phulka', defaultSides: ['Salad'], defaultBeverages: [] },
        { id: 'chicken-tikka', name: 'Chicken Tikka', icon: '🍗', region: 'North India', type: 'non-veg', prepMinutes: 30, defaultSides: ['Salad', 'Onion'], defaultBeverages: [] },
        { id: 'veg-kolhapuri', name: 'Veg Kolhapuri', icon: '🍛', region: 'West India', type: 'veg', prepMinutes: 25, defaultRoti: 'Bhakri', defaultSides: ['Salad'], defaultBeverages: [] },
        { id: 'curd-rice', name: 'Curd Rice', icon: '🍚', region: 'South India', type: 'veg', prepMinutes: 10, defaultSides: ['Pickle', 'Papad'], defaultBeverages: [] },
      ],
    };

    const pool = allDefaults[params.mealType] || [];

    // Filter by diet preference
    const dietAllowed = userDiet === 'all' || userDiet === 'non-veg'
      ? ['veg', 'non-veg', 'eggitarian', 'vegan']
      : userDiet === 'veg'
        ? ['veg', 'vegan']
        : userDiet === 'vegan'
          ? ['vegan', 'veg']
          : userDiet === 'eggitarian'
            ? ['veg', 'eggitarian', 'vegan']
            : ['veg'];

    const dietFiltered = pool.filter(m => dietAllowed.includes(m.type));

    // Prioritize user's region, then fill with others
    const regionMatch = dietFiltered.filter(m => m.region.toLowerCase().includes(regionKey.split(' ')[0]));
    const regionOther = dietFiltered.filter(m => !m.region.toLowerCase().includes(regionKey.split(' ')[0]));

    // Take up to 3 from region match, fill rest from others
    const suggestions = [...regionMatch, ...regionOther].slice(0, 3);

    return { suggestions, source: 'api' };
  },

  /**
   * POST /tray/slots/:slotId/items
   * { meal_id, quantity, defaults }
   */
  async addSlotItem(slotId: string, payload: AddSlotPayload, signal?: AbortSignal): Promise<AddSlotResponse> {
    await simulateDelay(300, signal);
    if (simulateFailure()) throw new Error('Network error');

    return {
      item_id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      success: true,
    };
  },

  /**
   * PATCH /tray/items/:id
   * { meal_id?, quantity?, gravy?, roti?, rice?, sides[], beverages[] }
   */
  async updateItem(itemId: string, payload: UpdateItemPayload, signal?: AbortSignal): Promise<{ success: boolean }> {
    await simulateDelay(200, signal);
    if (simulateFailure()) throw new Error('Network error');

    return { success: true };
  },

  /**
   * DELETE /tray/items/:id
   */
  async removeItem(itemId: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    await simulateDelay(200, signal);
    if (simulateFailure()) throw new Error('Network error');

    return { success: true };
  },

  /**
   * POST /tray/guest-mode
   * { start, end, extra_servings }
   */
  async setGuestMode(payload: GuestModePayload, signal?: AbortSignal): Promise<GuestModeResponse> {
    await simulateDelay(400, signal);
    if (simulateFailure()) throw new Error('Network error');

    const start = new Date(payload.start);
    const end = new Date(payload.end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { applied_days: Math.max(0, days), success: true };
  },

  /**
   * POST /tray/complete — mark a slot as completed
   */
  async completeSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    await simulateDelay(200, signal);
    if (simulateFailure()) throw new Error('Network error');
    try {
      await api.post('/tray/complete', { date, mealType }, { signal });
    } catch {
      // In mock/dev mode, endpoint may not exist — swallow gracefully.
      // In production, this routes through api.ts with auth headers.
    }
    return { success: true };
  },

  /**
   * POST /api/tray/skip — mark a slot as skipped
   */
  async skipSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    await simulateDelay(200, signal);
    if (simulateFailure()) throw new Error('Network error');
    try {
      await api.post('/tray/skip', { date, mealType }, { signal });
    } catch {
      // In mock/dev mode, endpoint may not exist — swallow gracefully.
    }
    return { success: true };
  },
};

// ─── Cached Fallbacks ───────────────────────────────────────────────────────

const CACHE_KEY = 'mealdrama_suggestions_cache';

export const suggestionCache = {
  get(mealType: string): SuggestionMeal[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: Record<string, SuggestionMeal[]> = JSON.parse(raw);
      return cache[mealType] || null;
    } catch {
      return null;
    }
  },

  set(mealType: string, suggestions: SuggestionMeal[]) {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const cache: Record<string, SuggestionMeal[]> = raw ? JSON.parse(raw) : {};
      cache[mealType] = suggestions;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore
    }
  },

   /** Get suggestions with cache fallback */
  async getWithFallback(params: { mealType: string; diet: string; region: string; pantry?: string[] }): Promise<SuggestionResponse> {
    try {
      const result = await trayApi.getSuggestions(params);
      // Cache successful results
      try {
        suggestionCache.set(params.mealType, result.suggestions);
      } catch (cacheErr) {
      console.warn('[Suggestions] Cache set failed:', cacheErr);
      }
      return result;
    } catch (err) {
      console.log('[Suggestions] API failed, trying cache:', err);
      // Fallback to cache
      const cached = suggestionCache.get(params.mealType);
      if (cached) {
        console.log('[Suggestions] Cache hit:', cached.length, 'items');
        return { suggestions: cached, source: 'cache' };
      }
      console.log('[Suggestions] Cache miss, using inline defaults');
      // Ultimate fallback: hardcoded defaults (no network call — just return inline defaults)
      const fallbackDefaults: Record<string, SuggestionMeal[]> = {
        breakfast: [
          { id: 'aloo-paratha', name: 'Aloo Paratha', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 20, defaultRoti: 'Paratha', defaultBeverages: ['Chai'], defaultSides: ['Curd'] },
          { id: 'idli', name: 'Idli', icon: '⚪', region: 'South India', type: 'veg', prepMinutes: 15, defaultSides: ['Sambhar', 'Coconut Chutney'], defaultBeverages: ['Filter Coffee'] },
          { id: 'poha', name: 'Poha', icon: '🍚', region: 'West India', type: 'veg', prepMinutes: 10, defaultSides: ['Peanuts'], defaultBeverages: ['Chai'] },
        ],
        lunch: [
          { id: 'rajma-chawal', name: 'Rajma Chawal', icon: '🍛', region: 'North India', type: 'veg', prepMinutes: 25, defaultRice: 'Plain', defaultSides: ['Salad', 'Pickle'], defaultBeverages: ['Chaas'] },
          { id: 'sambar-rice', name: 'Sambar Rice', icon: '🍚', region: 'South India', type: 'veg', prepMinutes: 20, defaultRice: 'Plain', defaultSides: ['Papad'], defaultBeverages: ['Chaas'] },
          { id: 'dal-tadka', name: 'Dal Tadka', icon: '🥘', region: 'North India', type: 'veg', prepMinutes: 18, defaultRice: 'Jeera', defaultRoti: 'Phulka', defaultSides: ['Salad'], defaultBeverages: ['Chaas'] },
        ],
        snacks: [
          { id: 'samosa', name: 'Samosa', icon: '🥟', region: 'North India', type: 'veg', prepMinutes: 25, defaultSides: ['Green Chutney'], defaultBeverages: ['Chai'] },
          { id: 'masala-tea', name: 'Masala Chai', icon: '🍵', region: 'North India', type: 'veg', prepMinutes: 5, defaultSides: [], defaultBeverages: [] },
          { id: 'bhel-puri', name: 'Bhel Puri', icon: '🥗', region: 'West India', type: 'veg', prepMinutes: 10, defaultSides: [], defaultBeverages: [] },
        ],
        dinner: [
          { id: 'paneer-butter', name: 'Paneer Butter Masala', icon: '🧀', region: 'North India', type: 'veg', prepMinutes: 22, defaultGravy: 'Curry', defaultRoti: 'Naan', defaultSides: ['Raita'], defaultBeverages: ['Lassi'] },
          { id: 'dal-makhani', name: 'Dal Makhani', icon: '🥘', region: 'North India', type: 'veg', prepMinutes: 30, defaultRoti: 'Tandoori Naan', defaultSides: ['Salad'], defaultBeverages: ['Lassi'] },
          { id: 'roti-sabzi', name: 'Roti Sabzi', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 15, defaultRoti: 'Phulka', defaultSides: ['Salad'], defaultBeverages: [] },
        ],
      };
      const defaults = fallbackDefaults[params.mealType] || [];
      // Cache the fallback so next time it loads instantly
      suggestionCache.set(params.mealType, defaults);
      return { suggestions: defaults.slice(0, 3), source: 'cache' };
    }
  },
};

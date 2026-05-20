// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray API Layer — Mock implementation matching real Cloud Run contracts
// ─────────────────────────────────────────────────────────────────────────────

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

  async drain(): Promise<{ synced: number; failed: number }> {
    const queue = this.get();
    if (queue.length === 0 || !navigator.onLine) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const action of queue) {
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
const simulateFailure = () => Math.random() < 0.03;

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
    if (simulateFailure()) throw new Error('Network error');

    // In production: return actual DB query results
    // Mock: return context-aware suggestions
    const suggestions: SuggestionMeal[] = [];
    const regionKey = params.region.toLowerCase();

    // Real dishes from dish library would be fetched here
    const contextDefaults: Record<string, SuggestionMeal[]> = {
      breakfast: [
        { id: 'aloo-paratha', name: 'Aloo Paratha', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 20, defaultRoti: 'Paratha', defaultBeverages: ['Chai'], defaultSides: ['Curd'] },
        { id: 'idli', name: 'Idli', icon: '⚪', region: 'South India', type: 'veg', prepMinutes: 15, defaultSides: ['Sambhar', 'Coconut Chutney'], defaultBeverages: ['Filter Coffee'] },
        { id: 'poha', name: 'Poha', icon: '🍚', region: 'West India', type: 'veg', prepMinutes: 10, defaultSides: ['Peanuts'], defaultBeverages: ['Chai'] },
        { id: 'besan_chilla_north', name: 'Besan Chilla', icon: '🥞', region: 'North India', type: 'veg', prepMinutes: 12, defaultSides: ['Green Chutney'], defaultBeverages: [] },
        { id: 'suji_chilla_north', name: 'Suji Chilla', icon: '🥞', region: 'North India', type: 'veg', prepMinutes: 10, defaultSides: ['Green Chutney'], defaultBeverages: [] },
        { id: 'avocado-sandwich', name: 'Avocado Sandwich', icon: '🥑', region: 'West India', type: 'veg', prepMinutes: 8, defaultSides: [], defaultBeverages: [] },
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
        { id: 'moong_dal_chilla_south', name: 'Moong Dal Chilla', icon: '🥞', region: 'South India', type: 'veg', prepMinutes: 12, defaultSides: ['Coconut Chutney'], defaultBeverages: [] },
        { id: 'avocado-sandwich', name: 'Avocado Sandwich', icon: '🥑', region: 'West India', type: 'veg', prepMinutes: 8, defaultSides: [], defaultBeverages: [] },
      ],
      dinner: [
        { id: 'paneer-butter', name: 'Paneer Butter Masala', icon: '🧀', region: 'North India', type: 'veg', prepMinutes: 22, defaultGravy: 'Curry', defaultRoti: 'Naan', defaultSides: ['Raita'], defaultBeverages: ['Lassi'] },
        { id: 'dal-makhani', name: 'Dal Makhani', icon: '🥘', region: 'North India', type: 'veg', prepMinutes: 30, defaultRoti: 'Tandoori Naan', defaultSides: ['Salad'], defaultBeverages: ['Lassi'] },
        { id: 'roti-sabzi', name: 'Roti Sabzi', icon: '🫓', region: 'North India', type: 'veg', prepMinutes: 15, defaultRoti: 'Phulka', defaultSides: ['Salad'], defaultBeverages: [] },
      ],
    };

    const meals = contextDefaults[params.mealType as keyof typeof contextDefaults] || [];
    suggestions.push(...meals);

    return { suggestions: suggestions.slice(0, 3), source: 'api' };
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
    await fetch('/api/tray/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, mealType }),
      signal,
    });
    return { success: true };
  },

  /**
   * POST /api/tray/skip — mark a slot as skipped
   */
  async skipSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    await simulateDelay(200, signal);
    if (simulateFailure()) throw new Error('Network error');
    await fetch('/api/tray/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, mealType }),
      signal,
    });
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
      suggestionCache.set(params.mealType, result.suggestions);
      return result;
    } catch {
      // Fallback to cache
      const cached = suggestionCache.get(params.mealType);
      if (cached) {
        return { suggestions: cached, source: 'cache' };
      }
      // Ultimate fallback: hardcoded defaults
      const defaults = trayApi.getSuggestions({ mealType: params.mealType, diet: 'veg', region: 'north' }).catch(() => ({ suggestions: [], source: 'cache' }));
      return { suggestions: (await defaults).suggestions.slice(0, 3), source: 'cache' };
    }
  },
};

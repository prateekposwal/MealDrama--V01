// ─────────────────────────────────────────────────────────────────────────────
// MealDrama Tray API Layer — Live backend with offline fallback
// ─────────────────────────────────────────────────────────────────────────────

import api from '../../lib/api';

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
  dessert?: string[];
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
const QUEUE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface QueuedAction {
  id: string;
  type: 'add' | 'swap' | 'update' | 'remove' | 'loop_save';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  expiresAt: number;
}

// Dependency ordering: 'add' must succeed before 'swap'/'update'/'remove' for same item
const TYPE_PRIORITY: Record<string, number> = { add: 0, swap: 1, update: 1, remove: 2 };

/** Compute a dedup key for a queued action's payload */
function dedupKeyFor(type: string, payload: Record<string, unknown>): string {
  const date = payload.date as string | undefined;
  const mealType = payload.mealType as string | undefined;
  const itemId = payload.itemId as string | undefined;
  if (date && mealType) return `${type}::${date}::${mealType}`;
  return `${type}::${itemId ?? ''}`;
}

export const offlineQueue = {
  get(): QueuedAction[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) return [];
      const queue: QueuedAction[] = JSON.parse(raw);
      // Filter out expired actions
      const now = Date.now();
      const valid = queue.filter(a => a.expiresAt > now);
      if (valid.length !== queue.length) {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(valid));
      }
      return valid;
    } catch {
      console.warn('[TrayAPI] Offline queue read failed, returning empty');
      return [];
    }
  },

  add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'expiresAt'>) {
    const queue = this.get();
    // H3: Dedup by itemId + type — prevents duplicate mutations for same item
    const dedupKey = `${action.type}_${(action.payload as Record<string, unknown>).itemId ?? (action.payload as Record<string, unknown>).slotId ?? ''}`;
    const existingIdx = queue.findIndex(a =>
      a.type === action.type &&
      `${(a.payload as Record<string, unknown>).itemId ?? (a.payload as Record<string, unknown>).slotId ?? ''}` === dedupKey.split('_').slice(1).join('_')
    );
    if (existingIdx >= 0) {
      // Update existing entry with latest payload instead of adding duplicate
      queue[existingIdx] = {
        ...queue[existingIdx]!,
        payload: action.payload,
        timestamp: Date.now(),
        retryCount: 0,
        expiresAt: Date.now() + QUEUE_EXPIRY_MS,
      };
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return queue[existingIdx]!;
    }
    const newAction: QueuedAction = {
      ...action,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      retryCount: 0,
      expiresAt: Date.now() + QUEUE_EXPIRY_MS,
    };
    queue.push(newAction);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return newAction;
  },

  hasPending(type: string, key?: string): boolean {
    const queue = this.get();
    return queue.some(a => {
      if (a.type !== type) return false;
      if (key === undefined) return true;
      const p = a.payload as Record<string, unknown>;
      const actionKey =
        p.date && p.mealType
          ? `${p.date}::${p.mealType}`
          : (p.itemId as string | undefined) ?? '';
      return actionKey === key;
    });
  },

  addUnique(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'expiresAt'>): QueuedAction | null {
    const queue = this.get();
    const key = dedupKeyFor(action.type, action.payload as Record<string, unknown>);
    // H3a: Skip if a pending action with the same dedup key already exists
    if (queue.some(a => dedupKeyFor(a.type, a.payload as Record<string, unknown>) === key)) {
      return null;
    }
    const newAction: QueuedAction = {
      ...action,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      retryCount: 0,
      expiresAt: Date.now() + QUEUE_EXPIRY_MS,
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

  async drain(): Promise<{ synced: number; failed: number; retryable: number }> {
    const queue = this.get();
    if (queue.length === 0 || !navigator.onLine) return { synced: 0, failed: 0, retryable: 0 };

    // H10: Sort by dependency order — 'add' before 'swap'/'update' before 'remove'
    const sorted = [...queue].sort((a, b) => {
      const priorityDiff = (TYPE_PRIORITY[a.type] ?? 0) - (TYPE_PRIORITY[b.type] ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    let synced = 0;
    let failed = 0;
    let retryable = 0;
    // H2: Collect successful IDs — only remove AFTER entire drain completes
    // This prevents data loss if app crashes mid-drain
    const successIds: string[] = [];
    const retryIncrements: Map<string, number> = new Map();

    for (const action of sorted) {
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
        successIds.push(action.id);
        synced++;
      } catch {
        if (action.retryCount >= 3) {
          failed++; // exhausted — will be removed below
        } else {
          retryIncrements.set(action.id, action.retryCount + 1);
          retryable++;
        }
      }
    }

    // H2: Atomic update — remove all successful + exhausted actions in one write
    const updatedQueue = queue.filter(a => {
      if (successIds.includes(a.id)) return false; // synced — remove
      if (failed > 0 && a.retryCount >= 3 && !successIds.includes(a.id) && !retryIncrements.has(a.id)) return false; // exhausted — remove
      return true;
    }).map(a => {
      // Increment retry count for retryable actions
      const newCount = retryIncrements.get(a.id);
      return newCount ? { ...a, retryCount: newCount } : a;
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));

    return { synced, failed, retryable };
  },
};

// ─── API Implementation ─────────────────────────────────────────────────────

function parseSlotId(slotId: string): { date: string; mealType: string } {
  const parts = slotId.split('::');
  return { date: parts[0] ?? '', mealType: (parts[1] ?? '').toLowerCase() };
}

export const trayApi = {
  /**
   * PATCH /tray/slot/:date/:slot/customize
   * Apply swap & customize changes to a slot.
   */
  async customizeSlot(slotId: string, payload: CustomizeSlotPayload, signal?: AbortSignal): Promise<CustomizeSlotResponse> {
    const { date, mealType } = parseSlotId(slotId);
    try {

      return await api.patch<CustomizeSlotResponse>(`/tray/slot/${date}/${mealType}/customize`, payload, { signal });
    } catch (err) {
      console.warn('[TrayApi] customizeSlot failed, using fallback:', err);
      return { success: true, slot: { id: slotId, items: payload.items } };
    }
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
    const { mealType, diet, region, pantry, signal } = params;
    const qs = new URLSearchParams({ meal_type: mealType.toLowerCase(), diet, region });
    if (pantry?.length) qs.set('pantry', pantry.join(','));
    try {

      const meals = await api.get<Array<Record<string, unknown>>>(`/meals?${qs.toString()}`, { signal });
      const suggestions: SuggestionMeal[] = meals.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        name: m.name as string,
        icon: (m.icon as string) ?? '🍽️',
        region: (m.region as string) ?? params.region,
        type: (m.type as string) ?? 'veg',
        prepMinutes: (m.prepMinutes as number) ?? 15,
        defaultGravy: m.defaultGravy as string | undefined,
        defaultRoti: m.defaultRoti as string | undefined,
        defaultRice: m.defaultRice as string | undefined,
        defaultSides: (m.defaultSides as string[]) ?? [],
        defaultBeverages: (m.defaultBeverages as string[]) ?? [],
      }));
      return { suggestions: suggestions.slice(0, 3), source: 'api' };
    } catch (err) {
      console.warn('[TrayApi] getSuggestions failed, using fallback:', err);
      return getFallbackSuggestions(params.mealType);
    }
  },

  /**
   * POST /tray/slot/:date/:slot/items
   */
  async addSlotItem(slotId: string, payload: AddSlotPayload, signal?: AbortSignal): Promise<AddSlotResponse> {
    const { date, mealType } = parseSlotId(slotId);
    try {

      const result = await api.post<Record<string, unknown>>(`/tray/slot/${date}/${mealType}/items`, payload, { signal });
      return {
        item_id: (result.id as string) ?? `item_${Date.now()}`,
        success: true,
      };
    } catch (err) {
      console.warn('[TrayApi] addSlotItem failed, using fallback:', err);
      return {
        item_id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        success: true,
      };
    }
  },

  /**
   * PATCH /tray/item/:itemId
   */
  async updateItem(itemId: string, payload: UpdateItemPayload, signal?: AbortSignal): Promise<{ success: boolean }> {
    try {

      await api.patch(`/tray/item/${itemId}`, payload, { signal });
    } catch (err) {
      console.warn('[TrayApi] updateItem failed, using fallback:', err);
    }
    return { success: true };
  },

  /**
   * DELETE /tray/item/:itemId
   */
  async removeItem(itemId: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    try {

      await api.delete(`/tray/item/${itemId}`, undefined, { signal });
    } catch (err) {
      console.warn('[TrayApi] removeItem failed, using fallback:', err);
    }
    return { success: true };
  },

  /**
   * POST /tray/guest-mode
   */
  async setGuestMode(payload: GuestModePayload, signal?: AbortSignal): Promise<GuestModeResponse> {
    try {

      await api.post('/tray/guest-mode', payload, { signal });
    } catch (err) {
      console.warn('[TrayApi] setGuestMode failed, using fallback:', err);
    }
    const start = new Date(payload.start);
    const end = new Date(payload.end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { applied_days: Math.max(0, days), success: true };
  },

  /**
   * POST /complete — mark a slot as completed (cooked)
   */
  async completeSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    try {

      await api.post('/complete', { date, slot: mealType.toLowerCase(), status: 'cooked' }, { signal });
    } catch (err) {
      console.warn('[TrayApi] completeSlot failed, using fallback:', err);
    }
    return { success: true };
  },

  /**
   * POST /complete — mark a slot as skipped
   */
  async skipSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    try {

      await api.post('/complete', { date, slot: mealType.toLowerCase(), status: 'skipped' }, { signal });
    } catch (err) {
      console.warn('[TrayApi] skipSlot failed, using fallback:', err);
    }
    return { success: true };
  },

  /**
   * DELETE /complete/:date/:slot — unmark a completed/skipped slot
   */
  async unskipSlot(date: string, mealType: string, signal?: AbortSignal): Promise<{ success: boolean }> {
    try {

      await api.delete(`/complete/${date}/${mealType.toLowerCase()}`, undefined, { signal });
    } catch (err) {
      console.warn('[TrayApi] unskipSlot failed, using fallback:', err);
    }
    return { success: true };
  },
};

// ─── Fallback suggestion data when backend unreachable ──────────────────────

function getFallbackSuggestions(mealType: string): SuggestionResponse {
  const contextDefaults: Record<string, SuggestionMeal[]> = {
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
    ],
  };
  return { suggestions: (contextDefaults[mealType.toLowerCase()] ?? []).slice(0, 3), source: 'cache' };
}

// ─── Cached Fallbacks ───────────────────────────────────────────────────────

const CACHE_KEY = 'mealdrama_suggestions_cache';
const SUGGESTION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // M4: 24h TTL — stale dishes auto-expire

interface CachedSuggestions {
  suggestions: SuggestionMeal[];
  cachedAt: number;
}

export const suggestionCache = {
  cacheKey(mealType: string, region: string, diet: string): string {
    return `${mealType}_${region}_${diet}`;
  },

  get(mealType: string, region: string, diet: string): SuggestionMeal[] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: Record<string, CachedSuggestions> = JSON.parse(raw);
      const key = this.cacheKey(mealType, region, diet);
      const entry = cache[key];
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > SUGGESTION_CACHE_TTL_MS) {
        delete cache[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      return entry.suggestions;
    } catch {
      return null;
    }
  },

  set(mealType: string, region: string, diet: string, suggestions: SuggestionMeal[]) {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const cache: Record<string, CachedSuggestions> = raw ? JSON.parse(raw) : {};
      const key = this.cacheKey(mealType, region, diet);
      cache[key] = { suggestions, cachedAt: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore
    }
  },

  async getWithFallback(params: { mealType: string; diet: string; region: string; pantry?: string[] }): Promise<SuggestionResponse> {
    try {
      const result = await trayApi.getSuggestions(params);
      suggestionCache.set(params.mealType, params.region, params.diet, result.suggestions);
      return result;
    } catch {
      const cached = suggestionCache.get(params.mealType, params.region, params.diet);
      if (cached) {
        return { suggestions: cached, source: 'cache' };
      }
      return { suggestions: [], source: 'cache' };
    }
  },
};

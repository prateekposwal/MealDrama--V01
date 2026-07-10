type EventMap = {
  'meal:added': { date: string; mealType: string; itemId: string; dishId: string };
  'meal:removed': { date: string; mealType: string; itemId: string };
  'meal:swapped': { date: string; mealType: string; itemId: string; oldDishId: string; newDishId: string };
  'meal:completed': { date: string; mealType: string };
  'meal:skipped': { date: string; mealType: string };
  'slot:filled': { date: string; mealType: string; filledCount: number };
  'loop:changed': { configId: string | null };
  'pantry:updated': { items: string[] };
  'plan:period_changed': { period: string };
};

type Listener<T> = (payload: T) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn as Listener<unknown>);
    return () => { this.listeners.get(event)?.delete(fn as Listener<unknown>); };
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(payload); } catch { /* swallow listener errors */ }
    });
  }

  off<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(fn as Listener<unknown>);
  }

  clear(event?: keyof EventMap): void {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }

  listenerCount(event?: keyof EventMap): number {
    if (event) return this.listeners.get(event)?.size ?? 0;
    let total = 0;
    for (const set of this.listeners.values()) total += set.size;
    return total;
  }
}

export const eventBus = new EventBus();

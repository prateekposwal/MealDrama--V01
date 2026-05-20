// ─────────────────────────────────────────────────────────────────────────────
// Event Bus — Decouples useTrayStore and useStore
// ─────────────────────────────────────────────────────────────────────────────

type EventName =
  | 'tray:mealAdded'
  | 'tray:mealRemoved'
  | 'tray:mealSwapped'
  | 'pantry:invalidate'
  | 'user:profileUpdated'
  | 'user:logout';

type Listener = (...args: unknown[]) => void;

const _listeners = new Map<EventName, Set<Listener>>();

export const eventBus = {
  on(event: EventName, fn: Listener) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event)!.add(fn);
    return () => _listeners.get(event)?.delete(fn);
  },

  off(event: EventName, fn: Listener) {
    _listeners.get(event)?.delete(fn);
  },

  emit(event: EventName, ...args: unknown[]) {
    _listeners.get(event)?.forEach(fn => fn(...args));
  },

  clear() {
    _listeners.clear();
  },
};

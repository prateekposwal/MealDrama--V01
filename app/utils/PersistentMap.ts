/**
 * A Map wrapper that serializes/deserializes automatically for Zustand persist.
 *
 * On serialization, JSON.stringify calls toJSON() → returns entries array.
 * On deserialization, use rehydrateMap() in migrate/merge to restore the Map.
 *
 * Usage:
 *   // Serialization (partialize):
 *   overrides: new PersistentMap(state.overrides)
 *
 *   // Deserialization (migrate):
 *   overrides: rehydrateMap(persisted.overrides)
 */
export class PersistentMap<K, V> extends Map<K, V> {
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries ?? []);
  }

  toJSON(): [K, V][] {
    return Array.from(this.entries());
  }
}

/**
 * A Set wrapper that serializes/deserializes automatically for Zustand persist.
 */
export class PersistentSet<T> extends Set<T> {
  toJSON(): T[] {
    return Array.from(this.values());
  }
}

/** Reconstruct a Map from persisted data (handles array, Map, or Record forms) */
export function rehydrateMap<K, V>(data: unknown): PersistentMap<K, V> {
  if (data instanceof PersistentMap || data instanceof Map) return data as PersistentMap<K, V>;
  if (Array.isArray(data)) return new PersistentMap<K, V>(data as [K, V][]);
  if (data && typeof data === 'object') return new PersistentMap<K, V>(Object.entries(data as Record<string, V>) as [K, V][]);
  return new PersistentMap<K, V>();
}

/** Reconstruct a Set from persisted data */
export function rehydrateSet<T>(data: unknown): PersistentSet<T> {
  if (data instanceof PersistentSet || data instanceof Set) return data as PersistentSet<T>;
  if (Array.isArray(data)) return new PersistentSet<T>(data);
  return new PersistentSet<T>();
}

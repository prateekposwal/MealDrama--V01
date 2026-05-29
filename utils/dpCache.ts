let _stateHash = '';

export function computeStateHash(...inputs: unknown[]): string {
  return JSON.stringify(inputs.map(i => {
    if (Array.isArray(i)) return i.sort();
    return i;
  }));
}

export function invalidateOnChange(...inputs: unknown[]): boolean {
  const newHash = computeStateHash(...inputs);
  if (newHash !== _stateHash) {
    _stateHash = newHash;
    return true; // state changed, caches should be cleared
  }
  return false; // no change
}

export function getStateHash(): string {
  return _stateHash;
}

export function clearStateHash() {
  _stateHash = '';
}

export class DpCache<T> {
  private cache = new Map<string, { value: T; stateHash: string }>();
  private maxSize: number;

  constructor(maxSize = 200) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.stateHash !== _stateHash) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, stateHash: _stateHash });
  }

  get size() { return this.cache.size; }

  clear() { this.cache.clear(); }
}

import { LRUCache } from './LRUCache';

let _stateHash = '';

export function computeStateHash(...inputs: unknown[]): string {
  return JSON.stringify(inputs.map(i => {
    if (Array.isArray(i)) return [...i].sort();
    return i;
  }));
}

export function invalidateOnChange(...inputs: unknown[]): boolean {
  const newHash = computeStateHash(...inputs);
  if (newHash !== _stateHash) {
    _stateHash = newHash;
    return true;
  }
  return false;
}

export function getStateHash(): string {
  return _stateHash;
}

export function clearStateHash() {
  _stateHash = '';
}

const _TTL_MS = 5 * 60 * 1000;

export class DpCache<T> {
  private cache: LRUCache<string, { value: T; stateHash: string }>;

  constructor(maxSize = 200) {
    this.cache = new LRUCache({ maxSize, ttl: _TTL_MS });
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
    this.cache.set(key, { value, stateHash: _stateHash });
  }

  get size() { return this.cache.size; }

  clear() { this.cache.clear(); }
}

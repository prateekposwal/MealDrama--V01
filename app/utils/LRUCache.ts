export interface LRUCacheOptions {
  maxSize: number;
  ttl?: number;
}

export class LRUCache<K, V> {
  private cache = new Map<K, { value: V; ts: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(opts: LRUCacheOptions) {
    this.maxSize = opts.maxSize;
    this.ttl = opts.ttl ?? 0;
  }

  get size(): number { return this.cache.size; }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (this.ttl > 0 && Date.now() - entry.ts > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, ts: Date.now() });
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

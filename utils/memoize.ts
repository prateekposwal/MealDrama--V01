// ─────────────────────────────────────────────────────────────────────────────
// Simple memoization utilities for performance-critical paths
// ─────────────────────────────────────────────────────────────────────────────

// Single-argument memoization with LRU cache
export function memoize<T extends (arg: string) => R, R>(fn: T, maxSize = 100): T {
  const cache = new Map<string, R>();
  return ((arg: string) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value as string | undefined;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(arg, result);
    return result;
  }) as T;
}

// Multi-argument memoization with composite key
export function memoizeMulti<T extends (...args: string[]) => R, R>(fn: T, maxSize = 50): T {
  const cache = new Map<string, R>();
  return ((...args: string[]) => {
    const key = args.join('|');
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value as string | undefined;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(key, result);
    return result;
  }) as T;
}

// Debounce utility for config changes
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

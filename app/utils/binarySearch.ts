export function lowerBound<T>(arr: T[], value: T, key: (item: T) => string): number {
  let lo = 0;
  let hi = arr.length;
  const v = typeof value === 'string' ? value : String(value);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (key(arr[mid]!) < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function upperBound<T>(arr: T[], value: T, key: (item: T) => string): number {
  let lo = 0;
  let hi = arr.length;
  const v = typeof value === 'string' ? value : String(value);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (key(arr[mid]!) <= v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const DATE_CACHE = new Map<string, number>();

export function clearDateCache() {
  DATE_CACHE.clear();
}

function cacheKey(d: string): number {
  let v = DATE_CACHE.get(d);
  if (v === undefined) {
    v = new Date(d).getTime();
    DATE_CACHE.set(d, v);
  }
  return v;
}

export function daysBetweenFast(a: string, b: string): number {
  return Math.round((cacheKey(b) - cacheKey(a)) / 86400000);
}

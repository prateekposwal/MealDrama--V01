import type { Dish } from '../meal/constants/dishLibrary';

const _weakMapCache = new WeakMap<Dish[], Map<string, Dish>>();

export function toDishMap(dishes?: Dish[]): Map<string, Dish> {
  if (!dishes) return new Map();
  const cached = _weakMapCache.get(dishes);
  if (cached) return cached;
  const map = new Map<string, Dish>();
  for (const d of dishes) map.set(d.id, d);
  _weakMapCache.set(dishes, map);
  return map;
}

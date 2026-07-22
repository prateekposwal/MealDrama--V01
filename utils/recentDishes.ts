/**
 * Recently Used Dishes — tracks last N dishes added for quick access.
 * Persisted to localStorage, boosted in search results.
 */

const STORAGE_KEY = 'mealdrama_recent_dishes';
const MAX_RECENT = 10;

export interface RecentDish {
  id: string;
  name: string;
  icon: string;
  region: string;
  addedAt: number;
}

export function getRecentDishes(): RecentDish[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentDish[];
  } catch {
    return [];
  }
}

export function addRecentDish(dish: { id: string; name: string; icon?: string; region?: string }) {
  try {
    const recent = getRecentDishes().filter(d => d.id !== dish.id);
    recent.unshift({
      id: dish.id,
      name: dish.name,
      icon: dish.icon || '',
      region: dish.region || '',
      addedAt: Date.now(),
    });
    if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {}
}

export function clearRecentDishes() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

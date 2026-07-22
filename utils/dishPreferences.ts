/**
 * Dish Preferences — tracks user dish preferences for personalized search boosting.
 * Persisted to localStorage. Boosts preferred dishes in search ranking.
 */

const STORAGE_KEY = 'mealdrama_dish_preferences';

export interface DishPreferences {
  preferredDishIds: string[];
  preferredTags: Record<string, number>;
  totalMeals: number;
}

export function getDishPreferences(): DishPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { preferredDishIds: [], preferredTags: {}, totalMeals: 0 };
    return JSON.parse(raw);
  } catch {
    return { preferredDishIds: [], preferredTags: {}, totalMeals: 0 };
  }
}

export function recordDishAdded(dishId: string, tags: string[] = []) {
  try {
    const prefs = getDishPreferences();
    // Track dish frequency
    if (!prefs.preferredDishIds.includes(dishId)) {
      prefs.preferredDishIds.unshift(dishId);
    } else {
      const idx = prefs.preferredDishIds.indexOf(dishId);
      prefs.preferredDishIds.splice(idx, 1);
      prefs.preferredDishIds.unshift(dishId);
    }
    // Keep top 20
    if (prefs.preferredDishIds.length > 20) {
      prefs.preferredDishIds.length = 20;
    }
    // Track tag frequency
    for (const tag of tags) {
      prefs.preferredTags[tag] = (prefs.preferredTags[tag] || 0) + 1;
    }
    prefs.totalMeals++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function getPreferenceBoost(dishId: string, tags: string[] = []): number {
  try {
    const prefs = getDishPreferences();
    if (prefs.totalMeals === 0) return 0;
    let boost = 0;
    // Dish frequency boost
    const idx = prefs.preferredDishIds.indexOf(dishId);
    if (idx !== -1) {
      boost += Math.max(0, 8 - idx * 0.5);
    }
    // Tag preference boost
    for (const tag of tags) {
      const count = prefs.preferredTags[tag] || 0;
      if (count > 2) boost += 2;
    }
    return Math.min(boost, 15);
  } catch {
    return 0;
  }
}

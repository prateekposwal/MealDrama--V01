// ─────────────────────────────────────────────────────────────────────────────
// Suggestion Utilities — Shared conversion functions for API → app types
// ─────────────────────────────────────────────────────────────────────────────

import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../app/lib/trayApi';
import { DISH_LIBRARY, type Region } from '../meal/constants/dishLibrary';

/**
 * Convert SuggestionMeal (API response) to Meal (defaults engine input).
 * Resolves to a real dish ID from DISH_LIBRARY so that "Build Your Plate"
 * and future lookups can find the dish by meal_id.
 * Normalizes region string to Region type.
 */
export function suggestionToMeal(s: SuggestionMeal): Meal {
  const match = DISH_LIBRARY.find(d => d.name.toLowerCase() === s.name.toLowerCase())
    || DISH_LIBRARY.find(d => d.name.toLowerCase().startsWith(s.name.toLowerCase()) && (d.name.length === s.name.length || d.name[s.name.length] === ' ' || d.name[s.name.length] === '('))
    || DISH_LIBRARY.find(d => s.name.toLowerCase().startsWith(d.name.toLowerCase()) && (s.name.length === d.name.length || s.name[d.name.length] === ' ' || s.name[d.name.length] === '('));
  return {
    id: match?.id ?? s.id,
    name: s.name,
    icon: match?.icon ?? s.icon,
    region: normalizeRegion(s.region) as 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast',
    baseGravy: s.defaultGravy,
    rotiOptions: s.defaultRoti ? [s.defaultRoti] : undefined,
    riceOptions: s.defaultRice ? [s.defaultRice] : undefined,
    suggestedPairings: {
      sides: s.defaultSides,
      beverages: s.defaultBeverages,
    },
  };
}

/**
 * Normalize region string to Region type.
 */
export function normalizeRegion(region: string): Region {
  const lower = region.toLowerCase();
  if (lower.includes('south')) return 'south';
  if (lower.includes('east')) return 'east';
  if (lower.includes('west')) return 'west';
  if (lower.includes('central')) return 'central';
  if (lower.includes('north east') || lower.includes('northeast')) return 'northeast';
  return 'north';
}

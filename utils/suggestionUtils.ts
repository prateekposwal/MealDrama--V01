// ─────────────────────────────────────────────────────────────────────────────
// Suggestion Utilities — Shared conversion functions for API → app types
// ─────────────────────────────────────────────────────────────────────────────

import type { Meal } from '../types/tray';
import type { SuggestionMeal } from '../lib/trayApi';
import type { Region } from '../constants/dishLibrary';

/**
 * Convert SuggestionMeal (API response) to Meal (defaults engine input).
 * Normalizes region string to Region type.
 */
export function suggestionToMeal(s: SuggestionMeal): Meal {
  return {
    id: s.id,
    name: s.name,
    icon: s.icon,
    region: normalizeRegion(s.region),
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

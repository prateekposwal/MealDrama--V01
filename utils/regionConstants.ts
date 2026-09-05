// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL STATE → REGION map — the single source of truth for "which region
// does this Indian state/UT belong to" across every food-region feature.
// Consumers (tray sourceRegion, region strips, member plans, diet quotas,
// keepRegionTrayItems) must resolve a dish's states ONLY through this map.
//
// POLICY DECISIONS (documented, this is the source of truth):
//   • Rajasthan → 'north'  (North Indian cuisine grouping; Rājasthāni thali)
//   • Gujarat / Maharashtra / Goa → 'west'
//   • Sikkim → 'northeast' (Himalayan food family, matches existing tagging)
//   • Bihar / Jharkhand / Odisha / West Bengal → 'east'
//   • Madhya Pradesh / Chhattisgarh → 'central'
//   • Cities are resolved to their state's region (Bangalore→Karnataka→south).
// Number keys seen in seed data are listed explicitly so a new dish's
// `states[]` entry is either here or FAILS validation.
// ─────────────────────────────────────────────────────────────────────────────
import type { Region } from '../meal/constants/dishLibrary';

export const STATE_REGION: Record<string, Region> = {
  // north
  'Jammu & Kashmir': 'north',
  'Kashmir': 'north',
  'Himachal Pradesh': 'north',
  'Punjab': 'north',
  'Haryana': 'north',
  'Uttarakhand': 'north',
  'Uttar Pradesh': 'north',
  'Delhi': 'north',
  'Lucknow': 'north',
  'Rajasthan': 'north',
  'Jaipur': 'north',
  // central
  'Madhya Pradesh': 'central',
  'Chhattisgarh': 'central',
  // east
  'Bihar': 'east',
  'Jharkhand': 'east',
  'Odisha': 'east',
  'West Bengal': 'east',
  'Kolkata': 'east',
  // northeast
  'Arunachal Pradesh': 'northeast',
  'Assam': 'northeast',
  'Manipur': 'northeast',
  'Meghalaya': 'northeast',
  'Mizoram': 'northeast',
  'Nagaland': 'northeast',
  'Tripura': 'northeast',
  'Sikkim': 'northeast', // documented policy: Himalayan food family, keep NE
  'Ladakh': 'northeast',
  'Nepal': 'northeast',
  // west
  'Gujarat': 'west',
  'Maharashtra': 'west',
  'Goa': 'west',
  'Mumbai': 'west',
  'Pune': 'west',
  'Ahmedabad': 'west',
  // south
  'Andhra Pradesh': 'south',
  'Telangana': 'south',
  'Karnataka': 'south',
  'Kerala': 'south',
  'Tamil Nadu': 'south',
  'Bangalore': 'south',
  'Chennai': 'south',
  'Hyderabad': 'south',
};

/** Resolve a state/territory/city name to its canonical region. */
export function regionForState(state: string): Region | null {
  const key = state.trim();
  return STATE_REGION[key] ?? null;
}

/** True when every entry in `states` belongs to `region` (or the dish is 'all'). */
export function statesMatchRegion(region: Region, states: string[]): boolean {
  if (region === 'all') return true;
  return states.every(s => regionForState(s) === region);
}

/** All known states/territories/cities used in the seed, for discovery. */
export const ALL_REGION_KEYS = Object.keys(STATE_REGION);
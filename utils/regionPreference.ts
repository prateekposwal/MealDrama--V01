/**
 * Region-priority ordering helpers — canonical home for "region first, then nearest region".
 *
 * REGION_PRIORITY is an ORDERING heuristic only. It NEVER filters or excludes:
 * any dish from any region remains selectable and searchable. Users are always
 * free to add whatever dish they want (search relevance dominates when a query
 * is present; region priority only orders the browse list and tie-breaks).
 */

import type { Region } from '../meal/constants/dishLibrary';
import type { NormalizedRegion } from '../types/identity';

/** Culinary/geographic adjacency — nearest neighbors first after the exact region. */
export const REGION_PROXIMITY: Record<string, Region[]> = {
  north: ['north', 'west', 'central', 'east', 'northeast', 'south'],
  west: ['west', 'north', 'central', 'south', 'east', 'northeast'],
  central: ['central', 'north', 'west', 'east', 'south', 'northeast'],
  east: ['east', 'northeast', 'central', 'north', 'west', 'south'],
  northeast: ['northeast', 'east', 'central', 'north', 'south', 'west'],
  south: ['south', 'west', 'central', 'east', 'northeast', 'north'],
};

/** Priority of a dish region relative to the user region. Lower = shown first. */
export function regionPriority(regionKey: string, dishRegion?: string): number {
  const r = (dishRegion ?? '').toLowerCase();
  const key = (regionKey ?? '').toLowerCase();
  if (r === 'all') return 3; // regional-generic sits after exact + neighbors
  if (r === key) return 0; // exact match — highest
  const order = REGION_PROXIMITY[key] as Region[] | undefined;
  if (!order) return 2; // unknown user region — treat as region-agnostic
  const pos = order.indexOf(r as Region);
  return pos === -1 ? order.length + 1 : pos + 1; // nearest = 1, next-nearest = 2, unknown = far
}

/** Comparator: region-first ordering, returns negative when a should precede b. */
export function compareRegion(regionKey: string, aRegion?: string, bRegion?: string): number {
  return regionPriority(regionKey, aRegion) - regionPriority(regionKey, bRegion);
}
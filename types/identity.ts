/**
 * Generate a human-readable primary identity for MealDrama users.
 *
 * Format: PREFIX-MD-YYYYMMDD-HHMMSS-SUFFIX
 * - PREFIX: uppercase name-derived (max 7 chars) or "GUEST"
 * - MD: MealDrama short code
 * - Date: local YYYYMMDD
 * - Time: local HHMMSS
 * - Suffix: 4-char random alphanumeric
 *
 * Generated once at signup and stored as the user's immutable primary ID.
 */
export function generatePrimaryId(name?: string): string {
  const now = new Date();
  const raw = (name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
  const prefix = raw || 'GUEST';
  const y = now.getFullYear().toString();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-MD-${y}${mo}${d}-${h}${mi}${s}-${suffix}`;
}

/**
 * Return a compact display version of the primary ID for use as
 * a default display name (e.g. "Guest-MD-183522").
 */
export function compactPrimaryId(primaryId: string): string {
  const parts = primaryId.split('-');
  if (parts.length < 4) return primaryId;
  const [prefix, _md, _date, time] = parts;
  return `${(prefix ?? '').charAt(0) + (prefix ?? '').slice(1).toLowerCase()}-${time}`;
}

/** Branded type: a region string that has been normalized via getRegionKey() */
export type NormalizedRegion = string & { __brand: 'NormalizedRegion' };

/** Branded type: a health goal string that has been normalized via normalizeGoal() */
export type NormalizedGoal = string & { __brand: 'NormalizedGoal' };

/** Assert that a string is a normalized region (runtime check in dev) */
export function assertNormalizedRegion(s: string): asserts s is NormalizedRegion {
  if (import.meta.env.DEV && s.includes(' ')) {
    console.warn(`[NormalizedRegion] "${s}" contains spaces — likely a raw label, not a normalized key`);
  }
}

/** Assert that a string is a normalized goal (runtime check in dev) */
export function assertNormalizedGoal(s: string): asserts s is NormalizedGoal {
  if (import.meta.env.DEV && s.includes(' ')) {
    console.warn(`[NormalizedGoal] "${s}" contains spaces — likely a raw label, not a normalized key`);
  }
}

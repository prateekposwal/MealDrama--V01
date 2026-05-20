// ─────────────────────────────────────────────────────────────────────────────
// UTC Date Utilities — Timezone-safe ISO date computation
// ─────────────────────────────────────────────────────────────────────────────
// toLocaleDateString('en-CA') produces dates in LOCAL timezone, which causes
// off-by-one errors for users in different timezones (e.g., 11pm UTC-8 sees
// a different "today" than UTC+5:30). All date computations MUST use UTC.

/**
 * Get ISO date string (YYYY-MM-DD) in UTC — the single source of truth
 * for all date comparisons, plan keys, and cache keys.
 */
export function getISODate(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Parse ISO date string to UTC Date at midnight.
 * Reverses getISODate() without timezone ambiguity.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

/**
 * Days between two ISO dates — UTC-based, no timezone offset.
 */
export function daysBetweenISO(a: string, b: string): number {
  const da = parseISODate(a).getTime();
  const db = parseISODate(b).getTime();
  return Math.floor((db - da) / 86400000);
}

/**
 * Add N days to an ISO date — UTC-safe, no DST issues.
 */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return getISODate(d);
}

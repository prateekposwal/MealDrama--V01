// ─────────────────────────────────────────────────────────────────────────────
// IST Date Utilities — Asia/Kolkata timezone for all date computation
// ─────────────────────────────────────────────────────────────────────────────
// MealDrama is an Indian meal-planning app. All "today", "tomorrow", plan dates,
// cache keys, and meal resolutions MUST use IST (Asia/Kolkata) consistently,
// regardless of the user's device timezone.
//
// IST = UTC+5:30, no DST — stable year-round.
//
// Using toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) gives us
// the correct IST date string even if the device is in UTC-8 or UTC+1.

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get ISO date string (YYYY-MM-DD) in IST — the single source of truth
 * for all date comparisons, plan keys, cache keys, and meal resolutions.
 *
 * Example: 2026-05-20 in IST, even if device is in New York (UTC-4).
 */
export function getISODate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
}

/**
 * Parse ISO date string to a Date representing midnight IST.
 * Reverses getISODate() — always returns the same instant regardless of device TZ.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  // Construct in IST: May 20 2026 00:00 IST = May 19 2026 18:30 UTC
  // We use a known-offset approach: IST = UTC+5:30 = +330 minutes
  const utcDate = new Date(Date.UTC(y!, m! - 1, d!, 0, 0, 0, 0));
  // Subtract 5h30m to get the UTC instant that corresponds to midnight IST
  return new Date(utcDate.getTime() - (5 * 60 + 30) * 60 * 1000);
}

/**
 * Days between two ISO dates — IST-based, no DST issues (IST has no DST).
 */
export function daysBetweenISO(a: string, b: string): number {
  const da = parseISODate(a).getTime();
  const db = parseISODate(b).getTime();
  return Math.floor((db - da) / 86400000);
}

/**
 * Add N days to an ISO date — IST-safe.
 */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  // Add days in UTC milliseconds, then re-convert to IST
  const ms = d.getTime() + days * 86400000;
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
}

/**
 * Get the current time in IST as hours:minutes (24h format).
 * C3: Fixed — uses Intl.DateTimeFormat parts to extract IST hours/minutes
 * without locale string parsing ambiguity.
 */
export function getISTTime(): { hours: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return { hours: hour, minutes: minute };
}

/**
 * Check if a given IST time window (start HH:MM – end HH:MM) is currently active.
 */
export function isISTTimeWindowActive(start: string, end: string): boolean {
  const { hours, minutes } = getISTTime();
  const nowMinutes = hours * 60 + minutes;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMinutes = sh! * 60 + sm!;
  const endMinutes = eh! * 60 + em!;
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

/**
 * Check if an IST time window has already passed today.
 */
export function isISTTimeWindowPassed(end: string): boolean {
  const { hours, minutes } = getISTTime();
  const nowMinutes = hours * 60 + minutes;
  const [eh, em] = end.split(':').map(Number);
  const endMinutes = eh! * 60 + em!;
  return nowMinutes >= endMinutes;
}

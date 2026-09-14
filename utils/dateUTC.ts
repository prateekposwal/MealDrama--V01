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
 * Whole days from today until `dateISO` (IST calendar days) — the shared
 * "expires in N d" countdown. Negative when the date is already past.
 * Delegates to daysBetweenISO (the canonical IST whole-day delta) so every
 * countdown in the app shares one math path.
 */
export function daysUntil(dateISO: string, todayISO: string): number {
  return daysBetweenISO(todayISO, dateISO);
}

/**
 * Get the day of week (0=Sunday, 6=Saturday) for an ISO date in IST.
 * Uses IST timezone — NOT the device's local timezone.
 * Avoids the bug where `new Date(isoString).getDay()` returns local-TZ day.
 */
export function getISTDayOfWeek(iso: string): number {
  // The ISO string is an IST date, so midnight IST IS the instant we want —
  // parseISODate() returns exactly that instant regardless of device timezone.
  // THEN read the weekday back through Intl in IST: getDay() alone would
  // report the DEVICE's local weekday (e.g. UTC box sees the prior evening),
  // which is the exact bug this module exists to prevent.
  const dow = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
  }).format(parseISODate(iso));
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dow);
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
export function getISTTime(d: Date = new Date()): { hours: number; minutes: number } {
  // hourCycle: 'h23' (NOT hour12: false) — ECMA-402 lets hour12 override
  // hourCycle, and hour12:false resolves to locale-default h23 OR h24. Some
  // ICU builds pick h24, which formats midnight as "24" and breaks the
  // 18:30Z → 00:00 IST boundary. h23 pins midnight to 00 everywhere.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(d);
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

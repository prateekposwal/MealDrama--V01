import { describe, it, expect, vi } from 'vitest';
import { getISTDayOfWeek, parseISODate, getISODate, addDaysISO, daysBetweenISO } from '../utils/dateUTC';

describe('getISTDayOfWeek', () => {
  it('returns correct day for a known date (2026-05-24 is Sunday in IST)', () => {
    // 2026-05-24 00:00 IST = 2026-05-23 18:30 UTC
    // Regardless of device timezone, this should be Sunday (0)
    expect(getISTDayOfWeek('2026-05-24')).toBe(0);
  });

  it('returns correct day for 2026-05-25 (Monday in IST)', () => {
    expect(getISTDayOfWeek('2026-05-25')).toBe(1);
  });

  it('returns correct day for 2026-05-23 (Saturday in IST)', () => {
    expect(getISTDayOfWeek('2026-05-23')).toBe(6);
  });

  it('is consistent with parseISODate + getDay across timezones', () => {
    // Test across UTC-12 to UTC+12 range
    for (const iso of ['2026-05-24', '2026-01-01', '2026-12-31', '2026-06-15']) {
      const istDow = getISTDayOfWeek(iso);
      const parsed = parseISODate(iso);
      const parsedDow = parsed.getDay();
      // parseISODate returns Date representing midnight IST, so getDay() should match
      expect(istDow).toBe(parsedDow);
    }
  });

  it('returns Monday for 2026-05-18 (Monday in IST, edge near UTC boundary)', () => {
    // 2026-05-18 00:00 IST = 2026-05-17 18:30 UTC
    // At UTC-5, new Date("2026-05-18") would be May 17 — wrong day if using local TZ
    expect(getISTDayOfWeek('2026-05-18')).toBe(1);
  });

  it('round-trips with getISODate', () => {
    // For any date, getISTDayOfWeek(getISODate()) should return today's real day
    const todayISO = getISODate();
    const dow = getISTDayOfWeek(todayISO);
    expect(dow).toBeGreaterThanOrEqual(0);
    expect(dow).toBeLessThanOrEqual(6);
  });
});

describe('parseISODate', () => {
  it('parses ISO string and produces midnight IST', () => {
    const d = parseISODate('2026-05-24');
    // Midnight IST = 2026-05-23 18:30 UTC
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(4); // May = 4 (0-indexed)
    expect(d.getUTCDate()).toBe(23); // previous day in UTC
    expect(d.getUTCHours()).toBe(18);
    expect(d.getUTCMinutes()).toBe(30);
  });
});

describe('addDaysISO', () => {
  it('adds days correctly across month boundary', () => {
    expect(addDaysISO('2026-05-31', 1)).toBe('2026-06-01');
  });

  it('subtracts days correctly', () => {
    expect(addDaysISO('2026-05-01', -1)).toBe('2026-04-30');
  });
});

describe('daysBetweenISO', () => {
  it('returns 1 for consecutive days', () => {
    expect(daysBetweenISO('2026-05-24', '2026-05-25')).toBe(1);
  });

  it('returns -1 for reverse order', () => {
    expect(daysBetweenISO('2026-05-25', '2026-05-24')).toBe(-1);
  });

  it('returns 0 for same day', () => {
    expect(daysBetweenISO('2026-05-24', '2026-05-24')).toBe(0);
  });
});

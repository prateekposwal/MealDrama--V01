import { z } from 'zod';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_VALUES = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
const COMPLETE_STATUS_VALUES = ['cooked', 'missed', 'skipped'] as const;

export const ISO_DATE = z.string().regex(ISO_DATE_REGEX, 'Must be YYYY-MM-DD');
export const Slot = z.enum(SLOT_VALUES);
export const CompleteStatus = z.enum(COMPLETE_STATUS_VALUES);

export function isValidDate(value: string): boolean {
  const d = new Date(value);
  return !isNaN(d.getTime()) && ISO_DATE_REGEX.test(value);
}

export function parseISODate(value: unknown): Date {
  const str = ISO_DATE.parse(value);
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

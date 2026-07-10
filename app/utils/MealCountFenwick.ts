import type { MealType, DayMeals } from '../../types/tray';
import { lowerBound, upperBound } from './binarySearch';

const SLOT_ORDER: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export class MealCountFenwick {
  private dates: string[] = [];
  private bit: number[][] = [];

  /**
   * Build from plan.days Record and PlanIndex (for sorted date list).
   * O(n log n) build cost — build once, query many times with O(log n).
   */
  buildFromDays(days: Record<string, DayMeals>, _dates?: string[]): void {
    this.dates = _dates ?? Object.keys(days).sort();
    const n = this.dates.length;
    if (n === 0) { this.bit = []; return; }
    this.bit = Array.from({ length: n + 1 }, () => [0, 0, 0, 0]);

    for (let i = 0; i < n; i++) {
      const day = days[this.dates[i]!];
      if (!day) continue;
      for (let s = 0; s < 4; s++) {
        const cnt = day[SLOT_ORDER[s]!]?.length ?? 0;
        this._add(i + 1, s, cnt);
      }
    }
  }

  private _add(idx: number, slot: number, delta: number): void {
    const n = this.dates.length;
    const bit = this.bit as (number[] | undefined)[];
    while (idx <= n) {
      const row = bit[idx];
      if (row) row[slot] = (row[slot] ?? 0) + delta;
      idx += idx & -idx;
    }
  }

  private _sum(idx: number, slot: number): number {
    let s = 0;
    const bit = this.bit as (number[] | undefined)[];
    while (idx > 0) {
      const row = bit[idx];
      if (row) s += row[slot] ?? 0;
      idx -= idx & -idx;
    }
    return s;
  }

  /** Count meals of a specific type in [from, to] inclusive — O(log n) */
  count(from: string, to: string, mealType: MealType): number {
    const slot = SLOT_ORDER.indexOf(mealType);
    if (slot === -1) return 0;
    const lo = lowerBound(this.dates, from as any, (d) => d) + 1;
    const hi = upperBound(this.dates, to as any, (d) => d);
    if (lo > hi) return 0;
    return this._sum(hi, slot) - this._sum(lo - 1, slot);
  }

  /** Total meals of all types in [from, to] — O(log n) */
  total(from: string, to: string): number {
    const lo = lowerBound(this.dates, from as any, (d) => d) + 1;
    const hi = upperBound(this.dates, to as any, (d) => d);
    if (lo > hi) return 0;
    let total = 0;
    for (let s = 0; s < 4; s++) {
      total += this._sum(hi, s) - this._sum(lo - 1, s);
    }
    return total;
  }
}

/**
 * Singleton factory — caches fenwick tree per plan days reference.
 * Drop the reference to force rebuild.
 */
let _fenwick: MealCountFenwick | null = null;
let _fenwickDays: Record<string, DayMeals> | null = null;

export function getMealCountFenwick(days: Record<string, DayMeals>, dates?: string[]): MealCountFenwick {
  if (_fenwickDays !== days) {
    _fenwick = new MealCountFenwick();
    _fenwick.buildFromDays(days, dates);
    _fenwickDays = days;
  }
  return _fenwick!;
}

import { lowerBound, upperBound } from './binarySearch';

export interface DateEntry<T> {
  date: string;
  value: T;
}

export class DateIndex<T> {
  private entries: DateEntry<T>[] = [];

  get size(): number { return this.entries.length; }

  /** O(log n) lookup by date */
  get(date: string): T | undefined {
    const i = lowerBound(this.entries, date as any, (e) => e.date);
    if (i < this.entries.length && this.entries[i]!.date === date) {
      return this.entries[i]!.value;
    }
    return undefined;
  }

  /** O(log n + k) range query */
  inRange(from: string, to: string): DateEntry<T>[] {
    const lo = lowerBound(this.entries, from as any, (e) => e.date);
    const hi = upperBound(this.entries, to as any, (e) => e.date);
    return this.entries.slice(lo, hi);
  }

  /** O(n) upsert — replaces value if date exists, inserts sorted if new */
  set(date: string, value: T): void {
    const i = lowerBound(this.entries, date as any, (e) => e.date);
    if (i < this.entries.length && this.entries[i]!.date === date) {
      this.entries[i] = { date, value };
    } else {
      this.entries.splice(i, 0, { date, value });
    }
  }

  /** O(n) delete by date */
  delete(date: string): boolean {
    const i = lowerBound(this.entries, date as any, (e) => e.date);
    if (i < this.entries.length && this.entries[i]!.date === date) {
      this.entries.splice(i, 1);
      return true;
    }
    return false;
  }

  /** Bulk insert — replaces all entries (O(n log n)) */
  load(entries: DateEntry<T>[]): void {
    this.entries = [...entries].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  }

  /** Export for serialization */
  toArray(): DateEntry<T>[] {
    return [...this.entries];
  }
}

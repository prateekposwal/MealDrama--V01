type Signal = 'accept' | 'skip' | 'swap_out' | 'complete' | 'reject';

const SIGNAL_REWARD: Record<Signal, number> = {
  accept: 1.0,
  complete: 0.8,
  skip: -0.3,
  swap_out: -0.5,
  reject: -1.0,
};

interface BanditData {
  counts: Record<string, number>;
  values: Record<string, number>;
  totalPlays: number;
}

const STORAGE_KEY = 'md_preference_bandit';
const EXPLORATION_FACTOR = Math.SQRT2;

function loadData(): BanditData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BanditData;
  } catch {}
  return { counts: {}, values: {}, totalPlays: 0 };
}

function saveData(data: BanditData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export class PreferenceBandit {
  private data: BanditData;

  constructor() {
    this.data = loadData();
  }

  count(dishId: string): number {
    return this.data.counts[dishId] ?? 0;
  }

  value(dishId: string): number {
    return this.data.values[dishId] ?? 0;
  }

  ucbScore(dishId: string): number {
    const count = this.data.counts[dishId] ?? 0;
    const value = this.data.values[dishId] ?? 0;
    if (count === 0) return Infinity;
    const exploration = Math.sqrt(
      (EXPLORATION_FACTOR * Math.log(this.data.totalPlays + 1)) / count,
    );
    return value + exploration;
  }

  select(candidates: string[], topK: number): string[] {
    return [...candidates]
      .sort((a, b) => this.ucbScore(b) - this.ucbScore(a))
      .slice(0, topK);
  }

  recordSignal(dishId: string, signal: Signal) {
    const reward = SIGNAL_REWARD[signal];
    const count = this.data.counts[dishId] ?? 0;
    const value = this.data.values[dishId] ?? 0;

    this.data.counts[dishId] = count + 1;
    this.data.values[dishId] = (value * count + reward) / (count + 1);
    this.data.totalPlays++;

    saveData(this.data);
  }

  reset() {
    this.data = { counts: {}, values: {}, totalPlays: 0 };
    saveData(this.data);
  }

  getStats() {
    const entries = Object.entries(this.data.counts).map(([id, count]) => ({
      dishId: id,
      count,
      value: this.data.values[id] ?? 0,
      ucb: this.ucbScore(id),
    }));
    entries.sort((a, b) => b.ucb - a.ucb);
    return { totalPlays: this.data.totalPlays, entries };
  }
}

export const preferenceBandit = new PreferenceBandit();

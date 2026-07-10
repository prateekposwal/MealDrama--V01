import { checkWithFallback } from '../../utils/dpTimeout';

export function bitmaskDP(
  n: number,
  cost: (i: number, j: number) => number,
  fallback: number[],
): number[] {
  if (n <= 2) return fallback;

  return checkWithFallback<number[]>((isTimedOut: () => boolean) => {
    const fullMask = (1 << n) - 1;

    const dp: number[][] = [];
    const parent: number[][] = [];

    for (let mask = 0; mask <= fullMask; mask++) {
      dp[mask] = new Array(n).fill(Infinity);
      parent[mask] = new Array(n).fill(-1);
    }

    for (let i = 0; i < n; i++) {
      dp[1 << i]![i] = 0;
    }

    for (let mask = 1; mask < fullMask; mask++) {
      if (isTimedOut()) return fallback;
      for (let last = 0; last < n; last++) {
        if (!(mask & (1 << last))) continue;
        const cur = dp[mask]![last];
        if (cur === undefined || cur === Infinity) continue;

        for (let next = 0; next < n; next++) {
          if (mask & (1 << next)) continue;
          const newMask = mask | (1 << next);
          const penalty = cost(last, next);
          const newCost = cur + penalty;
          const existing = dp[newMask]![next];
          if (existing === undefined || newCost < existing) {
            dp[newMask]![next] = newCost;
            parent[newMask]![next] = last;
          }
        }
      }
    }

    let bestLast = 0;
    let bestCost = dp[fullMask]?.[0] ?? Infinity;
    for (let i = 1; i < n; i++) {
      const c = dp[fullMask]?.[i];
      if (c !== undefined && c < bestCost) {
        bestCost = c;
        bestLast = i;
      }
    }

    const order: number[] = [];
    let mask = fullMask;
    let curr = bestLast;
    while (curr !== -1) {
      order.push(curr);
      const prev = parent[mask]?.[curr] ?? -1;
      mask ^= (1 << curr);
      curr = prev;
    }
    order.reverse();
    return order;
  }, fallback);
}

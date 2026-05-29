export interface DpMetric {
  name: string;
  executionTime: number;
  cacheHit: boolean;
  cacheSize: number;
  fallbackUsed: boolean;
  inputSize: number;
  resultSize: number;
  timestamp: number;
}

const metrics: DpMetric[] = [];
const MAX_METRICS = 1000;

export function recordMetric(metric: Omit<DpMetric, 'timestamp'>) {
  metrics.push({ ...metric, timestamp: Date.now() });
  if (metrics.length > MAX_METRICS) metrics.shift();
}

export interface DpStats {
  totalCalls: number;
  avgExecutionTime: number;
  cacheHitRate: number;
  fallbackRate: number;
  byFunction: Record<string, {
    calls: number;
    avgTime: number;
    cacheHitRate: number;
    fallbackRate: number;
  }>;
}

export function getDpStats(): DpStats {
  const byFn: Record<string, {
    total: number; time: number; cacheHits: number; fallbacks: number;
  }> = {};

  for (const m of metrics) {
    if (!byFn[m.name]) byFn[m.name] = { total: 0, time: 0, cacheHits: 0, fallbacks: 0 };
    byFn[m.name]!.total++;
    byFn[m.name]!.time += m.executionTime;
    if (m.cacheHit) byFn[m.name]!.cacheHits++;
    if (m.fallbackUsed) byFn[m.name]!.fallbacks++;
  }

  const total = metrics.length;
  const totalTime = metrics.reduce((s, m) => s + m.executionTime, 0);
  const totalCacheHits = metrics.filter(m => m.cacheHit).length;
  const totalFallbacks = metrics.filter(m => m.fallbackUsed).length;

  const byFunction: DpStats['byFunction'] = {};
  for (const [name, data] of Object.entries(byFn)) {
    byFunction[name] = {
      calls: data.total,
      avgTime: data.total > 0 ? Math.round(data.time / data.total) : 0,
      cacheHitRate: data.total > 0 ? data.cacheHits / data.total : 0,
      fallbackRate: data.total > 0 ? data.fallbacks / data.total : 0,
    };
  }

  return {
    totalCalls: total,
    avgExecutionTime: total > 0 ? Math.round(totalTime / total) : 0,
    cacheHitRate: total > 0 ? totalCacheHits / total : 0,
    fallbackRate: total > 0 ? totalFallbacks / total : 0,
    byFunction,
  };
}

export function clearMetrics() {
  metrics.length = 0;
}

export function recordMetricAndReturn<T>(
  name: string,
  startTime: number,
  cacheHit: boolean,
  cacheSize: number,
  fallbackUsed: boolean,
  inputSize: number,
  result: T,
  getResultSize: (r: T) => number,
): T {
  const elapsed = Math.round(performance.now() - startTime);
  recordMetric({
    name,
    executionTime: elapsed,
    cacheHit,
    cacheSize,
    fallbackUsed,
    inputSize,
    resultSize: getResultSize(result),
  });
  return result;
}

let _timeoutMs = 300;

export function setDpTimeout(ms: number) {
  _timeoutMs = ms;
}

export function createTimeChecker(): () => boolean {
  const start = performance.now();
  return () => (performance.now() - start) >= _timeoutMs;
}

export function checkWithFallback<T>(
  fn: (isTimedOut: () => boolean) => T,
  fallback: T,
): T {
  try {
    const isTimedOut = createTimeChecker();
    return fn(isTimedOut);
  } catch {
    return fallback;
  }
}

// ─── Debounce Registry ─────────────────────────────────────────────────────────
// One registry per session — shared across all tray store save calls.
// Each itemId gets its own timer so concurrent edits don't cancel each other.

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Clear all pending debounce timers — called on logout/HMR to prevent leaks */
export function clearAllDebounceTimers(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
}

/** Get current timer count for debugging */
export function getDebounceTimerCount(): number {
  return debounceTimers.size;
}

/**
 * Debounce save wrapper (1000ms default).
 * Prevents API spam during rapid inline edits.
 */
export function debounceSave(key: string, fn: () => Promise<void>, delay = 1000, onError?: (err: unknown) => void) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }
  debounceTimers.set(key, setTimeout(async () => {
    try {
      await fn();
    } catch (err) {
      if (onError) onError(err);
      else console.error('[TrayStore] Save failed:', err);
    } finally {
      debounceTimers.delete(key);
    }
  }, delay));
}

// H2: Clear pending timers on tab close — offline queue will retry on next load
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => clearAllDebounceTimers());
}

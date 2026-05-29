/**
 * Robust Storage Adapter with Debug Logging.
 *
 * BETA STRATEGY: Synchronous localStorage only.
 * - Logs every read/write to help diagnose persistence issues.
 * - Eliminates async race conditions.
 * - Implements PersistStorage interface directly (handles JSON parsing).
 */

export const nativeStorage = {
  getItem: (key: string): { state: any; version?: number } | null => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      // Validate JSON before parsing
      if (typeof value !== 'string' || !value.startsWith('{')) {
        console.warn(`[Storage] getItem("${key}") -> Invalid format, clearing`);
        try { localStorage.removeItem(key); } catch {}
        return null;
      }
      const parsed = JSON.parse(value);
      console.log(`[Storage] getItem("${key}") -> Found (v${parsed?.version ?? '?'})`);
      return parsed;
    } catch (err) {
      console.error(`[Storage] getItem("${key}") failed, clearing:`, err);
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
  },

  setItem: (key: string, value: { state: any; version?: number }): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      console.log(`[Storage] setItem("${key}") -> Success (${serialized.length} bytes)`);
    } catch (err) {
      console.error('[Storage] setItem failed:', err);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
      console.log(`[Storage] removeItem("${key}") -> Success`);
    } catch (err) {
      console.error('[Storage] removeItem failed:', err);
    }
  },
};

/**
 * Robust Storage Adapter with Debug Logging.
 *
 * BETA STRATEGY: Synchronous localStorage only.
 * - Logs every read/write to help diagnose persistence issues (DEV-only —
 *   `import.meta.env.DEV` guards tree-shake the strings out of prod builds,
 *   the same convention `[Store]` logs use).
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
        if (import.meta.env.DEV) console.warn(`[Storage] getItem("${key}") -> Invalid format, clearing`);
        try { localStorage.removeItem(key); } catch {}
        return null;
      }
      const parsed = JSON.parse(value);
      if (import.meta.env.DEV) console.log(`[Storage] getItem("${key}") -> Found (v${parsed?.version ?? '?'})`);
      return parsed;
    } catch (err) {
      if (import.meta.env.DEV) console.error(`[Storage] getItem("${key}") failed, clearing:`, err);
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
  },

  setItem: (key: string, value: { state: any; version?: number }): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      if (import.meta.env.DEV) console.log(`[Storage] setItem("${key}") -> Success (${serialized.length} bytes)`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Storage] setItem failed:', err);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
      if (import.meta.env.DEV) console.log(`[Storage] removeItem("${key}") -> Success`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Storage] removeItem failed:', err);
    }
  },
};

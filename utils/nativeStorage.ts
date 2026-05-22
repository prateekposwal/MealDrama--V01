/**
 * FIX: Storage Adapter for Zustand v5 persist middleware.
 *
 * Zustand v5 passes the raw { state, version } object to storage.setItem,
 * and expects { state, version } back from storage.getItem.
 *
 * This adapter handles serialization/deserialization to/from JSON itself.
 */

const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
  return !!cap.isNative;
};

/**
 * Web storage — synchronous localStorage
 * PersistState = { state: Record<string, any>, version: number }
 */
const webStorage = {
  getItem: (key: string): Record<string, any> | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.warn(`[webStorage] CORRUPTED data for "${key}", clearing`);
        localStorage.removeItem(key);
        return null;
      }
      // Validate shape — must have state and optionally version
      if (!parsed || typeof parsed !== 'object') {
        console.warn(`[webStorage] Invalid data for "${key}", clearing`);
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch (err) {
      console.error('[webStorage] getItem failed:', err);
      return null;
    }
  },
  setItem: (key: string, value: Record<string, any>): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.error('[webStorage] setItem failed:', err);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('[webStorage] removeItem failed:', err);
    }
  },
};

/**
 * Native storage — async Capacitor Preferences (lazy loaded)
 */
let nativeImpl: {
  getItem: (key: string) => Promise<Record<string, any> | null>;
  setItem: (key: string, value: Record<string, any>) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

async function getNative(): Promise<typeof nativeImpl extends null ? never : typeof nativeImpl> {
  if (nativeImpl) return nativeImpl;
  const { Preferences } = await import('@capacitor/preferences');

  nativeImpl = {
    getItem: async (key: string) => {
      try {
        const { value } = await Preferences.get({ key });
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          console.warn(`[nativeStorage] CORRUPTED data for "${key}", clearing`);
          await Preferences.remove({ key });
          return null;
        }
      } catch (err) {
        console.error('[nativeStorage] getItem failed:', err);
        return null;
      }
    },
    setItem: async (key: string, value: Record<string, any>) => {
      try {
        await Preferences.set({ key, value: JSON.stringify(value) });
      } catch (err) {
        console.error('[nativeStorage] setItem failed:', err);
      }
    },
    removeItem: async (key: string) => {
      try {
        await Preferences.remove({ key });
      } catch (err) {
        console.error('[nativeStorage] removeItem failed:', err);
      }
    },
  };
  return nativeImpl;
}

// Pre-load native storage if running on native
const isNativeEnv = isNative();
if (isNativeEnv) {
  getNative();
}

/**
 * Hybrid storage adapter
 */
export const nativeStorage = {
  getItem: (key: string): Record<string, any> | null | Promise<Record<string, any> | null> => {
    if (isNativeEnv) {
      return getNative().then(ns => ns.getItem(key));
    }
    return webStorage.getItem(key);
  },

  setItem: (key: string, value: Record<string, any>): void | Promise<void> => {
    if (isNativeEnv) {
      return getNative().then(ns => ns.setItem(key, value));
    }
    webStorage.setItem(key, value);
  },

  removeItem: (key: string): void | Promise<void> => {
    if (isNativeEnv) {
      return getNative().then(ns => ns.removeItem(key));
    }
    webStorage.removeItem(key);
  },
};

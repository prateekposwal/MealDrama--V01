// ─────────────────────────────────────────────────────────────────────────────
// Connectivity Manager — Single source of truth for online/offline events
// Consolidates duplicate listeners from useStore, useTrayStore, App.tsx
// ─────────────────────────────────────────────────────────────────────────────

type ConnectivityState = 'online' | 'offline';

let _state: ConnectivityState = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
const _listeners = new Set<(state: ConnectivityState) => void>();

/**
 * Check actual connectivity by fetching a lightweight endpoint.
 * navigator.onLine can give false positives (captive portals, DNS failures).
 * M5: All endpoints fetched in parallel with Promise.any() — max timeoutMs total.
 */
export async function checkConnectivity(timeoutMs = 3000): Promise<boolean> {
  // M13: If navigator says offline, trust it — no need to fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  const endpoints = ['/api/health', '/api/v1/health', '/'];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await Promise.any(
      endpoints.map(async (endpoint) => {
        const res = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal,
        });
        if (res.ok || res.status === 304 || res.status === 405) return true;
        throw new Error(`Endpoint ${endpoint} returned ${res.status}`);
      }),
    );
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Subscribe to connectivity changes. Returns unsubscribe function. */
export function onConnectivityChange(fn: (state: ConnectivityState) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/** Get current connectivity state */
export function getConnectivityState(): ConnectivityState {
  return _state;
}

/** Get current connectivity state (boolean) */
export function isOnline(): boolean {
  return _state === 'online';
}

// Wire browser events once at module load
let _onlineHandler: (() => Promise<void>) | null = null;
let _offlineHandler: (() => void) | null = null;

if (typeof window !== 'undefined') {
  _onlineHandler = async () => {
    _state = 'online';
    _listeners.forEach(fn => fn('online'));
    // C1: Drain both offline queues when connectivity restored
    try {
      const [trayResult, utilResult] = await Promise.allSettled([
        (async () => {
          const { offlineQueue } = await import('../lib/trayApi');
          return offlineQueue.drain();
        })(),
        (async () => {
          const { processQueue } = await import('./offlineQueue');
          return processQueue();
        })(),
      ]);
      const traySynced = trayResult.status === 'fulfilled' ? trayResult.value.synced : 0;
      const utilSynced = utilResult.status === 'fulfilled' ? utilResult.value.synced : 0;
      if (traySynced > 0 || utilSynced > 0) {
        window.dispatchEvent(new CustomEvent('offline_queue_synced', {
          detail: { tray: traySynced, util: utilSynced },
        }));
      }
    } catch {
      // drain failed — will retry on next online event
    }
  };

  _offlineHandler = () => {
    _state = 'offline';
    _listeners.forEach(fn => fn('offline'));
  };

  window.addEventListener('online', _onlineHandler);
  window.addEventListener('offline', _offlineHandler);

  // M2: HMR cleanup — remove listeners on module dispose to prevent accumulation
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      if (_onlineHandler) window.removeEventListener('online', _onlineHandler);
      if (_offlineHandler) window.removeEventListener('offline', _offlineHandler);
      _listeners.clear();
    });
  }
}

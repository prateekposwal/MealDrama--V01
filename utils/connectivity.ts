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
 */
export async function checkConnectivity(timeoutMs = 3000): Promise<boolean> {
  // M13: If navigator says offline, trust it — no need to fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;

  // Try multiple endpoints in case /api/health doesn't exist
  const endpoints = ['/api/health', '/api/v1/health', '/'];
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok || res.status === 304 || res.status === 405) return true;
    } catch {
      // Try next endpoint
    }
  }
  return false;
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
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    _state = 'online';
    _listeners.forEach(fn => fn('online'));
  });

  window.addEventListener('offline', () => {
    _state = 'offline';
    _listeners.forEach(fn => fn('offline'));
  });
}

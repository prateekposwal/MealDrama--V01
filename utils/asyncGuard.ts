// ─────────────────────────────────────────────────────────────────────────────
// Async Safety Guard — AbortController, Latest-Request-Wins, Dedup, Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RequestTracker — Latest-Request-Wins pattern.
 * Every async flow gets a monotonically increasing sequence number.
 * Before applying any response, check if the request is still current.
 * Prevents stale responses from overwriting newer UI state.
 */
export class RequestTracker {
  private _sequence = 0;
  private _aborted = false;

  /** Start a new request — returns its sequence ID */
  start(): number {
    this._sequence++;
    this._aborted = false;
    return this._sequence;
  }

  /** Check if a given sequence ID is still the latest active request */
  isCurrent(id: number): boolean {
    return !this._aborted && id === this._sequence;
  }

  /** Abort all pending requests — no future isCurrent() will return true */
  abort() {
    this._aborted = true;
  }

  /** Reset for reuse (e.g., when modal reopens) */
  reset() {
    this._sequence = 0;
    this._aborted = false;
  }
}

/**
 * RequestDedupCache — Prevents duplicate in-flight requests for the same key.
 * If a request for key "paneer" is already in-flight, return the existing promise.
 * Entries expire after `ttlMs` to allow fresh requests.
 */
class _RequestDedupCache {
  private _pending = new Map<string, { promise: Promise<unknown>; expiresAt: number }>();

  get<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this._pending.get(key);
    if (existing && existing.expiresAt > now) {
      return existing.promise as Promise<T>;
    }
    const promise = factory();
    this._pending.set(key, { promise, expiresAt: now + ttlMs });
    promise.finally(() => {
      // Keep in cache briefly after resolution for immediate re-use
      setTimeout(() => this._pending.delete(key), 100);
    });
    return promise;
  }

  clear() {
    this._pending.clear();
  }
}

export const requestDedupCache = new _RequestDedupCache();

/**
 * useAsyncGuard — React hook that wraps async operations with:
 * 1. AbortController for cancellation
 * 2. RequestTracker for latest-wins
 * 3. Cleanup on unmount
 *
 * Usage:
 *   const guard = useAsyncGuard();
 *
 *   useEffect(() => {
 *     const id = guard.start();
 *     fetchSomething().then(result => {
 *       if (!guard.isCurrent(id)) return; // stale — ignore
 *       setState(result);
 *     });
 *     return () => guard.abort();
 *   }, [dep]);
 */
import { useRef, useEffect, useCallback } from 'react';

export function useAsyncGuard() {
  const trackerRef = useRef<RequestTracker>(new RequestTracker());

  useEffect(() => {
    return () => {
      trackerRef.current.abort();
    };
  }, []);

  const start = useCallback(() => trackerRef.current.start(), []);
  const isCurrent = useCallback((id: number) => trackerRef.current.isCurrent(id), []);
  const abort = useCallback(() => trackerRef.current.abort(), []);
  const reset = useCallback(() => trackerRef.current.reset(), []);

  return { start, isCurrent, abort, reset };
}

/**
 * ModalLifecycleGuard — Ensures no state updates after modal closes.
 * Wraps any async callback: if the modal is closed, the callback is a no-op.
 */
export class ModalLifecycleGuard {
  private _closed = false;

  close() {
    this._closed = true;
  }

  reset() {
    this._closed = false;
  }

  /** Wrap a state-update function — returns no-op if modal is closed */
  guard<T extends (...args: any[]) => void>(fn: T): T {
    return ((...args: Parameters<T>) => {
      if (this._closed) return;
      fn(...args);
    }) as T;
  }

  /** Check if the modal is closed */
  get isClosed() {
    return this._closed;
  }
}

/**
 * DeferredSync — Buffers state changes during rapid interaction,
 * only flushing to the global store after a stable period.
 * Prevents global store thrashing while user is typing/swapping.
 */
export class DeferredSync<T> {
  private _buffer: T | null = null;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _flushFn: ((value: T) => void) | null = null;

  constructor(private _delayMs: number = 150) {}

  /** Queue a value — replaces any pending value. Flushes after delay. */
  queue(value: T, flushFn: (value: T) => void) {
    this._buffer = value;
    this._flushFn = flushFn;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), this._delayMs);
  }

  /** Immediately flush any pending value */
  flush() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._buffer && this._flushFn) {
      this._flushFn(this._buffer);
      this._buffer = null;
      this._flushFn = null;
    }
  }

  /** Cancel any pending flush */
  cancel() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._buffer = null;
    this._flushFn = null;
  }
}

/**
 * createAbortableFetch — Wraps fetch with AbortController support.
 * Returns { promise, abort } where abort cancels the request.
 */
export function createAbortableFetch(
  url: string,
  options?: RequestInit & { signal?: AbortSignal },
): { promise: Promise<Response>; abort: () => void } {
  const controller = new AbortController();
  // M1: Respect external signal if provided — wire it to our controller
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  const promise = fetch(url, {
    ...options,
    signal: controller.signal,
  });
  return {
    promise,
    abort: () => controller.abort(),
  };
}

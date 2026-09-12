// Offline-first analytics: buffer to localStorage, dispatch a CustomEvent,
// fire-and-forget flush to the server when reachable. Never throws.
// Telemetry targets the SAME base the app uses (getApiBase) so a stale
// hardcoded default can never fight the API-base self-heal.

import { getApiBase, defaultApiBase } from '../lib/api';

const KEY = 'md-events';
const CAP = 200;

export interface AnalyticsEvent {
  name: string;
  props?: Record<string, unknown>;
  ts: number;
}

let buffer: AnalyticsEvent[] | null = null;
let flushing = false;
let flushEnabled = true;

function isEvent(x: unknown): x is AnalyticsEvent {
  return !!x
    && typeof x === 'object'
    && typeof (x as AnalyticsEvent).name === 'string'
    && typeof (x as AnalyticsEvent).ts === 'number';
}

function load(): AnalyticsEvent[] {
  if (buffer) return buffer;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    const parsed = raw ? JSON.parse(raw) : [];
    buffer = Array.isArray(parsed) ? parsed.filter(isEvent) : [];
  } catch {
    buffer = [];
  }
  return buffer;
}

function save() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(buffer));
    }
  } catch {
    /* storage unavailable */
  }
}

function flushTarget(): string {
  try {
    return `${getApiBase().replace(/\/+$/, '')}/events`;
  } catch {
    // ONE source of truth: defaultApiBase() is the SAME resolver the client
    // API uses (getApiBase = stored/self-healed override, else defaultApiBase).
    // The old hardcoded absolute-URL fallback addressed the same server as
    // this same-origin default (sameApiTarget() treats the dev-machine URL and
    // '/api/v1' as one target), so failover semantics are preserved — and an
    // absolute host can NEVER be baked into the bundle from here. getApiBase
    // never throws in practice; this catch is pure defense-in-depth.
    return `${defaultApiBase().replace(/\/+$/, '')}/events`;
  }
}

/** Enable/disable network flush (local-only keeps buffer + CustomEvent). */
export function setFlushEnabled(enabled: boolean): void {
  flushEnabled = enabled;
}

async function flush(): Promise<void> {
  if (!flushEnabled || flushing) return;
  const buf = load();
  if (buf.length === 0) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (typeof fetch !== 'function') return;
  flushing = true;
  try {
    const toSend = buf.slice();
    const res = await fetch(flushTarget(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: toSend }),
    });
    if (res.ok) {
      const remaining = buffer ? buffer.filter(e => !toSend.includes(e)) : [];
      buffer = remaining;
      save();
    }
  } catch {
    /* unreachable — keep buffer for the next flush */
  } finally {
    flushing = false;
  }
}

export function track(eventName: string, props?: Record<string, unknown>): void {
  try {
    const ev: AnalyticsEvent = { name: eventName, props, ts: Date.now() };
    const buf = load();
    buf.push(ev);
    if (buf.length > CAP) buf.splice(0, buf.length - CAP);
    buffer = buf;
    save();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('md:event', { detail: { name: eventName, props, ts: ev.ts } }));
    }
    void flush();
  } catch {
    /* never throw */
  }
}

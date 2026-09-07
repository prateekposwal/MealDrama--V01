// ─────────────────────────────────────────────────────────────────────────────
// utils/analytics tests — offline-first event tracking (md-events).
//
// Pure logic in node env: buffer append + overflow cap (oldest-first, ~200),
// local-only mode (flush disabled → no network), flush-never-throws on bad
// response or network failure, and event shape (name + ts + props).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

const KEY = 'md-events';
const CAP = 200;

interface StoredEvent {
  name: string;
  props?: Record<string, unknown>;
  ts: number;
}

function readEvents(): StoredEvent[] {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StoredEvent[]) : [];
}

async function freshAnalytics() {
  const mod = await import('../utils/analytics');
  mod.setFlushEnabled(false); // default local-only for most tests
  return mod;
}

async function tick() {
  await new Promise(r => setTimeout(r, 0));
}

describe('analytics', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    });
    vi.stubGlobal('window', {
      localStorage: (globalThis as Record<string, unknown>).localStorage,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      navigator: { onLine: true },
    } as unknown as Window & typeof globalThis);
    vi.resetModules();
  });

  it('appends to md-events and dispatches md:event CustomEvent', async () => {
    const { track } = await freshAnalytics();
    track('hint_open', { id: 'buy-chip-state' });
    const buf = readEvents();
    expect(buf).toHaveLength(1);
    expect(buf[0]!.name).toBe('hint_open');
    expect(buf[0]!.props).toEqual({ id: 'buy-chip-state' });
    expect(typeof buf[0]!.ts).toBe('number');
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  it('event shape: name is string, ts is number, props preserved', async () => {
    const { track } = await freshAnalytics();
    track('hint_dismissed', { id: 'a' });
    const ev = readEvents()[0]!;
    expect(typeof ev.name).toBe('string');
    expect(typeof ev.ts).toBe('number');
    expect(ev.props!.id).toBe('a');
  });

  it('caps the buffer at 200, oldest-first', async () => {
    const { track } = await freshAnalytics();
    for (let i = 0; i < CAP + 50; i++) {
      track('hint_open', { id: `h${i}` });
    }
    const buf = readEvents();
    expect(buf).toHaveLength(CAP);
    expect(buf[0]!.props!.id).toBe('h50'); // first 50 dropped, oldest-first
    expect(buf[CAP - 1]!.props!.id).toBe(`h${CAP + 49}`);
  });

  it('local-only mode: no network fetch when flush disabled', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy);
    const { track } = await freshAnalytics(); // setFlushEnabled(false) inside
    track('hint_auto_shown', { id: 'x' });
    await tick();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('flush never throws on bad response and retains the buffer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500 })));
    const mod = await import('../utils/analytics');
    mod.setFlushEnabled(true);
    expect(() => mod.track('hint_open', { id: 'keep' })).not.toThrow();
    await tick();
    await tick();
    const buf = readEvents();
    expect(buf.some(e => e.name === 'hint_open')).toBe(true);
  });

  it('flush never throws on network rejection and retains the buffer', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const mod = await import('../utils/analytics');
    mod.setFlushEnabled(true);
    expect(() => mod.track('hint_open', { id: 'still-here' })).not.toThrow();
    await tick();
    await tick();
    const buf = readEvents();
    expect(buf.some(e => e.name === 'hint_open')).toBe(true);
  });

  it('clears the buffer after a successful flush', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('../utils/analytics');
    mod.setFlushEnabled(true);
    mod.track('undo_succeeded', { kind: 'swap' });
    await tick();
    await tick();
    const call = fetchMock.mock.calls[0]! as unknown as [unknown, RequestInit];
    const body = JSON.parse(typeof call[1].body === 'string' ? call[1].body : '{}');
    expect(body.events[0].name).toBe('undo_succeeded');
    expect(readEvents()).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useHintStore tests — tap-to-learn hint seen-state (md-hint-seen-v1).
//
// Contract under test (design rule, not UI behavior):
//   seen is written ONLY by an explicit markSeen (i.e. dismissal) — the store
//   has no auto-show path; per-id independence; localStorage round-trip in the
//   EXACT md-buy-assumptions pattern (BuyByDishSheet: try/catch, Set parse).
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { useHintStore, parseSeen } from '../hooks/useHintStore';

const KEY = 'md-hint-seen-v1';

describe('useHintStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useHintStore.setState({ seen: new Set<string>() });
  });

  it('starts with nothing seen', () => {
    expect(useHintStore.getState().hasSeen('buy-chip-state')).toBe(false);
    expect(useHintStore.getState().seen.size).toBe(0);
  });

  it('marks one id without touching others (per-id)', () => {
    useHintStore.getState().markSeen('buy-chip-state');
    expect(useHintStore.getState().hasSeen('buy-chip-state')).toBe(true);
    expect(useHintStore.getState().hasSeen('dashboard-buy-pill')).toBe(false);
    expect(useHintStore.getState().seen.size).toBe(1);
  });

  it('persists to localStorage on markSeen (dismissal round-trip)', () => {
    useHintStore.getState().markSeen('dashboard-buy-pill');
    useHintStore.getState().markSeen('swap-glyph');
    const raw = localStorage.getItem(KEY);
    expect(raw).toBe(JSON.stringify(['dashboard-buy-pill', 'swap-glyph']));

    // Simulate a fresh app boot: parse the raw storage exactly like the store does.
    const reloaded = parseSeen(raw);
    expect(reloaded.has('dashboard-buy-pill')).toBe(true);
    expect(reloaded.has('swap-glyph')).toBe(true);
    expect(reloaded.has('buy-chip-state')).toBe(false);
  });

  it('is idempotent — re-marking does not grow storage', () => {
    useHintStore.getState().markSeen('a');
    useHintStore.getState().markSeen('a');
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify(['a']));
  });

  it('tolerates corrupt/absent storage (mirrors md-buy-assumptions catch)', () => {
    expect(parseSeen(null).size).toBe(0);
    expect(parseSeen('{not json').size).toBe(0);
    expect(parseSeen(JSON.stringify([1, 'a', null, 'b'])).has('a')).toBe(true);
    expect(parseSeen(JSON.stringify([1, 'a', null, 'b'])).has('b')).toBe(true);
    localStorage.setItem(KEY, '{corrupt');
  });
});

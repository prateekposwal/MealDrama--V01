import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Regression: the household guard must NEVER mask real failures ───────────
// Root cause (diagnosed 2026-09-12): createHousehold/joinHousehold collapsed
// EVERY ensureToken() failure (no account, register 500 during a DB outage,
// network drop, auth-not-ready) into one fake status:
//   "Authentication pending — please try again."
// The user saw that toast while the server was returning 500 from a Neon
// cold-start P1001 ("Can't reach database server"). Fix: ensureToken() returns
// a discriminated { ok:false; reason } carrying the REAL error; the household
// handlers toast the reason and THROW so the modal stays open (the old path
// resolved and closed the modal with no household created).
import { vi as _vi } from 'vitest';

const mocks = _vi.hoisted(() => ({
  registerUser: _vi.fn(),
  logoutUser: _vi.fn(),
  householdApi: { create: _vi.fn(), join: _vi.fn(), get: _vi.fn(), leave: _vi.fn(), updateMember: _vi.fn(), getMembers: _vi.fn(), regenerateCode: _vi.fn() },
}));

_vi.mock('../app/utils/authApi', () => ({
  registerUser: mocks.registerUser,
  logoutUser: mocks.logoutUser,
  getMe: _vi.fn(async () => null),
}));

_vi.mock('../app/utils/householdApi', () => ({ householdApi: mocks.householdApi }));

function lastToast(): { message: string; type: string } | null {
  // The store keeps toast in state — read it through the live module.
  // (The mocked modules above make the store's calls fully deterministic.)
  return (globalThis as any).__lastToast ?? null;
}

const toastSpy = { set: _vi.fn() };

describe('household create — real auth failure surfaced, never "Authentication pending"', () => {
  let store: typeof import('../app/store/useStore')['useStore'];

  beforeEach(async () => {
    _vi.resetModules();
    toastSpy.set.mockReset();
    mocks.registerUser.mockReset();
    mocks.householdApi.create.mockReset();
    mocks.householdApi.join.mockReset();
    (globalThis as any).__lastToast = null;
    // Stub setToast at module import time by intercepting after load.
    const mod = await import('../app/store/useStore');
    store = mod.useStore;
    store.setState({
      token: null,
      isLoggedIn: false,
      householdId: null,
      household: null,
      user: null,
      toast: null,
    });
    // Wrap setToast to also record for assertions.
    const realSetToast = store.getState().setToast;
    store.setState({
      setToast: (toast) => {
        (globalThis as any).__lastToast = toast;
        realSetToast(toast);
      },
    });
  });

  afterEach(() => {
    _vi.resetModules();
  });

  it('UC-A1 — no user + no token: real reason toast (not "pending"), modal stays open (throws)', async () => {
    await expect(store.getState().createHousehold('Kitchen X')).rejects.toThrow(/No account is signed in/);
    const t = lastToast();
    expect(t).not.toBeNull();
    expect(t!.message).toContain('No account is signed in');
    expect(t!.message).not.toContain('Authentication pending');
    expect(t!.type).toBe('error');
  });

  it('UC-A2 — register retry fails with the server 500 (DB-outage path): the REAL server error is shown', async () => {
    store.setState((s: any) => ({ user: { id: 'u-1', username: 'tester' } }));
    mocks.registerUser.mockResolvedValue({ ok: false, error: 'Request failed: 500 — DB unreachable' });
    await expect(store.getState().createHousehold('Kitchen X')).rejects.toThrow(/createHousehold aborted/);
    const t = lastToast();
    expect(t!.message).toContain('Request failed: 500 — DB unreachable');
    expect(t!.message).not.toContain('Authentication pending');
  });

  it('UC-A3 — a 401 from householdApi.create is NEVER relabeled "pending" (existing catch path)', async () => {
    store.setState((s: any) => ({ user: { id: 'u-2', username: 'tester' }, token: 'jwt-valid' }));
    mocks.householdApi.create.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
    await expect(store.getState().createHousehold('Kitchen X')).rejects.toThrow('Unauthorized');
    const t = lastToast();
    expect(t!.message).toContain('Failed to create household: Unauthorized');
    expect(t!.message.toLowerCase()).not.toContain('pending');
  });

  it('UC-A4 — login already set a token: household create succeeds end-to-end', async () => {
    store.setState((s: any) => ({ user: { id: 'u-3', username: 'tester' }, token: 'jwt-ok' }));
    mocks.householdApi.create.mockResolvedValue({ id: 'hh-1', name: 'Kitchen X', members: [] });
    await store.getState().createHousehold('Kitchen X');
    expect(store.getState().householdId).toBe('hh-1');
    expect(lastToast()!.type).toBe('success');
  });

  it('UC-A5 — registerUser retry succeeds on demand: ensureToken recovers then creates', async () => {
    store.setState((s: any) => ({ user: { id: 'u-4', username: 'tester' }, token: null }));
    mocks.registerUser.mockResolvedValue({ ok: true, user: { id: 'u-4' }, token: 'jwt-recovered' });
    mocks.householdApi.create.mockResolvedValue({ id: 'hh-2', name: 'Kitchen Y', members: [] });
    await store.getState().createHousehold('Kitchen Y');
    expect(store.getState().token).toBe('jwt-recovered');
    expect(store.getState().householdId).toBe('hh-2');
    expect(lastToast()!.type).toBe('success');
  });

  it('UC-A6 — joinHousehold mirrors the same real-error contract', async () => {
    store.setState((s: any) => ({ user: { id: 'u-5', username: 'tester' }, token: null }));
    mocks.registerUser.mockResolvedValue({ ok: false, error: 'network down (fetch failed)' });
    await expect(store.getState().joinHousehold('ABC123')).rejects.toThrow(/joinHousehold aborted/);
    const t = lastToast();
    expect(t!.message).toContain("Couldn't sign in to join the household");
    expect(t!.message).toContain('network down');
  });
});

// Note: toastSpy kept for symmetry — assertions read __lastToast via setToast
// wrapper, which is the same state the real Toast component renders.
void toastSpy;

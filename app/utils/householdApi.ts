import api from '../../lib/api';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

// ─── DEV mock ────────────────────────────────────────────────────────
const DEV_STORAGE_KEY = 'mealdrama-dev-household';
let _devCurrentUser = { id: 'dev-user', name: 'Dev User' };

/** Set the current user for DEV mock (called from store actions) */
export function setDevCurrentUser(id: string, name: string) {
  _devCurrentUser = { id, name };
}

function devLoad(): Household | null {
  try {
    const raw = localStorage.getItem(DEV_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function devSave(hh: Household | null) {
  try {
    if (hh) localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(hh));
    else localStorage.removeItem(DEV_STORAGE_KEY);
  } catch { /* quota exceeded — ignore */ }
}

function devLog(...args: unknown[]) {
  try { if (import.meta.env.DEV) console.log('[Household DEV]', ...args); } catch {}
}

async function devDelay(ms = 400) {
  return new Promise(r => setTimeout(r, ms + Math.random() * 200));
}
// ──────────────────────────────────────────────────────────────────────

export const householdApi = {
  create: async (payload: CreateHouseholdPayload): Promise<Household> => {
    try {
      if (import.meta.env.DEV) {
        await devDelay();
        const u = _devCurrentUser;
        const hh: Household = {
          id: `hh_${Date.now()}`,
          name: payload.name,
          adminId: u.id,
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          members: [{ id: u.id, name: u.name, role: 'admin', joinedAt: new Date().toISOString() }],
          createdAt: new Date().toISOString(),
        };
        devSave(hh);
        devLog('created:', hh.name, 'code:', hh.code);
        return hh;
      }
    } catch {}
    return api.post<Household>('/households', payload);
  },

  get: async (id: string): Promise<Household> => {
    try {
      if (import.meta.env.DEV) {
        await devDelay(200);
        const hh = devLoad();
        devLog('get:', id, '→', hh ? `found ${hh.name}` : 'not found');
        if (hh?.id === id) return hh;
      }
    } catch {}
    return api.get<Household>(`/households/${id}`);
  },

  join: async (payload: JoinHouseholdPayload): Promise<Household> => {
    try {
      if (import.meta.env.DEV) {
        await devDelay();
        const hh = devLoad();
        if (!hh) {
          devLog('join failed — no household in localStorage');
          throw new Error('No household found with that code');
        }
        const entered = payload.code.toUpperCase();
        devLog('join: stored code =', hh.code, 'entered =', entered);
        if (hh.code !== entered) throw new Error('Invalid code');
        const u = _devCurrentUser;
        if (hh.members.some(m => m.id === u.id)) {
          devLog('already a member');
          return hh;
        }
        hh.members.push({ id: u.id, name: u.name, role: 'member', joinedAt: new Date().toISOString() });
        devSave(hh);
        devLog('joined:', u.name, 'total members:', hh.members.length);
        return { ...hh };
      }
    } catch {}
    return api.post<Household>('/households/join', payload);
  },

  leave: async (id: string): Promise<void> => {
    try {
      if (import.meta.env.DEV) {
        await devDelay();
        const hh = devLoad();
        if (hh?.id === id) {
          hh.members = hh.members.filter(m => m.id !== _devCurrentUser.id);
          devSave(hh);
        }
        return;
      }
    } catch {}
    await api.post<void>(`/households/${id}/leave`);
  },

  regenerateCode: async (id: string): Promise<{ code: string }> => {
    try {
      if (import.meta.env.DEV) {
        await devDelay();
        const hh = devLoad();
        if (hh?.id === id) {
          hh.code = Math.random().toString(36).substring(2, 8).toUpperCase();
          devSave(hh);
          return { code: hh.code };
        }
        throw new Error('Household not found');
      }
    } catch {}
    return api.post<{ code: string }>(`/households/${id}/regenerate-code`);
  },

  getMembers: async (id: string): Promise<Household['members']> => {
    const hh = await householdApi.get(id);
    return hh.members;
  },
};

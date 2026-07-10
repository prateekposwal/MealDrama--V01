import api from '../../lib/api';
import { useStore } from '../../app/store/useStore';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

// ─── DEV mock ────────────────────────────────────────────────────────
function devGet(): Household | null {
  return useStore.getState()._devHousehold;
}

function devSet(hh: Household | null) {
  useStore.getState()._setDevHousehold(hh);
}

function devUser() {
  const u = useStore.getState().user;
  return { id: u?.id || 'dev-user', name: u?.name || 'Dev User' };
}

function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) console.log('[Household DEV]', ...args);
}

async function devDelay(ms = 400) {
  return new Promise(r => setTimeout(r, ms + Math.random() * 200));
}
// ──────────────────────────────────────────────────────────────────────

export const householdApi = {
  create: async (payload: CreateHouseholdPayload): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay();
      const u = devUser();
      const hh: Household = {
        id: `hh_${Date.now()}`,
        name: payload.name,
        adminId: u.id,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{ id: u.id, name: u.name, role: 'admin', joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      devSet(hh);
      devLog('created:', hh.name, 'code:', hh.code);
      return hh;
    }
    return api.post<Household>('/households', payload);
  },

  get: async (id: string): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay(200);
      const hh = devGet();
      devLog('get:', id, '→', hh ? `found ${hh.name}` : 'not found');
      if (hh?.id === id) return hh;
      throw new Error('Household not found');
    }
    return api.get<Household>(`/households/${id}`);
  },

  join: async (payload: JoinHouseholdPayload): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay();
      const hh = devGet();
      if (!hh) {
        devLog('join failed — no household in store');
        throw new Error('No household found with that code');
      }
      const entered = payload.code.toUpperCase();
      devLog('join: stored code =', hh.code, 'entered =', entered);
      if (hh.code !== entered) throw new Error('Invalid code');
      const u = devUser();
      if (hh.members.some(m => m.id === u.id)) {
        devLog('already a member');
        return hh;
      }
      hh.members.push({ id: u.id, name: u.name, role: 'member', joinedAt: new Date().toISOString() });
      devSet(hh);
      devLog('joined:', u.name, 'total members:', hh.members.length);
      return { ...hh };
    }
    return api.post<Household>('/households/join', payload);
  },

  leave: async (id: string): Promise<void> => {
    if (import.meta.env.DEV) {
      await devDelay();
      const hh = devGet();
      if (hh?.id === id) {
        const u = devUser();
        hh.members = hh.members.filter(m => m.id !== u.id);
        devSet(hh);
      }
      return;
    }
    await api.post<void>(`/households/${id}/leave`);
  },

  regenerateCode: async (id: string): Promise<{ code: string }> => {
    if (import.meta.env.DEV) {
      await devDelay();
      const hh = devGet();
      if (hh?.id === id) {
        hh.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        devSet(hh);
        return { code: hh.code };
      }
      throw new Error('Household not found');
    }
    return api.post<{ code: string }>(`/households/${id}/regenerate-code`);
  },

  getMembers: async (id: string): Promise<Household['members']> => {
    const hh = await householdApi.get(id);
    return hh.members;
  },
};

import api from '../../lib/api';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

// ─── DEV mock helpers ────────────────────────────────────────────────
let _devHousehold: Household | null = null;

async function devUser() {
  try {
    const m = await import('../../app/store/useStore');
    const u = m.useStore.getState().user;
    return { id: u?.id || 'dev-user', name: u?.name || 'Dev User' };
  } catch {
    return { id: 'dev-user', name: 'Dev User' };
  }
}

async function devDelay(ms = 400) {
  return new Promise(r => setTimeout(r, ms + Math.random() * 200));
}
// ──────────────────────────────────────────────────────────────────────

export const householdApi = {
  create: async (payload: CreateHouseholdPayload): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay();
      const u = await devUser();
      const hh: Household = {
        id: `hh_${Date.now()}`,
        name: payload.name,
        adminId: u.id,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{ id: u.id, name: u.name, role: 'admin', joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      _devHousehold = hh;
      return hh;
    }
    return api.post<Household>('/households', payload);
  },

  get: async (id: string): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay();
      if (_devHousehold?.id === id) return _devHousehold;
      throw new Error('Household not found');
    }
    return api.get<Household>(`/households/${id}`);
  },

  join: async (payload: JoinHouseholdPayload): Promise<Household> => {
    if (import.meta.env.DEV) {
      await devDelay();
      if (!_devHousehold) throw new Error('No household found with that code');
      if (_devHousehold.code !== payload.code.toUpperCase()) throw new Error('Invalid code');
      const u = await devUser();
      if (_devHousehold.members.some(m => m.id === u.id)) return _devHousehold;
      _devHousehold.members.push({ id: u.id, name: u.name, role: 'member', joinedAt: new Date().toISOString() });
      return { ..._devHousehold };
    }
    return api.post<Household>('/households/join', payload);
  },

  leave: async (id: string): Promise<void> => {
    if (import.meta.env.DEV) {
      await devDelay();
      if (_devHousehold?.id === id) {
        const u = await devUser();
        _devHousehold.members = _devHousehold.members.filter(m => m.id !== u.id);
        if (_devHousehold.members.length === 0) _devHousehold = null;
      }
      return;
    }
    await api.post<void>(`/households/${id}/leave`);
  },

  regenerateCode: async (id: string): Promise<{ code: string }> => {
    if (import.meta.env.DEV) {
      await devDelay();
      if (_devHousehold?.id === id) {
        _devHousehold.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        return { code: _devHousehold.code };
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

import api from '../../lib/api';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

// ─── DEV mock: module-level variables (no localStorage, no circular imports) ─
let _devHousehold: Household | null = null;
let _devUser = { id: 'dev-user', name: 'Dev User' };

export function setDevUser(id: string, name: string) {
  _devUser = { id, name };
}

function isDev(): boolean {
  try { return import.meta.env.DEV === true; } catch { return false; }
}
// ──────────────────────────────────────────────────────────────────────────────

export const householdApi = {
  create: async (payload: CreateHouseholdPayload): Promise<Household> => {
    if (isDev()) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
      const hh: Household = {
        id: `hh_${Date.now()}`,
        name: payload.name,
        adminId: _devUser.id,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [{ id: _devUser.id, name: _devUser.name, role: 'admin', joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      _devHousehold = hh;
      console.log('[Household] created:', hh.name, 'code:', hh.code);
      return hh;
    }
    return api.post<Household>('/households', payload);
  },

  get: async (id: string): Promise<Household> => {
    if (isDev()) {
      await new Promise(r => setTimeout(r, 200));
      console.log('[Household] get:', id, '→', _devHousehold ? `found ${_devHousehold.name}` : 'not found');
      if (_devHousehold?.id === id) return _devHousehold;
      throw new Error('Household not found');
    }
    return api.get<Household>(`/households/${id}`);
  },

  join: async (payload: JoinHouseholdPayload): Promise<Household> => {
    if (isDev()) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
      if (!_devHousehold) {
        console.log('[Household] join failed — no household created this session');
        throw new Error('No household found with that code');
      }
      const entered = payload.code.toUpperCase();
      console.log('[Household] join: stored code =', _devHousehold.code, 'entered =', entered);
      if (_devHousehold.code !== entered) throw new Error('Invalid code');
      if (_devHousehold.members.some(m => m.id === _devUser.id)) {
        console.log('[Household] already a member');
        return _devHousehold;
      }
      _devHousehold.members.push({ id: _devUser.id, name: _devUser.name, role: 'member', joinedAt: new Date().toISOString() });
      console.log('[Household] joined:', _devUser.name, 'total members:', _devHousehold.members.length);
      return { ..._devHousehold };
    }
    return api.post<Household>('/households/join', payload);
  },

  leave: async (id: string): Promise<void> => {
    if (isDev()) {
      await new Promise(r => setTimeout(r, 400));
      if (_devHousehold?.id === id) {
        _devHousehold.members = _devHousehold.members.filter(m => m.id !== _devUser.id);
        console.log('[Household] left, remaining members:', _devHousehold.members.length);
      }
      return;
    }
    await api.post<void>(`/households/${id}/leave`);
  },

  regenerateCode: async (id: string): Promise<{ code: string }> => {
    if (isDev()) {
      await new Promise(r => setTimeout(r, 400));
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

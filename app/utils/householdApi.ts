import api from '../../lib/api';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

export const householdApi = {
  create: (payload: CreateHouseholdPayload) =>
    api.post<Household>('/households', payload),

  get: (id: string) =>
    api.get<Household>(`/households/${id}`),

  join: (payload: JoinHouseholdPayload) =>
    api.post<Household>('/households/join', payload),

  leave: (id: string) =>
    api.post<void>(`/households/${id}/leave`),

  regenerateCode: (id: string) =>
    api.post<{ code: string }>(`/households/${id}/regenerate-code`),

  getMembers: (id: string) =>
    api.get<Household>(`/households/${id}`).then(h => h.members),
};

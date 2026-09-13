import api from '../../lib/api';
import type { Household, CreateHouseholdPayload, JoinHouseholdPayload } from '../../types/household';

/** Defensive normalize: old server responses used snake_case (household_id /
 *  member_id). A malformed shape broke `household.id`/`member.id` lookups
 *  (requested-by labels all showed "Left"). Map either shape to the type. */
export function normalizeHousehold(raw: any): Household {
  const members = (raw?.members ?? []).map((m: any) => ({
    id: m.id ?? m.member_id,
    userId: m.userId ?? null,
    name: m.name,
    role: m.role ?? 'member',
    canEditPlan: m.canEditPlan ?? true,
    autoPlanEnabled: m.autoPlanEnabled ?? true,
    profile: {
      // Diet-preference fields pass through as NULL when unset ("not set") —
      // never fabricated defaults. Server memberToJson is the source of truth.
      dietType: m.profile?.dietType ?? null,
      region: m.profile?.region ?? null,
      plannedSlots: m.profile?.plannedSlots ?? [],
      healthGoal: m.profile?.healthGoal ?? null,
      allergies: m.profile?.allergies ?? null,
      dislikedItems: m.profile?.dislikedItems ?? null,
      spiceLevel: m.profile?.spiceLevel ?? null,
    },
    joinedAt: m.joinedAt ?? '',
  }));
  return {
    id: raw?.id ?? raw?.household_id ?? '',
    name: raw?.name ?? '',
    adminId: raw?.adminId ?? '',
    code: raw?.code ?? '',
    members,
    createdAt: raw?.createdAt ?? '',
  };
}

export const householdApi = {
  create: (payload: CreateHouseholdPayload) =>
    api.post<Household>('/households', payload).then(normalizeHousehold),

  get: (id: string) =>
    api.get<Household>(`/households/${id}`).then(normalizeHousehold),

  join: (payload: JoinHouseholdPayload) =>
    api.post<Household>('/households/join', payload).then(normalizeHousehold),

  leave: (id: string) =>
    api.post<void>(`/households/${id}/leave`),

  regenerateCode: (id: string) =>
    api.post<{ code: string }>(`/households/${id}/regenerate-code`),

  updateMember: (householdId: string, memberId: string, patch: { role?: string; canEditPlan?: boolean; autoPlanEnabled?: boolean; plannedSlots?: string[] }) =>
    api.patch<{ id: string; role: string; canEditPlan: boolean; autoPlanEnabled: boolean }>(
      `/households/${householdId}/members/${memberId}`,
      patch,
    ),

  removeMember: (householdId: string, memberId: string) =>
    api.delete<{ ok: boolean; removed: string }>(`/households/${householdId}/members/${memberId}`),

  getMembers: (id: string) =>
    api.get<Household>(`/households/${id}`).then(normalizeHousehold).then(h => h.members),
};

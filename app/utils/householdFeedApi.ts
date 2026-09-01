import api from '../../lib/api';

export interface HouseholdRequestItem {
  id: string;
  date: string;
  slotType: string;
  dishId: string | null;
  dishName: string | null;
  requestedByMemberId: string;
  requestedByMemberName: string;
  ownerName: string;
  quantity: number;
}

export interface HouseholdActivityItem {
  id: string;
  memberName: string;
  action: string;
  detail: string;
  date: string;
}

export interface SharedPlanItem {
  id: string;
  authorUserId: string;
  date: string;
  mealType: string;
  dishId: string | null;
  dishName: string;
  icon: string;
  requestedBy: string | null;
  requestedFor: string | null;
  status: 'planned' | 'requested' | 'accepted' | 'completed';
  quantity: number;
  createdAt: string;
}

export function normalizeSharedPlan(raw: any[]): SharedPlanItem[] {
  return (raw ?? []).map((r: any) => ({
    id: r.id ?? '',
    authorUserId: r.authorUserId ?? '',
    date: r.date ?? '',
    mealType: r.mealType ?? 'lunch',
    dishId: r.dishId ?? null,
    dishName: r.dishName ?? '',
    icon: r.icon ?? '🍽️',
    requestedBy: r.requestedBy ?? null,
    requestedFor: r.requestedFor ?? null,
    status: (r.status ?? 'planned') as SharedPlanItem['status'],
    quantity: r.quantity ?? 1,
    createdAt: r.createdAt ?? new Date().toISOString(),
  }));
}

function normalizeRequests(raw: any[]): HouseholdRequestItem[] {
  return (raw ?? []).map(r => ({
    id: r.id ?? '',
    date: r.date ?? '',
    slotType: r.slotType ?? r.slot ?? '',
    dishId: r.dishId ?? null,
    dishName: r.dishName ?? null,
    requestedByMemberId: r.requestedByMemberId ?? r.requestedBy ?? '',
    requestedByMemberName: r.requestedByMemberName ?? r.requestedByName ?? 'Member',
    ownerName: r.ownerName ?? 'Member',
    quantity: r.quantity ?? 1,
  }));
}

function normalizeActivity(raw: any[]): HouseholdActivityItem[] {
  return (raw ?? []).map(a => ({
    id: a.id ?? '',
    memberName: a.memberName ?? 'Member',
    action: a.action ?? '',
    detail: a.detail ?? '',
    date: a.date ?? new Date().toISOString(),
  }));
}

export const householdFeedApi = {
  getRequests: (householdId: string, from?: string | null, days = 7) =>
    api.get<HouseholdRequestItem[]>(
      `/households/${householdId}/requests?days=${days}${from ? `&from=${from}` : ''}`,
    ).then(normalizeRequests),

  getActivity: (householdId: string) =>
    api.get<HouseholdActivityItem[]>(`/households/${householdId}/activity`).then(normalizeActivity),

  postActivity: (householdId: string, action: string, detail: string) =>
    api.post<HouseholdActivityItem>(`/households/${householdId}/activity`, { action, detail }),

  getSharedPlan: (householdId: string, from?: string | null, days = 7) =>
    api.get<SharedPlanItem[]>(
      `/households/${householdId}/plan?days=${days}${from ? `&from=${from}` : ''}`,
    ).then(normalizeSharedPlan),

  postSharedPlan: (householdId: string, item: Partial<SharedPlanItem> & { date: string; mealType: string; dishName: string }) =>
    api.post<SharedPlanItem>(`/households/${householdId}/plan`, item).then((r: any) => normalizeSharedPlan([r])[0] as SharedPlanItem),

  patchSharedPlan: (householdId: string, itemId: string, patch: { status?: string; requestedFor?: string | null }) =>
    api.patch<SharedPlanItem>(`/households/${householdId}/plan/${itemId}`, patch).then((r: any) => normalizeSharedPlan([r])[0] as SharedPlanItem),

  deleteSharedPlan: (householdId: string, itemId: string) =>
    api.delete<{ ok: boolean }>(`/households/${householdId}/plan/${itemId}`),
};
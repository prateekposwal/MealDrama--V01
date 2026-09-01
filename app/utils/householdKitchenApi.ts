import api from '../../lib/api';

export interface HouseholdStockLine { name: string; quantity: number; unit: string; purchasedBy: string; updatedAt?: string }
export interface MemberLaneSnapshot { memberId: string; snapshot: unknown; updatedAt?: string }

export function normalizeStock(raw: any[]): HouseholdStockLine[] {
  return (raw ?? []).map(r => ({
    name: r.name, quantity: r.quantity ?? 0, unit: r.unit ?? '', purchasedBy: r.purchasedBy ?? 'Member', updatedAt: r.updatedAt,
  }));
}

export const householdKitchenApi = {
  getStock: (householdId: string) =>
    api.get<HouseholdStockLine[]>(`/households/${householdId}/stock`).then(normalizeStock),

  addStock: (householdId: string, name: string, quantity: number, unit: string) =>
    api.post<{ name: string; quantity: number; unit: string; purchasedBy: string }>(`/households/${householdId}/stock`, { name, quantity, unit }),

  deleteStock: (householdId: string, name: string) =>
    api.delete<{ ok: boolean }>(`/households/${householdId}/stock/${encodeURIComponent(name)}`),

  getAssumptions: (householdId: string) =>
    api.get<Array<{ name: string; flag: 'have' | 'notHave' }>>(`/households/${householdId}/assumptions`),

  putAssumption: (householdId: string, name: string, flag: 'have' | 'notHave' | null) =>
    api.put<{ ok: boolean }>(`/households/${householdId}/assumptions/${encodeURIComponent(name)}`, flag ? { flag } : {}),

  getLanes: (householdId: string) =>
    api.get<MemberLaneSnapshot[]>(`/households/${householdId}/lanes`),

  regenerateLanes: (householdId: string) =>
    api.post<{ ok: boolean; cleared: number }>(`/households/${householdId}/lanes/regenerate`),

  putLane: (householdId: string, memberId: string, snapshot: unknown) =>
    api.put<{ memberId: string }>(`/households/${householdId}/lanes/${encodeURIComponent(memberId)}`, { snapshot }),
};
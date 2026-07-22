import api from '../../lib/api';
import type { Expense, MemberBalance, ActivityEntry } from '../../types/household';

export const expenseApi = {
  list: (householdId: string) =>
    api.get<Expense[]>(`/households/${householdId}/expenses`),

  create: (householdId: string, payload: {
    title: string; amount: number; category: string; splitType?: string;
  }) => api.post<Expense>(`/households/${householdId}/expenses`, payload),

  markPaid: (householdId: string, expenseId: string, splitId: string) =>
    api.patch(`/households/${householdId}/expenses/${expenseId}/splits/${splitId}/pay`),

  delete: (householdId: string, expenseId: string) =>
    api.delete(`/households/${householdId}/expenses/${expenseId}`),

  balances: (householdId: string) =>
    api.get<MemberBalance[]>(`/households/${householdId}/balances`),

  activity: (householdId: string) =>
    api.get<ActivityEntry[]>(`/households/${householdId}/activity`),

  // ─── Consolidated grocery: all members' meals ──
  householdMeals: (householdId: string, start?: string, end?: string) =>
    api.get<{ meals: any[]; members: { id: string; name: string }[] }>(
      `/households/${householdId}/meals?start=${start || ''}&end=${end || ''}`
    ),
};

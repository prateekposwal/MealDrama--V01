// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD-PLANS API (Gap 3) — every member's CURRENT generated plan as
// household-visible state.
//   PUT /api/v1/households/:id/plans → replace MY rows (called on every
//                                      tray/plan generation)
//   GET /api/v1/households/:id/plans → ALL members' rows (auth-gated);
//                                      the caller excludes their own
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../lib/api';

export interface HouseholdPlanRow {
  authorUserId: string;
  dishId: string;
  mealSlot: string;
  dayIndex: number;
}

export const householdPlanApi = {
  get: (householdId: string) =>
    api.get<{ householdId: string; dishes: HouseholdPlanRow[] }>(`/households/${householdId}/plans`),

  put: (householdId: string, rows: Array<{ dishId: string; mealSlot: string; dayIndex: number }>) =>
    api.put<{ replaced: number }>(`/households/${householdId}/plans`, { rows }),
};

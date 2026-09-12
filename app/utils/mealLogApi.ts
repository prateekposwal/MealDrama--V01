// ─────────────────────────────────────────────────────────────────────────────
// MEAL-LOG API (Gap 2) — persisted per-user "consumed" history.
//   PUT /api/v1/meal-log  → idempotent per (user, dish, slot, day)
//   GET /api/v1/meal-log  → MY latest eaten rows (bounded, newest first)
// ─────────────────────────────────────────────────────────────────────────────
import api from '../../lib/api';

export interface MealLogRow {
  id: string;
  dishId: string;
  mealSlot: string;
  eatenAt: string; // YYYY-MM-DD
  createdAt: string;
}

export const mealLogApi = {
  /** Log one dish as eaten — returns the row + whether it already existed. */
  put: (dishId: string, mealSlot: string, date?: string) =>
    api.put<{ log: MealLogRow; duplicate: boolean }>('/meal-log', {
      dishId,
      mealSlot,
      ...(date ? { date } : {}),
    }),

  /** MY eaten history — newest first, bounded server-side (default 100, max 200). */
  get: (limit = 100) =>
    api.get<MealLogRow[]>(`/meal-log?limit=${limit}`),
};

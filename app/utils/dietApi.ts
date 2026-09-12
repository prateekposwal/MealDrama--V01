import api from '../../lib/api';
import type { DietPreference, DietMemberView, HouseholdDietsView } from '../../types/household';

/**
 * Diet-preference API — the new first-class entity.
 *   PUT  /api/v1/diet                        → upsert MY diet
 *   GET  /api/v1/diet                        → my diet (or { diet: null })
 *   GET  /api/v1/households/:id/diets        → household diets view
 */
export interface DietUpsertPayload {
  dietType: string;
  region: string;
  allergies: string[];
  dislikedItems: string[];
  spiceLevel: string;
  healthGoal: string;
}

export const dietApi = {
  getMine: () =>
    api.get<{ diet: DietPreference | null }>('/diet'),

  upsertMine: (payload: DietUpsertPayload) =>
    api.put<{ diet: DietPreference }>('/diet', payload),

  listHouseholdDiets: (householdId: string) =>
    api.get<HouseholdDietsView>(`/households/${householdId}/diets`),
};

export type { DietPreference, DietMemberView, HouseholdDietsView };

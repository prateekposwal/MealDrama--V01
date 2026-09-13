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
  noveltyPreference?: string;
  cuisineAffinities?: string[];
}

/** PUT /api/v1/diet response — the server's diet-changed signal (see the
 *  route: dietChanged is true ONLY when a previous row existed AND a
 *  dish-affecting input differs; wasUnset marks the first-ever set). */
export interface DietUpsertResponse {
  diet: DietPreference;
  dietChanged: boolean;
  wasUnset: boolean;
  changed: { dietType: boolean; region: boolean; allergies: boolean };
}

export const dietApi = {
  getMine: () =>
    api.get<{ diet: DietPreference | null }>('/diet'),

  upsertMine: (payload: DietUpsertPayload) =>
    api.put<DietUpsertResponse>('/diet', payload),

  listHouseholdDiets: (householdId: string) =>
    api.get<HouseholdDietsView>(`/households/${householdId}/diets`),
};

export type { DietPreference, DietMemberView, HouseholdDietsView };

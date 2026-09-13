/**
 * Diet-preference policy — pure, dependency-light (zod only) so vitest can pin
 * the validation bounds and the household-visibility rule without a database.
 *
 * Source of truth for WHAT a user "actually eats": a `DietPreference` row
 * (one per user, upserted on first PUT /api/v1/diet). Absence = "not set" —
 * never a fabricated default. Values are bounded to the REAL picker options:
 *   - diet: veg | non-veg | eggitarian | vegan   (Profile.tsx inline picker)
 *   - region: canonical key OR the picker display label (FlashOnboarding
 *     REGIONS: 'North India' … 'Northeast India') — canonical key is stored
 *   - spice: mild | medium | hot                 (utils/formatSpice.ts)
 *   - healthGoal: the 6 FlashOnboarding HEALTH_GOALS labels (or "")
 *   - allergies: array of strings (Profile.tsx ALLERGIES_LIST), empty allowed
 *   - dislikedItems: array of strings (store field, no dedicated picker yet)
 */

import { z } from 'zod';

export const DIET_TYPE_VALUES = ['veg', 'non-veg', 'eggitarian', 'vegan'] as const;
export const DIET_TYPES = z.enum(DIET_TYPE_VALUES);

export const REGION_KEYS = ['north', 'south', 'east', 'west', 'central', 'northeast'] as const;
export const REGION_LABELS = [
  'North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India',
] as const;
export const REGION_LABEL_TO_KEY: Record<string, string> = {
  'North India': 'north',
  'South India': 'south',
  'East India': 'east',
  'West India': 'west',
  'Central India': 'central',
  'Northeast India': 'northeast',
};

export const SPICE_VALUES = ['mild', 'medium', 'hot'] as const;

export const NOVELTY_VALUES = ['familiar', 'balanced', 'adventurous'] as const;

/** ℹ️ healthGoal stores the picker's canonical display label, not a key —
 *  the same strings FlashOnboarding persists to user.healthGoals[0] and
 *  goalToDishHealthFilter() already understands. */
export const HEALTH_GOAL_VALUES = [
  'Balanced', 'High Protein', 'High Fiber', 'Low Calorie', 'Low Fat', 'Weight Loss',
] as const;

/** Region accepts the canonical key ('north') or the picker label
 *  ('North India'); stores the canonical key (matches Meal.region + old
 *  UserProfile.region defaults so lane generation keeps working). */
export const DIET_REGION = z
  .union([z.enum(REGION_KEYS), z.enum(REGION_LABELS)])
  .transform(v => REGION_LABEL_TO_KEY[v] ?? v);

export const HEALTH_GOAL = z.union([z.enum(HEALTH_GOAL_VALUES), z.literal('')]);

const STRING_ARRAY = z.array(z.string().trim().min(1).max(50)).max(20);

export const dietPreferenceSchema = z.object({
  dietType: DIET_TYPES,
  region: DIET_REGION,
  allergies: STRING_ARRAY.default([]),
  dislikedItems: STRING_ARRAY.default([]),
  spiceLevel: z.enum(SPICE_VALUES),
  healthGoal: HEALTH_GOAL.default(''),
  // Taste personalization (canonical — the ONE shape onboarding, Profile and
  // the scorer share; see utils/tasteProfile.ts).
  noveltyPreference: z.enum(NOVELTY_VALUES).default('balanced'),
  cuisineAffinities: STRING_ARRAY.default([]),
});

export type DietPreferenceInput = z.infer<typeof dietPreferenceSchema>;

/** API shape for a diet row — same fields the picker edits. */
export interface DietPreferenceView {
  dietType: string;
  region: string;
  allergies: string[];
  dislikedItems: string[];
  spiceLevel: string;
  healthGoal: string;
  noveltyPreference: string;
  cuisineAffinities: string[];
}

export function serializeDietPreference(row: any): DietPreferenceView {
  return {
    dietType: row?.dietType ?? 'veg',
    region: row?.region ?? 'north',
    allergies: row?.allergies ?? [],
    dislikedItems: row?.dislikedItems ?? [],
    spiceLevel: row?.spiceLevel ?? 'medium',
    healthGoal: row?.healthGoal ?? '',
    noveltyPreference: row?.noveltyPreference ?? 'balanced',
    cuisineAffinities: row?.cuisineAffinities ?? [],
  };
}

export interface HouseholdDietMemberView {
  memberId: string;
  userId: string | null;
  memberName: string;
  role: string;
  /** null = this member never PUT a diet (honest "not set" — no defaults). */
  diet: DietPreferenceView | null;
}

/**
 * Household-visibility rule (POLICY — pinned by unit tests):
 *  - household ADMIN → every member's full diet
 *  - non-admin member → ONLY their own diet (no visibility into others)
 *  - non-member → never reaches this function (routes 403 first)
 * `members` are prisma HouseholdMember rows with `user.dietPreference` loaded.
 */
export function buildHouseholdDietsView(members: any[], viewerUserId: string): { members: HouseholdDietMemberView[] } {
  const me = members.find((m: any) => m.userId === viewerUserId);
  const isAdmin = me?.role === 'admin';
  const visible = isAdmin ? members : members.filter((m: any) => m.userId === viewerUserId);
  return {
    members: visible.map((m: any) => {
      const dietRow = m?.user?.dietPreference ?? m?.dietPreference ?? null;
      return {
        memberId: m.id,
        userId: m.userId ?? null,
        memberName: m.name,
        role: m.role,
        diet: dietRow ? serializeDietPreference(dietRow) : null,
      };
    }),
  };
}

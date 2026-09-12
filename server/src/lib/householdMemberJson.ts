/**
 * Pure mapper — HouseholdMember (prisma row, possibly with `user.profile` and
 * `user.dietPreference` loaded) → the API JSON shape the frontend
 * types/household.ts consumes.
 *
 * SOURCE OF TRUTH: since the Diet feature shipped, the REAL diet fields
 * (dietType / region / allergies / dislikedItems / spiceLevel / healthGoal)
 * come from `user.dietPreference` — a member who never PUT a diet has NULL
 * diet fields (honest "not set"), NEVER the legacy UserProfile defaults
 * ('veg'/'north') that were client-only and never written server-side.
 * `plannedSlots` remains a UserProfile field and keeps flowing from profile.
 *
 * WHY IT EXISTS: the GET /:householdId route previously included `user: true`
 * but read `user.profile` — the relation was never loaded, so every member
 * silently fell back to veg/north/[] defaults and FamilyPlans generated wrong
 * lanes after any reload. Including the relations at the query site + mapping
 * here keeps the shapes honest. Standalone + dependency-free for vitest.
 */

export interface HouseholdMemberJson {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  canEditPlan: boolean;
  autoPlanEnabled: boolean;
  profile: {
    /** null = member never set a diet (no DietPreference row) — never a default. */
    dietType: string | null;
    /** null = not set (canonical key when set: 'north' | 'south' | …). */
    region: string | null;
    plannedSlots: string[];
    healthGoal: string | null;
    allergies: string[] | null;
    dislikedItems: string[] | null;
    spiceLevel: string | null;
  };
  joinedAt: string;
}

export function memberToJson(m: any): HouseholdMemberJson {
  const profile = m?.user?.profile ?? m?.profile;
  const dietRow = m?.user?.dietPreference ?? m?.dietPreference ?? null;
  const notSet = {
    dietType: null,
    region: null,
    healthGoal: null,
    allergies: null,
    dislikedItems: null,
    spiceLevel: null,
  };
  const diet = dietRow
    ? {
        dietType: dietRow.dietType ?? 'veg',
        region: dietRow.region ?? 'north',
        healthGoal: dietRow.healthGoal ?? '',
        allergies: dietRow.allergies ?? [],
        dislikedItems: dietRow.dislikedItems ?? [],
        spiceLevel: dietRow.spiceLevel ?? 'medium',
      }
    : notSet;
  return {
    id: m.id,
    userId: m.userId ?? null,
    name: m.name,
    role: m.role,
    canEditPlan: m.canEditPlan ?? true,
    autoPlanEnabled: m.autoPlanEnabled ?? true,
    profile: {
      ...diet,
      plannedSlots: profile?.plannedSlots ?? [],
    },
    joinedAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
  };
}

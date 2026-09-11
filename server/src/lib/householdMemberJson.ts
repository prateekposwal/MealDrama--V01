/**
 * Pure mapper — HouseholdMember (prisma row, possibly with `user.profile`
 * loaded) → the API JSON shape the frontend types/household.ts consumes.
 *
 * WHY IT EXISTS: the GET /:householdId route previously `include: { user: true }`
 * but read `user.profile` — the profile relation was NEVER loaded, so every
 * member silently fell back to veg/north/[] defaults and FamilyPlans generated
 * wrong lanes after any reload (non-veg members got veg weeks). Including
 * `user: { include: { profile: true } }` at the query site + mapping here keeps
 * the two shapes honest. Standalone + dependency-free so vitest can pin it.
 */

export interface HouseholdMemberJson {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  canEditPlan: boolean;
  autoPlanEnabled: boolean;
  profile: {
    dietType: string;
    region: string;
    plannedSlots: string[];
    healthGoal: string;
  };
  joinedAt: string;
}

export function memberToJson(m: any): HouseholdMemberJson {
  const profile = m?.user?.profile ?? m?.profile;
  return {
    id: m.id,
    userId: m.userId ?? null,
    name: m.name,
    role: m.role,
    canEditPlan: m.canEditPlan ?? true,
    autoPlanEnabled: m.autoPlanEnabled ?? true,
    profile: {
      dietType: profile?.dietType ?? 'veg',
      region: profile?.region ?? 'north',
      plannedSlots: profile?.plannedSlots ?? [],
      healthGoal: profile?.healthGoal ?? '',
    },
    joinedAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
  };
}

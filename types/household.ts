export type HouseholdRole = 'admin' | 'member';

export interface HouseholdMemberProfile {
  /** null = member never set a diet (no DietPreference row) — never a default. */
  dietType: string | null;
  /** null = not set (canonical key when set: 'north' | 'south' | …). */
  region: string | null;
  plannedSlots: string[];
  healthGoal: string | null;
  allergies?: string[] | null;
  dislikedItems?: string[] | null;
  spiceLevel?: string | null;
}

export interface HouseholdMember {
  id: string;
  userId?: string | null;
  name: string;
  role: HouseholdRole;
  canEditPlan: boolean;
  autoPlanEnabled: boolean;
  profile?: HouseholdMemberProfile;
  joinedAt: string;
}

export interface Household {
  id: string;
  name: string;
  adminId: string;
  code: string;
  members: HouseholdMember[];
  createdAt: string;
}

export interface CreateHouseholdPayload { name: string; }
export interface JoinHouseholdPayload { code: string; }

// ─── Diet Preferences (first-class entity, one row per user) ────────────────
export interface DietPreference {
  dietType: string;
  region: string;
  allergies: string[];
  dislikedItems: string[];
  spiceLevel: string;
  healthGoal: string;
  noveltyPreference?: string;
  cuisineAffinities?: string[];
}

/** One member's row in GET /households/:id/diets — diet null = "not set". */
export interface DietMemberView {
  memberId: string;
  userId: string | null;
  memberName: string;
  role: string;
  diet: DietPreference | null;
}

export interface HouseholdDietsView {
  householdId: string;
  members: DietMemberView[];
}

// ─── Expense Types ──────────────────────────────────────────────────────────
export type ExpenseCategory = 'cook_salary' | 'groceries' | 'utilities' | 'supplies' | 'other';

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  memberId: string;
  amount: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  householdId: string;
  addedBy: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType: 'equal' | 'custom';
  date: string;
  settled: boolean;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalOwed: number;
  totalPaid: number;
  balance: number;
}

// ─── Activity Types ──────────────────────────────────────────────────────────
export interface ActivityEntry {
  id: string;
  householdId: string;
  memberName: string;
  action: string;
  detail: string;
  date: string;
}

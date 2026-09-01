export type HouseholdRole = 'admin' | 'member';

export interface HouseholdMemberProfile {
  dietType: string;
  region: string;
  plannedSlots: string[];
  healthGoal: string;
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

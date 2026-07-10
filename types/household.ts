export type HouseholdRole = 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  name: string;
  role: HouseholdRole;
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

export interface CreateHouseholdPayload {
  name: string;
}

export interface JoinHouseholdPayload {
  code: string;
}

// Shared-plan status state machine — the ONE place that defines legal
// transitions. Server enforces it; tests lock it.
export type SharedStatus = 'planned' | 'requested' | 'accepted' | 'completed';

export const SHARED_STATUSES: SharedStatus[] = ['planned', 'requested', 'accepted', 'completed'];

const TRANSITIONS: Record<SharedStatus, SharedStatus[]> = {
  planned: ['accepted', 'completed'],
  requested: ['planned', 'accepted', 'completed'],
  accepted: ['completed'],
  completed: [],
};

export function isValidPlanStatusTransition(from: SharedStatus, to: SharedStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** A member who cannot edit their own lane may still READ the week. */
export function canEditSharedPlan(role: string | undefined, canEditPlan: boolean | undefined): boolean {
  const roleOk = role === 'admin' || (canEditPlan ?? true) === true;
  return roleOk;
}
import api from '../../lib/api';

/**
 * Log a meal activity to the household feed.
 * Fire-and-forget: silently fails if offline or no household.
 */
export function logActivity(
  householdId: string | null,
  memberName: string,
  action: string,
  detail: string,
) {
  if (!householdId) return;
  // Fire-and-forget — don't block the UI
  api.post(`/households/${householdId}/activity`, {
    memberName, action, detail,
  }).catch((err) => {
    console.warn('[Activity] Log failed (non-blocking):', err);
  });
}

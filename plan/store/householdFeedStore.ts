// ─────────────────────────────────────────────────────────────────────────────
// HOUSEHOLD FEED STORE — the shared-plan / members-requests / notifications hub.
// Not persisted (derived from the server). Meanwhile:
//   • requests   — cross-member meal requests (🙋 "Riya wants Butter Chicken")
//   • activity   — household feed (added / purchased ...)
//   • notifications — merged requests+activity; unread = anything newer than
//     `lastSeen`, driving the red-dot badges ("every dot connected").
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { householdFeedApi, HouseholdRequestItem, HouseholdActivityItem, SharedPlanItem } from '../../app/utils/householdFeedApi';
import { useNotificationStore } from '../../app/notifications/notificationStore';

export interface HouseholdNotification {
  id: string;
  kind: 'request' | 'activity';
  action?: string;
  title: string;
  detail: string;
  date: string;
}

// ─── Bell bridge ─────────────────────────────────────────────────────────────
// Every household event Lands in the header bell (notificationStore). The
// dedupe uses a PERSISTED "last bridged" time — a fresh device only starts
// bridging events that happen AFTER it first opened (no "old news" flood).
const BRIDGE_KEY = 'md-bell-bridge';
const _bridgedIds = new Set<string>();
function bridgeSince(): number {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(BRIDGE_KEY) : null;
    if (raw) return Number(raw);
    const now = Date.now();
    if (typeof window !== 'undefined') window.localStorage.setItem(BRIDGE_KEY, String(now));
    return now; // first open → only future events notify
  } catch {
    return Date.now();
  }
}
function markBridged(): void {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(BRIDGE_KEY, String(Date.now())); } catch { /* ignore */ }
}

export interface BridgeCandidate { sourceId: string; type: 'family_request' | 'family_activity'; title: string; message: string; }

/** New (after `since`) household events mapped to bell notifications — pure,
 *  idempotent (re-polling duplicates nothing). */
export function bridgeCandidates(
  requests: HouseholdRequestItem[],
  activity: HouseholdActivityItem[],
  since: number,
): BridgeCandidate[] {
  const out: BridgeCandidate[] = [];
  const req = requests.filter(r => r.dishName || r.dishId).map(r => ({
    sourceId: `req:${r.id}`,
    type: 'family_request' as const,
    title: `${r.requestedByMemberName} requested ${r.dishName ?? 'a meal'}`,
    message: `${r.slotType} · ${r.date}`,
    ts: new Date(`${r.date}T00:00:00`).getTime(),
  }));
  const acts = activity.map(a => ({
    sourceId: `act:${a.id}`,
    type: 'family_activity' as const,
    title: `${a.memberName} ${a.action}`,
    message: a.detail,
    ts: new Date(a.date).getTime(),
  }));
  for (const c of [...req, ...acts]) {
    if (_bridgedIds.has(c.sourceId)) continue;
    if (c.ts <= since) continue;
    _bridgedIds.add(c.sourceId);
    out.push(c);
  }
  return out;
}

export function resetBridgeSeen(): void { _bridgedIds.clear(); }

function bridgeToBell(requests: HouseholdRequestItem[], activity: HouseholdActivityItem[], lastSeen: number): void {
  const since = Math.max(lastSeen, bridgeSince());
  const candidates = bridgeCandidates(requests, activity, since);
  if (candidates.length) markBridged();
  for (const c of candidates) {
    useNotificationStore.getState().addNotification({ type: c.type, title: c.title, message: c.message });
  }
}

/** Broadcast a family change so EVERY device (and the bell) updates fast. */
function notifyFamily(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('family:refresh'));
}

export interface HouseholdFeedState {
  requests: HouseholdRequestItem[];
  activity: HouseholdActivityItem[];
  sharedPlan: SharedPlanItem[];
  lastSeen: number;
  refreshing: boolean;
  lastError: string | null;
  refresh: (householdId: string) => Promise<void>;
  markSeen: () => void;
  postActivity: (householdId: string, action: string, detail: string) => Promise<void>;
  addSharedPlan: (householdId: string, item: Partial<SharedPlanItem> & { date: string; mealType: string; dishName: string }) => Promise<void>;
  setSharedStatus: (householdId: string, itemId: string, status: SharedPlanItem['status'], requestedFor?: string | null) => Promise<void>;
  removeSharedPlan: (householdId: string, itemId: string) => Promise<void>;
}

function toNotifications(
  requests: HouseholdRequestItem[],
  activity: HouseholdActivityItem[],
): HouseholdNotification[] {
  const out: HouseholdNotification[] = requests
    .filter(r => r.dishName || r.dishId)
    .map(r => ({
      id: `req:${r.id}`,
      kind: 'request' as const,
      action: 'requested',
      title: `${r.requestedByMemberName} requested ${r.dishName ?? 'a meal'}`,
      detail: `${r.slotType} · ${r.date}`,
      date: new Date(`${r.date}T00:00:00`).toISOString(),
    }));
  for (const a of activity) {
    out.push({
      id: `act:${a.id}`,
      kind: 'activity' as const,
      action: a.action,
      title: `${a.memberName} ${a.action}`,
      detail: a.detail,
      date: a.date,
    });
  }
  return out.sort((x, y) => (x.date < y.date ? 1 : -1));
}

export function unreadCount(notifications: HouseholdNotification[], lastSeen: number): number {
  return notifications.filter(n => new Date(n.date).getTime() > lastSeen).length;
}

export const useHouseholdFeedStore = create<HouseholdFeedState>((set, get) => ({
  requests: [],
  activity: [],
  sharedPlan: [],
  lastSeen: Date.now(),
  refreshing: false,
  lastError: null,

  refresh: async (householdId: string) => {
    if (!householdId || get().refreshing) return;
    set({ refreshing: true });
    try {
      const [requests, activity, sharedPlan] = await Promise.all([
        householdFeedApi.getRequests(householdId),
        householdFeedApi.getActivity(householdId),
        householdFeedApi.getSharedPlan(householdId),
      ]);
      set({ requests, activity, sharedPlan, lastError: null });
      bridgeToBell(requests, activity, get().lastSeen);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('family:refresh'));
    } catch (e: any) {
      set({ lastError: e?.message ?? 'household feed unavailable' });
    } finally {
      set({ refreshing: false });
    }
  },

  markSeen: () => set({ lastSeen: Date.now() }),

  postActivity: async (householdId: string, action: string, detail: string) => {
    try {
      const posted = await householdFeedApi.postActivity(householdId, action, detail);
      set(s => ({ activity: [posted, ...s.activity].slice(0, 50) }));
      set({ lastSeen: Date.now() });
    } catch {
      // best-effort — local streak continues even if the feed is offline
    }
  },

  addSharedPlan: async (householdId, item) => {
    try {
      const created = await householdFeedApi.postSharedPlan(householdId, item);
      set(s => ({ sharedPlan: [...s.sharedPlan, created] }));
      await get().postActivity(householdId, 'added', `${item.dishName} → ${item.mealType}`); notifyFamily();
    } catch {
      // best-effort — the local plan still has it
    }
  },

  setSharedStatus: async (householdId, itemId, status, requestedFor) => {
    try {
      const updated = await householdFeedApi.patchSharedPlan(householdId, itemId, { status, requestedFor });
      set(s => ({ sharedPlan: s.sharedPlan.map(i => (i.id === itemId ? updated : i)) }));
      await get().postActivity(householdId, status, `${updated.dishName} (${updated.mealType})`); notifyFamily();
    } catch {
      // ignore transient failures — next poll reconciles
    }
  },

  removeSharedPlan: async (householdId, itemId) => {
    try {
      const item = get().sharedPlan.find(i => i.id === itemId);
      await householdFeedApi.deleteSharedPlan(householdId, itemId);
      set(s => ({ sharedPlan: s.sharedPlan.filter(i => i.id !== itemId) }));
      if (item) await get().postActivity(householdId, 'removed', `${item.dishName} (${item.mealType})`); notifyFamily();
    } catch {
      // ignore
    }
  },
}));

export { toNotifications };

/** Shared-plan items for a date (pure helper for the Family week view). */
export function sharedItemsForDate(items: SharedPlanItem[], date: string): SharedPlanItem[] {
  return items.filter(i => i.date === date && i.status !== 'completed');
}
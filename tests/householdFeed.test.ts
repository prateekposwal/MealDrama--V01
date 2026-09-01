import { describe, it, expect } from 'vitest';
import { toNotifications, unreadCount, sharedItemsForDate, bridgeCandidates, resetBridgeSeen } from '../plan/store/householdFeedStore';
import type { HouseholdRequestItem, HouseholdActivityItem, SharedPlanItem } from '../app/utils/householdFeedApi';

const req = (o: Partial<HouseholdRequestItem> & { dishName: string }): HouseholdRequestItem => ({
  id: 'r1', date: '2026-08-25', slotType: 'lunch', dishId: 'x', requestedByMemberId: 'm-2',
  requestedByMemberName: 'Riya', ownerName: 'Me', quantity: 1, ...o,
});

const act = (o: Partial<HouseholdActivityItem> & { detail: string }): HouseholdActivityItem => ({
  id: 'a1', memberName: 'Riya', action: 'purchased', date: '2026-08-25T10:00:00.000Z', ...o,
});

describe('householdFeedStore — notifications & unread', () => {
  it('merges requests + activity into notifications, newest first', () => {
    const ns = toNotifications(
      [req({ dishName: 'Butter Chicken', date: '2026-08-24' })],
      [act({ detail: 'Milk ×2', date: '2026-08-26T10:00:00.000Z' })],
    );
    expect(ns.length).toBe(2);
    expect(ns[0]!.kind).toBe('activity'); // newest first
    expect(ns[1]!.kind).toBe('request');
    expect(ns[1]!.title).toContain('requested Butter Chicken');
  });

  it('unreadCount counts only notifications newer than lastSeen', () => {
    const ns = [
      { id: 'a', kind: 'request' as const, title: 'x', detail: 'y', date: '2026-08-25T05:00:00.000Z' },
      { id: 'b', kind: 'activity' as const, title: 'x', detail: 'y', date: '2026-08-21T00:00:00.000Z' },
    ];
    expect(unreadCount(ns, new Date('2026-08-24T00:00:00Z').getTime())).toBe(1);
    // Seen everything -> zero, even when the payload has future-dated events
    expect(unreadCount(ns, new Date('2026-08-26T00:00:00Z').getTime())).toBe(0);
    expect(unreadCount(ns, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('request notifications are user-friendly and carry member attribution', () => {
    const ns = toNotifications([req({ dishName: 'Kadai Paneer', requestedByMemberName: 'Riya' })], []);
    expect(ns[0]!.title).toBe('Riya requested Kadai Paneer');
    expect(ns[0]!.detail).toContain('lunch');
  });
});

describe('sharedItemsForDate — the one-week family table', () => {
  const item = (o: Partial<SharedPlanItem>): SharedPlanItem => ({
    id: 'i1', authorUserId: 'u1', date: '2026-08-25', mealType: 'lunch', dishId: 'x',
    dishName: 'Rajma', icon: '🍛', requestedBy: null, requestedFor: null,
    status: 'planned', quantity: 1, createdAt: '2026-08-25T00:00:00Z', ...o,
  });
  it('keeps only the requested date and hides completed rows', () => {
    const plan = [
      item({ id: 'a', date: '2026-08-25' }),
      item({ id: 'b', date: '2026-08-26' }),
      item({ id: 'c', date: '2026-08-25', status: 'completed' }),
      item({ id: 'd', date: '2026-08-25', status: 'requested' }),
    ];
    const out = sharedItemsForDate(plan, '2026-08-25');
    expect(out.map(i => i.id)).toEqual(['a', 'd']);
  });
  it('empty plan → empty', () => {
    expect(sharedItemsForDate([], '2026-08-25')).toEqual([]);
  });
});

describe('bridgeCandidates — every dot connects to the bell', () => {
  it('maps ONLY new (post-lastSeen) household events into bell notifications', () => {
    resetBridgeSeen();
    const lastSeen = new Date('2026-08-24T00:00:00Z').getTime();
    const first = bridgeCandidates(
      [req({ dishName: 'Rajma', date: '2026-08-25' })],
      [act({ detail: 'Milk ×2', date: '2026-08-26T10:00:00.000Z' })],
      lastSeen,
    );
    expect(first).toHaveLength(2);
    expect(first[0]!.type).toBe('family_request'); // requests feed first
    expect(first[1]!.type).toBe('family_activity');
  });

  it('idempotent across re-polls (re-polling duplicates NOTHING)', () => {
    resetBridgeSeen();
    bridgeCandidates([req({ dishName: 'Rajma', date: '2026-08-25' })], [], 0);
    const again = bridgeCandidates([req({ dishName: 'Rajma', date: '2026-08-25' })], [], 0);
    expect(again).toEqual([]);
  });
});
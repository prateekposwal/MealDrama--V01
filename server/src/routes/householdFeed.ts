import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// HOUSEHOLD FEED — true shared plans: cross-member meal REQUESTS + activity +
// pantry purchases, so two (or more) users see each other's plans/pantry.
// Built on the existing schema (TrayItem.requestedBy + ActivityFeed) — no migration.
// ============================================================================

/** Ensure the caller belongs to this household; return it + the member list. */
async function requireMembership(req: Request, householdId: string) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { members: { include: { user: true } } },
  });
  if (!household) throw new APIError('NOT_FOUND', 'Household not found', 404);
  const isMember = household.members.some((m: any) => m.userId === userId);
  if (!isMember) throw new APIError('FORBIDDEN', 'Not a member', 403);
  return household;
}

/**
 * GET /api/v1/households/:id/requests?from=YYYY-MM-DD&days=7
 * Cross-member meal requests: every TrayItem across household members that a
 * member flagged (requestedBy set) — the "Riya requested Butter Chicken"
 * feed. Requests are keyed by member id so the client renders 🙋 names.
 */
router.get('/:householdId/requests', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const household = await requireMembership(req, householdId);

    const fromStr = String(req.query.from || '');
    const days = Math.min(Number(req.query.days || 7), 14);
    const from = fromStr ? new Date(fromStr) : new Date(new Date().toDateString());
    const until = new Date(from.getTime() + days * 86400000);

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      include: { user: true },
    });
    const memberIds = members.map((m: any) => m.userId);

    const slots = await prisma.traySlot.findMany({
      where: { userId: { in: memberIds }, date: { gte: from, lt: until } },
      include: { items: { include: { meal: true } }, user: true },
    });

    const requests = [];
    for (const slot of slots) {
      const member = members.find((m: any) => m.userId === slot.userId);
      for (const item of slot.items) {
        if (!item.requestedBy) continue;
        requests.push({
          id: `${slot.id}:${item.id}`,
          date: slot.date.toISOString().slice(0, 10),
          slotType: slot.slot,
          dishId: item.mealId ?? item.customDishId ?? null,
          dishName: item.meal?.name ?? null,
          requestedByMemberId: item.requestedBy,
          requestedByMemberName: member?.name ?? 'Member',
          ownerName: slot.user?.name ?? 'Member',
          quantity: item.quantity,
        });
      }
    }
    requests.sort((a, b) => a.date.localeCompare(b.date));
    res.json(requests);
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household requests error:', error);
    res.status(500).json({ error: 'Failed to fetch household requests' });
  }
});

/**
 * GET /api/v1/households/:id/activity and POST /api/v1/households/:id/activity
 * are mounted by routes/expenses.ts, which is registered BEFORE this router in
 * index.ts. These two routes were shadowed (the expenses handlers won for both
 * GET and POST) and are REMOVED here — they were never reachable. The active
 * handlers in expenses.ts carry the membership gate and the memberName rules.
 */

export default router;
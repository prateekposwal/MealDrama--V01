import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';

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
 * GET /api/v1/households/:id/activity
 * Household activity feed (meal adds, requests, pantry purchases).
 */
router.get('/:householdId/activity', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const feed = await prisma.activityFeed.findMany({
      where: { householdId },
      orderBy: { date: 'desc' },
      take: 50,
    });
    res.json(feed.map(e => ({
      id: e.id,
      memberName: e.memberName,
      action: e.action,
      detail: e.detail,
      date: e.date.toISOString(),
    })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household activity error:', error);
    res.status(500).json({ error: 'Failed to fetch household activity' });
  }
});

/**
 * POST /api/v1/households/:id/activity
 * Record a household event (meal requested/added, pantry purchase).
 * Any member may log; memberName comes from the caller's membership row.
 */
router.post('/:householdId/activity', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const household = await requireMembership(req, householdId);
    const payload = z.object({
      action: z.string().min(1).max(40),
      detail: z.string().min(1).max(200),
    }).parse(req.body);

    const me = household.members.find((m: any) => m.userId === (req as any).user?.userId);
    const created = await prisma.activityFeed.create({
      data: {
        householdId,
        memberName: me?.name ?? (req as any).user?.name ?? 'Member',
        action: payload.action,
        detail: payload.detail,
      },
    });
    res.status(201).json({
      id: created.id,
      memberName: created.memberName,
      action: created.action,
      detail: created.detail,
      date: created.date.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Household activity post error:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

export default router;
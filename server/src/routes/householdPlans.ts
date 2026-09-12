import { Router, Request } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { z } from 'zod';
import { Slot } from '../lib/validation';

/**
 * HOUSEHOLD PLAN VISIBILITY (Gap 3 closure).
 *
 *   GET /api/v1/households/:householdId/plans
 *     → EVERY member's CURRENT generated-plan dishes (auth-gated to
 *       household members; 403 for non-members). The table holds exactly
 *       what each member last generated — members with nothing persisted
 *       are simply absent (recorded, never guessed). The CLIENT excludes
 *       the caller's own rows (their own dishes are never penalized).
 *
 *   PUT /api/v1/households/:householdId/plans
 *     → REPLACE MY rows with the current generated plan (called on every
 *       tray/plan generation). Replace-all semantics keep the table honest:
 *       it mirrors the latest generated state, stale rows never linger.
 *
 * This EXTENDS the shared-plan surface (SharedPlanItem is still authored by
 * explicit share/request actions) — it does not shadow or fork it.
 */
const router = Router();
router.use(authMiddleware);

function toJson(row: any) {
  return {
    authorUserId: row.authorUserId,
    dishId: row.dishId,
    mealSlot: row.mealSlot,
    dayIndex: row.dayIndex,
  };
}

async function requireMembership(req: Request, householdId: string) {
  const userId = req.user?.userId;
  if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { members: true },
  });
  if (!household) throw new APIError('NOT_FOUND', 'Household not found', 404);
  const isMember = household.members.some((m: any) => m.userId === userId);
  if (!isMember) throw new APIError('FORBIDDEN', 'Not a member of this household', 403);
  return { userId, household };
}

/** GET /:householdId/plans — all members' current plan dishes. */
router.get('/:householdId/plans', async (req: Request, res: any) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const rows = await prisma.householdPlanItem.findMany({
      where: { householdId },
      orderBy: [{ authorUserId: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ householdId, dishes: rows.map(toJson) });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household plans fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch household plans' });
  }
});

const PlanRowsSchema = z.object({
  rows: z.array(z.object({
    dishId: z.string().min(1).max(200),
    mealSlot: Slot,
    dayIndex: z.number().int().min(0).max(13),
  })).max(200),
});

/** PUT /:householdId/plans — replace MY rows with the current generated plan. */
router.put('/:householdId/plans', async (req: Request, res: any) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { userId } = await requireMembership(req, householdId);
    const { rows } = PlanRowsSchema.parse(req.body);

    // Replace-all for THIS author: the table mirrors the latest generated
    // state exactly — stale dishes from a previous generation never linger.
    await prisma.$transaction([
      prisma.householdPlanItem.deleteMany({ where: { householdId, authorUserId: userId } }),
      prisma.householdPlanItem.createMany({
        data: rows.map(r => ({ householdId, authorUserId: userId, dishId: r.dishId, mealSlot: r.mealSlot, dayIndex: r.dayIndex })),
      }),
    ]);
    res.json({ replaced: rows.length });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Household plans put error:', error);
    res.status(500).json({ error: 'Failed to save household plans' });
  }
});

export default router;

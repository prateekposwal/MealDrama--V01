import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { z } from 'zod';
import {
  dietPreferenceSchema,
  serializeDietPreference,
  buildHouseholdDietsView,
} from '../lib/dietPolicy';

// ============================================================================
// DIET PREFERENCES — first-class entity.
//   PUT /api/v1/diet            → upsert MY diet (create-on-first-set)
//   GET /api/v1/diet            → my diet, or { diet: null } when never set
//   GET /api/v1/households/:householdId/diets
//                                → household diets: admin sees ALL members'
//                                  real diets; non-admin sees their own only
// ============================================================================

// ─── Own-diet router (mounted at /api/v1/diet) ─────────────────────────────
export const dietRouter = Router();
dietRouter.use(authMiddleware);

/**
 * PUT /api/v1/diet — upsert MY diet preference. Create-on-first-set, then
 * update in place (unique userId — never duplicates). Values are bounded by
 * dietPreferenceSchema to the real picker options.
 */
dietRouter.put('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const data = dietPreferenceSchema.parse(req.body);
    const row = await prisma.dietPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    res.json({ diet: serializeDietPreference(row) });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    console.error('[API] Diet upsert error:', error);
    res.status(500).json({ error: 'Failed to save diet preference' });
  }
});

/**
 * GET /api/v1/diet — my diet. Honest empty state: `{ diet: null }` when the
 * user never set one (no fabricated default).
 */
dietRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const row = await prisma.dietPreference.findUnique({ where: { userId } });
    res.json({ diet: row ? serializeDietPreference(row) : null });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Diet fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch diet preference' });
  }
});

// ─── Household-diets router (mounted at /api/v1/households) ─────────────────
export const householdDietsRouter = Router();
householdDietsRouter.use(authMiddleware);

/**
 * GET /api/v1/households/:householdId/diets
 * POLICY: household admins see EVERY member's full diet (or null when a
 * member never set one); non-admin members see ONLY their own diet.
 * Non-members get 403 (matches GET /:householdId and kitchen requireMembership).
 */
householdDietsRouter.get('/:householdId/diets', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
    const householdId = String(req.params.householdId || '');

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: { user: { include: { dietPreference: true } } },
        },
      },
    });
    if (!household) throw new APIError('NOT_FOUND', 'Household not found', 404);
    const isMember = household.members.some((m: any) => m.userId === userId);
    if (!isMember) throw new APIError('FORBIDDEN', 'Not a member of this household', 403);

    res.json({ householdId: household.id, ...buildHouseholdDietsView(household.members, userId) });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household diets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch household diets' });
  }
});

export default dietRouter;

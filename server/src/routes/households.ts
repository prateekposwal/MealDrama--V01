import { Router, Request, Response, NextFunction } from 'express';
import { APIError } from '../index';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();

/**
 * POST /api/v1/households
 * Create a new household
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // TODO: Implement household creation with proper validation.
    // Authorization: only the creating user is a member.
    res.status(501).json({ error: 'Household creation not implemented' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/households/:householdId
 * Get household details
 */
router.get('/:householdId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { householdId } = req.params;
    if (!householdId) return res.status(400).json({ error: 'Missing householdId' });

    // TODO: Replace with real query once Household model exists.
    // Authorization check: userId must be a member of householdId.
    // const membership = await prisma.householdMember.findUnique({
    //   where: { userId_householdId: { userId, householdId } },
    // });
    // if (!membership) return res.status(403).json({ error: 'Forbidden' });
    // const household = await prisma.household.findUnique({ where: { id: householdId } });
    // if (!household) return res.status(404).json({ error: 'Not found' });
    // return res.json(household);

    res.status(501).json({ error: 'Household retrieval not implemented' });
  } catch (error) {
    next(error);
  }
});

export default router;

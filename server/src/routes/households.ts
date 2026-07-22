import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// ─── Lightweight Household Routes: create, join, get, leave, regenerate ───

/**
 * GET /api/v1/households/:householdId
 * Get household details with members
 */
router.get('/:householdId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const householdId = req.params.householdId as string;
    if (!householdId) return res.status(400).json({ error: 'Missing householdId' });

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: { user: true, healthProfile: true },
        },
        slotConfig: true,
        cook: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!household) return res.status(404).json({ error: 'Household not found' });

    const isMember = household.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      household_id: household.id,
      name: household.name,
      location_region: household.locationRegion,
      household_size: household.householdSize,
      onboarding_progress: household.onboardingProgress,
      members: household.members.map(m => ({
        member_id: m.id,
        name: m.name,
        role: m.role,
        persona: m.persona,
        age_group: m.ageGroup,
        diet_type: m.dietType,
        health_profile: m.healthProfile ? {
          health_goal: m.healthProfile.healthGoal,
          allergies: m.healthProfile.allergies,
          intolerances: m.healthProfile.intolerances,
          medical_conditions: m.healthProfile.medicalConditions,
          spice_level: m.healthProfile.spiceLevel,
          oil_preference: m.healthProfile.oilPreference,
          sweet_tolerance: m.healthProfile.sweetTolerance,
          food_behavior: m.healthProfile.foodBehavior,
        } : null,
      })),
      slot_config: household.slotConfig?.config || null,
      cook: household.cook ? { name: household.cook.name, phone: household.cook.phone } : null,
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

/**
 * POST /api/v1/households/:householdId/members
 * Add household members with personas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const memberships = await prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    res.json(memberships.map(m => ({
      household_id: m.household.id,
      name: m.household.name,
      role: m.role,
      member_count: m.household._count.members,
      onboarding_progress: m.household.onboardingProgress,
    })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Households list error:', error);
    res.status(500).json({ error: 'Failed to list households' });
  }
});

// ============================================================================
// SHARE FEATURE — create/join/leave by invite code
// ============================================================================

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * POST /api/v1/households
 * Create a household (share feature)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({ name: z.string().min(1).max(100) }).parse(req.body);

    const household = await prisma.household.create({
      data: {
        name: payload.name,
        code: generateInviteCode(),
        members: {
          create: { name: req.user?.name || 'Owner', role: 'admin', userId },
        },
      },
      include: { members: true },
    });

    res.status(201).json({
      id: household.id,
      name: household.name,
      adminId: userId,
      code: household.code,
      members: household.members.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        joinedAt: (m as any).createdAt ? new Date((m as any).createdAt).toISOString() : new Date().toISOString(),
      })),
      createdAt: household.createdAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    console.error('[API] Create household error:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

/**
 * POST /api/v1/households/join
 * Join a household by invite code
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({ code: z.string().min(1).max(10) }).parse(req.body);
    const code = payload.code.toUpperCase();

    const household = await prisma.household.findUnique({
      where: { code },
      include: { members: { include: { user: true } }, slotConfig: true, cook: { select: { id: true, name: true } } },
    });

    if (!household) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const alreadyMember = household.members.some(m => m.userId === userId);
    if (!alreadyMember) {
      await prisma.householdMember.create({
        data: { householdId: household.id, name: req.user?.name || 'Member', role: 'member', userId },
      });
    }

    const updated = await prisma.household.findUnique({
      where: { id: household.id },
      include: { members: { include: { user: true } }, slotConfig: true, cook: { select: { id: true, name: true } } },
    });

    res.json({
      id: updated!.id,
      name: updated!.name,
      adminId: household.members.find(m => m.role === 'admin')?.userId || userId,
      code: updated!.code,
      members: updated!.members.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        joinedAt: (m as any).createdAt ? new Date((m as any).createdAt).toISOString() : new Date().toISOString(),
      })),
      createdAt: updated!.createdAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    console.error('[API] Join household error:', error);
    res.status(500).json({ error: 'Failed to join household' });
  }
});

/**
 * POST /api/v1/households/:householdId/leave
 * Leave a household
 */
router.post('/:householdId/leave', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const householdId = req.params.householdId as string;

    const member = await prisma.householdMember.findFirst({
      where: { householdId, userId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Not a member of this household' });
    }

    await prisma.householdMember.delete({ where: { id: member.id } });

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Leave household error:', error);
    res.status(500).json({ error: 'Failed to leave household' });
  }
});

/**
 * POST /api/v1/households/:householdId/regenerate-code
 * Regenerate the invite code
 */
router.post('/:householdId/regenerate-code', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const householdId = req.params.householdId as string;
    const newCode = generateInviteCode();

    await prisma.household.update({
      where: { id: householdId },
      data: { code: newCode },
    });

    res.json({ code: newCode });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Regenerate code error:', error);
    res.status(500).json({ error: 'Failed to regenerate code' });
  }
});

export default router;

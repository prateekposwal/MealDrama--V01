import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const HEALTH_GOALS = ['high_protein', 'weight_loss', 'low_carb', 'balanced', 'keto', 'diabetic_friendly'] as const;
const SPICE_LEVELS = [1, 2, 3, 4, 5] as const;
const OIL_PREFERENCES = ['low', 'medium', 'high'] as const;
const SWEET_TOLERANCES = ['low', 'medium', 'high'] as const;
const FOOD_BEHAVIORS = ['comfort', 'adventurous', 'picky', 'health_conscious'] as const;

/**
 * POST /api/v1/health-profiles
 * Create or update health profile for a household member
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({
      member_id: z.string().min(1),
      health_goal: z.enum(HEALTH_GOALS).optional(),
      allergies: z.array(z.string()).default([]),
      intolerances: z.array(z.string()).default([]),
      medical_conditions: z.array(z.string()).default([]),
      spice_level: z.number().int().refine(v => v >= 1 && v <= 5).default(3),
      oil_preference: z.enum(OIL_PREFERENCES).optional(),
      sweet_tolerance: z.enum(SWEET_TOLERANCES).optional(),
      food_behavior: z.enum(FOOD_BEHAVIORS).optional(),
    }).parse(req.body);

    const member = await prisma.householdMember.findUnique({
      where: { id: payload.member_id },
      include: {
        household: {
          include: { members: { select: { userId: true } } },
        },
      },
    });

    if (!member) return res.status(404).json({ error: 'Member not found' });

    const isHouseholdMember = member.household.members.some(m => m.userId === userId);
    if (!isHouseholdMember) return res.status(403).json({ error: 'Forbidden' });

    const profile = await prisma.healthProfile.upsert({
      where: { memberId: payload.member_id },
      update: {
        healthGoal: payload.health_goal,
        allergies: payload.allergies,
        intolerances: payload.intolerances,
        medicalConditions: payload.medical_conditions,
        spiceLevel: payload.spice_level,
        oilPreference: payload.oil_preference,
        sweetTolerance: payload.sweet_tolerance,
        foodBehavior: payload.food_behavior,
      },
      create: {
        memberId: payload.member_id,
        healthGoal: payload.health_goal,
        allergies: payload.allergies,
        intolerances: payload.intolerances,
        medicalConditions: payload.medical_conditions,
        spiceLevel: payload.spice_level,
        oilPreference: payload.oil_preference,
        sweetTolerance: payload.sweet_tolerance,
        foodBehavior: payload.food_behavior,
      },
    });

    if (member.household.onboardingProgress < 3) {
      await prisma.household.update({
        where: { id: member.householdId },
        data: { onboardingProgress: 3 },
      });
    }

    res.json({
      member_id: payload.member_id,
      profile_updated: true,
      next_step: 'meal_slots_config',
      onboarding_progress: 3,
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Health profile error:', error);
    res.status(500).json({ error: 'Failed to save health profile' });
  }
});

/**
 * GET /api/v1/health-profiles/:memberId
 * Get health profile for a member
 */
router.get('/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { memberId } = req.params;
    const member = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: {
        healthProfile: true,
        household: {
          include: { members: { select: { userId: true } } },
        },
      },
    });

    if (!member) return res.status(404).json({ error: 'Member not found' });

    const isHouseholdMember = member.household.members.some(m => m.userId === userId);
    if (!isHouseholdMember) return res.status(403).json({ error: 'Forbidden' });

    if (!member.healthProfile) return res.status(404).json({ error: 'Health profile not found' });

    res.json({
      member_id: memberId,
      health_goal: member.healthProfile.healthGoal,
      allergies: member.healthProfile.allergies,
      intolerances: member.healthProfile.intolerances,
      medical_conditions: member.healthProfile.medicalConditions,
      spice_level: member.healthProfile.spiceLevel,
      oil_preference: member.healthProfile.oilPreference,
      sweet_tolerance: member.healthProfile.sweetTolerance,
      food_behavior: member.healthProfile.foodBehavior,
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Health profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch health profile' });
  }
});

export default router;

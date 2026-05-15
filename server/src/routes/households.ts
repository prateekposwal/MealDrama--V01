import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const MEMBER_ROLES = ['owner', 'member'] as const;
const PERSONAS = ['working_professional', 'homemaker', 'student', 'remote_worker', 'fitness_enthusiast', 'senior'] as const;
const AGE_GROUPS = ['adult', 'teen', 'child', 'senior'] as const;
const DIET_TYPES = ['veg', 'non_veg', 'eggitarian', 'vegan'] as const;

const HEALTH_GOALS = ['high_protein', 'weight_loss', 'low_carb', 'balanced', 'keto', 'diabetic_friendly'] as const;
const SPICE_LEVELS = [1, 2, 3, 4, 5] as const;
const OIL_PREFERENCES = ['low', 'medium', 'high'] as const;
const SWEET_TOLERANCES = ['low', 'medium', 'high'] as const;
const FOOD_BEHAVIORS = ['comfort', 'adventurous', 'picky', 'health_conscious'] as const;

const SLOT_NAMES = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;

/**
 * POST /api/v1/households/register
 * Create household and initialize onboarding
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({
      household_name: z.string().min(1).max(100),
      location_region: z.string().min(1).max(100).optional(),
      household_size: z.number().int().min(1).max(50).default(1),
    }).parse(req.body);

    const household = await prisma.household.create({
      data: {
        name: payload.household_name,
        locationRegion: payload.location_region,
        householdSize: payload.household_size,
        onboardingProgress: 1,
        members: {
          create: {
            name: 'Owner',
            role: 'owner',
            userId,
          },
        },
      },
      include: { members: true },
    });

    res.status(201).json({
      household_id: household.id,
      status: 'onboarding_started',
      next_step: 'member_setup',
      onboarding_progress: 1,
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Household already exists' });
    }
    console.error('[API] Household register error:', error);
    res.status(500).json({ error: 'Failed to register household' });
  }
});

/**
 * GET /api/v1/households/:householdId
 * Get household details with members
 */
router.get('/:householdId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { householdId } = req.params;
    if (!householdId) return res.status(400).json({ error: 'Missing householdId' });

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: { healthProfile: true },
        },
        slotConfig: true,
        cook: true,
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
router.post('/:householdId/members', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { householdId } = req.params;
    const payload = z.object({
      members: z.array(z.object({
        name: z.string().min(1).max(100),
        role: z.enum(MEMBER_ROLES).default('member'),
        persona: z.enum(PERSONAS).optional(),
        age_group: z.enum(AGE_GROUPS).optional(),
        diet_type: z.enum(DIET_TYPES).optional(),
      })).min(1).max(20),
    }).parse(req.body);

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: { members: true },
    });

    if (!household) return res.status(404).json({ error: 'Household not found' });

    const isOwner = household.members.some(m => m.userId === userId && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Only the owner can add members' });

    const created = await prisma.$transaction(
      payload.members.map(m =>
        prisma.householdMember.create({
          data: {
            householdId,
            name: m.name,
            role: m.role,
            persona: m.persona,
            ageGroup: m.age_group,
            dietType: m.diet_type,
          },
        })
      )
    );

    if (household.onboardingProgress < 2) {
      await prisma.household.update({
        where: { id: householdId },
        data: { onboardingProgress: 2 },
      });
    }

    res.status(201).json({
      household_id: householdId,
      members_added: created.length,
      next_step: 'health_goals',
      onboarding_progress: 2,
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Add members error:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

/**
 * POST /api/v1/households/:householdId/meal-slot-config
 * Configure meal slots (breakfast, lunch, snacks, dinner)
 */
router.post('/:householdId/meal-slot-config', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { householdId } = req.params;
    const payload = z.object({
      breakfast: z.object({
        enabled: z.boolean(),
        type: z.string().optional(),
        prep_time_limit: z.number().int().min(5).max(120).optional(),
      }).optional(),
      lunch: z.object({
        enabled: z.boolean(),
        style: z.string().optional(),
        dal_style: z.string().optional(),
        sabzi_style: z.string().optional(),
        add_salad: z.boolean().optional(),
        add_raita: z.boolean().optional(),
      }).optional(),
      snacks: z.object({
        enabled: z.boolean(),
        type: z.string().optional(),
      }).optional(),
      dinner: z.object({
        enabled: z.boolean(),
        style: z.string().optional(),
        non_veg_days: z.array(z.string()).optional(),
      }).optional(),
    }).parse(req.body);

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: { members: true },
    });

    if (!household) return res.status(404).json({ error: 'Household not found' });
    const isOwner = household.members.some(m => m.userId === userId && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    await prisma.mealSlotConfig.upsert({
      where: { householdId },
      update: { config: payload },
      create: { householdId, config: payload },
    });

    if (household.onboardingProgress < 3) {
      await prisma.household.update({
        where: { id: householdId },
        data: { onboardingProgress: 3 },
      });
    }

    res.json({
      household_id: householdId,
      configuration_saved: true,
      next_step: 'cook_assignment',
      onboarding_progress: 3,
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Meal slot config error:', error);
    res.status(500).json({ error: 'Failed to save slot configuration' });
  }
});

/**
 * POST /api/v1/households/:householdId/cook/add
 * Add a cook to the household
 */
router.post('/:householdId/cook/add', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { householdId } = req.params;
    const payload = z.object({
      name: z.string().min(1).max(100),
      phone: z.string().optional(),
    }).parse(req.body);

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: { members: true },
    });

    if (!household) return res.status(404).json({ error: 'Household not found' });
    const isOwner = household.members.some(m => m.userId === userId && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Forbidden' });

    const cook = await prisma.cook.upsert({
      where: { householdId },
      update: { name: payload.name, phone: payload.phone ?? null },
      create: { householdId, name: payload.name, phone: payload.phone ?? null },
    });

    if (household.onboardingProgress < 4) {
      await prisma.household.update({
        where: { id: householdId },
        data: { onboardingProgress: 4 },
      });
    }

    res.json({
      cook_id: cook.id,
      name: cook.name,
      phone: cook.phone,
      next_step: 'onboarding_complete',
      onboarding_progress: 4,
    });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Add cook error:', error);
    res.status(500).json({ error: 'Failed to add cook' });
  }
});

/**
 * GET /api/v1/households/:householdId/onboarding-status
 * Get current onboarding progress
 */
router.get('/:householdId/onboarding-status', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { householdId } = req.params;
    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: { select: { id: true, userId: true, role: true } },
        slotConfig: { select: { id: true } },
        cook: { select: { id: true } },
      },
    });

    if (!household) return res.status(404).json({ error: 'Household not found' });
    const isMember = household.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      household_id: householdId,
      onboarding_progress: household.onboardingProgress,
      members_added: household.members.length > 1,
      slots_configured: !!household.slotConfig,
      cook_assigned: !!household.cook,
      next_step:
        household.onboardingProgress < 2 ? 'member_setup' :
        household.onboardingProgress < 3 ? 'health_goals' :
        household.onboardingProgress < 4 ? 'meal_slots_config' :
        household.onboardingProgress < 5 ? 'cook_assignment' : 'complete',
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Onboarding status error:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

/**
 * GET /api/v1/households
 * List households for the current user
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

export default router;

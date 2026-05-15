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

/**
 * GET /api/v1/members
 * List all members for the current user's households
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const members = await prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: { select: { id: true, name: true } },
        healthProfile: true,
      },
    });

    res.json(members.map(m => ({
      member_id: m.id,
      household_id: m.householdId,
      household_name: m.household.name,
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
    })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Members list error:', error);
    res.status(500).json({ error: 'Failed to list members' });
  }
});

/**
 * GET /api/v1/members/:memberId
 * Get a specific member with full profile
 */
router.get('/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { memberId } = req.params;
    const member = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: {
        household: { select: { id: true, name: true } },
        healthProfile: true,
      },
    });

    if (!member) return res.status(404).json({ error: 'Member not found' });

    const household = await prisma.household.findUnique({
      where: { id: member.householdId },
      include: { members: { select: { userId: true } } },
    });

    const isMember = household?.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    res.json({
      member_id: member.id,
      household_id: member.householdId,
      household_name: member.household.name,
      name: member.name,
      role: member.role,
      persona: member.persona,
      age_group: member.ageGroup,
      diet_type: member.dietType,
      health_profile: member.healthProfile ? {
        health_goal: member.healthProfile.healthGoal,
        allergies: member.healthProfile.allergies,
        intolerances: member.healthProfile.intolerances,
        medical_conditions: member.healthProfile.medicalConditions,
        spice_level: member.healthProfile.spiceLevel,
        oil_preference: member.healthProfile.oilPreference,
        sweet_tolerance: member.healthProfile.sweetTolerance,
        food_behavior: member.healthProfile.foodBehavior,
      } : null,
    });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Member fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

/**
 * PATCH /api/v1/members/:memberId
 * Update member details
 */
router.patch('/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { memberId } = req.params;
    const payload = z.object({
      name: z.string().min(1).max(100).optional(),
      persona: z.enum(PERSONAS).optional(),
      age_group: z.enum(AGE_GROUPS).optional(),
      diet_type: z.enum(DIET_TYPES).optional(),
    }).parse(req.body);

    const member = await prisma.householdMember.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const household = await prisma.household.findUnique({
      where: { id: member.householdId },
      include: { members: { select: { userId: true, role: true } } },
    });

    const canEdit = household?.members.some(m => m.userId === userId && (m.role === 'owner' || member.userId === userId));
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.householdMember.update({
      where: { id: memberId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.persona && { persona: payload.persona }),
        ...(payload.age_group && { ageGroup: payload.age_group }),
        ...(payload.diet_type && { dietType: payload.diet_type }),
      },
    });

    res.json({ member_id: updated.id, updated: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Member update error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

/**
 * DELETE /api/v1/members/:memberId
 * Remove a member from household
 */
router.delete('/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { memberId } = req.params;
    const member = await prisma.householdMember.findUnique({ where: { id: memberId } });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const household = await prisma.household.findUnique({
      where: { id: member.householdId },
      include: { members: { select: { userId: true, role: true } } },
    });

    const isOwner = household?.members.some(m => m.userId === userId && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Only the owner can remove members' });

    const ownerCount = household!.members.filter(m => m.role === 'owner').length;
    if (member.role === 'owner' && ownerCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last owner' });
    }

    await prisma.householdMember.delete({ where: { id: memberId } });

    res.json({ ok: true, member_id: memberId });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Member delete error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;

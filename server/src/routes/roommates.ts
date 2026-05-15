import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';
import crypto from 'crypto';
import { ISO_DATE, Slot, isValidDate, parseISODate } from '../lib/validation';

const router = Router();
router.use(authMiddleware);

const LINK_EXPIRY_HOURS = 7 * 24; // 7 days

// ============================================================================
// MAGIC LINK GENERATION
// ============================================================================

router.post('/link/generate', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + LINK_EXPIRY_HOURS);

    const token = crypto.randomBytes(32).toString('hex');

    const link = await prisma.roommateLink.create({
      data: {
        userId,
        token,
        expiresAt,
        isActive: true,
      },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/roommate/${token}`;

    res.json({
      ok: true,
      linkId: link.id,
      token: link.token,
      magicLink,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error('[API] Roommate link generation error:', error);
    res.status(500).json({ error: 'Failed to generate magic link' });
  }
});

// Get all active links for user
router.get('/links', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const now = new Date();
    const links = await prisma.roommateLink.findMany({
      where: { userId, isActive: true, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { suggestions: true } },
      },
    });

    res.json(links);
  } catch (error) {
    console.error('[API] Roommate links fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// Revoke a link
router.delete('/link/:linkId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const linkId = Array.isArray(req.params.linkId) ? req.params.linkId[0] : req.params.linkId;
    if (!linkId) throw new APIError('INVALID_INPUT', 'Missing linkId', 400);

    await prisma.roommateLink.updateMany({
      where: { id: linkId, userId },
      data: { isActive: false },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Roommate link revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke link' });
  }
});

// ============================================================================
// PUBLIC: Validate token (no auth required)
// ============================================================================

router.get('/link/validate/:token', async (req: Request, res: Response) => {
  try {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    if (!token) throw new APIError('INVALID_INPUT', 'Missing token', 400);

    const link = await prisma.roommateLink.findUnique({
      where: { token, isActive: true },
      include: {
        user: {
          select: { name: true, profile: { select: { region: true } } },
        },
      },
    });

    if (!link) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    if (link.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Link expired' });
    }

    res.json({
      valid: true,
      cookName: link.user?.name || 'Cook',
      region: link.user?.profile?.region || 'north',
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error('[API] Roommate link validation error:', error);
    res.status(500).json({ error: 'Failed to validate link' });
  }
});

// ============================================================================
// PUBLIC: Submit suggestion (no auth required — roommate view)
// ============================================================================

router.post('/suggestion', async (req: Request, res: Response) => {
  try {
    const payload = z.object({
      token: z.string().min(1),
      date: ISO_DATE,
      slot: Slot,
      mealName: z.string().min(1).max(100),
      roommateName: z.string().min(1).max(50),
      quantity: z.number().int().min(1).max(10).default(1),
      gravyStyle: z.string().optional(),
      rotiType: z.string().optional(),
      riceType: z.string().optional(),
      sides: z.array(z.string()).default([]),
      beverages: z.array(z.string()).default([]),
    }).parse(req.body);

    const link = await prisma.roommateLink.findUnique({
      where: { token: payload.token, isActive: true },
    });

    if (!link || link.expiresAt < new Date()) {
      throw new APIError('INVALID_LINK', 'Invalid or expired link', 404);
    }

    const parsedDate = parseISODate(payload.date);

    let traySlot = await prisma.traySlot.findUnique({
      where: {
        userId_date_slot: { userId: link.userId, date: parsedDate, slot: payload.slot },
      },
    });

    if (!traySlot) {
      traySlot = await prisma.traySlot.create({
        data: {
          userId: link.userId,
          date: parsedDate,
          slot: payload.slot,
        },
      });
    }

    const suggestion = await prisma.roommateSuggestion.create({
      data: {
        linkId: link.id,
        traySlotId: traySlot.id,
        mealName: payload.mealName,
        date: parsedDate,
        slot: payload.slot,
        quantity: payload.quantity,
        gravyStyle: payload.gravyStyle || null,
        rotiType: payload.rotiType || null,
        riceType: payload.riceType || null,
        sides: payload.sides,
        beverages: payload.beverages,
        roommateName: payload.roommateName,
        status: 'pending',
      },
    });

    await prisma.roommateLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    res.json({ ok: true, suggestionId: suggestion.id });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Roommate suggestion error:', error);
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

// ============================================================================
// AUTHENTICATED: Get pending suggestions
// ============================================================================

router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { status } = req.query;

    const where: any = {
      link: { userId },
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    const suggestions = await prisma.roommateSuggestion.findMany({
      where,
      include: {
        traySlot: { select: { date: true, slot: true, totalServings: true } },
        link: { select: { token: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(suggestions);
  } catch (error) {
    console.error('[API] Roommate suggestions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Approve or reject a suggestion
router.patch('/suggestion/:suggestionId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const suggestionId = Array.isArray(req.params.suggestionId) ? req.params.suggestionId[0] : req.params.suggestionId;
    if (!suggestionId) throw new APIError('INVALID_INPUT', 'Missing suggestionId', 400);
    const { status } = z.object({
      status: z.enum(['approved', 'rejected']),
    }).parse(req.body);

    const suggestion = await prisma.roommateSuggestion.findUnique({
      where: { id: suggestionId },
      include: { link: true, traySlot: true },
    });

    if (!suggestion || suggestion.link.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Suggestion not found', 404);
    }

    const updated = await prisma.roommateSuggestion.update({
      where: { id: suggestionId },
      data: { status },
    });

    // If approved, create a tray item from the suggestion
    if (status === 'approved') {
      await prisma.trayItem.create({
        data: {
          traySlotId: suggestion.traySlotId,
          quantity: suggestion.quantity,
          gravyStyle: suggestion.gravyStyle || 'Default',
          rotiType: suggestion.rotiType || 'Phulka',
          riceType: suggestion.riceType || 'Plain',
          sides: suggestion.sides,
          beverages: suggestion.beverages,
          sortOrder: 99,
        },
      });

      await prisma.traySlot.update({
        where: { id: suggestion.traySlotId },
        data: { version: { increment: 1 } },
      });
    }

    res.json({ ok: true, suggestion: updated });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Suggestion action error:', error);
    res.status(500).json({ error: 'Failed to process suggestion' });
  }
});

export default router;

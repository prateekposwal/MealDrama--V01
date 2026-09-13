import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { z } from 'zod';

/**
 * Loop configuration — persisted to the LoopConfig table so a fresh device
 * (or a server restart) keeps the same repeat schedule. The client already
 * stores this in localStorage (Zustand); the server copy is the durable
 * source for offline-queue sync and cross-device continuity.
 *
 * All access is SELF-SCOPED to the authenticated user: the userId is read
 * from the JWT, never trusted from the body/path. POST upserts MY config;
 * GET/DELETE operate on MY config only (any other userId → 404).
 */
const router = Router();
router.use(authMiddleware);

const ConfigSchema = z.object({
  config: z.object({
    cycleLength: z.number().int().min(1).max(365).optional(),
    startDate: z.string().max(32).optional(),
    skipDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    repeatPattern: z.string().max(32).optional(),
    insertStrategy: z.string().max(32).optional(),
  }),
  sourceDishIds: z.array(z.string().max(200)).max(200).optional(),
});

// POST /api/v1/loop-config — upsert MY loop configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
    const { config, sourceDishIds } = ConfigSchema.parse(req.body);

    await prisma.loopConfig.upsert({
      where: { userId },
      create: {
        userId,
        cycleLength: config.cycleLength ?? 7,
        startDate: config.startDate ?? new Date().toISOString().slice(0, 10),
        skipDays: config.skipDays ?? [],
        repeatPattern: config.repeatPattern ?? 'sequential',
        insertStrategy: config.insertStrategy ?? 'append',
        sourceDishIds: sourceDishIds ?? [],
      },
      update: {
        cycleLength: config.cycleLength,
        startDate: config.startDate,
        skipDays: config.skipDays,
        repeatPattern: config.repeatPattern,
        insertStrategy: config.insertStrategy,
        sourceDishIds: sourceDishIds ?? [],
      },
    });

    res.json({ success: true, data: { userId, ...config, sourceDishIds: sourceDishIds ?? [] } });
  } catch (err: any) {
    if (err instanceof APIError) throw err;
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid config payload' } });
    console.error('[LoopConfig] Save error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save loop configuration' } });
  }
});

// GET /api/v1/loop-config/:userId — fetch loop configuration (self only)
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
    if (req.params.userId && req.params.userId !== userId) {
      return res.status(200).json({ success: true, data: null });
    }
    const record = await prisma.loopConfig.findUnique({ where: { userId } });

    const data = record
      ? {
          userId: record.userId,
          cycleLength: record.cycleLength,
          startDate: record.startDate,
          skipDays: record.skipDays,
          repeatPattern: record.repeatPattern,
          insertStrategy: record.insertStrategy,
          sourceDishIds: record.sourceDishIds,
        }
      : null;

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err instanceof APIError) throw err;
    console.error('[LoopConfig] Fetch error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch loop configuration' } });
  }
});

// DELETE /api/v1/loop-config/:userId — remove loop configuration (self only)
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
    if (req.params.userId && req.params.userId !== userId) {
      return res.status(200).json({ success: false });
    }
    await prisma.loopConfig.deleteMany({ where: { userId } });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err instanceof APIError) throw err;
    console.error('[LoopConfig] Delete error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete loop configuration' } });
  }
});

export default router;
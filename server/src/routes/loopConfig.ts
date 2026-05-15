import { Router, Request, Response } from 'express';

const router = Router();

// Loop config is primarily client-side (persisted via Zustand localStorage).
// Server endpoint exists for future DB persistence and frontend compatibility.

// In-memory fallback store (restart loses data — fine for dev)
const store = new Map<string, any>();

// POST /api/v1/loop-config — save loop configuration
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, config, sourceDishIds } = req.body;

    if (!userId || !config) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId and config are required',
        },
      });
    }

    const payload = {
      userId,
      cycleLength: config.cycleLength,
      startDate: config.startDate,
      skipDays: config.skipDays,
      repeatPattern: config.repeatPattern,
      insertStrategy: config.insertStrategy,
      sourceDishIds: sourceDishIds || [],
    };

    store.set(userId, payload);

    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (err: any) {
    console.error('[LoopConfig] Save error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to save loop configuration',
      },
    });
  }
});

// GET /api/v1/loop-config/:userId — fetch loop configuration
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const record = store.get(userId) || null;

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err: any) {
    console.error('[LoopConfig] Fetch error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch loop configuration',
      },
    });
  }
});

// DELETE /api/v1/loop-config/:userId — remove loop configuration
router.delete('/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    store.delete(userId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[LoopConfig] Delete error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete loop configuration' },
    });
  }
});

export default router;

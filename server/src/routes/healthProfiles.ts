import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../lib/auth';

const router = Router();

/**
 * POST /api/v1/health-profiles
 * Set health profile for member
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: { message: 'Health profiles endpoint' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

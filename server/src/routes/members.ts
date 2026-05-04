import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../lib/auth';

const router = Router();

/**
 * POST /api/v1/members
 * Add household members
 */
router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: { message: 'Members endpoint' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

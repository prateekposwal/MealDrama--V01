import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

// ============================================================================
// GET ALL VARIANT OPTIONS (gravy/roti/rice/sides/beverages)
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const where: any = { isActive: true };
    if (category && typeof category === 'string') {
      where.category = category;
    }

    const options = await prisma.variantOption.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof options> = {};
    for (const opt of options) {
      if (!grouped[opt.category]) grouped[opt.category] = [];
      (grouped[opt.category] as typeof options).push(opt);
    }

    res.json({ options, grouped });
  } catch (error) {
    console.error('[API] Variant options fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch variant options' });
  }
});

export default router;

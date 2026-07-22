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

    const where: any = {};
    if (category && typeof category === 'string') {
      where.meal = { category };
    }

    const options = await prisma.mealVariant.findMany({
      where,
      include: { meal: { select: { category: true } } },
      orderBy: [{ name: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof options> = {};
    for (const opt of options) {
      const cat = opt.meal.category;
      if (!grouped[cat]) grouped[cat] = [];
      (grouped[cat] as typeof options).push(opt);
    }

    res.json({ options, grouped });
  } catch (error) {
    console.error('[API] Variant options fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch variant options' });
  }
});

export default router;

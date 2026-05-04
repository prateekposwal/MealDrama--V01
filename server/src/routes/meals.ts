import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { take, skip, region, category } = req.query;

    const where: any = {};
    if (region) where.region = String(region);
    if (category) where.category = { contains: String(category) };

    const total = await prisma.meal.count({ where });

    const meals = await prisma.meal.findMany({
      where,
      take: take ? Math.min(Number(take), 100) : 50,
      include: {
        variants: true,
        ingredients: { include: { ingredient: true } },
      },
    });

    const formatted = meals.map(meal => ({
      id: meal.id,
      name: meal.name,
      icon: meal.icon || '🍽️',
      region: meal.region || 'north',
      states: [],
      category: [meal.category],
      type: meal.type,
      weight: 'medium',
      nutrition: [],
      tags: meal.tags,
      season: [],
      variants: meal.variants.map(v => ({
        id: v.id,
        name: v.name,
        baseStyle: v.baseStyle || undefined,
        cookingStyle: v.cookingStyle || undefined,
        addOn: v.addOn || undefined,
        mealContext: v.mealContext || undefined,
        regionOverride: v.regionOverride || undefined,
        accompaniments: v.accompaniments,
        _ingredients: meal.ingredients
          .filter(i => i.mealId === meal.id)
          .map(i => ({
            name: i.ingredient.name,
            quantity: i.qtyPerServing,
            unit: i.unit,
            category: i.ingredient.category,
          })),
      })),
    }));

    res.json({ data: formatted, total, take: take ? Number(take) : 100, skip: skip ? Number(skip) : 0 });
  } catch (error) {
    console.error('[API] Meals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

export default router;

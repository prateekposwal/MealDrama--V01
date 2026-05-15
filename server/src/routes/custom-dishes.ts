import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const CustomDishIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().min(0).max(10000),
  unit: z.string().min(1).max(10),
  isOptional: z.boolean().default(false),
  notes: z.string().max(200).optional(),
});

const CustomDishSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']),
  dietType: z.enum(['veg', 'non-veg', 'eggitarian', 'vegan']).default('veg'),
  defaultGravy: z.string().default('Default'),
  defaultRoti: z.string().default('Phulka'),
  defaultRice: z.string().default('Plain'),
  prepMinutes: z.number().int().min(5).max(240).default(30),
  description: z.string().max(500).optional(),
  ingredients: z.array(CustomDishIngredientSchema).min(1),
});

// ============================================================================
// CREATE CUSTOM DISH
// ============================================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const data = CustomDishSchema.parse(req.body);

    // Check for name clash — prefix with "My: " if needed
    const existing = await prisma.customDish.findUnique({
      where: { userId_name: { userId, name: data.name } },
    });

    if (existing) {
      throw new APIError('NAME_CLASH', 'Dish name already exists. Try a different name.', 409);
    }

    const customDish = await prisma.customDish.create({
      data: {
        userId,
        name: data.name,
        category: data.category,
        dietType: data.dietType,
        defaultGravy: data.defaultGravy,
        defaultRoti: data.defaultRoti,
        defaultRice: data.defaultRice,
        prepMinutes: data.prepMinutes,
        description: data.description,
        ingredients: {
          create: data.ingredients.map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            isOptional: ing.isOptional,
            notes: ing.notes,
          })),
        },
      },
      include: {
        ingredients: true,
      },
    });

    res.json(customDish);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Custom dish creation error:', error);
    res.status(500).json({ error: 'Failed to create custom dish' });
  }
});

// ============================================================================
// GET USER CUSTOM DISHES
// ============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { category } = req.query;

    const where: any = { userId };
    if (category && typeof category === 'string') {
      where.category = category;
    }

    const dishes = await prisma.customDish.findMany({
      where,
      include: {
        ingredients: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(dishes);
  } catch (error) {
    console.error('[API] Custom dishes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch custom dishes' });
  }
});

// ============================================================================
// GET SINGLE CUSTOM DISH
// ============================================================================

router.get('/:dishId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const dishId = Array.isArray(req.params.dishId) ? req.params.dishId[0] : req.params.dishId;
    if (!dishId) throw new APIError('INVALID_INPUT', 'Missing dishId', 400);

    const dish = await prisma.customDish.findUnique({
      where: { id: dishId },
      include: { ingredients: true },
    });

    if (!dish || dish.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Custom dish not found', 404);
    }

    res.json(dish);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Custom dish fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch custom dish' });
  }
});

// ============================================================================
// UPDATE CUSTOM DISH
// ============================================================================

router.patch('/:dishId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const dishId = Array.isArray(req.params.dishId) ? req.params.dishId[0] : req.params.dishId;
    if (!dishId) throw new APIError('INVALID_INPUT', 'Missing dishId', 400);

    const existing = await prisma.customDish.findUnique({
      where: { id: dishId },
    });

    if (!existing || existing.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Custom dish not found', 404);
    }

    const updateData = z.object({
      name: z.string().min(1).max(100).optional(),
      dietType: z.enum(['veg', 'non-veg', 'eggitarian', 'vegan']).optional(),
      defaultGravy: z.string().optional(),
      defaultRoti: z.string().optional(),
      defaultRice: z.string().optional(),
      prepMinutes: z.number().int().min(5).max(240).optional(),
      description: z.string().max(500).optional().nullable(),
    }).parse(req.body);

    const updated = await prisma.customDish.update({
      where: { id: dishId },
      data: updateData,
      include: { ingredients: true },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Custom dish update error:', error);
    res.status(500).json({ error: 'Failed to update custom dish' });
  }
});

// ============================================================================
// DELETE CUSTOM DISH
// ============================================================================

router.delete('/:dishId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const dishId = Array.isArray(req.params.dishId) ? req.params.dishId[0] : req.params.dishId;
    if (!dishId) throw new APIError('INVALID_INPUT', 'Missing dishId', 400);

    const existing = await prisma.customDish.findUnique({
      where: { id: dishId },
    });

    if (!existing || existing.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Custom dish not found', 404);
    }

    await prisma.customDish.delete({ where: { id: dishId! } });

    res.json({ ok: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Custom dish delete error:', error);
    res.status(500).json({ error: 'Failed to delete custom dish' });
  }
});

export default router;

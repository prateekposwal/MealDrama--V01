/**
 * Server-side pantry/ingredient resolver.
 * Aggregates ingredients for all household members' meals within a date range.
 * Uses the same ingredient resolution engine as the frontend.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

// ─── Helper: fetch all meals for household members ──
router.get('/:householdId/pantry', async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    const { start, end } = req.query;

    // Get all household members with userIds
    const members = await prisma.householdMember.findMany({
      where: { householdId, userId: { not: null } },
    });
    const userIds = members.map(m => m.userId!).filter(Boolean);
    if (userIds.length === 0) {
      return res.json({ ingredients: [], members: members.map(m => ({ id: m.id, name: m.name })) });
    }

    // Build date filter
    const dateFilter: any = {};
    if (start) dateFilter.gte = new Date(start as string);
    if (end) dateFilter.lte = new Date(end as string);

    // Fetch all tray slots + items for these users
    const slots = await prisma.traySlot.findMany({
      where: {
        userId: { in: userIds },
        ...(start || end ? { date: dateFilter } : {}),
      },
      include: {
        items: {
          include: { meal: true, customDish: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    });

    // Build member name lookup
    const memberByUser = Object.fromEntries(
      members.filter(m => m.userId).map(m => [m.userId!, m.name])
    );

    // Collect all meal items with member attribution
    const meals = slots.flatMap(slot => {
      const memberName = memberByUser[slot.userId] || 'Unknown';
      return slot.items.map(item => ({
        meal_id: item.mealId,
        name: item.meal?.name || item.customDish?.name || 'Unknown',
        quantity: item.quantity,
        requestedBy: item.requestedBy || memberName,
        date: slot.date.toISOString().slice(0, 10),
        slot: slot.slot,
        gravy: item.gravyStyle,
        roti: item.rotiType,
        rice: item.riceType,
        sides: item.sides,
        beverages: item.beverages,
      }));
    });

    // Resolve ingredients using the same engine as frontend
    // Import the dish library (static data, safe for server)
    const { DISH_LIBRARY } = require('../../../meal/constants/dishLibrary');
    const { getIngredientsForMealOption, buildPantryGroups, CATEGORY_META } = require('../../../utils/ingredientUtils');

    const allIngredients: { ing: { name: string; quantity: number; unit: string; category: string; inStock?: boolean }; source: string }[] = [];

    for (const meal of meals) {
      // Look up the dish in the library
      const dish = DISH_LIBRARY.find((d: any) => d.id === meal.meal_id);
      if (!dish) continue;

      // Get ingredients for the meal
      const ings = getIngredientsForMealOption(meal.meal_id, '', DISH_LIBRARY);
      const memberPrefix = meal.requestedBy ? `${meal.requestedBy} — ` : '';

      for (const ing of ings) {
        const qty = ing.quantity * (meal.quantity || 1);
        allIngredients.push({
          ing: { ...ing, quantity: qty },
          source: `${memberPrefix}${meal.name}`,
        });
      }

      // Resolve sides
      for (const side of [...(meal.sides || []), ...(meal.beverages || [])]) {
        const { getIngredientsForCategoryOption } = require('../../../utils/ingredientUtils');
        for (const ing of getIngredientsForCategoryOption(side)) {
          allIngredients.push({
            ing,
            source: `${memberPrefix}${meal.name} · ${side}`,
          });
        }
      }
    }

    // Build pantry groups
    const groups = buildPantryGroups(allIngredients);

    res.json({
      meals: meals.length,
      members: members.map(m => ({ id: m.id, name: m.name })),
      ingredients: groups.map((g: any) => ({
        category: g.category,
        label: CATEGORY_META[g.category]?.label || g.category,
        emoji: CATEGORY_META[g.category]?.emoji || '📦',
        items: g.items.map((i: any) => ({
          name: i.name,
          quantity: i.totalQuantity,
          unit: i.unit,
          sources: i.sources,
        })),
      })),
    });
  } catch (err: any) {
    console.error('[Pantry API] Error:', err.message);
    res.status(500).json({ error: 'Failed to resolve pantry' });
  }
});

export default router;

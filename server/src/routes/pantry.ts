/**
 * Server-side pantry/ingredient resolver.
 * Aggregates ingredients for all household members' meals within a date range.
 * Uses the same ingredient resolution engine as the frontend.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { canonicalName } from '../lib/canonicalName';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

/**
 * Gate: the caller must be a member of the household — otherwise any
 * authenticated user could read any household's pantry/ingredient plan.
 */
async function requireMembership(req: Request, householdId: string) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { members: true },
  });
  if (!household) throw new APIError('NOT_FOUND', 'Household not found', 404);
  const isMember = household.members.some((m: any) => m.userId === userId);
  if (!isMember) throw new APIError('FORBIDDEN', 'Not a member of this household', 403);
  return household;
}

// ─── Helper: fetch all meals for household members ──
router.get('/:householdId/pantry', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
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
    if (err instanceof APIError) throw err;
    console.error('[Pantry API] Error:', err.message);
    res.status(500).json({ error: 'Failed to resolve pantry' });
  }
});

const ConsumeSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(64),
    unit: z.string().max(16).optional(),
    quantity: z.number().positive().max(99999),
  })).max(100),
});

/**
 * POST /:householdId/stock/consume — the LEDGER side: cooking meals must draw
 * down the household pantry. The client sends the quantities the cooked meal
 * used (already normalized to buy-friendly units via the same toBuyGrams the
 * buy list uses), and the server clamps at zero — stock never goes negative
 * and you cannot consume what no one ever logged. Best-effort reconciliation:
 * matches on the shared canonical name; a unit mismatch is SKIPPED (never
 * corrupts a row with a nonsensical subtraction).
 */
router.post('/:householdId/stock/consume', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const { items } = ConsumeSchema.parse(req.body);

    const rows = await prisma.householdStock.findMany({ where: { householdId } });
    if (rows.length === 0 || items.length === 0) {
      return res.json({ consumed: 0, skipped: items.length });
    }

    const want = new Map<string, { name: string; unit: string | undefined; quantity: number }>();
    for (const it of items) {
      const key = canonicalName(it.name);
      const cur = want.get(key);
      if (cur) {
        cur.quantity += it.quantity;
      } else {
        want.set(key, { name: it.name, unit: it.unit, quantity: it.quantity });
      }
    }

    let consumed = 0;
    const skipped: string[] = [];
    const updates = rows
      .map((row: any) => {
        const req = want.get(canonicalName(row.name));
        if (!req) return null;
        const rowUnit = (row.unit || '').toLowerCase();
        const wantUnit = (req.unit || '').toLowerCase();
        if (rowUnit !== wantUnit) {
          skipped.push(row.name);
          return null;
        }
        const nextQty = Math.max(0, row.quantity - req.quantity);
        consumed += Math.min(row.quantity, req.quantity);
        if (nextQty === row.quantity) return null;
        return prisma.householdStock.update({ where: { id: row.id }, data: { quantity: nextQty } });
      })
      .filter(Boolean);

    await Promise.all(updates as Promise<unknown>[]);
    res.json({ consumed, skipped });
  } catch (err: any) {
    if (err instanceof APIError) throw err;
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[Pantry API] consume error:', err.message);
    res.status(500).json({ error: 'Failed to consume stock' });
  }
});

export default router;

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { z } from 'zod';
import { ISO_DATE, Slot, parseISODate } from '../lib/validation';

/**
 * PERSISTED "consumed" MEAL HISTORY (Gap 2 closure).
 *
 *   PUT /api/v1/meal-log  →  log a dish eaten in a meal slot on a day
 *                            (idempotent: unique (userId, dishId, mealSlot,
 *                            eatenAt) — same dish/slot/day never duplicates)
 *   GET /api/v1/meal-log  →  MY log, bounded (default 100, max 200), newest
 *                            first — user-scoped, never another user's rows
 *
 * The rows are written from the REAL complete-slot flow (the "meal done"
 * signal in the Plan UI) — never guessed, never invented. An empty log is an
 * honest empty: GET returns [] until the user actually completes a meal.
 */
const router = Router();
router.use(authMiddleware);

const todayISO = (): string => new Date().toISOString().slice(0, 10);

function toJson(row: any) {
  return {
    id: row.id,
    dishId: row.dishId,
    mealSlot: row.mealSlot,
    eatenAt: row.eatenAt instanceof Date ? row.eatenAt.toISOString().slice(0, 10) : String(row.eatenAt),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

/** PUT /api/v1/meal-log — log one dish as eaten. Idempotent per
 *  (user, dish, slot, day): a repeat PUT returns the existing row with
 *  `duplicate: true` — history is never double-counted. */
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z.object({
      dishId: z.string().min(1).max(200),
      mealSlot: Slot,
      date: ISO_DATE.optional(), // default: today (server-local UTC)
    }).parse(req.body);

    const eatenAt = parseISODate(payload.date ?? todayISO());
    const key = { userId, dishId: payload.dishId, mealSlot: payload.mealSlot, eatenAt };
    const existing = await prisma.mealLog.findUnique({ where: { userId_dishId_mealSlot_eatenAt: key } });

    const row = existing ?? await prisma.mealLog.create({ data: key });
    res.status(existing ? 200 : 201).json({ log: toJson(row), duplicate: existing !== null });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Meal log error:', error);
    res.status(500).json({ error: 'Failed to save meal log' });
  }
});

/** GET /api/v1/meal-log?limit=N — MY eaten history, bounded (default 100,
 *  max 200), newest first. Only MY rows (userId from the token). */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rawLimit = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), 200) : 100;

    const rows = await prisma.mealLog.findMany({
      where: { userId },
      orderBy: [{ eatenAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    res.json(rows.map(toJson));
  } catch (error) {
    console.error('[API] Meal log fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch meal log' });
  }
});

export default router;

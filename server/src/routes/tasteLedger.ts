import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { z } from 'zod';

/**
 * TASTE LEDGER (taste personalization — learning).
 *
 *   PUT /api/v1/taste-ledger  → record ONE user taste action
 *                               { dishId, action: like|dislike|replacedTo|added,
 *                                 replacedWithId? }
 *                               (idempotent per (userId, dishId, action,
 *                               replacedWithId) within the same day — a repeat
 *                               tap never double-counts)
 *   GET /api/v1/taste-ledger  → MY ledger, bounded (default 200, max 500),
 *                               newest first — user-scoped, never another
 *                               user's rows
 *
 * Rows are written from the REAL feedback surfaces (❤️ Like / 👎 Dislike on
 * meal cards, the swap flow's replacedTo, the quick-add added) — never
 * guessed, never invented. An empty ledger is an honest empty.
 */
const router = Router();
router.use(authMiddleware);

const LEDGER_ACTIONS = ['like', 'dislike', 'replacedTo', 'added'] as const;

function toJson(row: any) {
  return {
    id: row.id,
    userId: row.userId,
    dishId: row.dishId,
    action: row.action,
    replacedWithId: row.replacedWithId ?? undefined,
    at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
  };
}

/** PUT /api/v1/taste-ledger — record one action. Idempotent per
 *  (user, dishId, action, replacedWithId, day): a repeat PUT returns the
 *  existing row with `duplicate: true` — the ledger is never double-counted. */
router.put('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = z.object({
      dishId: z.string().min(1).max(200),
      action: z.enum(LEDGER_ACTIONS),
      replacedWithId: z.string().min(1).max(200).optional(),
    }).parse(req.body);

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const sameDayKey = (row: any) =>
      row.userId === userId && row.dishId === payload.dishId &&
      row.action === payload.action &&
      (row.replacedWithId ?? null) === (payload.replacedWithId ?? null) &&
      row.at.getTime() >= dayStart.getTime();

    const existing = await prisma.tasteLedger.findFirst({
      where: {
        userId,
        dishId: payload.dishId,
        action: payload.action,
        replacedWithId: payload.replacedWithId ?? null,
        at: { gte: dayStart },
      },
      orderBy: { at: 'desc' },
    });

    const row = existing ?? await prisma.tasteLedger.create({
      data: {
        userId,
        dishId: payload.dishId,
        action: payload.action,
        replacedWithId: payload.replacedWithId ?? null,
      },
    });
    res.status(existing ? 200 : 201).json({ event: toJson(row), duplicate: existing !== null });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Taste ledger error:', error);
    res.status(500).json({ error: 'Failed to save taste event' });
  }
});

/** GET /api/v1/taste-ledger?limit=N — MY ledger, bounded (default 200,
 *  max 500), newest first. Only MY rows (userId from the token). */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const rawLimit = Number(req.query.limit ?? 200);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), 500) : 200;

    const rows = await prisma.tasteLedger.findMany({
      where: { userId },
      orderBy: [{ at: 'desc' }],
      take: limit,
    });
    res.json(rows.map(toJson));
  } catch (error) {
    console.error('[API] Taste ledger fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch taste ledger' });
  }
});

export default router;

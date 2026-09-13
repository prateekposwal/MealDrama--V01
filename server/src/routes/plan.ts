import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { z } from 'zod';
import { ISO_DATE, Slot, isValidDate, parseISODate } from '../lib/validation';

const router = Router();
router.use(authMiddleware);

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const payload = z.object({
      date: ISO_DATE,
      slot: Slot,
      mealId: z.string().min(1),
      variantId: z.string().optional(),
      qty: z.number().int().min(1).max(99).optional(),
    }).parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { date, slot, mealId, variantId, qty } = payload;
    const parsedDate = parseISODate(date);

    // P2028 fix (2026-09-13): the old interactive $transaction(async tx => …)
    // held a 5s cumulative budget across 3-5 awaited round-trips. On cold Neon
    // compute (~1s/query) the plan write could blow the budget → P2028 500.
    // CONVERTED to sequential non-transactional statements — the optimistic
    // lock is the `updateMany` WHERE version = X clause, which is ALREADY an
    // atomic conditional UPDATE at the DB level (READ COMMITTED, Neon
    // default). The interactive wrapper added no cross-statement isolation the
    // CAS gate does not already provide: a concurrent writer either matches
    // the old version (count 1) or fails the WHERE (count 0 → conflict re-read
    // → 409), exactly as before. Business behavior is byte-identical:
    //   read → CAS updateMany → count===0 conflict re-read → create
    // (each statement carries its own latency; there is NO cumulative 5s
    // budget — the P2028 class is structurally gone from this path).
    const existing = await prisma.userPlan.findUnique({
      where: { userId_date_slot: { userId, date: parsedDate, slot } },
    }) as { version: number } | null;

    let plan: Awaited<ReturnType<typeof prisma.userPlan.findUnique>> | null = null;
    if (existing) {
      const updated = await prisma.userPlan.updateMany({
        where: { userId, date: parsedDate, slot, version: existing.version } as any,
        data: { mealId, variantId: variantId ?? null, qty: qty ?? 1, status: 'planned' } as any,
      });

      if (updated.count === 0) {
        const conflict = await prisma.userPlan.findUnique({
          where: { userId_date_slot: { userId, date: parsedDate, slot } },
        }) as { version: number } | null;
        if (conflict && conflict.version !== existing.version) {
          throw Object.assign(new Error('CONFLICT'), { status: 409 });
        }
      }

      plan = await prisma.userPlan.findUnique({ where: { userId_date_slot: { userId, date: parsedDate, slot } } });
    } else {
      plan = await prisma.userPlan.create({
        data: { userId, date: parsedDate, slot, mealId, variantId: variantId ?? null, qty: qty ?? 1, status: 'planned', version: 0 } as any,
      });
    }

    if (!plan) {
      return res.status(500).json({ error: 'Failed to resolve plan after write' });
    }

    res.json(plan);
  } catch (error: any) {
    if (error?.status === 409) {
      return res.status(409).json({ error: 'Conflict: plan was modified by another device. Please refresh and try again.' });
    }
    console.error('[API] Plan upsert error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { startDate, endDate } = req.query;

    const now = new Date();
    let start: Date;
    let end: Date;

    if (startDate && typeof startDate === 'string') {
      if (!isValidDate(startDate)) return res.status(400).json({ error: 'Invalid startDate format' });
      start = parseISODate(startDate);
    } else {
      start = subDays(now, 7);
    }

    if (endDate && typeof endDate === 'string') {
      if (!isValidDate(endDate)) return res.status(400).json({ error: 'Invalid endDate format' });
      end = parseISODate(endDate);
    } else {
      end = addDays(now, 30);
    }

    if (start > end) {
      return res.status(400).json({ error: 'startDate must be before endDate' });
    }

    const plans = await prisma.userPlan.findMany({
      where: {
        userId: userId as string,
        date: { gte: start, lte: end },
      },
      include: {
        meal: {
          include: {
            variants: true,
            ingredients: { include: { ingredient: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(plans);
  } catch (error) {
    console.error('[API] Plan fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.delete('/:date/:slot', async (req: Request, res: Response) => {
  try {
    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) {
      return res.status(400).json({ error: 'Missing date or slot param' });
    }

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success) {
      return res.status(400).json({ error: 'Invalid date format — use YYYY-MM-DD' });
    }
    if (!slotResult.success) {
      return res.status(400).json({ error: 'Invalid slot — must be breakfast, lunch, dinner, or snacks' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // P2028 fix (2026-09-13): the interactive wrapper held a 5s budget for a
    // SINGLE statement — the wrapper added nothing (no multi-statement
    // atomicity, no cross-read). Plain delete: one round trip, no budget.
    await prisma.userPlan.delete({
      where: {
        userId_date_slot: {
          userId,
          date: parseISODate(rawDate),
          slot: slotResult.data,
        },
      },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Plan delete error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

export default router;

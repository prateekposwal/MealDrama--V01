import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { z } from 'zod';
import { ISO_DATE, Slot, CompleteStatus, isValidDate, parseISODate } from '../lib/validation';

const router = Router();
router.use(authMiddleware);

// POST /api/complete - Mark a slot as cooked/missed
router.post('/', async (req, res) => {
  try {
    const payload = z.object({
      date: ISO_DATE,
      slot: Slot,
      status: CompleteStatus,
    }).parse(req.body);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { date, slot, status } = payload;

    const completed = await prisma.completedSlot.upsert({
      where: {
        userId_date_slot: {
          userId,
          date: parseISODate(date),
          slot,
        },
      },
      update: {
        status,
        completedAt: new Date(),
      },
      create: {
        userId,
        date: parseISODate(date),
        slot,
        status,
      },
    });

    res.json(completed);
  } catch (error) {
    console.error('[API] Complete slot error:', error);
    res.status(500).json({ error: 'Failed to mark slot as complete' });
  }
});

// GET /api/complete - Get completed slots for date range
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate } = req.query;
    const now = new Date();

    let gte: Date;
    let lte: Date;

    if (startDate && typeof startDate === 'string') {
      if (!isValidDate(startDate)) return res.status(400).json({ error: 'Invalid startDate' });
      gte = parseISODate(startDate);
    } else {
      gte = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (endDate && typeof endDate === 'string') {
      if (!isValidDate(endDate)) return res.status(400).json({ error: 'Invalid endDate' });
      lte = parseISODate(endDate);
    } else {
      lte = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const completed = await prisma.completedSlot.findMany({
      where: { userId, date: { gte, lte } },
    });

    res.json(completed);
  } catch (error) {
    console.error('[API] Complete fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch completed slots' });
  }
});

router.delete('/:date/:slot', async (req, res) => {
  try {
    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) {
      return res.status(400).json({ error: 'Missing date or slot param' });
    }

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success) return res.status(400).json({ error: 'Invalid date format' });
    if (!slotResult.success) return res.status(400).json({ error: 'Invalid slot' });

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.completedSlot.delete({
      where: {
        userId_date_slot: { userId, date: parseISODate(rawDate), slot: slotResult.data },
      },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[API] Complete delete error:', error);
    res.status(500).json({ error: 'Failed to unmark completion' });
  }
});

export default router;

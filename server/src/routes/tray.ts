import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
import { z } from 'zod';
import { ISO_DATE, Slot, isValidDate, parseISODate } from '../lib/validation';

const router = Router();
router.use(authMiddleware);

const TrayItemSchema = z.object({
  mealId: z.string().optional(),
  customDishId: z.string().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  gravyStyle: z.string().default('Default'),
  rotiType: z.string().default('Phulka'),
  riceType: z.string().default('Plain'),
  sides: z.array(z.string()).default([]),
  beverages: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
}).refine(data => data.mealId || data.customDishId, {
  message: 'Either mealId or customDishId is required',
});

const GuestModeSchema = z.object({
  guestCount: z.number().int().min(0).max(11),
  guestDays: z.number().int().min(1).max(14),
});

// ============================================================================
// TRAY SLOT CRUD
// ============================================================================

// Create or update a tray slot
router.post('/slot', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({
      date: ISO_DATE,
      slot: Slot,
      totalServings: z.number().int().min(1).max(12).default(1),
      items: z.array(TrayItemSchema).min(1).max(5),
    }).parse(req.body);

    const parsedDate = parseISODate(payload.date);

    const result = await prisma.$transaction(async (tx) => {
      const traySlot = await tx.traySlot.upsert({
        where: { userId_date_slot: { userId, date: parsedDate, slot: payload.slot } },
        update: {
          totalServings: payload.totalServings,
          version: { increment: 1 },
        },
        create: {
          userId,
          date: parsedDate,
          slot: payload.slot,
          totalServings: payload.totalServings,
        },
      });

      await tx.trayItem.deleteMany({ where: { traySlotId: traySlot.id } });

      const createdItems = await Promise.all(
        payload.items.map((item, idx) =>
          tx.trayItem.create({
            data: {
              traySlotId: traySlot.id,
              mealId: item.mealId || null,
              customDishId: item.customDishId || null,
              quantity: item.quantity,
              gravyStyle: item.gravyStyle,
              rotiType: item.rotiType,
              riceType: item.riceType,
              sides: item.sides,
              beverages: item.beverages,
              sortOrder: item.sortOrder ?? idx,
            },
            include: {
              meal: { select: { id: true, name: true, icon: true, category: true, type: true } },
              customDish: { select: { id: true, name: true, category: true, dietType: true } },
            },
          })
        )
      );

      return { ...traySlot, items: createdItems };
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Tray slot upsert error:', error);
    res.status(500).json({ error: 'Failed to save tray slot' });
  }
});

// Get tray slots for date range
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const { startDate, endDate } = req.query;
    const now = new Date();
    let start: Date;
    let end: Date;

    if (startDate && typeof startDate === 'string' && isValidDate(startDate)) {
      start = parseISODate(startDate);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (endDate && typeof endDate === 'string' && isValidDate(endDate)) {
      end = parseISODate(endDate);
    } else {
      const d = new Date(start);
      d.setDate(d.getDate() + 14);
      end = d;
    }

    const slots = await prisma.traySlot.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            meal: { select: { id: true, name: true, icon: true, category: true, type: true, tags: true } },
            customDish: { select: { id: true, name: true, category: true, dietType: true } },
          },
        },
        roommateSuggestions: { where: { status: 'pending' } },
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    });

    res.json(slots);
  } catch (error) {
    console.error('[API] Tray slots fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch tray slots' });
  }
});

// Delete a tray slot
router.delete('/slot/:date/:slot', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) throw new APIError('INVALID_INPUT', 'Missing date or slot param', 400);

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success || !slotResult.success) {
      throw new APIError('INVALID_INPUT', 'Invalid date or slot format', 400);
    }

    await prisma.traySlot.delete({
      where: { userId_date_slot: { userId, date: parseISODate(rawDate), slot: slotResult.data } },
    });

    res.json({ ok: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Tray slot delete error:', error);
    res.status(500).json({ error: 'Failed to delete tray slot' });
  }
});

// ============================================================================
// GUEST MODE
// ============================================================================

// Enable guest mode on a slot (scales servings across days)
router.post('/guest-mode', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const payload = z.object({
      date: ISO_DATE,
      slot: Slot,
      guestCount: GuestModeSchema.shape.guestCount,
      guestDays: GuestModeSchema.shape.guestDays,
    }).parse(req.body);

    if (payload.guestCount > 12) {
      throw new APIError('GUEST_OVERFLOW', 'High volume → split batches. Max 12 servings/slot.', 400);
    }

    const parsedDate = parseISODate(payload.date);
    const newServings = Math.min(12, payload.guestCount + 1);

    const affectedDates: string[] = [];
    for (let i = 0; i < payload.guestDays; i++) {
      const d = new Date(parsedDate);
      d.setDate(d.getDate() + i);
      affectedDates.push(d.toISOString().split('T')[0] as string);

      await prisma.traySlot.upsert({
        where: { userId_date_slot: { userId, date: d, slot: payload.slot } },
        update: {
          isGuestMode: true,
          guestCount: payload.guestCount,
          guestDays: payload.guestDays,
          totalServings: newServings,
          version: { increment: 1 },
        },
        create: {
          userId,
          date: d,
          slot: payload.slot,
          isGuestMode: true,
          guestCount: payload.guestCount,
          guestDays: payload.guestDays,
          totalServings: newServings,
        },
      });
    }

    res.json({ ok: true, affectedDates, newServings });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Guest mode error:', error);
    res.status(500).json({ error: 'Failed to enable guest mode' });
  }
});

// Disable guest mode
router.delete('/guest-mode/:date/:slot', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) throw new APIError('INVALID_INPUT', 'Missing date or slot param', 400);

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success || !slotResult.success) {
      throw new APIError('INVALID_INPUT', 'Invalid date or slot format', 400);
    }

    await prisma.traySlot.update({
      where: { userId_date_slot: { userId, date: parseISODate(rawDate), slot: slotResult.data } },
      data: { isGuestMode: false, guestCount: 0, guestDays: 0, totalServings: 1, version: { increment: 1 } },
    });

    res.json({ ok: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Guest mode disable error:', error);
    res.status(500).json({ error: 'Failed to disable guest mode' });
  }
});

// ============================================================================
// TRAY ITEM OPERATIONS
// ============================================================================

// Add item to a slot
router.post('/slot/:date/:slot/items', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) throw new APIError('INVALID_INPUT', 'Missing date or slot param', 400);

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success || !slotResult.success) {
      throw new APIError('INVALID_INPUT', 'Invalid date or slot format', 400);
    }

    const parsedDate = parseISODate(rawDate);
    const itemData = TrayItemSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      let traySlot = await tx.traySlot.findUnique({
        where: { userId_date_slot: { userId, date: parsedDate, slot: slotResult.data } },
      });

      if (!traySlot) {
        traySlot = await tx.traySlot.create({
          data: { userId, date: parsedDate, slot: slotResult.data },
        });
      }

      const itemCount = await tx.trayItem.count({ where: { traySlotId: traySlot.id } });
      if (itemCount >= 5) {
        throw new APIError('SLOT_CROWDED', 'Slot crowded: max 5 items per slot. Consider splitting.', 400);
      }

      const maxSort = await tx.trayItem.findFirst({
        where: { traySlotId: traySlot.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      const newItem = await tx.trayItem.create({
        data: {
          traySlotId: traySlot.id,
          ...itemData,
          sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        },
        include: {
          meal: { select: { id: true, name: true, icon: true } },
          customDish: { select: { id: true, name: true } },
        },
      });

      await tx.traySlot.update({
        where: { id: traySlot.id },
        data: { version: { increment: 1 } },
      });

      return newItem;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Add tray item error:', error);
    res.status(500).json({ error: 'Failed to add tray item' });
  }
});

// Update tray item (quantity, variants, sides, beverages)
router.patch('/item/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    if (!itemId) throw new APIError('INVALID_INPUT', 'Missing itemId', 400);

    const updateData = z.object({
      quantity: z.number().int().min(1).max(99).optional(),
      gravyStyle: z.string().optional(),
      rotiType: z.string().optional(),
      riceType: z.string().optional(),
      sides: z.array(z.string()).optional(),
      beverages: z.array(z.string()).optional(),
    }).parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.trayItem.findUnique({
        where: { id: itemId },
        include: { traySlot: true },
      });

      if (!item || item.traySlot.userId !== userId) {
        throw new APIError('NOT_FOUND', 'Tray item not found', 404);
      }

      const updated = await tx.trayItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          meal: { select: { id: true, name: true, icon: true } },
          customDish: { select: { id: true, name: true } },
        },
      });

      await tx.traySlot.update({
        where: { id: item.traySlotId },
        data: { version: { increment: 1 } },
      });

      return updated;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Update tray item error:', error);
    res.status(500).json({ error: 'Failed to update tray item' });
  }
});

// Remove tray item
router.delete('/item/:itemId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
    if (!itemId) throw new APIError('INVALID_INPUT', 'Missing itemId', 400);

    await prisma.$transaction(async (tx) => {
      const item = await tx.trayItem.findUnique({
        where: { id: itemId },
        include: { traySlot: true },
      });

      if (!item || item.traySlot.userId !== userId) {
        throw new APIError('NOT_FOUND', 'Tray item not found', 404);
      }

      await tx.trayItem.delete({ where: { id: itemId } });
      await tx.traySlot.update({
        where: { id: item.traySlotId },
        data: { version: { increment: 1 } },
      });
    });

    res.json({ ok: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    console.error('[API] Delete tray item error:', error);
    res.status(500).json({ error: 'Failed to delete tray item' });
  }
});

// ============================================================================
// CUSTOMIZE SLOT (Swap & Customize Modal)
// ============================================================================

const CustomizeSlotSchema = z.object({
  items: z.array(z.object({
    mealId: z.string().optional(),
    customDishId: z.string().optional(),
    quantity: z.number().int().min(1).max(50).default(1),
    gravyStyle: z.string().optional(),
    rotiType: z.string().optional(),
    riceType: z.string().optional(),
    sides: z.array(z.string()).default([]),
    beverages: z.array(z.string()).default([]),
    sortOrder: z.number().int().optional(),
  })).min(1).max(5),
});

/**
 * PATCH /slot/:date/:slot/customize
 * Apply swap & customize changes to a slot.
 * Replaces all items in the slot with the customized payload.
 */
router.patch('/slot/:date/:slot/customize', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);

    const rawDate = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date;
    const rawSlot = Array.isArray(req.params.slot) ? req.params.slot[0] : req.params.slot;

    if (!rawDate || !rawSlot) throw new APIError('INVALID_INPUT', 'Missing date or slot param', 400);

    const dateResult = ISO_DATE.safeParse(rawDate);
    const slotResult = Slot.safeParse(rawSlot);
    if (!dateResult.success || !slotResult.success) {
      throw new APIError('INVALID_INPUT', 'Invalid date or slot format', 400);
    }

    const parsedDate = parseISODate(rawDate);
    const payload = CustomizeSlotSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      let traySlot = await tx.traySlot.findUnique({
        where: { userId_date_slot: { userId, date: parsedDate, slot: slotResult.data } },
      });

      if (!traySlot) {
        traySlot = await tx.traySlot.create({
          data: { userId, date: parsedDate, slot: slotResult.data },
        });
      }

      // Replace all items in the slot
      await tx.trayItem.deleteMany({ where: { traySlotId: traySlot.id } });

      const createdItems = await Promise.all(
        payload.items.map((item, idx) =>
          tx.trayItem.create({
            data: {
              traySlotId: traySlot.id,
              mealId: item.mealId || null,
              customDishId: item.customDishId || null,
              quantity: item.quantity,
              gravyStyle: item.gravyStyle || 'Default',
              rotiType: item.rotiType || 'Phulka',
              riceType: item.riceType || 'Plain',
              sides: item.sides,
              beverages: item.beverages,
              sortOrder: item.sortOrder ?? idx,
            },
            include: {
              meal: { select: { id: true, name: true, icon: true, category: true, type: true } },
              customDish: { select: { id: true, name: true, category: true, dietType: true } },
            },
          })
        )
      );

      return { ...traySlot, items: createdItems };
    });

    res.json({ success: true, slot: result });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('[API] Customize slot error:', error);
    res.status(500).json({ error: 'Failed to customize slot' });
  }
});

export default router;

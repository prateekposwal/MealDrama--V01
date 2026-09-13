import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError'; // canonical location — ../index only re-exports it (avoids pulling the full server bootstrap into route/module graphs)
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
  requestedBy: z.string().optional(),
  sortOrder: z.number().int().default(0),
}).refine(data => data.mealId || data.customDishId, {
  message: 'Either mealId or customDishId is required',
});

const GuestModeSchema = z.object({
  guestCount: z.number().int().min(0).max(11),
  guestDays: z.number().int().min(1).max(14),
});

/** Honest 400 message (Λ2.3): name the offending field so a blank "Invalid
 *  payload" becomes debuggable. The refine errors carry no path — their
 *  message already names the requirement ("Either mealId or customDishId is
 *  required"). Contract unchanged: same { error, details } shape. */
function zodErrorSummary(err: z.ZodError): string {
  const first = err.errors[0];
  if (!first) return 'Invalid payload';
  const field = first.path.length ? first.path.join('.') : null;
  return field ? `Invalid payload: ${field} — ${first.message}` : `Invalid payload: ${first.message}`;
}

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

    // P2028 fix (2026-09-13): the interactive async-callback transaction API
    // held a 5s budget across FIVE awaited round-trips (upsert → deleteMany →
    // up to 5 creates). On cold Neon compute (~1s/query) the whole-slot save
    // blew the budget → P2028 → HTTP 500 (the QA-logged "POST /slot 500
    // 5913ms" at old tray.ts:80). Converted to the SAME proven non-interactive
    // shape as POST /slot/:date/:slot/items:
    //   • traySlot UPSERT alone — ONE round-trip, atomic create-if-missing,
    //     idempotent (an intermediate failure absorbed by the retry's upsert),
    //     version-increment semantics unchanged (update bumps, create starts at
    //     the schema default).
    //   • $transaction([deleteMany, ...creates]) — ARRAY form: the item
    //     REPLACE (delete old + create new) commits atomically in ONE submit —
    //     deleteMany has NO inter-statement dependency on the creates, so the
    //     whole replace fits one batch. No interactive 5s timer: each statement
    //     carries its own latency, never a cumulative cross-query budget.
    const traySlot = await prisma.traySlot.upsert({
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

    const batch = await prisma.$transaction([
      prisma.trayItem.deleteMany({ where: { traySlotId: traySlot.id } }),
      ...payload.items.map((item, idx) =>
        prisma.trayItem.create({
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
      ),
    ]);

    const result = { ...traySlot, items: batch.slice(1) };

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: zodErrorSummary(error), details: error.errors });
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
      return res.status(400).json({ error: zodErrorSummary(error), details: error.errors });
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

    // P2028 fix (2026-09-13): the interactive async-callback transaction API held
    // a 5s budget across SIX awaited round-trips (findUnique → create-if-missing
    // → count → findFirst → item.create → slot.update). On cold Neon compute
    // each round-trip is ~1s; the first-load seed's 4 parallel POSTs each blew
    // the budget → P2028 "Transaction already closed" → HTTP 500 on first
    // landing (reload clean: seed skipped, no POSTs). Structural fix with NO
    // constraint weakening and NO error-masking:
    //   • traySlot UPSERT — ONE round-trip, atomic create-if-missing, and
    //     IDEMPOTENT: an intermediate failure that left a slot behind is
    //     absorbed by the retry's upsert (update: {} is a no-op on the
    //     existing row). FK/constraints unchanged.
    //   • trayItem.count + findFirst — SLOT_CROWDED gate and sortOrder
    //     computation unchanged (each one round-trip).
    //   • $transaction([create, update]) — Prisma's ARRAY form: the item write
    //     + version increment commit as ONE atomic batch in a single submit.
    //     No interactive 5s timer — the P2028 class is structurally gone; each
    //     query carries its own latency, never a cumulative cross-query budget.
    const traySlot = await prisma.traySlot.upsert({
      where: { userId_date_slot: { userId, date: parsedDate, slot: slotResult.data } },
      update: {},
      create: { userId, date: parsedDate, slot: slotResult.data },
    });

    const itemCount = await prisma.trayItem.count({ where: { traySlotId: traySlot.id } });
    if (itemCount >= 5) {
      throw new APIError('SLOT_CROWDED', 'Slot crowded: max 5 items per slot. Consider splitting.', 400);
    }

    const maxSort = await prisma.trayItem.findFirst({
      where: { traySlotId: traySlot.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const [newItem] = await prisma.$transaction([
      prisma.trayItem.create({
        data: {
          traySlotId: traySlot.id,
          ...itemData,
          sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        },
        include: {
          meal: { select: { id: true, name: true, icon: true } },
          customDish: { select: { id: true, name: true } },
        },
      }),
      prisma.traySlot.update({
        where: { id: traySlot.id },
        data: { version: { increment: 1 } },
      }),
    ]);

    res.json(newItem);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: zodErrorSummary(error), details: error.errors });
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

    // P2028 fix (2026-09-13): the interactive form held a 5s budget across
    // three awaited round-trips (findUnique → update → slot.update) — on cold
    // Neon the update path could blow it the same way POST /slot did.
    // Converted to the SAME proven non-interactive shape as the items path:
    //   • trayItem.findUnique STANDALONE — the ownership check runs before the
    //     batch (traySlotId is immutable — no TOCTOU: nothing in the schema
    //     moves an item between slots after creation).
    //   • $transaction([update, slot.update]) — ARRAY form: the item write +
    //     version bump commit atomically in ONE submit. slot.update depends
    //     only on the READ result (item.traySlotId), which is known before the
    //     batch — no inter-statement dependency inside the batch.
    const item = await prisma.trayItem.findUnique({
      where: { id: itemId },
      include: { traySlot: true },
    });

    if (!item || item.traySlot.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Tray item not found', 404);
    }

    const [updated] = await prisma.$transaction([
      prisma.trayItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          meal: { select: { id: true, name: true, icon: true } },
          customDish: { select: { id: true, name: true } },
        },
      }),
      prisma.traySlot.update({
        where: { id: item.traySlotId },
        data: { version: { increment: 1 } },
      }),
    ]);

    const result = updated;

    res.json(result);
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: zodErrorSummary(error), details: error.errors });
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

    // P2028 fix (2026-09-13): same conversion as PATCH /item — ownership read
    // STANDALONE, then $transaction([delete, slot.update]) ARRAY form: the
    // delete + version bump commit atomically in ONE submit (no interactive
    // 5s budget). traySlotId is immutable, so the read-then-batch ownership
    // check has no TOCTOU window; a concurrent delete fails the batch's
    // trayItem.delete (P2025) and rolls the version bump back — identical to
    // the old interactive failure mode.
    const item = await prisma.trayItem.findUnique({
      where: { id: itemId },
      include: { traySlot: true },
    });

    if (!item || item.traySlot.userId !== userId) {
      throw new APIError('NOT_FOUND', 'Tray item not found', 404);
    }

    await prisma.$transaction([
      prisma.trayItem.delete({ where: { id: itemId } }),
      prisma.traySlot.update({
        where: { id: item.traySlotId },
        data: { version: { increment: 1 } },
      }),
    ]);

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
    requestedBy: z.string().optional(),
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

    // P2028 fix (2026-09-13): the interactive form held a 5s budget across
    // 4-6 awaited round-trips (findUnique → create-if-missing → deleteMany →
    // up to 5 creates) — cold Neon blew it. Converted to the proven shape:
    //   • traySlot UPSERT alone (findUnique + create-if-missing collapsed into
    //     ONE atomic idempotent round-trip; update: {} is a no-op on an
    //     existing row and — exactly like the old findUnique-or-create — does
    //     NOT bump version: customize replaces items but never incremented).
    //   • $transaction([deleteMany, ...creates]) — ARRAY form: the item
    //     REPLACE commits atomically in ONE submit (deleteMany has no
    //     inter-statement dependency on the creates). Same all-or-nothing
    //     replace as the old interactive body, no cumulative 5s budget.
    const traySlot = await prisma.traySlot.upsert({
      where: { userId_date_slot: { userId, date: parsedDate, slot: slotResult.data } },
      update: {},
      create: { userId, date: parsedDate, slot: slotResult.data },
    });

    // Replace all items in the slot (atomic batch — delete + creates).
    const batch = await prisma.$transaction([
      prisma.trayItem.deleteMany({ where: { traySlotId: traySlot.id } }),
      ...payload.items.map((item, idx) =>
        prisma.trayItem.create({
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
      ),
    ]);

    const result = { ...traySlot, items: batch.slice(1) };

    res.json({ success: true, slot: result });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: zodErrorSummary(error), details: error.errors });
    }
    console.error('[API] Customize slot error:', error);
    res.status(500).json({ error: 'Failed to customize slot' });
  }
});

export default router;

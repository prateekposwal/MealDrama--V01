import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

async function requireMembership(req: Request, householdId: string) {
  const userId = (req as any).user?.userId;
  if (!userId) throw new APIError('UNAUTHORIZED', 'Unauthorized', 401);
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    include: { members: true },
  });
  if (!household) throw new APIError('NOT_FOUND', 'Household not found', 404);
  const isMember = household.members.some((m: any) => m.userId === userId);
  if (!isMember) throw new APIError('FORBIDDEN', 'Not a member', 403);
  return { household, userId, members: household.members };
}

function isValidStatus(from: string | null, to: string): boolean {
  const map: Record<string, string[]> = {
    planned: ['accepted', 'completed'],
    requested: ['planned', 'accepted', 'completed'],
    accepted: ['completed'],
    completed: [],
  };
  return (map[from ?? 'planned'] ?? []).includes(to);
}

function toJson(i: any) {
  return {
    id: i.id,
    authorUserId: i.authorUserId,
    date: i.date.toISOString().slice(0, 10),
    mealType: i.mealType,
    dishId: i.dishId ?? null,
    dishName: i.dishName,
    icon: i.icon,
    requestedBy: i.requestedBy ?? null,
    requestedFor: i.requestedFor ?? null,
    status: i.status,
    quantity: i.quantity,
    version: i.version ?? 0,
    createdAt: i.createdAt.toISOString(),
  };
}

// ─── Member-pointer integrity ────────────────────────────────────────────────
// requestedBy/requestedFor must be a HouseholdMember.id (OR the member's NAME,
// which we resolve to the id at the write boundary), or null = the family.
// This gives the field ONE authority — a member id — instead of the historic
// mix of user ids and free strings that silently detach across member edits.
function resolveMemberRef(members: any[], value: string | null, field: string): string | null {
  if (value === null || value === undefined) return null;
  const byId = members.find((m: any) => m.id === value);
  if (byId) return value;
  const byName = members.find((m: any) => m.name && m.name.toLowerCase() === value.toLowerCase());
  if (byName) return byName.id;
  throw new APIError('BAD_REQUEST', `${field} must be a household member (or null for the family)`, 400);
}

/**
 * GET /api/v1/households/:id/plan?from=YYYY-MM-DD&days=7
 * The family week in ONE table (merged across members).
 *
 * Dates are calendar days: queries AND rows both resolve to UTC-midnight,
 * so a meal planned for 2026-09-20 stays on 2026-09-20 in every timezone
 * (no ±1-day drift from server-local parsing).
 */
router.get('/:householdId/plan', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);

    const fromStr = String(req.query.from || '');
    const rawDays = Number(req.query.days || 7);
    const days = Number.isFinite(rawDays) ? Math.min(Math.max(1, Math.floor(rawDays)), 14) : 7;
    const from = fromStr
      ? new Date(fromStr + 'T00:00:00Z')
      : (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; })();
    const until = new Date(from.getTime() + days * 86400000);

    const items = await prisma.sharedPlanItem.findMany({
      where: { householdId, date: { gte: from, lt: until } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(items.map(toJson));
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Shared plan fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch shared plan' });
  }
});

const ItemSchema = z.object({
  date: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'snacks', 'dinner']),
  dishId: z.string().min(1).max(200).nullable().optional(),
  dishName: z.string().min(1).max(200),
  icon: z.string().optional(),
  requestedBy: z.string().min(1).max(64).nullable().optional(),
  requestedFor: z.string().min(1).max(64).nullable().optional(),
  status: z.enum(['planned', 'requested', 'accepted', 'completed']).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
});

/** POST /api/v1/households/:id/plan — add a row (author = caller). */
router.post('/:householdId/plan', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { userId, members } = await requireMembership(req, householdId);
    const p = ItemSchema.parse(req.body);
    p.requestedBy = resolveMemberRef(members, (p.requestedBy ?? null) as string | null, 'requestedBy');
    p.requestedFor = resolveMemberRef(members, (p.requestedFor ?? null) as string | null, 'requestedFor');

    // Area 6/10: a view-only member may READ but never write the family week.
    const me = members.find((m: any) => m.userId === userId);
    const canEdit = me?.role === 'admin' || (me as any)?.canEditPlan !== false;
    if (!canEdit) throw new APIError('FORBIDDEN', 'View-only member cannot add plan items', 403);

    const created = await prisma.sharedPlanItem.create({
      data: {
        householdId,
        authorUserId: userId,
        date: new Date(p.date + 'T00:00:00Z'),
        mealType: p.mealType,
        dishId: p.dishId ?? null,
        dishName: p.dishName,
        icon: p.icon ?? '🍽️',
        requestedBy: p.requestedBy ?? null,
        requestedFor: p.requestedFor ?? null,
        status: p.status ?? (p.requestedBy ? 'requested' : 'planned'),
        quantity: p.quantity ?? 1,
      },
    });
    res.status(201).json(toJson(created));
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Shared plan post error:', error);
    res.status(500).json({ error: 'Failed to add shared plan item' });
  }
});

/** PATCH /api/v1/households/:id/plan/:itemId — accept / complete / re-target.
 *  Optional optimistic lock: send the `ifVersion` you last saw; the PATCH only
 *  applies when the row is still on that version (409 otherwise) — two people
 *  editing the family week can never silently overwrite each other. */
router.patch('/:householdId/plan/:itemId', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const itemId = String(req.params.itemId || '');
    const { userId, members } = await requireMembership(req, householdId);
    // passthrough() so the optimistic-lock key (ifVersion) rides along with
    // the editable fields without being a persisted column itself.
    const p = ItemSchema.partial().omit({ date: true, mealType: true }).passthrough().parse(req.body);

    // Member-pointer integrity at the write boundary (resolve names → ids).
    if ('requestedBy' in p) p.requestedBy = resolveMemberRef(members, p.requestedBy ?? null, 'requestedBy') as any;
    if ('requestedFor' in p) p.requestedFor = resolveMemberRef(members, p.requestedFor ?? null, 'requestedFor') as any;

    const existing = await prisma.sharedPlanItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.householdId !== householdId) throw new APIError('NOT_FOUND', 'Item not found', 404);

    // Status machine: only legal transitions (the "accept round-trip" is
    // requested→accepted; a completed row is terminal).
    if (p.status) {
      if (!isValidStatus(existing.status, p.status)) {
        throw new APIError('BAD_REQUEST', `Cannot move ${existing.status} → ${p.status}`, 400);
      }
      // View-only members may only ACCEPT or COMPLETE a request; every other
      // field change (dish/date/slot/metadata) is admin- or author-only.
      const meRow = members.find((m: any) => m.userId === userId);
      const canEdit = meRow?.role === 'admin' || (meRow as any)?.canEditPlan !== false;
      const harmless = ['accepted', 'completed'].includes(p.status);
      const touchesMeta = Object.keys(p).some(k => k !== 'status' && ['dishName', 'dishId', 'date', 'mealType', 'requestedBy', 'requestedFor', 'quantity', 'icon'].includes(k));
      if (!canEdit && !(harmless && !touchesMeta)) {
        throw new APIError('FORBIDDEN', 'View-only member cannot change plans (accept/complete only)', 403);
      }
    }

    // Build the update from ONLY the fields actually present. The old
    // `...p, requestedFor: p.requestedFor ?? null` set requestedFor to null
    // on EVERY status-only PATCH, silently dropping "this meal is for X".
    const data: Record<string, unknown> = {};
    if ('dishId' in p) data.dishId = p.dishId;
    if ('dishName' in p) data.dishName = p.dishName;
    if ('icon' in p) data.icon = p.icon;
    if ('requestedBy' in p) data.requestedBy = p.requestedBy;
    if ('requestedFor' in p) data.requestedFor = p.requestedFor;
    if ('status' in p) data.status = p.status;
    if ('quantity' in p) data.quantity = p.quantity;

    const expectedVersion = req.body ? Number((req.body as any).ifVersion) : NaN;
    if (Number.isFinite(expectedVersion)) {
      const result = await prisma.sharedPlanItem.updateMany({
        where: { id: itemId, householdId, version: expectedVersion },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count === 0) {
        // Either the row moved, or it was already changed by someone else.
        const fresh = await prisma.sharedPlanItem.findUnique({ where: { id: itemId } });
        if (!fresh || fresh.householdId !== householdId) throw new APIError('NOT_FOUND', 'Item not found', 404);
        throw new APIError('CONFLICT', 'This meal changed on another device — refresh and try again', 409);
      }
      const fresh = await prisma.sharedPlanItem.findUnique({ where: { id: itemId } });
      res.json(toJson(fresh));
      return;
    }

    const updated = await prisma.sharedPlanItem.update({
      where: { id: itemId },
      data,
    });
    res.json(toJson(updated));
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Shared plan patch error:', error);
    res.status(500).json({ error: 'Failed to update shared plan item' });
  }
});

/** DELETE /api/v1/households/:id/plan/:itemId — remove (author/admin or self). */
router.delete('/:householdId/plan/:itemId', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const itemId = String(req.params.itemId || '');
    const { userId, members } = await requireMembership(req, householdId);
    const item = await prisma.sharedPlanItem.findUnique({ where: { id: itemId } });
    if (!item || item.householdId !== householdId) throw new APIError('NOT_FOUND', 'Item not found', 404);
    const me = members.find((m: any) => m.userId === userId);
    const isAuthor = item.authorUserId === userId;
    const isAdmin = me?.role === 'admin';
    if (!isAuthor && !isAdmin) throw new APIError('FORBIDDEN', 'Not authorized', 403);
    await prisma.sharedPlanItem.delete({ where: { id: itemId } });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Shared plan delete error:', error);
    res.status(500).json({ error: 'Failed to remove shared plan item' });
  }
});

export default router;
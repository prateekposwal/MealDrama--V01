import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../index';
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

/**
 * GET /api/v1/households/:id/stock — the ONE shared kitchen ledger.
 */
router.get('/:householdId/stock', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const rows = await prisma.householdStock.findMany({
      where: { householdId },
      orderBy: { name: 'asc' },
    });
    res.json(rows.map(r => ({ name: r.name, quantity: r.quantity, unit: r.unit, purchasedBy: r.purchasedBy, updatedAt: r.createdAt.toISOString() })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Household stock fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch household stock' });
  }
});

/**
 * POST /api/v1/households/:id/stock — log a purchase into the shared kitchen.
 * Upsert by (householdId, name, unit); quantity ADDs (a second pack bumps).
 */
router.post('/:householdId/stock', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { members, userId } = await requireMembership(req, householdId);
    const p = z.object({ name: z.string().min(1).max(100), quantity: z.number().positive(), unit: z.string().default('') }).parse(req.body);
    const me = members.find((m: any) => m.userId === userId);
    const purchasedBy = me?.name ?? 'Member';
    const upsert = await prisma.householdStock.upsert({
      where: { householdId_name_unit: { householdId, name: p.name, unit: p.unit } },
      create: { householdId, name: p.name, quantity: p.quantity, unit: p.unit, purchasedBy },
      update: { quantity: { increment: p.quantity }, purchasedBy },
    });
    res.status(201).json({ name: upsert.name, quantity: upsert.quantity, unit: upsert.unit, purchasedBy: upsert.purchasedBy });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Household stock post error:', error);
    res.status(500).json({ error: 'Failed to log purchase' });
  }
});

/**
 * DELETE /api/v1/households/:id/stock/:name — remove a wrong entry (keeps the
 * shared kitchen honest when a member fat-fingers a purchase).
 */
router.delete('/:householdId/stock/:name', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const name = String(req.params.name || '');
    await prisma.householdStock.deleteMany({ where: { householdId, name } });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof APIError) throw error;
    res.status(500).json({ error: 'Failed to remove stock line' });
  }
});

/**
 * GET /api/v1/households/:id/assumptions?memberId= — the persisted "I already
 * have / don't have" flags (merged across members or one member).
 */
router.get('/:householdId/assumptions', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { userId } = await requireMembership(req, householdId);
    const memberId = String(req.query.memberId || '');
    const myMember = memberId || String(userId);
    const rows = await prisma.householdAssumption.findMany({ where: { householdId, memberId: myMember } });
    res.json(rows.map(r => ({ name: r.name, flag: r.flag })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    res.status(500).json({ error: 'Failed to fetch assumptions' });
  }
});

/** PUT /api/v1/households/:id/assumptions/:name — set have/notHave (or delete). */
router.put('/:householdId/assumptions/:name', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { userId } = await requireMembership(req, householdId);
    const name = String(req.params.name || '');
    const p = z.object({ flag: z.enum(['have', 'notHave']).optional() }).parse(req.body);
    const memberId = String(userId);
    if (p.flag) {
      await prisma.householdAssumption.upsert({
        where: { householdId_memberId_name: { householdId, memberId, name } },
        create: { householdId, memberId, name, flag: p.flag },
        update: { flag: p.flag },
      });
    } else {
      await prisma.householdAssumption.deleteMany({ where: { householdId, memberId, name } });
    }
    res.json({ ok: true });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    res.status(500).json({ error: 'Failed to save assumption' });
  }
});

/**
 * GET/PUT member LANE — the generated per-member week persisted so a fresh
 * device sees the same Family Plans without re-generating from scratch.
 */
router.get('/:householdId/lanes', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const lanes = await prisma.memberLane.findMany({ where: { householdId } });
    res.json(lanes.map(l => ({ memberId: l.memberId, snapshot: l.snapshot, updatedAt: l.updatedAt.toISOString() })));
  } catch (error) {
    if (error instanceof APIError) throw error;
    res.status(500).json({ error: 'Failed to fetch lanes' });
  }
});

router.put('/:householdId/lanes/:memberId', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const memberId = String(req.params.memberId || '');
    const p = z.object({ snapshot: z.any() }).parse(req.body);
    const lane = await prisma.memberLane.upsert({
      where: { householdId_memberId: { householdId, memberId } },
      create: { householdId, memberId, snapshot: p.snapshot },
      update: { snapshot: p.snapshot },
    });
    res.json({ memberId: lane.memberId, updatedAt: lane.updatedAt.toISOString() });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    res.status(500).json({ error: 'Failed to save lane' });
  }
});

/**
 * POST /api/v1/households/:id/lanes/regenerate (ADMIN) — clears every member's
 * persisted lane so all devices rebuild Family Plans from the CURRENT
 * profiles (a member who edits diet/region gets a fresh week next refresh).
 */
router.post('/:householdId/lanes/regenerate', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    const { members, userId } = await requireMembership(req, householdId);
    const me = members.find((m: any) => m.userId === userId);
    if (me?.role !== 'admin') throw new APIError('FORBIDDEN', 'Admins only', 403);
    const deleted = await prisma.memberLane.deleteMany({ where: { householdId } });
    res.json({ ok: true, cleared: deleted.count });
  } catch (error) {
    if (error instanceof APIError) throw error;
    res.status(500).json({ error: 'Failed to regenerate lanes' });
  }
});

export default router;
/**
 * Household Expense Routes — Splitwise-style expense tracking for roommates.
 * Handles cook salary splitting, grocery sharing, and per-member balances.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

// ─── Helper: get current member ──
async function getMember(userId: string, householdId: string) {
  return prisma.householdMember.findFirst({
    where: { householdId, userId },
  });
}

// ─── List expenses for a household ──
router.get('/:householdId/expenses', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const member = await getMember(userId, householdId);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const expenses = await prisma.expense.findMany({
    where: { householdId },
    include: { splits: true },
    orderBy: { date: 'desc' },
    take: 50,
  });
  res.json(expenses);
});

// ─── Create expense (equal split by default) ──
router.post('/:householdId/expenses', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const member = await getMember(userId, householdId);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { title, amount, category, splitType } = req.body;
  if (!title || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Title and positive amount required' });
  }

  const members = await prisma.householdMember.findMany({ where: { householdId } });
  if (members.length === 0) return res.status(400).json({ error: 'No members' });

  const splitAmount = Math.round((amount / members.length) * 100) / 100;
  const remainder = Math.round((amount - splitAmount * members.length) * 100) / 100;

  const expense = await prisma.expense.create({
    data: {
      householdId,
      addedBy: userId,
      title,
      amount,
      category: category || 'other',
      splitType: splitType || 'equal',
      splits: {
        create: members.map((m, i) => ({
          memberId: m.id,
          amount: i === 0 ? splitAmount + remainder : splitAmount,
        })),
      },
    },
    include: { splits: true },
  });

  // Log to activity feed
  await prisma.activityFeed.create({
    data: {
      householdId,
      memberName: member.name,
      action: 'added expense',
      detail: `${title} — ₹${amount}`,
    },
  });

  res.status(201).json(expense);
});

// ─── Mark split as paid ──
router.patch('/:householdId/expenses/:expenseId/splits/:splitId/pay', async (req: Request, res: Response) => {
  const { splitId } = req.params;
  const split = await prisma.expenseSplit.update({
    where: { id: splitId },
    data: { paid: true },
  });
  res.json(split);
});

// ─── Delete expense (admin only) ──
router.delete('/:householdId/expenses/:expenseId', async (req: Request, res: Response) => {
  const { householdId, expenseId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const member = await getMember(userId, householdId);
  if (!member || member.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete expenses' });
  }
  await prisma.expense.delete({ where: { id: expenseId } });
  res.json({ success: true });
});

// ─── Get balance summary ──
router.get('/:householdId/balances', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const member = await getMember(userId, householdId);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const members = await prisma.householdMember.findMany({ where: { householdId } });
  const expenses = await prisma.expense.findMany({
    where: { householdId },
    include: { splits: true },
  });

  const balances = members.map(m => {
    const memberSplits = expenses.flatMap(e => e.splits.filter(s => s.memberId === m.id));
    const totalOwed = memberSplits.reduce((sum, s) => sum + s.amount, 0);
    const totalPaid = memberSplits.filter(s => s.paid).reduce((sum, s) => sum + s.amount, 0);
    return {
      memberId: m.id,
      memberName: m.name,
      totalOwed: Math.round(totalOwed * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      balance: Math.round((totalPaid - totalOwed) * 100) / 100,
    };
  });

  res.json(balances);
});

// ─── Activity feed ──
router.get('/:householdId/activity', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const activities = await prisma.activityFeed.findMany({
    where: { householdId },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(activities);
});

// ─── Log activity ──
router.post('/:householdId/activity', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const { memberName, action, detail } = req.body;
  if (!memberName || !action || !detail) {
    return res.status(400).json({ error: 'memberName, action, detail required' });
  }
  const activity = await prisma.activityFeed.create({
    data: { householdId, memberName, action, detail },
  });
  res.status(201).json(activity);
});

// ─── Consolidated grocery list: all members' meals ──
router.get('/:householdId/meals', async (req: Request, res: Response) => {
  const { householdId } = req.params;
  const { start, end } = req.query;

  // Get all household members with their userIds
  const members = await prisma.householdMember.findMany({
    where: { householdId, userId: { not: null } },
  });

  const userIds = members.map(m => m.userId!).filter(Boolean);
  if (userIds.length === 0) {
    return res.json({ meals: [], members: members.map(m => ({ id: m.id, name: m.name })) });
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

  // Build member name lookup by userId
  const memberByUser = Object.fromEntries(
    members.filter(m => m.userId).map(m => [m.userId!, m.name])
  );

  // Flatten to meal items with member attribution
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

  res.json({
    meals,
    members: members.map(m => ({ id: m.id, name: m.name })),
  });
});

export default router;

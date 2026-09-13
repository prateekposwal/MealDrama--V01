/**
 * COOK SHARE — the cook becomes a first-class, no-login entity.
 *
 *   PUT/GET /households/:householdId/cook-share   (authenticated members)
 *     → a stable per-household cook link. The token IS the credential;
 *       rotate (PUT { rotate: true }) to revoke and mint a new one.
 *
 *   GET /cook/:token   (PUBLIC — no auth, no app, no login)
 *     → a light, mobile-first HTML page showing TODAY's family plan to the
 *       cook. It updates automatically as members change meals (rendered
 *       fresh on every request), so the cook can bookmark ONE link instead of
 *       being re-texted a WhatsApp image every morning.
 *
 * Honesty note: there is deliberately NO scheduler here. Nothing can "send
 * plans every morning" until a messaging channel (WhatsApp Cloud API / SMS /
 * transactional email) exists. The shareable page is the piece that works
 * today; the send channel decision is a product call, documented in the
 * office-hours review.
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../lib/auth';
import { APIError } from '../lib/apiError';
import { normalizeE164 } from '../lib/whatsapp';
import { z } from 'zod';

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
  return { userId, household, members: household.members };
}

const router = Router();
router.use(authMiddleware);

const CookShareSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  enabled: z.boolean().optional(),
  rotate: z.boolean().optional(),
  // WhatsApp channel config (the cook's only channel)
  cookPhone: z.string().max(24).nullable().optional(),
  notifyEnabled: z.boolean().optional(),
  notifyAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  notifyTz: z.string().min(1).max(64).optional(),
  language: z.enum(['hi', 'en']).optional(),
});

/** The messaging fields the client needs to render the daily-WA toggle. */
function shareJson(s: any) {
  return {
    displayName: s.displayName,
    enabled: s.enabled,
    cookPhone: s.cookPhone ?? null,
    notifyEnabled: s.notifyEnabled ?? false,
    notifyAt: s.notifyAt ?? '08:00',
    notifyTz: s.notifyTz ?? 'Asia/Kolkata',
    language: s.language ?? 'hi',
    consentAt: s.consentAt ? s.consentAt.toISOString() : null,
    lastSentDate: s.lastSentDate ?? null,
    url: s.token ? `/cook/${s.token}` : undefined,
  };
}

// GET /:householdId/cook-share — the current cook link (or null if unset).
router.get('/:householdId/cook-share', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const share = await prisma.cookShare.findUnique({ where: { householdId } });
    if (!share) return res.json({ share: null });
    res.json({ share: shareJson(share) });
  } catch (error) {
    if (error instanceof APIError) throw error;
    console.error('[API] Cook-share fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cook-share' });
  }
});

// PUT /:householdId/cook-share — create/update the link; { rotate: true } mints a fresh token.
// Extends to the WhatsApp channel config: enabling the daily push with a phone
// captures the cook's explicit opt-in (consentAt) the first time — the
// scheduler never sends without it.
router.put('/:householdId/cook-share', async (req: Request, res: Response) => {
  try {
    const householdId = String(req.params.householdId || '');
    await requireMembership(req, householdId);
    const p = CookShareSchema.parse(req.body);

    const existing = await prisma.cookShare.findUnique({ where: { householdId } });
    const nextToken = p.rotate || !existing ? crypto.randomBytes(16).toString('hex') : existing.token;
    const nextPhone = p.cookPhone !== undefined ? normalizeE164(p.cookPhone) : existing?.cookPhone ?? null;

    const update: Record<string, unknown> = {};
    if (p.displayName !== undefined) update.displayName = p.displayName;
    if (p.enabled !== undefined) update.enabled = p.enabled;
    if (p.cookPhone !== undefined) update.cookPhone = nextPhone;
    if (p.notifyEnabled !== undefined) update.notifyEnabled = p.notifyEnabled;
    if (p.notifyAt !== undefined) update.notifyAt = p.notifyAt;
    if (p.notifyTz !== undefined) update.notifyTz = p.notifyTz;
    if (p.language !== undefined) update.language = p.language;
    if (p.rotate) update.token = nextToken;

    // Explicit cook opt-in is captured once, the first time the push is
    // enabled WITH a reachable number.
    const cookingEnabled = update.notifyEnabled ?? existing?.notifyEnabled ?? false;
    if (cookingEnabled && nextPhone && !existing?.consentAt) update.consentAt = new Date();

    const share = await prisma.cookShare.upsert({
      where: { householdId },
      update,
      create: {
        householdId,
        token: nextToken,
        displayName: p.displayName ?? 'Cook',
        enabled: p.enabled ?? true,
        ...(p.cookPhone !== undefined ? { cookPhone: normalizeE164(p.cookPhone) } : {}),
        ...(p.notifyEnabled !== undefined ? { notifyEnabled: p.notifyEnabled } : {}),
        ...(p.notifyAt !== undefined ? { notifyAt: p.notifyAt } : {}),
        ...(p.notifyTz !== undefined ? { notifyTz: p.notifyTz } : {}),
        ...(p.language !== undefined ? { language: p.language } : {}),
      },
    });

    res.status(201).json({ share: shareJson(share) });
  } catch (error: any) {
    if (error instanceof APIError) throw error;
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload' });
    console.error('[API] Cook-share update error:', error);
    res.status(500).json({ error: 'Failed to update cook-share' });
  }
});

// ─── PUBLIC COOK PAGE ───────────────────────────────────────────────────────
const cookPageRouter = Router();

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};
const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  requested: 'Requested',
  accepted: 'Accepted',
  completed: 'Done ✓',
};
const STATUS_EMOJI: Record<string, string> = {
  planned: '📝',
  requested: '🙋',
  accepted: '✅',
  completed: '🍽️',
};

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

cookPageRouter.get('/cook/:token', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || '');
    if (!token) return res.status(404).send('Not found');
    const share = await prisma.cookShare.findUnique({ where: { token } });
    if (!share || !share.enabled) return res.status(404).send('Not found');

    const household = await prisma.household.findUnique({
      where: { id: share.householdId },
      include: { members: true, sharedPlanItems: true },
    });
    if (!household) return res.status(404).send('Not found');

    const memberName = new Map((household.members as any[]).map((m: any) => [m.id, m.name]));
    const nameFor = (ref: string | null | undefined): string => {
      if (!ref) return 'Family';
      return memberName.get(ref) ?? ref;
    };

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const items = (household.sharedPlanItems as any[])
      .filter((i: any) => i.date >= today && i.date < tomorrow)
      .sort((a: any, b: any) => {
        const order: Record<string, number> = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };
        return (order[a.mealType] ?? 9) - (order[b.mealType] ?? 9);
      });

    const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

    const rows = items.map((i: any) => `
      <tr>
        <td class="status">${STATUS_EMOJI[i.status] ?? '📝'}</td>
        <td class="dish">${i.icon ? esc(i.icon) + ' ' : ''}${esc(i.dishName)}${Number.isFinite(i.quantity) && i.quantity > 1 ? ` <span class="qty">×${i.quantity}</span>` : ''}</td>
        <td class="who">${esc(nameFor(i.requestedFor ?? i.requestedBy))}</td>
        <td class="state">${STATUS_LABELS[i.status] ?? esc(i.status)}</td>
      </tr>`).join('');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(share.displayName)} · Today's Plan · ${esc(household.name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; background: #f7f3ee; color: #241d18; padding: 20px; max-width: 640px; margin: 0 auto; }
  .card { background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
  h1 { font-size: 20px; }
  .sub { color: #8a7f74; font-size: 13px; margin-top: 4px; }
  .meal { margin-top: 18px; font-weight: 800; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #a33a4f; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  td { padding: 9px 4px; border-bottom: 1px solid #f0e9e1; font-size: 15px; vertical-align: top; }
  .status { width: 30px; }
  .dish { font-weight: 600; }
  .who { color: #8a7f74; text-align: right; white-space: nowrap; }
  .state { color: #b09a88; text-align: right; font-size: 12px; }
  .qty { color: #a33a4f; font-weight: 800; }
  .empty { color: #8a7f74; font-size: 14px; margin-top: 16px; }
  .foot { margin-top: 20px; color: #b09a88; font-size: 12px; text-align: center; }
  tr.completed { opacity: .55; }
</style>
</head>
<body>
  <div class="card">
    <h1>👩‍🍳 ${esc(share.displayName)}, ${esc(household.name)} is cooking this today</h1>
    <div class="sub">${dateLabel} · updates automatically</div>
    ${items.length === 0
      ? `<p class="empty">No meals planned for today yet. Members can add meals anytime — this page refreshes on its own.</p>`
      : `<table>${rows}</table>`}
    <div class="foot">MealDrama ⚡ Household: ${esc(household.name)}</div>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Something went wrong loading today’s plan.');
  }
});

export default router;
export { cookPageRouter };
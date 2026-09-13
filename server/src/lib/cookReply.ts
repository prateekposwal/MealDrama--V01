/**
 * COOK REPLY — the inbound half of the WhatsApp channel. The cook closes the
 * loop with zero app: "done" / "ho gaya" completes today's pending meals,
 * "tomatoes nahi" flags a pantry shortage, anything else gets a short,
 * non-looping help reply.
 *
 * Phone → CookShare → household is the ONLY binding. A sender who isn't bound
 * to any cook link is ignored (never runs cross-household actions).
 */

import { prisma } from './prisma';
import { normalizeE164, sendText } from './whatsapp';
import { compileCookWorkOrder } from './cookPlanMessage';

export type CookReplyIntent = 'done' | 'shortage' | 'unknown';

const DONE_PHRASES = [
  'ho gaya', 'ho gya', 'hogaya', 'done', 'finished', 'ready', 'kar diya',
  'ban gaya', 'ban gya', 'complete', 'pho gaya', 'pho gya', 'bn gya',
  'banadiya', 'ho gya', 'sab khatam', 'sab ho gaya', 'all done', 'everything done',
  'karliya', 'kar liya', 'bana diya', 'sab ban gaya', 'sab ban gya',
];

const SHORTAGE_MARKERS = [
  'no', 'nahi', 'khatam', 'khtm', 'out of stock', 'out', 'kam', 'missing',
  'mila nahi', 'nahi mila', 'mila right nahi', 'not available', 'mil nahi raha',
  'nahi hai', 'khatam ho', 'khatam ho gaya', 'x nahi',
];

function normalize(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[!?.✓🙏😊🤷]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pure intent classifier — EN + Hinglish tokens. Precedence:
 *  1. A "khatam/khtm … ho gaya/gaya/hai" bundle = RAN OUT (item shortage),
 *     unless it's a bare "sab khatam" (everything cooked = done).
 *  2. Shortage signals ("tomatoes nahi", "no onions") beat nothing — they ARE
 *     the intent when no done phrase is present.
 *  3. Both firing → the item extractor decides: specific shortage vs. a "sab
 *     ho gaya"-style all-done.
 */
export function classifyCookReply(text: string): CookReplyIntent {
  const norm = normalize(text);
  if (!norm) return 'unknown';

  // khatam/khtm fused with a completion tail reads as "ran out", not "cooked".
  if (/(^|\s)(khatam|khtm)(\s|$)/.test(norm) && /(ho gaya|ho gya|gaya|hai|h\.)$/.test(norm) && !/^sab\s/.test(norm)) {
    return 'shortage';
  }

  const hasDone = DONE_PHRASES.some(p => norm.includes(p));
  // 'no' and 'out' are only shortage markers as WHOLE words ("no onions"),
  // never as substring noise.
  const hasShortage = SHORTAGE_MARKERS.some(m =>
    m === 'no' || m === 'out'
      ? new RegExp(`(^|\\s)${m}($|\\s)`).test(norm)
      : norm.includes(m)
  );

  if (hasShortage && !hasDone) return 'shortage';
  if (hasDone) {
    if (!hasShortage) return 'done';
    // both firing: a specific item was extracted → shortage; a bare "sab …"
    // completion → done.
    if (/^sab\b/.test(norm) && extractShortageItem(text) === 'sab') return 'done';
    return extractShortageItem(text) ? 'shortage' : 'done';
  }
  return 'unknown';
}

const FILLER = /^(hai|h|please|pls|abhi|aaj|bhi|to|ko|mein|me|ka|ki|the|a|and|or)\b/;

/** Best-effort item extraction from a shortage reply ("tomatoes nahi" →
 *  "tomatoes" ; "no tomatoes" → "tomatoes"). Returns '' when unclear. */
export function extractShortageItem(text: string): string {
  const norm = normalize(text);
  if (!norm) return '';

  // marker-first: "no tomatoes" / "nahi hai tomato"
  let m = norm.match(/^(?:no|nahi|nahi hai|khatam|khtm|out of stock|out|missing|kam)\s+(.{1,48})$/);
  if (m) return cleanItem(m[1] ?? '');

  // item-first: "tomatoes nahi" / "tomato khatam ho gaya" / "onion kam hai"
  m = norm.match(/^(.{1,48}?)\s+(?:nahi hai|nahi mil raha|mil nahi raha|mila nahi|nahi mila|khatam ho gaya|khatam ho|khatam|khtm|missing|out of stock|out|kam hai|kam|ho gaya|gaya|nahi)$/);
  if (m) return cleanItem(m[1] ?? '');

  // strip a single trailing marker directly off the whole text
  const direct = norm
    .replace(/\s+(?:nahi hai|nahi mil raha|mila nahi|nahi mila|khatam ho gaya|khatam ho|khatam|khtm|missing|out of stock|out|kam hai|kam|ho gaya|gaya|nahi)$/, '')
    .trim();
  return cleanItem(direct);
}

function cleanItem(raw: string): string {
  let out = raw.trim().replace(/[,.;\-]/g, ' ');
  out = out.replace(/\s+/g, ' ').trim();
  // walk leading filler words only
  let prev: string | null = null;
  while (out !== prev) {
    prev = out;
    out = out.replace(FILLER, '').trim();
  }
  // strip trailing filler ("tomatoes please", "onion hai")
  out = out.replace(/\s+(please|pls|hai|the|bhi|abhi|right|pakka|plz)\s*$/i, '').trim();
  // keep at most 3 words — a shortage is one item, not a paragraph
  out = out.split(' ').slice(0, 3).join(' ').trim();
  return out;
}

// ─── Orchestrator ───────────────────────────────────────────────────────────

export interface CookInboundInput {
  fromPhone: string;
  text?: string;
  intent?: CookReplyIntent; // interactive button reply id overrides the parser
  messageId?: string;
}

export interface CookInboundResult {
  handled: boolean;
  householdId?: string | null;
  shareId?: string | null;
  action?: 'done' | 'shortage' | 'unknown';
  completed?: number;
  shortageItem?: string;
  ack?: string;
}

function todayUtcRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

const MEAL_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, snacks: 2, dinner: 3 };

export async function processCookReply(input: CookInboundInput): Promise<CookInboundResult> {
  const from = normalizeE164(input.fromPhone);
  if (!from) return { handled: false, action: 'unknown' };

  const share = await prisma.cookShare.findFirst({ where: { cookPhone: from, enabled: true } });
  if (!share) return { handled: false, action: 'unknown' };

  const household = await prisma.household.findUnique({
    where: { id: share.householdId },
    include: { members: true },
  });
  if (!household) return { handled: false, shareId: share.id, householdId: share.householdId };

  const lang: 'hi' | 'en' = share.language === 'hi' ? 'hi' : 'en';
  const cookName = share.displayName || 'Cook';

  const intent: CookReplyIntent = input.intent ?? classifyCookReply(input.text ?? '');
  const idem = input.messageId ? `reply:${input.messageId}` : undefined;

  const memberName = new Map((household.members as any[]).map((mm: any) => [mm.id, mm.name]));
  const nameFor = (ref: string | null | undefined): string => {
    if (!ref) return 'Family';
    return memberName.get(ref) ?? ref;
  };

  if (intent === 'done') {
    const { start, end } = todayUtcRange();
    const res = await prisma.sharedPlanItem.updateMany({
      where: { householdId: share.householdId, date: { gte: start, lt: end }, status: { not: 'completed' } },
      data: { status: 'completed', version: { increment: 1 } },
    });
    await prisma.activityFeed.create({
      data: { householdId: share.householdId, memberName: cookName, action: 'completed', detail: 'All meals via WhatsApp ✓' },
    });
    const ack = lang === 'hi'
      ? `Done! 🎉 ${household.name} ke aaj ke saare meals mark ho gaye. Shukriya ${cookName} ji 🙏`
      : `Done! 🎉 All of ${household.name}'s meals for today are marked done. Thank you, ${cookName} 🙏`;
    await sendText(from, ack, { idempotencyKey: idem });
    return { handled: true, householdId: share.householdId, shareId: share.id, action: 'done', completed: res.count, ack };
  }

  if (intent === 'shortage') {
    const item = input.intent === 'shortage' && !input.text ? '' : extractShortageItem(input.text ?? '');
    const detail = item ? `Short: ${item}` : 'Shortage flagged';
    await prisma.activityFeed.create({
      data: { householdId: share.householdId, memberName: cookName, action: 'shortage', detail },
    });
    const ack = item
      ? (lang === 'hi'
        ? `Noted 👍 ${item} kahen ki kami — family ko pata chal gaya.`
        : `Noted 👍 ${item} shortage — the family has been told.`)
      : (lang === 'hi'
        ? `Noted 👍 Bataayiye kaunsi cheez kam hai — jaise "tomato nahi".`
        : `Noted 👍 Tell me what's short — e.g. "tomatoes nahi".`);
    await sendText(from, ack, { idempotencyKey: idem });
    return { handled: true, householdId: share.householdId, shareId: share.id, action: 'shortage', shortageItem: item, ack };
  }

  // unknown → short help, never a loop
  const ack = lang === 'hi'
    ? `MealDrama 🙏 ${household.name}. Sab ban gaya? "done" likhein. Kuch khatam? "tomato nahi" likhein. Live plan: khud update hota hai.`
    : `MealDrama 🙏 ${household.name}. Everything cooked? Reply "done". Something short? Reply "tomatoes nahi".`;
  await sendText(from, ack, { idempotencyKey: idem });
  return { handled: true, householdId: share.householdId, shareId: share.id, action: 'unknown', ack };
}

/**
 * Reusable today's-work-order assembly for a household's SHARE — used by the
 * daily scheduler AND as the richest fallback ack. Resolves member ids to
 * names and surfaces out-of-stock rows (ledger clamped to zero = ran out).
 */
export async function buildTodayWorkOrder(
  share: { id: string; householdId: string; displayName: string; language: string },
  opts: { baseUrl?: string; shortages?: string[]; date?: Date } = {},
): Promise<{ composed: string; pendingCount: number } | null> {
  const household = await prisma.household.findUnique({
    where: { id: share.householdId },
    include: { members: true, sharedPlanItems: true },
  });
  if (!household) return null;

  const today = opts.date ? new Date(opts.date.getTime()) : new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);
  const items = (household.sharedPlanItems as any[])
    .filter((i: any) => i.date >= today && i.date < tomorrow)
    .sort((a: any, b: any) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9));

  const memberName = new Map((household.members as any[]).map((m: any) => [m.id, m.name]));
  const nameFor = (ref: string | null | undefined): string => {
    if (!ref) return 'Family';
    return memberName.get(ref) ?? ref;
  };

  const language: 'hi' | 'en' = share.language === 'hi' ? 'hi' : 'en';
  const dateLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const shareRow = await prisma.cookShare.findUnique({ where: { id: share.id } });

  const token = shareRow?.token
    ? `${opts.baseUrl ?? 'https://mealdrama.onrender.com/api/v1'}/cook/${shareRow.token}`
    : '';

  const composed = compileCookWorkOrder({
    displayName: share.displayName || 'Cook',
    householdName: household.name,
    dateLabel,
    items: items.map((i: any) => ({
      mealType: i.mealType,
      dishName: i.dishName,
      icon: i.icon,
      quantity: i.quantity ?? 1,
      who: nameFor(i.requestedFor ?? i.requestedBy),
      status: i.status ?? 'planned',
    })),
    cookLink: token,
    shortages: opts.shortages ?? [],
    language,
  });

  return { composed, pendingCount: items.filter((i: any) => (i.status ?? 'planned') !== 'completed').length };
}
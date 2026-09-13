/**
 * COOK SCHEDULER — the daily job that pushes the WhatsApp work order to the
 * cook. In-process (their servers are long-running: launchd + Render), aligned
 * per-household to `notifyAt`/`notifyTz`, and idempotent: `lastSentDate` is
 * written after a real send, so a restart (or a re-run) never re-sends the
 * same household-day.
 *
 * Rules:
 *   - Only shares with notifyEnabled + cookPhone + consentAt participate.
 *   - Sends once per local calendar day (in the share's timezone), at/after
 *     `notifyAt` — and only when today actually HAS meals. An empty day is
 *     not marked sent, so the moment meals appear the cook still gets told.
 *   - Shortage lines are derived from the pantry ledger: rows clamped to zero
 *     by consumption mean "ran out" (no new schema).
 *   - One failing household never kills the loop (each is try/caught).
 *   - `send` is injectable for tests (defaults to the real sendWorkOrder).
 */
import { prisma } from './prisma';
import { sendWorkOrder } from './whatsapp';
import { buildTodayWorkOrder } from './cookReply';

export interface CookShareConfigured {
  id: string;
  householdId: string;
  token: string;
  displayName: string;
  enabled: boolean;
  cookPhone: string | null;
  notifyEnabled: boolean;
  notifyAt: string;
  notifyTz: string;
  language: string;
  lastSentDate: string | null;
  consentAt: Date | null;
}

const DEFAULT_TZ = 'Asia/Kolkata';
const DEFAULT_BASE_URL = process.env.SERVER_BASE_URL ?? 'https://mealdrama.onrender.com/api/v1';

/** Calendar date in a given timezone as YYYY-MM-DD (the idempotency key). */
export function localDateInTz(tz: string | null | undefined, date: Date = new Date()): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: tz || DEFAULT_TZ });
  } catch {
    return date.toLocaleDateString('en-CA', { timeZone: DEFAULT_TZ });
  }
}

/** Local wall-clock HH:MM in a given timezone. */
export function localTimeInTz(tz: string | null | undefined, date: Date = new Date()): string {
  try {
    return date.toLocaleTimeString('en-GB', { timeZone: tz || DEFAULT_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return date.toLocaleTimeString('en-GB', { timeZone: DEFAULT_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function isDueForSend(share: Partial<CookShareConfigured>, now: Date = new Date()): { due: boolean; reason: string } {
  if (!share.notifyEnabled) return { due: false, reason: 'notify-disabled' };
  if (!share.enabled) return { due: false, reason: 'link-disabled' };
  if (!share.cookPhone) return { due: false, reason: 'no-cook-phone' };
  if (!share.consentAt) return { due: false, reason: 'no-consent' };

  const todayStr = localDateInTz(share.notifyTz, now);
  if (share.lastSentDate === todayStr) return { due: false, reason: 'already-sent' };

  const nowTime = localTimeInTz(share.notifyTz, now);
  const notifyAt = share.notifyAt || '08:00';
  if (nowTime < notifyAt) return { due: false, reason: 'before-notify-time' };

  return { due: true, reason: 'due' };
}

export type CookSendFn = (to: string, composed: string, opts: { idempotencyKey: string; language: string }) => Promise<{
  ok: boolean;
  dryRun?: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}>;

export interface CookSchedulerDeps {
  send?: CookSendFn;
  baseUrl?: string;
}

export async function runCookSchedulerOnce(now: Date = new Date(), deps: CookSchedulerDeps = {}): Promise<{
  scanned: number;
  sent: number;
  skipped: number;
  results: Array<{ householdId: string; reason: string; error?: string }>;
}> {
  const send: CookSendFn = deps.send ?? ((to, composed, opts) => sendWorkOrder(to, composed, opts));
  const baseUrl = deps.baseUrl ?? DEFAULT_BASE_URL;
  const reaches = await prisma.cookShare.findMany({ where: { notifyEnabled: true } });
  const results: Array<{ householdId: string; reason: string; error?: string }> = [];

  for (const raw of reaches) {
    const share = raw as unknown as CookShareConfigured;
    const { due, reason } = isDueForSend(share, now);
    if (!due) {
      results.push({ householdId: share.householdId, reason });
      continue;
    }

    try {
      // Out-of-stock = pantry ledger rows clamped to zero by consumption.
      const shortages = await prisma.householdStock.findMany({
        where: { householdId: share.householdId, quantity: { lte: 0 } },
      });

      const workOrder = await buildTodayWorkOrder(share, {
        baseUrl,
        shortages: shortages.map(s => s.name),
        date: now,
      });

      // No meals planned today → don't mark sent; retry until there IS a plan.
      if (!workOrder || workOrder.pendingCount === 0) {
        results.push({ householdId: share.householdId, reason: 'no-meals-today' });
        continue;
      }

      const todayStr = localDateInTz(share.notifyTz, now);
      const outcome = await send(share.cookPhone!, workOrder.composed, {
        idempotencyKey: `household:${share.householdId}:${todayStr}`,
        language: share.language,
      });
      if (!outcome.ok) {
        results.push({ householdId: share.householdId, reason: 'send-failed', error: outcome.error });
        continue;
      }

      await prisma.cookShare.update({ where: { id: share.id }, data: { lastSentDate: todayStr } });
      results.push({ householdId: share.householdId, reason: 'sent' });
    } catch (err: any) {
      // one bad household never kills the loop
      results.push({ householdId: share.householdId, reason: 'error', error: err?.message ?? String(err) });
    }
  }

  const sent = results.filter(r => r.reason === 'sent').length;
  return { scanned: reaches.length, sent, skipped: results.length - sent, results };
}

let _timer: ReturnType<typeof setInterval> | null = null;
let _running = false;

/** Start the minutely loop. `unref()` so it never holds the process open. */
export function startCookScheduler(intervalMs = 60_000, deps: CookSchedulerDeps = {}): void {
  if (_timer) return;
  _timer = setInterval(async () => {
    if (_running) return;
    _running = true;
    try {
      const r = await runCookSchedulerOnce(new Date(), deps);
      if (r.sent > 0) console.log(`[CookScheduler] sent ${r.sent}/${r.scanned} household-days`);
    } catch (err) {
      console.error('[CookScheduler] run failed:', err);
    } finally {
      _running = false;
    }
  }, intervalMs);
  if (typeof _timer.unref === 'function') _timer.unref();
  console.log(`[CookScheduler] started (every ${intervalMs}ms)`);
}
// ─────────────────────────────────────────────────────────────────────────────
// COOK WHATSAPP CHANNEL — Phase 1 (dry-run buildable, zero Meta credentials).
//
//   1. whatsapp.ts       — Cloud API client: pure payload builders, dry-run vs.
//                          configured send, E.164 normalization, HMAC verify.
//   2. cookPlanMessage.ts — "all plan + left to do" work-order composer (hi/en).
//   3. cookReply.ts       — inbound intent classifier (done / shortage /
//                          unknown) + phone→household orchestration.
//   4. cookScheduler.ts   — day-aligned idempotent daily push.
//   5. cookShare.ts       — messaging-config extension + consent capture.
//
// The webhook ROUTE (challenge + HMAC + dispatch) lives in
// cookChannelWebhook.test.ts (it needs processCookReply module-mocked).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookShareFindFirst: vi.fn(),
  cookShareFindMany: vi.fn(),
  cookShareFindUnique: vi.fn(),
  cookShareUpsert: vi.fn(),
  cookShareUpdate: vi.fn(),
  householdFind: vi.fn(),
  sharedPlanUpdateMany: vi.fn(),
  activityCreate: vi.fn(),
  householdStockFindMany: vi.fn(),
}));

vi.mock('../server/src/lib/prisma', () => ({
  prisma: {
    cookShare: {
      findFirst: mocks.cookShareFindFirst,
      findMany: mocks.cookShareFindMany,
      findUnique: mocks.cookShareFindUnique,
      upsert: mocks.cookShareUpsert,
      update: mocks.cookShareUpdate,
    },
    household: { findUnique: mocks.householdFind },
    sharedPlanItem: { updateMany: mocks.sharedPlanUpdateMany },
    activityFeed: { create: mocks.activityCreate },
    householdStock: { findMany: mocks.householdStockFindMany },
  },
}));

import {
  normalizeE164,
  buildTextPayload,
  buildTemplatePayload,
  buildInteractiveButtonsPayload,
  isWhatsAppConfigured,
  graphEndpoint,
  verifyWebhookSignature,
} from '../server/src/lib/whatsapp';

// ─── 1. WHATSAPP CLIENT ─────────────────────────────────────────────────────
describe('whatsapp.ts — Cloud API client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('normalizeE164: 10-digit → +91; already +; 00-prefixed; 0-prefixed', () => {
    expect(normalizeE164('98765 43210')).toBe('+919876543210');
    expect(normalizeE164('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeE164('00919876543210')).toBe('+919876543210');
    expect(normalizeE164('0 98765 43210')).toBe('+919876543210');
    expect(normalizeE164(undefined)).toBeNull();
  });

  it('buildTextPayload: minimal WhatsApp text message', () => {
    const p = buildTextPayload('+919876543210', 'hello cook');
    expect(p.messaging_product).toBe('whatsapp');
    expect(p.recipient_type).toBe('individual');
    expect(p.to).toBe('+919876543210');
    expect(p.type).toBe('text');
    expect(p.text?.body).toBe('hello cook');
  });

  it('buildTemplatePayload: one body variable, language code set', () => {
    const p = buildTemplatePayload('+91x', 'cook_daily_plan', 'hi', 'the whole work order');
    expect(p.type).toBe('template');
    expect(p.template?.name).toBe('cook_daily_plan');
    expect(p.template?.language.code).toBe('hi');
    expect(p.template?.components[0]?.parameters).toEqual([{ type: 'text', text: 'the whole work order' }]);
  });

  it('buildInteractiveButtonsPayload: done + shortage quick replies', () => {
    const p = buildInteractiveButtonsPayload('+91x', 'Done today?', [
      { id: 'done', title: '✅ Done' },
      { id: 'shortage', title: '⚠️ Short' },
    ]);
    expect(p.type).toBe('interactive');
    expect(p.interactive?.type).toBe('button');
    const ids = p.interactive?.action.buttons.map(b => b.reply.id);
    expect(ids).toEqual(['done', 'shortage']);
  });

  it('dry-run: no env → sendText logs and returns ok WITHOUT calling fetch', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy);
    const { sendText } = await import('../server/src/lib/whatsapp');
    const r = await sendText('+919876543210', 'some ack', { idempotencyKey: 'reply:1' });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('configured: posts to the Graph endpoint with bearer + idempotency-key', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_ID', '123456789');
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'wamid.fake' }] }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { sendText } = await import('../server/src/lib/whatsapp');
    const r = await sendText('+919876543210', 'hello', { idempotencyKey: 'household:hh:2026-09-16' });

    expect(r.ok).toBe(true);
    expect(r.messageId).toBe('wamid.fake');
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/v20.0/123456789/messages');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('household:hh:2026-09-16');
  });

  it('configured but API error → ok:false with the Meta error message', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 'test-token');
    vi.stubEnv('WHATSAPP_PHONE_ID', '123456789');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Template not approved' } }),
    }));
    const { sendText } = await import('../server/src/lib/whatsapp');
    const r = await sendText('+91x', 'x');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Template not approved');
    expect(r.status).toBe(400);
  });

  it('isWhatsAppConfigured + graphEndpoint track the env', () => {
    vi.unstubAllEnvs();
    expect(isWhatsAppConfigured()).toBe(false);
    expect(graphEndpoint()).toContain('/v20.0//messages'); // empty phone id placeholder
    vi.stubEnv('WHATSAPP_TOKEN', 't');
    vi.stubEnv('WHATSAPP_PHONE_ID', '42');
    expect(isWhatsAppConfigured()).toBe(true);
    expect(graphEndpoint()).toBe('https://graph.facebook.com/v20.0/42/messages');
  });

  it('verifyWebhookSignature: matches a real HMAC, rejects wrong bytes', () => {
    const secret = 'the-app-secret';
    const body = Buffer.from(JSON.stringify({ hello: 'meta' }));
    const good = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
    expect(verifyWebhookSignature(body, good, secret)).toBe(true);
    expect(verifyWebhookSignature(body, 'sha256=deadbeef', secret)).toBe(false);
    expect(verifyWebhookSignature(body, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(body, good, '')).toBe(false);
  });
});

import crypto from 'crypto';

// ─── 2. WORK-ORDER COMPOSER ─────────────────────────────────────────────────
import { compileCookWorkOrder } from '../server/src/lib/cookPlanMessage';

describe('cookPlanMessage.ts — "all plan + left to do" composer', () => {
  const base = {
    displayName: 'Rajesh',
    householdName: 'The Sharma House',
    dateLabel: 'Wednesday, 16 September',
    cookLink: 'https://mealdrama.onrender.com/api/v1/cook/tok-abc',
    shortages: [],
  };

  const items = [
    { mealType: 'lunch', dishName: 'Rajma Chawal', icon: '🍛', quantity: 2, who: 'Riya, Aman', status: 'accepted' },
    { mealType: 'dinner', dishName: 'Dal Makhani', icon: '🍱', quantity: 4, who: 'Family', status: 'accepted' },
    { mealType: 'breakfast', dishName: 'Poha', icon: '🥣', quantity: 1, who: 'Riya', status: 'completed' },
  ];

  it('carries the FULL plan, the LEFT TO DO slice, shortages, and the live link', () => {
    const out = compileCookWorkOrder({ ...base, language: 'en', items, shortages: ['Tomatoes', 'Onions'] });
    expect(out).toContain('Today’s plan');
    expect(out).toContain('Rajma Chawal ×2 (for Riya, Aman)');
    expect(out).toContain('Dal Makhani ×4 (for Family)');
    expect(out).toContain('Poha (for Riya) ✓'); // done is marked but still on the plan
    expect(out).toContain('Left to do — 2');
    expect(out).toContain('Rajma Chawal'); // repeated in the actionable slice
    expect(out).toContain('Short right now: Tomatoes, Onions');
    expect(out).toContain('Live plan (updates by itself): https://mealdrama.onrender.com/api/v1/cook/tok-abc');
    expect(out).toContain('Reply “done”');
  });

  it('all done → clear all-done state, no leftover "left to do" rows', () => {
    const allDone = items.map(i => ({ ...i, status: 'completed' as const }));
    const out = compileCookWorkOrder({ ...base, language: 'en', items: allDone, shortages: [] });
    expect(out).toContain('Left to do — 0');
    expect(out).toContain('All done for today!');
  });

  it('hindi (default) labels are utterable Hinglish', () => {
    const out = compileCookWorkOrder({ ...base, items, shortages: [] }); // no language → hi
    expect(out).toContain('Namaste Rajesh');
    expect(out).toContain('Aaj ka plan');
    expect(out).toContain('Baaki ka kaam — 2');
    expect(out).toContain('ke liye');
  });
});

// ─── 3. INBOUND INTENTS ─────────────────────────────────────────────────────
import { classifyCookReply, extractShortageItem, processCookReply } from '../server/src/lib/cookReply';

describe('cookReply.ts — inbound intent classifier', () => {
  it('done signals (EN + Hinglish)', () => {
    expect(classifyCookReply('done')).toBe('done');
    expect(classifyCookReply('sab ho gaya ji')).toBe('done');
    expect(classifyCookReply('ho gaya')).toBe('done');
    expect(classifyCookReply('ban gaya sir')).toBe('done');
    expect(classifyCookReply('everything done')).toBe('done');
    expect(classifyCookReply('sab khatam')).toBe('done'); // finished cooking
  });

  it('shortage signals extract the item', () => {
    expect(classifyCookReply('tomatoes nahi')).toBe('shortage');
    expect(extractShortageItem('tomatoes nahi')).toBe('tomatoes');
    expect(classifyCookReply('no onions')).toBe('shortage');
    expect(extractShortageItem('no onions')).toBe('onions');
    expect(classifyCookReply('milk khatam ho gaya')).toBe('shortage');
    expect(extractShortageItem('milk khatam ho gaya')).toBe('milk');
    expect(extractShortageItem('onion kam hai')).toBe('onion');
  });

  it('unrelated chatter → unknown', () => {
    expect(classifyCookReply('good morning')).toBe('unknown');
    expect(classifyCookReply('')).toBe('unknown');
  });
});

describe('cookReply.ts — orchestrator (phone → household)', () => {
  const HH = 'hh-1';
  const share = { id: 'cs-1', householdId: HH, token: 'tok', displayName: 'Rajesh', cookPhone: '+919876543210', enabled: true, notifyEnabled: true, notifyAt: '08:00', notifyTz: 'Asia/Kolkata', language: 'hi' as const, lastSentDate: null, consentAt: new Date('2026-09-01') };

  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.cookShareFindFirst.mockImplementation(async ({ where }: any) =>
      where.cookPhone === '+919876543210' ? share : null);
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH ? { id: HH, name: 'Sharma House', members: [{ id: 'mem-riya', userId: 'u-riya', name: 'Riya' }] } : null);
  });

  it('a sender bound to no cook link is ignored (never a cross-household action)', async () => {
    const r = await processCookReply({ fromPhone: '9999999999', text: 'ho gaya' });
    expect(r.handled).toBe(false);
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(mocks.sharedPlanUpdateMany).not.toHaveBeenCalled();
  });

  it('"done" completes today’s pending meals and logs the cook’s action', async () => {
    mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 2 });
    mocks.activityCreate.mockResolvedValue({});
    const r = await processCookReply({ fromPhone: '9876543210', text: 'ho gaya' });
    expect(r).toMatchObject({ handled: true, action: 'done', completed: 2 });
    const call = mocks.sharedPlanUpdateMany.mock.calls[0]![0] as any;
    expect(call.where.status).toEqual({ not: 'completed' });
    expect(call.where.householdId).toBe(HH);
    expect(call.data.status).toBe('completed');
    expect(call.data.version).toEqual({ increment: 1 });
    const act = mocks.activityCreate.mock.calls[0]![0]!.data as any;
    expect(act.action).toBe('completed');
    expect(act.memberName).toBe('Rajesh');
  });

  it('"tomatoes nahi" flags a shortage activity entry and acks the item', async () => {
    mocks.activityCreate.mockResolvedValue({});
    const r = await processCookReply({ fromPhone: '9876543210', text: 'tomatoes nahi' });
    expect(r).toMatchObject({ handled: true, action: 'shortage', shortageItem: 'tomatoes' });
    const act = mocks.activityCreate.mock.calls[0]![0]!.data as any;
    expect(act.action).toBe('shortage');
    expect(act.detail).toContain('tomatoes');
  });

  it('interactive button "done" overrides the parser and acks', async () => {
    mocks.sharedPlanUpdateMany.mockResolvedValue({ count: 1 });
    mocks.activityCreate.mockResolvedValue({});
    const r = await processCookReply({ fromPhone: '9876543210', intent: 'done', text: '✅ Done' });
    expect(r.action).toBe('done');
    expect(r.completed).toBe(1);
  });

  it('unknown chatter gets a short help ack, no side effects', async () => {
    const r = await processCookReply({ fromPhone: '9876543210', text: 'good morning' });
    expect(r).toMatchObject({ handled: true, action: 'unknown' });
    expect(mocks.sharedPlanUpdateMany).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
    expect(r.ack).toContain('done');
  });
});

// ─── 4. SCHEDULER ───────────────────────────────────────────────────────────
import { isDueForSend, localDateInTz, runCookSchedulerOnce } from '../server/src/lib/cookScheduler';

describe('cookScheduler.ts — day-aligned idempotent daily push', () => {
  const NOW = new Date('2026-09-16T09:00:00Z'); // 14:30 IST
  const dueShare = {
    id: 'cs-1',
    householdId: 'hh-1',
    token: 'tok',
    displayName: 'Rajesh',
    enabled: true,
    cookPhone: '+919876543210',
    notifyEnabled: true,
    notifyAt: '08:00',
    notifyTz: 'Asia/Kolkata',
    language: 'hi',
    lastSentDate: null,
    consentAt: new Date('2026-09-01'),
  };

  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
  });

  it('localDateInTz respects the household timezone', () => {
    expect(localDateInTz('Asia/Kolkata', new Date('2026-09-16T16:00:00Z'))).toBe('2026-09-16'); // 21:30 IST same UTC date
    expect(localDateInTz('Asia/Kolkata', new Date('2026-09-16T19:30:00Z'))).toBe('2026-09-17'); // 01:00 IST crosses midnight
    expect(localDateInTz(null, new Date('2026-09-16T09:00:00Z'))).toBe('2026-09-16');
  });

  it('isDueForSend: gates + idempotency + notify window', () => {
    expect(isDueForSend(dueShare, NOW)).toEqual({ due: true, reason: 'due' });
    expect(isDueForSend({ ...dueShare, lastSentDate: '2026-09-16' }, NOW)).toEqual({ due: false, reason: 'already-sent' });
    expect(isDueForSend({ ...dueShare, cookPhone: null }, NOW)).toEqual({ due: false, reason: 'no-cook-phone' });
    expect(isDueForSend({ ...dueShare, consentAt: null }, NOW)).toEqual({ due: false, reason: 'no-consent' });
    expect(isDueForSend({ ...dueShare, notifyAt: '15:00' }, NOW)).toEqual({ due: false, reason: 'before-notify-time' });
  });

  it('sends exactly once per household-day and records lastSentDate', async () => {
    mocks.cookShareFindMany.mockResolvedValue([dueShare]);
    mocks.householdStockFindMany.mockResolvedValue([{ name: 'Tomatoes' }]);
    mocks.householdFind.mockResolvedValue({
      id: 'hh-1',
      name: 'Sharma House',
      members: [{ id: 'mem-riya', name: 'Riya' }],
      sharedPlanItems: [
        { id: 'i1', date: new Date('2026-09-16T00:00:00Z'), mealType: 'lunch', dishName: 'Rajma Chawal', icon: '🍛', quantity: 2, requestedFor: 'mem-riya', requestedBy: null, status: 'accepted' },
        { id: 'i2', date: new Date('2026-09-16T00:00:00Z'), mealType: 'dinner', dishName: 'Dal Makhani', icon: '🍱', quantity: 4, requestedFor: null, requestedBy: null, status: 'completed' },
      ],
    });
    mocks.cookShareFindUnique.mockResolvedValue(dueShare); // buildTodayWorkOrder link
    mocks.cookShareUpdate.mockResolvedValue({});

    const sent: Array<{ to: string; composed: string; opts: any }> = [];
    const r = await runCookSchedulerOnce(NOW, {
      send: async (to, composed, opts) => { sent.push({ to, composed, opts }); return { ok: true, dryRun: true }; },
    });

    expect(r.sent).toBe(1);
    expect(r.skipped).toBe(0);
    expect(sent).toHaveLength(1);
    const sent0 = sent[0]!;
    expect(sent0.to).toBe('+919876543210');
    expect(sent0.composed).toContain('Rajma Chawal'); // full plan
    expect(sent0.composed).toContain('— 1'); // left-to-do count (hi + en use the same — N)
    expect(sent0.composed).toContain('Tomatoes'); // shortage derived from clamped ledger
    expect(sent0.opts.idempotencyKey).toBe('household:hh-1:2026-09-16');
    expect(mocks.cookShareUpdate.mock.calls[0]![0]!.data.lastSentDate).toBe('2026-09-16');
  });

  it('an already-sent share is skipped (restart never re-sends)', async () => {
    mocks.cookShareFindMany.mockResolvedValue([{ ...dueShare, lastSentDate: '2026-09-16' }]);
    const sent: any[] = [];
    const r = await runCookSchedulerOnce(NOW, { send: async (to, composed, opts) => { sent.push({ to, composed, opts }); return { ok: true }; } });
    expect(r.sent).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('a day with NO meals is not sent and NOT marked (it retries until a plan exists)', async () => {
    mocks.cookShareFindMany.mockResolvedValue([dueShare]);
    mocks.householdStockFindMany.mockResolvedValue([]);
    mocks.householdFind.mockResolvedValue({ id: 'hh-1', name: 'Sharma House', members: [], sharedPlanItems: [] });
    mocks.cookShareFindUnique.mockResolvedValue(dueShare);
    const sent: any[] = [];
    const r = await runCookSchedulerOnce(NOW, { send: async (to, composed, opts) => { sent.push({ to, composed, opts }); return { ok: true }; } });
    expect(r.sent).toBe(0);
    expect(sent).toHaveLength(0);
    expect(mocks.cookShareUpdate).not.toHaveBeenCalled();
    expect(r.results[0]?.reason).toBe('no-meals-today');
  });

  it('a failed send does not mark lastSentDate (retryable)', async () => {
    mocks.cookShareFindMany.mockResolvedValue([dueShare]);
    mocks.householdStockFindMany.mockResolvedValue([]);
    mocks.householdFind.mockResolvedValue({ id: 'hh-1', name: 'Sharma House', members: [], sharedPlanItems: [{ id: 'i1', date: new Date('2026-09-16T00:00:00Z'), mealType: 'lunch', dishName: 'X', icon: '', quantity: 1, requestedFor: null, requestedBy: null, status: 'planned' }] });
    mocks.cookShareFindUnique.mockResolvedValue(dueShare);
    const r = await runCookSchedulerOnce(NOW, { send: async () => ({ ok: false, error: 'Template not approved' }) });
    expect(r.sent).toBe(0);
    expect(mocks.cookShareUpdate).not.toHaveBeenCalled();
    expect(r.results[0]?.reason).toBe('send-failed');
  });
});

// ─── 5. COOK-SHARE ROUTE EXTENSION (consent + phone) ───────────────────────
import { buildCookShareApp } from '../server/src/lib/routerHarness';
import { generateAccessToken } from '../server/src/lib/auth';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

describe('cookShare.ts — WhatsApp messaging config + consent capture', () => {
  const HH = 'hh-1';
  const MEMBERS = [{ id: 'mem-riya', userId: 'u-riya', name: 'Riya', role: 'admin' }];
  let base = '';
  let server: Server;

  const app = buildCookShareApp();
  const token = generateAccessToken({ userId: 'u-riya', email: 'r@x.com', phone: null, name: 'Riya' });
  const listen = () => new Promise<{ base: string; server: Server }>(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve({ base: `http://127.0.0.1:${(s.address() as AddressInfo).port}`, server: s }));
  });

  beforeAll(async () => {
    ({ base, server } = await listen());
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  beforeEach(() => {
    for (const f of Object.values(mocks)) f.mockReset();
    mocks.householdFind.mockImplementation(async ({ where }: any) =>
      where.id === HH ? { id: HH, name: 'Sharma House', members: MEMBERS } : null);
  });

  it('enabling the daily push with a phone captures consentAt on first enable', async () => {
    mocks.cookShareFindUnique.mockResolvedValue(null);
    mocks.cookShareUpsert.mockImplementation(async ({ update, create }: any) => ({
      id: 'cs-1', token: 'tok-new', displayName: 'Rajesh', enabled: true,
      cookPhone: '+919876543210', notifyEnabled: true, notifyAt: '08:00', notifyTz: 'Asia/Kolkata',
      language: 'hi', consentAt: update.consentAt ?? new Date(), lastSentDate: null,
    }));
    const res = await fetch(`${base}/api/v1/households/${HH}/cook-share`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cookPhone: '98765 43210', notifyEnabled: true, notifyAt: '08:00', language: 'hi' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.share.cookPhone).toBe('+919876543210'); // normalized to E.164
    expect(body.share.notifyEnabled).toBe(true);
    expect(body.share.consentAt).toBeTruthy(); // consent captured
    expect((mocks.cookShareUpsert.mock.calls[0]![0]!.update as any).consentAt).toBeInstanceOf(Date);
  });

  it('re-enabling later does NOT re-write consent (already captured)', async () => {
    mocks.cookShareFindUnique.mockResolvedValue({ id: 'cs-1', token: 'tok-1', householdId: HH, consentAt: new Date('2026-09-01') });
    mocks.cookShareUpsert.mockImplementation(async ({ update }: any) => ({
      id: 'cs-1', token: 'tok-1', displayName: 'Rajesh', enabled: true,
      cookPhone: '+919876543210', notifyEnabled: true, notifyAt: '08:00', notifyTz: 'Asia/Kolkata',
      language: 'en', consentAt: update.consentAt ?? new Date('2026-09-01'), lastSentDate: '2026-09-16',
    }));
    const res = await fetch(`${base}/api/v1/households/${HH}/cook-share`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notifyEnabled: true, language: 'en' }),
    });
    expect(res.status).toBe(201);
    const upd = mocks.cookShareUpsert.mock.calls[0]![0]!.update as any;
    expect('consentAt' in upd).toBe(false); // never touched again
  });

  it('bad HH:MM → 400', async () => {
    mocks.cookShareFindUnique.mockResolvedValue(null);
    const res = await fetch(`${base}/api/v1/households/${HH}/cook-share`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notifyAt: '9am' }),
    });
    expect(res.status).toBe(400);
  });
});
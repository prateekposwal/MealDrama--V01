// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP WEBHOOK ROUTE — Meta setup challenge + raw-body HMAC verification
// + inbound dispatch. `processCookReply` is module-mocked (its own behaviour
// is covered in cookChannel.test.ts); this file proves the ROUTE: who may hit
// it, what bytes must be signed, and that replies arrive at the orchestrator.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

const mocks = vi.hoisted(() => ({
  processCookReply: vi.fn(),
}));

vi.mock('../server/src/lib/cookReply', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/src/lib/cookReply')>();
  return { ...actual, processCookReply: mocks.processCookReply };
});

import { buildWhatsAppWebhookApp } from '../server/src/lib/routerHarness';
import { classifyCookReply } from '../server/src/lib/cookReply';
import { verifyWebhookSignature } from '../server/src/lib/whatsapp';
import type { Server } from 'http';
import type { AddressInfo } from 'net';

const WEBHOOK_PATH = '/api/v1/webhook/whatsapp';
const SECRET = 'the-app-secret-123';
const SIGN = (body: string) => `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
const payloadOf = (messages: unknown[]) =>
  JSON.stringify({ entry: [{ id: 'e', changes: [{ value: { messages } }] }] });
const textMsg = (id: string, body: string, from = '+919876543210') =>
  ({ id, from, type: 'text', text: { body } });

describe('whatsappWebhook.ts — challenge + HMAC + inbound dispatch', () => {
  let base = '';
  let server: Server;
  const app = buildWhatsAppWebhookApp();

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
    mocks.processCookReply.mockReset();
    mocks.processCookReply.mockResolvedValue({ handled: true });
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns WHATSAPP_APP_SECRET-independent helpers: verifyWebhookSignature', () => {
    expect(verifyWebhookSignature(Buffer.from('x'), SIGN('x'), SECRET)).toBe(true);
    expect(classifyCookReply('ho gaya')).toBe('done'); // route re-exports the classifier for button ids
  });

  it('GET challenge returns hub.challenge when verify_token matches', async () => {
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'verify-me');
    const res = await fetch(`${base}${WEBHOOK_PATH}?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=CHALLENGE_1`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('CHALLENGE_1');
  });

  it('GET challenge rejects a wrong verify_token', async () => {
    vi.stubEnv('WHATSAPP_VERIFY_TOKEN', 'verify-me');
    const res = await fetch(`${base}${WEBHOOK_PATH}?hub.mode=subscribe&hub.verify_token=WRONG&hub.challenge=CHALLENGE_1`);
    expect(res.status).toBe(403);
  });

  it('GET challenge without a configured token is accepted (dry-run dev posture)', async () => {
    const res = await fetch(`${base}${WEBHOOK_PATH}?hub.mode=subscribe&hub.challenge=CHALLENGE_2`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('CHALLENGE_2');
  });

it('POST accepts only a body signed over the RAW bytes (valid HMAC → dispatch)', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    const body = payloadOf([textMsg('m1', 'ho gaya')]);
    const res = await fetch(`${base}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': SIGN(body) },
      body,
    });
    expect(res.status).toBe(200);
    expect(mocks.processCookReply).toHaveBeenCalledTimes(1);
    const arg = mocks.processCookReply.mock.calls[0]![0];
    expect(arg.fromPhone).toBe('+919876543210');
    expect(arg.text).toBe('ho gaya');
    expect(arg.intent).toBeUndefined(); // parser runs inside the orchestrator
  });

  it('POST with a forged/bad signature → 403 and nothing is dispatched', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    const body = JSON.stringify({ entry: [] });
    const res = await fetch(`${base}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256=deadbeef' },
      body,
    });
    expect(res.status).toBe(403);
    expect(mocks.processCookReply).not.toHaveBeenCalled();
  });

it('interactive button replies map to intents (done) before dispatch', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    const body = payloadOf([
      { id: 'm2', from: '+919876543210', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'done', title: '✅ Done' } } },
    ]);
    const res = await fetch(`${base}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': SIGN(body) },
      body,
    });
    expect(res.status).toBe(200);
    const arg = mocks.processCookReply.mock.calls[0]![0];
    expect(arg.intent).toBe('done');
    expect(arg.text).toBe('✅ Done');
  });

  it('unconfigured APP_SECRET still processes (dry-run dev), with a warning log', async () => {
    const body = payloadOf([textMsg('m3', 'good morning')]);
    const res = await fetch(`${base}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    expect(res.status).toBe(200);
    expect(mocks.processCookReply).toHaveBeenCalledTimes(1);
  });

  it('responds 200 even when message processing throws (Meta must not retry forever)', async () => {
    vi.stubEnv('WHATSAPP_APP_SECRET', SECRET);
    mocks.processCookReply.mockRejectedValueOnce(new Error('db down'));
    const body = payloadOf([textMsg('m4', 'done')]);
    const res = await fetch(`${base}${WEBHOOK_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': SIGN(body) },
      body,
    });
    expect(res.status).toBe(200);
  });
});
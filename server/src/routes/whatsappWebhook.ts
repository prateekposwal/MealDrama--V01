/**
 * WHATSAPP WEBHOOK — where Meta delivers the cook's replies.
 *
 *   GET  /api/v1/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…
 *        Meta's setup ping. Challenge returned only when verify_token matches.
 *
 *   POST /api/v1/webhook/whatsapp  (raw JSON body, X-Hub-Signature-256)
 *        Inbound cook messages → processCookReply. Responds 200 fast; every
 *        message is processed per-entry and failures are logged, because Meta
 *        retries ANY non-200 forever and we must stay idempotent.
 *
 * Signature policy: WHATSAPP_APP_SECRET set → strict HMAC-SHA256 over the RAW
 * body (mismatch = 403, never parsed). Secret unset → log + accept, which is
 * the Phase-1 dry-run posture (no sender can reach a localhost webhook until
 * creds exist anyway). The route NEVER runs the global express.json parser,
 * so the raw buffer survives for verification — mount express.raw for this
 * path AHEAD of the global parser in index.ts / the test harness.
 */
import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../lib/whatsapp';
import { processCookReply, classifyCookReply } from '../lib/cookReply';

const router = Router();

interface EntryMessage {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: { type?: string; button_reply?: { id?: string; title?: string } };
}

router.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && (expected ? token === expected : true)) {
    return res.status(200).send(String(challenge ?? ''));
  }
  if (!expected) {
    console.log('[WhatsApp][webhook] WHATSAPP_VERIFY_TOKEN unset — challenge accepted (dry-run dev posture)');
    return res.status(200).send(String(challenge ?? ''));
  }
  return res.status(403).send('Forbidden');
});

router.post('/webhook/whatsapp', async (req: Request, res: Response) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = req.headers['x-hub-signature-256'];

  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  if (appSecret && !verifyWebhookSignature(raw, signature as string | undefined, appSecret)) {
    console.error('[WhatsApp][webhook] HMAC mismatch — ignoring forged payload');
    return res.status(403).send('Forbidden');
  }
  if (!appSecret) {
    console.warn('[WhatsApp][webhook] WHATSAPP_APP_SECRET unset — accepting payload WITHOUT signature verify (dry-run dev posture)');
  }

  res.status(200).send('OK');

  try {
    const body = JSON.parse(raw.toString('utf8')) as any;
    const entries: any[] = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value ?? {};
        const messages: EntryMessage[] = Array.isArray(value?.messages) ? value.messages : [];
        for (const msg of messages) {
          if (!msg?.from) continue;
          let text = msg.text?.body ?? '';
          let intent;
          if (msg.type === 'interactive') {
            const id = msg.interactive?.button_reply?.id;
            text = msg.interactive?.button_reply?.title ?? '';
            intent = id === 'done' ? 'done' : id === 'shortage' ? 'shortage' : classifyCookReply(text);
          }
          try {
            await processCookReply({ fromPhone: msg.from, text, intent, messageId: msg.id ?? entry.id });
          } catch (err) {
            console.error('[WhatsApp][webhook] message processing failed:', err);
          }
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp][webhook] payload parse failure:', err);
  }
});

export default router;
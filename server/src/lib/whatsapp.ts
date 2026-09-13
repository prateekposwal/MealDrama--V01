/**
 * WHATSAPP BUSINESS CLOUD API — thin client for the cook's ONLY channel.
 *
 * The cook communicates exclusively through WhatsApp. This module is the
 * send-side surface: text (inside the 24h conversation window), template
 * (cold-start service/utility templates), and interactive quick-reply buttons
 * (the "everything done ✓" and "⚠️ shortage" surface).
 *
 * Env-gated with a dry-run sender:
 *   - No WHATSAPP_TOKEN / WHATSAPP_PHONE_ID → every send is LOGGED and returns
 *     { ok: true, dryRun: true }. Phase 1 ships fully testable with zero Meta
 *     credentials; Phase 2 flips the same code path by adding env values.
 *   - Configured → posts to the Graph API with bearer auth. Idempotency: the
 *     scheduler passes an `Idempotency-Key: <scope>:<YYYY-MM-DD>` header so a
 *     retry never double-sends a daily work order.
 *
 * The pure `build*` helpers are export-tested; `sendToGraph` is the only place
 * that touches the network (global fetch — node 18+).
 */
import crypto from 'crypto';

const GRAPH_BASE = process.env.WHATSAPP_GRAPH_BASE ?? 'https://graph.facebook.com';
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? 'v20.0';

export function graphEndpoint(): string {
  return `${GRAPH_BASE}/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_ID || ''}/messages`;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export function normalizeE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.length === 10) return `+91${digits}`; // Indian default
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

// ─── Pure payload builders (exported for tests) ─────────────────────────────

export interface MessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: { body: string; preview_url?: boolean };
  template?: {
    name: string;
    language: { code: string };
    components: Array<{ type: string; sub_type?: string; index?: number; parameters: Array<{ type: string; text?: string }> }>;
  };
  interactive?: {
    type: 'button';
    body: { text: string };
    action: { buttons: Array<{ type: 'reply'; reply: { id: string; title: string } }> };
  };
}

export function buildTextPayload(to: string, body: string, opts: { previewUrl?: boolean } = {}): MessagePayload {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body, preview_url: opts.previewUrl ?? false },
  };
}

/** A cold-start send MUST be an approved template. The whole work order rides
 *  as ONE body variable (layout decided at Meta approval time; the dry-run
 *  logs the fully-composed text so approval is copy-paste from real output). */
export function buildTemplatePayload(to: string, name: string, language: string, bodyText: string): MessagePayload {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name,
      language: { code: language },
      components: [{ type: 'body', parameters: [{ type: 'text', text: bodyText }] }],
    },
  };
}

export function buildInteractiveButtonsPayload(to: string, body: string, buttons: Array<{ id: string; title: string }>): MessagePayload {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: { buttons: buttons.map(b => ({ type: 'reply' as const, reply: { id: b.id, title: b.title } })) },
    },
  };
}

// ─── Network + dry-run delivery ──────────────────────────────────────────────

export interface WhatsAppSendOptions {
  /** Idempotency scope+day, e.g. "hh:abc:2026-09-16". NOT the message id. */
  idempotencyKey?: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  dryRun?: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}

async function sendToGraph(payload: MessagePayload, options: WhatsAppSendOptions): Promise<WhatsAppSendResult> {
  try {
    const res = await fetch(graphEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      return { ok: false, status: res.status, error: body?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: body?.messages?.[0]?.id, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'network error' };
  }
}

function dryRun(kind: string, to: string, bodyText: string | undefined, options: WhatsAppSendOptions): WhatsAppSendResult {
  const tag = options.idempotencyKey ? ` [idem:${options.idempotencyKey}]` : '';
  console.log(`[WhatsApp][dry-run] ${kind} → ${to}${tag}\n${bodyText ?? ''}`);
  return { ok: true, dryRun: true };
}

export async function sendText(to: string, body: string, options: WhatsAppSendOptions = {}): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) return dryRun('text', to, body, options);
  return sendToGraph(buildTextPayload(to, body), options);
}

export async function sendTemplate(
  to: string,
  name: string,
  language: string,
  bodyText: string,
  options: WhatsAppSendOptions = {},
): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) return dryRun('template:' + name, to, bodyText, options);
  return sendToGraph(buildTemplatePayload(to, name, language, bodyText), options);
}

export async function sendDoneButtons(to: string, body: string, options: WhatsAppSendOptions = {}): Promise<WhatsAppSendResult> {
  const payload = buildInteractiveButtonsPayload(to, body, [
    { id: 'done', title: '✅ Done' },
    { id: 'shortage', title: '⚠️ Short' },
  ]);
  if (!isWhatsAppConfigured()) return dryRun('buttons', to, body, options);
  return sendToGraph(payload, options);
}

/**
 * Full daily work-order send: prefer the template (cold-start-safe), fall back
 * to a plain text when the template isn't approved/configured yet. In dry-run
 * both paths log the identical composed message. `language` selects the
 * template language variant (hi | en).
 */
export async function sendWorkOrder(
  to: string,
  composed: string,
  options: WhatsAppSendOptions & { templateName?: string; language?: string } = {},
): Promise<WhatsAppSendResult> {
  const language = (options.language ?? 'hi').slice(0, 5) === 'hi' ? 'hi' : 'en';
  const templateName = options.templateName ?? 'cook_daily_plan';
  if (!isWhatsAppConfigured()) return dryRun('template:' + templateName, to, composed, options);
  const viaTemplate = await sendTemplate(to, templateName, language, composed, options);
  if (viaTemplate.ok) return viaTemplate;
  // Template not approved / failed → the 24h-window text path
  return sendText(to, composed, options);
}

/** Constant-time HMAC-SHA256 of the RAW request body, for X-Hub-Signature-256. */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined, appSecret: string): boolean {
  if (!signatureHeader || !appSecret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
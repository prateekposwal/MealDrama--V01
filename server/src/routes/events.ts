import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../lib/auth';

const router = Router();
router.use(authMiddleware);

// server root: server/src/routes → ../.. (also dist/routes in prod)
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const NAME_RE = /^[a-zA-Z0-9_]{1,64}$/;

function isValidEvent(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  return typeof o.name === 'string' && NAME_RE.test(o.name) && typeof o.ts === 'number';
}

// POST /api/v1/events — append server-side analytics events to a per-day log.
router.post('/', (req, res) => {
  try {
    const raw = (req.body ?? {}) as { events?: unknown };
    const events = Array.isArray(raw.events) ? raw.events.filter(isValidEvent) : [];
    if (events.length === 0) {
      return res.status(400).json({ success: false, error: 'valid events array required' });
    }
    const day = new Date().toISOString().slice(0, 10);
    const file = path.join(LOG_DIR, `events-${day}.log`);
    const line = JSON.stringify({ ts: new Date().toISOString(), events });
    fs.appendFileSync(file, line + '\n');
    res.json({ ok: true });
  } catch (err) {
    console.error('[EVENTS]', err);
    res.status(500).json({ success: false, error: 'internal error' });
  }
});

export default router;

/**
 * Test-only express harness for the diet route suite. Lives under server/src
 * so express + @prisma/client resolve from server/node_modules (the repo-root
 * vitest run has no express at root). Mounts ONLY the diet routers + the real
 * authMiddleware, JSON parsing and error handler — prisma stays mocked in the
 * test file. This is the smallest honest route harness that matches repo style.
 */
import express from 'express';
import type { Express } from 'express';
import { dietRouter, householdDietsRouter } from '../routes/diet';
import { APIError } from './apiError';

export function buildDietApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/diet', dietRouter);
  app.use('/api/v1/households', householdDietsRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the personalize-v2 routes (meal-log +
 * household-plans). Same contract as buildDietApp: REAL routes + real
 * authMiddleware + JSON parsing + error handler; prisma stays mocked in the
 * test file. The /api/v1 { success, data } wrapper is intentionally NOT
 * mounted (the diet harness doesn't mount it either) so tests read the raw
 * route responses.
 */
import mealLogRouter from '../routes/mealLog';
import householdPlansRouter from '../routes/householdPlans';

export function buildPersonalizationApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/meal-log', mealLogRouter);
  app.use('/api/v1/households', householdPlansRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the tray route suite (P2028 fix). Same
 * contract as buildDietApp: REAL routes + real authMiddleware + JSON parsing
 * + error handler; prisma stays mocked in the test file. The tray router
 * applies authMiddleware internally (router.use), so mounted routes demand a
 * Bearer token like production.
 */
import trayRouter from '../routes/tray';

export function buildTrayApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/tray', trayRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}


/**
 * Test-only express harness for the plan route suite (P2028 fix). Same
 * contract as buildTrayApp: REAL routes + real authMiddleware + JSON parsing
 * + error handler; prisma stays mocked in the test file. The plan router
 * applies authMiddleware internally (router.use), so mounted routes demand a
 * Bearer token like production.
 */
import planRouter from '../routes/plan';

export function buildPlanApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/plan', planRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the SHARED household-week routes
 * (sharedPlan.ts) — the family week, meal ownership, status flow, timezone.
 */
import sharedPlanRouter from '../routes/sharedPlan';

export function buildSharedPlanApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/households', sharedPlanRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the pantry routes (pantry.ts) — membership
 * gating on the shared ingredient resolver.
 */
import pantryRouter from '../routes/pantry';

export function buildPantryApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/households', pantryRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the expenses routes (expenses.ts) — the
 * active /activity + /meals handlers now carry the membership gate.
 */
import expensesRouter from '../routes/expenses';

export function buildExpensesApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/households', expensesRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the loop-config routes (loopConfig.ts) — now
 * authenticated + self-scoped + Prisma-persisted.
 */
import loopConfigRouter from '../routes/loopConfig';

export function buildLoopConfigApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/loop-config', loopConfigRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the auth routes (auth.ts) — the device-bound
 * register/login contract that replaced the property-login account takeover.
 */
import authRouter from '../routes/auth';

export function buildAuthApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/auth', authRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the cook-share routes (cookShare.ts) — the
 * household cook link + the PUBLIC no-login /cook/:token page.
 */
import cookShareRouter, { cookPageRouter } from '../routes/cookShare';

export function buildCookShareApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/households', cookShareRouter);
  app.use('/api/v1', cookPageRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

/**
 * Test-only express harness for the WhatsApp webhook (whatsappWebhook.ts).
 * Mirrors index.ts: an express.raw parser is mounted on the webhook path AHEAD
 * of everything, so the route receives the RAW body and can verify the
 * X-Hub-Signature-256 HMAC exactly as production does.
 */
import whatsappWebhookRouter from '../routes/whatsappWebhook';

export function buildWhatsAppWebhookApp(): Express {
  const app = express();
  app.use('/api/v1/webhook/whatsapp', express.raw({ type: 'application/json', limit: '1mb' }));
  app.use('/api/v1', whatsappWebhookRouter);
  return app;
}

/**
 * Test-only express harness for the household membership routes
 * (households.ts) — admin transfer (PATCH members/:memberId role) and member
 * removal (DELETE members/:memberId), plus the existing create/join/leave/
 * regenerate-code surface. Same contract as buildDietApp: real routes + real
 * authMiddleware + JSON parsing + error handler; prisma stays mocked.
 */
import householdsRouter from '../routes/households';

export function buildHouseholdsApp(): Express {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1/households', householdsRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[Harness] unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

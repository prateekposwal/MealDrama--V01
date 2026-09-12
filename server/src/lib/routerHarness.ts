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

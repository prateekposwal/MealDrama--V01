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

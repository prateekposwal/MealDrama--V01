/**
 * Test-only static-serving harness, mirroring server/src/index.ts's exact
 * mount order: express.static → [API routes] → SPA fallback guard → terminal
 * JSON 404. Lives under server/src so express resolves from server/node_modules
 * into the root vitest run (same pattern as lib/routerHarness.ts). Production
 * mounts the SAME guard (mountSpaFallback) plus its own express.static and 404
 * handler — the regression suite and the server share the guard code and can
 * never drift apart (contract documented in lib/spaFallback.ts).
 */
import express from 'express';
import type { Express } from 'express';
import { mountSpaFallback } from './spaFallback';

export function buildStaticApp(distPath: string): Express {
  const app = express();
  // Real files first — express.static answers existing assets with the correct
  // extension→MIME mapping; it only falls through for MISSING files.
  app.use(express.static(distPath));
  // SPA fallback guard — index.html ONLY for navigation-like GETs.
  mountSpaFallback(app, distPath);
  // Terminal JSON 404 — mirrors server/src/index.ts's final app.use handler.
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });
  return app;
}

/**
 * SPA fallback contract — shared by production (server/src/index.ts) and the
 * asset-MIME regression suite (tests/staticServing.test.ts), so the guard can
 * never drift from what the server mounts.
 *
 * WHY THIS EXISTS (the recurring incident class):
 *   Serving index.html (200 + text/html) for a .js URL makes the browser fail
 *   module loading with "'text/html' is not a valid JavaScript MIME type" —
 *   the SPA appears broken on nav ("Something went wrong"). The same class
 *   previously regressed via the SPA catch-all answering missing-asset GETs
 *   with index.html. This module makes that structurally impossible:
 *
 *   CONTRACT (asserted by tests/staticServing.test.ts):
 *     1. The SPA fallback (index.html) applies ONLY to navigation-like GETs:
 *        paths whose final segment has NO file extension and that are NOT
 *        under /assets/.
 *     2. Every file-like URL (any extension in the final segment, trailing
 *        slash tolerated) is a MISSING ASSET: it falls through to the JSON 404
 *        handler — never index.html.
 *     3. /assets/* is never navigation — a missing asset under /assets/ is a
 *        JSON 404 unconditionally.
 *     4. /api/* keeps its JSON 404 (never the SPA fallback, never HTML).
 *
 *   Must be mounted AFTER the API routes (so it cannot shadow them) and
 *   BEFORE the terminal JSON 404 handler (which owns missing-asset responses).
 */
import path from 'path';
import express, { Express, Request, Response, NextFunction } from 'express';

export function mountSpaFallback(app: Express, distPath: string): void {
  // Express 5 wildcard: every GET the static layer and API routes missed.
  app.get('/{*splat}', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // File-like test — exhaustive where the old regex (/\.[a-zA-Z0-9]+$/) was
    // not: path.extname() catches ANY final-segment extension, and stripping a
    // trailing slash first closes the `/assets/x.js/` hole the regex missed.
    const tail = req.path.replace(/\/+$/, '');
    const missingAsset =
      path.extname(tail) !== '' || req.path.startsWith('/assets/');

    if (missingAsset) {
      return next(); // → terminal JSON 404 handler (never index.html)
    }

    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

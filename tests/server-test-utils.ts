import express from 'express';
import type { AddressInfo } from 'net';

/**
 * Shared vitest helpers for server route suites (server/src). Mirrors the
 * real error envelope from server/src/index.ts so route error assertions hold
 * against the true shape.
 */
export const mirrorErrorHandler = (): express.ErrorRequestHandler =>
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err?.statusCode ?? err?.status ?? 500).json({
      success: false,
      error: {
        code: err?.code || 'INTERNAL_SERVER_ERROR',
        message: err?.message || 'An unexpected error occurred',
      },
    });
  };

type Mount = [path: string, ...handlers: express.RequestHandler[]];

export function makeApp(routers: Mount[]): express.Express {
  const app = express();
  app.use(express.json());
  for (const [path, ...handlers] of routers) app.use(path, ...handlers);
  app.use(mirrorErrorHandler());
  return app;
}

export async function listen(
  app: express.Express,
): Promise<{ server: ReturnType<express.Express['listen']>; base: string }> {
  const server = app.listen(0);
  await new Promise<void>(r => server.once('listening', () => r()));
  const port = (server.address() as AddressInfo).port;
  return { server, base: `http://127.0.0.1:${port}` };
}
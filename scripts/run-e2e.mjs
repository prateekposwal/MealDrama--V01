// E2E runner: the API server (server/src/index.ts) serves BOTH the API and the
// built SPA (express.static dist + spaFallback), so the suite runs against a
// same-origin app on :3001 — the one topology the app's service worker works
// in. A separate vite preview on :5176 broke every API call with a 503: the SW
// intercepts `/api/*` by pathname (public/sw.js) and its cross-origin
// `fetch(request)` rejects, which blocked guest registration → the onboarding
// tray seed → empty-plan flakes across the e2e specs.
import { spawn } from 'node:child_process';

const APP_ORIGIN = process.env.E2E_BASE_URL || 'http://localhost:3001';

async function waitForApp() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${APP_ORIGIN}/`, { signal: AbortSignal.timeout(1500) });
      if (r.status >= 200 && r.status < 500) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(
    `app on ${APP_ORIGIN} never became reachable — start the API first (\`npm run server\`)`
  );
}

try {
  await waitForApp();
  console.log(`[e2e] app served on ${APP_ORIGIN}`);

  const vitest = spawn('npx', ['vitest', 'run', '--config', 'vitest.e2e.config.ts'], {
    stdio: 'inherit',
  });

  vitest.on('exit', code => {
    process.exit(code ?? 1);
  });
} catch (err) {
  console.error('[e2e] failed to start: ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}

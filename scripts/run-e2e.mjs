// E2E runner: serves the built app on :5176, runs the Playwright-driven suite,
// then tears the static server down. The API server (:3001) is expected to be
// running already (`npm run server`) — specs fail with a clear message if not.
import { spawn } from 'node:child_process';

const PREVIEW_PORT = process.env.E2E_PORT || '5176';
const preview = spawn('npx', ['vite', 'preview', '--port', PREVIEW_PORT, '--host', '127.0.0.1'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: undefined },
});

const timeout = setTimeout(() => {
  console.error('E2E runner timed out waiting for vite preview to serve');
  preview.kill('SIGTERM');
  process.exit(1);
}, 60_000);

async function waitForPreview() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (r.status >= 200 && r.status < 500) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`vite preview on :${PREVIEW_PORT} never became reachable`);
}

let previewErr = '';
preview.stderr.on('data', d => { previewErr += String(d); });

try {
  await waitForPreview();
  console.log(`[e2e] app served on http://localhost:${PREVIEW_PORT}`);
  clearTimeout(timeout);

  const vitest = spawn('npx', ['vitest', 'run', '--config', 'vitest.e2e.config.ts'], {
    stdio: 'inherit',
  });

  vitest.on('exit', code => {
    preview.kill('SIGTERM');
    process.exit(code ?? 1);
  });
} catch (err) {
  clearTimeout(timeout);
  console.error('[e2e] failed to start: ' + (err instanceof Error ? err.message : String(err)));
  if (previewErr) console.error('[e2e] preview stderr: ' + previewErr.slice(0, 800));
  preview.kill('SIGTERM');
  process.exit(1);
}
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { buildStaticApp } from '../server/src/lib/staticHarness';

/**
 * Asset-MIME regression suite — locks the recurring incident class:
 * "'text/html' is not a valid JavaScript MIME type" (a .js request answered
 * with the SPA's index.html fallback). Contract (see
 * server/src/lib/spaFallback.ts): index.html may ONLY be served for
 * navigation-like GETs; every file-like URL and every /assets/* path is a
 * missing asset and must be a JSON 404 — never text/html.
 *
 * Three layers:
 *   1. fixture dist   — ALWAYS runs (CI has no build step): exercises the real
 *                       production guard code (mountSpaFallback) through HTTP.
 *   2. real dist      — runs when `npm run build` produced dist/: sweeps the
 *                       FULL asset manifest (index.html refs + BFS closure of
 *                       every lazy chunk map) for correct MIME.
 *   3. sw source      — the service worker is the OTHER text/html-for-js
 *                       vector (its old fetch handler fell back to
 *                       caches.match('/index.html') for script requests);
 *                       asserts the shipped sw.js can no longer do that.
 */

const REAL_DIST = path.join(__dirname, '..', 'dist');
const REAL_DIST_BUILT = fs.existsSync(path.join(REAL_DIST, 'index.html'));
if (!REAL_DIST_BUILT) {
  console.warn('[staticServing] dist/ not built (CI test job runs before build) — real-manifest layer SKIPPED; fixture guard layer still runs. Locally: npm run build && npm test');
}

// ─── layer 1: throwaway fixture dist ────────────────────────────────────────
const fixtureDist = fs.mkdtempSync(path.join(os.tmpdir(), 'md-static-'));

beforeAll(() => {
  fs.mkdirSync(path.join(fixtureDist, 'assets'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureDist, 'index.html'),
    '<!DOCTYPE html><html><head>'
      + '<script type="module" crossorigin src="/assets/app-a1b2c3.js"></script>'
      + '<link rel="stylesheet" crossorigin href="/assets/style-x9y8.css">'
      + '</head><body><div id="root">fixture-spa</div></body></html>'
  );
  fs.writeFileSync(path.join(fixtureDist, 'assets', 'app-a1b2c3.js'), "console.log('fixture');\n");
  fs.writeFileSync(path.join(fixtureDist, 'assets', 'style-x9y8.css'), 'body {}\n');
  fs.writeFileSync(path.join(fixtureDist, 'manifest.json'), '{}\n');
  fs.writeFileSync(path.join(fixtureDist, 'sw.js'), '// fixture sw\n');
});

const fixtureApp = buildStaticApp(fixtureDist);
let fixtureServer: Server;
let fixtureBase = '';

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    fixtureServer = fixtureApp.listen(0, '127.0.0.1', () => {
      fixtureBase = `http://127.0.0.1:${(fixtureServer.address() as AddressInfo).port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => fixtureServer.close(() => resolve()));
  fs.rmSync(fixtureDist, { recursive: true, force: true });
});

describe('SPA fallback guard (production code path, fixture dist)', () => {
  it('root and extensionless navigation GETs get the SPA index.html (text/html)', async () => {
    for (const p of ['/', '/dashboard', '/plan', '/some/deep/route', '/login?next=%2Fplan']) {
      const res = await fetch(`${fixtureBase}${p}`);
      const ct = res.headers.get('content-type') || '';
      expect(res.status, `GET ${p}`).toBe(200);
      expect(ct, `GET ${p} content-type`).toMatch(/text\/html/);
      expect(await res.text(), `GET ${p} body`).toContain('fixture-spa');
    }
  });

  it('existing /assets/*.js and *.css are served with their real MIME — never text/html', async () => {
    const js = await fetch(`${fixtureBase}/assets/app-a1b2c3.js`);
    expect(js.status).toBe(200);
    expect(js.headers.get('content-type')).toMatch(/javascript/);
    expect(js.headers.get('content-type')).not.toMatch(/text\/html/);
    expect(await js.text()).toContain("console.log('fixture')");

    const css = await fetch(`${fixtureBase}/assets/style-x9y8.css`);
    expect(css.status).toBe(200);
    expect(css.headers.get('content-type')).toMatch(/text\/css/);
    expect(css.headers.get('content-type')).not.toMatch(/text\/html/);
  });

  it('existing root-level files keep real MIME', async () => {
    const m = await fetch(`${fixtureBase}/manifest.json`);
    expect(m.status).toBe(200);
    expect(m.headers.get('content-type')).toMatch(/application\/json/);

    const sw = await fetch(`${fixtureBase}/sw.js`);
    expect(sw.status).toBe(200);
    expect(sw.headers.get('content-type')).toMatch(/javascript/);
  });

  it('a MISSING /assets/*.js is a JSON 404 — never text/html', async () => {
    const res = await fetch(`${fixtureBase}/assets/definitely-missing-zz9.js`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect((await res.text()).startsWith('{')).toBe(true);
  });

  it('a missing asset with TRAILING SLASH is a JSON 404 — never the SPA fallback', async () => {
    // Regression: the old guard regex /\.[a-zA-Z0-9]+$/ missed '/assets/x.js/'
    // and answered it with index.html (200 + text/html) → MIME error in browser.
    const res = await fetch(`${fixtureBase}/assets/definitely-missing-zz9.js/`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    expect((await res.text()).startsWith('{')).toBe(true);
  });

  it('any file-like missing URL (any extension) is a JSON 404 — never HTML', async () => {
    for (const p of ['/missing.png', '/missing.tar.gz', '/missing.icon?x=1', '/assets/', '/assets/whatever.js?v=7']) {
      const res = await fetch(`${fixtureBase}${p}`);
      expect(res.status, `GET ${p}`).toBe(404);
      expect(res.headers.get('content-type'), `GET ${p} content-type`).toMatch(/application\/json/);
    }
  });

  it('/api/* GETs are JSON 404 — never the SPA fallback', async () => {
    const res = await fetch(`${fixtureBase}/api/v1/does-not-exist`);
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});

// ─── layer 2: real built dist manifest sweep ────────────────────────────────
const realApp = buildStaticApp(REAL_DIST);
let realServer: Server;
let realBase = '';

describe.skipIf(!REAL_DIST_BUILT)('real build asset manifest (run npm run build first)', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      realServer = realApp.listen(0, '127.0.0.1', () => {
        realBase = `http://127.0.0.1:${(realServer.address() as AddressInfo).port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => realServer.close(() => resolve()));
  });

  /** Extract module-reachable chunk paths from a JS bundle's text. */
  function chunkRefs(js: string): string[] {
    const refs = new Set<string>();
    // vite mapDeps entries: "assets/Name-hash.js"
    for (const m of js.matchAll(/assets\/[A-Za-z0-9_.-]+\.js/g)) refs.add(`/${m[0]}`);
    // relative static imports: from"./Name-hash.js" (chunk-relative → /assets/)
    for (const m of js.matchAll(/from"\.\/([A-Za-z0-9_.-]+\.js)"/g)) refs.add(`/assets/${m[1]}`);
    return [...refs];
  }

  it('every asset referenced by dist/index.html is served with its real MIME', async () => {
    const html = await (await fetch(`${realBase}/`)).text();
    expect(html).toContain('<div id="root">');

    const refs = [...new Set(
      [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
        .map((m) => m[1])
        .filter((x): x is string => !!x)
    )];
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const res = await fetch(`${realBase}${ref}`);
      const ct = res.headers.get('content-type') || '';
      expect(res.status, `GET ${ref}`).toBe(200);
      expect(ct, `GET ${ref}`).not.toMatch(/text\/html/);
      if (ref.endsWith('.js')) expect(ct, `GET ${ref}`).toMatch(/javascript/);
      if (ref.endsWith('.css')) expect(ct, `GET ${ref}`).toMatch(/text\/css/);
    }
  });

  it('BFS closure: every lazy route chunk reachable from the entry bundle is javascript — never text/html', async () => {
    const html = await (await fetch(`${realBase}/`)).text();
    const entry = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
    expect(entry, 'entry bundle src').toBeTruthy();

    const seen = new Set<string>();
    const queue = [entry as string];
    while (queue.length > 0) {
      const p = queue.shift() as string;
      if (seen.has(p)) continue;
      seen.add(p);

      const res = await fetch(`${realBase}${p}`);
      const ct = res.headers.get('content-type') || '';
      expect(res.status, `GET ${p}`).toBe(200);
      expect(ct, `GET ${p}`).toMatch(/javascript/);
      expect(ct, `GET ${p}`).not.toMatch(/text\/html/);

      for (const next of chunkRefs(await res.text())) {
        if (!seen.has(next)) queue.push(next);
      }
    }
    // Entry + vendor + icons + dishes + ~20 route chunks — a sane floor that
    // fails loudly if chunk extraction ever silently matches nothing.
    expect(seen.size).toBeGreaterThan(10);
  });

  it('missing-asset 404s on the real build: plain and trailing-slash variants', async () => {
    for (const p of ['/assets/nope-does-not-exist.js', '/assets/nope-does-not-exist.js/']) {
      const res = await fetch(`${realBase}${p}`);
      expect(res.status, `GET ${p}`).toBe(404);
      expect(res.headers.get('content-type'), `GET ${p}`).toMatch(/application\/json/);
      expect((await res.text()).startsWith('{'), `GET ${p} body`).toBe(true);
    }
  });

  it('root + index.html stay text/html; sw.js + manifest.json keep real MIME', async () => {
    for (const p of ['/', '/index.html']) {
      const res = await fetch(`${realBase}${p}`);
      expect(res.status, `GET ${p}`).toBe(200);
      expect(res.headers.get('content-type'), `GET ${p}`).toMatch(/text\/html/);
    }
    const sw = await fetch(`${realBase}/sw.js`);
    expect(sw.status).toBe(200);
    expect(sw.headers.get('content-type')).toMatch(/javascript/);
    const m = await fetch(`${realBase}/manifest.json`);
    expect(m.status).toBe(200);
    expect(m.headers.get('content-type')).toMatch(/application\/json/);
  });
});

// ─── layer 3: service worker source contract ────────────────────────────────
describe('service worker must never answer a non-document request with index.html (public/sw.js)', () => {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  const sw = fs.readFileSync(swPath, 'utf8');

  it('has an explicit script-destination branch that gates caching on javascript MIME', () => {
    expect(sw).toContain("request.destination === 'script'");
    expect(sw).toContain("ct.includes('javascript')");
  });

  it('only the document/navigate branch may reference the index.html fallback', () => {
    const nav = sw.indexOf("request.mode === 'navigate'");
    const fb = sw.indexOf("caches.match('/index.html')");
    expect(nav).toBeGreaterThan(-1);
    expect(fb).toBeGreaterThan(nav); // fallback exists, but ONLY after the document branch
  });

  it('cache version was bumped off v2 so poisoned entries are purged on activate (v4 since 2026-09-14)', () => {
    expect(sw).not.toContain("CACHE_VERSION = 'v2'");
    expect(sw).not.toContain("CACHE_VERSION = 'v3'");
    expect(sw).toMatch(/CACHE_VERSION = 'v4'/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROD-BUNDLE HYGIENE PINS — served-bytes proof that DEV-only debug logging
// and forbidden baked literals never reach the shipped chunk.
//
// Follow-up to the api-503 cleanup (40e191f): the SAME-origin API base made
// '/api/v1' the default, but three prod debug strings + one hardcoded
// localhost literal still shipped:
//   • '[App] Rendering'            — App.tsx per-render log (now DEV-gated)
//   • '[Storage] getItem/setItem'  — nativeStorage debug adapter (now DEV-gated)
//   • 'http://localhost:3001/api/v1/events' — utils/analytics.ts flush-target
//     catch fallback (now derived from the shared lib/api resolver)
//
// TWO layers (staticServing.test.ts honesty contract):
//   1. SOURCE layer — ALWAYS runs: the guards exist and are
//      import.meta.env.DEV-conditioned (tree-shaken, NOT deleted).
//   2. BUNDLE layer — runs only when dist/ exists (CI test job may run before
//      the build step; locally: npm run build && npm test). Sweeps every
//      served asset and asserts the strings are absent + the /events endpoint
//      still resolves via the shared base.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.join(__dirname, '..', 'dist');
const DIST_BUILT = existsSync(path.join(DIST, 'index.html'));
if (!DIST_BUILT) {
  console.warn('[prodBundlePins] dist/ not built (CI test job runs before build) — bundle layer SKIPPED; source layer still runs. Locally: npm run build && npm test');
}

function readSource(rel: string): string {
  return readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
}

/** Concatenated text of EVERY served asset (index.html + all built JS chunks). */
function bundleText(): string {
  const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const assetsDir = path.join(DIST, 'assets');
  const chunks = existsSync(assetsDir)
    ? readdirSync(assetsDir).filter(f => f.endsWith('.js')).map(f => readFileSync(path.join(assetsDir, f), 'utf8'))
    : [];
  return [html, ...chunks].join('\n');
}

const count = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

// ─── layer 1: source guards are DEV-conditioned, NOT deleted ────────────────
describe('DEV-only logs — source layer (guards are import.meta.env.DEV-conditioned, tree-shaken, not deleted)', () => {
  it('App.tsx "[App] Rendering" log sits inside an import.meta.env.DEV guard', () => {
    const app = readSource('App.tsx');
    expect(app).toContain("if (import.meta.env.DEV) console.log('[App] Rendering, isLoggedIn:'");
  });

  it('nativeStorage "[Storage] getItem/setItem/removeItem" logs are all DEV-gated', () => {
    const ns = readSource('app/utils/nativeStorage.ts');
    expect(ns).toContain("if (import.meta.env.DEV) console.warn(`[Storage] getItem(\"${key}\") -> Invalid format, clearing`)");
    expect(ns).toContain("if (import.meta.env.DEV) console.log(`[Storage] getItem(\"${key}\") -> Found");
    expect(ns).toContain("if (import.meta.env.DEV) console.error(`[Storage] getItem(\"${key}\") failed, clearing:`");
    expect(ns).toContain("if (import.meta.env.DEV) console.log(`[Storage] setItem(\"${key}\") -> Success");
    expect(ns).toContain("if (import.meta.env.DEV) console.error('[Storage] setItem failed:'");
    expect(ns).toContain("if (import.meta.env.DEV) console.log(`[Storage] removeItem(\"${key}\") -> Success`)");
    expect(ns).toContain("if (import.meta.env.DEV) console.error('[Storage] removeItem failed:'");
  });

  it('analytics.ts builds the events URL ONLY from the shared lib/api resolver — no hardcoded host survives', () => {
    const an = readSource('utils/analytics.ts');
    expect(an).not.toContain('localhost');
    expect(an).not.toContain('3001');
    expect(an).toContain(`getApiBase().replace(/\\/+$/, '')}/events`);
    // ONE source of truth: the catch fallback reuses defaultApiBase() from lib/api
    expect(an).toContain(`defaultApiBase().replace(/\\/+$/, '')}/events`);
  });
});

// ─── layer 2: served prod bundle carries ZERO of the forbidden strings ───────
describe.skipIf(!DIST_BUILT)('prod bundle pins (run npm run build first)', () => {
  const bundle = bundleText();

  it('build produced JS chunks to sweep (positive control — the sweep is not vacuous)', () => {
    // entry + vendor + manual chunks + lazy routes; staticServing asserts >10 reachable
    const chunkCount = count(bundle, '.js');
    expect(chunkCount).toBeGreaterThan(10);
  });

  it('analytics module is LIVE in the bundle (md-events key present) — the absence pins are not vacuous', () => {
    expect(bundle).toContain('md-events');
  });

  it('ungated app error logs are NOT DEV-gated wholesale ([Store] Hydration failed stays)', () => {
    expect(bundle).toContain('[Store] Hydration failed, clearing corrupted storage');
  });

  it('[App] Rendering debug log is tree-shaken — 0 occurrences', () => {
    expect(count(bundle, '[App] Rendering')).toBe(0);
  });

  it('[Storage] getItem/setItem/removeItem debug logs are tree-shaken — 0 occurrences each', () => {
    expect(count(bundle, '[Storage] getItem')).toBe(0);
    expect(count(bundle, '[Storage] setItem')).toBe(0);
    expect(count(bundle, '[Storage] removeItem')).toBe(0);
  });

  it('no absolute host is baked anywhere: localhost:3001 → 0, mealdrama.onrender.com/api/v1 → 0', () => {
    expect(count(bundle, 'http://localhost:3001')).toBe(0);
    expect(count(bundle, 'localhost:3001')).toBe(0);
    expect(count(bundle, 'mealdrama.onrender.com/api/v1')).toBe(0);
  });

  it('the /events endpoint is still constructed from the SAME-ORIGIN default base (/api/v1 + /events)', () => {
    // flushTarget = `${getApiBase()-or-defaultApiBase()}/events`; the minifier
    // keeps the literal /events suffix and the same-origin '/api/v1' default
    expect(count(bundle, '/events')).toBeGreaterThanOrEqual(1);
    expect(bundle).toContain('/api/v1');
  });
});

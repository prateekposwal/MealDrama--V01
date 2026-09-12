// ─────────────────────────────────────────────────────────────────────────────
// DATA INTEGRITY — dead curated ids must NEVER enter production (rule 4).
//
// Two guards, both real:
//   1. Vitest (structural): imports the ACTUAL modules and asserts every
//      DISH_CALORIES key resolves to a live dish in DISH_LIBRARY. Zero dead
//      ids today; any future dead key fails here.
//   2. The npm script (CI/build tripwire): scripts/validateDataIntegrity.mjs
//      — `npm test` runs it before vitest, `npm run build` runs it via
//      prebuild. Its FAILURE path is proven below with a fixture (a map with
//      a dead key must exit 1 and name the key).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { DISH_CALORIES } from '../meal/constants/dishCalories';
import { findDeadCalorieIds } from '../scripts/validateDataIntegrity.mjs';

const REPO_ROOT = resolve(__dirname, '..');

describe('DISH_CALORIES ↔ dish-library integrity', () => {
  it('zero dead ids: every DISH_CALORIES key resolves to a live dish (the guard)', () => {
    const live = new Set(DISH_LIBRARY.map(d => d.id));
    const dead = findDeadCalorieIds(DISH_CALORIES, live);
    expect(dead).toEqual([]);
    expect(Object.keys(DISH_CALORIES).length).toBeGreaterThan(0);
    // Sanity on the live set itself (the guard is only meaningful with data).
    expect(live.size).toBeGreaterThan(600);
  });

  it('the 54 historically-dead ids are NOT in the map (removed + documented)', () => {
    for (const id of ['dal-tadka', 'masala-dosa', 'veg-biryani', 'poha', 'kheer']) {
      expect(Object.keys(DISH_CALORIES)).not.toContain(id);
    }
  });
});

describe('scripts/validateDataIntegrity.mjs — the CI/build tripwire', () => {
  let dir: string;
  beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'md-data-integrity-')); });
  afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

  const run = (mapJson: unknown, idsJson: unknown): { status: number | null; output: string } => {
    const mapPath = join(dir, 'map.json');
    const idsPath = join(dir, 'ids.json');
    writeFileSync(mapPath, JSON.stringify(mapJson));
    writeFileSync(idsPath, JSON.stringify(idsJson));
    try {
      const out = execFileSync('node', [join(REPO_ROOT, 'scripts/validateDataIntegrity.mjs'), '--from', mapPath, idsPath], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { status: 0, output: out };
    } catch (e: any) {
      return { status: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  };

  it('passes on a clean fixture (exit 0)', () => {
    const r = run({ idli: 120, rasam: 100 }, ['idli', 'rasam']);
    expect(r.status).toBe(0);
    expect(r.output).toContain('OK');
  });

  it('FAILS on a dead id — exit 1 and names the key (the failure path is real)', () => {
    const r = run({ idli: 120, 'ghost-dish': 100 }, ['idli']);
    expect(r.status).toBe(1);
    expect(r.output).toContain('ghost-dish');
    expect(r.output).toContain('FAIL');
  });
});

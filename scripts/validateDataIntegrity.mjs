#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// DATA-INTEGRITY GUARD — dead curated ids must NEVER enter production.
//
//   node scripts/validateDataIntegrity.mjs
//     → reads meal/constants/dishCalories.ts + dishLibrary.ts, asserts every
//       DISH_CALORIES key resolves to a live dish id. Exit 0 = clean; exit 1
//       = dead id(s) found, listed (the build/CI path fails).
//
//   node scripts/validateDataIntegrity.mjs --from <mapJson> <idsJson>
//     → fixture mode (used by tests/dataIntegrity.test.ts to prove the
//       FAILURE path): reads { "dead-dish": 100 } + ["live-dish"] and fails.
//
// Note on extraction: dish ids are pulled from every `id: '…'` literal in
// dishLibrary.ts (dish ids AND variant ids). Over-collection is SAFE for the
// dead-id check (a dead DISH_CALORIES key that matches nothing fails); the
// authoritative structural guard is tests/dataIntegrity.test.ts (vitest,
// imports the real modules). Both ship; both must pass.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Pure detector — shared by the script and the vitest guard. */
export function findDeadCalorieIds(calories, liveIds) {
  const live = new Set(liveIds);
  return Object.keys(calories).filter(id => !live.has(id));
}

/** Extract the DISH_CALORIES keys from the canonical TS declaration. */
function extractCalorieKeys(source) {
  const block = source.slice(source.indexOf('DISH_CALORIES'), source.indexOf('};', source.indexOf('DISH_CALORIES')));
  return [...block.matchAll(/^\s*'([^']+)':\s*\d+,/gm)].map(m => m[1]);
}

/** Extract dish ids (incl. variant ids — over-collection is safe, see header). */
function extractLibraryIds(source) {
  return [...source.matchAll(/\bid:\s*'([^']+)'/g)].map(m => m[1]);
}

function fail(dead) {
  console.error(`[data-integrity] FAIL — ${dead.length} DISH_CALORIES key(s) have no dish in the library:`);
  for (const id of [...dead].sort()) console.error(`  - ${id}`);
  console.error('Fix: remove the dead entries from meal/constants/dishCalories.ts; see docs/DATA_CLEANUP.md (the deprecation ledger).');
  return 1;
}

function main(argv) {
  const args = [...argv];

  if (args[0] === '--from') {
    if (args.length < 3) {
      console.error('[data-integrity] --from requires <mapJson> <idsJson>');
      return 2;
    }
    const calories = JSON.parse(readFileSync(args[1], 'utf8'));
    const ids = JSON.parse(readFileSync(args[2], 'utf8'));
    const dead = findDeadCalorieIds(calories, ids);
    if (dead.length > 0) return fail(dead);
    console.log('[data-integrity] OK (fixture) — every key resolves to a live id.');
    return 0;
  }

  const base = new URL('../meal/constants/', import.meta.url);
  const caloriesSrcPath = new URL('dishCalories.ts', base);
  const librarySrcPath = new URL('dishLibrary.ts', base);
  if (!existsSync(caloriesSrcPath) || !existsSync(librarySrcPath)) {
    console.error('[data-integrity] sources not found — run from the repo root.');
    return 1;
  }
  const calories = Object.fromEntries(extractCalorieKeys(readFileSync(caloriesSrcPath, 'utf8')).map(k => [k, 1]));
  const liveIds = extractLibraryIds(readFileSync(librarySrcPath, 'utf8'));

  const dead = findDeadCalorieIds(calories, liveIds);
  if (dead.length > 0) return fail(dead);

  const total = Object.keys(calories).length;
  console.log(`[data-integrity] OK — all ${total} DISH_CALORIES keys resolve to a live dish (${new Set(liveIds).size} library ids).`);
  return 0;
}

// Executable entry ONLY when run directly (`node scripts/validateDataIntegrity.mjs`).
// Importing the module (vitest) must NOT run main.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}

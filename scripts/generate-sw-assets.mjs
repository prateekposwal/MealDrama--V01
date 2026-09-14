// Generate dist/sw-assets.json — the list of every built JS chunk, consumed by
// public/sw.js at install time so lazy route chunks (PlanScreen, TrayScreen,
// …) are PRECACHED. Without this, an offline tab-switch re-fetches a chunk the
// user never opened online and hits the error boundary ("Failed to fetch
// dynamically imported module").
// Runs post-build (package.json "build"). Safe on a missing/empty dist: writes [].

import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distAssets = resolve('dist/assets');
const out = resolve('dist/sw-assets.json');

let list = [];
if (existsSync(distAssets)) {
  list = readdirSync(distAssets)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(f => `/assets/${f}`);
}

writeFileSync(out, `${JSON.stringify(list)}\n`);
console.log(`[generate-sw-assets] precache ${list.length} chunks -> ${out}`);
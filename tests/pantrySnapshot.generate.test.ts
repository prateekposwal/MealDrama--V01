// ─────────────────────────────────────────────────────────────────────────────
// PANTRY SNAPSHOT — server-owned ingredient catalog.
//
// These tests keep server/src/data/pantrySnapshot.ts honest:
//   1. PARITY / DRIFT GUARD — regenerate the snapshot from the CURRENT client
//      engine and deep-compare against the committed file. If the catalog or
//      getIngredientsForMealOption/CATEGORY_INGREDIENTS evolve and someone
//      forgets the regenerate step, the pantry resolver (compiled dist) serves
//      STALE ingredient data and this test fails. No-op every run otherwise.
//   2. WRITE MODE — WRITE_PANTRY_SNAPSHOT=1 rewrites the committed file:
//        WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';

import { PANTRY_SNAPSHOT } from '../server/src/data/pantrySnapshot';
import { buildPantrySnapshot, writePantrySnapshot } from '../scripts/genPantrySnapshot';

describe('pantry snapshot — server-owned ingredient catalog', () => {
  it('committed snapshot is fresh vs the client engine (drift guard)', () => {
    const fresh = buildPantrySnapshot();
    // generatedAt is informational only — normalize it so an untouched file
    // never fails the guard just because the calendar rolled over.
    expect({ ...fresh, generatedAt: '' }).toEqual({ ...PANTRY_SNAPSHOT, generatedAt: '' });
  });

  it.skipIf(!process.env.WRITE_PANTRY_SNAPSHOT)(
    'WRITE mode: regenerate server/src/data/pantrySnapshot.ts',
    () => {
      const written = writePantrySnapshot();
      expect(written).toContain('pantrySnapshot.ts');
    },
  );
});
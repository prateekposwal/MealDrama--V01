// ─────────────────────────────────────────────────────────────────────────────
// SEED CATALOG COVERAGE — the FK-parent invariant (Λ6.1 one canonical source).
//
// The dev DB `Meal` table is the FK parent for `TrayItem.mealId`. The CLIENT
// posts dish ids from DISH_LIBRARY (679 live dishes) during first-load tray
// seeding, suggestions, and add-to-tray. If a posted id has no Meal row, the
// write dies on `TrayItem_mealId_fkey` — the exact 500 that this guard
// prevents. The seed (server/prisma/seed.ts) converges the Meal table onto
// `catalogMealIds()` = CURATED_DISHES ∪ DISH_LIBRARY, so the invariant to
// hold FOREVER is:
//     every DISH_LIBRARY id ∈ the seed catalog
// plus the upsert-safety invariants (globally-unique variant ids, no
// cross-parent variant wiring) that keep the seed deterministic and crash-free.
// Pure module test — imports no prisma, executes no DB writes.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { CURATED_DISHES, catalogMealIds, libraryMealIds, DISH_LIBRARY } from '../server/prisma/catalog';

describe('seed catalog ↔ client dish library (FK-parent invariant)', () => {
  it('EVERY DISH_LIBRARY id is covered by the seed catalog (the 500-guard)', () => {
    const catalog = catalogMealIds();
    const lib = libraryMealIds();
    const uncovered = [...lib].filter((id) => !catalog.has(id));
    expect(uncovered).toEqual([]);
    // sanity: the guard is meaningful only with a real catalog
    expect(lib.size).toBeGreaterThan(600);
    expect(catalog.size).toBeGreaterThanOrEqual(lib.size);
  });

  it('curated catalog is a deliberate superset — the legacy curated-only ids remain', () => {
    const ids = new Set(CURATED_DISHES.map((d) => d.id));
    for (const legacy of ['bedmi-puri', 'butter-chicken', 'chole-bhature', 'dal-makhani', 'goan-fish-curry', 'soya-chunks-masala', 'soybean-matar', 'tofu-tikka-masala']) {
      expect(ids.has(legacy)).toBe(true);
    }
  });

  it('library variant ids are globally unique (upsert on MealVariant.id cannot P2002)', () => {
    const seen = new Map<string, string[]>();
    for (const d of DISH_LIBRARY as any[]) {
      for (const v of d.variants ?? []) {
        if (!v?.id) continue;
        const owners = seen.get(v.id) ?? [];
        owners.push(d.id);
        seen.set(v.id, owners);
      }
    }
    const dups = [...seen.entries()].filter(([, owners]) => owners.length > 1);
    expect(dups).toEqual([]);
  });

  it('no curated variant id is wired to a DIFFERENT library parent (deterministic seed)', () => {
    const libParent = new Map<string, string>();
    for (const d of DISH_LIBRARY as any[]) {
      for (const v of d.variants ?? []) {
        if (v?.id) libParent.set(v.id, d.id);
      }
    }
    for (const d of CURATED_DISHES) {
      for (const v of d.variants) {
        const lp = libParent.get(v.id);
        if (lp !== undefined) expect(lp).toBe(d.id);
      }
    }
  });

  it('every curated dish carries the fields the Meal table requires', () => {
    for (const d of CURATED_DISHES) {
      expect(d.id.length).toBeGreaterThan(0);
      expect(d.name.length).toBeGreaterThan(0);
      expect(Array.isArray(d.category) && d.category.length > 0).toBe(true);
      expect(d.type.length).toBeGreaterThan(0);
      for (const v of d.variants) {
        expect(v.id.length).toBeGreaterThan(0);
        expect(v.name.length).toBeGreaterThan(0);
      }
    }
  });
});

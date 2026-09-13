// ─────────────────────────────────────────────────────────────────────────────
// PANTRY RESOLVER PARITY — the server leaf (server/src/lib/ingredientResolver)
// must produce IDENTICAL output to the client engine for the pantry route's
// exact pipeline: per-dish ingredients → × servings → sides/beverages → pantry
// groups. The server data comes from a generated snapshot (see
// pantrySnapshot.generate.test.ts); this file pins the GROUPING logic (grams,
// grain consolidation, singularize, toast-id strip, category ordering, sorting)
// against the client buildPantryGroups byte-for-byte.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';

import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import {
  buildPantryGroups as clientBuildPantryGroups,
  getIngredientsForCategoryOption as clientCategoryOption,
  getIngredientsForMealOption as clientMealOption,
} from '../utils/ingredientUtils';
import {
  buildPantryGroups as serverBuildPantryGroups,
  categoryMeta,
  resolveCategoryIngredients,
  resolveMealIngredients,
  type ServerIngredient,
} from '../server/src/lib/ingredientResolver';

// Dishes chosen to exercise the full engine surface: curry, dal, paneer dish,
// a beverage, a milkshake (light path), regionals. ALL are real DISH_LIBRARY
// ids — legacy ids (dal-makhani, palak-paneer) are NOT in the library and the
// route skips them (see the legacy-id pin below).
const SPOT_DISHES = ['rajma-chawal', 'chicken-biryani', 'dal-kofta', 'chilli-paneer', 'mango-lassi', 'gahat-ka-shorba', 'chickoo-nut-milkshake', 'moong-dal-halwa', 'jeera-rice'];
const SPOT_CATEGORIES = ['salad', 'jeera-rice', 'khichdi', 'pav', 'mint-chutney', 'chaas', 'fresh-cut-fruit', 'papad'];

/** Replicate the pantry ROUTE's exact per-meal transform with a given resolver. */
function routeIngredients(
  resolveMeal: (id: string) => ServerIngredient[],
  resolveCat: (id: string) => ServerIngredient[],
  meals: Array<{ mealId: string; quantity: number; name: string; sides: string[]; beverages: string[] }>,
): { ing: ServerIngredient; source: string }[] {
  const out: { ing: ServerIngredient; source: string }[] = [];
  for (const meal of meals) {
    const source = meal.name;
    for (const ing of resolveMeal(meal.mealId)) {
      out.push({ ing: { ...ing, quantity: ing.quantity * (meal.quantity || 1) }, source });
    }
    for (const side of [...(meal.sides ?? []), ...(meal.beverages ?? [])]) {
      for (const ing of resolveCat(side)) {
        out.push({ ing, source: `${source} · ${side}` });
      }
    }
  }
  return out;
}

const SAMPLE_MEALS = [
  { mealId: 'dal-kofta', quantity: 2, name: 'Dal Kofta', sides: ['jeera-rice'], beverages: [] },
  { mealId: 'rajma-chawal', quantity: 1, name: 'Rajma Chawal', sides: ['salad'], beverages: ['chaas'] },
  { mealId: 'chilli-paneer', quantity: 1, name: 'Chilli Paneer', sides: [], beverages: [] },
  { mealId: 'mango-lassi', quantity: 3, name: 'Mango Lassi', sides: [], beverages: [] },
  { mealId: 'chicken-biryani', quantity: 1, name: 'Chicken Biryani', sides: ['mint-chutney'], beverages: [] },
];

describe('pantry resolver parity — server leaf vs client engine', () => {
  it('resolveMealIngredients matches the client engine dish-for-dish', () => {
    for (const id of SPOT_DISHES) {
      const server = resolveMealIngredients(id);
      const client = clientMealOption(id, '', DISH_LIBRARY);
      expect(server, `dish ${id}`).toEqual(client);
    }
  });

  it('resolveCategoryIngredients matches the client fuzzy lookup', () => {
    for (const id of [...SPOT_CATEGORIES, 'JeeRA  Rice', 'khichdi', 'mint chutney', 'toast-bread']) {
      const server = resolveCategoryIngredients(id);
      const client = clientCategoryOption(id);
      expect(server, `category ${id}`).toEqual(client);
    }
  });

  it('legacy ids (not in DISH_LIBRARY) resolve to [] — the old route skipped them', () => {
    // dal-makhani / palak-paneer are curated/offline-only ids; the compiled
    // route never had a library entry to resolve them (DISH_LIBRARY.find →
    // continue). The resolver keeps that behavior: missing → no cards.
    expect(resolveMealIngredients('dal-makhani')).toEqual([]);
    expect(resolveMealIngredients('palak-paneer')).toEqual([]);
  });

  it('buildPantryGroups matches client output for the route pipeline', () => {
    const serverAll = routeIngredients(resolveMealIngredients, resolveCategoryIngredients, SAMPLE_MEALS);
    const clientAll = routeIngredients(
      (id) => clientMealOption(id, '', DISH_LIBRARY),
      (id) => clientCategoryOption(id),
      SAMPLE_MEALS,
    );
    expect(serverAll).toEqual(clientAll);

    const serverGroups = serverBuildPantryGroups(serverAll);
    const clientGroups = clientBuildPantryGroups(clientAll as Parameters<typeof clientBuildPantryGroups>[0]);
    expect(serverGroups).toEqual(clientGroups);
  });

  it('buildPantryGroups handles edge aggregation identically', () => {
    const raw: { ing: ServerIngredient; source: string }[] = [
      { ing: { name: 'Tomato', quantity: 2, unit: 'pc', category: 'produce' }, source: 'A' },
      { ing: { name: 'tomatoes', quantity: 1, unit: 'pc', category: 'produce' }, source: 'B' },
      { ing: { name: 'Spinach', quantity: 0.5, unit: 'cup', category: 'produce' }, source: 'A' },
      { ing: { name: 'Basmati Rice', quantity: 2, unit: 'cup', category: 'grains' }, source: 'C' },
      { ing: { name: 'Roti', quantity: 6, unit: 'pcs', category: 'grains' }, source: 'D' },
      { ing: { name: 'Toast Bread', quantity: 1, unit: 'pcs', category: 'breads' }, source: 'E' },
      { ing: { name: 'Yogurt', quantity: 1, unit: 'cup', category: 'dairy' }, source: 'F' },
      { ing: { name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'spices' }, source: 'G' },
    ];
    const serverGroups = serverBuildPantryGroups(raw);
    // Snapshot categories are `string`; the client's are a stricter union — the
    // literals above are valid union members, so cast only at the boundary.
    const clientGroups = clientBuildPantryGroups(raw as Parameters<typeof clientBuildPantryGroups>[0]);
    expect(serverGroups).toEqual(clientGroups);
    expect(serverGroups.length).toBeGreaterThan(0);
  });

  it('categoryMeta mirrors the client CATEGORY_META', () => {
    expect(categoryMeta('produce')).toEqual({ label: 'Fresh Stuff', emoji: '🥦' });
    expect(categoryMeta('breads')).toEqual({ label: 'Breads', emoji: '🍞' });
    expect(categoryMeta('nonsense')).toEqual({ label: 'nonsense', emoji: '📦' });
  });
});
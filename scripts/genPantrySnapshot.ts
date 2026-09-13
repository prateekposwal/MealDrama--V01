/**
 * GENERATES server/src/data/pantrySnapshot.ts — the server-owned ingredient
 * catalog. The production server runs COMPILED dist (plain node) and can NEVER
 * require() a client .ts module at runtime (that was the pantry 500 bug). So
 * this module pre-computes, ONCE, the exact output of the client ingredient
 * engine:
 *
 *   getIngredientsForMealOption(id, '', DISH_LIBRARY)   — per dish (variant[0])
 *   getIngredientsForCategoryOption(id)                 — per side/beverage id
 *
 * together with CATEGORY_META. The result is emitted as a checked-in .ts data
 * file under server/src/data — tsc compiles it into dist like any server
 * source, zero client imports at runtime.
 *
 * NOTE (imports): the client engine pulls app/store/useStore, which reads
 * import.meta.env at module load — that only exists under vitest, so build +
 * regenerate are driven by tests/pantrySnapshot.generate.test.ts (this file is
 * imported from vitest, never from a raw tsx CLI).
 *
 * Regenerate after the client catalog OR ingredient engine changes:
 *   WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts
 * (the plain vitest run is the drift guard: stale committed data fails).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { CATEGORY_INGREDIENTS, CATEGORY_META, getIngredientsForCategoryOption, getIngredientsForMealOption } from '../utils/ingredientUtils';

export interface SnapshotIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  inStock?: boolean;
}

export interface PantrySnapshot {
  version: number;
  generatedAt: string;
  dishCount: number;
  categoryCount: number;
  dishes: Record<string, SnapshotIngredient[]>;
  categories: Record<string, SnapshotIngredient[]>;
  categoryMeta: Record<string, { label: string; emoji: string }>;
}

/** The ROUTE's exact invocation: dish id, no variant id, no diet, no selections. */
function toSnapshotIngredient(ing: { name: string; quantity: number; unit: string; category: string; inStock?: boolean }): SnapshotIngredient {
  return { name: ing.name, quantity: ing.quantity, unit: ing.unit, category: ing.category, inStock: ing.inStock };
}

export function buildPantrySnapshot(): PantrySnapshot {
  const dishes: PantrySnapshot['dishes'] = {};
  for (const dish of DISH_LIBRARY) {
    dishes[dish.id] = getIngredientsForMealOption(dish.id, '', DISH_LIBRARY).map(toSnapshotIngredient);
  }

  const categories: PantrySnapshot['categories'] = {};
  for (const key of Object.keys(CATEGORY_INGREDIENTS)) {
    categories[key] = getIngredientsForCategoryOption(key).map(toSnapshotIngredient);
  }

  const meta: PantrySnapshot['categoryMeta'] = {};
  for (const [cat, { label, emoji }] of Object.entries(CATEGORY_META)) {
    meta[cat] = { label, emoji };
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    dishCount: Object.keys(dishes).length,
    categoryCount: Object.keys(categories).length,
    dishes,
    categories,
    categoryMeta: meta,
  };
}

const template = (snap: PantrySnapshot): string => `/**
 * GENERATED — do not edit by hand.
 * Source: scripts/genPantrySnapshot.ts (regenerate:
 *   WRITE_PANTRY_SNAPSHOT=1 npx vitest run tests/pantrySnapshot.generate.test.ts)
 * The server-owned ingredient catalog: per-dish + per-category ingredients from
 * the client engine, pre-computed so compiled server/dist never needs a client
 * .ts module at runtime. Parity + drift guard: tests/pantrySnapshot.generate.test.ts.
 */
export interface SnapshotIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  inStock?: boolean;
}

export interface PantrySnapshot {
  version: number;
  generatedAt: string;
  dishCount: number;
  categoryCount: number;
  dishes: Record<string, SnapshotIngredient[]>;
  categories: Record<string, SnapshotIngredient[]>;
  categoryMeta: Record<string, { label: string; emoji: string }>;
}

export const PANTRY_SNAPSHOT: PantrySnapshot = ${JSON.stringify(snap, null, 2)};
`;

export function writePantrySnapshot(): string {
  const snap = buildPantrySnapshot();
  const outPath = resolve(process.cwd(), 'server/src/data/pantrySnapshot.ts');
  writeFileSync(outPath, template(snap));
  return `${outPath} (${snap.dishCount} dishes, ${snap.categoryCount} category options)`;
}
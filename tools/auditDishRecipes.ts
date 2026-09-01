// ─────────────────────────────────────────────────────────────────────────────
// DISH RECIPE AUDIT — the whack-a-mole killer.
// Scans EVERY dish's variants and reports any that lack a REAL recipe:
//   • no variant ingredients at all
//   • the placeholder template (Salt/Pepper/Coriander/Water filler)
//   • ≤2 items that are all generic (a "recipe" can't be two generic items)
// Run anytime:  npx tsx tools/auditDishRecipes.ts
// ─────────────────────────────────────────────────────────────────────────────
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';

const GENERIC = new Set(['salt', 'pepper', 'corariander leaves', 'coriander leaves', 'coriander', 'water', 'sugar', 'oil', 'ghee']);

function realRecipe(names: string[]): boolean {
  const n = names.map(s => s.trim().toLowerCase());
  if (n.length === 0) return false;
  if (n.length <= 2) return false;
  return n.some(x => !GENERIC.has(x));
}

function resolvedNames(d: (typeof DISH_LIBRARY)[number], v: { id?: string }): string[] {
  return getIngredientsForMealOption(d.id, v.id ?? '', DISH_LIBRARY).map(i => i.name);
}

/** RAW data audit — variants whose stored ingredient list is weak/filler. */
export function auditRawVariants(): Array<{ id: string; name: string; variant: string; has: string[] }> {
  const gaps: Array<{ id: string; name: string; variant: string; has: string[] }> = [];
  for (const d of DISH_LIBRARY) {
    for (const v of d.variants ?? []) {
      const names = (v.ingredients ?? []).map(i => i.name);
      if (!realRecipe(names)) gaps.push({ id: d.id, name: d.name, variant: v.name ?? v.id, has: names });
    }
  }
  return gaps;
}

/** RESOLVED audit — what the USER actually sees after inference/completeness/
 *  light-gate. The real product gap, not the data gap. */
export function auditResolved(): Array<{ id: string; name: string; variant: string; has: string[] }> {
  const gaps: Array<{ id: string; name: string; variant: string; has: string[] }> = [];
  for (const d of DISH_LIBRARY) {
    for (const v of d.variants ?? []) {
      const names = resolvedNames(d, v);
      if (!realRecipe(names)) gaps.push({ id: d.id, name: d.name, variant: v.name ?? v.id, has: names.slice(0, 8) });
    }
  }
  return gaps;
}

export function auditDishRecipesLabel(): string {
  const raw = auditRawVariants();
  const resolved = auditResolved();
  const lines = [
    `RAW (data)    : ${raw.length} variant(s) across ${DISH_LIBRARY.length} dishes lack a real ingredient list.`,
    `RESOLVED (UX) : ${resolved.length} variant(s) resolve WITHOUT a real recipe for the user.`,
    '',
    `Resolved gaps (what users actually see — fix these first):`,
  ];
  for (const g of resolved.slice(0, 200)) {
    lines.push(`  ✗ ${g.id} — "${g.name}" (${g.variant}) → ${g.has.join(', ') || '∅'}`);
  }
  return lines.join('\n');
}

if (require.main === module) {
  console.log(auditDishRecipesLabel());
}
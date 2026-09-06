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
import { regionForState, statesMatchRegion } from '../utils/regionConstants';

const GENERIC = new Set(['salt', 'pepper', 'corariander leaves', 'coriander leaves', 'coriander', 'water', 'sugar', 'oil', 'ghee']);

// ─── PRODUCE-TYPE guard ────────────────────────────────────────────────────────
// Fresh-fruit names in the produce category. 'coconut' is deliberately absent:
// it is a savory cooking staple (curries, chutneys, thorans), not a "new fruit".
const NEW_FRUITS = /mango|pineapple|\bapples?\b|banana|papaya|watermelon|\bgrapes?\b|guava|pomegranate|strawberr|grapefruit|\boranges?\b|\bpeach\b|\bpear\b|\bplum\b|\bfigs?\b|apricot|cherr|berry|jackfruit|dragon\s?fruit|mixed\s?fruits?|seasonal\s?fruit|\bfruit\b/i;

// Fruit/sweet signals in dish name + tags (+ variant name). 'dry fruit' is
// stripped first — it means nuts/raisins (pantry), NOT a fresh-fruit signal,
// so a "Pav Bhaji Dry Fruit" name alone never whitelists a fresh-fruit leak.
const FRUIT_SWEET_SIGNAL = /fruit|mango|pineapple|\bapple|banana|papaya|watermelon|\bgrape|guava|pomegranate|strawberr|\borange|\bpeach|berry|jackfruit|sweet|dessert|juice|shake|smoothie|lassi|salad|chaat|chutney|nice[\s-]?cream|pachadi|payesh|payasam|pudding|cake|cookie|muffin|pie|donut|pancake|fritter|custard|mastani|barfi|halwa|kheer|shrikhand|sharbat|sorbet|pana|milkshake|milk|cream/i;

// Savory dishes that legitimately use fruit as a vegetable (never a bug):
//   • shukto — raw banana in the Bengali bitter-veg stew
//   • sadhya — the Kerala feast closes with ripe banana
//   • khar-assam — raw papaya cooked in the Assamese alkali khar
const FRUIT_DISH_ALLOWLIST = new Set(['shukto', 'sadhya', 'khar-assam']);

function realRecipe(names: string[]): boolean {
  const n = names.map(s => s.trim().toLowerCase());
  if (n.length === 0) return false;
  if (n.length <= 2) return false;
  return n.some(x => !GENERIC.has(x));
}

function resolvedNames(d: (typeof DISH_LIBRARY)[number], v: { id?: string }): string[] {
  return getIngredientsForMealOption(d.id, v.id ?? '', DISH_LIBRARY).map(i => i.name);
}

function resolvedIngredients(d: (typeof DISH_LIBRARY)[number], v: { id?: string }) {
  return getIngredientsForMealOption(d.id, v.id ?? '', DISH_LIBRARY);
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

/** REGION/STATE audit — every dish's `states[]` entry must belong to the
 *  dish's `region` per the canonical STATE_REGION map, or be an unknown key.
 *  A wrongly-tagged Goan dish tagged 'south' surfaces here. */
export function auditRegionStates(): Array<{ id: string; name: string; region: string; state: string; expects: string | null }> {
  const gaps: Array<{ id: string; name: string; region: string; state: string; expects: string | null }> = [];
  for (const d of DISH_LIBRARY) {
    for (const s of d.states ?? []) {
      const expects = regionForState(s);
      if (!expects) {
        gaps.push({ id: d.id, name: d.name, region: d.region, state: s, expects: null });
        continue;
      }
      if (d.region !== 'all' && expects !== d.region) {
        gaps.push({ id: d.id, name: d.name, region: d.region, state: s, expects });
      }
    }
  }
  return gaps;
}

/** PRODUCE-TYPE audit — no fresh fruit may leak into a savory dish. Catches
 *  the copy-paste bug class (Mango on "Twice Baked Potatoes", Pineapple on a
 *  Fajita Bowl) and the generator collision (pav-bhaji "dry fruit" → mango/
 *  apple/banana). A fruit in produce on a dish with no fruit/sweet name or tag
 *  signal is a leak. */
export function auditProduceFruit(): Array<{ id: string; name: string; variant: string; has: string[] }> {
  const gaps: Array<{ id: string; name: string; variant: string; has: string[] }> = [];
  for (const d of DISH_LIBRARY) {
    for (const v of d.variants ?? []) {
      const fruits = resolvedIngredients(d, v)
        .filter(i => i.category === 'produce' && NEW_FRUITS.test(i.name))
        .map(i => i.name);
      if (fruits.length === 0) continue;
      if (FRUIT_DISH_ALLOWLIST.has(d.id)) continue;
      const hay = `${d.name} ${(d.tags ?? []).join(' ')} ${v.name ?? ''}`.toLowerCase().replace(/dry[\s-]?fruit/g, ' ');
      if (FRUIT_SWEET_SIGNAL.test(hay)) continue;
      gaps.push({ id: d.id, name: d.name, variant: v.name ?? v.id, has: [...new Set(fruits)] });
    }
  }
  return gaps;
}

export function auditDishRecipesLabel(): string {
  const raw = auditRawVariants();
  const resolved = auditResolved();
  const produceFruit = auditProduceFruit();
  const lines = [
    `RAW (data)    : ${raw.length} variant(s) across ${DISH_LIBRARY.length} dishes lack a real ingredient list.`,
    `RESOLVED (UX) : ${resolved.length} variant(s) resolve WITHOUT a real recipe for the user.`,
    `PRODUCE-FRUIT : ${produceFruit.length} savory variant(s) resolve WITH a fresh fruit (copy-paste/generator leak).`,
    '',
    `Resolved gaps (what users actually see — fix these first):`,
  ];
  for (const g of resolved.slice(0, 200)) {
    lines.push(`  ✗ ${g.id} — "${g.name}" (${g.variant}) → ${g.has.join(', ') || '∅'}`);
  }
  for (const g of produceFruit.slice(0, 50)) {
    lines.push(`  ✗ ${g.id} — "${g.name}" (${g.variant}) → ${g.has.join(', ')}`);
  }
  return lines.join('\n');
}

if (require.main === module) {
  console.log(auditDishRecipesLabel());
}
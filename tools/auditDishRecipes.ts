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


// ─── PRIORITIZED BACKLOG (data-debt driver) ───────────────────────────────────
// Ranks every raw-empty variant by PROVABLE deficit so the next data session
// fixes the worst first. Classes (a..c), scored per variant:
//   a — infra-red: dish is non-veg/eggitarian but resolves NO protein
//   b — weak recipe: <4 non-generic items, or nothing but generic pantry/spices
//   c — name implies a distinctive ingredient that did NOT resolve
// Ordering: class a first, then flag count, then fewest resolved items.
const PROTEIN_NAME = /chicken|mutton|fish|prawn|crab|egg|\bpork\b|paneer|tofu|soya|beef/i;
const GENERIC_ONLY = /^(oil|ghee|spices|salt|turmeric|cumin seeds|red chili powder|coriander( leaves)?)$/;

/** Distinctive ingredient tokens — dish/variant NAME implies these, generic
 *  inference won't add them. Dish-identity words (dosa/idli/paratha…) are
 *  deliberately absent: the dish being named after itself is not a deficit. */
const NAME_IMPLIED: Array<[RegExp, string[]]> = [
  [/cashew/i, ['cashew']], [/tamarind/i, ['tamarind']], [/coconut/i, ['coconut']], [/paneer/i, ['paneer']],
  [/chicken/i, ['chicken']], [/mutton|gosht|erachi|botti/i, ['mutton']], [/prawn|chingri|shrimp/i, ['prawn']],
  [/fish|maach|meen|ilish|bhetki|rohu/i, ['fish']], [/egg\b|dim\b/i, ['egg']], [/pork|vawksa|\bdoh\b/i, ['pork']],
  [/pumpkin|kaddu/i, ['pumpkin']], [/banana|kela/i, ['banana']], [/jackfruit|kathal/i, ['jackfruit']],
  [/mango|aam/i, ['mango']], [/curry leaves|karipatta/i, ['curry leaves']], [/mustard|sarson/i, ['mustard']],
  [/poppy|posto/i, ['poppy']], [/kokum/i, ['kokum']], [/bamboo/i, ['bamboo']], [/drumstick/i, ['drumstick']],
  [/bitter gourd|karela/i, ['bitter gourd']], [/bottle gourd|lauki|doodhi/i, ['bottle gourd']],
  [/ridge gourd|turai/i, ['ridge gourd']], [/snake gourd|padwal/i, ['snake gourd']], [/ivy gourd|dondakaya/i, ['ivy gourd']],
  [/brinjal|baingan|eggplant/i, ['eggplant', 'brinjal']], [/okra|bhindi/i, ['okra']], [/spinach|palak/i, ['spinach']],
  [/fenugreek|methi/i, ['fenugreek']], [/amaranth|chaulai/i, ['amaranth']], [/sorrel/i, ['sorrel']],
  [/colocasia|arbi|arvi/i, ['colocasia']], [/raw banana|plantain/i, ['raw banana', 'plantain']], [/peas?|matar/i, ['peas']],
  [/cauliflower|gobhi/i, ['cauliflower']], [/carrot|gajar/i, ['carrot']], [/potato|aloo/i, ['potato']],
  [/tomato|tamatar/i, ['tomato']], [/onion/i, ['onion']], [/rice/i, ['rice']], [/dal|daal|lentil/i, ['dal', 'lentil']],
  [/chickpea|chole|chana|kadala/i, ['chickpea', 'chana']], [/rajma/i, ['rajma']], [/semolina|rava|sooji/i, ['semolina', 'rava', 'sooji']],
  [/ragi/i, ['ragi']], [/bajra/i, ['bajra']], [/jowar/i, ['jowar']], [/saffron|kesar/i, ['saffron', 'kesar']],
  [/cardamom|elaichi/i, ['cardamom']], [/clove|laung/i, ['clove']], [/cinnamon|dalchini/i, ['cinnamon']],
  [/bean|moong/i, ['moong']], [/soya|soy/i, ['soya']], [/noodle/i, ['noodle']], [/sev/i, ['sev']],
  [/pav/i, ['pav']], [/papad/i, ['papad']], [/gulab|jamun/i, ['gulab jamun']], [/jalebi/i, ['jalebi']],
  [/kulfi/i, ['kulfi']], [/faluda/i, ['faluda']], [/halwa/i, ['halwa']], [/kheer|payasam/i, ['kheer', 'payasam']],
  [/shrikhand/i, ['shrikhand']], [/sambar/i, ['sambar']], [/rasam/i, ['rasam']], [/soup|shorba/i, ['soup']],
  [/biryani/i, ['biryani']], [/bonda/i, ['bonda']], [/tikki/i, ['tikki']], [/cutlet/i, ['cutlet']],
  [/kebab/i, ['kebab']], [/tandoori/i, ['tandoori']], [/tikka/i, ['tikka']], [/kofta/i, ['kofta']],
  [/korma/i, ['korma']], [/stew/i, ['stew']], [/pulao/i, ['pulao']], [/khichdi/i, ['khichdi']],
];

export function auditPriorityBacklog(limit = 200): Array<{ id: string; name: string; variant: string; region: string; type: string; classes: string[]; resolvedCount: number }> {
  const out: Array<{ id: string; name: string; variant: string; region: string; type: string; classes: string[]; resolvedCount: number }> = [];
  for (const d of DISH_LIBRARY) {
    for (const v of d.variants ?? []) {
      const rawNames = (v.ingredients ?? []).map(i => i.name);
      if (realRecipe(rawNames)) continue; // only raw-empty/placeholder variants
      const resolved = resolvedIngredients(d, v);
      const names = resolved.map(i => i.name.toLowerCase());
      const nonGeneric = resolved.filter(i => !GENERIC.has(i.name.toLowerCase()));
      const classes: string[] = [];
      if ((d.type === 'non-veg' || d.type === 'eggitarian')) {
        const hasProtein = resolved.some(i => i.category === 'proteins') || names.some(n => PROTEIN_NAME.test(n));
        if (!hasProtein) classes.push('a');
      }
      if (nonGeneric.length < 4 || (resolved.length > 0 && resolved.every(i => GENERIC_ONLY.test(i.name.toLowerCase())))) {
        classes.push('b');
      }
      const hay = `${d.name} ${v.name ?? ''}`.toLowerCase();
      for (const [re, keys] of NAME_IMPLIED) {
        if (!re.test(hay)) continue;
        if (!keys.some(k => hay.includes(k.toLowerCase()))) continue;
        if (!keys.some(k => names.some(n => n.includes(k.toLowerCase())))) { classes.push('c'); break; }
      }
      if (classes.length > 0) {
        out.push({ id: d.id, name: d.name, variant: v.name ?? v.id, region: d.region, type: d.type, classes, resolvedCount: resolved.length });
      }
    }
  }
  const weight = (c: string) => c === 'a' ? 0 : c === 'b' ? 1 : 2;
  return out
    .sort((x, y) => (Math.min(...y.classes.map(weight)) - Math.min(...x.classes.map(weight)))
      || (y.classes.length - x.classes.length)
      || (x.resolvedCount - y.resolvedCount))
    .slice(0, limit);
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
/**
 * Server-side pantry / ingredient resolver.
 *
 * The pantry route aggregates ingredients for all household members' meals.
 * It MUST resolve without requiring any client .ts module at runtime (compiled
 * dist = plain node): all ingredient data comes from PANTRY_SNAPSHOT
 * (server/src/data/pantrySnapshot.ts — generated from the client engine by
 * scripts/genPantrySnapshot.ts) and the grouping logic here is a faithful port
 * of the client's buildPantryGroups, pinned by
 * tests/pantryResolver.parity.test.ts against the client implementation.
 */
import { PANTRY_SNAPSHOT } from '../data/pantrySnapshot';
import { canonicalName } from './canonicalName';

export interface ServerIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  inStock?: boolean;
}

export interface ServerPantryItem {
  name: string;
  totalQuantity: number;
  unit: string;
  category: string;
  sources: string[];
  checked: boolean;
  id: string;
}

export interface ServerPantryGroup {
  category: string;
  label: string;
  emoji: string;
  items: ServerPantryItem[];
}

/** Per-dish ingredients exactly as getIngredientsForMealOption(id,'',DISH_LIBRARY). */
export function resolveMealIngredients(dishId: string): ServerIngredient[] {
  return PANTRY_SNAPSHOT.dishes[dishId] ?? [];
}

/** Port of getIngredientsForCategoryOption over the snapshot's category table. */
export function resolveCategoryIngredients(catId: string): ServerIngredient[] {
  const direct = PANTRY_SNAPSHOT.categories[catId];
  if (direct) return direct;
  const normalized = catId.toLowerCase().replace(/[\s-/]+/g, '-');
  const match = PANTRY_SNAPSHOT.categories[normalized];
  if (match) return match;
  const fuzzyKey = Object.keys(PANTRY_SNAPSHOT.categories).find(k => {
    const kn = k.toLowerCase().replace(/[\s-]+/g, '-');
    const isCompound = normalized.includes('-');
    if (isCompound) {
      if (!kn.includes('-')) return false;
      const kw = kn.split('-');
      const nw = normalized.split('-');
      return kw.some(w => nw.includes(w));
    }
    return kn.includes(normalized) || normalized.includes(kn);
  });
  return fuzzyKey ? (PANTRY_SNAPSHOT.categories[fuzzyKey] ?? []) : [];
}

export const categoryMeta = (cat: string): { label: string; emoji: string } =>
  PANTRY_SNAPSHOT.categoryMeta[cat] ?? { label: cat, emoji: '📦' };

// ─── Port of client buildPantryGroups (byte-faithful, drift-guarded) ────────

const CATEGORY_ORDER: string[] = ['produce', 'proteins', 'dairy', 'grains', 'spices', 'pantry', 'breads', 'snacks'];

const GRAMS_PER_PC: Array<[RegExp, number]> = [
  [/coriander|dhania/i, 30],
  [/mint|pudina/i, 25],
  [/curry leaves/i, 12],
  [/parsley/i, 25],
  [/ginger|adrak/i, 10],
  [/garlic/i, 4],
  [/onion|pyaaz/i, 100],
  [/potato|aloo/i, 120],
  [/tomato/i, 80],
  [/capsicum|bell pepper/i, 120],
  [/carrot|gajar/i, 80],
  [/cucumber|kheera/i, 120],
  [/brinjal|eggplant|baingan/i, 120],
  [/lady(r)?finger|bhindi|okra/i, 8],
  [/green chilli|mirch/i, 3],
  [/lemon|nimbu/i, 60],
  [/mango/i, 150],
  [/banana/i, 100],
  [/apple/i, 150],
  [/coconut/i, 90],
];

function shouldConvertToGrams(ing: { name: string; unit: string; category: string }): boolean {
  if (ing.category === 'produce' || ing.category === 'breads') return true;
  if (ing.category === 'spices' && (ing.unit === 'pc' || ing.unit === 'pcs')) return true;
  return false;
}

function gramsPerUnitOf(name: string): number | null {
  const lower = name.toLowerCase();
  for (const [re, grams] of GRAMS_PER_PC) {
    if (re.test(lower)) return grams;
  }
  return null;
}

function toBuyGrams(ing: { name: string; quantity: number; unit: string; category: string }): { name: string; quantity: number; unit: string; category: string } {
  const qty = ing.quantity;
  if (!shouldConvertToGrams(ing)) return { ...ing, quantity: qty };
  if (ing.unit === 'g' || ing.unit === 'kg') return { ...ing, quantity: qty };
  const gPerU = gramsPerUnitOf(ing.name);
  if (gPerU == null) return { ...ing, quantity: qty };
  let out = Math.max(1, Math.round(qty * gPerU));
  let unit: string = 'g';
  if (out >= 1000) {
    out = Number((out / 1000).toFixed(1));
    unit = 'kg';
  }
  return { name: ing.name, quantity: out, unit, category: ing.category };
}

function toStableId(name: string, category?: string): string {
  let id = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (category !== 'breads') {
    id = id.replace(/^toast-|-toast-|-toast$/g, '');
  }
  return id;
}

function singularizeKey(n: string): string {
  const lower = n.toLowerCase();
  if (lower.endsWith('es')) {
    const root = lower.slice(0, -2);
    if (root.length >= 2) return root;
  }
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    const root = lower.slice(0, -1);
    if (root.length >= 2) return root;
  }
  return lower;
}

function aggregateIngredients(
  allIngredients: { ing: ServerIngredient; source: string }[],
): Map<string, ServerPantryItem> {
  const map = new Map<string, ServerPantryItem>();

  for (const { ing, source } of allIngredients) {
    const canonical = canonicalName(ing.name);
    const normalizedName = singularizeKey(canonical);
    const key = toStableId(normalizedName, ing.category);
    const existing = map.get(key);

    if (existing) {
      existing.totalQuantity += ing.quantity;
      if (!existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      if (ing.name.length < existing.name.length) {
        existing.name = ing.name;
      }
    } else {
      map.set(key, {
        name: ing.name,
        totalQuantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        sources: [source],
        checked: false,
        id: key,
      });
    }
  }

  return map;
}

function consolidateGrains(allIngredients: { ing: ServerIngredient; source: string }[]): { ing: ServerIngredient; source: string }[] {
  const riceNames = ['rice', 'steamed rice', 'jeera rice', 'biryani', 'pulao'];
  const wheatNames = ['roti', 'phulka', 'atta', 'wheat flour', 'paratha', 'nan', 'naan'];

  return allIngredients.map(({ ing, source }) => {
    if (ing.category !== 'grains') return { ing, source };

    const nameLower = ing.name.toLowerCase();
    if (riceNames.some(r => nameLower.includes(r))) {
      return { ing: { ...ing, name: 'Basmati Rice' }, source };
    }
    if (wheatNames.some(w => nameLower.includes(w))) {
      let qty = ing.quantity;
      let unit = ing.unit;
      if (unit === 'cup') { qty = Math.round(qty * 120); unit = 'g'; }
      else if (unit === 'pcs') { qty = Math.round(qty * 100); unit = 'g'; }
      return { ing: { ...ing, name: 'Wheat Flour (Atta)', quantity: qty, unit }, source };
    }
    return { ing, source };
  });
}

/** Port of client buildPantryGroups. Input: raw ingredient cards + source text. */
export function buildPantryGroups(
  allIngredients: { ing: ServerIngredient; source: string }[],
): ServerPantryGroup[] {
  const consolidated = consolidateGrains(allIngredients);
  const aggregated = aggregateIngredients(consolidated);

  const groups = new Map<string, ServerPantryItem[]>();

  for (const item of aggregated.values()) {
    if (item.unit === 'cup' && item.category === 'grains') {
      const gramsPerCup = item.name.toLowerCase().includes('rice') ? 185 : 120;
      item.unit = 'g';
      item.totalQuantity = Math.round(item.totalQuantity * gramsPerCup);
      if (item.totalQuantity >= 1000) {
        item.totalQuantity = Number((item.totalQuantity / 1000).toFixed(1));
        item.unit = 'kg';
      }
    }

    const converted = toBuyGrams({
      name: item.name,
      quantity: item.totalQuantity,
      unit: item.unit,
      category: item.category,
    });
    if (converted.unit !== item.unit) {
      item.unit = converted.unit;
      item.totalQuantity = converted.quantity;
    }

    const existing = groups.get(item.category) || [];
    existing.push(item);
    groups.set(item.category, existing);
  }

  for (const items of groups.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return CATEGORY_ORDER
    .filter(cat => groups.has(cat))
    .map(cat => ({
      category: cat,
      label: PANTRY_SNAPSHOT.categoryMeta[cat]?.label ?? cat,
      emoji: PANTRY_SNAPSHOT.categoryMeta[cat]?.emoji ?? '📦',
      items: groups.get(cat)!,
    }));
}
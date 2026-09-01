/**
 * AI Engine — MealDrama's built-in intelligence for AI-style features.
 *
 * Suggestions, scores and recommendations are computed right here in the app
 * from the local DISH_LIBRARY and the user's diet/region/pantry/health prefs,
 * using the same ranking utilities every other surface uses (selectTryThese,
 * DIET_FILTER, region ordering). No external AI service is involved.
 */
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import { DIET_FILTER, selectTryThese, getRegionKey } from './dishSearch';

const SLOT_KEYS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

const SLOT_ALIASES: Record<string, Set<string>> = {
  breakfast: new Set(['breakfast']),
  lunch: new Set(['lunch', 'winter-lunch', 'summer-lunch']),
  dinner: new Set(['dinner', 'winter-dinner', 'summer-dinner']),
  snacks: new Set(['snacks']),
};

function regionKeyFrom(preferredRegions?: string[]): string {
  const raw = preferredRegions?.[0] || 'India';
  try {
    return getRegionKey(raw);
  } catch {
    return 'north';
  }
}

function dietOk(dish: Dish, diet: string): boolean {
  const dt = String(dish.diet ?? dish.type ?? 'veg').toLowerCase();
  const allowed = DIET_FILTER[diet.toLowerCase()] ?? DIET_FILTER.veg ?? [];
  return allowed.includes(dt);
}

function pantryOverlap(dish: Dish, pantry?: string[]): number {
  if (!pantry || pantry.length === 0) return 0;
  const hay = `${String(dish.name ?? '').toLowerCase()} ${(dish.tags ?? []).join(' ').toLowerCase()}`;
  let hits = 0;
  for (const staple of pantry) {
    const s = String(staple ?? '').trim().toLowerCase();
    if (s && hay.includes(s)) hits++;
  }
  return Math.min(1, hits / Math.min(pantry.length, 3));
}

function slotItemsFor(diet: string, regionKey: string): Record<string, Dish[]> {
  const out: Record<string, Dish[]> = {};
  for (const slot of SLOT_KEYS) {
    const picks = selectTryThese(DISH_LIBRARY, {
      userDiet: diet,
      regionKey,
      plannedSlots: [slot],
      maxPerSlot: 6,
    });
    const aliases = SLOT_ALIASES[slot];
    if (!aliases) continue;
    out[slot] = picks
      .filter((d) => (d.category ?? []).some((c) => aliases.has(String(c).toLowerCase())))
      .slice(0, 4);
  }
  return out;
}

function toSuggestionItem(d: Dish, slot: string) {
  const pairings = d.defaultPairings ?? {};
  return {
    id: d.id,
    name: d.name,
    region: d.region,
    calories: d.calories ?? 0,
    protein: d.protein ?? 0,
    slots: d.category ?? [slot],
    type: d.type ?? 'veg',
    icon: d.icon ?? '🍽️',
    prepMinutes: d.prepTime ?? 15,
    defaultGravy: pairings.gravy ?? null,
    defaultRoti: pairings.roti ?? null,
    defaultRice: pairings.rice ?? null,
    defaultSides: pairings.sides ?? [],
    defaultBeverages: pairings.beverages ?? [],
  };
}

/** AI-ranked suggestions per meal slot (breakfast/lunch/dinner/snacks) */
export async function fetchAISuggestions(
  trayLibrary: Record<string, unknown> | unknown,
  diet: string,
  preferredRegions: string[],
): Promise<Record<string, { id: string; name: string; region: string; calories: number; protein: number; slots: string[] }[]> | null> {
  const regionKey = regionKeyFrom(preferredRegions);
  const perSlot = slotItemsFor(diet, regionKey);
  const suggestions: Record<string, ReturnType<typeof toSuggestionItem>[]> = {};
  for (const slot of SLOT_KEYS) {
    suggestions[slot] = (perSlot[slot] ?? []).map((d) => toSuggestionItem(d, slot));
  }
  return suggestions;
}

/** Plan / diet score and issues computed from the local library */
export async function fetchAIScore(params: {
  trayLibrary: any; planDays: any; pantryStaples: string[];
  diet: string; preferredRegions: string[]; healthGoal?: string;
}): Promise<{ metrics: any[]; issues: string[]; dietCompatibility: number; searchQuality: number; regionDiversity: number } | null> {
  const diet = String(params.diet ?? 'veg');
  const pantry = params.pantryStaples ?? [];

  const compatible = DISH_LIBRARY.filter((d) => dietOk(d, diet)).length;
  const regionsCovered = new Set(DISH_LIBRARY.map((d) => d.region).filter((r) => r && r !== 'all'));
  const diversity = Math.min(1, regionsCovered.size / 6);

  const plannedNames = new Set<string>();
  const planDays = params.planDays ?? {};
  for (const day of Object.values(planDays)) {
    for (const slot of Object.values(day ?? {})) {
      if (Array.isArray(slot)) {
        for (const item of slot) {
          const n = item?.name ?? item?.meal_id ?? '';
          if (n) plannedNames.add(String(n).toLowerCase());
        }
      }
    }
  }
  const discovered = DISH_LIBRARY.filter(
    (d) => !plannedNames.has(String(d.name ?? '').toLowerCase()) && pantryOverlap(d, pantry) === 0,
  ).length;

  const pct = (x: number) => Math.round(x * 100);
  const total = DISH_LIBRARY.length;
  const metrics = [
    { key: 'diet_match', pct: pct(compatible / total), label: `${diet} compatible` },
    { key: 'region_diversity', pct: pct(diversity), label: `${regionsCovered.size} regions explored` },
    { key: 'discoverability', pct: pct(discovered / total), label: 'new dishes to try' },
  ];
  const issues: string[] = [];
  if (compatible / total < 0.6) issues.push(`Only ${compatible} of ${total} dishes fit your ${diet} diet`);
  if (diversity < 0.4) issues.push('Most picks stay in one region — try exploring more cuisines');
  if (!pantry.length) issues.push('Tell us what\'s in your pantry for better suggestions');
  if (!issues.length) issues.push('Your plan is well balanced — keep exploring!');

  return {
    metrics,
    issues,
    dietCompatibility: Number((compatible / total).toFixed(3)),
    searchQuality: Number(diversity.toFixed(3)),
    regionDiversity: Number(diversity.toFixed(3)),
  };
}


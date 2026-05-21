import type { Meal, MealType, TrayItem, TrayItemDefaults } from '../../types/tray';
import { getDishStyle, getStyleRouting } from '../../constants/dishStyles';
import { computePairingForDish } from '../../src/data/pairingEngine';
import type { Dish } from '../../constants/dishLibrary';

const LIGHT_CARBS = new Set(['paratha', 'idli', 'dosa', 'poha', 'upma', 'puttu', 'appam']);
const HEAVY_CARBS = new Set(['naan', 'tandoori naan', 'paratha', 'butter naan', 'garlic naan', 'pulao', 'biryani', 'fried rice']);
const ROTI_REGIONS = new Set(['north', 'central']);
const RICE_REGIONS = new Set(['south', 'east', 'west', 'northeast']);
const CARB_DISH_TAGS = new Set(['paratha', 'bread', 'puri', 'naan', 'roti', 'dosa', 'idli', 'rice', 'pulao', 'biryani', 'khichdi', 'pasta', 'noodles', 'appam', 'puttu', 'upma']);
const NO_CARB_TAGS = new Set(['chaat', 'snacks', 'fried', 'street food', 'drink', 'tea', 'chai', 'beverage', 'sweet', 'dessert']);

type RegionKey = 'north' | 'south' | 'west' | 'east' | 'central' | 'northeast';

const REGION_BREADS: Record<RegionKey, string[]> = {
  north: ['Tandoori Roti', 'Butter Naan', 'Bhature'],
  south: ['Appam', 'Plain Dosa'],
  west: ['Bhakri', 'Thepla'],
  east: ['Luchi', 'Roti'],
  central: ['Roti', 'Bafla'],
  northeast: ['Roti', 'Naan'],
};

const REGION_RICES: Record<RegionKey, string[]> = {
  north: ['Jeera Rice', 'Steamed Rice'],
  south: ['Steamed Rice', 'Lemon Rice'],
  west: ['Steamed Rice', 'Pulao'],
  east: ['Steamed Rice'],
  central: ['Steamed Rice', 'Jeera Rice'],
  northeast: ['Steamed Rice', 'Sticky Rice'],
};

const REGION_SIDES: Record<RegionKey, string[]> = {
  north: ['Raita', 'Salad', 'Pickle'],
  south: ['Papad', 'Pickle', 'Coconut Chutney'],
  west: ['Salad', 'Pickle', 'Kadhi'],
  east: ['Salad', 'Pickle'],
  central: ['Salad', 'Pickle'],
  northeast: ['Salad', 'Pickle', 'Chutney'],
};

const REGION_BEVERAGES: Record<RegionKey, string[]> = {
  north: ['Water', 'Chaas'],
  south: ['Water', 'Filter Coffee', 'Chaas'],
  west: ['Water', 'Chaas'],
  east: ['Water', 'Chaas'],
  central: ['Water', 'Chaas'],
  northeast: ['Water', 'Chai'],
};

const SLOT_SIDES: Record<MealType, string[]> = {
  breakfast: ['Mixed Chutney', 'Lemon Wedge', 'Green Chili'],
  lunch: ['Papad', 'Kachumber Salad', 'Mango Pickle'],
  snacks: ['Mint Chutney', 'Onion Rings', 'Fryums'],
  dinner: ['Cucumber Raita', 'Boondi Raita', 'Tamarind Chutney'],
};

const SLOT_BEVERAGES: Record<MealType, string[]> = {
  breakfast: ['Masala Chai', 'Seasonal Fruit Juice', 'Filter Coffee'],
  lunch: ['Chaas', 'Seasonal Fruit Juice', 'Nimbu Pani'],
  snacks: ['Coconut Water', 'Jaljeera', 'Aam Panna'],
  dinner: ['Badam Milk', 'Sol Kadhi', 'Ginger Lemon'],
};

const TAG_BREAD_PREFS: Record<string, string[]> = {
  gravy: ['Butter Naan', 'Tandoori Roti'],
  'slow-cooked': ['Butter Naan', 'Tandoori Roti'],
  tandoori: ['Tandoori Roti', 'Butter Naan'],
  dal: ['Tandoori Roti', 'Jeera Rice'],
  'non-veg': ['Butter Naan', 'Tandoori Roti'],
  egg: ['Tandoori Roti', 'Paratha'],
  paratha: [],
  chaat: [],
  'street food': [],
  snacks: [],
  fried: [],
  drink: [],
  tea: [],
  chai: [],
  beverage: [],
  sweet: [],
  dessert: [],
  breakfast: ['Paratha', 'Bread'],
};

const TAG_SIDE_PREFS: Record<string, string[]> = {
  gravy: ['Raita', 'Salad'],
  dal: ['Papad', 'Pickle'],
  'rice-dish': ['Raita', 'Papad'],
  paratha: ['Curd', 'Butter', 'Pickle'],
  chaat: ['Curd', 'Chutney'],
  'street food': ['Chutney', 'Curd'],
  healthy: ['Salad', 'Curd'],
  'non-veg': ['Salad', 'Onion'],
  egg: ['Salad', 'Ketchup'],
  breakfast: ['Butter', 'Jam'],
  'comfort': ['Papad', 'Salad'],
  salad: ['Green Salad', 'Kachumber'],
  fruit: ['Mixed Fruit', 'Seasonal Fruit'],
};

const TAG_BEVERAGE_PREFS: Record<string, string[]> = {
  'non-veg': ['Water', 'Chaas'],
  spicy: ['Chaas', 'Water'],
  summer: ['Chaas', 'Mango Lassi'],
  breakfast: ['Chai', 'Coffee', 'Milk'],
  healthy: ['Green Tea', 'Water'],
  'comfort': ['Chaas', 'Chai'],
  salad: ['Water', 'Nimbu Pani'],
  fruit: ['Lassi', 'Nimbu Pani'],
};

function resolveRegion(region: string): RegionKey {
  const known: RegionKey[] = ['north', 'south', 'west', 'east', 'central', 'northeast'];
  const r = region.toLowerCase() as RegionKey;
  return known.includes(r) ? r : 'north';
}

function shouldInferBread(meal: Meal): boolean {
  if (!meal.tags) return true;
  if (meal.tags.some(t => CARB_DISH_TAGS.has(t))) return false;
  if (meal.tags.some(t => NO_CARB_TAGS.has(t))) return false;
  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style && !getStyleRouting(style).inferBread) return false;
  return true;
}

function shouldInferRice(meal: Meal): boolean {
  if (!meal.tags) return true;
  if (meal.tags.some(t => ['rice', 'pulao', 'biryani', 'khichdi'].includes(t))) return false;
  if (meal.tags.some(t => NO_CARB_TAGS.has(t))) return false;
  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style && !getStyleRouting(style).inferRice) return false;
  return true;
}

function inferBreads(meal: Meal): string[] {
  if (!shouldInferBread(meal)) return [];

  const region = resolveRegion(meal.region);

  const tags = meal.tags ?? [];
  for (const t of tags) {
    const prefs = TAG_BREAD_PREFS[t];
    if (Array.isArray(prefs) && prefs.length === 0) return [];
  }

  const tagPrefs = tags.flatMap(t => TAG_BREAD_PREFS[t] ?? []).filter(Boolean);
  if (tagPrefs.length > 0) return tagPrefs;

  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.breads && routing.breads.length > 0) return routing.breads;
  }

  const base = REGION_BREADS[region] ?? REGION_BREADS['north'];
  return base;
}

function inferRices(meal: Meal): string[] {
  if (!shouldInferRice(meal)) return [];

  const region = resolveRegion(meal.region);

  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.rice && routing.rice.length > 0) return routing.rice;
  }

  return REGION_RICES[region] ?? REGION_RICES['north'];
}

function inferSides(meal: Meal, slotType: MealType): string[] {
  const region = resolveRegion(meal.region);
  const base = REGION_SIDES[region] ?? REGION_SIDES['north'];

  const tagPrefs = meal.tags?.flatMap(t => TAG_SIDE_PREFS[t] ?? []).filter(Boolean) ?? [];
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];

  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.sides && routing.sides.length > 0) return routing.sides;
  }

  if (slotType === 'breakfast') return SLOT_SIDES.breakfast.slice(0, 2);
  if (slotType === 'snacks') return SLOT_SIDES.snacks.slice(0, 2);

  return base.slice(0, 3);
}

function inferBeverages(meal: Meal, slotType: MealType): string[] {
  const region = resolveRegion(meal.region);
  const base = REGION_BEVERAGES[region] ?? REGION_BEVERAGES['north'];

  const tagPrefs = meal.tags?.flatMap(t => TAG_BEVERAGE_PREFS[t] ?? []).filter(Boolean) ?? [];
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];

  const style = meal.id ? getDishStyle(meal.id) : undefined;
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.beverages && routing.beverages.length > 0) return routing.beverages;
  }

  const slotBev = SLOT_BEVERAGES[slotType];
  if (slotBev) return slotBev.slice(0, 2);

  return base.slice(0, 2);
}

export function applySmartDefaults(
  meal: Meal,
  slotType: MealType,
  existingItem?: TrayItem,
  options?: { useSmartSuggestions?: boolean },
): TrayItemDefaults {
  // ─── BACKWARD COMPAT: if existing item was created with legacy defaults,
  //      preserve its values instead of auto-migrating to smart suggestions.
  if (existingItem && existingItem.smartVersion === 0) {
    return {
      gravy: existingItem.gravy,
      roti: existingItem.roti,
      rice: existingItem.rice,
      sides: existingItem.sides,
      beverages: existingItem.beverages,
      dessert: existingItem.dessert,
      itemQtys: existingItem.itemQtys || {},
    };
  }

  const gravy = meal.baseGravy
    ?? meal.gravyOptions?.[0]
    ?? null;

  let roti: string | null = null;
  let rice: string | null = null;

  const explicitRoti = (meal.rotiOptions?.length ?? 0) > 0;
  const explicitRice = (meal.riceOptions?.length ?? 0) > 0;

  const selfCarb = !shouldInferBread(meal);

  const rotiOptions = explicitRoti
    ? meal.rotiOptions!
    : (selfCarb || explicitRice ? [] : inferBreads(meal));
  const riceOptions = explicitRice
    ? meal.riceOptions!
    : (selfCarb || explicitRoti ? [] : inferRices(meal));

  const hasRoti = rotiOptions.length > 0;
  const hasRice = riceOptions.length > 0;

  const isNorth = ROTI_REGIONS.has(meal.region);
  const isSouthEastWest = RICE_REGIONS.has(meal.region);
  const isLightCarb = meal.tags?.includes('light_carb') ?? false;

  if (hasRoti && hasRice) {
    switch (slotType) {
      case 'breakfast':
        const lightRoti = rotiOptions.find(r => LIGHT_CARBS.has(r.toLowerCase()));
        const lightRice = riceOptions.find(r => LIGHT_CARBS.has(r.toLowerCase()));
        if (lightRoti) {
          roti = lightRoti;
        } else if (lightRice) {
          rice = lightRice;
        } else {
          if (isNorth) {
            roti = rotiOptions[0] ?? null;
          } else {
            rice = riceOptions[0] ?? null;
          }
        }
        break;

      case 'snacks':
        if (isLightCarb) {
          if (isNorth) {
            roti = rotiOptions[0] ?? null;
          } else {
            rice = riceOptions[0] ?? null;
          }
        } else {
          const firstRoti = rotiOptions[0];
          const firstRice = riceOptions[0];
          if (firstRoti && firstRice) {
            const rotiIsLight = !HEAVY_CARBS.has(firstRoti.toLowerCase());
            const riceIsLight = !HEAVY_CARBS.has(firstRice.toLowerCase());

            if (rotiIsLight && isNorth) {
              roti = firstRoti;
            } else if (riceIsLight && isSouthEastWest) {
              rice = firstRice;
            }
          }
          if (!roti && !rice) {
            const anyLightRoti = rotiOptions.find(r => !HEAVY_CARBS.has(r.toLowerCase()));
            const anyLightRice = riceOptions.find(r => !HEAVY_CARBS.has(r.toLowerCase()));
            if (anyLightRoti && isNorth) roti = anyLightRoti;
            else if (anyLightRice && isSouthEastWest) rice = anyLightRice;
          }
        }
        break;

      case 'lunch':
      case 'dinner':
      default:
        if (isNorth) {
          roti = rotiOptions[0] ?? null;
        } else if (isSouthEastWest) {
          rice = riceOptions[0] ?? null;
        } else {
          roti = rotiOptions[0] ?? null;
        }
        break;
    }
  } else if (hasRoti) {
    roti = rotiOptions[0] ?? null;
  } else if (hasRice) {
    rice = riceOptions[0] ?? null;
  }

  // ─── SIDES/BEVERAGES/DESSERT: pairing engine (via suggestedPairings) ──
  // dishToMeal now uses the pairing engine to populate suggestedPairings
  // with dish-aware, culturally accurate accompaniments.
  const style = meal.id ? getDishStyle(meal.id) : undefined;
  const isStandalone = style && ['beverage', 'sweet-dessert', 'bread', 'side'].includes(style);

  let sides: string[] = [];
  let beverages: string[] = [];
  let dessert: string[] = [];

  // Primary: use pairing engine results from dishToMeal
  const pairingSides = meal.suggestedPairings?.sides ?? [];
  const pairingBevs = meal.suggestedPairings?.beverages ?? [];
  if (pairingSides.length >= 2) {
    sides = pairingSides.slice(0, 2);
  } else if (pairingSides.length > 0 && meal.sideOptions) {
    sides = [...new Set([...meal.sideOptions, ...pairingSides])].slice(0, 2);
  } else if (pairingSides.length > 0) {
    sides = pairingSides.slice(0, 2);
  }
  if (pairingBevs.length > 0) {
    beverages = pairingBevs.slice(0, 1);
  }

  const itemQtys: Record<string, number> = {};
  for (const item of [roti, rice, ...sides, ...beverages, ...dessert].filter((s): s is string => s != null)) {
    itemQtys[item] = 1;
  }

  // Fallback: tag/region/style inference — SKIP for standalone dishes
  if (!isStandalone) {
    const explicitSides = (meal.sideOptions?.length ?? 0) > 0;
    const sideOptions = explicitSides ? meal.sideOptions! : inferSides(meal, slotType);
    if (!sides.length) {
      sides = sideOptions.slice(0, 2);
    }

    const explicitBevs = (meal.beverageOptions?.length ?? 0) > 0;
    const beverageOptions = explicitBevs ? meal.beverageOptions! : inferBeverages(meal, slotType);
    if (!beverages.length) {
      beverages = beverageOptions.slice(0, 1);
    }
  }

  return { gravy, roti, rice, sides, beverages, dessert, itemQtys };
}

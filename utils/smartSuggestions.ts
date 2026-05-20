import type { MealType } from '../types/tray';
import { getDishStyle, getStyleRouting, indian_meal_categories } from '../constants/dishStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SuggestionSource =
  | 'tag'
  | 'region'
  | 'state'
  | 'style'
  | 'timeWindow'
  | 'season'
  | 'smart_default'
  | 'manual_override'
  | 'stock_substitution'
  | 'fallback';

export type TimeWindow = 'morning' | 'lunch' | 'snack' | 'dinner' | 'late-night';

export interface SuggestionCategoryResult {
  items: string[];
  source: SuggestionSource;
}

export interface SmartSuggestionResult {
  bread: SuggestionCategoryResult;
  rice: SuggestionCategoryResult;
  sides: SuggestionCategoryResult;
  beverages: SuggestionCategoryResult;
  dessert: SuggestionCategoryResult;
  defaultQtys: Record<string, number>;
  meta: {
    featureFlag: boolean;
    dishStyle: string | undefined;
    region: string;
    timeWindow: TimeWindow;
    season: string;
    festival: string | null;
  };
}

export interface SmartSuggestionInput {
  id: string;
  name: string;
  region: string;
  tags?: string[];
  category?: string[];
  states?: string[];
  season?: string[];
}

export interface SmartSuggestionOptions {
  timeWindow?: TimeWindow;
  existingItems?: string[];
  useSmartSuggestions?: boolean;
  date?: Date;
  /** Items already assigned to other slots today — filtered out to avoid repetition */
  usedToday?: string[];
}

// ─── Time Window ─────────────────────────────────────────────────────────────

const TIME_WINDOWS: [number, number, TimeWindow][] = [
  [6, 10, 'morning'],
  [10, 15, 'lunch'],
  [15, 18, 'snack'],
  [18, 23, 'dinner'],
  [23, 6, 'late-night'],
];

export function getTimeWindow(date?: Date): TimeWindow {
  const hour = (date ?? new Date()).getHours();
  for (const [start, end, label] of TIME_WINDOWS) {
    if (start < end) {
      if (hour >= start && hour < end) return label;
    } else {
      if (hour >= start || hour < end) return label;
    }
  }
  return 'dinner';
}

const TIME_BEVERAGE_MAP: Record<TimeWindow, string[]> = {
  morning: ['Chai', 'Seasonal Fruit Juice', 'Coffee'],
  lunch: ['Chaas', 'Seasonal Fruit Juice', 'Nimbu Pani'],
  snack: ['Nimbu Pani', 'Coconut Water', 'Jaljeera'],
  dinner: ['Chaas', 'Sol Kadhi', 'Badam Milk'],
  'late-night': ['Badam Milk', 'Warm Milk', 'Water'],
};

/** Maps meal slot type to default time window when no clock override given */
const SLOT_TYPE_TIME_MAP: Record<MealType, TimeWindow> = {
  breakfast: 'morning',
  lunch: 'lunch',
  snacks: 'snack',
  dinner: 'dinner',
};

// ─── Season / Festival ─────────────────────────────────────────────────────────

const SEASON_DESSERT_MAP: Record<string, string[]> = {
  spring: ['Gulab Jamun', 'Rasmalai'],
  summer: ['Mango Kulfi', 'Aamras', 'Shrikhand'],
  monsoon: ['Gulab Jamun', 'Jalebi', 'Moong Dal Halwa'],
  winter: ['Gajar Halwa', 'Gond Ke Laddoo', 'Til Ke Laddoo'],
};

const FESTIVAL_DESSERT_MAP: Record<string, string[]> = {
  diwali: ['Gulab Jamun', 'Kaju Katli', 'Motichoor Laddoo'],
  holi: ['Gujiya', 'Malpua', 'Thandai'],
  pongal: ['Sakkarai Pongal', 'Payasam'],
  onam: ['Payasam', 'Ada Pradhaman', 'Palada'],
};

const FESTIVAL_DATE_RANGES: Record<string, [number, number][]> = {
  diwali: [[10, 11]],
  holi: [[3, 3]],
  pongal: [[1, 1]],
  onam: [[8, 9]],
};

export function getCurrentSeason(date?: Date): string {
  const month = (date ?? new Date()).getMonth() + 1;
  if (month >= 2 && month <= 3) return 'spring';
  if (month >= 4 && month <= 6) return 'summer';
  if (month >= 7 && month <= 9) return 'monsoon';
  return 'winter';
}

export function getCurrentFestival(date?: Date): string | null {
  const month = (date ?? new Date()).getMonth() + 1;
  for (const [festival, ranges] of Object.entries(FESTIVAL_DATE_RANGES)) {
    for (const [start, end] of ranges) {
      if (month >= start && month <= end) return festival;
    }
  }
  return null;
}

// ─── Region / Tag Configs (moved from applySmartDefaults.ts) ─────────────────

type RegionKey = 'north' | 'south' | 'west' | 'east' | 'central' | 'northeast';

const ROTI_REGIONS = new Set(['north', 'central']);
const RICE_REGIONS = new Set(['south', 'east', 'west', 'northeast']);
const CARB_DISH_TAGS = new Set(['paratha', 'bread', 'puri', 'naan', 'roti', 'dosa', 'idli', 'rice', 'pulao', 'biryani', 'khichdi', 'pasta', 'noodles', 'appam', 'puttu', 'upma']);
const NO_CARB_TAGS = new Set(['chaat', 'snacks', 'fried', 'street food', 'drink', 'tea', 'chai', 'beverage', 'sweet', 'dessert']);

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
  comfort: ['Papad', 'Salad'],
  salad: ['Green Salad', 'Kachumber'],
  fruit: ['Mixed Fruit', 'Seasonal Fruit'],
};

const TAG_BEVERAGE_PREFS: Record<string, string[]> = {
  'non-veg': ['Water', 'Chaas'],
  spicy: ['Chaas', 'Water'],
  summer: ['Chaas', 'Mango Lassi'],
  breakfast: ['Chai', 'Coffee', 'Milk'],
  healthy: ['Green Tea', 'Water'],
  comfort: ['Chaas', 'Chai'],
  salad: ['Water', 'Nimbu Pani'],
  fruit: ['Lassi', 'Nimbu Pani'],
};

const TAG_DESSERT_PREFS: Record<string, string[]> = {
  sweet: ['Gulab Jamun', 'Kheer'],
  dessert: ['Gulab Jamun', 'Kheer'],
  festival: ['Puran Poli', 'Modak'],
  seasonal: ['Gajar Halwa', 'Aamras'],
};

// ─── Feature Flag ────────────────────────────────────────────────────────────

export const ENABLE_SMART_SUGGESTIONS = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SELF_BREAD_TAGS = ['paratha', 'naan', 'roti', 'puri', 'bread', 'toast', 'pav', 'bhature', 'flatbread', 'thepla'];
const SELF_RICE_TAGS = ['rice', 'biryani', 'pulao', 'khichdi', 'chawal'];

function isSelfBread(tags: string[]): boolean {
  return tags.some(t => SELF_BREAD_TAGS.includes(t));
}

function isSelfRice(tags: string[]): boolean {
  return tags.some(t => SELF_RICE_TAGS.includes(t));
}

function isNoCarb(tags: string[]): boolean {
  return tags.some(t => NO_CARB_TAGS.has(t));
}

function resolveRegion(region: string): RegionKey {
  const known: RegionKey[] = ['north', 'south', 'west', 'east', 'central', 'northeast'];
  const r = region.toLowerCase() as RegionKey;
  return known.includes(r) ? r : 'north';
}

function shouldInferBread(id: string, tags: string[]): boolean {
  if (tags.some(t => CARB_DISH_TAGS.has(t))) return false;
  if (tags.some(t => NO_CARB_TAGS.has(t))) return false;
  const style = getDishStyle(id);
  if (style && !getStyleRouting(style).inferBread) return false;
  return true;
}

function shouldInferRice(id: string, tags: string[]): boolean {
  if (tags.some(t => ['rice', 'pulao', 'biryani', 'khichdi'].includes(t))) return false;
  if (tags.some(t => NO_CARB_TAGS.has(t))) return false;
  const style = getDishStyle(id);
  if (style && !getStyleRouting(style).inferRice) return false;
  return true;
}

// ─── Candidate Gatherers ─────────────────────────────────────────────────────

function gatherBreadCandidates(id: string, tags: string[], region: RegionKey): string[] {
  if (!shouldInferBread(id, tags)) return [];
  if (tags.some(t => TAG_BREAD_PREFS[t]?.length === 0)) return [];

  const style = getDishStyle(id);
  const tagPrefs = tags.flatMap(t => TAG_BREAD_PREFS[t] ?? []).filter(Boolean);
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];

  if (style) {
    const routing = getStyleRouting(style);
    if (routing.breads?.length) return routing.breads;
  }

  return REGION_BREADS[region] ?? REGION_BREADS['north'];
}

function gatherRiceCandidates(id: string, tags: string[], region: RegionKey): string[] {
  if (!shouldInferRice(id, tags)) return [];
  const style = getDishStyle(id);
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.rice?.length) return routing.rice;
  }
  return REGION_RICES[region] ?? REGION_RICES['north'];
}

function gatherSideCandidates(tags: string[], region: RegionKey, id: string): string[] {
  const tagPrefs = tags.flatMap(t => TAG_SIDE_PREFS[t] ?? []).filter(Boolean);
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];

  const style = getDishStyle(id);
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.sides?.length) return routing.sides;
  }

  const base = REGION_SIDES[region] ?? REGION_SIDES['north'];
  return base.slice(0, 3);
}

function gatherBeverageCandidates(tags: string[], region: RegionKey, id: string): string[] {
  const tagPrefs = tags.flatMap(t => TAG_BEVERAGE_PREFS[t] ?? []).filter(Boolean);
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];

  const style = getDishStyle(id);
  if (style) {
    const routing = getStyleRouting(style);
    if (routing.beverages?.length) return routing.beverages;
  }

  const base = REGION_BEVERAGES[region] ?? REGION_BEVERAGES['north'];
  return base.slice(0, 2);
}

function gatherDessertCandidates(tags: string[], region: RegionKey): string[] {
  const tagPrefs = tags.flatMap(t => TAG_DESSERT_PREFS[t] ?? []).filter(Boolean);
  if (tagPrefs.length > 0) return [...new Set(tagPrefs)];
  return REGION_SIDES[region]?.filter(s => s.toLowerCase().includes('halwa') || s.toLowerCase().includes('kheer')) ?? [];
}

// ─── suggestOne: pick top-1 from candidates ──────────────────────────────────

function suggestOne(candidates: string[], source: SuggestionSource): SuggestionCategoryResult {
  if (candidates.length > 0) {
    const item = candidates[0];
    if (item) return { items: [item], source };
  }
  return { items: [], source: 'fallback' };
}

function suggestMany(candidates: string[], max: number, source: SuggestionSource): SuggestionCategoryResult {
  if (candidates.length > 0) return { items: candidates.slice(0, max), source };
  return { items: [], source: 'fallback' };
}

// ─── fallbackSafe: guarantee non-empty using master list ─────────────────────

function fallbackSafe(category: keyof typeof indian_meal_categories, max: number): string[] {
  return indian_meal_categories[category].slice(0, max);
}

// ─── dedupUsedToday: filter out items already assigned to other slots ────────

function dedupUsedToday(
  items: string[],
  usedToday: string[] | undefined,
  category: keyof typeof indian_meal_categories,
  minRequired: number,
): string[] {
  if (!usedToday?.length) return items;
  const filtered = items.filter(i => !usedToday.includes(i));
  if (filtered.length >= minRequired) return filtered;
  return items;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

export function getSmartSuggestions(
  input: SmartSuggestionInput,
  slotType: MealType,
  options: SmartSuggestionOptions = {},
): SmartSuggestionResult {
  const { timeWindow: twOverride, useSmartSuggestions = ENABLE_SMART_SUGGESTIONS } = options;
  const usedToday = options.usedToday;

  if (!useSmartSuggestions) {
    return {
      bread: { items: [], source: 'fallback' },
      rice: { items: [], source: 'fallback' },
      sides: { items: [], source: 'fallback' },
      beverages: { items: [], source: 'fallback' },
      dessert: { items: [], source: 'fallback' },
      defaultQtys: {},
      meta: { featureFlag: false, dishStyle: undefined, region: input.region, timeWindow: 'dinner', season: getCurrentSeason(options.date), festival: getCurrentFestival(options.date) },
    };
  }

  const tags = input.tags ?? [];
  const region = resolveRegion(input.region);
  const timeWindow = twOverride ?? SLOT_TYPE_TIME_MAP[slotType] ?? getTimeWindow();
  const style = getDishStyle(input.id);
  const currentSeason = getCurrentSeason(options.date);
  const festival = getCurrentFestival(options.date);

  // ─── BREAD ──────────────────────────────────────────────────────────────
  // Priority: tags → style → region → fallback
  let bread: SuggestionCategoryResult;
  if (isSelfBread(tags) || isNoCarb(tags) || !shouldInferBread(input.id, tags)) {
    bread = { items: [], source: 'tag' };
  } else {
    const tagBreads = tags.flatMap(t => TAG_BREAD_PREFS[t] ?? []).filter(Boolean);
    if (tagBreads.length > 0) {
      const deduped = dedupUsedToday([...new Set(tagBreads)].slice(0, 1), usedToday, 'bread', 1);
      bread = { items: deduped.length > 0 ? deduped : [...new Set(tagBreads)].slice(0, 1), source: 'tag' };
    } else {
      const styleBreads = style ? getStyleRouting(style).breads ?? [] : [];
      if (styleBreads.length > 0) {
        const deduped = dedupUsedToday(styleBreads.slice(0, 1), usedToday, 'bread', 1);
        bread = { items: deduped.length > 0 ? deduped : styleBreads.slice(0, 1), source: 'style' };
      } else {
        const regionBreads = REGION_BREADS[region] ?? [];
        const regionItems = regionBreads.length > 0
          ? regionBreads.slice(0, 1)
          : fallbackSafe('bread', 1);
        const deduped = dedupUsedToday(regionItems, usedToday, 'bread', 1);
        bread = { items: deduped.length > 0 ? deduped : regionItems, source: 'region' };
      }
    }
  }

  // ─── RICE ───────────────────────────────────────────────────────────────
  // Priority: tags → region → style → fallback
  let rice: SuggestionCategoryResult;
  if (isSelfRice(tags) || isNoCarb(tags) || !shouldInferRice(input.id, tags)) {
    rice = { items: [], source: 'tag' };
  } else {
    const regionRices = REGION_RICES[region] ?? [];
    if (regionRices.length > 0) {
      const deduped = dedupUsedToday(regionRices.slice(0, 1), usedToday, 'rice', 1);
      rice = { items: deduped.length > 0 ? deduped : regionRices.slice(0, 1), source: 'region' };
    } else {
      const styleRices = style ? getStyleRouting(style).rice ?? [] : [];
      if (styleRices.length > 0) {
        const deduped = dedupUsedToday(styleRices.slice(0, 1), usedToday, 'rice', 1);
        rice = { items: deduped.length > 0 ? deduped : styleRices.slice(0, 1), source: 'style' };
      } else {
        rice = { items: fallbackSafe('rice', 1), source: 'smart_default' };
      }
    }
  }

  // ─── SIDES ──────────────────────────────────────────────────────────────
  let sides: SuggestionCategoryResult;
  {
    const tagSides = tags.flatMap(t => TAG_SIDE_PREFS[t] ?? []).filter(Boolean);
    if (tagSides.length > 0) {
      const deduped = dedupUsedToday([...new Set(tagSides)].slice(0, 2), usedToday, 'side', 1);
      sides = { items: deduped.length > 0 ? deduped : [...new Set(tagSides)].slice(0, 2), source: 'tag' };
    } else {
      const styleSides = style ? getStyleRouting(style).sides ?? [] : [];
      if (styleSides.length > 0) {
        const deduped = dedupUsedToday(styleSides.slice(0, 2), usedToday, 'side', 1);
        sides = { items: deduped.length > 0 ? deduped : styleSides.slice(0, 2), source: 'style' };
      } else {
        const regionSides = REGION_SIDES[region] ?? [];
        const regionItems = regionSides.length > 0
          ? regionSides.slice(0, 2)
          : fallbackSafe('side', 2);
        const deduped = dedupUsedToday(regionItems, usedToday, 'side', 1);
        sides = { items: deduped.length > 0 ? deduped : regionItems, source: 'region' };
      }
    }
  }

  // ─── BEVERAGES ──────────────────────────────────────────────────────────
  // Max 1 beverage — user adds more if they want.
  let beverages: SuggestionCategoryResult;
  {
    const timeBevs = TIME_BEVERAGE_MAP[timeWindow] ?? [];
    if (timeBevs.length >= 1) {
      const deduped = dedupUsedToday(timeBevs.slice(0, 1), usedToday, 'beverage', 1);
      beverages = { items: deduped.length > 0 ? deduped : timeBevs.slice(0, 1), source: 'timeWindow' };
    } else {
      const tagBevs = tags.flatMap(t => TAG_BEVERAGE_PREFS[t] ?? []).filter(Boolean);
      if (tagBevs.length > 0) {
        const deduped = dedupUsedToday([...new Set(tagBevs)].slice(0, 1), usedToday, 'beverage', 1);
        beverages = { items: deduped.length > 0 ? deduped : [...new Set(tagBevs)].slice(0, 1), source: 'tag' };
      } else {
        const styleBevs = style ? getStyleRouting(style).beverages ?? [] : [];
        if (styleBevs.length > 0) {
          const deduped = dedupUsedToday(styleBevs.slice(0, 1), usedToday, 'beverage', 1);
          beverages = { items: deduped.length > 0 ? deduped : styleBevs.slice(0, 1), source: 'style' };
        } else {
          const regionBevs = REGION_BEVERAGES[region] ?? [];
          const regionItems = regionBevs.length > 0
            ? regionBevs.slice(0, 1)
            : fallbackSafe('beverage', 1);
          const deduped = dedupUsedToday(regionItems, usedToday, 'beverage', 1);
          beverages = { items: deduped.length > 0 ? deduped : regionItems, source: 'region' };
        }
      }
    }
  }

  // ─── DESSERT ────────────────────────────────────────────────────────────
  // Only auto-suggest dessert for dinner; other meal types get none by default.
  // Priority: tags → festival → season → region → fallback
  let dessert: SuggestionCategoryResult;
  if (slotType !== 'dinner') {
    dessert = { items: [], source: 'tag' };
  } else {
    const tagDesserts = tags.flatMap(t => TAG_DESSERT_PREFS[t] ?? []).filter(Boolean);
    if (tagDesserts.length > 0) {
      const deduped = dedupUsedToday([...new Set(tagDesserts)].slice(0, 1), usedToday, 'dessert', 1);
      dessert = { items: deduped.length > 0 ? deduped : [...new Set(tagDesserts)].slice(0, 1), source: 'tag' };
    } else if (festival) {
      const festItems = FESTIVAL_DESSERT_MAP[festival] ?? [];
      const items = festItems.length > 0 ? festItems : fallbackSafe('dessert', 1);
      const deduped = dedupUsedToday(items.slice(0, 1), usedToday, 'dessert', 1);
      dessert = { items: deduped.length > 0 ? deduped : items.slice(0, 1), source: 'season' };
    } else {
      const seasonDesserts = SEASON_DESSERT_MAP[currentSeason] ?? [];
      if (seasonDesserts.length > 0) {
        const deduped = dedupUsedToday(seasonDesserts.slice(0, 1), usedToday, 'dessert', 1);
        dessert = { items: deduped.length > 0 ? deduped : seasonDesserts.slice(0, 1), source: 'season' };
      } else {
        const regionDesserts = gatherDessertCandidates(tags, region);
        const regionItems = regionDesserts.length > 0
          ? regionDesserts.slice(0, 1)
          : fallbackSafe('dessert', 1);
        const deduped = dedupUsedToday(regionItems, usedToday, 'dessert', 1);
        dessert = { items: deduped.length > 0 ? deduped : regionItems, source: 'region' };
      }
    }
  }

  // ─── DEFAULT QUANTITIES ─────────────────────────────────────────────────
  const defaultQtys: Record<string, number> = {};
  for (const item of [...bread.items, ...rice.items, ...sides.items, ...beverages.items, ...dessert.items]) {
    defaultQtys[item] = 1;
  }

  return {
    bread,
    rice,
    sides,
    beverages,
    dessert,
    defaultQtys,
    meta: { featureFlag: useSmartSuggestions, dishStyle: style, region: input.region, timeWindow, season: currentSeason, festival },
  };
}

import type { Meal, MealType, TrayItem, TrayItemDefaults } from '../../../types/tray';
import { getDishStyle } from '../../../meal/constants/dishStyles';
import {
  normalizeCategory,
  deduplicateSides,
  pickBestCarb,
  pickBestBeverage,
  dishImpliesCarb,
  isStandaloneDish,
  isRotiLike,
  isBreadLike,
  detectEmbeddedCarb,
} from '../../../utils/normalizeMealComponents';

const CARB_DISH_TAGS = new Set(['paratha', 'bread', 'puri', 'naan', 'roti', 'dosa', 'idli', 'rice', 'pulao', 'biryani', 'khichdi', 'pasta', 'noodles', 'appam', 'puttu', 'upma']);
const ROTI_REGIONS = new Set(['north', 'central']);
const RICE_REGIONS = new Set(['south', 'east', 'west', 'northeast']);

export function applySmartDefaults(
  meal: Meal,
  _slotType: MealType,
  existingItem?: TrayItem,
  _options?: { useSmartSuggestions?: boolean },
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

  // ─── PRIORITY 1: Explicit defaultPairings from dishToMeal ─────
  if (meal.defaultPairings) {
    const dp = meal.defaultPairings;
    let sides = dp.sides ?? [];
    let beverages = dp.beverages ?? [];
    const dessert = dp.dessert ?? [];

    // ─── DEDUPLICATE: Collapse aliases within each category ──
    sides = deduplicateSides(sides);
    beverages = deduplicateSides(beverages);

    // ─── CROSS-CATEGORY: If a side normalizes to the same as a beverage (e.g. Chaas→Buttermilk), remove from sides ──
    const bevNormals = new Set(beverages.map(normalizeCategory));
    sides = sides.filter(s => !bevNormals.has(normalizeCategory(s)));

    // ─── GUARDRAIL: Seed carb from meal options when not in explicit defaults ──
    // 1. Only for lunch/dinner dishes (meal.rotiOptions/riceOptions are set)
    // 2. Never override explicitly set dp.roti/dp.rice (including explicit null = no carb)
    // 3. Self-bread/self-rice dishes have options undefined → skipped automatically
    const explicitRotiNull = dp && 'roti' in dp && dp.roti === null;
    const explicitRiceNull = dp && 'rice' in dp && dp.rice === null;
    const seededRoti = explicitRotiNull ? null : (dp.roti ?? (meal.rotiOptions?.length ? normalizeCategory(meal.rotiOptions[0]!) : null));
    const seededRice = explicitRiceNull ? null : (dp.rice ?? (!seededRoti && meal.riceOptions?.length ? normalizeCategory(meal.riceOptions[0]!) : null));

    const itemQtys: Record<string, number> = {};
    for (const item of [seededRoti, seededRice, ...sides, ...beverages, ...dessert].filter((s): s is string => s != null)) {
      itemQtys[item] = 1;
    }
    return {
      gravy: dp.gravy ?? null,
      roti: seededRoti,
      rice: seededRice,
      sides,
      beverages,
      dessert,
      itemQtys,
    };
  }

  const gravy = meal.baseGravy
    ?? meal.gravyOptions?.[0]
    ?? null;

  // ─── KITCHEN LOGIC: Context-aware carb assignment ──
  // Rule 1: Skip carbs for standalone dishes (chilla, thukpa, stir-fry, beverages, etc.)
  // Rule 2: Skip carbs if dish name implies it already has carbs (chawal, dosa, pulao, etc.)
  // Rule 3: NEVER assign carbs to beverages — they get light accompaniments only
  const standalone = isStandaloneDish(meal.name, meal.tags);
  const dishHasCarb = dishImpliesCarb(meal.name);
  const style = meal.id ? getDishStyle(meal.id) : undefined;
  const isBeverageStyle = style === 'beverage';

  // ─── EARLY EXIT: Beverages get ZERO carbs, light sides only ──
  if (isBeverageStyle) {
    const beverageSides = ['Biscuits', 'Cookies', 'Rusk', 'Bun Maska', 'Roasted Peanuts'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    const sides = availableSides.length > 0 ? deduplicateSides(availableSides) : beverageSides.slice(0, 2);

    const itemQtys: Record<string, number> = {};
    for (const item of sides) {
      itemQtys[item] = 1;
    }

    return { gravy, roti: null, rice: null, sides, beverages: [], dessert: [], itemQtys };
  }

  // ─── EARLY EXIT: Standalone dishes (chilla, thukpa, etc.) get ZERO carbs ──
  if (standalone) {
    const style = meal.id ? getDishStyle(meal.id) : undefined;
    const isStyleStandalone = style && ['sweet-dessert', 'side'].includes(style);
    const isBeverageStyle = style === 'beverage';
    const isSouthBreakfast = (meal.region === 'south' && (meal.tags?.some(t => ['breakfast', 'light', 'idli', 'dosa'].includes(t)) ?? false)) ?? false;

    let sides: string[] = [];
    let beverages: string[] = [];
    const dessert: string[] = [];

    if (isBeverageStyle) {
      const beverageSides = ['Biscuits', 'Cookies', 'Rusk', 'Bun Maska', 'Roasted Peanuts'];
      const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
      sides = availableSides.length > 0 ? deduplicateSides(availableSides) : beverageSides.slice(0, 2);
    } else if (isSouthBreakfast) {
      const southSides = ['Sambar', 'Coconut Chutney'];
      const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
      sides = availableSides.length > 0 ? deduplicateSides(availableSides) : southSides;
      const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
      let bestBev = pickBestBeverage(allBevs);
      if (!bestBev) bestBev = 'Coffee';
      beverages = [bestBev];
    } else if (!isStyleStandalone) {
      const allSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
      sides = deduplicateSides(allSides);
      if (sides.length === 0) {
        const region = meal.region || 'north';
        const regionSides: Record<string, string[]> = {
          north: ['Raita', 'Salad'],
          south: ['Papad', 'Pickle'],
          east: ['Salad', 'Pickle'],
          west: ['Salad', 'Pickle'],
          central: ['Salad', 'Pickle'],
          northeast: ['Salad', 'Pickle'],
        };
        sides = (regionSides[region] ?? regionSides.north!).slice(0, 2);
      }
      const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
      let bestBev = pickBestBeverage(allBevs);
      if (!bestBev) {
        const slotBevs: Record<string, string> = {
          breakfast: 'Coffee',
          lunch: 'Buttermilk',
          snacks: 'Buttermilk',
          dinner: 'Buttermilk',
        };
        bestBev = slotBevs[_slotType] ?? 'Buttermilk';
      }
      beverages = [bestBev];
    }

    const itemQtys: Record<string, number> = {};
    for (const item of [...sides, ...beverages, ...dessert].filter((s): s is string => s != null)) {
      itemQtys[item] = 1;
    }

    return { gravy, roti: null, rice: null, sides, beverages, dessert, itemQtys };
  }

  let roti: string | null = null;
  let rice: string | null = null;

  // SOUP & SNACKS: skip carbs entirely
  const isSoupStyle_check = (style === 'soup') || meal.name.toLowerCase().includes('soup') || ['rasam', 'shorba'].some(s => meal.name.toLowerCase().includes(s));
  const isSnacksSlot = _slotType === 'snacks';

  if (!standalone && !dishHasCarb && !isSoupStyle_check && !isSnacksSlot) {
    // Only infer carbs for dishes that need them
    const explicitRoti = (meal.rotiOptions?.length ?? 0) > 0;
    const explicitRice = (meal.riceOptions?.length ?? 0) > 0;
    const selfCarb = meal.tags?.some(t => CARB_DISH_TAGS.has(t)) ?? false;
    const isLightCarb = meal.tags?.includes('light_carb') ?? false;

    if (!selfCarb) {
      const region = meal.region || 'north';

      // Collect all carb options
      const allCarbs: string[] = [];
      if (explicitRoti && meal.rotiOptions) allCarbs.push(...meal.rotiOptions);
      if (explicitRice && meal.riceOptions) allCarbs.push(...meal.riceOptions);

      // Slot-type-specific logic
      if (_slotType === 'snacks' && !isLightCarb) {
        // Skip heavy carbs in snacks, but allow light carbs
        const lightCarbs = allCarbs.filter(c => {
          const lower = c.toLowerCase();
          return !['naan', 'butter naan', 'garlic naan', 'tandoori naan', 'biryani', 'fried rice', 'pulao'].some(hc => lower.includes(hc));
        });
        if (lightCarbs.length > 0) {
          const bestLight = pickBestCarb(lightCarbs, region) ?? lightCarbs[0]!;
          if (isRotiLike(bestLight) || isBreadLike(bestLight)) {
            roti = bestLight;
          } else {
            rice = bestLight;
          }
        } else {
          roti = null;
          rice = null;
        }
      } else if (_slotType === 'breakfast' && allCarbs.length > 0) {
        // Prefer light carbs for breakfast
        const lightCarbs = allCarbs.filter(c => {
          const lower = c.toLowerCase();
          return ['paratha', 'idli', 'dosa', 'poha', 'upma', 'puttu', 'appam', 'pongal'].some(lc => lower.includes(lc));
        });
        if (lightCarbs.length > 0) {
          const bestLight = pickBestCarb(lightCarbs, region) ?? lightCarbs[0]!;
          if (isRotiLike(bestLight) || isBreadLike(bestLight)) {
            roti = bestLight;
          } else {
            rice = bestLight;
          }
        } else {
          // Fallback to region logic
          const bestCarb = pickBestCarb(allCarbs, region);
          if (bestCarb) {
            if (isRotiLike(bestCarb) || isBreadLike(bestCarb)) {
              roti = bestCarb;
            } else {
              rice = bestCarb;
            }
          }
        }
      } else {
        // Normal logic: pick best carb based on region
        const bestCarb = pickBestCarb(allCarbs, region);
        if (bestCarb) {
          if (isRotiLike(bestCarb) || isBreadLike(bestCarb)) {
            roti = bestCarb;
          } else {
            rice = bestCarb;
          }
        } else if (ROTI_REGIONS.has(region)) {
          // Fallback: North gets roti, others get rice
          roti = explicitRoti ? normalizeCategory(meal.rotiOptions![0]!) : 'Wheat Roti';
        } else {
          rice = explicitRice ? normalizeCategory(meal.riceOptions![0]!) : 'Rice';
        }
      }
    }
  } else if (!standalone && dishHasCarb) {
    // Dish already has embedded carb (e.g., "Rajma Chawal", "Aloo Gobhi with Phulka")
    // Set the carb to match the detected embedded carb so UI pre-selects correctly
    const embedded = detectEmbeddedCarb(meal.name);
    if (embedded) {
      if (isRotiLike(embedded) || isBreadLike(embedded)) {
        roti = embedded;
      } else {
        rice = embedded;
      }
    }
  }

  // ─── KITCHEN LOGIC: Sides & Beverages with deduplication ──
  const isStyleStandalone = style && ['sweet-dessert', 'side'].includes(style);
  const isBreadStyle = style === 'bread';
  const isSoupStyle = style === 'soup';
  const isStreetFood = (meal.tags?.some(t => ['street food', 'chaat', 'fried', 'snacks'].includes(t)) ?? false);
  const isBiryani = (meal.tags?.some(t => ['biryani', 'pulao', 'rice-biryani'].includes(t)) ?? false);
  const isSouthBreakfast = (meal.region === 'south' && (meal.tags?.some(t => ['breakfast', 'light', 'idli', 'dosa'].includes(t)) ?? false));
  const isIndianSoup = meal.region && ['north', 'south', 'east', 'west', 'central', 'northeast'].includes(meal.region) &&
    (meal.name.toLowerCase().includes('rasam') || meal.name.toLowerCase().includes('shorba') || meal.name.toLowerCase().includes('soup'));
  const isWesternSoup = meal.name.toLowerCase().includes('tomato') || meal.name.toLowerCase().includes('mushroom') || meal.name.toLowerCase().includes('corn soup');

  let sides: string[] = [];
  let beverages: string[] = [];
  const dessert: string[] = [];

  if (isBeverageStyle) {
    // ─── BEVERAGE-SPECIFIC SIDES (chai accompaniments) ──
    const beverageSides = ['Biscuits', 'Cookies', 'Rusk', 'Bun Maska', 'Roasted Peanuts'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = availableSides.length > 0 ? deduplicateSides(availableSides) : beverageSides.slice(0, 2);
    beverages = [];
  } else if (isSouthBreakfast) {
    // ─── SOUTH INDIAN BREAKFAST (idli, dosa, appam) ──
    const southSides = ['Sambar', 'Coconut Chutney'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = availableSides.length > 0 ? deduplicateSides(availableSides) : southSides;
    // Filter coffee for South breakfast
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);
    if (!bestBev) bestBev = 'Coffee';
    beverages = [bestBev];
  } else if (isBiryani) {
    // ─── BIRYANI — raita is essential ──
    const biryaniSides = ['Cucumber Raita', 'Mirchi Ka Salan'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = availableSides.length > 0 ? deduplicateSides(availableSides) : biryaniSides;
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);
    if (!bestBev) bestBev = 'Buttermilk';
    beverages = [bestBev];
  } else if (isStreetFood) {
    // ─── STREET FOOD — chutney trio ──
    const streetSides = ['Tamarind Chutney', 'Mint Chutney'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = availableSides.length > 0 ? deduplicateSides(availableSides) : streetSides;
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);
    if (!bestBev) bestBev = 'Chai';
    beverages = [bestBev];
  } else if (isSoupStyle) {
    // ─── SOUP — Indian (rice/papad) vs Western (bread) ──
    if (isWesternSoup) {
      // Western soups pair with bread
      sides = ['Garlic Naan'];
    } else if (isIndianSoup) {
      // Indian soups pair with rice or papad
      sides = ['Rice', 'Papad'];
    } else {
      // Generic soup
      sides = ['Papad'];
    }
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);
    if (!bestBev) bestBev = 'Buttermilk';
    beverages = [bestBev];
  } else if (isBreadStyle) {
    // ─── BREAD STYLE (paratha, puri, bhatura) — sides + beverage ──
    const breadSides = ['Curd', 'Pickle'];
    const availableSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = availableSides.length > 0 ? deduplicateSides(availableSides) : breadSides;
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);
    if (!bestBev) {
      const slotBevs: Record<string, string> = {
        breakfast: 'Chai',
        lunch: 'Buttermilk',
        snacks: 'Chai',
        dinner: 'Buttermilk',
      };
      bestBev = slotBevs[_slotType] ?? 'Buttermilk';
    }
    beverages = [bestBev];
  } else if (!isStyleStandalone) {
    // Deduplicate sides by category, cap at 2
    const allSides = [...new Set([...(meal.sideOptions ?? []), ...(meal.suggestedPairings?.sides ?? [])])];
    sides = deduplicateSides(allSides);

    // Fallback: infer region-appropriate sides if none found
    if (sides.length === 0) {
      const region = meal.region || 'north';
      const regionSides: Record<string, string[]> = {
        north: ['Raita', 'Salad'],
        south: ['Papad', 'Pickle'],
        east: ['Salad', 'Pickle'],
        west: ['Salad', 'Pickle'],
        central: ['Salad', 'Pickle'],
        northeast: ['Salad', 'Pickle'],
      };
      sides = (regionSides[region] ?? regionSides.north!).slice(0, 2);
    }

    // Pick best beverage, normalize
    const allBevs = [...new Set([...(meal.beverageOptions ?? []), ...(meal.suggestedPairings?.beverages ?? [])])];
    let bestBev = pickBestBeverage(allBevs);

    // Fallback: infer slot-appropriate beverage if none found
    if (!bestBev) {
      const slotBevs: Record<string, string> = {
        breakfast: 'Coffee',
        lunch: 'Buttermilk',
        snacks: 'Buttermilk',
        dinner: 'Buttermilk',
      };
      bestBev = slotBevs[_slotType] ?? 'Buttermilk';
    }
    beverages = [bestBev];
  }

  const itemQtys: Record<string, number> = {};
  for (const item of [roti, rice, ...sides, ...beverages, ...dessert].filter((s): s is string => s != null)) {
    itemQtys[item] = 1;
  }

  return { gravy, roti, rice, sides, beverages, dessert, itemQtys };
}

import { GravyType, DISH_LIBRARY, type Dish, type DishVariant } from '../constants/dishLibrary';
import type { Meal } from '../types/tray';
import { resolveDisplayName } from './resolveDisplayName';
import { computePairingForDish } from '../src/data/pairingEngine';
import { getDishStyle } from '../constants/dishStyles';

type DishRole = 'beverage' | 'main' | 'starter' | 'dessert' | 'bread' | 'rice' | 'side' | 'other';

const SIGNAL_TAGS = new Set([
  'indian-chinese', 'chinese', 'north-indian', 'south-indian', 'punjabi',
  'gujarati', 'malabar', 'kerala', 'tamil', 'andhra', 'bengali',
  'maharashtrian', 'rajasthani', 'kashmiri', 'hyderabadi', 'mughlai',
  'northeast', 'tibetan', 'goan', 'awadhi',
  'starter', 'main', 'dessert', 'beverage', 'bread', 'side', 'snacks',
  'gravy', 'dry', 'fried', 'steamed', 'roasted', 'baked', 'grilled',
  'soup', 'salad', 'chaat', 'street-food', 'one-pot', 'combo',
]);

const SELF_BREAD = ['paratha', 'naan', 'roti', 'puri', 'bread', 'toast', 'pav', 'bhature', 'flatbread', 'thepla'];
const SELF_RICE = ['rice', 'biryani', 'pulao', 'khichdi', 'chawal'];
const MAIN_DISH = ['gravy', 'curry', 'sabzi', 'dal', 'lentils', 'kofta', 'stew'];
const STANDALONE_STYLES = new Set(['beverage', 'sweet-dessert', 'bread', 'side']);

const SIMILARITY_MIN_SCORE = 6;

const ROLE_STARTER_TAGS = new Set(['starter', 'fried', 'indian-chinese', 'chaat', 'street-food', 'snacks', 'crispy', 'dumplings']);

function classifyDishRole(dish: Dish): DishRole {
  const style = getDishStyle(dish.id);
  if (style === 'beverage') return 'beverage';
  if (style === 'sweet-dessert') return 'dessert';
  if (style === 'bread') return 'bread';
  if (style === 'rice-biryani') return 'rice';
  if (style === 'side') return 'side';
  if (style === 'soup' || style === 'fry-tadka' || style === 'steam-boil') return 'starter';
  if (dish.tags.includes('beverage') || dish.tags.includes('tea') || dish.tags.includes('coffee')) return 'beverage';
  if (dish.tags.includes('dessert') || dish.tags.includes('sweet')) return 'dessert';
  if (dish.tags.some(t => ROLE_STARTER_TAGS.has(t))) return 'starter';
  if (SELF_BREAD.some(t => dish.tags.includes(t))) return 'bread';
  if (SELF_RICE.some(t => dish.tags.includes(t))) return 'rice';
  if (dish.tags.some(t => ['salad', 'side', 'raita', 'chutney', 'pickle', 'papad', 'accompaniment'].includes(t))) return 'side';
  if (dish.category.includes('lunch') || dish.category.includes('dinner')) return 'main';
  return 'other';
}

function rolesMatch(a: DishRole, b: DishRole): boolean {
  if (a === 'other' || b === 'other') return false;
  return a === b;
}

const roleCache = new Map<string, DishRole>();

function dishRole(dish: Dish): DishRole {
  const cached = roleCache.get(dish.id);
  if (cached) return cached;
  const role = classifyDishRole(dish);
  roleCache.set(dish.id, role);
  return role;
}

const nearestPairingCache = new Map<string, Meal['defaultPairings']>();

function findNearestDefaultPairings(dish: Dish): Meal['defaultPairings'] {
  const cached = nearestPairingCache.get(dish.id);
  if (cached !== undefined) return cached;

  const inputRole = dishRole(dish);
  if (inputRole === 'other') {
    nearestPairingCache.set(dish.id, undefined);
    return undefined;
  }

  let bestScore = 0;
  let best: Meal['defaultPairings'] = undefined;

  for (const candidate of DISH_LIBRARY) {
    if (candidate.id === dish.id) continue;
    if (!candidate.defaultPairings) continue;
    const candidateRole = dishRole(candidate);
    if (!rolesMatch(inputRole, candidateRole)) continue;

    let score = 0;
    if (candidate.region === dish.region) score += 3;
    const candidateStyle = getDishStyle(candidate.id);
    const dishStyle = getDishStyle(dish.id);
    if (dishStyle && candidateStyle && dishStyle === candidateStyle) score += 5;
    for (const tag of dish.tags) {
      if (SIGNAL_TAGS.has(tag) && candidate.tags.includes(tag)) score += 2;
    }
    for (const tag of dish.tags) {
      if (!SIGNAL_TAGS.has(tag) && candidate.tags.includes(tag)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate.defaultPairings;
    }
  }

  if (bestScore < SIMILARITY_MIN_SCORE) {
    best = undefined;
  }

  nearestPairingCache.set(dish.id, best);
  return best;
}

function mealRegion(region: Dish['region']): Meal['region'] {
  return region === 'all' ? 'north' : region;
}

export function dishToMeal(dish: Dish, variant?: DishVariant): Meal {
  const style = getDishStyle(dish.id);
  const isStandalone = style ? STANDALONE_STYLES.has(style) : false;

  const isSelfBread = SELF_BREAD.some(t => dish.tags.includes(t));
  const isSelfRice = SELF_RICE.some(t => dish.tags.includes(t));
  const isMainDish = MAIN_DISH.some(t => dish.tags.includes(t));
  const isLunchOrDinner = dish.category.some(c => c === 'lunch' || c === 'dinner');
  const hasBreadPairing = dish.variants.some(v =>
    v.addOn?.includes('roti') || v.name?.toLowerCase().includes('with roti')
    || v.name?.toLowerCase().includes('with naan') || v.name?.toLowerCase().includes('with paratha')
  );
  const hasRicePairing = dish.variants.some(v =>
    v.addOn?.includes('rice') || v.name?.toLowerCase().includes('with rice')
  );

  const fullName = resolveDisplayName(dish.name, variant ?? dish.variants?.[0]);

  // ─── PRIORITY 1: Explicit defaultPairings on the dish ──────────
  if (dish.defaultPairings) {
    return {
      id: dish.id,
      name: fullName,
      icon: dish.icon,
      region: mealRegion(dish.region),
      baseGravy: dish.defaultPairings.gravy ?? dish.gravyType ? String(dish.gravyType) : undefined,
      gravyOptions: dish.gravyType
        ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
        : undefined,
      rotiOptions: dish.defaultPairings.roti ? [dish.defaultPairings.roti] : undefined,
      riceOptions: dish.defaultPairings.rice ? [dish.defaultPairings.rice] : undefined,
      sideOptions: dish.defaultPairings.sides?.length ? dish.defaultPairings.sides : undefined,
      beverageOptions: undefined,
      defaultPairings: dish.defaultPairings,
      suggestedPairings: {
        sides: dish.defaultPairings.sides ?? [],
        beverages: dish.defaultPairings.beverages ?? [],
      },
      tags: dish.tags,
    };
  }

  // ─── PRIORITY 2: Nearest-dish similarity fallback ──────────────
  const nearest = findNearestDefaultPairings(dish);
  if (nearest) {
    return {
      id: dish.id,
      name: fullName,
      icon: dish.icon,
      region: mealRegion(dish.region),
      baseGravy: nearest.gravy ?? dish.gravyType ? String(dish.gravyType) : undefined,
      gravyOptions: dish.gravyType
        ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
        : undefined,
      rotiOptions: nearest.roti ? [nearest.roti] : undefined,
      riceOptions: nearest.rice ? [nearest.rice] : undefined,
      sideOptions: nearest.sides?.length ? nearest.sides : undefined,
      beverageOptions: undefined,
      defaultPairings: nearest,
      suggestedPairings: {
        sides: nearest.sides ?? [],
        beverages: nearest.beverages ?? [],
      },
      tags: dish.tags,
    };
  }

  // ─── PRIORITY 3: Legacy inference (last resort) ────────────────
  const showBread = (isMainDish || hasBreadPairing || (isLunchOrDinner && !isSelfBread && !isSelfRice)) && !isSelfBread;
  const rotiOptions = showBread ? ['Roti', 'Naan', 'Paratha', 'Tandoori Roti', 'Puri'] : undefined;

  const showRice = (isMainDish || hasRicePairing || (isLunchOrDinner && !isSelfRice && !isSelfBread)) && !isSelfRice;
  const riceOptions = showRice ? ['Steamed Rice', 'Jeera Rice', 'Pulao', 'Biryani'] : undefined;

  const pairing = computePairingForDish(dish);

  let sideOptions: string[] | undefined;
  if (!isStandalone) {
    const sideAccompaniments = [...new Set(dish.variants.flatMap(v => v.accompaniments ?? []))];
    const allVariantAddOns = [...new Set(dish.variants.map(v => v.addOn).filter(Boolean))] as string[];
    const allSideItems = [...sideAccompaniments];
    for (const addOn of allVariantAddOns) {
      for (const item of addOn.replace(/^with\s+/i, '').split('/').map(s => s.trim()).filter(Boolean)) {
        const lower = item.toLowerCase();
        const isBread = SELF_BREAD.includes(lower) || lower.includes('roti') || lower.includes('naan') || lower.includes('paratha') || lower.includes('pav') || lower.includes('bread') || lower.includes('puri') || lower.includes('kulcha') || lower.includes('bhature');
        const isRice = SELF_RICE.includes(lower) || lower.includes('rice');
        const isSpecial = ['standalone', 'thali set', 'light portion', 'rumali roti'].includes(lower);
        if (!isBread && !isRice && !isSpecial) {
          const capped = item.charAt(0).toUpperCase() + item.slice(1);
          if (!allSideItems.some(s => s.toLowerCase() === capped.toLowerCase())) allSideItems.push(capped);
        }
      }
    }
    const isSnack = dish.category.some(c => c === 'snacks') && !dish.category.includes('breakfast');
    if (isSnack && allSideItems.length === 0) {
      allSideItems.push('Chutney', 'Onion');
    }
    if (dish.tags.includes('salad') && !allSideItems.some(s => s.toLowerCase().includes('salad'))) {
      allSideItems.push('Green Salad', 'Kachumber');
    }
    if (dish.tags.includes('fruit') && !allSideItems.some(s => s.toLowerCase().includes('fruit'))) {
      allSideItems.push('Mixed Fruit', 'Seasonal Fruit');
    }
    sideOptions = allSideItems.length > 0 ? allSideItems : undefined;
  } else {
    sideOptions = undefined;
  }

  const beverageOptions = pairing.beverage ? [pairing.beverage] : ['Chaas', 'Nimbu Pani', 'Masala Chai'];

  const finalSides = isStandalone
    ? pairing.sides
    : [...new Set([...(sideOptions ?? []), ...pairing.sides])].slice(0, 2);

  return {
    id: dish.id,
    name: fullName,
    icon: dish.icon,
    region: mealRegion(dish.region),
    baseGravy: dish.gravyType ? String(dish.gravyType) : undefined,
    gravyOptions: dish.gravyType
      ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
      : undefined,
    rotiOptions,
    riceOptions,
    sideOptions,
    beverageOptions,
    suggestedPairings: {
      sides: finalSides,
      beverages: pairing.beverage ? [pairing.beverage] : [],
    },
    tags: dish.tags,
  };
}

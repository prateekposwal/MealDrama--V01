import { GravyType, type Dish, type DishVariant } from '../meal/constants/dishLibrary';
import type { Meal } from '../types/tray';
import { resolveDisplayName } from './resolveDisplayName';

const SELF_BREAD = ['paratha', 'naan', 'roti', 'puri', 'bread', 'toast', 'pav', 'bhature', 'flatbread', 'thepla'];
const SELF_RICE = ['rice', 'biryani', 'pulao', 'khichdi', 'chawal'];

interface TemplateRule {
  match: (tags: string[]) => boolean;
  pairings: Meal['defaultPairings'];
}

const TEMPLATES: TemplateRule[] = [
  {
    match: (tags) => tags.some(t => ['pasta', 'spaghetti', 'penne', 'fettuccine', 'lasagna', 'macaroni', 'marinara'].includes(t)),
    pairings: { sides: ['Side Salad', 'Garlic Bread'], beverages: ['Iced Tea'] },
  },
  {
    match: (tags) => tags.some(t => ['soup', 'broth', 'chowder'].includes(t)),
    pairings: { sides: ['Crusty Bread', 'Lemon Wedge'], beverages: [] },
  },
  {
    match: (tags) => tags.some(t => ['salad', 'greens', 'bowl'].includes(t) && !t.includes('pasta')),
    pairings: { sides: ['Lemon Wedge', 'Breadstick'], beverages: ['Iced Tea'] },
  },
  {
    match: (tags) => tags.some(t => ['mexican', 'taco', 'burrito', 'quesadilla', 'enchilada'].includes(t)),
    pairings: { sides: ['Salsa', 'Guacamole'], beverages: ['Lime Water'] },
  },
  {
    match: (tags) => tags.some(t => ['chinese', 'indian-chinese', 'noodles', 'manchurian', 'chow-mein'].includes(t) && !tags.includes('pasta')),
    pairings: { sides: ['Dipping Sauce', 'Spring Onion'], beverages: ['Iced Tea'] },
  },
  {
    match: (tags) => tags.some(t => ['sandwich', 'wrap', 'burger', 'sub'].includes(t)),
    pairings: { sides: ['French Fries', 'Coleslaw'], beverages: ['Iced Tea'] },
  },
  {
    match: (tags) => tags.some(t => ['pizza', 'flatbread'].includes(t) && !tags.includes('naan')),
    pairings: { sides: ['Garlic Bread', 'Salad'], beverages: ['Iced Tea'] },
  },
  {
    match: (tags) => tags.some(t => ['pancakes', 'french-toast', 'waffles', 'crepe'].includes(t)),
    pairings: { sides: ['Maple Syrup', 'Fresh Berries'], beverages: ['Coffee'] },
  },
  {
    match: (tags) => tags.some(t => ['smoothie', 'shake', 'milkshake'].includes(t)),
    pairings: { sides: [], beverages: [] },
  },
  {
    match: (tags) => tags.some(t => ['porridge', 'oatmeal', 'cereal', 'muesli', 'granola'].includes(t)),
    pairings: { sides: ['Fresh Fruit', 'Nuts'], beverages: ['Coffee'] },
  },
  {
    match: (tags) => tags.some(t => ['dal', 'lentils', 'dal-tadka'].includes(t)),
    pairings: { sides: ['Rice', 'Roti'], beverages: ['Chaas'] },
  },
  {
    match: (tags) => tags.some(t => ['idli', 'dosa', 'vada', 'uttapam', 'appam'].includes(t)),
    pairings: { sides: ['Sambar', 'Coconut Chutney'], beverages: ['Coffee'] },
  },
  {
    match: (tags) => tags.includes('juice'),
    pairings: { sides: [], beverages: [] },
  },
  {
    match: (tags) => tags.some(t => ['paratha', 'puri', 'bhature'].includes(t)),
    pairings: { sides: ['Pickle', 'Yogurt'], beverages: ['Masala Chai'] },
  },
  {
    match: (tags) => tags.some(t => ['sandwich', 'toast'].includes(t)),
    pairings: { sides: ['Ketchup', 'Green Chutney'], beverages: ['Masala Chai'] },
  },
  // ─── Tea template (all tea varieties: masala, butter, elaichi, ginger, etc.) ───
  {
    match: (tags) => tags.includes('tea'),
    pairings: { sides: ['Biscuits', 'Cookies', 'Namkeen', 'Roasted Peanuts'], beverages: [] },
  },
  // ─── Milk beverage template (kesar milk, doodh soda, haldi doodh, etc.) ───
  {
    match: (tags) => tags.includes('milk') && tags.includes('beverage'),
    pairings: { sides: ['Rusk', 'Biscuits', 'Dry Fruit Mix'], beverages: [] },
  },
  // ─── Kheer template (all kheer/payasam desserts) ───
  {
    match: (tags) => tags.includes('kheer'),
    pairings: { sides: ['Saffron', 'Dry Fruit Mix'], beverages: ['Filter Coffee'] },
  },
  // ─── Indian mains fallback (sabzi/curry/gravy — catches ~207 dishes) ───
  {
    match: (tags) => tags.some(t => [
      'sabzi', 'curry', 'gravy', 'dry', 'roast', 'stir-fry', 'smoked',
      'tandoori', 'kebab', 'tikka', 'kofta', 'bhuna',
      'malai', 'korma', 'pasanda', 'lababdar', 'jalfrezi', 'achari',
      'do-pyaza', 'jhol', 'kalia', 'kosha', 'tawa', 'bharta', 'pickle',
      'keema', 'soya', 'chaap', 'mushroom', 'paneer',
      'chicken', 'mutton', 'fish', 'prawn', 'egg',
    ].includes(t)),
    pairings: { sides: ['Pickle', 'Raita'], beverages: ['Chaas'] },
  },
];

const SAFE_FALLBACK: NonNullable<Meal['defaultPairings']> = {
  sides: ['Side Salad', 'Lemon Wedge'],
  beverages: ['Tea'],
};

function findTemplatePairings(dish: Dish): Meal['defaultPairings'] | null {
  for (const template of TEMPLATES) {
    if (template.match(dish.tags)) {
      return template.pairings;
    }
  }
  return null;
}

function mealRegion(region: Dish['region']): Meal['region'] {
  return region === 'all' ? 'north' : region;
}

export function dishToMeal(dish: Dish, variant?: DishVariant): Meal {
  const isSelfBread = SELF_BREAD.some(t => dish.tags.includes(t));
  const isSelfRice = SELF_RICE.some(t => dish.tags.includes(t));
  const isLunchOrDinner = dish.category.some(c => c === 'lunch' || c === 'dinner');
  const isLowCarb = dish.tags.some(t => t === 'low-carb' || t === 'keto');

  const fullName = resolveDisplayName(dish.name, variant ?? dish.variants?.[0]);

  const shouldShowRoti = isLunchOrDinner && !isSelfRice && !isSelfBread && !isLowCarb;
  const shouldShowRice = isLunchOrDinner && !isSelfBread && !isSelfRice && !isLowCarb;

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
      rotiOptions: dish.defaultPairings.roti
        ? [dish.defaultPairings.roti]
        : (shouldShowRoti ? ['Roti', 'Naan', 'Paratha'] : undefined),
      riceOptions: dish.defaultPairings.rice
        ? [dish.defaultPairings.rice]
        : (shouldShowRice ? ['Steamed Rice', 'Jeera Rice'] : undefined),
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

  // ─── PRIORITY 2: Template-based tag matching ──────────────────
  const templatePairings = findTemplatePairings(dish);
  if (templatePairings) {
    return {
      id: dish.id,
      name: fullName,
      icon: dish.icon,
      region: mealRegion(dish.region),
      baseGravy: dish.gravyType ? String(dish.gravyType) : undefined,
      gravyOptions: dish.gravyType
        ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
        : undefined,
      rotiOptions: isSelfBread ? undefined : (shouldShowRoti ? ['Roti', 'Naan', 'Paratha'] : undefined),
      riceOptions: isSelfRice ? undefined : (shouldShowRice ? ['Steamed Rice', 'Jeera Rice'] : undefined),
      sideOptions: templatePairings.sides?.length ? templatePairings.sides : undefined,
      beverageOptions: templatePairings.beverages?.length ? templatePairings.beverages : undefined,
      defaultPairings: templatePairings,
      suggestedPairings: {
        sides: templatePairings.sides ?? [],
        beverages: templatePairings.beverages ?? [],
      },
      tags: dish.tags,
    };
  }

  // ─── PRIORITY 3: Safe fallback (neutral, diet-safe) ───────────
  return {
    id: dish.id,
    name: fullName,
    icon: dish.icon,
    region: mealRegion(dish.region),
    baseGravy: dish.gravyType ? String(dish.gravyType) : undefined,
    gravyOptions: dish.gravyType
      ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
      : undefined,
    rotiOptions: isSelfBread ? undefined : (shouldShowRoti ? ['Roti', 'Naan', 'Paratha'] : undefined),
    riceOptions: isSelfRice ? undefined : (shouldShowRice ? ['Steamed Rice', 'Jeera Rice'] : undefined),
    sideOptions: SAFE_FALLBACK.sides?.length ? SAFE_FALLBACK.sides : undefined,
    beverageOptions: SAFE_FALLBACK.beverages?.length ? SAFE_FALLBACK.beverages : undefined,
    defaultPairings: SAFE_FALLBACK,
    suggestedPairings: {
      sides: SAFE_FALLBACK.sides ?? [],
      beverages: SAFE_FALLBACK.beverages ?? [],
    },
    tags: dish.tags,
  };
}

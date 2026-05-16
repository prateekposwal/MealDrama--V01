// ─────────────────────────────────────────────────────────────────────────────
// dishToMeal — Convert Dish (library) → Meal (smart defaults engine)
// Derives roti/rice/sides/beverages from tags & variants since Dish optional
// fields (rotiOptions, riceOptions, etc.) are never populated in practice.
// Now uses getSmartSuggestions for side/beverage pairings instead of hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

import { GravyType, type Dish, type DishVariant } from '../constants/dishLibrary';
import type { Meal } from '../types/tray';
import { getSmartSuggestions } from './smartSuggestions';

function enrichName(dishName: string, variant: DishVariant): string {
  if (variant.name.includes(dishName)) return variant.name;
  if (variant.cookingStyle) return `${dishName} ${variant.cookingStyle}`;
  if (variant.addOn) return `${dishName} ${variant.addOn}`;
  return variant.name;
}

const SELF_BREAD = ['paratha', 'naan', 'roti', 'puri', 'bread', 'toast', 'pav', 'bhature', 'flatbread', 'thepla'];
const SELF_RICE = ['rice', 'biryani', 'pulao', 'khichdi', 'chawal'];
const MAIN_DISH = ['gravy', 'curry', 'sabzi', 'dal', 'lentils', 'kofta', 'stew'];

export function dishToMeal(dish: Dish, variant?: DishVariant): Meal {
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

  const showBread = (isMainDish || hasBreadPairing || (isLunchOrDinner && !isSelfBread && !isSelfRice)) && !isSelfBread;
  const rotiOptions = showBread ? ['Roti', 'Naan', 'Paratha', 'Tandoori Roti', 'Puri'] : undefined;

  const showRice = (isMainDish || hasRicePairing || (isLunchOrDinner && !isSelfRice && !isSelfBread)) && !isSelfRice;
  const riceOptions = showRice ? ['Steamed Rice', 'Jeera Rice', 'Pulao', 'Biryani'] : undefined;

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
  const isSnack = dish.category.some(c => c === 'snacks');
  if (isSnack && allSideItems.length === 0) {
    allSideItems.push('Chutney', 'Onion');
  }
  if (dish.tags.includes('salad') && !allSideItems.some(s => s.toLowerCase().includes('salad'))) {
    allSideItems.push('Green Salad', 'Kachumber');
  }
  if (dish.tags.includes('fruit') && !allSideItems.some(s => s.toLowerCase().includes('fruit'))) {
    allSideItems.push('Mixed Fruit', 'Seasonal Fruit');
  }
  const sideOptions = allSideItems.length > 0 ? allSideItems : undefined;
  const beverageOptions = ['Chaas', 'Nimbu Pani', 'Coffee', 'Tea', 'Lassi'];

  // Use smart suggestions for pairings
  const suggestions = getSmartSuggestions(
    { id: dish.id, name: dish.name, region: dish.region, tags: dish.tags, category: dish.category, states: dish.states, season: dish.season },
    'lunch',
    { useSmartSuggestions: true },
  );

  const effectiveVariant = variant ?? dish.variants?.[0];
  const fullName = effectiveVariant
    ? enrichName(dish.name, effectiveVariant)
    : dish.name;

  return {
    id: dish.id,
    name: fullName,
    icon: dish.icon,
    region: dish.region,
    baseGravy: dish.gravyType ? String(dish.gravyType) : undefined,
    gravyOptions: dish.gravyType
      ? Object.values(GravyType).filter(g => g !== 'DEFAULT').map(g => g.charAt(0) + g.slice(1).toLowerCase())
      : undefined,
    rotiOptions,
    riceOptions,
    sideOptions,
    beverageOptions,
    suggestedPairings: {
      sides: suggestions.sides.items.length > 0 ? suggestions.sides.items.slice(0, 2) : sideOptions?.slice(0, 2),
      beverages: suggestions.beverages.items.length > 0 ? suggestions.beverages.items.slice(0, 2) : beverageOptions.slice(0, 2),
    },
    tags: dish.tags,
  };
}

import type { Meal, MealType } from '../types/tray';

interface ScoredItem {
  name: string;
  score: number;
  maxScore: number;
  reasons: string[];
  percentage: number;
}

export interface ScoringContext {
  dish: Meal;
  slotType: MealType;
  userDiet: string;
  pantryStaples: string[];
  region: string;
  existingSelections: string[];
}

type FlavorProfile = 'gravy' | 'dry' | 'dal' | 'creamy' | 'spicy' | 'tangy' | 'smoky' | 'sweet' | 'light' | 'starchy' | 'crispy' | 'fresh';

// ─── DP/Memoization caches ──────────────────────────────────────────────────
const flavorScoreCache = new Map<string, { score: number; reasons: string[] }>();
const dietScoreCache = new Map<string, { score: number; reasons: string[] }>();
const pantryScoreCache = new Map<string, { score: number; reasons: string[] }>();
const regionScoreCache = new Map<string, { score: number; reasons: string[] }>();
const varietyScoreCache = new Map<string, { score: number; reasons: string[] }>();
const scoreItemCache = new Map<string, ScoredItem>();

const MAX_CACHE_SIZE = 500;

function pruneCache(cache: Map<string, unknown>, maxSize = MAX_CACHE_SIZE) {
  if (cache.size > maxSize) {
    const toDelete = cache.size - maxSize;
    const keysToDelete = [...cache.keys()].slice(0, toDelete);
    for (const key of keysToDelete) cache.delete(key);
  }
}

function makeCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join('::');
}

const DISH_FLAVOR: Record<string, FlavorProfile[]> = {
  gravy: ['gravy', 'creamy'],
  'slow-cooked': ['gravy', 'spicy'],
  tandoori: ['smoky', 'dry'],
  dal: ['dal', 'gravy'],
  paratha: ['dry', 'starchy'],
  chaat: ['tangy', 'spicy'],
  'street food': ['tangy', 'spicy'],
  paneer: ['creamy', 'gravy'],
  rice: ['starchy', 'light'],
  spicy: ['spicy'],
  sweet: ['sweet'],
  creamy: ['creamy'],
  healthy: ['light'],
  'non-veg': ['gravy', 'spicy'],
  egg: ['light', 'dry'],
  breakfast: ['light', 'starchy'],
  'comfort': ['gravy', 'creamy'],
};

const BREAD_FLAVOR: Record<string, FlavorProfile[]> = {
  'Tandoori Roti': ['light', 'dry'],
  'Butter Naan': ['creamy', 'starchy'],
  'Plain Naan': ['starchy', 'dry'],
  'Garlic Naan': ['spicy', 'starchy'],
  'Paratha': ['starchy', 'creamy'],
  'Bread': ['light', 'starchy'],
  'Appam': ['light', 'starchy'],
  'Plain Dosa': ['light', 'crispy'],
  'Bhakri': ['dry', 'starchy'],
  'Thepla': ['spicy', 'dry'],
  'Luchi': ['starchy', 'creamy'],
  'Roti': ['light', 'dry'],
  'Bafla': ['starchy', 'dry'],
};

const RICE_FLAVOR: Record<string, FlavorProfile[]> = {
  'Jeera Rice': ['light', 'spicy'],
  'Steamed Rice': ['light', 'starchy'],
  'Lemon Rice': ['tangy', 'light'],
  'Pulao': ['starchy', 'spicy'],
  'Curd Rice': ['tangy', 'creamy'],
  'Sticky Rice': ['starchy'],
};

const SIDE_FLAVOR: Record<string, FlavorProfile[]> = {
  'Raita': ['creamy', 'tangy'],
  'Salad': ['light', 'fresh'],
  'Pickle': ['spicy', 'tangy'],
  'Papad': ['light', 'crispy'],
  'Coconut Chutney': ['creamy', 'sweet'],
  'Sambar': ['spicy', 'tangy'],
  'Kadhi': ['tangy', 'creamy'],
  'Curd': ['creamy', 'tangy'],
  'Butter': ['creamy', 'creamy'],
  'Jam': ['sweet'],
  'Chutney': ['tangy', 'spicy'],
  'Onion': ['spicy', 'fresh'],
  'Ketchup': ['tangy', 'sweet'],
};

const BEVERAGE_FLAVOR: Record<string, FlavorProfile[]> = {
  'Water': ['light'],
  'Chaas': ['tangy', 'creamy'],
  'Filter Coffee': ['creamy'],
  'Chai': ['spicy', 'creamy'],
  'Coffee': ['creamy'],
  'Milk': ['creamy'],
  'Mango Lassi': ['sweet', 'creamy'],
  'Green Tea': ['light', 'tangy'],
};

const FLAVOR_COMPAT: Record<string, Record<string, number>> = {
  gravy: { gravy: 0.9, starchy: 0.8, creamy: 0.7, light: 0.5, dry: 0.4, crispy: 0.3, fresh: 0.6, spicy: 0.7, tangy: 0.5, sweet: 0.2 },
  dry: { gravy: 0.4, starchy: 0.8, creamy: 0.3, light: 0.7, dry: 0.6, crispy: 0.7, fresh: 0.7, spicy: 0.5, tangy: 0.4, sweet: 0.3 },
  dal: { gravy: 0.9, starchy: 0.9, creamy: 0.7, light: 0.8, dry: 0.3, crispy: 0.3, fresh: 0.5, spicy: 0.6, tangy: 0.6, sweet: 0.1 },
  creamy: { gravy: 0.8, starchy: 0.7, creamy: 0.9, light: 0.4, dry: 0.2, crispy: 0.2, fresh: 0.3, spicy: 0.3, tangy: 0.6, sweet: 0.5 },
  spicy: { gravy: 0.7, starchy: 0.6, creamy: 0.3, light: 0.5, dry: 0.5, crispy: 0.6, fresh: 0.6, spicy: 0.5, tangy: 0.8, sweet: 0.4 },
  tangy: { gravy: 0.5, starchy: 0.4, creamy: 0.6, light: 0.6, dry: 0.4, crispy: 0.5, fresh: 0.8, spicy: 0.8, tangy: 0.7, sweet: 0.5 },
  smoky: { gravy: 0.8, starchy: 0.8, creamy: 0.6, light: 0.3, dry: 0.5, crispy: 0.4, fresh: 0.3, spicy: 0.6, tangy: 0.4, sweet: 0.2 },
  sweet: { gravy: 0.2, starchy: 0.3, creamy: 0.5, light: 0.6, dry: 0.3, crispy: 0.3, fresh: 0.4, spicy: 0.4, tangy: 0.5, sweet: 0.8 },
  light: { gravy: 0.5, starchy: 0.6, creamy: 0.4, light: 0.7, dry: 0.7, crispy: 0.7, fresh: 0.8, spicy: 0.5, tangy: 0.6, sweet: 0.5 },
  starchy: { gravy: 0.8, starchy: 0.6, creamy: 0.7, light: 0.6, dry: 0.6, crispy: 0.4, fresh: 0.4, spicy: 0.5, tangy: 0.3, sweet: 0.3 },
  crispy: { gravy: 0.3, starchy: 0.4, creamy: 0.2, light: 0.7, dry: 0.7, crispy: 0.5, fresh: 0.6, spicy: 0.6, tangy: 0.5, sweet: 0.3 },
  fresh: { gravy: 0.6, starchy: 0.4, creamy: 0.3, light: 0.8, dry: 0.7, crispy: 0.6, fresh: 0.5, spicy: 0.4, tangy: 0.7, sweet: 0.5 },
};

const FLAVOR_EXPLANATIONS: Record<string, Record<string, string>> = {
  gravy: { starchy: 'absorbs the gravy well', light: 'lets the gravy shine', creamy: 'complements the richness' },
  dry: { starchy: 'adds bulk to the meal', fresh: 'adds freshness', crispy: 'adds texture contrast' },
  dal: { starchy: 'great for mopping up dal', gravy: 'dal and gravy combination', light: 'keeps the meal balanced' },
  spicy: { tangy: 'cools down the spice', creamy: 'balances the heat', fresh: 'provides relief from heat' },
  creamy: { tangy: 'cuts through the richness', light: 'prevents the meal from feeling heavy' },
};

const DIET_OK: Record<string, string[]> = {
  veg: ['veg', 'vegan', 'eggitarian'],
  'non-veg': ['veg', 'non-veg', 'vegan', 'eggitarian'],
  vegan: ['veg', 'vegan'],
  eggitarian: ['veg', 'eggitarian', 'vegan'],
};

function getDishFlavors(dish: Meal): FlavorProfile[] {
  const flavors: FlavorProfile[] = [];
  if (!dish.tags) return ['gravy'];
  for (const tag of dish.tags) {
    const tagFlavors = DISH_FLAVOR[tag];
    if (tagFlavors) flavors.push(...tagFlavors);
  }
  return flavors.length > 0 ? [...new Set(flavors)] : ['gravy'];
}

function getCandidateFlavors(candidate: string, category: string): FlavorProfile[] {
  const map = category === 'bread' ? BREAD_FLAVOR
    : category === 'rice' ? RICE_FLAVOR
    : category === 'side' ? SIDE_FLAVOR
    : BEVERAGE_FLAVOR;
  return map[candidate] ?? ['light'];
}

function computeFlavorScore(dishFlavors: FlavorProfile[], candidateFlavors: FlavorProfile[]): { score: number; reasons: string[] } {
  const key = makeCacheKey(dishFlavors.join(','), candidateFlavors.join(','));
  const cached = flavorScoreCache.get(key);
  if (cached) return cached;

  let totalScore = 0;
  let count = 0;
  const reasons: string[] = [];

  for (const df of dishFlavors) {
    for (const cf of candidateFlavors) {
      const compat = FLAVOR_COMPAT[df]?.[cf] ?? 0.3;
      totalScore += compat;
      count++;
      const explanation = FLAVOR_EXPLANATIONS[df]?.[cf];
      if (explanation && compat >= 0.6) {
        reasons.push(explanation);
      }
    }
  }

  const avg = count > 0 ? totalScore / count : 0.3;
  const uniqueReasons = [...new Set(reasons)];
  const result = { score: avg, reasons: uniqueReasons.slice(0, 2) };

  flavorScoreCache.set(key, result);
  pruneCache(flavorScoreCache);
  return result;
}

function computeDietScore(candidate: string, userDiet: string): { score: number; reasons: string[] } {
  const key = makeCacheKey(candidate, userDiet);
  const cached = dietScoreCache.get(key);
  if (cached) return cached;

  const dietOk = DIET_OK[userDiet] ?? ['veg', 'non-veg', 'vegan', 'eggitarian'];
  const reasons: string[] = [];

  const isVegItem = !['chicken', 'mutton', 'fish', 'egg', 'meat'].some(kw =>
    candidate.toLowerCase().includes(kw)
  );
  const isVeganItem = !['butter', 'milk', 'curd', 'cream', 'cheese', 'ghee', 'paneer', 'egg'].some(kw =>
    candidate.toLowerCase().includes(kw)
  );
  const isEggItem = candidate.toLowerCase().includes('egg');

  let result: { score: number; reasons: string[] };
  if (userDiet === 'vegan') {
    result = isVeganItem
      ? { score: 1.0, reasons: ['100% plant-based'] }
      : { score: 0.1, reasons: ['may contain dairy'] };
  } else if (userDiet === 'veg') {
    result = isVegItem
      ? { score: 1.0, reasons: ['vegetarian-friendly'] }
      : { score: 0.0, reasons: ['not vegetarian'] };
  } else if (userDiet === 'eggitarian') {
    result = (isVegItem || isEggItem)
      ? { score: 1.0, reasons: [isEggItem ? 'egg option' : 'vegetarian-friendly'] }
      : { score: 0.2, reasons: ['contains meat'] };
  } else {
    result = { score: 1.0, reasons: ['no dietary restrictions'] };
  }

  dietScoreCache.set(key, result);
  pruneCache(dietScoreCache);
  return result;
}

function computePantryScore(candidate: string, pantryStaples: string[]): { score: number; reasons: string[] } {
  const key = makeCacheKey(candidate, pantryStaples.join(','));
  const cached = pantryScoreCache.get(key);
  if (cached) return cached;

  let result: { score: number; reasons: string[] };
  if (pantryStaples.length === 0) {
    result = { score: 0.5, reasons: ['pantry unknown'] };
  } else {
    const candidateLower = candidate.toLowerCase();
    const match = pantryStaples.some(s => candidateLower.includes(s.toLowerCase()) || s.toLowerCase().includes(candidateLower));
    result = match
      ? { score: 1.0, reasons: ['in your pantry'] }
      : { score: 0.3, reasons: ['add to shopping list'] };
  }

  pantryScoreCache.set(key, result);
  pruneCache(pantryScoreCache);
  return result;
}

function computeRegionScore(candidate: string, region: string, dish: Meal): { score: number; reasons: string[] } {
  const key = makeCacheKey(candidate, region, dish.id);
  const cached = regionScoreCache.get(key);
  if (cached) return cached;

  const regionLower = region.toLowerCase();
  const reasons: string[] = [];

  const northItems = ['naan', 'roti', 'paratha', 'jeera rice', 'pulao', 'raita', 'lassi', 'chaas', 'chai'];
  const southItems = ['appam', 'dosa', 'idli', 'lemon rice', 'sambar', 'chutney', 'filter coffee'];
  const westItems = ['bhakri', 'thepla', 'pav', 'kadhi'];
  const eastItems = ['luchi'];
  const centralItems = ['bafla'];
  const northeastItems = ['sticky rice'];

  const isNorth = regionLower === 'north';
  const isSouth = regionLower === 'south';
  const isWest = regionLower === 'west';
  const isEast = regionLower === 'east';

  const candidateLower = candidate.toLowerCase();

  let regional = true;
  if (isNorth && southItems.some(i => candidateLower.includes(i))) regional = false;
  if (isSouth && northItems.some(i => candidateLower.includes(i))) regional = false;
  if (isWest && (southItems.some(i => candidateLower.includes(i)) || northItems.some(i => candidateLower.includes(i)))) regional = false;
  if (isEast && northItems.some(i => candidateLower.includes(i)) && !eastItems.some(i => candidateLower.includes(i))) regional = false;

  const result = regional
    ? { score: 1.0, reasons: ['regional match'] }
    : { score: 0.5, reasons: ['non-regional option'] };

  regionScoreCache.set(key, result);
  pruneCache(regionScoreCache);
  return result;
}

function computeVarietyScore(candidate: string, existingSelections: string[]): { score: number; reasons: string[] } {
  const key = makeCacheKey(candidate, existingSelections.join(','));
  const cached = varietyScoreCache.get(key);
  if (cached) return cached;

  let result: { score: number; reasons: string[] };
  if (existingSelections.length === 0) {
    result = { score: 1.0, reasons: ['first choice'] };
  } else {
    const alreadySelected = existingSelections.some(s => s.toLowerCase() === candidate.toLowerCase());
    if (alreadySelected) {
      const similarItems = existingSelections.filter(s => {
        const cat = candidate.split(' ')[0];
        return cat != null && s.toLowerCase().includes(cat.toLowerCase());
      });
      result = similarItems.length > 2
        ? { score: 0.2, reasons: ['already selected many times'] }
        : { score: 0.4, reasons: ['already selected'] };
    } else {
      result = { score: 1.0, reasons: ['adds variety'] };
    }
  }

  varietyScoreCache.set(key, result);
  pruneCache(varietyScoreCache);
  return result;
}

export function scoreItem(
  candidate: string,
  category: 'bread' | 'rice' | 'side' | 'beverage',
  ctx: ScoringContext,
): ScoredItem {
  const key = makeCacheKey(candidate, category, ctx.dish.id, ctx.slotType, ctx.userDiet, ctx.region, ctx.pantryStaples.join(','), ctx.existingSelections.join(','));
  const cached = scoreItemCache.get(key);
  if (cached) return cached;

  const dishFlavors = getDishFlavors(ctx.dish);
  const candidateFlavors = getCandidateFlavors(candidate, category);

  const flavor = computeFlavorScore(dishFlavors, candidateFlavors);
  const diet = computeDietScore(candidate, ctx.userDiet);
  const pantry = computePantryScore(candidate, ctx.pantryStaples);
  const region = computeRegionScore(candidate, ctx.region, ctx.dish);
  const variety = computeVarietyScore(candidate, ctx.existingSelections);

  const weights = { flavor: 0.35, diet: 0.25, pantry: 0.20, region: 0.12, variety: 0.08 };
  const maxScore = 100;

  const total =
    (flavor.score * weights.flavor +
     diet.score * weights.diet +
     pantry.score * weights.pantry +
     region.score * weights.region +
     variety.score * weights.variety);

  const score = Math.round(total * maxScore);

  const allReasons = [
    ...flavor.reasons.map(r => `pairs well${r ? ` (${r})` : ''}`),
    ...diet.reasons.map(r => r),
    ...pantry.reasons.map(r => r),
    ...region.reasons.map(r => r),
    ...variety.reasons.map(r => r),
  ];

  const result = {
    name: candidate,
    score,
    maxScore,
    reasons: allReasons.slice(0, 3),
    percentage: Math.round(total * 100),
  };

  scoreItemCache.set(key, result);
  pruneCache(scoreItemCache);
  return result;
}


export function formatRecommendation(name: string, reasons: string[]): string {
  if (reasons.length === 0) return `Recommended: ${name}`;
  return `Recommended: ${name} (${reasons.join(', ')})`;
}

export function clearScoringCache() {
  flavorScoreCache.clear();
  dietScoreCache.clear();
  pantryScoreCache.clear();
  regionScoreCache.clear();
  varietyScoreCache.clear();
  scoreItemCache.clear();
}

export function getScoringCacheSizes() {
  return {
    flavor: flavorScoreCache.size,
    diet: dietScoreCache.size,
    pantry: pantryScoreCache.size,
    region: regionScoreCache.size,
    variety: varietyScoreCache.size,
    scoreItem: scoreItemCache.size,
  };
}

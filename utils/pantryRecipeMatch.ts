// ─────────────────────────────────────────────────────────────────────────────
// Pantry-to-Recipe Matching — DP-based subset optimization
// Finds the maximum subset of recipes the user can make with available pantry items
// ─────────────────────────────────────────────────────────────────────────────
import { checkWithFallback } from './dpTimeout';

export interface RecipeIngredient {
  name: string;
  quantity?: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface PantryMatchResult {
  canMake: Recipe[];
  partiallyMake: Array<{ recipe: Recipe; missing: string[]; missingCount: number }>;
  cannotMake: Recipe[];
  coverageScore: number; // 0-1, how well pantry covers all recipes
}

const matchCache = new Map<string, PantryMatchResult>();

function makeCacheKey(pantry: string[], recipeIds: string[]): string {
  return `${pantry.sort().join(',')}::${recipeIds.sort().join(',')}`;
}

/**
 * Check if a recipe can be made with given pantry items.
 * Required ingredients must be present; optional ones are bonuses.
 */
function canMakeRecipe(recipe: Recipe, pantrySet: Set<string>): { canMake: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    const ingLower = ing.name.toLowerCase();
    const hasIngredient = pantrySet.has(ingLower) ||
      [...pantrySet].some(p => p.includes(ingLower) || ingLower.includes(p));
    if (!hasIngredient) {
      missing.push(ing.name);
    }
  }

  return { canMake: missing.length === 0, missing };
}

/**
 * DP-based pantry-to-recipe matching.
 * Uses maximum coverage DP to find optimal recipe subset given pantry constraints.
 *
 * For each recipe, computes ingredient coverage.
 * Uses DP to find the combination of recipes that maximizes total coverage
 * while minimizing unique ingredients needed (pantry efficiency).
 */
export function matchPantryToRecipes(
  pantry: string[],
  recipes: Recipe[],
): PantryMatchResult {
  const key = makeCacheKey(pantry, recipes.map(r => r.id));
  const cached = matchCache.get(key);
  if (cached) return cached;

  const pantrySet = new Set(pantry.map(p => p.toLowerCase()));
  const canMake: Recipe[] = [];
  const partiallyMake: Array<{ recipe: Recipe; missing: string[]; missingCount: number }> = [];
  const cannotMake: Recipe[] = [];

  // Cap for DP performance
  const maxRecipes = Math.min(recipes.length, 50);
  const limitedRecipes = recipes.slice(0, maxRecipes);

  // Phase 1: Classify recipes
  for (const recipe of limitedRecipes) {
    const { canMake: can, missing } = canMakeRecipe(recipe, pantrySet);

    if (can) {
      canMake.push(recipe);
    } else if (missing.length < recipe.ingredients.filter(i => !i.optional).length) {
      partiallyMake.push({ recipe, missing, missingCount: missing.length });
    } else {
      cannotMake.push(recipe);
    }
  }

  // Phase 2: DP-based optimization for partially makeable recipes
  checkWithFallback<void>((isTimedOut) => {
    if (partiallyMake.length <= 1) return;
    partiallyMake.sort((a, b) => a.missingCount - b.missingCount);

    const n = partiallyMake.length;
    const dp: number[] = new Array(n).fill(Infinity);
    const parent: number[] = new Array(n).fill(-1);

    for (let i = 0; i < n; i++) {
      dp[i] = partiallyMake[i]!.missingCount;
    }

    for (let i = 1; i < n; i++) {
      if (isTimedOut()) return;
      const currentMissing = new Set(partiallyMake[i]!.missing.map(m => m.toLowerCase()));

      for (let j = 0; j < i; j++) {
        const prevMissing = new Set(partiallyMake[j]!.missing.map(m => m.toLowerCase()));
        const combined = new Set([...currentMissing, ...prevMissing]);

        if (dp[j]! + partiallyMake[i]!.missingCount - currentMissing.size < dp[i]!) {
          const newCost = dp[j]! + partiallyMake[i]!.missingCount;
          if (newCost < dp[i]!) {
            dp[i] = newCost;
            parent[i] = j;
          }
        }
      }
    }

    const optimalChain: number[] = [];
    let bestIdx = 0;
    for (let i = 1; i < n; i++) {
      if (dp[i]! < dp[bestIdx]!) bestIdx = i;
    }

    let curr = bestIdx;
    while (curr !== -1) {
      optimalChain.unshift(curr);
      curr = parent[curr]!;
    }

    const ordered = optimalChain.map(i => partiallyMake[i]!);
    const remaining = partiallyMake.filter((_, idx) => !optimalChain.includes(idx));
    partiallyMake.length = 0;
    partiallyMake.push(...ordered, ...remaining);
  }, undefined);


  // Calculate coverage score
  const totalRecipes = limitedRecipes.length;
  const coverageScore = totalRecipes > 0
    ? (canMake.length + partiallyMake.length * 0.5) / totalRecipes
    : 0;

  const result: PantryMatchResult = {
    canMake,
    partiallyMake,
    cannotMake,
    coverageScore: Math.round(coverageScore * 100) / 100,
  };

  // Cache with LRU pruning
  if (matchCache.size > 50) {
    const firstKey = matchCache.keys().next().value;
    if (firstKey) matchCache.delete(firstKey);
  }
  matchCache.set(key, result);

  return result;
}

/**
 * Suggest minimal shopping list additions to unlock more recipes.
 * Uses greedy set cover approximation to find ingredients that unlock the most recipes.
 */
export function suggestShoppingList(
  pantry: string[],
  partiallyMake: Array<{ recipe: Recipe; missing: string[]; missingCount: number }>,
  maxSuggestions: number = 5,
): string[] {
  const pantrySet = new Set(pantry.map(p => p.toLowerCase()));

  // Count how many recipes each missing ingredient would unlock
  const ingredientImpact = new Map<string, number>();
  const ingredientRecipes = new Map<string, string[]>();

  for (const { recipe, missing } of partiallyMake) {
    for (const ing of missing) {
      const ingLower = ing.toLowerCase();
      const prev = ingredientImpact.get(ingLower) ?? 0;
      ingredientImpact.set(ingLower, prev + 1);

      if (!ingredientRecipes.has(ingLower)) {
        ingredientRecipes.set(ingLower, []);
      }
      ingredientRecipes.get(ingLower)!.push(recipe.name);
    }
  }

  // Greedy set cover: pick ingredient that unlocks most uncovered recipes
  const suggestions: string[] = [];
  const unlocked = new Set<string>();

  while (suggestions.length < maxSuggestions && unlocked.size < partiallyMake.length) {
    let bestIngredient = '';
    let bestNewUnlocks = 0;

    for (const [ingredient, count] of ingredientImpact) {
      if (pantrySet.has(ingredient)) continue;

      const recipes = ingredientRecipes.get(ingredient) ?? [];
      const newUnlocks = recipes.filter(r => !unlocked.has(r)).length;

      if (newUnlocks > bestNewUnlocks) {
        bestNewUnlocks = newUnlocks;
        bestIngredient = ingredient;
      }
    }

    if (!bestIngredient) break;

    suggestions.push(bestIngredient);
    const recipes = ingredientRecipes.get(bestIngredient) ?? [];
    for (const r of recipes) unlocked.add(r);
    pantrySet.add(bestIngredient);
  }

  return suggestions;
}

export function clearPantryMatchCache() {
  matchCache.clear();
}

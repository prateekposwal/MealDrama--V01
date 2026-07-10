import type { Dish } from '../../meal/constants/dishLibrary';
import { GENERATED_INGREDIENTS } from '../../meal/constants/generatedIngredients';

export class DishGraph {
  private ingredientToDishes = new Map<string, Set<string>>();
  private dishToIngredients = new Map<string, string[]>();
  private sharedIngredientCache = new Map<string, Set<string>>();

  build(dishes: Dish[]): void {
    this.ingredientToDishes.clear();
    this.dishToIngredients.clear();
    this.sharedIngredientCache.clear();

    for (const d of dishes) {
      for (const variant of d.variants ?? []) {
        const key = `${d.id}::${variant.name}`;
        const ings = GENERATED_INGREDIENTS[key];
        if (!ings) continue;
        const names = ings.map(i => i.name.toLowerCase());
        this.dishToIngredients.set(key, names);
        for (const name of names) {
          let ids = this.ingredientToDishes.get(name);
          if (!ids) { ids = new Set(); this.ingredientToDishes.set(name, ids); }
          ids.add(key);
        }
      }
    }
  }

  /** All dishes that use a given ingredient */
  dishesWithIngredient(ingredientName: string): Set<string> {
    return this.ingredientToDishes.get(ingredientName.toLowerCase()) ?? new Set();
  }

  /** Ingredients for a given dish+variant */
  ingredientsForDish(dishKey: string): string[] {
    return this.dishToIngredients.get(dishKey) ?? [];
  }

  /** Dishes that share at least one ingredient with the given dish */
  dishesSharingIngredients(dishKey: string): Set<string> {
    const cached = this.sharedIngredientCache.get(dishKey);
    if (cached) return cached;

    const ings = this.dishToIngredients.get(dishKey);
    if (!ings) return new Set();

    const result = new Set<string>();
    for (const ing of ings) {
      const dishSet = this.ingredientToDishes.get(ing);
      if (dishSet) {
        for (const id of dishSet) {
          if (id !== dishKey) result.add(id);
        }
      }
    }
    this.sharedIngredientCache.set(dishKey, result);
    return result;
  }
}

let _instance: DishGraph | null = null;
let _instanceDishes: Dish[] | null = null;

export function getDishGraph(dishes: Dish[]): DishGraph {
  if (_instanceDishes !== dishes) {
    _instance = new DishGraph();
    _instance.build(dishes);
    _instanceDishes = dishes;
  }
  return _instance!;
}

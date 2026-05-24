import { describe, it, expect } from 'vitest';
import { getIngredientsForMealOption } from '../utils/ingredientUtils';
import { DISH_LIBRARY } from '../constants/dishLibrary';
import type { Dish } from '../constants/dishLibrary';

const INFERRED_EMPTY_IDS = new Set([
  'sindhi-kadhi','sindhi-koki','murghi-na-farcha','spiced-hot-chocolate',
  'high-protein-veggie-burgers','loaded-veggie-nachos','veggie-spaghetti-sauce',
  'strawberry-juice','vegan-strawberry-milk','peach-milk','eggless-brownies',
  'shammi-kebab','galouti-kebab','seekh-kebab','kadhi-khakra','kuzhambu',
  'parotta-kurma','appam-stew','idiyappam','shev-puri','sabudana-vada',
  'kothimbir-vadi','shorshe-ilish','machher-jhol-bengali','dim-er-torkaari',
  'besan-mix-veg','bafla-gravy','naga-bamboo-shoot','manipuri-eromba',
  'manipuri-kangsoi','mizo-bai','mizo-vawksa','sikkimese-buckwheat',
  'assam-masor-tenga','meghalaya-doh-khleh','meghalaya-tun-jhol',
  'tunday-kebab','nalli-nihari','rabdi-faluda','khar','mango-lassi',
  'besan_chilla_north','suji_chilla_north','besan_chilla_curry_north',
  'methi_chilla_north','poha_chilla_mh','mixed_veg_chilla_mh',
  'oats_sprouts_chilla','singhara_chilla_vrat',
]);

function hasExplicitIngredients(dish: Dish): boolean {
  return dish.variants.some(v => v.ingredients && v.ingredients.length > 0);
}

describe('Real inference for previously-empty dishes', () => {
  const results: { id: string; name: string; count: number; ingredients: string[] }[] = [];

  for (const dish of DISH_LIBRARY) {
    if (!dish.icon || !dish.region) continue;
    if (!INFERRED_EMPTY_IDS.has(dish.id)) continue;

    if (hasExplicitIngredients(dish)) {
      results.push({ id: dish.id, name: dish.name, count: -1, ingredients: ['EXPLICIT'] });
      continue;
    }

    // Call the actual inference engine
    const variant = dish.variants[0];
    const ingredients = getIngredientsForMealOption(dish.id, variant?.id || dish.id, DISH_LIBRARY);
    const names = [...new Set(ingredients.map(i => i.name))];
    results.push({ id: dish.id, name: dish.name, count: names.length, ingredients: names });
  }

  it('should show real inference results', () => {
    console.log('\n=== REAL INFERENCE FOR 49 PREVIOUSLY-EMPTY DISHES ===');
    const caught: string[] = [];
    const stillEmpty: string[] = [];

    for (const r of results.sort((a, b) => a.id.localeCompare(b.id))) {
      if (r.count === -1) {
        console.log(`⚠ ${r.id}: EXPLICIT ingredients (should not be in empty list!)`);
        caught.push(r.id);
      } else if (r.count > 0) {
        console.log(`✓ ${r.id}: ${r.count} ingredients — ${r.ingredients.join(', ')}`);
        caught.push(r.id);
      } else {
        console.log(`✗ ${r.id}: STILL EMPTY`);
        stillEmpty.push(r.id);
      }
    }

    console.log(`\nCaught by real engine: ${caught.length}/49`);
    console.log(`Still empty: ${stillEmpty.length}/49`);
    console.log(`Still empty IDs: ${stillEmpty.join(', ')}`);
  });
});

import { DISH_LIBRARY } from '../constants/dishLibrary';
import type { Dish, Ingredient, IngredientCategory } from '../constants/dishLibrary';

// ── Inlined inference logic (from ingredientUtils.ts) ──

const ing = (name: string, qty: number, unit: string, category: IngredientCategory): Ingredient =>
  ({ name, quantity: qty, unit, category, inStock: false });

function inferFromDishId(dishId: string, dishName?: string): Ingredient[] {
  const idLower = dishId.toLowerCase();
  const result: Ingredient[] = [];

  if (dishName && dishName.toLowerCase() !== idLower) {
    const n = dishName.toLowerCase();
    const hasKeyword = (kw: string) => {
      const re = new RegExp(`\\b${kw}\\b`, 'i');
      if (re.test(dishName)) return true;
      const lower = kw.toLowerCase();
      const boundRe = new RegExp(`(?:^|[\\s-])${lower}(?:s\\b|[\\s-]|$)`, 'i');
      return boundRe.test(n);
    };

    if (hasKeyword('Chicken') && !hasKeyword('Chickpea') && !n.includes('chick'))
      result.push(ing('Chicken', 200, 'g', 'proteins'));
    if (hasKeyword('Mutton') || hasKeyword('Lamb') || hasKeyword('Goat'))
      result.push(ing('Mutton', 200, 'g', 'proteins'));
    if (hasKeyword('Fish') || hasKeyword('Prawn') || hasKeyword('Shrimp') || hasKeyword('Seafood'))
      result.push(ing('Fish', 150, 'g', 'proteins'));
    if (hasKeyword('Paneer') || hasKeyword('Cottage Cheese'))
      result.push(ing('Paneer', 150, 'g', 'proteins'));
    if ((hasKeyword('Veg') || hasKeyword('Vegetable') || hasKeyword('Mixed')) && !n.includes('non-veg') && !n.includes('meat') && !n.includes('veggie') && !n.includes('vegetarian'))
      result.push(ing('Mixed Vegetables', 1, 'cup', 'produce'));
    if (hasKeyword('Egg') && !n.includes('veggie') && !n.includes('eggless') && !hasKeyword('Eggplant') && !n.includes('baingan') && !n.includes('brinjal'))
      result.push(ing('Eggs', 2, 'pcs', 'proteins'));
    if (hasKeyword('Beef'))
      result.push(ing('Beef', 200, 'g', 'proteins'));
    if (hasKeyword('Pork'))
      result.push(ing('Pork', 200, 'g', 'proteins'));
  }

  // INF-01: Bhindi/Okra
  if (idLower.includes('bhindi') || idLower.includes('okra')) {
    result.push(ing('Okra', 200, 'g', 'produce'));
  }
  if (idLower.includes('bhindi')) {
    result.push(ing('Onions', 2, 'pc', 'produce'));
    result.push(ing('Tomatoes', 2, 'pc', 'produce'));
  }

  // INF-02: Dahi Bhalla
  if (idLower.includes('bhalla') || idLower.includes('dahi')) {
    result.push(ing('Urad Dal', 1, 'cup', 'grains'));
    result.push(ing('Yogurt', 150, 'g', 'dairy'));
  }

  // Protein from id
  if (idLower.includes('chole') || idLower.includes('chickpea') || idLower.includes('chana') || idLower.includes('kadala'))
    result.push(ing('Chickpeas', 1, 'cup', 'grains'));
  if (idLower.includes('rajma'))
    result.push(ing('Rajma', 1, 'cup', 'grains'));
  if (idLower.includes('chana dal') || idLower.includes('chole') || idLower.includes('chickpea') || idLower.includes('kadala'))
    result.push(ing('Chana Dal', 80, 'g', 'proteins'));
  if (idLower.includes('toor dal') || idLower.includes('arhar') || idLower.includes('tur dal'))
    result.push(ing('Toor Dal', 80, 'g', 'proteins'));
  if (idLower.includes('moong dal') || idLower.includes('moong beans'))
    result.push(ing('Moong Dal', 80, 'g', 'proteins'));
  if (idLower.includes('masoor dal') || idLower.includes('red lentil'))
    result.push(ing('Masoor Dal', 80, 'g', 'proteins'));
  if ((idLower.includes('dal') || idLower.includes('lentil')) && !result.find(i => i.name.toLowerCase().includes('dal')))
    result.push(ing('Mixed Dal', 80, 'g', 'proteins'));

  if (idLower.includes('lauki') || idLower.includes('doodhi') || idLower.includes('bottle gourd') || idLower.includes('calabash'))
    result.push(ing('Bottle Gourd', 200, 'g', 'produce'));
  if (idLower.includes('sabzi') && !result.find(i => i.category === 'produce'))
    result.push(ing('Mixed Vegetables', 1, 'cup', 'produce'));

  if (idLower.includes('egg') && !idLower.includes('veggie') && !idLower.includes('eggless') && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal'))
    result.push(ing('Eggs', 2, 'pcs', 'proteins'));
  if (idLower.includes('chicken') || idLower.includes('meat'))
    result.push(ing('Chicken', 200, 'g', 'proteins'));
  if (idLower.includes('paneer'))
    result.push(ing('Paneer', 150, 'g', 'proteins'));
  if (idLower.includes('mutton') || idLower.includes('lamb'))
    result.push(ing('Mutton', 200, 'g', 'proteins'));
  if (idLower.includes('fish'))
    result.push(ing('Fish', 150, 'g', 'proteins'));

  // Grains
  if (idLower.includes('rice') || idLower.includes('biryani') || idLower.includes('pulao'))
    result.push(ing('Rice', 1, 'cup', 'grains'));
  if (idLower.includes('roti') || idLower.includes('phulka'))
    result.push(ing('Phulka', 2, 'pcs', 'grains'));
  if (idLower.includes('paratha'))
    result.push(ing('Wheat Flour', 1.5, 'cup', 'grains'));
  if (idLower.includes('bhatura') || idLower.includes('bhature'))
    result.push(ing('Maida', 1.5, 'cup', 'grains'));
  if (idLower.includes('pav'))
    result.push(ing('Pav', 2, 'pcs', 'breads'));

  if (idLower.includes('aloo') || idLower.includes('potato'))
    result.push(ing('Potatoes', 3, 'pc', 'produce'));
  if (idLower.includes('gobhi') || idLower.includes('cauliflower'))
    result.push(ing('Cauliflower', 1, 'pc', 'produce'));

  if (idLower.includes('sarson') || idLower.includes('saag')) {
    result.push(ing('Mustard Greens', 250, 'g', 'produce'));
    result.push(ing('Spinach', 100, 'g', 'produce'));
    result.push(ing('Green Chilies', 3, 'pcs', 'produce'));
    result.push(ing('Ginger', 15, 'g', 'produce'));
    result.push(ing('Garlic', 10, 'g', 'produce'));
  }
  if (idLower.includes('bajra')) {
    result.push(ing('Bajra Flour', 120, 'g', 'grains'));
    result.push(ing('White Butter', 20, 'g', 'dairy'));
  }
  if (idLower.includes('baingan') || idLower.includes('bharta')) {
    result.push(ing('Eggplant', 300, 'g', 'produce'));
    result.push(ing('Coriander Leaves', 10, 'g', 'produce'));
    result.push(ing('Lemon', 0.5, 'pc', 'produce'));
  }
  if (idLower.includes('tandoori') || idLower.includes('phulka') || idLower.includes('roti'))
    result.push(ing('Wheat Flour', 70, 'g', 'grains'));

  if ((idLower.includes('french') || idLower.includes('egg') && !idLower.includes('veggie') && !idLower.includes('eggless') || idLower.includes('bread dish') || idLower.includes('bread toast')) && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal')) {
    result.push(ing('White Bread', 4, 'pcs', 'breads'));
    result.push(ing('Eggs', 2, 'pcs', 'proteins'));
    result.push(ing('Milk', 100, 'ml', 'dairy'));
    result.push(ing('Sugar', 2, 'tbsp', 'pantry'));
    result.push(ing('Butter', 20, 'g', 'dairy'));
  }

  if (idLower.includes('bread') || idLower.includes('sandwich'))
    result.push(ing('White Bread', 4, 'slices', 'breads'));
  if (idLower.includes('jeera') || idLower.includes('cumin'))
    result.push(ing('Cumin Seeds', 1, 'tsp', 'spices'));

  if (idLower.includes('idli') || idLower.includes('dosa') || idLower.includes('uttapam')) {
    result.push(ing('Rice', 1, 'cup', 'grains'));
    result.push(ing('Urad Dal', 50, 'g', 'proteins'));
  }
  if (idLower.includes('puttu')) {
    result.push(ing('Rice Flour', 1, 'cup', 'grains'));
    result.push(ing('Coconut', 0.5, 'cup', 'produce'));
  }
  if (idLower.includes('pongal')) {
    result.push(ing('Rice', 1, 'cup', 'grains'));
    result.push(ing('Moong Dal', 50, 'g', 'proteins'));
  }

  if (idLower.includes('fruit')) {
    result.push(ing('Apple', 1, 'pc', 'produce'));
    result.push(ing('Banana', 1, 'pc', 'produce'));
    result.push(ing('Orange', 1, 'pc', 'produce'));
    result.push(ing('Mango', 1, 'pc', 'produce'));
    result.push(ing('Pomegranate', 1, 'pc', 'produce'));
    result.push(ing('Papaya', 100, 'g', 'produce'));
    result.push(ing('Watermelon', 200, 'g', 'produce'));
    result.push(ing('Grapes', 100, 'g', 'produce'));
    result.push(ing('Guava', 1, 'pc', 'produce'));
    result.push(ing('Pineapple', 100, 'g', 'produce'));
    result.push(ing('Coconut', 50, 'g', 'produce'));
  }

  if (idLower.includes('samosa') || idLower.includes('kachori')) {
    result.push(ing('Potatoes', 3, 'pc', 'produce'));
    result.push(ing('Peas', 50, 'g', 'produce'));
    result.push(ing('Wheat Flour', 200, 'g', 'grains'));
  }
  if (idLower.includes('chaat') || idLower.includes('pani-puri') || idLower.includes('bhel') || idLower.includes('sev') || idLower.includes('papdi')) {
    result.push(ing('Potatoes', 2, 'pc', 'produce'));
    result.push(ing('Yogurt', 100, 'g', 'dairy'));
    result.push(ing('Tamarind Chutney', 30, 'g', 'pantry'));
    result.push(ing('Mint Chutney', 30, 'g', 'pantry'));
  }

  if (idLower.includes('gulab') || idLower.includes('jamun')) {
    result.push(ing('Milk Powder', 200, 'g', 'pantry'));
    result.push(ing('Sugar', 200, 'g', 'pantry'));
    result.push(ing('Ghee', 50, 'g', 'dairy'));
  }
  if (idLower.includes('jalebi') || idLower.includes('imarti')) {
    result.push(ing('Maida', 200, 'g', 'grains'));
    result.push(ing('Sugar', 200, 'g', 'pantry'));
    result.push(ing('Yogurt', 100, 'g', 'dairy'));
  }
  if (idLower.includes('rasgulla') || idLower.includes('rasmalai') || idLower.includes('ras-malai')) {
    result.push(ing('Milk', 2, 'l', 'dairy'));
    result.push(ing('Sugar', 200, 'g', 'pantry'));
  }
  if (idLower.includes('kheer') || idLower.includes('payasam')) {
    result.push(ing('Rice', 50, 'g', 'grains'));
    result.push(ing('Milk', 1, 'l', 'dairy'));
    result.push(ing('Sugar', 80, 'g', 'pantry'));
  }
  if (idLower.includes('kulfi')) {
    result.push(ing('Milk', 1, 'l', 'dairy'));
    result.push(ing('Sugar', 100, 'g', 'pantry'));
  }
  if (idLower.includes('halwa')) {
    result.push(ing('Semolina (Rava)', 100, 'g', 'grains'));
    result.push(ing('Sugar', 100, 'g', 'pantry'));
    result.push(ing('Ghee', 50, 'g', 'dairy'));
  }

  if (idLower.includes('prawn') || idLower.includes('chingri') || idLower.includes('shrimp'))
    result.push(ing('Prawns', 200, 'g', 'proteins'));
  if (idLower.includes('crab') || idLower.includes('daab-chingri'))
    result.push(ing('Crab', 200, 'g', 'proteins'));
  if (idLower.includes('ilish') || idLower.includes('bhetki') || idLower.includes('rohu') || idLower.includes('salmon') || idLower.includes('trout'))
    result.push(ing('Fish', 200, 'g', 'proteins'));

  if (idLower.includes('tofu'))
    result.push(ing('Tofu', 200, 'g', 'proteins'));
  if (idLower.includes('soya') || idLower.includes('soybean') || idLower.includes('soy chunks') || idLower.includes('soy-bean')) {
    result.push(ing('Soya Chunks', 100, 'g', 'proteins'));
    result.push(ing('Onions', 2, 'pc', 'produce'));
    result.push(ing('Tomatoes', 2, 'pc', 'produce'));
  }

  if (idLower.includes('momo') || idLower.includes('thukpa')) {
    result.push(ing('Maida', 200, 'g', 'grains'));
    result.push(ing('Cabbage', 100, 'g', 'produce'));
    result.push(ing('Onions', 1, 'pc', 'produce'));
  }
  if (idLower.includes('pork') || idLower.includes('smoked-pork') || idLower.includes('naga-pork')) {
    result.push(ing('Pork', 200, 'g', 'proteins'));
    result.push(ing('Ginger', 20, 'g', 'produce'));
    result.push(ing('Garlic', 10, 'g', 'produce'));
  }

  if (idLower.includes('shukto')) {
    result.push(ing('Bitter Gourd', 100, 'g', 'produce'));
    result.push(ing('Drumsticks', 2, 'pc', 'produce'));
    result.push(ing('Raw Banana', 1, 'pc', 'produce'));
  }
  if (idLower.includes('begun') || idLower.includes('begun-bhaja')) {
    result.push(ing('Eggplant', 2, 'pc', 'produce'));
    result.push(ing('Turmeric', 1, 'tsp', 'spices'));
  }
  if (idLower.includes('kosha') || idLower.includes('kosha-mangsho')) {
    result.push(ing('Mutton', 250, 'g', 'proteins'));
    result.push(ing('Onions', 3, 'pc', 'produce'));
    result.push(ing('Potatoes', 2, 'pc', 'produce'));
  }
  if (idLower.includes('machher') || idLower.includes('macher') || idLower.includes('jhol')) {
    result.push(ing('Fish', 200, 'g', 'proteins'));
    result.push(ing('Turmeric', 1, 'tsp', 'spices'));
  }

  if (idLower.includes('medu') || idLower.includes('vada') || idLower.includes('medu-vada')) {
    result.push(ing('Urad Dal', 100, 'g', 'proteins'));
    result.push(ing('Curry Leaves', 10, 'pc', 'produce'));
  }
  if (idLower.includes('avial')) {
    result.push(ing('Mixed Vegetables', 200, 'g', 'produce'));
    result.push(ing('Coconut', 50, 'g', 'produce'));
  }

  return result;
}

function inferFromDishName(dish: Dish, existingNames: Set<string>): Ingredient[] {
  const result: Ingredient[] = [];
  const nameLower = dish.name.toLowerCase();
  const push = (ing: Ingredient) => {
    if (!existingNames.has(ing.name.toLowerCase())) result.push(ing);
  };

  if ((nameLower.includes('chole') || nameLower.includes('chickpea') || nameLower.includes('chana') || nameLower.includes('kadala')) && !existingNames.has('chickpeas'))
    push(ing('Chickpeas', 1, 'cup', 'grains'));
  if (nameLower.includes('rajma') && !existingNames.has('rajma'))
    push(ing('Rajma', 1, 'cup', 'grains'));
  if (nameLower.includes('dal') && !existingNames.has('toor dal'))
    push(ing('Toor Dal', 1, 'cup', 'grains'));
  if ((nameLower.includes('egg') && !nameLower.includes('veggie') && !nameLower.includes('eggless') && !nameLower.includes('eggplant') && !nameLower.includes('baingan') && !nameLower.includes('brinjal')) && !existingNames.has('eggs'))
    push(ing('Eggs', 2, 'pcs', 'proteins'));
  if (nameLower.includes('chicken') && !existingNames.has('chicken'))
    push(ing('Chicken', 200, 'g', 'proteins'));
  if (nameLower.includes('paneer') && !existingNames.has('paneer'))
    push(ing('Paneer', 150, 'g', 'proteins'));
  if ((nameLower.includes('mutton') || nameLower.includes('lamb')) && !existingNames.has('mutton'))
    push(ing('Mutton', 200, 'g', 'proteins'));
  if (nameLower.includes('fish') && !existingNames.has('fish'))
    push(ing('Fish', 150, 'g', 'proteins'));
  if ((nameLower.includes('bhindi') || nameLower.includes('okra')) && !existingNames.has('okra'))
    push(ing('Okra', 200, 'g', 'produce'));
  if ((nameLower.includes('bhindi') || nameLower.includes('sabzi')) && !existingNames.has('onions'))
    push(ing('Onions', 2, 'pc', 'produce'));
  if ((nameLower.includes('bhindi') || nameLower.includes('sabzi')) && !existingNames.has('tomatoes'))
    push(ing('Tomatoes', 2, 'pc', 'produce'));
  if ((nameLower.includes('aloo') || nameLower.includes('potato')) && !existingNames.has('potatoes'))
    push(ing('Potatoes', 3, 'pc', 'produce'));
  if (nameLower.includes('gobhi') || nameLower.includes('cauliflower'))
    push(ing('Cauliflower', 1, 'pc', 'produce'));

  if ((nameLower.includes('dahi') || nameLower.includes('bhalla') || nameLower.includes('chaat')) && !existingNames.has('yogurt'))
    push(ing('Yogurt', 100, 'g', 'dairy'));

  if (nameLower.includes('curry') || nameLower.includes('gravy') || nameLower.includes('korma'))
    if (!result.some(i => i.category === 'grains') && !result.some(i => i.category === 'breads') && !existingNames.has('rice'))
      push(ing('Rice', 1, 'cup', 'grains'));

  if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('onions'))
    push(ing('Onions', 1, 'pc', 'produce'));
  if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('green chilli'))
    push(ing('Green Chilli', 2, 'pc', 'produce'));

  if (nameLower.includes('avocado') && !existingNames.has('avocado'))
    push(ing('Avocado', 1, 'pc', 'produce'));
  if (nameLower.includes('peanut') && !existingNames.has('peanut butter'))
    push(ing('Peanut Butter', 2, 'tbsp', 'pantry'));

  if (nameLower.includes('smoothie') && !existingNames.has('milk'))
    push(ing('Milk', 1, 'cup', 'dairy'));
  if (nameLower.includes('smoothie') && !existingNames.has('banana'))
    push(ing('Banana', 1, 'pc', 'produce'));
  if (nameLower.includes('smoothie') && !existingNames.has('ice'))
    push(ing('Ice', 1, 'cup', 'pantry'));

  if (nameLower.includes('puttu') && !existingNames.has('rice flour'))
    push(ing('Rice Flour', 1, 'cup', 'grains'));
  if (nameLower.includes('puttu') && !existingNames.has('coconut'))
    push(ing('Coconut', 0.5, 'cup', 'produce'));

  if (nameLower.includes('burger') && !existingNames.has('burger bun'))
    push(ing('Burger Bun', 2, 'pcs', 'breads'));

  if (nameLower.includes('kheema') && !existingNames.has('minced meat'))
    push(ing('Minced Meat', 250, 'g', 'proteins'));
  if (nameLower.includes('kheema') && !existingNames.has('peas'))
    push(ing('Peas', 50, 'g', 'produce'));

  if (nameLower.includes('murgh') && !existingNames.has('chicken'))
    push(ing('Chicken', 250, 'g', 'proteins'));

  if (nameLower.includes('chepa') && !existingNames.has('fish'))
    push(ing('Fish', 200, 'g', 'proteins'));
  if (nameLower.includes('chepa') && !existingNames.has('tamarind'))
    push(ing('Tamarind', 20, 'g', 'pantry'));

  if (nameLower.includes('dondakaya') && !existingNames.has('ivy gourd'))
    push(ing('Ivy Gourd', 200, 'g', 'produce'));

  if (nameLower.includes('chikoo') && !existingNames.has('sapodilla'))
    push(ing('Sapodilla (Chikoo)', 2, 'pc', 'produce'));
  if (nameLower.includes('chikoo') && !existingNames.has('milk'))
    push(ing('Milk', 200, 'ml', 'dairy'));

  return result;
}

// ── Main analysis ──

const explicitDishes: { id: string; name: string; region: string }[] = [];
const inferredOkDishes: { id: string; name: string; region: string; count: number }[] = [];
const inferredEmptyDishes: { id: string; name: string; region: string; hasLinkOrUrl: boolean; hasDescription: boolean }[] = [];

function hasExplicitIngredients(dish: Dish): boolean {
  return dish.variants.some(v => v.ingredients && v.ingredients.length > 0);
}

function hasLinkOrUrl(dish: Dish): boolean {
  return (dish as any).link !== undefined || (dish as any).url !== undefined;
}

for (const dish of DISH_LIBRARY) {
  if (!dish.icon || !dish.region) continue;

  if (hasExplicitIngredients(dish)) {
    explicitDishes.push({ id: dish.id, name: dish.name, region: dish.region });
    continue;
  }

  // Simulate what getIngredientsForMealOption does:
  // 1. inferIngredientsFromDishId(dishId) + inferIngredientsFromDishId(variantInclusiveName)
  // 2. _inferFromDishName(dish, existingNames)
  const variant = dish.variants[0];
  const variantName = variant?.name || dish.name;

  const fromId = inferFromDishId(dish.id, variantName);
  const fromVarName = inferFromDishId(variantName);
  const seen = new Set<string>();
  const combined: Ingredient[] = [];
  for (const ing of [...fromId, ...fromVarName]) {
    const key = `${ing.name.toLowerCase()}:${ing.category}`;
    if (!seen.has(key)) { seen.add(key); combined.push(ing); }
  }
  const existingNames = new Set(combined.map(i => i.name.toLowerCase()));
  const fromName = inferFromDishName(dish, existingNames);

  const allIngredients = [...combined, ...fromName];

  if (allIngredients.length > 0) {
    inferredOkDishes.push({ id: dish.id, name: dish.name, region: dish.region, count: allIngredients.length });
  } else {
    inferredEmptyDishes.push({
      id: dish.id,
      name: dish.name,
      region: dish.region,
      hasLinkOrUrl: hasLinkOrUrl(dish),
      hasDescription: !!dish.description,
    });
  }
}

// ── Print results ──
console.log('='.repeat(80));
console.log('INGREDIENT COVERAGE ANALYSIS');
console.log('='.repeat(80));
const total = explicitDishes.length + inferredOkDishes.length + inferredEmptyDishes.length;
console.log(`Total "main" dishes (with icon + region): ${total}`);
console.log('');

console.log(`EXPLICIT ingredients (${explicitDishes.length}):`);
for (const d of explicitDishes) {
  console.log(`  ✔ ${d.id.padEnd(35)} ${d.name.padEnd(40)} [${d.region}]`);
}

console.log('');
console.log(`INFERRED_OK — has ingredients via inference (${inferredOkDishes.length}):`);
console.log(`   (dishes that have NO explicit ingredients but inference engine produces some)`);
for (const d of inferredOkDishes) {
  console.log(`  ✓ ${d.id.padEnd(35)} ${d.name.padEnd(40)} [${d.region}] (${d.count} ing)`);
}

console.log('');
console.log(`INFERRED_EMPTY — NO ingredients at all (${inferredEmptyDishes.length}):`);
console.log(`   (no explicit ingredients AND inference returns nothing)`);
for (const d of inferredEmptyDishes) {
  const flags = [];
  if (d.hasLinkOrUrl) flags.push('has-link/url');
  if (d.hasDescription) flags.push('has-description');
  const flagStr = flags.length > 0 ? ` ← ${flags.join(', ')}` : '';
  console.log(`  ✗ ${d.id.padEnd(35)} ${d.name.padEnd(40)} [${d.region}]${flagStr}`);
}

console.log('');
console.log('─'.repeat(80));
console.log(`SUMMARY: EXPLICIT=${explicitDishes.length}  INFERRED_OK=${inferredOkDishes.length}  INFERRED_EMPTY=${inferredEmptyDishes.length}`);
console.log('─'.repeat(80));

import type { Dish, Ingredient, IngredientCategory, DishVariant } from '../constants/dishLibrary';
import { getMealResolution, type MealResolution } from '../store/useStore';
import { cachedIngredients } from './cache';

export interface AggregatedIngredient {
    name: string;
    totalQuantity: number;
    unit: string;
    category: IngredientCategory;
    sources: string[]; // dish names that include this ingredient
    checked: boolean;
    id: string;
}

export interface PantryGroup {
    category: IngredientCategory;
    label: string;
    emoji: string;
    items: AggregatedIngredient[];
}

export const CATEGORY_META: Record<IngredientCategory, { label: string; emoji: string }> = {
    produce: { label: 'Fresh Stuff', emoji: '🥦' },
    dairy: { label: 'Dairy', emoji: '🥛' },
    grains: { label: 'Staples', emoji: '🌾' },
    proteins: { label: 'Proteins', emoji: '🍗' },
    spices: { label: 'Spices', emoji: '🌶️' },
    pantry: { label: 'Pantry', emoji: '🫙' },
    breads: { label: 'Breads', emoji: '🍞' },
};

const CATEGORY_ORDER: IngredientCategory[] = ['produce', 'proteins', 'dairy', 'grains', 'spices', 'pantry', 'breads'];

function toStableId(name: string, category?: string): string {
    // DO NOT normalize bread types - keep them separate!
    if (category === 'breads') {
        return name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    // For other categories, normalize aggressively
    return name.toLowerCase()
        .replace(/toast/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function aggregateIngredients(
    allIngredients: { ing: Ingredient; source: string }[]
): Map<string, AggregatedIngredient> {
    const map = new Map<string, AggregatedIngredient>();

    for (const { ing, source } of allIngredients) {
        const key = toStableId(ing.name, ing.category);
        const existing = map.get(key);

        if (existing) {
            existing.totalQuantity += ing.quantity;
            if (!existing.sources.includes(source)) {
                existing.sources.push(source);
            }
        } else {
            map.set(key, {
                name: ing.name,
                totalQuantity: ing.quantity,
                unit: ing.unit,
                category: ing.category,
                sources: [source],
                checked: false,
                id: key,
            });
        }
    }

    return map;
}

// FIX-01: Infer ingredients from dishId when dish not found in local catalog
function inferIngredientsFromDishId(dishId: string): Ingredient[] {
    const idLower = dishId.toLowerCase();
    const result: Ingredient[] = [];
    
    // INF-01: Bhindi/Okra inference
    if (idLower.includes('bhindi') || idLower.includes('okra')) {
        result.push({ name: 'Okra', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-01: Also add commonly needed produce for bhindi
    if (idLower.includes('bhindi')) {
        result.push({ name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    
    // INF-02: Dahi Bhalla → Urad Dal + Yogurt
    if (idLower.includes('bhalla') || idLower.includes('dahi')) {
        result.push({ name: 'Urad Dal', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 150, unit: 'g', category: 'dairy', inStock: false });
    }
    
    // Protein inference from dishId patterns
    if (idLower.includes('chole') || idLower.includes('chickpea') || idLower.includes('chana')) {
        result.push({ name: 'Chickpeas', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    }
    if (idLower.includes('rajma')) {
        result.push({ name: 'Rajma', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    }
    // INF-10: Dal/Lentil inference - specific types
    if (idLower.includes('chana dal') || idLower.includes('chole') || idLower.includes('chickpea')) {
        result.push({ name: 'Chana Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('toor dal') || idLower.includes('arhar') || idLower.includes('tur dal')) {
        result.push({ name: 'Toor Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('moong dal') || idLower.includes('moong beans')) {
        result.push({ name: 'Moong Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('masoor dal') || idLower.includes('red lentil')) {
        result.push({ name: 'Masoor Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if ((idLower.includes('dal') || idLower.includes('lentil')) && !result.find(i => i.name.toLowerCase().includes('dal'))) {
        result.push({ name: 'Mixed Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-10: Vegetable (Sabzi) inference - Lauki/Doodhi
    if (idLower.includes('lauki') || idLower.includes('doodhi') || idLower.includes('bottle gourd') || idLower.includes('calabash')) {
        result.push({ name: 'Bottle Gourd', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    if (idLower.includes('bhindi') || idLower.includes('okra')) {
        result.push({ name: 'Okra', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-10: Generic sabzi - add base produce if dish is a sabzi
    if (idLower.includes('sabzi') && !result.find(i => i.category === 'produce')) {
        result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    }
    // INF-05: Egg inference (from dishId)
    if (idLower.includes('egg') && !idLower.includes('eggplant')) {
        result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
    }
    if (idLower.includes('chicken') || idLower.includes('meat')) {
        result.push({ name: 'Chicken', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('paneer')) {
        result.push({ name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('mutton') || idLower.includes('lamb')) {
        result.push({ name: 'Mutton', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('fish')) {
        result.push({ name: 'Fish', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    }
    
    // Grain inference from dishId patterns
    if (idLower.includes('rice') || idLower.includes('biryani') || idLower.includes('pulao')) {
        result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    }
    if (idLower.includes('roti') || idLower.includes('phulka')) {
        result.push({ name: 'Phulka', quantity: 2, unit: 'pcs', category: 'grains', inStock: false });
    }
    if (idLower.includes('paratha')) {
        result.push({ name: 'Wheat Flour', quantity: 1.5, unit: 'cup', category: 'grains', inStock: false });
    }
    if (idLower.includes('bhatura') || idLower.includes('bhature')) {
        result.push({ name: 'Maida', quantity: 1.5, unit: 'cup', category: 'grains', inStock: false });
    }
    if (idLower.includes('pav')) {
        result.push({ name: 'Pav', quantity: 2, unit: 'pcs', category: 'breads', inStock: false });
    }
    // INF-07: Aloo/Potato inference
    if (idLower.includes('aloo') || idLower.includes('potato')) {
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-07: Gobhi/Cauliflower inference
    if (idLower.includes('gobhi') || idLower.includes('cauliflower')) {
        result.push({ name: 'Cauliflower', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-08: Sarson ka Saag inference (Punjabi specialty)
    if (idLower.includes('sarson') || idLower.includes('saag')) {
        result.push({ name: 'Mustard Greens', quantity: 250, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Spinach', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Green Chilies', quantity: 3, unit: 'pcs', category: 'produce', inStock: false });
        result.push({ name: 'Ginger', quantity: 15, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Garlic', quantity: 10, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-08: Bajra Roti inference
    if (idLower.includes('bajra')) {
        result.push({ name: 'Bajra Flour', quantity: 120, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'White Butter', quantity: 20, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-08: Baingan Bharta inference
    if (idLower.includes('baingan') || idLower.includes('bharta')) {
        result.push({ name: 'Eggplant', quantity: 300, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coriander Leaves', quantity: 10, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Lemon', quantity: 0.5, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-08: Tandoori Roti / Phulka inference  
    if (idLower.includes('tandoori') || idLower.includes('phulka') || idLower.includes('roti')) {
        result.push({ name: 'Wheat Flour', quantity: 70, unit: 'g', category: 'grains', inStock: false });
    }
    // INF-09: French Toast / Egg Toast / Bread Dish inference
    if (idLower.includes('french') || idLower.includes('egg') || idLower.includes('bread dish') || idLower.includes('bread toast')) {
        result.push({ name: 'White Bread', quantity: 4, unit: 'pcs', category: 'breads', inStock: false });
        result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
        result.push({ name: 'Milk', quantity: 100, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Butter', quantity: 20, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-04: Ghee/Butter (common in Indian cooking)
    result.push({ name: 'Ghee', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    result.push({ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    result.push({ name: 'Spices', quantity: 1, unit: 'packet', category: 'spices', inStock: false });
    
    // Add defaults if no pattern matched
    if (result.length === 0) {
        result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        result.push({ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Spices', quantity: 1, unit: 'packet', category: 'spices', inStock: false });
    }
    
    return result;
}

const INGREDIENT_CACHE = new Map<string, Ingredient[]>();

export function invalidateIngredientCache(): void {
    INGREDIENT_CACHE.clear();
}

function getIngredientsForMealOption(
    dishId: string,
    variantId: string,
    dishes: Dish[]
): Ingredient[] {
    const cacheKey = `${dishId}::${variantId}`;
    if (INGREDIENT_CACHE.has(cacheKey)) return INGREDIENT_CACHE.get(cacheKey)!;

    const dish = dishes.find(d => d.id === dishId);
    let variant: DishVariant | undefined;
    if (dish) {
        variant = dish.variants.find(v => v.id === variantId);
        if (!variant && variantId) {
            variant = dish.variants.find(v => variantId.includes(v.id) || v.id.includes(variantId));
        }
        if (!variant) variant = dish.variants[0];
        if (variant) {
            const r: Ingredient[] = [...(variant.ingredients || [])];
            if (r.length === 0) r.push(...inferIngredientsFromDishId(dishId));
            const existingNames = new Set(r.map(i => i.name.toLowerCase()));
            for (const ing of inferIngredientsFromDishId(dishId)) {
                if (!existingNames.has(ing.name.toLowerCase())) r.push(ing);
            }
            r.push(..._resolveAccompaniments(variant), ..._inferFromDishName(dish, new Set(r.map(i => i.name.toLowerCase()))));
            INGREDIENT_CACHE.set(cacheKey, r);
            return r;
        }
    }
    const result: Ingredient[] = inferIngredientsFromDishId(dishId);
    INGREDIENT_CACHE.set(cacheKey, result);
    return result;
}

// ─── Accompaniment alias maps (module-level — created once, not per call) ───────

const BREAD_ALIASES: Record<string, string> = {
    'milk-bread': 'White Bread', 'white-bread': 'White Bread',
    'brown-bread': 'Brown Bread', 'multigrain-bread': 'Multigrain Bread',
    'pav': 'Pav', 'paratha': 'Paratha', 'naan': 'Naan', 'luchi': 'Luchi',
    'toast': 'White Bread', 'toast-bread': 'White Bread',
    'white-bread-toast': 'White Bread',
    'bread slice': 'White Bread', 'bread slices': 'White Bread',
    'milk bread': 'White Bread', 'white bread': 'White Bread',
    'brown bread': 'Brown Bread', 'multigrain': 'Multigrain Bread',
    'tandoori-roti': 'Tandoori Roti', 'rumali-roti': 'Rumali Roti',
    'missi-roti': 'Missi Roti', 'bajra-roti': 'Bajra Roti',
    'makki-roti': 'Makki di Roti', 'phulka': 'Phulka',
    'roti': 'Roti', 'chapatti': 'Roti',
};

const BREAD_DEFAULTS: Record<string, { qty: number; unit: string }> = {
    'white bread': { qty: 2, unit: 'slices' },
    'milk bread': { qty: 2, unit: 'slices' },
    'brown bread': { qty: 2, unit: 'slices' },
    'multigrain bread': { qty: 2, unit: 'slices' },
    'pav': { qty: 2, unit: 'pcs' },
    'paratha': { qty: 1, unit: 'pc' },
    'tandoori roti': { qty: 2, unit: 'pcs' },
    'bajra roti': { qty: 2, unit: 'pcs' },
    'makki di roti': { qty: 2, unit: 'pcs' },
};

const GRAIN_ALIASES: Record<string, string> = {
    'roti': 'Roti', 'phulka': 'Phulka',
    'steamed-rice': 'Steamed Rice', 'jeera-rice': 'Jeera Rice', 'rice': 'Rice',
    'bajra-roti': 'Bajra Roti', 'makki-di-roti': 'Makki di Roti', 'missi-roti': 'Missi Roti',
};

const DAIRY_ALIASES: Record<string, string> = {
    'curd': 'Yogurt', 'dahi': 'Yogurt', 'yogurt': 'Yogurt',
    'buttermilk': 'Buttermilk', 'lassi': 'Lassi', 'raita': 'Raita',
    'butter': 'Butter', 'cream': 'Cream', 'paneer': 'Paneer',
};

const PRODUCE_ALIASES: Record<string, string> = {
    'salad': 'Salad Mix', 'onion': 'Onions', 'green-chili': 'Green Chilli',
    'pickle': 'Pickle', 'chutney': 'Chutney', 'papad': 'Papad',
    'lauki': 'Bottle Gourd', 'doodhi': 'Bottle Gourd', 'bottle gourd': 'Bottle Gourd',
    'bhindi': 'Okra', 'okra': 'Okra',
    'aloo': 'Potatoes', 'potato': 'Potatoes', 'tomato': 'Tomatoes',
    'onions': 'Onions', 'paneer': 'Paneer',
    'palak': 'Spinach', 'spinach': 'Spinach',
    'sarson': 'Mustard Greens', 'mustard greens': 'Mustard Greens',
    'methi': 'Fenugreek Leaves', 'fenugreek': 'Fenugreek Leaves',
    'chaulai': 'Amaranth Leaves',
    'kabuli chana': 'Chickpeas', 'chickpeas': 'Chickpeas', 'chole': 'Chickpeas',
};

const DAL_DEFAULTS: Record<string, { qty: number; unit: string }> = {
    'chana dal': { qty: 80, unit: 'g' },
    'toor dal': { qty: 80, unit: 'g' },
    'moong dal': { qty: 80, unit: 'g' },
    'masoor dal': { qty: 80, unit: 'g' },
};

const PRODUCE_DEFAULTS: Record<string, { qty: number; unit: string }> = {
    'palak': { qty: 150, unit: 'g' }, 'spinach': { qty: 150, unit: 'g' },
    'sarson': { qty: 250, unit: 'g' }, 'mustard greens': { qty: 250, unit: 'g' },
    'methi': { qty: 100, unit: 'g' }, 'fenugreek': { qty: 100, unit: 'g' },
    'chaulai': { qty: 100, unit: 'g' },
    'lauki': { qty: 200, unit: 'g' }, 'bottle gourd': { qty: 200, unit: 'g' },
    'bhindi': { qty: 200, unit: 'g' }, 'okra': { qty: 200, unit: 'g' },
    'kabuli chana': { qty: 60, unit: 'g' }, 'chickpeas': { qty: 60, unit: 'g' }, 'chole': { qty: 60, unit: 'g' },
};

function _isBread(s: string): boolean {
    const l = s.toLowerCase();
    return !!BREAD_ALIASES[l] || l.includes('-bread') || l.includes('pav') ||
        l === 'paratha' || l === 'naan' || l === 'luchi' || l === 'toast' || l.includes('toast');
}

function _isGrain(s: string): boolean {
    const l = s.toLowerCase();
    return !!GRAIN_ALIASES[l] || l.includes('rice') || l === 'phulka' || l === 'roti';
}

function _toBaseName(name: string): string {
    return name.toLowerCase().replace(/toast/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function _resolveAccompaniments(variant: Dish['variants'][0]): Ingredient[] {
    const result: Ingredient[] = [];
    for (const acc of variant.accompaniments || []) {
        const accLower = acc.toLowerCase();
        const baseName = _toBaseName(acc);

        if (result.some(i => _toBaseName(i.name) === baseName)) continue;

        let grainName = GRAIN_ALIASES[accLower];
        if (!grainName && _isGrain(acc)) {
            grainName = accLower.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        if (grainName) {
            result.push({ name: grainName, quantity: 1, unit: 'cup', category: 'grains', inStock: false });
            continue;
        }

        let breadName = BREAD_ALIASES[accLower];
        if (!breadName && _isBread(acc)) {
            breadName = accLower.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        if (breadName) {
            const def = BREAD_DEFAULTS[breadName.toLowerCase()];
            result.push({ name: breadName, quantity: def?.qty ?? 2, unit: def?.unit ?? 'pcs', category: 'breads', inStock: false });
            continue;
        }

        const dairyKey = Object.keys(DAIRY_ALIASES).find(k => accLower.includes(k));
        if (dairyKey !== undefined) {
            result.push({ name: DAIRY_ALIASES[dairyKey]!, quantity: 100, unit: 'g', category: 'dairy', inStock: false });
            continue;
        }

        let produceName = PRODUCE_ALIASES[accLower];
        let produceQty = 1;
        let produceUnit = 'pc';
        let category: IngredientCategory = 'produce';

        const dalKey = Object.keys(DAL_DEFAULTS).find(k => accLower.includes(k));
        if (dalKey) {
            const dalDefaults = DAL_DEFAULTS[dalKey]!;
            const dalWord = dalKey.split(' ')[0]!;
            produceName = dalWord.charAt(0).toUpperCase() + dalWord.slice(1) + ' Dal';
            produceQty = dalDefaults.qty;
            produceUnit = dalDefaults.unit;
            category = 'proteins';
        }

        if (!produceName) {
            const produceKey = Object.keys(PRODUCE_ALIASES).find(k => accLower.includes(k));
            if (produceKey) produceName = PRODUCE_ALIASES[produceKey];
        }
        if (!produceName) {
            const produceKey = Object.keys(PRODUCE_DEFAULTS).find(k => accLower.includes(k));
            if (produceKey) {
                produceName = produceKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const def = PRODUCE_DEFAULTS[produceKey]!;
                produceQty = def.qty;
                produceUnit = def.unit;
            }
        }

        if (produceName) {
            result.push({ name: produceName, quantity: produceQty, unit: produceUnit, category, inStock: false });
        }
    }
    return result;
}

function _inferFromDishName(dish: Dish, existingNames: Set<string>): Ingredient[] {
    const result: Ingredient[] = [];
    const nameLower = dish.name.toLowerCase();

    const push = (ing: Ingredient) => {
        if (!existingNames.has(ing.name.toLowerCase())) result.push(ing);
    };

    if ((nameLower.includes('chole') || nameLower.includes('chickpea') || nameLower.includes('chana')) && !existingNames.has('chickpeas'))
        result.push({ name: 'Chickpeas', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if (nameLower.includes('rajma') && !existingNames.has('rajma'))
        result.push({ name: 'Rajma', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if (nameLower.includes('dal') && !existingNames.has('toor dal'))
        result.push({ name: 'Toor Dal', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if ((nameLower.includes('egg') && !nameLower.includes('eggplant')) && !existingNames.has('eggs'))
        result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
    if (nameLower.includes('chicken') && !existingNames.has('chicken'))
        result.push({ name: 'Chicken', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    if (nameLower.includes('paneer') && !existingNames.has('paneer'))
        result.push({ name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    if ((nameLower.includes('mutton') || nameLower.includes('lamb')) && !existingNames.has('mutton'))
        result.push({ name: 'Mutton', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    if (nameLower.includes('fish') && !existingNames.has('fish'))
        result.push({ name: 'Fish', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    if ((nameLower.includes('bhindi') || nameLower.includes('okra')) && !existingNames.has('okra'))
        result.push({ name: 'Okra', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    if ((nameLower.includes('bhindi') || nameLower.includes('sabzi')) && !existingNames.has('onions'))
        result.push({ name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    if ((nameLower.includes('bhindi') || nameLower.includes('sabzi')) && !existingNames.has('tomatoes'))
        result.push({ name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    if ((nameLower.includes('aloo') || nameLower.includes('potato')) && !existingNames.has('potatoes'))
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
    if (nameLower.includes('gobhi') || nameLower.includes('cauliflower'))
        result.push({ name: 'Cauliflower', quantity: 1, unit: 'pc', category: 'produce', inStock: false });

    if ((nameLower.includes('dahi') || nameLower.includes('bhalla') || nameLower.includes('chaat')) && !existingNames.has('yogurt'))
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });

    if (nameLower.includes('curry') || nameLower.includes('gravy') || nameLower.includes('korma'))
        if (!result.some(i => i.category === 'grains') && !result.some(i => i.category === 'breads') && !existingNames.has('rice'))
            result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });

    return result;
}

export async function resolveMealIngredientsAsync(dishId: string, variantId?: string): Promise<Ingredient[]> {
    try {
        const res = await fetch(`/api/v1/ingredients/resolve/${dishId}${variantId ? '?variantId=' + variantId : ''}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        // Convert byCategory to flat array
        const byCat = data.byCategory || {};
        const all = Object.values(byCat).flat() as any[];
        return all.map(i => ({...i, inStock: false}));
    } catch (e) {
        console.error('[ING] Resolve failed:', dishId, e);
        return [];
    }
}

export function deriveIngredientsForDay(
    date: string,
    slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks',
    trayLibrary: any,
    swaps: any,
    dishes: Dish[]
): { ing: Ingredient; source: string }[] {
    const result: { ing: Ingredient; source: string }[] = [];

    const resolution: MealResolution = getMealResolution(trayLibrary, swaps, date, slot, dishes);
    const meal = resolution.meal;

    // TC-07: Skip empty or zero quantity meals
    if (!meal || meal.quantity === 0) return result;

    // NEW: Filter out past/missed slots for pantry
    // Import isSlotLocked and isSlotMissed from useStore (need to handle this carefully)
    // For now, we'll check time-based filtering here
    const now = new Date();
    const slotHourMap: Record<string, number> = { Breakfast: 8, Lunch: 13, Snacks: 16, Dinner: 20 };
    const slotEndHour = (slotHourMap[slot] || 12) + 1; // 1 hour grace

    // Build local midnight for the given date — avoids UTC-vs-local ambiguity
    const localMidnight = new Date(date + 'T00:00:00');
    localMidnight.setHours(0, 0, 0, 0);
    const slotDate = new Date(localMidnight);
    slotDate.setHours(slotEndHour);

    // Compare using local date strings — consistent timezone across all operations
    const today = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    if (date < today) return result; // Past day - skip
    if (date === today && now >= slotDate) return result; // Slot time passed today

    const ingredients = getIngredientsForMealOption(meal.dishId, meal.variantId || '', dishes);
    const source = meal.variant ? `${meal.name} ${meal.variant}` : meal.name;
    const qty = meal.quantity || 1;

    for (const ing of ingredients) {
        result.push({ 
            ing: { ...ing, quantity: ing.quantity * qty }, 
            source 
        });
    }

    return result;
}

export function deriveIngredientsForDateRange(
    startDate: string,
    endDate: string,
    slots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[],
    trayLibrary: any,
    swaps: any,
    dishes: Dish[]
): { ing: Ingredient; source: string }[] {
    const result: { ing: Ingredient; source: string }[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toLocaleDateString('en-CA');
        for (const slot of slots) {
            const dayIngredients = deriveIngredientsForDay(isoDate, slot, trayLibrary, swaps, dishes);
            result.push(...dayIngredients);
        }
    }

    return result;
}

export function buildPantryGroups(
    allIngredients: { ing: Ingredient; source: string }[]
): PantryGroup[] {
    // Consolidate grains: all rice variants → Basmati Rice, wheat items → Wheat Flour
    const consolidated = consolidateGrains(allIngredients);
    const aggregated = aggregateIngredients(consolidated);

    const groups = new Map<IngredientCategory, AggregatedIngredient[]>();

    for (const item of aggregated.values()) {
        // Convert cup to grams for grains
        if (item.unit === 'cup' && item.category === 'grains') {
            // Rice: 1 cup = 185g, Roti/Phulka flour: 1 cup = 120g
            const gramsPerCup = item.name.toLowerCase().includes('rice') ? 185 : 120;
            item.unit = 'g';
            item.totalQuantity = Math.round(item.totalQuantity * gramsPerCup);
            // Convert to kg if > 1000g
            if (item.totalQuantity >= 1000) {
                item.totalQuantity = Number((item.totalQuantity / 1000).toFixed(1));
                item.unit = 'kg';
            }
        }
        
        const existing = groups.get(item.category) || [];
        existing.push(item);
        groups.set(item.category, existing);
    }

    // Sort items within each group alphabetically
    for (const items of groups.values()) {
        items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return CATEGORY_ORDER
        .filter(cat => groups.has(cat))
        .map(cat => ({
            category: cat,
            label: CATEGORY_META[cat].label,
            emoji: CATEGORY_META[cat].emoji,
            items: groups.get(cat)!,
        }));
}

function consolidateGrains(allIngredients: { ing: Ingredient; source: string }[]): { ing: Ingredient; source: string }[] {
    const riceNames = ['rice', 'steamed rice', 'jeera rice', 'biryani', 'pulao'];
    const wheatNames = ['roti', 'phulka', 'atta', 'wheat flour', 'paratha', 'nan', 'naan'];
    
    return allIngredients.map(({ ing, source }) => {
        if (ing.category !== 'grains') return { ing, source };
        
        const nameLower = ing.name.toLowerCase();
        if (riceNames.some(r => nameLower.includes(r))) {
            return { ing: { ...ing, name: 'Basmati Rice' }, source };
        }
        if (wheatNames.some(w => nameLower.includes(w))) {
            return { ing: { ...ing, name: 'Wheat Flour (Atta)' }, source };
        }
        return { ing, source };
    });
}

export function getTomorrowISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
}

export function getWeekEndISO(): string {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toLocaleDateString('en-CA');
}

export function getMealNamesForDay(
    date: string,
    trayLibrary: any,
    swaps: any,
    dishes: Dish[],
    includeSnacks = false
): { slot: string; name: string; variant: string | undefined }[] {
    const baseSlots: ('Breakfast' | 'Lunch' | 'Dinner' | 'Snacks')[] = ['Breakfast', 'Lunch', 'Dinner'];
    const slots = includeSnacks ? [...baseSlots, 'Snacks' as const] : baseSlots;
    return slots.map(slot => {
        const res = getMealResolution(trayLibrary, swaps, date, slot, dishes);
        return {
            slot,
            name: res.meal?.name || '',
            variant: res.meal?.variant || undefined,
        };
    }).filter(m => m.name);
}
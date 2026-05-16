export type DishStyle =
  | 'gravy'
  | 'dry-sabzi'
  | 'fry-tadka'
  | 'roast-tandoori'
  | 'steam-boil'
  | 'rice-biryani'
  | 'breakfast'
  | 'sweet-dessert'
  | 'bread'
  | 'side'
  | 'beverage';

export interface StyleRoutingOverrides {
  breads?: string[];
  rice?: string[];
  sides?: string[];
  beverages?: string[];
  inferBread: boolean;
  inferRice: boolean;
}

const DISH_STYLE_MAP: Record<string, { style: DishStyle; subTag?: string }> = {
  // ── Gravy ──────────────────────────────────────────────
  'dal-tadka': { style: 'gravy', subTag: 'tempered' },
  'dal-makhani': { style: 'gravy', subTag: 'creamy' },
  'soybean-matar': { style: 'gravy', subTag: 'wet' },
  'soya-chunks-masala': { style: 'gravy', subTag: 'wet' },
  'paneer-butter-masala': { style: 'gravy', subTag: 'creamy' },
  'shahi-paneer': { style: 'gravy', subTag: 'creamy' },
  'kadai-paneer': { style: 'gravy', subTag: 'spicy' },
  'palak-paneer': { style: 'gravy', subTag: 'green' },
  'paneer-lababdar': { style: 'gravy', subTag: 'rich' },
  'tofu-tikka-masala': { style: 'gravy', subTag: 'creamy' },
  'paneer-tikka-masala': { style: 'gravy', subTag: 'smoky' },
  'malai-kofta': { style: 'gravy', subTag: 'creamy' },
  'aloo-kofta': { style: 'gravy', subTag: 'creamy' },
  'paneer-kofta': { style: 'gravy', subTag: 'creamy' },
  'mushroom-masala': { style: 'gravy', subTag: 'spicy' },
  'rajma-chawal': { style: 'gravy', subTag: 'thick' },
  'chole': { style: 'gravy', subTag: 'spicy' },
  'kadhi-pakora': { style: 'gravy', subTag: 'tangy' },
  'fish-curry-kerala': { style: 'gravy', subTag: 'coconut' },
  'egg-curry-north': { style: 'gravy', subTag: 'spicy' },
  'chettinad-egg-masala': { style: 'gravy', subTag: 'spicy' },
  'chicken-stew': { style: 'gravy', subTag: 'coconut' },
  'andhra-prawn-masala': { style: 'gravy', subTag: 'spicy' },
  'tofu-chettinad': { style: 'gravy', subTag: 'spicy' },
  'rogan-josh': { style: 'gravy', subTag: 'rich' },
  'butter-chicken': { style: 'gravy', subTag: 'creamy' },
  'veggie-kofta-south': { style: 'gravy', subTag: 'coconut' },
  'machher-jhol': { style: 'gravy', subTag: 'light' },
  'mutton-kosha': { style: 'gravy', subTag: 'rich' },
  'chingri-malai': { style: 'gravy', subTag: 'coconut' },
  'soybean-curry': { style: 'gravy', subTag: 'wet' },
  'chicken-bastar': { style: 'gravy', subTag: 'spicy' },
  'bengali-kofta': { style: 'gravy', subTag: 'light' },
  'pooja-kofta': { style: 'gravy', subTag: 'light' },
  'dalna': { style: 'gravy', subTag: 'light' },
  'gujarati-kadhi': { style: 'gravy', subTag: 'sweet' },
  'mp-kofta': { style: 'gravy', subTag: 'creamy' },
  'dal-kofta': { style: 'gravy', subTag: 'creamy' },
  'dal-tadka-central': { style: 'gravy', subTag: 'tempered' },
  'chole-central': { style: 'gravy', subTag: 'spicy' },
  'kadai-mushroom': { style: 'gravy', subTag: 'spicy' },
  'amritsari-chole': { style: 'gravy', subTag: 'spicy' },

  // ── Dry / Sabzi ────────────────────────────────────────
  'mix-veg': { style: 'dry-sabzi', subTag: 'dry' },
  'methi-aloo': { style: 'dry-sabzi', subTag: 'dry' },
  'bhindi-do-pyaza': { style: 'dry-sabzi', subTag: 'dry' },
  'gobi-aloo': { style: 'dry-sabzi', subTag: 'dry' },
  'paneer-bhurji': { style: 'dry-sabzi', subTag: 'crumble' },
  'paneer-bhurji-central': { style: 'dry-sabzi', subTag: 'crumble' },
  'alu-posto': { style: 'dry-sabzi', subTag: 'poppy' },
  'shukto': { style: 'dry-sabzi', subTag: 'bitter' },
  'chorer-ghonto': { style: 'dry-sabzi', subTag: 'dry' },
  'begun-bhaja': { style: 'dry-sabzi', subTag: 'fried' },
  'salmon-paturi': { style: 'dry-sabzi', subTag: 'steamed' },

  // ── Fry / Tadka ────────────────────────────────────────
  'egg-bhurji': { style: 'fry-tadka', subTag: 'crumble' },
  'masala-omelette': { style: 'fry-tadka', subTag: 'egg' },
  'masala-prawn-fry': { style: 'fry-tadka', subTag: 'crisp' },
  'bhetki-fry': { style: 'fry-tadka', subTag: 'crisp' },
  'maach-bhaja': { style: 'fry-tadka', subTag: 'crisp' },
  'soya-chunks-do-pyaza': { style: 'fry-tadka', subTag: 'crisp' },
  'aloo-tikki': { style: 'fry-tadka', subTag: 'crisp' },
  'aloo-bonda': { style: 'fry-tadka', subTag: 'fried' },
  'paneer-pakora': { style: 'fry-tadka', subTag: 'fried' },

  // ── Roast / Tandoori ───────────────────────────────────
  'paneer-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'hariyali-paneer-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'malai-tikka': { style: 'roast-tandoori', subTag: 'tandoor' },
  'tandoori-chicken': { style: 'roast-tandoori', subTag: 'tandoor' },
  'seekh-kebab': { style: 'roast-tandoori', subTag: 'grilled' },

  // ── Steam / Boil ───────────────────────────────────────
  'idli': { style: 'steam-boil', subTag: 'steamed' },
  'rava-idli': { style: 'steam-boil', subTag: 'steamed' },
  'dosa': { style: 'steam-boil', subTag: 'fermented' },
  'rava-dosa': { style: 'steam-boil', subTag: 'crisp' },
  'set-dosa': { style: 'steam-boil', subTag: 'spongy' },
  'pesarattu': { style: 'steam-boil', subTag: 'green' },
  'uttapam': { style: 'steam-boil', subTag: 'thick' },
  'medu-vada': { style: 'steam-boil', subTag: 'fried' },
  'dhokla': { style: 'steam-boil', subTag: 'fermented' },
  'momos': { style: 'steam-boil', subTag: 'steamed' },
  'dal-khichdi': { style: 'steam-boil', subTag: 'porridge' },
  'sabudana-khichdi': { style: 'steam-boil', subTag: 'light' },
  'instant-upma': { style: 'steam-boil', subTag: 'dry' },
  'rava-upma': { style: 'steam-boil', subTag: 'dry' },
  'vegetable-upma': { style: 'steam-boil', subTag: 'dry' },
  'bisi-bele-bath': { style: 'steam-boil', subTag: 'spiced' },
  'khandvi': { style: 'steam-boil', subTag: 'rolled' },

  // ── Rice / Biryani ─────────────────────────────────────
  'jeera-rice': { style: 'rice-biryani', subTag: 'plain' },
  'veg-biryani': { style: 'rice-biryani', subTag: 'layered' },
  'hyderabadi-biryani': { style: 'rice-biryani', subTag: 'dum' },
  'veg-pulao-north': { style: 'rice-biryani', subTag: 'aromatic' },
  'veg-pulao': { style: 'rice-biryani', subTag: 'aromatic' },
  'lemon-rice': { style: 'rice-biryani', subTag: 'tangy' },
  'curd-rice': { style: 'rice-biryani', subTag: 'cooling' },
  'tamarind-rice': { style: 'rice-biryani', subTag: 'tangy' },
  'coconut-rice': { style: 'rice-biryani', subTag: 'fragrant' },
  'tomato-rice': { style: 'rice-biryani', subTag: 'spicy' },
  'egg-fried-rice': { style: 'rice-biryani', subTag: 'fried' },
  'sambhar-rice': { style: 'rice-biryani', subTag: 'south' },
  'pakhala-bhata': { style: 'rice-biryani', subTag: 'fermented' },
  'muri-ghonto': { style: 'rice-biryani', subTag: 'head' },

  // ── Breakfast ──────────────────────────────────────────
  'poha-mp': { style: 'breakfast', subTag: 'flattened' },
  'aloo-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'bedmi-puri': { style: 'breakfast', subTag: 'fried' },
  'gobhi-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'mooli-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'dal-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'methi-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'mix-paratha': { style: 'breakfast', subTag: 'stuffed' },
  'bread-toast': { style: 'breakfast', subTag: 'toasted' },
  'french-toast': { style: 'breakfast', subTag: 'sweet' },
  'sandwich': { style: 'breakfast', subTag: 'stacked' },
  'methi-thepla': { style: 'breakfast', subTag: 'spiced' },
  'shankhali': { style: 'breakfast', subTag: 'fried' },
  'chole-bhature': { style: 'breakfast', subTag: 'fried' },
  'kachori': { style: 'breakfast', subTag: 'fried' },
  'egg-appam': { style: 'breakfast', subTag: 'egg' },
  'egg-podi-dosa': { style: 'breakfast', subTag: 'egg' },

  // ── Sweet / Dessert ────────────────────────────────────
  'gulab-jamun': { style: 'sweet-dessert', subTag: 'fried' },
  'jalebi': { style: 'sweet-dessert', subTag: 'crispy' },
  'rasgulla': { style: 'sweet-dessert', subTag: 'spongy' },
  'kheer': { style: 'sweet-dessert', subTag: 'rice' },
  'kesari-bath': { style: 'sweet-dessert', subTag: 'semolina' },
  'aamras': { style: 'sweet-dessert', subTag: 'pulp' },
  'shrikhand': { style: 'sweet-dessert', subTag: 'yogurt' },
  'basundi': { style: 'sweet-dessert', subTag: 'thick' },
  'mishti-doi': { style: 'sweet-dessert', subTag: 'yogurt' },
  'sandesh': { style: 'sweet-dessert', subTag: 'cheese' },
  'imarti': { style: 'sweet-dessert', subTag: 'crispy' },
  'payasam': { style: 'sweet-dessert', subTag: 'kheer' },

  // ── Bread (self-carb, not a dish needing routing) ──────
  'tandoori-roti': { style: 'bread', subTag: 'tandoor' },
  'butter-naan': { style: 'bread', subTag: 'tandoor' },
  'white-bread': { style: 'bread', subTag: 'white' },
  'brown-bread': { style: 'bread', subTag: 'brown' },
  'milk-bread': { style: 'bread', subTag: 'milk' },
  'pav': { style: 'bread', subTag: 'soft' },
  'bhakri': { style: 'bread', subTag: 'millet' },
  'jolada-roti': { style: 'bread', subTag: 'millet' },
  'khoba-roti': { style: 'bread', subTag: 'thick' },
  'luchi-aloo': { style: 'bread', subTag: 'fried' },
  'dal-bafla': { style: 'bread', subTag: 'baked' },
  'litti-chokha': { style: 'bread', subTag: 'baked' },

  // ── Side / Accompaniment ───────────────────────────────
  'dahi-bhalla': { style: 'side', subTag: 'cooling' },
  'papdi-chaat': { style: 'side', subTag: 'crisp' },
  'sev-poori': { style: 'side', subTag: 'crisp' },
  'dahi-puri': { style: 'side', subTag: 'cooling' },
  'chole-tikki': { style: 'side', subTag: 'hearty' },
  'pani-puri': { style: 'side', subTag: 'crisp' },
  'samosa': { style: 'side', subTag: 'fried' },
  'veg-manchurian': { style: 'side', subTag: 'fried' },
  'sev-vada': { style: 'side', subTag: 'fried' },
  'ragda-pattice': { style: 'side', subTag: 'hearty' },
  'thukpa': { style: 'side', subTag: 'soup' },
  'north-fruit-chaat': { style: 'side', subTag: 'fruit' },
  'west-fruit-cream': { style: 'side', subTag: 'fruit' },
  'south-fruit-pachadi': { style: 'side', subTag: 'fruit' },
  'east-fruit-payesh': { style: 'side', subTag: 'fruit' },

  // ── Beverage ───────────────────────────────────────────
  'lassi': { style: 'beverage', subTag: 'yogurt' },
  'masala-chaai': { style: 'beverage', subTag: 'spiced' },
  'chaas': { style: 'beverage', subTag: 'digestive' },
  'kokam-sherbhat': { style: 'beverage', subTag: 'cooling' },
};

export function getDishStyle(dishId: string): DishStyle | undefined {
  return DISH_STYLE_MAP[dishId]?.style;
}

export function getDishSubTag(dishId: string): string | undefined {
  return DISH_STYLE_MAP[dishId]?.subTag;
}

export function isGravyDish(dishId: string): boolean {
  return DISH_STYLE_MAP[dishId]?.style === 'gravy';
}

export function isDryDish(dishId: string): boolean {
  return getDishStyle(dishId) === 'dry-sabzi';
}

const STYLE_ROUTING: Record<DishStyle, StyleRoutingOverrides> = {
  'gravy': {
    breads: ['Tandoori Roti', 'Butter Naan'],
    rice: ['Jeera Rice', 'Steamed Rice'],
    sides: ['Raita', 'Salad'],
    beverages: ['Chaas', 'Water'],
    inferBread: true,
    inferRice: true,
  },
  'dry-sabzi': {
    breads: ['Tandoori Roti', 'Missi Roti'],
    rice: ['Steamed Rice', 'Lemon Rice'],
    sides: ['Papad', 'Salad'],
    beverages: ['Chaas', 'Water'],
    inferBread: true,
    inferRice: true,
  },
  'fry-tadka': {
    breads: ['Tandoori Roti', 'Paratha'],
    rice: [],
    sides: ['Onion Salad', 'Lemon Wedge'],
    beverages: ['Nimbu Pani', 'Buttermilk'],
    inferBread: true,
    inferRice: false,
  },
  'roast-tandoori': {
    breads: ['Butter Naan', 'Tandoori Roti'],
    rice: [],
    sides: ['Mint Chutney', 'Onion Rings'],
    beverages: ['Lassi', 'Water'],
    inferBread: true,
    inferRice: false,
  },
  'steam-boil': {
    breads: [],
    rice: [],
    sides: ['Coconut Chutney', 'Sambar'],
    beverages: ['Filter Coffee', 'Tea'],
    inferBread: false,
    inferRice: false,
  },
  'rice-biryani': {
    breads: [],
    rice: [],
    sides: ['Raita', 'Salad'],
    beverages: ['Raita', 'Water'],
    inferBread: false,
    inferRice: false,
  },
  'breakfast': {
    breads: [],
    rice: [],
    sides: ['Chutney', 'Sambar'],
    beverages: ['Tea', 'Coffee'],
    inferBread: false,
    inferRice: false,
  },
  'sweet-dessert': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'bread': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'side': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
  'beverage': {
    breads: [],
    rice: [],
    sides: [],
    beverages: [],
    inferBread: false,
    inferRice: false,
  },
};

export function getStyleRouting(style: DishStyle): StyleRoutingOverrides {
  return STYLE_ROUTING[style];
}

export interface StyleWarning {
  type: 'duplicate-gravy';
  message: string;
  swapFrom: string;
  swapTo: string;
  swapToId: string;
}

export function getSwapSuggestion(style: DishStyle): { swapToStyle: DishStyle; suggestion: string; exampleDishId: string } | null {
  switch (style) {
    case 'gravy':
      return { swapToStyle: 'dry-sabzi', suggestion: 'Bhindi Fry (Dry)', exampleDishId: 'bhindi-do-pyaza' };
    default:
      return null;
  }
}

export function computeStyleWarnings(meals: { mealId: string; name: string }[]): StyleWarning[] {
  const warnings: StyleWarning[] = [];
  const gravyItems = meals.filter(m => isGravyDish(m.mealId));
  if (gravyItems.length >= 2) {
    const swap = getSwapSuggestion('gravy');
    if (swap) {
      const alreadyAdded = meals.some(m =>
        m.name.toLowerCase().trim() === swap.suggestion.toLowerCase().trim()
      );
      if (!alreadyAdded) {
        warnings.push({
          type: 'duplicate-gravy',
          message: `Swap ${gravyItems[0]!.name} for ${swap.suggestion} for better balance`,
          swapFrom: gravyItems[0]!.mealId,
          swapTo: swap.suggestion,
          swapToId: swap.exampleDishId,
        });
      }
    }
  }
  return warnings;
}

// ─── Indian Meal Categories — Master catalog of accompaniments ─────────────

export type IndianMealCategory = 'bread' | 'rice' | 'beverage' | 'side' | 'dessert';

/**
 * Indian meal category options for meal combination logic.
 * System uses these for smart suggestions and default pairings.
 * Users can freely add any category to any meal slot.
 */
export const indian_meal_categories: Record<IndianMealCategory, string[]> = {
  bread: [
    'Roti / Phulka', 'Butter Naan', 'Garlic Naan', 'Aloo Paratha', 'Paneer Paratha',
    'Gobi Paratha', 'Missi Roti', 'Bhakri', 'Rumali Roti', 'Puri', 'Kulcha',
    'Luchi', 'Appam', 'Tandoori Roti', 'Khamiri Roti', 'Bhature',
  ],
  rice: [
    'Steamed Basmati', 'Jeera Rice', 'Lemon Rice', 'Curd Rice', 'Veg Pulao',
    'Khichdi', 'Sona Masoori', 'Biryani Base', 'Pongal', 'Upma',
    'Curd Pulao', 'Matar Pulao', 'Jeera Sona Masoori', 'Coconut Rice',
  ],
  beverage: [
    'Masala Chai', 'Filter Coffee', 'Salted Lassi', 'Sweet Lassi', 'Chaas',
    'Nimbu Pani', 'Jaljeera', 'Aam Panna', 'Sol Kadhi', 'Coconut Water',
    'Thandai', 'Badam Milk', 'Sattu Sharbat', 'Kokum Sherbet', 'Ginger Lemon',
    'Seasonal Fruit Juice',
  ],
  side: [
    'Cucumber Raita', 'Boondi Raita', 'Masala Raita', 'Papad', 'Kachumber Salad',
    'Mango Pickle', 'Lime Pickle', 'Mixed Chutney', 'Coconut Chutney', 'Mint Chutney',
    'Tamarind Chutney', 'Fryums', 'Onion Rings', 'Lemon Wedge', 'Green Chili',
  ],
  dessert: [
    'Kheer / Payasam', 'Gulab Jamun', 'Rasgulla', 'Jalebi', 'Gajar Halwa',
    'Sooji Halwa', 'Rasmalai', 'Shrikhand', 'Barfi (Milk/Coconut)', 'Modak',
    'Phirni', 'Ladoo (Besan/Motichoor)', 'Malpua', 'Kulfi', 'Mango Kulfi',
    'Aamras', 'Ras Malai',
  ],
};

/**
 * Get best-matching accompaniments for a given dish style.
 * Gravy dishes → bread + rice + side + beverage
 * Dry sabzi → bread + rice + side
 * Fry/tadka → bread + side + beverage
 * Rice/biryani → side + beverage
 * Breakfast → beverage
 * Sweet/dessert → (none, standalone)
 */
export function getRecommendedCategories(style: DishStyle): IndianMealCategory[] {
  switch (style) {
    case 'gravy':
      return ['bread', 'rice', 'side', 'beverage'];
    case 'dry-sabzi':
      return ['bread', 'rice', 'side'];
    case 'fry-tadka':
      return ['bread', 'side', 'beverage'];
    case 'roast-tandoori':
      return ['bread', 'side', 'beverage'];
    case 'rice-biryani':
      return ['side', 'beverage', 'dessert'];
    case 'steam-boil':
      return ['side', 'beverage'];
    case 'breakfast':
      return ['beverage'];
    case 'sweet-dessert':
      return [];
    case 'bread':
      return ['beverage'];
    case 'side':
      return [];
    case 'beverage':
      return [];
    default:
      return ['bread', 'rice', 'side', 'beverage'];
  }
}

/**
 * Get default pick from each recommended category for a given dish style.
 * Returns a flat array of default accompaniments.
 */
export function getDefaultAccompaniments(style: DishStyle): { category: IndianMealCategory; item: string }[] {
  const categories = getRecommendedCategories(style);
  return categories.map(cat => {
    const options = indian_meal_categories[cat];
    return { category: cat, item: options[0] ?? '' };
  }).filter(a => a.item);
}

// ─── Smart Pairing Helpers ──────────────────────────────────────────────────

const NUT_KEYWORDS = ['badam', 'almond', 'cashew', 'kaju', 'pista', 'pistachio', 'walnut', 'akhrot', 'peanut', 'moongfali'];

export function isNutItem(item: string): boolean {
  const l = item.toLowerCase();
  return NUT_KEYWORDS.some(k => l.includes(k));
}

const STREET_FOOD_IDS = new Set([
  'papdi-chaat', 'pani-puri', 'sev-puri', 'dahi-puri', 'dahi-bhalla',
  'aloo-tikki', 'samosa', 'kachori', 'chole-tikki', 'ragda-pattice',
]);

export function isStreetFood(dishId: string): boolean {
  return STREET_FOOD_IDS.has(dishId);
}

const REGION_MAP: Record<string, string> = {
  'roti / phulka': 'north', 'butter naan': 'north', 'tandoori roti': 'north',
  'aloo paratha': 'north', 'paneer paratha': 'north', 'missi roti': 'north',
  'puri': 'north', 'kulcha': 'north', 'khamiri roti': 'north',
  'bhakri': 'west', 'rumali roti': 'north', 'luchi': 'east', 'appam': 'south',
  'steamed basmati': 'north', 'jeera rice': 'north', 'biryani base': 'north',
  'pulao': 'north', 'khichdi': 'north', 'pongal': 'south', 'upma': 'south',
  'coconut rice': 'south', 'curd rice': 'south', 'lemon rice': 'south',
  'sona masoori': 'south',
  'masala chai': 'north', 'filter coffee': 'south', 'salted lassi': 'north',
  'sweet lassi': 'north', 'chaas': 'north', 'sol kadhi': 'west',
  'coconut water': 'south', 'thandai': 'north', 'badam milk': 'north',
  'sattu sharbat': 'north',
  'cucumber raita': 'north', 'boondi raita': 'north', 'coconut chutney': 'south',
  'mint chutney': 'north', 'tamarind chutney': 'south',
  'kheer / payasam': 'north', 'gulab jamun': 'north', 'rasgulla': 'east',
  'gajar halwa': 'north', 'sooji halwa': 'north', 'shrikhand': 'west',
  'payasam': 'south', 'modak': 'west', 'kulfi': 'north',
};

export function getItemRegion(item: string): string | undefined {
  return REGION_MAP[item.toLowerCase()];
}

/**
 * Merge legacy meal-specific options with master catalog, deduped.
 * Legacy options get priority (appear first), then master items appended.
 */
export function mergeCategoryOptions(
  legacy: string[] | undefined,
  master: string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const normalize = (s: string) => s.toLowerCase().trim();
  for (const item of [...(legacy ?? []), ...master]) {
    const key = normalize(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export interface CategoryConfig {
  label: string;
  icon: string;
  max: number;
}

export const CATEGORY_CONFIG: Record<IndianMealCategory, CategoryConfig> = {
  bread: { label: 'Bread', icon: '🫓', max: 1 },
  rice: { label: 'Rice', icon: '🍚', max: 1 },
  side: { label: 'Sides', icon: '🥗', max: 3 },
  beverage: { label: 'Beverages', icon: '🥤', max: 3 },
  dessert: { label: 'Dessert', icon: '🍨', max: 3 },
};

// ─── Style-Based Dish Selection ─────────────────────────────────────────────

export type DishStyleGroup =
  | 'Gravy' | 'Dry' | 'Fry' | 'Tadka' | 'Roast' | 'Steam' | 'Rice' | 'Breakfast';

export const DISH_STYLES: Record<DishStyleGroup, string[]> = {
  Gravy: [
    'Dal Tadka', 'Dal Makhani', 'Rajma Masala', 'Chole Masala',
    'Paneer Butter Masala', 'Shahi Paneer', 'Kadai Paneer',
    'Butter Chicken', 'Chicken Curry', 'Fish Curry', 'Egg Curry',
    'Sambar', 'Kadhi Pakora', 'Malai Kofta',
  ],
  Dry: [
    'Aloo Gobi', 'Jeera Aloo', 'Bhindi Masala', 'Baingan Bharta',
    'Aloo Matar', 'Paneer Bhurji', 'Soya Chunk Dry', 'Dry Mix Veg',
    'Tawa Paneer', 'Kala Chana', 'Rajma Dry', 'Aloo Jeera',
  ],
  Fry: [
    'Crispy Okra Fry', 'Banana Chip Fry', 'Plantain Fry', 'Potato Fry',
    'Paneer Tikka Dry', 'Soya Fry', 'Mushroom Fry', 'Bread Pakora',
    'Veg Cutlet', 'Aloo Tikki', 'Fish Fry', 'Chicken 65',
  ],
  Tadka: [
    'Dal Fry Tadka', 'Jeera Rice Tadka', 'Curd Rice Tadka',
    'Poha Tadka', 'Upma Tadka', 'Khichdi Tadka', 'Raita Tadka',
  ],
  Roast: [
    'Tandoori Chicken', 'Malai Chaap', 'Soya Tikka', 'Paneer Tikka',
    'Veg Seekh Kebab', 'Fish Tikka', 'Mushroom Tikka', 'Tandoori Aloo',
  ],
  Steam: [
    'Idli', 'Dhokla', 'Khaman', 'Steamed Momos', 'Handvo', 'Puttu',
    'Steamed Rice Cake', 'Idiyappam',
  ],
  Rice: [
    'Veg Biryani', 'Chicken Biryani', 'Lemon Rice', 'Curd Rice',
    'Coconut Rice', 'Tamarind Rice', 'Mint Pulao', 'Jeera Rice',
    'Veg Pulao', 'Kashmiri Pulao', 'Matar Pulao', 'Rajma Chawal',
  ],
  Breakfast: [
    'Poha', 'Upma', 'Dosa', 'Uttapam', 'Idli', 'Paratha',
    'Thepla', 'Kachori', 'Samosa', 'Chole Bhature', 'Puri Bhaji',
  ],
};

export const STYLE_GROUP_ICONS: Record<DishStyleGroup, string> = {
  Gravy: '🍛',
  Dry: '🥘',
  Fry: '🍟',
  Tadka: '🫕',
  Roast: '🔥',
  Steam: '♨️',
  Rice: '🍚',
  Breakfast: '🌅',
};

export function styleGroupToInternal(group: DishStyleGroup): DishStyle {
  const map: Record<DishStyleGroup, DishStyle> = {
    Gravy: 'gravy',
    Dry: 'dry-sabzi',
    Fry: 'fry-tadka',
    Tadka: 'fry-tadka',
    Roast: 'roast-tandoori',
    Steam: 'steam-boil',
    Rice: 'rice-biryani',
    Breakfast: 'breakfast',
  };
  return map[group];
}

export function internalToStyleGroup(style: DishStyle): DishStyleGroup | null {
  const map: Record<DishStyle, DishStyleGroup> = {
    'gravy': 'Gravy',
    'dry-sabzi': 'Dry',
    'fry-tadka': 'Fry',
    'roast-tandoori': 'Roast',
    'steam-boil': 'Steam',
    'rice-biryani': 'Rice',
    'breakfast': 'Breakfast',
    'sweet-dessert': 'Gravy',
    'bread': 'Breakfast',
    'side': 'Fry',
    'beverage': 'Fry',
  };
  return map[style] ?? null;
}

/**
 * Smart pairing suggestions for a dish style group.
 * Returns default accompaniments the system would pre-select as suggestions.
 */
export function getPairingSuggestions(group: DishStyleGroup): Record<IndianMealCategory, string[]> {
  const style = styleGroupToInternal(group);
  const cats = getRecommendedCategories(style);
  const routing = getStyleRouting(style);
  const result: Record<IndianMealCategory, string[]> = {
    bread: [], rice: [], side: [], beverage: [], dessert: [],
  };
  for (const cat of cats) {
    if (cat === 'bread') {
      result.bread = (routing.breads?.length ?? 0) > 0 ? [routing.breads![0]] : [];
    } else if (cat === 'rice') {
      result.rice = (routing.rice?.length ?? 0) > 0 ? [routing.rice![0]] : [];
    } else if (cat === 'side') {
      result.side = (routing.sides?.length ?? 0) > 0 ? routing.sides!.slice(0, 2) : [];
    } else if (cat === 'beverage') {
      result.beverage = (routing.beverages?.length ?? 0) > 0 ? [routing.beverages![0]] : [];
    } else if (cat === 'dessert') {
      result.dessert = indian_meal_categories.dessert.length > 0 ? [indian_meal_categories.dessert[0]] : [];
    }
  }
  return result;
}

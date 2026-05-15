export const HEALTHY_EATING_PLATE = {
  vegFruitRatio: 0.5,
  wholeGrainRatio: 0.25,
  proteinRatio: 0.25,
  healthyOilModeration: true,
  limitMilkDairy: '1-2 servings/day',
  limitJuice: '1 small glass/day',
  avoidSugaryBeverages: true,
  limitRedMeat: true,
  avoidProcessedMeat: true,
} as const;

export const CARBOHYDRATE_GUIDE = {
  message: 'Type of carbohydrate matters more than amount',
  preferOverRefined: [
    'vegetables (not potatoes)',
    'fruits',
    'whole grains',
    'beans',
  ],
  carbToFiberRatio: 10,
} as const;

export const PROTEIN_REQUIREMENTS = {
  rdaPerKg: 0.8,
  rdaPer20lbs: 7,
  acceptableRange: { min: 0.1, max: 0.35 },
  completeProteinSources: [
    'fish',
    'poultry',
    'beans',
    'nuts',
    'tofu',
    'eggs',
    'quinoa',
  ],
} as const;

export const WHOLE_GRAINS = [
  'amaranth',
  'barley',
  'brown rice',
  'buckwheat',
  'bulgur',
  'corn',
  'kamut',
  'millet',
  'oats',
  'quinoa',
  'rye',
  'sorghum',
  'spelt',
  'teff',
  'triticale',
  'wheat berries',
  'wild rice',
  'whole wheat',
  'multigrain roti',
  'jowar',
  'bajra',
  'ragi',
] as const;

export const REFINED_GRAINS = [
  'white rice',
  'white bread',
  'white pasta',
  'maida',
  'refined flour',
  'white roti',
] as const;

export const LEAN_PROTEINS = [
  'chicken breast',
  'fish',
  'turkey',
  'eggs',
  'tofu',
  'paneer',
  'dal',
  'lentils',
  'beans',
  'chickpeas',
  'soy chunks',
  'sprouts',
  'nuts',
  'seeds',
] as const;

export const RED_MEATS = [
  'mutton',
  'lamb',
  'goat',
  'beef',
  'pork',
] as const;

export const PROCESSED_MEATS = [
  'bacon',
  'sausage',
  'ham',
  'salumi',
] as const;

export const HEALTHY_OILS = [
  'olive oil',
  'canola oil',
  'soybean oil',
  'corn oil',
  'sunflower oil',
  'peanut oil',
  'mustard oil',
  'ghee',
] as const;

export const UNHEALTHY_FATS = [
  'partially hydrogenated oil',
  'trans fat',
  'vanaspati',
  'margarine',
] as const;

export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 'plate-balance',
    title: 'Build a Balanced Plate',
    body: 'Fill half your plate with vegetables and fruits, a quarter with whole grains, and a quarter with healthy protein. This naturally controls portions and ensures nutrient variety.',
    icon: '🍽️',
    category: 'general',
  },
  {
    id: 'color-variety',
    title: 'Eat the Rainbow',
    body: 'Different colored fruits and vegetables provide different nutrients. Aim for at least 3 different colors on your plate — dark leafy greens, red bell peppers, orange carrots, purple cabbage, etc.',
    icon: '🌈',
    category: 'veg-fruit',
  },
  {
    id: 'whole-grains',
    title: 'Go Whole Grain',
    body: 'Whole grains like brown rice, oats, quinoa, and whole wheat keep your blood sugar steady and provide fiber, B vitamins, and minerals. Swap refined grains (white rice, maida) for whole grain versions.',
    icon: '🌾',
    category: 'whole-grain',
  },
  {
    id: 'protein-quality',
    title: 'Protein Package Matters',
    body: 'What comes with your protein matters. Fish, poultry, beans, and nuts bring healthy fats and fiber. Limit red meat and avoid processed meats like bacon and sausage.',
    icon: '🥩',
    category: 'protein',
  },
  {
    id: 'healthy-fats',
    title: 'Choose Healthy Fats',
    body: 'Not all fat is bad. Olive, canola, sunflower, and mustard oils are heart-healthy. Avoid trans fats and partially hydrogenated oils. Remember: low-fat doesn\'t mean healthy.',
    icon: '🫒',
    category: 'fats',
  },
  {
    id: 'skip-sugary-drinks',
    title: 'Skip Sugary Drinks',
    body: 'Sugary beverages are a major source of empty calories. Drink water, coffee, or tea instead. Limit juice to one small glass per day and dairy to 1-2 servings.',
    icon: '🥤',
    category: 'beverages',
  },
  {
    id: 'fiber-benefits',
    title: 'Fiber is Your Friend',
    body: 'Fiber slows digestion, keeps blood sugar steady, lowers cholesterol, and helps prevent constipation. Get it from whole grains, legumes, vegetables, and fruits.',
    icon: '🫘',
    category: 'fiber',
  },
  {
    id: 'protein-amount',
    title: 'How Much Protein?',
    body: 'Most adults need about 0.8g of protein per kg of body weight. For a 140lb person, that\'s ~50g/day. Spread protein across meals rather than loading up at one meal.',
    icon: '🥚',
    category: 'protein',
  },
  {
    id: 'watch-sodium',
    title: 'Watch Hidden Sodium',
    body: 'Too much sodium raises blood pressure. Processed foods, restaurant meals, and packaged snacks are the biggest sources. Season with herbs and spices instead of salt.',
    icon: '🧂',
    category: 'sodium',
  },
  {
    id: 'smart-swaps',
    title: 'Simple Healthy Swaps',
    body: 'Replace white rice with brown rice or quinoa. Choose whole wheat roti instead of naan. Snack on nuts and fruit instead of fried snacks. Drink water instead of soda.',
    icon: '🔄',
    category: 'general',
  },
  {
    id: 'portion-control',
    title: 'Portion Awareness',
    body: 'Even healthy foods can lead to weight gain in large portions. Use the plate method: ½ veg/fruit, ¼ whole grains, ¼ protein to keep portions balanced naturally.',
    icon: '✋',
    category: 'general',
  },
  {
    id: 'vegetables-first',
    title: 'Eat Vegetables First',
    body: 'Eating vegetables first at a meal can help control blood sugar spikes and make you feel fuller. Start meals with a salad or vegetable-based soup.',
    icon: '🥗',
    category: 'veg-fruit',
  },
  {
    id: 'limit-red-meat',
    title: 'Limit Red Meat',
    body: 'High consumption of red meat is linked to increased risk of heart disease and certain cancers. Try to have red meat only occasionally, and choose lean cuts when you do.',
    icon: '🥩',
    category: 'protein',
  },
  {
    id: 'stay-hydrated',
    title: 'Stay Hydrated Right',
    body: 'Water is the best choice. Coffee and tea are fine in moderation. Skip sugary sodas, packaged juices, and energy drinks — they add calories without nutrition.',
    icon: '💧',
    category: 'beverages',
  },
  {
    id: 'whole-grain-kernel',
    title: 'The Whole Grain Kernel',
    body: 'The bran provides fiber and B vitamins, the germ has healthy fats and vitamin E, and the endosperm has carbs and protein. Refined grains strip away the bran and germ, losing most nutrients.',
    icon: '🌾',
    category: 'whole-grain',
  },
  {
    id: 'read-labels',
    title: 'Reading Food Labels',
    body: 'Look for whole grain as the first ingredient. Check the carbohydrate-to-fiber ratio — aim for less than 10:1. Watch for hidden sugars and sodium in packaged foods.',
    icon: '🏷️',
    category: 'general',
  },
  {
    id: 'diet-quality',
    title: 'Focus on Diet Quality',
    body: 'The overall quality of your diet matters more than any single nutrient. A pattern of whole foods — vegetables, fruits, whole grains, healthy proteins — beats counting calories.',
    icon: '⭐',
    category: 'general',
  },
];

export interface HealthTip {
  id: string;
  title: string;
  body: string;
  icon: string;
  category: 'general' | 'veg-fruit' | 'whole-grain' | 'protein' | 'fats' | 'beverages' | 'fiber' | 'sodium';
}

export const VITAMIN_RDA: Record<string, { women?: string; men?: string; upperLimit?: string }> = {
  'Vitamin A': { women: '700 mcg (2,333 IU)', men: '900 mcg (3,000 IU)', upperLimit: '3,000 mcg (10,000 IU)' },
  'Vitamin C': { women: '75 mg', men: '90 mg', upperLimit: '2,000 mg' },
  'Vitamin D': { women: '15 mcg (600 IU)', men: '15 mcg (600 IU)', upperLimit: '100 mcg (4,000 IU)' },
  'Vitamin E': { women: '15 mg', men: '15 mg', upperLimit: '1,000 mg' },
  'Vitamin B12': { women: '2.4 mcg', men: '2.4 mcg' },
  Folate: { women: '400 mcg', men: '400 mcg', upperLimit: '1,000 mcg' },
  Iron: { women: '18 mg', men: '8 mg', upperLimit: '45 mg' },
  Calcium: { women: '1,000 mg', men: '1,000 mg', upperLimit: '2,500 mg' },
  Magnesium: { women: '310-320 mg', men: '400-420 mg', upperLimit: '350 mg (supplements only)' },
  Potassium: { women: '2,600 mg', men: '3,400 mg' },
  Sodium: { women: '1,500 mg', men: '1,500 mg' },
  Zinc: { women: '8 mg', men: '11 mg', upperLimit: '40 mg' },
};

export const DISH_HEALTH_MAP: Record<string, { healthCategories: string[]; tags: string[] }> = {
  'aloo-paratha': {
    healthCategories: ['whole-grain', 'fried'],
    tags: ['high-carb', 'high-fat', 'low-protein'],
  },
  'bedmi-puri': {
    healthCategories: ['refined-grain', 'fried'],
    tags: ['high-carb', 'high-fat', 'low-protein'],
  },
  'dal-makhani': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'high-fat', 'good-fiber'],
  },
  'rogan-josh': {
    healthCategories: ['red-meat'],
    tags: ['high-protein', 'high-fat', 'high-sodium'],
  },
  'butter-chicken': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fat', 'moderate'],
  },
  'samosa': {
    healthCategories: ['fried'],
    tags: ['high-carb', 'high-fat', 'low-nutrient'],
  },
  'soya-chunks-masala': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fiber', 'healthy'],
  },
  'soybean-matar': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'high-fiber', 'healthy'],
  },
  'tofu-tikka-masala': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'calcium', 'healthy'],
  },
  'paneer-tikka-masala': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fat', 'calcium'],
  },
  'jeera-rice': {
    healthCategories: ['refined-grain'],
    tags: ['high-carb', 'low-fiber'],
  },
  'veg-manchurian': {
    healthCategories: ['fried'],
    tags: ['moderate', 'high-sodium'],
  },
  'pani-puri': {
    healthCategories: ['fried'],
    tags: ['high-carb', 'low-nutrient'],
  },
  'egg-curry-north': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'healthy'],
  },
  'egg-bhurji': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'quick'],
  },
  'masala-omelette': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'low-carb'],
  },
  'egg-fried-rice': {
    healthCategories: ['refined-grain'],
    tags: ['moderate-protein', 'high-carb'],
  },
  'malai-kofta': {
    healthCategories: ['fried'],
    tags: ['high-fat', 'high-calorie', 'indulgent'],
  },
  'paneer-butter-masala': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fat', 'rich'],
  },
  'shahi-paneer': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fat', 'rich'],
  },
  'kadai-paneer': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'moderate'],
  },
  'palak-paneer': {
    healthCategories: ['lean-protein', 'veg-fruit'],
    tags: ['high-protein', 'iron', 'fiber', 'healthy'],
  },
  'paneer-lababdar': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'high-fat', 'rich'],
  },
  'paneer-bhurji': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'quick'],
  },
  'mushroom-masala': {
    healthCategories: ['veg-fruit'],
    tags: ['low-calorie', 'protein', 'vitamin-d'],
  },
  'mix-veg': {
    healthCategories: ['veg-fruit'],
    tags: ['fiber', 'vitamins', 'healthy', 'low-calorie'],
  },
  'methi-aloo': {
    healthCategories: ['veg-fruit'],
    tags: ['fiber', 'iron', 'low-fat'],
  },
  'bhindi-do-pyaza': {
    healthCategories: ['veg-fruit'],
    tags: ['fiber', 'vitamin-c', 'low-calorie'],
  },
  'dal-tadka': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'fiber', 'healthy'],
  },
  'chana-dal': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'high-fiber', 'healthy'],
  },
  'urad-dal': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'iron', 'healthy'],
  },
  'rajma-chawal': {
    healthCategories: ['legume', 'refined-grain'],
    tags: ['high-protein', 'fiber', 'balanced'],
  },
  'chole': {
    healthCategories: ['legume'],
    tags: ['high-protein', 'fiber', 'healthy'],
  },
  'chole-bhature': {
    healthCategories: ['legume', 'fried'],
    tags: ['high-protein', 'high-fat', 'indulgent'],
  },
  'veg-pulao-north': {
    healthCategories: ['refined-grain'],
    tags: ['moderate', 'aromatic'],
  },
  'dal-khichdi': {
    healthCategories: ['legume', 'whole-grain'],
    tags: ['high-protein', 'fiber', 'comfort', 'healthy'],
  },
  'veg-biryani': {
    healthCategories: ['refined-grain'],
    tags: ['moderate', 'festive'],
  },
  'lassi': {
    healthCategories: ['dairy'],
    tags: ['probiotic', 'calcium'],
  },
  'masala-chaai': {
    healthCategories: ['healthy-beverage'],
    tags: ['antioxidant', 'moderate'],
  },
  'chaas': {
    healthCategories: ['healthy-beverage'],
    tags: ['probiotic', 'low-calorie', 'healthy'],
  },
  'aamras': {
    healthCategories: ['veg-fruit'],
    tags: ['vitamin-c', 'natural-sugar'],
  },
  'paneer-tikka': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'healthy'],
  },
  'hariyali-paneer-tikka': {
    healthCategories: ['lean-protein', 'veg-fruit'],
    tags: ['high-protein', 'fiber', 'healthy'],
  },
  'malai-tikka': {
    healthCategories: ['lean-protein'],
    tags: ['high-protein', 'moderate'],
  },
  'gulab-jamun': {
    healthCategories: ['dessert'],
    tags: ['high-sugar', 'indulgent'],
  },
  'jalebi': {
    healthCategories: ['dessert'],
    tags: ['high-sugar', 'indulgent'],
  },
  'rasgulla': {
    healthCategories: ['dessert'],
    tags: ['high-sugar', 'moderate'],
  },
  'kheer': {
    healthCategories: ['dessert'],
    tags: ['moderate-sugar', 'dairy'],
  },
  'gobhi-paratha': {
    healthCategories: ['whole-grain'],
    tags: ['high-carb', 'moderate'],
  },
  'mooli-paratha': {
    healthCategories: ['whole-grain'],
    tags: ['high-carb', 'moderate'],
  },
  'dal-paratha': {
    healthCategories: ['legume', 'whole-grain'],
    tags: ['high-protein', 'high-carb'],
  },
  'methi-paratha': {
    healthCategories: ['veg-fruit', 'whole-grain'],
    tags: ['iron', 'fiber', 'moderate'],
  },
  'mix-paratha': {
    healthCategories: ['veg-fruit', 'whole-grain'],
    tags: ['moderate'],
  },
  'dahi-bhalla': {
    healthCategories: ['dairy'],
    tags: ['probiotic', 'moderate'],
  },
  'aloo-tikki': {
    healthCategories: ['fried', 'starchy-veg'],
    tags: ['high-carb', 'low-nutrient'],
  },
  'papdi-chaat': {
    healthCategories: ['fried'],
    tags: ['high-carb', 'moderate'],
  },
  'sev-poori': {
    healthCategories: ['fried'],
    tags: ['high-carb', 'moderate'],
  },
  'dahi-puri': {
    healthCategories: ['fried', 'dairy'],
    tags: ['moderate'],
  },
  'chole-tikki': {
    healthCategories: ['legume', 'fried'],
    tags: ['high-protein', 'moderate'],
  },
  'butter-naan': {
    healthCategories: ['refined-grain'],
    tags: ['high-carb', 'low-fiber'],
  },
  'tandoori-roti': {
    healthCategories: ['whole-grain'],
    tags: ['high-fiber', 'healthy', 'low-fat'],
  },
  'white-bread': {
    healthCategories: ['refined-grain'],
    tags: ['high-carb', 'low-fiber'],
  },
  'brown-bread': {
    healthCategories: ['whole-grain'],
    tags: ['fiber', 'healthy'],
  },
  'milk-bread': {
    healthCategories: ['refined-grain'],
    tags: ['high-carb', 'low-fiber'],
  },
  'avocado-sandwich': {
    healthCategories: ['healthy-fat', 'veg-fruit'],
    tags: ['healthy', 'high-fiber', 'high-protein', 'low-calorie'],
  },
  'bhakri': {
    healthCategories: ['whole-grain'],
    tags: ['high-fiber', 'healthy', 'low-fat'],
  },
  'jolada-roti': {
    healthCategories: ['whole-grain'],
    tags: ['high-fiber', 'healthy', 'low-fat'],
  },
  'methi-thepla': {
    healthCategories: ['whole-grain', 'veg-fruit'],
    tags: ['fiber', 'iron', 'healthy'],
  },
  'north-sarson-saag-makki': {
    healthCategories: ['whole-grain', 'veg-fruit'],
    tags: ['fiber', 'healthy'],
  },
  'overnight-oats': {
    healthCategories: ['whole-grain'],
    tags: ['high-fiber', 'healthy', 'low-fat'],
  },
};

export const COMPONENT_HEALTH_MAP: Record<string, { healthCategories: string[]; tags: string[] }> = {
  // ─── Rotis / Breads ─────────────────────────────────────────────────────────
  'Tandoori Roti': { healthCategories: ['whole-grain'], tags: ['high-fiber', 'healthy', 'low-fat'] },
  'Roti': { healthCategories: ['whole-grain'], tags: ['fiber'] },
  'Phulka': { healthCategories: ['whole-grain'], tags: ['fiber', 'low-fat'] },
  'Paratha': { healthCategories: ['whole-grain', 'fried'], tags: ['high-carb'] },
  'Laccha Paratha': { healthCategories: ['whole-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Bafla': { healthCategories: ['whole-grain'], tags: ['fiber'] },
  'Bhakri': { healthCategories: ['whole-grain'], tags: ['high-fiber', 'healthy'] },
  'Jolada Roti': { healthCategories: ['whole-grain'], tags: ['high-fiber', 'healthy'] },
  'Methi Thepla': { healthCategories: ['whole-grain', 'veg-fruit'], tags: ['fiber', 'iron'] },
  'Butter Naan': { healthCategories: ['refined-grain'], tags: ['high-carb', 'low-fiber'] },
  'Naan': { healthCategories: ['refined-grain'], tags: ['high-carb', 'low-fiber'] },
  'Garlic Naan': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Bhature': { healthCategories: ['refined-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Puri': { healthCategories: ['refined-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Bedmi Puri': { healthCategories: ['refined-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Luchi': { healthCategories: ['refined-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Kulcha': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'White Bread': { healthCategories: ['refined-grain'], tags: ['high-carb', 'low-fiber'] },
  'Brown Bread': { healthCategories: ['whole-grain'], tags: ['high-fiber', 'healthy'] },
  'Milk Bread': { healthCategories: ['refined-grain'], tags: ['high-carb', 'low-fiber'] },

  // ─── Rice ───────────────────────────────────────────────────────────────────
  'Steamed Rice': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Jeera Rice': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Lemon Rice': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Pulao': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Sticky Rice': { healthCategories: ['refined-grain'], tags: ['high-carb'] },
  'Brown Rice': { healthCategories: ['whole-grain'], tags: ['high-fiber', 'healthy'] },
  'Fried Rice': { healthCategories: ['refined-grain', 'fried'], tags: ['high-carb', 'high-fat'] },
  'Biryani Rice': { healthCategories: ['refined-grain'], tags: ['high-carb'] },

  // ─── Gravies / Curries ──────────────────────────────────────────────────────
  'Curry': { healthCategories: ['healthy-fat'], tags: ['moderate'] },
  'Gravy': { healthCategories: ['healthy-fat'], tags: ['moderate'] },

  // ─── Sides ──────────────────────────────────────────────────────────────────
  'Salad': { healthCategories: ['veg-fruit'], tags: ['fiber', 'vitamins'] },
  'Raita': { healthCategories: ['dairy'], tags: ['probiotic'] },
  'Curd': { healthCategories: ['dairy'], tags: ['probiotic'] },
  'Pickle': { healthCategories: ['veg-fruit'], tags: ['fermented'] },
  'Papad': { healthCategories: ['starchy-veg'], tags: ['moderate'] },
  'Green Chutney': { healthCategories: ['veg-fruit'], tags: ['vitamins'] },
  'Coconut Chutney': { healthCategories: ['healthy-fat', 'veg-fruit'], tags: ['healthy'] },
  'Sambhar': { healthCategories: ['legume', 'veg-fruit'], tags: ['high-protein', 'fiber'] },

  // ─── Beverages ──────────────────────────────────────────────────────────────
  'Chai': { healthCategories: ['healthy-beverage'], tags: ['moderate'] },
  'Filter Coffee': { healthCategories: ['healthy-beverage'], tags: ['antioxidant'] },
  'Chaas': { healthCategories: ['healthy-beverage', 'dairy'], tags: ['probiotic', 'healthy'] },
  'Lassi': { healthCategories: ['healthy-beverage', 'dairy'], tags: ['probiotic'] },
  'Buttermilk': { healthCategories: ['healthy-beverage', 'dairy'], tags: ['probiotic', 'healthy'] },
  'Water': { healthCategories: ['healthy-beverage'], tags: ['healthy'] },

  // ─── Dessert ────────────────────────────────────────────────────────────────
  'Gulab Jamun': { healthCategories: ['dessert'], tags: ['high-sugar', 'indulgent'] },
  'Rasgulla': { healthCategories: ['dessert'], tags: ['high-sugar'] },
  'Kheer': { healthCategories: ['dessert', 'dairy'], tags: ['high-sugar'] },
  'Ice Cream': { healthCategories: ['dessert', 'dairy'], tags: ['high-sugar', 'indulgent'] },
};

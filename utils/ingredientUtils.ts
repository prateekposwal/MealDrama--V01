import type { Dish, Ingredient, IngredientCategory, DishVariant } from '../meal/constants/dishLibrary';
import { api } from '../lib/api';
import { getMealResolution, type MealResolution, type CategorySelection } from '../app/store/useStore';
import { cachedIngredients } from './cache';
import { resolveDisplayName } from './resolveDisplayName';
import { getISODate, addDaysISO } from './dateUTC';

/**
 * Normalize an ingredient name for matching (lowercase, trimmed).
 * Merges dairy aliases (curd/dahi/yogurt) and buy-variant names so a user's
 * pack "Coriander 200 g" reconciles with the forecast row "Coriander Leaves".
 */
export function canonicalName(name: string): string {
  const n = (name || '').toLowerCase().trim();
  if (['curd', 'dahi', 'yogurt', 'yoghurt'].includes(n)) return 'yogurt';
  // Buy-name aliases: leading "coriander"/"coriander leaves" → "coriander"
  if (/^coriander/.test(n)) return 'coriander';
  if (/^ginger/.test(n)) return 'ginger';
  if (/^garlic/.test(n)) return 'garlic';
  if (/^onion/.test(n)) return 'onion';
  if (/^potato|^potatoes|^aloo/.test(n)) return 'potato';
  if (/^tomato/.test(n)) return 'tomato';
  if (/^mint|^pudina/.test(n)) return 'mint';
  if (/^curry leaves/.test(n)) return 'curry leaves';
  if (/^capsicum|^bell pepper|^shimla/.test(n)) return 'capsicum';
  if (/^carrot|^gajar/.test(n)) return 'carrot';
  if (/^lemon|^nimbu/.test(n)) return 'lemon';
  if (/^green chilli|^mirch/.test(n)) return 'green chilli';
  return n;
}

const ing = (name: string, qty: number, unit: string, category: IngredientCategory): Ingredient =>
  ({ name, quantity: qty, unit, category, inStock: false });

const CATEGORY_INGREDIENTS: Record<string, Ingredient[]> = {
  // ─── Gravies ──────────────────────────────────────────────
  'brown-gravy-onion-tomato': [ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 3, 'pc', 'produce'), ing('Ginger-Garlic Paste', 1, 'tbsp', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'red-gravy-tomato-butter': [ing('Tomatoes', 4, 'pc', 'produce'), ing('Butter', 50, 'g', 'dairy'), ing('Cream', 30, 'ml', 'dairy'), ing('Spices', 1, 'packet', 'spices')],
  'white-gravy-cashew-cream': [ing('Cashews', 30, 'g', 'pantry'), ing('Cream', 50, 'ml', 'dairy'), ing('Onions', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'makhani-gravy': [ing('Butter', 50, 'g', 'dairy'), ing('Tomatoes', 4, 'pc', 'produce'), ing('Cream', 50, 'ml', 'dairy'), ing('Spices', 1, 'packet', 'spices')],
  'korma-gravy': [ing('Yogurt', 100, 'g', 'dairy'), ing('Onions', 2, 'pc', 'produce'), ing('Cashews', 20, 'g', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'yakhni-yogurt-gravy': [ing('Yogurt', 150, 'g', 'dairy'), ing('Onions', 2, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'sambar': [ing('Toor Dal', 80, 'g', 'proteins'), ing('Tomatoes', 2, 'pc', 'produce'), ing('Sambar Powder', 1, 'tbsp', 'spices'), ing('Tamarind', 10, 'g', 'pantry')],
  'coconut-gravy': [ing('Coconut', 50, 'g', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'chettinad-masala': [ing('Coconut', 30, 'g', 'produce'), ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'rasam': [ing('Tomatoes', 3, 'pc', 'produce'), ing('Rasam Powder', 1, 'tbsp', 'spices'), ing('Tamarind', 10, 'g', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'kerala-stew': [ing('Coconut Milk', 200, 'ml', 'dairy'), ing('Onions', 1, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'andhra-curry': [ing('Red Chilli', 4, 'pc', 'produce'), ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'mustard-gravy-shorshe': [ing('Mustard Seeds', 2, 'tbsp', 'spices'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Mustard Oil', 1, 'tbsp', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'poppy-seed-gravy-posto': [ing('Poppy Seeds', 30, 'g', 'spices'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'bengali-kalia': [ing('Onions', 2, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce'), ing('Garam Masala', 1, 'tbsp', 'spices'), ing('Spices', 1, 'packet', 'spices')],
  'jhol-thin-gravy': [ing('Ginger', 1, 'pc', 'produce'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'kolhapuri-gravy': [ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 3, 'pc', 'produce'), ing('Kolhapuri Masala', 1, 'tbsp', 'spices'), ing('Spices', 1, 'packet', 'spices')],
  'goan-vindaloo': [ing('Vinegar', 2, 'tbsp', 'pantry'), ing('Red Chilli', 4, 'pc', 'produce'), ing('Garlic', 6, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'gujarati-kadhi': [ing('Yogurt', 200, 'g', 'dairy'), ing('Gram Flour', 30, 'g', 'grains'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'xacuti-masala': [ing('Coconut', 50, 'g', 'produce'), ing('Poppy Seeds', 10, 'g', 'spices'), ing('Onions', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'kokum-curry': [ing('Kokum', 5, 'pc', 'pantry'), ing('Coconut Milk', 100, 'ml', 'dairy'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'brown-gravy-onion-tomato-1': [ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 3, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'kadhi': [ing('Yogurt', 200, 'g', 'dairy'), ing('Gram Flour', 30, 'g', 'grains'), ing('Spices', 1, 'packet', 'spices')],
  'malwa-curry': [ing('Onions', 2, 'pc', 'produce'), ing('Tomatoes', 2, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'alkaline-khar': [ing('Raw Papaya', 100, 'g', 'produce'), ing('Mustard Greens', 50, 'g', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'masor-tenga': [ing('Fish', 150, 'g', 'proteins'), ing('Tomatoes', 2, 'pc', 'produce'), ing('Lemon Juice', 1, 'tbsp', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'pork-curry': [ing('Pork', 200, 'g', 'proteins'), ing('Onions', 2, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'axone-curry': [ing('Pork', 200, 'g', 'proteins'), ing('Axone', 50, 'g', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'bamboo-shoot-curry': [ing('Bamboo Shoot', 100, 'g', 'produce'), ing('Pork', 150, 'g', 'proteins'), ing('Spices', 1, 'packet', 'spices')],

  // ─── Breads ───────────────────────────────────────────────
  'roti-chapati': [ing('Wheat Flour (Atta)', 200, 'g', 'grains')],
  'naan': [ing('Maida', 200, 'g', 'grains'), ing('Yogurt', 50, 'g', 'dairy')],
  'paratha': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Butter', 20, 'g', 'dairy')],
  'bhatura': [ing('Maida', 200, 'g', 'grains'), ing('Yogurt', 50, 'g', 'dairy')],
  'kulcha': [ing('Maida', 200, 'g', 'grains'), ing('Yogurt', 30, 'g', 'dairy')],
  'puri': [ing('Wheat Flour (Atta)', 150, 'g', 'grains')],
  'chochwor': [ing('Maida', 200, 'g', 'grains'), ing('Poppy Seeds', 10, 'g', 'spices')],
  'sheermal': [ing('Maida', 200, 'g', 'grains'), ing('Saffron', 1, 'pinch', 'spices'), ing('Milk', 50, 'ml', 'dairy')],
  'dosa': [ing('Rice', 100, 'g', 'grains'), ing('Urad Dal', 50, 'g', 'proteins')],
  'appam': [ing('Rice', 100, 'g', 'grains'), ing('Coconut Milk', 50, 'ml', 'dairy')],
  'idiyappam': [ing('Rice Flour', 150, 'g', 'grains'), ing('Coconut', 20, 'g', 'produce')],
  'pathiri': [ing('Rice Flour', 150, 'g', 'grains')],
  'porotta': [ing('Maida', 200, 'g', 'grains'), ing('Oil', 30, 'ml', 'pantry')],
  'neer-dosa': [ing('Rice', 100, 'g', 'grains'), ing('Coconut', 20, 'g', 'produce')],
  'malabar-parotta': [ing('Maida', 200, 'g', 'grains'), ing('Egg', 1, 'pc', 'proteins')],
  'luchi': [ing('Maida', 150, 'g', 'grains')],
  'pitha': [ing('Rice Flour', 150, 'g', 'grains'), ing('Coconut', 30, 'g', 'produce')],
  'litti': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Sattu', 50, 'g', 'grains')],
  'kakara-pitha': [ing('Rice Flour', 150, 'g', 'grains'), ing('Jaggery', 50, 'g', 'pantry')],
  'arisa-pitha': [ing('Rice Flour', 150, 'g', 'grains'), ing('Jaggery', 50, 'g', 'pantry')],
  'bhakri': [ing('Jowar Flour', 200, 'g', 'grains')],
  'thepla': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Fenugreek Leaves', 30, 'g', 'produce')],
  'rotla': [ing('Bajra Flour', 200, 'g', 'grains')],
  'puran-poli': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Chana Dal', 100, 'g', 'proteins'), ing('Jaggery', 50, 'g', 'pantry')],
  'poee': [ing('Maida', 200, 'g', 'grains'), ing('Coconut Milk', 50, 'ml', 'dairy')],
  'phulka': [ing('Wheat Flour (Atta)', 150, 'g', 'grains')],
  // ─── Bread display-name aliases (from indian_meal_categories) ─
  'missi-roti': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Gram Flour', 50, 'g', 'grains')],
  'rumali-roti': [ing('Maida', 200, 'g', 'grains')],
  'tandoori-roti': [ing('Wheat Flour (Atta)', 200, 'g', 'grains')],
  'khamiri-roti': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Yogurt', 30, 'g', 'dairy')],
  'bun': [ing('Bun', 1, 'pc', 'breads')],
  'bun-maska': [ing('Bun', 2, 'pcs', 'breads'), ing('Butter', 30, 'g', 'dairy')],

  // ─── Rice ─────────────────────────────────────────────────
  'steamed-basmati-rice': [ing('Basmati Rice', 100, 'g', 'grains')],
  'steamed-rice-sona-masuri': [ing('Rice', 100, 'g', 'grains')],
  'steamed-rice-kolam': [ing('Rice', 100, 'g', 'grains')],
  'steamed-rice': [ing('Rice', 100, 'g', 'grains')],
  'jeera-rice': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Cumin Seeds', 1, 'tsp', 'spices')],
  'pulao': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Mixed Vegetables', 100, 'g', 'produce')],
  'lemon-rice': [ing('Rice', 100, 'g', 'grains'), ing('Lemon', 1, 'pc', 'produce')],
  'coconut-rice': [ing('Rice', 100, 'g', 'grains'), ing('Coconut', 30, 'g', 'produce')],
  'curd-rice': [ing('Rice', 100, 'g', 'grains'), ing('Yogurt', 100, 'g', 'dairy')],
  'kerala-red-rice': [ing('Red Rice', 100, 'g', 'grains')],
  'bamboo-rice': [ing('Bamboo Rice', 100, 'g', 'grains')],
  'ghee-rice': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Ghee', 20, 'g', 'dairy')],
  'gobindobhog-rice': [ing('Gobindobhog Rice', 100, 'g', 'grains')],
  'joha-rice': [ing('Joha Rice', 100, 'g', 'grains')],
  'khichdi': [ing('Rice', 80, 'g', 'grains'), ing('Moong Dal', 50, 'g', 'proteins')],
  'black-rice-chak-hao': [ing('Black Rice', 100, 'g', 'grains')],
  'bhath': [ing('Rice', 100, 'g', 'grains')],
  // ─── Rice display-name aliases (from indian_meal_categories) ─
  'sona-masoori': [ing('Sona Masoori Rice', 100, 'g', 'grains')],
  'biryani-base': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Spices', 1, 'packet', 'spices')],
  'pongal': [ing('Rice', 80, 'g', 'grains'), ing('Moong Dal', 50, 'g', 'proteins')],
  'upma': [ing('Semolina (Rava)', 100, 'g', 'grains'), ing('Spices', 1, 'packet', 'spices')],
  'jeera-sona-masoori': [ing('Sona Masoori Rice', 100, 'g', 'grains'), ing('Cumin Seeds', 1, 'tsp', 'spices')],
  'curd-pulao': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Yogurt', 100, 'g', 'dairy')],
  'matar-pulao': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Peas', 50, 'g', 'produce')],
  'veg-pulao': [ing('Basmati Rice', 100, 'g', 'grains'), ing('Mixed Vegetables', 100, 'g', 'produce')],

  // ─── Sides ────────────────────────────────────────────────
  'mint-chutney': [ing('Mint', 30, 'g', 'produce'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Lemon', 1, 'pc', 'produce')],
  'cucumber-raita': [ing('Yogurt', 100, 'g', 'dairy'), ing('Cucumber', 1, 'pc', 'produce')],
  'curd': [ing('Yogurt', 100, 'g', 'dairy')],
  'onion-salad': [ing('Onions', 1, 'pc', 'produce'), ing('Lemon', 1, 'pc', 'produce')],
  'cucumber-tomato-salad': [ing('Cucumber', 1, 'pc', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Lemon', 1, 'pc', 'produce')],
  'cucumber-salad': [ing('Cucumber', 1, 'pc', 'produce')],
  'mango-pickle': [ing('Mango Pickle', 30, 'g', 'pantry')],
  'mix-pickle': [ing('Mix Pickle', 30, 'g', 'pantry')],
  'lemon-pickle': [ing('Lemon Pickle', 30, 'g', 'pantry')],
  'tamarind-chutney': [ing('Tamarind', 30, 'g', 'pantry'), ing('Jaggery', 20, 'g', 'pantry')],
  'green-chutney': [ing('Coriander', 30, 'g', 'produce'), ing('Mint', 20, 'g', 'produce'), ing('Green Chilli', 2, 'pc', 'produce')],
  'onion-raita': [ing('Yogurt', 100, 'g', 'dairy'), ing('Onions', 1, 'pc', 'produce')],
  'boondi-raita': [ing('Yogurt', 100, 'g', 'dairy'), ing('Boondi', 30, 'g', 'pantry')],
  'roasted-papad': [ing('Papad', 2, 'pc', 'pantry')],
  'butter': [ing('Butter', 30, 'g', 'dairy')],
  'aloo-bhaji': [ing('Potatoes', 3, 'pc', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'coconut-chutney': [ing('Coconut', 50, 'g', 'produce'), ing('Green Chilli', 2, 'pc', 'produce')],
  'tomato-chutney': [ing('Tomatoes', 3, 'pc', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'podi': [ing('Chickpeas', 50, 'g', 'grains'), ing('Spices', 1, 'packet', 'spices')],
  'ghee': [ing('Ghee', 30, 'g', 'dairy')],
  'onion-chutney': [ing('Onions', 2, 'pc', 'produce'), ing('Tamarind', 10, 'g', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'peanut-chutney': [ing('Peanuts', 30, 'g', 'proteins'), ing('Green Chilli', 2, 'pc', 'produce')],
  'coriander-chutney': [ing('Coriander', 30, 'g', 'produce'), ing('Green Chilli', 2, 'pc', 'produce')],
  'gongura-pickle': [ing('Gongura Leaves', 100, 'g', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'alu-posto': [ing('Potatoes', 3, 'pc', 'produce'), ing('Poppy Seeds', 20, 'g', 'spices')],
  'begun-bhaja': [ing('Eggplant', 1, 'pc', 'produce'), ing('Turmeric', 1, 'tsp', 'spices')],
  'garlic-chutney': [ing('Garlic', 6, 'pc', 'produce'), ing('Dry Red Chilli', 3, 'pc', 'produce')],
  'thecha-green-chili-chutney': [ing('Green Chilli', 6, 'pc', 'produce'), ing('Garlic', 4, 'pc', 'produce')],
  'koshimbir-salad': [ing('Onions', 1, 'pc', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Cucumber', 1, 'pc', 'produce')],
  // ─── Side display-name aliases (from indian_meal_categories) ─
  'peanut-butter': [ing('Peanut Butter', 1, 'jar', 'pantry')],
  'masala-raita': [ing('Yogurt', 100, 'g', 'dairy'), ing('Spices', 1, 'packet', 'spices')],
  'kachumber-salad': [ing('Cucumber', 1, 'pc', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Lemon', 1, 'pc', 'produce')],
  'lime-pickle': [ing('Lime Pickle', 30, 'g', 'pantry')],
  'mixed-chutney': [ing('Mint', 20, 'g', 'produce'), ing('Coriander', 20, 'g', 'produce'), ing('Tamarind', 20, 'g', 'pantry')],
  'fryums': [ing('Fryums', 50, 'g', 'pantry')],
  'onion-rings': [ing('Onions', 2, 'pc', 'produce'), ing('Gram Flour', 50, 'g', 'grains')],
  'lemon-wedge': [ing('Lemon', 1, 'pc', 'produce')],
  'green-chili': [ing('Green Chilli', 3, 'pc', 'produce')],
  'pappadam': [ing('Papad', 2, 'pc', 'pantry')],
  'mirchi-ka-salan': [ing('Peanuts', 30, 'g', 'proteins'), ing('Sesame Seeds', 10, 'g', 'spices'), ing('Coconut', 30, 'g', 'produce'), ing('Red Chilli', 3, 'pc', 'produce'), ing('Tamarind', 10, 'g', 'pantry')],
  'sev': [ing('Sev', 50, 'g', 'pantry')],
  'farsan': [ing('Farsan Mix', 50, 'g', 'pantry')],
  'salsa': [ing('Tomatoes', 2, 'pc', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Coriander', 10, 'g', 'produce'), ing('Lime', 1, 'pc', 'produce')],
  'sour-cream': [ing('Sour Cream', 50, 'g', 'dairy')],
  'namkeen': [ing('Namkeen Mix', 50, 'g', 'pantry')],
  'mixed-nuts': [ing('Almonds', 10, 'g', 'pantry'), ing('Cashews', 10, 'g', 'pantry'), ing('Pistachios', 10, 'g', 'pantry')],
  'almonds': [ing('Almonds', 10, 'g', 'pantry')],
  'pistachios': [ing('Pistachios', 10, 'g', 'pantry')],
  'honey': [ing('Honey', 30, 'g', 'pantry')],
  'mayonnaise': [ing('Mayonnaise', 30, 'g', 'pantry')],
  'toast': [ing('White Bread', 2, 'pc', 'pantry')],
  'baati': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Ghee', 30, 'g', 'dairy')],
  'bhature': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Yogurt', 30, 'g', 'dairy'), ing('Oil', 30, 'ml', 'pantry')],
  'herbal-tea': [ing('Herbal Tea Bag', 1, 'pc', 'pantry'), ing('Water', 200, 'ml', 'pantry')],
  'iced-tea': [ing('Tea', 1, 'tbsp', 'pantry'), ing('Ice', 4, 'pc', 'pantry'), ing('Sugar', 20, 'g', 'pantry'), ing('Lemon', 1, 'pc', 'produce')],
  'gundruk-soup': [ing('Gundruk', 50, 'g', 'pantry'), ing('Onions', 1, 'pc', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'toasted-seeds': [ing('Mixed Seeds', 20, 'g', 'pantry')],
  'sesame-seeds': [ing('Sesame Seeds', 10, 'g', 'spices')],
  'fermented-greens': [ing('Fermented Greens / Gundruk', 50, 'g', 'pantry')],
  'dry-fruits-nuts': [ing('Almonds', 10, 'g', 'pantry'), ing('Cashews', 10, 'g', 'pantry'), ing('Raisins', 10, 'g', 'pantry')],
  'dry-fruit-mix': [ing('Mixed Dry Fruits', 30, 'g', 'pantry')],
  'rusk': [ing('Rusk', 2, 'pc', 'breads')],
  'saffron': [ing('Saffron', 1, 'pinch', 'spices')],

  // ─── Beverages ────────────────────────────────────────────
  'nimbu-pani': [ing('Lemon', 2, 'pc', 'produce'), ing('Sugar', 20, 'g', 'pantry')],
  'chaas-buttermilk': [ing('Yogurt', 100, 'g', 'dairy')],
  'aam-panna': [ing('Raw Mango', 1, 'pc', 'produce'), ing('Sugar', 30, 'g', 'pantry'), ing('Spices', 1, 'packet', 'spices')],
  'sweet-lassi': [ing('Yogurt', 150, 'g', 'dairy'), ing('Sugar', 20, 'g', 'pantry')],
  'salted-lassi': [ing('Yogurt', 150, 'g', 'dairy')],
  'mango-lassi': [ing('Yogurt', 150, 'g', 'dairy'), ing('Mango', 1, 'pc', 'produce')],
  'jaljeera': [ing('Mint', 20, 'g', 'produce'), ing('Cumin', 1, 'tsp', 'spices'), ing('Lemon', 1, 'pc', 'produce')],
  'masala-chai': [ing('Tea', 1, 'tbsp', 'pantry'), ing('Milk', 100, 'ml', 'dairy'), ing('Ginger', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'badam-milk': [ing('Almonds', 10, 'g', 'pantry'), ing('Milk', 200, 'ml', 'dairy'), ing('Saffron', 1, 'pinch', 'spices')],
  'thandai': [ing('Milk', 200, 'ml', 'dairy'), ing('Almonds', 10, 'g', 'pantry'), ing('Poppy Seeds', 5, 'g', 'spices'), ing('Spices', 1, 'packet', 'spices')],
  'sharbat': [ing('Sharbat Syrup', 30, 'ml', 'pantry')],
  'filter-coffee': [ing('Coffee Powder', 2, 'tbsp', 'pantry'), ing('Milk', 100, 'ml', 'dairy')],
  'sambaram-spiced-buttermilk': [ing('Yogurt', 100, 'g', 'dairy'), ing('Green Chilli', 1, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce')],
  'kokum-sharbat': [ing('Kokum', 5, 'pc', 'pantry'), ing('Sugar', 20, 'g', 'pantry')],
  'sol-kadhi': [ing('Kokum', 5, 'pc', 'pantry'), ing('Coconut Milk', 100, 'ml', 'dairy')],
  // ─── Beverage display-name aliases (from indian_meal_categories) ─
  'coconut-water': [ing('Coconut Water', 200, 'ml', 'pantry')],
  'sattu-sharbat': [ing('Sattu', 50, 'g', 'grains'), ing('Lemon', 1, 'pc', 'produce'), ing('Sugar', 20, 'g', 'pantry')],
  'kokum-sherbet': [ing('Kokum', 5, 'pc', 'pantry'), ing('Sugar', 20, 'g', 'pantry')],
  'ginger-lemon': [ing('Ginger', 15, 'g', 'produce'), ing('Lemon', 1, 'pc', 'produce'), ing('Honey', 10, 'ml', 'pantry')],

  // ─── Fruits ────────────────────────────────────────────────
  'mixed-fruit': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce')],
  'seasonal-fruit': [ing('Seasonal Fruit', 200, 'g', 'produce')],
  'mixed seasonal fruit': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce')],
  'apple': [ing('Apple', 1, 'pc', 'produce')],
  'banana': [ing('Banana', 1, 'pc', 'produce')],
  'orange': [ing('Orange', 1, 'pc', 'produce')],
  'mango': [ing('Mango', 1, 'pc', 'produce')],
  'pomegranate': [ing('Pomegranate', 1, 'pc', 'produce')],
  'papaya': [ing('Papaya', 100, 'g', 'produce')],
  'watermelon': [ing('Watermelon', 200, 'g', 'produce')],
  'grapes': [ing('Grapes', 100, 'g', 'produce')],
  'guava': [ing('Guava', 1, 'pc', 'produce')],
  'pineapple': [ing('Pineapple', 100, 'g', 'produce')],
  'coconut': [ing('Coconut', 50, 'g', 'produce')],
  'avocado': [ing('Avocado', 1, 'pc', 'produce')],
  'fruit-chaat': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce'), ing('Lemon', 1, 'pc', 'produce'), ing('Spices', 1, 'packet', 'spices')],
  'fruit-cream': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce'), ing('Cream', 50, 'ml', 'dairy'), ing('Sugar', 20, 'g', 'pantry')],
  'fruit-pachadi': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce'), ing('Yogurt', 100, 'g', 'dairy'), ing('Coconut', 20, 'g', 'produce')],
  'fruit-payesh': [ing('Mixed Seasonal Fruit', 200, 'g', 'produce'), ing('Rice', 50, 'g', 'grains'), ing('Milk', 200, 'ml', 'dairy'), ing('Sugar', 30, 'g', 'pantry')],

  // ─── Desserts (from indian_meal_categories) ────────────────
  'kheer-/-payasam': [ing('Rice', 50, 'g', 'grains'), ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry')],
  'gulab-jamun': [ing('Milk Powder', 100, 'g', 'pantry'), ing('Sugar', 100, 'g', 'pantry'), ing('Ghee', 30, 'g', 'dairy')],
  'rasgulla': [ing('Milk', 1, 'l', 'dairy'), ing('Sugar', 100, 'g', 'pantry')],
  'jalebi': [ing('Maida', 100, 'g', 'grains'), ing('Sugar', 100, 'g', 'pantry'), ing('Yogurt', 50, 'g', 'dairy')],
  'gajar-halwa': [ing('Carrots', 500, 'g', 'produce'), ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry'), ing('Ghee', 30, 'g', 'dairy')],
  'sooji-halwa': [ing('Semolina (Rava)', 100, 'g', 'grains'), ing('Sugar', 80, 'g', 'pantry'), ing('Ghee', 50, 'g', 'dairy')],
  'rasmalai': [ing('Milk', 1, 'l', 'dairy'), ing('Sugar', 100, 'g', 'pantry'), ing('Saffron', 1, 'pinch', 'spices')],
  'shrikhand': [ing('Yogurt', 500, 'g', 'dairy'), ing('Sugar', 50, 'g', 'pantry'), ing('Saffron', 1, 'pinch', 'spices')],
  'barfi-(milk/coconut)': [ing('Milk Powder', 200, 'g', 'pantry'), ing('Sugar', 100, 'g', 'pantry'), ing('Coconut', 50, 'g', 'produce')],
  'modak': [ing('Rice Flour', 200, 'g', 'grains'), ing('Coconut', 100, 'g', 'produce'), ing('Jaggery', 100, 'g', 'pantry')],
  'phirni': [ing('Rice', 50, 'g', 'grains'), ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry')],
  'ladoo-(besan/motichoor)': [ing('Gram Flour', 200, 'g', 'grains'), ing('Sugar', 100, 'g', 'pantry'), ing('Ghee', 50, 'g', 'dairy')],
  'malpua': [ing('Maida', 100, 'g', 'grains'), ing('Milk', 200, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry')],
  'kulfi': [ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry'), ing('Pistachios', 20, 'g', 'pantry')],
  'mango-kulfi': [ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 50, 'g', 'pantry'), ing('Pistachios', 20, 'g', 'pantry'), ing('Mango', 1, 'pc', 'produce')],
  'aamras': [ing('Mango', 2, 'pc', 'produce'), ing('Sugar', 30, 'g', 'pantry'), ing('Cardamom', 1, 'pinch', 'spices')],
  'ras-malai': [ing('Milk', 1, 'l', 'dairy'), ing('Sugar', 100, 'g', 'pantry'), ing('Saffron', 1, 'pinch', 'spices')],

  // ─── Accompaniments (market purchase items) ────────────────
  '🍪 biscuit': [ing('Biscuit', 1, 'packet', 'snacks')],
  '🍪-biscuit': [ing('Biscuit', 1, 'packet', 'snacks')],
  'biscuit': [ing('Biscuit', 1, 'packet', 'snacks')],
  '🥜 roasted peanuts': [ing('Roasted Peanuts', 1, 'packet', 'snacks')],
  '🥜-roasted-peanuts': [ing('Roasted Peanuts', 1, 'packet', 'snacks')],
  'roasted-peanuts': [ing('Roasted Peanuts', 1, 'packet', 'snacks')],
  'roasted peanuts': [ing('Roasted Peanuts', 1, 'packet', 'snacks')],
  '🧊 ice': [ing('Ice', 1, 'tray', 'pantry')],
  '🧊-ice': [ing('Ice', 1, 'tray', 'pantry')],
  'ice': [ing('Ice', 1, 'tray', 'pantry')],
  '🌿 mint': [ing('Mint Leaves', 1, 'bunch', 'produce')],
  '🌿-mint': [ing('Mint Leaves', 1, 'bunch', 'produce')],
  'mint': [ing('Mint Leaves', 1, 'bunch', 'produce')],
  // ── Missing common sides ──
  'ketchup': [ing('Ketchup', 2, 'tbsp', 'pantry')],
  'tomato-sauce': [ing('Tomato Sauce', 2, 'tbsp', 'pantry')],
  'dipping-sauce': [ing('Dipping Sauce', 2, 'tbsp', 'pantry')],
  'chips': [ing('Chips', 1, 'packet', 'snacks')],
  'biscuits': [ing('Biscuits', 2, 'pc', 'snacks')],
  'cookies': [ing('Cookies', 2, 'pc', 'snacks')],
  'light-cookies': [ing('Cookies', 2, 'pc', 'snacks')],
  'biscotti': [ing('Biscotti', 2, 'pc', 'snacks')],
  'granola': [ing('Granola', 0.5, 'cup', 'grains')],
  'coconut-chips': [ing('Coconut Chips', 0.5, 'cup', 'snacks')],
  'coconut-flakes': [ing('Coconut Flakes', 2, 'tbsp', 'pantry')],
  'chopped-onion': [ing('Onions', 1, 'pc', 'produce')],
  'chopped-onions': [ing('Onions', 1, 'pc', 'produce')],
  'lettuce': [ing('Lettuce', 0.5, 'cup', 'produce')],
  'croutons': [ing('Bread', 1, 'pc', 'breads')],
  'hummus': [ing('Chickpeas', 0.25, 'cup', 'proteins'), ing('Tahini', 1, 'tbsp', 'pantry'), ing('Olive Oil', 1, 'tbsp', 'pantry')],
  'berry-compote': [ing('Mixed Berries', 0.5, 'cup', 'produce'), ing('Sugar', 1, 'tbsp', 'pantry')],
  'jaggery-syrup': [ing('Jaggery', 2, 'tbsp', 'pantry')],
  'curry': [ing('Curry Leaves', 1, 'sprig', 'produce')],
  'side-salad': [ing('Mixed Greens', 1, 'cup', 'produce'), ing('Lemon Juice', 1, 'tbsp', 'pantry')],
  'extra-butter': [ing('Butter', 1, 'tbsp', 'dairy')],
  'ghost-chili-chutney': [ing('Ghost Chili', 2, 'pc', 'produce'), ing('Lemon Juice', 1, 'tbsp', 'pantry')],
  'black-sesame-chutney': [ing('Black Sesame Seeds', 2, 'tbsp', 'spices'), ing('Salt', 0.5, 'tsp', 'pantry')],

  // ─── True-gap dishes (explicit canonical fills — never generic fallbacks) ──
  'malabar-parota': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Oil', 30, 'ml', 'pantry'), ing('Egg', 1, 'pc', 'proteins')],
  'pazham-pori': [ing('Banana', 4, 'pc', 'produce'), ing('Maida', 100, 'g', 'grains'), ing('Sugar', 30, 'g', 'pantry'), ing('Oil', 30, 'ml', 'pantry')],
  'sadhya': [ing('Rice', 100, 'g', 'grains'), ing('Banana', 1, 'pc', 'produce'), ing('Coconut', 30, 'g', 'produce'), ing('Papad', 2, 'pc', 'pantry'), ing('Curry Leaves', 1, 'sprig', 'produce')],
  'ada-pradhaman': [ing('Rice', 50, 'g', 'grains'), ing('Coconut Milk', 200, 'ml', 'dairy'), ing('Jaggery', 50, 'g', 'pantry'), ing('Cardamom', 1, 'pinch', 'spices')],
  'haalbai': [ing('Rice', 100, 'g', 'grains'), ing('Milk', 500, 'ml', 'dairy'), ing('Sugar', 30, 'g', 'pantry'), ing('Cardamom', 1, 'pinch', 'spices')],
  'pori-urundai': [ing('Puffed Rice (Pori)', 100, 'g', 'grains'), ing('Jaggery', 50, 'g', 'pantry'), ing('Coconut', 30, 'g', 'produce')],
  'shankhali': [ing('Maida', 100, 'g', 'grains'), ing('Buttermilk', 50, 'ml', 'dairy'), ing('Oil', 30, 'ml', 'pantry')],
  'gathiya': [ing('Gram Flour (Besan)', 100, 'g', 'grains'), ing('Oil', 30, 'ml', 'pantry'), ing('Cumin', 1, 'tsp', 'spices')],
  'sindhi-koki': [ing('Wheat Flour (Atta)', 200, 'g', 'grains'), ing('Onions', 1, 'pc', 'produce'), ing('Green Chilli', 2, 'pc', 'produce'), ing('Coriander', 10, 'g', 'produce'), ing('Ghee', 30, 'g', 'dairy')],
  'rugra': [ing('Mushrooms (Rugra)', 200, 'g', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Oil', 30, 'ml', 'pantry')],
  'thenthuk': [ing('Wheat Flour', 200, 'g', 'grains'), ing('Cabbage', 0.5, 'cup', 'produce'), ing('Carrots', 0.5, 'cup', 'produce'), ing('Potatoes', 1, 'pc', 'produce'), ing('Oil', 30, 'ml', 'pantry')],
  'chamthong': [ing('Cabbage', 0.5, 'cup', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Potatoes', 1, 'pc', 'produce'), ing('Beans', 0.25, 'cup', 'produce'), ing('Oil', 15, 'ml', 'pantry')],
  'morok-metpa': [ing('Soybeans', 0.5, 'cup', 'proteins'), ing('Red Chilli', 3, 'pc', 'produce'), ing('Mustard Oil', 15, 'ml', 'pantry')],
  'singju': [ing('Cabbage', 0.5, 'cup', 'produce'), ing('Onions', 0.5, 'pc', 'produce'), ing('Cucumber', 1, 'pc', 'produce'), ing('Lemon', 1, 'pc', 'produce'), ing('Red Chilli', 2, 'pc', 'produce')],
  'paaknam': [ing('Mustard Greens', 0.5, 'cup', 'produce'), ing('Rice Flour', 50, 'g', 'grains'), ing('Mustard Oil', 15, 'ml', 'pantry')],
  'alu-kangmet': [ing('Potatoes', 2, 'pc', 'produce'), ing('Red Chilli', 2, 'pc', 'produce'), ing('Mustard Oil', 15, 'ml', 'pantry')],
  'pumaloi': [ing('Rice Flour', 200, 'g', 'grains'), ing('Water', 100, 'ml', 'pantry')],
  'pudoh': [ing('Sticky Rice', 200, 'g', 'grains'), ing('Water', 100, 'ml', 'pantry')],
  'minil-songa': [ing('Rice', 100, 'g', 'grains'), ing('Milk', 500, 'ml', 'dairy'), ing('Jaggery', 50, 'g', 'pantry')],
  'pukhlein': [ing('Rice', 100, 'g', 'grains'), ing('Sesame Seeds', 20, 'g', 'spices'), ing('Jaggery', 30, 'g', 'pantry')],
  'sakin-gata': [ing('Spinach', 100, 'g', 'produce'), ing('Onions', 1, 'pc', 'produce'), ing('Mustard Oil', 15, 'ml', 'pantry')],
  'kyat': [ing('Tea', 2, 'tbsp', 'pantry'), ing('Milk', 200, 'ml', 'dairy'), ing('Sugar', 20, 'g', 'pantry')],
  'boiled-vegetables': [ing('Carrots', 1, 'pc', 'produce'), ing('Green Beans', 1, 'cup', 'produce'), ing('Potatoes', 1, 'pc', 'produce'), ing('Cauliflower', 0.5, 'pc', 'produce'), ing('Salt', 1, 'tsp', 'pantry')],
  'panch-phoran-tarka': [ing('Panch Phoran', 1, 'tbsp', 'spices'), ing('Oil', 15, 'ml', 'pantry'), ing('Mixed Vegetables', 1, 'cup', 'produce')],
  'zu': [ing('Sticky Rice', 200, 'g', 'grains'), ing('Water', 200, 'ml', 'pantry')],
  'lubrusca-wine': [ing('Grapes', 500, 'g', 'produce'), ing('Sugar', 50, 'g', 'pantry')],
  'gundruk': [ing('Gundruk (Fermented Greens)', 50, 'g', 'pantry'), ing('Onions', 1, 'pc', 'produce'), ing('Tomatoes', 1, 'pc', 'produce'), ing('Ginger', 1, 'pc', 'produce')],
  'chang': [ing('Sticky Rice', 200, 'g', 'grains'), ing('Water', 200, 'ml', 'pantry')],
  'galho': [ing('Rice', 100, 'g', 'grains'), ing('Mixed Vegetables', 0.5, 'cup', 'produce'), ing('Onions', 0.5, 'pc', 'produce')],
  'chow-mein': [ing('Noodles', 200, 'g', 'grains'), ing('Cabbage', 0.5, 'cup', 'produce'), ing('Carrots', 0.5, 'cup', 'produce'), ing('Soy Sauce', 1, 'tbsp', 'pantry'), ing('Oil', 30, 'ml', 'pantry')],
  'loaded-veggie-nachos': [ing('Nacho Chips', 100, 'g', 'snacks'), ing('Cheese', 50, 'g', 'dairy'), ing('Onions', 0.5, 'pc', 'produce'), ing('Capsicum', 0.5, 'pc', 'produce'), ing('Salsa', 30, 'g', 'pantry')],
  'malai-chaap': [ing('Soya Chaap', 200, 'g', 'proteins'), ing('Cream', 50, 'ml', 'dairy'), ing('Yogurt', 50, 'g', 'dairy'), ing('Garam Masala', 0.5, 'tsp', 'spices'), ing('Ghee', 20, 'g', 'dairy')],
};

export function getIngredientsForCategoryOption(catId: string): Ingredient[] {
  const direct = CATEGORY_INGREDIENTS[catId];
  if (direct) return direct;
  const normalized = catId.toLowerCase().replace(/[\s-/]+/g, '-');
  const match = CATEGORY_INGREDIENTS[normalized];
  if (match) return match;
  const fuzzyKey = Object.keys(CATEGORY_INGREDIENTS).find(k => {
    const kn = k.toLowerCase().replace(/[\s-]+/g, '-');
    const isCompound = normalized.includes('-');
    if (isCompound) {
      if (!kn.includes('-')) return false;
      const kw = kn.split('-');
      const nw = normalized.split('-');
      return kw.some(w => nw.includes(w));
    }
    return kn.includes(normalized) || normalized.includes(kn);
  });
  return fuzzyKey ? (CATEGORY_INGREDIENTS[fuzzyKey] ?? []) : [];
}

export function getIngredientsFromCategorySelections(selections: CategorySelection): Ingredient[] {
  const result: Ingredient[] = [];
  const added = new Set<string>();
  const itemQtys = selections.itemQtys ?? {};
  const push = (ing: Ingredient, selectedName: string) => {
    const q = itemQtys[selectedName] ?? 1;
    const key = `${ing.name}:${ing.category}`;
    if (!added.has(key)) {
      result.push({ ...ing, quantity: Math.round(ing.quantity * q * 10) / 10 });
      added.add(key);
    }
  };
  const resolve = (item: { id: string; name: string } | null | undefined) => {
    if (!item) return;
    for (const ing of getIngredientsForCategoryOption(item.id)) push(ing, item.name);
  };
  const resolveArr = (items: { id: string; name: string }[] | undefined) => {
    if (!items) return;
    for (const item of items) resolve(item);
  };
  resolve(selections.gravy);
  resolve(selections.roti);
  resolve(selections.rice);
  resolveArr(selections.sides);
  resolveArr(selections.beverages);
  resolveArr(selections.dessert);
  return result;
}

export interface AggregatedIngredient {
    name: string;
    totalQuantity: number;
    unit: string;
    category: IngredientCategory;
    sources: string[]; // dish names that include this ingredient
    checked: boolean;
    id: string;
}

/**
 * Per-piece / per-cup gram estimates for buy-unfriendly units (produce/herbs).
 * Used by buildPantryGroups so the pantry shows buy-friendly grams instead of
 * "0.5 cup" / "2.5 pc". Standard per-item approximations, not lab measurements.
 * Matched name-first (longest match wins).
 */
const GRAMS_PER_PC: Array<[RegExp, number]> = [
    [/coriander|dhania/i, 30],      // 1 cup chopped coriander ≈ 30 g
    [/mint|pudina/i, 25],
    [/curry leaves/i, 12],
    [/parsley/i, 25],
    [/ginger|adrak/i, 10],
    [/garlic/i, 4],
    [/onion|pyaaz/i, 100],
    [/potato|aloo/i, 120],
    [/tomato/i, 80],
    [/capsicum|bell pepper/i, 120],
    [/carrot|gajar/i, 80],
    [/cucumber|kheera/i, 120],
    [/brinjal|eggplant|baingan/i, 120],
    [/lady(r)?finger|bhindi|okra/i, 8],
    [/green chilli|mirch/i, 3],
    [/lemon|nimbu/i, 60],
    [/mango/i, 150],
    [/banana/i, 100],
    [/apple/i, 150],
    [/coconut/i, 90],
];

/** True when this ingredient should be normalized to grams in the pantry. */
export function shouldConvertToGrams(ing: { name: string; unit: string; category: IngredientCategory }): boolean {
    if (ing.category === 'produce' || ing.category === 'breads') return true;
    if (ing.category === 'spices' && (ing.unit === 'pc' || ing.unit === 'pcs')) return true;
    return false;
}

/** Grams per current piece for a produce/herb/spice ingredient name, or null. */
export function gramsPerUnitOf(name: string): number | null {
    const lower = name.toLowerCase();
    for (const [re, grams] of GRAMS_PER_PC) {
        if (re.test(lower)) return grams;
    }
    return null;
}

/**
 * Convert a raw ingredient to buy-friendly grams (pc/pcs/cup/bunch → g), or
 * return the ingredient unchanged when it is already buy-friendly. Used both by
 * buildPantryGroups and the pantry surplus forecast so purchase packs ("Coriander
 * 200 g") reconcile with forecast rows. Pure, deterministic.
 */
export function toBuyGrams(
    ing: { name: string; quantity: number; unit: string; category: IngredientCategory },
): { name: string; quantity: number; unit: string; category: IngredientCategory } {
    const qty = ing.quantity;
    if (!shouldConvertToGrams(ing)) return { ...ing, quantity: qty };
    if (ing.unit === 'g' || ing.unit === 'kg') return { ...ing, quantity: qty };
    const gPerU = gramsPerUnitOf(ing.name);
    if (gPerU == null) return { ...ing, quantity: qty };
    let out = Math.max(1, Math.round(qty * gPerU));
    let unit: string = 'g';
    if (out >= 1000) {
        out = Number((out / 1000).toFixed(1));
        unit = 'kg';
    }
    return { name: ing.name, quantity: out, unit, category: ing.category };
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
    snacks: { label: 'Snacks', emoji: '🍿' },
};

const CATEGORY_ORDER: IngredientCategory[] = ['produce', 'proteins', 'dairy', 'grains', 'spices', 'pantry', 'breads', 'snacks'];

function toStableId(name: string, category?: string): string {
    // Use the same ID format as toOption() in MealCard
    let id = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    // Remove 'toast' prefix for non-breads (legacy compatibility)
    if (category !== 'breads') {
        id = id.replace(/^toast-|-toast-|-toast$/g, '');
    }
    return id;
}

function aggregateIngredients(
    allIngredients: { ing: Ingredient; source: string }[]
): Map<string, AggregatedIngredient> {
    const map = new Map<string, AggregatedIngredient>();

    const singularize = (n: string): string => {
        const lower = n.toLowerCase();
        if (lower.endsWith('es')) {
            const root = lower.slice(0, -2);
            if (root.length >= 2) return root;
        }
        if (lower.endsWith('s') && !lower.endsWith('ss')) {
            const root = lower.slice(0, -1);
            if (root.length >= 2) return root;
        }
        return lower;
    };

    for (const { ing, source } of allIngredients) {
        // Use canonicalName for alias matching (coriander/coriander leaves, etc.)
        // then singularize for any remaining plurals
        const canonical = canonicalName(ing.name);
        const normalizedName = singularize(canonical);
        const key = toStableId(normalizedName, ing.category);
        const existing = map.get(key);

        if (existing) {
            existing.totalQuantity += ing.quantity;
            if (!existing.sources.includes(source)) {
                existing.sources.push(source);
            }
            if (ing.name.length < existing.name.length) {
                existing.name = ing.name;
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
function inferIngredientsFromDishId(dishId: string, dishName?: string, dishType?: string): Ingredient[] {
    const idLower = dishId.toLowerCase();
    const result: Ingredient[] = [];

    // Variant-aware protein inference: only run when dishName adds new info beyond dishId
    if (dishName && dishName.toLowerCase() !== idLower) {
        const n = dishName.toLowerCase();
        const hasKeyword = (kw: string) => {
            const re = new RegExp(`\\b${kw}\\b`, 'i');
            if (re.test(dishName)) return true;
            const lower = kw.toLowerCase();
            // Word-boundary fallback: prevent substring false positives (e.g., 'veg' in 'veggie')
            // Allows 's' as suffix for plurals (e.g., 'Egg' → 'Eggs')
            const boundRe = new RegExp(`(?:^|[\\s-])${lower}(?:s\\b|[\\s-]|$)`, 'i');
            return boundRe.test(n);
        };

        if (hasKeyword('Chicken') && !hasKeyword('Chickpea') && !n.includes('chick')) {
            result.push({ name: 'Chicken', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        }
        if (hasKeyword('Mutton') || hasKeyword('Lamb') || hasKeyword('Goat')) {
            result.push({ name: 'Mutton', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        }
        if (hasKeyword('Fish') || hasKeyword('Prawn') || hasKeyword('Shrimp') || hasKeyword('Seafood')) {
            result.push({ name: 'Fish', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
        }
        if (hasKeyword('Paneer') || hasKeyword('Cottage Cheese')) {
            result.push({ name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
        }
        if ((hasKeyword('Veg') || hasKeyword('Vegetable') || hasKeyword('Mixed')) && !n.includes('non-veg') && !n.includes('meat') && !n.includes('veggie') && !n.includes('vegetarian')) {
            result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        }
        if (hasKeyword('Egg') && !n.includes('veggie') && !n.includes('eggless') && !hasKeyword('Eggplant') && !n.includes('baingan') && !n.includes('brinjal')) {
            result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
        }
        if (hasKeyword('Beef')) {
            result.push({ name: 'Beef', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        }
        if (hasKeyword('Pork')) {
            result.push({ name: 'Pork', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        }
    }
    
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
    if (idLower.includes('chole') || idLower.includes('chickpea') || idLower.includes('chana') || idLower.includes('kadala')) {
        result.push({ name: 'Chickpeas', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    }
    if (idLower.includes('rajma')) {
        result.push({ name: 'Rajma', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    }
    // INF-10: Dal/Lentil inference - specific types
    if (idLower.includes('chana dal') || idLower.includes('chole') || idLower.includes('chickpea') || idLower.includes('kadala')) {
        result.push({ name: 'Chana Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('toor dal') || idLower.includes('arhar') || idLower.includes('tur dal')) {
        result.push({ name: 'Toor Dal', quantity: 80, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('moong')) {
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
    // INF-05: Egg inference (from dishId) — skip for vegan dishes
    if (dishType !== 'vegan' && idLower.includes('egg') && !idLower.includes('veggie') && !idLower.includes('eggless') && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal')) {
        result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
    }
    if (idLower.includes('chicken') || idLower.includes('meat') || idLower.includes('kozhi')) {
        result.push({ name: 'Chicken', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('paneer')) {
        result.push({ name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('mutton') || idLower.includes('lamb') || idLower.includes('gosht') || idLower.includes('bakra')) {
        result.push({ name: 'Mutton', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('fish') || idLower.includes('meen') || idLower.includes('machher') || idLower.includes('kadal')) {
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
    // INF-07: Aloo/Potato inference — sane count (a dish uses ~3 potatoes, NOT 0.5pc)
    if (idLower.includes('aloo') || idLower.includes('potato')) {
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-07: Gobhi/Cauliflower inference — bulk veg → grams (NOT 0.33pc)
    if (idLower.includes('gobhi') || idLower.includes('gobi') || idLower.includes('cauliflower')) {
        result.push({ name: 'Cauliflower', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-PALAK: Spinach inference (palak dishes + palak soups)
    if (idLower.includes('palak') || idLower.includes('spinach')) {
        result.push({ name: 'Spinach', quantity: 150, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-BROCCOLI: Broccoli inference (roasted/curried broccoli mains)
    if (idLower.includes('broccoli')) {
        result.push({ name: 'Broccoli', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-GAJAR: Carrot inference ("gajar-ka-halwa" etc.)
    if (idLower.includes('gajar') || idLower.includes('carrot')) {
        result.push({ name: 'Carrot', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-SWEET-POTATO: Sweet Potato inference — "sweet" alone must NOT route a
    // savoury sweet-potato dish to the sugar/milk dessert fIller.
    if (idLower.includes('sweet') && idLower.includes('potato')) {
        result.push({ name: 'Sweet Potato', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-MATAR: Green Peas inference — any dish named Matar/Peas carries green peas.
    // Token-delimited so "tamatar" (ta-MATAR) and "black-eyed peas" (a pulse) don't false-fire.
    {
        const _peasHay = `${idLower} ${(dishName || '').toLowerCase()}`.replace(/_/g, '-');
        const _isPulsePeas = /(?:^|[\s-])black[\s-]?eyed[\s-]peas?(?:\b|[\s-]|$)/.test(_peasHay)
            || /(?:^|[\s-])lobiya(?:\b|[\s-]|$)/.test(_peasHay)
            || /(?:^|[\s-])tamatar(?:\b|[\s-]|$)/.test(_peasHay);
        const _hasGreenPeas = !_isPulsePeas && (
            /(?:^|[\s-])green[\s-]+peas?(?:\b|[\s-]|$)/.test(_peasHay)
            || /(?:^|[\s-])matar(?:\b|[\s-]|$)/.test(_peasHay)
            || /(?:^|[\s-])peas?(?:\b|[\s-]|$)/.test(_peasHay)
        );
        if (_hasGreenPeas && !result.find(i => /^green peas|peas$/i.test(i.name))) {
            result.push({ name: 'Green Peas', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        }
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
    if (dishType !== 'vegan' && dishType !== 'veg' && (idLower.includes('french toast') || idLower.includes('french-toast') || idLower.includes('egg toast') || idLower.includes('egg') && !idLower.includes('veggie') && !idLower.includes('eggless') || idLower.includes('bread dish') || idLower.includes('bread toast')) && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal')) {
        result.push({ name: 'White Bread', quantity: 4, unit: 'pcs', category: 'breads', inStock: false });
        result.push({ name: 'Eggs', quantity: 2, unit: 'pcs', category: 'proteins', inStock: false });
        result.push({ name: 'Milk', quantity: 100, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Butter', quantity: 20, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-11: Bread dishes (white-bread, brown-bread, milk-bread, bread-toast)
    if (idLower.includes('bread') || idLower.includes('sandwich')) {
        result.push({ name: 'White Bread', quantity: 4, unit: 'slices', category: 'breads', inStock: false });
    }
    // INF-PIZZA: Pizza dishes (pizza sauce + mozzarella)
    if (idLower.includes('pizza')) {
        result.push({ name: 'Pizza Sauce', quantity: 0.5, unit: 'cup', category: 'pantry', inStock: false });
        result.push({ name: 'Mozzarella', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-12: Jeera/Cumin dishes
    if (idLower.includes('jeera') || idLower.includes('cumin')) {
        result.push({ name: 'Cumin Seeds', quantity: 1, unit: 'tsp', category: 'spices', inStock: false });
    }
    // INF-13: South Indian batter breakfast (idli, dosa, uttapam)
    if (idLower.includes('idli') || idLower.includes('dosa') || idLower.includes('uttapam')) {
        result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        result.push({ name: 'Urad Dal', quantity: 50, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-43: Puttu (Kerala rice cake — rice flour + coconut)
    if (idLower.includes('puttu')) {
        result.push({ name: 'Rice Flour', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        result.push({ name: 'Coconut', quantity: 0.5, unit: 'cup', category: 'produce', inStock: false });
    }
    // INF-14: Pongal
    if (idLower.includes('pongal')) {
        result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        result.push({ name: 'Moong Dal', quantity: 50, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-15: Fruit dish inference (fruit chaat, fruit cream, pachadi, payesh)
    if (idLower.includes('fruit')) {
        result.push({ name: 'Apple', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Banana', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Orange', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Mango', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Pomegranate', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Papaya', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Watermelon', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Grapes', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Guava', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Pineapple', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 50, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-16: Chaat / Snack inference (samosa, pani-puri, papdi-chaat, kachori, etc.)
    if (idLower.includes('samosa') || idLower.includes('kachori')) {
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Peas', quantity: 50, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Wheat Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });
    }
    if (idLower.includes('chaat') || idLower.includes('pani-puri') || idLower.includes('bhel') || idLower.includes('sev') || idLower.includes('papdi')) {
        result.push({ name: 'Potatoes', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
        result.push({ name: 'Tamarind Chutney', quantity: 30, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Mint Chutney', quantity: 30, unit: 'g', category: 'pantry', inStock: false });
    }
    // INF-17: Sweet/Dessert inference (gulab-jamun, jalebi, rasgulla, kheer, kulfi, payasam, etc.)
    if (idLower.includes('gulab') || idLower.includes('jamun')) {
        result.push({ name: 'Milk Powder', quantity: 200, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Sugar', quantity: 200, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Ghee', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('jalebi') || idLower.includes('imarti')) {
        result.push({ name: 'Maida', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sugar', quantity: 200, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('rasgulla') || idLower.includes('rasmalai') || idLower.includes('ras-malai')) {
        result.push({ name: 'Milk', quantity: 2, unit: 'l', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 200, unit: 'g', category: 'pantry', inStock: false });
    }
    if (idLower.includes('kheer') || idLower.includes('payasam')) {
        result.push({ name: 'Rice', quantity: 50, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Milk', quantity: 1, unit: 'l', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 80, unit: 'g', category: 'pantry', inStock: false });
    }
    if (idLower.includes('kulfi')) {
        result.push({ name: 'Milk', quantity: 1, unit: 'l', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Pistachios', quantity: 20, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Cardamom', quantity: 1, unit: 'pinch', category: 'spices', inStock: false });
    }
    if (idLower.includes('halwa')) {
        result.push({ name: 'Semolina (Rava)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Ghee', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-18: Seafood inference (prawn, chingri, shrimp, crab)
    if (idLower.includes('prawn') || idLower.includes('chingri') || idLower.includes('shrimp')) {
        result.push({ name: 'Prawns', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('crab') || idLower.includes('daab-chingri')) {
        result.push({ name: 'Crab', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('ilish') || idLower.includes('bhetki') || idLower.includes('rohu') || idLower.includes('salmon') || idLower.includes('trout')) {
        result.push({ name: 'Fish', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-SALMON: a dish named after the fish itself should carry that fish
    if (idLower.includes('salmon') && !result.find(i => /salmon|fish/i.test(i.name))) {
        result.push({ name: 'Salmon', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-19: Tofu / Soya protein inference
    if (idLower.includes('tofu')) {
        result.push({ name: 'Tofu', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('soya') || idLower.includes('soybean') || idLower.includes('soy chunks') || idLower.includes('soy-bean')) {
        result.push({ name: 'Soya Chunks', quantity: 100, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Tomatoes', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-20: Northeast cuisine (momos, thukpa, pork)
    if (idLower.includes('momo') || idLower.includes('thukpa')) {
        result.push({ name: 'Maida', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Cabbage', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('pork') || idLower.includes('smoked-pork') || idLower.includes('naga-pork')) {
        result.push({ name: 'Pork', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Ginger', quantity: 20, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Garlic', quantity: 10, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-21: East Indian dishes (shukto, begun-bhaja, kosha-mangsho, machher-jhol)
    if (idLower.includes('shukto')) {
        result.push({ name: 'Bitter Gourd', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Drumsticks', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Raw Banana', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('begun') || idLower.includes('begun-bhaja')) {
        result.push({ name: 'Eggplant', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Turmeric', quantity: 1, unit: 'tsp', category: 'spices', inStock: false });
    }
    if (idLower.includes('kosha') || idLower.includes('kosha-mangsho')) {
        result.push({ name: 'Mutton', quantity: 250, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Onions', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Potatoes', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('machher') || idLower.includes('macher') || idLower.includes('jhol')) {
        result.push({ name: 'Fish', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Turmeric', quantity: 1, unit: 'tsp', category: 'spices', inStock: false });
    }
    // INF-22: South Indian unique dishes (medu-vada, avial, thoran, upma)
    if (idLower.includes('medu') || idLower.includes('vada') || idLower.includes('medu-vada')) {
        result.push({ name: 'Urad Dal', quantity: 100, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Curry Leaves', quantity: 10, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('avial')) {
        result.push({ name: 'Mixed Vegetables', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 50, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('thoran')) {
        result.push({ name: 'Cabbage', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 30, unit: 'g', category: 'produce', inStock: false });
    }
    if (idLower.includes('upma') || idLower.includes('rava')) {
        result.push({ name: 'Semolina (Rava)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Spices', quantity: 1, unit: 'packet', category: 'spices', inStock: false });
    }
    if (idLower.includes('olan')) {
        result.push({ name: 'Pumpkin', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut Milk', quantity: 100, unit: 'ml', category: 'dairy', inStock: false });
    }
    if (idLower.includes('appe') || idLower.includes('appam')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Coconut', quantity: 30, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-23: Kofta dishes
    if (idLower.includes('kofta')) {
        result.push({ name: 'Paneer', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Tomatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-24: Kebab dishes
    if (idLower.includes('kebab') || idLower.includes('seekh') || idLower.includes('shammi') || idLower.includes('galouti')) {
        result.push({ name: 'Mutton', quantity: 250, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Ginger-Garlic Paste', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-25: Manchurian / Indo-Chinese
    if (idLower.includes('manchurian') || idLower.includes('manchow')) {
        result.push({ name: 'Cabbage', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Maida', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Soy Sauce', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-26: Special rice dishes (bisi-bele-bath, pakhala, jadoh)
    if (idLower.includes('bisi') || idLower.includes('bele-bath')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Toor Dal', quantity: 50, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Mixed Vegetables', quantity: 100, unit: 'g', category: 'produce', inStock: false });
    }
    if (idLower.includes('pakhala')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('jadoh')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Pork', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-27: Undhiyu / Handvo (Gujarati specials)
    if (idLower.includes('undhiyu')) {
        result.push({ name: 'Mixed Vegetables', quantity: 300, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 30, unit: 'g', category: 'produce', inStock: false });
    }
    if (idLower.includes('handvo')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Bottle Gourd', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-28: Dhokla / Khandvi (Gujarati snacks)
    if (idLower.includes('dhokla')) {
        result.push({ name: 'Gram Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('khandvi')) {
        result.push({ name: 'Gram Flour', quantity: 150, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-29: Litti / Bafla (Central/East)
    if (idLower.includes('litti') || idLower.includes('bafla')) {
        result.push({ name: 'Wheat Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sattu', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    // INF-30: Aloo Bonda / Sabudana
    if (idLower.includes('bonda') || idLower.includes('aloo-bonda')) {
        result.push({ name: 'Potatoes', quantity: 4, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    if (idLower.includes('sabudana') || idLower.includes('sabudana')) {
        result.push({ name: 'Sabudana', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Peanuts', quantity: 30, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-31: Bisi Bele Bath / Khichdi / Kadhi
    if (idLower.includes('kadhi') || idLower.includes('khakra') || idLower.includes('kadhi-pakora')) {
        result.push({ name: 'Yogurt', quantity: 200, unit: 'g', category: 'dairy', inStock: false });
        result.push({ name: 'Gram Flour', quantity: 50, unit: 'g', category: 'grains', inStock: false });
    }
    // INF-32: Special veg dishes (karela, methi)
    if (idLower.includes('karela') || idLower.includes('karela-masala')) {
        result.push({ name: 'Bitter Gourd', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Onions', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('methi') && !idLower.includes('methi-thepla')) {
        result.push({ name: 'Fenugreek Leaves', quantity: 100, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-33: Paneer tikka / Hariyali paneer
    if (idLower.includes('tikka') && idLower.includes('paneer') || idLower.includes('hariyali')) {
        if (!result.find(i => i.name === 'Paneer')) result.push({ name: 'Paneer', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-34: Remaining sweets (shrikhand, basundi, mishti-doi, sandesh)
    if (idLower.includes('shrikhand') || idLower.includes('basundi') || idLower.includes('mishti') || idLower.includes('sandesh') || idLower.includes('rabdi')) {
        result.push({ name: 'Milk', quantity: 500, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 80, unit: 'g', category: 'pantry', inStock: false });
    }
    // INF-35: Poha (flattened rice)
    if (idLower.includes('poha')) {
        result.push({ name: 'Poha (Flattened Rice)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Peanuts', quantity: 30, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Potatoes', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-36: Beverage dishes (lassi, chaas, aamras, mango-lassi)
    if (idLower.includes('lassi')) {
        result.push({ name: 'Yogurt', quantity: 200, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('chaas') || idLower.includes('chhaas')) {
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('aamras')) {
        result.push({ name: 'Mango', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Sugar', quantity: 30, unit: 'g', category: 'pantry', inStock: false });
    }
    // INF-37: Ragra / Bedmi-puri / Kothimbir-vadi
    if (idLower.includes('ragda') || idLower.includes('ragda-pattice')) {
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Chickpeas', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Tamarind Chutney', quantity: 30, unit: 'g', category: 'pantry', inStock: false });
    }
    if (idLower.includes('bedmi') || idLower.includes('bedmi-puri')) {
        result.push({ name: 'Wheat Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Urad Dal', quantity: 50, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('kothimbir') || idLower.includes('vadi')) {
        result.push({ name: 'Coriander', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    // INF-39: Avocado dishes (sandwich, toast, salad)
    if (idLower.includes('avocado') || idLower.includes('butter fruit')) {
        result.push({ name: 'Avocado', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        if (!idLower.includes('smoothie')) {
            result.push({ name: 'Bread', quantity: 2, unit: 'slices', category: 'breads', inStock: false });
            result.push({ name: 'Lemon', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        }
    }
    if (idLower.includes('avocado') && (idLower.includes('toast') || idLower.includes('sandwich'))) {
        if (!result.find(i => i.name === 'Bread')) {
            result.push({ name: 'Bread', quantity: 2, unit: 'slices', category: 'breads', inStock: false });
        }
    }
    // INF-40: Peanut / Peanut Butter inference
    if (idLower.includes('peanut')) {
        result.push({ name: 'Peanut Butter', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-41: Smoothie inference
    if (idLower.includes('smoothie')) {
        result.push({ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', inStock: false });
        result.push({ name: 'Banana', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Ice', quantity: 1, unit: 'cup', category: 'pantry', inStock: false });
        // Detect specific fruits from dish ID
        if (idLower.includes('raspberry')) result.push({ name: 'Raspberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        if (idLower.includes('blueberry')) result.push({ name: 'Blueberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        if (idLower.includes('strawberry')) result.push({ name: 'Strawberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        if (idLower.includes('mango')) result.push({ name: 'Mango', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        if (idLower.includes('pineapple')) result.push({ name: 'Pineapple', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        if (idLower.includes('dragon')) result.push({ name: 'Dragon Fruit', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        if (idLower.includes('pumpkin')) result.push({ name: 'Pumpkin', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        if (idLower.includes('arugula')) result.push({ name: 'Arugula', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    }
    // INF-42: Burger / Patty dishes
    if (idLower.includes('burger')) {
        result.push({ name: 'Burger Bun', quantity: 2, unit: 'pcs', category: 'breads', inStock: false });
    }

    // INF-38: Chilla dishes (besan, suji, oats, singhara, sprouts, rice chilla)
    if (idLower.includes('besan')) {
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('suji') || idLower.includes('semolina')) {
        result.push({ name: 'Semolina (Rava)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    if (idLower.includes('oats')) {
        result.push({ name: 'Oats', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    if (idLower.includes('singhara')) {
        result.push({ name: 'Singhara Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    if ((idLower.includes('sprouts') || idLower.includes('sprout')) && !idLower.includes('sprouts-chilla')) {
        result.push({ name: 'Mixed Sprouts', quantity: 100, unit: 'g', category: 'proteins', inStock: false });
    }
    if (idLower.includes('rice_chilla') || (idLower.includes('rice') && idLower.includes('chilla'))) {
        result.push({ name: 'Rice Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    }
    // Generic chilla — add base ingredients if no specific flour matched yet
    if (idLower.includes('chilla') && !result.find(i => i.category === 'grains' && (i.name.toLowerCase().includes('flour') || i.name.toLowerCase().includes('semolina') || i.name.toLowerCase().includes('oats')))) {
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }

    // INF-44: Kesari bath / Rava kesari (semolina sweet)
    if (idLower.includes('kesari')) {
        result.push({ name: 'Semolina (Rava)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sugar', quantity: 80, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Ghee', quantity: 30, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-45: Pesarattu (moong dal dosa)
    if (idLower.includes('pesarattu')) {
        result.push({ name: 'Moong Dal', quantity: 100, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Rice', quantity: 30, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Ginger', quantity: 10, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-46: Ragi-based dishes (ragi-mudde)
    if (idLower.includes('ragi')) {
        result.push({ name: 'Ragi Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });
    }
    // INF-47: Erissery (pumpkin + coconut)
    if (idLower.includes('erissery')) {
        result.push({ name: 'Pumpkin', quantity: 200, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 50, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-48: Misal / Misal-Pav (mixed sprouts curry)
    if (idLower.includes('misal')) {
        result.push({ name: 'Mixed Sprouts', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-49: Dabeli (potato-based Gujarati snack)
    if (idLower.includes('dabeli')) {
        result.push({ name: 'Potatoes', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Tamarind Chutney', quantity: 30, unit: 'g', category: 'pantry', inStock: false });
    }
    // INF-50: Gota (Gujarati gram flour fritters) — only match standalone word
    if (/^gota-|-gota-|^gota$/.test(idLower) && !idLower.includes('machi') && !idLower.includes('fish') && !idLower.includes('prawn')) {
        result.push({ name: 'Gram Flour', quantity: 150, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Yogurt', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-51: Kheema (minced meat dishes)
    if (idLower.includes('kheema') || idLower.includes('keema')) {
        result.push({ name: 'Minced Meat', quantity: 250, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Peas', quantity: 50, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-52: Murgh / Murghanu-shaak (chicken curry)
    if (idLower.includes('murgh') || idLower.includes('murghanu')) {
        result.push({ name: 'Chicken', quantity: 250, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-53: Andhra fish (chepa-pulusu)
    if (idLower.includes('chepa')) {
        result.push({ name: 'Fish', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Tamarind', quantity: 20, unit: 'g', category: 'pantry', inStock: false });
    }
    // INF-54: Ivy gourd (dondakaya)
    if (idLower.includes('dondakaya')) {
        result.push({ name: 'Ivy Gourd', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-55: Pineapple-based curry (ananas menaskai)
    if (idLower.includes('ananas')) {
        result.push({ name: 'Pineapple', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        result.push({ name: 'Coconut', quantity: 30, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-56: Jadoh (Meghalayan rice + pork)
    if (idLower.includes('jadoh')) {
        result.push({ name: 'Rice', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Pork', quantity: 150, unit: 'g', category: 'proteins', inStock: false });
    }
    // INF-57: Chikoo shake
    if (idLower.includes('chikoo')) {
        result.push({ name: 'Sapodilla (Chikoo)', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });
    }
    // INF-58: Mysore Pak (gram flour + ghee sweet) — NOT mysore-bonda (savory)
    if ((idLower.includes('mysore') || idLower.includes('mysore-pak')) && !idLower.includes('bonda')) {
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Ghee', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-59: Bharli Vangi / Ennegai (stuffed eggplant)
    if (idLower.includes('bharli') || idLower.includes('ennegai')) {
        result.push({ name: 'Eggplant', quantity: 3, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Peanuts', quantity: 30, unit: 'g', category: 'proteins', inStock: false });
        result.push({ name: 'Coconut', quantity: 30, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-60: Muthiya (Gujarati steamed dumplings)
    if (idLower.includes('muthiya')) {
        result.push({ name: 'Wheat Flour', quantity: 150, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Bottle Gourd', quantity: 100, unit: 'g', category: 'produce', inStock: false });
    }
    // INF-61: Hot chocolate beverages
    if (idLower.includes('hot-chocolate')) {
        result.push({ name: 'Cocoa Powder', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-62: Fruit-based milk beverages
    if (idLower.includes('peach-milk')) {
        result.push({ name: 'Peach', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        result.push({ name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    if (idLower.includes('vegan-strawberry-milk')) {
        result.push({ name: 'Strawberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        result.push({ name: 'Almond Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-63: Shake beverages
    if (idLower.includes('shake')) {
        result.push({ name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });
        if (idLower.includes('tender-coconut') || idLower.includes('coconut-shake')) {
            result.push({ name: 'Coconut', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        }
        if (idLower.includes('chikoo')) {
            result.push({ name: 'Chikoo', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
        }
    }
    // INF-64: Eggless brownies
    if (idLower.includes('eggless-brownies')) {
        result.push({ name: 'Cocoa Powder', quantity: 4, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Maida', quantity: 100, unit: 'g', category: 'grains', inStock: false });
        result.push({ name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry', inStock: false });
        result.push({ name: 'Butter', quantity: 50, unit: 'g', category: 'dairy', inStock: false });
    }
    // INF-65: Strawberry juice
    if (idLower.includes('strawberry-juice')) {
        result.push({ name: 'Strawberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        result.push({ name: 'Sugar', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-66: Noodle dishes (hakka, chow-mein, etc.) — add Noodles as a grain
    if (idLower.includes('noodles') || idLower.includes('noodle')) {
        if (!result.find(i => i.name.toLowerCase() === 'noodles')) {
            result.push({ name: 'Noodles', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        }
    }
    // INF-67: Bhaji/Vegetable dishes — add Mixed Vegetables
    if (idLower.includes('bhaji') || idLower.includes('bhajiya') || idLower.includes('bhajji') || idLower.includes('mixed-veg')) {
        if (!result.find(i => i.name.toLowerCase().includes('vegetable'))) {
            result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        }
    }
    // INF-68: Korma/Kurma — add Yogurt + Cashews + Coconut
    if (idLower.includes('korma') || idLower.includes('kurma')) {
        if (!result.find(i => i.name === 'Yogurt')) result.push({ name: 'Yogurt', quantity: 0.5, unit: 'cup', category: 'dairy', inStock: false });
        if (!result.find(i => i.name === 'Cashews')) result.push({ name: 'Cashews', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        if (!result.find(i => i.name === 'Coconut')) result.push({ name: 'Coconut', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
    }
    // INF-69: Mushroom dishes — add Mushrooms
    if (idLower.includes('mushroom')) {
        if (!result.find(i => i.name.toLowerCase() === 'mushrooms')) {
            result.push({ name: 'Mushrooms', quantity: 100, unit: 'g', category: 'produce', inStock: false });
        }
    }
    // INF-70: Sandwich/Toast — add Bread
    if (idLower.includes('sandwich') || idLower.includes('toast')) {
        if (!result.find(i => i.name === 'Bread')) {
            result.push({ name: 'Bread', quantity: 2, unit: 'pc', category: 'breads', inStock: false });
        }
    }
    // INF-71: Fried Rice — add Rice + Vegetables
    if (idLower.includes('fried-rice') || idLower.includes('pulao') || idLower.includes('pulav')) {
        if (!result.find(i => i.name === 'Rice')) result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        if (!result.find(i => i.name === 'Mixed Vegetables')) result.push({ name: 'Mixed Vegetables', quantity: 0.5, unit: 'cup', category: 'produce', inStock: false });
    }
    // INF-72: Kadhai dishes — add Capsicum + Onions + Tomatoes
    if (idLower.includes('kadhai') || idLower.includes('kadai')) {
        if (!result.find(i => i.name === 'Capsicum')) result.push({ name: 'Capsicum', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        if (!result.find(i => i.name === 'Onions')) result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
        if (!result.find(i => i.name === 'Tomatoes')) result.push({ name: 'Tomatoes', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    // INF-73: Pasta dishes — add Pasta
    if (idLower.includes('pasta') || idLower.includes('spaghetti') || idLower.includes('macaroni')) {
        if (!result.find(i => i.name.toLowerCase() === 'pasta')) {
            result.push({ name: 'Pasta', quantity: 200, unit: 'g', category: 'grains', inStock: false });
        }
    }
    // INF-74: Soup baseline — add stock/vegetables for soups missing real ingredients
    if (idLower.includes('soup')) {
        const hasMain = result.some(i => !['Salt', 'Pepper', 'Coriander Leaves', 'Coriander'].includes(i.name));
        if (!hasMain) {
            if (!result.find(i => i.name === 'Mixed Vegetables')) result.push({ name: 'Mixed Vegetables', quantity: 0.5, unit: 'cup', category: 'produce', inStock: false });
        }
    }
    // INF-75: Salad baseline — add greens + dressing for salads missing real ingredients
    if (idLower.includes('salad')) {
        const hasMain = result.some(i => !['Salt', 'Lemon Juice', 'Pepper'].includes(i.name));
        if (!hasMain) {
            if (!result.find(i => i.name === 'Mixed Greens')) result.push({ name: 'Mixed Greens', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
            if (!result.find(i => i.name === 'Lemon Juice')) result.push({ name: 'Lemon Juice', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false });
        }
    }

    // CATEGORY_INGREDIENTS fallback: match dish ID tokens against known ingredient sets
    // Catches Northeast/regional dishes that don't have specific INF patterns.
    // Runs when nothing NON-GENERIC resolved yet (generic defaults from earlier INF
    // rules like Mixed Vegetables must not mask a real canonical fill).
    const onlyGenericSoFar = !result.some(i => !['Salt', 'Ghee', 'Oil', 'Spices', 'Mixed Vegetables', 'Mixed Greens', 'Water', 'Pepper', 'Coriander', 'Coriander Leaves', 'Lemon Juice'].includes(i.name));
    if (onlyGenericSoFar) {
        const idTokens = idLower.split('-').filter(t => t.length > 3);
        const catKey = Object.keys(CATEGORY_INGREDIENTS).find(k => {
            if (idLower === k) return true;
            // Word-boundary substring match: k must appear as a standalone token
            const idx = idLower.indexOf(k);
            if (idx !== -1) {
                const beforeBound = idx === 0 || idLower[idx - 1] === '-' || idLower[idx - 1] === ' ';
                const afterBound = idx + k.length >= idLower.length || idLower[idx + k.length] === '-' || idLower[idx + k.length] === ' ';
                if (beforeBound && afterBound) return true;
            }
            // Require at least 2 shared tokens to prevent single generic token matches
            const kTokens = k.split('-').filter(t => t.length > 3);
            const sharedCount = kTokens.filter(kt => idTokens.includes(kt)).length;
            return sharedCount >= 2;
        });
        if (catKey) {
            const ings = CATEGORY_INGREDIENTS[catKey];
            if (ings) {
                for (const ing of ings) {
                    if (!result.find(i => i.name.toLowerCase() === ing.name.toLowerCase())) {
                        result.push(ing);
                    }
                }
            }
        }
    }

    // INF-04: Ghee/Butter (common in Indian cooking) — skip for drinks, sweets, salads, soups
    // Normalize to hyphenated form so patterns with hyphens also match space-separated names
    const _idClassify = idLower.replace(/ /g, '-');
    const _isDrink = /lassi|chai|sharbat|juice|milkshake|shake|buttermilk|sherbet|lemonade|nimbu|panna|thandai|smoothie|coconut-water|soda|sharbat|milk-tea|milk$|hot-chocolate/.test(_idClassify);
    const _isSweet = /kheer|halwa|jalebi|gulab.*jamun|barfi|laddu|ladoo|pudding|cake|cookie|brownie|muffin|dessert|ice-cream|icecream|payasam|payesh|custard|cupcake|donut|cheesecake|mysore-pak|haalbai|basundi|doodhpak|kulfi|falooda|rabdi|shrikhand|sandesh|mishti|kesari|imarti|sheer|rasgulla|malpua|phirni|aamras|modak|shankarpali|chikki|rewri|til.*laddu|semolina.*halwa|gajar.*halwa|sooji.*halwa|pradhaman|pori-urundai|pazham|minil-songa|urundai|payesh/.test(_idClassify);
    const _isSalad = /salad/.test(_idClassify);
    const _isSoup = /soup|shorba|rasam|saar|charu|stew|broth/.test(_idClassify);
    if (!_isDrink && !_isSweet && !_isSalad && !_isSoup) {
        result.push({ name: 'Ghee', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Spices', quantity: 1, unit: 'packet', category: 'spices', inStock: false });
    }
    
    // Add defaults if no pattern matched (skip for drinks, sweets, salads, soups — let explicit ingredients or accompaniments define them)
    if (result.length === 0 && !_isDrink && !_isSweet && !_isSalad && !_isSoup) {
        result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        result.push({ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });
        result.push({ name: 'Spices', quantity: 1, unit: 'packet', category: 'spices', inStock: false });
    }
    
    return result;
}

const INGREDIENT_CACHE = new Map<string, Ingredient[]>();

export function isDishVeganCompatible(dish: Dish): boolean {
  return dish.type === 'vegan' || dish.type === 'veg';
}

export function isVariantVeganCompatible(variant: DishVariant): boolean {
  const addOn = (variant.addOn ?? '').toLowerCase();
  const dairyKeywords = ['curd', 'yogurt', 'dahi', 'butter', 'ghee', 'cream', 'paneer', 'cheese', 'milk', 'lassi', 'chaas', 'buttermilk', 'raita'];
  const eggKeywords = ['egg', 'omelette'];
  const hasNonVeganAddOn = dairyKeywords.some(k => addOn.includes(k)) || eggKeywords.some(k => addOn.includes(k));
  if (hasNonVeganAddOn) return false;
  return !(variant.accompaniments ?? []).some(a => {
    const l = a.toLowerCase();
    return dairyKeywords.some(k => l.includes(k)) || eggKeywords.some(k => l.includes(k));
  });
}

export function invalidateIngredientCache(): void {
    INGREDIENT_CACHE.clear();
}

// ─── LIGHT-DISH GATE ─────────────────────────────────────────────────────────
// Beverages / teas / coffees / desserts / soups must NEVER pick up the
// savoury-mains inference (oil/ghee/chutney/yogurt/potato/"spice"). For light
// dishes with no explicit recipe, keep only beverage-ish names.
const LIGHT_ALLOWED = /tea|coffee|cocoa|chocolate|sugar|honey|milk|cream|rose|saffron|water|lemon|mint|ginger|cardamom|cinnamon|clove|ice|coconut|pistachio|almond|raisin|cashew|dry fruit|berry|juice/;
const LIGHT_BANNED = /chutney|ghee|oil|yogurt|curd|potato|spice|besan|flour|rice|wheat|garam|chilli|turmeric|cumin|coriander|salt|tomato|onion|garlic|phulka|roti|naan|paratha|puri/;

/** Placeholder templates: the "Salt/Pepper/Coriander" filler many entries used
 *  instead of a real recipe. Treat them as "no recipe" so the inference +
 *  completeness chain fills the true ingredients (the repeating data gap). */
const PLACEHOLDER_NAMES = new Set(['salt', 'pepper', 'coriander leaves', 'coriander', 'water', 'rice', 'oil']);

// Base aromatics / oils that do NOT constitute a dish's MAIN ingredient. A list
// made only of these (no protein/veg/produce/grain) is a base-only stub missing
// the actual dish — treat it as a placeholder so inference can fill the main.
// Mirrors the audit tool's "a recipe can't be two generic items" spirit.
const BASE_NO_MAIN_NAMES = new Set([
  'salt', 'pepper', 'coriander', 'coriander leaves', 'water', 'sugar', 'oil', 'ghee', 'butter',
  'mustard seeds', 'turmeric', 'green chilli', 'green chili', 'red chilli', 'red chili',
  'red chili powder', 'red chilli powder', 'garam masala', 'cumin', 'cumin seeds',
  'onion', 'onions', 'tomato', 'tomatoes', 'ginger-garlic paste', 'ginger', 'garlic',
  'curry leaves', 'spice', 'spices', 'whole spices', 'black pepper',
]);

// Wrong-recipe class: seasonings / fats / liquids / beverage-fillers / baking
// bases that NEVER constitute a dish's main. A "recipe" made ONLY of these
// (e.g. bubble-tea ingredients pasted onto Tofu Pasta, or a cookie list pasted
// where no protein/grain/produce main appears) is filler — route it to
// inference so the dish's actual main is restored. Legit lists that carry a
// real main (Chicken, Paneer, Rice, Spinach…) fail this `every()` and pass.
const NO_MAIN_NAMES = new Set([
  ...BASE_NO_MAIN_NAMES,
  'bay leaf', 'cloves', 'cardamom', 'cinnamon', 'star anise', 'fennel', 'saunf', 'hing', 'asafoetida',
  'olive oil', 'coconut oil', 'green chili', 'chili', 'chilli powder', 'chili powder',
  'biryani masala', 'chana masala', 'kitchen king', 'chicken masala', 'paneer masala',
  'lemon juice', 'lime juice', 'vinegar', 'soy sauce', 'chilli sauce', 'schezwan sauce',
  'tomato ketchup', 'mustard', 'mayonnaise', 'cream', 'yogurt', 'curd', 'sour cream',
  'milk', 'tea', 'masala chai', 'coffee', 'coffee powder', 'hot water', 'ice', 'cocoa',
  'chocolate', 'vanilla', 'vanilla extract', 'baking powder', 'baking soda', 'yeast',
  'jaggery', 'honey', 'maple syrup', 'wintermelon syrup', 'syrup', 'tapioca pearls', 'rose water',
  'breadcrumbs', 'flour', 'maida', 'semolina', 'besan', 'gram flour', 'corn flour',
  'bread', 'pav', 'toast', 'bun', 'biscuits', 'rusk',
]);

/** main names whose presence proves a list is a real (non-filler) recipe. */
function hasMainCategoryItem(items: Array<{ name: string }>): boolean {
  return items.some(i => !NO_MAIN_NAMES.has((i.name || '').trim().toLowerCase()));
}

export function isPlaceholderIngredients(items: Array<{ name: string }>): boolean {
    if (!items || items.length === 0) return false;
    // A "recipe" can't be 1-2 items (kallu→"Coconut Sap", pasta→"Rice,Salt");
    // and any fully-generic list — the 3-item soup template included — is
    // filler, not a recipe.
    if (items.length <= 2) return true;
    if (items.every(i => PLACEHOLDER_NAMES.has((i.name || '').trim().toLowerCase()))) return true;
    // Base-only stub: every line is an aromatic/oil with NO main ingredient.
    if (items.length >= 3 && items.every(i => BASE_NO_MAIN_NAMES.has((i.name || '').trim().toLowerCase()))) {
        return true;
    }
    // Wrong-recipe class: THREE OR MORE lines but not ONE main-capable item
    // (bubble-tea list on Tofu Pasta, sugar/milk/cardamom "recipe" on Moong
    // Dal Halwa). Route to inference so the main is restored by name-mapping.
    if (items.length >= 3 && !hasMainCategoryItem(items)) {
        return true;
    }
    return false;
}

// ─── Main-ingredient guarantee (from the dish NAME) ─────────────────────────
// Every dish must resolve WITH its namesake main (Tofu Pasta → Tofu + Pasta,
// Aloo Matar → Potatoes + Green Peas, Chicken Manchurian → Chicken). The
// inference engine already maps name tokens → mains; this pass appends any
// inferred main (proteins / produce / grains) missing from the resolved list,
// so a base-only or wrong-recipe explicit recipe can never ship a mainless
// dish. Two guards keep it honest:
//  • mainsMatchDish — a main is only appended if the dish's OWN name/slug
//    implies it (prevents "seven-colour-TEA" → Potatoes via the 'sev' rule);
//  • applied AFTER the light filter so a sweet/dal main added back can't be
//    stripped again (Moong Dal survives on Moong Dal Halwa).
const MAIN_CATEGORIES = new Set<IngredientCategory>(['proteins', 'produce', 'grains']);

/** Spell/alias variants so a slug token maps to the inferred main name. */
const MAIN_ALIASES: Record<string, string[]> = {
  'cauliflower': ['gobhi', 'gobi'],
  'potatoes': ['aloo'],
  'green peas': ['matar'],
  'okra': ['bhindi'],
  'spinach': ['palak'],
  'chickpeas': ['chana', 'chole', 'kadala'],
  'masoor dal': ['red lentil'],
  'moong dal': ['moong'],
  'mushrooms': ['mushroom'],
  'fish': ['machher', 'meen', 'ilish', 'rohu', 'bangda', 'kadal'],
  'mutton': ['gosht'],
  'carrot': ['gajar'],
  'eggs': ['anda'],
};

function singularize(word: string): string {
  return word
    .replace(/ies$/, 'y')
    .replace(/oes$/, 'o')
    .replace(/es$/, 'e')
    .replace(/s$/, '');
}

function mainImpliedByDish(main: Ingredient, slug: string, name: string): boolean {
  const hay = `${slug.replace(/-/g, ' ')} ${name.toLowerCase()}`;
  const tokens = main.name.toLowerCase().split(/[\s,/+]+/).filter(Boolean);
  const candidates = new Set<string>();
  for (const t of tokens) {
    if (t.length < 3) continue;
    candidates.add(t);
    // "Potatoes" → "potato", "Peas" → "pea", "Chickpeas" → "chickpea" so a
    // slug saying "potato"/"pea" implies the plural main.
    const sing = singularize(t);
    if (sing !== t && sing.length >= 3) candidates.add(sing);
  }
  for (const c of candidates) {
    if (hay.includes(c)) return true;
  }
  return (MAIN_ALIASES[main.name.toLowerCase()] ?? []).some(a => hay.includes(a));
}

/** Strip negation/qualifier words from a variant name so "without Eggs" never
 *  implies Chicken-egg rules (Banana Bread without Eggs ≠ an egg dish). */
function sanitizeVariantForMain(variantName: string): string {
  return variantName
    .replace(/\b(?:eggless|with eggs?|without eggs?|without butter|without brown sugar|no brown sugar|no sugar|vegan|vegetarian)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Append any main ingredients the dish's own NAME implies that the resolved
 *  recipe is missing. Name-overlap is enough to count as present (Chicken
 *  Wings satisfies "Chicken"). Explicit-path AND post-light-filter safe. */
export function ensureNameMains(
  resolved: Ingredient[],
  dishId: string,
  variantName: string,
  dishType?: Dish['type'],
): Ingredient[] {
  const cleanName = sanitizeVariantForMain(variantName);
  const inferred = inferIngredientsFromDishId(dishId, cleanName || undefined, dishType);
  const out = [...resolved];
  const present = new Set(out.map(i => i.name.toLowerCase()));
  for (const m of inferred) {
    if (!MAIN_CATEGORIES.has(m.category)) continue;
    if (!mainImpliedByDish(m, dishId, cleanName)) continue;
    const key = m.name.toLowerCase();
    const isPresent = [...present].some(p => p.includes(key) || key.includes(p));
    if (isPresent) continue;
    out.push(m);
    present.add(key);
  }
  return out;
}

export function isLightCategory(dish: { name?: string; tags?: string[] }): boolean {
    const name = (dish.name || '').toLowerCase();
    const tags = (dish.tags || [] as string[]).map(t => t.toLowerCase()).join(' ');
    return /tea|chai|coffee|juice|shake|smoothie|lassi|chaas|sharbat|soup|salad|shorba|rasam|charu|saar|broth|stew|thukpa|thenthuk|noodle|phagshapa|toddy|kallu|kaal|wine/.test(name)
        || tags.includes('beverage')
        || tags.includes('soup')
        || /dessert|sweet|cake|kheer|payasam|halwa|barfi|jalebi|kulfi|pudding/.test(name);
}

function lightFilter(items: Ingredient[]): Ingredient[] {
    return items.filter(i => LIGHT_ALLOWED.test(i.name.toLowerCase()) && !LIGHT_BANNED.test(i.name.toLowerCase()));
}

/** Soup/stew/broth pantry fill — protein + the produce the soup is named after
 *  (never a nameless broth: Palak Soup → Spinach, Carrot Soup → Carrot). */
function soupPantryFill(name: string): Ingredient[] {
    const protein: Ingredient[] = /chicken|kozhi/.test(name)
        ? [{ name: 'Chicken', quantity: 150, unit: 'g', category: 'proteins', inStock: false }]
        : /mutton|yakhni|paya|lamb/.test(name)
            ? [{ name: 'Mutton', quantity: 150, unit: 'g', category: 'proteins', inStock: false }]
            : /pork|phagshapa/.test(name)
                ? [{ name: 'Pork', quantity: 150, unit: 'g', category: 'proteins', inStock: false }]
                : [];
    const namedProduce: Ingredient[] = /palak|spinach/.test(name)
        ? [{ name: 'Spinach', quantity: 100, unit: 'g', category: 'produce', inStock: false }]
        : /carrot|gajar/.test(name)
            ? [{ name: 'Carrot', quantity: 1, unit: 'pc', category: 'produce', inStock: false }]
            : /pumpkin|kaddu/.test(name)
                ? [{ name: 'Pumpkin', quantity: 100, unit: 'g', category: 'produce', inStock: false }]
                : /sweet.?potato|shakarkand/.test(name)
                    ? [{ name: 'Sweet Potato', quantity: 1, unit: 'pc', category: 'produce', inStock: false }]
                    : /broccoli/.test(name)
                        ? [{ name: 'Broccoli', quantity: 100, unit: 'g', category: 'produce', inStock: false }]
                        : [];
    return [
        ...protein,
        ...namedProduce,
        { name: 'Onion', quantity: 1, unit: 'pc', category: 'produce', inStock: false },
        { name: 'Tomato', quantity: 2, unit: 'pc', category: 'produce', inStock: false },
        { name: 'Water', quantity: 2, unit: 'cup', category: 'pantry', inStock: false },
        { name: 'Black Pepper', quantity: 0.5, unit: 'tsp', category: 'spices', inStock: false },
        { name: 'Coriander Leaves', quantity: 0.25, unit: 'cup', category: 'produce', inStock: false },
    ] as Ingredient[];
}

/** Light dish with nothing after filtering → a minimal role-based fill is
 *  better than empty (charg/lassi/soup are never groceries-empty). */
function lightFilterWithFallback(items: Ingredient[], dish: { name?: string }): Ingredient[] {
    const filtered = lightFilter(items);
    // Only generic-ish tokens (water/sugar/lemon) don't make a pantry fill —
    // fall through to the role-based list so chang/lassi/soup are never hollow.
    const substantive = filtered.some(i => !['water', 'sugar', 'lemon', 'tea leaves', 'coconut', 'milk', 'ice'].includes(i.name.toLowerCase()));
    const name = (dish.name || '').toLowerCase();
    // A SOUP/STEW/BROTH always gets the soup pantry fill — the generic light
    // filter can otherwise return "Sugar/Cardamom/Raisin" (sweet filler from a
    // name like "sweet potato") on a soup that needs produce instead.
    if (/soup|shorba|rasam|charu|saar|broth|stew|thenthuk|thukpa/.test(name)) {
        return soupPantryFill(name);
    }
    // A rice-based sweet (kheer/payasam/haalbai/pudding) carries its rice main.
    if (/kheer|payasam|payesh|phirni|haalbai|pudding/.test(name) && (/\brice\b|vermicelli|seviya|semoovina/.test(name) || items.some(i => /rice|vermicelli/i.test(i.name)))) {
        const dai: Ingredient[] = [
            { name: /vermicelli|seviya|semoovina/.test(name) ? 'Vermicelli' : 'Basmati Rice', quantity: 0.5, unit: 'cup', category: 'grains', inStock: false },
            { name: 'Milk', quantity: 2, unit: 'cup', category: 'dairy', inStock: false },
            { name: 'Sugar', quantity: 3, unit: 'tbsp', category: 'pantry', inStock: false },
            { name: 'Cardamom', quantity: 2, unit: 'pods', category: 'spices', inStock: false },
            { name: 'Raisins', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false },
            { name: 'Almonds', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false },
        ];
        if (/coconut|haalbai/.test(name) || items.some(i => /coconut/i.test(i.name))) {
            dai.push({ name: 'Coconut', quantity: 3, unit: 'tbsp', category: 'produce', inStock: false });
        }
        return dai;
    }
    if (filtered.length >= 3 && substantive) return filtered;
    if (/lassi|chaas|buttermilk/.test(name)) {
        return [
            { name: 'Yogurt', quantity: 1, unit: 'cup', category: 'dairy', inStock: false },
            { name: 'Water', quantity: 0.5, unit: 'cup', category: 'pantry', inStock: false },
            { name: 'Sugar', quantity: 1, unit: 'tsp', category: 'pantry', inStock: false },
        ];
    }
    if (/smoothie|milkshake|shake/.test(name)) {
        const fruit: Ingredient[] = /mango/.test(name)
            ? [{ name: 'Mango', quantity: 1, unit: 'pc', category: 'produce', inStock: false }]
            : /banana/.test(name)
                ? [{ name: 'Banana', quantity: 1, unit: 'pc', category: 'produce', inStock: false }]
                : /strawberry/.test(name)
                    ? [{ name: 'Strawberries', quantity: 1, unit: 'cup', category: 'produce', inStock: false }]
                    : /avocado|peanut/.test(name)
                        ? [{ name: 'Avocado', quantity: 1, unit: 'pc', category: 'produce', inStock: false }]
                        : /green|spinach|arugula|kale/.test(name)
                            ? [{ name: 'Spinach', quantity: 1, unit: 'cup', category: 'produce', inStock: false }]
                            : /coffee/.test(name)
                                ? [{ name: 'Coffee Powder', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false }]
                                : [];
        return [
            ...fruit,
            { name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', inStock: false },
            { name: 'Ice', quantity: 1, unit: 'cup', category: 'pantry', inStock: false },
            { name: 'Honey', quantity: 1, unit: 'tsp', category: 'pantry', inStock: false },
        ] as Ingredient[];
    }
    if (/juice|sharbat|chang|punch|cola/.test(name)) {
        return /chang|beer/.test(name)
            ? [{ name: 'Millet', quantity: 1, unit: 'cup', category: 'grains', inStock: false }, { name: 'Water', quantity: 2, unit: 'cup', category: 'pantry', inStock: false }, { name: 'Jaggery', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false }]
            : /toddy|kallu|kaal/.test(name)
                ? [{ name: 'Coconut Sap', quantity: 2, unit: 'cups', category: 'pantry', inStock: false }, { name: 'Jaggery', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false }, { name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }]
                : /wine/.test(name)
                    ? [{ name: 'Grapes', quantity: 1, unit: 'kg', category: 'produce', inStock: false }, { name: 'Sugar', quantity: 2, unit: 'cup', category: 'pantry', inStock: false }, { name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false }]
                    : [
                        { name: /mango/.test(name) ? 'Mango' : /strawberry/.test(name) ? 'Strawberries' : /banana/.test(name) ? 'Banana' : /apple/.test(name) ? 'Apple' : /orange/.test(name) ? 'Orange' : /pineapple/.test(name) ? 'Pineapple' : 'Lemon', quantity: 1, unit: 'pc', category: 'produce', inStock: false },
                        { name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false },
                        { name: 'Sugar', quantity: 1, unit: 'tsp', category: 'pantry', inStock: false },
                    ];
    }
    if (/soup|shorba|rasam|charu|saar|broth|stew|thukpa|thenthuk|noodle/.test(name)) {
        return soupPantryFill(name);
    }
    if (/coffee|espresso|americano|macchiato|cortado/.test(name)) {
        return [
            { name: 'Coffee Powder', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false },
            { name: 'Hot Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false },
            { name: 'Milk', quantity: 1, unit: 'tbsp', category: 'dairy', inStock: false },
        ] as Ingredient[];
    }
    if (/gojju|pulusu|kuzhambu/.test(name)) {
        return [
            { name: 'Tamarind', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false },
            { name: 'Jaggery', quantity: 1, unit: 'tbsp', category: 'pantry', inStock: false },
            { name: 'Mustard Seeds', quantity: 1, unit: 'tsp', category: 'spices', inStock: false },
            { name: 'Red Chilli', quantity: 2, unit: 'pcs', category: 'spices', inStock: false },
        ] as Ingredient[];
    }
    return [
        { name: 'Lemon', quantity: 1, unit: 'pc', category: 'produce', inStock: false },
        { name: 'Water', quantity: 1, unit: 'cup', category: 'pantry', inStock: false },
        { name: 'Sugar', quantity: 1, unit: 'tsp', category: 'pantry', inStock: false },
        { name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'spices', inStock: false },
        { name: 'Coriander Leaves', quantity: 0.25, unit: 'cup', category: 'produce', inStock: false },
    ] as Ingredient[];
}

export function getIngredientsForMealOption(
    dishId: string,
    variantId: string,
    dishes: Dish[],
    categorySelections?: CategorySelection
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
            let r: Ingredient[] = [...(variant.ingredients || [])];

            // EXPLICIT recipe wins — trust it fully. But a PLACEHOLDER filler
            // (Salt/Pepper/Coriander) is not a recipe → fall through so the
            // inference + completeness chain fills the real ingredients.
            if (r.length > 0 && !isPlaceholderIngredients(r)) {
                if (categorySelections) r.push(...getIngredientsFromCategorySelections(categorySelections));
                // A real-but-incomplete recipe still MUST carry the dish's main
                // (e.g. the stir-fry base list on Chicken Manchurian's dry
                // variant). Infer the name-implied mains and append any missing.
                r = ensureNameMains(r, dishId, resolveDisplayName(dish.name, variant), dish.type);
                INGREDIENT_CACHE.set(cacheKey, r);
                return r;
            }

            const variantInclusiveName = variant && variantId
                ? resolveDisplayName(dish.name, variant)
                : dish.name;
            if (r.length === 0) {
                const fromInference = [
                    ...inferIngredientsFromDishId(dishId, variantInclusiveName, dish.type),
                    ...inferIngredientsFromDishId(variantInclusiveName),
                ];
                const seen = new Set<string>();
                for (const ing of fromInference) {
                    const key = `${ing.name.toLowerCase()}:${ing.category}`;
                    if (!seen.has(key)) { seen.add(key); r.push(ing); }
                }
            }
            const existingNames = new Set(r.map(i => i.name.toLowerCase()));
            for (const ing of inferIngredientsFromDishId(dishId, variantInclusiveName, dish.type)) {
                if (!existingNames.has(ing.name.toLowerCase())) r.push(ing);
            }
            for (const ing of inferIngredientsFromDishId(variantInclusiveName)) {
                if (!existingNames.has(ing.name.toLowerCase())) r.push(ing);
            }
            r.push(..._resolveAccompaniments(variant), ..._inferFromDishName(dish, new Set(r.map(i => i.name.toLowerCase()))));
            // Completeness pass: regional staples + dry fruits for sweets, so a
            // sparse variant still shares a full, correct shopping list.
            r.push(...inferRegionalCompleteness(dish, new Set(r.map(i => i.name.toLowerCase()))));
            if (variant.ingredients?.some(i => i.category === 'breads')) {
                const explicitBreadNames = new Set(variant.ingredients.filter(i => i.category === 'breads').map(i => i.name.toLowerCase()));
                for (let i = r.length - 1; i >= 0; i--) {
                    const ri = r[i]!;
                    if (ri.category === 'breads' && !explicitBreadNames.has(ri.name.toLowerCase())) {
                        r.splice(i, 1);
                    }
                }
            }
            if (categorySelections) r.push(...getIngredientsFromCategorySelections(categorySelections));
            // Guarantee the dish's namesake main is present even after the
            // inference + completeness chain (base-only/sabzi placeholders).
            // Applied AFTER the light filter so the main can't be re-stripped.
            const filtered = isLightCategory(dish) ? lightFilterWithFallback(r, dish) : r;
            const finalVariant = ensureNameMains(filtered, dishId, variantInclusiveName, dish.type);
            INGREDIENT_CACHE.set(cacheKey, finalVariant);
            return finalVariant;
        }
    }
    const result: Ingredient[] = inferIngredientsFromDishId(dishId);
    if (categorySelections) result.push(...getIngredientsFromCategorySelections(categorySelections));
    const finalResult = dish && isLightCategory(dish) ? lightFilterWithFallback(result, dish) : result;
    INGREDIENT_CACHE.set(cacheKey, finalResult);
    return finalResult;
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
    'noodles': 'Noodles', 'hakka-noodles': 'Noodles', 'chow-mein': 'Noodles',
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

const INDIAN_REGIONS = ['north', 'south', 'east', 'west', 'central', 'northeast'];

/**
 * COMPLETENESS pass — the "missing dry fruits / oil / salt / turmeric" gap.
 * Every Indian dish gets its missing customary staples added when absent:
 *   • savoury mains → Oil/Salt/Turmeric + regional fat & aromatics
 *   • rice dishes   → Ghee + whole spices (+ mint/saffron for biryani-ish)
 *   • dals          → ghee/cumin/turmeric + tadka hints
 *   • sweets        → DRY FRUITS (raisins/almonds/pistachios) + sugar/cardamom/ghee
 *   • south         → coconut/curry leaves/mustard seed/tamarind
 *   • east/ne       → mustard oil + kalonji/panch-phoron hint
 * Never duplicates (existingNames), never touches bakery/beverages/salads where
 * those items don't belong.
 */
function inferRegionalCompleteness(dish: Dish, existingNames: Set<string>): Ingredient[] {
    const out: Ingredient[] = [];
    const push = (i: Ingredient) => { if (!existingNames.has(i.name.toLowerCase())) out.push(i); };
    const nameLower = (dish.name || '').toLowerCase();
    const tagLower = (dish.tags || []).map(t => t.toLowerCase()).join(' ');
    const all = `${nameLower} ${tagLower}`;
    const region = (dish.region || '').toLowerCase();

    const isSweet = /dessert|sweet|halwa|kheer|payasam|payesh|barfi|ladoo|burfi|shrikhand|basundi|jalebi|gulab|jamun|kaju|ras ma?lai|rasgulla|mysore|son papdi|pitha|mithai/.test(all)
        && !/stir-fry|curry|gravy|korma|bhindi|sabzi/.test(all);
    const isBeverage = /beverage|chai|tea|coffee|juice|shake|smoothie|lassi|chaas|buttermilk|sharbat/.test(all);
    const isRiceDish = /biryani|pulao|khichdi|paella|fried rice|jeera rice|sambar rice|curd rice|rice/.test(nameLower)
        && !isSweet;
    const isDal = /dal|daal|lentil|chana|rajma|chole|ghugni|dal-makhani/.test(all);
    const isCurried = /curry|gravy|korma|tikka|kebab|bhuna|jhol|kalia|kosha|bharta|rogan|vindaloo|saag|masala|bhurji|manchurian|stew|tawa|roast|roasted|asparagus|saute|grilled/.test(all);
    const isSouth = region === 'south';
    const isEast = region === 'east' || region === 'northeast';
    const isNorth = region === 'north' || region === 'all' || region === 'central';
    const isWest = region === 'west';

    const savory = (isCurried || isDal || isRiceDish || /chicken|mutton|fish|prawn|paneer|egg/i.test(all)) && !isSweet && !isBeverage;
    if (savory) {
        push({ name: 'Oil', quantity: 2, unit: 'tbsp', category: 'pantry' });
        push({ name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry' });
        push({ name: 'Turmeric', quantity: 0.5, unit: 'tsp', category: 'spices' });
        if (isNorth || isWest) push({ name: 'Ghee', quantity: 1, unit: 'tbsp', category: 'pantry' });
        if (isSouth) {
            push({ name: 'Coconut', quantity: 0.5, unit: 'cup', category: 'produce' });
            push({ name: 'Curry Leaves', quantity: 1, unit: 'sprig', category: 'produce' });
            push({ name: 'Mustard Seeds', quantity: 1, unit: 'tsp', category: 'spices' });
            push({ name: 'Tamarind', quantity: 1, unit: 'tbsp', category: 'pantry' });
        }
        if (isEast) push({ name: 'Mustard Oil', quantity: 1, unit: 'tbsp', category: 'pantry' });
        if (isCurried) {
            push({ name: 'Cumin Seeds', quantity: 1, unit: 'tsp', category: 'spices' });
            push({ name: 'Red Chili Powder', quantity: 0.5, unit: 'tsp', category: 'spices' });
        }
    }

    if (isRiceDish && savory) {
        push({ name: 'Ghee', quantity: 1, unit: 'tbsp', category: 'pantry' });
        push({ name: 'Whole Spices', quantity: 1, unit: 'tsp', category: 'spices' });
        if (/biryani/.test(all)) {
            push({ name: 'Saffron', quantity: 0.25, unit: 'tsp', category: 'spices' });
            push({ name: 'Mint Leaves', quantity: 0.25, unit: 'cup', category: 'produce' });
        }
    }

    if (isDal) {
        push({ name: 'Ghee', quantity: 1, unit: 'tbsp', category: 'pantry' });
        push({ name: 'Cumin Seeds', quantity: 1, unit: 'tsp', category: 'spices' });
        if (isEast) push({ name: 'Panch Phoron', quantity: 0.5, unit: 'tsp', category: 'spices' });
    }

    if (isSweet) {
        push({ name: 'Sugar', quantity: 0.5, unit: 'cup', category: 'pantry' });
        push({ name: 'Cardamom', quantity: 2, unit: 'pods', category: 'spices' });
        // DRY FRUITS — the missing item for sweets across the board
        // (no Ghee auto-add: pantry contract keeps sweets Ghee-free inferred).
        push({ name: 'Raisins', quantity: 2, unit: 'tbsp', category: 'pantry' });
        push({ name: 'Almonds', quantity: 2, unit: 'tbsp', category: 'pantry' });
        push({ name: 'Pistachios', quantity: 1, unit: 'tbsp', category: 'pantry' });
        if (/kheer|payasam|payesh|ras/.test(all)) push({ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy' });
        if (/gajar|halwa|rabri|phirni/.test(all)) push({ name: 'Milk', quantity: 1.5, unit: 'cup', category: 'dairy' });
    }

    if (isBeverage && /chai|tea/.test(all)) {
        push({ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy' });
        push({ name: 'Sugar', quantity: 1, unit: 'tsp', category: 'pantry' });
        push({ name: 'Tea Leaves', quantity: 1, unit: 'tsp', category: 'pantry' });
    }

    if (/pancake|oatmeal|oats|muffin|cookie|banana bread|bake|granola|waffle/.test(all)) {
        push({ name: 'Flour', quantity: 1.5, unit: 'cups', category: 'grains' });
        push({ name: 'Sugar', quantity: 0.5, unit: 'cup', category: 'pantry' });
        push({ name: 'Baking Powder', quantity: 1, unit: 'tsp', category: 'pantry' });
        push({ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy' });
    }

    return out;
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

    if ((nameLower.includes('chole') || nameLower.includes('chickpea') || nameLower.includes('chana') || nameLower.includes('kadala')) && !existingNames.has('chickpeas'))
        result.push({ name: 'Chickpeas', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if (nameLower.includes('rajma') && !existingNames.has('rajma'))
        result.push({ name: 'Rajma', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if (nameLower.includes('dal') && !existingNames.has('toor dal'))
        result.push({ name: 'Toor Dal', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if ((nameLower.includes('egg') && !nameLower.includes('veggie') && !nameLower.includes('eggless') && !nameLower.includes('eggplant') && !nameLower.includes('baingan') && !nameLower.includes('brinjal')) && !existingNames.has('eggs'))
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
    if (nameLower.includes('gobhi') || nameLower.includes('cauliflower') && !existingNames.has('cauliflower'))
        result.push({ name: 'Cauliflower', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    // INF-MATAR: green peas main-ingredient (mirrors inferIngredientsFromDishId) — token-delimited
    if (!(/(?:^|[\s-])black[\s-]?eyed[\s-]peas?(?:\b|[\s-]|$)/.test(nameLower)
          || /(?:^|[\s-])lobiya(?:\b|[\s-]|$)/.test(nameLower)
          || /(?:^|[\s-])tamatar(?:\b|[\s-]|$)/.test(nameLower))
        && (/(?:^|[\s-])matar(?:\b|[\s-]|$)/.test(nameLower)
            || /(?:^|[\s-])green[\s-]+peas?(?:\b|[\s-]|$)/.test(nameLower)
            || /(?:^|[\s-])peas?(?:\b|[\s-]|$)/.test(nameLower))
        && !existingNames.has('green peas')) {
        result.push({ name: 'Green Peas', quantity: 100, unit: 'g', category: 'produce', inStock: false });
    }

    if ((nameLower.includes('dahi') || nameLower.includes('bhalla') || nameLower.includes('chaat')) && !existingNames.has('yogurt'))
        result.push({ name: 'Yogurt', quantity: 100, unit: 'g', category: 'dairy', inStock: false });

    if (nameLower.includes('curry') || nameLower.includes('gravy') || nameLower.includes('korma'))
        if (!result.some(i => i.category === 'grains') && !result.some(i => i.category === 'breads') && !existingNames.has('rice'))
            result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });

    // ─── Base INDIAN aromatics — the missing tomato/onion/ginger/garlic gap ──
    // Indian mains (curries/gravies/dal/tikka/kebab...) share a base of onion,
    // tomato, green chilli, ginger-garlic & coriander. Dishes with sparse or
    // empty variant ingredient lists shared only "Chicken 200g + Ghee/Oil +
    // Spice" — add the aromatics so EVERY curried dish shares a complete list.
    // Skipped for bakery/sweets/beverages/breads/soups where they don't belong.
    const INDIAN_REGIONS = ['north', 'south', 'east', 'west', 'central', 'northeast'];
    const indianish = (dish.region || 'all') === 'all' || INDIAN_REGIONS.includes(dish.region || '');
    const tagLower = (dish.tags || []).map(t => t.toLowerCase()).join(' ');
    const isBakerySweet = /beverage|dessert|sweet|cake|halwa|kheer|payasam|biscuit|cookie|shake|smoothie|toast|sandwich|bread|packagora|chilla|idli|dosa|poha|upma|paratha|naan/.test(nameLower + ' ' + tagLower);
    const isCurried = /curry|gravy|korma|tikka|kebab|bhuna|jhol|kalia|kosha|bharta|rogan|vindaloo|saag|masala|dal|keema|kofta|malai|pasanda|achari|do-pyaza|manchurian|bhurji|fry|tawa|khol|stew/.test(nameLower + ' ' + tagLower);
    if (indianish && isCurried && !isBakerySweet) {
        const aromatics: Ingredient[] = [
            { name: 'Onion', quantity: 1, unit: 'pc', category: 'produce', inStock: false },
            { name: 'Tomato', quantity: 2, unit: 'pc', category: 'produce', inStock: false },
            { name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'produce', inStock: false },
            { name: 'Ginger-Garlic Paste', quantity: 1, unit: 'tbsp', category: 'produce', inStock: false },
            { name: 'Coriander Leaves', quantity: 0.25, unit: 'cup', category: 'produce', inStock: false },
        ] as Ingredient[];
        for (const ing of aromatics) {
            if (!existingNames.has(ing.name.toLowerCase())) result.push(ing);
        }
    }

    if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('onions'))
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('green chilli'))
        result.push({ name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'produce', inStock: false });

    if (nameLower.includes('avocado') && !existingNames.has('avocado'))
        result.push({ name: 'Avocado', quantity: 1, unit: 'pc', category: 'produce', inStock: false });

    if (nameLower.includes('peanut') && !existingNames.has('peanut butter'))
        result.push({ name: 'Peanut Butter', quantity: 2, unit: 'tbsp', category: 'pantry', inStock: false });

    if (nameLower.includes('smoothie') && !existingNames.has('milk'))
        result.push({ name: 'Milk', quantity: 1, unit: 'cup', category: 'dairy', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('banana'))
        result.push({ name: 'Banana', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('ice'))
        result.push({ name: 'Ice', quantity: 1, unit: 'cup', category: 'pantry', inStock: false });

    if (nameLower.includes('smoothie') && !existingNames.has('raspberry') && nameLower.includes('raspberry'))
        result.push({ name: 'Raspberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('blueberry') && nameLower.includes('blueberry'))
        result.push({ name: 'Blueberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('strawberry') && nameLower.includes('strawberry'))
        result.push({ name: 'Strawberry', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('mango') && nameLower.includes('mango'))
        result.push({ name: 'Mango', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('pineapple') && nameLower.includes('pineapple'))
        result.push({ name: 'Pineapple', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
    if (nameLower.includes('smoothie') && !existingNames.has('dragon fruit') && (nameLower.includes('dragon')))
        result.push({ name: 'Dragon Fruit', quantity: 1, unit: 'pc', category: 'produce', inStock: false });

    if (nameLower.includes('puttu') && !existingNames.has('rice flour'))
        result.push({ name: 'Rice Flour', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
    if (nameLower.includes('puttu') && !existingNames.has('coconut'))
        result.push({ name: 'Coconut', quantity: 0.5, unit: 'cup', category: 'produce', inStock: false });

    if (nameLower.includes('burger') && !existingNames.has('burger bun'))
        result.push({ name: 'Burger Bun', quantity: 2, unit: 'pcs', category: 'breads', inStock: false });

    if (nameLower.includes('kesari') && !existingNames.has('semolina'))
        result.push({ name: 'Semolina (Rava)', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    if (nameLower.includes('kesari') && !existingNames.has('sugar'))
        result.push({ name: 'Sugar', quantity: 80, unit: 'g', category: 'pantry', inStock: false });
    if (nameLower.includes('kesari') && !existingNames.has('ghee'))
        result.push({ name: 'Ghee', quantity: 30, unit: 'g', category: 'dairy', inStock: false });

    if (nameLower.includes('pesarattu') && !existingNames.has('moong dal'))
        result.push({ name: 'Moong Dal', quantity: 100, unit: 'g', category: 'proteins', inStock: false });
    if (nameLower.includes('pesarattu') && !existingNames.has('rice'))
        result.push({ name: 'Rice', quantity: 30, unit: 'g', category: 'grains', inStock: false });
    if (nameLower.includes('pesarattu') && !existingNames.has('ginger'))
        result.push({ name: 'Ginger', quantity: 10, unit: 'g', category: 'produce', inStock: false });

    if (nameLower.includes('ragi') && !existingNames.has('ragi flour'))
        result.push({ name: 'Ragi Flour', quantity: 200, unit: 'g', category: 'grains', inStock: false });

    if (nameLower.includes('erissery') && !existingNames.has('pumpkin'))
        result.push({ name: 'Pumpkin', quantity: 200, unit: 'g', category: 'produce', inStock: false });
    if (nameLower.includes('erissery') && !existingNames.has('coconut'))
        result.push({ name: 'Coconut', quantity: 50, unit: 'g', category: 'produce', inStock: false });

    if (nameLower.includes('misal') && !existingNames.has('mixed sprouts'))
        result.push({ name: 'Mixed Sprouts', quantity: 200, unit: 'g', category: 'proteins', inStock: false });

    if ((nameLower.includes('mysore') || nameLower.includes('mysore pak')) && !existingNames.has('gram flour'))
        result.push({ name: 'Gram Flour', quantity: 100, unit: 'g', category: 'grains', inStock: false });
    if ((nameLower.includes('mysore') || nameLower.includes('mysore pak')) && !existingNames.has('sugar'))
        result.push({ name: 'Sugar', quantity: 100, unit: 'g', category: 'pantry', inStock: false });
    if ((nameLower.includes('mysore') || nameLower.includes('mysore pak')) && !existingNames.has('ghee'))
        result.push({ name: 'Ghee', quantity: 50, unit: 'g', category: 'dairy', inStock: false });

    if (nameLower.includes('kheema') && !existingNames.has('minced meat'))
        result.push({ name: 'Minced Meat', quantity: 250, unit: 'g', category: 'proteins', inStock: false });
    if (nameLower.includes('kheema') && !existingNames.has('peas'))
        result.push({ name: 'Peas', quantity: 50, unit: 'g', category: 'produce', inStock: false });

    if (nameLower.includes('murgh') && !existingNames.has('chicken'))
        result.push({ name: 'Chicken', quantity: 250, unit: 'g', category: 'proteins', inStock: false });

    if (nameLower.includes('chepa') && !existingNames.has('fish'))
        result.push({ name: 'Fish', quantity: 200, unit: 'g', category: 'proteins', inStock: false });
    if (nameLower.includes('chepa') && !existingNames.has('tamarind'))
        result.push({ name: 'Tamarind', quantity: 20, unit: 'g', category: 'pantry', inStock: false });

    if (nameLower.includes('dondakaya') && !existingNames.has('ivy gourd'))
        result.push({ name: 'Ivy Gourd', quantity: 200, unit: 'g', category: 'produce', inStock: false });

    if (nameLower.includes('chikoo') && !existingNames.has('sapodilla'))
        result.push({ name: 'Sapodilla (Chikoo)', quantity: 2, unit: 'pc', category: 'produce', inStock: false });
    if (nameLower.includes('chikoo') && !existingNames.has('milk'))
        result.push({ name: 'Milk', quantity: 200, unit: 'ml', category: 'dairy', inStock: false });

    return result;
}

export async function resolveMealIngredientsAsync(dishId: string, variantId?: string): Promise<Ingredient[]> {
    try {
        const data = await api.get<{ byCategory?: Record<string, Ingredient[]> }>(`/ingredients/resolve/${dishId}${variantId ? '?variantId=' + variantId : ''}`);
        // Convert byCategory to flat array
        const byCat = data?.byCategory || {};
        const all: Ingredient[] = Object.values(byCat).flat();
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

    // H3: Use SLOT_TIME_DEFAULTS end hours instead of hardcoded values
    const now = new Date();
    const slotEndHourMap: Record<string, number> = { breakfast: 10, lunch: 15, snacks: 18, dinner: 23 };
    const slotEndHour = (slotEndHourMap[slot.toLowerCase()] || 15) + 1; // 1 hour grace

    // Build local midnight for the given date — avoids UTC-vs-local ambiguity
    const localMidnight = new Date(date + 'T00:00:00');
    localMidnight.setHours(0, 0, 0, 0);
    const slotDate = new Date(localMidnight);
    slotDate.setHours(slotEndHour);

    // Compare using local date strings — consistent timezone across all operations
    const today = getISODate(now); // YYYY-MM-DD in UTC
    if (date < today) return result; // Past day - skip
    if (date === today && now >= slotDate) return result; // Slot time passed today

    const ingredients = getIngredientsForMealOption(meal.dishId, meal.variantId || '', dishes, meal.categorySelections);
    const source = meal.name;
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
        const isoDate = getISODate(d);
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

        // NEW: buy-friendly grams for produce/herbs/bread-units (pc/pcs/cup/bunch)
        // so "0.5 cup coriander" / "2.5 pc potato" become readable gram weights.
        const converted = toBuyGrams({
            name: item.name,
            quantity: item.totalQuantity,
            unit: item.unit,
            category: item.category,
        });
        if (converted.unit !== item.unit) {
            item.unit = converted.unit;
            item.totalQuantity = converted.quantity;
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
            let qty = ing.quantity;
            let unit = ing.unit;
            // Normalize to grams for consistent aggregation
            if (unit === 'cup') { qty = Math.round(qty * 120); unit = 'g'; }
            else if (unit === 'pcs') { qty = Math.round(qty * 100); unit = 'g'; }
            return { ing: { ...ing, name: 'Wheat Flour (Atta)', quantity: qty, unit }, source };
        }
        return { ing, source };
    });
}

export function getTomorrowISO(): string {
    return addDaysISO(getISODate(), 1);
}

export function getWeekEndISO(): string {
    return addDaysISO(getISODate(), 6);
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
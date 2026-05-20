import type { Dish, Ingredient, IngredientCategory, DishVariant } from '../constants/dishLibrary';
import { getMealResolution, type MealResolution, type CategorySelection } from '../store/useStore';
import { cachedIngredients } from './cache';
import { resolveDisplayName } from './resolveDisplayName';
import { getISODate, addDaysISO } from './dateUTC';

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
};

export function getIngredientsForCategoryOption(catId: string): Ingredient[] {
  const direct = CATEGORY_INGREDIENTS[catId];
  if (direct) return direct;
  const normalized = catId.toLowerCase().replace(/[\s-]+/g, '-');
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
  return fuzzyKey ? CATEGORY_INGREDIENTS[fuzzyKey] : [];
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
function inferIngredientsFromDishId(dishId: string, dishName?: string): Ingredient[] {
    const idLower = dishId.toLowerCase();
    const result: Ingredient[] = [];

    // Variant-aware protein inference: only run when dishName adds new info beyond dishId
    if (dishName && dishName.toLowerCase() !== idLower) {
        const n = dishName.toLowerCase();
        const hasKeyword = (kw: string) => {
            const re = new RegExp(`\\b${kw}\\b`, 'i');
            return re.test(dishName) || n.includes(kw.toLowerCase());
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
        if ((hasKeyword('Veg') || hasKeyword('Vegetable') || hasKeyword('Mixed')) && !n.includes('non-veg') && !n.includes('meat')) {
            result.push({ name: 'Mixed Vegetables', quantity: 1, unit: 'cup', category: 'produce', inStock: false });
        }
        if (hasKeyword('Egg') && !hasKeyword('Eggplant') && !n.includes('baingan') && !n.includes('brinjal')) {
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
    if (idLower.includes('egg') && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal')) {
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
    if ((idLower.includes('french') || idLower.includes('egg') || idLower.includes('bread dish') || idLower.includes('bread toast')) && !idLower.includes('eggplant') && !idLower.includes('baingan') && !idLower.includes('brinjal')) {
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
    // INF-12: Jeera/Cumin dishes
    if (idLower.includes('jeera') || idLower.includes('cumin')) {
        result.push({ name: 'Cumin Seeds', quantity: 1, unit: 'tsp', category: 'spices', inStock: false });
    }
    // INF-13: South Indian batter breakfast (idli, dosa, uttapam)
    if (idLower.includes('idli') || idLower.includes('dosa') || idLower.includes('uttapam')) {
        result.push({ name: 'Rice', quantity: 1, unit: 'cup', category: 'grains', inStock: false });
        result.push({ name: 'Urad Dal', quantity: 50, unit: 'g', category: 'proteins', inStock: false });
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
        result.push({ name: 'Bread', quantity: 2, unit: 'slices', category: 'breads', inStock: false });
        result.push({ name: 'Lemon', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    }
    if (idLower.includes('avocado') && (idLower.includes('toast') || idLower.includes('sandwich'))) {
        if (!result.find(i => i.name === 'Bread')) {
            result.push({ name: 'Bread', quantity: 2, unit: 'slices', category: 'breads', inStock: false });
        }
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
            const r: Ingredient[] = [...(variant.ingredients || [])];
            const variantInclusiveName = variant && variantId
                ? resolveDisplayName(dish.name, variant)
                : dish.name;
            if (r.length === 0) {
                const fromInference = [
                    ...inferIngredientsFromDishId(dishId, variantInclusiveName),
                    ...inferIngredientsFromDishId(variantInclusiveName),
                ];
                const seen = new Set<string>();
                for (const ing of fromInference) {
                    const key = `${ing.name.toLowerCase()}:${ing.category}`;
                    if (!seen.has(key)) { seen.add(key); r.push(ing); }
                }
            }
            const existingNames = new Set(r.map(i => i.name.toLowerCase()));
            for (const ing of inferIngredientsFromDishId(dishId, variantInclusiveName)) {
                if (!existingNames.has(ing.name.toLowerCase())) r.push(ing);
            }
            for (const ing of inferIngredientsFromDishId(variantInclusiveName)) {
                if (!existingNames.has(ing.name.toLowerCase())) r.push(ing);
            }
            r.push(..._resolveAccompaniments(variant), ..._inferFromDishName(dish, new Set(r.map(i => i.name.toLowerCase()))));
            if (categorySelections) r.push(...getIngredientsFromCategorySelections(categorySelections));
            INGREDIENT_CACHE.set(cacheKey, r);
            return r;
        }
    }
    const result: Ingredient[] = inferIngredientsFromDishId(dishId);
    if (categorySelections) result.push(...getIngredientsFromCategorySelections(categorySelections));
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
    if ((nameLower.includes('egg') && !nameLower.includes('eggplant') && !nameLower.includes('baingan') && !nameLower.includes('brinjal')) && !existingNames.has('eggs'))
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

    if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('onions'))
        result.push({ name: 'Onions', quantity: 1, unit: 'pc', category: 'produce', inStock: false });
    if ((nameLower.includes('chilla') || nameLower.includes('cheela')) && !existingNames.has('green chilli'))
        result.push({ name: 'Green Chilli', quantity: 2, unit: 'pc', category: 'produce', inStock: false });

    if (nameLower.includes('avocado') && !existingNames.has('avocado'))
        result.push({ name: 'Avocado', quantity: 1, unit: 'pc', category: 'produce', inStock: false });

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
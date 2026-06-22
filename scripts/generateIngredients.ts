import { DISH_LIBRARY } from '../constants/dishLibrary';
import type { Dish, Ingredient, IngredientCategory } from '../constants/dishLibrary';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ing = (name: string, qty: string, cat: IngredientCategory): Ingredient =>
  ({ name, quantity: parseFloat(qty) || 1, unit: qty.includes(' ') ? qty.split(' ').slice(1).join(' ') : 'unit', category: cat, inStock: false });

const Q = (n: string, q: string) => ing(n, q, 'produce');
const QG = (n: string, q: string) => ing(n, q, 'grains');
const QP = (n: string, q: string) => ing(n, q, 'proteins');
const QS = (n: string, q: string) => ing(n, q, 'spices');
const QD = (n: string, q: string) => ing(n, q, 'dairy');
const QPA = (n: string, q: string) => ing(n, q, 'pantry');
const QB = (n: string, q: string) => ing(n, q, 'breads');

// ─── Keyword → ingredient mapping ───────────────────────────────────────────

type Rule = { match: string; ing: () => Ingredient };

const BASE_VEG: Ingredient[] = [
  Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger', '1 inch'), Q('Garlic', '4 cloves'),
  QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'),
  QS('Coriander Powder', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'),
];

const BASE_NON_VEG: Ingredient[] = [
  Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
  QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '1 tsp'), QS('Garam Masala', '1 tsp'),
  QS('Cumin Seeds', '1 tsp'), QS('Coriander Powder', '1 tsp'), QS('Salt', '1 tsp'),
  QPA('Oil', '2 tbsp'),
];

const SPICE_PALETTE: Ingredient[] = [
  QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'),
];

const PICKLE_SIDE: Ingredient[] = [Q('Onion', '1 pc'), QS('Lemon Wedge', '1 pc')];

// ─── Dish-ID → ingredients (for dishes that need custom handling) ────────────

const DISH_SPECIFIC: Record<string, (d: Dish) => Ingredient[]> = {
  'idli': () => [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup'), QS('Salt', '0.5 tsp'), QPA('Oil', '1 tsp'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs')],
  'dosa': () => [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup'), QS('Salt', '0.5 tsp'), QPA('Oil', '1 tbsp')],
  'sambhar-rice': () => [QG('Rice', '1 cup'), QP('Toor Dal', '0.5 cup'), Q('Drumstick', '1 pc'), Q('Tomato', '1 pc'),
    Q('Onion', '0.5 pc'), QS('Sambar Powder', '1 tbsp'), QS('Mustard Seeds', '0.5 tsp'),
    QS('Curry Leaves', '5 pcs'), QPA('Oil', '1 tbsp'), QS('Salt', '1 tsp')],
  'medu-vada': () => [QP('Urad Dal', '1 cup'), Q('Green Chili', '2 pcs'), Q('Ginger', '1 inch'),
    QS('Curry Leaves', '5 pcs'), QS('Pepper', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'upma': () => [QG('Rava', '1 cup'), Q('Onion', '1 pc'), Q('Green Chili', '2 pcs'), Q('Ginger', '1 inch'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), Q('Lemon', '1 pc'),
    Q('Peanuts', '2 tbsp', 'pantry'), QPA('Oil', '1 tbsp'), QS('Salt', '1 tsp')],
  'pongal': () => [QG('Rice', '0.5 cup'), QP('Moong Dal', '0.25 cup'), Q('Pepper', '1 tsp', 'spices'),
    QS('Cumin Seeds', '0.5 tsp'), Q('Cashews', '10 pcs', 'pantry'), QS('Curry Leaves', '5 pcs'),
    Q('Ghee', '1 tbsp', 'dairy'), QS('Salt', '1 tsp')],
  'aloo-paratha': () => [QG('Wheat Flour', '1.5 cup'), Q('Potato', '2 pcs'), Q('Green Chili', '1 pc'),
    Q('Ginger', '0.5 inch'), QS('Cumin Seeds', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp'),
    Q('Butter', '1 tbsp', 'dairy')],
  'gobi-paratha': () => [QG('Wheat Flour', '1.5 cup'), Q('Cauliflower', '0.5 pc'), Q('Onion', '0.5 pc'),
    Q('Green Chili', '1 pc'), QS('Cumin Seeds', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'paneer-paratha': () => [QG('Wheat Flour', '1.5 cup'), QP('Paneer', '100 g'), Q('Onion', '0.5 pc'),
    Q('Green Chili', '1 pc'), QS('Cumin Seeds', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'mooli-paratha': () => [QG('Wheat Flour', '1.5 cup'), Q('Radish', '1 pc'), Q('Green Chili', '1 pc'),
    QS('Cumin Seeds', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'paneer-butter-masala': () => [...BASE_VEG, QP('Paneer', '200 g'), QD('Butter', '2 tbsp'), QD('Cream', '50 ml'),
    Q('Cashews', '15 pcs', 'pantry'), QS('Garam Masala', '1 tsp'), QS('Kasuri Methi', '1 tbsp')],
  'dal-makhani': () => [QP('Whole Urad Dal', '1 cup'), QP('Rajma', '0.25 cup'), QD('Butter', '2 tbsp'),
    QD('Cream', '30 ml'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'),
    QS('Salt', '1 tsp')],
  'chole-bhature': () => [QP('Chickpeas', '1 cup'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Chole Masala', '2 tbsp'), QS('Tea Bag', '1 pc'),
    QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'), Q('Lemon', '1 pc')],
  'rajma-chawal': () => [QP('Rajma', '1 cup'), QG('Rice', '1 cup'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'chicken-biryani': () => [QG('Rice', '1 cup'), QP('Chicken', '250 g'), Q('Onion', '2 pcs'), Q('Yogurt', '100 g', 'dairy'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Biryani Masala', '1 tbsp'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'), Q('Mint', '0.25 cup'),
    Q('Coriander Leaves', '0.25 cup'), QS('Saffron', 'pinch'), QD('Ghee', '1 tbsp')],
  'hyderabadi-biryani': () => [QG('Rice', '1 cup'), QP('Chicken', '250 g'), Q('Onion', '2 pcs'), Q('Yogurt', '100 g', 'dairy'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Biryani Masala', '1 tbsp'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'), Q('Mint', '0.25 cup'),
    Q('Coriander Leaves', '0.25 cup'), QS('Saffron', 'pinch'), QD('Ghee', '1 tbsp')],
  'dal-tadka': () => [QP('Toor Dal', '1 cup'), Q('Tomato', '1 pc'), Q('Onion', '1 pc'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Red Chili', '2 pcs'), QS('Curry Leaves', '5 pcs'),
    QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp'), QD('Ghee', '1 tbsp')],
  'aloo-gobi': () => [Q('Potato', '2 pcs'), Q('Cauliflower', '0.5 pc'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'),
    Q('Ginger', '1 inch'), QS('Coriander Powder', '1 tsp')],
  'bhindi-do-pyaza': () => [Q('Okra', '250 g'), Q('Onion', '2 pcs'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'baingan-bharta': () => [Q('Eggplant', '1 pc'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Green Peas', '0.25 cup'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'egg-curry': () => [QP('Eggs', '4 pcs'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'fish-curry': () => [QP('Fish', '250 g'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'prawn-curry': () => [QP('Prawns', '200 g'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'chicken-curry': () => [QP('Chicken', '250 g'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '1 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'mutton-curry': () => [QP('Mutton', '250 g'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '1 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'palak-paneer': () => [QP('Paneer', '200 g'), Q('Spinach', '250 g'), Q('Onion', '1 pc'),
    Q('Tomato', '1 pc'), Q('Green Chili', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'navratan-korma': () => [QP('Paneer', '100 g'), Q('Mixed Vegetables', '1 cup'), Q('Cashews', '15 pcs', 'pantry'),
    QD('Cream', '50 ml'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'mushroom-mutter': () => [Q('Mushroom', '200 g'), Q('Green Peas', '0.5 cup'), Q('Onion', '1 pc'),
    Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'soya-chaap': () => [QP('Soya Chaap', '200 g'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QD('Yogurt', '100 g'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'malai-kofta': () => [QP('Paneer', '150 g'), Q('Potato', '1 pc'), Q('Cashews', '15 pcs', 'pantry'),
    QD('Cream', '50 ml'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'kadhai-paneer': () => [QP('Paneer', '200 g'), Q('Capsicum', '1 pc'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Coriander Powder', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'shahi-paneer': () => [QP('Paneer', '200 g'), QD('Cream', '50 ml'), Q('Cashews', '15 pcs', 'pantry'),
    Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'matar-paneer': () => [QP('Paneer', '200 g'), Q('Green Peas', '0.5 cup'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'aloo-matar': () => [Q('Potato', '2 pcs'), Q('Green Peas', '0.5 cup'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '0.5 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'veg-korma': () => [Q('Mixed Vegetables', '1 cup'), Q('Cashews', '15 pcs', 'pantry'), QD('Cream', '30 ml'),
    Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'veg-kolhapuri': () => [Q('Mixed Vegetables', '1 cup'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Coconut', '0.25 cup'), Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '1 tsp'), QS('Kolhapuri Masala', '1 tbsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'dum-aloo': () => [Q('Baby Potatoes', '8 pcs'), QD('Yogurt', '100 g'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'chana-masala': () => [QP('Chickpeas', '1 cup'), Q('Onion', '2 pcs'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'),
    QS('Garam Masala', '1 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp'),
    Q('Lemon', '1 pc')],
  'dal-fry': () => [QP('Toor Dal', '1 cup'), Q('Onion', '1 pc'), Q('Tomato', '1 pc'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Turmeric', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp'),
    QD('Ghee', '1 tbsp')],
  'kadhi-pakora': () => [QD('Yogurt', '200 g'), QG('Gram Flour', '50 g'), Q('Onion', '1 pc'),
    QS('Turmeric', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Mustard Seeds', '0.5 tsp'),
    QS('Curry Leaves', '5 pcs'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'pav-bhaji': () => [Q('Mixed Vegetables', '2 cups'), Q('Onion', '1 pc'), Q('Tomato', '3 pcs'),
    Q('Capsicum', '1 pc'), Q('Green Peas', '0.25 cup'), QS('Pav Bhaji Masala', '2 tbsp'),
    Q('Butter', '2 tbsp', 'dairy'), QS('Salt', '1 tsp'), QB('Pav', '4 pcs'), Q('Lemon', '1 pc')],
  'pani-puri': () => [QG('Semolina', '0.5 cup'), Q('Potato', '1 pc'), QP('Chickpeas', '0.25 cup'),
    QS('Pani Puri Masala', '1 tbsp'), Q('Mint', '0.25 cup'), Q('Tamarind', '50 g'),
    QS('Cumin Powder', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'samosa': () => [QG('Maida', '1 cup'), Q('Potato', '3 pcs'), Q('Green Peas', '0.25 cup'),
    Q('Green Chili', '2 pcs'), Q('Ginger', '1 inch'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'),
    QPA('Oil', '2 tbsp')],
  'idli-sambhar': () => [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup'), QP('Toor Dal', '0.5 cup'),
    Q('Drumstick', '1 pc'), Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'), QS('Sambar Powder', '1 tbsp'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'masala-dosa': () => [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup'), Q('Potato', '2 pcs'),
    Q('Onion', '1 pc'), Q('Green Chili', '1 pc'), QS('Mustard Seeds', '0.5 tsp'), QS('Turmeric', '0.25 tsp'),
    QS('Curry Leaves', '5 pcs'), QPA('Oil', '2 tbsp'), QS('Salt', '1 tsp')],
  'upma-ravai': () => [QG('Rava', '1 cup'), Q('Onion', '1 pc'), Q('Green Chili', '2 pcs'), Q('Ginger', '1 inch'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), Q('Lemon', '1 pc'),
    Q('Peanuts', '2 tbsp', 'pantry'), QPA('Oil', '1 tbsp'), QS('Salt', '1 tsp')],
  'lemon-rice': () => [QG('Rice', '1 cup'), Q('Lemon', '2 pcs'), Q('Peanuts', '2 tbsp', 'pantry'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), QS('Turmeric', '0.25 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'tamarind-rice': () => [QG('Rice', '1 cup'), Q('Tamarind', '50 g'), Q('Peanuts', '2 tbsp', 'pantry'),
    QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), QS('Turmeric', '0.25 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'curd-rice': () => [QG('Rice', '1 cup'), QD('Yogurt', '200 g'), Q('Green Chili', '1 pc'),
    Q('Ginger', '0.5 inch'), QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'),
    QS('Salt', '1 tsp')],
  'papdi-chaat': () => [Q('Potato', '1 pc'), QP('Chickpeas', '0.25 cup'), QD('Yogurt', '100 g'),
    QS('Chaat Masala', '1 tsp'), Q('Tamarind Chutney', '2 tbsp', 'pantry'), Q('Mint Chutney', '2 tbsp', 'pantry'),
    Q('Sev', '0.25 cup', 'snacks'), QS('Salt', '1 tsp')],
  'bhel-puri': () => [Q('Puffed Rice', '1 cup'), Q('Onion', '0.5 pc'), Q('Tomato', '1 pc'),
    Q('Potato', '1 pc'), QS('Chaat Masala', '1 tsp'), Q('Tamarind Chutney', '2 tbsp', 'pantry'),
    Q('Mint Chutney', '1 tbsp', 'pantry'), Q('Sev', '0.25 cup', 'snacks'), Q('Peanuts', '2 tbsp', 'pantry'),
    QS('Salt', '1 tsp')],
  'fruit-salad': () => [Q('Apple', '1 pc'), Q('Banana', '1 pc'), Q('Orange', '1 pc'),
    Q('Grapes', '0.5 cup'), QS('Salt', 'pinch'), QS('Pepper', 'pinch'), Q('Lemon', '1 pc')],
  'sandwich': () => [QB('Bread', '4 slices'), Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'),
    Q('Cucumber', '0.5 pc'), Q('Butter', '1 tbsp', 'dairy'), QS('Salt', 'pinch'), QS('Pepper', 'pinch')],
  'veggie-sandwich': () => [QB('Bread', '4 slices'), Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'),
    Q('Cucumber', '0.5 pc'), Q('Capsicum', '0.5 pc'), Q('Butter', '1 tbsp', 'dairy'),
    QS('Chaat Masala', '0.5 tsp'), QS('Salt', 'pinch')],
  'tofu-scramble': () => [QP('Tofu', '200 g'), Q('Onion', '1 pc'), Q('Tomato', '1 pc'),
    Q('Capsicum', '0.5 pc'), QS('Turmeric', '0.25 tsp'), QS('Kala Namak', '0.25 tsp'),
    QS('Salt', '0.5 tsp'), QPA('Oil', '1 tbsp')],
  'pasta': () => [QG('Pasta', '200 g'), Q('Tomato', '2 pcs'), Q('Onion', '1 pc'), Q('Garlic', '3 cloves'),
    QPA('Oil', '2 tbsp'), QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'), QS('Red Chili Flakes', '0.5 tsp')],
  'noodles': () => [QG('Noodles', '200 g'), Q('Onion', '1 pc'), Q('Capsicum', '0.5 pc'),
    Q('Carrot', '0.5 pc'), QS('Soy Sauce', '1 tbsp'), QPA('Oil', '2 tbsp'), QS('Salt', '1 tsp'),
    QS('Pepper', '0.5 tsp')],
  'fried-rice': () => [QG('Rice', '1 cup'), Q('Onion', '1 pc'), Q('Capsicum', '0.5 pc'),
    Q('Carrot', '0.5 pc'), Q('Green Peas', '0.25 cup'), QS('Soy Sauce', '1 tbsp'), QPA('Oil', '2 tbsp'),
    QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp')],
  'pizza': () => [QG('Pizza Base', '1 pc'), Q('Tomato', '2 pcs'), Q('Capsicum', '0.5 pc'),
    Q('Onion', '0.5 pc'), Q('Olives', '10 pcs'), QD('Mozzarella', '100 g'), QS('Oregano', '0.5 tsp'),
    QS('Salt', '0.5 tsp'), QPA('Oil', '1 tbsp')],
  'burger': () => [QB('Burger Bun', '2 pcs'), QP('Patty', '2 pcs'), Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'),
     Q('Lettuce', '2 leaves'), QS('Salt', 'pinch'), QS('Pepper', 'pinch'), QD('Cheese', '2 slices')],
  'tacos': () => [QB('Taco Shells', '4 pcs'), QP('Black Beans', '0.5 cup'), Q('Tomato', '1 pc'),
    Q('Onion', '0.5 pc'), Q('Lettuce', '2 leaves'), QS('Taco Seasoning', '1 tbsp'), Q('Lemon', '1 pc'),
    QS('Salt', '0.5 tsp')],
  'burrito': () => [QB('Tortilla', '2 pcs'), QG('Rice', '0.5 cup'), QP('Black Beans', '0.5 cup'),
    Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'), QS('Taco Seasoning', '1 tbsp'), Q('Lemon', '1 pc'),
    QS('Salt', '0.5 tsp')],
  'salad': () => [Q('Lettuce', '2 cups'), Q('Tomato', '1 pc'), Q('Cucumber', '0.5 pc'),
    Q('Onion', '0.5 pc'), Q('Lemon', '1 pc'), QPA('Olive Oil', '1 tbsp'), QS('Salt', '0.5 tsp'),
    QS('Pepper', '0.25 tsp')],
  'soup': () => [Q('Mixed Vegetables', '1 cup'), Q('Onion', '0.5 pc'), Q('Garlic', '2 cloves'),
    QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'), QPA('Oil', '1 tbsp')],
  'smoothie': () => [Q('Banana', '1 pc'), QD('Milk', '200 ml'), QD('Yogurt', '100 g'),
    Q('Mixed Berries', '0.5 cup'), QS('Honey', '1 tbsp')],
  'oatmeal': () => [QG('Oats', '0.5 cup'), QD('Milk', '200 ml'), Q('Banana', '1 pc'),
    Q('Mixed Berries', '0.25 cup'), QS('Honey', '1 tbsp'), Q('Nuts', '2 tbsp', 'pantry')],
  'pancakes': () => [QG('Flour', '1 cup'), QD('Milk', '200 ml'), QP('Eggs', '1 pc'),
    QS('Sugar', '1 tbsp'), QPA('Butter', '1 tbsp'), QS('Salt', 'pinch')],
  'french-toast': () => [QB('Bread', '4 slices'), QP('Eggs', '2 pcs'), QD('Milk', '100 ml'),
    QS('Sugar', '1 tbsp'), QS('Cinnamon', '0.5 tsp'), QPA('Butter', '1 tbsp')],
  'waffles': () => [QG('Flour', '1 cup'), QD('Milk', '200 ml'), QP('Eggs', '1 pc'),
    QPA('Butter', '2 tbsp'), QS('Sugar', '1 tbsp'), QS('Salt', 'pinch')],
  'milkshake': () => [QD('Milk', '300 ml'), QD('Ice Cream', '2 scoops'), QS('Sugar', '1 tbsp')],
  'lassi': () => [QD('Yogurt', '200 g'), QD('Milk', '100 ml'), QS('Sugar', '1 tbsp'), Q('Rose Water', '1 tsp', 'pantry')],
  'chai': () => [QD('Milk', '200 ml'), QS('Tea Leaves', '1 tsp'), QS('Sugar', '1 tsp'), Q('Ginger', '0.5 inch')],
  'coffee': () => [QD('Milk', '200 ml'), QS('Coffee Powder', '1 tbsp'), QS('Sugar', '1 tsp')],
  'juice': () => [Q('Fruit', '2 pcs'), QS('Sugar', '1 tsp'), QS('Salt', 'pinch')],
  'buttermilk': () => [QD('Yogurt', '150 g'), Q('Water', '200 ml'), QS('Cumin Powder', '0.5 tsp'), QS('Salt', '0.5 tsp')],
  'greek-nachos-baked-chickpeas': () => [QB('Nachos', '1 packet'), QD('Feta Cheese', '100 g'), QP('Chickpeas', '1 cup')],
  'lentil-pasta-marinara': () => [QG('Lentil Pasta', '200 g'), Q('Tomato', '3 pcs'), Q('Garlic', '3 cloves'),
    Q('Onion', '0.5 pc'), QS('Dried Oregano', '0.5 tsp'), QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'),
    QPA('Olive Oil', '2 tbsp')],
  'tofu-meatballs': () => [QP('Tofu', '200 g'), QG('Breadcrumbs', '0.5 cup'), Q('Onion', '0.5 pc'),
    Q('Garlic', '2 cloves'), QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp'), QPA('Oil', '2 tbsp')],
  'tahini-pasta': () => [QG('Pasta', '200 g'), Q('Tahini', '3 tbsp', 'pantry'), Q('Lemon', '1 pc'),
    Q('Garlic', '2 cloves'), QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp'), QPA('Olive Oil', '1 tbsp')],
  'crispy-potato-tacos': () => [Q('Potato', '2 pcs'), QB('Taco Shells', '4 pcs'), Q('Tomato', '1 pc'),
    Q('Lettuce', '2 leaves'), QS('Taco Seasoning', '1 tbsp'), QS('Salt', '0.5 tsp'), QPA('Oil', '2 tbsp')],
  'baked-penne-roasted-veg': () => [QG('Penne Pasta', '200 g'), Q('Mixed Vegetables', '1.5 cups'),
    Q('Garlic', '3 cloves'), QPA('Olive Oil', '2 tbsp'), QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'),
    QS('Dried Oregano', '0.5 tsp')],
  'vegan-egg-salad-sandwich': () => [QP('Tofu', '200 g'), QB('Bread', '4 slices'), Q('Onion', '0.5 pc'),
    QS('Kala Namak', '0.25 tsp'), QS('Turmeric', '0.25 tsp'), Q('Vegan Mayo', '2 tbsp', 'pantry'),
    QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp')],
  'vegan-biryani-cauliflower': () => [QG('Rice', '1 cup'), Q('Cauliflower', '0.5 pc'), Q('Onion', '1 pc'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QS('Biryani Masala', '1 tbsp'), QS('Salt', '1 tsp'),
    QPA('Oil', '2 tbsp'), Q('Mint', '0.25 cup'), Q('Coriander Leaves', '0.25 cup')],
  'chickpea-lentil-saute-apple-curry': () => [QP('Chickpeas', '0.5 cup'), QP('Lentils', '0.5 cup'),
    Q('Apple', '1 pc'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '0.5 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  'chickpea-tikka-masala': () => [QP('Chickpeas', '1 cup'), Q('Onion', '1 pc'), Q('Tomato', '2 pcs'),
    Q('Ginger-Garlic Paste', '1 tbsp'), QD('Cream', '50 ml'), QS('Turmeric', '0.5 tsp'),
    QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'bbq-jackfruit-burrito-bowl': () => [Q('Jackfruit', '200 g'), QG('Rice', '0.5 cup'), QP('Black Beans', '0.5 cup'),
    Q('Tomato', '1 pc'), Q('Onion', '0.5 pc'), QS('BBQ Sauce', '2 tbsp'), Q('Lemon', '1 pc'),
    QS('Salt', '0.5 tsp')],
  'sweet-potato-breakfast-hash': () => [Q('Sweet Potato', '1 pc'), QP('Black Beans', '0.5 cup'),
    Q('Onion', '0.5 pc'), Q('Capsicum', '0.5 pc'), QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp'),
    QS('Paprika', '0.5 tsp'), QPA('Oil', '1 tbsp')],
  'roasted-cauliflower-curry-sweet-potato': () => [Q('Cauliflower', '0.5 pc'), Q('Sweet Potato', '1 pc'),
    Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Garam Masala', '0.5 tsp'),
    QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  'sweet-sesame-noodles-tofu-broccoli': () => [QG('Noodles', '200 g'), QP('Tofu', '150 g'), Q('Broccoli', '1 cup'),
    QS('Sesame Oil', '1 tbsp'), QS('Soy Sauce', '1 tbsp'), QS('Sesame Seeds', '1 tsp'),
    QS('Salt', '0.5 tsp'), Q('Garlic', '2 cloves')],
  'vegan-chow-mein': () => [QG('Noodles', '200 g'), Q('Mixed Vegetables', '1 cup'), Q('Onion', '0.5 pc'),
    QS('Soy Sauce', '1 tbsp'), QS('Vinegar', '1 tsp'), QPA('Oil', '2 tbsp'), QS('Salt', '0.5 tsp'),
    QS('Pepper', '0.25 tsp')],
  'veggie-shawarma-tofu': () => [QB('Pita Bread', '2 pcs'), QP('Tofu', '150 g'), Q('Onion', '0.5 pc'),
    Q('Tomato', '1 pc'), Q('Lettuce', '2 leaves'), QS('Shawarma Spice', '1 tbsp'), QS('Salt', '0.5 tsp'),
    QPA('Oil', '1 tbsp')],
  'bean-stew-brown-rice': () => [QP('Mixed Beans', '1 cup'), QG('Brown Rice', '0.5 cup'), Q('Onion', '1 pc'),
    Q('Tomato', '1 pc'), Q('Garlic', '2 cloves'), QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'),
    QPA('Oil', '1 tbsp')],
  'tofu-pasta': () => [QG('Pasta', '200 g'), QP('Tofu', '150 g'), Q('Tomato', '2 pcs'), Q('Garlic', '3 cloves'),
    QS('Salt', '1 tsp'), QS('Pepper', '0.5 tsp'), QS('Red Chili Flakes', '0.5 tsp'), QPA('Olive Oil', '2 tbsp')],
  'keto-pizza-bowl': () => [QD('Mozzarella', '100 g'), QG('Almond Flour', '0.5 cup'), Q('Mixed Vegetables', '1 cup'),
    Q('Tomato', '1 pc'), QS('Oregano', '0.5 tsp'), QS('Salt', '0.5 tsp'), QPA('Olive Oil', '1 tbsp')],
  'english-muffin-pizzas': () => [QB('English Muffin', '2 pcs'), QD('Mozzarella', '2 cups'),
    QPA('Pizza Sauce', '0.5 cup'), QP('Paneer', '100 g')],
  'vegan-sushi-bowl': () => [QG('Sushi Rice', '1 cup'), Q('Avocado', '1 pc'), Q('Cucumber', '0.5 pc'),
    Q('Carrot', '0.5 pc'), QS('Soy Sauce', '1 tbsp'), QS('Rice Vinegar', '1 tbsp'),
    Q('Seaweed', '2 sheets', 'pantry')],
  'sourdough-grilled-cheese': () => [QB('Sourdough Bread', '4 slices'), QD('Cheese', '100 g'),
    QD('Butter', '1 tbsp')],
  'high-protein-veggie-burgers': () => [QB('Burger Bun', '2 pcs'), QP('Black Beans', '1 cup'), Q('Onion', '0.5 pc'),
    QG('Oats', '0.25 cup'), QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp'), QPA('Oil', '1 tbsp')],
  'loaded-veggie-nachos': () => [QB('Nachos', '200 g'), QP('Black Beans', '0.5 cup'), Q('Tomato', '1 pc'),
     Q('Onion', '0.5 pc'), QD('Cheese', '100 g'), Q('Jalapeno', '2 pcs'),
    QS('Taco Seasoning', '1 tbsp')],
  'twice-baked-potatoes-broccoli-cheese': () => [Q('Potato', '3 pcs'), Q('Broccoli', '1 cup'),
    QD('Cheddar Cheese', '50 g'), QD('Butter', '1 tbsp'), QS('Salt', '0.5 tsp'),
    QS('Pepper', '0.25 tsp')],
  'vegetarian-fajita-bowl': () => [Q('Capsicum', '1 pc'), Q('Onion', '1 pc'), Q('Tomato', '1 pc'),
    QP('Black Beans', '0.5 cup'), QG('Rice', '0.5 cup'), QS('Taco Seasoning', '1 tbsp'), QS('Salt', '0.5 tsp'),
    QPA('Oil', '1 tbsp'), Q('Lemon', '1 pc')],
  'garlic-bread-grilled-cheese': () => [QB('White Bread', '4 slices'), QD('Cheese', '100 g'),
    QD('Butter', '2 tbsp'), Q('Garlic', '3 cloves'), QS('Oregano', '0.5 tsp')],
  'vegan-french-toast-casserole': () => [QB('Bread', '6 slices'), QD('Almond Milk', '200 ml'),
    Q('Banana', '1 pc'), QS('Cinnamon', '0.5 tsp'), QS('Vanilla Extract', '1 tsp'),
    QS('Salt', 'pinch')],
  'blueberry-banana-oat-bread': () => [QG('Oats', '1 cup'), QG('Flour', '1 cup'), Q('Banana', '2 pcs'),
    Q('Blueberries', '0.5 cup'), QS('Sugar', '0.25 cup'), QPA('Oil', '0.25 cup'), QS('Salt', '0.5 tsp')],
  'banana-bread-no-butter': () => [QG('Flour', '2 cups'), Q('Banana', '3 pcs'), QS('Sugar', '0.5 cup'),
    QPA('Oil', '0.25 cup'), QS('Salt', '0.5 tsp'), QS('Vanilla Extract', '1 tsp')],
  'banana-bread-no-brown-sugar': () => [QG('Flour', '2 cups'), Q('Banana', '3 pcs'), QS('Sugar', '0.25 cup'),
    QPA('Oil', '0.25 cup'), QS('Salt', '0.5 tsp'), Q('Honey', '2 tbsp', 'pantry')],
  'cottage-cheese-fruit': () => [QD('Cottage Cheese', '200 g'), Q('Mixed Fruit', '1 cup'), QS('Honey', '1 tbsp'), Q('Nuts', '1 tbsp', 'pantry')],
  'mushroom-toast': () => [Q('Mushroom', '150 g'), QB('Bread', '2 slices'), Q('Garlic', '2 cloves'),
    QS('Salt', '0.5 tsp'), QS('Pepper', '0.25 tsp'), QPA('Oil', '1 tbsp')],
};

// ─── Region-specific base ingredients ────────────────────────────────────────

const REGIONAL_BASES: Record<string, Ingredient[]> = {
  north: [Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp'),
    QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
  south: [QS('Mustard Seeds', '0.5 tsp'), QS('Curry Leaves', '5 pcs'), QPA('Oil', '1 tbsp'), QS('Salt', '1 tsp')],
  east: [QS('Mustard Oil', '1 tbsp'), QS('Panch Phoron', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '1 tbsp')],
  west: [Q('Coconut', '0.25 cup'), QS('Cumin Seeds', '1 tsp'), QS('Salt', '1 tsp'), QPA('Oil', '2 tbsp')],
};

// ─── Tag-based ingredient additions ──────────────────────────────────────────

const TAG_INGREDIENTS: Record<string, Ingredient[]> = {
  'rice': [QG('Rice', '1 cup')],
  'biryani': [QG('Rice', '1 cup'), QS('Biryani Masala', '1 tbsp'), Q('Mint', '0.25 cup')],
  'pulao': [QG('Rice', '1 cup'), QS('Cumin Seeds', '1 tsp')],
  'dal': [QP('Toor Dal', '1 cup'), QS('Turmeric', '0.5 tsp')],
  'lentils': [QP('Toor Dal', '1 cup')],
  'chickpea': [QP('Chickpeas', '1 cup')],
  'paneer': [QP('Paneer', '200 g')],
  'tofu': [QP('Tofu', '200 g')],
  'chicken': [QP('Chicken', '250 g')],
  'mutton': [QP('Mutton', '250 g')],
  'fish': [QP('Fish', '200 g')],
  'prawn': [QP('Prawns', '200 g')],
  'egg': [QP('Eggs', '3 pcs')],
  'sandwich': [QB('Bread', '4 slices')],
  'pasta': [QG('Pasta', '200 g')],
  'noodles': [QG('Noodles', '200 g')],
  'paratha': [QG('Wheat Flour', '1.5 cup'), Q('Butter', '1 tbsp', 'dairy')],
  'bread': [QG('Flour', '2 cups')],
  'potato': [Q('Potato', '2 pcs')],
  'cauliflower': [Q('Cauliflower', '0.5 pc')],
  'okra': [Q('Okra', '250 g')],
  'spinach': [Q('Spinach', '250 g')],
  'mushroom': [Q('Mushroom', '200 g')],
  'pizza': [QG('Pizza Base', '1 pc'), QD('Mozzarella', '100 g'), QPA('Pizza Sauce', '0.5 cup')],
  'burger': [QB('Burger Bun', '2 pcs')],
  'taco': [QB('Taco Shells', '4 pcs')],
  'salad': [Q('Lettuce', '2 cups')],
  'soup': [Q('Mixed Vegetables', '1 cup')],
  'smoothie': [Q('Banana', '1 pc'), QD('Milk', '200 ml')],
  'sabzi': [Q('Mixed Vegetables', '1 cup'), QS('Turmeric', '0.5 tsp'), QS('Red Chili Powder', '0.5 tsp')],
  'curry': [Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp')],
  'gravy': [Q('Onion', '1 pc'), Q('Tomato', '2 pcs'), Q('Ginger-Garlic Paste', '1 tbsp')],
  'korma': [Q('Cashews', '15 pcs', 'pantry'), QD('Cream', '50 ml')],
  'fry': [QPA('Oil', '2 tbsp')],
  'snack': [QPA('Oil', '2 tbsp')],
  'healthy': [Q('Lemon', '1 pc')],
  'quick': [Q('Onion', '0.5 pc')],
  'protein': [QP('Chickpeas', '0.5 cup')],
  'banana': [Q('Banana', '2 pcs')],
  'chocolate': [QS('Cocoa Powder', '1 tbsp')],
  'berry': [Q('Mixed Berries', '0.5 cup')],
  'mango': [Q('Mango', '1 pc')],
  'coconut': [Q('Coconut', '0.5 cup')],
  'peanut': [Q('Peanut Butter', '2 tbsp', 'pantry')],
  'chaat': [QS('Chaat Masala', '1 tsp'), Q('Tamarind Chutney', '2 tbsp', 'pantry')],
  'chutney': [Q('Coconut', '0.5 cup'), QS('Mustard Seeds', '0.5 tsp')],
  'pickle': [Q('Mango Pickle', '1 tbsp', 'pantry')],
};

// ─── Name-based keyword to ingredient mapping ────────────────────────────────

const NAME_KEYWORDS: [RegExp, Ingredient[]][] = [
  [/(chole|chickpea|chana)/i, [QP('Chickpeas', '1 cup')]],
  [/\bpaneer\b/i, [QP('Paneer', '200 g')]],
  [/\btofu\b/i, [QP('Tofu', '200 g')]],
  [/\bchicken\b/i, [QP('Chicken', '250 g')]],
  [/\bmutton\b/i, [QP('Mutton', '250 g')]],
  [/\bfish\b/i, [QP('Fish', '200 g')]],
  [/\bprawn\b/i, [QP('Prawns', '200 g')]],
  [/\begg\b/i, [QP('Eggs', '3 pcs')]],
  [/\bshrimp\b/i, [QP('Shrimp', '200 g')]],
  [/\bpotato\b|\baloo\b/i, [Q('Potato', '2 pcs')]],
  [/\bcauliflower\b|\bgobhi\b/i, [Q('Cauliflower', '0.5 pc')]],
  [/\bokra\b|\bbhindi\b/i, [Q('Okra', '250 g')]],
  [/\bspinach\b|\bpalak\b/i, [Q('Spinach', '250 g')]],
  [/\bmushroom\b/i, [Q('Mushroom', '200 g')]],
  [/\bpasta\b/i, [QG('Pasta', '200 g')]],
  [/\bnoodle\b/i, [QG('Noodles', '200 g')]],
  [/\brice\b/i, [QG('Rice', '1 cup')]],
  [/\bbiryani\b/i, [QG('Rice', '1 cup'), QS('Biryani Masala', '1 tbsp')]],
  [/\bpulao\b/i, [QG('Rice', '1 cup')]],
  [/\bparatha\b/i, [QG('Wheat Flour', '1.5 cup')]],
  [/\broti\b|\bphulka\b/i, [QG('Wheat Flour', '1 cup')]],
  [/\bpizza\b/i, [QG('Pizza Base', '1 pc'), QD('Mozzarella', '100 g'), QPA('Pizza Sauce', '0.5 cup')]],
  [/\bburger\b/i, [QB('Burger Bun', '2 pcs')]],
  [/\bsandwich\b/i, [QB('Bread', '4 slices')]],
  [/\btaco\b/i, [QB('Taco Shells', '4 pcs')]],
  [/\bburrito\b/i, [QB('Tortilla', '2 pcs')]],
  [/\bnacho\b/i, [QB('Nachos', '200 g')]],
  [/\bsalad\b/i, [Q('Lettuce', '2 cups')]],
  [/\bsoup\b/i, [Q('Mixed Vegetables', '1 cup')]],
  [/\bsmoothie\b/i, [Q('Banana', '1 pc'), QD('Milk', '200 ml')]],
  [/\bmilkshake\b/i, [QD('Milk', '300 ml'), QD('Ice Cream', '2 scoops')]],
  [/\blassi\b/i, [QD('Yogurt', '200 g'), QD('Milk', '100 ml')]],
  [/\bchaat\b/i, [QS('Chaat Masala', '1 tsp'), Q('Tamarind Chutney', '2 tbsp', 'pantry')]],
  [/\bsamosa\b/i, [QG('Maida', '1 cup'), Q('Potato', '3 pcs')]],
  [/\bpav\b/i, [QB('Pav', '4 pcs')]],
  [/\bdosa\b/i, [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup')]],
  [/\bidli\b/i, [QG('Idli Rice', '1 cup'), QP('Urad Dal', '0.25 cup')]],
  [/\bvada\b/i, [QP('Urad Dal', '1 cup')]],
  [/\bupma\b/i, [QG('Rava', '1 cup')]],
  [/\bpongal\b/i, [QG('Rice', '0.5 cup'), QP('Moong Dal', '0.25 cup')]],
  [/\bsambar\b|\bsambhar\b/i, [QP('Toor Dal', '0.5 cup'), QS('Sambar Powder', '1 tbsp')]],
  [/\brasam\b/i, [QP('Toor Dal', '0.25 cup'), Q('Tomato', '2 pcs'), QS('Rasam Powder', '1 tbsp')]],
  [/\bdal\b|\blentil\b/i, [QP('Toor Dal', '1 cup'), QS('Turmeric', '0.5 tsp')]],
  [/\brajma\b/i, [QP('Rajma', '1 cup')]],
  [/\bkorma\b/i, [Q('Cashews', '15 pcs', 'pantry'), QD('Cream', '50 ml')]],
  [/\bkofta\b/i, [QP('Paneer', '150 g'), Q('Potato', '1 pc')]],
  [/\bbhaji\b/i, [Q('Mixed Vegetables', '1 cup'), QS('Pav Bhaji Masala', '1 tbsp')]],
  [/\bbharta\b/i, [Q('Eggplant', '1 pc')]],
  [/\btikka\b/i, [Q('Capsicum', '1 pc'), Q('Onion', '1 pc')]],
  [/\bpancake\b/i, [QG('Flour', '1 cup'), QD('Milk', '200 ml'), QP('Eggs', '1 pc')]],
  [/\bwaffle\b/i, [QG('Flour', '1 cup'), QD('Milk', '200 ml'), QP('Eggs', '1 pc')]],
  [/\bfrench.?toast\b/i, [QB('Bread', '4 slices'), QP('Eggs', '2 pcs'), QD('Milk', '100 ml')]],
  [/\btoast\b/i, [QB('Bread', '2 slices')]],
  [/\boat\b/i, [QG('Oats', '0.5 cup')]],
  [/\bchaap\b/i, [QP('Soya Chaap', '200 g')]],
  [/\bkadhi\b/i, [QD('Yogurt', '200 g'), QG('Gram Flour', '50 g')]],
  [/\bbread\b/i, [QG('Flour', '2 cups')]],
  [/\bcookie\b/i, [QG('Flour', '1 cup'), Q('Butter', '100 g', 'dairy')]],
  [/\bcake\b/i, [QG('Flour', '1.5 cup'), QS('Sugar', '0.5 cup'), Q('Butter', '100 g', 'dairy')]],
  [/\bmuffin\b/i, [QG('Flour', '1.5 cup'), QS('Sugar', '0.25 cup'), QPA('Oil', '0.25 cup')]],
  [/\bbrownie\b/i, [QG('Flour', '1 cup'), Q('Butter', '100 g', 'dairy'), QS('Cocoa Powder', '3 tbsp')]],
  [/\bavocado\b/i, [Q('Avocado', '2 pcs')]],
  [/\bbanana\b/i, [Q('Banana', '2 pcs')]],
  [/\bbleuberry\b|\bberry\b/i, [Q('Mixed Berries', '0.5 cup')]],
  [/\bmango\b/i, [Q('Mango', '1 pc')]],
  [/\bchocolate\b/i, [QS('Cocoa Powder', '2 tbsp')]],
  [/\bpeanut\b/i, [Q('Peanut Butter', '2 tbsp', 'pantry')]],
];

function generateIngredients(d: Dish): Ingredient[] {
  const result: Ingredient[] = [];
  const seen = new Set<string>();
  
  const add = (ing: Ingredient) => {
    const name = ing.name.toLowerCase();
    if (!seen.has(name)) { seen.add(name); result.push(ing); }
  };

  const nameN = d.name.toLowerCase();
  const idN = d.id.toLowerCase();

  // 1. Dish-specific override (most accurate)
  if (DISH_SPECIFIC[d.id]) {
    for (const i of DISH_SPECIFIC[d.id](d)) add(i);
    return result;
  }

  // 2. Name keyword matching
  for (const [re, ings] of NAME_KEYWORDS) {
    if (re.test(nameN) || re.test(idN)) {
      for (const i of ings) add(i);
    }
  }

  // 3. Tag-based additions
  for (const tag of d.tags) {
    const tagKey = tag.toLowerCase();
    if (TAG_INGREDIENTS[tagKey]) {
      for (const i of TAG_INGREDIENTS[tagKey]) add(i);
    }
  }

  // 4. Region-specific base (for sabzi/curry dishes)
  const isSabziCurry = d.tags.some(t => ['sabzi', 'curry', 'gravy'].includes(t));
  if (isSabziCurry && result.length < 4) {
    const region = d.region === 'all' ? 'north' : d.region;
    const base = REGIONAL_BASES[region] || REGIONAL_BASES.north;
    for (const i of base) add(i);
  }

  // 5. Protein from type (if nothing specific matched)
  const hasProtein = result.some(i => i.category === 'proteins');
  if (!hasProtein) {
    if (d.type === 'non-veg' && !result.some(i => ['Chicken', 'Mutton', 'Fish', 'Eggs', 'Prawns'].includes(i.name))) {
      if (idN.includes('fish')) add(QP('Fish', '200 g'));
      else if (idN.includes('mutton')) add(QP('Mutton', '250 g'));
      else if (idN.includes('prawn')) add(QP('Prawns', '200 g'));
      else if (idN.includes('egg')) add(QP('Eggs', '3 pcs'));
      else add(QP('Chicken', '250 g'));
    } else if (d.type === 'veg' && (idN.includes('paneer') || nameN.includes('paneer'))) {
      add(QP('Paneer', '200 g'));
    } else if (d.type === 'vegan' && (idN.includes('tofu') || nameN.includes('tofu'))) {
      add(QP('Tofu', '200 g'));
    }
  }

  // 6. Daal staple for dal/lentil category
  const isDalDish = d.tags.some(t => ['dal', 'lentils'].includes(t)) || idN.includes('dal');
  if (isDalDish && !seen.has('toor dal')) {
    add(QP('Toor Dal', '1 cup'));
  }

  // 7. Rice for rice-tagged dishes
  const isRiceDish = d.tags.some(t => ['rice', 'biryani', 'pulao'].includes(t)) || idN.includes('rice');
  if (isRiceDish && !seen.has('rice')) {
    add(QG('Rice', '1 cup'));
  }

  // 8. Minimum pantry staples if nothing else was inferred
  if (result.length === 0) {
    add(QS('Salt', '1 tsp'));
    add(QPA('Oil', '2 tbsp'));
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

let output = `// Auto-generated ingredient map\n// Generated by scripts/generateIngredients.ts\n// DO NOT EDIT MANUALLY\n\nimport type { Ingredient } from './dishLibrary';\n\nexport const GENERATED_INGREDIENTS: Record<string, Ingredient[]> = {\n`;

const allDishes = DISH_LIBRARY;
const map: Record<string, Ingredient[]> = {};

for (const dish of allDishes) {
  for (const variant of dish.variants) {
    if (variant.ingredients && variant.ingredients.length > 0) continue; // skip if already has ingredients
    const key = `${dish.id}::${variant.id}`;
    map[key] = generateIngredients(dish);
  }
}

const lines: string[] = [];
for (const [key, ings] of Object.entries(map)) {
  const ingStr = ings.map(i => `  { name: '${i.name}', quantity: ${i.quantity}, unit: '${i.unit}', category: '${i.category}', inStock: false }`).join(',\n');
  lines.push(`  '${key}': [\n${ingStr}\n  ]`);
}

output += lines.join(',\n\n') + '\n};\n';

const outPath = path.resolve(__dirname, '../constants/generatedIngredients.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log(`Generated ingredients for ${Object.keys(map).length} variants → ${outPath}`);

// Summary
let withExplicit = 0;
let totalVariants = 0;
for (const d of allDishes) {
  for (const v of d.variants) {
    totalVariants++;
    if (v.ingredients && v.ingredients.length > 0) withExplicit++;
  }
}
console.log(`Total variants: ${totalVariants}, with explicit ingredients: ${withExplicit}, generated: ${Object.keys(map).length}`);

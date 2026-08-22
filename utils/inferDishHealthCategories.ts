/**
 * Infers health categories from a dish name when DISH_HEALTH_MAP has no entry.
 * Used by Dashboard, Profile health, nutrition scoring, and dish sorting/filtering.
 */

export function inferDishHealthCategories(name: string): string[] {
  const lower = name.toLowerCase();
  const cats: string[] = [];

  // Protein sources
  const proteinKw = ['chicken', 'mutton', 'lamb', 'pork', 'beef', 'meat', 'fish', 'prawn', 'shrimp',
    'paneer', 'egg', 'tofu', 'soya', 'soy', 'legume', 'protein'];
  if (proteinKw.some(k => lower.includes(k))) cats.push('lean-protein');

  // Legumes (also protein)
  const legumeKw = ['dal', 'lentil', 'chickpea', 'chole', 'rajma', 'sambar', 'beans',
    'toor', 'masoor', 'moong', 'urad', 'chana', 'legume'];
  if (legumeKw.some(k => lower.includes(k))) cats.push('legume');

  // Red meat penalty
  const redMeatKw = ['mutton', 'lamb', 'pork', 'beef', 'bacon', 'ham', 'red meat'];
  if (redMeatKw.some(k => lower.includes(k))) cats.push('red-meat');

  // Vegetables & fruits
  const vegKw = ['vegetable', 'sabzi', 'bhaji', 'thoran', 'avial', 'poriyal', 'theeyal',
    'salad', 'raita', 'chutney', 'salsa', 'koshimbir', 'veg', 'pachadi', 'korma'];
  if (vegKw.some(k => lower.includes(k))) cats.push('veg-fruit');

  // Whole grains
  const wholeGrainKw = ['whole wheat', 'whole grain', 'brown rice', 'millet', 'ragi', 'jowar',
    'bajra', 'oats', 'oatmeal', 'quinoa', 'multigrain'];
  if (wholeGrainKw.some(k => lower.includes(k))) cats.push('whole-grain');

  // Refined grains
  const refinedGrainKw = ['rice', 'biryani', 'pulao', 'naan', 'paratha', 'roti', 'phulka',
    'pasta', 'noodles', 'bread', 'pizza', 'burger', 'sandwich', 'subway'];
  if (refinedGrainKw.some(k => lower.includes(k))) cats.push('refined-grain');

  // Healthy fats
  const healthyFatKw = ['nuts', 'almond', 'cashew', 'walnut', 'peanut', 'seed', 'avocado',
    'olive', 'coconut', 'ghee', 'healthy-fat'];
  if (healthyFatKw.some(k => lower.includes(k))) cats.push('healthy-fat');

  // Unhealthy fats (caution: avoid over-penalizing)
  const unhealthyFatKw = ['butter', 'cream', 'malai', 'deep fried', 'cheese'];
  if (unhealthyFatKw.some(k => lower.includes(k))) cats.push('unhealthy-fat');

  // Fried foods
  const friedKw = ['fried', 'pakora', 'bhajiya', 'tawa fry', 'manchurian', 'chilli', 'crispy',
    'fry', ' roasted'];
  if (friedKw.some(k => lower.includes(k))) cats.push('fried');

  // Desserts & sweets
  const dessertKw = ['dessert', 'sweet', 'halwa', 'kheer', 'pudding', 'cake', 'pastry',
    'mithai', 'barfi', 'ladoo', 'laddu', 'jalebi', 'gulab', 'ice cream', ' brownie'];
  if (dessertKw.some(k => lower.includes(k))) cats.push('dessert');

  // Sugary beverages
  const sugaryBevKw = ['smoothie', 'milkshake', 'shake', 'sharbat', 'soda', 'cola', 'soft drink'];
  if (sugaryBevKw.some(k => lower.includes(k))) cats.push('sugary-beverage');

  // Healthy beverages
  const healthyBevKw = ['water', 'chaas', 'lassi', 'buttermilk', 'green tea', 'lemon water', 'coconut water'];
  if (healthyBevKw.some(k => lower.includes(k))) cats.push('healthy-beverage');

  // Starchy vegetables
  const starchyKw = ['potato', 'aloo', 'sweet potato', 'shakarkand', 'sabudana', 'tapioca', 'cassava'];
  if (starchyKw.some(k => lower.includes(k))) cats.push('starchy-veg');

  return cats;
}

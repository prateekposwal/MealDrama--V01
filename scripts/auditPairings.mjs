/**
 * Audit all dish defaultPairings across dishLibrary.ts for cultural/region mismatches.
 *
 * Approach: find every `defaultPairings:` line; scan backward for id / name / region / category / weight / tags.
 *
 * Usage: node scripts/auditPairings.mjs
 */

import fs from 'fs';

const FILE = new URL('../meal/constants/dishLibrary.ts', import.meta.url).pathname;
const src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanStr(s) {
  if (!s) return '';
  return s.replace(/^['"`]|['"`]$/g, '').trim();
}

function parseArray(str) {
  const m = str.match(/\[([^\]]*)\]/);
  if (!m) return [];
  return m[1].split(',').map(s => cleanStr(s)).filter(Boolean);
}

function parseDefaultPairings(str) {
  const obj = { sides: [], beverages: [], dessert: [] };
  const sidesM = str.match(/sides:\s*(\[[^\]]*\])/);
  if (sidesM) obj.sides = parseArray(sidesM[1]);
  const bevM = str.match(/beverages:\s*(\[[^\]]*\])/);
  if (bevM) obj.beverages = parseArray(bevM[1]);
  const dessertM = str.match(/dessert:\s*(\[[^\]]*\])/);
  if (dessertM) obj.dessert = parseArray(dessertM[1]);
  return obj;
}

function findBackward(idx, key) {
  const re = new RegExp(`\\b${key}:\\s*'(?:[^'\\\\]|\\\\.)*'`);
  for (let i = idx; i >= Math.max(0, idx - 30); i--) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('*')) continue;
    const m = line.match(re);
    if (m) return cleanStr(m[0].split(':')[1]);
  }
  return null;
}

function findBackwardArray(idx, key) {
  const re = new RegExp(`\\b${key}:\\s*(\\[[^\\]]*\\])`);
  for (let i = idx; i >= Math.max(0, idx - 30); i--) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('*')) continue;
    const m = line.match(re);
    if (m) return parseArray(m[1]);
  }
  return [];
}

// ─── Normalization (mirrors app logic) ───────────────────────────────────────

const BUTTERMILK_ALIASES = new Set([
  'chaas', 'buttermilk', 'matha', 'moru', 'lassi', 'sweet lassi',
  'salted lassi', 'masala chaas',
]);
const WHEAT_ALIASES = new Set([
  'roti', 'chapati', 'tawa roti', 'tandoori roti', 'rumali roti',
  'missi roti', 'plain roti', 'tandoori', 'naan', 'butter naan',
  'garlic naan', 'tandoori naan', 'special naan', 'paratha',
  'aloo paratha', 'gobi paratha', 'paneer paratha', 'masala paratha',
  'plain paratha', 'lacha paratha', 'wheat roti', 'wheat chapati',
  'atta roti', 'atta chapati', 'phulka', 'phulka roti',
]);
const CORN_ALIASES = new Set([
  'makki di roti', 'makki', 'makai', 'corn roti', 'corn',
  'maize roti', 'maize', 'makai di roti',
]);
const MILLET_ALIASES = new Set([
  'bajra roti', 'bajra', 'pearl millet', 'jowar roti', 'jowar', 'sorghum',
  'ragi roti', 'ragi', 'finger millet', 'nachni', 'nachni roti',
  'kodo roti', 'kodo', 'kodo ko roti', 'kodo millet', 'millet roti', 'multigrain roti',
]);
const RICE_ALIASES = new Set([
  'rice', 'chawal', 'steamed rice', 'jeera rice', 'basmati', 'steamed basmati',
  'pulao', 'pilaf', 'biryani', 'fried rice', 'lemon rice', 'curd rice',
  'coconut rice', 'tamarind rice', 'sambar rice', 'rice-biryani',
  'idli', 'idli rice', 'pongal', 'pongal rice', 'dosa', 'appam',
  'rice roti', 'akki roti',
]);
const BREAD_ALIASES = new Set([
  'bread', 'pav', 'pao', 'bun', 'roll', 'plain bread',
  'thepla', 'methi thepla', 'bhakri', 'thalipeeth', 'rotla', 'dhebra',
  'kulcha', 'batura', 'bhatura', 'bhature',
  'roomali', 'rumal',
  'puri', 'poori', 'luchi',
  'baati', 'bafla', 'bati',
]);

function normalize(name) {
  const lower = name.toLowerCase().trim();
  if (BUTTERMILK_ALIASES.has(lower)) return 'Buttermilk';
  if (WHEAT_ALIASES.has(lower)) return 'Roti';
  if (CORN_ALIASES.has(lower)) return 'Corn Roti';
  if (MILLET_ALIASES.has(lower)) return 'Millet Roti';
  if (RICE_ALIASES.has(lower)) return 'Rice';
  if (BREAD_ALIASES.has(lower)) return 'Bread';
  if (['chai', 'masala chai', 'tea'].includes(lower)) return 'Chai';
  if (['coffee', 'filter coffee'].includes(lower)) return 'Coffee';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Dish name / ID keywords that mean the dish IS a carb (self-carbed)
const SELF_CARB_IDS = [
  'biryani', 'pulao', 'pilaf', 'fried-rice', 'lemon-rice', 'curd-rice',
  'coconut-rice', 'tamarind-rice', 'sambar-rice', 'tomato-rice',
  'rice-', '-rice', 'chawal', 'pula', 'pongal', 'khichdi',
  'pasta-', '-pasta', 'noodle', 'spaghetti', 'lasagna', 'penne',
  'macaroni', 'fettuccine', 'ravioli', 'tortellini',
  'pizza', 'burger', 'sandwich', 'wrap', 'burrito', 'shawarma',
  'taco', 'enchilada', 'quesadilla', 'fajita',
  'dosa', 'idli', 'appam', 'puttu', 'upma', 'poha',
  'paratha', 'naan', 'roti', 'phulka', 'chapati',
  'bread', 'pav', 'bun', 'roll-', 'bagel', 'croissant', 'bun-',
  'bhatura', 'kulcha', 'thepla', 'bhakri', 'thalipeeth',
  'puri', 'poori', 'luchi', 'baati', 'bafla', 'bati',
  'bajra', 'jowar', 'ragi', 'nachni', 'makki', 'millet',
  'mudde', 'dhindo', 'galho',
  'vada', 'bonda', 'pakora', 'chilla', 'bath', 'bhath', 'uttapam',
  'dhokla', 'appe', 'pesarattu', 'khandvi', 'muthiya',
  'gathiya', 'chorafali', 'khakhra', 'shankhali', 'dabeli', 'kachori',
  'litti', 'momo',
  'halwa', 'kheer', 'payasam', 'sandesh', 'barfi', 'ladoo',
  'shrikhand', 'basundi', 'mishti', 'sheer', 'custard', 'kulfi',
  'falooda', 'rabdi', 'rabri', 'pudding',
  'cake', 'pastry', 'muffin', 'cookie', 'biscuit',
  'pancake', 'french-toast', 'toast', 'chow-mein',
  'oat', 'oats', 'hash', 'potato-', '-potato',
  'nachos', 'nacho', 'sushi',
];
const SELF_CARB_NAME_KEYWORDS = [
  'rice', 'pulao', 'biryani', 'khichdi', 'pasta', 'noodle', 'spaghetti',
  'lasagna', 'penne', 'macaroni', 'fettuccine', 'pizza',
  'burger', 'sandwich', 'wrap', 'burrito', 'shawarma',
  'taco', 'enchilada', 'quesadilla', 'fajita',
  'dosa', 'idli', 'appam', 'puttu', 'upma', 'poha',
  'paratha', 'naan', 'roti', 'phulka', 'chapati', 'bread',
  'pav', 'bun', 'roll', 'bagel', 'croissant',
  'bhatura', 'kulcha', 'thepla', 'bhakri', 'thalipeeth',
  'puri', 'poori', 'luchi', 'baati', 'bafla', 'bati',
  'bajra', 'jowar', 'ragi', 'nachni', 'makki', 'millet',
  'mudde', 'dhindo', 'galho',
  'vada', 'bonda', 'pakora', 'chilla', 'bath', 'bhath', 'uttapam',
  'dhokla', 'appe', 'pesarattu', 'khandvi', 'muthiya',
  'gathiya', 'chorafali', 'khakhra', 'shankhali', 'dabeli', 'kachori',
  'litti', 'momo',
  'halwa', 'kheer', 'payasam', 'sandesh', 'barfi', 'ladoo',
  'shrikhand', 'basundi', 'mishti', 'sheer', 'custard', 'kulfi',
  'falooda', 'rabdi', 'rabri', 'pudding',
  'cake', 'pastry', 'muffin', 'cookie',
  'pancake', 'french toast', 'toast', 'chow mein',
  'oat', 'oats', 'hash', 'potato', 'aloo',
  'nacho', 'nachos', 'sushi', 'sushi bowl',
];

function isSelfCarbed(dish) {
  const id = (dish.id || '').toLowerCase();
  const name = (dish.name || '').toLowerCase();
  for (const kw of SELF_CARB_IDS) {
    if (id.includes(kw)) return true;
  }
  for (const kw of SELF_CARB_NAME_KEYWORDS) {
    if (name.includes(kw)) return true;
  }
  return false;
}

function hasCarbSide(dish) {
  if (!dish.dp) return false;
  return dish.dp.sides.some(s => isGrain(s));
}

function isGrain(name) {
  const lower = name.toLowerCase().trim();
  return WHEAT_ALIASES.has(lower) || MILLET_ALIASES.has(lower) ||
         CORN_ALIASES.has(lower) || RICE_ALIASES.has(lower) || BREAD_ALIASES.has(lower);
}

// ─── Extract dishes ──────────────────────────────────────────────────────────

const dishes = [];
const seenIds = new Set();

for (let i = 0; i < lines.length; i++) {
  const dpMatch = lines[i].match(/defaultPairings:\s*(\{[^}]*\})/);
  if (!dpMatch) continue;

  const id = findBackward(i, 'id');
  if (!id || seenIds.has(id)) continue;
  seenIds.add(id);

  const name = findBackward(i, 'name');
  const region = findBackward(i, 'region');
  const weight = findBackward(i, 'weight');
  const category = findBackwardArray(i, 'category');
  const tags = findBackwardArray(i, 'tags');
  const dp = parseDefaultPairings(dpMatch[1]);

  dishes.push({ id, name, region, weight, category, tags, dp, line: i + 1 });
}

console.log(`\n📦 Loaded ${dishes.length} dishes with defaultPairings\n`);

// ─── Audit Rules ─────────────────────────────────────────────────────────────

const HEAVY_TAGS = ['sabzi', 'gravy', 'dal', 'curry', 'paneer', 'mushroom', 'kofta', 'keema',
  'biryani', 'pulao', 'chole', 'rajma', 'kadhi', 'saag', 'bhaji', 'masala',
  'chicken', 'mutton', 'fish', 'egg', 'murg', 'salan'];

const SWEET_TAGS = ['dessert', 'sweet', 'halwa', 'kheer', 'sandesh', 'barfi', 'ladoo',
  'payasam', 'pudding', 'cake', 'pastry', 'muffin', 'cookie', 'ice-cream'];

const flags = [];

function flag(rule, d, msg) {
  flags.push({ rule, id: d.id, name: d.name || d.id, line: d.line,
    region: d.region, category: d.category.join(','), msg });
}

// ═════════════════════════════════════════════════════════════════════════════
// R1 — Chai with heavy lunch/dinner (sabzi, gravy, dal, curry, paneer, etc.)
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isLunchDinner = d.category.some(c => ['lunch', 'dinner'].includes(c));
  const isHeavy = d.weight === 'medium' || d.weight === 'heavy';
  const hasHeavyTag = d.tags.some(t => HEAVY_TAGS.includes(t));
  const hasChai = d.dp.beverages.some(b => normalize(b) === 'Chai');
  if (isLunchDinner && isHeavy && hasHeavyTag && hasChai) {
    const tags2 = d.tags.filter(t => HEAVY_TAGS.includes(t));
    flag('R1', d, `Heavy ${d.weight} ${d.region} lunch/dinner (${tags2.join(',')}) has Chai → Buttermilk`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R2 — Coffee with lunch/dinner (Coffee is breakfast/evening in India)
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isLunchDinner = d.category.some(c => ['lunch', 'dinner'].includes(c));
  const isBreakfast = d.tags.some(t => ['breakfast', 'light'].includes(t));
  const hasCoffee = d.dp.beverages.some(b => normalize(b) === 'Coffee');
  if (isLunchDinner && !isBreakfast && hasCoffee && d.dp.beverages.length > 0) {
    flag('R2', d, `Lunch/dinner with Coffee → Buttermilk`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R3 — Side–beverage cross-category collision (dedup will remove the side)
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp || !d.dp.sides.length || !d.dp.beverages.length) continue;
  const bevNormals = new Set(d.dp.beverages.map(b => normalize(b)));
  for (const side of d.dp.sides) {
    const sn = normalize(side);
    if (bevNormals.has(sn)) {
      flag('R3', d, `Side "${side}" → "${sn}" matches beverage — silently removed by dedup`);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R4 — Missing dairy (curd/raita/buttermilk) with heavy lunch/dinner
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  if (!d.category.some(c => ['lunch', 'dinner'].includes(c))) continue;
  if (d.weight !== 'medium' && d.weight !== 'heavy') continue;
  const hasDairy = [...d.dp.sides, ...d.dp.beverages].some(s => {
    const lower = s.toLowerCase();
    return ['curd', 'raita', 'yogurt', 'dahi', 'butter', 'ghee', 'buttermilk',
            'chaas', 'lassi', 'sweet lassi', 'paneer'].includes(lower) ||
           normalize(s) === 'Buttermilk';
  });
  if (!hasDairy) {
    flag('R4', d, `Heavy lunch/dinner without dairy (curd/raita/buttermilk)`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R5 — Masala Chai / Sweet Lassi with savory heavy meal
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isLunchDinner = d.category.some(c => ['lunch', 'dinner'].includes(c));
  const isHeavy = d.weight === 'medium' || d.weight === 'heavy';
  const isSavory = !d.tags.some(t => SWEET_TAGS.includes(t));
  const hasSweetBev = d.dp.beverages.some(b => {
    const lower = b.toLowerCase();
    return lower === 'masala chai' || lower === 'sweet lassi';
  });
  if (isLunchDinner && isHeavy && hasSweetBev && isSavory) {
    flag('R5', d, `Masala Chai/Sweet Lassi with savory heavy meal → Buttermilk`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R6 — Region carb-side missing (north lunch/dinner → roti; south → rice)
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp || !d.dp.sides.length) continue;
  if (!d.category.some(c => ['lunch', 'dinner'].includes(c))) continue;
  const sidesNorm = d.dp.sides.map(s => normalize(s));
  const carbLike = ['Roti', 'Naan', 'Paratha', 'Phulka', 'Chapati', 'Butter Naan',
    'Garlic Naan', 'Tandoori Roti', 'Missi Roti', 'Rumali Roti', 'Plain Roti',
    'Tawa Roti', 'Wheat Roti', 'Atta Roti', 'Millet Roti', 'Corn Roti',
    'Bhatura', 'Kulcha', 'Pav', 'Bhakri', 'Thepla', 'Bread', 'Rice', 'Pulao', 'Biryani'];
  const hasCarb = sidesNorm.some(s => carbLike.includes(s));
  if (d.region === 'north' && !hasCarb) {
    flag('R6', d, `North lunch/dinner missing roti/rice in sides (has: ${d.dp.sides.join(',')})`);
  }
  if (d.region === 'south' && !hasCarb) {
    flag('R6', d, `South lunch/dinner missing rice in sides (has: ${d.dp.sides.join(',')})`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R7 — Wrong region-specific sides
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const sl = d.dp.sides.map(s => s.toLowerCase());
  if (d.region === 'north' && sl.some(s => ['idli','dosa','appam','puttu','upma'].includes(s))) {
    flag('R7', d, `North dish has South-specific side (idli/dosa/appam)`);
  }
  if (d.region === 'south' && sl.some(s => s.includes('paratha') || s === 'naan')) {
    flag('R7', d, `South dish has North-specific side (paratha/naan)`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R8 — Missing beverages for lunch/dinner
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isLunchDinner = d.category.some(c => ['lunch', 'dinner'].includes(c));
  const isBeverage = d.tags.some(t => ['beverage','shake','juice','smoothie'].includes(t));
  if (isLunchDinner && !isBeverage && d.dp.beverages.length === 0) {
    flag('R8', d, `Lunch/dinner dish has NO beverages`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R9 — Duplicate normalized sides
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const seen = new Set();
  for (const side of d.dp.sides) {
    const n = normalize(side);
    if (seen.has(n)) flag('R9', d, `Duplicate side "${side}" → "${n}"`);
    seen.add(n);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R10 — Only condiments as sides (no carb base) — REFINED: skip self-carbed dishes
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp || !d.dp.sides.length) continue;
  if (!d.category.some(c => ['lunch','dinner','breakfast','snacks'].includes(c))) continue;
  // Skip chaat/snack items — they don't need carb sides
  if (d.tags.some(t => ['chaat','snacks','street food','fried'].includes(t))) continue;
  // Skip dishes that are themselves a carb (biryani, pasta, burger, etc.)
  if (isSelfCarbed(d)) continue;
  // Skip dishes whose name includes their side carb (e.g., "Dal + Rice")
  const nameLower = (d.name || '').toLowerCase();
  if (nameLower.includes('+ rice') || nameLower.includes('+ roti') || nameLower.includes('+ naan')) continue;

  const hasGrainSide = d.dp.sides.some(s => isGrain(s));
  if (hasGrainSide) continue;

  // Check if explicitly not needing carbs
  const standaloneTags = ['beverage','sweet-dessert','bread','side','snacks','chaat'];
  const standaloneNames = ['chilla','soup','salad','smoothie','juice','shake','lassi','chaas',
    'coffee','tea','chai','thukpa','noodle','stir-fry',
    'shrikhand','basundi','mishti','sandesh','sheer','custard','kulfi',
    'falooda','rabri','pudding','mousse','ice cream','sorbet','cake',
    'pastry','muffin','cookie','biscuit'];
  const isStandalone = d.tags.some(t => standaloneTags.includes(t)) ||
    standaloneNames.some(kw => (d.name || '').toLowerCase().includes(kw)) ||
    d.dp.sides.every(s => {
      const lower = s.toLowerCase();
      return ['biscuits','cookies','rusk','bun maska','roasted peanuts',
              'saffron','dry fruit mix','dry fruits / nuts','mixed nuts','honey',
              'pistachios','almonds','maple syrup','fresh berries'].includes(lower);
    });
  if (isStandalone) continue;

  flag('R10', d, `No carb side for non-self-carbed dish (sides: ${d.dp.sides.join(',')})`);
}

// ═════════════════════════════════════════════════════════════════════════════
// R11 — region 'all' dishes with stale/inappropriate Indian sides
//     (fusion/global dishes using Papad/Pickle when they should have global sides)
// ═════════════════════════════════════════════════════════════════════════════
const GLOBAL_DISH_NAMES = [
  'pasta', 'spaghetti', 'lasagna', 'penne', 'macaroni', 'fettuccine',
  'pizza', 'burger', 'sandwich', 'wrap', 'burrito', 'shawarma',
  'taco', 'enchilada', 'quesadilla', 'fajita', 'nacho',
  'soup', 'salad', 'toast', 'bagel', 'croissant', 'donut',
  'smoothie', 'bowl', 'stir-fry', 'chow mein', 'spring roll',
  'sushi', 'ramen', 'pho', 'dim sum', 'dumpling',
  'tofu', 'vegan', 'keto', 'protein',
];
const STALE_INDIAN_SIDES = ['papad', 'pickle', 'chutney', 'lemon wedge', 'green chutney',
  'sweet chutney', 'roasted peanuts', 'coriander leaves', 'chopped onions', 'onion'];

for (const d of dishes) {
  if (!d.dp || !d.dp.sides.length) continue;
  if (d.region !== 'all') continue;
  const nameLower = (d.name || '').toLowerCase();
  const isGlobal = GLOBAL_DISH_NAMES.some(kw => nameLower.includes(kw));
  if (!isGlobal) continue;

  const staleSides = d.dp.sides.filter(s => STALE_INDIAN_SIDES.includes(s.toLowerCase()));
  if (staleSides.length > 0) {
    flag('R11', d, `"all" region global dish has stale Indian sides (${staleSides.join(',')})`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R12 — Sweet/dessert dishes missing dessert in defaultPairings
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isSweet = d.tags.some(t => SWEET_TAGS.includes(t)) ||
    d.category.some(c => ['dessert','sweets'].includes(c));
  if (!isSweet) continue;
  if (!d.dp.dessert || d.dp.dessert.length === 0) {
    flag('R12', d, `Sweet/dessert dish has NO dessert in defaultPairings`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R13 — region 'all' dishes with region-specific sides
//     (e.g., Gujarati Dal tagged 'all' but has North-style sides)
// ═════════════════════════════════════════════════════════════════════════════
const REGION_CUES = {
  north: { sides: ['roti','naan','paratha','phulka','chapati','paneer','rajma','chole','dal'], beverages: ['buttermilk','lassi'] },
  south: { sides: ['rice','sambar','chutney','dosa','idli','appam','puttu','papad'], beverages: ['coffee','buttermilk','moru'] },
  east:  { sides: ['rice','luchi','machher jhol','shukto','cholar dal'], beverages: ['buttermilk','lassi'] },
  west:  { sides: ['roti','rice','thepla','bhakri','dhokla','kadhi'], beverages: ['chaas','buttermilk'] },
  central: { sides: ['roti','rice','bhature','kulcha','dal','baati'], beverages: ['buttermilk','lassi'] },
  northeast: { sides: ['rice','steamed greens','bamboo shoot','fermented'], beverages: ['apong','chhang','zutho'] },
};

for (const d of dishes) {
  if (!d.dp || d.region !== 'all') continue;
  // Skip fusion/global dishes — they're intentionally regionless
  const nameLower = (d.name || '').toLowerCase();
  if (GLOBAL_DISH_NAMES.some(kw => nameLower.includes(kw))) continue;

  const sidesLower = d.dp.sides.map(s => s.toLowerCase());
  const bevLower = d.dp.beverages.map(b => b.toLowerCase());
  // Check each region cue to see if the dish strongly aligns with a specific region
  for (const [region, cues] of Object.entries(REGION_CUES)) {
    const sideMatch = cues.sides.filter(c => sidesLower.some(s => s.includes(c))).length;
    const bevMatch = cues.beverages.filter(c => bevLower.some(b => b.includes(c))).length;
    if (sideMatch >= 2 || (sideMatch >= 1 && bevMatch >= 1)) {
      flag('R13', d, `"all" dish strongly cues "${region}" (sides: ${d.dp.sides.join(',')}, bev: ${d.dp.beverages.join(',')}) — should have explicit region`);
      break;
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R14 — South Indian breakfast missing Sambar/Coconut Chutney
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  if (d.region !== 'south') continue;
  const isBreakfast = d.category.some(c => ['breakfast'].includes(c)) ||
    d.tags.some(t => ['breakfast','light','idli','dosa'].includes(t));
  if (!isBreakfast) continue;
  const sidesLower = d.dp.sides.map(s => s.toLowerCase());
  if (!sidesLower.some(s => s.includes('sambar')) && !sidesLower.some(s => s.includes('chutney'))) {
    flag('R14', d, `South breakfast missing Sambar/Chutney in sides (has: ${d.dp.sides.join(',')})`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// R15 — Breakfast dishes missing Chai/Coffee
// ═════════════════════════════════════════════════════════════════════════════
for (const d of dishes) {
  if (!d.dp) continue;
  const isBreakfast = d.category.some(c => ['breakfast'].includes(c));
  if (!isBreakfast) continue;
  const isBeverage = d.tags.some(t => ['beverage','shake','juice','smoothie'].includes(t));
  if (isBeverage) continue;
  const hasBreakfastBev = d.dp.beverages.some(b => {
    const norm = normalize(b);
    return norm === 'Chai' || norm === 'Coffee' || norm === 'Buttermilk' || norm === 'Milk';
  });
  if (!hasBreakfastBev && d.dp.beverages.length > 0) {
    flag('R15', d, `Breakfast dish with non-standard beverage (${d.dp.beverages.join(',')})`);
  }
  if (!hasBreakfastBev && d.dp.beverages.length === 0) {
    flag('R15', d, `Breakfast dish has NO beverage`);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const byRegion = {};
const byRule = {};

for (const f of flags) {
  byRegion[f.region] = (byRegion[f.region] || 0) + 1;
  byRule[f.rule] = (byRule[f.rule] || 0) + 1;
}

const ruleNames = {
  R1: 'Chai with heavy lunch/dinner',
  R2: 'Coffee with lunch/dinner',
  R3: 'Side–beverage cross-collision',
  R4: 'Missing dairy with heavy meal',
  R5: 'Sweet bev with savory meal',
  R6: 'Region carb-side missing',
  R7: 'Wrong region-specific side',
  R8: 'No beverage for lunch/dinner',
  R9: 'Duplicate normalized sides',
  R10: 'No carb side (non-self-carbed)',
  R11: 'Global dish, stale Indian sides',
  R12: 'Sweet dish, empty dessert',
  R13: 'all region cues specific region',
  R14: 'South breakfast no sambar/chutney',
  R15: 'Breakfast no Chai/Coffee',
};

console.log('═'.repeat(70));
console.log('📋  AUDIT SUMMARY');
console.log('═'.repeat(70));
console.log(`\nTotal dishes checked: ${dishes.length}`);
console.log(`Total flags raised:  ${flags.length}\n`);

console.log('─── By Rule (descending count) ───');
const sortedRules = Object.entries(byRule).sort((a, b) => b[1] - a[1]);
for (const [rule, count] of sortedRules) {
  console.log(`  ${rule.padEnd(5)} ${(ruleNames[rule] || '').padEnd(38)} ${count}`);
}

console.log(`\n─── By Region ───`);
const regionOrder = ['north', 'south', 'east', 'west', 'central', 'northeast', 'all', 'unknown'];
for (const r of regionOrder) {
  const cnt = byRegion[r];
  if (cnt) console.log(`  ${r.padEnd(12)} ${cnt}`);
}

// Print flags grouped by rule for clarity
console.log(`\n─── Flag Details ───`);
for (const [rule] of sortedRules) {
  const items = flags.filter(f => f.rule === rule);
  console.log(`\n  [${rule}] ${ruleNames[rule] || ''} (${items.length})`);
  for (const f of items) {
    const region = (f.region || '?').padEnd(10);
    const name = (f.name || f.id).padEnd(38).slice(0, 38);
    console.log(`    L${String(f.line).padEnd(5)} ${region} ${name} ${f.msg}`);
  }
}

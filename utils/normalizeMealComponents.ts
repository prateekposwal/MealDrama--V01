// ─────────────────────────────────────────────────────────────────────────────
// Kitchen Logic: 6-Family Macro Carb System + 2-Tier Dedup
// Maps culinary aliases to grain families, then to clean canonical names.
// Preserves specific names for known items (Missi Roti, Phulka, etc.)
// ─────────────────────────────────────────────────────────────────────────────

import { memoize } from './memoize';

// ─── 6-FAMILY GRAIN MAPS ─────────────────────────────────────────────────────

// Family 1: Wheat (generic roti, chapati, naan, paratha, phulka)
const WHEAT_ALIASES = new Set([
  'roti', 'chapati', 'tawa roti', 'tandoori roti', 'rumali roti',
  'missi roti', 'plain roti', 'tandoori',
  'naan', 'butter naan', 'garlic naan', 'tandoori naan', 'special naan',
  'paratha', 'aloo paratha', 'gobi paratha', 'paneer paratha',
  'masala paratha', 'plain paratha', 'lacha paratha',
  'wheat roti', 'wheat chapati', 'atta roti', 'atta chapati',
  'phulka', 'phulka roti',
]);

// Family 2: Millet (bajra, jowar, ragi, kodo, makka, etc.)
const MILLET_ALIASES = new Set([
  'bajra roti', 'bajra', 'pearl millet',
  'jowar roti', 'jowar', 'sorghum',
  'ragi roti', 'ragi', 'finger millet', 'nachni', 'nachni roti',
  'kodo roti', 'kodo', 'kodo ko roti', 'kodo millet',
  'barnyard millet', 'sanwa', 'jhona',
  'little millet', 'kutki',
  'foxtail millet', 'kangni', 'kakum',
  'proso millet', 'cheena', 'barri',
  'millet roti', 'multigrain roti',
]);

// Family 3: Rice (chawal, steamed rice, idli, dosa, appam, etc.)
const RICE_ALIASES = new Set([
  'rice', 'chawal', 'steamed rice', 'jeera rice', 'basmati', 'steamed basmati',
  'pulao', 'pilaf', 'biryani', 'fried rice', 'lemon rice', 'curd rice',
  'coconut rice', 'tamarind rice', 'sambar rice', 'rice-biryani',
  'idli', 'idli rice', 'pongal', 'pongal rice', 'dosa', 'appam',
  'rice roti', 'akki roti',
]);

// Family 4: Corn/Maize (makki, corn, etc.)
const CORN_ALIASES = new Set([
  'makki di roti', 'makki', 'makai', 'corn roti', 'corn',
  'maize roti', 'maize', 'makai di roti',
]);

// Family 5: Oats/Other Grains (oats, quinoa, amaranth, etc.)
const OTHER_GRAIN_ALIASES = new Set([
  'oats roti', 'oats', 'oats chapati',
  'quinoa roti', 'quinoa',
  'amaranth roti', 'rajgira', 'ramdana',
  'buckwheat roti', 'kuttu', 'kuttu di roti',
  'singhara roti', 'singhara', 'water chestnut',
]);

// Family 6: Bread/Pav (bread, pav, bhakri, thepla, puri, etc.)
const BREAD_ALIASES = new Set([
  'bread', 'pav', 'pao', 'bun', 'roll', 'plain bread',
  'thepla', 'methi thepla',
  'bhakri', 'thalipeeth',
  'rotla', 'dhebra',
  'kulcha', 'batura', 'bhatura', 'bhature',
  'roomali', 'rumal',
  'puri', 'poori',
  'luchi',
  'baati', 'bafla', 'bati',
]);

// Non-carb categories
const BUTTERMILK_ALIASES = new Set([
  'chaas', 'buttermilk', 'matha', 'moru', 'lassi', 'sweet lassi',
  'salted lassi', 'masala chaas',
]);

const CHUTNEY_ALIASES = new Set([
  'chutney', 'coconut chutney', 'mint chutney', 'tamarind chutney',
  'green chutney', 'mixed chutney', 'coriander chutney', 'onion chutney',
]);

const BEVERAGE_ALIASE = new Map([
  ['filter coffee', 'Coffee'],
  ['masala chai', 'Chai'],
  ['ginger lemon', 'Ginger Lemon'],
  ['jaljeera', 'Jaljeera'],
  ['aam panna', 'Aam Panna'],
  ['coconut water', 'Coconut Water'],
  ['nimbu pani', 'Nimbu Pani'],
  ['sol kadhi', 'Sol Kadhi'],
  ['badam milk', 'Badam Milk'],
  ['seasonal fruit juice', 'Fruit Juice'],
  ['mango lassi', 'Mango Lassi'],
  ['green tea', 'Green Tea'],
  ['chai', 'Chai'],
  ['tea', 'Tea'],
  ['coffee', 'Coffee'],
  ['water', 'Water'],
  ['milk', 'Milk'],
]);

// ─── 2-TIER NORMALIZATION ────────────────────────────────────────────────────

// Tier 1: Detect grain family
function detectGrainFamily(lower: string): string | null {
  if (WHEAT_ALIASES.has(lower)) return 'Wheat';
  if (MILLET_ALIASES.has(lower)) return 'Millet';
  if (RICE_ALIASES.has(lower)) return 'Rice';
  if (CORN_ALIASES.has(lower)) return 'Corn';
  if (OTHER_GRAIN_ALIASES.has(lower)) return 'Other Grain';
  if (BREAD_ALIASES.has(lower)) return 'Bread';
  return null;
}

// Tier 2: Map to clean canonical display name (preserves specific names)
function toCanonicalName(lower: string, family: string): string {
  switch (family) {
    case 'Wheat':
      // Specific names first
      if (lower === 'phulka' || lower === 'phulka roti') return 'Phulka';
      if (lower === 'missi roti') return 'Missi Roti';
      if (lower === 'tandoori roti') return 'Tandoori Roti';
      if (lower === 'rumali roti') return 'Rumali Roti';
      if (lower === 'plain roti') return 'Plain Roti';
      if (lower === 'tawa roti') return 'Tawa Roti';
      if (lower === 'chapati') return 'Chapati';
      if (lower === 'atta roti' || lower === 'atta chapati') return 'Atta Roti';
      if (lower === 'wheat roti' || lower === 'wheat chapati') return 'Wheat Roti';
      if (lower === 'roti') return 'Roti';
      if (lower === 'tandoori') return 'Tandoori';
      // Naan variants
      if (lower === 'garlic naan') return 'Garlic Naan';
      if (lower === 'butter naan') return 'Butter Naan';
      if (lower === 'tandoori naan') return 'Tandoori Naan';
      if (lower === 'special naan') return 'Naan';
      if (lower.includes('naan')) return 'Naan';
      // Paratha variants
      if (lower === 'aloo paratha') return 'Aloo Paratha';
      if (lower === 'gobi paratha') return 'Gobi Paratha';
      if (lower === 'paneer paratha') return 'Paneer Paratha';
      if (lower === 'masala paratha') return 'Masala Paratha';
      if (lower === 'lacha paratha') return 'Lacha Paratha';
      if (lower === 'plain paratha') return 'Plain Paratha';
      if (lower.includes('paratha')) return 'Paratha';
      return 'Roti';
    case 'Millet':
      if (lower.includes('bajra') || lower.includes('pearl millet')) return 'Millet Roti';
      if (lower.includes('jowar') || lower.includes('sorghum')) return 'Millet Roti';
      if (lower.includes('ragi') || lower.includes('finger millet') || lower.includes('nachni')) return 'Millet Roti';
      if (lower.includes('kodo') || lower.includes('kodo ko')) return 'Millet Roti';
      return 'Millet Roti';
    case 'Rice':
      if (lower.includes('idli') || lower.includes('dosa') || lower.includes('appam')) return 'Rice';
      if (lower.includes('biryani') || lower.includes('pulao') || lower.includes('pilaf')) return 'Rice';
      return 'Rice';
    case 'Corn':
      return 'Corn Roti';
    case 'Other Grain':
      if (lower.includes('oats')) return 'Oats Roti';
      if (lower.includes('quinoa')) return 'Quinoa Roti';
      if (lower.includes('amaranth') || lower.includes('rajgira') || lower.includes('ramdana')) return 'Rajgira Roti';
      if (lower.includes('buckwheat') || lower.includes('kuttu')) return 'Kuttu Roti';
      if (lower.includes('singhara')) return 'Singhara Roti';
      return 'Other Grain Roti';
    case 'Bread':
      if (lower.includes('thepla')) return 'Thepla';
      if (lower.includes('bhakri') || lower.includes('thalipeeth')) return 'Bhakri';
      if (lower.includes('kulcha')) return 'Kulcha';
      if (lower.includes('bhatura') || lower.includes('batura') || lower.includes('bhature')) return 'Bhatura';
      if (lower.includes('pav') || lower.includes('pao')) return 'Pav';
      if (lower.includes('puri') || lower.includes('poori')) return 'Puri';
      if (lower.includes('luchi')) return 'Luchi';
      if (lower.includes('baati') || lower.includes('bafla') || lower.includes('bati')) return 'Baati';
      return 'Bread';
    default:
      return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}

// Main normalization entry point
export function normalizeCategory(item: string): string {
  const lower = item.toLowerCase().trim();

  // Check non-carb categories first
  if (BUTTERMILK_ALIASES.has(lower)) return 'Buttermilk';
  if (CHUTNEY_ALIASES.has(lower)) return 'Chutney';
  if (BEVERAGE_ALIASE.has(lower)) return BEVERAGE_ALIASE.get(lower)!;

  // 2-tier carb normalization
  const family = detectGrainFamily(lower);
  if (family) return toCanonicalName(lower, family);

  // Capitalize first letter for display
  return item.charAt(0).toUpperCase() + item.slice(1);
}

export function isCarb(item: string): boolean {
  const lower = item.toLowerCase().trim();
  return detectGrainFamily(lower) !== null;
}

export function isBeverage(item: string): boolean {
  const lower = item.toLowerCase().trim();
  return BUTTERMILK_ALIASES.has(lower) ||
    ['water', 'chai', 'tea', 'coffee', 'filter coffee', 'masala chai',
      'ginger lemon', 'jaljeera', 'aam panna', 'coconut water',
      'nimbu pani', 'sol kadhi', 'badam milk', 'seasonal fruit juice',
      'mango lassi', 'green tea', 'milk'].includes(lower);
}

// Deduplicate sides by category, cap at 2
export function deduplicateSides(sides: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const side of sides) {
    const category = normalizeCategory(side);
    if (!seen.has(category)) {
      seen.add(category);
      result.push(category);
      if (result.length >= 2) break;
    }
  }

  return result;
}

// Pick best carb from options (prefer roti for North, rice for South/East/West)
export function pickBestCarb(carbs: string[], region?: string): string | null {
  if (carbs.length === 0) return null;

  const isNorth = region === 'north' || region === 'central';
  const isSouthEastWest = ['south', 'east', 'west', 'northeast'].includes(region || '');

  // Check for roti options first (wheat/millet/corn/other grain)
  const rotiOptions = carbs.filter(c => {
    const family = detectGrainFamily(c.toLowerCase());
    return family && family !== 'Rice' && family !== 'Bread';
  });
  const riceOptions = carbs.filter(c => detectGrainFamily(c.toLowerCase()) === 'Rice');
  const breadOptions = carbs.filter(c => detectGrainFamily(c.toLowerCase()) === 'Bread');

  if (isNorth && rotiOptions.length > 0) return normalizeCategory(rotiOptions[0]!);
  if (isSouthEastWest && riceOptions.length > 0) return normalizeCategory(riceOptions[0]!);

  // Fallback: return first carb
  return normalizeCategory(carbs[0]!);
}

// Pick best beverage
export function pickBestBeverage(beverages: string[]): string | null {
  if (beverages.length === 0) return null;
  return beverages.length > 0 ? normalizeCategory(beverages[0]!) : null;
}

// Check if a normalized carb is roti-like (non-rice, non-bread)
export function isRotiLike(normalized: string): boolean {
  return ['Roti', 'Wheat Roti', 'Millet Roti', 'Corn Roti', 'Oats Roti', 'Quinoa Roti',
    'Rajgira Roti', 'Kuttu Roti', 'Singhara Roti', 'Other Grain Roti',
    'Phulka', 'Missi Roti', 'Tandoori Roti', 'Rumali Roti', 'Plain Roti', 'Tawa Roti',
    'Chapati', 'Atta Roti', 'Tandoori',
    'Naan', 'Butter Naan', 'Garlic Naan', 'Tandoori Naan',
    'Paratha', 'Aloo Paratha', 'Gobi Paratha', 'Paneer Paratha', 'Masala Paratha', 'Lacha Paratha', 'Plain Paratha'].includes(normalized);
}

// Check if a normalized carb is bread-like
export function isBreadLike(normalized: string): boolean {
  return ['Bread', 'Thepla', 'Bhakri', 'Kulcha', 'Bhatura', 'Pav', 'Puri', 'Luchi', 'Baati'].includes(normalized);
}

// Check if dish name implies it already has carbs
export function dishImpliesCarb(dishName: string): boolean {
  const lower = dishName.toLowerCase();
  const carbKeywords = [
    'chawal', 'rice', 'pulao', 'biryani', 'khichdi', 'dosa', 'idli',
    'paratha', 'appam', 'puttu', 'upma', 'poha', 'noodles', 'pasta',
    'thukpa', 'chow mein', 'fried rice', 'steamed rice', 'jeera rice',
    'basmati', 'sambar rice', 'lemon rice', 'curd rice',
    // Roti/naan variants
    'roti', 'phulka', 'chapati', 'naan', 'butter naan', 'garlic naan',
    'tandoori roti', 'rumali roti', 'missi roti', 'lacha paratha',
    'plain roti', 'tandoori', 'thepla', 'bhakri',
    // Bread variants
    'puri', 'poori', 'luchi', 'baati', 'bafla', 'bati',
    'pav', 'pao', 'bun', 'kulcha', 'bhature',
    // Lentil/rice batter — self-carbed
    'vada', 'bonda', 'pakora', 'chilla',
    'bath', 'bhath', 'uttapam', 'dhokla', 'appe', 'pesarattu', 'khandvi',
    'muthiya', 'gathiya', 'chorafali', 'khakhra', 'shankhali',
    // Breakfast/grain-based
    'pancake', 'french toast', 'oats', 'oatmeal', 'granola', 'muesli',
    'banana bread', 'muffin', 'toast',
    // Protein + bun/patty
    'burger', 'dabeli', 'lilva kachori',
    // Potato-based (carbs)
    'hash', 'potato', 'aloo', 'gratin',
    // Noodle/rice bowls
    'sushi bowl', 'rice bowl', 'noodle bowl',
    // Millet variants
    'bajra', 'jowar', 'ragi', 'kodo', 'nachni', 'finger millet',
    'kodo ko roti', 'makki di roti', 'makki',
    // "with X" patterns
    'with roti', 'with phulka', 'with naan', 'with chapati', 'with paratha',
    'with tandoori roti', 'with butter naan', 'with garlic naan',
    'with bajra roti', 'with jowar roti', 'with ragi roti',
    'with kodo roti', 'with kodo ko roti', 'with makki di roti',
    'with puri', 'with luchi', 'with baati', 'with bafla',
  ];
  return carbKeywords.some(kw => lower.includes(kw));
}

// Check if dish is standalone (doesn't need carbs)
export function isStandaloneDish(dishName: string, tags?: string[]): boolean {
  const lower = dishName.toLowerCase();
  const standaloneKeywords = [
    'chilla', 'besan chilla', 'oats chilla', 'sprouts chilla',
    'thukpa', 'soup', 'noodle', 'stir-fry', 'salad', 'smoothie',
    'juice', 'shake', 'lassi', 'chaas', 'coffee', 'tea', 'chai',
    'dessert', 'sweet', 'cake', 'halwa', 'kheer', 'payasam',
    'shrikhand', 'basundi', 'mishti doi', 'sandesh', 'sheer khurma',
    'custard', 'barfi', 'kulfi', 'falooda', 'rabdi', 'rabri',
    'pudding', 'mousse', 'ice cream', 'gelato', 'sorbet',
    'dosa', 'idli', 'appam', 'puttu', 'upma', 'poha',
    'vada', 'bonda', 'pakora',
  ];

  if (standaloneKeywords.some(kw => lower.includes(kw))) return true;
  if (tags?.some(t => ['beverage', 'sweet-dessert', 'bread', 'side', 'snacks', 'chaat'].includes(t))) return true;

  return false;
}

// Detect what carb is already embedded in the dish name (returns canonical name)
export function detectEmbeddedCarb(dishName: string): string | null {
  const lower = dishName.toLowerCase().trim();

  // Check grain families in priority order (most specific first)
  const grainKeywords: [string[], string][] = [
    // Millet variants
    [['bajra', 'pearl millet', 'bajra roti'], 'Millet Roti'],
    [['jowar', 'sorghum', 'jowar roti'], 'Millet Roti'],
    [['ragi', 'finger millet', 'nachni', 'ragi roti', 'nachni roti'], 'Millet Roti'],
    [['kodo', 'kodo ko roti', 'kodo millet', 'kodo roti'], 'Millet Roti'],
    // Corn variants
    [['makki di roti', 'makki', 'makai', 'corn roti', 'maize'], 'Corn Roti'],
    // Other grain variants
    [['oats roti', 'oats', 'oats chapati'], 'Oats Roti'],
    [['quinoa roti', 'quinoa'], 'Quinoa Roti'],
    [['rajgira', 'ramdana', 'amaranth roti'], 'Rajgira Roti'],
    [['kuttu', 'buckwheat roti', 'kuttu di roti'], 'Kuttu Roti'],
    [['singhara', 'singhara roti'], 'Singhara Roti'],
    // Bread variants
    [['thepla', 'methi thepla'], 'Thepla'],
    [['bhakri', 'thalipeeth'], 'Bhakri'],
    [['kulcha'], 'Kulcha'],
    [['bhatura', 'batura', 'bhature'], 'Bhatura'],
    [['pav', 'pao'], 'Pav'],
    [['puri', 'poori'], 'Puri'],
    [['luchi'], 'Luchi'],
    [['baati', 'bafla', 'bati'], 'Baati'],
    // Lentil/rice batter — self-carbed
    [['vada', 'bonda', 'pakora'], 'Vada'],
    [['chilla', 'besan chilla', 'oats chilla', 'methi chilla'], 'Chilla'],
    [['bath', 'bhath'], 'Bath'],
    [['uttapam'], 'Uttapam'],
    // Wheat variants (specific first)
    [['phulka', 'phulka roti'], 'Phulka'],
    [['missi roti'], 'Missi Roti'],
    [['tandoori roti'], 'Tandoori Roti'],
    [['rumali roti'], 'Rumali Roti'],
    [['naan', 'butter naan', 'garlic naan', 'tandoori naan'], 'Naan'],
    [['paratha', 'aloo paratha', 'gobi paratha', 'paneer paratha', 'masala paratha', 'lacha paratha'], 'Paratha'],
    [['roti', 'chapati', 'tawa roti', 'plain roti', 'tandoori'], 'Roti'],
    // "with X" patterns
    [['with bajra roti', 'with jowar roti', 'with ragi roti', 'with kodo', 'with kodo ko roti'], 'Millet Roti'],
    [['with makki di roti', 'with makki'], 'Corn Roti'],
    [['with oats roti', 'with oats'], 'Oats Roti'],
    [['with naan', 'with butter naan', 'with garlic naan'], 'Naan'],
    [['with paratha', 'with aloo paratha'], 'Paratha'],
    [['with phulka', 'with phulka roti'], 'Phulka'],
    [['with roti', 'with chapati', 'with tandoori roti'], 'Roti'],
    // Rice variants
    [['chawal', 'rice', 'pulao', 'biryani', 'khichdi', 'fried rice', 'steamed rice', 'jeera rice', 'basmati', 'sambar rice', 'lemon rice', 'curd rice', 'coconut rice', 'tamarind rice', 'rice-biryani'], 'Rice'],
  ];

  for (const [keywords, canonical] of grainKeywords) {
    if (keywords.some(kw => lower.includes(kw))) return canonical;
  }

  return null;
}

// Detect ALL carbs embedded in dish name (supports multi-carb dishes like "Rice & Roti")
export function detectAllEmbeddedCarbs(dishName: string): string[] {
  const lower = dishName.toLowerCase().trim();
  const found = new Set<string>();

  // Check each family independently
  const rotiKeywords = ['phulka', 'missi roti', 'tandoori roti', 'rumali roti', 'naan', 'butter naan', 'garlic naan', 'paratha', 'aloo paratha', 'roti', 'chapati', 'tawa roti', 'plain roti', 'tandoori'];
  const riceKeywords = ['chawal', 'rice', 'pulao', 'biryani', 'khichdi', 'fried rice', 'steamed rice', 'jeera rice', 'basmati'];
  const milletKeywords = ['bajra', 'jowar', 'ragi', 'kodo', 'nachni', 'finger millet'];
  const cornKeywords = ['makki', 'makai', 'corn', 'maize'];
  const breadKeywords = ['puri', 'poori', 'luchi', 'baati', 'bafla', 'bati', 'kulcha', 'bhatura', 'batura', 'bhature', 'thepla', 'bhakri', 'pav', 'pao'];
  const selfCarbKeywords = ['vada', 'bonda', 'pakora', 'chilla', 'bath', 'bhath', 'uttapam'];

  if (rotiKeywords.some(kw => lower.includes(kw))) found.add('Roti');
  if (riceKeywords.some(kw => lower.includes(kw))) found.add('Rice');
  if (milletKeywords.some(kw => lower.includes(kw))) found.add('Millet Roti');
  if (cornKeywords.some(kw => lower.includes(kw))) found.add('Corn Roti');
  if (breadKeywords.some(kw => lower.includes(kw))) found.add('Bread');
  if (selfCarbKeywords.some(kw => lower.includes(kw))) found.add('Batter');

  return Array.from(found);
}

// Memoized versions for performance-critical paths
export const normalizeCategoryMemo = memoize(normalizeCategory, 200);
export const detectEmbeddedCarbMemo = memoize(detectEmbeddedCarb, 200);

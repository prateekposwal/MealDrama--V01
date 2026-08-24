// ─────────────────────────────────────────────────────────────────────────────
// PAIRING CATALOG — the canonical bread / salad / default-carb palette per
// region. Single source of truth for BOTH the meal-customize modal ("user can
// change what he needs") AND applySmartDefaults ("a default perfect matching
// with dishes"). Every flatbread the product knows about lives here.
// ─────────────────────────────────────────────────────────────────────────────

export type PairingRegion = 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast';

/** All breads a user may pair with a dish, grouped region-first. */
export const REGION_BREADS: Record<PairingRegion, string[]> = {
  north: [
    'Roti', 'Naan', 'Paratha', 'Puri', 'Kulcha', 'Bhatura', 'Phulka',
    'Makki ki Roti', 'Rumali Roti', 'Amritsari Kulcha', 'Missi Roti',
    'Aloo Paratha', 'Gobi Paratha', 'Mooli Paratha', 'Paneer Paratha', 'Lachha Paratha',
    'Jowar Roti', 'Bajra Roti', 'Ragi Roti',
  ],
  west: [
    'Bhakri', 'Bajra Bhakri', 'Thepla', 'Puran Poli', 'Khakhra',
    'Roti', 'Naan', 'Paratha', 'Puri', 'Phulka', 'Appam Bread',
  ],
  south: [
    'Dosa', 'Masala Dosa', 'Appam', 'Idli', 'Uttapam',
    'Malabar Parotta', 'Akki Roti', 'Ragi Roti', 'Jolada Rotti', 'Pathiri',
    'Plain Dosa',
  ],
  east: [
    'Luchi', 'Puri', 'Paratha', 'Roti', 'Phulka', 'Chawal ki Roti',
    'Chilka Roti', 'Dhuska',
  ],
  central: [
    'Missi Roti', 'Baati', 'Bedmi Puri', 'Roti', 'Paratha', 'Puri', 'Bhatura', 'Naan', 'Phulka',
  ],
  northeast: [
    'Tingmo', 'Phaley', 'Dhuska', 'Roti', 'Puri', 'Paratha', 'Phulka',
  ],
};

/** Would-be-shared breads available across regions (kept out of duplicate rows). */
const GLOBAL_BREADS = ['Roti', 'Naan', 'Paratha', 'Puri', 'Phulka'];

/** Region-wise SALAD to pair with a dish by default (and available to add). */
export const REGION_SALADS: Record<PairingRegion, string> = {
  north: 'Kachumber Salad',
  south: 'Kosambari',
  east: 'Radish Cucumber Salad',
  west: 'Kakdi Koshimbir',
  central: 'Kachumber',
  northeast: 'Singju',
};

/** Extra regional salads users may add (beyond the default one). */
export const REGION_ALT_SALADS: Record<PairingRegion, string[]> = {
  north: ['Laccha Pyaaz', 'Cucumber Tomato Salad'],
  south: ['Moong Kosambari'],
  east: ['Black Salt Lime Salad'],
  west: [],
  central: ['Sprouted Moong Salad'],
  northeast: ['Radish Cucumber Salad'],
};

/** Per-region SIDES offered alongside the default salad.
 *  NOTE: only true accompaniments live here — full DISHES (Dal Makhani,
 *  Paneer Tikka, Dal Dhokli, Litti Chokha) are mains, never pairings. */
export const REGION_SIDES: Record<PairingRegion, string[]> = {
  north: ['Papad', 'Raita', 'Pickle', 'Chutney', 'Curd', 'Lemon Wedge', 'Mint Chutney'],
  south: ['Sambar', 'Coconut Chutney', 'Potato Palya', 'Appalam', 'Papad', 'Pickle', 'Raita', 'Curd', 'Tamarind Chutney'],
  east: ['Aloo Posto', 'Shukto', 'Papad', 'Pickle', 'Chutney', 'Curd', 'Raita'],
  west: ['Koshimbir', 'Farsan', 'Veg Dhokla', 'Khandvi', 'Papad', 'Pickle', 'Chutney', 'Raita', 'Curd'],
  central: ['Bhutte Ka Kees', 'Palak Ke Bhajiya', 'Sev Tamatar', 'Bhindi Aloo', 'Papad', 'Pickle', 'Chutney', 'Raita', 'Curd'],
  northeast: ['Alu Pitika', 'Bamboo Shoot Fry', 'Khar', 'Papad', 'Pickle', 'Chutney', 'Curd', 'Lemon Wedge', 'Bamboo Shoot'],
};

/**
 * Side terms that are really DISH mains, not accompaniments — templated
 * defaultPairings like `sides: ['Roti','Dal','Pickle']` on 30+ curries and
 * biryanis leak "Dal" into the pairing chips. Anything here is never offered
 * as a pairable side.
 */
export const DISH_SIDE_BLACKLIST = [
  'dal', 'dal makhani', 'paneer tikka', 'mixed vegetable pakora', 'mixed veg pakora',
  'litti chokha', 'dal dhokli',
];

/** True when `name` is a dish-main side term (blacklisted as a pairing). */
export function isRejectedSide(name: string): boolean {
  const l = (name || '').trim().toLowerCase();
  if (DISH_SIDE_BLACKLIST.includes(l)) return true;
  if (l === 'dal') return true;
  if (l.startsWith('dal ')) return true;
  return false;
}

/**
 * A dish that is a PURE SWEET (dessert/confection served only at snack time) —
 * e.g. Barfi, Gulab Jamun, Kulfi. These belong in dessert MATCHING options,
 * never as auto-suggested MEAL cards in "Try These" / tray seeding / rotation
 * ("TRY THESE is showing Barfi for north·Veg"). A sweet that doubles as a
 * breakfast/snack dish (fafda-jalebi etc.) is NOT pure and stays.
 */
export function isPureSweetDish(d: { tags?: string[]; category?: string[]; type?: string }): boolean {
  const tags = (d.tags ?? []).map(t => t.toLowerCase());
  const isSweet = tags.some(t => ['dessert', 'sweet', 'confection', 'mithai'].includes(t));
  if (!isSweet) return false;
  const cats = (d.category ?? [] as string[]).map(c => c.toLowerCase());
  return !cats.some(c => ['breakfast', 'lunch', 'dinner'].includes(c));
}

/** Region-wise BEVERAGES. */
export const REGION_BEVERAGES: Record<PairingRegion, string[]> = {
  north: ['Lassi', 'Sweet Lassi', 'Salted Lassi', 'Buttermilk', 'Chai', 'Masala Chai', 'Jaljeera', 'Water'],
  south: ['Filter Coffee', 'Buttermilk', 'Chaas', 'Chai', 'Nimbu Pani', 'Coconut Water', 'Water'],
  east: ['Aam Panna', 'Cha', 'Masala Chai', 'Buttermilk', 'Chaas', 'Water'],
  west: ['Sol Kadhi', 'Chaas', 'Buttermilk', 'Chai', 'Masala Chai', 'Lassi', 'Nimbu Pani', 'Water'],
  central: ['Mattha', 'Sugarcane Juice', 'Buttermilk', 'Chaas', 'Chai', 'Nimbu Pani', 'Water'],
  northeast: ['Assam Chai', 'Zu', 'Buttermilk', 'Lassi', 'Water', 'Green Tea'],
};

/** Region-wise RICE options: the first is the culturally-default pairing. */
export const REGION_RICE: Record<PairingRegion, string[]> = {
  north: ['Jeera Rice', 'Matar Pulao', 'Pulao', 'Biryani', 'Steamed Rice', 'Fried Rice'],
  south: ['Curd Rice', 'Lemon Rice', 'Steamed Rice', 'Sambar Rice', 'Coconut Rice', 'Biryani'],
  east: ['Ghee Bhat', 'Steamed Rice', 'Pulao', 'Biryani', 'Fried Rice', 'Lemon Rice'],
  west: ['Vaghareli Khichdi', 'Steamed Rice', 'Pulao', 'Biryani', 'Jeera Rice', 'Fried Rice'],
  central: ['Jeera Rice', 'Poha', 'Steamed Rice', 'Pulao', 'Biryani', 'Fried Rice'],
  northeast: ['Joha Rice', 'Black Rice', 'Steamed Rice', 'Pulao', 'Fried Rice'],
};

/** Region-wise DESSERTS (classic regional picks). */
export const REGION_DESSERTS: Record<PairingRegion, string[]> = {
  north: ['Gulab Jamun', 'Rabri', 'Kheer', 'Gajar Halwa', 'Jalebi', 'Rasmalai', 'Ice Cream'],
  south: ['Pal Payasam', 'Mysore Pak', 'Payasam', 'Kheer', 'Ice Cream', 'Phirni', 'Double ka Meetha'],
  east: ['Rosogolla', 'Chhena Poda', 'Kheer', 'Rasmalai', 'Ice Cream'],
  west: ['Shrikhand', 'Mohanthal', 'Gulab Jamun', 'Kheer', 'Ice Cream', 'Jalebi'],
  central: ['Jalebi', 'Mawa Bati', 'Kheer', 'Gulab Jamun', 'Ice Cream', 'Gajar Halwa'],
  northeast: ['Pitha', 'Payash', 'Kheer', 'Ice Cream', 'Payasam'],
};

/** The famous all-India sweets — offered as dessert pairings in EVERY region. */
export const GLOBAL_DESSERTS = [
  'Gulab Jamun', 'Kaju Katli', 'Ras Malai', 'Jalebi', 'Gajar Ka Halwa', 'Kulfi', 'Rasgulla',
];

/** State-wise traditional sweets (curated from the 29-state round-up) — fed
 *  into each region's dessert pairings so the *state* flavour shows too. */
export const REGION_STATE_DESSERTS: Record<PairingRegion, string[]> = {
  north: ['Pinni', 'Son Papdi', 'Balushahi', 'Churma', 'Malpua'],
  south: ['Mysore Pak', 'Kesari', 'Double Ka Meetha', 'Tirupati Laddu', 'Mysore Pak'],
  east: ['Sandesh', 'Mihidana', 'Khaja', 'Chenna Payesh', 'Silao Khaja'],
  west: ['Son Papdi', 'Panchamrut', 'Kesar Kaju Katli', 'Rajbhog', 'Mohanthal'],
  central: ['Khurma', 'Imarti', 'Kalakand', 'Malpua', 'Gud Ladoo'],
  northeast: ['Pitha', 'Chunga Pitha', 'Modak Payash', 'Zelia Pitha', 'Narikol Laru'],
};

/** The culturally-expected default carb for a region's main meals (lunch/dinner). */
export const REGION_DEFAULT_CARB: Record<PairingRegion, string> = {
  north: 'Wheat Roti',
  west: 'Bhakri',
  central: 'Roti',
  south: 'Steamed Rice',
  east: 'Steamed Rice',
  northeast: 'Steamed Rice',
};

// ─── Normalization helpers ───────────────────────────────────────────────────
const REGION_KEYS: PairingRegion[] = ['north', 'south', 'east', 'west', 'central', 'northeast'];

export function normalizeRegion(r?: string | null): PairingRegion {
  const key = (r || '').toLowerCase().replace(/ india$/, '').trim() as PairingRegion;
  return REGION_KEYS.includes(key) ? key : 'north';
}

/** Bread options offered to a user from THIS region (their breads + global). */
export function regionBreads(region?: string | null): string[] {
  const r = normalizeRegion(region);
  return [...new Set([...REGION_BREADS[r], ...GLOBAL_BREADS.filter(b => !REGION_BREADS[r].includes(b))])];
}

/** Side options offered to a user (their region salad leads, then region sides). */
export function regionSides(region?: string | null): string[] {
  const r = normalizeRegion(region);
  return [...new Set([REGION_SALADS[r], ...REGION_ALT_SALADS[r], ...REGION_SIDES[r]])];
}

/** Beverage options offered to a user. */
export function regionBeverages(region?: string | null): string[] {
  return REGION_BEVERAGES[normalizeRegion(region)];
}

/** Rice options offered to a user (region default first). */
export function regionRiceOptions(region?: string | null): string[] {
  return REGION_RICE[normalizeRegion(region)];
}

/** Dessert options offered to a user. */
export function regionDesserts(region?: string | null): string[] {
  const r = normalizeRegion(region);
  return [...new Set([...REGION_DESSERTS[r], ...REGION_STATE_DESSERTS[r], ...GLOBAL_DESSERTS])];
}

/**
 * Pairing chips for a category, guaranteed to include the currently-assigned
 * items — even when an assigned carb (embedded in the dish title, e.g.
 * "with Tandoori Roti") isn't part of the region catalog. Without this, a
 * titled bread rendered as an UNselected chip (the reported bug).
 */
export function pairingOptionsFor(
  region: string | null | undefined,
  category: string,
  assigned: string[],
): string[] {
  let base: string[];
  switch (category) {
    case 'bread': base = regionBreads(region); break;
    case 'sides': base = regionSides(region); break;
    case 'beverages': base = regionBeverages(region); break;
    case 'rice': base = regionRiceOptions(region); break;
    case 'dessert': base = regionDesserts(region); break;
    default: base = [];
  }
  return [...new Set([...base, ...(assigned ?? []).filter(Boolean)])];
}

/** Default salad for a region — the "perfect matching" side for main dishes. */
export function regionDefaultSalad(region?: string | null): string {
  return REGION_SALADS[normalizeRegion(region)];
}

/** Default RICE for a region's main meals (their first rice option). */
export function regionDefaultRice(region?: string | null): string {
  return REGION_RICE[normalizeRegion(region)][0]!;
}

/** Region-appropriate DEFAULT beverage, slot-aware (breakfast lighter, mains regional). */
export function regionDefaultBeverage(region?: string | null, slot?: string): string {
  const r = normalizeRegion(region);
  const s = (slot || '').toLowerCase();
  if (s === 'breakfast') {
    return r === 'south' ? 'Filter Coffee' : 'Chai';
  }
  if (s === 'snacks') {
    return r === 'south' ? 'Filter Coffee' : 'Chai';
  }
  const lunchDinner: Record<PairingRegion, string> = {
    north: 'Lassi',
    south: 'Filter Coffee',
    east: 'Aam Panna',
    west: 'Chaas',
    central: 'Mattha',
    northeast: 'Assam Chai',
  };
  return lunchDinner[r];
}

/** Default carb for a region's lunch/dinner. */
export function regionDefaultCarb(region?: string | null): string {
  return REGION_DEFAULT_CARB[normalizeRegion(region)];
}

/** Every bread in the catalog (for tests & complete pickers). */
export function allBreads(): string[] {
  const seen = new Set<string>();
  for (const r of REGION_KEYS) for (const b of REGION_BREADS[r]) seen.add(b);
  for (const b of GLOBAL_BREADS) seen.add(b);
  return [...seen];
}

/** Every region salad (for tests). */
export function allSalads(): string[] {
  return REGION_KEYS.map(r => REGION_SALADS[r]);
}
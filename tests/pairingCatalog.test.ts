import { describe, it, expect } from 'vitest';
import {
  REGION_BREADS, REGION_SALADS, REGION_DEFAULT_CARB,
  regionBreads, regionSides, regionDefaultSalad, regionDefaultCarb,
  regionBeverages, regionRiceOptions, regionDesserts,
  regionDefaultRice, regionDefaultBeverage,
  normalizeRegion, allBreads, allSalads, pairingOptionsFor, isRejectedSide, isPureSweetDish,
} from '../meal/constants/pairingCatalog';
import { isCarb, isRotiLike, isBreadLike } from '../utils/normalizeMealComponents';
import { DISH_LIBRARY } from '../meal/constants/dishLibrary';

describe('pairingCatalog — the user-requested bread inventory', () => {
  it('isCarb recognizes every catalog bread (guards bread-into-sides)', () => {
    for (const bread of allBreads()) {
      expect(isCarb(bread), bread).toBe(true);
    }
  });

  it('every region has BOTH a signature bread and the classics available', () => {
    const all = allBreads().map(b => b.toLowerCase());
    for (const region of Object.keys(REGION_BREADS) as (keyof typeof REGION_BREADS)[]) {
      const regional = regionBreads(region);
      expect(regional.length).toBeGreaterThanOrEqual(8);
      // The classics the user explicitly asked to see everywhere
      for (const classic of ['Roti', 'Naan', 'Paratha', 'Puri']) {
        expect(all.join('|').includes(classic.toLowerCase()) || regional.includes(classic), `${region}/${classic}`).toBe(true);
      }
    }
  });

  it('houses the specific regional breads the user listed', () => {
    expect(regionBreads('north')).toEqual(expect.arrayContaining(['Rumali Roti', 'Amritsari Kulcha', 'Makki ki Roti', 'Lachha Paratha', 'Missi Roti']));
    expect(regionBreads('west')).toEqual(expect.arrayContaining(['Bajra Bhakri', 'Puran Poli', 'Khakhra', 'Bhakri']));
    expect(regionBreads('south')).toEqual(expect.arrayContaining(['Malabar Parotta', 'Akki Roti', 'Ragi Roti', 'Jolada Rotti', 'Pathiri', 'Dosa']));
    expect(regionBreads('east')).toEqual(expect.arrayContaining(['Luchi', 'Chawal ki Roti', 'Chilka Roti', 'Dhuska']));
    expect(regionBreads('central')).toEqual(expect.arrayContaining(['Missi Roti', 'Baati', 'Bedmi Puri']));
    expect(regionBreads('northeast')).toEqual(expect.arrayContaining(['Tingmo', 'Phaley']));
  });

  it('region-wise salads are present and distinct', () => {
    expect(regionDefaultSalad('north')).toBe('Kachumber Salad');
    expect(regionDefaultSalad('south')).toBe('Kosambari');
    expect(regionDefaultSalad('east')).toBe('Radish Cucumber Salad');
    expect(regionDefaultSalad('west')).toBe('Kakdi Koshimbir');
    expect(regionDefaultSalad('central')).toBe('Kachumber');
    expect(regionDefaultSalad('northeast')).toBe('Singju');
  });

  it('DISHES are never offered as pairing sides (Dal Makhani / Paneer Tikka are mains)', () => {
    const north = regionSides('north');
    expect(north).not.toContain('Dal Makhani');
    expect(north).not.toContain('Paneer Tikka');
    for (const region of ['north', 'south', 'east', 'west', 'central', 'northeast'] as const) {
      const sides = regionSides(region);
      expect(sides).not.toContain('Dal Makhani');
      expect(sides).not.toContain('Paneer Tikka');
      expect(sides).not.toContain('Litti Chokha');
      expect(sides).not.toContain('Dal Dhokli');
    }
  });

  it('SIDES, BEVERAGES, RICE, DESSERT are all region-wise (the requested lists)', () => {
    // North
    expect(regionSides('north')).toEqual(expect.arrayContaining(['Laccha Pyaaz', 'Raita', 'Papad']));
    expect(regionBeverages('north')).toEqual(expect.arrayContaining(['Lassi', 'Sweet Lassi', 'Salted Lassi']));
    expect(regionRiceOptions('north').slice(0, 2)).toEqual(['Jeera Rice', 'Matar Pulao']);
    expect(regionDesserts('north')).toEqual(expect.arrayContaining(['Gulab Jamun', 'Rabri']));
    // South
    expect(regionSides('south')).toEqual(expect.arrayContaining(['Sambar', 'Coconut Chutney', 'Potato Palya', 'Appalam']));
    expect(regionBeverages('south')).toContain('Filter Coffee');
    expect(regionRiceOptions('south').slice(0, 2)).toEqual(['Curd Rice', 'Lemon Rice']);
    expect(regionDesserts('south')).toEqual(expect.arrayContaining(['Pal Payasam', 'Mysore Pak']));
    // East
    expect(regionSides('east')).toEqual(expect.arrayContaining(['Aloo Posto', 'Shukto']));
    expect(regionBeverages('east')).toEqual(expect.arrayContaining(['Aam Panna', 'Cha']));
    expect(regionRiceOptions('east')[0]).toBe('Ghee Bhat');
    expect(regionDesserts('east')).toEqual(expect.arrayContaining(['Rosogolla', 'Chhena Poda']));
    // West
    expect(regionSides('west')).toEqual(expect.arrayContaining(['Koshimbir', 'Farsan']));
    expect(regionBeverages('west')).toEqual(expect.arrayContaining(['Sol Kadhi', 'Chaas']));
    expect(regionRiceOptions('west')[0]).toBe('Vaghareli Khichdi');
    expect(regionDesserts('west')).toEqual(expect.arrayContaining(['Shrikhand', 'Mohanthal']));
    // Northeast
    expect(regionSides('northeast')).toEqual(expect.arrayContaining(['Alu Pitika', 'Bamboo Shoot Fry', 'Khar']));
    expect(regionBeverages('northeast')).toEqual(expect.arrayContaining(['Assam Chai', 'Zu']));
    expect(regionRiceOptions('northeast').slice(0, 2)).toEqual(['Joha Rice', 'Black Rice']);
    expect(regionDesserts('northeast')).toEqual(expect.arrayContaining(['Pitha', 'Payash']));
    // Central
    expect(regionSides('central')).toEqual(expect.arrayContaining(['Bhutte Ka Kees', 'Palak Ke Bhajiya', 'Sev Tamatar', 'Bhindi Aloo']));
    expect(regionBeverages('central')).toEqual(expect.arrayContaining(['Mattha', 'Sugarcane Juice']));
    expect(regionRiceOptions('central').slice(0, 2)).toEqual(['Jeera Rice', 'Poha']);
    expect(regionDesserts('central')).toEqual(expect.arrayContaining(['Jalebi', 'Mawa Bati']));
  });

  it('default rice & beverage are region-perfect', () => {
    expect(regionDefaultRice('north')).toBe('Jeera Rice');
    expect(regionDefaultRice('south')).toBe('Curd Rice');
    expect(regionDefaultRice('east')).toBe('Ghee Bhat');
    expect(regionDefaultRice('west')).toBe('Vaghareli Khichdi');
    expect(regionDefaultRice('central')).toBe('Jeera Rice');
    expect(regionDefaultRice('northeast')).toBe('Joha Rice');
    expect(regionDefaultBeverage('north', 'lunch')).toBe('Lassi');
    expect(regionDefaultBeverage('south', 'lunch')).toBe('Filter Coffee');
    expect(regionDefaultBeverage('west', 'dinner')).toBe('Chaas');
    expect(regionDefaultBeverage('central', 'dinner')).toBe('Mattha');
    expect(regionDefaultBeverage('east', 'lunch')).toBe('Aam Panna');
    expect(regionDefaultBeverage('northeast', 'lunch')).toBe('Assam Chai');
    expect(regionDefaultBeverage('south', 'breakfast')).toBe('Filter Coffee');
  });

  it('DESSERT matching includes the famous all-India sweets in EVERY region', () => {
    const famous = ['Gulab Jamun', 'Kaju Katli', 'Ras Malai', 'Jalebi', 'Gajar Ka Halwa', 'Kulfi', 'Rasgulla'];
    for (const region of ['north', 'south', 'east', 'west', 'central', 'northeast'] as const) {
      const desserts = regionDesserts(region);
      for (const sweet of famous) {
        expect(desserts, `${region}/${sweet}`).toContain(sweet);
      }
      // No duplicates in the dessert chips
      expect(new Set(desserts).size).toBe(desserts.length);
    }
    // State-wise sweets are present per region (the 29-state round-up)
    expect(regionDesserts('north')).toEqual(expect.arrayContaining(['Pinni', 'Son Papdi', 'Malpua']));
    expect(regionDesserts('south')).toEqual(expect.arrayContaining(['Mysore Pak', 'Tirupati Laddu', 'Kesari']));
    expect(regionDesserts('east')).toEqual(expect.arrayContaining(['Sandesh', 'Mihidana']));
    expect(regionDesserts('west')).toEqual(expect.arrayContaining(['Son Papdi', 'Rajbhog']));
    expect(regionDesserts('central')).toEqual(expect.arrayContaining(['Khurma', 'Imarti', 'Kalakand']));
    expect(regionDesserts('northeast')).toEqual(expect.arrayContaining(['Chunga Pitha', 'Narikol Laru']));
  });

  it('region default carb matches the region (perfect matching baseline)', () => {
    expect(REGION_DEFAULT_CARB.north).toBe('Wheat Roti');
    expect(REGION_DEFAULT_CARB.west).toBe('Bhakri');
    expect(REGION_DEFAULT_CARB.central).toBe('Roti');
    expect(REGION_DEFAULT_CARB.south).toBe('Steamed Rice');
    expect(REGION_DEFAULT_CARB.east).toBe('Steamed Rice');
    expect(REGION_DEFAULT_CARB.northeast).toBe('Steamed Rice');
  });

  it('default cabs classify correctly for carb assignment', () => {
    expect(isRotiLike('Wheat Roti')).toBe(true);
    expect(isBreadLike('Bhakri')).toBe(true);
    expect(isRotiLike('Roti')).toBe(true);
    expect(isRotiLike('Steamed Rice')).toBe(false);
    expect(isBreadLike('Steamed Rice')).toBe(false);
    // Catalog-only names classify too
    expect(isBreadLike('Malabar Parotta')).toBe(true);
    expect(isRotiLike('Amritsari Kulcha')).toBe(true);
    expect(isBreadLike('Bajra Bhakri')).toBe(true);
  });

  it('regionSides leads with the region salad', () => {
    const north = regionSides('north');
    expect(north[0]).toBe('Kachumber Salad');
    expect(regionSides('south')[0]).toBe('Kosambari');
  });

  it('normalizeRegion maps UI strings + fallback', () => {
    expect(normalizeRegion('North India')).toBe('north');
    expect(normalizeRegion('SOUTH')).toBe('south');
    expect(normalizeRegion('Northeast India')).toBe('northeast');
    expect(normalizeRegion('mars')).toBe('north');
    expect(normalizeRegion(undefined)).toBe('north');
  });

  it('PURE SWEETS are not meal dishes (Barfi/Gulab Jamun/Kulfi → dessert-only)', () => {
    expect(isPureSweetDish({ tags: ['dessert', 'sweet'], category: ['snacks'] })).toBe(true);
    expect(isPureSweetDish({ tags: ['dessert', 'sweet'], category: [] })).toBe(true);
    // A sweet that doubles as a breakfast dish (fafda-jalebi style) is NOT pure
    expect(isPureSweetDish({ tags: ['dessert', 'breakfast'], category: ['breakfast', 'snacks'] })).toBe(false);
    expect(isPureSweetDish({ tags: ['gravy'], category: ['lunch', 'dinner'] })).toBe(false);
    // Real library dishes classify correctly
    const find = (id: string) => DISH_LIBRARY.find((d: any) => d.id === id);
    expect(isPureSweetDish(find('barfi')!)).toBe(true);
    expect(isPureSweetDish(find('kulfi')!)).toBe(true);
    expect(isPureSweetDish(find('rasgulla')!)).toBe(true);
    expect(isPureSweetDish(find('gulab-jamun')!)).toBe(true);
    expect(isPureSweetDish(find('anda-bhurji')!)).toBe(false);
  });

  it('no duplicate rows in the catalog', () => {
    const seen = new Set<string>();
    for (const b of allBreads()) {
      expect(seen.has(b.toLowerCase()), b).toBe(false);
      seen.add(b.toLowerCase());
    }
  });

  it('pairingOptionsFor always includes the ASSIGNED carb, even if not region-native', () => {
    // A dish titled "…with Tandoori Roti" has that embedded as its assigned
    // bread — the customize modal must show it as a SELECTED chip even though
    // Tandoori Roti isn't in south's bread catalog (the reported bug).
    const options = pairingOptionsFor('south', 'bread', ['Tandoori Roti']);
    expect(options).toContain('Tandoori Roti');
    // Region-native options still lead
    expect(options[0]).toBe('Dosa');
    // Also covers missing assigned values safely
    expect(pairingOptionsFor('north', 'rice', [])).toContain('Jeera Rice');
    expect(pairingOptionsFor('north', 'unknown-cat', ['X'])).toEqual(['X']);
  });

  it('DISH-mains are never pairable sides — "Dal" & "Mixed Vegetable Pakora" rejected', () => {
    expect(isRejectedSide('Dal')).toBe(true);
    expect(isRejectedSide('Dal Makhani')).toBe(true);
    expect(isRejectedSide('dal masala')).toBe(true);
    expect(isRejectedSide('Mixed Vegetable Pakora')).toBe(true);
    expect(isRejectedSide('Litti Chokha')).toBe(true);
    expect(isRejectedSide('Paneeer Tikka'.replace('ee', 'e'))).toBe(true);
    // Real accompaniments pass through untouched
    expect(isRejectedSide('Raita')).toBe(false);
    expect(isRejectedSide('Papad')).toBe(false);
    expect(isRejectedSide('Kachumber Salad')).toBe(false);
    expect(isRejectedSide('Sambar')).toBe(false);
    // North region sides are clean of the flagged offenders
    expect(regionSides('north')).not.toContain('Mixed Vegetable Pakora');
    expect(regionSides('north')).not.toContain('Dal');
  });
});
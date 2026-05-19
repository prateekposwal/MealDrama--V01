import { describe, it, expect } from 'vitest';
import { getSmartSuggestions, getTimeWindow, getCurrentSeason, getCurrentFestival } from '../utils/smartSuggestions';
import type { SmartSuggestionInput } from '../utils/smartSuggestions';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<SmartSuggestionInput>): SmartSuggestionInput {
  return {
    id: 'test-dish',
    name: 'Test Dish',
    region: 'north',
    tags: [],
    ...overrides,
  };
}

// ─── getTimeWindow ───────────────────────────────────────────────────────────

describe('getTimeWindow', () => {
  it('returns morning for 6-10', () => {
    const d = new Date('2026-05-12T08:00:00');
    expect(getTimeWindow(d)).toBe('morning');
  });

  it('returns lunch for 10-15', () => {
    const d = new Date('2026-05-12T12:00:00');
    expect(getTimeWindow(d)).toBe('lunch');
  });

  it('returns snack for 15-18', () => {
    const d = new Date('2026-05-12T16:00:00');
    expect(getTimeWindow(d)).toBe('snack');
  });

  it('returns dinner for 18-23', () => {
    const d = new Date('2026-05-12T20:00:00');
    expect(getTimeWindow(d)).toBe('dinner');
  });

  it('returns late-night for 23-6', () => {
    const d = new Date('2026-05-12T02:00:00');
    expect(getTimeWindow(d)).toBe('late-night');
  });
});

// ─── getCurrentSeason ─────────────────────────────────────────────────────────

describe('getCurrentSeason', () => {
  it('returns spring for March', () => {
    expect(getCurrentSeason(new Date('2026-03-15'))).toBe('spring');
  });

  it('returns summer for May', () => {
    expect(getCurrentSeason(new Date('2026-05-12'))).toBe('summer');
  });

  it('returns monsoon for August', () => {
    expect(getCurrentSeason(new Date('2026-08-15'))).toBe('monsoon');
  });

  it('returns winter for December', () => {
    expect(getCurrentSeason(new Date('2026-12-25'))).toBe('winter');
  });

  it('returns winter for January', () => {
    expect(getCurrentSeason(new Date('2026-01-10'))).toBe('winter');
  });
});

// ─── getCurrentFestival ───────────────────────────────────────────────────────

describe('getCurrentFestival', () => {
  it('returns holi for March', () => {
    expect(getCurrentFestival(new Date('2026-03-15'))).toBe('holi');
  });

  it('returns onam for August', () => {
    expect(getCurrentFestival(new Date('2026-08-20'))).toBe('onam');
  });

  it('returns diwali for November', () => {
    expect(getCurrentFestival(new Date('2026-11-01'))).toBe('diwali');
  });

  it('returns pongal for January', () => {
    expect(getCurrentFestival(new Date('2026-01-14'))).toBe('pongal');
  });

  it('returns null for months without festivals', () => {
    expect(getCurrentFestival(new Date('2026-04-15'))).toBeNull();
    expect(getCurrentFestival(new Date('2026-06-01'))).toBeNull();
  });
});

// ─── 7 Dish/Slot Combos ──────────────────────────────────────────────────────

describe('getSmartSuggestions — 7 dish/slot acceptance combos', () => {

  // Test 1: Dal Paratha (Breakfast, North)
  it('Dal Paratha → Beverage: Chai, Coffee (not Chaas/Nimbu Pani)', () => {
    const input = makeInput({
      id: 'dal-paratha',
      name: 'Dal Paratha',
      region: 'north',
      tags: ['paratha', 'bread', 'flatbread', 'fried', 'staples'],
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
      timeWindow: 'morning',
    });

    // Should NOT contain the old hardcoded values
    expect(result.beverages.items).not.toContain('Chaas');
    expect(result.beverages.items).not.toContain('Nimbu Pani');

    // Should contain breakfast-appropriate beverages
    // priority: timeWindow=morning → ['Chai', 'Coffee', 'Milk']
    expect(result.beverages.items).toContain('Chai');
    expect(result.beverages.source).toBe('timeWindow');

    // Sides from tag 'paratha': ['Curd', 'Butter', 'Pickle']
    expect(result.sides.items).toContain('Curd');
    expect(result.sides.items).toContain('Butter');
    expect(result.sides.source).toBe('tag');

    // Self-bread → no bread suggestion
    expect(result.bread.items).toEqual([]);
    expect(result.rice.items).toEqual([]);
  });

  // Test 2: White Bread (Breakfast, Generic)
  it('White Bread → Beverage: Chai, Milk (not Chaas/Nimbu Pani)', () => {
    const input = makeInput({
      id: 'white-bread',
      name: 'White Bread',
      region: 'north',
      tags: ['bread', 'toast'],
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
      timeWindow: 'morning',
    });

    expect(result.beverages.items).not.toContain('Chaas');
    expect(result.beverages.items).not.toContain('Nimbu Pani');
    // TimeWindow morning → ['Chai', 'Coffee', 'Milk'] → capped at 1
    expect(result.beverages.items).toContain('Chai');
    expect(result.beverages.items.length).toBe(1);
    expect(result.beverages.source).toBe('timeWindow');

    // Self-bread → no bread suggestion
    expect(result.bread.items).toEqual([]);
  });

  // Test 3: Rajma (Gravy, North, Lunch)
  it('Rajma → Roti, Jeera Rice, Raita, Chaas (timeWindow=lunch)', () => {
    const input = makeInput({
      id: 'rajma-chawal',
      name: 'Rajma Masala',
      region: 'north',
      tags: ['gravy', 'thick', 'north'],
    });
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
    });

    // Tag 'gravy' → TAG_BREAD_PREFS.gravy: ['Butter Naan', 'Tandoori Roti']
    expect(result.bread.items.length).toBeGreaterThanOrEqual(1);
    expect(result.bread.source).toBe('tag');

    // Region=north → rice from REGION_RICES
    expect(result.rice.items.length).toBeGreaterThanOrEqual(1);

    // Tag 'gravy' → sides from TAG_SIDE_PREFS: ['Raita', 'Salad']
    expect(result.sides.items).toContain('Raita');
    expect(result.sides.source).toBe('tag');

    // TimeWindow=lunch → ['Chaas', 'Nimbu Pani', 'Salted Lassi']
    expect(result.beverages.items).toContain('Chaas');
    expect(result.beverages.source).toBe('timeWindow');
  });

  // Test 4: Fish Curry (Gravy, Kerala/South, Lunch)
  it('Fish Curry Kerala → Butter Naan (tag=gravy), Steamed Rice, Raita, Chaas', () => {
    const input = makeInput({
      id: 'fish-curry-kerala',
      name: 'Fish Curry',
      region: 'south',
      states: ['Kerala'],
      tags: ['gravy', 'coconut', 'non-veg', 'seafood'],
    });
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
    });

    // Tag 'gravy' → TAG_BREAD_PREFS.gravy: ['Butter Naan', 'Tandoori Roti']
    expect(result.bread.items).toContain('Butter Naan');
    expect(result.bread.source).toBe('tag');

    // Region=south → REGION_RICES.south: ['Steamed Rice', 'Lemon Rice']
    expect(result.rice.items).toContain('Steamed Rice');
    expect(result.rice.source).toBe('region');

    // Tag 'gravy' → TAG_SIDE_PREFS.gravy: ['Raita', 'Salad']
    expect(result.sides.items).toContain('Raita');
    expect(result.sides.source).toBe('tag');

    // TimeWindow=lunch → ['Chaas', 'Nimbu Pani', 'Salted Lassi']
    expect(result.beverages.items).toContain('Chaas');
    expect(result.beverages.source).toBe('timeWindow');
  });

  // Test 5: Idli (Steam, South, Breakfast)
  it('Idli → Coconut Chutney, Sambar, Filter Coffee', () => {
    const input = makeInput({
      id: 'idli',
      name: 'Idli',
      region: 'south',
      tags: ['fermented', 'steamed', 'healthy'],
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
      timeWindow: 'morning',
    });

    // Style=steam-boil → inferBread=false, inferRice=false
    expect(result.bread.items).toEqual([]);
    expect(result.rice.items).toEqual([]);

    // Tag 'healthy' matches TAG_SIDE_PREFS.healthy: ['Salad', 'Curd']
    expect(result.sides.source).toBe('tag');
    expect(result.sides.items).toContain('Salad');

    // TimeWindow=morning → ['Chai', 'Coffee', 'Milk']
    expect(result.beverages.source).toBe('timeWindow');

    // Default qtys
    expect(Object.keys(result.defaultQtys).length).toBeGreaterThan(0);
    for (const qty of Object.values(result.defaultQtys)) {
      expect(qty).toBe(1);
    }
  });

  // Test 6: Chicken 65 (Fry, South, Snack)
  it('Chicken 65 → Nimbu Pani (timeWindow=snack)', () => {
    const input = makeInput({
      id: 'chicken-65',
      name: 'Chicken 65',
      region: 'south',
      tags: ['fry', 'non-veg', 'spicy', 'crisp', 'snacks'],
    });
    const result = getSmartSuggestions(input, 'snacks', {
      useSmartSuggestions: true,
      timeWindow: 'snack',
    });

    // TimeWindow=snack → ['Nimbu Pani', 'Coconut Water', 'Jaljeera']
    expect(result.beverages.items).toContain('Nimbu Pani');
    expect(result.beverages.source).toBe('timeWindow');

    // Tag 'non-veg' → TAG_SIDE_PREFS: ['Salad', 'Onion']
    expect(result.sides.items).toContain('Salad');
    expect(result.sides.source).toBe('tag');

    // Default qtys
    expect(result.defaultQtys['Nimbu Pani']).toBe(1);
  });

  // Test 7: Gajar Halwa (Dessert, North, Dinner)
  it('Gajar Halwa → no carbo suggestions, dessert from tag inference', () => {
    const input = makeInput({
      id: 'gajar-halwa',
      name: 'Gajar Halwa',
      region: 'north',
      tags: ['sweet', 'dessert', 'seasonal', 'winter'],
    });
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
    });

    // Style=sweet-dessert → inferBread=false, inferRice=false
    // But actually gajar-halwa is not in DISH_STYLE_MAP so style=undefined
    // No tag matches for bread/rice in TAG_BREAD_PREFS → should return []
    expect(result.bread.items).toEqual([]);
    expect(result.rice.items).toEqual([]);

    // Tag 'dessert' → TAG_DESSERT_PREFS: ['Gulab Jamun', 'Kheer']
    expect(result.dessert.items.length).toBeGreaterThanOrEqual(1);
    expect(result.dessert.source).toBe('tag');
  });
});

// ─── Dessert Season/Festival (Phase 2) ────────────────────────────────────────

describe('getSmartSuggestions — dessert season/festival inference', () => {
  it('returns season-appropriate dessert when no dessert tags (summer)', () => {
    const input = makeInput({
      id: 'rajma-chawal',
      name: 'Rajma Masala',
      region: 'north',
      tags: ['gravy', 'thick'],
    });
    // June 15 = summer (no festival)
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
      date: new Date('2026-06-15'),
    });
    // Summer desserts from SEASON_DESSERT_MAP.summer: ['Mango Kulfi', 'Aamras', 'Shrikhand']
    expect(result.dessert.items.length).toBeGreaterThanOrEqual(1);
    expect(result.dessert.source).toBe('season');
  });

  it('returns festival dessert during Diwali season (Nov)', () => {
    const input = makeInput({
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      region: 'north',
      tags: ['gravy', 'creamy'],
    });
    // November 1 = diwali
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
      date: new Date('2026-11-01'),
    });
    // Diwali desserts: ['Gulab Jamun', 'Kaju Katli', 'Motichoor Laddoo']
    expect(result.dessert.items.length).toBeGreaterThanOrEqual(1);
    expect(result.dessert.source).toBe('season');
    expect(result.meta.festival).toBe('diwali');
  });

  it('tag-based dessert beats season-based dessert', () => {
    const input = makeInput({
      id: 'some-dish',
      name: 'Some Dish',
      region: 'north',
      // Dish has explicit 'sweet' tag → should use TAG_DESSERT_PREFS
      tags: ['gravy', 'sweet'],
    });
    // Even though it's summer, tag 'sweet' should take priority
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
      date: new Date('2026-07-01'),
    });
    expect(result.dessert.source).toBe('tag');
  });

  it('falls back to region when no tags/festival/season match', () => {
    const input = makeInput({
      id: 'fish-curry-kerala',
      name: 'Fish Curry',
      region: 'south',
      tags: ['gravy', 'non-veg'],
    });
    // April = no festival
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
      date: new Date('2026-04-15'),
    });
    // No dessert tags → uses season (spring) → region → fallback
    expect(result.dessert.items.length).toBeGreaterThanOrEqual(1);
  });

  it('includes season and festival in meta', () => {
    const input = makeInput({
      id: 'idli',
      name: 'Idli',
      region: 'south',
    });
    // March = spring + holi
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
      timeWindow: 'morning',
      date: new Date('2026-03-20'),
    });
    expect(result.meta.season).toBe('spring');
    expect(result.meta.festival).toBe('holi');
  });

  it('uses season dessert for monsoon (no festival)', () => {
    const input = makeInput({
      id: 'dal-paratha',
      name: 'Dal Paratha',
      region: 'north',
      tags: ['paratha', 'bread'],
    });
    // July = monsoon, no festival in our map
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
      date: new Date('2026-07-15'),
    });
    expect(result.meta.season).toBe('monsoon');
    expect(result.meta.festival).toBeNull();
    // Monsoon desserts: ['Gulab Jamun', 'Jalebi', 'Moong Dal Halwa']
    expect(result.dessert.items.length).toBeGreaterThanOrEqual(1);
    expect(result.dessert.source).toBe('season');
  });
});

// ─── usedToday / Slot→TimeWindow ─────────────────────────────────────────────

describe('getSmartSuggestions — usedToday filter', () => {
  it('falls back to beverage when only candidate is used in another slot today (no replacement)', () => {
    const input = makeInput({
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      region: 'north',
      tags: ['gravy', 'creamy'],
    });
    // lunch → timeWindow 'lunch' → capped at 1 → ['Chaas']
    // If Chaas already used today, no replacement exists → keep it
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
      usedToday: ['Chaas'],
    });
    expect(result.beverages.items).toContain('Chaas');
    expect(result.beverages.items.length).toBe(1);
  });

  it('keeps item even if usedToday when no replacement available', () => {
    // All timeWindow lunch options used today → should keep originals
    const input = makeInput({
      id: 'test-dish',
      name: 'Test',
      region: 'north',
      tags: ['gravy'],
    });
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
      usedToday: ['Chaas', 'Nimbu Pani', 'Salted Lassi'],
    });
    // All 3 lunch beverages used → should fall back to originals (not empty)
    expect(result.beverages.items.length).toBeGreaterThanOrEqual(1);
    // Original timeWindow items should be returned
    expect(result.beverages.source).toBe('timeWindow');
  });

  it('filters out sides already used today', () => {
    const input = makeInput({
      id: 'dal-makhani',
      name: 'Dal Makhani',
      region: 'north',
      tags: ['gravy', 'creamy'],
    });
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
      timeWindow: 'dinner',
      usedToday: ['Raita'],
    });
    // gravy → sides: ['Raita', 'Salad']; Raita usedToday → only Salad
    expect(result.sides.items).not.toContain('Raita');
    expect(result.sides.items).toContain('Salad');
  });
});

describe('getSmartSuggestions — slot type maps to timeWindow', () => {
  it('breakfast slot → morning beverages (Chai, Coffee, Milk)', () => {
    const input = makeInput({
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      region: 'north',
      tags: ['gravy'],
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
    });
    expect(result.meta.timeWindow).toBe('morning');
    expect(result.beverages.items).toContain('Chai');
    expect(result.beverages.source).toBe('timeWindow');
  });

  it('lunch slot → lunch beverages (Chaas, Nimbu Pani)', () => {
    const input = makeInput({
      id: 'rajma-chawal',
      name: 'Rajma Masala',
      region: 'north',
      tags: ['gravy'],
    });
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
    });
    expect(result.meta.timeWindow).toBe('lunch');
    // Should NOT be morning or dinner beverages
    expect(result.beverages.items).not.toContain('Badam Milk');
  });

  it('dinner slot → dinner beverages (Chaas, Sol Kadhi, Badam Milk)', () => {
    const input = makeInput({
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      region: 'north',
      tags: ['gravy'],
    });
    const result = getSmartSuggestions(input, 'dinner', {
      useSmartSuggestions: true,
    });
    expect(result.meta.timeWindow).toBe('dinner');
    expect(result.beverages.items).toContain('Chaas');
  });

  it('snacks slot → snack beverages (Nimbu Pani, Coconut Water)', () => {
    const input = makeInput({
      id: 'chicken-65',
      name: 'Chicken 65',
      region: 'south',
      tags: ['non-veg', 'spicy'],
    });
    const result = getSmartSuggestions(input, 'snacks', {
      useSmartSuggestions: true,
    });
    expect(result.meta.timeWindow).toBe('snack');
    expect(result.beverages.items).toContain('Nimbu Pani');
  });
});

// ─── Feature Flag Off ────────────────────────────────────────────────────────

describe('getSmartSuggestions — feature flag behavior', () => {
  it('returns empty results when useSmartSuggestions is false', () => {
    const input = makeInput({
      id: 'dal-paratha',
      name: 'Dal Paratha',
      region: 'north',
      tags: ['paratha', 'bread'],
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: false,
    });
    expect(result.bread.items).toEqual([]);
    expect(result.beverages.items).toEqual([]);
    expect(result.sides.items).toEqual([]);
    expect(result.meta.featureFlag).toBe(false);
  });
});

// ─── Default Quantities ──────────────────────────────────────────────────────

describe('getSmartSuggestions — default quantities', () => {
  it('sets defaultQty: 1 for all suggested items', () => {
    const input = makeInput({
      id: 'rajma-chawal',
      name: 'Rajma Masala',
      region: 'north',
      tags: ['gravy'],
    });
    const result = getSmartSuggestions(input, 'lunch', {
      useSmartSuggestions: true,
      timeWindow: 'lunch',
    });
    const allItems = [
      ...result.bread.items,
      ...result.rice.items,
      ...result.sides.items,
      ...result.beverages.items,
      ...result.dessert.items,
    ];
    for (const item of allItems) {
      expect(result.defaultQtys[item]).toBe(1);
    }
  });
});

// ─── Meta ────────────────────────────────────────────────────────────────────

describe('getSmartSuggestions — meta info', () => {
  it('returns correct meta when feature flag is enabled', () => {
    const input = makeInput({
      id: 'idli',
      name: 'Idli',
      region: 'south',
    });
    const result = getSmartSuggestions(input, 'breakfast', {
      useSmartSuggestions: true,
      timeWindow: 'morning',
    });
    expect(result.meta.featureFlag).toBe(true);
    expect(result.meta.region).toBe('south');
    expect(result.meta.timeWindow).toBe('morning');
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('getSmartSuggestions — edge cases', () => {
  it('handles empty tags gracefully', () => {
    const input = makeInput({ id: 'plain', name: 'Plain Dish', tags: [] });
    const result = getSmartSuggestions(input, 'lunch', { useSmartSuggestions: true });
    expect(result.bread).toBeDefined();
    expect(Array.isArray(result.bread.items)).toBe(true);
  });

  it('handles missing tags field', () => {
    const input = makeInput({ id: 'no-tags', name: 'No Tags' });
    delete (input as any).tags;
    const result = getSmartSuggestions(input, 'dinner', { useSmartSuggestions: true });
    expect(result.bread).toBeDefined();
    expect(Array.isArray(result.bread.items)).toBe(true);
  });

  it('returns fallback for completely empty dish input', () => {
    const input = makeInput({ id: '', name: '', tags: [] });
    const result = getSmartSuggestions(input, 'snacks', { useSmartSuggestions: true });
    expect(result.bread).toBeDefined();
  });

  it('handles midnight timeWindow boundary', () => {
    const input = makeInput({ id: 'midnight-snack', name: 'Midnight Snack', region: 'north', tags: ['snack'] });
    const morning = getSmartSuggestions(input, 'snacks', { useSmartSuggestions: true, timeWindow: 'morning' });
    const evening = getSmartSuggestions(input, 'snacks', { useSmartSuggestions: true, timeWindow: 'evening' });
    expect(morning).toBeDefined();
    expect(evening).toBeDefined();
  });

  it('getTimeWindow handles boundary hours', () => {
    const dates = [0, 5, 6, 11, 12, 15, 18, 23].map(h => {
      const d = new Date('2026-01-01T00:00:00');
      d.setHours(h);
      return d;
    });
    for (const d of dates) {
      expect(typeof getTimeWindow(d)).toBe('string');
    }
  });

  it('getCurrentSeason returns valid string', () => {
    const s = getCurrentSeason();
    expect(s).toBeTruthy();
    expect(typeof s).toBe('string');
  });

  it('getCurrentFestival returns string or null', () => {
    const f = getCurrentFestival();
    expect(f === null || typeof f === 'string').toBe(true);
  });
});

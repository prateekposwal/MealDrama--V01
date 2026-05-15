import { describe, it, expect } from 'vitest';
import { applySmartDefaults } from '../store/helpers/applySmartDefaults';
import type { Meal } from '../types/tray';

const makeMeal = (overrides: Partial<Meal>): Meal => ({
  id: 'test-meal',
  name: 'Test Meal',
  icon: '🍽️',
  region: 'north',
  ...overrides,
});

describe('applySmartDefaults — Gravy', () => {
  it('uses baseGravy when present', () => {
    const meal = makeMeal({ baseGravy: 'butter' });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBe('butter');
  });

  it('falls back to first gravy option when no baseGravy', () => {
    const meal = makeMeal({ gravyOptions: ['masala', 'butter'] });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBe('masala');
  });

  it('returns null when no gravy options exist', () => {
    const meal = makeMeal({});
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBeNull();
  });
});

describe('applySmartDefaults — Roti/Rice (Both Available)', () => {
  it('North + lunch → selects roti', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('tandoori roti');
    expect(defaults.rice).toBeNull();
  });

  it('South + lunch → selects rice', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('steamed rice');
  });

  it('East + dinner → selects rice', () => {
    const meal = makeMeal({
      region: 'east',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['jeera rice'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('jeera rice');
  });
});

describe('applySmartDefaults — Roti/Rice (Breakfast Light Carb)', () => {
  it('selects light carb roti when available', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['aloo paratha', 'naan'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBe('aloo paratha');
    expect(defaults.rice).toBeNull();
  });

  it('selects light carb rice when available', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['naan'],
      riceOptions: ['idli', 'pongal rice'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('idli');
  });

  it('falls back to region logic when no light carb found', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['naan'],
      riceOptions: ['biryani'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBe('naan');
    expect(defaults.rice).toBeNull();
  });
});

describe('applySmartDefaults — Roti/Rice (Snacks Heavy Carb Skip)', () => {
  it('skips heavy carbs in snacks when not tagged light_carb', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['butter naan'],
      riceOptions: ['biryani'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('allows roti in snacks when tagged light_carb (North)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
      tags: ['light_carb'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('tandoori roti');
    expect(defaults.rice).toBeNull();
  });

  it('allows rice in snacks when tagged light_carb (South)', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['naan'],
      riceOptions: ['idli'],
      tags: ['light_carb'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('idli');
  });

  it('selects light roti in snacks when first roti is light (North)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['biryani'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('tandoori roti');
    expect(defaults.rice).toBeNull();
  });
});

describe('applySmartDefaults — Roti/Rice (Only One Type)', () => {
  it('selects roti when only roti options exist (inference skips rice)', () => {
    const meal = makeMeal({ region: 'south', rotiOptions: ['chapati'] });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('chapati');
    expect(defaults.rice).toBeNull();
  });

  it('selects rice when only rice options exist (inference skips roti)', () => {
    const meal = makeMeal({ region: 'north', riceOptions: ['pulao'] });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('pulao');
  });

  it('infers region defaults when no options exist', () => {
    const meal = makeMeal({ region: 'north' });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeTruthy();
    expect(defaults.rice).toBeNull();
  });

  it('infers rice for south when no options exist', () => {
    const meal = makeMeal({ region: 'south' });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeTruthy();
  });
});

describe('applySmartDefaults — Sides', () => {
  it('uses suggestedPairings.sides when >= 2 available', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: ['raita', 'papad'], beverages: [] },
      sideOptions: ['salad', 'pickle'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides).toEqual(['raita', 'papad']);
  });

  it('falls back to sideOptions.slice(0,2) when suggestedPairings.sides < 2', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: ['raita'], beverages: [] },
      sideOptions: ['salad', 'pickle', 'raita'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides).toEqual(['salad', 'pickle']);
  });

  it('infers region-appropriate sides when no explicit options', () => {
    const meal = makeMeal({ suggestedPairings: { beverages: [] } });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.sides).toContain('Raita');
  });
});

describe('applySmartDefaults — Beverages', () => {
  it('uses suggestedPairings.beverages when available', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: [], beverages: ['lassi', 'chaas'] },
      beverageOptions: ['soda'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages).toEqual(['lassi', 'chaas']);
  });

  it('falls back to beverageOptions.slice(0,1) when suggestedPairings.beverages empty', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: [], beverages: [] },
      beverageOptions: ['lassi', 'chaas'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages).toEqual(['lassi']);
  });

  it('infers region-appropriate beverages when no explicit options', () => {
    const meal = makeMeal({ suggestedPairings: { sides: [] } });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
    expect(defaults.beverages).toContain('Water');
  });
});

describe('applySmartDefaults — Full Integration', () => {
  it('North India + lunch — full meal with all options', () => {
    const meal: Meal = {
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      icon: '🧀',
      region: 'north',
      baseGravy: 'butter',
      gravyOptions: ['masala', 'butter'],
      rotiOptions: ['tandoori roti', 'naan'],
      riceOptions: ['steamed rice', 'jeera rice'],
      sideOptions: ['raita', 'papad', 'salad'],
      beverageOptions: ['lassi', 'chaas'],
      suggestedPairings: {
        sides: ['raita', 'papad'],
        beverages: ['lassi'],
      },
      tags: ['popular'],
    };
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBe('butter');
    expect(defaults.roti).toBe('tandoori roti');
    expect(defaults.rice).toBeNull();
    expect(defaults.sides).toEqual(['raita', 'papad']);
    expect(defaults.beverages).toEqual(['lassi']);
  });

  it('South India + breakfast — light carb selection', () => {
    const meal: Meal = {
      id: 'masala-dosa',
      name: 'Masala Dosa',
      icon: '🥞',
      region: 'south',
      gravyOptions: ['sambar', 'coconut chutney'],
      rotiOptions: ['idli', 'dosa'],
      riceOptions: ['idli rice', 'pongal'],
      sideOptions: ['chutney', 'sambar'],
      beverageOptions: ['filter coffee', 'tea'],
      suggestedPairings: {
        sides: ['chutney', 'sambar'],
        beverages: ['filter coffee'],
      },
      tags: ['light_carb'],
    };
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.gravy).toBe('sambar');
    expect(defaults.roti).toBe('idli');
    expect(defaults.rice).toBeNull();
    expect(defaults.sides).toEqual(['chutney', 'sambar']);
    expect(defaults.beverages).toEqual(['filter coffee']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inference Engine Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('applySmartDefaults — Knowledge Inference (no explicit options)', () => {
  it('North + lunch gravy dish → infers tandoori roti + jeera rice + raita + chaas', () => {
    const meal = makeMeal({
      id: 'dal-makhani',
      name: 'Dal Makhani',
      region: 'north',
      baseGravy: 'tadka',
      tags: ['dal', 'slow-cooked', 'lentils'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBe('tadka');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
  });

  it('South + lunch → infers rice as primary carb', () => {
    const meal = makeMeal({
      id: 'south-veg-curry',
      name: 'South Veg Curry',
      region: 'south',
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Steamed Rice');
  });

  it('Self-carb dish (paratha) → skips bread and rice inference', () => {
    const meal = makeMeal({
      id: 'aloo-paratha',
      name: 'Aloo Paratha',
      region: 'north',
      tags: ['paratha', 'bread', 'breakfast', 'staples'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('Self-carb dish (idli) → skips bread and rice inference', () => {
    const meal = makeMeal({
      id: 'idli',
      name: 'Idli',
      region: 'south',
      tags: ['idli', 'breakfast', 'light'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('Chaat/snack dish → skips bread inference for snacks slot', () => {
    const meal = makeMeal({
      id: 'samosa',
      name: 'Samosa',
      region: 'north',
      tags: ['snacks', 'fried', 'street food'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('Unknown region → falls back to north defaults', () => {
    const meal = makeMeal({
      id: 'unknown-dish',
      name: 'Unknown Dish',
      region: 'unknown' as any,
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeTruthy();
    expect(defaults.rice).toBeNull();
  });

  it('Chai/beverage dish → infers appropriate sides', () => {
    const meal = makeMeal({
      id: 'masala-chai',
      name: 'Masala Chai',
      region: 'north',
      tags: ['tea', 'drink'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
    expect(defaults.sides).toBeDefined();
    expect(defaults.beverages).toBeDefined();
  });

  it('Dish with gravy tag → infers butter naan as primary bread', () => {
    const meal = makeMeal({
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      region: 'north',
      tags: ['paneer', 'gravy', 'butter', 'rich', 'creamy'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Butter Naan');
    expect(defaults.rice).toBeNull();
  });

  it('Dish with dal tag → infers tandoori roti + jeera rice both available, picks roti for north lunch', () => {
    const meal = makeMeal({
      id: 'dal-tadka',
      name: 'Dal Tadka',
      region: 'north',
      tags: ['dal', 'lentils', 'comfort'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
  });

  it('Non-veg gravy dish → infers butter naan + raita + salad', () => {
    const meal = makeMeal({
      id: 'butter-chicken',
      name: 'Butter Chicken',
      region: 'north',
      tags: ['chicken', 'gravy', 'creamy', 'non-veg'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Butter Naan');
    expect(defaults.sides).toContain('Raita');
    expect(defaults.sides).toContain('Salad');
  });

  it('Dish with empty tags → uses region defaults', () => {
    const meal = makeMeal({
      id: 'simple-dish',
      name: 'Simple Dish',
      region: 'south',
      tags: [],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Steamed Rice');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
  });

  it('Dish with light_carb tag in snacks → allows carb selection', () => {
    const meal = makeMeal({
      id: 'fruits',
      name: 'Fruit Bowl',
      region: 'north',
      tags: ['light_carb', 'healthy'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
  });

  it('South + west region + dinner → infers rice', () => {
    const meal = makeMeal({
      id: 'west-fish-curry',
      name: 'Fish Curry',
      region: 'west',
      tags: ['gravy', 'non-veg'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Steamed Rice');
  });

  it('Explicit options take precedence over inference', () => {
    const meal = makeMeal({
      id: 'custom-dish',
      name: 'Custom Dish',
      region: 'north',
      rotiOptions: ['Special Naan', 'Garlic Naan'],
      riceOptions: [],
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Special Naan');
    expect(defaults.rice).toBeNull();
  });

  it('Gravy dish with gravy tag → infers sides include raita and salad', () => {
    const meal = makeMeal({
      id: 'kadai-paneer',
      name: 'Kadai Paneer',
      region: 'north',
      tags: ['paneer', 'gravy', 'spicy'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Butter Naan');
    expect(defaults.sides).toContain('Raita');
    expect(defaults.sides).toContain('Salad');
  });
});

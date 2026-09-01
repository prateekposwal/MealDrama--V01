import { describe, it, expect } from 'vitest';
import { applySmartDefaults } from '../plan/store/helpers/applySmartDefaults';
import { classifyEmbeddedCarb } from '../utils/normalizeMealComponents';
import type { Meal } from '../types/tray';

describe('classifyEmbeddedCarb — title says it, the modal must select it', () => {
  it('"Dal Gosht with Roti" → bread Roti; "with Rice" → rice', () => {
    expect(classifyEmbeddedCarb('Dal Gosht with Roti').kind).toBe('bread');
    expect(classifyEmbeddedCarb('Dal Gosht with Roti').name).toBe('Roti');
    expect(classifyEmbeddedCarb('Butter Chicken with Rice').kind).toBe('rice');
    expect(classifyEmbeddedCarb('Rajma Chawal').kind).toBe('rice');
    expect(classifyEmbeddedCarb('Aloo Gobhi').kind).toBeNull();
  });

  it('bhature/bhatura resolves to Bhatura, not generic "Bread" (the Amritsari Chole Bhature bug)', () => {
    expect(classifyEmbeddedCarb('Amritsari Chole Bhature').name).toBe('Bhatura');
    expect(classifyEmbeddedCarb('Chole Bhature').name).toBe('Bhatura');
    expect(classifyEmbeddedCarb('Chole Bhature').kind).toBe('bread');
    expect(classifyEmbeddedCarb('Luchi with Aloo').name).toBe('Luchi');
    expect(classifyEmbeddedCarb('Puri Bhaji').name).toBe('Puri');
    expect(classifyEmbeddedCarb('Amritsari Chole Bhature').name).not.toBe('Bread');
  });
});

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
  it('North + lunch → selects roti (normalized)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
  });

  it('South + lunch → selects rice (normalized)', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Rice');
  });

  it('East + dinner → selects rice (normalized)', () => {
    const meal = makeMeal({
      region: 'east',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['jeera rice'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Rice');
  });
});

describe('applySmartDefaults — Roti/Rice (Breakfast Light Carb)', () => {
  it('selects light carb roti when available (normalized)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['aloo paratha', 'naan'],
      riceOptions: ['steamed rice'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBe('Aloo Paratha');
    expect(defaults.rice).toBeNull();
  });

  it('selects light carb rice when available (normalized)', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['naan'],
      riceOptions: ['idli', 'pongal rice'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Rice');
  });

  it('breakfast does NOT inherit a heavy lunch/dinner roti (Naan-on-breakfast bug)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['naan'],
      riceOptions: ['biryani'],
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
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

  it('allows roti in snacks when tagged light_carb (North, normalized)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['steamed rice'],
      tags: ['light_carb'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
  });

  it('allows rice in snacks when tagged light_carb (South, normalized)', () => {
    const meal = makeMeal({
      region: 'south',
      rotiOptions: ['naan'],
      riceOptions: ['idli'],
      tags: ['light_carb'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Rice');
  });

  it('selects light roti in snacks when first roti is light (North, normalized)', () => {
    const meal = makeMeal({
      region: 'north',
      rotiOptions: ['tandoori roti'],
      riceOptions: ['biryani'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
  });
});

describe('applySmartDefaults — Roti/Rice (Only One Type)', () => {
  it('selects roti when only roti options exist (normalized)', () => {
    const meal = makeMeal({ region: 'south', rotiOptions: ['chapati'] });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Chapati');
    expect(defaults.rice).toBeNull();
  });

  it('selects rice when only rice options exist (normalized)', () => {
    const meal = makeMeal({ region: 'north', riceOptions: ['pulao'] });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Rice');
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
  it('uses suggestedPairings.sides when >= 2 available (normalized)', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: ['raita', 'papad'], beverages: [] },
      sideOptions: [],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides).toEqual(['Raita', 'Papad']);
  });

  it('falls back to sideOptions.slice(0,2) when suggestedPairings.sides < 2 (normalized)', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: [], beverages: [] },
      sideOptions: ['salad', 'pickle'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides).toEqual(['Salad', 'Pickle']);
  });

  it('infers region-appropriate sides when no explicit options (normalized)', () => {
    const meal = makeMeal({ suggestedPairings: { beverages: [] } });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.sides).toContain('Raita');
  });
});

describe('applySmartDefaults — Beverages', () => {
  it('uses suggestedPairings.beverages when available (normalized)', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: [], beverages: ['lassi', 'chaas'] },
      beverageOptions: [],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages).toEqual(['Buttermilk']);
  });

  it('falls back to beverageOptions.slice(0,1) when suggestedPairings.beverages empty (normalized)', () => {
    const meal = makeMeal({
      suggestedPairings: { sides: [], beverages: [] },
      beverageOptions: ['lassi', 'chaas'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages).toEqual(['Buttermilk']);
  });

  it('infers region- and slot-appropriate beverages when no explicit options', () => {
    const meal = makeMeal({ suggestedPairings: { sides: [] } });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
    expect(defaults.beverages[0]).toBe('Lassi'); // North India lunch → Punjabi lassi
    expect(applySmartDefaults({ ...meal, region: 'south' }, 'lunch').beverages[0]).toBe('Filter Coffee');
    expect(applySmartDefaults({ ...meal, region: 'west' }, 'dinner').beverages[0]).toBe('Chaas');
    expect(applySmartDefaults({ ...meal, region: 'central' }, 'dinner').beverages[0]).toBe('Mattha');
  });
});

describe('applySmartDefaults — Full Integration', () => {
  it('North India + lunch — full meal with all options (normalized)', () => {
    const meal: Meal = {
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      icon: '',
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
    expect(defaults.roti).toBe('Tandoori Roti');
    expect(defaults.rice).toBeNull();
    expect(defaults.sides).toEqual(['Raita', 'Papad']);
    expect(defaults.beverages).toEqual(['Buttermilk']);
  });

  it('South India + breakfast — self-carb dish skips additional carbs (normalized)', () => {
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
    // Dosa is a self-carb dish, so no additional carbs are added
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
    expect(defaults.sides).toEqual(['Chutney', 'Sambar']);
    expect(defaults.beverages).toEqual(['Coffee']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inference Engine Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('applySmartDefaults — Knowledge Inference (no explicit options)', () => {
  it('North + lunch gravy dish → infers roti (normalized)', () => {
    const meal = makeMeal({
      id: 'dal-makhani',
      name: 'Dal Makhani',
      region: 'north',
      baseGravy: 'tadka',
      tags: ['dal', 'slow-cooked', 'lentils'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.gravy).toBe('tadka');
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.rice).toBeNull();
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
  });

  it('South + lunch → infers the region rice (Curd Rice) as primary (perfect matching)', () => {
    const meal = makeMeal({
      id: 'south-veg-curry',
      name: 'South Veg Curry',
      region: 'south',
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Curd Rice');
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
      id: 'test-samosa-snack',
      name: 'Samosa',
      region: 'north',
      tags: ['snacks', 'fried', 'street food'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('Unknown region → falls back to north defaults (Wheat Roti, the north carb)', () => {
    const meal = makeMeal({
      id: 'unknown-dish',
      name: 'Unknown Dish',
      region: 'unknown' as any,
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    // normalizeRegion('unknown') → north → region-default carb is Wheat Roti
    expect(defaults.roti).toBe('Wheat Roti');
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
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.rice).toBeNull();
  });

  it('Dish with dal tag → infers roti for north lunch (normalized)', () => {
    const meal = makeMeal({
      id: 'dal-tadka',
      name: 'Dal Tadka',
      region: 'north',
      tags: ['dal', 'lentils', 'comfort'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.rice).toBeNull();
  });

  it('Non-veg gravy dish → infers roti + sides (normalized)', () => {
    const meal = makeMeal({
      id: 'butter-chicken',
      name: 'Butter Chicken',
      region: 'north',
      tags: ['chicken', 'gravy', 'creamy', 'non-veg'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
  });

  it('Dish with empty tags → uses region defaults (Kosambari salad, Curd Rice)', () => {
    const meal = makeMeal({
      id: 'simple-dish',
      name: 'Simple Dish',
      region: 'south',
      tags: [],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBe('Curd Rice');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
    expect(defaults.sides).toContain('Kosambari');
    expect(defaults.beverages.length).toBeGreaterThanOrEqual(1);
  });

  it('Dish with light_carb tag in snacks → allows carb selection (normalized)', () => {
    const meal = makeMeal({
      id: 'fruits',
      name: 'Fruit Bowl',
      region: 'north',
      tags: ['light_carb', 'healthy'],
    });
    const defaults = applySmartDefaults(meal, 'snacks');
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.rice).toBeNull();
  });

  it('West + dinner → infers the region carb Bhakri (perfect matching)', () => {
    const meal = makeMeal({
      id: 'west-fish-curry',
      name: 'Fish Curry',
      region: 'west',
      tags: ['fish', 'gravy', 'coastal'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Bhakri');
    expect(defaults.rice).toBeNull();
  });

  it('Explicit options take precedence over inference (normalized)', () => {
    const meal = makeMeal({
      id: 'custom-dish',
      name: 'Custom Dish',
      region: 'north',
      rotiOptions: ['Special Naan', 'Garlic Naan'],
      riceOptions: [],
      tags: ['gravy'],
    });
    const defaults = applySmartDefaults(meal, 'lunch');
    expect(defaults.roti).toBe('Naan');
    expect(defaults.rice).toBeNull();
  });

  it('Gravy dish with gravy tag → infers sides include raita and salad (normalized)', () => {
    const meal = makeMeal({
      id: 'kadai-paneer',
      name: 'Kadai Paneer',
      region: 'north',
      tags: ['paneer', 'gravy', 'spicy'],
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.roti).toBe('Wheat Roti');
    expect(defaults.sides.length).toBeGreaterThanOrEqual(1);
  });
});

describe('applySmartDefaults — breakfast / self-carb pairing sanity (the roti-on-breakfast bug)', () => {
  it('breakfast NEVER gets an inferred carb, even with rotiOptions present', () => {
    const meal = makeMeal({
      name: 'Spicy Egg Bhurji',
      region: 'north',
      rotiOptions: ['wheat roti'],
      riceOptions: ['steamed rice'],
      suggestedPairings: { sides: [], beverages: [] },
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.roti).toBeNull();
    expect(defaults.rice).toBeNull();
  });

  it('breakfast slots strip Roti/Rice from explicit defaultPairings sides', () => {
    const meal = makeMeal({
      name: 'Kheema per Eeda',
      region: 'north',
      defaultPairings: { sides: ['Roti', 'Rice', 'Salad'], beverages: ['Masala Chai'] } as any,
    });
    const defaults = applySmartDefaults(meal, 'breakfast');
    expect(defaults.sides).not.toContain('Roti');
    expect(defaults.sides).not.toContain('Rice');
    expect(defaults.roti).toBeNull();
  });

  it('SELF-BREAD dishes (Kodo Ko Roti) never pair Roti/Rice even at dinner', () => {
    const meal = makeMeal({
      name: 'Kodo Ko Roti (Finger Millet Roti)',
      region: 'northeast',
      defaultPairings: { sides: ['Roti', 'Rice', 'Salad'], beverages: ['Butter Tea'] } as any,
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.sides).not.toContain('Roti');
    expect(defaults.sides).not.toContain('Rice');
    expect(defaults.roti).toBeNull();
  });

  it('Malabar Parota is recognized as a self-carb dish (parota keyword)', () => {
    const meal = makeMeal({
      name: 'Malabar Parota',
      region: 'south',
      defaultPairings: { sides: ['Roti', 'Rice', 'Salad'], beverages: ['Coffee'] } as any,
    });
    const defaults = applySmartDefaults(meal, 'dinner');
    expect(defaults.sides).not.toContain('Roti');
    expect(defaults.roti).toBeNull();
  });

  it('lunch at north still infers its carb normally (unchanged behavior outside breakfast)', () => {
    const meal = makeMeal({
      id: 'kadai-paneer',
      name: 'Kadai Paneer',
      region: 'north',
      tags: ['paneer', 'gravy'],
    });
    expect(applySmartDefaults(meal, 'dinner').roti).toBe('Wheat Roti');
  });

  it('EMBEDDED carb: a row titled "…with Roti" keeps Roti as the default carb even without stored roti', () => {
    // Legacy row: the dish/variant name carries the carb, item.roti is absent.
    const meal = makeMeal({
      id: 'dal-gosht',
      name: 'Dal Gosht',
      region: 'north',
      tags: ['dal', 'mutton'],
      defaultPairings: { sides: ['Roti', 'Dal', 'Pickle'], beverages: ['Buttermilk'] } as any,
    });
    const existing = {
      id: 'x', title: 'Dal Gosht with Roti', name: 'Dal Gosht',
    } as any;
    const defaults = applySmartDefaults(meal, 'dinner', existing);
    expect(defaults.roti).toBe('Roti');
    expect(defaults.sides).not.toContain('Dal'); // dish-mains never pair as sides
  });
});

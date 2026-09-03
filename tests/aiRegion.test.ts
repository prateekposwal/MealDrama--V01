import { describe, it, expect } from 'vitest';
import { orderSuggestionsRegionFirst, type SuggestionLike } from '../utils/suggestionUtils';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';

describe('orderSuggestionsRegionFirst — robustness', () => {
  it('NEVER throws on a misplaced-arg call (userDiet passed as items — the dashboard crash)', () => {
    // Regression: Dashboard health-insight called (userDiet, items, regionKey, dishes)
    // — userDiet (a string) landed in `items` → "items.filter is not a function".
    const r = orderSuggestionsRegionFirst('veg' as any, [{ id: 'a', name: 'Rajma' }] as any);
    expect(Array.isArray(r)).toBe(true);
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const item = (id: string, name: string, region?: string): SuggestionLike => ({ id, name, region });

const dish = (id: string, name: string, region: string): Dish =>
  ({ id, name, icon: '🍽️', region, states: [], category: [], type: 'veg', weight: 'medium', nutrition: [], tags: [], variants: [] }) as unknown as Dish;

// ─── Pure helper — region ordering, ordering-only, deterministic ──────────────

describe('orderSuggestionsRegionFirst (pure)', () => {
  // North user: priorities are north(0) < west(2) < central/all/unknown(3) < south(6)
  const items = [
    item('far-idli', 'Idli', 'south'),
    item('near-dhokla', 'Dhokla', 'west'),
    item('home-paratha', 'Aloo Paratha', 'north'),
    item('any-sandwich', 'Sandwich', 'all'),
    item('mystery-bowl', 'Bowl', undefined),
  ];

  it('north first, then nearest (west), then all/unknown tier, south last — never dropping any item', () => {
    const ordered = orderSuggestionsRegionFirst(items, 'north');
    expect(ordered[0]!.id).toBe('home-paratha'); // exact region first
    expect(ordered.indexOf(items[1]!)).toBeLessThan(ordered.indexOf(items[3]!)); // west before all tier
    expect(ordered.indexOf(items[4]!)).toBeLessThan(ordered.indexOf(items[0]!)); // unknown tier before far south
    expect(ordered.indexOf(items[3]!)).toBeLessThan(ordered.indexOf(items[0]!)); // all tier before far south
    expect(ordered).toHaveLength(items.length); // ordering ONLY — same count
    expect(ordered.map(i => i.id).sort()).toEqual(items.map(i => i.id).sort());
  });

  it('is deterministic: same input → same order, no randomness, no input mutation', () => {
    const snapshot = items.map(i => i.id);
    const a = orderSuggestionsRegionFirst(items, 'north').map(i => i.id);
    const b = orderSuggestionsRegionFirst(items, 'north').map(i => i.id);
    expect(a).toEqual(b);
    expect(items.map(i => i.id)).toEqual(snapshot); // caller's array untouched
  });

  it('integration-ish: north user + [south, north, all] → north first, all 3 kept', () => {
    const ordered = orderSuggestionsRegionFirst([
      item('s-dosa', 'Dosa', 'south'),
      item('n-rajma', 'Rajma', 'north'),
      item('a-bread', 'Bread', 'all'),
    ], 'north');
    expect(ordered.map(i => i.id)).toEqual(['n-rajma', 'a-bread', 's-dosa']);
    expect(ordered).toHaveLength(3);
  });

  it('normalizes a raw regionKey via getRegionKey (North India → north)', () => {
    const ordered = orderSuggestionsRegionFirst([
      item('far-idli', 'Idli', 'south'),
      item('home-paratha', 'Aloo Paratha', 'north'),
      item('any-sandwich', 'Sandwich', 'all'),
    ], 'North India');
    expect(ordered[0]!.id).toBe('home-paratha');
    expect(ordered.map(i => i.id)).toEqual(['home-paratha', 'any-sandwich', 'far-idli']);
    expect(ordered).toHaveLength(3);
  });

  it('translates bridge dialect region strings to canonical keys (north_indian → north)', () => {
    const ordered = orderSuggestionsRegionFirst([
      item('x-1', 'Dosa', 'south_indian'),
      item('x-2', 'Rajma', 'north_indian'),
      item('x-3', 'Pav Bhaji', 'maharashtra'), // untranslatable → region-agnostic tie
    ], 'north');
    expect(ordered[0]!.id).toBe('x-2'); // dialect 'north_indian' → north
    expect(ordered[ordered.length - 1]!.id).toBe('x-1'); // 'south_indian' → south, far for a north user
    expect(ordered.map(i => i.id)).toEqual(['x-2', 'x-3', 'x-1']);
  });

  it('absent/untranslatable regions tie with the all-tier instead of dumping last-forever', () => {
    const items = [
      item('far-idli', 'A Idli', 'south'),
      item('unknown-1', 'B Mystery', ''),         // no region at all
      item('unknown-2', 'C Enigma', 'punjab'),    // dialect with no region keyword
    ];
    const ordered = orderSuggestionsRegionFirst(items, 'north');
    expect(ordered.indexOf(items[1]!)).toBeLessThan(ordered.indexOf(items[0]!));
    expect(ordered.indexOf(items[2]!)).toBeLessThan(ordered.indexOf(items[0]!));
    expect(ordered[ordered.length - 1]!.id).toBe('far-idli');
  });

  it('accepts Dashboard strip-shaped items (extra slotLabel field) without dropping them', () => {
    const stripItems = [
      { id: 's-1', name: 'Dosa', region: 'south', slotLabel: 'Lunch' },
      { id: 'n-1', name: 'Rajma', region: 'north', slotLabel: 'Lunch' },
    ];
    const ordered = orderSuggestionsRegionFirst(stripItems, 'north');
    expect(ordered[0]!.id).toBe('n-1');
    expect(ordered[0]!.slotLabel).toBe('Lunch'); // extra fields survive the order
    expect(ordered[1]!.id).toBe('s-1');
    expect(ordered).toHaveLength(2);
  });
});

// ─── Library-backed matching (id first, then name) ───────────────────────────

describe('orderSuggestionsRegionFirst library matching', () => {
  it('resolves canonical regions from DISH_LIBRARY by id even when the bridge region is absent/misleading', () => {
    const north = DISH_LIBRARY.find(d => d.region === 'north')!;
    const south = DISH_LIBRARY.find(d => d.region === 'south')!;
    const all = DISH_LIBRARY.find(d => d.region === 'all')!;

    const ordered = orderSuggestionsRegionFirst([
      { id: south.id, name: south.name, region: '' },      // bridge sent nothing
      { id: north.id, name: north.name, region: 'delhi' }, // bridge dialect is unparseable
      { id: all.id, name: all.name, region: 'all' },
    ], 'north', DISH_LIBRARY);

    expect(ordered[0]!.id).toBe(north.id); // library id match wins over the misleading string
    expect(ordered.map(i => i.id).indexOf(all.id)).toBeLessThan(ordered.map(i => i.id).indexOf(south.id));
    expect(ordered.map(i => i.id)).toHaveLength(3); // never drops
    expect(ordered.map(i => i.id)).toContain(south.id);
  });

  it('matches by name when the AI id is not a library id', () => {
    const library = [
      dish('lib-north', 'Aloo Paratha', 'north'),
      dish('lib-south', 'Dosa', 'south'),
      dish('lib-all', 'Sandwich', 'all'),
    ];
    const ordered = orderSuggestionsRegionFirst([
      { id: 'ai-9', name: 'Aloo Paratha' }, // AI-generated id, exact library name
      { id: 'ai-0', name: 'Mystery Bowl' }, // no library match, no region → region-agnostic
      { id: 'ai-2', name: 'Dosa' },         // name match → south
    ], 'north', library);

    expect(ordered[0]!.id).toBe('ai-9'); // north via name match
    expect(ordered[ordered.length - 1]!.id).toBe('ai-2'); // south last
    expect(ordered).toHaveLength(3);
  });
});

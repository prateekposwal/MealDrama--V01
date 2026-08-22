import { describe, it, expect } from 'vitest';
import { WHATSAPP_LIMIT } from '../utils/shareMessages';
import { buildPantryShareMessage, type PantryShareInput } from '../utils/pantryShare';

// ─── Fixture ────────────────────────────────────────────────────────────────

const baseInput = (over: Partial<PantryShareInput> = {}): PantryShareInput => ({
  lang: 'en',
  region: 'North',
  viewLabel: "Tomorrow's meals",
  checkedCount: 1,
  uncheckedCount: 1,
  totalMeals: 3,
  categories: [{
    key: 'dairy',
    emoji: '🥛',
    label: 'DAIRY',
    items: [{ name: 'Milk', quantity: '1000', unit: 'ml', sources: [] }],
  }],
  checkedNames: ['Rice'],
  meals: [{ slot: 'DINNER', items: [{ name: 'Dal Tadka' }] }],
  surplus: [{
    name: 'Milk',
    surplus: 850,
    unit: 'ml',
    expiry: '2026-08-25',
    freezer: true,
    dishes: ['Kheer', 'Dahi'],
  }],
  ...over,
});

// ─── L2: translated section headers (not hardcoded English) ─────────────────

describe('buildPantryShareMessage — localization (L2)', () => {
  it('uses translated section headers for a non-EN language (hi)', () => {
    const msg = buildPantryShareMessage(baseInput({ lang: 'hi' }));
    expect(msg).not.toContain('*NEED TO BUY*');
    expect(msg).not.toContain('*ALREADY HAVE*');
    expect(msg).not.toContain('*MEALS TO PREPARE*');
    expect(msg).toContain('खरीदना है');            // needToBuy
    expect(msg).toContain('पहले से है');           // alreadyHave
    expect(msg).toContain('बनाने के लिए भोजन');   // mealsToPrepare
  });

  it('keeps the English headers when lang is en', () => {
    const msg = buildPantryShareMessage(baseInput());
    expect(msg).toContain(`━━━ *NEED TO BUY* ━━━`);
    expect(msg).toContain(`━━━ *ALREADY HAVE* ━━━`);
    expect(msg).toContain(`━━━ *MEALS TO PREPARE* ━━━`);
  });

  it('leftover section header is localized (hi)', () => {
    const msg = buildPantryShareMessage(baseInput({ lang: 'hi' }));
    expect(msg).toContain('बचे हुए सामान के विचार');
  });
});

// ─── Leftover-ideas section content ─────────────────────────────────────────

describe('buildPantryShareMessage — leftover-ideas section', () => {
  it('appends a row with surplus, use-by and freeze tip', () => {
    const msg = buildPantryShareMessage(baseInput());
    expect(msg).toContain('*Leftover ideas*');
    expect(msg).toContain('  • Milk ~850ml left — Try the rest in: Kheer, Dahi (use by 2026-08-25) · Freeze it');
  });

  it('omits the section when no reuse suggestions exist', () => {
    const msg = buildPantryShareMessage(baseInput({ surplus: [] }));
    expect(msg).not.toContain('Leftover ideas');
  });

  it('omits use-by/freeze suffixes when the entry has no expiry / is not freezable', () => {
    const msg = buildPantryShareMessage(baseInput({
      surplus: [{ name: 'Milk', surplus: 850, unit: 'ml', freezer: false, dishes: ['Kheer'] }],
    }));
    expect(msg).toContain('  • Milk ~850ml left — Try the rest in: Kheer');
    expect(msg).not.toContain('use by');
    expect(msg).not.toContain('Freeze it');
  });

  it('places the section after MEALS TO PREPARE and before Sent from', () => {
    const msg = buildPantryShareMessage(baseInput());
    const mealsIdx = msg.indexOf('*MEALS TO PREPARE*');
    const leftoverIdx = msg.indexOf('*Leftover ideas*');
    const sentIdx = msg.indexOf('Sent from MealDrama');
    expect(mealsIdx).toBeGreaterThan(-1);
    expect(leftoverIdx).toBeGreaterThan(mealsIdx);
    expect(sentIdx).toBeGreaterThan(leftoverIdx);
  });

  it('caps the section at the supplied surplus rows (caller passes ≤ 4)', () => {
    const surplus = Array.from({ length: 6 }, (_, i) => ({
      name: `Item ${i}`, surplus: 100 + i, unit: 'ml', expiry: '2026-08-25', freezer: false, dishes: ['Kheer'],
    }));
    const msg = buildPantryShareMessage(baseInput({ surplus: surplus.slice(0, 4) }));
    const rows = (msg.match(/^\s{2}• Item /gm) || []).length;
    expect(rows).toBe(4);
  });
});

// ─── WHATSAPP_LIMIT / overflow ──────────────────────────────────────────────

describe('buildPantryShareMessage — WHATSAPP_LIMIT', () => {
  it('stays under the default 4096 cap', () => {
    const msg = buildPantryShareMessage(baseInput());
    expect(msg.length).toBeLessThanOrEqual(WHATSAPP_LIMIT);
    expect(msg).toContain('Sent from MealDrama');
  });

  it('drops surplus rows one-by-one when the section would exceed a custom limit', () => {
    const surplus = Array.from({ length: 10 }, (_, i) => ({
      name: `Milk ${i}`, surplus: 850, unit: 'ml', expiry: '2026-08-25', freezer: true,
      dishes: ['Kheer', 'Dahi', 'Paneer', 'Rasmalai'],
    }));
    const empty = buildPantryShareMessage(baseInput({ surplus: [] }));
    const limit = empty.length + 200; // fits the header + ~1 row only
    const msg = buildPantryShareMessage(baseInput({ surplus, limit }));
    expect(msg.length).toBeLessThanOrEqual(limit);
    expect(msg.length).toBeGreaterThan(empty.length); // header at least made it
    expect(msg).toContain('*Leftover ideas*');
    const kept = (msg.match(/^\s{2}• Milk /gm) || []).length;
    expect(kept).toBeGreaterThan(0);
    expect(kept).toBeLessThan(surplus.length); // truncated, not full
  });

  it('still yields a valid message at the default limit when the section would overflow', () => {
    // Base text under the cap + a surplus section that cannot fully fit →
    // the builder truncates rows, never the message itself.
    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      name: `Ingredient Number ${i}`, quantity: '2', unit: 'kg', sources: [],
    }));
    const surplus = Array.from({ length: 24 }, (_, i) => ({
      name: `Leftover ${i}`, surplus: 1234, unit: 'g', expiry: '2026-08-25', freezer: true,
      dishes: ['Kheer', 'Dahi', 'Paneer', 'Rasmalai', 'Badam Milk'],
    }));
    const empty = buildPantryShareMessage(baseInput({ surplus: [], categories: [
      { key: 'pantry', emoji: '🧺', label: 'PANTRY', items: manyItems },
    ] }));
    // Sanity: this test is about the section overflowing a FITTING base.
    expect(empty.length).toBeLessThan(WHATSAPP_LIMIT);
    expect(empty.length).toBeGreaterThan(WHATSAPP_LIMIT - 1400); // base near the cap

    const msg = buildPantryShareMessage(baseInput({
      categories: [{ key: 'pantry', emoji: '🧺', label: 'PANTRY', items: manyItems }],
      surplus,
    }));
    expect(msg.length).toBeLessThanOrEqual(WHATSAPP_LIMIT);
    expect(msg).toContain('Sent from MealDrama'); // valid, sendable message
    expect(msg.indexOf('*Leftover ideas*')).toBeGreaterThan(-1); // section kept (rows truncated)
    const kept = (msg.match(/^\s{2}• Leftover /gm) || []).length;
    expect(kept).toBeGreaterThan(0);
    expect(kept).toBeLessThan(surplus.length);
  });
});

import { describe, it, expect } from 'vitest';
import {
  ALL_LANGUAGES,
  SHARE_STRINGS,
  renderSharePreview,
  messageCharCount,
  WHATSAPP_LIMIT,
  recipeShareForDish,
  STYLE_STEPS,
  type ShareLanguage,
} from '../utils/shareMessages';

const LANGS = ALL_LANGUAGES.map(l => l.key);

describe('SHARE_STRINGS — all 10 languages, native script, default English', () => {
  it('covers every configured language', () => {
    for (const lang of LANGS) {
      expect(SHARE_STRINGS[lang as ShareLanguage]).toBeDefined();
    }
  });

  it('every language carries the FULL canonical SHARE_STRINGS shape (no silent field loss)', () => {
    // Canonical shape derives from the English entry at runtime, so a NEW field
    // added to the shape is automatically required for ALL languages.
    const KEYS = Object.keys(SHARE_STRINGS.en) as (keyof typeof SHARE_STRINGS.en)[];
    expect(KEYS.length).toBeGreaterThanOrEqual(21); // guard: shape can only grow
    for (const lang of LANGS) {
      const s = SHARE_STRINGS[lang as ShareLanguage];
      for (const key of KEYS) {
        expect(typeof s[key], `${lang}.${key}`).toBe('string');
        expect(s[key].length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('regional titles are in NATIVE script (not romanized)', () => {
    const hiTitle = SHARE_STRINGS.hi.dailyTitle;
    const knTitle = SHARE_STRINGS.kn.dailyTitle;
    const guTitle = SHARE_STRINGS.gu.dailyTitle;
    // Devanagari, Kannada, Gujarati scripts — none should be plain ASCII latin.
    expect(/[\u0900-\u097F]/.test(hiTitle)).toBe(true); // Devanagari
    expect(/[\u0C80-\u0CFF]/.test(knTitle)).toBe(true); // Kannada
    expect(/[\u0A80-\u0AFF]/.test(guTitle)).toBe(true); // Gujarati
  });

  it('regional strings differ from English', () => {
    for (const lang of LANGS.filter(l => l !== 'en')) {
      expect(SHARE_STRINGS[lang as ShareLanguage].sentFrom).not.toBe(SHARE_STRINGS.en.sentFrom);
    }
  });

  it('style guide disclaimer exists and is localized', () => {
    expect(SHARE_STRINGS.en.recipeDisclaimer.toLowerCase()).toContain('style guide');
    expect(SHARE_STRINGS.hi.recipeDisclaimer).not.toBe(SHARE_STRINGS.en.recipeDisclaimer);
  });
});

describe('renderSharePreview — structured, never literal asterisks', () => {
  const msg = '*MealDrama*\n\n🛒 *Pantry List*\n  • Rice — 2 cup\n━━━━━━━━━━━━━━━\nSent from MealDrama';

  it('renders markdown into structured lines', () => {
    const lines = renderSharePreview(msg);
    expect(lines.length).toBeGreaterThan(1);
    const first = lines[0];
    expect(first!.text).toBe('MealDrama');
    expect(first!.bold).toBe(true);
  });

  it('bullet lines become sub-lines without the bullet asterisk', () => {
    const lines = renderSharePreview(msg);
    const bullet = lines.find(l => l.sub);
    expect(bullet).toBeDefined();
    expect(bullet!.text).toContain('Rice');
    expect(bullet!.text).not.toContain('*');
  });

  it('long dividers render as separator lines', () => {
    const lines = renderSharePreview(msg);
    expect(lines.some(l => l.icon === '▪')).toBe(true);
  });
});

describe('messageCharCount / WHATSAPP_LIMIT', () => {
  it('counts message length', () => {
    expect(messageCharCount('abc')).toBe(3);
  });

  it('limit is 4096', () => {
    expect(WHATSAPP_LIMIT).toBe(4096);
  });
});

describe('recipeShareForDish — honest style-guide recipe share', () => {
  // Same sample input as the English recipe test above — the ONLY thing
  // that changes for kn/ml is the structural language.
  const recipeSample = {
    name: 'Butter Chicken',
    icon: '🍗',
    region: 'north',
    type: 'non-veg',
    cookingStyle: 'tadka',
    ingredients: [
      { name: 'Chicken', quantity: 250, unit: 'g', category: 'proteins' },
      { name: 'Tomato', quantity: 2, unit: 'pc', category: 'produce' },
    ],
    pairings: { sides: ['Roti', 'Rice'], beverages: ['Buttermilk'] },
  };

  it('builds a recipe with ingredients, pairings, style steps and disclaimer', () => {
    const msg = recipeShareForDish({
      name: 'Butter Chicken',
      icon: '🍗',
      region: 'north',
      type: 'non-veg',
      cookingStyle: 'tadka',
      ingredients: [
        { name: 'Chicken', quantity: 250, unit: 'g', category: 'proteins' },
        { name: 'Tomato', quantity: 2, unit: 'pc', category: 'produce' },
      ],
      pairings: { sides: ['Roti', 'Rice'], beverages: ['Buttermilk'] },
    });
    expect(msg).toContain('Butter Chicken');
    expect(msg).toContain('Chicken — 250g');
    expect(msg).toContain('Roti');
    expect(msg.toLowerCase()).toContain('style guide'); // honest disclaimer
    expect(msg).toContain('Sent from MealDrama');
  });

  it('localizes the recipe to a regional language (native script present)', () => {
    const msg = recipeShareForDish({
      name: 'Palak Paneer',
      region: 'north',
      cookingStyle: 'tadka',
      ingredients: [{ name: 'Palak', quantity: 100, unit: 'g', category: 'produce' }],
    }, 'hi');
    expect(/[\u0900-\u097F]/.test(msg)).toBe(true); // Devanagari in the local output
  });

  it('localizes the recipe to KANNADA — its OWN titles, never the English fallback', () => {
    const msg = recipeShareForDish(recipeSample, 'kn');
    const kn = SHARE_STRINGS.kn;
    const en = SHARE_STRINGS.en;

    // Kannada's own structural titles are present…
    expect(msg).toContain(kn.pantryFor);
    expect(msg).toContain(kn.recipeTitle);
    expect(msg).toContain(kn.sentFrom);
    // …and the English fallback titles are absent.
    expect(msg).not.toContain(en.pantryFor);
    expect(msg).not.toContain(en.recipeTitle);
    expect(msg).not.toContain(en.sentFrom);

    // Dish name + at least one ingredient line pass through as-is.
    expect(msg).toContain('Butter Chicken');
    expect(msg).toContain('Chicken — 250g');

    // Kannada script present; message fits WhatsApp.
    expect(/[\u0C80-\u0CFF]/.test(msg)).toBe(true);
    expect(messageCharCount(msg)).toBeLessThanOrEqual(WHATSAPP_LIMIT);
  });

  it('localizes the recipe to MALAYALAM — its OWN titles, never the English fallback', () => {
    const msg = recipeShareForDish(recipeSample, 'ml');
    const ml = SHARE_STRINGS.ml;
    const en = SHARE_STRINGS.en;

    // Malayalam's own structural titles are present…
    expect(msg).toContain(ml.pantryFor);
    expect(msg).toContain(ml.recipeTitle);
    expect(msg).toContain(ml.sentFrom);
    // …and the English fallback titles are absent.
    expect(msg).not.toContain(en.pantryFor);
    expect(msg).not.toContain(en.recipeTitle);
    expect(msg).not.toContain(en.sentFrom);

    // Dish name + at least one ingredient line pass through as-is.
    expect(msg).toContain('Butter Chicken');
    expect(msg).toContain('Chicken — 250g');

    // Malayalam script present; message fits WhatsApp.
    expect(/[\u0D00-\u0D7F]/.test(msg)).toBe(true);
    expect(messageCharCount(msg)).toBeLessThanOrEqual(WHATSAPP_LIMIT);
  });

  it('returns an empty only-if no ingredients/style (structure still present)', () => {
    const msg = recipeShareForDish({
      name: 'Water',
      ingredients: [],
    });
    expect(msg).toBeTruthy();
    expect(msg).toContain('Water');
  });

  it('STYLE_STEPS covers common cooking styles', () => {
    expect(STYLE_STEPS.tadka).toBeTruthy();
    expect(STYLE_STEPS.dum).toBeTruthy();
    expect(STYLE_STEPS.steamed).toBeTruthy();
    expect(STYLE_STEPS.fried).toBeTruthy();
  });
});
describe('SHARE_STRINGS — leftover-ideas keys (P1)', () => {
  const KEYS = ['leftoverTitle', 'useBy', 'freezeTip', 'leftoverFor', 'left'] as const;

  it('L1: every configured language resolves every new key', () => {
    for (const lang of LANGS) {
      const s = SHARE_STRINGS[lang as ShareLanguage];
      for (const key of KEYS) {
        expect(typeof s[key], `${lang}.${key}`).toBe('string');
        expect((s[key] as string).length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('L1: hi / kn / gu leftover strings are in NATIVE script (not romanized)', () => {
    const hi = SHARE_STRINGS.hi;
    for (const key of KEYS) {
      expect(/[\u0900-\u097F]/.test(hi[key] as string), `hi.${key}`).toBe(true); // Devanagari
    }
    for (const key of KEYS) {
      expect(/[\u0C80-\u0CFF]/.test(SHARE_STRINGS.kn[key] as string), `kn.${key}`).toBe(true); // Kannada
      expect(/[\u0A80-\u0AFF]/.test(SHARE_STRINGS.gu[key] as string), `gu.${key}`).toBe(true); // Gujarati
    }
  });

  it('leftoverTitle differs from English for regional languages', () => {
    for (const lang of LANGS.filter(l => l !== 'en')) {
      expect(SHARE_STRINGS[lang as ShareLanguage].leftoverTitle).not.toBe(SHARE_STRINGS.en.leftoverTitle);
    }
  });
});

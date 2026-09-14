import { describe, it, expect, beforeAll } from 'vitest';
import {
  infraUp, launchPage, onboardWithDiet, crashText, bodyText, openTab,
} from './helpers';

let up: { api: boolean; app: boolean };

beforeAll(async () => {
  up = await infraUp();
  if (!up.api) throw new Error('API not reachable on http://localhost:3001 — start it with `npm run server` first');
  if (!up.app) throw new Error('App not served on http://localhost:3001 — start it with `npm run server`');
}, 20000);

const ANIMAL_TOKENS = /\b(?:Chicken|Mutton|Fish|Prawn|Pork|Egg|Goose|Duck|Meat)\b/i;

describe('E2E — diet integrity at onboarding', () => {
  it('a vegan guest gets a vegan-true dashboard (no animal dish tokens)', async () => {
    const { browser, page } = await launchPage();
    try {
      await onboardWithDiet(page, `vegan-${Date.now()}`, 'South India', 'Vegan');

      const text = await bodyText(page);
      expect(text).toContain('Today');
      expect(await crashText(page)).toBe('');
      expect(text, 'vegan dashboard must not surface animal dishes').not.toMatch(ANIMAL_TOKENS);

      await openTab(page, 'Profile');
      const profile = await bodyText(page);
      expect(profile, 'profile diet chip should read Vegan').toMatch(/Vegan/);
      expect(profile, 'profile must not show the veg chip for a vegan user').not.toMatch(/🥬 Veg/);
    } finally {
      await browser.close();
    }
  }, 90000);
});
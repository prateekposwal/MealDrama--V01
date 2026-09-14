import { describe, it, expect, beforeAll } from 'vitest';
import {
  infraUp, launchPage, startGuestOnboarding, skipToEnd, crashText, bodyText, dismissFirstVisitHint, clickSmart,
} from './helpers';

let up: { api: boolean; app: boolean };

beforeAll(async () => {
  up = await infraUp();
  if (!up.api) throw new Error('API not reachable on http://localhost:3001 — start it with `npm run server` first');
  if (!up.app) throw new Error('App not served on http://localhost:5176 — run `node scripts/run-e2e.mjs` or `vite preview --port 5176` first');
}, 20000);

describe('E2E — swap/customize modal', () => {
  it('opens the Swap customize modal from a meal card and closes it', async () => {
    const { browser, page } = await launchPage();
    try {
      await startGuestOnboarding(page, `guest-${Date.now()}`);
      await skipToEnd(page);

      await dismissFirstVisitHint(page);
      const card = page.locator('[role="article"]').first();
      expect(await card.count()).toBeGreaterThan(0);
      await clickSmart(page, card);
      await page.waitForTimeout(1600);

      // The swap modal renders inside an aria-hidden gate, so innerText hides
      // it — assert presence via the panel + its raw HTML instead.
      const panel = page.locator('div.fixed.inset-0.z-\\[100\\] .relative.bg-white.rounded-t-\\[28px\\]');
      expect(await panel.count(), 'swap/customize modal should be open').toBeGreaterThan(0);
      const html = await page.evaluate(() => document.documentElement.innerHTML);
      expect(html, 'modal should render the style selector').toContain('🍳 Style');

      await page.getByLabel('Close customize').click();
      await page.waitForTimeout(800);
      expect(await panel.count(), 'modal should close').toBe(0);
      expect(await crashText(page)).toBe('');
    } finally {
      await browser.close();
    }
  }, 90000);
});
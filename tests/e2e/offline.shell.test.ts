import { describe, it, expect, beforeAll } from 'vitest';
import {
  infraUp, launchPage, startGuestOnboarding, skipToEnd, crashText, bodyText, openTab,
} from './helpers';

let up: { api: boolean; app: boolean };

beforeAll(async () => {
  up = await infraUp();
  if (!up.api) throw new Error('API not reachable on http://localhost:3001 — start it with `npm run server` first');
  if (!up.app) throw new Error('App not served on http://localhost:3001 — start it with `npm run server`');
}, 20000);

describe('E2E — offline resilience', () => {
  it('the app keeps rendering cleanly when the network vanishes, then recovers', async () => {
    const { browser, page } = await launchPage();
    try {
      await startGuestOnboarding(page, `guest-${Date.now()}`);
      await skipToEnd(page);
      expect(await bodyText(page)).toContain('Today');

      const ctx = browser.contexts()[0];
      if (!ctx) throw new Error('browser context missing');
      await ctx.setOffline(true);
      await page.waitForTimeout(1500);

      // In-session offline: the store already has the plan — tab as normal.
      for (const tab of ['Plan', 'Pantry', 'Home'] as const) {
        await openTab(page, tab);
        expect(await crashText(page), `offline tab ${tab} must not crash`).toBe('');
      }
      const offlineBody = await bodyText(page);
      expect(offlineBody.length, 'offline should still show real content').toBeGreaterThan(50);

      // Recover the network — app must return to a healthy dashboard.
      await ctx.setOffline(false);
      await openTab(page, 'Home');
      expect(await crashText(page), 'after reconnect must not crash').toBe('');
      expect(await bodyText(page)).toContain('Today');
    } finally {
      await browser.close();
    }
  }, 90000);
});
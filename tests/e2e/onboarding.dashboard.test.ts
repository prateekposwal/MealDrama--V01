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

describe('E2E — guest onboarding → Dashboard (crash regression)', () => {
  it('a fresh guest completes onboarding and the Dashboard mounts cleanly (#185 regression)', async () => {
    const { browser, page } = await launchPage();
    try {
      const errs: string[] = [];
      page.on('pageerror', e => errs.push(String(e).slice(0, 160)));

      await startGuestOnboarding(page, `guest-${Date.now()}`);
      await skipToEnd(page);

      const text = await bodyText(page);
      expect(text).toContain('Today');
      await expect(crashText(page), 'Dashboard must not hit the error boundary').resolves.toBe('');
      expect(errs.some(e => e.includes('Maximum update depth') || e.includes('Minified React error')), `pageerrors: ${errs.join(' | ')}`).toBe(false);
    } finally {
      await browser.close();
    }
  }, 90000);

  it('survives a TabBar round-trip without crashing', async () => {
    const { browser, page } = await launchPage();
    try {
      await startGuestOnboarding(page, `guest-${Date.now()}`);
      await skipToEnd(page);

      for (const tab of ['Plan', 'Pantry', 'Profile', 'Home'] as const) {
        await openTab(page, tab);
        expect(await crashText(page), `tab ${tab} must not crash`).toBe('');
      }
      expect(await bodyText(page)).toContain('Today');
    } finally {
      await browser.close();
    }
  }, 90000);
});
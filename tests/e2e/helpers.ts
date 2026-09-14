import { chromium, type Browser, type Page } from 'playwright-core';

// Same-origin: the API server serves the built SPA (express.static dist +
// spaFallback). The app's service worker intercepts /api/* by pathname, so a
// cross-origin preview made every API call 503 and blocked the e2e seed.
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';
export const API_URL = process.env.E2E_API_URL || 'http://localhost:3001';

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function infraUp(): Promise<{ api: boolean; app: boolean }> {
  const probe = async (u: string) => {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
      return r.status === 200;
    } catch {
      return false;
    }
  };
  return { api: await probe(`${API_URL}/health`), app: await probe(BASE_URL) };
}

export async function launchPage(): Promise<{ browser: Browser; page: Page }> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  return { browser, page };
}

export const bodyText = (page: Page) => page.evaluate(() => document.body.innerText || '');

const HINT_IDS = [
  'buy-chip-state', 'buy-sheet-actions', 'dashboard-buy-pill', 'household-no-plan',
  'meal-card-tap', 'pantry-staples', 'personalization-hint', 'plan-autofill',
  'plan-extend', 'plan-slots-filled', 'profile-loop-progress', 'profile-loop-refresh',
  'profile-tray-pool', 'pulse-buy-pill', 'suggestion-reason',
];

/** Seed the hint store's seen-set (md-hint-seen-v1) before the app boots so
 *  first-visit nudges never pop their backdrop over the taps the suite drives. */
async function seedHintsSeen(page: Page): Promise<void> {
  await page.addInitScript((ids) => {
    try { localStorage.setItem('md-hint-seen-v1', JSON.stringify(ids)); } catch { /* ignore */ }
  }, HINT_IDS);
}

/** Guest onboarding. addInitScript runs on every navigation — seeding the
 *  seen-set once is enough for the session. waitUntil 'load', NOT networkidle:
 *  the app keeps a polling/feed request open, so networkidle can hang and
 *  blow the 60s budget on a slow first paint (the documented flake). */
async function primeOrigin(page: Page): Promise<void> {
  await seedHintsSeen(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 60000 });
}

export async function startGuestOnboarding(page: Page, handle: string): Promise<void> {
  await primeOrigin(page);
  await page.waitForTimeout(1000);
  await page.getByText('Continue as guest', { exact: true }).click();
  await sleep(1000);
  await page.locator('input').first().fill(handle);
  await page.getByText('Start Planning', { exact: true }).click();
  await sleep(2000);
}

/** Skip straight to the final step (defaults: North India / veg). */
export async function skipToEnd(page: Page): Promise<void> {
  await page.getByText('Skip to end', { exact: true }).click();
  await sleep(1800);
  await page.getByText('Start Planning', { exact: true }).click();
  await sleep(5500);
  await dismissFirstVisitHint(page);
}

/**
 * The Hint system opens a first-visit tooltip over a full-screen backdrop
 * (z-[90]) that intercepts every tap until dismissed. Fresh profiles hit this
 * on their first dashboard render — dismiss it before interacting. The bubble
 * can render off-viewport, so we dismiss via the backdrop (which closes the
 * live hint) rather than its "Got it" button.
 */
export async function dismissFirstVisitHint(page: Page): Promise<void> {
  const backdrop = page.locator('div[class*="z-[90]"]');
  try {
    if ((await backdrop.count()) > 0) {
      await page.mouse.click(8, 8);
      await sleep(300);
    }
  } catch { /* no live hint */ }
}

/** Drive every onboarding step explicitly (region → diet → health → taste →
 *  start). dietKeys: substrings that uniquely identify the diet option button. */
export async function onboardWithDiet(page: Page, handle: string, regionKey: string, dietKey: string): Promise<void> {
  await startGuestOnboarding(page, handle);
  await page.getByRole('button', { name: new RegExp(regionKey) }).click();
  await page.getByText('Continue', { exact: true }).click();
  await sleep(900);
  await page.getByRole('button', { name: new RegExp(dietKey) }).click();
  await page.getByText('Continue', { exact: true }).click();
  await sleep(900);
  // Health goal: first card, then Continue.
  await page.locator('button[class*="p-5 rounded-2xl"]').first().click();
  await page.getByText('Continue', { exact: true }).click();
  await sleep(900);
  // Taste: first chip, then Continue.
  await page.locator('button[class*="rounded-full"]').first().click();
  await page.getByText('Continue', { exact: true }).click();
  await sleep(900);
  await page.getByText('Start Planning', { exact: true }).click();
  await sleep(6000);
  await dismissFirstVisitHint(page);
}

/** Crash signatures the error boundary renders. */
export async function crashText(page: Page): Promise<string> {
  const t = await bodyText(page);
  if (t.includes('Maximum update depth')) return 'Maximum update depth exceeded';
  if (t.includes('Something went wrong')) return 'ErrorBoundary "Something went wrong"';
  if (t.includes('Minified React error #185')) return 'React #185 (max update depth)';
  return '';
}

export async function openTab(page: Page, label: 'Home' | 'Plan' | 'Pantry' | 'Profile'): Promise<void> {
  // Scope to the footer nav — a bare getByRole('button', { name: 'Plan' })
  // also matches dashboard CTAs and opened a modal during the round-trip.
  await dismissFirstVisitHint(page);
  await clickSmart(page, page.locator('nav[aria-label="Main navigation"]').getByRole('button', { name: label }));
  await sleep(2000);
}

/** Click, and if a live hint backdrop intercepts the tap, dismiss it and
 *  retry (tap-trigger hints sit between the user and the tap, and hints can
 *  auto-reopen on reconnect). Loop until the click lands. */
export async function clickSmart(page: Page, loc: import('playwright-core').Locator): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await loc.click({ timeout: 6000 });
      return;
    } catch {
      await dismissFirstVisitHint(page);
      await sleep(400);
    }
  }
  await loc.click({ timeout: 6000 });
}
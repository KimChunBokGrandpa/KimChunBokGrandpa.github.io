import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('retro-pixel-locale', 'en');
    localStorage.setItem('retropixel_onboarding_dismissed', '1');
  });
});

test('offline revisit loads cached app shell after service worker activation', async ({ page, context }) => {
  await page.goto('/');

  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('service worker unavailable');
    }
    await navigator.serviceWorker.ready;
  });

  await page.reload();
  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('[role="dialog"][aria-label*="Settings"]').first()).toBeVisible();
  await expect(page.locator('[role="dialog"][aria-label*="Preview"]').first()).toBeVisible();

  await context.setOffline(false);
});

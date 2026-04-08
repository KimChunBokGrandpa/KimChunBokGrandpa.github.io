import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('retro-pixel-locale', 'en');
    localStorage.setItem('retropixel_onboarding_dismissed', '1');
  });
});

test('core user flow: sample image, adjust palette, compare, and save', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('try-sample-button').click();

  const previewImage = page.getByTestId('processed-preview-image');
  await expect(previewImage).toBeVisible();

  await page.getByTestId('quick-palette-nes').click();
  await expect(previewImage).toBeVisible();

  await page.getByTestId('toggle-compare-button').click();
  await expect(page.getByTestId('cycle-compare-variant-button')).toBeVisible();

  await page.getByTestId('toggle-compare-button').click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('save-image-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^retro_pixel_.*\.(png|jpg|webp)$/);
});

test.describe('mobile layout', () => {
  test.use({
    viewport: { width: 540, height: 320 },
    isMobile: true,
    hasTouch: true,
  });

  test('applies split layout for settings and preview in landscape mobile', async ({ page }) => {
    await page.goto('/');

    const dialogs = page.locator('[role="dialog"]');
    await expect(dialogs).toHaveCount(2);

    const settingsWindow = page.locator('[role="dialog"][aria-label*="Settings"]').first();
    const previewWindow = page.locator('[role="dialog"][aria-label*="Preview"]').first();

    await expect(settingsWindow).toBeVisible();
    await expect(previewWindow).toBeVisible();
    await expect(settingsWindow).toHaveAttribute('style', /--mobile-w:\s*38vw/);
    await expect(previewWindow).toHaveAttribute('style', /--mobile-l:\s*38vw/);
    await expect(previewWindow).toHaveAttribute('style', /--mobile-w:\s*62vw/);
  });
});
